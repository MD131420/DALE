import { randomBytes } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { open, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp, { type Metadata } from 'sharp'
import type { Db } from './db.ts'

export const LANGS = ['en', 'pl', 'de'] as const
export type Loc = Record<(typeof LANGS)[number], string>
/** Gallery entries are images or MP4 videos; `autoplay` (videos only) = muted loop without controls. */
export type GalleryItem = { id: string; caption: Loc; autoplay?: boolean }
export type MediaKind = 'image' | 'video'
export type ProjectData = {
  title: Loc
  summary: Loc
  body: Loc
  category: Loc
  client: string
  year: string
  cover: string | null
  gallery: GalleryItem[]
}
export type ProjectRow = {
  id: number
  slug: string
  data: string
  published: number
  position: number
  created_at: number
  updated_at: number
}

export const MEDIA_ID = /^[a-f0-9]{32}$/
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MEDIA_SIZES = { xl: 2400, md: 1200, sm: 640 } as const

export class InputError extends Error {}

// Plain text only — no HTML or markdown is ever rendered, so stored text cannot inject markup.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g
function text(value: unknown, max: number, field: string, multiline = false) {
  if (value == null) return ''
  if (typeof value !== 'string') throw new InputError(`Pole „${field}” ma zły format.`)
  let v = value.replace(/\r\n?/g, '\n').replace(CONTROL, '')
  v = multiline ? v.replace(/\n{3,}/g, '\n\n').trim() : v.replace(/\s+/g, ' ').trim()
  if (v.length > max) throw new InputError(`Pole „${field}” może mieć najwyżej ${max} znaków.`)
  return v
}

function loc(value: unknown, max: number, field: string, multiline = false): Loc {
  const src = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    en: text(src.en, max, `${field} (EN)`, multiline),
    pl: text(src.pl, max, `${field} (PL)`, multiline),
    de: text(src.de, max, `${field} (DE)`, multiline),
  }
}

function mediaRef(db: Db, value: unknown) {
  if (typeof value !== 'string' || !MEDIA_ID.test(value)) throw new InputError('Nieprawidłowy plik w galerii.')
  const row = db.prepare('SELECT kind FROM media WHERE id = ?').get(value) as { kind: MediaKind } | undefined
  if (!row) throw new InputError('Plik nie istnieje — wgraj go ponownie.')
  return { id: value, kind: row.kind }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')
}

/** Validates and normalises a project sent by the admin panel. Throws InputError with a Polish message. */
export function parseProject(db: Db, input: unknown) {
  if (!input || typeof input !== 'object') throw new InputError('Brak danych projektu.')
  const src = input as Record<string, unknown>
  const title = loc(src.title, 140, 'Tytuł')
  if (!title.en && !title.pl && !title.de) throw new InputError('Podaj tytuł projektu (w co najmniej jednym języku).')

  const slug = slugify(text(src.slug, 80, 'Adres')) || slugify(title.en || title.pl || title.de)
  if (!SLUG.test(slug)) throw new InputError('Adres może zawierać tylko małe litery, cyfry i myślniki (np. robot-spawalniczy).')

  const galleryIn = Array.isArray(src.gallery) ? src.gallery : []
  if (galleryIn.length > 40) throw new InputError('Galeria może mieć najwyżej 40 elementów.')
  const gallery = galleryIn.map((g): GalleryItem => {
    const item = (g && typeof g === 'object' ? g : {}) as Record<string, unknown>
    const ref = mediaRef(db, item.id)
    const caption = loc(item.caption, 200, 'Podpis')
    return ref.kind === 'video' ? { id: ref.id, caption, autoplay: item.autoplay === true } : { id: ref.id, caption }
  })
  if (gallery.filter((g) => 'autoplay' in g).length > 10) throw new InputError('Projekt może mieć najwyżej 10 filmów.')
  let cover: string | null = null
  if (src.cover != null && src.cover !== '') {
    const ref = mediaRef(db, src.cover)
    if (ref.kind !== 'image') throw new InputError('Okładką musi być zdjęcie.')
    cover = ref.id
  }

  const data: ProjectData = {
    title,
    summary: loc(src.summary, 400, 'Krótki opis', true),
    body: loc(src.body, 8000, 'Opis', true),
    category: loc(src.category, 80, 'Kategoria'),
    client: text(src.client, 120, 'Klient'),
    year: text(src.year, 20, 'Rok'),
    cover,
    gallery,
  }
  return { slug, data, published: src.published === true }
}

export function serialize(db: Db, row: ProjectRow, admin = false) {
  const data = JSON.parse(row.data) as ProjectData
  const media = [data.cover, ...data.gallery.map((g) => g.id)].filter(Boolean) as string[]
  return {
    id: row.id,
    slug: row.slug,
    ...data,
    ...(admin ? { published: row.published === 1, position: row.position, createdAt: row.created_at, updatedAt: row.updated_at } : {}),
    media: mediaInfo(db, media),
  }
}

// Dimensions let the site reserve space before images and videos load.
function mediaInfo(db: Db, ids: string[]) {
  const out: Record<string, { w: number; h: number; kind: MediaKind; poster?: string }> = {}
  const stmt = db.prepare('SELECT width, height, kind, poster FROM media WHERE id = ?')
  for (const id of ids) {
    const m = stmt.get(id) as { width: number; height: number; kind: MediaKind; poster: string | null } | undefined
    if (m) out[id] = { w: m.width, h: m.height, kind: m.kind, ...(m.poster ? { poster: m.poster } : {}) }
  }
  return out
}

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif'])

/**
 * Decodes the upload with libvips and re-encodes it to WebP in three sizes.
 * The original file is never stored or served, so polyglot files, scripts disguised as images,
 * EXIF/GPS metadata and colour-profile tricks are all dropped.
 */
export async function storeImage(db: Db, dataDir: string, buf: Buffer, originalName: string) {
  let meta: Metadata
  try {
    meta = await sharp(buf, { limitInputPixels: 80_000_000 }).metadata()
  } catch {
    throw new InputError('Tego pliku nie da się odczytać jako zdjęcia.')
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format))
    throw new InputError('Dozwolone formaty: JPG, PNG, WebP, AVIF, TIFF, GIF.')

  const id = randomBytes(16).toString('hex')
  const dir = path.join(dataDir, 'media')
  let width = 0
  let height = 0
  try {
    for (const [size, px] of Object.entries(MEDIA_SIZES)) {
      const { data, info } = await sharp(buf, { limitInputPixels: 80_000_000, failOn: 'error' })
        .rotate()
        .resize({ width: px, height: px, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: size === 'sm' ? 78 : 84 })
        .toBuffer({ resolveWithObject: true })
      await writeFile(path.join(dir, `${id}-${size}.webp`), data, { flag: 'wx' })
      if (size === 'xl') {
        width = info.width
        height = info.height
      }
    }
  } catch {
    await removeMediaFiles(dataDir, id)
    throw new InputError('Nie udało się przetworzyć zdjęcia. Spróbuj zapisać je jako JPG lub PNG.')
  }
  const name = originalName.replace(CONTROL, '').slice(0, 200)
  db.prepare('INSERT INTO media (id, width, height, original_name, created_at) VALUES (?, ?, ?, ?, ?)').run(id, width, height, name, Date.now())
  return { id, w: width, h: height }
}

async function removeMediaFiles(dataDir: string, id: string) {
  const files = [...Object.keys(MEDIA_SIZES).map((s) => `${id}-${s}.webp`), `${id}.mp4`]
  await Promise.all(files.map((f) => rm(path.join(dataDir, 'media', f), { force: true })))
}

export const MAX_VIDEO_MB = 300
// ISO base media brands of MP4 files from cameras, phones and editors (QuickTime .mov is not accepted).
const MP4_BRANDS = new Set(['isom', 'iso2', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'M4V ', 'MSNV', 'dash', 'mmp4', 'f4v '])

/**
 * Streams an MP4 upload to disk (never held in memory), with a hard size limit,
 * then checks the file really is MP4 (ftyp box) before it is published under a random name.
 * Videos are served only as video/mp4 with nosniff, so a disguised file cannot run as a page or script.
 */
export async function storeVideo(
  db: Db,
  dataDir: string,
  body: ReadableStream<Uint8Array> | null,
  meta: { name: string; width: number; height: number; poster: string | null },
) {
  if (!body) throw new InputError('Nie wybrano pliku.')
  const id = randomBytes(16).toString('hex')
  const dir = path.join(dataDir, 'media')
  const part = path.join(dir, `${id}.part`)
  const limit = MAX_VIDEO_MB * 1024 * 1024
  let size = 0
  try {
    const out = createWriteStream(part, { flags: 'wx' })
    const done = new Promise<void>((resolve, reject) => {
      out.on('finish', resolve)
      out.on('error', reject)
    })
    try {
      for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
        size += chunk.byteLength
        if (size > limit) throw new InputError(`Film jest za duży (maks. ${MAX_VIDEO_MB} MB).`)
        if (!out.write(chunk)) await new Promise<void>((r) => out.once('drain', () => r()))
      }
    } finally {
      out.end()
      await done
    }
    if (size < 1024) throw new InputError('Plik filmu jest pusty lub uszkodzony.')

    const fh = await open(part, 'r')
    const head = Buffer.alloc(12)
    await fh.read(head, 0, 12, 0)
    await fh.close()
    if (head.toString('latin1', 4, 8) !== 'ftyp' || !MP4_BRANDS.has(head.toString('latin1', 8, 12)))
      throw new InputError('To nie jest plik MP4. Wyeksportuj film jako MP4 (H.264).')
    await rename(part, path.join(dir, `${id}.mp4`))
  } catch (e) {
    await rm(part, { force: true })
    throw e
  }

  let poster: string | null = null
  if (meta.poster && MEDIA_ID.test(meta.poster)) {
    const row = db.prepare('SELECT kind FROM media WHERE id = ?').get(meta.poster) as { kind: MediaKind } | undefined
    if (row?.kind === 'image') poster = meta.poster
  }
  const clampPx = (n: number, fallback: number) => (Number.isInteger(n) && n > 0 && n <= 8192 ? n : fallback)
  const w = clampPx(meta.width, 1920)
  const h = clampPx(meta.height, 1080)
  db.prepare('INSERT INTO media (id, width, height, original_name, created_at, kind, poster, size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id,
    w,
    h,
    meta.name.replace(CONTROL, '').slice(0, 200),
    Date.now(),
    'video',
    poster,
    size,
  )
  return { id, w, h, kind: 'video' as const, ...(poster ? { poster } : {}) }
}

/** Deletes images and videos no project uses any more (uploads older than an hour, so an open editor keeps its fresh uploads). */
export async function collectGarbage(db: Db, dataDir: string) {
  const used = new Set<string>()
  for (const row of db.prepare('SELECT data FROM projects').all() as { data: string }[]) {
    const d = JSON.parse(row.data) as ProjectData
    if (d.cover) used.add(d.cover)
    d.gallery.forEach((g) => used.add(g.id))
  }
  // A video keeps its poster frame.
  for (const v of db.prepare("SELECT poster FROM media WHERE kind = 'video' AND poster IS NOT NULL").all() as { poster: string }[]) used.add(v.poster)
  const cutoff = Date.now() - 60 * 60 * 1000
  const stale = (db.prepare('SELECT id FROM media WHERE created_at < ?').all(cutoff) as { id: string }[]).filter((m) => !used.has(m.id))
  for (const { id } of stale) {
    db.prepare('DELETE FROM media WHERE id = ?').run(id)
    await removeMediaFiles(dataDir, id)
  }
  // Files on disk without a database row (e.g. after a crash mid-upload).
  const known = new Set((db.prepare('SELECT id FROM media').all() as { id: string }[]).map((m) => m.id))
  for (const file of await readdir(path.join(dataDir, 'media'))) {
    const id = file.slice(0, 32)
    if (!MEDIA_ID.test(id) || known.has(id)) continue
    const full = path.join(dataDir, 'media', file)
    if ((await stat(full)).mtimeMs < cutoff) await rm(full, { force: true })
  }
}

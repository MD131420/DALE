import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import path from 'node:path'
import { getConnInfo } from '@hono/node-server/conninfo'
import { Hono, type Context, type Next } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { audit, openDb } from './db.ts'
import {
  collectGarbage,
  InputError,
  MAX_VIDEO_MB,
  parseProject,
  serialize,
  storeImage,
  storeVideo,
  type ProjectRow,
} from './projects.ts'
import { getDummyHash, hashPassword, newToken, passwordProblem, safeEqual, sha256, Throttle, verifyPassword } from './security.ts'

export type AppOptions = {
  dataDir: string
  /** Built site (dist/) — served only in production. */
  distDir?: string
  /** Production: Content-Security-Policy, Secure cookies and HSTS. */
  production?: boolean
  /** Defaults to `production`. Off only to try the production build over plain http on localhost. */
  secureCookies?: boolean
  /** Behind a reverse proxy (nginx, Caddy…): take the client IP / host from X-Forwarded-* headers. */
  trustProxy?: boolean
  /** Extra allowed origins for admin requests, e.g. https://dale.com */
  origins?: string[]
}

type User = { id: number; username: string }
type Session = { token_hash: string; csrf: string; created_at: number; last_seen: number }
type Env = { Variables: { user: User; session: Session } }

const COOKIE = 'dale_session'
const COOKIE_PATH = '/api/admin'
const IDLE_MS = 2 * 60 * 60 * 1000 // logged out after 2 h without activity
const ABSOLUTE_MS = 12 * 60 * 60 * 1000 // and after 12 h in any case
const MAX_UPLOAD = 25 * 1024 * 1024

export function createApp(opts: AppOptions) {
  const db = openDb(opts.dataDir)
  const production = !!opts.production
  const secure = opts.secureCookies ?? production
  const app = new Hono<Env>()

  const perIp = new Throttle(10, 15 * 60_000, 15 * 60_000, 60 * 60_000)
  const perUser = new Throttle(5, 15 * 60_000, 60_000, 30 * 60_000)

  const clientIp = (c: Context) => {
    if (opts.trustProxy) {
      const fwd = c.req.header('x-forwarded-for')?.split(',').map((s) => s.trim()).filter(Boolean)
      if (fwd?.length) return fwd[fwd.length - 1] // the hop our own proxy added
    }
    try {
      return getConnInfo(c).remote.address ?? 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /** Blocks cross-site requests (CSRF): the Origin must be this site. */
  const sameOrigin = (c: Context) => {
    const origin = c.req.header('origin')
    if (!origin) return false
    if (opts.origins?.includes(origin)) return true
    const host = (opts.trustProxy && c.req.header('x-forwarded-host')) || c.req.header('host')
    try {
      return new URL(origin).host === host
    } catch {
      return false
    }
  }

  const fail = (c: Context, status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 429, error: string) => c.json({ error }, status)

  // ───────── Security headers (every response) ─────────
  app.use('*', async (c, next) => {
    await next()
    const h = c.res.headers
    h.set('X-Content-Type-Options', 'nosniff')
    h.set('X-Frame-Options', 'DENY')
    h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    h.set('Cross-Origin-Opener-Policy', 'same-origin')
    h.set('Cross-Origin-Resource-Policy', 'same-origin')
    h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
    if (secure) h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    if (production) {
      h.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
      )
    }
    const p = c.req.path
    if (p.startsWith('/api/')) h.set('X-Robots-Tag', 'noindex')
    if (p.startsWith('/api/admin')) h.set('Cache-Control', 'no-store')
  })

  // ───────── Public API ─────────
  app.get('/api/projects', (c) => {
    const rows = db.prepare('SELECT * FROM projects WHERE published = 1 ORDER BY position, id').all() as ProjectRow[]
    c.header('Cache-Control', 'no-cache')
    return c.json(rows.map((r) => serialize(db, r)))
  })

  app.get('/api/projects/:slug', (c) => {
    const row = db.prepare('SELECT * FROM projects WHERE slug = ? AND published = 1').get(c.req.param('slug')) as ProjectRow | undefined
    if (!row) return fail(c, 404, 'Not found')
    c.header('Cache-Control', 'no-cache')
    return c.json(serialize(db, row))
  })

  // Videos: /media/<32 hex>.mp4 with byte ranges (needed for seeking and by Safari).
  app.get('/media/:file{[a-f0-9]{32}\\.mp4}', async (c) => {
    const file = path.join(opts.dataDir, 'media', c.req.param('file'))
    const info = await stat(file).catch(() => null)
    if (!info?.isFile()) return c.notFound()
    const headers: Record<string, string> = {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline',
    }
    const range = /^bytes=(\d*)-(\d*)$/.exec(c.req.header('range') ?? '')
    let start = 0
    let end = info.size - 1
    let status: 200 | 206 = 200
    if (range && (range[1] || range[2])) {
      if (range[1]) {
        start = Number(range[1])
        if (range[2]) end = Math.min(Number(range[2]), end)
      } else start = Math.max(0, info.size - Number(range[2]))
      if (start > end || start >= info.size) return c.body(null, 416, { 'Content-Range': `bytes */${info.size}` })
      status = 206
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`
    }
    headers['Content-Length'] = String(end - start + 1)
    if (c.req.method === 'HEAD') return c.body(null, status, headers)
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream
    return c.body(stream, status, headers)
  })

  // Processed images: /media/<32 hex>-<xl|md|sm>.webp — names are validated, so no path traversal.
  app.get('/media/:file', async (c) => {
    const m = /^([a-f0-9]{32})-(xl|md|sm)\.webp$/.exec(c.req.param('file'))
    if (!m) return c.notFound()
    try {
      const buf = await readFile(path.join(opts.dataDir, 'media', `${m[1]}-${m[2]}.webp`))
      return c.body(buf, 200, { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' })
    } catch {
      return c.notFound()
    }
  })

  // ───────── Admin: login ─────────
  app.post('/api/admin/login', bodyLimit({ maxSize: 4096, onError: (c) => fail(c, 413, 'Za duże zapytanie.') }), async (c) => {
    if (!sameOrigin(c)) return fail(c, 403, 'Niedozwolone źródło zapytania.')
    const ip = clientIp(c)
    const body = (await c.req.json().catch(() => null)) as { username?: unknown; password?: unknown } | null
    const username = typeof body?.username === 'string' ? body.username.trim().slice(0, 64) : ''
    const password = typeof body?.password === 'string' ? body.password.slice(0, 200) : ''
    if (!username || !password) return fail(c, 400, 'Podaj login i hasło.')

    const userKey = username.toLowerCase()
    const wait = Math.max(perIp.retryIn(ip), perUser.retryIn(userKey))
    if (wait > 0) {
      audit(db, 'login_blocked', { detail: username, ip })
      return fail(c, 429, `Za dużo nieudanych prób. Spróbuj ponownie za ${Math.ceil(wait / 60_000)} min.`)
    }

    const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username) as
      | (User & { password_hash: string })
      | undefined
    const ok = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()))
    if (!user || !ok) {
      perIp.fail(ip)
      perUser.fail(userKey)
      audit(db, 'login_failed', { detail: username, ip })
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400))
      return fail(c, 401, 'Nieprawidłowy login lub hasło.')
    }

    perIp.success(ip)
    perUser.success(userKey)
    const now = Date.now()
    db.prepare('DELETE FROM sessions WHERE last_seen < ? OR created_at < ?').run(now - IDLE_MS, now - ABSOLUTE_MS)
    const token = newToken()
    const csrf = newToken()
    db.prepare('INSERT INTO sessions (token_hash, user_id, csrf, created_at, last_seen, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      sha256(token),
      user.id,
      csrf,
      now,
      now,
      ip,
      (c.req.header('user-agent') ?? '').slice(0, 200),
    )
    setCookie(c, COOKIE, token, { httpOnly: true, secure, sameSite: 'Strict', path: COOKIE_PATH, maxAge: ABSOLUTE_MS / 1000 })
    audit(db, 'login', { userId: user.id, ip })
    return c.json({ user: { username: user.username }, csrf })
  })

  // ───────── Admin: session guard for everything below ─────────
  const requireSession = async (c: Context<Env>, next: Next) => {
    const token = getCookie(c, COOKIE)
    if (!token) return fail(c, 401, 'Zaloguj się.')
    const now = Date.now()
    const row = db
      .prepare(
        `SELECT s.token_hash, s.csrf, s.created_at, s.last_seen, u.id, u.username
         FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
      )
      .get(sha256(token)) as (Session & User) | undefined
    if (!row || now - row.last_seen > IDLE_MS || now - row.created_at > ABSOLUTE_MS) {
      if (row) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash)
      deleteCookie(c, COOKIE, { path: COOKIE_PATH })
      return fail(c, 401, 'Sesja wygasła — zaloguj się ponownie.')
    }
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      if (!sameOrigin(c)) return fail(c, 403, 'Niedozwolone źródło zapytania.')
      if (!safeEqual(c.req.header('x-csrf-token') ?? '', row.csrf)) return fail(c, 403, 'Nieprawidłowy token bezpieczeństwa — odśwież stronę.')
    }
    if (now - row.last_seen > 60_000) db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').run(now, row.token_hash)
    c.set('user', { id: row.id, username: row.username })
    c.set('session', row)
    await next()
  }
  app.use('/api/admin/*', async (c, next) => (c.req.path === '/api/admin/login' ? next() : requireSession(c, next)))

  app.get('/api/admin/me', (c) => c.json({ user: { username: c.get('user').username }, csrf: c.get('session').csrf }))

  app.post('/api/admin/logout', (c) => {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(c.get('session').token_hash)
    deleteCookie(c, COOKIE, { path: COOKIE_PATH })
    audit(db, 'logout', { userId: c.get('user').id, ip: clientIp(c) })
    return c.json({ ok: true })
  })

  // ───────── Admin: account ─────────
  app.get('/api/admin/account', (c) => {
    const user = c.get('user')
    const sessions = db
      .prepare('SELECT token_hash, created_at, last_seen, ip, user_agent FROM sessions WHERE user_id = ? ORDER BY last_seen DESC')
      .all(user.id) as (Session & { ip: string; user_agent: string })[]
    const log = db.prepare('SELECT at, event, detail, ip FROM audit ORDER BY id DESC LIMIT 40').all()
    return c.json({
      username: user.username,
      sessions: sessions.map((s) => ({
        current: s.token_hash === c.get('session').token_hash,
        createdAt: s.created_at,
        lastSeen: s.last_seen,
        ip: s.ip,
        userAgent: s.user_agent,
      })),
      log,
    })
  })

  app.post('/api/admin/password', bodyLimit({ maxSize: 4096 }), async (c) => {
    const user = c.get('user')
    const ip = clientIp(c)
    const body = (await c.req.json().catch(() => null)) as { current?: unknown; next?: unknown } | null
    const current = typeof body?.current === 'string' ? body.current : ''
    const next = typeof body?.next === 'string' ? body.next : ''
    if (perUser.retryIn(`pw:${user.id}`) > 0) return fail(c, 429, 'Za dużo prób. Odczekaj chwilę.')
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string }
    if (!(await verifyPassword(current, row.password_hash))) {
      perUser.fail(`pw:${user.id}`)
      audit(db, 'password_change_failed', { userId: user.id, ip })
      return fail(c, 400, 'Obecne hasło jest nieprawidłowe.')
    }
    const problem = passwordProblem(next, user.username)
    if (problem) return fail(c, 400, problem)
    db.prepare('UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?').run(await hashPassword(next), Date.now(), user.id)
    // Every other device is signed out.
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(user.id, c.get('session').token_hash)
    audit(db, 'password_changed', { userId: user.id, ip })
    return c.json({ ok: true })
  })

  app.post('/api/admin/sessions/revoke-others', (c) => {
    const user = c.get('user')
    const res = db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(user.id, c.get('session').token_hash)
    audit(db, 'sessions_revoked', { userId: user.id, detail: String(res.changes), ip: clientIp(c) })
    return c.json({ ok: true, revoked: res.changes })
  })

  // ───────── Admin: projects ─────────
  const getRow = (id: string) => db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(id)) as ProjectRow | undefined
  const slugTaken = (slug: string, exceptId = 0) => !!db.prepare('SELECT 1 FROM projects WHERE slug = ? AND id != ?').get(slug, exceptId)

  app.get('/api/admin/projects', (c) => {
    const rows = db.prepare('SELECT * FROM projects ORDER BY position, id').all() as ProjectRow[]
    return c.json(rows.map((r) => serialize(db, r, true)))
  })

  app.get('/api/admin/projects/:id', (c) => {
    const row = getRow(c.req.param('id'))
    return row ? c.json(serialize(db, row, true)) : fail(c, 404, 'Nie ma takiego projektu.')
  })

  // Draft preview on the public page (/projects/<slug>?preview).
  app.get('/api/admin/preview/:slug', (c) => {
    const row = db.prepare('SELECT * FROM projects WHERE slug = ?').get(c.req.param('slug')) as ProjectRow | undefined
    return row ? c.json(serialize(db, row)) : fail(c, 404, 'Nie ma takiego projektu.')
  })

  const jsonLimit = bodyLimit({ maxSize: 256 * 1024, onError: (c) => fail(c, 413, 'Za dużo tekstu w projekcie.') })

  app.post('/api/admin/projects', jsonLimit, async (c) => {
    try {
      const p = parseProject(db, await c.req.json())
      if (slugTaken(p.slug)) return fail(c, 409, `Adres „${p.slug}” jest już zajęty przez inny projekt.`)
      const now = Date.now()
      const { max } = db.prepare('SELECT COALESCE(MAX(position), -1) AS max FROM projects').get() as { max: number }
      const res = db
        .prepare('INSERT INTO projects (slug, data, published, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(p.slug, JSON.stringify(p.data), p.published ? 1 : 0, max + 1, now, now)
      audit(db, 'project_created', { userId: c.get('user').id, detail: p.slug, ip: clientIp(c) })
      return c.json(serialize(db, getRow(String(res.lastInsertRowid))!, true), 201)
    } catch (e) {
      if (e instanceof InputError || e instanceof SyntaxError) return fail(c, 400, e instanceof InputError ? e.message : 'Nieprawidłowe dane.')
      throw e
    }
  })

  app.put('/api/admin/projects/:id', jsonLimit, async (c) => {
    const row = getRow(c.req.param('id'))
    if (!row) return fail(c, 404, 'Nie ma takiego projektu.')
    try {
      const body = await c.req.json()
      // Optimistic locking: refuse to overwrite changes made in another tab or by another person.
      if (body?.updatedAt !== row.updated_at)
        return fail(c, 409, 'Ten projekt został zmieniony w innym oknie. Odśwież stronę, żeby nie nadpisać tych zmian.')
      const p = parseProject(db, body)
      if (slugTaken(p.slug, row.id)) return fail(c, 409, `Adres „${p.slug}” jest już zajęty przez inny projekt.`)
      db.prepare('UPDATE projects SET slug = ?, data = ?, published = ?, updated_at = ? WHERE id = ?').run(
        p.slug,
        JSON.stringify(p.data),
        p.published ? 1 : 0,
        Math.max(Date.now(), row.updated_at + 1),
        row.id,
      )
      audit(db, 'project_updated', { userId: c.get('user').id, detail: p.slug, ip: clientIp(c) })
      collectGarbage(db, opts.dataDir).catch(() => {})
      return c.json(serialize(db, getRow(String(row.id))!, true))
    } catch (e) {
      if (e instanceof InputError || e instanceof SyntaxError) return fail(c, 400, e instanceof InputError ? e.message : 'Nieprawidłowe dane.')
      throw e
    }
  })

  app.delete('/api/admin/projects/:id', (c) => {
    const row = getRow(c.req.param('id'))
    if (!row) return fail(c, 404, 'Nie ma takiego projektu.')
    db.prepare('DELETE FROM projects WHERE id = ?').run(row.id)
    audit(db, 'project_deleted', { userId: c.get('user').id, detail: row.slug, ip: clientIp(c) })
    collectGarbage(db, opts.dataDir).catch(() => {})
    return c.json({ ok: true })
  })

  app.post('/api/admin/projects/order', bodyLimit({ maxSize: 64 * 1024 }), async (c) => {
    const body = (await c.req.json().catch(() => null)) as { ids?: unknown } | null
    const ids = Array.isArray(body?.ids) ? body.ids.filter((n): n is number => Number.isInteger(n)) : []
    const stmt = db.prepare('UPDATE projects SET position = ? WHERE id = ?')
    db.exec('BEGIN')
    try {
      ids.forEach((id, i) => stmt.run(i, id))
      db.exec('COMMIT')
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
    audit(db, 'projects_reordered', { userId: c.get('user').id, ip: clientIp(c) })
    return c.json({ ok: true })
  })

  // ───────── Admin: image upload ─────────
  app.post(
    '/api/admin/media',
    bodyLimit({ maxSize: MAX_UPLOAD, onError: (c) => fail(c, 413, 'Plik jest za duży (maks. 25 MB).') }),
    async (c) => {
      const form = await c.req.parseBody().catch(() => null)
      const file = form?.file
      if (!(file instanceof File)) return fail(c, 400, 'Nie wybrano pliku.')
      try {
        const media = await storeImage(db, opts.dataDir, Buffer.from(await file.arrayBuffer()), file.name)
        audit(db, 'media_uploaded', { userId: c.get('user').id, detail: file.name, ip: clientIp(c) })
        return c.json(media, 201)
      } catch (e) {
        if (e instanceof InputError) return fail(c, 415, e.message)
        throw e
      }
    },
  )

  // MP4 upload: the raw file is the request body (streamed to disk, not buffered).
  app.post('/api/admin/video', async (c) => {
    const type = c.req.header('content-type') ?? ''
    if (type !== 'video/mp4') return fail(c, 415, 'Dozwolone są tylko filmy MP4.')
    const declared = Number(c.req.header('content-length') ?? 0)
    if (declared > MAX_VIDEO_MB * 1024 * 1024) return fail(c, 413, `Film jest za duży (maks. ${MAX_VIDEO_MB} MB).`)
    let name = ''
    try {
      name = decodeURIComponent(c.req.header('x-file-name') ?? '')
    } catch {
      /* keep empty */
    }
    try {
      const media = await storeVideo(db, opts.dataDir, c.req.raw.body, {
        name,
        width: Number(c.req.header('x-video-width')),
        height: Number(c.req.header('x-video-height')),
        poster: c.req.header('x-video-poster') ?? null,
      })
      audit(db, 'video_uploaded', { userId: c.get('user').id, detail: name, ip: clientIp(c) })
      return c.json(media, 201)
    } catch (e) {
      if (e instanceof InputError) return fail(c, e.message.includes('za duży') ? 413 : 415, e.message)
      throw e
    }
  })

  app.all('/api/*', (c) => fail(c, 404, 'Not found'))

  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'Błąd serwera. Spróbuj ponownie.' }, 500)
  })

  // ───────── Production: the built site (SPA fallback to index.html) ─────────
  if (opts.distDir) {
    const dist = path.resolve(opts.distDir)
    const TYPES: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.ico': 'image/x-icon',
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
      '.json': 'application/json',
      '.txt': 'text/plain; charset=utf-8',
    }
    app.get('*', async (c) => {
      let rel: string
      try {
        rel = decodeURIComponent(c.req.path)
      } catch {
        return c.notFound()
      }
      const file = path.resolve(dist, '.' + rel)
      if (file.startsWith(dist + path.sep)) {
        const s = await stat(file).catch(() => null)
        if (s?.isFile()) {
          const ext = path.extname(file).toLowerCase()
          return c.body(await readFile(file), 200, {
            'Content-Type': TYPES[ext] ?? 'application/octet-stream',
            'Cache-Control': rel.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
          })
        }
      }
      if (path.extname(rel)) return c.notFound()
      c.header('Cache-Control', 'no-cache')
      if (rel.startsWith('/admin')) c.header('X-Robots-Tag', 'noindex, nofollow')
      return c.html(await readFile(path.join(dist, 'index.html'), 'utf8'))
    })
  }

  // Clean up unused uploads on start and every 6 hours.
  collectGarbage(db, opts.dataDir).catch(() => {})
  setInterval(() => collectGarbage(db, opts.dataDir).catch(() => {}), 6 * 60 * 60 * 1000).unref()

  return { app, db }
}

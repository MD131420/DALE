import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { Lang } from '../i18n'
import { mediaUrl, videoUrl, type GalleryItem, type MediaInfo } from '../projects/api'
import {
  adminTitle,
  api,
  ApiError,
  emptyLoc,
  formatDate,
  LANG_TABS,
  isVideoFile,
  MAX_VIDEO_MB,
  uploadImage,
  uploadVideo,
  type AdminProject,
  type Loc,
  type Media,
} from './api'

type Form = {
  slug: string
  title: Loc
  summary: Loc
  body: Loc
  category: Loc
  client: string
  year: string
  cover: string | null
  gallery: GalleryItem[]
  published: boolean
}
type LocKey = 'title' | 'summary' | 'body' | 'category'

const blank = (): Form => ({
  slug: '',
  title: emptyLoc(),
  summary: emptyLoc(),
  body: emptyLoc(),
  category: emptyLoc(),
  client: '',
  year: String(new Date().getFullYear()),
  cover: null,
  gallery: [],
  published: false,
})

const toForm = (p: AdminProject): Form => ({
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  body: p.body,
  category: p.category,
  client: p.client,
  year: p.year,
  cover: p.cover,
  gallery: p.gallery,
  published: p.published,
})

// Same rules as the server (server/projects.ts → slugify).
const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')

const LIMITS = { title: 140, category: 80, summary: 400, body: 8000 }

export function ProjectEditor() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [form, setForm] = useState<Form | null>(isNew ? blank() : null)
  const [saved, setSaved] = useState<string>(() => JSON.stringify(blank()))
  const [meta, setMeta] = useState<{ id: number; updatedAt: number } | null>(null)
  const [media, setMedia] = useState<Record<string, MediaInfo>>({})
  const [tab, setTab] = useState<Lang>('pl')
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploads, setUploads] = useState(0)
  const [progress, setProgress] = useState<{ name: string; p: number } | null>(null)

  useEffect(() => {
    if (isNew) return
    api<AdminProject>(`/projects/${id}`)
      .then((p) => {
        const f = toForm(p)
        setForm(f)
        setSaved(JSON.stringify(f))
        setMeta({ id: p.id, updatedAt: p.updatedAt })
        setMedia(p.media)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Nie udało się wczytać projektu.'))
  }, [id, isNew])

  const dirty = !!form && JSON.stringify(form) !== saved

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const update = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f))
  const setLoc = (key: LocKey, value: string) =>
    setForm((f) => {
      if (!f) return f
      const next = { ...f, [key]: { ...f[key], [tab]: value } }
      if (key === 'title' && !slugTouched) next.slug = slugify(next.title.en || next.title.pl || next.title.de)
      return next
    })

  const addMedia = (m: Media) =>
    setMedia((all) => ({ ...all, [m.id]: { w: m.w, h: m.h, kind: m.kind ?? 'image', ...(m.poster ? { poster: m.poster } : {}) } }))

  const upload = async (files: File[], onDone: (m: Media) => void) => {
    setError('')
    setUploads((n) => n + files.length)
    for (const file of files) {
      try {
        const video = isVideoFile(file)
        if (video) setProgress({ name: file.name, p: 0 })
        const m = video ? await uploadVideo(file, (p) => setProgress({ name: file.name, p })) : await uploadImage(file)
        addMedia(m)
        onDone(m)
      } catch (e) {
        setError(e instanceof ApiError ? e.message : `Nie udało się wgrać „${file.name}”.`)
      } finally {
        setUploads((n) => n - 1)
        setProgress(null)
      }
    }
  }

  const save = async (publish?: boolean) => {
    if (!form) return
    setSaving(true)
    setError('')
    setNotice('')
    const payload = { ...form, published: publish ?? form.published }
    try {
      const p = isNew
        ? await api<AdminProject>('/projects', { method: 'POST', json: payload })
        : await api<AdminProject>(`/projects/${meta!.id}`, { method: 'PUT', json: { ...payload, updatedAt: meta!.updatedAt } })
      const f = toForm(p)
      setForm(f)
      setSaved(JSON.stringify(f))
      setMeta({ id: p.id, updatedAt: p.updatedAt })
      setMedia(p.media)
      setSlugTouched(true)
      setNotice(p.published ? 'Zapisano. Projekt jest widoczny na stronie.' : 'Zapisano jako szkic — projekt nie jest widoczny na stronie.')
      if (isNew) navigate(`/admin/projects/${p.id}`, { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Nie udało się zapisać.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!meta || !form) return
    if (!window.confirm(`Usunąć projekt „${adminTitle(form.title)}”? Tej operacji nie można cofnąć.`)) return
    try {
      await api(`/projects/${meta.id}`, { method: 'DELETE' })
      setSaved(JSON.stringify(form))
      navigate('/admin', { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Nie udało się usunąć.')
    }
  }

  const back = (e: MouseEvent) => {
    if (dirty && !window.confirm('Masz niezapisane zmiany. Wyjść bez zapisywania?')) e.preventDefault()
  }

  const filled = useMemo(() => {
    const out: Record<string, boolean> = {}
    for (const l of LANG_TABS) out[l.code] = !!form?.title[l.code]
    return out
  }, [form])

  if (!form) {
    return (
      <div className="adm-page">
        {error ? (
          <p className="adm-alert adm-alert--error">{error}</p>
        ) : (
          <p className="adm-muted">Wczytywanie…</p>
        )}
        <Link to="/admin" className="adm-back">
          ← Wszystkie projekty
        </Link>
      </div>
    )
  }

  const moveImage = (i: number, dir: -1 | 1) => {
    const g = [...form.gallery]
    const [item] = g.splice(i, 1)
    g.splice(i + dir, 0, item)
    update({ gallery: g })
  }

  return (
    <div className="adm-page adm-editor">
      <Link to="/admin" className="adm-back" onClick={back}>
        ← Wszystkie projekty
      </Link>
      <div className="adm-page__head">
        <div>
          <p className="kicker">{isNew ? 'Nowy projekt' : form.published ? 'Opublikowany' : 'Szkic'}</p>
          <h1 className="adm-h1">{isNew && !adminTitle(form.title).trim() ? 'Nowy projekt' : adminTitle(form.title)}</h1>
          {meta && <p className="adm-muted">Ostatnia zmiana: {formatDate(meta.updatedAt)}</p>}
        </div>
        {!isNew && (
          <a className="adm-btn adm-btn--ghost" href={`/projects/${form.slug}?preview`} target="_blank" rel="noopener">
            Podgląd na stronie ↗
          </a>
        )}
      </div>

      <div className="adm-editor__grid">
        <div className="adm-editor__main">
          <section className="adm-card">
            <div className="adm-card__head">
              <h2 className="adm-h2">Treść</h2>
              <div className="adm-tabs" role="tablist" aria-label="Język treści">
                {LANG_TABS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    role="tab"
                    aria-selected={tab === l.code}
                    className={`adm-tab ${tab === l.code ? 'is-active' : ''}`}
                    onClick={() => setTab(l.code)}
                  >
                    {l.label}
                    <span className={`adm-tab__dot ${filled[l.code] ? 'is-filled' : ''}`} aria-label={filled[l.code] ? 'uzupełniony' : 'pusty'} />
                  </button>
                ))}
              </div>
            </div>
            <p className="adm-hint">
              Wypełnij przynajmniej jeden język. Jeśli tekstu w danym języku brakuje, strona pokaże wersję angielską, a potem polską.
            </p>
            <Field label="Tytuł" required={!form.title.en && !form.title.pl && !form.title.de} count={[form.title[tab].length, LIMITS.title]}>
              <input
                className="adm-input"
                value={form.title[tab]}
                maxLength={LIMITS.title}
                onChange={(e) => setLoc('title', e.target.value)}
                placeholder="np. Robot spawalniczy RX-200"
              />
            </Field>
            <Field label="Kategoria" count={[form.category[tab].length, LIMITS.category]}>
              <input
                className="adm-input"
                value={form.category[tab]}
                maxLength={LIMITS.category}
                onChange={(e) => setLoc('category', e.target.value)}
                placeholder="np. Maszyny przemysłowe"
              />
            </Field>
            <Field label="Krótki opis" hint="Widoczny na liście projektów i pod tytułem." count={[form.summary[tab].length, LIMITS.summary]}>
              <textarea
                className="adm-input"
                rows={3}
                value={form.summary[tab]}
                maxLength={LIMITS.summary}
                onChange={(e) => setLoc('summary', e.target.value)}
              />
            </Field>
            <Field label="Opis projektu" hint="Pusta linia rozpoczyna nowy akapit. Sam tekst — bez formatowania." count={[form.body[tab].length, LIMITS.body]}>
              <textarea
                className="adm-input adm-input--long"
                rows={12}
                value={form.body[tab]}
                maxLength={LIMITS.body}
                onChange={(e) => setLoc('body', e.target.value)}
              />
            </Field>
          </section>

          <section className="adm-card">
            <div className="adm-card__head">
              <h2 className="adm-h2">Galeria</h2>
              <span className="adm-muted">{form.gallery.length} / 40</span>
            </div>
            <p className="adm-hint">
              Zdjęcia oraz filmy MP4 (do {MAX_VIDEO_MB} MB, najlepiej H.264). Podpisy wpisujesz w języku wybranym wyżej (
              {LANG_TABS.find((l) => l.code === tab)!.label}).
            </p>
            {form.gallery.length > 0 && (
              <ul className="adm-gallery">
                {form.gallery.map((g, i) => (
                  <li key={g.id + i} className="adm-gallery__item">
                    <div className="adm-gallery__img">
                      {media[g.id]?.kind === 'video' ? (
                        <>
                          <video
                            src={videoUrl(g.id)}
                            poster={media[g.id].poster ? mediaUrl(media[g.id].poster!, 'sm') : undefined}
                            muted
                            playsInline
                            preload="metadata"
                            controls
                          />
                          <span className="adm-gallery__badge">Film</span>
                        </>
                      ) : (
                        <img src={mediaUrl(g.id, 'sm')} alt="" />
                      )}
                    </div>
                    <input
                      className="adm-input adm-input--sm"
                      value={g.caption[tab]}
                      maxLength={200}
                      placeholder="Podpis (opcjonalnie)"
                      onChange={(e) =>
                        update({ gallery: form.gallery.map((x, j) => (j === i ? { ...x, caption: { ...x.caption, [tab]: e.target.value } } : x)) })
                      }
                    />
                    {media[g.id]?.kind === 'video' && (
                      <label className="adm-check">
                        <input
                          type="checkbox"
                          checked={!!g.autoplay}
                          onChange={(e) => update({ gallery: form.gallery.map((x, j) => (j === i ? { ...x, autoplay: e.target.checked } : x)) })}
                        />
                        Odtwarzaj sam, bez dźwięku, w pętli
                      </label>
                    )}
                    <div className="adm-gallery__tools">
                      <button type="button" className="adm-icon-btn" disabled={i === 0} onClick={() => moveImage(i, -1)} aria-label="W lewo">
                        ←
                      </button>
                      <button
                        type="button"
                        className="adm-icon-btn"
                        disabled={i === form.gallery.length - 1}
                        onClick={() => moveImage(i, 1)}
                        aria-label="W prawo"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        className="adm-icon-btn"
                        onClick={() => update({ cover: media[g.id]?.kind === 'video' ? (media[g.id].poster ?? form.cover) : g.id })}
                        title={media[g.id]?.kind === 'video' ? 'Ustaw klatkę filmu jako okładkę' : 'Ustaw jako okładkę'}
                        aria-label="Ustaw jako okładkę"
                      >
                        ★
                      </button>
                      <button
                        type="button"
                        className="adm-icon-btn adm-icon-btn--danger"
                        onClick={() => update({ gallery: form.gallery.filter((_, j) => j !== i) })}
                        aria-label="Usuń z galerii"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {form.gallery.length < 40 && (
              <DropZone
                multiple
                video
                label="Przeciągnij zdjęcia lub filmy MP4 tutaj albo kliknij, aby wybrać"
                onFiles={(files) =>
                  upload(files.slice(0, 40 - form.gallery.length), (m) =>
                    setForm((f) => (f ? { ...f, gallery: [...f.gallery, { id: m.id, caption: emptyLoc() }] } : f)),
                  )
                }
              />
            )}
            {progress && (
              <div className="adm-progress" role="status">
                <span>
                  Wgrywanie filmu „{progress.name}” — {Math.round(progress.p * 100)}%
                </span>
                <span className="adm-progress__bar">
                  <span style={{ transform: `scaleX(${progress.p})` }} />
                </span>
              </div>
            )}
          </section>
        </div>

        <aside className="adm-editor__side">
          <section className="adm-card">
            <h2 className="adm-h2">Publikacja</h2>
            <label className="adm-switch">
              <input type="checkbox" checked={form.published} onChange={(e) => update({ published: e.target.checked })} />
              <span className="adm-switch__track" aria-hidden="true" />
              <span>{form.published ? 'Widoczny na stronie' : 'Szkic (niewidoczny)'}</span>
            </label>
            <div className="adm-actions">
              <button type="button" className="adm-btn adm-btn--primary" onClick={() => save()} disabled={saving || uploads > 0 || (!dirty && !isNew)}>
                {saving ? 'Zapisywanie…' : uploads > 0 ? 'Wgrywanie plików…' : 'Zapisz'}
                <span aria-hidden="true">+</span>
              </button>
              {dirty && !isNew && <p className="adm-muted adm-actions__note">Masz niezapisane zmiany.</p>}
            </div>
            {notice && !dirty && (
              <p className="adm-alert adm-alert--ok" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="adm-alert adm-alert--error" role="alert">
                {error}
              </p>
            )}
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">Okładka</h2>
            {form.cover ? (
              <div className="adm-cover">
                <img
                  src={mediaUrl(form.cover, 'md')}
                  alt=""
                  style={media[form.cover] ? { aspectRatio: `${media[form.cover].w} / ${media[form.cover].h}` } : undefined}
                />
                <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => update({ cover: null })}>
                  Usuń okładkę
                </button>
              </div>
            ) : (
              <DropZone label="Dodaj zdjęcie okładki" onFiles={(files) => upload(files.slice(0, 1), (m) => update({ cover: m.id }))} />
            )}
            <p className="adm-hint">Najlepiej poziome zdjęcie, min. 2400 px szerokości. JPG, PNG, WebP lub AVIF, do 25 MB.</p>
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">Szczegóły</h2>
            <Field label="Klient" hint="Zostaw puste, jeśli projekt jest poufny.">
              <input className="adm-input" value={form.client} maxLength={120} onChange={(e) => update({ client: e.target.value })} />
            </Field>
            <Field label="Rok">
              <input className="adm-input" value={form.year} maxLength={20} onChange={(e) => update({ year: e.target.value })} placeholder="np. 2025" />
            </Field>
            <Field label="Adres strony" hint={`dale.com/projects/${form.slug || '…'}`}>
              <input
                className="adm-input"
                value={form.slug}
                maxLength={80}
                spellCheck={false}
                onChange={(e) => {
                  setSlugTouched(true)
                  update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
                }}
              />
            </Field>
          </section>

          {!isNew && (
            <section className="adm-card adm-card--danger">
              <h2 className="adm-h2">Usuń projekt</h2>
              <p className="adm-hint">Projekt wraz ze zdjęciami i filmami zostanie trwale usunięty.</p>
              <button type="button" className="adm-btn adm-btn--danger" onClick={remove}>
                Usuń projekt
              </button>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  count,
  required,
  children,
}: {
  label: string
  hint?: string
  count?: [number, number]
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="adm-field">
      <span className="adm-field__label">
        {label}
        {required && <span className="adm-field__req"> — wymagane</span>}
        {count && <span className={`adm-field__count ${count[0] > count[1] * 0.9 ? 'is-near' : ''}`}>{`${count[0]} / ${count[1]}`}</span>}
      </span>
      {children}
      {hint && <span className="adm-field__hint">{hint}</span>}
    </label>
  )
}

function DropZone({
  label,
  multiple,
  video,
  onFiles,
}: {
  label: string
  multiple?: boolean
  video?: boolean
  onFiles: (files: File[]) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const drop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const files = [...e.dataTransfer.files]
    if (files.length) onFiles(files)
  }
  return (
    <div
      className={`adm-drop ${over ? 'is-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <button type="button" className="adm-drop__btn" onClick={() => input.current?.click()}>
        <span className="adm-drop__plus" aria-hidden="true">
          +
        </span>
        {label}
      </button>
      <input
        ref={input}
        type="file"
        accept={`image/jpeg,image/png,image/webp,image/avif,image/tiff,image/gif${video ? ',video/mp4,.mp4' : ''}`}
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          e.target.value = ''
          if (files.length) onFiles(files)
        }}
      />
    </div>
  )
}

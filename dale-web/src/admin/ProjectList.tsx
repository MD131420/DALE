import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { EASE_OUT } from '../motion/math'
import { mediaUrl } from '../projects/api'
import { adminTitle, api, ApiError, formatDate, type AdminProject } from './api'

export function ProjectList() {
  const [projects, setProjects] = useState<AdminProject[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<number | null>(null)

  useEffect(() => {
    api<AdminProject[]>('/projects')
      .then(setProjects)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Nie udało się wczytać projektów.'))
  }, [])

  const move = async (index: number, dir: -1 | 1) => {
    if (!projects) return
    const next = [...projects]
    const [item] = next.splice(index, 1)
    next.splice(index + dir, 0, item)
    setProjects(next)
    try {
      await api('/projects/order', { method: 'POST', json: { ids: next.map((p) => p.id) } })
    } catch (e) {
      setProjects(projects)
      setError(e instanceof ApiError ? e.message : 'Nie udało się zmienić kolejności.')
    }
  }

  const togglePublished = async (p: AdminProject) => {
    setBusy(p.id)
    setError('')
    try {
      const saved = await api<AdminProject>(`/projects/${p.id}`, { method: 'PUT', json: { ...p, published: !p.published } })
      setProjects((list) => list?.map((x) => (x.id === p.id ? saved : x)) ?? null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Nie udało się zapisać.')
    } finally {
      setBusy(null)
    }
  }

  const published = projects?.filter((p) => p.published).length ?? 0

  return (
    <div className="adm-page">
      <div className="adm-page__head">
        <div>
          <p className="kicker">DALE / Panel</p>
          <h1 className="adm-h1">Projekty</h1>
          {projects && (
            <p className="adm-muted">
              {projects.length === 0
                ? 'Nie ma jeszcze żadnego projektu.'
                : `${projects.length} ${plural(projects.length, 'projekt', 'projekty', 'projektów')}, opublikowane: ${published}. Kolejność na liście = kolejność na stronie.`}
            </p>
          )}
        </div>
        <Link to="/admin/projects/new" className="adm-btn adm-btn--primary">
          Dodaj projekt <span aria-hidden="true">+</span>
        </Link>
      </div>

      {error && (
        <p className="adm-alert adm-alert--error" role="alert">
          {error}
        </p>
      )}
      {!projects && !error && <p className="adm-muted">Wczytywanie…</p>}

      {projects?.length === 0 && (
        <div className="adm-empty">
          <p>Dodaj pierwszy projekt: tytuł, opis, okładkę i galerię zdjęć. Możesz go zapisać jako szkic i opublikować później.</p>
          <Link to="/admin/projects/new" className="adm-btn adm-btn--primary">
            Dodaj pierwszy projekt <span aria-hidden="true">+</span>
          </Link>
        </div>
      )}

      <ul className="adm-list">
        <AnimatePresence initial={false}>
          {projects?.map((p, i) => (
            <motion.li
              key={p.id}
              layout
              className="adm-row"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT, delay: Math.min(i, 8) * 0.03 } }}
              exit={{ opacity: 0 }}
            >
              <div className="adm-row__order">
                <button type="button" className="adm-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Przesuń wyżej">
                  ↑
                </button>
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() => move(i, 1)}
                  disabled={i === projects.length - 1}
                  aria-label="Przesuń niżej"
                >
                  ↓
                </button>
              </div>
              <Link to={`/admin/projects/${p.id}`} className="adm-row__thumb" tabIndex={-1} aria-hidden="true">
                {p.cover ? <img src={mediaUrl(p.cover, 'sm')} alt="" /> : <span>Brak okładki</span>}
              </Link>
              <div className="adm-row__main">
                <Link to={`/admin/projects/${p.id}`} className="adm-row__title">
                  {adminTitle(p.title)}
                </Link>
                <p className="adm-row__meta">
                  /projects/{p.slug} · zmieniono {formatDate(p.updatedAt)}
                </p>
              </div>
              <button
                type="button"
                className={`adm-status ${p.published ? 'is-on' : ''}`}
                onClick={() => togglePublished(p)}
                disabled={busy === p.id}
                title={p.published ? 'Kliknij, aby ukryć ze strony' : 'Kliknij, aby opublikować'}
              >
                {p.published ? 'Opublikowany' : 'Szkic'}
              </button>
              <div className="adm-row__actions">
                <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`/projects/${p.slug}?preview`} target="_blank" rel="noopener">
                  Podgląd ↗
                </a>
                <Link className="adm-btn adm-btn--ghost adm-btn--sm" to={`/admin/projects/${p.id}`}>
                  Edytuj
                </Link>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one
  const d = n % 10
  const t = n % 100
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many
}

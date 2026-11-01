import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, formatDate } from './api'

type AccountInfo = {
  username: string
  sessions: { current: boolean; createdAt: number; lastSeen: number; ip: string; userAgent: string }[]
  log: { at: number; event: string; detail: string | null; ip: string | null }[]
}

const EVENTS: Record<string, string> = {
  login: 'Logowanie',
  login_failed: 'Nieudane logowanie',
  login_blocked: 'Zablokowana próba logowania',
  logout: 'Wylogowanie',
  password_changed: 'Zmiana hasła',
  password_change_failed: 'Nieudana zmiana hasła',
  password_set_cli: 'Nowe hasło (Admin.bat)',
  user_created_cli: 'Utworzenie konta (Admin.bat)',
  sessions_revoked: 'Wylogowanie innych urządzeń',
  project_created: 'Nowy projekt',
  project_updated: 'Zmiana projektu',
  project_deleted: 'Usunięcie projektu',
  projects_reordered: 'Zmiana kolejności',
  media_uploaded: 'Wgranie zdjęcia',
}
const WARN = new Set(['login_failed', 'login_blocked', 'password_change_failed'])

const device = (ua: string) => {
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Przeglądarka'
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  return os ? `${browser} · ${os}` : browser
}

export function Account() {
  const [info, setInfo] = useState<AccountInfo | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(
    () =>
      api<AccountInfo>('/account')
        .then(setInfo)
        .catch((e) => setError(e instanceof ApiError ? e.message : 'Nie udało się wczytać danych konta.')),
    [],
  )
  useEffect(() => {
    load()
  }, [load])

  const revokeOthers = async () => {
    try {
      await api('/sessions/revoke-others', { method: 'POST' })
      load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Nie udało się wylogować innych urządzeń.')
    }
  }

  const others = info ? info.sessions.filter((s) => !s.current).length : 0

  return (
    <div className="adm-page">
      <div className="adm-page__head">
        <div>
          <p className="kicker">DALE / Panel</p>
          <h1 className="adm-h1">Konto i bezpieczeństwo</h1>
          {info && <p className="adm-muted">Zalogowano jako {info.username}</p>}
        </div>
      </div>
      {error && (
        <p className="adm-alert adm-alert--error" role="alert">
          {error}
        </p>
      )}
      <div className="adm-account">
        <PasswordForm onChanged={load} />

        <section className="adm-card">
          <div className="adm-card__head">
            <h2 className="adm-h2">Zalogowane urządzenia</h2>
            {others > 0 && (
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={revokeOthers}>
                Wyloguj pozostałe ({others})
              </button>
            )}
          </div>
          <p className="adm-hint">Sesja wygasa po 2 godzinach bezczynności i najpóźniej po 12 godzinach.</p>
          <ul className="adm-sessions">
            {info?.sessions.map((s, i) => (
              <li key={i}>
                <span>
                  {device(s.userAgent)} {s.current && <span className="adm-badge">To urządzenie</span>}
                </span>
                <span className="adm-muted">
                  {s.ip} · aktywność {formatDate(s.lastSeen)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="adm-card adm-account__log">
          <h2 className="adm-h2">Ostatnia aktywność</h2>
          <p className="adm-hint">Jeśli widzisz nieudane logowania, których nie rozpoznajesz — zmień hasło na długie i unikalne.</p>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Kiedy</th>
                <th>Zdarzenie</th>
                <th>Szczegóły</th>
                <th>Adres IP</th>
              </tr>
            </thead>
            <tbody>
              {info?.log.map((l, i) => (
                <tr key={i} className={WARN.has(l.event) ? 'is-warn' : ''}>
                  <td>{formatDate(l.at)}</td>
                  <td>{EVENTS[l.event] ?? l.event}</td>
                  <td>{l.detail ?? ''}</td>
                  <td>{l.ip ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function PasswordForm({ onChanged }: { onChanged: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next !== repeat) return setMsg({ ok: false, text: 'Nowe hasła się różnią.' })
    setBusy(true)
    setMsg(null)
    try {
      await api('/password', { method: 'POST', json: { current, next } })
      setCurrent('')
      setNext('')
      setRepeat('')
      setMsg({ ok: true, text: 'Hasło zmienione. Pozostałe urządzenia zostały wylogowane.' })
      onChanged()
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Nie udało się zmienić hasła.' })
    } finally {
      setBusy(false)
    }
  }

  const strength = next.length === 0 ? 0 : next.length < 12 ? 1 : next.length < 16 ? 2 : 3

  return (
    <form className="adm-card" onSubmit={submit}>
      <h2 className="adm-h2">Zmiana hasła</h2>
      <p className="adm-hint">Minimum 12 znaków. Najlepiej kilka losowych słów, np. „Kawa-Zegar-Most-Lipa”.</p>
      <label className="adm-field">
        <span className="adm-field__label">Obecne hasło</span>
        <input className="adm-input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </label>
      <label className="adm-field">
        <span className="adm-field__label">Nowe hasło</span>
        <input
          className="adm-input"
          type="password"
          autoComplete="new-password"
          value={next}
          minLength={12}
          maxLength={200}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <span className={`adm-strength adm-strength--${strength}`} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </label>
      <label className="adm-field">
        <span className="adm-field__label">Powtórz nowe hasło</span>
        <input className="adm-input" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required />
      </label>
      {msg && (
        <p className={`adm-alert ${msg.ok ? 'adm-alert--ok' : 'adm-alert--error'}`} role={msg.ok ? 'status' : 'alert'}>
          {msg.text}
        </p>
      )}
      <button className="adm-btn adm-btn--primary" disabled={busy}>
        {busy ? 'Zapisywanie…' : 'Zmień hasło'}
        <span aria-hidden="true">+</span>
      </button>
    </form>
  )
}

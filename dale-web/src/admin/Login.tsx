import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Logo } from '../brand/Logo'
import { EASE_OUT } from '../motion/math'
import { api, ApiError } from './api'

export function Login({ onLogin, expired }: { onLogin: (username: string, csrf: string) => void; expired?: boolean }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(expired ? 'Sesja wygasła — zaloguj się ponownie.' : '')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await api<{ user: { username: string }; csrf: string }>('/login', { method: 'POST', json: { username, password } })
      setPassword('')
      onLogin(r.user.username, r.csrf)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nie udało się zalogować.')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adm adm--center">
      <motion.form
        className="adm-login"
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } }}
      >
        <Logo variant="primary" className="adm-login__logo" title="DALE" />
        <span className="lime-bar adm-login__bar" aria-hidden="true" />
        <h1 className="adm-login__title">Panel administracyjny</h1>
        <label className="adm-field">
          <span className="adm-field__label">Login</span>
          <input
            className="adm-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={64}
            required
            autoFocus
          />
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Hasło</span>
          <span className="adm-input-wrap">
            <input
              className="adm-input"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              maxLength={200}
              required
            />
            <button type="button" className="adm-input-wrap__btn" onClick={() => setShow((s) => !s)} aria-pressed={show}>
              {show ? 'Ukryj' : 'Pokaż'}
            </button>
          </span>
        </label>
        {error && (
          <p className="adm-alert adm-alert--error" role="alert">
            {error}
          </p>
        )}
        <button className="adm-btn adm-btn--primary adm-login__submit" disabled={busy}>
          {busy ? 'Logowanie…' : 'Zaloguj'}
          <span aria-hidden="true">+</span>
        </button>
        <p className="adm-login__hint">
          Nie pamiętasz hasła? Ustaw nowe, uruchamiając <code>Admin.bat</code> na komputerze, na którym działa strona.
        </p>
      </motion.form>
    </div>
  )
}

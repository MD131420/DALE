import { useCallback, useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router'
import { Logo } from '../brand/Logo'
import { Account } from './Account'
import { api, setCsrf, setUnauthorizedHandler } from './api'
import { Login } from './Login'
import { ProjectEditor } from './ProjectEditor'
import { ProjectList } from './ProjectList'
import './admin.css'

type Auth = { state: 'checking' } | { state: 'out'; expired?: boolean } | { state: 'in'; username: string }

export default function AdminApp() {
  const [auth, setAuth] = useState<Auth>({ state: 'checking' })

  useEffect(() => {
    document.documentElement.lang = 'pl'
    document.title = 'Panel — DALE'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.append(robots)
    return () => robots.remove()
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setAuth((a) => (a.state === 'in' ? { state: 'out', expired: true } : a)))
    api<{ user: { username: string }; csrf: string }>('/me')
      .then((r) => {
        setCsrf(r.csrf)
        setAuth({ state: 'in', username: r.user.username })
      })
      .catch(() => setAuth({ state: 'out' }))
    return () => setUnauthorizedHandler(null)
  }, [])

  const onLogin = useCallback((username: string, csrf: string) => {
    setCsrf(csrf)
    setAuth({ state: 'in', username })
  }, [])

  const logout = async () => {
    await api('/logout', { method: 'POST' }).catch(() => {})
    setCsrf('')
    setAuth({ state: 'out' })
  }

  if (auth.state === 'checking') return <div className="adm adm--center" aria-busy="true" />
  if (auth.state === 'out') return <Login onLogin={onLogin} expired={auth.expired} />

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top__inner">
          <NavLink to="/admin" end className="adm-top__brand" aria-label="Panel — projekty">
            <Logo variant="primary" className="adm-top__logo" title="DALE" />
            <span className="adm-top__label">Panel</span>
          </NavLink>
          <nav className="adm-top__nav" aria-label="Panel">
            <NavLink to="/admin" end>
              Projekty
            </NavLink>
            <NavLink to="/admin/account">Konto i bezpieczeństwo</NavLink>
            <a href="/projects" target="_blank" rel="noopener">
              Zobacz stronę ↗
            </a>
          </nav>
          <div className="adm-top__user">
            <span className="adm-top__name">{auth.username}</span>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={logout}>
              Wyloguj
            </button>
          </div>
        </div>
      </header>
      <main className="adm-main">
        <Routes>
          <Route index element={<ProjectList />} />
          <Route path="projects/new" element={<ProjectEditor />} />
          <Route path="projects/:id" element={<ProjectEditor />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { LANGS, useI18n, withLang } from '../i18n'
import { EASE_OUT } from '../motion/math'

function Globe() {
  return (
    <svg viewBox="0 0 24 24" className="lang__globe" aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M2.75 12h18.5M12 2.75c2.6 2.6 3.9 5.7 3.9 9.25s-1.3 6.65-3.9 9.25M12 2.75C9.4 5.35 8.1 8.45 8.1 12s1.3 6.65 3.9 9.25M4.5 6.8h15M4.5 17.2h15" />
    </svg>
  )
}

/** Globe + language pill from the approved header. Switching keeps the current page. */
export function LanguageSwitch({ placement = 'down' }: { placement?: 'down' | 'up' }) {
  const { lang, t, page } = useI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = LANGS.find((l) => l.code === lang)!

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (code: (typeof LANGS)[number]['code']) => {
    setOpen(false)
    if (code === lang) return
    try {
      localStorage.setItem('dale-lang', code)
    } catch {
      /* storage unavailable — the URL still carries the language */
    }
    navigate(withLang(code, page))
  }

  return (
    <div ref={rootRef} className={`lang-switch lang-switch--${placement}`}>
      <button
        type="button"
        className={`lang ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t.nav.language}: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Globe />
        <span>{current.label}</span>
        <svg viewBox="0 0 12 12" className="lang__chev" aria-hidden="true">
          <path d="M2 4.25 6 8l4-3.75" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={t.nav.language}
            className="lang-menu"
            initial={{ opacity: 0, y: placement === 'down' ? -8 : 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE_OUT } }}
            exit={{ opacity: 0, y: placement === 'down' ? -6 : 6, transition: { duration: 0.2 } }}
          >
            {LANGS.map((l) => (
              <li key={l.code} role="option" aria-selected={l.code === lang}>
                <button type="button" lang={l.code} onClick={() => choose(l.code)} className={l.code === lang ? 'is-current' : ''}>
                  <span className="lang-menu__code">{l.short}</span>
                  <span>{l.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

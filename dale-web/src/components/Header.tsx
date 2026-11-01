import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, NavLink, useLocation } from 'react-router'
import { Logo } from '../brand/Logo'
import type { IntroTarget } from '../motion/IntroBlueprint'
import { EASE_OUT } from '../motion/math'
import { useI18n } from '../i18n'
import { getLenis, NAV } from '../site'
import { LanguageSwitch } from './LanguageSwitch'

export type HeaderHandle = { getLogoTarget: () => IntroTarget | null }

type Props = { logoVisible: boolean; revealed: boolean }

export const Header = forwardRef<HeaderHandle, Props>(function Header({ logoVisible, revealed }, ref) {
  const signatureRef = useRef<SVGSVGElement>(null)
  const primaryRef = useRef<SVGSVGElement>(null)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { t, lp } = useI18n()

  useImperativeHandle(ref, () => ({
    getLogoTarget() {
      const sig = signatureRef.current?.getBoundingClientRect()
      if (sig && sig.width > 0) return { rect: sig, variant: 'signature' }
      const pri = primaryRef.current?.getBoundingClientRect()
      if (pri && pri.width > 0) return { rect: pri, variant: 'primary' }
      return null
    },
  }))

  // Expose the header height to CSS (mobile menu offset, page curtain, contact panel).
  useEffect(() => {
    const el = document.querySelector('.site-header') as HTMLElement
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the menu whenever the page changes.
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const lenis = getLenis()
    if (open) lenis?.stop()
    else lenis?.start()
    document.documentElement.classList.toggle('menu-open', open)
  }, [open])

  const navItem = (i: number) => ({
    initial: { opacity: 0, y: -10 },
    animate: revealed ? { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT, delay: 0.5 + i * 0.07 } } : undefined,
  })

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="site-header__inner container">
        <Link to={lp('/')} className="site-header__brand" style={{ opacity: logoVisible ? 1 : 0 }} aria-label={t.nav.home}>
          <Logo ref={signatureRef} variant="signature" className="logo logo--signature" />
          <Logo ref={primaryRef} variant="primary" className="logo logo--primary" />
        </Link>

        <nav className="site-nav" aria-label={t.nav.main}>
          {NAV.map((item, i) => (
            <motion.div key={item.path} {...navItem(i)}>
              <NavLink to={lp(item.path)} className={({ isActive }) => `site-nav__link ${isActive ? 'is-active' : ''}`}>
                {t.nav[item.key]}
              </NavLink>
            </motion.div>
          ))}
          <motion.div {...navItem(NAV.length)}>
            <LanguageSwitch />
          </motion.div>
        </nav>

        <motion.button
          type="button"
          className={`burger ${open ? 'is-open' : ''}`}
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          {...navItem(0)}
        >
          <span />
          <span />
          <span />
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.7, ease: EASE_OUT } }}
            exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.5, ease: EASE_OUT } }}
          >
            <div className="container mobile-menu__inner">
              <p className="mobile-menu__label">{t.nav.menu}</p>
              <ul>
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.path}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE_OUT, delay: 0.15 + i * 0.06 } }}
                  >
                    <NavLink to={lp(item.path)} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                      {t.nav[item.key]}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
              <LanguageSwitch placement="up" />
              <p className="mobile-menu__foot">
                {t.nav.menuFoot[0]}
                <br />
                {t.nav.menuFoot[1]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
})

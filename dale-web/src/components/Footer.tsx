import { motion } from 'motion/react'
import { Link } from 'react-router'
import { Logo } from '../brand/Logo'
import { EASE_OUT } from '../motion/math'
import { useI18n } from '../i18n'
import { CONTACT, NAV } from '../site'

export function Footer() {
  const { t, lp } = useI18n()
  return (
    <footer className="site-footer">
      <div className="container">
        <motion.div
          className="site-footer__brand"
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
          whileInView={{ opacity: 1, clipPath: 'inset(0 0% 0 0)', transition: { duration: 1.6, ease: EASE_OUT } }}
          viewport={{ once: true }}
        >
          <Logo variant="signature" className="logo logo--signature" />
          <Logo variant="primary" className="logo logo--primary" />
        </motion.div>
        <div className="site-footer__row">
          <nav aria-label={t.nav.footer}>
            {NAV.map((n) => (
              <Link key={n.path} to={lp(n.path)}>
                {t.nav[n.key]}
              </Link>
            ))}
          </nav>
          <a href={`mailto:${CONTACT.email}`} className="site-footer__mail">
            {CONTACT.email}
          </a>
        </div>
        <div className="site-footer__legal">
          <span>© {new Date().getFullYear()} {t.footer.tagline}</span>
          <span>{t.footer.legal}</span>
        </div>
      </div>
    </footer>
  )
}

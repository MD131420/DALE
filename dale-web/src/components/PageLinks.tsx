import { motion } from 'motion/react'
import { Link } from 'react-router'
import { useI18n } from '../i18n'
import { EASE_OUT } from '../motion/math'
import { Lines, Reveal } from '../motion/Reveal'
import { NAV } from '../site'
import { LimeBar, PillButton } from './ui'

const viewport = { once: true, amount: 0.3 } as const

/** Home: one row per sub-page. Hover fills the row with Lime from the left. */
export function PageIndex() {
  const { t, lp } = useI18n()
  return (
    <section className="section section--carbon page-index">
      <div className="container">
        <header className="section-heading">
          <LimeBar />
          <Reveal y={12}>
            <p className="kicker">{t.explore.kicker}</p>
          </Reveal>
          <Lines lines={t.explore.title} className="display display--section" />
        </header>
        <ul className="page-index__list">
          {NAV.map((item, i) => (
            <motion.li
              key={item.path}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT, delay: i * 0.08 } }}
              viewport={viewport}
            >
              <Link to={lp(item.path)} className="page-link">
                <span className="page-link__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="page-link__title">{t.nav[item.key]}</span>
                <span className="page-link__blurb">{t.blurbs[item.key]}</span>
                <span className="page-link__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** End of a sub-page: large link to the next page in the navigation order. */
export function NextPage({ current }: { current: string }) {
  const { t, lp } = useI18n()
  const i = NAV.findIndex((n) => n.path === current)
  const next = NAV[(i + 1) % NAV.length]
  return (
    <section className="next-page">
      <Link to={lp(next.path)} className="next-page__link">
        <span className="container next-page__inner">
          <span className="kicker">{t.next}</span>
          <span className="display next-page__title">{t.nav[next.key]}</span>
          <span className="next-page__arrow" aria-hidden="true">
            →
          </span>
        </span>
      </Link>
    </section>
  )
}

/** Lime call-to-action band (Carbon on Lime). */
export function CtaBand() {
  const { t, lp } = useI18n()
  return (
    <section className="cta-band">
      <div className="container cta-band__inner">
        <Lines lines={t.cta.title} className="display cta-band__title" />
        <Reveal delay={0.2} className="cta-band__side">
          <p>{t.cta.text}</p>
          <PillButton href={lp('/contact')} variant="carbon">
            {t.cta.button}
          </PillButton>
        </Reveal>
      </div>
    </section>
  )
}

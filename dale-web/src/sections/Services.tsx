import { motion } from 'motion/react'
import { Icon, SectionHeading, type IconId } from '../components/ui'
import { EASE_OUT } from '../motion/math'
import { useI18n } from '../i18n'

// Texts live in src/i18n (brandbook working proposal) — confirm the real DALE scope before publishing.
const ICONS: IconId[] = ['01_requirements', '02_design', '03_engineering', '04_3d_printing', '05_validation', '06_production']

export function Services() {
  const { t } = useI18n()
  return (
    <section className="section section--paper services">
      <div className="container">
        <SectionHeading
          tone="light"
          as="h1"
          index="01"
          label={t.services.label}
          title={t.services.title}
          intro={t.services.intro}
        />

        <ul className="services__grid">
          {t.services.items.map((s, i) => (
            <motion.li
              key={s.title}
              className={`service dale-icon-trigger ${i === 0 ? 'service--lime is-active' : ''}`}
              tabIndex={0}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT, delay: (i % 3) * 0.1 } }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="service__top">
                <span className="service__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="service__plus" aria-hidden="true">
                  +
                </span>
              </div>
              <Icon id={ICONS[i]} className="service__icon" />
              <h3 className="service__title">{s.title}</h3>
              <p className="service__lead">{s.lead}</p>
              <p className="service__sub">{s.sub}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

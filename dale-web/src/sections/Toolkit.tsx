import { motion } from 'motion/react'
import { Icon, SectionHeading, type IconId } from '../components/ui'
import { EASE_OUT } from '../motion/math'
import { useI18n } from '../i18n'

// Same order as t.toolkit.items.
const TOOLS: IconId[] = [
  '07_simulations',
  '08_optimization',
  '09_assembly',
  '10_documentation',
  '15_injection_mould',
  '12_supplier_sourcing',
  '13_strategy_goals',
  '16_strategy_target',
  '14_vr_technology',
  '11_presentation',
]

/** Icon system v12: grey outlines at rest, Lime detail on hover / focus / tap. */
export function Toolkit() {
  const { t } = useI18n()
  return (
    <section className="section section--carbon toolkit">
      <div className="container">
        <SectionHeading
          index="02"
          label={t.toolkit.label}
          title={t.toolkit.title}
          intro={t.toolkit.intro}
        />
        <ul className="toolkit__grid">
          {TOOLS.map((id, i) => (
            <motion.li
              key={id}
              className="tool"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1, transition: { duration: 0.8, ease: EASE_OUT, delay: (i % 5) * 0.08 } }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <button type="button" className="tool__btn dale-icon-trigger" onClick={(e) => e.currentTarget.classList.toggle('is-active')}>
                <motion.span
                  className="tool__rule"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1, transition: { duration: 1.2, ease: EASE_OUT, delay: 0.1 + (i % 5) * 0.08 } }}
                  viewport={{ once: true }}
                  aria-hidden="true"
                />
                <Icon id={id} />
                <span className="tool__text">
                  <span className="tool__num">{String(i + 7).padStart(2, '0')}</span>
                  <span className="tool__label">{t.toolkit.items[i]}</span>
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

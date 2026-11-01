import { useEffect } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useTransform } from 'motion/react'
import { Logo } from '../brand/Logo'
import { PillButton } from '../components/ui'
import { prefersReducedMotion } from '../motion/math'
import { CONTACT } from '../site'
import { useI18n } from '../i18n'

/**
 * "Lime Cut" (DALE_Motion_Approved_v7/03), played on page entry:
 * a Lime field with an oversized Carbon mark zooms into place,
 * then a slanted Carbon wipe crosses left → right and opens the contact panel.
 * Timing follows the source: zoom 0–1.7 s, wipe 1.75–2.85 s, content after.
 */
export function Contact() {
  const { t } = useI18n()
  const p = useMotionValue(prefersReducedMotion() ? 1 : 0)

  useEffect(() => {
    if (p.get() >= 1) return
    const controls = animate(p, 1, { duration: 2.6, ease: 'linear', delay: 0.1 })
    return () => controls.stop()
  }, [p])

  const zoom = useTransform(p, [0, 0.47], [0, 1], { ease: (x) => 1 - Math.pow(1 - x, 4) })
  const markScale = useTransform(zoom, [0, 1], [1.9, 1])
  const markX = useTransform(zoom, [0, 1], ['-34%', '0%'])
  const edge = useTransform(p, [0.49, 0.79], [-40, 140], { ease: (x) => x * x * (3 - 2 * x) })
  const edgeTop = useTransform(edge, (e) => `${e + 22}%`)
  const edgeBottom = useTransform(edge, (e) => `${e - 8}%`)
  const clip = useMotionTemplate`polygon(0% 0%, ${edgeTop} 0%, ${edgeBottom} 100%, 0% 100%)`
  const contentOpacity = useTransform(p, [0.74, 0.92], [0, 1])
  const contentY = useTransform(p, [0.74, 0.92], [40, 0])
  const lineScale = useTransform(p, [0.8, 1], [0, 1])

  return (
    <section className="contact" aria-label={t.contact.label}>
      <div className="contact__lime" aria-hidden="true">
        <motion.div className="contact__mark" style={{ scale: markScale, x: markX }}>
          <Logo variant="primary" title="" />
        </motion.div>
      </div>

      <motion.div className="contact__carbon" style={{ clipPath: clip }}>
        <div className="container contact__inner">
          <motion.div style={{ opacity: contentOpacity, y: contentY }} className="contact__head">
            <p className="kicker">01 / {t.contact.label}</p>
            <h1 className="display display--contact">
              {t.contact.title[0]}
              <br />
              {t.contact.title[1]}
            </h1>
            <p className="contact__lead">{t.contact.lead}</p>
          </motion.div>

          <motion.div className="contact__line" style={{ scaleX: lineScale }} aria-hidden="true" />

          <motion.div style={{ opacity: contentOpacity }} className="contact__grid">
            <div className="contact__person">
              <p className="contact__name">{CONTACT.name}</p>
              <p className="contact__role">{t.contact.role}</p>
            </div>
            <ul className="contact__links">
              <li>
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              {CONTACT.phone && (
                <li>
                  <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
                </li>
              )}
              <li>
                <a href={CONTACT.url}>{CONTACT.web}</a>
              </li>
            </ul>
            <div className="contact__cta">
              <PillButton href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(t.contact.subject)}`}>{t.contact.cta}</PillButton>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

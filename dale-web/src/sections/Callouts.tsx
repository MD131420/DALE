import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { SectionHeading } from '../components/ui'
import { BurnReveal } from '../motion/BurnReveal'
import { BRAND, EASE_OUT } from '../motion/math'
import { Reveal } from '../motion/Reveal'
import { useI18n } from '../i18n'

// Points in % of the Carbon Studio image (1536 × 1024, stage kept at 3:2). Label anchors sit outside the product.
const CALLOUTS = [
  { n: '01', p: [31.5, 34], l: [8, 16], side: 'left' },
  { n: '02', p: [71, 54], l: [95, 86], side: 'right' },
  { n: '03', p: [27, 67.5], l: [10, 88], side: 'left' },
] as const

const viewport = { once: true, amount: 0.45 } as const

/** Details & callouts (Technical graphics v4 / 05), on Carbon Studio imagery. */
export function Callouts() {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1])

  return (
    <section className="section section--carbon callouts">
      <div className="container">
        <SectionHeading index="02" label={t.callouts.label} title={t.callouts.title} />

        <div ref={ref} className="callouts__viewport">
          <motion.div className="callouts__stage" style={{ scale }}>
          <BurnReveal
            src="/images/carbon-studio.webp"
            alt={t.callouts.alt}
            cover={BRAND.carbon}
            duration={1200}
            className="callouts__img"
          />

          <svg className="callouts__lines" viewBox="0 0 150 100" aria-hidden="true">
            {CALLOUTS.map((c, i) => (
              <motion.polyline
                key={c.n}
                points={`${c.p[0] * 1.5},${c.p[1]} ${c.l[0] * 1.5},${c.p[1]} ${c.l[0] * 1.5},${c.l[1]}`}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1, transition: { duration: 1.2, ease: EASE_OUT, delay: 1.2 + i * 0.25 } }}
                viewport={viewport}
              />
            ))}
          </svg>

          {CALLOUTS.map((c, i) => (
            <div key={c.n}>
              <motion.span
                className="callouts__dot"
                style={{ left: `${c.p[0]}%`, top: `${c.p[1]}%` }}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20, delay: 1 + i * 0.25 } }}
                viewport={viewport}
              >
                {c.n}
              </motion.span>
              <motion.div
                className={`callouts__label callouts__label--${c.side}`}
                style={{ left: `${c.l[0]}%`, top: `${c.l[1]}%` }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT, delay: 1.9 + i * 0.25 } }}
                viewport={viewport}
              >
                <p className="kicker">
                  {c.n} / {t.callouts.items[i].title}
                </p>
              </motion.div>
            </div>
          ))}
          </motion.div>
        </div>

        <ol className="callouts__list">
          {CALLOUTS.map((c, i) => (
            <Reveal key={c.n} delay={i * 0.1} className="callouts__item">
              <span className="index">{c.n}</span>
              <div>
                <h3>{t.callouts.items[i].title}</h3>
                <p>{t.callouts.items[i].text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <p className="footnote">{t.callouts.footnote}</p>
      </div>
    </section>
  )
}

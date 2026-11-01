import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useI18n } from '../i18n'

function Word({ w, i, n, progress }: { w: string; i: number; n: number; progress: MotionValue<number> }) {
  const a = i / n
  const b = a + 1 / n
  const opacity = useTransform(progress, [a, b], [0.12, 1])
  const y = useTransform(progress, [a, b], ['0.25em', '0em'])
  return (
    <motion.span className="statement__word" style={{ opacity, y }}>
      {w}{' '}
    </motion.span>
  )
}

/** Scroll-driven statement: the signature line is written word by word as you read it. */
export function Statement() {
  const { t } = useI18n()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] })
  const line = useTransform(scrollYProgress, [0.1, 1], [0, 1])

  return (
    <section ref={ref} className="section section--carbon statement" aria-label={t.statement.join(' ')}>
      <div className="container">
        <p className="display statement__text">
          {t.statement.map((w, i) => (
            <Word key={i} w={w} i={i} n={t.statement.length} progress={scrollYProgress} />
          ))}
        </p>
        <motion.div className="statement__line" style={{ scaleX: line }} aria-hidden="true" />
      </div>
    </section>
  )
}

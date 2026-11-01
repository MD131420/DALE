import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { SectionHeading } from '../components/ui'
import { EASE_OUT } from '../motion/math'
import { useI18n } from '../i18n'
import type { Dict } from '../i18n/en'

const STAGE_COUNT = 4

type StageProps = { s: Dict['process']['stages'][number]; i: number; progress: MotionValue<number>; labels: Dict['process'] }

function Stage({ s, i, progress, labels }: StageProps) {
  const start = i / STAGE_COUNT
  // Each row "switches on" as the progress line reaches it.
  const on = useTransform(progress, [start, start + 0.08], [0, 1])
  const bg = useTransform(on, [0, 1], ['rgba(198,255,51,0)', 'rgba(198,255,51,1)'])
  const border = useTransform(on, [0, 1], ['rgba(6,5,4,.35)', 'rgba(198,255,51,1)'])
  return (
    <motion.li
      className="stage"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } }}
      viewport={{ once: true, amount: 0.5 }}
    >
      <motion.span className="stage__num" style={{ backgroundColor: bg, borderColor: border }}>
        {String(i + 1).padStart(2, '0')}
      </motion.span>
      <h3 className="stage__name">{s.name}</h3>
      <div className="stage__body">
        <p className="stage__scope">{s.scope}</p>
        <p className="stage__out">
          {labels.deliverable}: {s.output}
        </p>
      </div>
      <p className="stage__gate">
        <span>{labels.gate}</span>
        {s.gate}
      </p>
    </motion.li>
  )
}

/** Development process: four stages in rows; a Lime line tracks the reader through them. */
export function Process() {
  const { t } = useI18n()
  const listRef = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 55%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  return (
    <section className="section section--paper process">
      <div className="container">
        <SectionHeading
          tone="light"
          as="h1"
          index="01"
          label={t.process.label}
          title={t.process.title}
          intro={t.process.intro}
        />
        <ol ref={listRef} className="process__list">
          <span className="process__track" aria-hidden="true">
            <motion.span className="process__fill" style={{ scaleY: progress }} />
          </span>
          {t.process.stages.map((s, i) => (
            <Stage key={i} s={s} i={i} progress={progress} labels={t.process} />
          ))}
        </ol>
      </div>
    </section>
  )
}

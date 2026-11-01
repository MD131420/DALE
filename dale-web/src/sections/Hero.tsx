import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { PillButton } from '../components/ui'
import { BurnReveal } from '../motion/BurnReveal'
import { BRAND, EASE_OUT } from '../motion/math'
import { Lines, Reveal } from '../motion/Reveal'
import { useI18n } from '../i18n'

/** Product Platform B: illustration first (no text overlay), then the wide Carbon caption. */
export function Hero({ revealed }: { revealed: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const { t, lp } = useI18n()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  return (
    <section id="top" ref={ref} className="hero section--paper">
      <div className="container">
        <motion.div
          className="hero__frame"
          initial={{ clipPath: 'inset(6% 4% 6% 4% round 28px)' }}
          animate={revealed ? { clipPath: 'inset(0% 0% 0% 0% round 20px)', transition: { duration: 1.6, ease: EASE_OUT } } : undefined}
        >
          <motion.div className="hero__parallax" style={{ y: imgY, scale: imgScale }}>
            <BurnReveal
              src="/images/light-studio.webp"
              alt={t.hero.alt}
              cover={BRAND.paper}
              start={revealed}
              delay={150}
              duration={1100}
              className="hero__image"
            />
          </motion.div>
          <Reveal show={revealed} delay={1.1} y={8} className="hero__tag">
            {t.hero.tag}
          </Reveal>
        </motion.div>

        <motion.div
          className="hero__caption"
          initial={{ opacity: 0, y: 60 }}
          animate={revealed ? { opacity: 1, y: 0, transition: { duration: 1.2, ease: EASE_OUT, delay: 0.35 } } : undefined}
        >
          <div className="hero__title">
            <Reveal show={revealed} delay={0.6} y={10}>
              <p className="eyebrow">{t.hero.eyebrow}</p>
            </Reveal>
            <Lines as="h1" lines={t.hero.title} className="display display--hero" show={revealed} delay={0.7} stagger={0.12} />
          </div>
          <Reveal show={revealed} delay={0.95} className="hero__lead">
            <p>
              {t.hero.lead[0]}
              <br />
              {t.hero.lead[1]}
            </p>
          </Reveal>
          <Reveal show={revealed} delay={1.1} className="hero__cta">
            <PillButton href={lp('/contact')}>{t.hero.cta}</PillButton>
          </Reveal>
        </motion.div>
      </div>
    </section>
  )
}

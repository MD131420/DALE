import { motion } from 'motion/react'
import { SectionHeading } from '../components/ui'
import { EASE_OUT } from '../motion/math'
import { Reveal } from '../motion/Reveal'
import { useI18n } from '../i18n'

const viewport = { once: true, amount: 0.4 } as const

type Tile = { n: string; focus?: { x: number; y: number; zoom: number }; big?: boolean }

const TILES: Tile[] = [
  { n: '01', big: true },
  { n: '02', focus: { x: 33, y: 36, zoom: 3.2 } },
  { n: '03', focus: { x: 68, y: 58, zoom: 3 } },
]

/** Index square: Lime field, Carbon number — pops in after its frame is drawn. */
function Index({ n, big, delay }: { n: string; big?: boolean; delay: number }) {
  return (
    <motion.span
      className={`index ${big ? 'index--big' : ''}`}
      initial={{ scale: 0, rotate: -12 }}
      whileInView={{ scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 380, damping: 22, delay } }}
      viewport={viewport}
    >
      {n}
    </motion.span>
  )
}

function KeyTile({ tile, i, label }: { tile: Tile; i: number; label?: string }) {
  const f = tile.focus
  return (
    <motion.figure
      className={`kv__tile ${tile.big ? 'kv__tile--big' : ''}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 1, ease: EASE_OUT, delay: i * 0.15 } }}
      viewport={viewport}
    >
      <motion.img
        src="/images/light-studio.webp"
        alt=""
        draggable={false}
        style={f ? { transformOrigin: `${f.x}% ${f.y}%`, objectPosition: `${f.x}% ${f.y}%` } : undefined}
        initial={{ scale: f ? f.zoom * 0.82 : 1.12 }}
        whileInView={{ scale: f ? f.zoom : 1, transition: { duration: 2.2, ease: EASE_OUT, delay: i * 0.15 } }}
        viewport={viewport}
      />
      {/* Thin Lime frame that never covers the product — drawn as one stroke. */}
      {!tile.big && (
        <svg className="kv__frame" aria-hidden="true">
          <motion.rect
            x="1.5"
            y="1.5"
            rx="14"
            style={{ width: 'calc(100% - 3px)', height: 'calc(100% - 3px)' }}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1, transition: { duration: 1.6, ease: EASE_OUT, delay: 0.4 + i * 0.2 } }}
            viewport={viewport}
          />
        </svg>
      )}
      <figcaption>
        <Index n={tile.n} big={tile.big} delay={0.7 + i * 0.2} />
        {label && <span className="kv__label">{label}</span>}
      </figcaption>
    </motion.figure>
  )
}

/** Key Visual / Focus C3.2 — product and details first; Lime orders composition and indices. */
export function About() {
  const { t } = useI18n()
  return (
    <section className="section section--carbon about">
      <div className="container">
        <div className="about__head">
          <SectionHeading
            as="h1"
            index="01"
            label={t.about.label}
            title={t.about.title}
          />
          <Reveal delay={0.2} className="about__copy">
            <p>{t.about.p1}</p>
            <p className="muted">{t.about.p2}</p>
          </Reveal>
        </div>

        <div className="kv">
          <KeyTile tile={TILES[0]} i={0} label={t.about.overview} />
          <div className="kv__side">
            <KeyTile tile={TILES[1]} i={1} />
            <KeyTile tile={TILES[2]} i={2} />
          </div>
        </div>

        <motion.div
          className="kv__line"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1, transition: { duration: 1.6, ease: EASE_OUT } }}
          viewport={viewport}
          aria-hidden="true"
        />

        <div className="kv__foot">
          <div className="kv__points">
            {t.about.points.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.1} className="kv__point">
                <p className="kicker">{t}</p>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
          <motion.div
            className="kv__card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0, transition: { duration: 1, ease: EASE_OUT, delay: 0.3 } }}
            viewport={viewport}
          >
            <p className="kv__card-kicker">{t.about.cardKicker}</p>
            <p className="kv__card-text">
              {t.about.cardText[0]}
              <br />
              {t.about.cardText[1]}
            </p>
            <p className="kv__card-meta">{t.about.cardMeta}</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

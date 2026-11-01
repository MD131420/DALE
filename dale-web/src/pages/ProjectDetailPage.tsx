import { useEffect, useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Link, useParams, useSearchParams } from 'react-router'
import { CtaBand, NextPage } from '../components/PageLinks'
import { LimeBar, PillButton } from '../components/ui'
import { useI18n } from '../i18n'
import { BurnReveal } from '../motion/BurnReveal'
import { EASE_OUT, prefersReducedMotion } from '../motion/math'
import { Lines, Reveal } from '../motion/Reveal'
import { mediaSrcSet, mediaUrl, paragraphs, pick, useProject, videoUrl } from '../projects/api'

export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const preview = params.has('preview')
  const { t, lang, lp } = useI18n()
  const { data: p, error, missing } = useProject(slug, preview)
  const title = p ? pick(p.title, lang) : ''

  useEffect(() => {
    document.title = title ? `${title} — DALE` : missing ? t.meta.notFound : t.meta.titles['/projects']
  }, [title, missing, t])

  if (missing || error) {
    return (
      <section className="section section--carbon not-found">
        <div className="container">
          <p className="kicker">{t.projects.label}</p>
          <p className="display display--section project__missing">{missing ? t.projects.notFound : t.projects.error}</p>
          <div className="not-found__cta">
            <PillButton href={lp('/projects')}>{t.projects.all}</PillButton>
          </div>
        </div>
      </section>
    )
  }
  if (!p) return <section className="section section--carbon project__loading" aria-busy="true" />

  const category = pick(p.category, lang)
  const summary = pick(p.summary, lang)
  const body = paragraphs(pick(p.body, lang))
  const cover = p.cover ? p.media[p.cover] : null
  const facts = [
    [t.projects.client, p.client],
    [t.projects.year, p.year],
    [t.projects.category, category],
  ].filter(([, v]) => v)

  return (
    <article className="project">
      {preview && <p className="project__preview">{t.projects.preview}</p>}
      <section className="section section--carbon project__head">
        <div className="container">
          <Reveal y={10}>
            <Link to={lp('/projects')} className="project__back">
              <span aria-hidden="true">←</span> {t.projects.all}
            </Link>
          </Reveal>
          <LimeBar />
          <Lines as="h1" lines={[title]} className="display display--section project__title" delay={0.1} />
          <div className="project__intro">
            {summary && (
              <Reveal delay={0.25}>
                <p className="project__summary">{summary}</p>
              </Reveal>
            )}
            {facts.length > 0 && (
              <Reveal delay={0.35}>
                <dl className="project__facts">
                  {facts.map(([k, v]) => (
                    <div key={k}>
                      <dt className="kicker">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {p.cover && cover && (
        <div className="container">
          <div className="project__cover" style={{ aspectRatio: `${cover.w} / ${cover.h}` }}>
            <BurnReveal src={mediaUrl(p.cover, 'xl')} alt={title} start delay={300} duration={1200} className="project__cover-img" />
          </div>
        </div>
      )}

      {body.length > 0 && (
        <section className="section section--carbon project__body">
          <div className="container project__body-grid">
            <Reveal y={10}>
              <p className="kicker">DALE / {category || t.projects.label}</p>
            </Reveal>
            <div className="project__text">
              {body.map((para, i) => (
                <Reveal key={i} delay={Math.min(i, 3) * 0.06}>
                  <p>{para}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {p.gallery.length > 0 && (
        <section className="section section--carbon project__gallery">
          <div className="container">
            <p className="kicker project__gallery-label">{t.projects.gallery}</p>
            <ul className="gallery">
              {p.gallery.map((g, i) => {
                const m = p.media[g.id]
                const caption = pick(g.caption, lang)
                const wide = m ? m.w / m.h > 1.6 : false
                return (
                  <motion.li
                    key={g.id + i}
                    className={wide ? 'gallery__item gallery__item--wide' : 'gallery__item'}
                    initial={{ opacity: 0, y: 40, clipPath: 'inset(8% 0% 0% 0% round 20px)' }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                      clipPath: 'inset(0% 0% 0% 0% round 20px)',
                      transition: { duration: 1.1, ease: EASE_OUT, delay: (i % 2) * 0.08 },
                    }}
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    <figure>
                      {m?.kind === 'video' ? (
                        <GalleryVideo
                          src={videoUrl(g.id)}
                          poster={m.poster ? mediaUrl(m.poster, 'xl') : undefined}
                          width={m.w}
                          height={m.h}
                          autoplay={!!g.autoplay}
                          label={caption || title}
                        />
                      ) : (
                      <img
                        src={mediaUrl(g.id, 'md')}
                        srcSet={mediaSrcSet(g.id)}
                        sizes={wide ? '(max-width: 1600px) 100vw, 1600px' : '(max-width: 767px) 100vw, 50vw'}
                        width={m?.w}
                        height={m?.h}
                        alt={caption || title}
                        loading="lazy"
                        draggable={false}
                      />
                      )}
                      {caption && <figcaption>{caption}</figcaption>}
                    </figure>
                  </motion.li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      <NextPage current="/projects" />
      <CtaBand />
    </article>
  )
}

/**
 * Gallery video. Autoplay clips run muted in a loop only while on screen (saves battery and data);
 * with reduced motion, or when autoplay is off, the visitor gets normal controls.
 */
function GalleryVideo({
  src,
  poster,
  width,
  height,
  autoplay,
  label,
}: {
  src: string
  poster?: string
  width: number
  height: number
  autoplay: boolean
  label: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const loop = autoplay && !prefersReducedMotion()
  const inView = useInView(ref, { amount: 0.3 })
  useEffect(() => {
    const v = ref.current
    if (!loop || !v) return
    if (inView) v.play().catch(() => {})
    else v.pause()
  }, [loop, inView])
  return (
    <video
      ref={ref}
      className="gallery__video"
      src={src}
      poster={poster}
      width={width}
      height={height}
      aria-label={label}
      playsInline
      preload={loop ? 'auto' : 'metadata'}
      {...(loop ? { muted: true, loop: true } : { controls: true })}
    />
  )
}

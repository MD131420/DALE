import { motion } from 'motion/react'
import { Link } from 'react-router'
import { CtaBand, NextPage } from '../components/PageLinks'
import { SectionHeading } from '../components/ui'
import { useI18n } from '../i18n'
import { EASE_OUT } from '../motion/math'
import { Lines, Reveal } from '../motion/Reveal'
import { mediaSrcSet, mediaUrl, pick, useProjects, type Project } from '../projects/api'

export function ProjectsPage() {
  const { t } = useI18n()
  const { data, error } = useProjects()

  return (
    <>
      <section className="section section--carbon projects">
        <div className="container">
          <SectionHeading as="h1" index="01" label={t.projects.label} title={t.projects.title} intro={t.projects.intro} />
          {!data && !error && <p className="projects__status">{t.projects.loading}</p>}
          {error && <p className="projects__status">{t.projects.error}</p>}
          {data?.length === 0 && (
            <div className="projects__empty">
              <Lines lines={t.projects.emptyTitle} className="display projects__empty-title" />
              <Reveal delay={0.2}>
                <p>{t.projects.emptyText}</p>
              </Reveal>
            </div>
          )}
          {!!data?.length && (
            <ul className="projects__grid">
              {data.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </ul>
          )}
        </div>
      </section>
      {data?.length === 0 ? <CtaBand /> : <NextPage current="/projects" />}
    </>
  )
}

function ProjectCard({ project: p, index }: { project: Project; index: number }) {
  const { t, lang, lp } = useI18n()
  const title = pick(p.title, lang)
  const meta = [pick(p.category, lang), p.year].filter(Boolean).join(' / ')
  const wide = index === 0
  return (
    <motion.li
      className={wide ? 'projects__item projects__item--wide' : 'projects__item'}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 1, ease: EASE_OUT, delay: (index % 2) * 0.1 } }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <Link to={lp(`/projects/${p.slug}`)} className="project-card">
        <span className="project-card__media">
          {p.cover ? (
            <img
              src={mediaUrl(p.cover, 'md')}
              srcSet={mediaSrcSet(p.cover)}
              sizes={wide ? '(max-width: 1600px) 100vw, 1600px' : '(max-width: 767px) 100vw, 50vw'}
              alt=""
              loading={index < 3 ? 'eager' : 'lazy'}
              draggable={false}
            />
          ) : (
            <span className="project-card__placeholder" aria-hidden="true" />
          )}
        </span>
        <span className="project-card__body">
          <span className="project-card__text">
            {meta && <span className="kicker project-card__meta">{meta}</span>}
            <span className="display project-card__title">{title}</span>
            {pick(p.summary, lang) && <span className="project-card__summary">{pick(p.summary, lang)}</span>}
          </span>
          <span className="project-card__more">
            <span>{t.projects.view}</span>
            <span aria-hidden="true">→</span>
          </span>
        </span>
      </Link>
    </motion.li>
  )
}

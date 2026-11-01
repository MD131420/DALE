import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { EASE_OUT } from '../motion/math'
import { Lines, Reveal } from '../motion/Reveal'

export type IconId =
  | '01_requirements'
  | '02_design'
  | '03_engineering'
  | '04_3d_printing'
  | '05_validation'
  | '06_production'
  | '07_simulations'
  | '08_optimization'
  | '09_assembly'
  | '10_documentation'
  | '11_presentation'
  | '12_supplier_sourcing'
  | '13_strategy_goals'
  | '14_vr_technology'
  | '15_injection_mould'
  | '16_strategy_target'

/** Approved icon set v12. Must sit inside an element with `.dale-icon-trigger`. */
export function Icon({ id, className = '' }: { id: IconId; className?: string }) {
  return (
    <svg className={`dale-icon ${className}`} aria-hidden="true">
      <use href={`/icons/dale-icons-sprite.svg#dale-${id}`} />
    </svg>
  )
}

type ButtonProps = { href: string; children: ReactNode; variant?: 'lime' | 'carbon' }

/** Pill CTA from the Product Platform mock-up: Carbon on Lime, "+" on the right. Internal paths use the router. */
export function PillButton({ href, children, variant = 'lime' }: ButtonProps) {
  const inner = (
    <>
      <span className="pill__label">{children}</span>
      <span className="pill__plus" aria-hidden="true">
        +
      </span>
    </>
  )
  const className = `pill pill--${variant}`
  return href.startsWith('/') ? (
    <Link to={href} className={className}>
      {inner}
    </Link>
  ) : (
    <a href={href} className={className}>
      {inner}
    </a>
  )
}

/** Short Lime bar above section titles (brandbook header bar, 52 × 6 at 1600 px). */
export function LimeBar({ show }: { show?: boolean }) {
  const target = { scaleX: 1, transition: { duration: 0.9, ease: EASE_OUT } }
  return (
    <motion.span
      className="lime-bar"
      initial={{ scaleX: 0 }}
      {...(show === undefined ? { whileInView: target, viewport: { once: true } } : { animate: show ? target : undefined })}
      aria-hidden="true"
    />
  )
}

type HeadingProps = {
  index: string
  label: string
  title: ReactNode[]
  intro?: ReactNode
  tone?: 'dark' | 'light'
  /** The first heading of a page is its h1. */
  as?: 'h1' | 'h2'
}

export function SectionHeading({ index, label, title, intro, tone = 'dark', as = 'h2' }: HeadingProps) {
  return (
    <header className={`section-heading section-heading--${tone}`}>
      <LimeBar />
      <Reveal y={12}>
        <p className="kicker">
          {index} / {label}
        </p>
      </Reveal>
      <Lines as={as} lines={title} className="display display--section" />
      {intro && (
        <Reveal delay={0.15}>
          <p className="section-heading__intro">{intro}</p>
        </Reveal>
      )}
    </header>
  )
}

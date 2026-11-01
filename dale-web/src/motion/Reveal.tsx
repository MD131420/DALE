import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE_OUT } from './math'

const viewport = { once: true, amount: 0.35 } as const

type RevealProps = HTMLMotionProps<'div'> & { delay?: number; y?: number; show?: boolean }

/** Fade + rise on scroll. Pass `show` to drive it manually (e.g. after the intro). */
export function Reveal({ delay = 0, y = 28, show, children, ...rest }: RevealProps) {
  const target = { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT, delay } }
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      {...(show === undefined ? { whileInView: target, viewport } : { animate: show ? target : undefined })}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

type LinesProps = {
  lines: ReactNode[]
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  delay?: number
  stagger?: number
  show?: boolean
}

/** Domus headlines: each line slides up out of its own mask. */
export function Lines({ lines, as = 'h2', className, delay = 0, stagger = 0.09, show }: LinesProps) {
  const Tag = motion[as]
  const parent = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }
  const child = {
    hidden: { y: '110%' },
    show: { y: '0%', transition: { duration: 1.1, ease: EASE_OUT } },
  }
  return (
    <Tag
      className={className}
      variants={parent}
      initial="hidden"
      {...(show === undefined ? { whileInView: 'show', viewport } : { animate: show ? 'show' : 'hidden' })}
    >
      {lines.map((line, i) => (
        <span key={i} className="line-mask">
          <motion.span className="line-mask__inner" variants={child}>
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/** Hairline that draws itself from the left. */
export function Rule({ className = '', delay = 0, show }: { className?: string; delay?: number; show?: boolean }) {
  const target = { scaleX: 1, transition: { duration: 1.4, ease: EASE_OUT, delay } }
  return (
    <motion.div
      className={`rule ${className}`}
      initial={{ scaleX: 0 }}
      {...(show === undefined ? { whileInView: target, viewport } : { animate: show ? target : undefined })}
      style={{ transformOrigin: '0 50%' }}
      aria-hidden="true"
    />
  )
}

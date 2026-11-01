import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useLocation } from 'react-router'
import { EASE_OUT } from './math'

export const CURTAIN_COVER_S = 0.5

/**
 * Page transition in the spirit of "Lime Cut": a slanted Lime blade followed by Carbon
 * sweeps across under the header, the page swaps while covered, then the sweep exits right.
 */
export function PageCurtain() {
  const { pathname } = useLocation()
  const first = useRef(true)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setRun((r) => r + 1)
  }, [pathname])

  if (!run) return null
  const sweep = {
    x: ['-130%', '0%', '0%', '130%'],
    transition: { duration: 1.25, times: [0, 0.4, 0.56, 1], ease: [EASE_OUT, 'linear', [0.7, 0, 0.84, 0]] as never },
  }
  return (
    <div className="curtain" aria-hidden="true" key={run}>
      <motion.div className="curtain__blade curtain__blade--lime" initial={{ x: '-130%' }} animate={sweep} />
      <motion.div
        className="curtain__blade curtain__blade--carbon"
        initial={{ x: '-130%' }}
        animate={{ ...sweep, transition: { ...sweep.transition, delay: 0.06 } }}
      />
    </div>
  )
}

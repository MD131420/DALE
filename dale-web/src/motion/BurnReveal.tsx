import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useInView } from 'motion/react'
import { BRAND, clamp, drawSpot, noise, phase, prefersReducedMotion } from './math'

type Props = {
  src: string
  alt: string
  /** Colour the image is burnt out of — match the section background. */
  cover?: string
  /** Start immediately when true; otherwise starts when scrolled into view. */
  start?: boolean
  delay?: number
  duration?: number
  className?: string
  imgClassName?: string
  imgStyle?: CSSProperties
}

/**
 * "Microimpulses" (DALE_Motion_Approved_v7/02) applied to imagery:
 * the cover is burnt away dot by dot from right to left, with the warm leading spark.
 */
export function BurnReveal({
  src,
  alt,
  cover = BRAND.carbon,
  start,
  delay = 0,
  duration = 1000,
  className = '',
  imgClassName = '',
  imgStyle,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const maskRef = useRef<HTMLCanvasElement>(null)
  const heatRef = useRef<HTMLCanvasElement>(null)
  const inView = useInView(wrapRef, { once: true, amount: 0.3 })
  const go = start ?? inView
  const [done, setDone] = useState(() => prefersReducedMotion())
  const startedRef = useRef(false)

  // Keep the cover solid (and sized) until the burn starts.
  useEffect(() => {
    if (done) return
    const wrap = wrapRef.current!
    const fill = () => {
      // Canvases are gone once the burn is done (or the page is leaving).
      if (startedRef.current || !maskRef.current || !heatRef.current) return
      const { width, height } = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (const c of [maskRef.current!, heatRef.current!]) {
        c.width = Math.max(1, Math.round(width * dpr))
        c.height = Math.max(1, Math.round(height * dpr))
      }
      const m = maskRef.current!.getContext('2d')!
      m.setTransform(dpr, 0, 0, dpr, 0, 0)
      m.fillStyle = cover
      m.fillRect(0, 0, width, height)
    }
    fill()
    const ro = new ResizeObserver(fill)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [cover, done])

  useEffect(() => {
    if (!go || done || startedRef.current) return
    const timer = window.setTimeout(() => {
      if (!maskRef.current || !heatRef.current || !wrapRef.current) return
      startedRef.current = true
      const wrap = wrapRef.current
      const { width: w, height: h } = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const mask = maskRef.current!.getContext('2d')!
      const heat = heatRef.current!.getContext('2d')!
      heat.setTransform(dpr, 0, 0, dpr, 0, 0)
      mask.setTransform(dpr, 0, 0, dpr, 0, 0)
      mask.globalCompositeOperation = 'destination-out'

      const step = Math.max(9, w / 140)
      const r = step * 0.72
      const pts: { x: number; y: number; o: number }[] = []
      for (let x = w + step; x >= -step; x -= step)
        for (let y = -step / 2; y <= h + step; y += step) {
          const n = noise(Math.round(x), Math.round(y))
          pts.push({ x: x + (n - 0.5) * step * 0.3, y: y + (n - 0.5) * step * 0.3, o: (w - x) / w + n * 0.035 })
        }
      pts.sort((a, b) => a.o - b.o)

      const light = cover.toUpperCase() !== BRAND.carbon
      let drawn = 0
      const t0 = performance.now()
      const frame = (now: number) => {
        const p = phase(now - t0, 0, duration)
        const n = Math.floor(p * pts.length)
        for (; drawn < n; drawn++) {
          mask.beginPath()
          mask.arc(pts[drawn].x, pts[drawn].y, r, 0, Math.PI * 2)
          mask.fill()
        }
        heat.clearRect(0, 0, w, h)
        const recent = 90
        for (let i = Math.max(0, n - recent); i < n; i++) {
          const a = clamp((i - n + recent) / recent)
          heat.globalAlpha = a * (light ? 0.55 : 0.9)
          heat.fillStyle = a > 0.5 ? (light ? '#FF9F64' : BRAND.heat) : BRAND.white
          heat.beginPath()
          heat.arc(pts[i].x, pts[i].y, r * 0.55, 0, Math.PI * 2)
          heat.fill()
        }
        heat.globalAlpha = 1
        if (n > 0 && p < 1) drawSpot(heat, pts[n - 1].x, pts[n - 1].y, step * 4, step * 0.45)
        if (p < 1) requestAnimationFrame(frame)
        else setDone(true)
      }
      requestAnimationFrame(frame)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [go, done, delay, duration, cover])

  return (
    <div ref={wrapRef} className={`burn ${className}`}>
      <img src={src} alt={alt} className={imgClassName} style={imgStyle} draggable={false} />
      {!done && (
        <>
          <canvas ref={maskRef} className="burn__layer" aria-hidden="true" />
          <canvas ref={heatRef} className="burn__layer" aria-hidden="true" />
        </>
      )}
    </div>
  )
}

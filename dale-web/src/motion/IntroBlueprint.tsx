import { useEffect, useRef } from 'react'
import { CONTOUR_PARTS, LOGO_ORIGIN, LOGO_PATHS, PRIMARY_WIDTH, SIGNATURE_WIDTH } from '../brand/logoPaths'
import type { LogoVariant } from '../brand/Logo'
import { BRAND, clamp, drawSpot, ease, lerp, noise, phase, smooth } from './math'

/**
 * Full-screen adaptation of the approved "Blueprint to Object" (DALE_Motion_Approved_v7/01)
 * with the "Microimpulses" burn (study 5, 1.0 s, right to left).
 * The final compact phase lands the mark exactly on the live header logo,
 * while the Carbon backdrop dissolves into the page.
 *
 * Timeline (ms) — same as the approved source:
 *   drafting guides 100–1370 · contour trace 1550–3600 · micro-impulses 3850–4850
 *   outline fade 4900–5400 · compact into header 5250–6400 · signature 5900–6950
 */
const T = {
  trace: [1550, 3600],
  burn: [3850, 4850],
  outlineFade: [4900, 5400],
  guideFade: [5000, 5600],
  compact: [5250, 6400],
  backdrop: [5350, 6550],
  signature: [5900, 6950],
  reveal: 5450,
  end: 7000,
  skipTo: 5000,
} as const

// Stage label switch times (ms); names come from the dictionary.
const STAGE_AT = [0, 1500, 3750, 4900]

export type IntroTarget = { rect: DOMRect; variant: LogoVariant }

type Props = {
  labels: { kicker: string; stages: string[]; skip: string }
  getTarget: () => IntroTarget | null
  onReveal: () => void
  onDone: () => void
}

type Pulse = { x: number; y: number }

function buildPulses(): Pulse[] {
  const list: (Pulse & { order: number })[] = []
  for (let x = 2560; x >= 360; x -= 13)
    for (let y = 418; y <= 1032; y += 13) {
      const n = noise(x, y)
      list.push({ x: x + (n - 0.5) * 4, y: y + (n - 0.5) * 4, order: (2560 - x) / 2200 + n * 0.035 })
    }
  return list.sort((a, b) => a.order - b.order)
}

export function IntroBlueprint({ labels, getTarget, onReveal, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const stageNumRef = useRef<HTMLSpanElement>(null)
  const stageNameRef = useRef<HTMLSpanElement>(null)
  const skipRef = useRef<() => void>(() => {})
  const cb = useRef({ getTarget, onReveal, onDone, labels })
  cb.current = { getTarget, onReveal, onDone, labels }

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const paths = LOGO_PATHS.map((d) => new Path2D(d))
    const mark = new Path2D()
    for (let i = 0; i < 4; i++) mark.addPath(paths[i])
    const contours = CONTOUR_PARTS.map((p) => ({ path: new Path2D(p.d), length: p.length }))
    const contourLength = contours.reduce((n, p) => n + p.length, 0)
    const pulses = buildPulses()

    let vw = 0
    let vh = 0
    let dpr = 1
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      vw = window.innerWidth
      vh = window.innerHeight
      canvas.width = Math.round(vw * dpr)
      canvas.height = Math.round(vh * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const inLogoSpace = (x: number, y: number, s: number, fn: () => void) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(s, s)
      ctx.translate(-LOGO_ORIGIN.x, -LOGO_ORIGIN.y)
      fn()
      ctx.restore()
    }

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, vw, vh)

      // Carbon backdrop dissolves to reveal the page underneath.
      ctx.globalAlpha = 1 - smooth(phase(t, T.backdrop[0], T.backdrop[1]))
      ctx.fillStyle = BRAND.carbon
      ctx.fillRect(0, 0, vw, vh)
      ctx.globalAlpha = 1

      // Hero placement: the primary mark, centred.
      const heroW = vw < 700 ? vw * 0.74 : Math.min(vw * 0.56, 1080)
      const heroS = heroW / PRIMARY_WIDTH
      const heroH = 614 * heroS
      const heroX = (vw - heroW) / 2
      const heroY = (vh - heroH) / 2

      // Landing placement: the real header logo.
      const target = cb.current.getTarget()
      let tx = heroX
      let ty = heroY
      let ts = heroS
      if (target) {
        ts = target.rect.width / (target.variant === 'signature' ? SIGNATURE_WIDTH : PRIMARY_WIDTH)
        tx = target.rect.left
        ty = target.rect.top
      }

      const compact = ease(phase(t, T.compact[0], T.compact[1]))
      const x = lerp(heroX, tx, compact)
      const y = lerp(heroY, ty, compact)
      const s = lerp(heroS, ts, compact)

      // Four drafting strokes overshoot the corners, as in a technical drawing.
      const k = heroW / 1020
      const ex = 110 * k
      const ey = 90 * k
      const l = heroX
      const r = heroX + heroW
      const top = heroY
      const bot = heroY + heroH
      const guides = [
        [l - ex, top, r + ex, top],
        [r, top - ey, r, bot + ey],
        [r + ex, bot, l - ex, bot],
        [l, bot + ey, l, top - ey],
      ]
      const guideAlpha = 0.65 * (1 - smooth(phase(t, T.guideFade[0], T.guideFade[1])))
      if (guideAlpha > 0) {
        ctx.globalAlpha = guideAlpha
        ctx.strokeStyle = BRAND.line
        ctx.lineWidth = 1.2
        guides.forEach((g, i) => {
          const p = phase(t, 100 + i * 310, 440 + i * 310)
          if (p <= 0) return
          ctx.beginPath()
          ctx.moveTo(g[0], g[1])
          ctx.lineTo(lerp(g[0], g[2], p), lerp(g[1], g[3], p))
          ctx.stroke()
        })
        // Small Lime registration ticks at the corners.
        const tick = phase(t, 1300, 1700)
        if (tick > 0) {
          ctx.strokeStyle = BRAND.lime
          ctx.globalAlpha = guideAlpha * tick
          const c = 10 * Math.max(k, 0.6)
          for (const [cx, cy] of [
            [l, top],
            [r, top],
            [l, bot],
            [r, bot],
          ]) {
            ctx.beginPath()
            ctx.moveTo(cx - c, cy)
            ctx.lineTo(cx + c, cy)
            ctx.moveTo(cx, cy - c)
            ctx.lineTo(cx, cy + c)
            ctx.stroke()
          }
        }
        ctx.globalAlpha = 1
      }

      inLogoSpace(x, y, s, () => {
        // Each real contour is traced by its measured length.
        let remaining = phase(t, T.trace[0], T.trace[1]) * contourLength
        const outlineAlpha = 1 - smooth(phase(t, T.outlineFade[0], T.outlineFade[1]))
        if (remaining > 0 && outlineAlpha > 0) {
          ctx.strokeStyle = BRAND.lime
          ctx.lineWidth = 1.8 / s
          ctx.lineJoin = 'round'
          ctx.globalAlpha = outlineAlpha
          for (const part of contours) {
            if (remaining <= 0) break
            const len = Math.min(part.length, remaining)
            ctx.setLineDash(len >= part.length - 0.01 ? [] : [len, part.length + 32])
            ctx.stroke(part.path)
            remaining -= part.length
          }
          ctx.setLineDash([])
          ctx.globalAlpha = 1
        }

        // Micro-impulses: the mark is burnt in from right to left.
        const burn = phase(t, T.burn[0], T.burn[1])
        if (burn >= 1) {
          ctx.fillStyle = BRAND.white
          for (let i = 0; i < 4; i++) ctx.fill(paths[i])
        } else if (burn > 0) {
          const n = Math.floor(burn * pulses.length)
          const recent = 70
          ctx.save()
          ctx.clip(mark)
          for (let i = 0; i < n; i++) {
            const q = pulses[i]
            ctx.fillStyle = clamp((i - n + recent) / recent) > 0.5 ? BRAND.heat : BRAND.white
            ctx.beginPath()
            ctx.arc(q.x, q.y, 8.8, 0, Math.PI * 2)
            ctx.fill()
          }
          if (n > 0) drawSpot(ctx, pulses[n - 1].x, pulses[n - 1].y, 43, 5)
          ctx.restore()
        }
      })

      // Signature lines appear only where the header carries the full signature.
      if (target?.variant === 'signature') {
        const a = ease(phase(t, T.signature[0], T.signature[1]))
        if (a > 0)
          inLogoSpace(tx, ty, ts, () => {
            ctx.globalAlpha = a
            ctx.fillStyle = BRAND.white
            for (let i = 4; i < paths.length; i++) ctx.fill(paths[i])
            ctx.globalAlpha = 1
          })
      }

      // DOM chrome: stage label + skip.
      const chrome = chromeRef.current
      if (chrome) chrome.style.opacity = String(phase(t, 0, 500) * (1 - smooth(phase(t, 5000, 5600))))
      let stage = 0
      STAGE_AT.forEach((at, i) => {
        if (t >= at) stage = i
      })
      const num = `0${stage + 1}`
      if (stageNumRef.current && stageNumRef.current.textContent !== num) {
        stageNumRef.current.textContent = num
        stageNameRef.current!.textContent = cb.current.labels.stages[stage]
      }
    }

    let start = performance.now()
    let raf = 0
    let revealed = false
    const frame = (now: number) => {
      const t = now - start
      draw(t)
      if (!revealed && t >= T.reveal) {
        revealed = true
        cb.current.onReveal()
      }
      if (t >= T.end) {
        cb.current.onDone()
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // Any intent to move on fast-forwards to the hand-off (never cuts it).
    const skip = () => {
      const now = performance.now()
      if (now - start < T.skipTo) start = now - T.skipTo
    }
    skipRef.current = skip
    const onKey = (e: KeyboardEvent) => {
      if (['Escape', 'Enter', ' ', 'ArrowDown', 'PageDown'].includes(e.key)) skip()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchmove', skip, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchmove', skip)
    }
  }, [])

  return (
    <div className="intro" aria-hidden="true">
      <canvas ref={canvasRef} className="intro__canvas" />
      <div ref={chromeRef} className="intro__chrome">
        <span className="intro__kicker">{labels.kicker}</span>
        <span className="intro__stage">
          <span ref={stageNumRef} className="intro__num">
            01
          </span>
          <span ref={stageNameRef} className="intro__name">
            {labels.stages[0]}
          </span>
        </span>
        <button type="button" className="intro__skip" onClick={() => skipRef.current()} tabIndex={-1}>
          {labels.skip}
        </button>
      </div>
    </div>
  )
}

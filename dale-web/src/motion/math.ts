// Easing helpers shared with the approved DALE motion sources (v7).
export const clamp = (x: number) => Math.max(0, Math.min(1, x))
export const phase = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
export const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 4)
export const smooth = (x: number) => {
  x = clamp(x)
  return x * x * (3 - 2 * x)
}
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p

export const BRAND = {
  carbon: '#060504',
  paper: '#EFEEEE',
  lime: '#C6FF33',
  white: '#FFFFFF',
  line: '#969DA1',
  heat: '#FFDAA3',
} as const

/** Cubic-bezier used for UI motion: fast start, long soft landing (matches `ease` above). */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Warm micro-impulse glow from the approved burn study. */
export function drawSpot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, core: number) {
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r)
  glow.addColorStop(0, 'rgba(255,255,255,1)')
  glow.addColorStop(0.16, 'rgba(255,233,201,.85)')
  glow.addColorStop(0.48, 'rgba(255,159,100,.32)')
  glow.addColorStop(1, 'rgba(255,120,70,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = BRAND.white
  ctx.beginPath()
  ctx.arc(x, y, core, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Deterministic noise used for the pulse order (same formula as the source). */
export const noise = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

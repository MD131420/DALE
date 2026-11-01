import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto'

const scrypt = (password: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  )

// scrypt (memory-hard). Stored as: scrypt$N$r$p$salt$hash (base64url).
const N = 2 ** 15
const R = 8
const P = 1
const KEYLEN = 64
const MAXMEM = 128 * N * R * 2

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM })
  return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$')
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, n, r, p, salt, hash] = stored.split('$')
  if (alg !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const key = await scrypt(password.normalize('NFKC'), Buffer.from(salt, 'base64url'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * Number(n) * Number(r) * 2,
  })
  return timingSafeEqual(key, expected)
}

// Used for unknown logins so the response time does not reveal which accounts exist.
let dummyHash: Promise<string> | null = null
export const getDummyHash = () => (dummyHash ??= hashPassword(randomBytes(16).toString('hex')))

export const newToken = (bytes = 32) => randomBytes(bytes).toString('base64url')
export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

const COMMON = ['password', 'haslo', 'hasło', 'qwerty', 'qwertyuiop', 'asdfgh', 'admin', 'administrator', 'dale', 'letmein', 'zaq', 'passwort', 'welcome']

/** Returns a Polish error message, or null when the password is acceptable. */
export function passwordProblem(password: string, username: string) {
  if (password.length < 12) return 'Hasło musi mieć co najmniej 12 znaków.'
  if (password.length > 200) return 'Hasło może mieć najwyżej 200 znaków.'
  const lower = password.toLowerCase()
  if (username && lower.includes(username.toLowerCase())) return 'Hasło nie może zawierać loginu.'
  if (new Set(password).size < 5) return 'Hasło jest zbyt powtarzalne.'
  const letters = lower.replace(/[^a-ząćęłńóśźż]/g, '')
  if (COMMON.some((w) => letters === w || letters === w.repeat(2))) return 'To hasło jest zbyt popularne.'
  return null
}

type Entry = { fails: number; first: number; lockedUntil: number; locks: number }

/**
 * Brute-force protection for the login form, per IP and per login.
 * After `max` failures inside `windowMs` the key is locked; every next lock lasts twice as long.
 */
export class Throttle {
  private map = new Map<string, Entry>()
  private max: number
  private windowMs: number
  private baseLockMs: number
  private maxLockMs: number
  constructor(max: number, windowMs: number, baseLockMs: number, maxLockMs: number) {
    this.max = max
    this.windowMs = windowMs
    this.baseLockMs = baseLockMs
    this.maxLockMs = maxLockMs
  }

  /** Milliseconds until the key may try again (0 = allowed). */
  retryIn(key: string, now = Date.now()) {
    const e = this.map.get(key)
    return e && e.lockedUntil > now ? e.lockedUntil - now : 0
  }

  fail(key: string, now = Date.now()) {
    let e = this.map.get(key)
    if (!e || now - e.first > this.windowMs) {
      e = { fails: 0, first: now, lockedUntil: 0, locks: e?.locks ?? 0 }
      this.map.set(key, e)
    }
    e.fails++
    if (e.fails >= this.max) {
      e.lockedUntil = now + Math.min(this.baseLockMs * 2 ** e.locks, this.maxLockMs)
      e.locks++
      e.fails = 0
      e.first = now
    }
    if (this.map.size > 10_000) this.prune(now)
  }

  success(key: string) {
    this.map.delete(key)
  }

  private prune(now: number) {
    for (const [k, e] of this.map) if (e.lockedUntil < now && now - e.first > this.windowMs) this.map.delete(k)
  }
}

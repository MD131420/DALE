import type Lenis from 'lenis'

export const NAV = [
  { path: '/about', key: 'about' },
  { path: '/services', key: 'services' },
  { path: '/projects', key: 'projects' },
  { path: '/process', key: 'process' },
  { path: '/contact', key: 'contact' },
] as const

export const CONTACT = {
  name: 'Piotr Dalewski',
  email: 'piotr@dale.com',
  web: 'dale.com',
  url: 'https://dale.com',
  // Phone from the brandbook is a placeholder (+48 573 826 419) — add the real number before publishing.
  phone: null as string | null,
}

let lenis: Lenis | null = null
export const setLenis = (l: Lenis | null) => {
  lenis = l
}
export const getLenis = () => lenis

export const scrollTop = () => {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  window.scrollTo(0, 0)
}

import { createContext, useContext, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { de } from './de'
import { en, type Dict } from './en'
import { pl } from './pl'

export type Lang = 'en' | 'pl' | 'de'

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pl', label: 'Polski', short: 'PL' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
]

const DICTS: Record<Lang, Dict> = { en, pl, de }

/** English lives at the root (/about); other languages are prefixed (/pl/about, /de/about). */
export const PREFIXES = ['', '/pl', '/de'] as const

export const langFromPath = (pathname: string): Lang => {
  const seg = pathname.split('/')[1]
  return seg === 'pl' || seg === 'de' ? seg : 'en'
}

/** '/pl/about' → '/about', '/de' → '/' */
export const stripLang = (pathname: string) => {
  const lang = langFromPath(pathname)
  if (lang === 'en') return pathname || '/'
  return pathname.slice(lang.length + 1) || '/'
}

export const withLang = (lang: Lang, path: string) => (lang === 'en' ? path : `/${lang}${path === '/' ? '' : path}`)

// A page keeps the language it was rendered with while it animates out.
const LangContext = createContext<Lang | null>(null)

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>
}

export function useI18n() {
  const { pathname } = useLocation()
  const lang = useContext(LangContext) ?? langFromPath(pathname)
  return {
    lang,
    t: DICTS[lang],
    /** Localise an internal path: lp('/about') → '/pl/about' */
    lp: (path: string) => withLang(lang, path),
    page: stripLang(pathname),
  }
}

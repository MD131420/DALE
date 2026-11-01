import { useEffect, useState } from 'react'
import type { Lang } from '../i18n'

export type Loc = Record<Lang, string>
export type MediaInfo = { w: number; h: number; kind: 'image' | 'video'; poster?: string }
/** An image or an MP4 video; `autoplay` videos play muted in a loop, without controls. */
export type GalleryItem = { id: string; caption: Loc; autoplay?: boolean }
export type Project = {
  id: number
  slug: string
  title: Loc
  summary: Loc
  body: Loc
  category: Loc
  client: string
  year: string
  cover: string | null
  gallery: GalleryItem[]
  /** Pixel size and type of every image/video, so the layout is reserved before they load. */
  media: Record<string, MediaInfo>
}

/** Text in the visitor's language, falling back to whatever the author filled in. */
export const pick = (loc: Loc | undefined, lang: Lang) => (loc ? loc[lang] || loc.en || loc.pl || loc.de : '')

export type MediaSize = 'sm' | 'md' | 'xl'
export const mediaUrl = (id: string, size: MediaSize = 'md') => `/media/${id}-${size}.webp`
export const videoUrl = (id: string) => `/media/${id}.mp4`
export const mediaSrcSet = (id: string) => `${mediaUrl(id, 'sm')} 640w, ${mediaUrl(id, 'md')} 1200w, ${mediaUrl(id, 'xl')} 2400w`

type State<T> = { data: T | null; error: boolean }

// Last list seen in this tab — shown instantly while a fresh copy loads.
let lastList: Project[] | null = null

export function useProjects(): State<Project[]> {
  const [state, setState] = useState<State<Project[]>>({ data: lastList, error: false })
  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/projects', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Project[]) => {
        lastList = data
        setState({ data, error: false })
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setState((s) => ({ data: s.data, error: !s.data && !!e }))
      })
    return () => ctrl.abort()
  }, [])
  return state
}

/** One project. `preview` loads drafts too (only works for a signed-in admin). */
export function useProject(slug: string, preview: boolean): State<Project> & { missing: boolean } {
  const cached = preview ? null : (lastList?.find((p) => p.slug === slug) ?? null)
  const [state, setState] = useState({ data: cached, error: false, missing: false })
  useEffect(() => {
    const ctrl = new AbortController()
    const url = preview ? `/api/admin/preview/${encodeURIComponent(slug)}` : `/api/projects/${encodeURIComponent(slug)}`
    fetch(url, { signal: ctrl.signal, credentials: 'same-origin' })
      .then(async (r) => {
        if (r.status === 404 || r.status === 401) return setState({ data: null, error: false, missing: true })
        if (!r.ok) throw new Error(String(r.status))
        setState({ data: (await r.json()) as Project, error: false, missing: false })
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState((s) => ({ ...s, error: !s.data }))
      })
    return () => ctrl.abort()
  }, [slug, preview])
  return state
}

/** Plain-text body → paragraphs (blank line = new paragraph). */
export const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

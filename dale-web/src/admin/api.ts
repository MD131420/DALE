import type { Loc, Project } from '../projects/api'

export type AdminProject = Project & { published: boolean; position: number; createdAt: number; updatedAt: number }
export type Media = { id: string; w: number; h: number; kind?: 'image' | 'video'; poster?: string }
export type { Loc }

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// The CSRF token lives only in memory; the session cookie is httpOnly and never readable from JS.
let csrf = ''
let onUnauthorized: (() => void) | null = null
export const setCsrf = (token: string) => {
  csrf = token
}
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn
}

export async function api<T>(path: string, opts: { method?: string; json?: unknown } = {}): Promise<T> {
  const method = opts.method ?? 'GET'
  const headers: Record<string, string> = {}
  if (opts.json !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') headers['X-CSRF-Token'] = csrf
  let res: Response
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      headers,
      body: opts.json === undefined ? undefined : JSON.stringify(opts.json),
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError('Brak połączenia z serwerem.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && path !== '/login') onUnauthorized?.()
  if (!res.ok) throw new ApiError(data.error ?? `Błąd ${res.status}`, res.status)
  return data as T
}

export const MAX_UPLOAD_MB = 25

/** Upload with progress (fetch cannot report upload progress, XHR can). */
export function uploadImage(file: File, onProgress?: (p: number) => void) {
  return new Promise<Media>((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new ApiError(`„${file.name}” nie jest zdjęciem.`, 415))
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024)
      return reject(new ApiError(`„${file.name}” jest za duży (maks. ${MAX_UPLOAD_MB} MB).`, 413))
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/media')
    xhr.setRequestHeader('X-CSRF-Token', csrf)
    xhr.responseType = 'json'
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => {
      if (xhr.status === 401) onUnauthorized?.()
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as Media)
      else reject(new ApiError((xhr.response as { error?: string } | null)?.error ?? `Błąd ${xhr.status}`, xhr.status))
    }
    xhr.onerror = () => reject(new ApiError('Brak połączenia z serwerem.', 0))
    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}

export const MAX_VIDEO_MB = 300

/** Reads size and grabs a poster frame in the browser; also proves the browser can play the file. */
function probeVideo(file: File) {
  return new Promise<{ w: number; h: number; poster: Blob | null }>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    const finish = (poster: Blob | null) => {
      URL.revokeObjectURL(url)
      resolve({ w: video.videoWidth, h: video.videoHeight, poster })
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ApiError(`Przeglądarka nie potrafi odtworzyć „${file.name}”. Wyeksportuj film jako MP4 (H.264).`, 415))
    }
    video.onloadedmetadata = () => {
      if (!video.videoWidth) return finish(null)
      video.currentTime = Math.min(0.5, (video.duration || 1) / 4)
    }
    video.onseeked = () => {
      try {
        const scale = Math.min(1, 2400 / video.videoWidth)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((b) => finish(b), 'image/jpeg', 0.88)
      } catch {
        finish(null)
      }
    }
    video.src = url
  })
}

/** MP4 upload: poster frame first (as a normal image), then the video itself streamed as the request body. */
export async function uploadVideo(file: File, onProgress?: (p: number) => void) {
  if (!isVideoFile(file)) throw new ApiError(`„${file.name}” nie jest plikiem MP4.`, 415)
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new ApiError(`„${file.name}” jest za duży (maks. ${MAX_VIDEO_MB} MB).`, 413)
  const meta = await probeVideo(file)
  let poster: Media | null = null
  if (meta.poster) poster = await uploadImage(new File([meta.poster], 'poster.jpg', { type: 'image/jpeg' })).catch(() => null)
  return new Promise<Media>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/video')
    xhr.setRequestHeader('Content-Type', 'video/mp4')
    xhr.setRequestHeader('X-CSRF-Token', csrf)
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name))
    xhr.setRequestHeader('X-Video-Width', String(meta.w))
    xhr.setRequestHeader('X-Video-Height', String(meta.h))
    if (poster) xhr.setRequestHeader('X-Video-Poster', poster.id)
    xhr.responseType = 'json'
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => {
      if (xhr.status === 401) onUnauthorized?.()
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as Media)
      else reject(new ApiError((xhr.response as { error?: string } | null)?.error ?? `Błąd ${xhr.status}`, xhr.status))
    }
    xhr.onerror = () => reject(new ApiError('Brak połączenia z serwerem.', 0))
    xhr.send(file)
  })
}

export const isVideoFile = (f: File) => f.type === 'video/mp4' || /\.mp4$/i.test(f.name)

export const LANG_TABS = [
  { code: 'pl', label: 'Polski' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const

export const emptyLoc = (): Loc => ({ en: '', pl: '', de: '' })
/** Admin lists show the Polish title first. */
export const adminTitle = (l: Loc) => l.pl || l.en || l.de || 'Bez tytułu'

export const formatDate = (ms: number) =>
  new Date(ms).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

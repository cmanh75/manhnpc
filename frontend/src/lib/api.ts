import axios from 'axios'
import type { VisitedPlace, TravelStats, Post, PagedPosts, Photo, Video, Profile, GuestbookEntry, JournalEntry, PagedVisits, VisitStats } from './types'
import { mockPlaces, mockTravelStats, mockPosts, mockPhotos, mockVideos, mockProfile } from './mock'
import { authSession, type OwnerSession } from './auth-session'
import { useAppStore } from '../store/useAppStore'
export type { OwnerSession } from './auth-session'

/**
 * API layer with graceful degradation:
 * every call tries the Spring Cloud gateway first (proxied via /api),
 * and silently falls back to the local mock dataset when the
 * backend is offline. The UI never knows the difference.
 */

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
const client = axios.create({ baseURL: configuredApiBaseUrl || '/api', timeout: 4000 })

// attach the owner token (if logged in) to every request
client.interceptors.request.use((config) => {
  const token = authSession.token()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// a 401 means the token is expired/invalid server-side — drop the stale session immediately
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && authSession.token()) {
      authSession.clear()
      useAppStore.getState().setOwner(null)
    }
    return Promise.reject(error)
  },
)

/**
 * A same-origin `/api/*` call against a misconfigured deploy resolves (200 OK)
 * to Firebase Hosting's SPA fallback `index.html` instead of throwing — so an
 * unguarded write would silently accept an HTML string as if it were the
 * real payload. Call this on any response that isn't itself wrapped in
 * withFallback so a misconfiguration fails loudly instead of poisoning state.
 */
function assertJsonObject<T>(data: unknown, context: string): T {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`${context}: expected a JSON object, got ${typeof data}`)
  }
  return data as T
}

/** The backend stores tags as a comma string — normalize to string[]. */
function normalizePost(raw: Omit<Post, 'tags'> & { tags?: string | string[] }): Post {
  const tags: string[] = Array.isArray(raw.tags)
    ? raw.tags
    : typeof raw.tags === 'string'
      ? raw.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []
  return { ...raw, tags }
}

// Firebase Hosting rewrites unknown paths (including /api/*) to index.html.
// Without an explicit production API URL, treat the backend as offline from
// the start so the app uses its built-in dataset instead of accepting HTML as
// a successful JSON response and crashing on malformed shapes.
let backendAlive: boolean | null =
  import.meta.env.PROD && !configuredApiBaseUrl ? false : null

async function withFallback<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  if (backendAlive === false) return fallback
  try {
    const result = await request()
    backendAlive = true
    return result
  } catch {
    backendAlive = false
    // re-probe on the next page load, not every call
    setTimeout(() => (backendAlive = null), 30_000)
    return fallback
  }
}

export const api = {
  isBackendAlive: () => backendAlive,

  async getPlaces(): Promise<VisitedPlace[]> {
    return withFallback(async () => (await client.get('/travel/locations')).data, mockPlaces)
  },

  async getTravelStats(): Promise<TravelStats> {
    return withFallback(async () => (await client.get('/travel/stats')).data, mockTravelStats)
  },

  async getPosts(params?: { tag?: string; q?: string; page?: number; size?: number }): Promise<PagedPosts> {
    const fallback: PagedPosts = {
      content: filterMockPosts(params),
      totalElements: mockPosts.length,
      totalPages: 1,
      page: 0,
    }
    return withFallback(async () => {
      const data = (await client.get('/posts', { params })).data
      return { ...data, content: (data.content ?? []).map(normalizePost) }
    }, fallback)
  },

  async getPost(slug: string): Promise<Post | undefined> {
    return withFallback(
      async () => normalizePost((await client.get(`/posts/${slug}`)).data),
      mockPosts.find((p) => p.slug === slug),
    )
  },

  async getPhotos(category?: string): Promise<Photo[]> {
    const fallback = category && category !== 'all' ? mockPhotos.filter((p) => p.category === category) : mockPhotos
    return withFallback(
      async () => (await client.get('/media/photos', { params: category && category !== 'all' ? { category } : {} })).data,
      fallback,
    )
  },

  async getVideos(): Promise<Video[]> {
    return withFallback(async () => (await client.get('/media/videos')).data, mockVideos)
  },

  async getProfile(): Promise<Profile> {
    return withFallback(async () => (await client.get('/profile')).data, mockProfile)
  },

  /* ---------- media uploads: owner-only, no offline fallback ---------- */

  async uploadPhoto(
    file: File,
    meta: { title: string; description?: string; category: string; location?: string },
    onProgress?: (percent: number) => void,
  ): Promise<Photo> {
    const form = new FormData()
    form.append('file', file)
    form.append('title', meta.title)
    if (meta.description) form.append('description', meta.description)
    form.append('category', meta.category)
    if (meta.location) form.append('location', meta.location)
    const { data } = await client.post('/media/photos/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
      onUploadProgress: onProgress && ((e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)),
    })
    return assertJsonObject<Photo>(data, 'uploadPhoto')
  },

  async uploadPhotos(
    files: File[],
    meta: { title: string; description?: string; category: string; location?: string },
    onProgress?: (percent: number) => void,
  ): Promise<Photo[]> {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    form.append('title', meta.title)
    if (meta.description) form.append('description', meta.description)
    form.append('category', meta.category)
    if (meta.location) form.append('location', meta.location)
    const { data } = await client.post('/media/photos/upload-batch', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
      onUploadProgress: onProgress && ((e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)),
    })
    if (!Array.isArray(data)) throw new Error('uploadPhotos: expected a JSON array')
    return data as Photo[]
  },

  async uploadVideo(
    file: File,
    meta: { title: string; description?: string; category: string; durationSeconds?: number },
    onProgress?: (percent: number) => void,
  ): Promise<Video> {
    const form = new FormData()
    form.append('file', file)
    form.append('title', meta.title)
    if (meta.description) form.append('description', meta.description)
    form.append('category', meta.category)
    if (meta.durationSeconds) form.append('durationSeconds', String(meta.durationSeconds))
    const { data } = await client.post('/media/videos/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // server transcodes to H.264/AAC + extracts a thumbnail after the upload transfer completes,
      // so this needs real headroom beyond just the transfer time
      timeout: 300_000,
      onUploadProgress: onProgress && ((e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)),
    })
    return assertJsonObject<Video>(data, 'uploadVideo')
  },

  async deletePhoto(id: number): Promise<void> {
    await client.delete(`/media/photos/${id}`)
  },

  async deleteVideo(id: number): Promise<void> {
    await client.delete(`/media/videos/${id}`)
  },
}

function filterMockPosts(params?: { tag?: string; q?: string }): Post[] {
  let posts = [...mockPosts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (params?.tag) posts = posts.filter((p) => p.tags.includes(params.tag!))
  if (params?.q) {
    const q = params.q.toLowerCase()
    posts = posts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))
  }
  return posts
}

/* ---------- owner auth (JWT via auth-service) ---------- */

export const auth = {
  getSession(): OwnerSession | null {
    return authSession.get()
  },
  getToken(): string | null {
    return authSession.token()
  },
  isOwner(): boolean {
    return !!auth.getToken()
  },
  async login(username: string, password: string): Promise<OwnerSession> {
    // deliberate direct call, no fallback — login is meaningless offline
    const { data } = await client.post('/auth/login', { username, password })
    const body = assertJsonObject<{ token?: string; user?: OwnerSession['user'] }>(data, 'login')
    if (!body.token || !body.user) throw new Error('login: malformed response')
    const session: OwnerSession = { token: body.token, user: body.user }
    authSession.save(session)
    return session
  },
  logout() {
    authSession.clear()
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // deliberate direct call, no fallback — a password change is meaningless offline
    await client.put('/auth/password', { currentPassword, newPassword })
  },
}

/* ---------- journal: private, owner-only, no offline fallback ---------- */

function normalizeJournalEntry(raw: Omit<JournalEntry, 'tags'> & { tags?: string | string[] }): JournalEntry {
  const tags: string[] = Array.isArray(raw.tags)
    ? raw.tags
    : typeof raw.tags === 'string'
      ? raw.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []
  return { ...raw, tags }
}

export interface JournalEntryInput {
  title: string
  content: string
  tags: string[]
  entryDate: string
}

export const journal = {
  async list(tag?: string): Promise<JournalEntry[]> {
    const { data } = await client.get('/journal', { params: tag ? { tag } : undefined })
    return (data as JournalEntry[]).map(normalizeJournalEntry)
  },
  async get(id: number): Promise<JournalEntry> {
    const { data } = await client.get(`/journal/${id}`)
    return normalizeJournalEntry(data)
  },
  async create(entry: JournalEntryInput): Promise<JournalEntry> {
    const { data } = await client.post('/journal', { ...entry, tags: entry.tags.join(',') })
    return normalizeJournalEntry(data)
  },
  async update(id: number, entry: JournalEntryInput): Promise<JournalEntry> {
    const { data } = await client.put(`/journal/${id}`, { ...entry, tags: entry.tags.join(',') })
    return normalizeJournalEntry(data)
  },
  async remove(id: number): Promise<void> {
    await client.delete(`/journal/${id}`)
  },
  async uploadImage(file: File): Promise<string> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await client.post('/journal/images', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data.url as string
  },
}

/* ---------- audit: standard access-log data (IP, UA, path, referrer) — owner-only reads ---------- */

export const audit = {
  /** Fire-and-forget page-view beacon; failures are silently ignored. */
  recordVisit(path: string, referrer: string) {
    client
      .post('/audit/visit', { path, referrer, language: navigator.language })
      .catch(() => {})
  },
  async list(page = 0, size = 50): Promise<PagedVisits> {
    const { data } = await client.get('/audit/visits', { params: { page, size } })
    return assertJsonObject<PagedVisits>(data, 'audit.list')
  },
  async stats(): Promise<VisitStats> {
    const { data } = await client.get('/audit/stats')
    return assertJsonObject<VisitStats>(data, 'audit.stats')
  },
}

/* ---------- guestbook: backend when available, localStorage otherwise ---------- */

const GUESTBOOK_KEY = 'manhnpc.guestbook'

const seedGuestbook: GuestbookEntry[] = [
  { id: 'seed-1', name: 'linh.dev', message: 'That globe is unreasonably smooth. Teach me your shader ways 🙏', emoji: '🚀', createdAt: '2026-07-20T14:12:00' },
  { id: 'seed-2', name: 'tuan_backend', message: 'Six microservices for a personal site... respect. Absolutely unhinged. Respect.', emoji: '🔥', createdAt: '2026-07-22T09:41:00', },
  { id: 'seed-3', name: 'a stranger from HN', message: 'Got lost spinning the Earth for ten minutes. This is what the web should feel like.', emoji: '🌏', createdAt: '2026-07-25T23:05:00' },
]

function localList(): GuestbookEntry[] {
  try {
    const raw = localStorage.getItem(GUESTBOOK_KEY)
    const own: GuestbookEntry[] = raw ? JSON.parse(raw) : []
    return [...own, ...seedGuestbook].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch {
    return seedGuestbook
  }
}

function localAdd(name: string, message: string, emoji: string): GuestbookEntry {
  const entry: GuestbookEntry = {
    id: `gb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || 'anonymous traveler',
    message: message.trim(),
    emoji,
    createdAt: new Date().toISOString(),
  }
  try {
    const raw = localStorage.getItem(GUESTBOOK_KEY)
    const own: GuestbookEntry[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(GUESTBOOK_KEY, JSON.stringify([entry, ...own].slice(0, 200)))
  } catch {
    /* storage unavailable — entry still shows for this session via state */
  }
  return entry
}

export const guestbook = {
  async list(): Promise<GuestbookEntry[]> {
    return withFallback(async () => {
      const { data } = await client.get('/guestbook')
      return data.map((e: GuestbookEntry & { id: number }) => ({ ...e, id: String(e.id) }))
    }, localList())
  },
  async add(name: string, message: string, emoji: string): Promise<GuestbookEntry> {
    // not withFallback: localAdd has a side effect, so only run it on real failure
    try {
      const { data } = await client.post('/guestbook', { name, message, emoji })
      backendAlive = true
      return { ...data, id: String(data.id) }
    } catch {
      return localAdd(name, message, emoji)
    }
  },
  /** Owner only — real backend entries have numeric ids. */
  async remove(id: string): Promise<boolean> {
    if (!/^\d+$/.test(id)) return false
    try {
      await client.delete(`/guestbook/${id}`)
      return true
    } catch {
      return false
    }
  },
}

/* ---------- likes: localStorage per-visitor ---------- */

const LIKES_KEY = 'manhnpc.likes'

export const likes = {
  all(): Record<string, boolean> {
    try {
      return JSON.parse(localStorage.getItem(LIKES_KEY) ?? '{}')
    } catch {
      return {}
    }
  },
  toggle(key: string): boolean {
    const state = likes.all()
    state[key] = !state[key]
    try {
      localStorage.setItem(LIKES_KEY, JSON.stringify(state))
    } catch { /* ignore */ }
    return state[key]
  },
  has(key: string): boolean {
    return !!likes.all()[key]
  },
}

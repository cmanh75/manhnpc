import axios from 'axios'
import type { Post, PagedPosts, Photo, Video, Profile, GuestbookEntry, JournalEntry, PagedVisits, VisitStats } from './types'
import { authSession, type OwnerSession } from './auth-session'
import { goToLogin } from './navigation'
import { useAppStore } from '../store/useAppStore'
export type { OwnerSession } from './auth-session'

/**
 * API layer: every call goes straight to the Spring Cloud gateway
 * (proxied via /api). There is no mock/fallback dataset — if the
 * backend is unreachable the call throws and callers fall back to
 * an empty/loading state instead of fabricated content.
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
      goToLogin()
    }
    return Promise.reject(error)
  },
)

/**
 * A same-origin `/api/*` call against a misconfigured deploy resolves (200 OK)
 * to Firebase Hosting's SPA fallback `index.html` instead of throwing — so an
 * unguarded caller would silently accept an HTML string as if it were the
 * real payload. Call this on every response so a misconfiguration fails
 * loudly instead of poisoning state with malformed data.
 */
function assertJsonObject<T>(data: unknown, context: string): T {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${context}: expected a JSON object, got ${typeof data}`)
  }
  return data as T
}

function assertJsonArray<T>(data: unknown, context: string): T[] {
  if (!Array.isArray(data)) {
    throw new Error(`${context}: expected a JSON array, got ${typeof data}`)
  }
  return data as T[]
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

// Tracked purely for UI display (BackendBadge) — never gates whether a call
// is made or what it returns.
let backendAlive: boolean | null = null

async function trackedGet<T>(path: string, params?: object): Promise<T> {
  try {
    const { data } = await client.get(path, params ? { params } : undefined)
    backendAlive = true
    return data as T
  } catch (err) {
    backendAlive = false
    throw err
  }
}

export const api = {
  isBackendAlive: () => backendAlive,

  async getPosts(params?: { tag?: string; q?: string; page?: number; size?: number }): Promise<PagedPosts> {
    const data = assertJsonObject<Omit<PagedPosts, 'content'> & { content?: unknown[] }>(
      await trackedGet('/posts', params),
      'getPosts',
    )
    return { ...data, content: (data.content ?? []).map((p) => normalizePost(p as Parameters<typeof normalizePost>[0])) }
  },

  async getPost(slug: string): Promise<Post | undefined> {
    try {
      return normalizePost(assertJsonObject(await trackedGet(`/posts/${slug}`), 'getPost'))
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return undefined
      throw err
    }
  },

  async deletePost(id: number): Promise<void> {
    await client.delete(`/posts/${id}`)
  },

  async getPhotos(category?: string): Promise<Photo[]> {
    const data = await trackedGet('/media/photos', category && category !== 'all' ? { category } : {})
    return assertJsonArray<Photo>(data, 'getPhotos')
  },

  async getVideos(): Promise<Video[]> {
    return assertJsonArray<Video>(await trackedGet('/media/videos'), 'getVideos')
  },

  async getProfile(): Promise<Profile> {
    return assertJsonObject<Profile>(await trackedGet('/profile'), 'getProfile')
  },

  /* ---------- media uploads: owner-only, no offline fallback ---------- */

  async uploadMedia(
    files: File[],
    meta: { title: string; description?: string; category: string; location?: string },
    onProgress?: (percent: number) => void,
  ): Promise<{ photos: Photo[]; videos: Video[] }> {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    form.append('title', meta.title)
    if (meta.description) form.append('description', meta.description)
    form.append('category', meta.category)
    if (meta.location) form.append('location', meta.location)
    const { data } = await client.post('/media/upload-batch', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // videos in the batch get transcoded server-side after transfer, same ceiling as a video upload
      timeout: 300_000,
      onUploadProgress: onProgress && ((e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)),
    })
    const result = assertJsonObject<{ photos?: Photo[]; videos?: Video[] }>(data, 'uploadMedia')
    return { photos: result.photos ?? [], videos: result.videos ?? [] }
  },

  async updatePhoto(
    id: number,
    changes: { file?: File; title?: string; description?: string; category?: string; location?: string; takenAt?: string },
    onProgress?: (percent: number) => void,
  ): Promise<Photo> {
    const form = new FormData()
    if (changes.file) form.append('file', changes.file)
    if (changes.title !== undefined) form.append('title', changes.title)
    if (changes.description !== undefined) form.append('description', changes.description)
    if (changes.category !== undefined) form.append('category', changes.category)
    if (changes.location !== undefined) form.append('location', changes.location)
    if (changes.takenAt !== undefined) form.append('takenAt', changes.takenAt)
    const { data } = await client.put(`/media/photos/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
      onUploadProgress: onProgress && ((e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)),
    })
    return assertJsonObject<Photo>(data, 'updatePhoto')
  },

  async updateVideo(
    id: number,
    changes: { file?: File; title?: string; description?: string; category?: string; createdAt?: string },
    onProgress?: (percent: number) => void,
  ): Promise<Video> {
    const form = new FormData()
    if (changes.file) form.append('file', changes.file)
    if (changes.title !== undefined) form.append('title', changes.title)
    if (changes.description !== undefined) form.append('description', changes.description)
    if (changes.category !== undefined) form.append('category', changes.category)
    if (changes.createdAt !== undefined) form.append('createdAt', changes.createdAt)
    const { data } = await client.put(`/media/videos/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // a replacement file gets re-transcoded server-side, same ceiling as a video upload
      timeout: 300_000,
      onUploadProgress: onProgress && ((e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)),
    })
    return assertJsonObject<Video>(data, 'updateVideo')
  },

  async deletePhoto(id: number): Promise<void> {
    await client.delete(`/media/photos/${id}`)
  },

  async deleteVideo(id: number): Promise<void> {
    await client.delete(`/media/videos/${id}`)
  },

  /** Fire-and-forget view beacons — failures are silently ignored, same as audit.recordVisit. */
  recordPhotoView(id: number) {
    client.post(`/media/photos/${id}/view`).catch(() => {})
  },
  recordVideoView(id: number) {
    client.post(`/media/videos/${id}/view`).catch(() => {})
  },
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
  async uploadAvatar(file: File, onProgress?: (percent: number) => void): Promise<OwnerSession['user']> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await client.post('/auth/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
      onUploadProgress: onProgress && ((e) => onProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 0)),
    })
    const user = assertJsonObject<OwnerSession['user']>(data, 'uploadAvatar')
    const current = authSession.get()
    if (current) authSession.save({ ...current, user })
    return user
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
  async generateAiReport(notes: string, entryDate: string): Promise<{ title: string | null; report: string }> {
    const { data } = await client.post('/journal/ai-report', { notes, entryDate }, { timeout: 60_000 })
    return { title: (data.title as string | null) ?? null, report: data.report as string }
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

/* ---------- guestbook ---------- */

export const guestbook = {
  async list(): Promise<GuestbookEntry[]> {
    const data = assertJsonArray<GuestbookEntry & { id: number }>(await trackedGet('/guestbook'), 'guestbook.list')
    return data.map((e) => ({ ...e, id: String(e.id) }))
  },
  async add(name: string, message: string, emoji: string): Promise<GuestbookEntry> {
    const { data } = await client.post('/guestbook', { name, message, emoji })
    const entry = assertJsonObject<GuestbookEntry & { id: number }>(data, 'guestbook.add')
    backendAlive = true
    return { ...entry, id: String(entry.id) }
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

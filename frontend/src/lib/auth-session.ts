const AUTH_KEY = 'manhnpc.auth'

export interface OwnerSession {
  token: string
  user: { id: number; username: string; displayName: string; avatarUrl?: string }
}

export const authSession = {
  get(): OwnerSession | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  token(): string | null {
    return authSession.get()?.token ?? null
  },
  save(session: OwnerSession) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  },
  clear() {
    localStorage.removeItem(AUTH_KEY)
  },
}

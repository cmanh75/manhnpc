const AUTH_KEY = 'manhnpc.auth'

export interface OwnerSession {
  token: string
  user: { id: number; username: string; displayName: string; avatarUrl?: string }
}

/** Reads the `exp` claim straight out of the JWT payload — no signature check, just enough to know when to log out client-side. */
function decodeExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
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
  isExpired(): boolean {
    const token = authSession.token()
    if (!token) return false
    const expMs = decodeExpiryMs(token)
    return expMs !== null && Date.now() >= expMs
  },
  save(session: OwnerSession) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  },
  clear() {
    localStorage.removeItem(AUTH_KEY)
  },
}

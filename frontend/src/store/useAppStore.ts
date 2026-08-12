import { create } from 'zustand'
import { authSession, type OwnerSession } from '../lib/auth-session'

interface AppState {
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void

  booted: boolean
  setBooted: () => void

  owner: OwnerSession | null
  setOwner: (session: OwnerSession | null) => void
}

function initialOwner(): OwnerSession | null {
  if (authSession.isExpired()) {
    authSession.clear()
    return null
  }
  return authSession.get()
}

export const useAppStore = create<AppState>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  booted: false,
  setBooted: () => set({ booted: true }),

  owner: initialOwner(),
  setOwner: (owner) => set({ owner }),
}))

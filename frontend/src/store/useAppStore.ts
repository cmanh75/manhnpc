import { create } from 'zustand'
import type { VisitedPlace } from '../lib/types'
import { authSession, type OwnerSession } from '../lib/auth-session'

interface AppState {
  selectedPlace: VisitedPlace | null
  setSelectedPlace: (p: VisitedPlace | null) => void

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
  selectedPlace: null,
  setSelectedPlace: (selectedPlace) => set({ selectedPlace }),

  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  booted: false,
  setBooted: () => set({ booted: true }),

  owner: initialOwner(),
  setOwner: (owner) => set({ owner }),
}))

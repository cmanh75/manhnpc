import { create } from 'zustand'
import type { VisitedPlace } from '../lib/types'
import { auth, type OwnerSession } from '../lib/api'

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

export const useAppStore = create<AppState>((set) => ({
  selectedPlace: null,
  setSelectedPlace: (selectedPlace) => set({ selectedPlace }),

  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  booted: false,
  setBooted: () => set({ booted: true }),

  owner: auth.getSession(),
  setOwner: (owner) => set({ owner }),
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Dagafsluiting } from '../types'

interface DagafsluitingStore {
  afsluitingen: Dagafsluiting[]
  voegAfsluitingToe: (d: Dagafsluiting) => void
  verwijderAfsluiting: (id: string) => void
}

export const useDagafsluitingStore = create<DagafsluitingStore>()(
  persist(
    (set) => ({
      afsluitingen: [],

      voegAfsluitingToe: (d) =>
        set((state) => ({ afsluitingen: [d, ...state.afsluitingen] })),

      verwijderAfsluiting: (id) =>
        set((state) => ({
          afsluitingen: state.afsluitingen.filter((a) => a.id !== id),
        })),
    }),
    { name: 'pos-dagafsluitingen' }
  )
)

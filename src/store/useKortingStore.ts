import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Korting } from '../types'

interface KortingStore {
  kortingen: Korting[]
  voegKortingToe: (korting: Omit<Korting, 'id'>) => void
  updateKorting: (id: string, updates: Partial<Omit<Korting, 'id'>>) => void
  verwijderKorting: (id: string) => void
  toggleActief: (id: string) => void
}

export const useKortingStore = create<KortingStore>()(
  persist(
    (set) => ({
      kortingen: [],

      voegKortingToe: (korting) =>
        set((state) => ({
          kortingen: [...state.kortingen, { ...korting, id: Date.now().toString() }],
        })),

      updateKorting: (id, updates) =>
        set((state) => ({
          kortingen: state.kortingen.map((k) =>
            k.id === id ? { ...k, ...updates } : k
          ),
        })),

      verwijderKorting: (id) =>
        set((state) => ({
          kortingen: state.kortingen.filter((k) => k.id !== id),
        })),

      toggleActief: (id) =>
        set((state) => ({
          kortingen: state.kortingen.map((k) =>
            k.id === id ? { ...k, actief: !k.actief } : k
          ),
        })),
    }),
    {
      name: 'pos-kortingen',
      version: 1,
      migrate: (stored: unknown) => {
        const state = stored as { kortingen?: Korting[] } | null
        return { kortingen: Array.isArray(state?.kortingen) ? state!.kortingen : [] }
      },
    }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PromotieType = 'afbeelding' | 'video' | 'tekst'

export interface Promotie {
  id: string
  type: PromotieType
  // afbeelding
  afbeelding?: string      // base64 data URL
  // video  (URL recommended — base64 videos are too large for localStorage)
  videoUrl?: string
  // tekst
  tekst?: string
  achtergrondKleur: string // hex
  tekstKleur: string       // hex
  // shared
  actief: boolean
}

interface PromoStore {
  promoties: Promotie[]
  voegToe: (p: Omit<Promotie, 'id'>) => void
  update: (id: string, updates: Partial<Omit<Promotie, 'id'>>) => void
  verwijder: (id: string) => void
  toggleActief: (id: string) => void
}

export const usePromoStore = create<PromoStore>()(
  persist(
    (set) => ({
      promoties: [],

      voegToe: (p) =>
        set((state) => ({
          promoties: [...state.promoties, { ...p, id: Date.now().toString() }],
        })),

      update: (id, updates) =>
        set((state) => ({
          promoties: state.promoties.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      verwijder: (id) =>
        set((state) => ({
          promoties: state.promoties.filter((p) => p.id !== id),
        })),

      toggleActief: (id) =>
        set((state) => ({
          promoties: state.promoties.map((p) =>
            p.id === id ? { ...p, actief: !p.actief } : p
          ),
        })),
    }),
    { name: 'pos-promoties' }
  )
)

export const PROMO_KLEUREN = [
  { bg: '#1e293b', tekst: '#ffffff', label: 'Donker' },
  { bg: '#1d4ed8', tekst: '#ffffff', label: 'Blauw' },
  { bg: '#15803d', tekst: '#ffffff', label: 'Groen' },
  { bg: '#b45309', tekst: '#ffffff', label: 'Oranje' },
  { bg: '#7c3aed', tekst: '#ffffff', label: 'Paars' },
  { bg: '#be123c', tekst: '#ffffff', label: 'Rood' },
  { bg: '#fef9c3', tekst: '#1e293b', label: 'Geel' },
  { bg: '#f0fdf4', tekst: '#14532d', label: 'Lichtgroen' },
]

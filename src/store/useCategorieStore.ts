import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Categorie } from '../types'

const DEMO_CATEGORIEEN: Categorie[] = [
  { id: '1', naam: 'Broodjes', kleur: '#FEF3C7', volgorde: 1 },
  { id: '2', naam: 'Snacks',   kleur: '#FFF7ED', volgorde: 2 },
  { id: '3', naam: 'Drank',    kleur: '#EFF6FF', volgorde: 3 },
  { id: '4', naam: 'Overig',   kleur: '#F3F4F6', volgorde: 4 },
]

interface CategorieStore {
  categorieen: Categorie[]
  voegCategorieToe: (cat: Omit<Categorie, 'id' | 'volgorde'>) => void
  updateCategorie: (id: string, updates: Partial<Omit<Categorie, 'id'>>) => void
  verwijderCategorie: (id: string) => void
  verplaatsOmhoog: (id: string) => void
  verplaatsOmlaag: (id: string) => void
}

function gesorteerd(lijst: Categorie[]): Categorie[] {
  return [...lijst].sort((a, b) => a.volgorde - b.volgorde)
}

export const useCategorieStore = create<CategorieStore>()(
  persist(
    (set) => ({
      categorieen: DEMO_CATEGORIEEN,

      voegCategorieToe: (cat) =>
        set((state) => {
          const maxVolgorde = Math.max(0, ...state.categorieen.map((c) => c.volgorde))
          return {
            categorieen: [
              ...state.categorieen,
              { ...cat, id: Date.now().toString(), volgorde: maxVolgorde + 1 },
            ],
          }
        }),

      updateCategorie: (id, updates) =>
        set((state) => ({
          categorieen: state.categorieen.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      verwijderCategorie: (id) =>
        set((state) => ({
          categorieen: state.categorieen.filter((c) => c.id !== id),
        })),

      verplaatsOmhoog: (id) =>
        set((state) => {
          const sorted = gesorteerd(state.categorieen)
          const idx = sorted.findIndex((c) => c.id === id)
          if (idx <= 0) return state
          const prev = sorted[idx - 1]!
          const curr = sorted[idx]!
          return {
            categorieen: state.categorieen.map((c) => {
              if (c.id === curr.id) return { ...c, volgorde: prev.volgorde }
              if (c.id === prev.id) return { ...c, volgorde: curr.volgorde }
              return c
            }),
          }
        }),

      verplaatsOmlaag: (id) =>
        set((state) => {
          const sorted = gesorteerd(state.categorieen)
          const idx = sorted.findIndex((c) => c.id === id)
          if (idx < 0 || idx >= sorted.length - 1) return state
          const next = sorted[idx + 1]!
          const curr = sorted[idx]!
          return {
            categorieen: state.categorieen.map((c) => {
              if (c.id === curr.id) return { ...c, volgorde: next.volgorde }
              if (c.id === next.id) return { ...c, volgorde: curr.volgorde }
              return c
            }),
          }
        }),
    }),
    {
      name: 'pos-categorieen',
      version: 1,
      migrate: (stored: unknown) => {
        const state = stored as { categorieen?: Categorie[] } | null
        const lijst = Array.isArray(state?.categorieen) ? state!.categorieen : DEMO_CATEGORIEEN
        return {
          categorieen: lijst.map((c, i) => ({
            ...c,
            volgorde: c.volgorde ?? i + 1,
          })),
        }
      },
    }
  )
)

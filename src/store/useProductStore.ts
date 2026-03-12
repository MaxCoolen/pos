import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '../types'

const DEMO_PRODUCTS: Product[] = [
  { id: '1', naam: 'Broodje Kip',  prijs: 5.50, categorie: 'Broodjes', prijsType: 'stuk', btw: 9, kleur: '#FEF3C7' },
  { id: '2', naam: 'Kip Wrap',     prijs: 6.00, categorie: 'Broodjes', prijsType: 'stuk', btw: 9, kleur: '#FEF3C7' },
  { id: '3', naam: 'Friet',        prijs: 3.00, categorie: 'Snacks',   prijsType: 'stuk', btw: 9, kleur: '#FFF7ED' },
  { id: '4', naam: 'Kip Nuggets',  prijs: 4.50, categorie: 'Snacks',   prijsType: 'stuk', btw: 9, kleur: '#FFF7ED' },
  { id: '5', naam: 'Cola',         prijs: 2.50, categorie: 'Drank',    prijsType: 'stuk', btw: 9, kleur: '#EFF6FF' },
  { id: '6', naam: 'Fanta',        prijs: 2.50, categorie: 'Drank',    prijsType: 'stuk', btw: 9, kleur: '#FFF7ED' },
]

interface ProductStore {
  producten: Product[]
  voegProductToe: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void
  verwijderProduct: (id: string) => void
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      producten: DEMO_PRODUCTS,

      voegProductToe: (product) =>
        set((state) => ({
          producten: [...state.producten, { ...product, id: Date.now().toString() }],
        })),

      updateProduct: (id, updates) =>
        set((state) => ({
          producten: state.producten.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      verwijderProduct: (id) =>
        set((state) => ({
          producten: state.producten.filter((p) => p.id !== id),
        })),
    }),
    {
      name: 'pos-producten',
      version: 3,
      // Migrate old stored products to always have required fields
      migrate: (stored: unknown, version: number) => {
        const state = stored as { producten?: Product[] } | null
        if (!state || !Array.isArray(state.producten)) {
          return { producten: DEMO_PRODUCTS }
        }
        if (version < 3) {
          return {
            ...state,
            producten: state.producten.map((p) => ({
              ...p,
              prijsType: p.prijsType ?? 'stuk',
              btw: p.btw ?? 9,
              categorie: p.categorie ?? 'Overig',
              kleur: p.kleur ?? '#F3F4F6',
            })),
          }
        }
        return state
      },
    }
  )
)

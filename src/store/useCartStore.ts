import { create } from 'zustand'
import type { CartItem, Product } from '../types'

interface CartStore {
  items: CartItem[]
  geselecteerdId: string | null
  voegToe: (product: Product) => void
  verwijder: (productId: string) => void
  updateAantal: (productId: string, aantal: number) => void
  selecteer: (productId: string | null) => void
  leegmaken: () => void
  totaal: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  geselecteerdId: null,

  voegToe: (product) =>
    set((state) => {
      const bestaand = state.items.find((i) => i.product.id === product.id)
      const nieuweItems = bestaand
        ? state.items.map((i) =>
            i.product.id === product.id ? { ...i, aantal: i.aantal + 1 } : i
          )
        : [...state.items, { product, aantal: 1 }]
      return { items: nieuweItems, geselecteerdId: product.id }
    }),

  verwijder: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
      geselecteerdId:
        state.geselecteerdId === productId ? null : state.geselecteerdId,
    })),

  updateAantal: (productId, aantal) =>
    set((state) => {
      if (aantal <= 0) {
        return {
          items: state.items.filter((i) => i.product.id !== productId),
          geselecteerdId:
            state.geselecteerdId === productId ? null : state.geselecteerdId,
        }
      }
      return {
        items: state.items.map((i) =>
          i.product.id === productId ? { ...i, aantal } : i
        ),
      }
    }),

  selecteer: (productId) => set({ geselecteerdId: productId }),

  leegmaken: () => set({ items: [], geselecteerdId: null }),

  totaal: () =>
    get().items.reduce((sum, item) => sum + item.product.prijs * item.aantal, 0),
}))

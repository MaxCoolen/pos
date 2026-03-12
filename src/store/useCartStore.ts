import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CartItem, Product } from '../types'
import { supabase } from '../lib/supabase'
import { useAppStore } from './useAppStore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToCartItem(row: any): CartItem {
  return {
    product: {
      id: row.product_id as string,
      naam: row.product_naam as string,
      prijs: Number(row.product_prijs),
      categorie: 'Overig', // category not stored in cart_items, filled from product list if needed
      prijsType: (row.product_prijs_type as 'stuk' | 'kg') ?? 'stuk',
      btw: 9, // btw not stored in cart_items
      kleur: undefined,
    },
    aantal: Number(row.aantal),
  }
}

interface CartStore {
  items: CartItem[]
  geselecteerdId: string | null
  cartId: string | null
  _channel: RealtimeChannel | null
  voegToe: (product: Product) => void
  verwijder: (productId: string) => void
  updateAantal: (productId: string, aantal: number) => void
  selecteer: (productId: string | null) => void
  leegmaken: () => void
  totaal: () => number
  laadMedewerkerCart: (employeeId: string) => Promise<void>
  ontkoppelMedewerker: () => Promise<void>
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  geselecteerdId: null,
  cartId: null,
  _channel: null,

  voegToe: (product) => {
    set((state) => {
      const bestaand = state.items.find((i) => i.product.id === product.id)
      const nieuweItems = bestaand
        ? state.items.map((i) =>
            i.product.id === product.id ? { ...i, aantal: i.aantal + 1 } : i
          )
        : [...state.items, { product, aantal: 1 }]
      return { items: nieuweItems, geselecteerdId: product.id }
    })
    // Persist to Supabase
    const { cartId, items } = get()
    if (!supabase || !cartId) return
    const item = items.find((i) => i.product.id === product.id)
    const nieuweAantal = item ? item.aantal : 1
    supabase
      .from('cart_items')
      .upsert(
        {
          cart_id: cartId,
          product_id: product.id,
          product_naam: product.naam,
          product_prijs: product.prijs,
          product_prijs_type: product.prijsType,
          aantal: nieuweAantal,
        },
        { onConflict: 'cart_id,product_id' }
      )
      .then(() => {})
  },

  verwijder: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
      geselecteerdId: state.geselecteerdId === productId ? null : state.geselecteerdId,
    }))
    const { cartId } = get()
    if (!supabase || !cartId) return
    supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .then(() => {})
  },

  updateAantal: (productId, aantal) => {
    if (aantal <= 0) {
      get().verwijder(productId)
      return
    }
    set((state) => ({
      items: state.items.map((i) => (i.product.id === productId ? { ...i, aantal } : i)),
    }))
    const { cartId } = get()
    if (!supabase || !cartId) return
    supabase
      .from('cart_items')
      .update({ aantal })
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .then(() => {})
  },

  selecteer: (productId) => set({ geselecteerdId: productId }),

  leegmaken: () => {
    const { cartId } = get()
    set({ items: [], geselecteerdId: null })
    if (!supabase || !cartId) return
    supabase.from('cart_items').delete().eq('cart_id', cartId).then(() => {})
  },

  totaal: () =>
    get().items.reduce((sum, item) => sum + item.product.prijs * item.aantal, 0),

  laadMedewerkerCart: async (employeeId: string) => {
    const storeId = useAppStore.getState().currentStoreId
    if (!supabase || !storeId) return

    // Cleanup old subscription
    const { _channel } = get()
    if (_channel) await supabase.removeChannel(_channel)

    // Find or create active cart for this employee in this store
    let cartId: string | null = null

    const { data: existingCart } = await supabase
      .from('carts')
      .select('id')
      .eq('store_id', storeId)
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .single()

    if (existingCart) {
      cartId = existingCart.id as string
      // Load cart items
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
      set({
        cartId,
        items: (cartItems ?? []).map(dbToCartItem),
        geselecteerdId: null,
      })
    } else {
      // Create a new active cart
      const { data: newCart } = await supabase
        .from('carts')
        .insert({ store_id: storeId, employee_id: employeeId, status: 'active' })
        .select('id')
        .single()
      cartId = (newCart?.id as string) ?? null
      set({ cartId, items: [], geselecteerdId: null })
    }

    if (!cartId) return

    // Subscribe to real-time cart_items changes for this cart
    const channel = supabase
      .channel(`cart-${cartId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items', filter: `cart_id=eq.${cartId}` },
        async () => {
          // Re-fetch to get authoritative state from any terminal
          const { data } = await supabase!
            .from('cart_items')
            .select('*')
            .eq('cart_id', cartId)
          if (data) {
            set({ items: data.map(dbToCartItem) })
          }
        }
      )
      .subscribe()

    set({ _channel: channel })
  },

  ontkoppelMedewerker: async () => {
    const { _channel } = get()
    if (_channel && supabase) await supabase.removeChannel(_channel)
    // Clear local state; Supabase cart remains active for next login
    set({ items: [], geselecteerdId: null, cartId: null, _channel: null })
  },
}))

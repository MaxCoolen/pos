import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Product } from '../types'
import { supabase } from '../lib/supabase'
import { useAppStore } from './useAppStore'

const DEMO_PRODUCTS: Product[] = [
  { id: '1', naam: 'Broodje Kip',  prijs: 5.50, categorie: 'Broodjes', prijsType: 'stuk', btw: 9, kleur: '#FEF3C7' },
  { id: '2', naam: 'Kip Wrap',     prijs: 6.00, categorie: 'Broodjes', prijsType: 'stuk', btw: 9, kleur: '#FEF3C7' },
  { id: '3', naam: 'Friet',        prijs: 3.00, categorie: 'Snacks',   prijsType: 'stuk', btw: 9, kleur: '#FFF7ED' },
  { id: '4', naam: 'Kip Nuggets',  prijs: 4.50, categorie: 'Snacks',   prijsType: 'stuk', btw: 9, kleur: '#FFF7ED' },
  { id: '5', naam: 'Cola',         prijs: 2.50, categorie: 'Drank',    prijsType: 'stuk', btw: 9, kleur: '#EFF6FF' },
  { id: '6', naam: 'Fanta',        prijs: 2.50, categorie: 'Drank',    prijsType: 'stuk', btw: 9, kleur: '#FFF7ED' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToProduct(row: any): Product {
  return {
    id: row.id as string,
    naam: row.naam as string,
    prijs: Number(row.prijs),
    categorie: row.categorie as string,
    prijsType: (row.prijs_type as 'stuk' | 'kg') ?? 'stuk',
    btw: (row.btw as 0 | 9 | 21) ?? 9,
    kleur: (row.kleur as string) ?? undefined,
    variaties: row.variaties ?? [],
    extras: row.extras ?? [],
  }
}

interface ProductStore {
  producten: Product[]
  _channel: RealtimeChannel | null
  voegProductToe: (product: Omit<Product, 'id'>) => Promise<void>
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => Promise<void>
  verwijderProduct: (id: string) => Promise<void>
  initialiseer: (storeId: string) => Promise<void>
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      producten: DEMO_PRODUCTS,
      _channel: null,

      voegProductToe: async (product) => {
        const storeId = useAppStore.getState().currentStoreId
        if (supabase && storeId) {
          const { data, error } = await supabase
            .from('products')
            .insert({
              store_id: storeId,
              naam: product.naam,
              prijs: product.prijs,
              categorie: product.categorie,
              prijs_type: product.prijsType,
              btw: product.btw,
              kleur: product.kleur ?? null,
              aktief: true,
              variaties: JSON.stringify(product.variaties ?? []),
              extras: JSON.stringify(product.extras ?? []),
            })
            .select()
            .single()
          if (error) console.error(error)
          if (!error && data) {
            set((state) => {
              if (state.producten.some((p) => p.id === data.id)) return state
              return { producten: [...state.producten, dbToProduct(data)] }
            })
          }
        } else {
          set((state) => ({
            producten: [...state.producten, { ...product, id: Date.now().toString() }],
          }))
        }
      },

      updateProduct: async (id, updates) => {
        // Optimistic update
        set((state) => ({
          producten: state.producten.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
        const storeId = useAppStore.getState().currentStoreId
        if (supabase && storeId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dbUpdates: Record<string, any> = {}
          if (updates.naam !== undefined) dbUpdates.naam = updates.naam
          if (updates.prijs !== undefined) dbUpdates.prijs = updates.prijs
          if (updates.categorie !== undefined) dbUpdates.categorie = updates.categorie
          if (updates.prijsType !== undefined) dbUpdates.prijs_type = updates.prijsType
          if (updates.btw !== undefined) dbUpdates.btw = updates.btw
          if (updates.kleur !== undefined) dbUpdates.kleur = updates.kleur
          if (updates.variaties !== undefined) dbUpdates.variaties = JSON.stringify(updates.variaties)
          if (updates.extras !== undefined) dbUpdates.extras = JSON.stringify(updates.extras)
          await supabase.from('products').update(dbUpdates).eq('id', id)
        }
      },

      verwijderProduct: async (id) => {
        set((state) => ({ producten: state.producten.filter((p) => p.id !== id) }))
        if (supabase) {
          await supabase.from('products').update({ aktief: false }).eq('id', id)
        }
      },

      initialiseer: async (storeId: string) => {
        if (!supabase) return

        const { _channel } = get()
        if (_channel) await supabase.removeChannel(_channel)

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .eq('aktief', true)
        if (error) { console.error('[Producten] Fout bij laden:', error); return }

        if (data.length === 0) {
          // Eerste keer: schrijf demo-startdata éénmalig naar Supabase
          console.log('[Producten] Startdata aangemaakt in Supabase')
          const { data: inserted } = await supabase
            .from('products')
            .insert(DEMO_PRODUCTS.map((p) => ({
              store_id: storeId,
              naam: p.naam,
              prijs: p.prijs,
              categorie: p.categorie,
              prijs_type: p.prijsType,
              btw: p.btw,
              kleur: p.kleur ?? null,
              aktief: true,
              variaties: '[]',
              extras: '[]',
            })))
            .select()
          if (inserted) set({ producten: inserted.map(dbToProduct) })
        } else {
          set({ producten: data.map(dbToProduct) })
        }

        const channel = supabase
          .channel(`store-products-${storeId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${storeId}` },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (payload: any) => {
              if (payload.eventType === 'INSERT' && payload.new.aktief) {
                set((s) => {
                  if (s.producten.some((p) => p.id === payload.new.id)) return s
                  return { producten: [...s.producten, dbToProduct(payload.new)] }
                })
              } else if (payload.eventType === 'UPDATE') {
                if (!payload.new.aktief) {
                  set((s) => ({ producten: s.producten.filter((p) => p.id !== payload.new.id) }))
                } else {
                  set((s) => ({
                    producten: s.producten.map((p) => p.id === payload.new.id ? dbToProduct(payload.new) : p),
                  }))
                }
              } else if (payload.eventType === 'DELETE') {
                set((s) => ({ producten: s.producten.filter((p) => p.id !== payload.old.id) }))
              }
            }
          )
          .subscribe()

        set({ _channel: channel })
      },
    }),
    {
      name: 'pos-producten',
      version: 3,
      partialize: (s) => ({ producten: s.producten }),
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

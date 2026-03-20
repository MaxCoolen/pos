import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Korting } from '../types'
import { supabase } from '../lib/supabase'
import { useAppStore } from './useAppStore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToKorting(row: any): Korting {
  return {
    id: row.id as string,
    naam: row.naam as string,
    type: row.type as Korting['type'],
    aantalVoor: row.aantal_voor ?? undefined,
    prijsVoor: row.prijs_voor !== null ? Number(row.prijs_voor) : undefined,
    koopAantal: row.koop_aantal ?? undefined,
    gratisAantal: row.gratis_aantal ?? undefined,
    percentage: row.percentage !== null ? Number(row.percentage) : undefined,
    productIds: (row.product_ids as string[]) ?? [],
    vanDatum: row.van_datum ?? null,
    totDatum: row.tot_datum ?? null,
    actief: row.actief as boolean,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function kortingToDb(k: Omit<Korting, 'id'>, storeId: string): Record<string, any> {
  return {
    store_id: storeId,
    naam: k.naam,
    type: k.type,
    aantal_voor: k.aantalVoor ?? null,
    prijs_voor: k.prijsVoor ?? null,
    koop_aantal: k.koopAantal ?? null,
    gratis_aantal: k.gratisAantal ?? null,
    percentage: k.percentage ?? null,
    product_ids: k.productIds ?? [],
    van_datum: k.vanDatum ?? null,
    tot_datum: k.totDatum ?? null,
    actief: k.actief,
  }
}

interface KortingStore {
  kortingen: Korting[]
  _channel: RealtimeChannel | null
  voegKortingToe: (korting: Omit<Korting, 'id'>) => Promise<void>
  updateKorting: (id: string, updates: Partial<Omit<Korting, 'id'>>) => Promise<void>
  verwijderKorting: (id: string) => Promise<void>
  toggleActief: (id: string) => Promise<void>
  initialiseer: (storeId: string) => Promise<void>
}

export const useKortingStore = create<KortingStore>()(
  persist(
    (set, get) => ({
      kortingen: [],
      _channel: null,

      voegKortingToe: async (korting) => {
        const storeId = useAppStore.getState().currentStoreId
        if (supabase && storeId) {
          const { data, error } = await supabase
            .from('discounts')
            .insert(kortingToDb(korting, storeId))
            .select()
            .single()
          if (!error && data) {
            set((state) => {
              if (state.kortingen.some((k) => k.id === data.id)) return state
              return { kortingen: [...state.kortingen, dbToKorting(data)] }
            })
          }
        } else {
          set((state) => ({
            kortingen: [...state.kortingen, { ...korting, id: Date.now().toString() }],
          }))
        }
      },

      updateKorting: async (id, updates) => {
        set((state) => ({
          kortingen: state.kortingen.map((k) => (k.id === id ? { ...k, ...updates } : k)),
        }))
        if (supabase) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dbUpdates: Record<string, any> = {}
          if (updates.naam !== undefined) dbUpdates.naam = updates.naam
          if (updates.type !== undefined) dbUpdates.type = updates.type
          if (updates.aantalVoor !== undefined) dbUpdates.aantal_voor = updates.aantalVoor
          if (updates.prijsVoor !== undefined) dbUpdates.prijs_voor = updates.prijsVoor
          if (updates.koopAantal !== undefined) dbUpdates.koop_aantal = updates.koopAantal
          if (updates.gratisAantal !== undefined) dbUpdates.gratis_aantal = updates.gratisAantal
          if (updates.percentage !== undefined) dbUpdates.percentage = updates.percentage
          if (updates.productIds !== undefined) dbUpdates.product_ids = updates.productIds
          if (updates.vanDatum !== undefined) dbUpdates.van_datum = updates.vanDatum
          if (updates.totDatum !== undefined) dbUpdates.tot_datum = updates.totDatum
          if (updates.actief !== undefined) dbUpdates.actief = updates.actief
          await supabase.from('discounts').update(dbUpdates).eq('id', id)
        }
      },

      verwijderKorting: async (id) => {
        set((state) => ({ kortingen: state.kortingen.filter((k) => k.id !== id) }))
        if (supabase) {
          await supabase.from('discounts').delete().eq('id', id)
        }
      },

      toggleActief: async (id) => {
        const korting = get().kortingen.find((k) => k.id === id)
        if (!korting) return
        const nieuweWaarde = !korting.actief
        set((state) => ({
          kortingen: state.kortingen.map((k) => (k.id === id ? { ...k, actief: nieuweWaarde } : k)),
        }))
        if (supabase) {
          await supabase.from('discounts').update({ actief: nieuweWaarde }).eq('id', id)
        }
      },

      initialiseer: async (storeId: string) => {
        if (!supabase) return

        const { _channel } = get()
        if (_channel) await supabase.removeChannel(_channel)

        const { data, error } = await supabase
          .from('discounts')
          .select('*')
          .eq('store_id', storeId)
        if (!error && data) {
          set({ kortingen: data.map(dbToKorting) })
        }

        const channel = supabase
          .channel(`store-discounts-${storeId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'discounts', filter: `store_id=eq.${storeId}` },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (payload: any) => {
              if (payload.eventType === 'INSERT') {
                set((s) => {
                  if (s.kortingen.some((k) => k.id === payload.new.id)) return s
                  return { kortingen: [...s.kortingen, dbToKorting(payload.new)] }
                })
              } else if (payload.eventType === 'UPDATE') {
                set((s) => ({
                  kortingen: s.kortingen.map((k) => k.id === payload.new.id ? dbToKorting(payload.new) : k),
                }))
              } else if (payload.eventType === 'DELETE') {
                set((s) => ({ kortingen: s.kortingen.filter((k) => k.id !== payload.old.id) }))
              }
            }
          )
          .subscribe()

        set({ _channel: channel })
      },
    }),
    {
      name: 'pos-kortingen',
      version: 1,
      partialize: (s) => ({ kortingen: s.kortingen }),
      migrate: (stored: unknown) => {
        const state = stored as { kortingen?: Korting[] } | null
        return { kortingen: Array.isArray(state?.kortingen) ? state!.kortingen : [] }
      },
    }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Categorie } from '../types'
import { supabase } from '../lib/supabase'
import { useAppStore } from './useAppStore'

const DEMO_CATEGORIEEN: Categorie[] = [
  { id: '1', naam: 'Broodjes', kleur: '#FEF3C7', volgorde: 1 },
  { id: '2', naam: 'Snacks',   kleur: '#FFF7ED', volgorde: 2 },
  { id: '3', naam: 'Drank',    kleur: '#EFF6FF', volgorde: 3 },
  { id: '4', naam: 'Overig',   kleur: '#F3F4F6', volgorde: 4 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToCategorie(row: any): Categorie {
  return {
    id: row.id as string,
    naam: row.naam as string,
    kleur: row.kleur as string,
    volgorde: row.volgorde as number,
  }
}

function gesorteerd(lijst: Categorie[]): Categorie[] {
  return [...lijst].sort((a, b) => a.volgorde - b.volgorde)
}

interface CategorieStore {
  categorieen: Categorie[]
  _channel: RealtimeChannel | null
  voegCategorieToe: (cat: Omit<Categorie, 'id' | 'volgorde'>) => Promise<void>
  updateCategorie: (id: string, updates: Partial<Omit<Categorie, 'id'>>) => Promise<void>
  verwijderCategorie: (id: string) => Promise<void>
  verplaatsOmhoog: (id: string) => Promise<void>
  verplaatsOmlaag: (id: string) => Promise<void>
  initialiseer: (storeId: string) => Promise<void>
}

export const useCategorieStore = create<CategorieStore>()(
  persist(
    (set, get) => ({
      categorieen: DEMO_CATEGORIEEN,
      _channel: null,

      voegCategorieToe: async (cat) => {
        const storeId = useAppStore.getState().currentStoreId
        const maxVolgorde = Math.max(0, ...get().categorieen.map((c) => c.volgorde))
        if (supabase && storeId) {
          const { data, error } = await supabase
            .from('categories')
            .insert({ store_id: storeId, naam: cat.naam, kleur: cat.kleur, volgorde: maxVolgorde + 1 })
            .select()
            .single()
          if (!error && data) {
            set((state) => ({ categorieen: [...state.categorieen, dbToCategorie(data)] }))
          }
        } else {
          set((state) => ({
            categorieen: [
              ...state.categorieen,
              { ...cat, id: Date.now().toString(), volgorde: maxVolgorde + 1 },
            ],
          }))
        }
      },

      updateCategorie: async (id, updates) => {
        set((state) => ({
          categorieen: state.categorieen.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }))
        if (supabase) {
          await supabase.from('categories').update(updates).eq('id', id)
        }
      },

      verwijderCategorie: async (id) => {
        set((state) => ({ categorieen: state.categorieen.filter((c) => c.id !== id) }))
        if (supabase) {
          await supabase.from('categories').delete().eq('id', id)
        }
      },

      verplaatsOmhoog: async (id) => {
        const sorted = gesorteerd(get().categorieen)
        const idx = sorted.findIndex((c) => c.id === id)
        if (idx <= 0) return
        const prev = sorted[idx - 1]!
        const curr = sorted[idx]!
        set((state) => ({
          categorieen: state.categorieen.map((c) => {
            if (c.id === curr.id) return { ...c, volgorde: prev.volgorde }
            if (c.id === prev.id) return { ...c, volgorde: curr.volgorde }
            return c
          }),
        }))
        if (supabase) {
          await Promise.all([
            supabase.from('categories').update({ volgorde: prev.volgorde }).eq('id', curr.id),
            supabase.from('categories').update({ volgorde: curr.volgorde }).eq('id', prev.id),
          ])
        }
      },

      verplaatsOmlaag: async (id) => {
        const sorted = gesorteerd(get().categorieen)
        const idx = sorted.findIndex((c) => c.id === id)
        if (idx < 0 || idx >= sorted.length - 1) return
        const next = sorted[idx + 1]!
        const curr = sorted[idx]!
        set((state) => ({
          categorieen: state.categorieen.map((c) => {
            if (c.id === curr.id) return { ...c, volgorde: next.volgorde }
            if (c.id === next.id) return { ...c, volgorde: curr.volgorde }
            return c
          }),
        }))
        if (supabase) {
          await Promise.all([
            supabase.from('categories').update({ volgorde: next.volgorde }).eq('id', curr.id),
            supabase.from('categories').update({ volgorde: curr.volgorde }).eq('id', next.id),
          ])
        }
      },

      initialiseer: async (storeId: string) => {
        if (!supabase) return

        const { _channel } = get()
        if (_channel) await supabase.removeChannel(_channel)

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeId)
          .order('volgorde')
        if (!error && data) {
          set({ categorieen: data.map(dbToCategorie) })
        }

        const channel = supabase
          .channel(`store-categories-${storeId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'categories', filter: `store_id=eq.${storeId}` },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (payload: any) => {
              if (payload.eventType === 'INSERT') {
                set((s) => ({ categorieen: [...s.categorieen, dbToCategorie(payload.new)] }))
              } else if (payload.eventType === 'UPDATE') {
                set((s) => ({
                  categorieen: s.categorieen.map((c) =>
                    c.id === payload.new.id ? dbToCategorie(payload.new) : c
                  ),
                }))
              } else if (payload.eventType === 'DELETE') {
                set((s) => ({ categorieen: s.categorieen.filter((c) => c.id !== payload.old.id) }))
              }
            }
          )
          .subscribe()

        set({ _channel: channel })
      },
    }),
    {
      name: 'pos-categorieen',
      version: 1,
      partialize: (s) => ({ categorieen: s.categorieen }),
      migrate: (stored: unknown) => {
        const state = stored as { categorieen?: Categorie[] } | null
        const lijst = Array.isArray(state?.categorieen) ? state!.categorieen : DEMO_CATEGORIEEN
        return { categorieen: lijst.map((c, i) => ({ ...c, volgorde: c.volgorde ?? i + 1 })) }
      },
    }
  )
)

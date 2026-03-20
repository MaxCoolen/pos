import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAppStore } from './useAppStore'

export type MedewerkerRol = 'admin' | 'medewerker'

export interface Medewerker {
  id: string
  naam: string
  initialen: string
  kleur: string
  rol: MedewerkerRol
}

const KLEUREN = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316']
export { KLEUREN as MEDEWERKER_KLEUREN }

const DEMO_MEDEWERKERS: Medewerker[] = [
  { id: '1', naam: 'Sarah de Vries', initialen: 'SV', kleur: '#3B82F6', rol: 'admin' },
  { id: '2', naam: 'Tom Bakker',     initialen: 'TB', kleur: '#10B981', rol: 'medewerker' },
  { id: '3', naam: 'Lisa Janssen',   initialen: 'LJ', kleur: '#F59E0B', rol: 'medewerker' },
  { id: '4', naam: 'Mark Peters',    initialen: 'MP', kleur: '#8B5CF6', rol: 'medewerker' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToMedewerker(row: any): Medewerker {
  return {
    id: row.id as string,
    naam: row.naam as string,
    initialen: row.initialen as string,
    kleur: row.kleur as string,
    rol: (row.rol as MedewerkerRol) ?? 'medewerker',
  }
}

interface PersoneelStore {
  medewerkers: Medewerker[]
  activeMedewerkerId: string | null
  _channel: RealtimeChannel | null
  setActiveMedewerker: (id: string | null) => void
  voegMedewerkerToe: (m: Omit<Medewerker, 'id'>) => Promise<void>
  updateMedewerker: (id: string, updates: Partial<Omit<Medewerker, 'id'>>) => Promise<void>
  verwijderMedewerker: (id: string) => Promise<void>
  initialiseer: (storeId: string) => Promise<void>
}

export const usePersoneelStore = create<PersoneelStore>()(
  persist(
    (set, get) => ({
      medewerkers: DEMO_MEDEWERKERS,
      activeMedewerkerId: null,
      _channel: null,

      setActiveMedewerker: (id) => set({ activeMedewerkerId: id }),

      voegMedewerkerToe: async (m) => {
        const storeId = useAppStore.getState().currentStoreId
        if (supabase && storeId) {
          // Don't update local state here — the realtime subscription will fire
          // on the INSERT and add the employee, preventing a duplicate
          await supabase
            .from('employees')
            .insert({ store_id: storeId, naam: m.naam, initialen: m.initialen, kleur: m.kleur, rol: m.rol, aktief: true })
        } else {
          set((state) => ({
            medewerkers: [...state.medewerkers, { ...m, id: Date.now().toString() }],
          }))
        }
      },

      updateMedewerker: async (id, updates) => {
        set((state) => ({
          medewerkers: state.medewerkers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }))
        if (supabase) {
          await supabase.from('employees').update(updates).eq('id', id)
        }
      },

      verwijderMedewerker: async (id) => {
        set((state) => ({
          medewerkers: state.medewerkers.filter((m) => m.id !== id),
          activeMedewerkerId: state.activeMedewerkerId === id ? null : state.activeMedewerkerId,
        }))
        if (supabase) {
          await supabase.from('employees').update({ aktief: false }).eq('id', id)
        }
      },

      initialiseer: async (storeId: string) => {
        if (!supabase) return

        const { _channel } = get()
        if (_channel) await supabase.removeChannel(_channel)

        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('store_id', storeId)
          .eq('aktief', true)
        if (error) { console.error('[Personeel] Fout bij laden:', error); return }
        if (data) set({ medewerkers: data.map(dbToMedewerker) })

        const channel = supabase
          .channel(`store-employees-${storeId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'employees', filter: `store_id=eq.${storeId}` },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (payload: any) => {
              if (payload.eventType === 'INSERT' && payload.new.aktief) {
                set((s) => ({ medewerkers: [...s.medewerkers, dbToMedewerker(payload.new)] }))
              } else if (payload.eventType === 'UPDATE') {
                if (!payload.new.aktief) {
                  set((s) => ({ medewerkers: s.medewerkers.filter((m) => m.id !== payload.new.id) }))
                } else {
                  set((s) => ({
                    medewerkers: s.medewerkers.map((m) =>
                      m.id === payload.new.id ? dbToMedewerker(payload.new) : m
                    ),
                  }))
                }
              } else if (payload.eventType === 'DELETE') {
                set((s) => ({ medewerkers: s.medewerkers.filter((m) => m.id !== payload.old.id) }))
              }
            }
          )
          .subscribe()

        set({ _channel: channel })
      },
    }),
    {
      name: 'pos-personeel',
      version: 2,
      partialize: (s) => ({ medewerkers: s.medewerkers }),
      migrate: (stored: unknown) => {
        const state = stored as { medewerkers?: Medewerker[] } | null
        if (!Array.isArray(state?.medewerkers)) return { medewerkers: DEMO_MEDEWERKERS }
        return {
          ...state,
          medewerkers: state!.medewerkers.map((m) => ({
            ...m,
            rol: (m as Medewerker & { rol?: MedewerkerRol }).rol ?? 'medewerker',
          })),
        }
      },
    }
  )
)

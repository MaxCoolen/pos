import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

interface PersoneelStore {
  medewerkers: Medewerker[]
  activeMedewerkerId: string | null
  setActiveMedewerker: (id: string | null) => void
  voegMedewerkerToe: (m: Omit<Medewerker, 'id'>) => void
  updateMedewerker: (id: string, updates: Partial<Omit<Medewerker, 'id'>>) => void
  verwijderMedewerker: (id: string) => void
}

export const usePersoneelStore = create<PersoneelStore>()(
  persist(
    (set) => ({
      medewerkers: DEMO_MEDEWERKERS,
      activeMedewerkerId: null,

      setActiveMedewerker: (id) => set({ activeMedewerkerId: id }),

      voegMedewerkerToe: (m) =>
        set((state) => ({
          medewerkers: [...state.medewerkers, { ...m, id: Date.now().toString() }],
        })),

      updateMedewerker: (id, updates) =>
        set((state) => ({
          medewerkers: state.medewerkers.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      verwijderMedewerker: (id) =>
        set((state) => ({
          medewerkers: state.medewerkers.filter((m) => m.id !== id),
          activeMedewerkerId:
            state.activeMedewerkerId === id ? null : state.activeMedewerkerId,
        })),
    }),
    {
      name: 'pos-personeel',
      version: 2,
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

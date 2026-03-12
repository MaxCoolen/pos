import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAppStore } from './useAppStore'
import { usePersoneelStore } from './usePersoneelStore'

interface AuthStore {
  session: Session | null
  user: User | null
  laden: boolean
  fout: string | null
  initialiseer: () => Promise<void>
  inloggen: (email: string, wachtwoord: string) => Promise<boolean>
  registreren: (email: string, wachtwoord: string) => Promise<boolean>
  uitloggen: () => Promise<void>
  setSession: (session: Session | null) => void
}

export const useAuthStore = create<AuthStore>()((set) => ({
  session: null,
  user: null,
  laden: true,
  fout: null,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  initialiseer: async () => {
    if (!supabase) {
      set({ laden: false })
      return
    }

    // Restore persisted session from localStorage
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, laden: false })

    // Listen for future auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },

  inloggen: async (email, wachtwoord) => {
    if (!supabase) return false
    set({ laden: true, fout: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord })
    if (error) {
      set({ fout: error.message, laden: false })
      return false
    }
    set({ session: data.session, user: data.user, laden: false })
    return true
  },

  registreren: async (email, wachtwoord) => {
    if (!supabase) return false
    set({ laden: true, fout: null })
    const { data, error } = await supabase.auth.signUp({ email, password: wachtwoord })
    if (error) {
      set({ fout: error.message, laden: false })
      return false
    }
    set({ session: data.session, user: data.user, laden: false })
    return true
  },

  uitloggen: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    set({ session: null, user: null })
    useAppStore.getState().setCurrentStoreId(null)
    usePersoneelStore.getState().setActiveMedewerker(null)
  },
}))

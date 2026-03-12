import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Page } from '../types'

interface AppStore {
  huidigePagina: Page
  sidebarIngeklapt: boolean
  currentStoreId: string | null
  navigeerNaar: (pagina: Page) => void
  toggleSidebar: () => void
  setCurrentStoreId: (id: string | null) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      huidigePagina: 'pos',
      sidebarIngeklapt: false,
      currentStoreId: null,

      navigeerNaar: (pagina) => set({ huidigePagina: pagina }),
      toggleSidebar: () =>
        set((state) => ({ sidebarIngeklapt: !state.sidebarIngeklapt })),
      setCurrentStoreId: (id) => set({ currentStoreId: id }),
    }),
    {
      name: 'pos-app',
      partialize: (s) => ({
        sidebarIngeklapt: s.sidebarIngeklapt,
        currentStoreId: s.currentStoreId,
      }),
    }
  )
)

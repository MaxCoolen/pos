import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Page } from '../types'

interface AppStore {
  huidigePagina: Page
  sidebarIngeklapt: boolean
  navigeerNaar: (pagina: Page) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      huidigePagina: 'pos',
      sidebarIngeklapt: false,

      navigeerNaar: (pagina) => set({ huidigePagina: pagina }),
      toggleSidebar: () =>
        set((state) => ({ sidebarIngeklapt: !state.sidebarIngeklapt })),
    }),
    { name: 'pos-app', partialize: (s) => ({ sidebarIngeklapt: s.sidebarIngeklapt }) }
  )
)

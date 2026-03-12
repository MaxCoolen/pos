import { create } from 'zustand'

interface BetalingStore {
  isOpen: boolean
  openModal: () => void
  sluitModal: () => void
}

export const useBetalingStore = create<BetalingStore>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  sluitModal: () => set({ isOpen: false }),
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Instellingen {
  // Algemeen
  bedrijfsnaam: string
  btwStandaard: 9 | 21
  // Bedrijfsinfo
  adres: string
  postcode: string
  plaats: string
  telefoon: string
  email: string
  btwNummer: string
  kvkNummer: string
  // Logo (base64 data URL or null)
  logo: string | null
  // Bon layout
  bonHeader: string
  bonFooter: string
  bonQrUrl: string
  // POS gedrag
  categorieReset: boolean
  geluid: boolean
  // Interface
  darkMode: boolean
}

interface InstellingenStore extends Instellingen {
  update: (updates: Partial<Instellingen>) => void
}

export const useInstellingenStore = create<InstellingenStore>()(
  persist(
    (set) => ({
      bedrijfsnaam: 'Mijn POS',
      btwStandaard: 9,
      adres: '',
      postcode: '',
      plaats: '',
      telefoon: '',
      email: '',
      btwNummer: '',
      kvkNummer: '',
      logo: null,
      bonHeader: '',
      bonFooter: 'Bedankt voor uw bezoek!',
      bonQrUrl: '',
      categorieReset: false,
      geluid: false,
      darkMode: false,

      update: (updates) => set((state) => ({ ...state, ...updates })),
    }),
    { name: 'pos-instellingen' }
  )
)

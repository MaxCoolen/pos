import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { useAppStore } from './useAppStore'

export type ThemaModus = 'light' | 'dark' | 'auto'

export interface Instellingen {
  bedrijfsnaam: string
  btwStandaard: 9 | 21
  adres: string
  postcode: string
  plaats: string
  telefoon: string
  email: string
  btwNummer: string
  kvkNummer: string
  logo: string | null
  bonHeader: string
  bonFooter: string
  bonQrUrl: string
  categorieReset: boolean
  geluid: boolean
  thema: ThemaModus
  klantenschermAutoOpen: boolean
}

interface InstellingenStore extends Instellingen {
  update: (updates: Partial<Instellingen>) => void
  initialiseer: (storeId: string) => Promise<void>
}

/**
 * Berekent het actieve thema op basis van de instelling en (bij 'auto') de systeemtijd.
 * Automatisch: licht tussen 07:00–20:00, donker buiten die tijden.
 */
export function berekenActiefThema(thema: ThemaModus): 'light' | 'dark' {
  if (thema === 'dark') return 'dark'
  if (thema === 'light') return 'light'
  const uur = new Date().getHours()
  return uur >= 7 && uur < 20 ? 'light' : 'dark'
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
      thema: 'dark',
      klantenschermAutoOpen: false,

      update: (updates) => {
        set((state) => ({ ...state, ...updates }))
        // Sync to Supabase in background
        const storeId = useAppStore.getState().currentStoreId
        if (supabase && storeId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dbUpdates: Record<string, any> = {}
          if (updates.bedrijfsnaam !== undefined) dbUpdates.bedrijfsnaam = updates.bedrijfsnaam
          if (updates.adres !== undefined) dbUpdates.adres = updates.adres
          if (updates.postcode !== undefined) dbUpdates.postcode = updates.postcode
          if (updates.plaats !== undefined) dbUpdates.plaats = updates.plaats
          if (updates.telefoon !== undefined) dbUpdates.telefoon = updates.telefoon
          if (updates.email !== undefined) dbUpdates.email = updates.email
          if (updates.btwNummer !== undefined) dbUpdates.btw_nummer = updates.btwNummer
          if (updates.kvkNummer !== undefined) dbUpdates.kvk_nummer = updates.kvkNummer
          if (updates.logo !== undefined) dbUpdates.logo_url = updates.logo
          if (updates.bonHeader !== undefined) dbUpdates.bon_header = updates.bonHeader
          if (updates.bonFooter !== undefined) dbUpdates.bon_footer = updates.bonFooter
          if (updates.bonQrUrl !== undefined) dbUpdates.bon_qr_url = updates.bonQrUrl
          if (updates.btwStandaard !== undefined) dbUpdates.btw_standaard = updates.btwStandaard
          if (updates.thema !== undefined) dbUpdates.dark_mode = updates.thema === 'dark'
          if (Object.keys(dbUpdates).length > 0) {
            supabase
              .from('store_settings')
              .upsert({ store_id: storeId, ...dbUpdates })
              .then(() => {})
          }
        }
      },

      initialiseer: async (storeId: string) => {
        if (!supabase) return
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('store_id', storeId)
          .single()
        if (error || !data) {
          await supabase.from('store_settings').insert({ store_id: storeId })
          return
        }
        set({
          bedrijfsnaam: data.bedrijfsnaam ?? 'Mijn POS',
          adres: data.adres ?? '',
          postcode: data.postcode ?? '',
          plaats: data.plaats ?? '',
          telefoon: data.telefoon ?? '',
          email: data.email ?? '',
          btwNummer: data.btw_nummer ?? '',
          kvkNummer: data.kvk_nummer ?? '',
          logo: data.logo_url ?? null,
          bonHeader: data.bon_header ?? '',
          bonFooter: data.bon_footer ?? 'Bedankt voor uw bezoek!',
          bonQrUrl: data.bon_qr_url ?? '',
          btwStandaard: (data.btw_standaard as 9 | 21) ?? 9,
          // Migreer dark_mode boolean → thema string
          thema: (data.dark_mode as boolean) ? 'dark' : 'light',
        })
      },
    }),
    { name: 'pos-instellingen' }
  )
)

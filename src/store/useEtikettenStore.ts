import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── types ────────────────────────────────────────────────────────────────────

export const LABEL_GROOTTES = ['50x30', '70x40', '100x50', '100x70', '148x105'] as const
export type LabelGrootte = (typeof LABEL_GROOTTES)[number]

export const LABEL_GROOTTE_LABELS: Record<LabelGrootte, string> = {
  '50x30':   '50 × 30 mm',
  '70x40':   '70 × 40 mm',
  '100x50':  '100 × 50 mm',
  '100x70':  '100 × 70 mm',
  '148x105': '148 × 105 mm (A6)',
}

export interface Ingredient {
  id: string
  naam: string
  percentage: string  // optional, stored as string
  isAllergen: boolean // bold in ingredient list
}

export interface Voedingswaarden {
  energie_kj: string
  energie_kcal: string
  vet: string
  vet_verzadigd: string
  koolhydraten: string
  suikers: string
  eiwitten: string
  zout: string
}

export const LEGE_VOEDINGSWAARDEN: Voedingswaarden = {
  energie_kj: '',
  energie_kcal: '',
  vet: '',
  vet_verzadigd: '',
  koolhydraten: '',
  suikers: '',
  eiwitten: '',
  zout: '',
}

export type VoedingseenheidType = 'per 100g' | 'per 100ml'

export interface EtiketProduct {
  id: string
  naam: string
  ingredienten: Ingredient[]
  voedingswaarden: Voedingswaarden
  eenheid: VoedingseenheidType
  bereidingswijze: string
  allergenen: string[]          // selected from EU 14
  labelGrootte: LabelGrootte
  includeRegulationFooter: boolean
  aangemaakt: string
  bijgewerkt: string
}

interface EtikettenStore {
  producten: EtiketProduct[]
  opslaanProduct: (p: Omit<EtiketProduct, 'id' | 'aangemaakt' | 'bijgewerkt'> & { id?: string }) => string
  verwijderProduct: (id: string) => void
}

export const useEtikettenStore = create<EtikettenStore>()(
  persist(
    (set) => ({
      producten: [],

      opslaanProduct: (p) => {
        const now = new Date().toISOString()
        if (p.id) {
          // update existing
          set((state) => ({
            producten: state.producten.map((ep) =>
              ep.id === p.id ? { ...ep, ...p, bijgewerkt: now } as EtiketProduct : ep
            ),
          }))
          return p.id
        } else {
          // new
          const id = Date.now().toString()
          const volledig: EtiketProduct = {
            ...p,
            id,
            aangemaakt: now,
            bijgewerkt: now,
          }
          set((state) => ({ producten: [volledig, ...state.producten] }))
          return id
        }
      },

      verwijderProduct: (id) =>
        set((state) => ({
          producten: state.producten.filter((p) => p.id !== id),
        })),
    }),
    { name: 'pos-etiketten' }
  )
)

// ─── 14 EU allergenen (NL) ────────────────────────────────────────────────────

export const EU_ALLERGENEN = [
  'Gluten (granen)',
  'Schaaldieren',
  'Eieren',
  'Vis',
  "Pinda's",
  'Sojabonen',
  'Melk / Lactose',
  'Noten',
  'Selderij',
  'Mosterd',
  'Sesamzaad',
  'Zwaveldioxide / Sulfieten',
  'Lupine',
  'Weekdieren',
] as const

export type EUAllergen = (typeof EU_ALLERGENEN)[number]

export type BtwPercentage = 0 | 9 | 21

export interface ProductVariatie {
  id: string
  naam: string
  meerprijs: number   // additional price on top of base price
}

export interface ProductExtra {
  id: string
  naam: string
  meerprijs: number   // 0 = free extra
}

export interface Product {
  id: string
  naam: string
  prijs: number
  categorie: string   // dynamic – matches Categorie.naam
  prijsType: 'stuk' | 'kg'
  btw: BtwPercentage
  kleur?: string
  variaties?: ProductVariatie[]
  extras?: ProductExtra[]
}

export interface CartItem {
  product: Product
  aantal: number
}

export type Page = 'pos' | 'productbeheer' | 'rapportages' | 'instellingen' | 'etiketten'

export interface TransactieRegel {
  naam: string
  categorie: string
  aantal: number
  prijs: number
}

export type Betaalmethode = 'contant' | 'pin' | 'cadeaubon' | 'gesplitst'

export interface KortingRegel {
  kortingId: string
  naam: string
  bedrag: number
  type: string
}

export interface BonData {
  transactieId: string
  tijdstip: string
  regels: TransactieRegel[]
  kortingRegels: KortingRegel[]
  totaalVoorKorting: number
  totaalNaKorting: number
  btw: number
  betaalmethode: Betaalmethode
  betaaldCents?: number
  wisselgeldCents?: number
  medewerker?: string
}

export interface Transactie {
  id: string
  tijdstip: string
  regels: TransactieRegel[]
  totaal: number
  btw: number
  betaalmethode?: Betaalmethode
  medewerker?: string              // first name of the active employee
  // multi-store / multi-terminal
  storeId?: string
  employeeId?: string
  betaaldCents?: number
  wisselgeldCents?: number
  // refund support
  isTerugboeking?: boolean         // true = this is a refund record
  origineelTransactieId?: string   // which transaction was refunded
  isTerugGeboekt?: boolean         // true = original has been refunded
}

export interface Dagafsluiting {
  id: string
  datum: string           // yyyy-mm-dd
  tijdstip: string        // ISO timestamp of closing
  aantalTransacties: number
  omzet: number
  contant: number
  pin: number
  cadeaubon: number
  btw: number
}

export interface Categorie {
  id: string
  naam: string
  kleur: string   // hex color
  volgorde: number
}

export type KortingType = 'stapel' | 'gratis' | 'percentage'

export interface Korting {
  id: string
  naam: string
  type: KortingType
  // Stapelkorting: X stuks voor €Y
  aantalVoor?: number
  prijsVoor?: number
  // X + Y gratis: koop X, krijg Y gratis
  koopAantal?: number
  gratisAantal?: number
  // Percentagekorting
  percentage?: number
  // Scope
  productIds: string[]    // empty = all products
  vanDatum: string | null // ISO date yyyy-mm-dd
  totDatum: string | null
  actief: boolean
}

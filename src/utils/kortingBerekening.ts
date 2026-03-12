import type { CartItem, Korting } from '../types'

export interface KortingRegel {
  kortingId: string
  naam: string
  bedrag: number
  type: string
}

export function berekenKortingen(
  items: CartItem[],
  kortingen: Korting[]
): { regels: KortingRegel[]; totaal: number } {
  const vandaag = new Date().toISOString().slice(0, 10)
  const regels: KortingRegel[] = []

  for (const k of kortingen) {
    if (!k.actief) continue
    if (k.vanDatum && k.vanDatum > vandaag) continue
    if (k.totDatum && k.totDatum < vandaag) continue

    const betreft =
      k.productIds.length === 0
        ? items
        : items.filter((i) => k.productIds.includes(i.product.id))

    if (betreft.length === 0) continue

    let bedrag = 0

    if (k.type === 'percentage' && k.percentage != null) {
      const sub = betreft.reduce((s, i) => s + i.product.prijs * i.aantal, 0)
      bedrag = (sub * k.percentage) / 100
    } else if (k.type === 'stapel' && k.aantalVoor && k.prijsVoor) {
      for (const item of betreft) {
        const sets = Math.floor(item.aantal / k.aantalVoor)
        if (sets > 0) {
          const normaalPrijs = item.product.prijs * sets * k.aantalVoor
          const stapelPrijs = sets * k.prijsVoor
          bedrag += normaalPrijs - stapelPrijs
        }
      }
    } else if (k.type === 'gratis' && k.koopAantal && k.gratisAantal) {
      const setGrootte = k.koopAantal + k.gratisAantal
      for (const item of betreft) {
        const sets = Math.floor(item.aantal / setGrootte)
        if (sets > 0) {
          bedrag += sets * k.gratisAantal * item.product.prijs
        }
      }
    }

    if (bedrag > 0.005) {
      regels.push({ kortingId: k.id, naam: k.naam, bedrag, type: k.type })
    }
  }

  return { regels, totaal: regels.reduce((s, r) => s + r.bedrag, 0) }
}

/**
 * Returns a map of productId → discount amount so individual cart rows can
 * display their discounted line total.
 */
export function berekenItemKortingMap(
  items: CartItem[],
  kortingen: Korting[]
): Map<string, number> {
  const map = new Map<string, number>()
  const vandaag = new Date().toISOString().slice(0, 10)

  for (const k of kortingen) {
    if (!k.actief) continue
    if (k.vanDatum && k.vanDatum > vandaag) continue
    if (k.totDatum && k.totDatum < vandaag) continue

    const betreft =
      k.productIds.length === 0
        ? items
        : items.filter((i) => k.productIds.includes(i.product.id))

    if (betreft.length === 0) continue

    for (const item of betreft) {
      let bedrag = 0

      if (k.type === 'percentage' && k.percentage != null) {
        bedrag = item.product.prijs * item.aantal * (k.percentage / 100)
      } else if (k.type === 'stapel' && k.aantalVoor && k.prijsVoor) {
        const sets = Math.floor(item.aantal / k.aantalVoor)
        if (sets > 0) {
          bedrag = item.product.prijs * sets * k.aantalVoor - sets * k.prijsVoor
        }
      } else if (k.type === 'gratis' && k.koopAantal && k.gratisAantal) {
        const setGrootte = k.koopAantal + k.gratisAantal
        const sets = Math.floor(item.aantal / setGrootte)
        if (sets > 0) {
          bedrag = sets * k.gratisAantal * item.product.prijs
        }
      }

      if (bedrag > 0.005) {
        map.set(item.product.id, (map.get(item.product.id) ?? 0) + bedrag)
      }
    }
  }

  return map
}

import { create } from 'zustand'
import type { Transactie } from '../types'

// ─── date helpers ─────────────────────────────────────────────────────────────

export function startVanDag(d: Date): Date {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r
}
export function eindVanDag(d: Date): Date {
  const r = new Date(d); r.setHours(23, 59, 59, 999); return r
}
export function startVanWeek(d: Date): Date {
  const r = new Date(d)
  const dow = r.getDay() === 0 ? 6 : r.getDay() - 1 // Mon=0
  r.setDate(r.getDate() - dow)
  r.setHours(0, 0, 0, 0)
  return r
}
export function startVanMaand(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

// ─── store ────────────────────────────────────────────────────────────────────

interface TransactieStore {
  transacties: Transactie[]
  voegTransactieToe: (t: Transactie) => void
  terugboekenTransactie: (id: string) => void
  filterTransacties: (van: Date, tot: Date) => Transactie[]
}

export const useTransactieStore = create<TransactieStore>((set, get) => ({
  transacties: [],

  voegTransactieToe: (transactie) =>
    set((state) => ({
      transacties: [transactie, ...state.transacties],
    })),

  terugboekenTransactie: (id) =>
    set((state) => {
      const origineel = state.transacties.find((t) => t.id === id)
      if (!origineel || origineel.isTerugGeboekt) return state

      const terugboeking: Transactie = {
        id: `TRX-REFUND-${Date.now()}`,
        tijdstip: new Date().toISOString(),
        regels: origineel.regels.map((r) => ({ ...r, prijs: -r.prijs })),
        totaal: -origineel.totaal,
        btw: -origineel.btw,
        betaalmethode: origineel.betaalmethode,
        isTerugboeking: true,
        origineelTransactieId: id,
      }

      return {
        transacties: state.transacties.map((t) =>
          t.id === id ? { ...t, isTerugGeboekt: true } : t
        ).concat([terugboeking]),
      }
    }),

  filterTransacties: (van: Date, tot: Date) => {
    const start = startVanDag(van).getTime()
    const eind = eindVanDag(tot).getTime()
    return get().transacties.filter((t) => {
      const ts = new Date(t.tijdstip).getTime()
      return ts >= start && ts <= eind
    })
  },
}))

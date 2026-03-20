import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Transactie } from '../types'
import { supabase } from '../lib/supabase'

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

// ─── DB mapping ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToTransactie(row: any, regels: any[]): Transactie {
  return {
    id: row.id as string,
    tijdstip: row.tijdstip as string,
    regels: regels.map((r) => ({
      naam: r.naam as string,
      categorie: r.categorie as string,
      aantal: Number(r.aantal),
      prijs: Number(r.prijs),
    })),
    totaal: Number(row.totaal),
    btw: Number(row.btw),
    betaalmethode: row.betaalmethode,
    medewerker: row.employee_naam ?? undefined,
    storeId: row.store_id ?? undefined,
    employeeId: row.employee_id ?? undefined,
    betaaldCents: row.betaald_cents ?? undefined,
    wisselgeldCents: row.wisselgeld_cents ?? undefined,
    isTerugboeking: row.is_terugboeking ?? false,
    origineelTransactieId: row.origineel_transactie_id ?? undefined,
    isTerugGeboekt: row.is_terug_geboekt ?? false,
  }
}

// ─── store ────────────────────────────────────────────────────────────────────

interface TransactieStore {
  transacties: Transactie[]
  pendingSyncCount: number
  _channel: RealtimeChannel | null
  voegTransactieToe: (t: Transactie) => Promise<void>
  terugboekenTransactie: (id: string) => Promise<void>
  filterTransacties: (van: Date, tot: Date) => Transactie[]
  flushPendingQueue: (storeId: string) => Promise<void>
  initialiseer: (storeId: string) => Promise<void>
}

export const useTransactieStore = create<TransactieStore>((set, get) => ({
  transacties: [],
  pendingSyncCount: JSON.parse(localStorage.getItem('pos-pending-sync') ?? '[]').length,
  _channel: null,

  voegTransactieToe: async (transactie) => {
    // Always add to local state immediately
    set((state) => ({ transacties: [transactie, ...state.transacties] }))

    if (!supabase || !transactie.storeId) return

    // Write transaction header
    const { data: dbTransactie, error } = await supabase
      .from('transactions')
      .insert({
        id: transactie.id,
        store_id: transactie.storeId,
        employee_id: transactie.employeeId ?? null,
        employee_naam: transactie.medewerker ?? null,
        totaal: transactie.totaal,
        btw: transactie.btw,
        betaalmethode: transactie.betaalmethode ?? 'contant',
        betaald_cents: transactie.betaaldCents ?? null,
        wisselgeld_cents: transactie.wisselgeldCents ?? null,
        is_terugboeking: transactie.isTerugboeking ?? false,
        origineel_transactie_id: transactie.origineelTransactieId ?? null,
        tijdstip: transactie.tijdstip,
      })
      .select('id')
      .single()

    if (error || !dbTransactie) {
      console.error('[Transactie] Supabase insert mislukt, naar offline queue:', error)
      const queue = JSON.parse(localStorage.getItem('pos-pending-sync') ?? '[]') as Transactie[]
      if (!queue.find((q) => q.id === transactie.id)) {
        localStorage.setItem('pos-pending-sync', JSON.stringify([...queue, transactie]))
        set((s) => ({ pendingSyncCount: s.pendingSyncCount + 1 }))
      }
      return
    }

    // Write transaction lines
    if (transactie.regels.length > 0) {
      await supabase.from('transaction_lines').insert(
        transactie.regels.map((r) => ({
          transaction_id: dbTransactie.id,
          naam: r.naam,
          categorie: r.categorie,
          aantal: r.aantal,
          prijs: r.prijs,
        }))
      )
    }
  },

  terugboekenTransactie: async (id) => {
    const origineel = get().transacties.find((t) => t.id === id)
    if (!origineel || origineel.isTerugGeboekt) return

    const terugboeking: Transactie = {
      id: crypto.randomUUID(),
      tijdstip: new Date().toISOString(),
      regels: origineel.regels.map((r) => ({ ...r, prijs: -r.prijs })),
      totaal: -origineel.totaal,
      btw: -origineel.btw,
      betaalmethode: origineel.betaalmethode,
      storeId: origineel.storeId,
      employeeId: origineel.employeeId,
      isTerugboeking: true,
      origineelTransactieId: id,
    }

    set((state) => ({
      transacties: state.transacties
        .map((t) => (t.id === id ? { ...t, isTerugGeboekt: true } : t))
        .concat([terugboeking]),
    }))

    if (supabase) {
      await supabase
        .from('transactions')
        .update({ is_terug_geboekt: true })
        .eq('id', id)
    }

    await get().voegTransactieToe(terugboeking)
  },

  flushPendingQueue: async (storeId: string) => {
    if (!supabase) return
    const queue = JSON.parse(localStorage.getItem('pos-pending-sync') ?? '[]') as Transactie[]
    if (queue.length === 0) return

    const mislukt: Transactie[] = []
    for (const t of queue) {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          id: t.id,
          store_id: storeId,
          employee_id: t.employeeId ?? null,
          employee_naam: t.medewerker ?? null,
          totaal: t.totaal,
          btw: t.btw,
          betaalmethode: t.betaalmethode ?? 'contant',
          betaald_cents: t.betaaldCents ?? null,
          wisselgeld_cents: t.wisselgeldCents ?? null,
          is_terugboeking: t.isTerugboeking ?? false,
          origineel_transactie_id: t.origineelTransactieId ?? null,
          tijdstip: t.tijdstip,
        })
        .select('id')
        .single()
      if (error || !data) { mislukt.push(t); continue }
      if (t.regels.length > 0) {
        await supabase.from('transaction_lines').insert(
          t.regels.map((r) => ({
            transaction_id: data.id,
            naam: r.naam,
            categorie: r.categorie,
            aantal: r.aantal,
            prijs: r.prijs,
          }))
        )
      }
    }
    localStorage.setItem('pos-pending-sync', JSON.stringify(mislukt))
    set({ pendingSyncCount: mislukt.length })
  },

  filterTransacties: (van: Date, tot: Date) => {
    const start = startVanDag(van).getTime()
    const eind = eindVanDag(tot).getTime()
    return get().transacties.filter((t) => {
      const ts = new Date(t.tijdstip).getTime()
      return ts >= start && ts <= eind
    })
  },

  initialiseer: async (storeId: string) => {
    if (!supabase) return

    const { _channel } = get()
    if (_channel) await supabase.removeChannel(_channel)

    // Fetch transactions from the last 30 days
    const vanDatum = new Date()
    vanDatum.setDate(vanDatum.getDate() - 30)

    const { data: transacties, error } = await supabase
      .from('transactions')
      .select('*, transaction_lines(*)')
      .eq('store_id', storeId)
      .gte('tijdstip', vanDatum.toISOString())
      .order('tijdstip', { ascending: false })

    if (!error && transacties) {
      set({
        transacties: transacties.map((t) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dbToTransactie(t, (t as any).transaction_lines ?? [])
        ),
      })
    }

    // Subscribe to new transactions
    const channel = supabase
      .channel(`store-transactions-${storeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `store_id=eq.${storeId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          // Skip if we already have it (own write)
          if (get().transacties.find((t) => t.id === payload.new.id)) return
          // Fetch lines for the new transaction
          const { data: lines } = await supabase!
            .from('transaction_lines')
            .select('*')
            .eq('transaction_id', payload.new.id)
          set((state) => ({
            transacties: [dbToTransactie(payload.new, lines ?? []), ...state.transacties],
          }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `store_id=eq.${storeId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          set((state) => ({
            transacties: state.transacties.map((t) =>
              t.id === payload.new.id
                ? { ...t, isTerugGeboekt: payload.new.is_terug_geboekt }
                : t
            ),
          }))
        }
      )
      .subscribe()

    set({ _channel: channel })

    await get().flushPendingQueue(storeId)
    window.addEventListener('online', () => { void get().flushPendingQueue(storeId) })
  },
}))

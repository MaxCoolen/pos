/**
 * useMollieTerminal
 *
 * Beheert de volledige Mollie Terminal betaalflow:
 *   terminals_laden → terminal_kiezen → betaling_starten → wachten (polling) → geslaagd/mislukt
 *
 * Gebruik:
 *   const {
 *     status, foutmelding, terminals, changePaymentStateUrl,
 *     laadTerminals, startBetaling, simuleer, annuleer, opnieuw
 *   } = useMollieTerminal()
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const BACKEND_URL    = import.meta.env.VITE_BACKEND_URL as string | undefined
const POLL_INTERVAL  = 2000
const TAG            = '[useMollieTerminal]'

// ─── types ────────────────────────────────────────────────────────────────────

export type MollieTerminalStatus =
  | 'idle'             // beginstand
  | 'terminals_laden'  // terminals ophalen via backend
  | 'terminal_kiezen'  // wacht op terminalselectie door kassier
  | 'betaling_starten' // PaymentIntent aanmaken
  | 'wachten'          // wacht op kaart (polling actief)
  | 'geslaagd'         // betaling gelukt ✓
  | 'mislukt'          // betaling geweigerd / geannuleerd
  | 'fout'             // technische fout

export interface MollieTerminalInfo {
  id:          string
  description: string
  brand:       string
  model:       string
  status:      string
}

export interface MollieTerminalState {
  status:                  MollieTerminalStatus
  foutmelding:             string | null
  terminals:               MollieTerminalInfo[]
  geselecteerdeTerminalId: string | null
  betalingId:              string | null
  changePaymentStateUrl:   string | null
}

// ─── api helpers ──────────────────────────────────────────────────────────────

function assertBackend(): void {
  if (!BACKEND_URL) throw new Error('VITE_BACKEND_URL is niet ingesteld in .env')
}

async function apiGet<T>(path: string): Promise<T> {
  assertBackend()
  const res = await fetch(`${BACKEND_URL}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Backend fout: ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  assertBackend()
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? `Backend fout: ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ─── Mollie payment statuses die de flow beëindigen ───────────────────────────

const EIND_STATUSSEN_OK     = new Set(['paid', 'authorized'])
const EIND_STATUSSEN_FOUT   = new Set(['failed', 'canceled', 'expired'])
const EIND_STATUSSEN_FOUTLABEL: Record<string, string> = {
  failed:   'Betaling geweigerd door kaart of terminal',
  canceled: 'Betaling geannuleerd op de terminal',
  expired:  'Betaling verlopen — probeer opnieuw',
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useMollieTerminal() {
  const [state, setState] = useState<MollieTerminalState>({
    status:                  'idle',
    foutmelding:             null,
    terminals:               [],
    geselecteerdeTerminalId: null,
    betalingId:              null,
    changePaymentStateUrl:   null,
  })

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const betalingRef  = useRef<string | null>(null)
  const isBezigRef   = useRef(false)

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  // Stop polling on unmount
  useEffect(() => () => stopPolling(), [])

  // ── laadTerminals ──────────────────────────────────────────────────────────

  const laadTerminals = useCallback(async () => {
    if (isBezigRef.current) return
    isBezigRef.current = true

    setState((prev) => ({ ...prev, status: 'terminals_laden', foutmelding: null }))
    console.log(`${TAG} Terminals ophalen van backend…`)

    try {
      const data = await apiGet<{ terminals: MollieTerminalInfo[] }>('/terminals')
      console.log(`${TAG} Terminals opgehaald:`, data.terminals.length, data.terminals.map((t) => t.id))
      setState((prev) => ({ ...prev, status: 'terminal_kiezen', terminals: data.terminals }))
    } catch (err) {
      console.error(`${TAG} Terminals ophalen mislukt:`, (err as Error).message)
      setState((prev) => ({ ...prev, status: 'fout', foutmelding: (err as Error).message }))
    } finally {
      isBezigRef.current = false
    }
  }, [])

  // ── startBetaling ──────────────────────────────────────────────────────────

  const startBetaling = useCallback(async (amountCents: number, terminalId: string) => {
    if (isBezigRef.current) {
      console.warn(`${TAG} startBetaling() genegeerd — flow is al bezig`)
      return
    }
    isBezigRef.current = true
    stopPolling()
    betalingRef.current = null

    console.log(`${TAG} Betaling starten: ${amountCents} centen op terminal ${terminalId}`)
    setState((prev) => ({
      ...prev,
      status:                  'betaling_starten',
      foutmelding:             null,
      geselecteerdeTerminalId: terminalId,
      betalingId:              null,
      changePaymentStateUrl:   null,
    }))

    let betalingId: string
    let changePaymentStateUrl: string | null = null

    try {
      const data = await apiPost<{
        id:                    string
        status:                string
        changePaymentStateUrl?: string
      }>('/create-terminal-payment', { amount: amountCents, terminalId })

      betalingId = data.id
      changePaymentStateUrl = data.changePaymentStateUrl ?? null
      console.log(`${TAG} Betaling aangemaakt: ${betalingId} (testmodus: ${changePaymentStateUrl !== null})`)
    } catch (err) {
      console.error(`${TAG} Betaling aanmaken mislukt:`, (err as Error).message)
      setState((prev) => ({ ...prev, status: 'fout', foutmelding: (err as Error).message }))
      isBezigRef.current = false
      return
    }

    betalingRef.current = betalingId
    setState((prev) => ({ ...prev, status: 'wachten', betalingId, changePaymentStateUrl }))
    isBezigRef.current = false  // polling loopt zelfstandig

    console.log(`${TAG} Polling gestart voor betaling ${betalingId}…`)

    pollRef.current = setInterval(async () => {
      const id = betalingRef.current
      if (!id) return

      try {
        const data = await apiGet<{
          id:                    string
          status:                string
          changePaymentStateUrl?: string
        }>(`/payment-status/${id}`)

        console.log(`${TAG} Poll: status = ${data.status}`)

        // Houd changePaymentStateUrl up-to-date (Mollie vernieuwt hem soms)
        if (data.changePaymentStateUrl) {
          setState((prev) => ({ ...prev, changePaymentStateUrl: data.changePaymentStateUrl! }))
        }

        if (EIND_STATUSSEN_OK.has(data.status)) {
          stopPolling()
          setState((prev) => ({ ...prev, status: 'geslaagd', changePaymentStateUrl: null }))
        } else if (EIND_STATUSSEN_FOUT.has(data.status)) {
          stopPolling()
          setState((prev) => ({
            ...prev,
            status:      'mislukt',
            foutmelding: EIND_STATUSSEN_FOUTLABEL[data.status] ?? data.status,
          }))
        }
        // 'open' | 'pending' → blijf pollen
      } catch {
        // Tijdelijke netwerkfout — volgende poll gewoon opnieuw proberen
      }
    }, POLL_INTERVAL)
  }, [])

  // ── simuleer ───────────────────────────────────────────────────────────────
  // Testmodus: simuleert betaaluitkomst via POST /simulate-payment (backend proxy)

  const simuleer = useCallback(async (simState: 'paid' | 'failed') => {
    const paymentId = betalingRef.current
    if (!paymentId) return
    console.log(`${TAG} Simuleer '${simState}' voor ${paymentId}…`)
    try {
      await apiPost('/simulate-payment', { paymentId, state: simState })
    } catch (err) {
      console.error(`${TAG} Simulatie mislukt:`, (err as Error).message)
    }
  }, [])

  // ── annuleer ───────────────────────────────────────────────────────────────

  const annuleer = useCallback(() => {
    console.log(`${TAG} annuleer() — polling gestopt`)
    stopPolling()
    betalingRef.current  = null
    isBezigRef.current   = false
    setState({
      status:                  'idle',
      foutmelding:             null,
      terminals:               [],
      geselecteerdeTerminalId: null,
      betalingId:              null,
      changePaymentStateUrl:   null,
    })
  }, [])

  // ── opnieuw ────────────────────────────────────────────────────────────────
  // Reset naar idle — de component herlaadt de terminals via effect

  const opnieuw = useCallback(() => {
    console.log(`${TAG} opnieuw()`)
    stopPolling()
    betalingRef.current  = null
    isBezigRef.current   = false
    setState({
      status:                  'idle',
      foutmelding:             null,
      terminals:               [],
      geselecteerdeTerminalId: null,
      betalingId:              null,
      changePaymentStateUrl:   null,
    })
  }, [])

  return {
    ...state,
    laadTerminals,
    startBetaling,
    simuleer,
    annuleer,
    opnieuw,
  }
}

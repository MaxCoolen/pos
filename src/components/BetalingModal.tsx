import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, ArrowLeft, Banknote, CreditCard, Gift, SplitSquareHorizontal,
  Delete, CheckCircle2, XCircle, Printer, Loader2, WifiOff,
} from 'lucide-react'
import { useMollieTerminal } from '../hooks/useMollieTerminal'
import { useBetalingStore } from '../store/useBetalingStore'
import { useCartStore } from '../store/useCartStore'
import { useTransactieStore } from '../store/useTransactieStore'
import { useKortingStore } from '../store/useKortingStore'
import { usePersoneelStore } from '../store/usePersoneelStore'
import { useAppStore } from '../store/useAppStore'
import { berekenKortingen, berekenItemKortingMap } from '../utils/kortingBerekening'
import { BonView } from './BonView'
import type { Betaalmethode, BonData, Transactie } from '../types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
}
function fmtBedrag(n: number) {
  return n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
}

type Scherm = 'methode' | 'contant' | 'pin' | 'cadeaubon' | 'bon'

// ─── method selection ─────────────────────────────────────────────────────────

function MethodeKeuze({
  totaal,
  kortingBedrag,
  onKies,
  onSluiten,
}: {
  totaal: number
  kortingBedrag: number
  onKies: (s: Scherm) => void
  onSluiten: () => void
}) {
  const netto = totaal - kortingBedrag
  return (
    <div>
      <div
        className="flex items-center justify-between p-5"
        style={{ borderBottom: '1px solid var(--pos-border)' }}
      >
        <div>
          <h2 className="font-black text-lg" style={{ color: 'var(--pos-t1)' }}>Afrekenen</h2>
          <div className="mt-0.5">
            {kortingBedrag > 0 ? (
              <span className="text-sm">
                <span className="line-through font-mono" style={{ color: 'var(--pos-t3)' }}>{fmtBedrag(totaal)}</span>
                {' '}
                <span className="font-bold text-emerald-400 font-mono">{fmtBedrag(netto)}</span>
              </span>
            ) : (
              <span className="text-sm font-bold font-mono" style={{ color: 'var(--pos-t1)' }}>
                {fmtBedrag(totaal)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onSluiten}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'var(--pos-t3)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--pos-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onKies('contant')}
            className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl active:scale-[0.97] transition-all duration-100 min-h-[120px]"
            style={{ backgroundColor: 'rgba(16,185,129,0.10)', border: '2px solid rgba(16,185,129,0.30)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.10)')}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-300/40">
              <Banknote size={24} className="text-white" />
            </div>
            <span className="font-bold text-emerald-400 text-base">Contant</span>
          </button>

          <button
            onClick={() => onKies('pin')}
            className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl active:scale-[0.97] transition-all duration-100 min-h-[120px]"
            style={{ backgroundColor: 'rgba(37,99,235,0.10)', border: '2px solid rgba(37,99,235,0.30)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.10)')}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: 'var(--pos-amber)' }}
            >
              <CreditCard size={24} style={{ color: 'var(--pos-amber-t)' }} />
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--pos-amber)' }}>Pinnen</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onKies('cadeaubon')}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl active:scale-[0.97] transition-all duration-100 min-h-[80px]"
            style={{ backgroundColor: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.30)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.10)')}
          >
            <Gift size={20} className="text-violet-400" />
            <span className="font-semibold text-violet-400 text-sm">Cadeaubon</span>
          </button>

          <button
            disabled
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl opacity-40 cursor-not-allowed min-h-[80px]"
            style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
          >
            <SplitSquareHorizontal size={20} style={{ color: 'var(--pos-t3)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--pos-t3)' }}>Splitsen</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── cash payment ─────────────────────────────────────────────────────────────

const SNELBEDRAGEN = [500, 1000, 2000, 5000, 10000]

function ContantBetaling({
  totaalInCents,
  onBevestig,
  onTerug,
}: {
  totaalInCents: number
  onBevestig: (betaaldCents: number) => void
  onTerug: () => void
}) {
  const [centsBuffer, setCentsBuffer] = useState(0)

  function handleDigit(d: number) {
    const next = centsBuffer * 10 + d
    if (next > 9_999_99) return
    setCentsBuffer(next)
  }

  const heeftBetaald = centsBuffer > 0
  const wisselgeld = heeftBetaald ? centsBuffer - totaalInCents : 0
  const kanBevestigen = centsBuffer >= totaalInCents

  const NUMPAD = [1, 2, 3, 4, 5, 6, 7, 8, 9, -2, 0, -1] as const

  return (
    <div>
      <div
        className="flex items-center gap-3 p-5"
        style={{ borderBottom: '1px solid var(--pos-border)' }}
      >
        <button
          onClick={onTerug}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'var(--pos-t3)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--pos-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-black text-lg leading-none" style={{ color: 'var(--pos-t1)' }}>Contant</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pos-t3)' }}>
            Te betalen:{' '}
            <span className="font-bold font-mono" style={{ color: 'var(--pos-t1)' }}>{fmt(totaalInCents)}</span>
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="rounded-2xl p-4 text-right" style={{ backgroundColor: 'var(--pos-panel)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--pos-t3)' }}>Betaald bedrag</p>
          <p className="text-4xl font-black tabular-nums font-mono" style={{ color: 'var(--pos-t1)' }}>{fmt(centsBuffer)}</p>
        </div>

        <div className="flex gap-2">
          {SNELBEDRAGEN.map((c) => (
            <button
              key={c}
              onClick={() => setCentsBuffer(c)}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 font-mono"
              style={
                centsBuffer === c
                  ? { backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }
                  : { backgroundColor: 'var(--pos-card)', color: 'var(--pos-t2)' }
              }
              onMouseEnter={e => {
                if (centsBuffer !== c) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={e => {
                if (centsBuffer !== c) e.currentTarget.style.backgroundColor = 'var(--pos-card)'
              }}
            >
              {fmt(c)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {NUMPAD.map((key, i) => {
            if (key === -2) return (
              <button
                key={i}
                onClick={() => setCentsBuffer(0)}
                className="h-14 rounded-xl font-bold text-sm active:scale-95 transition-all"
                style={{ backgroundColor: 'rgba(200,60,60,0.12)', color: '#EF4444', border: '1px solid rgba(200,60,60,0.20)' }}
              >
                C
              </button>
            )
            if (key === -1) return (
              <button
                key={i}
                onClick={() => setCentsBuffer(Math.floor(centsBuffer / 10))}
                className="h-14 rounded-xl active:scale-95 transition-all flex items-center justify-center"
                style={{ backgroundColor: 'rgba(37,99,235,0.10)', color: 'var(--pos-amber)', border: '1px solid rgba(37,99,235,0.20)' }}
              >
                <Delete size={18} />
              </button>
            )
            return (
              <button
                key={i}
                onClick={() => handleDigit(key)}
                className="h-14 rounded-xl font-bold text-lg active:scale-95 transition-all font-mono"
                style={{ backgroundColor: 'var(--pos-card)', color: 'var(--pos-t1)', border: '1px solid var(--pos-border)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--pos-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--pos-card)')}
              >
                {key}
              </button>
            )
          })}
        </div>

        <div
          className="rounded-2xl overflow-hidden text-sm"
          style={{ border: '1px solid var(--pos-border)' }}
        >
          <div
            className="flex justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--pos-border)' }}
          >
            <span style={{ color: 'var(--pos-t3)' }}>Te betalen</span>
            <span className="font-semibold tabular-nums font-mono" style={{ color: 'var(--pos-t1)' }}>{fmt(totaalInCents)}</span>
          </div>
          <div
            className="flex justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--pos-border)' }}
          >
            <span style={{ color: 'var(--pos-t3)' }}>Betaald</span>
            <span className="font-semibold tabular-nums font-mono" style={{ color: 'var(--pos-t1)' }}>{fmt(centsBuffer)}</span>
          </div>
          <div
            className="flex justify-between px-4 py-3"
            style={
              !heeftBetaald
                ? { backgroundColor: 'var(--pos-panel)' }
                : wisselgeld >= 0
                ? { backgroundColor: 'rgba(16,185,129,0.10)' }
                : { backgroundColor: 'rgba(239,68,68,0.10)' }
            }
          >
            <span className="font-medium" style={{ color: 'var(--pos-t2)' }}>Wisselgeld</span>
            <span
              className={`font-black text-lg tabular-nums font-mono ${
                !heeftBetaald ? '' : wisselgeld >= 0 ? 'text-emerald-400' : 'text-red-500'
              }`}
              style={!heeftBetaald ? { color: 'var(--pos-t3)' } : undefined}
            >
              {!heeftBetaald ? fmt(0) : wisselgeld >= 0 ? fmt(wisselgeld) : `– ${fmt(-wisselgeld)}`}
            </span>
          </div>
        </div>

        <button
          disabled={!kanBevestigen}
          onClick={() => onBevestig(centsBuffer)}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] ${
            kanBevestigen
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-300/40'
              : 'cursor-not-allowed'
          }`}
          style={!kanBevestigen ? { backgroundColor: 'var(--pos-card)', color: 'var(--pos-t4)' } : undefined}
        >
          Betaling bevestigen
        </button>
      </div>
    </div>
  )
}

// ─── Mollie terminal betaling ─────────────────────────────────────────────────

function TerminalBetaling({
  totaalInCents,
  label,
  onGeslaagd,
  onTerug,
}: {
  totaalInCents: number
  label: string
  onGeslaagd: () => void
  onTerug: () => void
}) {
  const {
    status, foutmelding, terminals, changePaymentStateUrl,
    laadTerminals, startBetaling, simuleer, annuleer, opnieuw,
  } = useMollieTerminal()

  // Laad terminals bij mount; herlaad wanneer opnieuw() naar idle terugkeert
  useEffect(() => {
    if (status === 'idle') laadTerminals()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Meld succes aan bovenliggende component
  useEffect(() => {
    if (status === 'geslaagd') onGeslaagd()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const statusLabel: Record<typeof status, string> = {
    idle:             'Opstarten…',
    terminals_laden:  'Terminals zoeken…',
    terminal_kiezen:  'Kies een betaalterminal',
    betaling_starten: 'Betaling aanmaken…',
    wachten:          'Wacht op betaling op terminal',
    geslaagd:         'Betaling geslaagd',
    mislukt:          'Betaling mislukt',
    fout:             'Fout',
  }

  const isLaden   = ['idle', 'terminals_laden', 'betaling_starten'].includes(status)
  const isWachten = status === 'wachten'
  const isFout    = status === 'mislukt' || status === 'fout'
  const isBezig   = isLaden || isWachten

  // Determine status card styles
  const statusCardStyle: React.CSSProperties = (() => {
    if (status === 'geslaagd') return { backgroundColor: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.30)' }
    if (isFout)               return { backgroundColor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)' }
    if (isWachten)            return { backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)' }
    return { backgroundColor: 'var(--pos-panel)', border: '1px solid var(--pos-border)' }
  })()

  const statusTextColor = (() => {
    if (status === 'geslaagd') return 'text-emerald-400'
    if (isFout)               return 'text-red-400'
    if (isWachten)            return ''
    return ''
  })()

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center gap-3 p-5"
        style={{ borderBottom: '1px solid var(--pos-border)' }}
      >
        <button
          onClick={() => { annuleer(); onTerug() }}
          disabled={isBezig && status !== 'wachten'}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: 'var(--pos-t3)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--pos-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-black text-lg" style={{ color: 'var(--pos-t1)' }}>{label}</h2>
      </div>

      <div className="p-6 flex flex-col items-center gap-6">

        {/* Bedrag */}
        <div className="text-center">
          <p className="text-sm mb-1" style={{ color: 'var(--pos-t3)' }}>Te betalen</p>
          <p className="text-5xl font-black tabular-nums font-mono" style={{ color: 'var(--pos-t1)' }}>
            {fmt(totaalInCents)}
          </p>
        </div>

        {/* Terminal selectie */}
        {status === 'terminal_kiezen' && (
          <div className="w-full space-y-2">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--pos-t3)' }}>
              Selecteer betaalterminal
            </p>
            {terminals.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--pos-t3)' }}>
                Geen terminals gevonden
              </div>
            ) : (
              terminals.map((t) => (
                <button
                  key={t.id}
                  onClick={() => startBetaling(totaalInCents, t.id)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl active:scale-[0.98] transition-all text-left"
                  style={{ border: '2px solid var(--pos-border)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)'
                    e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--pos-border)'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--pos-amber)' }}
                  >
                    <CreditCard size={18} style={{ color: 'var(--pos-amber-t)' }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--pos-t1)' }}>
                      {t.description || t.brand || 'Terminal'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--pos-t3)' }}>
                      {t.model ? `${t.model} · ` : ''}{t.id}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Status kaart — zichtbaar bij alle statussen behalve terminal_kiezen */}
        {status !== 'terminal_kiezen' && (
          <div
            className="w-full rounded-2xl p-5 text-center transition-colors"
            style={statusCardStyle}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              {status === 'geslaagd' && <CheckCircle2 size={20} className="text-emerald-500" />}
              {isFout               && <WifiOff size={20} className="text-red-500" />}
              {isLaden              && <Loader2 size={20} className="animate-spin" style={{ color: 'var(--pos-t2)' }} />}
              {isWachten            && <CreditCard size={20} style={{ color: 'var(--pos-amber)' }} />}
              <p
                className={`font-bold text-base ${statusTextColor}`}
                style={isWachten ? { color: 'var(--pos-amber)' } : !statusTextColor ? { color: 'var(--pos-t2)' } : undefined}
              >
                {statusLabel[status]}
              </p>
            </div>
            {foutmelding && (
              <p className="text-xs text-red-400 mt-2 leading-snug">{foutmelding}</p>
            )}
            {isWachten && (
              <p className="text-sm mt-1" style={{ color: 'var(--pos-amber)' }}>
                Vraag de klant de kaart aan te bieden
              </p>
            )}
          </div>
        )}

        {/* Testmodus simulatieknoppen — alleen bij wachten + changePaymentStateUrl aanwezig */}
        {isWachten && changePaymentStateUrl && (
          <div className="w-full space-y-2">
            <p className="text-xs font-semibold text-blue-500 text-center uppercase tracking-wide">
              Testmodus — simuleer betaling
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => simuleer('paid')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-all"
                style={{
                  backgroundColor: 'rgba(16,185,129,0.10)',
                  color: '#34D399',
                  border: '1px solid rgba(16,185,129,0.30)',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.16)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.10)')}
              >
                <CheckCircle2 size={16} /> Betaling geslaagd
              </button>
              <button
                onClick={() => simuleer('failed')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-all"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.10)',
                  color: '#F87171',
                  border: '1px solid rgba(239,68,68,0.30)',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.16)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.10)')}
              >
                <XCircle size={16} /> Betaling geweigerd
              </button>
            </div>
          </div>
        )}

        {/* Annuleer — zichtbaar bij wachten (zonder testmodus simulatieknoppen) */}
        {isWachten && !changePaymentStateUrl && (
          <button
            onClick={() => { annuleer(); onTerug() }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-all"
            style={{ backgroundColor: 'var(--pos-card)', color: 'var(--pos-t2)', border: '1px solid var(--pos-border)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--pos-hover)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--pos-card)')}
          >
            <XCircle size={18} /> Annuleren
          </button>
        )}

        {/* Fout — terug + opnieuw */}
        {isFout && (
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => { annuleer(); onTerug() }}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-all"
              style={{ backgroundColor: 'var(--pos-card)', color: 'var(--pos-t2)', border: '1px solid var(--pos-border)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--pos-hover)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--pos-card)')}
            >
              <ArrowLeft size={18} /> Terug
            </button>
            <button
              onClick={opnieuw}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-all"
              style={{ backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--pos-amber)')}
            >
              <Loader2 size={18} /> Opnieuw
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── receipt screen with countdown + yes/no print ────────────────────────────

const COUNTDOWN_SECONDEN = 10

function BonScherm({ bon, onSluiten }: { bon: BonData; onSluiten: () => void }) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDEN)
  const onSluitenRef = useRef(onSluiten)
  useEffect(() => { onSluitenRef.current = onSluiten })

  // countdown timer — auto-close when it hits 0
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          onSluitenRef.current()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  function afdrukkenEnSluiten() {
    window.print()
    setTimeout(() => onSluitenRef.current(), 400)
  }

  // SVG countdown ring
  const R = 16
  const circ = 2 * Math.PI * R
  const progress = (countdown / COUNTDOWN_SECONDEN) * circ

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center justify-between p-5"
        style={{ borderBottom: '1px solid var(--pos-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <div>
            <h2 className="font-black text-base leading-tight" style={{ color: 'var(--pos-t1)' }}>
              Betaling geslaagd
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--pos-t3)' }}>
              Bon afdrukken voor de klant?
            </p>
          </div>
        </div>

        {/* Countdown ring */}
        <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
          <circle cx="22" cy="22" r={R} fill="none" stroke="var(--pos-border)" strokeWidth="3" />
          <circle
            cx="22" cy="22" r={R}
            fill="none"
            stroke="var(--pos-amber)"
            strokeWidth="3"
            strokeDasharray={`${progress} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
            className="transition-all duration-1000"
          />
          <text x="22" y="22" textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fontWeight="bold" fill="var(--pos-t2)">
            {countdown}
          </text>
        </svg>
      </div>

      {/* Receipt preview (compact, scrollable) */}
      <div className="overflow-y-auto max-h-[40vh] p-4">
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--pos-panel)', border: '1px solid var(--pos-border)' }}
        >
          <BonView bon={bon} />
        </div>
      </div>

      {/* Ja / Nee */}
      <div
        className="p-4 grid grid-cols-2 gap-3"
        style={{ borderTop: '1px solid var(--pos-border)' }}
      >
        <button
          onClick={onSluiten}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base active:scale-[0.97] transition-all"
          style={{ backgroundColor: 'var(--pos-card)', color: 'var(--pos-t2)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--pos-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--pos-card)')}
        >
          <XCircle size={20} /> Nee
        </button>
        <button
          onClick={afdrukkenEnSluiten}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-300/40 active:scale-[0.97] transition-all"
        >
          <Printer size={20} /> Ja, afdrukken
        </button>
      </div>
    </div>
  )
}

// ─── main modal ───────────────────────────────────────────────────────────────

export function BetalingModal() {
  const { isOpen, sluitModal } = useBetalingStore()
  const { items, totaal, leegmaken } = useCartStore()
  const { voegTransactieToe } = useTransactieStore()
  const { kortingen } = useKortingStore()
  const { medewerkers, activeMedewerkerId } = usePersoneelStore()
  const currentStoreId = useAppStore((s) => s.currentStoreId)

  const [scherm, setScherm] = useState<Scherm>('methode')
  const [bonData, setBonData] = useState<BonData | null>(null)

  const totaalBedrag = totaal()

  const { regels: kortingRegels, totaal: kortingBedrag } = useMemo(
    () => berekenKortingen(items, kortingen),
    [items, kortingen]
  )

  const nettoBedrag = Math.max(0, totaalBedrag - kortingBedrag)
  const nettoInCents = Math.round(nettoBedrag * 100)

  if (!isOpen) return null

  function sluiten() {
    setScherm('methode')
    setBonData(null)
    sluitModal()
  }

  function slaagBetaling(methode: Betaalmethode, betaaldCents?: number) {
    const btwTotaal = items.reduce((sum, item) => {
      const bruto = item.product.prijs * item.aantal
      const factor = item.product.btw / 100
      return sum + Math.round(((bruto * factor) / (1 + factor)) * 100) / 100
    }, 0)
    const btwNaKorting =
      totaalBedrag > 0 ? btwTotaal * (nettoBedrag / totaalBedrag) : 0

    const activeMedewerker = medewerkers.find((m) => m.id === activeMedewerkerId)

    // Compute per-item discount so receipt lines show the discounted unit price
    const itemKortingMap = berekenItemKortingMap(items, kortingen)

    const regels = items.map((item) => {
      const kortingVoorItem = itemKortingMap.get(item.product.id) ?? 0
      const brutoLijn = item.product.prijs * item.aantal
      const nettoLijn = Math.max(0, brutoLijn - kortingVoorItem)
      const eenheidsprijs = item.aantal > 0
        ? parseFloat((nettoLijn / item.aantal).toFixed(4))
        : item.product.prijs
      return {
        naam: item.product.naam,
        categorie: item.product.categorie ?? 'Overig',
        aantal: item.aantal,
        prijs: eenheidsprijs,
      }
    })

    const transactie: Transactie = {
      id: crypto.randomUUID(),
      tijdstip: new Date().toISOString(),
      regels,
      totaal: nettoBedrag,
      btw: parseFloat(btwNaKorting.toFixed(2)),
      betaalmethode: methode,
      medewerker: activeMedewerker?.naam.split(' ')[0],
      storeId: currentStoreId ?? undefined,
      employeeId: activeMedewerkerId ?? undefined,
      betaaldCents: betaaldCents,
      wisselgeldCents: betaaldCents != null ? betaaldCents - nettoInCents : undefined,
    }

    voegTransactieToe(transactie)
    leegmaken()

    const bon: BonData = {
      transactieId: transactie.id,
      tijdstip: transactie.tijdstip,
      regels: transactie.regels,
      kortingRegels,
      totaalVoorKorting: totaalBedrag,
      totaalNaKorting: nettoBedrag,
      btw: transactie.btw,
      betaalmethode: methode,
      betaaldCents,
      wisselgeldCents:
        betaaldCents != null ? betaaldCents - nettoInCents : undefined,
      // Only show first name on the receipt
      medewerker: activeMedewerker?.naam.split(' ')[0],
    }

    setBonData(bon)
    setScherm('bon')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={scherm !== 'bon' ? sluiten : undefined} />

      <div
        className="relative w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95dvh] overflow-y-auto"
        style={{ backgroundColor: 'var(--pos-card)' }}
      >
        {scherm === 'methode' && (
          <MethodeKeuze
            totaal={totaalBedrag}
            kortingBedrag={kortingBedrag}
            onKies={setScherm}
            onSluiten={sluiten}
          />
        )}
        {scherm === 'contant' && (
          <ContantBetaling
            totaalInCents={nettoInCents}
            onBevestig={(betaaldCents) => slaagBetaling('contant', betaaldCents)}
            onTerug={() => setScherm('methode')}
          />
        )}
        {scherm === 'pin' && (
          <TerminalBetaling
            totaalInCents={nettoInCents}
            label="Pinnen"
            onGeslaagd={() => slaagBetaling('pin')}
            onTerug={() => setScherm('methode')}
          />
        )}
        {scherm === 'cadeaubon' && (
          <TerminalBetaling
            totaalInCents={nettoInCents}
            label="Cadeaubon"
            onGeslaagd={() => slaagBetaling('cadeaubon')}
            onTerug={() => setScherm('methode')}
          />
        )}
        {scherm === 'bon' && bonData && (
          <BonScherm bon={bonData} onSluiten={sluiten} />
        )}
      </div>
    </div>
  )
}

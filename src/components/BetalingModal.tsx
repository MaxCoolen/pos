import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, ArrowLeft, Banknote, CreditCard, Gift, SplitSquareHorizontal,
  Delete, CheckCircle2, XCircle, Printer,
} from 'lucide-react'
import { useBetalingStore } from '../store/useBetalingStore'
import { useCartStore } from '../store/useCartStore'
import { useTransactieStore } from '../store/useTransactieStore'
import { useKortingStore } from '../store/useKortingStore'
import { usePersoneelStore } from '../store/usePersoneelStore'
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
      <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
        <div>
          <h2 className="font-black text-gray-900 dark:text-white text-lg">Afrekenen</h2>
          <div className="mt-0.5">
            {kortingBedrag > 0 ? (
              <span className="text-sm">
                <span className="line-through text-gray-400">{fmtBedrag(totaal)}</span>
                {' '}
                <span className="font-bold text-emerald-600">{fmtBedrag(netto)}</span>
              </span>
            ) : (
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {fmtBedrag(totaal)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onSluiten}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onKies('contant')}
            className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 active:scale-[0.97] transition-all duration-100 min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-300/40">
              <Banknote size={24} className="text-white" />
            </div>
            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-base">Contant</span>
          </button>

          <button
            onClick={() => onKies('pin')}
            className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-100 active:scale-[0.97] transition-all duration-100 min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-300/40">
              <CreditCard size={24} className="text-white" />
            </div>
            <span className="font-bold text-blue-800 dark:text-blue-300 text-base">Pinnen</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onKies('cadeaubon')}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 active:scale-[0.97] transition-all duration-100 min-h-[80px]"
          >
            <Gift size={20} className="text-violet-600 dark:text-violet-400" />
            <span className="font-semibold text-violet-700 dark:text-violet-300 text-sm">Cadeaubon</span>
          </button>

          <button
            disabled
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 opacity-40 cursor-not-allowed min-h-[80px]"
          >
            <SplitSquareHorizontal size={20} className="text-gray-400" />
            <span className="font-semibold text-gray-400 text-sm">Splitsen</span>
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
      <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-slate-700">
        <button onClick={onTerug} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-black text-gray-900 dark:text-white text-lg leading-none">Contant</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Te betalen: <span className="font-bold text-gray-900 dark:text-white">{fmt(totaalInCents)}</span></p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 text-right">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Betaald bedrag</p>
          <p className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">{fmt(centsBuffer)}</p>
        </div>

        <div className="flex gap-2">
          {SNELBEDRAGEN.map((c) => (
            <button key={c} onClick={() => setCentsBuffer(c)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${centsBuffer === c ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
              {fmt(c)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {NUMPAD.map((key, i) => {
            if (key === -2) return (
              <button key={i} onClick={() => setCentsBuffer(0)}
                className="h-14 rounded-xl font-bold text-sm bg-red-50 dark:bg-red-950/50 text-red-500 hover:bg-red-100 active:scale-95 transition-all">C</button>
            )
            if (key === -1) return (
              <button key={i} onClick={() => setCentsBuffer(Math.floor(centsBuffer / 10))}
                className="h-14 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center">
                <Delete size={18} />
              </button>
            )
            return (
              <button key={i} onClick={() => handleDigit(key)}
                className="h-14 rounded-xl font-bold text-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all">
                {key}
              </button>
            )
          })}
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden text-sm">
          <div className="flex justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <span className="text-gray-500">Te betalen</span>
            <span className="font-semibold tabular-nums">{fmt(totaalInCents)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <span className="text-gray-500">Betaald</span>
            <span className="font-semibold tabular-nums">{fmt(centsBuffer)}</span>
          </div>
          <div className={`flex justify-between px-4 py-3 ${!heeftBetaald ? 'bg-gray-50 dark:bg-slate-800' : wisselgeld >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-red-950/40'}`}>
            <span className="font-medium text-gray-700 dark:text-slate-300">Wisselgeld</span>
            <span className={`font-black text-lg tabular-nums ${!heeftBetaald ? 'text-gray-400' : wisselgeld >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {!heeftBetaald ? fmt(0) : wisselgeld >= 0 ? fmt(wisselgeld) : `– ${fmt(-wisselgeld)}`}
            </span>
          </div>
        </div>

        <button disabled={!kanBevestigen} onClick={() => onBevestig(centsBuffer)}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] ${kanBevestigen ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-300/40' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'}`}>
          Betaling bevestigen
        </button>
      </div>
    </div>
  )
}

// ─── pin confirmation ─────────────────────────────────────────────────────────

function PinBevestiging({
  totaal, label, onJa, onNee, onTerug,
}: {
  totaal: number; label: string
  onJa: () => void; onNee: () => void; onTerug: () => void
}) {
  return (
    <div>
      <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-slate-700">
        <button onClick={onTerug} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-black text-gray-900 dark:text-white text-lg">{label}</h2>
      </div>

      <div className="p-6 flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Bedrag</p>
          <p className="text-5xl font-black text-gray-900 dark:text-white tabular-nums">{fmtBedrag(totaal)}</p>
        </div>

        <div className="w-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-2xl p-5 text-center">
          <p className="font-bold text-blue-900 dark:text-blue-200 text-lg">Is de betaling geslaagd?</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Controleer het betaalterminaal</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button onClick={onNee} className="flex items-center justify-center gap-2 py-5 rounded-2xl font-black text-lg bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 active:scale-[0.97] transition-all min-h-[80px]">
            <XCircle size={22} /> Nee
          </button>
          <button onClick={onJa} className="flex items-center justify-center gap-2 py-5 rounded-2xl font-black text-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-300/40 active:scale-[0.97] transition-all min-h-[80px]">
            <CheckCircle2 size={22} /> Ja
          </button>
        </div>
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
      <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <div>
            <h2 className="font-black text-gray-900 dark:text-white text-base leading-tight">
              Betaling geslaagd
            </h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Bon afdrukken voor de klant?
            </p>
          </div>
        </div>

        {/* Countdown ring */}
        <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
          <circle cx="22" cy="22" r={R} fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="22" cy="22" r={R}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeDasharray={`${progress} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
            className="transition-all duration-1000"
          />
          <text x="22" y="22" textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fontWeight="bold" fill="currentColor"
            className="text-gray-700">
            {countdown}
          </text>
        </svg>
      </div>

      {/* Receipt preview (compact, scrollable) */}
      <div className="overflow-y-auto max-h-[40vh] p-4">
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
          <BonView bon={bon} />
        </div>
      </div>

      {/* Ja / Nee */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-3">
        <button
          onClick={onSluiten}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-[0.97] transition-all"
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
      return sum + (bruto * factor) / (1 + factor)
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
      id: `TRX-${Date.now()}`,
      tijdstip: new Date().toISOString(),
      regels,
      totaal: nettoBedrag,
      btw: parseFloat(btwNaKorting.toFixed(2)),
      betaalmethode: methode,
      medewerker: activeMedewerker?.naam.split(' ')[0],
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

      <div className="relative bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[95dvh] overflow-y-auto">
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
          <PinBevestiging
            totaal={nettoBedrag}
            label="Pinnen"
            onJa={() => slaagBetaling('pin')}
            onNee={() => setScherm('methode')}
            onTerug={() => setScherm('methode')}
          />
        )}
        {scherm === 'cadeaubon' && (
          <PinBevestiging
            totaal={nettoBedrag}
            label="Cadeaubon"
            onJa={() => slaagBetaling('cadeaubon')}
            onNee={() => setScherm('methode')}
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

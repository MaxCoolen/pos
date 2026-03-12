import { useMemo, useState } from 'react'
import {
  TrendingUp, ShoppingCart, ArrowUpRight, FileText, Download, Eye,
  Printer, RotateCcw, X, Lock, ChevronDown, ChevronUp, User, Trophy,
} from 'lucide-react'
import {
  useTransactieStore,
  startVanDag,
  eindVanDag,
  startVanWeek,
  startVanMaand,
} from '../store/useTransactieStore'
import { useDagafsluitingStore } from '../store/useDagafsluitingStore'
import { usePersoneelStore } from '../store/usePersoneelStore'
import { BonView } from '../components/BonView'
import type { Transactie, BonData, Dagafsluiting } from '../types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
}
function toInputDate(d: Date) { return d.toISOString().slice(0, 10) }
function fromInputDate(s: string): Date {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y!, m! - 1, day!)
}
function formatTijd(iso: string) {
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}
function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })
}
function formatDatumLang(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Reconstruct BonData from a stored Transactie for receipt preview/reprint
function transactieToBon(t: Transactie): BonData {
  return {
    transactieId: t.id,
    tijdstip: t.tijdstip,
    regels: t.regels,
    kortingRegels: [],
    totaalVoorKorting: t.totaal,
    totaalNaKorting: t.totaal,
    btw: t.btw,
    betaalmethode: t.betaalmethode ?? 'contant',
    medewerker: t.medewerker,
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

function MetricCard({ label, value, icon: Icon, iconColor, iconBg }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 px-5 py-4 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
    </div>
  )
}

// Bar chart
function OmzetBarChart({ transacties }: { transacties: Transactie[] }) {
  const DAGEN_NL = ['zo', 'ma', 'di', 'woe', 'don', 'vri', 'zat']
  const bars = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const dag = new Date(today)
      dag.setDate(today.getDate() - (6 - i))
      const omzet = transacties
        .filter((t) => {
          const d = new Date(t.tijdstip)
          return d.getFullYear() === dag.getFullYear() && d.getMonth() === dag.getMonth() && d.getDate() === dag.getDate()
        })
        .reduce((s, t) => s + t.totaal, 0)
      return { label: DAGEN_NL[dag.getDay()]!, omzet, isVandaag: dag.toDateString() === today.toDateString() }
    })
  }, [transacties])

  const max = Math.max(...bars.map((b) => b.omzet), 1)
  const MIN_PX = 6

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-4 text-sm">Omzet afgelopen week</h3>
      <div className="flex gap-3 items-end" style={{ height: 160 }}>
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
            <span className={`text-xs font-semibold leading-none text-center w-full truncate ${bar.isVandaag ? 'text-blue-500' : bar.omzet > 0 ? 'text-gray-600 dark:text-slate-300' : 'text-gray-300 dark:text-slate-600'}`}>
              {bar.omzet > 0 ? '€' + bar.omzet.toLocaleString('nl-NL', { maximumFractionDigits: 0 }) : '–'}
            </span>
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${bar.isVandaag ? 'bg-blue-500' : bar.omzet > 0 ? 'bg-yellow-400' : 'bg-gray-100 dark:bg-slate-700'}`}
              style={{ height: bar.omzet > 0 ? `${Math.max((bar.omzet / max) * 100, 4)}%` : `${MIN_PX}px`, minHeight: `${MIN_PX}px` }}
            />
            <span className={`text-xs font-medium shrink-0 ${bar.isVandaag ? 'text-blue-500' : 'text-gray-400 dark:text-slate-500'}`}>{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Donut chart
function OmzetPerCategorie({ transacties }: { transacties: Transactie[] }) {
  const data = useMemo(() => {
    const totalen: Record<string, number> = {}
    for (const t of transacties) {
      for (const r of t.regels) {
        totalen[r.categorie] = (totalen[r.categorie] ?? 0) + r.prijs * r.aantal
      }
    }
    return Object.entries(totalen).map(([cat, omzet]) => ({ cat, omzet })).sort((a, b) => b.omzet - a.omzet)
  }, [transacties])

  const totaal = data.reduce((s, d) => s + d.omzet, 0)
  const R = 52; const SW = 20; const SIZE = 160; const cx = SIZE / 2; const cy = SIZE / 2; const CIRC = 2 * Math.PI * R
  const KLEUREN: Record<string, string> = { Broodjes: '#FACC15', Snacks: '#FB923C', Drank: '#60A5FA', Overig: '#A78BFA' }

  const segments = data.reduce<{ cat: string; omzet: string; color: string; dasharray: string; dashoffset: number }[]>(
    (acc, { cat, omzet }) => {
      const cumLen = acc.reduce((s, seg) => s + (parseFloat(seg.dasharray.split(' ')[0]!) || 0), 0)
      const len = (omzet / totaal) * CIRC
      return [...acc, { cat, omzet: fmt(omzet), color: KLEUREN[cat] ?? '#9CA3AF', dasharray: `${len} ${CIRC - len}`, dashoffset: -cumLen }]
    }, []
  )

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-4 text-sm">Omzet per categorie</h3>
      {data.length === 0 ? (
        <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-12">Geen data</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="shrink-0">
            <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F3F4F6" strokeWidth={SW} />
              {segments.map((seg) => (
                <circle key={seg.cat} cx={cx} cy={cy} r={R} fill="none" stroke={seg.color} strokeWidth={SW}
                  strokeDasharray={seg.dasharray} strokeDashoffset={seg.dashoffset} strokeLinecap="butt" />
              ))}
              <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="middle"
                style={{ transform: `rotate(90deg) translate(0px, -${SIZE}px)`, transformOrigin: `${cx}px ${cy}px`, fontSize: 11, fill: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Totaal</text>
              <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle"
                style={{ transform: `rotate(90deg) translate(0px, -${SIZE}px)`, transformOrigin: `${cx}px ${cy}px`, fontSize: 13, fontWeight: 700, fill: '#111827', fontFamily: 'Inter, sans-serif' }}>{fmt(totaal)}</text>
            </svg>
          </div>
          <div className="flex-1 space-y-2.5">
            {segments.map((seg) => (
              <div key={seg.cat} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-sm text-gray-600 dark:text-slate-300 font-medium truncate">{seg.cat}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{seg.omzet}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 ml-1.5">
                    {((data.find((d) => d.cat === seg.cat)?.omzet ?? 0) / totaal * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── payment method badges ────────────────────────────────────────────────────

const METHODE_BADGE: Record<string, { label: string; cls: string }> = {
  contant:   { label: 'Contant',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  pin:       { label: 'PIN',       cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  cadeaubon: { label: 'Cadeaubon', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
  gesplitst: { label: 'Gesplitst', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
}

// ─── transaction detail modal ─────────────────────────────────────────────────

function TransactieModal({
  transactie, onSluiten, onTerugboeken,
}: {
  transactie: Transactie
  onSluiten: () => void
  onTerugboeken: () => void
}) {
  const [bevestigRefund, setBevestigRefund] = useState(false)
  const [weergave, setWeergave] = useState<'details' | 'bon'>('bon')

  const methode = transactie.betaalmethode
  const badge = methode ? METHODE_BADGE[methode] : null
  const bon = transactieToBon(transactie)

  function printBon() {
    const style = document.createElement('style')
    style.innerHTML = `@media print { body * { visibility:hidden } #bon-content,#bon-content * { visibility:visible } #bon-content { position:fixed;top:0;left:0;width:80mm;padding:4mm;background:white } }`
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onSluiten} />
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="font-black text-gray-900 dark:text-white text-lg">Transactie</h2>
            <p className="text-xs font-mono text-gray-400 dark:text-slate-500 mt-0.5">{transactie.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {badge && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>}
            {transactie.isTerugboeking && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">Terugboeking</span>}
            {transactie.isTerugGeboekt && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">Terugbeboekt</span>}
            <button onClick={onSluiten} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toggle: Details | Bon */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 mx-5 mt-4 rounded-xl">
          {(['bon', 'details'] as const).map((v) => (
            <button key={v} onClick={() => setWeergave(v)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${weergave === v ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'}`}>
              {v === 'bon' ? 'Bon / Reprint' : 'Details'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[55vh] p-5">
          {weergave === 'bon' ? (
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
              <BonView bon={bon} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Datum</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDatum(transactie.tijdstip)} {formatTijd(transactie.tijdstip)}</span>
                </div>
                {methode && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Betaalmethode</span>
                    <span className="font-medium text-gray-900 dark:text-white">{badge?.label ?? methode}</span>
                  </div>
                )}
                {transactie.medewerker && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Medewerker</span>
                    <span className="font-medium text-gray-900 dark:text-white">{transactie.medewerker}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-2">
                {transactie.regels.map((r, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-300">{r.aantal}× {r.naam}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{fmt(r.prijs * r.aantal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500 dark:text-slate-400">
                  <span>BTW</span><span>{fmt(transactie.btw)}</span>
                </div>
                <div className="flex justify-between font-black text-base">
                  <span className="text-gray-900 dark:text-white">Totaal</span>
                  <span className={transactie.isTerugboeking ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>{fmt(transactie.totaal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
          {bevestigRefund ? (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 text-center">Transactie terugboeken?</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setBevestigRefund(false)} className="py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Annuleren</button>
                <button onClick={() => { onTerugboeken(); onSluiten() }} className="py-2.5 rounded-xl font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">Ja, terugboeken</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={printBon} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <Printer size={14} /> Bon afdrukken
              </button>
              {!transactie.isTerugboeking && !transactie.isTerugGeboekt && (
                <button onClick={() => setBevestigRefund(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors border border-red-200 dark:border-red-800">
                  <RotateCcw size={14} /> Terugboeken
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── transactions table ───────────────────────────────────────────────────────

function TransactieLijst({ transacties }: { transacties: Transactie[] }) {
  const { terugboekenTransactie } = useTransactieStore()
  const [geselecteerd, setGeselecteerd] = useState<Transactie | null>(null)

  const totaalOmzet = transacties.reduce((s, t) => s + t.totaal, 0)
  const totaalBtw = transacties.reduce((s, t) => s + t.btw, 0)

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-800 dark:text-slate-200 text-sm">Transacties</h3>
        </div>

        {transacties.length === 0 ? (
          <div className="py-12 text-center text-gray-400 dark:text-slate-500 text-sm">Geen transacties in deze periode</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                  {['Datum', 'Tijd', 'ID', 'Medewerker', 'Betaalmethode', 'Producten', 'BTW', 'Totaal', ''].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap ${i >= 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transacties.map((t, idx) => {
                  const badge = t.betaalmethode ? METHODE_BADGE[t.betaalmethode] : null
                  const isRefund = t.isTerugboeking
                  const isRefunded = t.isTerugGeboekt
                  return (
                    <tr key={t.id} className={`${idx < transacties.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''} hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors ${isRefund ? 'bg-red-50/40 dark:bg-red-950/20' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">{formatDatum(t.tijdstip)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300 font-medium whitespace-nowrap">{formatTijd(t.tijdstip)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400 dark:text-slate-500 whitespace-nowrap">{t.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{t.medewerker ?? '—'}</td>
                      <td className="px-4 py-3">
                        {isRefund ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">Terugboeking</span>
                          : badge ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                          : <span className="text-xs text-gray-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className={`px-4 py-3 text-sm max-w-[160px] truncate ${isRefund ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-slate-300'}`}>
                        {t.regels.map((r) => `${r.aantal}× ${r.naam}`).join(', ')}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right whitespace-nowrap ${isRefund ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-slate-300'}`}>{fmt(t.btw)}</td>
                      <td className={`px-4 py-3 text-sm font-bold text-right whitespace-nowrap ${isRefund ? 'text-red-600 dark:text-red-400' : isRefunded ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-800 dark:text-white'}`}>{fmt(t.totaal)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setGeselecteerd(t)} title="Bekijken / Afdrukken"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-slate-700/50 border-t-2 border-gray-200 dark:border-slate-600">
                  <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-slate-200">Totaal ({transacties.length})</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-gray-700 dark:text-slate-200 whitespace-nowrap">{fmt(totaalBtw)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">{fmt(totaalOmzet)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {geselecteerd && (
        <TransactieModal
          transactie={geselecteerd}
          onSluiten={() => setGeselecteerd(null)}
          onTerugboeken={() => terugboekenTransactie(geselecteerd.id)}
        />
      )}
    </>
  )
}

// ─── employee statistics ──────────────────────────────────────────────────────

function MedewerkerStats({ transacties }: { transacties: Transactie[] }) {
  const { medewerkers } = usePersoneelStore()

  const stats = useMemo(() => {
    const map: Record<string, { omzet: number; aantal: number }> = {}
    for (const t of transacties) {
      if (t.isTerugboeking) continue
      const key = t.medewerker ?? 'Onbekend'
      map[key] = map[key] ?? { omzet: 0, aantal: 0 }
      map[key]!.omzet += t.totaal
      map[key]!.aantal += 1
    }
    return Object.entries(map)
      .map(([naam, s]) => ({ naam, ...s }))
      .sort((a, b) => b.omzet - a.omzet)
  }, [transacties])

  if (stats.length === 0) return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-4 text-sm flex items-center gap-2">
        <User size={15} /> Medewerker statistieken
      </h3>
      <p className="text-gray-400 dark:text-slate-500 text-sm text-center py-8">Nog geen transactiedata</p>
    </div>
  )

  const maxOmzet = stats[0]?.omzet ?? 1

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-4 text-sm flex items-center gap-2">
        <User size={15} /> Medewerker statistieken
      </h3>
      <div className="space-y-3">
        {stats.map((s, i) => {
          const medewerker = medewerkers.find((m) => m.naam.split(' ')[0] === s.naam)
          const kleur = medewerker?.kleur ?? '#6B7280'
          const breedte = (s.omzet / maxOmzet) * 100
          const isTop = i === 0
          return (
            <div key={s.naam} className="flex items-center gap-4">
              {/* Rank + name */}
              <div className="flex items-center gap-2 w-36 shrink-0">
                {isTop ? (
                  <Trophy size={14} className="text-yellow-500 shrink-0" />
                ) : (
                  <span className="w-4 text-center text-xs font-bold text-gray-400 dark:text-slate-500">{i + 1}</span>
                )}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                  style={{ backgroundColor: kleur }}
                >
                  {s.naam.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 truncate">{s.naam}</span>
              </div>
              {/* Bar */}
              <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${breedte}%`, backgroundColor: kleur }}
                />
              </div>
              {/* Stats */}
              <div className="text-right shrink-0 min-w-[80px]">
                <p className="text-sm font-bold text-gray-800 dark:text-white">{fmt(s.omzet)}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{s.aantal} transacties</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── day closing ──────────────────────────────────────────────────────────────

function DagafsluitingenTab({ alleTransacties }: { alleTransacties: Transactie[] }) {
  const { afsluitingen, voegAfsluitingToe, verwijderAfsluiting } = useDagafsluitingStore()
  const [toonBevestig, setToonBevestig] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const today = new Date()
  const vandaag = alleTransacties.filter((t) => {
    if (t.isTerugboeking) return false
    const d = new Date(t.tijdstip)
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  })
  const todayOmzet = vandaag.reduce((s, t) => s + t.totaal, 0)
  const todayContant = vandaag.filter((t) => t.betaalmethode === 'contant').reduce((s, t) => s + t.totaal, 0)
  const todayPin = vandaag.filter((t) => t.betaalmethode === 'pin').reduce((s, t) => s + t.totaal, 0)
  const todayCadeaubon = vandaag.filter((t) => t.betaalmethode === 'cadeaubon').reduce((s, t) => s + t.totaal, 0)
  const todayBtw = vandaag.reduce((s, t) => s + t.btw, 0)

  function maakAfsluiting() {
    const afsluiting: Dagafsluiting = {
      id: `DAG-${Date.now()}`,
      datum: today.toISOString().slice(0, 10),
      tijdstip: new Date().toISOString(),
      aantalTransacties: vandaag.length,
      omzet: todayOmzet,
      contant: todayContant,
      pin: todayPin,
      cadeaubon: todayCadeaubon,
      btw: todayBtw,
    }
    voegAfsluitingToe(afsluiting)
    setToonBevestig(false)
  }

  function printAfsluiting(a: Dagafsluiting) {
    const w = window.open('', '_blank', 'width=400,height=600')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>Dagafsluiting ${a.datum}</title>
      <style>body{font-family:monospace;font-size:13px;padding:16px;max-width:320px}
      h1{font-size:16px;font-weight:900;margin-bottom:8px}
      .row{display:flex;justify-content:space-between;margin-bottom:4px}
      .total{font-weight:900;font-size:15px;border-top:2px solid #000;margin-top:8px;padding-top:8px}
      .divider{border-top:1px dashed #999;margin:8px 0}
      </style></head><body>
      <h1>DAGAFSLUITING</h1>
      <div class="row"><span>Datum</span><span>${formatDatumLang(a.datum)}</span></div>
      <div class="row"><span>Tijdstip afsluiting</span><span>${formatTijd(a.tijdstip)}</span></div>
      <div class="divider"></div>
      <div class="row"><span>Transacties</span><span>${a.aantalTransacties}</span></div>
      <div class="divider"></div>
      <div class="row"><span>Contant</span><span>${fmt(a.contant)}</span></div>
      <div class="row"><span>PIN</span><span>${fmt(a.pin)}</span></div>
      <div class="row"><span>Cadeaubon</span><span>${fmt(a.cadeaubon)}</span></div>
      <div class="divider"></div>
      <div class="row"><span>BTW</span><span>${fmt(a.btw)}</span></div>
      <div class="row total"><span>TOTAAL OMZET</span><span>${fmt(a.omzet)}</span></div>
      </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  return (
    <div className="space-y-5">
      {/* Today's summary + close button */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Vandaag afsluiten</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">{formatDatumLang(today.toISOString())}</p>
          </div>
          <button
            onClick={() => setToonBevestig(true)}
            disabled={vandaag.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${vandaag.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed'}`}
          >
            <Lock size={14} /> Dag afsluiten
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Transacties', value: String(vandaag.length) },
            { label: 'Contant', value: fmt(todayContant) },
            { label: 'PIN', value: fmt(todayPin) },
            { label: 'Totaal', value: fmt(todayOmzet) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {toonBevestig && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
              Dagafsluiting aanmaken voor {formatDatumLang(today.toISOString())}?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setToonBevestig(false)} className="py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 transition-colors">
                Annuleren
              </button>
              <button onClick={maakAfsluiting} className="py-2.5 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                Bevestigen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Past closings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-semibold text-gray-800 dark:text-slate-200 text-sm">Vorige afsluitingen</h3>
        </div>
        {afsluitingen.length === 0 ? (
          <p className="py-12 text-center text-gray-400 dark:text-slate-500 text-sm">Nog geen afsluitingen</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {afsluitingen.map((a) => {
              const isOpen = openId === a.id
              return (
                <div key={a.id}>
                  <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{formatDatumLang(a.datum)}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{a.aantalTransacties} transacties · Afgesloten om {formatTijd(a.tijdstip)}</p>
                    </div>
                    <span className="text-base font-black text-gray-900 dark:text-white tabular-nums">{fmt(a.omzet)}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setOpenId(isOpen ? null : a.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => printAfsluiting(a)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                        <Printer size={14} />
                      </button>
                      <button onClick={() => verwijderAfsluiting(a.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-4 bg-gray-50 dark:bg-slate-700/30 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Contant', value: fmt(a.contant) },
                        { label: 'PIN', value: fmt(a.pin) },
                        { label: 'Cadeaubon', value: fmt(a.cadeaubon) },
                        { label: 'BTW', value: fmt(a.btw) },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white dark:bg-slate-800 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-slate-700">
                          <p className="text-xs text-gray-400 dark:text-slate-500">{label}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

type Snelkeuze = 'vandaag' | 'week' | 'maand' | 'custom'
type RapportageTab = 'overzicht' | 'dagafsluitingen'

export function RapportagesPage() {
  const { filterTransacties, transacties } = useTransactieStore()

  const today = new Date()
  const [van, setVan] = useState<Date>(startVanDag(today))
  const [tot, setTot] = useState<Date>(eindVanDag(today))
  const [snelkeuze, setSnelkeuze] = useState<Snelkeuze>('vandaag')
  const [tab, setTab] = useState<RapportageTab>('overzicht')

  function kiesVandaag() { setVan(startVanDag(today)); setTot(eindVanDag(today)); setSnelkeuze('vandaag') }
  function kiesDezWeek() { setVan(startVanWeek(today)); setTot(eindVanDag(today)); setSnelkeuze('week') }
  function kiesDezeMaand() { setVan(startVanMaand(today)); setTot(eindVanDag(today)); setSnelkeuze('maand') }

  const gefilterd = useMemo(
    () => filterTransacties(van, tot),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [van, tot, filterTransacties, transacties]
  )

  const totaleOmzet = gefilterd.reduce((s, t) => s + t.totaal, 0)
  const aantalTransacties = gefilterd.length
  const gemiddeld = aantalTransacties > 0 ? totaleOmzet / aantalTransacties : 0
  const totaleBtw = gefilterd.reduce((s, t) => s + t.btw, 0)

  function exportCsv() {
    const rows = [
      ['Datum', 'Tijd', 'Transactie ID', 'Medewerker', 'Producten', 'BTW', 'Totaal'],
      ...gefilterd.map((t) => [
        formatDatum(t.tijdstip), formatTijd(t.tijdstip), t.id,
        t.medewerker ?? '',
        t.regels.map((r) => `${r.aantal}x ${r.naam}`).join(' | '),
        t.btw.toFixed(2), t.totaal.toFixed(2),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapportage-${toInputDate(van)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    const w = window.open('', '_blank', 'width=800,height=600')
    if (!w) return
    const periodeLabel = `${toInputDate(van)} t/m ${toInputDate(tot)}`
    const rows = gefilterd.map((t) => `
      <tr>
        <td>${formatDatum(t.tijdstip)}</td><td>${formatTijd(t.tijdstip)}</td>
        <td style="font-size:10px">${t.id}</td>
        <td>${t.medewerker ?? '—'}</td>
        <td>${t.betaalmethode ?? '—'}</td>
        <td style="text-align:right">${fmt(t.btw)}</td>
        <td style="text-align:right;font-weight:bold">${fmt(t.totaal)}</td>
      </tr>`).join('')
    w.document.write(`<!DOCTYPE html><html><head><title>Rapportage ${periodeLabel}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:12px;padding:20px;color:#111}
        h1{font-size:18px;font-weight:900;margin-bottom:4px}
        .subtitle{color:#666;font-size:12px;margin-bottom:20px}
        .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
        .metric{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
        .metric-label{font-size:10px;color:#666;text-transform:uppercase;margin-bottom:4px}
        .metric-value{font-size:18px;font-weight:900}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{text-align:left;padding:6px 8px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:10px;text-transform:uppercase;color:#6b7280}
        td{padding:6px 8px;border-bottom:1px solid #f3f4f6}
        .total-row{background:#f9fafb;font-weight:bold}
        @media print{body{padding:8px}}
      </style></head><body>
      <h1>Rapportage</h1>
      <div class="subtitle">Periode: ${periodeLabel}</div>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Totale omzet</div><div class="metric-value">${fmt(totaleOmzet)}</div></div>
        <div class="metric"><div class="metric-label">Transacties</div><div class="metric-value">${aantalTransacties}</div></div>
        <div class="metric"><div class="metric-label">Gemiddeld</div><div class="metric-value">${fmt(gemiddeld)}</div></div>
        <div class="metric"><div class="metric-label">BTW totaal</div><div class="metric-value">${fmt(totaleBtw)}</div></div>
      </div>
      <table>
        <thead><tr><th>Datum</th><th>Tijd</th><th>ID</th><th>Medewerker</th><th>Methode</th><th style="text-align:right">BTW</th><th style="text-align:right">Totaal</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="total-row"><td colspan="5">Totaal (${gefilterd.length})</td><td style="text-align:right">${fmt(totaleBtw)}</td><td style="text-align:right">${fmt(totaleOmzet)}</td></tr></tfoot>
      </table>
      </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 400)
  }

  const btnBase = 'px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-100 active:scale-95'
  const btnActief = 'bg-blue-600 text-white shadow-sm'
  const btnInactief = 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-200 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'

  const TABS: { id: RapportageTab; label: string }[] = [
    { id: 'overzicht', label: 'Overzicht' },
    { id: 'dagafsluitingen', label: 'Dagafsluitingen' },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapporten</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Verkoop &amp; statistieken</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportPdf}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm">
              <FileText size={15} /> PDF
            </button>
            <button onClick={exportCsv}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-200 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm">
              <Download size={15} /> CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${tab === t.id ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'dagafsluitingen' ? (
          <DagafsluitingenTab alleTransacties={transacties} />
        ) : (
          <>
            {/* Date filter */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm px-5 py-4 flex flex-wrap items-end gap-4">
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Van</label>
                  <input type="date" value={toInputDate(van)} max={toInputDate(tot)}
                    onChange={(e) => { setVan(fromInputDate(e.target.value)); setSnelkeuze('custom') }}
                    className="border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Tot</label>
                  <input type="date" value={toInputDate(tot)} min={toInputDate(van)}
                    onChange={(e) => { setTot(fromInputDate(e.target.value)); setSnelkeuze('custom') }}
                    className="border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-2 pb-0.5">
                <button onClick={kiesVandaag} className={`${btnBase} ${snelkeuze === 'vandaag' ? btnActief : btnInactief}`}>Vandaag</button>
                <button onClick={kiesDezWeek} className={`${btnBase} ${snelkeuze === 'week' ? btnActief : btnInactief}`}>Deze week</button>
                <button onClick={kiesDezeMaand} className={`${btnBase} ${snelkeuze === 'maand' ? btnActief : btnInactief}`}>Deze maand</button>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <MetricCard label="Totale omzet" value={fmt(totaleOmzet)} icon={TrendingUp} iconColor="text-green-600" iconBg="bg-green-50 dark:bg-green-900/30" />
              <MetricCard label="Transacties" value={String(aantalTransacties)} icon={ShoppingCart} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-900/30" />
              <MetricCard label="Gemiddeld" value={fmt(gemiddeld)} icon={ArrowUpRight} iconColor="text-orange-500" iconBg="bg-orange-50 dark:bg-orange-900/30" />
              <MetricCard label="BTW totaal" value={fmt(totaleBtw)} icon={FileText} iconColor="text-purple-600" iconBg="bg-purple-50 dark:bg-purple-900/30" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <OmzetBarChart transacties={transacties} />
              <OmzetPerCategorie transacties={gefilterd} />
            </div>

            {/* Employee stats */}
            <MedewerkerStats transacties={gefilterd} />

            {/* Transaction list */}
            <TransactieLijst transacties={gefilterd} />
          </>
        )}

      </div>
    </div>
  )
}

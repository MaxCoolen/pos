import { useMemo, useState, useEffect } from 'react'
import {
  TrendingUp, ShoppingCart, FileText, Download, Eye,
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

// ─── font & style injection ───────────────────────────────────────────────────

function RapportageStyles() {
  useEffect(() => {
    if (document.getElementById('rap-gfonts')) return
    const link = document.createElement('link')
    link.id = 'rap-gfonts'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  return (
    <style>{`
      .rap-root { font-family: 'DM Sans', system-ui, sans-serif; }
      .rap-mono { font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace; }

      @keyframes rap-fadein {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes rap-barrise {
        from { transform: scaleY(0); }
        to   { transform: scaleY(1); }
      }
      @keyframes rap-hbarfill {
        from { transform: scaleX(0); }
        to   { transform: scaleX(1); }
      }
      .rap-animate { animation: rap-fadein 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .rap-animate-1 { animation-delay: 0.05s; }
      .rap-animate-2 { animation-delay: 0.10s; }
      .rap-animate-3 { animation-delay: 0.15s; }
      .rap-animate-4 { animation-delay: 0.20s; }
      .rap-animate-5 { animation-delay: 0.25s; }
      .rap-animate-6 { animation-delay: 0.30s; }
      .rap-animate-7 { animation-delay: 0.35s; }
      .rap-bar-rise {
        transform-origin: bottom;
        animation: rap-barrise 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) both;
      }
      .rap-hbar-fill {
        transform-origin: left;
        animation: rap-hbarfill 0.7s cubic-bezier(0.34, 1.1, 0.64, 1) both;
      }

      /* amber glow on active tab underline */
      .rap-tab-active::after {
        content: '';
        position: absolute;
        bottom: -1px; left: 0; right: 0;
        height: 2px;
        background: var(--pos-amber);
        border-radius: 2px 2px 0 0;
      }

      /* subtle dot grid background */
      .rap-bg-dots {
        background-image: radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px);
        background-size: 24px 24px;
      }

      /* card hover glow */
      .rap-card-hover {
        transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
      }
      .rap-card-hover:hover {
        border-color: rgba(37, 99, 235, 0.35) !important;
        box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.15), 0 4px 20px rgba(0,0,0,0.3);
        transform: translateY(-1px);
      }

      /* input date styling */
      .rap-input::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; filter: invert(1); }
      .rap-input:focus { outline: none; border-color: var(--pos-amber) !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
    `}</style>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  accentColor?: string
  delay?: number
}

function MetricCard({ label, value, sub, accentColor = 'var(--pos-amber)', delay = 0 }: MetricCardProps) {
  return (
    <div
      className="rap-animate rap-card-hover relative overflow-hidden rounded-2xl p-5"
      style={{
        animationDelay: `${delay}s`,
        backgroundColor: 'var(--pos-card)',
        border: '1px solid var(--pos-border)',
      }}
    >
      {/* top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: accentColor }} />

      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--pos-t3)' }}>
        {label}
      </p>
      <p
        className="rap-mono text-3xl font-bold leading-none tabular-nums"
        style={{ letterSpacing: '-0.02em', color: 'var(--pos-t1)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-2 rap-mono" style={{ color: 'var(--pos-t3)' }}>{sub}</p>
      )}
    </div>
  )
}

// ─── bar chart (weekly revenue) ───────────────────────────────────────────────

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
          return (
            d.getFullYear() === dag.getFullYear() &&
            d.getMonth() === dag.getMonth() &&
            d.getDate() === dag.getDate()
          )
        })
        .reduce((s, t) => s + t.totaal, 0)
      return {
        label: DAGEN_NL[dag.getDay()]!,
        omzet,
        isVandaag: dag.toDateString() === today.toDateString(),
      }
    })
  }, [transacties])

  const max = Math.max(...bars.map((b) => b.omzet), 1)

  return (
    <div
      className="rap-animate rap-animate-5 rounded-2xl p-6"
      style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--pos-t3)' }}>
          Omzet — afgelopen 7 dagen
        </h3>
        <TrendingUp size={14} className="text-blue-500 opacity-60" />
      </div>

      <div className="flex gap-2 items-end" style={{ height: 140 }}>
        {bars.map((bar, i) => {
          const heightPct = bar.omzet > 0 ? Math.max((bar.omzet / max) * 100, 6) : 5
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
              {bar.omzet > 0 && (
                <span
                  className="text-[10px] font-semibold rap-mono leading-none"
                  style={{ color: bar.isVandaag ? 'var(--pos-amber)' : 'var(--pos-t3)' }}
                >
                  €{bar.omzet.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
                </span>
              )}
              <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                <div
                  className="rap-bar-rise w-full rounded-t-md"
                  style={{
                    height: `${heightPct}%`,
                    animationDelay: `${0.3 + i * 0.06}s`,
                    background: bar.isVandaag
                      ? 'linear-gradient(to top, #A88745, var(--pos-amber))'
                      : bar.omzet > 0
                      ? 'linear-gradient(to top, var(--pos-elevated), var(--pos-t4))'
                      : 'rgba(25,28,38,0.4)',
                  }}
                />
              </div>
              <span
                className="text-[11px] font-semibold shrink-0"
                style={{ color: bar.isVandaag ? 'var(--pos-amber)' : 'var(--pos-t3)' }}
              >
                {bar.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── category chart (horizontal bars) ────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Broodjes: '#3B82F6',
  Snacks:   '#2563EB',
  Drank:    '#A88745',
  Overig:   '#9CA3AF',
}

function OmzetPerCategorie({ transacties }: { transacties: Transactie[] }) {
  const data = useMemo(() => {
    const totalen: Record<string, number> = {}
    for (const t of transacties) {
      for (const r of t.regels) {
        totalen[r.categorie] = (totalen[r.categorie] ?? 0) + r.prijs * r.aantal
      }
    }
    return Object.entries(totalen)
      .map(([cat, omzet]) => ({ cat, omzet }))
      .sort((a, b) => b.omzet - a.omzet)
  }, [transacties])

  const totaal = data.reduce((s, d) => s + d.omzet, 0)

  return (
    <div
      className="rap-animate rap-animate-6 rounded-2xl p-6"
      style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--pos-t3)' }}>
          Omzet per categorie
        </h3>
        <span className="rap-mono text-xs" style={{ color: 'var(--pos-t3)' }}>{fmt(totaal)}</span>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'var(--pos-t4)' }}>
          Geen data beschikbaar
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((d, i) => {
            const pct = totaal > 0 ? (d.omzet / totaal) * 100 : 0
            const color = CAT_COLORS[d.cat] ?? 'var(--pos-t3)'
            return (
              <div key={d.cat}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--pos-t2)' }}>
                      {d.cat}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs rap-mono" style={{ color: 'var(--pos-t3)' }}>
                      {pct.toFixed(0)}%
                    </span>
                    <span className="text-sm font-semibold rap-mono" style={{ color: 'var(--pos-t1)' }}>
                      {fmt(d.omzet)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pos-border)' }}>
                  <div
                    className="rap-hbar-fill h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: color,
                      animationDelay: `${0.4 + i * 0.08}s`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── payment method badges ────────────────────────────────────────────────────

const METHODE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  contant:   { label: 'Contant',   bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
  pin:       { label: 'PIN',       bg: 'rgba(37,99,235,0.15)', color: '#3B82F6' },
  cadeaubon: { label: 'Cadeaubon', bg: 'rgba(139,92,246,0.15)',  color: '#8b5cf6' },
  gesplitst: { label: 'Gesplitst', bg: 'rgba(249,115,22,0.15)',  color: '#f97316' },
}

function PayBadge({ methode }: { methode?: string }) {
  if (!methode) return <span style={{ color: 'var(--pos-t4)' }}>—</span>
  const badge = METHODE_BADGE[methode]
  if (!badge) return <span className="text-xs" style={{ color: 'var(--pos-t2)' }}>{methode}</span>
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: badge.bg, color: badge.color }}
    >
      {badge.label}
    </span>
  )
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
  const bon = transactieToBon(transactie)

  function printBon() {
    const style = document.createElement('style')
    style.textContent = `@media print { body * { visibility:hidden } #bon-content,#bon-content * { visibility:visible } #bon-content { position:fixed;top:0;left:0;width:80mm;padding:4mm;background:white } }`
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onSluiten}
        style={{ backdropFilter: 'blur(6px)' }}
      />
      <div
        className="rap-root relative rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{
          backgroundColor: 'var(--pos-card)',
          border: '1px solid var(--pos-border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.08)',
        }}
      >
        {/* amber top line */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(to right, var(--pos-amber), var(--pos-amber-h))' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--pos-border)' }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--pos-t1)' }}>Transactie</h2>
            <p className="text-[11px] rap-mono mt-0.5" style={{ color: 'var(--pos-t4)' }}>{transactie.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <PayBadge methode={transactie.betaalmethode} />
            {transactie.isTerugboeking && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                Terugboeking
              </span>
            )}
            {transactie.isTerugGeboekt && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--pos-border)', color: 'var(--pos-t3)' }}
              >
                Terugbeboekt
              </span>
            )}
            <button
              onClick={onSluiten}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ color: 'var(--pos-t2)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex gap-0 px-5" style={{ borderBottom: '1px solid var(--pos-border)' }}>
          {(['bon', 'details'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setWeergave(v)}
              className="relative py-3 px-4 text-sm font-medium transition-colors rap-tab-active"
              style={{ color: weergave === v ? 'var(--pos-amber)' : 'var(--pos-t3)' }}
              onMouseEnter={(e) => { if (weergave !== v) e.currentTarget.style.color = 'var(--pos-t2)' }}
              onMouseLeave={(e) => { if (weergave !== v) e.currentTarget.style.color = 'var(--pos-t3)' }}
            >
              {v === 'bon' ? 'Bon / Reprint' : 'Details'}
              {weergave === v && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t" style={{ backgroundColor: 'var(--pos-amber)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[52vh] p-5">
          {weergave === 'bon' ? (
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: 'var(--pos-panel)', border: '1px solid var(--pos-border)' }}
            >
              <BonView bon={bon} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  ['Datum', `${formatDatum(transactie.tijdstip)} ${formatTijd(transactie.tijdstip)}`],
                  ...(transactie.betaalmethode ? [['Betaalmethode', METHODE_BADGE[transactie.betaalmethode]?.label ?? transactie.betaalmethode]] : []),
                  ...(transactie.medewerker ? [['Medewerker', transactie.medewerker]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid var(--pos-hover)' }}>
                    <span className="text-sm" style={{ color: 'var(--pos-t3)' }}>{k}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--pos-t1)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 pt-1">
                {transactie.regels.map((r, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--pos-t2)' }}>
                      <span className="rap-mono" style={{ color: 'var(--pos-t3)' }}>{r.aantal}×</span>{' '}
                      {r.naam}
                    </span>
                    <span className="rap-mono font-medium" style={{ color: 'var(--pos-t1)' }}>
                      {fmt(r.prijs * r.aantal)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-3 space-y-1" style={{ borderTop: '1px solid var(--pos-border)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--pos-t3)' }}>BTW</span>
                  <span className="rap-mono" style={{ color: 'var(--pos-t2)' }}>{fmt(transactie.btw)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold" style={{ color: 'var(--pos-t1)' }}>Totaal</span>
                  <span
                    className="rap-mono text-xl font-bold"
                    style={{ color: transactie.isTerugboeking ? '#ef4444' : 'var(--pos-amber)' }}
                  >
                    {fmt(transactie.totaal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4" style={{ borderTop: '1px solid var(--pos-border)' }}>
          {bevestigRefund ? (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <p className="text-sm font-semibold text-center" style={{ color: '#fca5a5' }}>
                Transactie terugboeken?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBevestigRefund(false)}
                  className="py-2.5 rounded-xl font-semibold text-sm transition-colors"
                  style={{ backgroundColor: 'var(--pos-elevated)', color: 'var(--pos-t2)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-t4)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-elevated)' }}
                >
                  Annuleren
                </button>
                <button
                  onClick={() => { onTerugboeken(); onSluiten() }}
                  className="py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
                  style={{ backgroundColor: '#ef4444' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ef4444' }}
                >
                  Ja, terugboeken
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={printBon}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber)' }}
              >
                <Printer size={14} /> Bon afdrukken
              </button>
              {!transactie.isTerugboeking && !transactie.isTerugGeboekt && (
                <button
                  onClick={() => setBevestigRefund(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.18)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)' }}
                >
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

// ─── transaction list ─────────────────────────────────────────────────────────

function TransactieLijst({ transacties }: { transacties: Transactie[] }) {
  const { terugboekenTransactie } = useTransactieStore()
  const [geselecteerd, setGeselecteerd] = useState<Transactie | null>(null)

  const totaalOmzet = transacties.reduce((s, t) => s + t.totaal, 0)
  const totaalBtw = transacties.reduce((s, t) => s + t.btw, 0)

  return (
    <>
      <div
        className="rap-animate rap-animate-7 rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
      >
        {/* Table header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--pos-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--pos-t3)' }}>
            Transacties
          </h3>
          <span className="rap-mono text-xs" style={{ color: 'var(--pos-t3)' }}>
            {transacties.length} records
          </span>
        </div>

        {transacties.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={32} className="mx-auto mb-3" style={{ color: 'var(--pos-t4)' }} />
            <p className="text-sm" style={{ color: 'var(--pos-t3)' }}>
              Geen transacties in deze periode
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pos-border)' }}>
                  {[
                    { label: 'Datum', align: 'left' },
                    { label: 'Tijd', align: 'left' },
                    { label: 'ID', align: 'left' },
                    { label: 'Medewerker', align: 'left' },
                    { label: 'Methode', align: 'left' },
                    { label: 'Producten', align: 'left' },
                    { label: 'BTW', align: 'right' },
                    { label: 'Totaal', align: 'right' },
                    { label: '', align: 'right' },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap text-${h.align}`}
                      style={{ color: 'var(--pos-t4)' }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transacties.map((t) => {
                  const isRefund = t.isTerugboeking
                  const isRefunded = t.isTerugGeboekt
                  return (
                    <tr
                      key={t.id}
                      className="group transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isRefund
                          ? 'rgba(239,68,68,0.05)'
                          : 'rgba(37,99,235,0.04)'
                      }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <td className="px-4 py-3 text-xs rap-mono whitespace-nowrap" style={{ color: 'var(--pos-t3)' }}>
                        {formatDatum(t.tijdstip)}
                      </td>
                      <td className="px-4 py-3 text-xs rap-mono font-medium whitespace-nowrap" style={{ color: 'var(--pos-t2)' }}>
                        {formatTijd(t.tijdstip)}
                      </td>
                      <td className="px-4 py-3 text-[10px] rap-mono whitespace-nowrap" style={{ color: 'var(--pos-t4)' }}>
                        {t.id}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--pos-t3)' }}>
                        {t.medewerker ?? <span style={{ color: 'var(--pos-t4)' }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isRefund ? (
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                          >
                            Terugboeking
                          </span>
                        ) : (
                          <PayBadge methode={t.betaalmethode} />
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-xs max-w-[140px] truncate"
                        style={{ color: isRefund ? '#ef4444' : 'var(--pos-t3)' }}
                      >
                        {t.regels.map((r) => `${r.aantal}× ${r.naam}`).join(', ')}
                      </td>
                      <td
                        className="px-4 py-3 text-xs rap-mono text-right whitespace-nowrap"
                        style={{ color: isRefund ? '#ef4444' : 'var(--pos-t3)' }}
                      >
                        {fmt(t.btw)}
                      </td>
                      <td
                        className="px-4 py-3 text-sm rap-mono font-bold text-right whitespace-nowrap"
                        style={{
                          color: isRefund
                            ? '#ef4444'
                            : isRefunded
                            ? 'var(--pos-t4)'
                            : 'var(--pos-t1)',
                          textDecoration: isRefunded && !isRefund ? 'line-through' : 'none',
                        }}
                      >
                        {fmt(t.totaal)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setGeselecteerd(t)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                          style={{ color: 'var(--pos-t3)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.12)'; e.currentTarget.style.color = 'var(--pos-amber)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                          title="Bekijken"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--pos-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <td colSpan={6} className="px-4 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--pos-t3)' }}>
                    Totaal — {transacties.length} transacties
                  </td>
                  <td className="px-4 py-3 text-sm rap-mono font-semibold text-right whitespace-nowrap" style={{ color: 'var(--pos-t2)' }}>
                    {fmt(totaalBtw)}
                  </td>
                  <td className="px-4 py-3 text-base rap-mono font-bold text-right whitespace-nowrap" style={{ color: 'var(--pos-amber)' }}>
                    {fmt(totaalOmzet)}
                  </td>
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

// ─── employee stats ───────────────────────────────────────────────────────────

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

  return (
    <div
      className="rap-animate rap-animate-6 rounded-2xl p-6"
      style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--pos-t3)' }}>
          <User size={13} />
          Medewerkers
        </h3>
        {stats.length > 0 && stats[0] && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--pos-amber)' }}>
            <Trophy size={12} />
            <span className="font-semibold">{stats[0].naam}</span>
          </div>
        )}
      </div>

      {stats.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-sm" style={{ color: 'var(--pos-t4)' }}>
          Nog geen transactiedata
        </div>
      ) : (
        <div className="space-y-4">
          {stats.map((s, i) => {
            const medewerker = medewerkers.find((m) => m.naam.split(' ')[0] === s.naam)
            const kleur = medewerker?.kleur ?? (i === 0 ? '#3B82F6' : 'var(--pos-t3)')
            const maxOmzet = stats[0]?.omzet ?? 1
            const breedte = (s.omzet / maxOmzet) * 100
            return (
              <div key={s.naam} className="flex items-center gap-4">
                <div className="w-6 text-center">
                  {i === 0 ? (
                    <Trophy size={14} className="mx-auto" style={{ color: 'var(--pos-amber)' }} />
                  ) : (
                    <span className="text-xs rap-mono font-bold" style={{ color: 'var(--pos-t4)' }}>
                      {i + 1}
                    </span>
                  )}
                </div>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                  style={{ backgroundColor: kleur }}
                >
                  {s.naam.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--pos-t2)' }}>
                      {s.naam}
                    </span>
                    <span className="rap-mono text-sm font-bold ml-2 shrink-0" style={{ color: 'var(--pos-t1)' }}>
                      {fmt(s.omzet)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pos-border)' }}>
                    <div
                      className="rap-hbar-fill h-full rounded-full"
                      style={{
                        width: `${breedte}%`,
                        backgroundColor: kleur,
                        animationDelay: `${0.4 + i * 0.07}s`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--pos-t3)' }}>
                    {s.aantal} transacties
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── day closing tab ──────────────────────────────────────────────────────────

function DagafsluitingenTab({ alleTransacties }: { alleTransacties: Transactie[] }) {
  const { afsluitingen, voegAfsluitingToe, verwijderAfsluiting } = useDagafsluitingStore()
  const [toonBevestig, setToonBevestig] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const today = new Date()
  const vandaag = alleTransacties.filter((t) => {
    if (t.isTerugboeking) return false
    const d = new Date(t.tijdstip)
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    )
  })
  const todayOmzet      = vandaag.reduce((s, t) => s + t.totaal, 0)
  const todayContant    = vandaag.filter((t) => t.betaalmethode === 'contant').reduce((s, t) => s + t.totaal, 0)
  const todayPin        = vandaag.filter((t) => t.betaalmethode === 'pin').reduce((s, t) => s + t.totaal, 0)
  const todayCadeaubon  = vandaag.filter((t) => t.betaalmethode === 'cadeaubon').reduce((s, t) => s + t.totaal, 0)
  const todayBtw        = vandaag.reduce((s, t) => s + t.btw, 0)

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

  const statCards = [
    { label: 'Transacties', value: String(vandaag.length), mono: true },
    { label: 'Contant',     value: fmt(todayContant),      mono: true },
    { label: 'PIN',         value: fmt(todayPin),          mono: true },
    { label: 'Omzet',       value: fmt(todayOmzet),        mono: true, accent: true },
  ]

  return (
    <div className="space-y-5">
      {/* Today */}
      <div
        className="rap-animate rounded-2xl p-6 relative overflow-hidden"
        style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(to right, var(--pos-amber), var(--pos-amber-h))' }} />
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--pos-t1)' }}>Vandaag afsluiten</h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--pos-t3)' }}>{formatDatumLang(today.toISOString())}</p>
          </div>
          <button
            onClick={() => setToonBevestig(true)}
            disabled={vandaag.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
            style={
              vandaag.length > 0
                ? { backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }
                : { backgroundColor: 'var(--pos-elevated)', color: 'var(--pos-t4)', cursor: 'not-allowed' }
            }
            onMouseEnter={(e) => { if (vandaag.length > 0) e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)' }}
            onMouseLeave={(e) => { if (vandaag.length > 0) e.currentTarget.style.backgroundColor = 'var(--pos-amber)' }}
          >
            <Lock size={14} /> Dag afsluiten
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(({ label, value, mono, accent }) => (
            <div
              key={label}
              className="rounded-xl px-4 py-3"
              style={
                accent
                  ? { backgroundColor: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }
                  : { backgroundColor: 'var(--pos-panel)', border: '1px solid var(--pos-hover)' }
              }
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--pos-t3)' }}>{label}</p>
              <p
                className={`text-lg font-bold tabular-nums ${mono ? 'rap-mono' : ''}`}
                style={{ color: accent ? 'var(--pos-amber)' : 'var(--pos-t1)' }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {toonBevestig && (
          <div
            className="mt-5 rounded-2xl p-4"
            style={{ backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--pos-amber)' }}>
              Dagafsluiting aanmaken voor {formatDatumLang(today.toISOString())}?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setToonBevestig(false)}
                className="py-2.5 rounded-xl font-semibold text-sm transition-colors"
                style={{ backgroundColor: 'var(--pos-elevated)', color: 'var(--pos-t2)', border: '1px solid var(--pos-border)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-t4)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-elevated)' }}
              >
                Annuleren
              </button>
              <button
                onClick={maakAfsluiting}
                className="py-2.5 rounded-xl font-semibold text-sm transition-colors"
                style={{ backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber)' }}
              >
                Bevestigen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Past closings */}
      <div
        className="rap-animate rap-animate-2 rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--pos-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--pos-t3)' }}>
            Vorige afsluitingen
          </h3>
        </div>

        {afsluitingen.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--pos-t4)' }} />
            <p className="text-sm" style={{ color: 'var(--pos-t3)' }}>Nog geen afsluitingen</p>
          </div>
        ) : (
          <div>
            {afsluitingen.map((a, idx) => {
              const isOpen = openId === a.id
              return (
                <div key={a.id} style={{ borderBottom: idx < afsluitingen.length - 1 ? '1px solid var(--pos-hover)' : 'none' }}>
                  <div
                    className="flex items-center gap-4 px-6 py-4 transition-colors group"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.04)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: 'var(--pos-t1)' }}>
                        {formatDatumLang(a.datum)}
                      </p>
                      <p className="text-xs mt-0.5 rap-mono" style={{ color: 'var(--pos-t3)' }}>
                        {a.aantalTransacties} transacties · {formatTijd(a.tijdstip)}
                      </p>
                    </div>
                    <span className="rap-mono text-lg font-bold tabular-nums" style={{ color: 'var(--pos-amber)' }}>
                      {fmt(a.omzet)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setOpenId(isOpen ? null : a.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--pos-t3)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-hover)'; e.currentTarget.style.color = 'var(--pos-t2)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                      >
                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button
                        onClick={() => printAfsluiting(a)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--pos-t3)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.12)'; e.currentTarget.style.color = 'var(--pos-amber)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                      >
                        <Printer size={13} />
                      </button>
                      <button
                        onClick={() => verwijderAfsluiting(a.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--pos-t3)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div
                      className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
                      style={{ backgroundColor: 'var(--pos-panel)', borderTop: '1px solid var(--pos-border)' }}
                    >
                      {[
                        { label: 'Contant',   value: fmt(a.contant) },
                        { label: 'PIN',       value: fmt(a.pin) },
                        { label: 'Cadeaubon', value: fmt(a.cadeaubon) },
                        { label: 'BTW',       value: fmt(a.btw) },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="rounded-xl px-3 py-2.5 mt-3"
                          style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--pos-t3)' }}>{label}</p>
                          <p className="text-sm font-bold rap-mono mt-0.5" style={{ color: 'var(--pos-t1)' }}>{value}</p>
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

type Snelkeuze    = 'vandaag' | 'week' | 'maand' | 'custom'
type RapportageTab = 'overzicht' | 'dagafsluitingen'

export function RapportagesPage() {
  const { filterTransacties, transacties } = useTransactieStore()

  const today = new Date()
  const [van,        setVan]        = useState<Date>(startVanDag(today))
  const [tot,        setTot]        = useState<Date>(eindVanDag(today))
  const [snelkeuze,  setSnelkeuze]  = useState<Snelkeuze>('vandaag')
  const [tab,        setTab]        = useState<RapportageTab>('overzicht')

  function kiesVandaag()   { setVan(startVanDag(today));   setTot(eindVanDag(today)); setSnelkeuze('vandaag') }
  function kiesDezWeek()   { setVan(startVanWeek(today));  setTot(eindVanDag(today)); setSnelkeuze('week') }
  function kiesDezeMaand() { setVan(startVanMaand(today)); setTot(eindVanDag(today)); setSnelkeuze('maand') }

  const gefilterd = useMemo(
    () => filterTransacties(van, tot),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [van, tot, filterTransacties, transacties],
  )

  const totaleOmzet      = gefilterd.reduce((s, t) => s + t.totaal, 0)
  const aantalTransacties = gefilterd.length
  const gemiddeld        = aantalTransacties > 0 ? totaleOmzet / aantalTransacties : 0
  const totaleBtw        = gefilterd.reduce((s, t) => s + t.btw, 0)

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
    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
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
        .metric-value{font-size:18px;font-weight:900;font-family:monospace}
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

  const TABS: { id: RapportageTab; label: string }[] = [
    { id: 'overzicht',       label: 'Overzicht' },
    { id: 'dagafsluitingen', label: 'Dagafsluitingen' },
  ]

  const periodLabel = snelkeuze === 'vandaag'
    ? 'Vandaag'
    : snelkeuze === 'week'
    ? 'Deze week'
    : snelkeuze === 'maand'
    ? 'Deze maand'
    : `${toInputDate(van)} – ${toInputDate(tot)}`

  return (
    <div className="rap-root flex-1 overflow-y-auto rap-bg-dots" style={{ backgroundColor: 'var(--pos-panel)' }}>
      <RapportageStyles />

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="rap-animate flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1
                className="text-3xl font-extrabold leading-none"
                style={{ letterSpacing: '-0.03em', color: 'var(--pos-t1)' }}
              >
                Rapporten
              </h1>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  backgroundColor: 'rgba(37,99,235,0.12)',
                  color: 'var(--pos-amber)',
                  border: '1px solid rgba(37,99,235,0.2)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--pos-amber)' }} />
                {periodLabel}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--pos-t3)' }}>Verkoop &amp; statistieken</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPdf}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-all"
              style={{
                backgroundColor: 'var(--pos-card)',
                border: '1px solid var(--pos-border)',
                color: 'var(--pos-t2)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.color = 'var(--pos-amber)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--pos-border)'; e.currentTarget.style.color = 'var(--pos-t2)' }}
            >
              <FileText size={14} /> PDF
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-all"
              style={{
                backgroundColor: 'var(--pos-card)',
                border: '1px solid var(--pos-border)',
                color: 'var(--pos-t2)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; e.currentTarget.style.color = 'var(--pos-amber)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--pos-border)'; e.currentTarget.style.color = 'var(--pos-t2)' }}
            >
              <Download size={14} /> CSV
            </button>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="rap-animate rap-animate-1 flex gap-0" style={{ borderBottom: '1px solid var(--pos-border)' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative px-5 py-3 text-sm font-semibold transition-colors"
              style={{ color: tab === t.id ? 'var(--pos-amber)' : 'var(--pos-t3)' }}
              onMouseEnter={(e) => { if (tab !== t.id) e.currentTarget.style.color = 'var(--pos-t2)' }}
              onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.color = 'var(--pos-t3)' }}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t" style={{ backgroundColor: 'var(--pos-amber)' }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Dagafsluitingen ───────────────────────────────────────────────── */}
        {tab === 'dagafsluitingen' && (
          <DagafsluitingenTab alleTransacties={transacties} />
        )}

        {/* ── Overzicht ─────────────────────────────────────────────────────── */}
        {tab === 'overzicht' && (
          <>
            {/* Date filter */}
            <div
              className="rap-animate rap-animate-2 rounded-2xl px-5 py-4 flex flex-wrap items-end gap-5"
              style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
            >
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--pos-t3)' }}>
                    Van
                  </label>
                  <input
                    type="date"
                    value={toInputDate(van)}
                    max={toInputDate(tot)}
                    onChange={(e) => { setVan(fromInputDate(e.target.value)); setSnelkeuze('custom') }}
                    className="rap-input rounded-xl px-3 py-2 text-sm transition-all"
                    style={{
                      backgroundColor: 'var(--pos-elevated)',
                      border: '1px solid var(--pos-border)',
                      color: 'var(--pos-t1)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--pos-t3)' }}>
                    Tot
                  </label>
                  <input
                    type="date"
                    value={toInputDate(tot)}
                    min={toInputDate(van)}
                    onChange={(e) => { setTot(fromInputDate(e.target.value)); setSnelkeuze('custom') }}
                    className="rap-input rounded-xl px-3 py-2 text-sm transition-all"
                    style={{
                      backgroundColor: 'var(--pos-elevated)',
                      border: '1px solid var(--pos-border)',
                      color: 'var(--pos-t1)',
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-1.5 pb-0.5">
                {[
                  { label: 'Vandaag',      key: 'vandaag', fn: kiesVandaag },
                  { label: 'Deze week',    key: 'week',    fn: kiesDezWeek },
                  { label: 'Deze maand',   key: 'maand',   fn: kiesDezeMaand },
                ].map(({ label, key, fn }) => (
                  <button
                    key={key}
                    onClick={fn}
                    className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
                    style={
                      snelkeuze === key
                        ? { backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }
                        : {
                            backgroundColor: 'var(--pos-elevated)',
                            color: 'var(--pos-t2)',
                            border: '1px solid var(--pos-border)',
                          }
                    }
                    onMouseEnter={(e) => {
                      if (snelkeuze !== key) {
                        e.currentTarget.style.backgroundColor = 'var(--pos-t4)'
                      } else {
                        e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (snelkeuze !== key) {
                        e.currentTarget.style.backgroundColor = 'var(--pos-elevated)'
                      } else {
                        e.currentTarget.style.backgroundColor = 'var(--pos-amber)'
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <MetricCard
                label="Totale omzet"
                value={fmt(totaleOmzet)}
                accentColor="var(--pos-amber)"
                delay={0.10}
              />
              <MetricCard
                label="Transacties"
                value={String(aantalTransacties)}
                sub={aantalTransacties > 0 ? `gem. ${fmt(gemiddeld)}` : undefined}
                accentColor="#9CA3AF"
                delay={0.15}
              />
              <MetricCard
                label="Gemiddeld"
                value={fmt(gemiddeld)}
                accentColor="#10B981"
                delay={0.20}
              />
              <MetricCard
                label="BTW totaal"
                value={fmt(totaleBtw)}
                accentColor="#8B5CF6"
                delay={0.25}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <OmzetBarChart transacties={transacties} />
              <OmzetPerCategorie transacties={gefilterd} />
            </div>

            {/* Employee + Transaction list */}
            <MedewerkerStats transacties={gefilterd} />
            <TransactieLijst transacties={gefilterd} />
          </>
        )}

      </div>
    </div>
  )
}

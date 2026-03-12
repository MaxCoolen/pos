import { useEffect, useMemo, useState } from 'react'
import { usePromoStore } from '../store/usePromoStore'
import { useKortingStore } from '../store/useKortingStore'
import { useInstellingenStore } from '../store/useInstellingenStore'
import { berekenKortingen } from '../utils/kortingBerekening'
import { PromoSlideshow } from '../components/PromoSlideshow'
import type { CartItem } from '../types'

export const KLANTENDISP_KEY = 'pos-klantendisp-items'

function fmt(n: number) {
  return n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
}

function leesItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(KLANTENDISP_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CustomerDisplayPage() {
  const { promoties } = usePromoStore()
  const { kortingen } = useKortingStore()
  const { bedrijfsnaam, logo } = useInstellingenStore()

  const [items, setItems] = useState<CartItem[]>(leesItems)

  // Request fullscreen on mount (triggered by user gesture from opening the tab)
  useEffect(() => {
    const el = document.documentElement
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        // Silently ignore if browser denies fullscreen
      })
    }
  }, [])

  // Cross-tab sync via storage event
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KLANTENDISP_KEY) {
        setItems(e.newValue ? JSON.parse(e.newValue) : [])
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Poll every second as fallback
  useEffect(() => {
    const id = setInterval(() => setItems(leesItems()), 1000)
    return () => clearInterval(id)
  }, [])

  const { totaal: kortingBedrag } = useMemo(
    () => berekenKortingen(items, kortingen),
    [items, kortingen]
  )

  const brutoBedrag = items.reduce(
    (s, i) => s + i.product.prijs * i.aantal,
    0
  )
  const nettoBedrag = Math.max(0, brutoBedrag - kortingBedrag)
  const heeftKorting = kortingBedrag > 0.005

  const actiefPromos = promoties.filter((p) => p.actief)
  const heeftItems = items.length > 0

  // ── Mode 1: Empty cart → full-screen slideshow ────────────────────────────

  if (!heeftItems) {
    return (
      <div className="h-screen w-screen bg-slate-900 overflow-hidden relative">
        <PromoSlideshow promoties={actiefPromos} className="w-full h-full" />

        {/* Branding overlay (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-10 py-6 flex items-end">
          <div className="flex items-center gap-3">
            {logo && (
              <img src={logo} alt={bedrijfsnaam} className="max-h-8 w-auto object-contain" />
            )}
            <p className="text-white font-black text-xl tracking-tight">{bedrijfsnaam}</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Mode 2: Items in cart — 25% cart left (always light), 75% promos right ──

  return (
    <div className="h-screen w-screen bg-slate-950 flex overflow-hidden">

      {/* ── Left: Cart (25%) — always light mode ── */}
      <div className="w-1/4 flex flex-col min-w-0 bg-white border-r border-gray-200">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-3 border-b border-gray-100 shrink-0">
          {logo && (
            <img src={logo} alt={bedrijfsnaam} className="max-h-7 w-auto object-contain shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-gray-900 font-black text-base leading-tight truncate">{bedrijfsnaam}</p>
            <p className="text-gray-400 text-xs uppercase tracking-widest">Uw bestelling</p>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-white">
          {items.map((item) => {
            const isKg = item.product.prijsType === 'kg'
            const lineTotal = item.product.prijs * item.aantal
            return (
              <div key={item.product.id} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Product name */}
                  <p className="text-lg font-bold text-gray-900 leading-tight truncate">
                    {item.product.naam}
                  </p>
                  {/* Qty / weight + unit price */}
                  {isKg ? (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {Math.round(item.aantal * 1000)}g &mdash; {fmt(item.product.prijs)}/kg
                    </p>
                  ) : (
                    <p className="text-base font-black text-blue-600 mt-0.5 leading-none">
                      x{item.aantal}
                      <span className="font-semibold text-gray-400 text-sm ml-2">
                        &mdash; {fmt(item.product.prijs)}/st
                      </span>
                    </p>
                  )}
                </div>
                {/* Line price */}
                <p className="text-lg font-black text-gray-900 tabular-nums shrink-0 pt-0.5">
                  {fmt(lineTotal)}
                </p>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="px-6 py-5 border-t-2 border-gray-100 bg-gray-50 shrink-0">
          {heeftKorting && (
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 text-sm">Subtotaal</span>
              <span className="text-gray-400 text-sm tabular-nums line-through">{fmt(brutoBedrag)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-xl font-bold">Totaal</span>
            <span className="text-gray-900 text-4xl font-black tabular-nums leading-none">
              {fmt(nettoBedrag)}
            </span>
          </div>
          {heeftKorting && (
            <p className="text-emerald-600 text-xs font-medium mt-1 text-right">
              Inclusief korting van {fmt(kortingBedrag)}
            </p>
          )}
        </div>
      </div>

      {/* ── Right: Promotions (75%) ── */}
      <div className="w-3/4 shrink-0">
        {actiefPromos.length > 0 ? (
          <PromoSlideshow
            promoties={actiefPromos}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <p className="text-slate-700 text-sm">Geen promoties</p>
          </div>
        )}
      </div>
    </div>
  )
}

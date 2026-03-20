import { useEffect, useMemo, useState } from 'react'
import { usePromoStore, type Promotie } from '../store/usePromoStore'
import { useKortingStore } from '../store/useKortingStore'
import { useInstellingenStore } from '../store/useInstellingenStore'
import { berekenKortingen, berekenItemKortingMap } from '../utils/kortingBerekening'
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

// ─── font injection ───────────────────────────────────────────────────────────

function useFont() {
  useEffect(() => {
    if (document.getElementById('cd-font')) return
    const link = document.createElement('link')
    link.id = 'cd-font'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyDisplay({
  promoties,
  bedrijfsnaam,
  logo,
}: {
  promoties: Promotie[]
  bedrijfsnaam: string
  logo: string | null
}) {
  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      <PromoSlideshow promoties={promoties} className="w-full h-full" />
      <div
        className="absolute bottom-0 left-0 right-0 px-10 py-8 flex items-center gap-4"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
        }}
      >
        {logo && (
          <img src={logo} alt={bedrijfsnaam} className="max-h-9 w-auto object-contain" />
        )}
        <p
          style={{
            fontFamily: "'Figtree', system-ui, sans-serif",
            fontSize: 24,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.01em',
          }}
        >
          {bedrijfsnaam}
        </p>
      </div>
    </div>
  )
}

// ─── cart panel ───────────────────────────────────────────────────────────────

function CartPanel({
  items,
  bedrijfsnaam,
  logo,
  kortingMap,
  brutoBedrag,
  nettoBedrag,
  kortingBedrag,
  heeftKorting,
}: {
  items: CartItem[]
  bedrijfsnaam: string
  logo: string | null
  kortingMap: Map<string, number>
  brutoBedrag: number
  nettoBedrag: number
  kortingBedrag: number
  heeftKorting: boolean
}) {
  const ff = "'Figtree', system-ui, sans-serif"

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e5e5',
        fontFamily: ff,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '20px 28px',
          borderBottom: '1px solid #eeeeee',
          flexShrink: 0,
        }}
      >
        {logo && (
          <img
            src={logo}
            alt={bedrijfsnaam}
            style={{ maxHeight: 36, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#111',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {bedrijfsnaam}
          </p>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#aaa',
              letterSpacing: '0.1em',
              marginTop: 2,
              textTransform: 'uppercase',
            }}
          >
            Uw bestelling
          </p>
        </div>
      </div>

      {/* Items */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((item, idx) => {
          const isKg          = item.product.prijsType === 'kg'
          const lineTotal     = item.product.prijs * item.aantal
          const itemKorting   = kortingMap.get(item.product.id) ?? 0
          const heeftItemKorting = itemKorting > 0.005
          const nettoLine     = Math.max(0, lineTotal - itemKorting)

          return (
            <div
              key={item.product.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '18px 28px',
                borderBottom: idx < items.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}
            >
              {/* Left: naam + qty */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#111',
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.product.naam}
                </p>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#999',
                    marginTop: 3,
                    letterSpacing: 0,
                  }}
                >
                  {isKg
                    ? `${Math.round(item.aantal * 1000)} g · ${fmt(item.product.prijs)}/kg`
                    : `${item.aantal}× · ${fmt(item.product.prijs)}/st`}
                </p>
              </div>

              {/* Right: price */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {heeftItemKorting ? (
                  <>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#bbb',
                        textDecoration: 'line-through',
                        lineHeight: 1,
                      }}
                    >
                      {fmt(lineTotal)}
                    </p>
                    <p
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#16a34a',
                        lineHeight: 1.2,
                        marginTop: 2,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {fmt(nettoLine)}
                    </p>
                  </>
                ) : (
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#111',
                      lineHeight: 1.25,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {fmt(lineTotal)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Totals */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '2px solid #eeeeee',
          padding: '18px 28px 24px',
          backgroundColor: '#fafafa',
        }}
      >
        {heeftKorting && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: '#aaa' }}>Subtotaal</span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: '#bbb',
                textDecoration: 'line-through',
              }}
            >
              {fmt(brutoBedrag)}
            </span>
          </div>
        )}

        {heeftKorting && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: '#16a34a' }}>Korting</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#16a34a' }}>
              −{fmt(kortingBedrag)}
            </span>
          </div>
        )}

        {/* Total row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#555',
              letterSpacing: '-0.005em',
            }}
          >
            Totaal
          </span>
          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: '#111',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              tabularNums: true,
              fontVariantNumeric: 'tabular-nums',
            } as React.CSSProperties}
          >
            {fmt(nettoBedrag)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export function CustomerDisplayPage() {
  useFont()

  const { promoties }          = usePromoStore()
  const { kortingen }          = useKortingStore()
  const { bedrijfsnaam, logo } = useInstellingenStore()

  const [items, setItems] = useState<CartItem[]>(leesItems)

  // Fullscreen on mount
  useEffect(() => {
    const el = document.documentElement
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
  }, [])

  // Cross-tab sync
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KLANTENDISP_KEY) setItems(e.newValue ? JSON.parse(e.newValue) : [])
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Poll fallback
  useEffect(() => {
    const id = setInterval(() => setItems(leesItems()), 1000)
    return () => clearInterval(id)
  }, [])

  const { totaal: kortingBedrag } = useMemo(
    () => berekenKortingen(items, kortingen),
    [items, kortingen],
  )
  const kortingMap = useMemo(
    () => berekenItemKortingMap(items, kortingen),
    [items, kortingen],
  )

  const brutoBedrag  = items.reduce((s, i) => s + i.product.prijs * i.aantal, 0)
  const nettoBedrag  = Math.max(0, brutoBedrag - kortingBedrag)
  const heeftKorting = kortingBedrag > 0.005
  const actiefPromos = promoties.filter((p) => p.actief)
  const heeftItems   = items.length > 0

  if (!heeftItems) {
    return (
      <EmptyDisplay
        promoties={actiefPromos}
        bedrijfsnaam={bedrijfsnaam}
        logo={logo}
      />
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Cart — 35% */}
      <div style={{ width: '35%', flexShrink: 0, overflow: 'hidden' }}>
        <CartPanel
          items={items}
          bedrijfsnaam={bedrijfsnaam}
          logo={logo}
          kortingMap={kortingMap}
          brutoBedrag={brutoBedrag}
          nettoBedrag={nettoBedrag}
          kortingBedrag={kortingBedrag}
          heeftKorting={heeftKorting}
        />
      </div>

      {/* Promos — 65% */}
      <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#111' }}>
        {actiefPromos.length > 0 ? (
          <PromoSlideshow promoties={actiefPromos} className="w-full h-full" />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p
              style={{
                fontFamily: "'Figtree', system-ui, sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.15)',
                letterSpacing: '0.05em',
              }}
            >
              {bedrijfsnaam}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

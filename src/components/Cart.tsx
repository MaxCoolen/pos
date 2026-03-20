import { useEffect, useMemo, useState } from 'react'
import { Trash2, ShoppingCart, Tag } from 'lucide-react'
import { useCartStore } from '../store/useCartStore'
import { useBetalingStore } from '../store/useBetalingStore'
import { useKortingStore } from '../store/useKortingStore'
import { berekenKortingen, berekenItemKortingMap } from '../utils/kortingBerekening'
import { Numpad } from './Numpad'

function fmt(prijs: number) {
  return prijs.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
}

/** Format grams for display (e.g. 500 → "500 g", 1500 → "1500 g") */
function fmtGram(grams: number) {
  return `${Math.round(grams)} g`
}

export function Cart() {
  const { items, verwijder, updateAantal, selecteer, leegmaken, totaal, geselecteerdId } =
    useCartStore()
  const openModal = useBetalingStore((s) => s.openModal)
  const kortingen = useKortingStore((s) => s.kortingen)

  // ── totals ───────────────────────────────────────────────────────────────────

  const totaalBedrag = totaal()

  const { regels: kortingRegels, totaal: kortingBedrag } = useMemo(
    () => berekenKortingen(items, kortingen),
    [items, kortingen]
  )

  const nettoBedrag = Math.max(0, totaalBedrag - kortingBedrag)

  const itemKortingMap = useMemo(
    () => berekenItemKortingMap(items, kortingen),
    [items, kortingen]
  )

  const btw9 = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (item.product.btw !== 9) return sum
        return sum + item.product.prijs * item.aantal * (9 / 109)
      }, 0),
    [items]
  )

  const btw21 = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (item.product.btw !== 21) return sum
        return sum + item.product.prijs * item.aantal * (21 / 121)
      }, 0),
    [items]
  )

  // ── numpad ───────────────────────────────────────────────────────────────────

  const geselecteerdItem = items.find((i) => i.product.id === geselecteerdId) ?? null
  const isKgProduct = geselecteerdItem?.product.prijsType === 'kg'

  // Buffer always stores raw input digits:
  //   • stuk mode  → pieces  (e.g. "3"   → 3 stuk stored)
  //   • kg mode    → grams   (e.g. "500" → 0.500 kg stored)
  const [buffer, setBuffer] = useState('')
  useEffect(() => {
    setBuffer('')
  }, [geselecteerdId])

  function handleNumpad(key: string) {
    if (!geselecteerdId) return

    if (key === 'C') {
      updateAantal(geselecteerdId, 0)
      setBuffer('')
      return
    }

    if (key === '←') {
      const newBuffer = buffer.slice(0, -1)
      setBuffer(newBuffer)
      const raw = newBuffer === '' ? 0 : parseInt(newBuffer)
      updateAantal(geselecteerdId, isKgProduct ? raw / 1000 : raw)
      return
    }

    const newBuffer = buffer === '' ? key : buffer + key
    const maxInput = isKgProduct ? 99999 : 999  // grams or pieces
    if (parseInt(newBuffer) > maxInput) return
    setBuffer(newBuffer)
    const raw = parseInt(newBuffer)
    updateAantal(geselecteerdId, isKgProduct ? raw / 1000 : raw)
  }

  /**
   * Returns a human-readable quantity string for a cart item.
   * – In kg mode the store holds kg (e.g. 0.500); we display grams.
   * – In stuk mode we display the integer count.
   * – If the item is currently being edited we show the live buffer instead.
   */
  function displayAantal(productId: string, werkelijkAantal: number, isKg: boolean): string {
    if (productId === geselecteerdId && buffer !== '') {
      return isKg ? fmtGram(parseInt(buffer)) : buffer
    }
    if (isKg) return fmtGram(werkelijkAantal * 1000)
    return String(werkelijkAantal)
  }

  // ── checkout button hover state ───────────────────────────────────────────────

  const [checkoutHover, setCheckoutHover] = useState(false)

  // ── render ───────────────────────────────────────────────────────────────────

  const heeftItems = items.length > 0
  const heeftKorting = kortingRegels.length > 0

  return (
    <div
      className="w-80 xl:w-96 flex flex-col shrink-0"
      style={{ backgroundColor: 'var(--pos-card)', borderLeft: '1px solid var(--pos-border)' }}
    >

      {/* ── Header ── */}
      <div
        className="px-5 py-4 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid var(--pos-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(37,99,235,0.12)' }}
          >
            <ShoppingCart size={15} style={{ color: 'var(--pos-amber)' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="font-bold text-base" style={{ color: 'var(--pos-t1)' }}>Winkelwagen</h2>
            {heeftItems && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full font-mono tabular-nums"
                style={{ color: 'var(--pos-amber)', backgroundColor: 'rgba(37,99,235,0.12)' }}
              >
                {items.length}
              </span>
            )}
          </div>
        </div>
        {heeftItems && (
          <button
            onClick={leegmaken}
            className="text-xs font-medium transition-colors px-2 py-1 rounded-lg hover:text-red-500 hover:bg-red-950/40"
            style={{ color: 'var(--pos-t2)' }}
          >
            Leegmaken
          </button>
        )}
      </div>

      {/* ── Cart items ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0">
        {!heeftItems ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: 'var(--pos-elevated)' }}
            >
              <ShoppingCart size={28} style={{ color: 'var(--pos-t4)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--pos-t3)' }}>Voeg producten toe</p>
            <p className="text-xs mt-1" style={{ color: 'var(--pos-t4)' }}>Tik op een product</p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = item.product.id === geselecteerdId
            const isKg = item.product.prijsType === 'kg'
            const itemKorting = itemKortingMap.get(item.product.id) ?? 0
            const heeftItemKorting = itemKorting > 0.005
            const brutoBedrag = item.product.prijs * item.aantal
            const nettoBedragItem = brutoBedrag - itemKorting

            return (
              <button
                key={item.product.id}
                onClick={() => selecteer(item.product.id)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-100 text-left"
                style={
                  isSelected
                    ? { backgroundColor: 'rgba(37,99,235,0.09)', outline: '1px solid rgba(37,99,235,0.30)' }
                    : undefined
                }
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--pos-elevated)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = ''
                }}
              >
                {/* Quantity / weight badge */}
                <span
                  className="shrink-0 min-w-[38px] h-9 px-1.5 rounded-xl flex items-center justify-center font-bold text-xs font-mono"
                  style={
                    isSelected
                      ? { backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }
                      : { backgroundColor: 'var(--pos-elevated)', color: 'var(--pos-t2)' }
                  }
                >
                  {displayAantal(item.product.id, item.aantal, isKg)}
                </span>

                {/* Name + unit price */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate leading-tight" style={{ color: 'var(--pos-t1)' }}>
                    {item.product.naam}
                  </p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--pos-t3)' }}>
                    {fmt(item.product.prijs)}{isKg ? '/kg' : ''}
                  </p>
                </div>

                {/* Line total — discounted when applicable */}
                <div className="text-right shrink-0">
                  {heeftItemKorting && (
                    <p className="text-[10px] text-gray-400 line-through tabular-nums leading-none mb-0.5 font-mono">
                      {fmt(brutoBedrag)}
                    </p>
                  )}
                  <span
                    className={`font-bold text-sm tabular-nums font-mono ${
                      heeftItemKorting
                        ? 'text-emerald-400'
                        : ''
                    }`}
                    style={!heeftItemKorting ? { color: 'var(--pos-t1)' } : undefined}
                  >
                    {fmt(heeftItemKorting ? nettoBedragItem : brutoBedrag)}
                  </span>
                </div>

                {/* Delete */}
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); verwijder(item.product.id) }}
                  className="hover:text-red-500 transition-colors shrink-0 p-1"
                  style={{ color: 'var(--pos-t4)' }}
                >
                  <Trash2 size={14} />
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* ── Totalen panel ── */}
      <div
        className="px-4 py-3 shrink-0 space-y-1.5"
        style={{ borderTop: '1px solid var(--pos-border)', backgroundColor: 'var(--pos-panel)' }}
      >
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: 'var(--pos-t3)' }}>Subtotaal</span>
          <span className="text-xs tabular-nums font-mono" style={{ color: 'var(--pos-t2)' }}>{fmt(totaalBedrag)}</span>
        </div>

        {heeftKorting && kortingRegels.map((k) => (
          <div key={k.kortingId} className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <Tag size={10} /> {k.naam}
            </span>
            <span className="text-xs font-bold tabular-nums text-emerald-400 font-mono">
              -{fmt(k.bedrag)}
            </span>
          </div>
        ))}

        {btw9 > 0.005 && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: 'var(--pos-t3)' }}>BTW 9%</span>
            <span className="text-xs tabular-nums font-mono" style={{ color: 'var(--pos-t2)' }}>{fmt(btw9)}</span>
          </div>
        )}
        {btw21 > 0.005 && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: 'var(--pos-t3)' }}>BTW 21%</span>
            <span className="text-xs tabular-nums font-mono" style={{ color: 'var(--pos-t2)' }}>{fmt(btw21)}</span>
          </div>
        )}

        <div
          className="pt-2 flex justify-between items-center"
          style={{ borderTop: '1px solid var(--pos-border)' }}
        >
          <span className="text-sm font-bold" style={{ color: 'var(--pos-t1)' }}>Totaal</span>
          <span className="text-xl font-black tabular-nums leading-none font-mono" style={{ color: 'var(--pos-t1)' }}>
            {fmt(nettoBedrag)}
          </span>
        </div>
      </div>

      {/* ── Selected product info panel + dynamic numpad ──
           Both only shown when a product is selected.              */}
      {geselecteerdItem && (
        <>
          {/* Info panel: Aantal label / value, then name / price */}
          <div
            className="mx-3 mt-2 mb-0 rounded-xl px-4 py-2.5 shrink-0"
            style={{ backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.20)' }}
          >
            {/* Row 1: "Aantal" or "Gewicht" label + live value */}
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--pos-amber)' }}
              >
                {isKgProduct ? 'Gewicht' : 'Aantal'}
              </span>
              <span className="font-black text-xl tabular-nums leading-none font-mono" style={{ color: 'var(--pos-t1)' }}>
                {displayAantal(geselecteerdItem.product.id, geselecteerdItem.aantal, isKgProduct)}
              </span>
            </div>

            {/* Row 2: product name + unit price */}
            <div
              className="flex items-baseline justify-between gap-2 mt-2 pt-1.5"
              style={{ borderTop: '1px solid rgba(37,99,235,0.15)' }}
            >
              <p className="font-bold text-sm truncate flex-1 leading-tight" style={{ color: 'var(--pos-t1)' }}>
                {geselecteerdItem.product.naam}
              </p>
              <p className="font-semibold text-sm tabular-nums shrink-0 font-mono" style={{ color: 'var(--pos-amber)' }}>
                {fmt(geselecteerdItem.product.prijs)}{isKgProduct ? '/kg' : ''}
              </p>
            </div>
          </div>

          {/* Numpad — hidden when no selection, mode switches for kg products */}
          <Numpad onKey={handleNumpad} mode={isKgProduct ? 'kg' : 'stuk'} />
        </>
      )}

      {/* ── Checkout button ── */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <button
          disabled={!heeftItems}
          onClick={openModal}
          className="w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all duration-150 active:scale-[0.97]"
          style={
            heeftItems
              ? {
                  backgroundColor: checkoutHover ? 'var(--pos-amber-h)' : 'var(--pos-amber)',
                  color: 'var(--pos-amber-t)',
                  boxShadow: 'var(--pos-shadow-amber)',
                }
              : {
                  backgroundColor: 'var(--pos-card)',
                  color: 'var(--pos-t4)',
                  cursor: 'not-allowed',
                }
          }
          onMouseEnter={() => { if (heeftItems) setCheckoutHover(true) }}
          onMouseLeave={() => setCheckoutHover(false)}
        >
          {heeftItems ? `Afrekenen  ${fmt(nettoBedrag)}` : 'Afrekenen'}
        </button>
      </div>
    </div>
  )
}

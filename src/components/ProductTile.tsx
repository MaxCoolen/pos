import type { Product } from '../types'

interface ProductTileProps {
  product: Product
  categorieKleur?: string
  onToevoegen: () => void
}

function formatPrijs(product: Product) {
  const bedrag = product.prijs.toLocaleString('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  })
  return product.prijsType === 'kg' ? `${bedrag}/kg` : bedrag
}

/** True when the hex background is light enough to pair with dark text. */
function isLichteKleur(hex: string): boolean {
  if (!hex || hex.length < 7) return true
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
}

export function ProductTile({ product, categorieKleur, onToevoegen }: ProductTileProps) {
  const bgColor = categorieKleur ?? product.kleur ?? '#F1F5F9'
  const licht = isLichteKleur(bgColor)

  const tekst = licht ? 'text-gray-900' : 'text-white'
  const subTekst = licht ? 'text-gray-700/90' : 'text-white/85'
  const overlayHover = licht ? 'hover:bg-black/[0.06]' : 'hover:bg-white/[0.10]'
  const overlayActive = licht ? 'active:bg-black/[0.10]' : 'active:bg-white/[0.15]'

  return (
    <button
      onClick={onToevoegen}
      className={`aspect-square flex flex-col justify-between p-3 rounded-2xl border border-black/[0.06] shadow-sm hover:shadow-md active:scale-[0.95] transition-all duration-100 text-left w-full overflow-hidden relative ${overlayHover} ${overlayActive}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Product name */}
      <p className={`font-bold text-[22px] leading-snug tracking-tight line-clamp-3 ${tekst}`}>
        {product.naam}
      </p>

      {/* Price — monospace for precision */}
      <p className={`font-mono font-bold text-sm leading-none tabular-nums ${subTekst}`}>
        {formatPrijs(product)}
      </p>
    </button>
  )
}

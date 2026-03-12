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

export function ProductTile({ product, categorieKleur, onToevoegen }: ProductTileProps) {
  const bgColor = categorieKleur ?? product.kleur ?? '#F1F5F9'

  return (
    <button
      onClick={onToevoegen}
      className="aspect-square flex flex-col justify-between p-3 rounded-xl border border-black/[0.07] shadow-sm hover:shadow-lg hover:brightness-95 active:scale-[0.96] transition-all duration-100 text-left w-full overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Product name */}
      <p className="font-bold text-[15px] leading-snug tracking-tight line-clamp-2 text-white drop-shadow-sm">
        {product.naam}
      </p>

      {/* Price */}
      <p className="text-base font-black leading-none tabular-nums tracking-tight text-white/95 drop-shadow-sm">
        {formatPrijs(product)}
      </p>
    </button>
  )
}

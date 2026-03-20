import { useMemo, useState } from 'react'
import { useProductStore } from '../store/useProductStore'
import { useCartStore } from '../store/useCartStore'
import { useCategorieStore } from '../store/useCategorieStore'
import { ProductTile } from './ProductTile'
import { VariatieModal } from './VariatieModal'
import type { Product } from '../types'

interface ProductGridProps {
  actieveCategorie: string
}

export function ProductGrid({ actieveCategorie }: ProductGridProps) {
  const producten = useProductStore((s) => s.producten)
  const categorieen = useCategorieStore((s) => s.categorieen)
  const voegToe = useCartStore((s) => s.voegToe)
  const [kiesProduct, setKiesProduct] = useState<Product | null>(null)

  // Build a lookup: category name → { volgorde, kleur }
  const categorieMap = useMemo(() => {
    const map: Record<string, { volgorde: number; kleur: string }> = {}
    for (const cat of categorieen ?? []) {
      map[cat.naam] = { volgorde: cat.volgorde ?? 0, kleur: cat.kleur }
    }
    return map
  }, [categorieen])

  // Filter then sort: by category volgorde first, then alphabetically within category
  const gefilterd = useMemo(() => {
    const basis =
      actieveCategorie === 'Alles'
        ? producten
        : producten.filter((p) => p.categorie === actieveCategorie)

    return [...basis].sort((a, b) => {
      const va = categorieMap[a.categorie]?.volgorde ?? 999
      const vb = categorieMap[b.categorie]?.volgorde ?? 999
      if (va !== vb) return va - vb
      return a.naam.localeCompare(b.naam, 'nl')
    })
  }, [producten, actieveCategorie, categorieMap])

  if (gefilterd.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-slate-500 text-sm font-medium">
        Geen producten in deze categorie
      </div>
    )
  }

  return (
    <>
      {/* Doubled column count vs. original → tiles are ~50% smaller */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {gefilterd.map((product) => (
          <ProductTile
            key={product.id}
            product={product}
            categorieKleur={categorieMap[product.categorie]?.kleur}
            onToevoegen={() => {
              const heeftKeuze =
                (product.variaties?.length ?? 0) > 0 ||
                (product.extras?.length ?? 0) > 0
              if (heeftKeuze) {
                setKiesProduct(product)
              } else {
                voegToe(product)
              }
            }}
          />
        ))}
      </div>

      {kiesProduct && (
        <VariatieModal
          product={kiesProduct}
          onToevoegen={voegToe}
          onSluiten={() => setKiesProduct(null)}
        />
      )}
    </>
  )
}

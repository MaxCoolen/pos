import { useState } from 'react'
import { X, Check } from 'lucide-react'
import type { Product, ProductVariatie, ProductExtra } from '../types'

interface Props {
  product: Product
  onToevoegen: (virtueelProduct: Product) => void
  onSluiten: () => void
}

function fmt(prijs: number) {
  return prijs.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
}

function bouwVirtueelProduct(
  product: Product,
  variatie: ProductVariatie | null,
  extras: ProductExtra[],
): Product {
  const meerprijs =
    (variatie?.meerprijs ?? 0) + extras.reduce((s, e) => s + e.meerprijs, 0)

  const naamDelen: string[] = []
  if (variatie) naamDelen.push(variatie.naam)
  if (extras.length > 0) naamDelen.push(extras.map((e) => e.naam).join(', '))
  const naam =
    naamDelen.length > 0 ? `${product.naam} · ${naamDelen.join(' + ')}` : product.naam

  const extraIds = extras.map((e) => e.id).sort().join(',')
  const cartKey = `${product.id}__${variatie?.id ?? ''}__${extraIds}`

  return {
    ...product,
    id: cartKey,
    naam,
    prijs: product.prijs + meerprijs,
    variaties: undefined,
    extras: undefined,
  }
}

export function VariatieModal({ product, onToevoegen, onSluiten }: Props) {
  const heeftVariaties = (product.variaties?.length ?? 0) > 0
  const heeftExtras = (product.extras?.length ?? 0) > 0

  const [gekozenVariatieId, setGekozenVariatieId] = useState<string | null>(
    heeftVariaties ? null : '__geen__',
  )
  const [gekozenExtraIds, setGekozenExtraIds] = useState<Set<string>>(new Set())

  const gekozenVariatie =
    product.variaties?.find((v) => v.id === gekozenVariatieId) ?? null
  const gekozenExtras =
    product.extras?.filter((e) => gekozenExtraIds.has(e.id)) ?? []

  const totaalMeerprijs =
    (gekozenVariatie?.meerprijs ?? 0) +
    gekozenExtras.reduce((s, e) => s + e.meerprijs, 0)
  const effectievePrijs = product.prijs + totaalMeerprijs

  const kanToevoegen = !heeftVariaties || gekozenVariatieId !== null

  function toggleExtra(id: string) {
    setGekozenExtraIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleToevoegen() {
    if (!kanToevoegen) return
    const virtueel = bouwVirtueelProduct(product, gekozenVariatie, gekozenExtras)
    onToevoegen(virtueel)
    onSluiten()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onSluiten() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-base leading-snug">
              {product.naam}
            </h2>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
              {fmt(product.prijs)}
            </p>
          </div>
          <button
            onClick={onSluiten}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Variaties */}
          {heeftVariaties && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Kies een optie
              </p>
              <div className="space-y-1.5">
                {product.variaties!.map((v) => {
                  const isActief = gekozenVariatieId === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setGekozenVariatieId(v.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isActief
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`font-semibold text-sm ${
                          isActief
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-slate-200'
                        }`}
                      >
                        {v.naam}
                      </span>
                      <span
                        className={`text-sm tabular-nums ${
                          isActief
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 dark:text-slate-500'
                        }`}
                      >
                        {v.meerprijs > 0 ? `+${fmt(v.meerprijs)}` : 'Inbegrepen'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Extras */}
          {heeftExtras && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Extra's
              </p>
              <div className="space-y-1.5">
                {product.extras!.map((e) => {
                  const isActief = gekozenExtraIds.has(e.id)
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleExtra(e.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isActief
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isActief
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-slate-500'
                        }`}
                      >
                        {isActief && <Check size={12} className="text-white" strokeWidth={3} />}
                      </span>
                      <span
                        className={`flex-1 font-semibold text-sm ${
                          isActief
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-slate-200'
                        }`}
                      >
                        {e.naam}
                      </span>
                      <span
                        className={`text-sm tabular-nums ${
                          isActief
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 dark:text-slate-500'
                        }`}
                      >
                        {e.meerprijs > 0 ? `+${fmt(e.meerprijs)}` : 'Gratis'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={handleToevoegen}
            disabled={!kanToevoegen}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Toevoegen</span>
            <span className="font-black tabular-nums">{fmt(effectievePrijs)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

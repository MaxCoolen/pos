import { useMemo } from 'react'
import { useCategorieStore } from '../store/useCategorieStore'

interface CategoryBarProps {
  actief: string
  onChange: (categorie: string) => void
}

export function CategoryBar({ actief, onChange }: CategoryBarProps) {
  const categorieen = useCategorieStore((s) => s.categorieen)

  const gesorteerd = useMemo(
    () => [...(categorieen ?? [])].sort((a, b) => (a.volgorde ?? 0) - (b.volgorde ?? 0)),
    [categorieen]
  )

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      {['Alles', ...gesorteerd.map((c) => c.naam)].map((naam) => {
        const cat = gesorteerd.find((c) => c.naam === naam)
        const isActief = actief === naam
        return (
          <button
            key={naam}
            onClick={() => onChange(naam)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap shrink-0 transition-all duration-150 active:scale-95 min-h-[42px] ${
              isActief
                ? 'shadow-md'
                : ''
            }`}
            style={isActief
              ? { backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)', boxShadow: '0 4px 14px var(--pos-shadow-amber)' }
              : { backgroundColor: 'var(--pos-card)', color: 'var(--pos-t2)', border: '1px solid var(--pos-border)' }
            }
          >
            {cat && (
              <span
                className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10"
                style={{ backgroundColor: cat.kleur }}
              />
            )}
            {naam}
          </button>
        )
      })}
    </div>
  )
}

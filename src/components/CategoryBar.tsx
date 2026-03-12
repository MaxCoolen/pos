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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {['Alles', ...gesorteerd.map((c) => c.naam)].map((naam) => (
        <button
          key={naam}
          onClick={() => onChange(naam)}
          className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-100 active:scale-95 shrink-0 min-h-[44px] ${
            actief === naam
              ? 'bg-blue-600 text-white shadow-md shadow-blue-300/60'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
          }`}
        >
          {naam}
        </button>
      ))}
    </div>
  )
}

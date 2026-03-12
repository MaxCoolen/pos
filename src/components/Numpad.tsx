import { Delete, Scale } from 'lucide-react'

export type NumpadMode = 'stuk' | 'kg'

interface NumpadProps {
  onKey: (key: string) => void
  mode?: NumpadMode
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'C', '←'] as const

export function Numpad({ onKey, mode = 'stuk' }: NumpadProps) {
  const isKg = mode === 'kg'

  return (
    <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-slate-700 shrink-0">
      {/* Gram indicator — only visible in kg mode */}
      {isKg && (
        <div className="flex items-center gap-1.5 mb-2 px-0.5">
          <Scale size={12} className="text-amber-500 dark:text-amber-400 shrink-0" />
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Gewicht invoer in gram
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        {KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onKey(key)}
            className={`h-11 rounded-xl font-semibold text-base transition-all duration-100 active:scale-95 flex items-center justify-center ${
              key === 'C'
                ? 'bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                : key === '←'
                ? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                : 'bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
            }`}
          >
            {key === '←' ? <Delete size={16} /> : key}
          </button>
        ))}
      </div>
    </div>
  )
}

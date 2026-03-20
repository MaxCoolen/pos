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
    <div className="px-3 pb-3 pt-2.5 shrink-0" style={{ borderTop: '1px solid var(--pos-border)' }}>
      {/* kg mode indicator */}
      {isKg && (
        <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
          <Scale size={12} style={{ color: 'var(--pos-amber)', flexShrink: 0 }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--pos-amber)' }}>
            Invoer in gram
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            onClick={() => onKey(key)}
            className="h-14 rounded-xl font-bold text-lg transition-all duration-100 active:scale-[0.92] flex items-center justify-center select-none"
            style={
              key === 'C'
                ? { backgroundColor: 'rgba(220,38,38,0.09)', color: '#EF4444', border: '1px solid rgba(220,38,38,0.20)' }
                : key === '←'
                ? { backgroundColor: 'rgba(37,99,235,0.10)', color: 'var(--pos-amber)', border: '1px solid rgba(37,99,235,0.25)' }
                : { backgroundColor: 'var(--pos-card)', color: 'var(--pos-t1)', border: '1px solid var(--pos-border)', fontFamily: 'JetBrains Mono, ui-monospace, monospace' }
            }
          >
            {key === '←' ? <Delete size={18} /> : key}
          </button>
        ))}
      </div>
    </div>
  )
}

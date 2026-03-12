import { useState } from 'react'
import { usePersoneelStore, MEDEWERKER_KLEUREN } from '../store/usePersoneelStore'
import { useCartStore } from '../store/useCartStore'
import { useAppStore } from '../store/useAppStore'
import { LogOut, UserPlus, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export function EmployeeSelectPage() {
  const medewerkers = usePersoneelStore((s) => s.medewerkers)
  const setActiveMedewerker = usePersoneelStore((s) => s.setActiveMedewerker)
  const voegMedewerkerToe = usePersoneelStore((s) => s.voegMedewerkerToe)
  const laadMedewerkerCart = useCartStore((s) => s.laadMedewerkerCart)
  const setCurrentStoreId = useAppStore((s) => s.setCurrentStoreId)
  const uitloggen = useAuthStore((s) => s.uitloggen)

  const [toonFormulier, setToonFormulier] = useState(false)
  const [naam, setNaam] = useState('')
  const [bezig, setBezig] = useState(false)

  async function kiesMedewerker(id: string) {
    setActiveMedewerker(id)
    await laadMedewerkerCart(id)
  }

  function initialen(n: string) {
    return n.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('')
  }

  async function voegToe(e: React.FormEvent) {
    e.preventDefault()
    if (!naam.trim()) return
    setBezig(true)
    await voegMedewerkerToe({
      naam: naam.trim(),
      initialen: initialen(naam),
      kleur: MEDEWERKER_KLEUREN[0],
      rol: 'admin',
    })
    setNaam('')
    setToonFormulier(false)
    setBezig(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white">Wie werkt er vandaag?</h1>
          <p className="text-slate-400 mt-2 text-sm">Kies uw naam om de kassa te starten</p>
        </div>

        {/* Employee grid */}
        {medewerkers.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-6">
            <p className="text-slate-500 text-sm">Nog geen medewerkers aangemaakt.</p>
            {toonFormulier ? (
              <form onSubmit={voegToe} className="w-full max-w-sm bg-slate-900 border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4">
                <p className="text-white font-semibold text-sm">Eerste medewerker toevoegen</p>
                <input
                  autoFocus
                  type="text"
                  placeholder="Naam"
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  className="bg-slate-800 border border-white/[0.1] rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setToonFormulier(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/[0.16] transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={!naam.trim() || bezig}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {bezig && <Loader2 size={14} className="animate-spin" />}
                    Toevoegen
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setToonFormulier(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <UserPlus size={16} />
                Medewerker toevoegen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {medewerkers.map((m) => (
              <button
                key={m.id}
                onClick={() => kiesMedewerker(m.id)}
                className="bg-slate-900 hover:bg-slate-800 border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-6 flex flex-col items-center gap-3 transition-all active:scale-95 group"
              >
                <span
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg"
                  style={{ backgroundColor: m.kleur }}
                >
                  {m.initialen}
                </span>
                <span className="text-white font-semibold text-sm text-center leading-tight">
                  {m.naam.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={() => { setActiveMedewerker(null); setCurrentStoreId(null) }}
            className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
          >
            Andere winkel
          </button>
          <span className="text-slate-700">·</span>
          <button
            onClick={uitloggen}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
          >
            <LogOut size={14} />
            Uitloggen
          </button>
        </div>
      </div>
    </div>
  )
}

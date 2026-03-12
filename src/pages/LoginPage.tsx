import { useState, FormEvent } from 'react'
import { LayoutGrid, Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export function LoginPage() {
  const { inloggen, registreren, laden, fout } = useAuthStore()
  const [modus, setModus] = useState<'login' | 'registreren'>('login')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [bezig, setBezig] = useState(false)
  const [lokaalFout, setLokaalFout] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLokaalFout(null)
    setBezig(true)

    if (modus === 'login') {
      const ok = await inloggen(email, wachtwoord)
      if (!ok) {
        setLokaalFout(fout ?? 'Inloggen mislukt. Controleer uw e-mail en wachtwoord.')
      }
    } else {
      if (wachtwoord.length < 6) {
        setLokaalFout('Wachtwoord moet minimaal 6 tekens bevatten.')
        setBezig(false)
        return
      }
      const ok = await registreren(email, wachtwoord)
      if (!ok) {
        setLokaalFout(fout ?? 'Registreren mislukt. Probeer een ander e-mailadres.')
      }
    }

    setBezig(false)
  }

  const isBezig = bezig || laden

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/50">
            <LayoutGrid size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">POS Kassasysteem</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {modus === 'login' ? 'Inloggen met uw account' : 'Nieuw account aanmaken'}
          </p>
        </div>

        {/* Error */}
        {lokaalFout && (
          <div className="mb-4 bg-red-950/50 border border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{lokaalFout}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-white/[0.06] p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eigenaar@winkel.nl"
              required
              autoFocus
              className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Wachtwoord
            </label>
            <input
              type="password"
              value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)}
              placeholder={modus === 'registreren' ? 'Minimaal 6 tekens' : '••••••••'}
              required
              className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isBezig || !email || !wachtwoord}
            className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isBezig && <Loader2 size={16} className="animate-spin" />}
            {modus === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-slate-500 mt-5">
          {modus === 'login' ? (
            <>
              Nog geen account?{' '}
              <button
                onClick={() => { setModus('registreren'); setLokaalFout(null) }}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Registreren
              </button>
            </>
          ) : (
            <>
              Al een account?{' '}
              <button
                onClick={() => { setModus('login'); setLokaalFout(null) }}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Inloggen
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

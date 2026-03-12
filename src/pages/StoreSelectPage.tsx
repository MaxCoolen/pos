import { useEffect, useState } from 'react'
import { Store, Plus, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'

interface StoreRow {
  id: string
  naam: string
  adres: string | null
  aktief: boolean
}

export function StoreSelectPage() {
  const { setCurrentStoreId } = useAppStore()
  const user = useAuthStore((s) => s.user)
  const uitloggen = useAuthStore((s) => s.uitloggen)
  const [stores, setStores] = useState<StoreRow[]>([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState<string | null>(null)
  const [nieuweNaam, setNieuweNaam] = useState('')
  const [nieuweAdres, setNieuweAdres] = useState('')
  const [aanmaken, setAanmaken] = useState(false)
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    laadStores()
  }, [])

  async function laadStores() {
    if (!supabase) return
    setLaden(true)
    setFout(null)
    const { data, error } = await supabase
      .from('stores')
      .select('id, naam, adres, aktief')
      .eq('aktief', true)
      .order('aangemaakt')
    if (error) {
      setFout('Kon winkels niet laden: ' + error.message)
    } else {
      setStores(data ?? [])
    }
    setLaden(false)
  }

  async function maakStoreAan() {
    if (!supabase || !nieuweNaam.trim()) return
    setBezig(true)
    const { data, error } = await supabase
      .from('stores')
      .insert({ naam: nieuweNaam.trim(), adres: nieuweAdres.trim() || null, aktief: true, owner_id: user?.id ?? null })
      .select('id')
      .single()
    if (error) {
      setFout('Kon winkel niet aanmaken: ' + error.message)
    } else if (data) {
      setCurrentStoreId(data.id as string)
    }
    setBezig(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/50">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Selecteer een winkel</h1>
          <p className="text-slate-400 mt-1 text-sm">Kies een locatie om in te werken</p>
        </div>

        {/* Error */}
        {fout && (
          <div className="mb-4 bg-red-950/50 border border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{fout}</p>
          </div>
        )}

        {/* Loading */}
        {laden ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-slate-400 animate-spin" />
          </div>
        ) : aanmaken ? (
          /* Create new store form */
          <div className="bg-slate-900 rounded-2xl border border-white/[0.06] p-6 space-y-4">
            <h2 className="font-bold text-white text-base">Nieuwe winkel aanmaken</h2>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Naam *
              </label>
              <input
                type="text"
                value={nieuweNaam}
                onChange={(e) => setNieuweNaam(e.target.value)}
                placeholder="Amsterdam Noord"
                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Adres (optioneel)
              </label>
              <input
                type="text"
                value={nieuweAdres}
                onChange={(e) => setNieuweAdres(e.target.value)}
                placeholder="Hoofdstraat 1, Amsterdam"
                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setAanmaken(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={maakStoreAan}
                disabled={!nieuweNaam.trim() || bezig}
                className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bezig ? <Loader2 size={16} className="animate-spin" /> : null}
                Aanmaken
              </button>
            </div>
          </div>
        ) : (
          /* Store list */
          <div className="space-y-3">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => setCurrentStoreId(store.id)}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-white/[0.06] hover:border-blue-500/40 rounded-2xl p-5 text-left transition-all group flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0">
                  <Store size={20} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{store.naam}</p>
                  {store.adres && (
                    <p className="text-sm text-slate-400 truncate mt-0.5">{store.adres}</p>
                  )}
                </div>
                <ArrowRight size={18} className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
              </button>
            ))}

            {stores.length === 0 && (
              <p className="text-center text-slate-500 py-8 text-sm">
                Nog geen winkels aangemaakt
              </p>
            )}

            <button
              onClick={() => setAanmaken(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-blue-500/40 text-slate-500 hover:text-blue-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={18} />
              Nieuwe winkel aanmaken
            </button>
          </div>
        )}

        {/* Logout link */}
        <p className="text-center mt-6">
          <button
            onClick={uitloggen}
            className="text-slate-600 hover:text-slate-400 text-sm transition-colors"
          >
            Uitloggen
          </button>
        </p>
      </div>
    </div>
  )
}

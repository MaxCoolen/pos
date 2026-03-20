import { useRef, useState } from 'react'
import { Upload, X, Plus, Pencil, Trash2, Check, Shield, User, Image, Video, Type } from 'lucide-react'
import { useInstellingenStore } from '../store/useInstellingenStore'
import {
  usePersoneelStore,
  MEDEWERKER_KLEUREN,
  type Medewerker,
  type MedewerkerRol,
} from '../store/usePersoneelStore'
import {
  usePromoStore,
  PROMO_KLEUREN,
  type Promotie,
  type PromotieType,
} from '../store/usePromoStore'

// ─── shared UI primitives ─────────────────────────────────────────────────────

function Toggle({ aan, onChange }: { aan: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!aan)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${aan ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${aan ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Groep({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">{titel}</h2>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-slate-700">
        {children}
      </div>
    </div>
  )
}

function Rij({ label, omschrijving, children }: { label: string; omschrijving?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
        {omschrijving && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{omschrijving}</p>}
      </div>
      {children}
    </div>
  )
}

const inputCls = 'border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-52'
const inputFullCls = 'w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
const textareaCls = `${inputFullCls} resize-none`

// ─── tabs ─────────────────────────────────────────────────────────────────────

type TabId = 'bedrijf' | 'bon' | 'medewerkers' | 'promoties' | 'gedrag' | 'interface'

const TABS: { id: TabId; label: string }[] = [
  { id: 'bedrijf',    label: 'Bedrijf' },
  { id: 'bon',        label: 'Bon indeling' },
  { id: 'medewerkers', label: 'Medewerkers' },
  { id: 'promoties',  label: 'Promoties' },
  { id: 'gedrag',     label: 'POS gedrag' },
  { id: 'interface',  label: 'Interface' },
]

// ─── medewerkers tab ──────────────────────────────────────────────────────────

type MedewerkerForm = { naam: string; initialen: string; kleur: string; rol: MedewerkerRol }
const leegForm = (): MedewerkerForm => ({ naam: '', initialen: '', kleur: MEDEWERKER_KLEUREN[0], rol: 'medewerker' })

function MedewerkersTab() {
  const { medewerkers, voegMedewerkerToe, updateMedewerker, verwijderMedewerker } = usePersoneelStore()
  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [toonForm, setToonForm] = useState(false)
  const [form, setForm] = useState<MedewerkerForm>(leegForm())
  const [opgeslaanFeedback, setOpgeslaanFeedback] = useState(false)

  function openNieuw() { setForm(leegForm()); setBewerkId(null); setToonForm(true) }
  function openBewerk(m: Medewerker) {
    setForm({ naam: m.naam, initialen: m.initialen, kleur: m.kleur, rol: m.rol })
    setBewerkId(m.id); setToonForm(true)
  }
  function sluiten() { setToonForm(false); setBewerkId(null); setForm(leegForm()) }
  function opslaan() {
    if (!form.naam.trim()) return
    if (bewerkId) {
      updateMedewerker(bewerkId, form)
    } else {
      voegMedewerkerToe(form)
    }
    sluiten()
    setOpgeslaanFeedback(true)
    setTimeout(() => setOpgeslaanFeedback(false), 1500)
  }

  // Auto-generate initials from name
  function handleNaamChange(naam: string) {
    const parts = naam.trim().split(' ').filter(Boolean)
    const initialen = parts.length >= 2
      ? (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
      : naam.slice(0, 2).toUpperCase()
    setForm((f) => ({ ...f, naam, initialen: f.initialen || initialen }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">{medewerkers.length} medewerker{medewerkers.length !== 1 ? 's' : ''}</p>
        <button onClick={openNieuw}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
          <Plus size={15} /> Medewerker toevoegen
        </button>
      </div>

      {/* Form */}
      {toonForm && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {bewerkId ? 'Medewerker bewerken' : 'Nieuwe medewerker'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Naam</label>
              <input className={inputFullCls} placeholder="Voor- en achternaam" value={form.naam}
                onChange={(e) => handleNaamChange(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Initialen</label>
              <input className={inputFullCls} placeholder="AB" maxLength={3} value={form.initialen}
                onChange={(e) => setForm((f) => ({ ...f, initialen: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Rol</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600">
                {(['medewerker', 'admin'] as const).map((rol) => (
                  <button key={rol} onClick={() => setForm((f) => ({ ...f, rol }))}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors capitalize ${form.rol === rol ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'}`}>
                    {rol === 'admin' ? 'Admin' : 'Medewerker'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Avatar kleur</label>
            <div className="flex gap-2 flex-wrap">
              {MEDEWERKER_KLEUREN.map((kleur) => (
                <button key={kleur} onClick={() => setForm((f) => ({ ...f, kleur }))}
                  className={`w-8 h-8 rounded-lg transition-all ${form.kleur === kleur ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: kleur }} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 rounded-xl p-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm"
              style={{ backgroundColor: form.kleur }}>
              {form.initialen || '?'}
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{form.naam || 'Naam'}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                {form.rol === 'admin' ? <Shield size={10} /> : <User size={10} />}
                {form.rol === 'admin' ? 'Admin' : 'Medewerker'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={sluiten} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X size={14} /> Annuleren
            </button>
            <button onClick={opslaan} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all">
              <Check size={14} /> Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Employee list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
        {medewerkers.length === 0 ? (
          <p className="py-12 text-center text-gray-400 text-sm">Geen medewerkers. Voeg er een toe.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {medewerkers.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0"
                  style={{ backgroundColor: m.kleur }}>
                  {m.initialen}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{m.naam}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                    {m.rol === 'admin'
                      ? <><Shield size={10} className="text-blue-500" /> Admin</>
                      : <><User size={10} /> Medewerker</>
                    }
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => openBewerk(m)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => verwijderMedewerker(m.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {opgeslaanFeedback && (
        <p className="text-sm text-emerald-600 text-center font-medium">✓ Opgeslagen</p>
      )}
    </div>
  )
}

// ─── promoties tab ────────────────────────────────────────────────────────────

type PromoForm = {
  type: PromotieType
  afbeelding: string
  videoUrl: string
  tekst: string
  achtergrondKleur: string
  tekstKleur: string
}

const leegPromoForm = (): PromoForm => ({
  type: 'tekst',
  afbeelding: '',
  videoUrl: '',
  tekst: '',
  achtergrondKleur: PROMO_KLEUREN[0]!.bg,
  tekstKleur: PROMO_KLEUREN[0]!.tekst,
})

const TYPE_ICONS: Record<PromotieType, React.ElementType> = {
  afbeelding: Image,
  video: Video,
  tekst: Type,
}
const TYPE_LABELS: Record<PromotieType, string> = {
  afbeelding: 'Afbeelding',
  video: 'Video (URL)',
  tekst: 'Tekst',
}

function PromotiesTab() {
  const { promoties, voegToe, update: updatePromo, verwijder, toggleActief } = usePromoStore()
  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [toonForm, setToonForm] = useState(false)
  const [form, setForm] = useState<PromoForm>(leegPromoForm())
  const afbeeldingRef = useRef<HTMLInputElement>(null)

  function openNieuw() { setForm(leegPromoForm()); setBewerkId(null); setToonForm(true) }
  function openBewerk(p: Promotie) {
    setForm({
      type: p.type,
      afbeelding: p.afbeelding ?? '',
      videoUrl: p.videoUrl ?? '',
      tekst: p.tekst ?? '',
      achtergrondKleur: p.achtergrondKleur,
      tekstKleur: p.tekstKleur,
    })
    setBewerkId(p.id)
    setToonForm(true)
  }
  function sluiten() { setToonForm(false); setBewerkId(null) }

  function opslaan() {
    const base: Omit<Promotie, 'id'> = {
      type: form.type,
      achtergrondKleur: form.achtergrondKleur,
      tekstKleur: form.tekstKleur,
      actief: true,
    }
    if (form.type === 'afbeelding') base.afbeelding = form.afbeelding
    if (form.type === 'video') base.videoUrl = form.videoUrl
    if (form.type === 'tekst') base.tekst = form.tekst

    if (bewerkId) {
      updatePromo(bewerkId, base)
    } else {
      voegToe(base)
    }
    sluiten()
  }

  function handleAfbeelding(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm((f) => ({ ...f, afbeelding: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const inputCls = 'w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">{promoties.length} promotie{promoties.length !== 1 ? 's' : ''}</p>
        <button onClick={openNieuw}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
          <Plus size={15} /> Promotie toevoegen
        </button>
      </div>

      {/* Form */}
      {toonForm && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {bewerkId ? 'Promotie bewerken' : 'Nieuwe promotie'}
          </h3>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['afbeelding', 'video', 'tekst'] as PromotieType[]).map((t) => {
                const Icon = TYPE_ICONS[t]
                return (
                  <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${form.type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
                    <Icon size={14} /> {TYPE_LABELS[t]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Type-specific inputs */}
          {form.type === 'afbeelding' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Afbeelding</label>
              {form.afbeelding && (
                <img src={form.afbeelding} alt="" className="w-full h-32 object-cover rounded-xl mb-2 border border-gray-200 dark:border-slate-600" />
              )}
              <button onClick={() => afbeeldingRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                <Upload size={14} /> Afbeelding kiezen
              </button>
              <input ref={afbeeldingRef} type="file" accept="image/*" className="hidden" onChange={handleAfbeelding} />
            </div>
          )}

          {form.type === 'video' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Video URL</label>
              <input type="url" className={inputCls} placeholder="https://www.youtube.com/embed/..."
                value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Gebruik een embed URL (bijv. YouTube /embed/...)</p>
            </div>
          )}

          {form.type === 'tekst' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Tekst</label>
                <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Vandaag: 6 Wings voor €4"
                  value={form.tekst} onChange={(e) => setForm((f) => ({ ...f, tekst: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Achtergrond</label>
                <div className="flex flex-wrap gap-2">
                  {PROMO_KLEUREN.map((k) => (
                    <button key={k.bg} onClick={() => setForm((f) => ({ ...f, achtergrondKleur: k.bg, tekstKleur: k.tekst }))}
                      title={k.label}
                      className={`w-8 h-8 rounded-lg transition-all ${form.achtergrondKleur === k.bg ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: k.bg }} />
                  ))}
                </div>
                {/* Live preview */}
                <div className="mt-3 rounded-xl p-4 text-center font-bold text-lg"
                  style={{ backgroundColor: form.achtergrondKleur, color: form.tekstKleur }}>
                  {form.tekst || 'Voorbeeldtekst'}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={sluiten} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X size={14} /> Annuleren
            </button>
            <button onClick={opslaan} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all">
              <Check size={14} /> Opslaan
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
        {promoties.length === 0 ? (
          <p className="py-12 text-center text-gray-400 text-sm">Geen promoties. Voeg er een toe.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {promoties.map((p) => {
              const Icon = TYPE_ICONS[p.type]
              return (
                <div key={p.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${!p.actief ? 'opacity-50' : ''}`}>
                  {/* Type icon */}
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    {p.type === 'afbeelding' && p.afbeelding ? (
                      <img src={p.afbeelding} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : p.type === 'tekst' ? (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: p.achtergrondKleur, color: p.tekstKleur }}>
                        Aa
                      </div>
                    ) : (
                      <Icon size={18} className="text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {TYPE_LABELS[p.type]}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">
                      {p.type === 'tekst' ? (p.tekst || '—') : p.type === 'video' ? (p.videoUrl || '—') : 'Afbeelding'}
                    </p>
                  </div>

                  {/* Toggle */}
                  <button onClick={() => toggleActief(p.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${p.actief ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${p.actief ? 'translate-x-5' : ''}`} />
                  </button>

                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => openBewerk(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => verwijder(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export function InstellingenPage() {
  const {
    bedrijfsnaam, btwStandaard,
    adres, postcode, plaats, telefoon, email, btwNummer, kvkNummer,
    logo, bonHeader, bonFooter, bonQrUrl,
    categorieReset, geluid, darkMode,
    update,
  } = useInstellingenStore()

  const [actieveTab, setActieveTab] = useState<TabId>('bedrijf')
  const logoInputRef = useRef<HTMLInputElement>(null)

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => update({ logo: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  // URL validation
  function isValidUrl(url: string) {
    if (!url.trim()) return true // empty is OK
    try { new URL(url); return true } catch { return false }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Instellingen</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Configureer uw kassasysteem</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActieveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                actieveTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">

          {/* ── Tab: Bedrijf ── */}
          {actieveTab === 'bedrijf' && (
            <>
              <Groep titel="Logo">
                <div className="px-5 py-5 flex items-start gap-5">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-600 flex items-center justify-center bg-gray-50 dark:bg-slate-900 shrink-0 overflow-hidden">
                    {logo
                      ? <img src={logo} alt="logo" className="max-h-full max-w-full object-contain p-1" />
                      : <span className="text-xs text-gray-400 dark:text-slate-500 text-center">Geen logo</span>
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Bedrijfslogo</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">PNG, JPG of SVG. Transparante achtergrond aanbevolen.</p>
                    <div className="flex gap-2">
                      <button onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all">
                        <Upload size={14} /> Uploaden
                      </button>
                      {logo && (
                        <button onClick={() => update({ logo: null })}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          <X size={14} /> Verwijderen
                        </button>
                      )}
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                </div>
              </Groep>

              <Groep titel="Bedrijfsinformatie">
                <Rij label="Bedrijfsnaam"><input type="text" value={bedrijfsnaam} className={inputCls} onChange={(e) => update({ bedrijfsnaam: e.target.value })} placeholder="Mijn POS" /></Rij>
                <Rij label="Adres"><input type="text" value={adres} className={inputCls} onChange={(e) => update({ adres: e.target.value })} placeholder="Straatnaam 1" /></Rij>
                <Rij label="Postcode"><input type="text" value={postcode} className={inputCls} onChange={(e) => update({ postcode: e.target.value })} placeholder="1234 AB" /></Rij>
                <Rij label="Plaats"><input type="text" value={plaats} className={inputCls} onChange={(e) => update({ plaats: e.target.value })} placeholder="Amsterdam" /></Rij>
                <Rij label="Telefoonnummer"><input type="tel" value={telefoon} className={inputCls} onChange={(e) => update({ telefoon: e.target.value })} placeholder="+31 20 000 0000" /></Rij>
                <Rij label="E-mailadres"><input type="email" value={email} className={inputCls} onChange={(e) => update({ email: e.target.value })} placeholder="info@bedrijf.nl" /></Rij>
                <Rij label="BTW-nummer"><input type="text" value={btwNummer} className={inputCls} onChange={(e) => update({ btwNummer: e.target.value })} placeholder="NL000000000B01" /></Rij>
                <Rij label="KVK-nummer"><input type="text" value={kvkNummer} className={inputCls} onChange={(e) => update({ kvkNummer: e.target.value })} placeholder="12345678" /></Rij>
              </Groep>

            </>
          )}

          {/* ── Tab: Bon indeling ── */}
          {actieveTab === 'bon' && (
            <Groep titel="Bon indeling">
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Koptekst</label>
                  <textarea rows={3} value={bonHeader} onChange={(e) => update({ bonHeader: e.target.value })} className={textareaCls} placeholder="Welkomsttekst bovenaan de bon" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Voettekst</label>
                  <textarea rows={3} value={bonFooter} onChange={(e) => update({ bonFooter: e.target.value })} className={textareaCls} placeholder="Bedankt voor uw bezoek!" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">QR-code URL</label>
                  <input
                    type="url"
                    value={bonQrUrl}
                    onChange={(e) => update({ bonQrUrl: e.target.value })}
                    className={`${inputFullCls} ${bonQrUrl && !isValidUrl(bonQrUrl) ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="https://uwwebsite.nl"
                  />
                  {bonQrUrl && !isValidUrl(bonQrUrl) && (
                    <p className="text-xs text-red-500 mt-1">Voer een geldige URL in (bijv. https://uw-site.nl)</p>
                  )}
                  {bonQrUrl && isValidUrl(bonQrUrl) && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">QR-code verschijnt onderaan elke bon</p>
                  )}
                </div>
              </div>
            </Groep>
          )}

          {/* ── Tab: Medewerkers ── */}
          {actieveTab === 'medewerkers' && <MedewerkersTab />}
          {actieveTab === 'promoties' && <PromotiesTab />}

          {/* ── Tab: POS Gedrag ── */}
          {actieveTab === 'gedrag' && (
            <>
              <Groep titel="Standaard BTW">
                <Rij label="BTW percentage" omschrijving="Voor nieuwe producten">
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 shrink-0">
                    {([9, 21] as const).map((pct) => (
                      <button key={pct} onClick={() => update({ btwStandaard: pct })}
                        className={`px-4 py-2 text-sm font-bold transition-colors ${btwStandaard === pct ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'}`}>
                        {pct}%
                      </button>
                    ))}
                  </div>
                </Rij>
              </Groep>
              <Groep titel="POS Gedrag">
                <Rij label="Categorie filter resetten" omschrijving="Na afrekenen terug naar 'Alles'">
                  <Toggle aan={categorieReset} onChange={(v) => update({ categorieReset: v })} />
                </Rij>
                <Rij label="Geluid bij product toevoegen" omschrijving="Klik-geluid bij toevoegen">
                  <Toggle aan={geluid} onChange={(v) => update({ geluid: v })} />
                </Rij>
              </Groep>
            </>
          )}

          {/* ── Tab: Interface ── */}
          {actieveTab === 'interface' && (
            <>
              <Groep titel="Weergave">
                <Rij label="Donkere modus" omschrijving="Schakel tussen licht en donker thema">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-slate-400">{darkMode ? 'Donker' : 'Licht'}</span>
                    <Toggle aan={darkMode} onChange={(v) => update({ darkMode: v })} />
                  </div>
                </Rij>
              </Groep>
              <Groep titel="Over">
                <Rij label="Versie"><span className="text-sm text-gray-400 dark:text-slate-500 font-mono">v0.1.0</span></Rij>
              </Groep>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

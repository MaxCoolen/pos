import { useState, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, X, Check,
  ChevronUp, ChevronDown, Percent, Gift, Layers,
} from 'lucide-react'
import { useProductStore } from '../store/useProductStore'
import { useCategorieStore } from '../store/useCategorieStore'
import { useKortingStore } from '../store/useKortingStore'
import type { Product, Categorie, Korting, KortingType, BtwPercentage } from '../types'

// ─── shared helpers ───────────────────────────────────────────────────────────

const inputCls =
  'w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400'
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1'

function Toggle({ aan, onChange }: { aan: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!aan)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        aan ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          aan ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

type TabId = 'producten' | 'categorieen' | 'kortingen'

const TABS: { id: TabId; label: string }[] = [
  { id: 'producten',  label: 'Producten' },
  { id: 'categorieen', label: 'Categorieën' },
  { id: 'kortingen',  label: 'Kortingen' },
]

// ─── PRODUCTEN TAB ────────────────────────────────────────────────────────────

type ProductForm = {
  naam: string
  prijs: string
  categorie: string
  prijsType: 'stuk' | 'kg'
  btw: BtwPercentage
}

const leegProductForm: ProductForm = {
  naam: '', prijs: '', categorie: '', prijsType: 'stuk', btw: 9,
}

function formatPrijs(product: Product) {
  const bedrag = product.prijs.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
  return product.prijsType === 'kg' ? `${bedrag} / kg` : bedrag
}

function ProductenTab() {
  const { producten, voegProductToe, updateProduct, verwijderProduct } = useProductStore()
  const rawCategorieen = useCategorieStore((s) => s.categorieen)
  const categorieen = useMemo(
    () => [...(rawCategorieen ?? [])].sort((a, b) => (a.volgorde ?? 0) - (b.volgorde ?? 0)),
    [rawCategorieen]
  )

  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [toonForm, setToonForm] = useState(false)
  const [form, setForm] = useState<ProductForm>(leegProductForm)

  function openNieuw() {
    setForm({ ...leegProductForm, categorie: categorieen[0]?.naam ?? '' })
    setBewerkId(null)
    setToonForm(true)
  }
  function openBewerk(p: Product) {
    setForm({
      naam: p.naam,
      prijs: p.prijs.toString().replace('.', ','),
      categorie: p.categorie,
      prijsType: p.prijsType,
      btw: p.btw,
    })
    setBewerkId(p.id)
    setToonForm(true)
  }
  function sluiten() {
    setToonForm(false); setBewerkId(null); setForm(leegProductForm)
  }
  function opslaan() {
    const prijs = parseFloat(form.prijs.replace(',', '.'))
    if (!form.naam.trim() || isNaN(prijs)) return
    const data = {
      naam: form.naam.trim(), prijs, categorie: form.categorie,
      prijsType: form.prijsType, btw: form.btw,
    }
    bewerkId ? updateProduct(bewerkId, data) : voegProductToe(data)
    sluiten()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{producten.length} producten</p>
        <button onClick={openNieuw} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
          <Plus size={15} /> Nieuw product
        </button>
      </div>

      {/* Form */}
      {toonForm && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-4 text-sm">
            {bewerkId ? 'Product bewerken' : 'Nieuw product'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Naam</label>
              <input className={inputCls} placeholder="Productnaam"
                value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Prijs (€)</label>
              <input className={inputCls} placeholder="0,00"
                value={form.prijs} onChange={(e) => setForm({ ...form, prijs: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Prijs type</label>
              <select className={inputCls} value={form.prijsType}
                onChange={(e) => setForm({ ...form, prijsType: e.target.value as 'stuk' | 'kg' })}>
                <option value="stuk">Per stuk</option>
                <option value="kg">Per kilogram</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Categorie</label>
              <select className={inputCls} value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                {categorieen.map((c) => (
                  <option key={c.id} value={c.naam}>{c.naam}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>BTW</label>
              <select className={inputCls} value={form.btw}
                onChange={(e) => setForm({ ...form, btw: Number(e.target.value) as BtwPercentage })}>
                <option value={0}>0%</option>
                <option value={9}>9%</option>
                <option value={21}>21%</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={sluiten} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X size={14} /> Annuleren
            </button>
            <button onClick={opslaan} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all">
              <Check size={14} /> Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {producten.length === 0 ? (
          <p className="py-16 text-center text-gray-400 dark:text-slate-500 text-sm">Geen producten. Voeg een product toe.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Naam</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Categorie</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">BTW</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Prijs</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {producten.map((p, idx) => (
                <tr key={p.id} className={`${idx < producten.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''} hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors`}>
                  <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-slate-200 text-sm">{p.naam}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-medium">
                      {p.categorie}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      p.btw === 0 ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400' :
                      p.btw === 9 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                      'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    }`}>
                      {p.btw}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-800 dark:text-slate-200 text-sm">{formatPrijs(p)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => openBewerk(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => verwijderProduct(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── CATEGORIEËN TAB ──────────────────────────────────────────────────────────

type CategorieForm = { naam: string; kleur: string }
const leegCatForm: CategorieForm = { naam: '', kleur: '#E5E7EB' }

function CategorieenTab() {
  const { categorieen, voegCategorieToe, updateCategorie, verwijderCategorie, verplaatsOmhoog, verplaatsOmlaag } =
    useCategorieStore()

  const sorted = useMemo(
    () => [...(categorieen ?? [])].sort((a, b) => (a.volgorde ?? 0) - (b.volgorde ?? 0)),
    [categorieen]
  )

  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [toonForm, setToonForm] = useState(false)
  const [form, setForm] = useState<CategorieForm>(leegCatForm)

  function openNieuw() { setForm(leegCatForm); setBewerkId(null); setToonForm(true) }
  function openBewerk(c: Categorie) { setForm({ naam: c.naam, kleur: c.kleur }); setBewerkId(c.id); setToonForm(true) }
  function sluiten() { setToonForm(false); setBewerkId(null); setForm(leegCatForm) }
  function opslaan() {
    if (!form.naam.trim()) return
    bewerkId
      ? updateCategorie(bewerkId, { naam: form.naam.trim(), kleur: form.kleur })
      : voegCategorieToe({ naam: form.naam.trim(), kleur: form.kleur })
    sluiten()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{categorieen.length} categorieën</p>
        <button onClick={openNieuw} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
          <Plus size={15} /> Nieuwe categorie
        </button>
      </div>

      {toonForm && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-4 text-sm">
            {bewerkId ? 'Categorie bewerken' : 'Nieuwe categorie'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Naam</label>
              <input className={inputCls} placeholder="Categorienaam"
                value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Kleur (tegels)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.kleur}
                  onChange={(e) => setForm({ ...form, kleur: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-700"
                />
                <input className={`${inputCls} flex-1`} value={form.kleur}
                  onChange={(e) => setForm({ ...form, kleur: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={sluiten} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <X size={14} /> Annuleren
            </button>
            <button onClick={opslaan} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all">
              <Check size={14} /> Opslaan
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {sorted.length === 0 ? (
          <p className="py-16 text-center text-gray-400 dark:text-slate-500 text-sm">Geen categorieën.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {sorted.map((cat, idx) => (
              <div key={cat.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                <div
                  className="w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-600 shrink-0"
                  style={{ backgroundColor: cat.kleur }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-slate-200 text-sm">{cat.naam}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Volgorde {cat.volgorde}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => verplaatsOmhoog(cat.id)}
                    disabled={idx === 0}
                    className="w-7 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => verplaatsOmlaag(cat.id)}
                    disabled={idx === sorted.length - 1}
                    className="w-7 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200 disabled:opacity-25 transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openBewerk(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => verwijderCategorie(cat.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── KORTINGEN TAB ────────────────────────────────────────────────────────────

const KORTING_META: Record<KortingType, { label: string; kleur: string; icon: React.ElementType }> = {
  stapel:     { label: 'Stapelkorting',    kleur: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', icon: Layers },
  gratis:     { label: 'X + Y Gratis',     kleur: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',  icon: Gift },
  percentage: { label: 'Percentagekorting', kleur: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',   icon: Percent },
}

type KortingForm = {
  naam: string
  type: KortingType
  aantalVoor: string
  prijsVoor: string
  koopAantal: string
  gratisAantal: string
  percentage: string
  productIds: string[]
  vanDatum: string
  totDatum: string
  actief: boolean
}

const leegKortingForm: KortingForm = {
  naam: '', type: 'percentage',
  aantalVoor: '', prijsVoor: '', koopAantal: '', gratisAantal: '', percentage: '',
  productIds: [], vanDatum: '', totDatum: '', actief: true,
}

function kortingFormNaarObject(form: KortingForm): Omit<Korting, 'id'> {
  return {
    naam: form.naam.trim(),
    type: form.type,
    aantalVoor:   form.type === 'stapel'     ? parseInt(form.aantalVoor)   || undefined : undefined,
    prijsVoor:    form.type === 'stapel'     ? parseFloat(form.prijsVoor.replace(',', '.')) || undefined : undefined,
    koopAantal:   form.type === 'gratis'     ? parseInt(form.koopAantal)   || undefined : undefined,
    gratisAantal: form.type === 'gratis'     ? parseInt(form.gratisAantal) || undefined : undefined,
    percentage:   form.type === 'percentage' ? parseFloat(form.percentage) || undefined : undefined,
    productIds: form.productIds,
    vanDatum: form.vanDatum || null,
    totDatum: form.totDatum || null,
    actief: form.actief,
  }
}

function KortingenTab() {
  const { kortingen, voegKortingToe, updateKorting, verwijderKorting, toggleActief } = useKortingStore()
  const producten = useProductStore((s) => s.producten)

  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [toonForm, setToonForm] = useState(false)
  const [form, setForm] = useState<KortingForm>(leegKortingForm)

  function openNieuw() { setForm(leegKortingForm); setBewerkId(null); setToonForm(true) }
  function openBewerk(k: Korting) {
    setForm({
      naam: k.naam, type: k.type,
      aantalVoor:   k.aantalVoor   != null ? String(k.aantalVoor) : '',
      prijsVoor:    k.prijsVoor    != null ? String(k.prijsVoor).replace('.', ',') : '',
      koopAantal:   k.koopAantal   != null ? String(k.koopAantal) : '',
      gratisAantal: k.gratisAantal != null ? String(k.gratisAantal) : '',
      percentage:   k.percentage   != null ? String(k.percentage) : '',
      productIds: k.productIds,
      vanDatum: k.vanDatum ?? '', totDatum: k.totDatum ?? '',
      actief: k.actief,
    })
    setBewerkId(k.id); setToonForm(true)
  }
  function sluiten() { setToonForm(false); setBewerkId(null); setForm(leegKortingForm) }
  function opslaan() {
    if (!form.naam.trim()) return
    const obj = kortingFormNaarObject(form)
    bewerkId ? updateKorting(bewerkId, obj) : voegKortingToe(obj)
    sluiten()
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((p) => p !== id)
        : [...f.productIds, id],
    }))
  }

  function formatPeriode(k: Korting) {
    if (!k.vanDatum && !k.totDatum) return 'Altijd actief'
    const van = k.vanDatum ? new Date(k.vanDatum).toLocaleDateString('nl-NL') : '...'
    const tot = k.totDatum ? new Date(k.totDatum).toLocaleDateString('nl-NL') : '...'
    return `${van} – ${tot}`
  }

  function kortingOmschrijving(k: Korting) {
    if (k.type === 'stapel') return `${k.aantalVoor ?? '?'} voor €${k.prijsVoor?.toFixed(2).replace('.', ',') ?? '?'}`
    if (k.type === 'gratis') return `Koop ${k.koopAantal ?? '?'}, krijg ${k.gratisAantal ?? '?'} gratis`
    if (k.type === 'percentage') return `${k.percentage ?? '?'}% korting`
    return ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">{kortingen.length} kortingen</p>
        <button onClick={openNieuw} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
          <Plus size={15} /> Nieuwe korting
        </button>
      </div>

      {/* Form */}
      {toonForm && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-4 text-sm">
            {bewerkId ? 'Korting bewerken' : 'Nieuwe korting'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Naam</label>
              <input className={inputCls} placeholder="Kortingsnaam"
                value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} />
            </div>

            <div>
              <label className={labelCls}>Type korting</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(KORTING_META) as KortingType[]).map((t) => {
                  const meta = KORTING_META[t]
                  const Icon = meta.icon
                  return (
                    <button key={t} type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.type === t
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}>
                      <Icon size={14} /> {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {form.type === 'stapel' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Aantal (voor)</label>
                  <input className={inputCls} placeholder="4" type="number" min={1}
                    value={form.aantalVoor} onChange={(e) => setForm({ ...form, aantalVoor: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Prijs (€)</label>
                  <input className={inputCls} placeholder="10,00"
                    value={form.prijsVoor} onChange={(e) => setForm({ ...form, prijsVoor: e.target.value })} />
                </div>
              </div>
            )}
            {form.type === 'gratis' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Koop aantal</label>
                  <input className={inputCls} placeholder="3" type="number" min={1}
                    value={form.koopAantal} onChange={(e) => setForm({ ...form, koopAantal: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Gratis aantal</label>
                  <input className={inputCls} placeholder="1" type="number" min={1}
                    value={form.gratisAantal} onChange={(e) => setForm({ ...form, gratisAantal: e.target.value })} />
                </div>
              </div>
            )}
            {form.type === 'percentage' && (
              <div>
                <label className={labelCls}>Percentage (%)</label>
                <input className={inputCls} placeholder="10" type="number" min={1} max={100}
                  value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} />
              </div>
            )}

            <div>
              <label className={labelCls}>
                Van toepassing op producten{' '}
                <span className="text-gray-400 dark:text-slate-500 font-normal">(leeg = alle producten)</span>
              </label>
              <div className="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden max-h-44 overflow-y-auto bg-white dark:bg-slate-700">
                {producten.map((p, idx) => (
                  <label key={p.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 ${idx < producten.length - 1 ? 'border-b border-gray-100 dark:border-slate-600' : ''}`}>
                    <input type="checkbox"
                      checked={form.productIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-200">{p.naam}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-400 ml-auto">{p.categorie}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Geldig van</label>
                <input type="date" className={inputCls}
                  value={form.vanDatum} onChange={(e) => setForm({ ...form, vanDatum: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Geldig tot</label>
                <input type="date" className={inputCls}
                  value={form.totDatum} onChange={(e) => setForm({ ...form, totDatum: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Korting actief</span>
              <Toggle aan={form.actief} onChange={(v) => setForm({ ...form, actief: v })} />
            </div>
          </div>

          <div className="flex gap-2 mt-5 justify-end">
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {kortingen.length === 0 ? (
          <p className="py-16 text-center text-gray-400 dark:text-slate-500 text-sm">Geen kortingen. Maak een korting aan.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {kortingen.map((k) => {
              const meta = KORTING_META[k.type]
              const Icon = meta.icon
              return (
                <div key={k.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${k.actief ? 'hover:bg-green-50/50 dark:hover:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700/40 opacity-60'}`}>
                  <div className={`w-1 h-10 rounded-full shrink-0 ${k.actief ? 'bg-green-400' : 'bg-gray-200 dark:bg-slate-600'}`} />

                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${meta.kleur}`}>
                    <Icon size={11} /> {meta.label}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{k.naam}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {kortingOmschrijving(k)} · {formatPeriode(k)}
                    </p>
                    {k.productIds.length > 0 && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {k.productIds.length} product{k.productIds.length !== 1 ? 'en' : ''}
                      </p>
                    )}
                  </div>

                  <Toggle aan={k.actief} onChange={() => toggleActief(k.id)} />

                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => openBewerk(k)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => verwijderKorting(k.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {kortingen.some((k) => k.actief) && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Groene balk = korting is actief
        </p>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export function ProductbeheerPage() {
  const [actieveTab, setActieveTab] = useState<TabId>('producten')

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Productbeheer</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Beheer producten, categorieën en kortingen</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl mb-5 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActieveTab(tab.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                actieveTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {actieveTab === 'producten'   && <ProductenTab />}
        {actieveTab === 'categorieen' && <CategorieenTab />}
        {actieveTab === 'kortingen'   && <KortingenTab />}
      </div>
    </div>
  )
}

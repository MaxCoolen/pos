import { useState, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, X, Check,
  ChevronUp, ChevronDown, Percent, Gift, Layers,
} from 'lucide-react'
import { useProductStore } from '../store/useProductStore'
import { useCategorieStore } from '../store/useCategorieStore'
import { useKortingStore } from '../store/useKortingStore'
import type { Product, Categorie, Korting, KortingType, BtwPercentage, ProductVariatie, ProductExtra } from '../types'

// ─── shared helpers ───────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pos-amber)] bg-[var(--pos-elevated)] border border-[var(--pos-border)] text-[var(--pos-t1)] placeholder-[var(--pos-t4)]'
// Same as inputCls but without w-full, for use inside grid/flex rows
const rowInputCls =
  'min-w-0 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pos-amber)] bg-[var(--pos-elevated)] border border-[var(--pos-border)] text-[var(--pos-t1)] placeholder-[var(--pos-t4)]'
const labelCls = 'block text-xs font-medium text-[var(--pos-tlabel)] mb-1 uppercase tracking-wide'

function Toggle({ aan, onChange }: { aan: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!aan)}
      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: aan ? '#22c55e' : 'var(--pos-t4)' }}
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
  variaties: ProductVariatie[]
  extras: ProductExtra[]
}

const leegProductForm: ProductForm = {
  naam: '', prijs: '', categorie: '', prijsType: 'stuk', btw: 9,
  variaties: [], extras: [],
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
      variaties: p.variaties ?? [],
      extras: p.extras ?? [],
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
      variaties: form.variaties, extras: form.extras,
    }
    bewerkId ? updateProduct(bewerkId, data) : voegProductToe(data)
    sluiten()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'var(--pos-t2)' }}>{producten.length} producten</p>
        <button
          onClick={openNieuw}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-all shadow-sm"
          style={{ backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber)' }}
        >
          <Plus size={15} /> Nieuw product
        </button>
      </div>

      {/* Form */}
      {toonForm && (
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
        >
          <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--pos-t1)' }}>
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
              <select
                className={inputCls}
                value={form.prijsType}
                onChange={(e) => setForm({ ...form, prijsType: e.target.value as 'stuk' | 'kg' })}
                style={{ backgroundColor: 'var(--pos-elevated)', color: 'var(--pos-t1)' }}
              >
                <option value="stuk">Per stuk</option>
                <option value="kg">Per kilogram</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Categorie</label>
              <select
                className={inputCls}
                value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                style={{ backgroundColor: 'var(--pos-elevated)', color: 'var(--pos-t1)' }}
              >
                {categorieen.map((c) => (
                  <option key={c.id} value={c.naam}>{c.naam}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>BTW</label>
              <select
                className={inputCls}
                value={form.btw}
                onChange={(e) => setForm({ ...form, btw: Number(e.target.value) as BtwPercentage })}
                style={{ backgroundColor: 'var(--pos-elevated)', color: 'var(--pos-t1)' }}
              >
                <option value={0}>0%</option>
                <option value={9}>9%</option>
                <option value={21}>21%</option>
              </select>
            </div>
          </div>

          {/* Variaties */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--pos-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pos-t2)' }}>Variaties</p>
              <button
                type="button"
                onClick={() => setForm((f) => ({
                  ...f,
                  variaties: [...f.variaties, { id: Date.now().toString(), naam: '', meerprijs: 0 }],
                }))}
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: 'var(--pos-amber)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--pos-amber-h)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--pos-amber)' }}
              >
                <Plus size={12} /> Toevoegen
              </button>
            </div>
            {form.variaties.length === 0 ? (
              <p className="text-xs italic" style={{ color: 'var(--pos-t3)' }}>Geen variaties (bijv. Medium, Large)</p>
            ) : (
              <div className="space-y-1.5">
                {form.variaties.map((v) => (
                  <div key={v.id} className="grid grid-cols-[1fr_88px_32px] gap-2 items-center">
                    <input
                      className={rowInputCls}
                      placeholder="Naam (bijv. Large)"
                      value={v.naam}
                      onChange={(e) => setForm((f) => ({
                        ...f,
                        variaties: f.variaties.map((x) => x.id === v.id ? { ...x, naam: e.target.value } : x),
                      }))}
                    />
                    <input
                      className={rowInputCls}
                      placeholder="€ 0,00"
                      type="number"
                      min={0}
                      step={0.01}
                      value={v.meerprijs === 0 ? '' : v.meerprijs}
                      onChange={(e) => setForm((f) => ({
                        ...f,
                        variaties: f.variaties.map((x) => x.id === v.id ? { ...x, meerprijs: parseFloat(e.target.value) || 0 } : x),
                      }))}
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, variaties: f.variaties.filter((x) => x.id !== v.id) }))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--pos-t3)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra's */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--pos-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pos-t2)' }}>Extra's</p>
              <button
                type="button"
                onClick={() => setForm((f) => ({
                  ...f,
                  extras: [...f.extras, { id: Date.now().toString(), naam: '', meerprijs: 0 }],
                }))}
                className="flex items-center gap-1 text-xs font-medium transition-colors"
                style={{ color: 'var(--pos-amber)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--pos-amber-h)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--pos-amber)' }}
              >
                <Plus size={12} /> Toevoegen
              </button>
            </div>
            {form.extras.length === 0 ? (
              <p className="text-xs italic" style={{ color: 'var(--pos-t3)' }}>Geen extra's (bijv. Knoflooksaus)</p>
            ) : (
              <div className="space-y-1.5">
                {form.extras.map((e) => (
                  <div key={e.id} className="grid grid-cols-[1fr_88px_32px] gap-2 items-center">
                    <input
                      className={rowInputCls}
                      placeholder="Naam (bijv. Knoflooksaus)"
                      value={e.naam}
                      onChange={(ev) => setForm((f) => ({
                        ...f,
                        extras: f.extras.map((x) => x.id === e.id ? { ...x, naam: ev.target.value } : x),
                      }))}
                    />
                    <input
                      className={rowInputCls}
                      placeholder="€ 0,00"
                      type="number"
                      min={0}
                      step={0.01}
                      value={e.meerprijs === 0 ? '' : e.meerprijs}
                      onChange={(ev) => setForm((f) => ({
                        ...f,
                        extras: f.extras.map((x) => x.id === e.id ? { ...x, meerprijs: parseFloat(ev.target.value) || 0 } : x),
                      }))}
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, extras: f.extras.filter((x) => x.id !== e.id) }))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--pos-t3)' }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; ev.currentTarget.style.color = '#ef4444' }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = 'transparent'; ev.currentTarget.style.color = 'var(--pos-t3)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={sluiten}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-colors"
              style={{ color: 'var(--pos-t2)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <X size={14} /> Annuleren
            </button>
            <button
              onClick={opslaan}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber)' }}
            >
              <Check size={14} /> Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
      >
        {producten.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--pos-t3)' }}>Geen producten. Voeg een product toe.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--pos-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--pos-t2)' }}>Naam</th>
                <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--pos-t2)' }}>Categorie</th>
                <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--pos-t2)' }}>BTW</th>
                <th className="text-right px-5 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--pos-t2)' }}>Prijs</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {producten.map((p, idx) => (
                <tr
                  key={p.id}
                  className="transition-colors"
                  style={{ borderBottom: idx < producten.length - 1 ? '1px solid var(--pos-hover)' : 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <td className="px-5 py-3.5 font-medium text-sm" style={{ color: 'var(--pos-t1)' }}>{p.naam}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: 'var(--pos-border)', color: 'var(--pos-t2)' }}
                    >
                      {p.categorie}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={
                        p.btw === 0
                          ? { backgroundColor: 'var(--pos-border)', color: 'var(--pos-t2)' }
                          : p.btw === 9
                          ? { backgroundColor: 'rgba(37,99,235,0.15)', color: 'var(--pos-amber)' }
                          : { backgroundColor: 'rgba(249,115,22,0.15)', color: '#f97316' }
                      }
                    >
                      {p.btw}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-sm" style={{ color: 'var(--pos-t1)' }}>{formatPrijs(p)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => openBewerk(p)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--pos-t3)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.12)'; e.currentTarget.style.color = 'var(--pos-amber)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => verwijderProduct(p.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--pos-t3)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                      >
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
        <p className="text-sm" style={{ color: 'var(--pos-t2)' }}>{categorieen.length} categorieën</p>
        <button
          onClick={openNieuw}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-all shadow-sm"
          style={{ backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber)' }}
        >
          <Plus size={15} /> Nieuwe categorie
        </button>
      </div>

      {toonForm && (
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
        >
          <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--pos-t1)' }}>
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
                  className="w-10 h-10 rounded-xl cursor-pointer p-0.5"
                  style={{ backgroundColor: 'var(--pos-elevated)', border: '1px solid var(--pos-border)' }}
                />
                <input className={`${inputCls} flex-1`} value={form.kleur}
                  onChange={(e) => setForm({ ...form, kleur: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={sluiten}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-colors"
              style={{ color: 'var(--pos-t2)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <X size={14} /> Annuleren
            </button>
            <button
              onClick={opslaan}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber)' }}
            >
              <Check size={14} /> Opslaan
            </button>
          </div>
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
      >
        {sorted.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--pos-t3)' }}>Geen categorieën.</p>
        ) : (
          <div>
            {sorted.map((cat, idx) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors"
                style={{ borderBottom: idx < sorted.length - 1 ? '1px solid var(--pos-hover)' : 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div
                  className="w-8 h-8 rounded-xl shrink-0"
                  style={{ backgroundColor: cat.kleur, border: '1px solid var(--pos-border)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: 'var(--pos-t1)' }}>{cat.naam}</p>
                  <p className="text-xs" style={{ color: 'var(--pos-t3)' }}>Volgorde {cat.volgorde}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => verplaatsOmhoog(cat.id)}
                    disabled={idx === 0}
                    className="w-7 h-6 rounded flex items-center justify-center transition-colors disabled:opacity-25"
                    style={{ color: 'var(--pos-t3)' }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--pos-border)'; e.currentTarget.style.color = 'var(--pos-t1)' } }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => verplaatsOmlaag(cat.id)}
                    disabled={idx === sorted.length - 1}
                    className="w-7 h-6 rounded flex items-center justify-center transition-colors disabled:opacity-25"
                    style={{ color: 'var(--pos-t3)' }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--pos-border)'; e.currentTarget.style.color = 'var(--pos-t1)' } }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openBewerk(cat)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: 'var(--pos-t3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.12)'; e.currentTarget.style.color = 'var(--pos-amber)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => verwijderCategorie(cat.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: 'var(--pos-t3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                  >
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

const KORTING_META: Record<KortingType, { label: string; bg: string; color: string; icon: React.ElementType }> = {
  stapel:     { label: 'Stapelkorting',    bg: 'rgba(37,99,235,0.15)', color: '#3B82F6', icon: Layers },
  gratis:     { label: 'X + Y Gratis',     bg: 'rgba(16,185,129,0.15)',  color: '#10b981', icon: Gift },
  percentage: { label: 'Percentagekorting', bg: 'rgba(37,99,235,0.10)', color: '#3B82F6', icon: Percent },
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
        <p className="text-sm" style={{ color: 'var(--pos-t2)' }}>{kortingen.length} kortingen</p>
        <button
          onClick={openNieuw}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-all shadow-sm"
          style={{ backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber)' }}
        >
          <Plus size={15} /> Nieuwe korting
        </button>
      </div>

      {/* Form */}
      {toonForm && (
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
        >
          <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--pos-t1)' }}>
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
                  const isActive = form.type === t
                  return (
                    <button key={t} type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all"
                      style={
                        isActive
                          ? { borderColor: 'var(--pos-amber)', backgroundColor: 'rgba(37,99,235,0.12)', color: 'var(--pos-amber)' }
                          : { borderColor: 'var(--pos-border)', backgroundColor: 'transparent', color: 'var(--pos-t2)' }
                      }
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--pos-hover)' }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
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
                <span className="font-normal" style={{ color: 'var(--pos-t3)' }}>(leeg = alle producten)</span>
              </label>
              <div
                className="rounded-xl overflow-hidden max-h-44 overflow-y-auto"
                style={{ border: '1px solid var(--pos-border)', backgroundColor: 'var(--pos-elevated)' }}
              >
                {producten.map((p, idx) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                    style={{ borderBottom: idx < producten.length - 1 ? '1px solid var(--pos-hover)' : 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-hover)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <input type="checkbox"
                      checked={form.productIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="w-4 h-4 rounded accent-[var(--pos-amber)]"
                    />
                    <span className="text-sm" style={{ color: 'var(--pos-t1)' }}>{p.naam}</span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--pos-t2)' }}>{p.categorie}</span>
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
              <span className="text-sm font-medium" style={{ color: 'var(--pos-t1)' }}>Korting actief</span>
              <Toggle aan={form.actief} onChange={(v) => setForm({ ...form, actief: v })} />
            </div>
          </div>

          <div className="flex gap-2 mt-5 justify-end">
            <button
              onClick={sluiten}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-colors"
              style={{ color: 'var(--pos-t2)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <X size={14} /> Annuleren
            </button>
            <button
              onClick={opslaan}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber-h)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-amber)' }}
            >
              <Check size={14} /> Opslaan
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--pos-card)', border: '1px solid var(--pos-border)' }}
      >
        {kortingen.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--pos-t3)' }}>Geen kortingen. Maak een korting aan.</p>
        ) : (
          <div>
            {kortingen.map((k, idx) => {
              const meta = KORTING_META[k.type]
              const Icon = meta.icon
              return (
                <div
                  key={k.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors"
                  style={{
                    borderBottom: idx < kortingen.length - 1 ? '1px solid var(--pos-hover)' : 'none',
                    opacity: k.actief ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = k.actief ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: k.actief ? '#22c55e' : 'var(--pos-t4)' }}
                  />

                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: meta.bg, color: meta.color }}
                  >
                    <Icon size={11} /> {meta.label}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--pos-t1)' }}>{k.naam}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--pos-t2)' }}>
                      {kortingOmschrijving(k)} · {formatPeriode(k)}
                    </p>
                    {k.productIds.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--pos-t3)' }}>
                        {k.productIds.length} product{k.productIds.length !== 1 ? 'en' : ''}
                      </p>
                    )}
                  </div>

                  <Toggle aan={k.actief} onChange={() => toggleActief(k.id)} />

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => openBewerk(k)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--pos-t3)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.12)'; e.currentTarget.style.color = 'var(--pos-amber)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => verwijderKorting(k.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: 'var(--pos-t3)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pos-t3)' }}
                    >
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
        <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: 'var(--pos-t3)' }}>
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
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--pos-panel)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pos-t1)' }}>Productbeheer</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pos-t2)' }}>Beheer producten, categorieën en kortingen</p>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-5 w-fit"
          style={{ backgroundColor: 'var(--pos-page)' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActieveTab(tab.id)}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              style={
                actieveTab === tab.id
                  ? { backgroundColor: 'var(--pos-card)', color: 'var(--pos-t1)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }
                  : { backgroundColor: 'transparent', color: 'var(--pos-t3)' }
              }
              onMouseEnter={(e) => {
                if (actieveTab !== tab.id) e.currentTarget.style.color = 'var(--pos-t2)'
              }}
              onMouseLeave={(e) => {
                if (actieveTab !== tab.id) e.currentTarget.style.color = 'var(--pos-t3)'
              }}
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

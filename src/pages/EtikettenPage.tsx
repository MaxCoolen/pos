import { useEffect, useRef, useState } from 'react'
import {
  Plus, Trash2, Printer, Save, FilePlus, ChevronDown, ChevronUp, Tag,
  Bold, AlertCircle, Check,
} from 'lucide-react'
import {
  useEtikettenStore,
  EU_ALLERGENEN,
  LABEL_GROOTTES,
  LABEL_GROOTTE_LABELS,
  LEGE_VOEDINGSWAARDEN,
  type EtiketProduct,
  type Ingredient,
  type LabelGrootte,
  type Voedingswaarden,
  type VoedingseenheidType,
} from '../store/useEtikettenStore'

// ─── helpers ──────────────────────────────────────────────────────────────────

const MM_TO_PX = 3.7795

const LABEL_DIMS_MM: Record<LabelGrootte, { w: number; h: number }> = {
  '50x30':   { w: 50,  h: 30  },
  '70x40':   { w: 70,  h: 40  },
  '100x50':  { w: 100, h: 50  },
  '100x70':  { w: 100, h: 70  },
  '148x105': { w: 148, h: 105 },
}

const inputCls =
  'w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

const sectionCls =
  'bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-4'

const labelCls = 'block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1.5'

// ─── form state ───────────────────────────────────────────────────────────────

interface FormData {
  id?: string
  naam: string
  ingredienten: Ingredient[]
  voedingswaarden: Voedingswaarden
  eenheid: VoedingseenheidType
  bereidingswijze: string
  allergenen: string[]
  labelGrootte: LabelGrootte
  includeRegulationFooter: boolean
}

function leegForm(): FormData {
  return {
    naam: '',
    ingredienten: [],
    voedingswaarden: { ...LEGE_VOEDINGSWAARDEN },
    eenheid: 'per 100g',
    bereidingswijze: '',
    allergenen: [],
    labelGrootte: '100x70',
    includeRegulationFooter: true,
  }
}

// ─── label content (renders the actual food label) ────────────────────────────

function LabelContent({ form }: { form: FormData }) {
  const { naam, ingredienten, voedingswaarden: vw, eenheid, bereidingswijze, allergenen, includeRegulationFooter } = form

  const heeftIngredients = ingredienten.length > 0
  const heeftBereidingswijze = bereidingswijze.trim() !== ''
  const heeftAllergenen = allergenen.length > 0
  const heeftVoedingswaarden = Object.values(vw).some((v) => v.trim() !== '')

  // Format ingredient list: name (bold if allergen) [percentage]
  function renderIngredientList() {
    if (!heeftIngredients) return null
    return ingredienten.map((ing, i) => {
      const pct = ing.percentage.trim() ? ` (${ing.percentage.trim()}%)` : ''
      const sep = i < ingredienten.length - 1 ? ', ' : '.'
      if (ing.isAllergen) {
        return (
          <span key={ing.id}>
            <strong>{ing.naam}</strong>
            {pct}
            {sep}
          </span>
        )
      }
      return <span key={ing.id}>{ing.naam}{pct}{sep}</span>
    })
  }

  // Nutrition row helper
  function NutRow({ label, value, unit, sub = false }: { label: string; value: string; unit: string; sub?: boolean }) {
    const display = value.trim() || '–'
    return (
      <tr>
        <td style={{ paddingLeft: sub ? '8px' : '0', paddingTop: '1px', paddingBottom: '1px', borderTop: '0.5pt solid #ccc' }}>
          {sub ? <span>&#8194;{label}</span> : label}
        </td>
        <td style={{ textAlign: 'right', paddingTop: '1px', paddingBottom: '1px', borderTop: '0.5pt solid #ccc', whiteSpace: 'nowrap' }}>
          {display !== '–' ? `${display} ${unit}` : '–'}
        </td>
      </tr>
    )
  }

  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        backgroundColor: '#ffffff',
        color: '#000000',
        padding: '3mm',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        fontSize: '7pt',
        lineHeight: '1.25',
        display: 'flex',
        flexDirection: 'column',
        gap: '2mm',
      }}
    >
      {/* 1. PRODUCTNAAM */}
      <div style={{ fontSize: '10pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1 }}>
        {naam || <span style={{ color: '#999' }}>Productnaam</span>}
      </div>

      {/* 2. INGREDIËNTEN */}
      {heeftIngredients && (
        <div>
          <span style={{ fontWeight: 700, fontSize: '6.5pt' }}>INGREDIËNTEN: </span>
          <span style={{ fontSize: '6.5pt' }}>{renderIngredientList()}</span>
        </div>
      )}

      {/* 3. VOEDINGSWAARDEN */}
      {heeftVoedingswaarden && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '6.5pt', border: '0.75pt solid black' }}>
          <thead>
            <tr style={{ borderBottom: '0.75pt solid black' }}>
              <th style={{ textAlign: 'left', fontWeight: 700, padding: '1px 2px', backgroundColor: '#f0f0f0' }}>
                VOEDINGSWAARDEN
              </th>
              <th style={{ textAlign: 'right', fontWeight: 700, padding: '1px 2px', backgroundColor: '#f0f0f0', whiteSpace: 'nowrap' }}>
                {eenheid}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ paddingTop: '1px', paddingBottom: '1px', borderTop: '0.5pt solid #ccc' }}>Energie</td>
              <td style={{ textAlign: 'right', paddingTop: '1px', paddingBottom: '1px', borderTop: '0.5pt solid #ccc', whiteSpace: 'nowrap' }}>
                {vw.energie_kj || '–'} kJ / {vw.energie_kcal || '–'} kcal
              </td>
            </tr>
            <NutRow label="Vet" value={vw.vet} unit="g" />
            <NutRow label="waarvan verzadigde vetzuren" value={vw.vet_verzadigd} unit="g" sub />
            <NutRow label="Koolhydraten" value={vw.koolhydraten} unit="g" />
            <NutRow label="waarvan suikers" value={vw.suikers} unit="g" sub />
            <NutRow label="Eiwitten" value={vw.eiwitten} unit="g" />
            <NutRow label="Zout" value={vw.zout} unit="g" />
          </tbody>
        </table>
      )}

      {/* 4. BEREIDINGSWIJZE */}
      {heeftBereidingswijze && (
        <div>
          <span style={{ fontWeight: 700, fontSize: '6.5pt' }}>BEREIDINGSWIJZE: </span>
          <span style={{ fontSize: '6.5pt' }}>{bereidingswijze}</span>
        </div>
      )}

      {/* 5. ALLERGENEN */}
      {heeftAllergenen && (
        <div>
          <span style={{ fontWeight: 700, fontSize: '6.5pt' }}>ALLERGENEN: </span>
          <span style={{ fontSize: '6.5pt' }}>Bevat: {allergenen.join(', ')}.</span>
        </div>
      )}

      {/* EU footer */}
      {includeRegulationFooter && (
        <div style={{ marginTop: 'auto', borderTop: '0.5pt solid #ccc', paddingTop: '1mm', fontSize: '5.5pt', color: '#555' }}>
          Etiket opgemaakt conform EU Verordening 1169/2011
        </div>
      )}
    </div>
  )
}

// ─── live preview ─────────────────────────────────────────────────────────────

function LabelPreview({ form }: { form: FormData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dims = LABEL_DIMS_MM[form.labelGrootte]
  const labelPxW = dims.w * MM_TO_PX
  const labelPxH = dims.h * MM_TO_PX

  // Fit label into max ~360px wide preview column
  const PREVIEW_MAX_W = 360
  const scale = Math.min(1, PREVIEW_MAX_W / labelPxW)
  const scaledW = Math.round(labelPxW * scale)
  const scaledH = Math.round(labelPxH * scale)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
          Live voorbeeld
        </p>
        <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">
          {dims.w} × {dims.h} mm
        </span>
      </div>

      {/* Label preview canvas */}
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ width: scaledW, height: scaledH }}
      >
        {/* Shadow + border to simulate real label */}
        <div
          className="absolute inset-0 rounded shadow-lg border border-gray-300"
          style={{ boxShadow: '2px 2px 8px rgba(0,0,0,0.15)' }}
        />
        {/* Scaled label content */}
        <div
          id="etiket-print-area"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: labelPxW,
            height: labelPxH,
          }}
        >
          <LabelContent form={form} />
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-2">
        Schaal {Math.round(scale * 100)}%
      </p>
    </div>
  )
}

// ─── ingredient row editor ────────────────────────────────────────────────────

function IngredientRij({
  ing,
  index,
  onChange,
  onVerwijder,
}: {
  ing: Ingredient
  index: number
  onChange: (updates: Partial<Ingredient>) => void
  onVerwijder: () => void
}) {
  return (
    <div className="flex items-center gap-2 group">
      <div className="flex-1">
        <input
          type="text"
          value={ing.naam}
          onChange={(e) => onChange({ naam: e.target.value })}
          placeholder={`Ingrediënt ${index + 1}`}
          className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="w-16">
        <input
          type="text"
          value={ing.percentage}
          onChange={(e) => onChange({ percentage: e.target.value })}
          placeholder="%"
          className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm text-center bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="button"
        title="Markeer als allergeen (vetgedrukt)"
        onClick={() => onChange({ isAllergen: !ing.isAllergen })}
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          ing.isAllergen
            ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
        }`}
      >
        <Bold size={13} />
      </button>
      <button
        type="button"
        onClick={onVerwijder}
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export function EtikettenPage() {
  const { producten, opslaanProduct, verwijderProduct } = useEtikettenStore()
  const [form, setForm] = useState<FormData>(leegForm())
  const [opgeslaanId, setOpgeslaanId] = useState<string | null>(null)
  const [toonSavedList, setToonSavedList] = useState(true)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const printAfterLoadRef = useRef(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // ── ingredient helpers ────────────────────────────────────────────────────

  function voegIngredientToe() {
    setForm((f) => ({
      ...f,
      ingredienten: [
        ...f.ingredienten,
        { id: Date.now().toString(), naam: '', percentage: '', isAllergen: false },
      ],
    }))
  }

  function updateIngredient(id: string, updates: Partial<Ingredient>) {
    setForm((f) => ({
      ...f,
      ingredienten: f.ingredienten.map((ing) =>
        ing.id === id ? { ...ing, ...updates } : ing
      ),
    }))
  }

  function verwijderIngredient(id: string) {
    setForm((f) => ({
      ...f,
      ingredienten: f.ingredienten.filter((ing) => ing.id !== id),
    }))
  }

  // ── allergen toggle ───────────────────────────────────────────────────────

  function toggleAllergen(naam: string) {
    setForm((f) => ({
      ...f,
      allergenen: f.allergenen.includes(naam)
        ? f.allergenen.filter((a) => a !== naam)
        : [...f.allergenen, naam],
    }))
  }

  // ── nutrition update ──────────────────────────────────────────────────────

  function updateVoeding(field: keyof typeof LEGE_VOEDINGSWAARDEN, value: string) {
    setForm((f) => ({
      ...f,
      voedingswaarden: { ...f.voedingswaarden, [field]: value },
    }))
  }

  // ── save & load ───────────────────────────────────────────────────────────

  function opslaan() {
    if (!form.naam.trim()) return
    const savedId = opslaanProduct({ ...form, id: opgeslaanId ?? undefined })
    setOpgeslaanId(savedId)
    setForm((f) => ({ ...f, id: savedId }))
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2000)
  }

  function laadProduct(p: EtiketProduct) {
    setForm({
      id: p.id,
      naam: p.naam,
      ingredienten: p.ingredienten,
      voedingswaarden: p.voedingswaarden,
      eenheid: p.eenheid,
      bereidingswijze: p.bereidingswijze,
      allergenen: p.allergenen,
      labelGrootte: p.labelGrootte,
      includeRegulationFooter: p.includeRegulationFooter,
    })
    setOpgeslaanId(p.id)
  }

  function laadEnPrint(p: EtiketProduct) {
    laadProduct(p)
    printAfterLoadRef.current = true
  }

  function nieuwEtiket() {
    setForm(leegForm())
    setOpgeslaanId(null)
  }

  // ── print ─────────────────────────────────────────────────────────────────

  function printEtiket() {
    const dims = LABEL_DIMS_MM[form.labelGrootte]
    const style = document.createElement('style')
    style.id = 'etiket-print-override'
    style.innerHTML = `
      @media print {
        @page { size: ${dims.w}mm ${dims.h}mm; margin: 0; }
        body * { visibility: hidden !important; }
        #etiket-print-area, #etiket-print-area * { visibility: visible !important; }
        #etiket-print-area {
          position: fixed !important; top: 0 !important; left: 0 !important;
          width: ${dims.w}mm !important; height: ${dims.h}mm !important;
          transform: none !important;
          font-size: 7pt !important;
          background: white !important;
          overflow: hidden !important;
        }
      }
    `
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
  }

  // After laadEnPrint loads a product (form changes), trigger print
  useEffect(() => {
    if (printAfterLoadRef.current) {
      printAfterLoadRef.current = false
      // Small delay to ensure DOM is updated
      setTimeout(printEtiket, 80)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id, form.naam])

  // ─── render ───────────────────────────────────────────────────────────────

  const inputNl = (field: keyof typeof LEGE_VOEDINGSWAARDEN, label: string, unit: string, sub = false) => (
    <div className={`flex items-center gap-3 ${sub ? 'pl-4' : ''}`}>
      <label className="flex-1 text-sm text-gray-600 dark:text-slate-400">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="decimal"
          value={form.voedingswaarden[field]}
          onChange={(e) => updateVoeding(field, e.target.value)}
          className="w-20 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm text-right bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0"
        />
        <span className="text-xs text-gray-400 dark:text-slate-500 w-8">{unit}</span>
      </div>
    </div>
  )

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-50 dark:bg-slate-950">
      {/* ── LEFT: Form panel ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 min-w-0">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Etiketten</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              EU 1169/2011 · NVWA voedingsetiket generator
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={nieuwEtiket}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FilePlus size={15} /> Nieuw
            </button>
            <button
              onClick={opslaan}
              disabled={!form.naam.trim()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                savedFeedback
                  ? 'bg-emerald-500 text-white'
                  : form.naam.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
              }`}
            >
              {savedFeedback ? <><Check size={15} /> Opgeslagen!</> : <><Save size={15} /> Opslaan</>}
            </button>
          </div>
        </div>

        {/* Saved products list */}
        {producten.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <button
              onClick={() => setToonSavedList((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                Opgeslagen etiketten ({producten.length})
              </span>
              {toonSavedList ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {toonSavedList && (
              <div className="border-t border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                {producten.map((p) => (
                  <div key={p.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${opgeslaanId === p.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
                    <Tag size={14} className="text-gray-400 shrink-0" />
                    <button onClick={() => laadProduct(p)} className="flex-1 text-left text-sm font-medium text-gray-800 dark:text-slate-200 truncate hover:text-blue-600 dark:hover:text-blue-400">
                      {p.naam}
                    </button>
                    <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">{LABEL_GROOTTE_LABELS[p.labelGrootte]}</span>
                    <button
                      onClick={() => laadEnPrint(p)}
                      title="Afdrukken"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors shrink-0">
                      <Printer size={13} />
                    </button>
                    <button onClick={() => { verwijderProduct(p.id); if (opgeslaanId === p.id) nieuwEtiket() }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 1. Productnaam */}
        <div className={sectionCls}>
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">1. Productnaam</h2>
          <div>
            <label className={labelCls}>Naam *</label>
            <input
              type="text"
              value={form.naam}
              onChange={(e) => setForm((f) => ({ ...f, naam: e.target.value }))}
              className={inputCls}
              placeholder="bijv. Ambachtelijk Roggebrood"
            />
          </div>
        </div>

        {/* 2. Ingrediënten */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">2. Ingrediënten</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
              <Bold size={11} /> = allergeen (vetgedrukt)
            </div>
          </div>

          {form.ingredienten.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-3">
              Nog geen ingrediënten toegevoegd.
            </p>
          )}

          <div className="space-y-2">
            {form.ingredienten.map((ing, i) => (
              <IngredientRij
                key={ing.id}
                ing={ing}
                index={i}
                onChange={(updates) => updateIngredient(ing.id, updates)}
                onVerwijder={() => verwijderIngredient(ing.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={voegIngredientToe}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
          >
            <Plus size={15} /> Ingrediënt toevoegen
          </button>
        </div>

        {/* 3. Voedingswaarden */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">3. Voedingswaarden</h2>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 shrink-0">
              {(['per 100g', 'per 100ml'] as const).map((e) => (
                <button key={e} onClick={() => setForm((f) => ({ ...f, eenheid: e }))}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${form.eenheid === e ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="flex-1 text-sm font-semibold text-gray-700 dark:text-slate-300">Energie</label>
              <div className="flex items-center gap-2">
                <input type="text" inputMode="decimal" value={form.voedingswaarden.energie_kj}
                  onChange={(e) => updateVoeding('energie_kj', e.target.value)}
                  className="w-20 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm text-right bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                <span className="text-xs text-gray-400 dark:text-slate-500">kJ</span>
                <input type="text" inputMode="decimal" value={form.voedingswaarden.energie_kcal}
                  onChange={(e) => updateVoeding('energie_kcal', e.target.value)}
                  className="w-20 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm text-right bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                <span className="text-xs text-gray-400 dark:text-slate-500">kcal</span>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-700 pt-2 space-y-2">
              {inputNl('vet', 'Vet', 'g')}
              {inputNl('vet_verzadigd', 'waarvan verzadigde vetzuren', 'g', true)}
              {inputNl('koolhydraten', 'Koolhydraten', 'g')}
              {inputNl('suikers', 'waarvan suikers', 'g', true)}
              {inputNl('eiwitten', 'Eiwitten', 'g')}
              {inputNl('zout', 'Zout', 'g')}
            </div>
          </div>
        </div>

        {/* 4. Bereidingswijze */}
        <div className={sectionCls}>
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">4. Bereidingswijze <span className="font-normal text-gray-400">(optioneel)</span></h2>
          <textarea
            rows={3}
            value={form.bereidingswijze}
            onChange={(e) => setForm((f) => ({ ...f, bereidingswijze: e.target.value }))}
            className={`${inputCls} resize-none`}
            placeholder="bijv. Bewaren op een koele, droge plaats. Na opening bewaren in de koelkast."
          />
        </div>

        {/* 5. Allergenen */}
        <div className={sectionCls}>
          <div className="flex items-start gap-2">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">5. Allergenen</h2>
            <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">(optioneel — voor apart allergenenoverzicht)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {EU_ALLERGENEN.map((al) => {
              const geselecteerd = form.allergenen.includes(al)
              return (
                <button
                  key={al}
                  type="button"
                  onClick={() => toggleAllergen(al)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all ${
                    geselecteerd
                      ? 'bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300'
                      : 'bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  {geselecteerd
                    ? <AlertCircle size={13} className="shrink-0 text-orange-500" />
                    : <div className="w-[13px] h-[13px] rounded-full border border-gray-300 dark:border-slate-500 shrink-0" />}
                  <span className="truncate text-xs">{al}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 6. Label opties */}
        <div className={sectionCls}>
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">6. Label opties</h2>

          <div>
            <label className={labelCls}>Labelformaat</label>
            <div className="grid grid-cols-3 gap-2">
              {LABEL_GROOTTES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, labelGrootte: g }))}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
                    form.labelGrootte === g
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-300/40'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {LABEL_GROOTTE_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              EU 1169/2011 voettekst
            </label>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, includeRegulationFooter: !f.includeRegulationFooter }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.includeRegulationFooter ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.includeRegulationFooter ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Preview panel ── */}
      <div ref={previewRef} className="w-[440px] shrink-0 border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900 dark:text-white text-sm">Etiket preview</p>
            <button
              onClick={printEtiket}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
            >
              <Printer size={15} /> Afdrukken / PDF
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center gap-6">
          {/* Live preview */}
          <LabelPreview form={form} />

          {/* Info box */}
          <div className="w-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
              EU Verordening 1169/2011
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 leading-relaxed">
              <li>✓ Verplichte volgorde: naam → ingrediënten → voedingswaarden</li>
              <li>✓ Allergenen vetgedrukt in ingrediëntenlijst</li>
              <li>✓ Energiewaarde in kJ én kcal</li>
              <li>✓ Voedingswaarden per 100g of 100ml</li>
              <li>✓ Verplicht: vet, koolhydraten, eiwitten, zout</li>
            </ul>
          </div>

          {/* Thermal printer tip */}
          <div className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Thermische printer
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-500 leading-relaxed">
              Gebruik <strong>Afdrukken / PDF</strong> en stel uw browser in op de geselecteerde labelgrootte zonder marges. Zwart-wit, hoog contrast layout is geoptimaliseerd voor thermische label-printers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

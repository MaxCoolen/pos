import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, ArrowRight, Plus, ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'

interface StoreRow {
  id: string
  naam: string
  adres: string | null
  aktief: boolean
}

// ─── Font injection ─────────────────────────────────────────────────────────
function usePremiumFonts() {
  useEffect(() => {
    if (document.getElementById('mercaro-login-fonts')) return
    const link = document.createElement('link')
    link.id = 'mercaro-login-fonts'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap'
    document.head.appendChild(link)
  }, [])
}

// ─── SVG crosshatch background ───────────────────────────────────────────────
const PATROON = `data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%233B82F6' stroke-width='0.4' opacity='0.07'%3E%3Cpath d='M0 0L72 72M72 0L0 72'/%3E%3C/g%3E%3C/svg%3E`

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

  usePremiumFonts()

  useEffect(() => { void laadStores() }, [])

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
      setFout('Kon vestigingen niet laden: ' + error.message)
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
      setFout('Kon vestiging niet aanmaken: ' + error.message)
    } else if (data) {
      const id = data.id as string
      localStorage.setItem('pos-device-store', id)
      setCurrentStoreId(id)
    }
    setBezig(false)
  }

  const kanAanmaken = nieuweNaam.trim().length > 0 && !bezig

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes breatheWarm {
          0%,100% { transform: scale(1)    translate(0,0);       opacity: 0.40; }
          40%     { transform: scale(1.08) translate(3%, -3%);   opacity: 0.55; }
          70%     { transform: scale(0.95) translate(-2%, 2%);   opacity: 0.30; }
        }
        @keyframes breatheCool {
          0%,100% { transform: scale(1)    translate(0,0);       opacity: 0.25; }
          35%     { transform: scale(1.07) translate(-3%, 2%);   opacity: 0.42; }
          70%     { transform: scale(0.93) translate(2%, -2%);   opacity: 0.15; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ss-anim-1 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .ss-anim-2 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .ss-anim-3 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.30s both; }

        .ss-orb-warm { animation: breatheWarm 22s ease-in-out infinite; }
        .ss-orb-cool { animation: breatheCool 30s ease-in-out infinite; }

        .mercaro-serif { font-family: 'Fraunces', 'Georgia', serif; }
        .mercaro-sans  { font-family: 'DM Sans', 'system-ui', sans-serif; }

        .ss-input {
          background-color: #141820;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 13px 16px;
          color: #F0EBE0;
          font-size: 14px;
          font-family: 'DM Sans', system-ui, sans-serif;
          width: 100%;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          caret-color: #3B82F6;
        }
        .ss-input::placeholder { color: #2A2F3E; }
        .ss-input:focus {
          outline: none;
          border-color: rgba(37,99,235,0.55);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
        }

        .ss-store-card {
          width: 100%;
          background-color: #0E1018;
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 12px;
          padding: 16px 18px;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ss-store-card:hover {
          background-color: #121620;
          border-color: rgba(37,99,235,0.28);
          transform: translateY(-1px);
        }
        .ss-store-card:hover .ss-arrow { color: #3B82F6; }
        .ss-store-card:active { transform: translateY(0); }
        .ss-arrow { color: #252836; transition: color 0.2s ease; }

        .ss-new-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 1px dashed rgba(37,99,235,0.18);
          background: transparent;
          color: #2E3448;
          font-size: 13px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 400;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .ss-new-btn:hover {
          border-color: rgba(37,99,235,0.45);
          color: #3B82F6;
        }

        .ss-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 10px;
          padding: 13px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', system-ui, sans-serif;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.15s ease;
        }
        .ss-btn-active {
          background-color: #3B82F6;
          color: #0A0C12;
        }
        .ss-btn-active:hover { background-color: #2563EB; transform: translateY(-1px); }
        .ss-btn-active:active { transform: translateY(0); }
        .ss-btn-inactive {
          background-color: #141820;
          color: #2E3448;
          cursor: not-allowed;
        }
        .ss-btn-ghost {
          background-color: transparent;
          border: 1px solid rgba(255,255,255,0.07) !important;
          color: #4E5568;
        }
        .ss-btn-ghost:hover { color: #F0EBE0; border-color: rgba(255,255,255,0.14) !important; }
      `}</style>

      <div
        className="mercaro-sans"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090B10',
          backgroundImage: `url("${PATROON}")`,
          backgroundSize: '72px 72px',
          position: 'relative',
          overflow: 'hidden',
          padding: '32px 24px',
        }}
      >
        {/* Warm amber orb — rechtsboven */}
        <div
          className="ss-orb-warm"
          style={{
            position: 'fixed',
            width: '65%',
            paddingBottom: '65%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.16) 0%, transparent 68%)',
            top: '-30%',
            right: '-25%',
            pointerEvents: 'none',
          }}
        />
        {/* Koele blauwe orb — linksonder */}
        <div
          className="ss-orb-cool"
          style={{
            position: 'fixed',
            width: '50%',
            paddingBottom: '50%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(80,110,200,0.09) 0%, transparent 68%)',
            bottom: '-22%',
            left: '-16%',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px' }}>

          {/* Wordmark */}
          <div className="ss-anim-1" style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div
              className="mercaro-serif"
              style={{ fontSize: '28px', fontWeight: 900, color: '#F0EBE0', letterSpacing: '-0.025em', lineHeight: 1 }}
            >
              Mercaro
            </div>
            <div
              className="mercaro-serif"
              style={{ fontSize: '13px', fontWeight: 300, fontStyle: 'italic', color: '#3B82F6', letterSpacing: '0.14em', marginTop: '3px' }}
            >
              POS
            </div>
          </div>

          {/* Heading */}
          <div className="ss-anim-2" style={{ marginBottom: '28px' }}>
            <h1
              className="mercaro-serif"
              style={{ fontSize: '24px', fontWeight: 700, color: '#F0EBE0', letterSpacing: '-0.02em', marginBottom: '6px' }}
            >
              {aanmaken ? 'Nieuwe vestiging' : 'Selecteer uw vestiging'}
            </h1>
            <p style={{ fontSize: '13px', color: '#383D52', fontWeight: 300 }}>
              {aanmaken ? 'Voer de locatiegegevens in' : 'Kies een locatie om te starten'}
            </p>
          </div>

          {/* Foutmelding */}
          {fout && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: 'rgba(200,60,60,0.07)',
                border: '1px solid rgba(200,60,60,0.18)',
                borderRadius: '10px',
                padding: '13px 15px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={15} style={{ color: '#C07070', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '13px', color: '#B07070', lineHeight: 1.5 }}>{fout}</p>
            </div>
          )}

          {/* Body */}
          <div className="ss-anim-3">
            {laden ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <Loader2 size={20} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : aanmaken ? (
              /* ── Aanmaak-formulier ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', color: '#363A50', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Naam *
                  </label>
                  <input
                    type="text"
                    value={nieuweNaam}
                    onChange={(e) => setNieuweNaam(e.target.value)}
                    placeholder="Amsterdam Noord"
                    autoFocus
                    className="ss-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', color: '#363A50', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Adres <span style={{ opacity: 0.4 }}>(optioneel)</span>
                  </label>
                  <input
                    type="text"
                    value={nieuweAdres}
                    onChange={(e) => setNieuweAdres(e.target.value)}
                    placeholder="Hoofdstraat 1, Amsterdam"
                    className="ss-input"
                    onKeyDown={(e) => { if (e.key === 'Enter' && kanAanmaken) void maakStoreAan() }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                  <button
                    onClick={() => { setAanmaken(false); setNieuweNaam(''); setNieuweAdres('') }}
                    className="ss-btn ss-btn-ghost"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <ChevronLeft size={14} />
                    Terug
                  </button>
                  <button
                    onClick={() => void maakStoreAan()}
                    disabled={!kanAanmaken}
                    className={`ss-btn ${kanAanmaken ? 'ss-btn-active' : 'ss-btn-inactive'}`}
                  >
                    {bezig && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                    {bezig ? 'Even geduld…' : 'Aanmaken'}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Winkellijst ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {stores.map((store) => (
                  <button
                    key={store.id}
                    className="ss-store-card"
                    onClick={() => { localStorage.setItem('pos-device-store', store.id); setCurrentStoreId(store.id) }}
                  >
                    {/* Amber dot */}
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3B82F6', flexShrink: 0, opacity: 0.65 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#F0EBE0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {store.naam}
                      </p>
                      {store.adres && (
                        <p style={{ fontSize: '12px', color: '#363A50', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {store.adres}
                        </p>
                      )}
                    </div>
                    <ArrowRight size={14} className="ss-arrow" style={{ flexShrink: 0 }} />
                  </button>
                ))}

                {stores.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#252836', fontSize: '13px', padding: '28px 0' }}>
                    Nog geen vestigingen aangemaakt.
                  </p>
                )}

                <button
                  onClick={() => setAanmaken(true)}
                  className="ss-new-btn"
                  style={{ marginTop: stores.length > 0 ? '4px' : '0' }}
                >
                  <Plus size={14} />
                  Nieuwe vestiging aanmaken
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '44px', fontSize: '11px' }}>
            <button
              onClick={uitloggen}
              style={{ color: '#1E2230', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#4E5568')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1E2230')}
            >
              Uitloggen
            </button>
          </p>
        </div>
      </div>
    </>
  )
}

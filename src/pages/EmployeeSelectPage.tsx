import { useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { usePersoneelStore, MEDEWERKER_KLEUREN } from '../store/usePersoneelStore'
import { useCartStore } from '../store/useCartStore'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'

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
  const [hoverId, setHoverId] = useState<string | null>(null)

  usePremiumFonts()

  function initialen(n: string) {
    return n.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('')
  }

  async function kiesMedewerker(id: string) {
    setActiveMedewerker(id)
    await laadMedewerkerCart(id)
  }

  async function voegToe(e: React.FormEvent) {
    e.preventDefault()
    if (!naam.trim()) return
    setBezig(true)
    await voegMedewerkerToe({
      naam: naam.trim(),
      initialen: initialen(naam),
      kleur: MEDEWERKER_KLEUREN[medewerkers.length % MEDEWERKER_KLEUREN.length],
      rol: 'admin',
    })
    setNaam('')
    setToonFormulier(false)
    setBezig(false)
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
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
        @keyframes avatarIn {
          from { opacity: 0; transform: scale(0.85) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .es-anim-1 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .es-anim-2 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .es-anim-3 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.30s both; }
        .es-footer  { animation: fadeIn 0.8s ease 0.55s both; }

        .es-orb-warm { animation: breatheWarm 22s ease-in-out infinite; }
        .es-orb-cool { animation: breatheCool 30s ease-in-out infinite; }

        .mercaro-serif { font-family: 'Fraunces', 'Georgia', serif; }
        .mercaro-sans  { font-family: 'DM Sans', 'system-ui', sans-serif; }

        .es-avatar-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 24px 16px;
          border-radius: 16px;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .es-avatar-card:hover {
          background-color: rgba(255,255,255,0.03);
          transform: translateY(-3px);
        }
        .es-avatar-card:active { transform: scale(0.97) translateY(0); }

        .es-avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fraunces', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.01em;
          transition: box-shadow 0.25s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1);
        }

        .es-add-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 24px 16px;
          border-radius: 16px;
          background: transparent;
          border: 1px dashed rgba(37,99,235,0.18);
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease;
          width: 100%;
        }
        .es-add-btn:hover {
          border-color: rgba(37,99,235,0.40);
          background-color: rgba(37,99,235,0.04);
        }

        .es-input {
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
        .es-input::placeholder { color: #2A2F3E; }
        .es-input:focus {
          outline: none;
          border-color: rgba(37,99,235,0.55);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
        }

        .es-submit-btn {
          width: 100%;
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
          transition: background 0.2s ease, transform 0.15s ease;
        }
        .es-submit-active {
          background-color: #3B82F6;
          color: #0A0C12;
          cursor: pointer;
        }
        .es-submit-active:hover { background-color: #2563EB; transform: translateY(-1px); }
        .es-submit-active:active { transform: translateY(0); }
        .es-submit-inactive {
          background-color: #141820;
          color: #2E3448;
          cursor: not-allowed;
        }
      `}</style>

      <div
        className="mercaro-sans"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#090B10',
          backgroundImage: `url("${PATROON}")`,
          backgroundSize: '72px 72px',
          position: 'relative',
          overflow: 'hidden',
          padding: '48px 24px',
        }}
      >
        {/* Warm amber orb — rechtsboven */}
        <div
          className="es-orb-warm"
          style={{
            position: 'fixed',
            width: '60%',
            paddingBottom: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.16) 0%, transparent 68%)',
            top: '-28%',
            right: '-22%',
            pointerEvents: 'none',
          }}
        />
        {/* Koele blauwe orb — linksonder */}
        <div
          className="es-orb-cool"
          style={{
            position: 'fixed',
            width: '50%',
            paddingBottom: '50%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(80,110,200,0.09) 0%, transparent 68%)',
            bottom: '-20%',
            left: '-14%',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '680px' }}>

          {/* Wordmark */}
          <div className="es-anim-1" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div
              className="mercaro-serif"
              style={{ fontSize: '22px', fontWeight: 900, color: '#F0EBE0', letterSpacing: '-0.02em', lineHeight: 1 }}
            >
              Mercaro
            </div>
            <div
              className="mercaro-serif"
              style={{ fontSize: '11px', fontWeight: 300, fontStyle: 'italic', color: '#3B82F6', letterSpacing: '0.16em', marginTop: '3px' }}
            >
              POS
            </div>
          </div>

          {/* Heading */}
          <div className="es-anim-2" style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h1
              className="mercaro-serif"
              style={{
                fontSize: 'clamp(36px, 6vw, 52px)',
                fontWeight: 900,
                color: '#F0EBE0',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: '10px',
              }}
            >
              Wie werkt er vandaag?
            </h1>
            <p
              className="mercaro-serif"
              style={{ fontSize: '15px', fontWeight: 300, fontStyle: 'italic', color: '#3B82F6', letterSpacing: '0.01em' }}
            >
              Kies uw naam om de kassa te starten
            </p>
          </div>

          {/* Medewerker grid of lege staat */}
          <div className="es-anim-3">
            {medewerkers.length === 0 && !toonFormulier ? (
              /* Lege staat */
              <div style={{ textAlign: 'center', padding: '16px 0 32px' }}>
                <p style={{ color: '#252836', fontSize: '13px', marginBottom: '24px' }}>
                  Nog geen medewerkers aangemaakt.
                </p>
                <button
                  onClick={() => setToonFormulier(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '13px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#3B82F6',
                    color: '#0A0C12',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3B82F6')}
                >
                  <Plus size={15} />
                  Eerste medewerker toevoegen
                </button>
              </div>
            ) : toonFormulier ? (
              /* Toevoeg-formulier */
              <form
                onSubmit={(e) => void voegToe(e)}
                style={{
                  maxWidth: '320px',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', color: '#363A50', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Naam medewerker
                  </label>
                  <input
                    type="text"
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    placeholder="Jan de Vries"
                    autoFocus
                    className="es-input"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setToonFormulier(false); setNaam('') }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: 'transparent',
                      color: '#4E5568',
                      fontSize: '14px',
                      fontFamily: 'DM Sans, system-ui, sans-serif',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#F0EBE0')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#4E5568')}
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={!naam.trim() || bezig}
                    className={`es-submit-btn ${naam.trim() && !bezig ? 'es-submit-active' : 'es-submit-inactive'}`}
                    style={{ flex: 1 }}
                  >
                    {bezig && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                    {bezig ? 'Even geduld…' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            ) : (
              /* Avatar-grid */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '8px',
                }}
              >
                {medewerkers.map((m, i) => {
                  const isHover = hoverId === m.id
                  return (
                    <button
                      key={m.id}
                      className="es-avatar-card"
                      onClick={() => void kiesMedewerker(m.id)}
                      onMouseEnter={() => setHoverId(m.id)}
                      onMouseLeave={() => setHoverId(null)}
                      style={{
                        animation: `avatarIn 0.6s cubic-bezier(0.16,1,0.3,1) ${0.30 + i * 0.07}s both`,
                        borderColor: isHover ? `${m.kleur}33` : 'transparent',
                      }}
                    >
                      <div
                        className="es-avatar"
                        style={{
                          backgroundColor: m.kleur,
                          boxShadow: isHover
                            ? `0 0 0 3px ${m.kleur}44, 0 12px 36px ${m.kleur}30`
                            : `0 4px 16px ${m.kleur}28`,
                          transform: isHover ? 'scale(1.06)' : 'scale(1)',
                        }}
                      >
                        {m.initialen}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: isHover ? '#F0EBE0' : '#9CA3AF', transition: 'color 0.2s ease', letterSpacing: '0.01em' }}>
                        {m.naam.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}

                {/* Medewerker toevoegen knop */}
                <button
                  className="es-add-btn"
                  onClick={() => setToonFormulier(true)}
                  style={{ animation: `avatarIn 0.6s cubic-bezier(0.16,1,0.3,1) ${0.30 + medewerkers.length * 0.07}s both` }}
                >
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      border: '1.5px dashed rgba(37,99,235,0.30)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={22} style={{ color: 'rgba(37,99,235,0.45)' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#2E3448', letterSpacing: '0.02em' }}>Toevoegen</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="es-footer"
            style={{ textAlign: 'center', marginTop: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}
          >
            <button
              onClick={() => { setActiveMedewerker(null); setCurrentStoreId(null) }}
              style={{ color: '#1E2230', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.04em', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#4E5568')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1E2230')}
            >
              Andere vestiging
            </button>
            <span style={{ color: '#1A1D28', fontSize: '11px' }}>·</span>
            <button
              onClick={uitloggen}
              style={{ color: '#1E2230', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.04em', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#4E5568')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1E2230')}
            >
              Uitloggen
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

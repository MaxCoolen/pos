import { useState, FormEvent, useEffect } from 'react'
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

// ─── Font injection ────────────────────────────────────────────────────────────
// Fraunces: optical-size serif, deeply expressive, premium without being stiff
// DM Sans: clean variable sans, excellent legibility at small sizes
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

// ─── SVG crosshatch background pattern ────────────────────────────────────────
// Amber-tinted fine diagonal lines — art deco grid feel, very low opacity
const PATROON = `data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%233B82F6' stroke-width='0.4' opacity='0.07'%3E%3Cpath d='M0 0L72 72M72 0L0 72'/%3E%3C/g%3E%3C/svg%3E`

// ─── Component ─────────────────────────────────────────────────────────────────

export function LoginPage() {
  const { inloggen, laden, fout } = useAuthStore()
  const [email, setEmail]             = useState('')
  const [wachtwoord, setWachtwoord]   = useState('')
  const [bezig, setBezig]             = useState(false)
  const [lokaalFout, setLokaalFout]   = useState<string | null>(null)
  const [toonWachtwoord, setToonWachtwoord] = useState(false)

  usePremiumFonts()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLokaalFout(null)
    setBezig(true)
    const ok = await inloggen(email, wachtwoord)
    if (!ok) setLokaalFout(fout ?? 'Inloggen mislukt. Controleer uw e-mail en wachtwoord.')
    setBezig(false)
  }

  const isBezig    = bezig || laden
  const kanInloggen = !isBezig && !!email && !!wachtwoord

  return (
    <>
      {/* ── Keyframes + component-scoped CSS ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes breatheWarm {
          0%,100% { transform: scale(1)    translate(0,    0);    opacity: 0.45; }
          40%     { transform: scale(1.10) translate(3%,  -3%);   opacity: 0.60; }
          70%     { transform: scale(0.94) translate(-2%,  2%);   opacity: 0.32; }
        }
        @keyframes breatheCool {
          0%,100% { transform: scale(1)    translate(0,    0);    opacity: 0.30; }
          35%     { transform: scale(1.08) translate(-3%,  2%);   opacity: 0.50; }
          70%     { transform: scale(0.92) translate(2%,  -2%);   opacity: 0.20; }
        }

        .ml-anim-1 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .ml-anim-2 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .ml-anim-3 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.38s both; }
        .ml-anim-4 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.52s both; }
        .mr-anim   { animation: fadeIn 1.1s ease 0.35s both; }

        .orb-warm { animation: breatheWarm 22s ease-in-out infinite; }
        .orb-cool { animation: breatheCool 30s ease-in-out infinite; }

        .mercaro-serif { font-family: 'Fraunces', 'Georgia', serif; }
        .mercaro-sans  { font-family: 'DM Sans', 'system-ui', sans-serif; }

        /* Input focus states */
        .ml-input {
          background-color: #141820;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 14px 16px;
          color: #F0EBE0;
          font-size: 14px;
          font-family: 'DM Sans', system-ui, sans-serif;
          width: 100%;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          caret-color: #3B82F6;
        }
        .ml-input::placeholder { color: #2E3448; }
        .ml-input:focus {
          outline: none;
          border-color: rgba(37,99,235,0.55);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.10);
        }

        /* Submit button */
        .ml-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 10px;
          padding: 15px;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.03em;
          font-family: 'DM Sans', system-ui, sans-serif;
          transition: background 0.2s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease;
        }
        .ml-btn-active {
          background-color: #3B82F6;
          color: #0A0C12;
          cursor: pointer;
        }
        .ml-btn-active:hover {
          background-color: #2563EB;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(37,99,235,0.22);
        }
        .ml-btn-active:active {
          transform: translateY(0);
          box-shadow: none;
        }
        .ml-btn-inactive {
          background-color: #191C28;
          color: #2E3448;
          cursor: not-allowed;
        }
      `}</style>

      <div
        className="mercaro-sans"
        style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#090B10' }}
      >
        {/* ── Linker branding paneel (verborgen op kleine schermen) ── */}
        <div
          className="hidden lg:flex flex-col"
          style={{
            width: '60%',
            backgroundColor: '#0B0D13',
            backgroundImage: `url("${PATROON}")`,
            backgroundSize: '72px 72px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Warm amber gloeier — rechtsboven */}
          <div
            className="orb-warm"
            style={{
              position: 'absolute',
              width: '75%',
              paddingBottom: '75%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.20) 0%, transparent 68%)',
              top: '-28%',
              right: '-22%',
              pointerEvents: 'none',
            }}
          />
          {/* Koele blauwe gloeier — linksonder */}
          <div
            className="orb-cool"
            style={{
              position: 'absolute',
              width: '55%',
              paddingBottom: '55%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(80,110,200,0.10) 0%, transparent 68%)',
              bottom: '-20%',
              left: '-14%',
              pointerEvents: 'none',
            }}
          />

          {/* Hoofd content */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 'clamp(48px, 8vw, 96px)',
            }}
          >
            {/* Logo — M icoon + woordmerk */}
            <div className="ml-anim-1" style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
              {/* Mercaro M — inline SVG recreatie (wit + goud voor donkere achtergrond) */}
              <svg
                width="80" height="62"
                viewBox="0 0 130 100"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
                aria-label="Mercaro M logo"
              >
                <polygon points="0,0 47,0 47,18 64,62 30,100 0,100"   fill="#D8E6FF" />
                <polygon points="47,0 82,0 82,18 64,62 47,18"          fill="#C4A234" />
                <polygon points="82,0 130,0 130,100 96,100 64,62 82,18" fill="#D8E6FF" />
              </svg>
              {/* Tekst */}
              <div>
                <div
                  className="mercaro-serif"
                  style={{
                    fontSize: 'clamp(38px, 5vw, 64px)',
                    fontWeight: 900,
                    lineHeight: 0.9,
                    letterSpacing: '-0.025em',
                    color: '#F0EBE0',
                  }}
                >
                  Mercaro
                </div>
                <div
                  className="mercaro-serif"
                  style={{
                    fontSize: 'clamp(18px, 2.2vw, 30px)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    letterSpacing: '0.12em',
                    color: '#C4A234',
                    marginTop: '3px',
                  }}
                >
                  POS
                </div>
              </div>
            </div>

            {/* Horizontale lijn — amber, smal */}
            <div className="ml-anim-2" style={{ margin: '44px 0 28px' }}>
              <div
                style={{
                  width: '40px',
                  height: '1px',
                  backgroundColor: '#3B82F6',
                  opacity: 0.5,
                }}
              />
            </div>

            {/* Tagline */}
            <p
              className="ml-anim-3"
              style={{
                fontSize: '16px',
                lineHeight: 1.7,
                color: '#4E5568',
                fontWeight: 300,
                letterSpacing: '0.01em',
                maxWidth: '300px',
              }}
            >
              Slimme kassasoftware<br />voor de moderne ondernemer
            </p>
          </div>

          {/* Versienummer — linksonder */}
          <div
            className="ml-anim-4"
            style={{
              position: 'relative',
              zIndex: 10,
              padding: '28px clamp(48px, 8vw, 96px)',
            }}
          >
            <span style={{ fontSize: '11px', color: '#242736', letterSpacing: '0.08em' }}>
              v0.1.0
            </span>
          </div>
        </div>

        {/* ── Rechter formulier paneel ── */}
        <div
          className="mr-anim flex-1 flex flex-col justify-center"
          style={{
            backgroundColor: '#0F1119',
            borderLeft: '1px solid rgba(255,255,255,0.035)',
            padding: 'clamp(32px, 6vw, 80px) clamp(24px, 5vw, 64px)',
          }}
        >
          {/* Mobiel logo — alleen zichtbaar zonder split */}
          <div className="lg:hidden" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <svg width="48" height="37" viewBox="0 0 130 100" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <polygon points="0,0 47,0 47,18 64,62 30,100 0,100"   fill="#D8E6FF" />
              <polygon points="47,0 82,0 82,18 64,62 47,18"          fill="#C4A234" />
              <polygon points="82,0 130,0 130,100 96,100 64,62 82,18" fill="#D8E6FF" />
            </svg>
            <div>
              <div className="mercaro-serif" style={{ fontSize: '30px', fontWeight: 900, color: '#F0EBE0', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Mercaro
              </div>
              <div className="mercaro-serif" style={{ fontSize: '15px', fontWeight: 300, fontStyle: 'italic', color: '#C4A234', letterSpacing: '0.10em' }}>
                POS
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>

            {/* Heading */}
            <div style={{ marginBottom: '36px' }}>
              <h1
                className="mercaro-serif"
                style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: '#F0EBE0',
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                }}
              >
                Welkom terug.
              </h1>
              <p style={{ fontSize: '14px', color: '#383D52', fontWeight: 300 }}>
                Log in om verder te gaan
              </p>
            </div>

            {/* Foutmelding */}
            {lokaalFout && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  backgroundColor: 'rgba(200,60,60,0.07)',
                  border: '1px solid rgba(200,60,60,0.18)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '24px',
                }}
              >
                <AlertCircle size={16} style={{ color: '#C07070', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '13px', color: '#B07070', lineHeight: 1.55 }}>{lokaalFout}</p>
              </div>
            )}

            {/* Formulier */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* E-mailadres */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    color: '#363A50',
                    textTransform: 'uppercase',
                    marginBottom: '9px',
                  }}
                >
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="eigenaar@winkel.nl"
                  required
                  autoFocus
                  className="ml-input"
                />
              </div>

              {/* Wachtwoord */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    color: '#363A50',
                    textTransform: 'uppercase',
                    marginBottom: '9px',
                  }}
                >
                  Wachtwoord
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={toonWachtwoord ? 'text' : 'password'}
                    value={wachtwoord}
                    onChange={(e) => setWachtwoord(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="ml-input"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setToonWachtwoord(!toonWachtwoord)}
                    tabIndex={-1}
                    aria-label={toonWachtwoord ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#2E3448',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      lineHeight: 0,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#3B82F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#2E3448')}
                  >
                    {toonWachtwoord ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Inlogknop */}
              <div style={{ paddingTop: '4px' }}>
                <button
                  type="submit"
                  disabled={!kanInloggen}
                  className={`ml-btn ${kanInloggen ? 'ml-btn-active' : 'ml-btn-inactive'}`}
                >
                  {isBezig && <Loader2 size={15} className="animate-spin" />}
                  {isBezig ? 'Even geduld…' : 'Inloggen'}
                </button>
              </div>
            </form>

            {/* Footer */}
            <p
              style={{
                marginTop: '52px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#1E2230',
                letterSpacing: '0.05em',
              }}
            >
              © 2026 Mercaro · Alle rechten voorbehouden
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

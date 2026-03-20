import { useEffect, useState } from 'react'
import { LayoutGrid, Package, BarChart2, Settings, ChevronLeft, ChevronRight, Tag, LogOut, Check, Download } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useInstellingenStore } from '../../store/useInstellingenStore'
import { usePersoneelStore } from '../../store/usePersoneelStore'
import { useCartStore } from '../../store/useCartStore'
import { useTransactieStore } from '../../store/useTransactieStore'
import type { Page } from '../../types'

const menuItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'pos',           label: 'POS',          icon: LayoutGrid },
  { id: 'productbeheer', label: 'Productbeheer', icon: Package },
  { id: 'rapportages',   label: 'Rapportages',   icon: BarChart2 },
  { id: 'etiketten',     label: 'Etiketten',     icon: Tag },
  { id: 'instellingen',  label: 'Instellingen',  icon: Settings },
]

export function Sidebar() {
  const { huidigePagina, sidebarIngeklapt, navigeerNaar, toggleSidebar } = useAppStore()
  const { bedrijfsnaam, logo } = useInstellingenStore()
  const { medewerkers, activeMedewerkerId, setActiveMedewerker } = usePersoneelStore()
  const { laadMedewerkerCart, ontkoppelMedewerker } = useCartStore()
  const pendingSyncCount = useTransactieStore((s) => s.pendingSyncCount)

  const collapsed = sidebarIngeklapt
  const activeMedewerker = medewerkers.find((m) => m.id === activeMedewerkerId) ?? null

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [wisselBevestig, setWisselBevestig] = useState(false)

  // Auto-reset bevestigingsstatus na 3 seconden
  useEffect(() => {
    if (!wisselBevestig) return
    const t = setTimeout(() => setWisselBevestig(false), 3000)
    return () => clearTimeout(t)
  }, [wisselBevestig])

  function sluitApplicatie() {
    window.close()
  }

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  return (
    <aside
      className={`${
        collapsed ? 'w-[72px]' : 'w-56'
      } transition-all duration-300 flex flex-col py-4 shrink-0 overflow-hidden`}
      style={{ backgroundColor: 'var(--pos-sidebar)', borderRight: '1px solid var(--pos-border)' }}
    >
      {/* ── Header: single logo + toggle ── */}
      <div className={`flex items-center mb-4 px-3 ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>

        {/* Collapsed: icon only */}
        {collapsed ? (
          <>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--pos-amber)', boxShadow: '0 4px 12px var(--pos-shadow-amber)' }}>
              {logo
                ? <img src={logo} alt={bedrijfsnaam} className="w-full h-full object-contain p-1" />
                : <LayoutGrid size={17} style={{ color: '#0A0C12' }} />
              }
            </div>
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--pos-t3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-hover)'; e.currentTarget.style.color = 'var(--pos-t1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--pos-t3)' }}
              title="Menu uitklappen"
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : (
          /* Expanded: logo image (if set) OR icon + company name */
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {logo ? (
                /* Logo uploaded: small logo + company name side by side */
                <>
                  <img
                    src={logo}
                    alt={bedrijfsnaam}
                    className="max-h-7 max-w-[32px] w-auto object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-black text-[14px] leading-none tracking-tight truncate" style={{ color: 'var(--pos-t1)' }}>
                      {bedrijfsnaam}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--pos-t3)' }}>Kassasysteem</p>
                  </div>
                </>
              ) : (
                /* No logo: blue icon + company name text */
                <>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--pos-amber)', boxShadow: '0 4px 12px var(--pos-shadow-amber)' }}>
                    <LayoutGrid size={16} style={{ color: '#0A0C12' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-[15px] leading-none tracking-tight truncate" style={{ color: 'var(--pos-t1)' }}>
                      {bedrijfsnaam}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--pos-t3)' }}>Kassasysteem</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
              style={{ color: 'var(--pos-t3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-hover)'; e.currentTarget.style.color = 'var(--pos-t1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--pos-t3)' }}
              title="Menu inklappen"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}
      </div>

      {/* ── Nav items ── */}
      <nav className="flex flex-col gap-1 px-2">
        {menuItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => navigeerNaar(id)}
            title={collapsed ? label : undefined}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 active:scale-95 min-h-[48px] ${
              collapsed ? 'justify-center' : ''
            }`}
            style={huidigePagina === id
              ? { backgroundColor: 'var(--pos-amber)', color: 'var(--pos-amber-t)', boxShadow: '0 4px 14px var(--pos-shadow-amber)' }
              : { color: 'var(--pos-t3)' }
            }
            onMouseEnter={(e) => { if (huidigePagina !== id) { e.currentTarget.style.backgroundColor = 'var(--pos-hover)'; e.currentTarget.style.color = 'var(--pos-t1)' } }}
            onMouseLeave={(e) => { if (huidigePagina !== id) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--pos-t3)' } }}
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && (
              <span className="font-semibold text-sm truncate">{label}</span>
            )}
            {!collapsed && id === 'rapportages' && pendingSyncCount > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {pendingSyncCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Install PWA button ── */}
      {installPrompt && (
        <div className="px-2 pb-1">
          <button
            onClick={() => { void installPrompt.prompt(); setInstallPrompt(null) }}
            title="App installeren"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-150 active:scale-95 ${collapsed ? 'justify-center' : ''}`}
            style={{ color: 'var(--pos-t3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--pos-hover)'; e.currentTarget.style.color = 'var(--pos-t1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--pos-t3)' }}
          >
            <Download size={18} className="shrink-0" />
            {!collapsed && (
              <span className="font-medium text-sm truncate">App installeren</span>
            )}
          </button>
        </div>
      )}

      {/* ── Employee section ── */}
      <div className="mt-auto px-2 pt-3" style={{ borderTop: '1px solid var(--pos-border)' }}>
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--pos-tlabel)' }}>
            Medewerker
          </p>
        )}

        <div className={`flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
          {medewerkers.map((m) => {
            const isActive = m.id === activeMedewerkerId
            return (
              <button
                key={m.id}
                onClick={() => {
                  const newId = isActive ? null : m.id
                  setActiveMedewerker(newId)
                  if (newId) {
                    void laadMedewerkerCart(newId)
                  } else {
                    void ontkoppelMedewerker()
                  }
                }}
                title={collapsed ? m.naam : undefined}
                className={`flex items-center gap-2.5 rounded-xl transition-all duration-150 active:scale-95 min-h-[40px] ${
                  collapsed ? 'justify-center w-10 h-10 p-0' : 'px-2 py-2 w-full'
                }`}
                style={isActive ? { outline: `2px solid ${m.kleur}`, outlineOffset: '2px', borderRadius: '12px' } : {}}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--pos-hover)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '' }}
              >
                <span
                  className={`shrink-0 flex items-center justify-center rounded-lg font-bold text-white text-xs leading-none ${
                    collapsed ? 'w-9 h-9' : 'w-7 h-7'
                  }`}
                  style={{ backgroundColor: m.kleur }}
                >
                  {m.initialen}
                </span>
                {!collapsed && (
                  <span className="text-xs font-medium truncate" style={{ color: isActive ? 'var(--pos-t1)' : 'var(--pos-t2)' }}>
                    {m.naam.split(' ')[0]}
                  </span>
                )}
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {!collapsed && activeMedewerker && (
          <p className="text-[10px] mt-2 px-1 truncate" style={{ color: 'var(--pos-t3)' }}>
            Actief: {activeMedewerker.naam}
          </p>
        )}

        {/* Wissel medewerker knop met inline bevestiging */}
        <button
          onClick={() => wisselBevestig ? sluitApplicatie() : setWisselBevestig(true)}
          title={collapsed ? (wisselBevestig ? 'Zeker weten?' : 'POS Afsluiten') : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full mt-2 transition-all duration-150 active:scale-95 ${collapsed ? 'justify-center' : ''} ${
            wisselBevestig ? 'bg-red-950/60 text-red-400 hover:bg-red-900/60' : ''
          }`}
          style={wisselBevestig ? {} : { color: 'var(--pos-t3)' }}
          onMouseEnter={(e) => { if (!wisselBevestig) { e.currentTarget.style.backgroundColor = 'var(--pos-hover)'; e.currentTarget.style.color = 'var(--pos-t1)' } }}
          onMouseLeave={(e) => { if (!wisselBevestig) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--pos-t3)' } }}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && (
            <span className="font-medium text-xs truncate">
              {wisselBevestig ? 'Zeker weten?' : 'POS Afsluiten'}
            </span>
          )}
          {!collapsed && wisselBevestig && (
            <Check size={14} className="ml-auto shrink-0 text-red-400" />
          )}
        </button>
      </div>
    </aside>
  )
}

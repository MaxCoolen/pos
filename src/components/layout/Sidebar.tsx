import { useEffect, useState } from 'react'
import { LayoutGrid, Package, BarChart2, Settings, ChevronLeft, ChevronRight, Tag, Monitor, LogOut, Download } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useInstellingenStore } from '../../store/useInstellingenStore'
import { usePersoneelStore } from '../../store/usePersoneelStore'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
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
  const uitloggen = useAuthStore((s) => s.uitloggen)

  const collapsed = sidebarIngeklapt
  const activeMedewerker = medewerkers.find((m) => m.id === activeMedewerkerId) ?? null

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

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
      } transition-all duration-300 bg-slate-950 flex flex-col py-4 shrink-0 border-r border-white/[0.04] overflow-hidden`}
    >
      {/* ── Header: single logo + toggle ── */}
      <div className={`flex items-center mb-4 px-3 ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>

        {/* Collapsed: icon only */}
        {collapsed ? (
          <>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/60 shrink-0 overflow-hidden">
              {logo
                ? <img src={logo} alt={bedrijfsnaam} className="w-full h-full object-contain p-1" />
                : <LayoutGrid size={17} className="text-white" />
              }
            </div>
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/[0.08] hover:text-white transition-colors"
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
                    <p className="text-white font-black text-[14px] leading-none tracking-tight truncate">
                      {bedrijfsnaam}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Kassasysteem</p>
                  </div>
                </>
              ) : (
                /* No logo: blue icon + company name text */
                <>
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/60 shrink-0">
                    <LayoutGrid size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-black text-[15px] leading-none tracking-tight truncate">
                      {bedrijfsnaam}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Kassasysteem</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/[0.08] hover:text-white transition-colors shrink-0"
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
            } ${
              huidigePagina === id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && (
              <span className="font-semibold text-sm truncate">{label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Customer Display button ── */}
      <div className="px-2 pb-1">
        <button
          onClick={() => window.open('/customer-display', '_blank')}
          title="Customer Display"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-150 active:scale-95 text-slate-400 hover:bg-white/[0.07] hover:text-white ${collapsed ? 'justify-center' : ''}`}
        >
          <Monitor size={18} className="shrink-0" />
          {!collapsed && (
            <span className="font-medium text-sm truncate">Customer Display</span>
          )}
        </button>
      </div>

      {/* ── Install PWA button ── */}
      {installPrompt && (
        <div className="px-2 pb-1">
          <button
            onClick={() => { void installPrompt.prompt(); setInstallPrompt(null) }}
            title="App installeren"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-150 active:scale-95 text-slate-400 hover:bg-white/[0.07] hover:text-white ${collapsed ? 'justify-center' : ''}`}
          >
            <Download size={18} className="shrink-0" />
            {!collapsed && (
              <span className="font-medium text-sm truncate">App installeren</span>
            )}
          </button>
        </div>
      )}

      {/* ── Employee section ── */}
      <div className="mt-auto px-2 pt-3 border-t border-white/[0.06]">
        {!collapsed && (
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">
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
                } ${isActive ? '' : 'hover:bg-white/[0.05]'}`}
                style={isActive ? { outline: `2px solid ${m.kleur}`, outlineOffset: '2px', borderRadius: '12px' } : {}}
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
                  <span className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
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
          <p className="text-[10px] text-slate-600 mt-2 px-1 truncate">
            Actief: {activeMedewerker.naam}
          </p>
        )}

        {/* Logout button */}
        <button
          onClick={uitloggen}
          title="Uitloggen"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full mt-2 transition-all duration-150 active:scale-95 text-slate-600 hover:bg-white/[0.07] hover:text-slate-300 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="font-medium text-xs truncate">Uitloggen</span>}
        </button>
      </div>
    </aside>
  )
}

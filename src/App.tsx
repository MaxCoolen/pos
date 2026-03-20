import { useEffect, useState } from 'react'
import { useCartStore } from './store/useCartStore'
import { useProductStore } from './store/useProductStore'
import { useCategorieStore } from './store/useCategorieStore'
import { useKortingStore } from './store/useKortingStore'
import { usePersoneelStore } from './store/usePersoneelStore'
import { useInstellingenStore, berekenActiefThema } from './store/useInstellingenStore'
import { useTransactieStore } from './store/useTransactieStore'
import { KLANTENDISP_KEY } from './pages/CustomerDisplayPage'
import { Sidebar } from './components/layout/Sidebar'
import { POSPage } from './pages/POSPage'
import { ProductbeheerPage } from './pages/ProductbeheerPage'
import { RapportagesPage } from './pages/RapportagesPage'
import { InstellingenPage } from './pages/InstellingenPage'
import { EtikettenPage } from './pages/EtikettenPage'
import { LoginPage } from './pages/LoginPage'
import { EmployeeSelectPage } from './pages/EmployeeSelectPage'
import { useAppStore } from './store/useAppStore'
import { useAuthStore } from './store/useAuthStore'
import { BetalingModal } from './components/BetalingModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { supabase, supabaseIsConfigured } from './lib/supabase'
import { openKlantenscherm, isKlantenschermOpen, detecteerSchermen } from './utils/schermBeheer'

function Layout() {
  const huidigePagina = useAppStore((s) => s.huidigePagina)
  const thema = useInstellingenStore((s) => s.thema)

  // Sync cart state to localStorage so the Customer Display tab can read it
  useEffect(() => {
    localStorage.setItem(KLANTENDISP_KEY, JSON.stringify(useCartStore.getState().items))
    const unsubCart = useCartStore.subscribe((state) => {
      localStorage.setItem(KLANTENDISP_KEY, JSON.stringify(state.items))
    })
    return () => {
      unsubCart()
      localStorage.removeItem(KLANTENDISP_KEY)
    }
  }, [])

  // Pas thema toe op <html> — inclusief automatische modus op basis van systeemtijd
  useEffect(() => {
    function pasThemaToe() {
      const actief = berekenActiefThema(thema)
      document.documentElement.classList.toggle('dark', actief === 'dark')
    }
    pasThemaToe()
    // Bij 'auto': hercheck elk uur zodat de modus automatisch wisselt
    if (thema === 'auto') {
      const interval = setInterval(pasThemaToe, 60 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [thema])

  return (
    <div className="flex h-screen bg-[#090B10] overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Sidebar />

      <main className="flex flex-1 overflow-hidden">
        {huidigePagina === 'pos' && <POSPage />}
        {huidigePagina === 'productbeheer' && <ProductbeheerPage />}
        {huidigePagina === 'rapportages' && <RapportagesPage />}
        {huidigePagina === 'etiketten' && <EtikettenPage />}
        {huidigePagina === 'instellingen' && <InstellingenPage />}
      </main>

      {/* Payment modal — rendered at root level so it overlays everything */}
      <BetalingModal />
    </div>
  )
}

export default function App() {
  const currentStoreId = useAppStore((s) => s.currentStoreId)
  const setCurrentStoreId = useAppStore((s) => s.setCurrentStoreId)
  const { session, laden: authLaden, initialiseer } = useAuthStore()
  const activeMedewerkerId = usePersoneelStore((s) => s.activeMedewerkerId)
  const [storeResolved, setStoreResolved] = useState(false)

  // Restore persisted auth session on first mount
  useEffect(() => {
    void initialiseer()
  }, [initialiseer])

  // After login, auto-select store: use remembered device store, or pick the first available
  useEffect(() => {
    if (!session) return
    if (currentStoreId) { setStoreResolved(true); return }

    const remembered = localStorage.getItem('pos-device-store')

    // Auto-pick store from Supabase, validating any remembered store ID
    if (supabase) {
      supabase.from('stores').select('id').eq('aktief', true).order('aangemaakt')
        .then(({ data }) => {
          const ids = (data ?? []).map((s) => s.id as string)
          const valid = remembered && ids.includes(remembered) ? remembered : ids[0] ?? null
          if (valid) {
            localStorage.setItem('pos-device-store', valid)
            setCurrentStoreId(valid)
          } else {
            localStorage.removeItem('pos-device-store')
          }
          setStoreResolved(true)
        })
    } else {
      setStoreResolved(true)
    }
  }, [session, currentStoreId, setCurrentStoreId])

  // Auto-open klantenscherm op 2e scherm als de instelling aan staat
  useEffect(() => {
    if (!currentStoreId) return
    const { klantenschermAutoOpen } = useInstellingenStore.getState()
    if (!klantenschermAutoOpen || isKlantenschermOpen()) return
    void detecteerSchermen().then((aantal) => {
      if (aantal >= 2) void openKlantenscherm()
    })
  }, [currentStoreId])

  // When a store is selected, initialise all data stores immediately
  // (must run here, not in Layout, so employees are ready before EmployeeSelectPage renders)
  useEffect(() => {
    if (!currentStoreId) return
    void useProductStore.getState().initialiseer(currentStoreId)
    void useCategorieStore.getState().initialiseer(currentStoreId)
    void useKortingStore.getState().initialiseer(currentStoreId)
    void usePersoneelStore.getState().initialiseer(currentStoreId)
    void useInstellingenStore.getState().initialiseer(currentStoreId)
    void useTransactieStore.getState().initialiseer(currentStoreId)
  }, [currentStoreId])

  if (!supabaseIsConfigured) {
    return (
      <ErrorBoundary>
        <Layout />
      </ErrorBoundary>
    )
  }

  // Still restoring session from localStorage
  if (authLaden) return null

  // Not logged in → show login
  if (!session) {
    return (
      <ErrorBoundary>
        <LoginPage />
      </ErrorBoundary>
    )
  }

  // Resolving store (auto-picking from Supabase or localStorage)
  if (!storeResolved) return null

  // Store selected but no employee chosen
  if (!activeMedewerkerId) {
    return (
      <ErrorBoundary>
        <EmployeeSelectPage />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <Layout />
    </ErrorBoundary>
  )
}

import { useEffect } from 'react'
import { useCartStore } from './store/useCartStore'
import { useProductStore } from './store/useProductStore'
import { useCategorieStore } from './store/useCategorieStore'
import { useKortingStore } from './store/useKortingStore'
import { usePersoneelStore } from './store/usePersoneelStore'
import { useInstellingenStore } from './store/useInstellingenStore'
import { useTransactieStore } from './store/useTransactieStore'
import { KLANTENDISP_KEY } from './pages/CustomerDisplayPage'
import { Sidebar } from './components/layout/Sidebar'
import { POSPage } from './pages/POSPage'
import { ProductbeheerPage } from './pages/ProductbeheerPage'
import { RapportagesPage } from './pages/RapportagesPage'
import { InstellingenPage } from './pages/InstellingenPage'
import { EtikettenPage } from './pages/EtikettenPage'
import { StoreSelectPage } from './pages/StoreSelectPage'
import { LoginPage } from './pages/LoginPage'
import { EmployeeSelectPage } from './pages/EmployeeSelectPage'
import { useAppStore } from './store/useAppStore'
import { useAuthStore } from './store/useAuthStore'
import { BetalingModal } from './components/BetalingModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { supabaseIsConfigured } from './lib/supabase'

function Layout() {
  const huidigePagina = useAppStore((s) => s.huidigePagina)
  const currentStoreId = useAppStore((s) => s.currentStoreId)
  const darkMode = useInstellingenStore((s) => s.darkMode)

  // When currentStoreId is set, initialise all stores with Supabase data + subscriptions
  useEffect(() => {
    if (!currentStoreId) return
    void useProductStore.getState().initialiseer(currentStoreId)
    void useCategorieStore.getState().initialiseer(currentStoreId)
    void useKortingStore.getState().initialiseer(currentStoreId)
    void usePersoneelStore.getState().initialiseer(currentStoreId)
    void useInstellingenStore.getState().initialiseer(currentStoreId)
    void useTransactieStore.getState().initialiseer(currentStoreId)
  }, [currentStoreId])

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

  // Sync dark mode preference to <html> element so Tailwind dark: variants activate
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 font-sans overflow-hidden">
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
  const { session, laden: authLaden, initialiseer } = useAuthStore()
  const activeMedewerkerId = usePersoneelStore((s) => s.activeMedewerkerId)

  // Restore persisted auth session on first mount
  useEffect(() => {
    void initialiseer()
  }, [initialiseer])

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

  // Logged in but no store selected
  if (!currentStoreId) {
    return (
      <ErrorBoundary>
        <StoreSelectPage />
      </ErrorBoundary>
    )
  }

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

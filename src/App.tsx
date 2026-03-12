import { useEffect } from 'react'
import { useCartStore } from './store/useCartStore'
import { KLANTENDISP_KEY } from './pages/CustomerDisplayPage'
import { Sidebar } from './components/layout/Sidebar'
import { POSPage } from './pages/POSPage'
import { ProductbeheerPage } from './pages/ProductbeheerPage'
import { RapportagesPage } from './pages/RapportagesPage'
import { InstellingenPage } from './pages/InstellingenPage'
import { EtikettenPage } from './pages/EtikettenPage'
import { useAppStore } from './store/useAppStore'
import { useInstellingenStore } from './store/useInstellingenStore'
import { BetalingModal } from './components/BetalingModal'
import { ErrorBoundary } from './components/ErrorBoundary'

function Layout() {
  const huidigePagina = useAppStore((s) => s.huidigePagina)
  const darkMode = useInstellingenStore((s) => s.darkMode)

  // Sync cart state to localStorage so the Customer Display tab can read it
  useEffect(() => {
    // Write initial state immediately
    localStorage.setItem(KLANTENDISP_KEY, JSON.stringify(useCartStore.getState().items))
    // Subscribe to all future changes
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
  return (
    <ErrorBoundary>
      <Layout />
    </ErrorBoundary>
  )
}

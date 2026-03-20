import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { CustomerDisplayPage } from './pages/CustomerDisplayPage'

// Detecteer klantenscherm via pathname (browser/Electron dev) of hash (Electron productie)
const isKlantenscherm =
  window.location.pathname === '/customer-display' ||
  window.location.hash === '#klantenscherm'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isKlantenscherm ? <CustomerDisplayPage /> : <App />}
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { CustomerDisplayPage } from './pages/CustomerDisplayPage'

const isKlantenscherm = window.location.pathname === '/customer-display'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isKlantenscherm ? <CustomerDisplayPage /> : <App />}
  </StrictMode>,
)

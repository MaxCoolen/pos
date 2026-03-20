// Abstractielaag voor klantenscherm-beheer.
// Controleert bij elke aanroep of window.electronAPI beschikbaar is:
//   - Electron → IPC naar main process
//   - Browser  → window.open() fallback

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const electron = () => (window as any).electronAPI as {
  openKlantenscherm:  () => Promise<{ success: boolean }>
  sluitKlantenscherm: () => Promise<{ success: boolean }>
  detecteerSchermen:  () => Promise<number>
  isElectron: true
} | undefined

// Browser-only state (irrelevant in Electron, main process beheert de vensters)
let browserVenster: Window | null = null

/**
 * Opent het klantenscherm.
 * TODO Electron: BrowserWindow wordt aangemaakt in main.cjs via IPC
 */
export async function openKlantenscherm(): Promise<{ geopend: boolean; wasAlOpen: boolean }> {
  const api = electron()
  if (api) {
    await api.openKlantenscherm()
    return { geopend: true, wasAlOpen: false }
  }
  // Browser fallback
  if (browserVenster && !browserVenster.closed) {
    browserVenster.focus()
    return { geopend: true, wasAlOpen: true }
  }
  browserVenster = window.open(
    '/customer-display',
    'klantenscherm',
    'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no'
  )
  return { geopend: !!browserVenster, wasAlOpen: false }
}

/**
 * Sluit het klantenscherm.
 * TODO Electron: BrowserWindow.close() via IPC in main.cjs
 */
export async function sluitKlantenscherm(): Promise<void> {
  const api = electron()
  if (api) {
    await api.sluitKlantenscherm()
    return
  }
  // Browser fallback
  if (browserVenster && !browserVenster.closed) {
    browserVenster.close()
  }
  browserVenster = null
}

/**
 * Geeft true als het klantenscherm open is.
 * In Electron wordt dit bijgehouden in main.cjs — browser-side altijd false na reload.
 * TODO Electron: voeg ipcRenderer.invoke('is-klantenscherm-open') toe indien nodig
 */
export function isKlantenschermOpen(): boolean {
  const api = electron()
  if (api) return false // main process beheert state; geen synchrone check mogelijk
  return !!(browserVenster && !browserVenster.closed)
}

/**
 * Detecteert het aantal beschikbare schermen.
 * TODO Electron: screen.getAllDisplays().length via IPC in main.cjs
 */
export async function detecteerSchermen(): Promise<number> {
  const api = electron()
  if (api) {
    return api.detecteerSchermen()
  }
  // Browser: Window Management API (Chrome 100+, vereist permissie)
  if ('getScreenDetails' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const details = await (window as any).getScreenDetails() as { screens: unknown[] }
      return details.screens.length
    } catch {
      // Permissie geweigerd — fall through
    }
  }
  // Fallback: isExtended
  if ('isExtended' in window.screen) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window.screen as any).isExtended ? 2 : 1
  }
  return 1
}

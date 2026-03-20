'use strict'

const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

// Voorkom crashes bij Supabase realtime websockets
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

const isDev = !app.isPackaged

let mainWindow = null
let klantenschermWindow = null

// ─── Hoofdvenster (POS) ──────────────────────────────────────────────────────

function createMainWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // App volledig afsluiten als het hoofdvenster gesloten wordt
  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })
}

// ─── Klantenscherm ───────────────────────────────────────────────────────────

function openKlantenscherm() {
  if (klantenschermWindow && !klantenschermWindow.isDestroyed()) {
    klantenschermWindow.focus()
    return
  }

  // Zoek het 2e scherm; valt terug op het primaire scherm als er maar 1 is
  const displays = screen.getAllDisplays()
  const primair = screen.getPrimaryDisplay()
  const doelScherm = displays.find((d) => d.id !== primair.id) ?? primair

  klantenschermWindow = new BrowserWindow({
    x: doelScherm.bounds.x,
    y: doelScherm.bounds.y,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    klantenschermWindow.loadURL('http://localhost:5173/customer-display')
  } else {
    // Hash-gebaseerde routing voor file:// protocol
    klantenschermWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: 'klantenscherm',
    })
  }

  klantenschermWindow.on('closed', () => {
    klantenschermWindow = null
  })
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('open-klantenscherm', () => {
  openKlantenscherm()
  return { success: true }
})

ipcMain.handle('sluit-klantenscherm', () => {
  if (klantenschermWindow && !klantenschermWindow.isDestroyed()) {
    klantenschermWindow.close()
    klantenschermWindow = null
  }
  return { success: true }
})

ipcMain.handle('detecteer-schermen', () => {
  return screen.getAllDisplays().length
})

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

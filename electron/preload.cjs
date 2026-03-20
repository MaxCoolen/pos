'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openKlantenscherm:  () => ipcRenderer.invoke('open-klantenscherm'),
  sluitKlantenscherm: () => ipcRenderer.invoke('sluit-klantenscherm'),
  detecteerSchermen:  () => ipcRenderer.invoke('detecteer-schermen'),
  isElectron: true,
})

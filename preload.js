const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File ops
  saveFile: (args) => ipcRenderer.invoke('save-file', args),
  saveFileAs: (args) => ipcRenderer.invoke('save-file-as', args),

  // AI
  ollamaCall: (args) => ipcRenderer.invoke('ollama-call', args),
  ollamaModels: () => ipcRenderer.invoke('ollama-models'),

  // Menu events → renderer
  onMenuNew: (cb) => ipcRenderer.on('menu-new', cb),
  onMenuSave: (cb) => ipcRenderer.on('menu-save', cb),
  onMenuSaveAs: (cb) => ipcRenderer.on('menu-save-as', cb),
  onFileOpened: (cb) => ipcRenderer.on('file-opened', (_e, data) => cb(data)),
  onAIFix: (cb) => ipcRenderer.on('ai-fix', (_e, type) => cb(type)),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

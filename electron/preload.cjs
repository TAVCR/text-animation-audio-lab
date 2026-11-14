const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopFonts', {
  getFamilies: () => ipcRenderer.invoke('desktop-fonts:list'),
});

contextBridge.exposeInMainWorld('gpuDiagnostics', {
  getFeatureStatus: () => ipcRenderer.invoke('gpu:feature-status'),
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopTeleprompter', {
  getSources: () => ipcRenderer.invoke('sources:list'),
  setClickThrough: enabled => ipcRenderer.invoke('window:click-through', !!enabled),
  arrangeSelectedWindow: sourceId => ipcRenderer.invoke('window:arrange-target', sourceId),
  restoreArrangement: () => ipcRenderer.invoke('window:restore-target'),
  sendPresentationKey: key => ipcRenderer.invoke('window:send-key', key),
  minimise: () => ipcRenderer.invoke('window:minimise'),
  toggleMaximise: () => ipcRenderer.invoke('window:toggle-maximise'),
  close: () => ipcRenderer.invoke('window:close'),
  onClickThroughChanged: callback => {
    ipcRenderer.on('window:click-through-changed', (_event, enabled) => callback(enabled));
  }
});

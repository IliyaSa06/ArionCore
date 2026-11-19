'use strict';
const { contextBridge, ipcRenderer } = require('electron');

let seq = 0;

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setKey: (k) => ipcRenderer.invoke('settings:setKey', k),
  clearKey: () => ipcRenderer.invoke('settings:clearKey'),
  setModel: (m) => ipcRenderer.invoke('settings:setModel', m),
  testKey: () => ipcRenderer.invoke('claude:test'),
  abort: (id) => ipcRenderer.invoke('claude:abort', id),
  /* chat(req, { onDelta(text), onTool(name, input) -> string }) -> { id, promise } */
  chat(req, h) {
    const id = 'r' + Date.now() + '-' + (++seq);
    const onDelta = (_e, m) => { if (m && m.requestId === id && h && h.onDelta) h.onDelta(m.text); };
    const onTool = async (_e, m) => {
      if (!m || m.requestId !== id) return;
      let out;
      try {
        const r = h && h.onTool ? await h.onTool(m.name, m.input || {}) : '';
        out = { content: String(r), isError: false };
      } catch (e) {
        out = { content: 'Error: ' + ((e && e.message) || e), isError: true };
      }
      ipcRenderer.invoke('claude:tool-result', { requestId: id, toolUseId: m.toolUseId, content: out.content, isError: out.isError });
    };
    ipcRenderer.on('claude:delta', onDelta);
    ipcRenderer.on('claude:tool-call', onTool);
    const promise = ipcRenderer.invoke('claude:chat', Object.assign({}, req, { requestId: id })).finally(() => {
      ipcRenderer.removeListener('claude:delta', onDelta);
      ipcRenderer.removeListener('claude:tool-call', onTool);
    });
    return { id, promise };
  }
});

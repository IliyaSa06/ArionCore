'use strict';
const { app, BrowserWindow, ipcMain, safeStorage, Menu, session } = require('electron');
const path = require('path');
const fs = require('fs');
const claude = require('./claude');

const MODELS = ['claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-opus-5-5'];
let settings = { model: MODELS[0], keyEnc: null };
let memKey = null; /* used only when OS encryption is unavailable: lives for this session */
const inflight = new Map(); /* requestId -> AbortController */
const pendingTools = new Map(); /* requestId:toolUseId -> resolve */
let win = null;

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
function loadSettings() {
  try { settings = Object.assign(settings, JSON.parse(fs.readFileSync(settingsFile(), 'utf8'))); } catch (_) { /* first run */ }
}
function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify(settings));
  } catch (_) { /* ignore */ }
}
function getKey() {
  if (memKey) return memKey;
  if (settings.keyEnc && safeStorage.isEncryptionAvailable()) {
    try { return safeStorage.decryptString(Buffer.from(settings.keyEnc, 'base64')); } catch (_) { return null; }
  }
  return null;
}
function trusted(e) {
  try { return new URL(e.senderFrame.url).protocol === 'file:'; } catch (_) { return false; }
}
function publicSettings() {
  const k = getKey();
  return {
    hasKey: !!k,
    keyHint: k ? '••••' + k.slice(-4) : '',
    persisted: !!(settings.keyEnc && safeStorage.isEncryptionAvailable()),
    encryption: safeStorage.isEncryptionAvailable(),
    model: settings.model,
    models: MODELS
  };
}

function cleanRequest(req) {
  if (!req || typeof req !== 'object') throw new Error('bad request');
  const str = (v, max) => String(v == null ? '' : v).slice(0, max);
  const messages = (Array.isArray(req.messages) ? req.messages : []).slice(-40).map((m) => ({
    role: m && m.role === 'assistant' ? 'assistant' : 'user',
    content: str(m && m.content, 20000)
  })).filter((m) => m.content);
  if (!messages.length || messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') throw new Error('messages must start and end with a user turn');
  const tools = (Array.isArray(req.tools) ? req.tools : []).slice(0, 12).map((t) => ({
    name: str(t.name, 64).replace(/[^A-Za-z0-9_-]/g, '_'),
    description: str(t.description, 1000),
    input_schema: t.input_schema && typeof t.input_schema === 'object' ? t.input_schema : { type: 'object', properties: {} }
  }));
  return { system: str(req.system, 30000), messages, tools, maxTokens: Math.max(64, Math.min(2048, +req.maxTokens || 900)) };
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#0A2540',
    title: 'ArionCore',
    icon: path.join(__dirname, 'renderer', 'brand', 'icon-256.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });
  win.removeMenu();
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  if (process.env.ATLAS_SELFTEST) {
    try { require('./selftest.js')(win, app); } catch (e) { console.error('selftest load failed', e); }
  }
}

ipcMain.handle('settings:get', (e) => (trusted(e) ? publicSettings() : null));
ipcMain.handle('settings:setKey', (e, key) => {
  if (!trusted(e)) return { ok: false, error: 'untrusted' };
  key = String(key || '').trim();
  if (key.length < 20 || /\s/.test(key)) return { ok: false, error: 'format' };
  if (safeStorage.isEncryptionAvailable()) {
    settings.keyEnc = safeStorage.encryptString(key).toString('base64');
    memKey = null;
    saveSettings();
  } else {
    memKey = key;
    settings.keyEnc = null;
    saveSettings();
  }
  return { ok: true, settings: publicSettings() };
});
ipcMain.handle('settings:clearKey', (e) => {
  if (!trusted(e)) return null;
  memKey = null;
  settings.keyEnc = null;
  saveSettings();
  return publicSettings();
});
ipcMain.handle('settings:setModel', (e, m) => {
  if (!trusted(e)) return false;
  if (typeof m === 'string' && /^[A-Za-z0-9._-]{3,64}$/.test(m)) { settings.model = m; saveSettings(); return true; }
  return false;
});

ipcMain.handle('claude:tool-result', (e, r) => {
  if (!trusted(e) || !r) return false;
  const k = r.requestId + ':' + r.toolUseId;
  const res = pendingTools.get(k);
  if (res) { pendingTools.delete(k); res({ content: String(r.content == null ? '' : r.content), isError: !!r.isError }); }
  return true;
});
ipcMain.handle('claude:abort', (e, id) => {
  if (!trusted(e)) return false;
  const c = inflight.get(id);
  if (c) c.abort();
  return true;
});

ipcMain.handle('claude:test', async (e) => {
  if (!trusted(e)) return { ok: false, error: { code: 'untrusted', message: '' } };
  const key = getKey();
  if (!key) return { ok: false, error: { code: 'no_key', message: 'No key saved' } };
  try {
    await claude.runChat({
      key, model: settings.model, system: 'Reply with the single word OK.',
      messages: [{ role: 'user', content: 'ping' }], tools: [], maxTokens: 16,
      signal: AbortSignal.timeout(20000), onText: () => {}, runTool: async () => ({ content: '' })
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: { code: err.code || 'unknown', message: String(err.message || err) } };
  }
});

ipcMain.handle('claude:chat', async (e, req) => {
  if (!trusted(e)) return { error: { code: 'untrusted', message: '' } };
  const key = getKey();
  if (!key) return { error: { code: 'no_key', message: 'No API key saved' } };
  let clean;
  try { clean = cleanRequest(req); } catch (err) { return { error: { code: 'bad_request', message: String(err.message) } }; }
  const requestId = String(req.requestId || '');
  const ctrl = new AbortController();
  inflight.set(requestId, ctrl);
  const sender = e.sender;
  const send = (ch, payload) => { if (!sender.isDestroyed()) sender.send(ch, payload); };
  try {
    const r = await claude.runChat({
      key,
      model: settings.model,
      system: clean.system,
      messages: clean.messages,
      tools: clean.tools,
      maxTokens: clean.maxTokens,
      signal: ctrl.signal,
      onText: (text) => send('claude:delta', { requestId, text }),
      runTool: (u) => new Promise((resolve) => {
        const k = requestId + ':' + u.id;
        const t = setTimeout(() => { pendingTools.delete(k); resolve({ content: 'Error: tool timed out', isError: true }); }, 20000);
        pendingTools.set(k, (v) => { clearTimeout(t); resolve(v); });
        send('claude:tool-call', { requestId, toolUseId: u.id, name: u.name, input: u.input });
      })
    });
    return { text: r.text, truncated: r.truncated };
  } catch (err) {
    return { error: { code: err.code || 'unknown', message: String(err.message || err) } };
  } finally {
    inflight.delete(requestId);
  }
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    loadSettings();
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}

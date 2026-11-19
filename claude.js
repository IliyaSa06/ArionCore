'use strict';
/* Streaming client for the Anthropic Messages API, with a tool-use loop.
   Pure Node (no Electron imports) so it can be tested on its own.
   The API key is passed in per call and never leaves the main process. */

const API_BASE = () => process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const MAX_ROUNDS = 6;

class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function mapStatus(status, body) {
  const msg = (body && body.error && body.error.message) || ('HTTP ' + status);
  if (status === 401 || status === 403) return new ApiError('invalid_key', msg, status);
  if (status === 404) return new ApiError('bad_model', msg, status);
  if (status === 429) return new ApiError('rate_limited', msg, status);
  if (status === 400) return new ApiError('bad_request', msg, status);
  if (status >= 500) return new ApiError('upstream', msg, status);
  return new ApiError('unknown', msg, status);
}

async function streamOnce(opts, onText) {
  const { key, model, system, messages, tools, maxTokens, signal } = opts;
  const body = { model, max_tokens: maxTokens || 1024, system, messages, stream: true };
  if (tools && tools.length) body.tools = tools;

  let res;
  try {
    res = await fetch(API_BASE() + '/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    if (e && e.name === 'AbortError') throw new ApiError('cancelled', 'cancelled');
    throw new ApiError('network', String((e && e.message) || e));
  }
  if (!res.ok) {
    let j = null;
    try { j = await res.json(); } catch (_) { /* ignore */ }
    throw mapStatus(res.status, j);
  }

  const blocks = [];
  let stop = null;

  const handle = (ev, data) => {
    if (ev === 'content_block_start') {
      const cb = data.content_block || {};
      if (cb.type === 'text') blocks[data.index] = { type: 'text', text: '' };
      else if (cb.type === 'tool_use') blocks[data.index] = { type: 'tool_use', id: cb.id, name: cb.name, input: {}, _json: '' };
      else blocks[data.index] = { type: cb.type || 'other' };
    } else if (ev === 'content_block_delta') {
      const b = blocks[data.index];
      const d = data.delta || {};
      if (!b) return;
      if (d.type === 'text_delta' && b.type === 'text') {
        b.text += d.text;
        if (d.text) onText(d.text);
      } else if (d.type === 'input_json_delta' && b.type === 'tool_use') {
        b._json += d.partial_json || '';
      }
    } else if (ev === 'content_block_stop') {
      const b = blocks[data.index];
      if (b && b.type === 'tool_use') {
        try { b.input = b._json ? JSON.parse(b._json) : {}; } catch (_) { b.input = {}; }
      }
    } else if (ev === 'message_delta') {
      if (data.delta && data.delta.stop_reason) stop = data.delta.stop_reason;
    } else if (ev === 'error') {
      throw new ApiError('upstream', (data.error && data.error.message) || 'stream error');
    }
  };

  const dec = new TextDecoder();
  let buf = '';
  try {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const raw = buf.slice(0, i);
        buf = buf.slice(i + 2);
        let ev = 'message';
        let dataStr = '';
        raw.split('\n').forEach((line) => {
          if (line.startsWith('event:')) ev = line.slice(6).trim();
          else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
        });
        if (!dataStr) continue;
        let data;
        try { data = JSON.parse(dataStr); } catch (_) { continue; }
        handle(ev, data);
      }
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e && e.name === 'AbortError') throw new ApiError('cancelled', 'cancelled');
    throw new ApiError('network', String((e && e.message) || e));
  }

  const content = blocks
    .filter((b) => b && ((b.type === 'text' && b.text) || b.type === 'tool_use'))
    .map((b) => (b.type === 'text' ? { type: 'text', text: b.text } : { type: 'tool_use', id: b.id, name: b.name, input: b.input }));
  return { content, stop_reason: stop };
}

/* runChat: calls the model, runs requested tools through runTool(), repeats.
   Resolves { text, truncated }. */
async function runChat(opts) {
  const { key, model, system, messages, tools, maxTokens, signal, onText, runTool } = opts;
  const msgs = messages.map((m) => ({ role: m.role, content: m.content }));
  let out = '';
  let sep = false;
  let truncated = false;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await streamOnce({ key, model, system, messages: msgs, tools, maxTokens, signal }, (t) => {
      if (sep) { out += '\n\n'; onText('\n\n'); sep = false; }
      out += t;
      onText(t);
    });
    if (res.stop_reason === 'max_tokens') truncated = true;
    if (res.stop_reason !== 'tool_use') break;
    msgs.push({ role: 'assistant', content: res.content });
    const results = [];
    for (const u of res.content.filter((b) => b.type === 'tool_use')) {
      let r;
      try { r = await runTool(u); } catch (e) { r = { content: 'Error: ' + ((e && e.message) || e), isError: true }; }
      results.push({ type: 'tool_result', tool_use_id: u.id, content: String(r.content).slice(0, 8000), is_error: !!r.isError });
    }
    msgs.push({ role: 'user', content: results });
    if (out) sep = true;
  }
  return { text: out.trim(), truncated };
}

module.exports = { runChat, streamOnce, ApiError };

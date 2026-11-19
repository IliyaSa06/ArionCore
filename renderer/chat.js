/* Chat panel backed by window.api.chat (Claude API through the main process).
   One conversation per mode is kept in memory so it survives page switches. */
(function (A) {
'use strict';
var store = {};
function errText(code) {
  var L = A.L;
  var m = {
    no_key: L('کلید API ذخیره نشده. از بخش «تنظیمات» کلید خودت را وارد کن.', 'No API key saved. Enter your own key in Settings.'),
    invalid_key: L('کلید API معتبر نیست یا دسترسی ندارد. در «تنظیمات» بررسی‌اش کن.', 'The API key is invalid or lacks access. Check it in Settings.'),
    bad_model: L('مدل انتخاب‌شده برای این کلید در دسترس نیست. در «تنظیمات» مدل دیگری انتخاب کن.', 'The selected model is not available for this key. Choose another in Settings.'),
    rate_limited: L('درخواست‌ها زیاد شد یا سهمیه‌ی حسابت تمام شده. کمی بعد دوباره امتحان کن.', 'Too many requests or your quota is used up. Try again shortly.'),
    network: L('اتصال اینترنت یا دسترسی به api.anthropic.com برقرار نشد.', 'Could not reach the internet or api.anthropic.com.'),
    upstream: L('سرویس Claude الان مشکل دارد. چند لحظه بعد دوباره بفرست.', 'The Claude service has a problem right now. Try again in a moment.'),
    bad_request: L('درخواست پذیرفته نشد. پیام را کوتاه‌تر یا ساده‌تر بنویس.', 'The request was not accepted. Make the message shorter or simpler.')
  };
  return m[code] || null;
}

function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

/* cfg: { mode, title, placeholder, suggestions[], greeting, system(), tools(), runTool(name,input), local(q) }  */
A.resetChats = function () { Object.keys(store).forEach(function (k) { delete store[k]; }); };
A.createChat = function (cfg) {
  var st = store[cfg.mode] || (store[cfg.mode] = { log: [], history: [] });
  var box = el('section', 'box chat');
  box.setAttribute('aria-label', cfg.title);
  var hd = el('div', 'hd'); hd.appendChild(el('span', 'dot')); hd.appendChild(el('b', '', cfg.title));
  var modeTag = el('small', ''); hd.appendChild(modeTag);
  var logEl = el('div', 'log'); logEl.setAttribute('role', 'log'); logEl.setAttribute('aria-live', 'polite');
  var nokey = el('div', 'nokey'); nokey.hidden = true;
  nokey.innerHTML = A.L('برای جواب‌های هوشمند، کلید API خودت را در <button type="button">تنظیمات</button> وارد کن.', 'For smart answers, enter your own API key in <button type="button">Settings</button>.');
  nokey.querySelector('button').onclick = function () { A.go('settings'); };
  var sugg = el('div', 'sugg');
  var form = el('form', 'ask'); form.autocomplete = 'off';
  var input = el('input'); input.type = 'text'; input.dir = 'auto'; input.placeholder = cfg.placeholder || ''; input.setAttribute('aria-label', cfg.title);
  var send = el('button', '', A.L('بفرست', 'Send')); send.type = 'submit';
  var stop = el('button', 'stop', A.L('توقف', 'Stop')); stop.type = 'button'; stop.hidden = true;
  form.appendChild(input); form.appendChild(send); form.appendChild(stop);
  box.appendChild(hd); box.appendChild(logEl); box.appendChild(nokey); box.appendChild(sugg); box.appendChild(form);

  var busy = false, cur = null;
  function add(kind, text) {
    var d = el('div', 'msg ' + kind, text); logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; return d;
  }
  function addNote(kind, text) { st.log.push({ kind: kind, text: text }); return add(kind, text); }
  function setBusy(b) { busy = b; send.disabled = b; send.hidden = b; stop.hidden = !b; input.disabled = b; if (!b) input.focus(); }
  function refreshMode() {
    var has = A.settings && A.settings.hasKey;
    modeTag.textContent = has ? A.L('متصل به Claude', 'Connected to Claude') : (cfg.local ? A.L('فقط دستورهای ساده', 'Simple commands only') : A.L('نیازمند کلید API', 'API key required'));
    nokey.hidden = !!has;
  }

  (cfg.suggestions || []).forEach(function (s) {
    var b = el('button', '', s); b.type = 'button';
    b.onclick = function () { if (!busy) ask(s); };
    sugg.appendChild(b);
  });
  if (!st.log.length && cfg.greeting) st.log.push({ kind: 'sys', text: cfg.greeting });
  st.log.forEach(function (m) { add(m.kind, m.text); });
  refreshMode();

  async function ask(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    addNote('u', text);
    var has = A.settings && A.settings.hasKey;
    if (!has) {
      var r = cfg.local ? cfg.local(text) : null;
      addNote('a', r || (cfg.local ? A.L('برای سؤال‌های باز به کلید API نیاز دارم. دستورهای ساده کار می‌کنند، مثل «VRM را نشان بده».', 'Open questions need an API key. Simple commands work, such as "show me the VRM".') : errText('no_key')));
      return;
    }
    var bubble = add('a', A.L('در حال فکر کردن…', 'Thinking…'));
    setBusy(true);
    var acc = '';
    var msgs = st.history.slice(-12).concat([{ role: 'user', content: text }]);
    var call = window.api.chat({ system: cfg.system(), messages: msgs, tools: cfg.tools ? cfg.tools() : [], maxTokens: 900 }, {
      onDelta: function (t) { acc += t; bubble.textContent = acc; logEl.scrollTop = logEl.scrollHeight; },
      onTool: async function (name, inp) {
        var out = await cfg.runTool(name, inp || {});
        var a = el('div', 'act', '↳ ' + name + (inp && (inp.part || inp.parts || inp.view || inp.card || inp.flow) ? ' ' + [].concat(inp.part || inp.parts || inp.view || inp.card || inp.flow).join(',') : ''));
        logEl.appendChild(a); logEl.scrollTop = logEl.scrollHeight;
        return out;
      }
    });
    cur = call.id;
    try {
      var res = await call.promise;
      if (res && res.error) {
        if (res.error.code === 'cancelled') { if (!acc) bubble.remove(); else st.log.push({ kind: 'a', text: acc }); }
        else {
          if (acc) { bubble.textContent = acc; st.log.push({ kind: 'a', text: acc }); } else bubble.remove();
          addNote('sys', errText(res.error.code) || (A.L('مشکلی پیش آمد: ', 'Something went wrong: ') + res.error.message));
          if (res.error.code === 'invalid_key' || res.error.code === 'no_key') A.refreshSettings();
        }
      } else {
        var out = (res && res.text) || acc;
        bubble.textContent = out || '…';
        st.log.push({ kind: 'a', text: out });
        st.history.push({ role: 'user', content: text }, { role: 'assistant', content: out || '…' });
        if (res && res.truncated) addNote('sys', A.L('جواب کوتاه شد؛ کوتاه‌تر بپرس یا بگو «ادامه بده».', 'The answer was cut off; ask more briefly or say "continue".'));
      }
    } catch (e) {
      bubble.remove(); addNote('sys', A.L('خطای غیرمنتظره: ', 'Unexpected error: ') + ((e && e.message) || e));
    } finally { setBusy(false); cur = null; }
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; ask(v); });
  stop.addEventListener('click', function () { if (cur) window.api.abort(cur); });

  return { el: box, ask: ask, refresh: refreshMode, reset: function () { st.log = []; st.history = []; } };
};
})(window.A);

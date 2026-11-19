(function (A) {
'use strict';
var L = A.L, D = A.draw, ORDER = A.ORDER, GROUPS = A.GROUPS, CARDS = A.CARDS, CARD_ORDER = A.CARD_ORDER;
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

var st = A.state = { page: 'library', card: 'gtx1060', view: 'top', sel: null, flows: { power: true, data: false, air: false }, gap: 100 };
A.settings = null;

var NAV = [
  ['library', ['کتابخانه', 'Library'], '01'], ['blueprint', ['نقشه‌ی بالا', 'Blueprint'], '02'], ['exploded', ['نمای انفجاری', 'Exploded view'], '03'],
  ['compare', ['مقایسه', 'Compare'], '04'], ['trouble', ['عیب‌یابی', 'Troubleshoot'], '05'], ['settings', ['تنظیمات', 'Settings'], '06']
];
var page = $('#page'), nav = $('#nav');

/* ---------- shell ---------- */
function renderNav() {
  var h = '<div class="brand"><div><img class="logo" src="brand/arioncore_logo.png" alt="ArionCore" width="200"><p class="sub">' + L('اطلس نقشه‌ی فنی کارت‌های گرافیک', 'Graphics card blueprint atlas') + '</p></div></div>';
  NAV.forEach(function (n) {
    var cur = (n[0] === st.page) || (st.page === 'viewer' && ((n[0] === 'blueprint' && st.view === 'top') || (n[0] === 'exploded' && st.view === 'exp')));
    h += '<button type="button" class="navbtn" data-go="' + n[0] + '"' + (cur ? ' aria-current="page"' : '') + '><i>' + n[2] + '</i>' + L(n[1][0], n[1][1]) + '</button>';
  });
  var s = A.settings;
  h += '<div class="navsp"></div><button type="button" class="navbtn" id="langBtn" aria-label="Language"><i>' + L('EN', 'فا') + '</i>' + L('English', 'فارسی') + '</button>' +
    '<div class="keystate">Claude: <b>' + (s && s.hasKey ? L('وصل', 'connected') + '</b> (' + esc(s.model) + ')' : L('بدون کلید API', 'no API key') + '</b>') + '</div>';
  nav.innerHTML = h;
}
nav.addEventListener('click', function (e) {
  if (e.target.closest('#langBtn')) {
    A.setLang(A.lang() === 'fa' ? 'en' : 'fa'); A.resetChats();
    A.go(st.page === 'viewer' ? (st.view === 'top' ? 'blueprint' : 'exploded') : st.page);
    return;
  }
  var b = e.target.closest('[data-go]'); if (b) A.go(b.getAttribute('data-go'));
});

A.go = function (p) {
  if (p === 'blueprint') { st.view = 'top'; p = 'viewer'; }
  else if (p === 'exploded') { st.view = 'exp'; p = 'viewer'; }
  st.page = p; page.onclick = null; page.onkeydown = null;
  renderNav(); page.scrollTop = 0;
  ({ library: pageLibrary, viewer: pageViewer, compare: pageCompare, trouble: pageTrouble, settings: pageSettings })[p]();
};
A.refreshSettings = async function () {
  try { A.settings = await window.api.getSettings(); } catch (_) { A.settings = null; }
  renderNav();
  return A.settings;
};

function head(title, sub, toolsHtml) {
  return '<div class="ph"><div><h2>' + title + '</h2><p>' + sub + '</p></div><div class="tools">' + (toolsHtml || '') + '</div></div>';
}
function cardTabs(active) {
  return '<div class="cards" id="cardTabs">' + CARD_ORDER.map(function (id) { var c = CARDS[id]; return '<button type="button" class="cardbtn" data-card="' + id + '" aria-pressed="' + (id === active) + '"><span class="v">' + c.vendor + '</span><span class="n">' + c.short + '</span></button>'; }).join('') + '</div>';
}
function specList(specs) { return specs.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join(''); }

/* ---------- library ---------- */
function pageLibrary() {
  page.innerHTML = head(L('کتابخانه', 'Library'), L('کارت‌های موجود در اطلس. یکی را باز کن تا نقشه‌اش را ببینی.', 'Cards in the atlas. Open one to see its blueprint.'),
    '<input type="search" id="q" placeholder="' + L('جست‌وجو…', 'Search…') + '" aria-label="' + L('جست‌وجو', 'Search') + '"><select id="vf" aria-label="' + L('سازنده', 'Vendor') + '"><option value="">' + L('همه‌ی سازنده‌ها', 'All vendors') + '</option><option>NVIDIA</option><option>AMD</option></select>') + '<div class="lib" id="lib"></div>';
  function draw() {
    var q = $('#q').value.trim().toLowerCase(), vf = $('#vf').value;
    var ids = CARD_ORDER.filter(function (id) { var c = CARDS[id]; return (!vf || c.vendor === vf) && (!q || (c.name + ' ' + A.chip(c) + ' ' + c.vendor).toLowerCase().indexOf(q) >= 0); });
    $('#lib').innerHTML = ids.length ? ids.map(function (id) {
      var c = CARDS[id];
      return '<button type="button" class="tile" data-open="' + id + '"><div class="thumb"><svg class="top-svg" viewBox="' + D.vb(c) + '" aria-hidden="true">' + D.renderTop(c, { mini: true }) + '</svg></div><div class="tb"><div class="v">' + c.vendor + '</div><h3>' + c.name + '</h3><p>' + A.chip(c) + '</p><div class="mini">' + c.stats.map(function (s) { return '<span>' + s[0] + ' ' + s[1] + '</span>'; }).join('') + '</div></div></button>';
    }).join('') : '<div class="empty">' + L('کارتی پیدا نشد.', 'No card found.') + '</div>';
  }
  $('#q').oninput = draw; $('#vf').onchange = draw; draw();
  $('#lib').onclick = function (e) { var b = e.target.closest('[data-open]'); if (b) { st.card = b.getAttribute('data-open'); st.sel = null; A.go('blueprint'); } };
}

/* ---------- viewer (blueprint + exploded) ---------- */
function pageViewer() {
  page.innerHTML = head(L('نقشه‌ی فنی', 'Technical blueprint'), L('روی هر قطعه بزن یا از نقشه‌یار بخواه نشانت بدهد.', 'Click any component, or ask the assistant to point it out.'), cardTabs(st.card)) +
    '<div class="workgrid"><div><section class="stage"><div class="bar">' +
    '<div class="seg" role="group" aria-label="' + L('نوع نما', 'View') + '"><button type="button" data-view="top">' + L('نمای بالا', 'Top view') + '</button><button type="button" data-view="exp">' + L('نمای انفجاری', 'Exploded view') + '</button></div>' +
    '<div class="tog" id="togs" role="group" aria-label="' + L('انیمیشن‌ها', 'Animations') + '"><button type="button" data-flow="power">' + L('جریان برق', 'Power flow') + '</button><button type="button" data-flow="data">' + L('مسیر داده', 'Data path') + '</button><button type="button" data-flow="air">' + L('جریان هوا', 'Airflow') + '</button></div>' +
    '<label class="slider" id="gapWrap">' + L('گسترش لایه‌ها', 'Explode') + ' <input id="gap" type="range" min="0" max="100" value="' + st.gap + '"></label></div>' +
    '<div class="canvas"><svg id="topSvg" class="top-svg drawin" viewBox="0 0 1060 540" role="group" aria-label="' + L('نمای بالای برد', 'Board top view') + '"></svg><svg id="expSvg" class="exp-svg" viewBox="0 0 760 780" role="group" aria-label="' + L('نمای انفجاری', 'Exploded view') + '"></svg></div>' +
    '<p class="cap" id="cap"></p><div class="stats" id="stats"></div><div class="pwr" id="pwr"></div></section></div>' +
    '<aside><section class="box info" id="info" aria-live="polite"></section><div id="chatSlot" style="margin-top:16px"></div></aside></div>' +
    '<section class="parts"><h3 class="sec-h">' + L('قطعات و لایه‌ها', 'Components and layers') + '</h3><div class="plist" id="plist"></div></section>';
  var V = {};
  var topEl = $('#topSvg'), expEl = $('#expSvg');
  function card() { return CARDS[st.card]; }

  function renderInfo() {
    var c = card(), el = $('#info'), sel = st.sel;
    if (!sel) {
      el.innerHTML = '<div class="hd"><span class="num">i</span><div><h2>' + c.name + '</h2><div class="en">' + A.chip(c) + '</div></div></div><p>' + L('یکی از قطعات را روی نقشه انتخاب کن یا از نقشه‌یار بخواه نشانت بدهد.', 'Select a component on the blueprint, or ask the assistant to show it.') + '</p><div class="q">' + A.quality(c).map(function (q) { return '<span>' + q + '</span>'; }).join('') + '</div>';
      return;
    }
    var num, nm, en, specs, role;
    if (sel.type === 'g') { num = ORDER.indexOf(sel.id) + 1; nm = A.gName(sel.id); en = GROUPS[sel.id].en; specs = c.parts[sel.id].specs; role = A.gRole(sel.id); }
    else { var l = c.layers.filter(function (x) { return x.id === sel.id; })[0]; num = 'L'; nm = A.lName(l); en = l.en; specs = l.specs; role = A.lRole(l); }
    el.innerHTML = '<div class="hd"><span class="num">' + num + '</span><div><h2>' + nm + '</h2><div class="en">' + en + '</div></div></div><ul>' + specList(specs) + '</ul><p>' + role + '</p><div class="q"><span>' + posTag(c, sel) + '</span></div>';
  }
  function posTag(c, sel) {
    if (sel.type === 'l') return L('جایگاه: تقریبی', 'Position: approximate');
    return c.conf && c.conf[sel.id] === 'photo' ? L('جایگاه: از روی عکس برد', 'Position: traced from board photo') : L('جایگاه: تخمینی (خط‌چین)', 'Position: estimated (dashed)');
  }
  function renderStats() {
    var c = card();
    $('#stats').innerHTML = c.stats.map(function (s) { return '<div class="stat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>'; }).join('');
    var p = c.power, tot = p.slot + p.aux, tp = Math.min(100, p.tdp / tot * 100), margin = tot - p.tdp;
    var s2 = p.aux ? '<span class="s2" style="width:' + (p.aux / tot * 100) + '%">' + p.auxName.toUpperCase() + ' ' + p.aux + ' W</span>' : '';
    $('#pwr').innerHTML = '<h3 class="sec-h">' + L('بودجه‌ی توان', 'Power budget') + '</h3><div class="pb"><span class="s1" style="width:' + (p.slot / tot * 100) + '%">SLOT ' + p.slot + ' W</span>' + s2 + '<i style="inset-inline-start:' + tp + '%"></i><em style="' + (tp > 85 ? 'inset-inline-end:0;transform:none' : 'inset-inline-start:' + tp + '%') + '">TDP ' + p.tdp + ' W</em></div><p class="pnote">' +
      (p.aux ? L('سقف ' + tot + ' وات در برابر TDP برابر ' + p.tdp + ' وات، یعنی حدود ' + margin + ' وات حاشیه.', 'Ceiling ' + tot + ' W against a TDP of ' + p.tdp + ' W, about ' + margin + ' W of headroom.')
        : L('این کارت فقط از اسلات PCIe برق می‌گیرد: سقف ' + tot + ' وات و TDP برابر ' + p.tdp + ' وات، پس حاشیه‌ای نیست و کانکتور برق ندارد.', 'This card draws power from the PCIe slot only: ceiling ' + tot + ' W, TDP ' + p.tdp + ' W, so there is no headroom and no power connector.')) + '</p>';
  }
  function renderCap() {
    var c = card();
    $('#cap').textContent = st.view === 'top'
      ? c.name + ' · ' + A.chip(c) + L('. با دکمه‌های بالا مسیر برق، داده و هوا زنده می‌شود.' + (c.boardModel ? ' خط‌چین یعنی جای قطعه تخمینی است.' : ''), '. Use the buttons above to animate power, data and airflow.' + (c.boardModel ? ' Dashed outline = estimated position.' : ''))
      : L('لایه‌های ' + c.name + ' از بالا به پایین. اسلایدر لایه‌ها را جمع یا باز می‌کند.', 'Layers of ' + c.name + ', top to bottom. The slider collapses or expands them.');
  }
  function renderParts() {
    var c = card(), h = '';
    ORDER.forEach(function (id, i) { h += '<button type="button" class="pbtn" data-g="' + id + '" aria-pressed="false"><span class="num">' + (i + 1) + '</span><span>' + A.gName(id) + '<small>' + GROUPS[id].en + '</small></span></button>'; });
    c.layers.forEach(function (l) { h += '<button type="button" class="pbtn" data-l="' + l.id + '" aria-pressed="false"><span class="num">L</span><span>' + A.lName(l) + '<small>' + l.en + '</small></span></button>'; });
    $('#plist').innerHTML = h;
  }
  function paint() {
    var sel = st.sel, hg = !!(sel && sel.type === 'g'), hl = !!(sel && sel.type === 'l');
    topEl.classList.toggle('focus', hg); expEl.classList.toggle('focus', hl);
    $$('.part', topEl).forEach(function (p) { p.classList.toggle('on', hg && p.getAttribute('data-g') === sel.id); });
    $$('.badge', topEl).forEach(function (p) { p.classList.toggle('on', hg && p.getAttribute('data-g') === sel.id); });
    $$('.layer', expEl).forEach(function (p) { p.classList.toggle('on', hl && p.getAttribute('data-l') === sel.id); });
    $$('.pbtn').forEach(function (b) { var on = sel && ((b.hasAttribute('data-g') && sel.type === 'g' && b.getAttribute('data-g') === sel.id) || (b.hasAttribute('data-l') && sel.type === 'l' && b.getAttribute('data-l') === sel.id)); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  }
  function flowClasses() {
    ['power', 'data', 'air'].forEach(function (k) { topEl.classList.toggle('f-' + k, !!st.flows[k]); });
    $$('#togs button').forEach(function (b) { b.setAttribute('aria-pressed', st.flows[b.getAttribute('data-flow')] ? 'true' : 'false'); });
  }
  V.select = function (sel) { st.sel = sel; paint(); renderInfo(); };
  V.setView = function (v) {
    st.view = v;
    $$('.seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === v ? 'true' : 'false'); });
    topEl.toggleAttribute('hidden', v !== 'top'); expEl.toggleAttribute('hidden', v !== 'exp'); $('#togs').hidden = v !== 'top'; $('#gapWrap').hidden = v !== 'exp';
    if (v === 'exp') { expEl.classList.add('nt'); D.applyGap(expEl, card(), 0); void expEl.getBoundingClientRect(); expEl.classList.remove('nt'); requestAnimationFrame(function () { D.applyGap(expEl, card(), st.gap); }); }
    renderCap(); renderNav();
  };
  V.setFlow = function (k, on) { st.flows[k] = on; if (st.view !== 'top') V.setView('top'); flowClasses(); };
  V.setCard = function (id, keepSel) {
    if (!CARDS[id]) return;
    var prev = st.sel; st.card = id; st.sel = keepSel ? prev : null;
    $$('#cardTabs button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-card') === id ? 'true' : 'false'); });
    topEl.classList.remove('drawin'); topEl.setAttribute('viewBox', D.vb(card())); topEl.innerHTML = D.renderTop(card()); void topEl.getBoundingClientRect(); topEl.classList.add('drawin');
    expEl.innerHTML = D.renderExp(card()); D.applyGap(expEl, card(), st.gap);
    flowClasses(); renderStats(); renderCap(); renderParts(); renderInfo(); paint();
  };
  V.showPart = function (id) {
    var c = card();
    if (c.parts[id]) { if (st.view !== 'top') V.setView('top'); V.select({ type: 'g', id: id }); return A.gName(id) + ' (' + id + '): ' + c.parts[id].specs.join(' | '); }
    var l = c.layers.filter(function (x) { return x.id === id; })[0];
    if (l) { if (st.view !== 'exp') V.setView('exp'); V.select({ type: 'l', id: id }); return A.lName(l) + ': ' + l.specs.join(' | '); }
    throw new Error('unknown part ' + id);
  };

  page.onclick = function (e) {
    var t = e.target, cb = t.closest('[data-card]'); if (cb) { V.setCard(cb.getAttribute('data-card')); return; }
    var vb = t.closest('.seg button'); if (vb) { V.setView(vb.getAttribute('data-view')); return; }
    var fb = t.closest('#togs button'); if (fb) { var k = fb.getAttribute('data-flow'); V.setFlow(k, !st.flows[k]); return; }
    var pb = t.closest('.pbtn'); if (pb) { V.showPart(pb.getAttribute('data-g') || pb.getAttribute('data-l')); return; }
    var g = t.closest('#topSvg [data-g]'); if (g) { V.showPart(g.getAttribute('data-g')); return; }
    var l = t.closest('#expSvg [data-l]'); if (l) { V.showPart(l.getAttribute('data-l')); return; }
  };
  page.onkeydown = function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest && e.target.closest('#topSvg [data-g].part,#expSvg [data-l].layer');
    if (el) { e.preventDefault(); V.showPart(el.getAttribute('data-g') || el.getAttribute('data-l')); }
  };
  $('#gap').oninput = function () { st.gap = +this.value; D.applyGap(expEl, card(), st.gap); };

  var chat = A.createChat({
    mode: 'viewer', title: L('نقشه‌یار', 'Blueprint assistant'), placeholder: L('مثلاً: VRM را نشان بده', 'e.g. Show me the VRM'),
    greeting: L('سلام، من نقشه‌یار ArionCore هستم. بگو چه قطعه‌ای را نشان بدهم یا سؤالت را بپرس. دستورهای ساده بدون کلید هم کار می‌کنند و سؤال‌های باز را Claude جواب می‌دهد.',
      'Hi, I am the ArionCore blueprint assistant. Tell me which component to show or ask a question. Simple commands work without a key; open questions are answered by Claude.'),
    suggestions: [L('VRM را نشان بده', 'Show me the VRM'), L('کارت را باز کن', 'Explode the card'), L('برق چطور به GPU می‌رسد؟', 'How does power reach the GPU?'), L('این کارت با کارت‌های دیگر چه فرقی دارد؟', 'How does this card differ from the others?')],
    system: viewerSystem, tools: viewerTools,
    runTool: function (name, i) { return runViewerTool(V, name, i); },
    local: function (q) { return localCmd(V, A.norm(q)); }
  });
  $('#chatSlot').appendChild(chat.el);
  V.setCard(st.card, true); V.setView(st.view); if (st.sel) V.select(st.sel);
}

/* ---------- assistant: shared bits ---------- */
A.norm = function (s) { return String(s).toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[‌‏]/g, ' ').replace(/\s+/g, ' '); };
function cardFacts(c) {
  var fa = A.lang() === 'fa', lines = [(fa ? 'کارت: ' : 'Card: ') + c.name + ' (' + c.vendor + ') · ' + A.chip(c)];
  lines.push((fa ? 'آمار: ' : 'Stats: ') + c.stats.map(function (s) { return s.join(' '); }).join(' · ') + (fa ? ' · خنک‌کننده: ' : ' · cooler: ') + c.cmp.cooler);
  ORDER.forEach(function (id) { lines.push('- ' + id + ' (' + A.gName(id) + '): ' + c.parts[id].specs.join(' | ')); });
  lines.push((fa ? 'بودجه‌ی توان: اسلات ' : 'Power budget: slot ') + c.power.slot + ' W + ' + c.power.auxName + ' ' + c.power.aux + ' W = ' + (c.power.slot + c.power.aux) + ' W; TDP ' + c.power.tdp + ' W');
  return lines.join('\n');
}
function rulesView() {
  return L('تو «نقشه‌یار ArionCore» هستی؛ دستیار یک اطلس تعاملی از نقشه‌ی فنی کارت‌های گرافیک، با لحنی صمیمی و دقیق. به فارسی جواب بده و اصطلاح‌های فنی را انگلیسی بگذار. جواب‌ها کوتاه باشد (حداکثر ۴ جمله). هر وقت کاربر چیزی را می‌خواهد ببیند، با ابزارها نشانش بده و بعد کوتاه توضیح بده. فقط به داده‌ی زیر تکیه کن و اگر چیزی در آن نیست بگو مطمئن نیستی. چیدمان روی نقشه تقریبی است.',
    'You are the ArionCore blueprint assistant, inside an interactive atlas of graphics card technical blueprints. Be friendly and precise. Answer in English, in at most 4 sentences. When the user wants to see something, show it with the tools and then explain briefly. Rely only on the data below and say when you are not sure. Component positions on the blueprint are approximate.');
}
function rulesFix() {
  return L('تو «عیب‌یاب ArionCore» هستی؛ یک تکنسین باتجربه‌ی سخت‌افزار کارت گرافیک که با فارسی ساده و دقیق به کاربر کمک می‌کند. اگر علامت مبهم است حداکثر دو سؤال کوتاه بپرس (مثلاً: خروجی تصویر، دما، لحظه‌ی بروز، تغییر اخیر مثل درایور یا منبع تغذیه). بعد علت‌های محتمل را از محتمل به کم‌احتمال رتبه‌بندی کن، برای هر کدام یک تست قطعی‌کننده و کم‌هزینه بگو، و با ابزار mark_suspects قطعات مشکوک را روی نقشه علامت بزن. کاربر را از ساده‌ترین تست (کابل، درایور، تست در سیستم دیگر) به سخت‌ترین (تعمیر برد) ببر. هر جا پای باز کردن کارت، برق مستقیم، ماسفت و خازن یا حرارت است هشدار ایمنی بده و اگر تعمیر در سطح برد است بگو تعمیرگاه معتبر بهتر است. حدس را حدس بنام و ادعای قطعی درباره‌ی مدل خاص نکن؛ چیدمان و مشخصات این اطلس مرجع و تقریبی است. جواب‌ها حداکثر حدود ۲۰۰ کلمه باشد و در پایان یک قدم بعدی بگو.',
    'You are the ArionCore troubleshooter, an experienced graphics-card hardware technician helping in plain, precise English. If the symptom is vague, ask at most two short questions first (picture output, temperature, when it happens, recent changes such as a driver or PSU). Then rank the likely causes from most to least probable, give one cheap, decisive test for each, and mark the suspect components on the blueprint with the mark_suspects tool. Lead the user from the simplest test (cables, drivers, another system) to the hardest (board repair). Give a safety warning wherever opening the card, live power, MOSFETs, capacitors or heat are involved, and say a reputable repair shop is better for board-level work. Label guesses as guesses and never claim certainty about a specific model; the layout and specs in this atlas are reference and approximate. Keep answers under about 200 words and end with one next step.');
}
function viewerSystem() {
  var c = CARDS[st.card], fa = A.lang() === 'fa', others = CARD_ORDER.filter(function (id) { return id !== st.card; });
  return rulesView() + '\n\n' + cardFacts(c) + (fa ? '\nلایه‌ها: ' : '\nLayers: ') + c.layers.map(function (l) { return l.id + ' (' + A.lName(l) + ')'; }).join(', ') +
    (fa ? '\nکارت‌های دیگر اطلس:\n' : '\nOther cards in the atlas:\n') + others.map(function (id) { var o = CARDS[id]; return o.name + ' · ' + Object.keys(o.cmp).map(function (k) { return k + '=' + o.cmp[k]; }).join(' ; '); }).join('\n') +
    (fa ? '\nوضعیت: نما=' + (st.view === 'top' ? 'بالا' : 'انفجاری') + '، انتخاب=' + (st.sel ? st.sel.id : 'هیچ') : '\nState: view=' + (st.view === 'top' ? 'top' : 'exploded') + ', selection=' + (st.sel ? st.sel.id : 'none'));
}
function viewerTools() {
  var ids = ORDER.concat(CARDS[st.card].layers.map(function (l) { return l.id; })).join(', ');
  return [
    { name: 'highlight_part', description: 'Select one component (top view) or cooler layer (exploded view) on the blueprint and show its info card. Returns specs. Valid ids: ' + ids + '.', input_schema: { type: 'object', properties: { part: { type: 'string' } }, required: ['part'] } },
    { name: 'set_view', description: 'Switch between the top view and the exploded cooler view.', input_schema: { type: 'object', properties: { view: { type: 'string', enum: ['top', 'exploded'] }, explode_percent: { type: 'number' } }, required: ['view'] } },
    { name: 'toggle_flow', description: 'Turn an animated overlay on or off in the top view: power, data or air.', input_schema: { type: 'object', properties: { flow: { type: 'string', enum: ['power', 'data', 'air'] }, on: { type: 'boolean' } }, required: ['flow', 'on'] } },
    { name: 'select_card', description: 'Open another card. Ids: ' + CARD_ORDER.join(', '), input_schema: { type: 'object', properties: { card: { type: 'string', enum: CARD_ORDER } }, required: ['card'] } }
  ];
}
function runViewerTool(V, name, i) {
  if (name === 'highlight_part') return V.showPart(String(i.part));
  if (name === 'set_view') {
    V.setView(i.view === 'exploded' ? 'exp' : 'top');
    if (i.view === 'exploded' && typeof i.explode_percent === 'number') { st.gap = Math.max(0, Math.min(100, i.explode_percent)); $('#gap').value = st.gap; D.applyGap($('#expSvg'), CARDS[st.card], st.gap); }
    return 'view is now ' + i.view;
  }
  if (name === 'toggle_flow') { if (!(i.flow in st.flows)) throw new Error('unknown flow'); V.setFlow(i.flow, !!i.on); return i.flow + ' is now ' + (i.on ? 'on' : 'off'); }
  if (name === 'select_card') { if (!CARDS[i.card]) throw new Error('unknown card'); V.setCard(i.card); return 'now showing ' + CARDS[i.card].name; }
  throw new Error('unknown tool ' + name);
}
var KEYS = [
  ['fan', /هدر فن|fan header/],
  ['vrm', /vrm|فاز|ماسفت|mosfet|چوک|سلف|ولتاژ|phase|choke|voltage/],
  ['pwm', /pwm|کنترلر|controller/],
  ['mem', /vram|حافظه|gddr|\bmem\b|memory/],
  ['gpu', /gpu|هسته|پردازنده|چیپ گرافیک|دای|\bdie\b|\bcore\b/],
  ['aux', /کانکتور|پین|\bpin\b|aux|connector/],
  ['pcie', /pcie|اسلات|انگشتی|لبه|slot|edge/],
  ['bios', /bios|بایوس|فلش|flash/],
  ['io', /پورت|براکت|hdmi|displayport|dvi|\bport|bracket/],
  ['mount', /سوراخ|پیچ|mount|screw|hole/]
];
var LKEYS = [
  ['backplate', /بک ?پلیت|backplate/],
  ['heatsink', /هیت ?سینک|heatsink|فین|هیت ?پایپ|heatpipe|رادیاتور|\bfins?\b/],
  ['base', /بیس|خمیر|\btim\b|پد حرارتی|base|paste/],
  ['shroud', /شراود|shroud|فن|\bfans?\b/],
  ['pcb', /pcb|برد|board/]
];
function localCmd(V, q) {
  var out = [], did = false, off = /خاموش|\boff\b|حذف|پنهان|\bhide\b/.test(q);
  var cardHit = null;
  if (/1650/.test(q)) cardHit = 'gtx1650'; else if (/3060|rtx/.test(q)) cardHit = 'rtx3060'; else if (/1060/.test(q)) cardHit = 'gtx1060'; else if (/\brx\b|580|ای ام دی/.test(q)) cardHit = 'rx580';
  if (cardHit && st.card !== cardHit) { V.setCard(cardHit); out.push(L('کارت ' + CARDS[cardHit].short + ' باز شد.', CARDS[cardHit].short + ' opened.')); did = true; }
  if (/انفجار|explode|باز کن|لایه|layers/.test(q) && !/vrm|حافظه|memory/.test(q)) { V.setView('exp'); out.push(L('نمای انفجاری باز شد.', 'Exploded view opened.')); did = true; }
  else if (/نمای بالا|top view|ببند|جمع کن|collapse/.test(q)) { V.setView('top'); out.push(L('نمای بالا.', 'Top view.')); did = true; }
  var names = { power: L('جریان برق', 'Power flow'), data: L('مسیر داده', 'Data path'), air: L('جریان هوا', 'Airflow') };
  [['power', /برق|تغذیه|power/], ['data', /داده|data|باس|\bbus\b/], ['air', /هوا|air|خنک|cool/]].forEach(function (f) {
    if (f[1].test(q) && !/vrm|فاز|phase|connector|کانکتور/.test(q)) { V.setFlow(f[0], !off); out.push(L('انیمیشن ' + names[f[0]] + (off ? ' خاموش شد.' : ' روشن شد.'), names[f[0]] + (off ? ' turned off.' : ' turned on.'))); did = true; }
  });
  if (!did) {
    var hit = null, i, c = CARDS[st.card];
    for (i = 0; i < KEYS.length && !hit; i++) if (KEYS[i][1].test(q)) hit = KEYS[i][0];
    if (!hit) for (i = 0; i < LKEYS.length && !hit; i++) if (LKEYS[i][1].test(q) && c.layers.some(function (l) { return l.id === LKEYS[i][0]; })) hit = LKEYS[i][0];
    if (hit) { V.showPart(hit); out.push(c.parts[hit] ? A.gName(hit) + ': ' + A.gRole(hit) : (function () { var l = c.layers.filter(function (x) { return x.id === hit; })[0]; return A.lName(l) + ': ' + A.lRole(l); })()); did = true; }
  }
  return did ? out.join('\n') : null;
}

/* ---------- compare ---------- */
function pageCompare() {
  var a = st.cmpA || 'gtx1060', b = st.cmpB || 'rx580';
  function opts(sel) { return CARD_ORDER.map(function (id) { return '<option value="' + id + '"' + (id === sel ? ' selected' : '') + '>' + CARDS[id].name + '</option>'; }).join(''); }
  page.innerHTML = head(L('مقایسه', 'Compare'), L('دو کارت کنار هم؛ ردیف‌هایی که فرق دارند رنگی‌اند.', 'Two cards side by side; rows that differ are highlighted.'), '') +
    '<div class="cmpbar"><select id="ca" aria-label="' + L('کارت اول', 'First card') + '">' + opts(a) + '</select><span>' + L('در برابر', 'vs') + '</span><select id="cb" aria-label="' + L('کارت دوم', 'Second card') + '">' + opts(b) + '</select></div>' +
    '<div class="legend"><b></b>' + L('ردیف‌های رنگی یعنی مقدار دو کارت فرق دارد.', 'Highlighted rows mean the two cards differ.') + '</div><div class="cmp"><table class="diff" id="cmp"></table></div>' +
    '<p class="foot">' + L('مشخصات از اطلاعات مرجع و عمومی آمده؛ مدل‌های ساخت شرکت‌های دیگر (AIB) ممکن است فرق داشته باشند.', 'Specs come from public reference data; partner (AIB) models may differ.') + '</p>';
  function draw() {
    st.cmpA = $('#ca').value; st.cmpB = $('#cb').value;
    var A1 = CARDS[st.cmpA], B1 = CARDS[st.cmpB];
    var h = '<thead><tr><th></th><th scope="col">' + A1.short + '</th><th scope="col">' + B1.short + '</th></tr></thead><tbody>';
    A.CMP_ROWS.forEach(function (r) { var x = A1.cmp[r[0]], y = B1.cmp[r[0]], d = x !== y ? ' class="d"' : ''; h += '<tr><th scope="row">' + A.cmpLabel(r) + '</th><td' + d + '>' + esc(x) + '</td><td' + d + '>' + esc(y) + '</td></tr>'; });
    $('#cmp').innerHTML = h + '</tbody>';
  }
  $('#ca').onchange = draw; $('#cb').onchange = draw; draw();
}

/* ---------- troubleshoot ---------- */
function pageTrouble() {
  page.innerHTML = head(L('عیب‌یابی', 'Troubleshoot'), L('علامت را انتخاب کن یا با کلمات خودت بنویس؛ Claude قطعات مشکوک را روی نقشه علامت می‌زند.', 'Pick a symptom or describe it in your own words; Claude marks suspect components on the blueprint.'), cardTabs(st.card)) +
    '<div class="warn">' + L('هشدار ایمنی: قبل از باز کردن کیس یا کارت، سیستم را خاموش و از برق جدا کن. دست زدن به برد، خازن‌ها و منبع تغذیه ریسک دارد. تعمیر در سطح برد را به تعمیرگاه معتبر بسپار.', 'Safety: before opening the case or the card, shut the system down and unplug it. Touching the board, capacitors or the PSU is risky. Leave board-level repair to a reputable shop.') + '</div>' +
    '<div class="symp" id="symp">' + A.SYMPTOMS.map(function (s) { return '<button type="button" data-s="' + s.id + '">' + A.symName(s) + '</button>'; }).join('') + '</div>' +
    '<div class="tgrid"><div><section class="stage"><div class="canvas"><svg id="mini" class="top-svg" viewBox="0 0 1060 540" role="group" aria-label="' + L('نقشه‌ی قطعات مشکوک', 'Suspect components map') + '"></svg></div><p class="cap" id="susCap"></p></section><section class="box info" id="info" style="margin-top:16px"></section></div><div id="chatSlot"></div></div>';
  var mini = $('#mini');
  function draw() { mini.setAttribute('viewBox', D.vb(CARDS[st.card])); mini.innerHTML = D.renderTop(CARDS[st.card], { mini: true }); mini.classList.remove('drawin'); $('#info').innerHTML = '<p>' + L('روی هر قطعه بزن تا مشخصاتش را ببینی.', 'Click a component to see its specs.') + '</p>'; $('#susCap').textContent = L('قطعات مشکوک اینجا علامت می‌خورند.', 'Suspect components are marked here.'); }
  function mark(ids) {
    var ok = [];
    $$('.part', mini).forEach(function (p) { var on = ids.indexOf(p.getAttribute('data-g')) >= 0; p.classList.toggle('sus', on); if (on) ok.push(A.gName(p.getAttribute('data-g'))); });
    $('#susCap').textContent = ok.length ? L('مشکوک: ', 'Suspects: ') + ok.join(L('، ', ', ')) : L('قطعه‌ی مشکوکی علامت نخورده.', 'No suspect component marked.');
    return ok.length ? 'marked: ' + ids.join(',') : 'no valid part ids; valid: ' + ORDER.join(',');
  }
  draw();
  mini.addEventListener('click', function (e) {
    var g = e.target.closest('[data-g]'); if (!g) return;
    var id = g.getAttribute('data-g'), c = CARDS[st.card];
    $('#info').innerHTML = '<div class="hd"><span class="num">' + (ORDER.indexOf(id) + 1) + '</span><div><h2>' + A.gName(id) + '</h2><div class="en">' + GROUPS[id].en + '</div></div></div><ul>' + specList(c.parts[id].specs) + '</ul><p>' + A.gRole(id) + '</p>';
  });
  var chat = A.createChat({
    mode: 'trouble', title: L('عیب‌یاب Claude', 'Claude troubleshooter'), placeholder: L('مشکلت را بنویس…', 'Describe your problem…'),
    greeting: L('سلام، من عیب‌یاب ArionCore هستم. مشکل کارتت را بگو (علامت، مدل، از کی شروع شد، چه چیزی تغییر کرد) تا علت‌ها را رتبه‌بندی کنم و قطعات مشکوک را روی نقشه نشان بدهم.',
      'Hi, I am the ArionCore troubleshooter. Describe the problem (symptom, model, when it started, what changed) and I will rank the likely causes and mark suspect components on the blueprint.'),
    system: function () { return rulesFix() + L('\n\nکارت انتخاب‌شده کاربر در اطلس:\n', '\n\nThe card the user selected in the atlas:\n') + cardFacts(CARDS[st.card]); },
    tools: function () { return [
      { name: 'mark_suspects', description: 'Mark suspect components on the blueprint (replaces previous marks). Valid ids: ' + ORDER.join(', ') + '. Call with an empty list to clear.', input_schema: { type: 'object', properties: { parts: { type: 'array', items: { type: 'string' } } }, required: ['parts'] } }
    ]; },
    runTool: function (name, i) { if (name !== 'mark_suspects') throw new Error('unknown tool'); return mark([].concat(i.parts || []).map(String)); }
  });
  $('#chatSlot').appendChild(chat.el);
  $('#symp').onclick = function (e) {
    var b = e.target.closest('[data-s]'); if (!b) return;
    var s = A.SYMPTOMS.filter(function (x) { return x.id === b.getAttribute('data-s'); })[0];
    chat.ask(L('کارت من ' + CARDS[st.card].name + ' است. ', 'My card is the ' + CARDS[st.card].name + '. ') + A.symText(s));
  };
  page.onclick = function (e) { var cb = e.target.closest('[data-card]'); if (cb) { st.card = cb.getAttribute('data-card'); $$('#cardTabs button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-card') === st.card ? 'true' : 'false'); }); draw(); } };
}

/* ---------- settings ---------- */
function pageSettings() {
  page.innerHTML = head(L('تنظیمات', 'Settings'), L('اتصال به Claude و اطلاعات برنامه.', 'Claude connection and app information.'), '') + '<section class="box setbox" id="keybox"></section>' +
    '<section class="box setbox"><h3 class="sec-h">' + L('درباره‌ی داده‌ها', 'About the data') + '</h3><p class="note">' + L('مشخصات از اطلاعات مرجع و عمومی کارت‌ها آمده و چیدمان قطعات روی نقشه تقریبی و وابسته به مدل برد است. پیشنهادهای عیب‌یابی Claude راهنمای اولیه است و جایگزین تشخیص حضوری نیست. قبل از اتکا به هر عدد، آن را با دیتاشیت سازنده بررسی کن.', 'Specs come from public reference information, and component positions on the blueprint are approximate and depend on the board model. Claude troubleshooting suggestions are a first guide, not a substitute for hands-on diagnosis. Check any number against the manufacturer datasheet before relying on it.') + '</p><p class="note">ArionCore 0.3</p></section>';
  function draw() {
    var s = A.settings || { hasKey: false, models: [], model: '' };
    var keyLabel = s.hasKey
      ? L('کلید فعلی: ', 'Current key: ') + '<span dir="ltr">' + esc(s.keyHint) + '</span>' + (s.persisted ? L(' (رمزنگاری‌شده روی همین سیستم ذخیره است)', ' (stored encrypted on this machine)') : L(' (فقط تا بستن برنامه نگه داشته می‌شود)', ' (kept only until the app closes)'))
      : L('کلیدی ذخیره نشده', 'No key saved');
    $('#keybox').innerHTML = '<h3 class="sec-h">' + L('کلید API شرکت Anthropic', 'Anthropic API key') + '</h3>' +
      '<p class="note">' + L('برای جواب‌دادن چت‌ها (نقشه‌یار و عیب‌یاب) برنامه با API شرکت Anthropic ارتباط می‌گیرد. کلید را از console.anthropic.com بساز. هزینه‌ی مصرف روی حساب خودت حساب می‌شود.', 'To answer the chats (blueprint assistant and troubleshooter) the app talks to the Anthropic API. Create a key at console.anthropic.com. Usage is billed to your own account.') + '</p>' +
      '<div class="fld"><label for="key">' + keyLabel + '</label>' +
      '<div class="row"><input id="key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…"><button class="btn pri" id="save" type="button">' + L('ذخیره', 'Save') + '</button>' + (s.hasKey ? '<button class="btn" id="clear" type="button">' + L('حذف کلید', 'Remove key') + '</button>' : '') + '</div></div>' +
      '<div class="fld"><label for="model">' + L('مدل', 'Model') + '</label><select id="model">' + (s.models || []).map(function (m) { return '<option' + (m === s.model ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select></div>' +
      '<div class="row" style="display:flex;gap:10px;align-items:center"><button class="btn" id="test" type="button"' + (s.hasKey ? '' : ' disabled') + '>' + L('آزمایش اتصال', 'Test connection') + '</button><span id="msg" role="status"></span></div>' +
      '<p class="note" style="margin-top:12px">' + (s.encryption ? L('کلید با رمزنگاری سیستم‌عامل ذخیره می‌شود و به صفحه‌های برنامه داده نمی‌شود؛ فقط بخش اصلی برنامه با آن به API وصل می‌شود.', 'The key is stored with operating-system encryption and is never handed to the app pages; only the main process uses it to reach the API.') : L('رمزنگاری سیستم‌عامل روی این دستگاه در دسترس نیست، پس کلید فقط در حافظه می‌ماند و بعد از بستن برنامه باید دوباره وارد شود.', 'OS encryption is not available on this device, so the key stays in memory only and must be entered again after closing the app.')) + '</p>';
    var msg = $('#msg');
    $('#save').onclick = async function () {
      var r = await window.api.setKey($('#key').value);
      if (r && r.ok) { A.settings = r.settings; renderNav(); draw(); $('#msg').textContent = L('ذخیره شد.', 'Saved.'); $('#msg').className = 'ok'; }
      else { msg.textContent = r && r.error === 'format' ? L('قالب کلید درست نیست (بدون فاصله و حداقل ۲۰ نویسه).', 'Key format is wrong (no spaces, at least 20 characters).') : L('ذخیره نشد.', 'Could not save.'); msg.className = 'bad'; }
    };
    var cl = $('#clear'); if (cl) cl.onclick = async function () { A.settings = await window.api.clearKey(); renderNav(); draw(); };
    $('#model').onchange = async function () { await window.api.setModel(this.value); await A.refreshSettings(); };
    $('#test').onclick = async function () {
      msg.textContent = L('در حال آزمایش…', 'Testing…'); msg.className = '';
      var r = await window.api.testKey();
      if (r.ok) { msg.textContent = L('اتصال برقرار است.', 'Connection works.'); msg.className = 'ok'; }
      else {
        var m = { invalid_key: L('کلید معتبر نیست.', 'Invalid key.'), bad_model: L('این مدل برای کلید در دسترس نیست.', 'This model is not available for the key.'), rate_limited: L('سهمیه یا محدودیت نرخ.', 'Quota or rate limit.'), network: L('اتصال اینترنت برقرار نشد.', 'Could not reach the internet.'), no_key: L('کلیدی ذخیره نشده.', 'No key saved.') };
        msg.textContent = m[r.error && r.error.code] || (L('خطا: ', 'Error: ') + (r.error && r.error.message)); msg.className = 'bad';
      }
    };
  }
  draw();
}

/* ---------- boot ---------- */
(async function () {
  await A.refreshSettings();
  A.go('library');
})();
})(window.A);

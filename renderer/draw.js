/* SVG renderers. Every call gets a unique uid so pattern/marker ids never collide across several SVGs. */
(function (A) {
'use strict';
var ORDER = A.ORDER, GROUPS = A.GROUPS, IO_PORTS = A.IO_PORTS;
var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
var UID = 'x', seq = 0, CUR = null;

function f1(n) { return Math.round(n * 10) / 10; }
function R(x, y, w, h, c, a) {
  c = c || 'bf';
  var fill = c === 'fg' ? ' fill="url(#fing-' + UID + ')"' : c === 'bh' ? ' fill="url(#hat-' + UID + ')"' : '';
  return '<rect class="' + c + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + ((c === 'bf' || c === 'bl') ? ' pathLength="1"' : '') + fill + (a ? ' ' + a : '') + '/>';
}
function Ci(x, y, r, c) {
  c = c || 'bl';
  return '<circle class="' + c + '" cx="' + x + '" cy="' + y + '" r="' + r + '"' + ((c === 'bf' || c === 'bl') ? ' pathLength="1"' : '') + '/>';
}
function T(x, y, s, c, a) { return '<text class="' + (c || 'bt') + '" x="' + x + '" y="' + y + '" ' + (a || '') + '>' + s + '</text>'; }
function part(id, inner) {
  var est = CUR && CUR.conf && CUR.conf[id] === 'est' ? ' est' : '';
  return '<g class="part' + est + '" data-g="' + id + '" tabindex="0" role="button" aria-label="' + GROUPS[id].fa + '" style="--d:' + (ORDER.indexOf(id) * 0.09).toFixed(2) + 's">' + inner + '</g>';
}

/* ---------- top view ---------- */
function renderTop(c, opts) {
  opts = opts || {};
  UID = 'u' + (++seq); CUR = c;
  var B = c.board, P = c.parts, g = P.gpu, s = '';
  s += '<defs><pattern id="fing-' + UID + '" width="6" height="16" patternUnits="userSpaceOnUse"><rect width="3.6" height="16" fill="#FFC857" fill-opacity=".8"/></pattern>' +
    '<pattern id="hat-' + UID + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#8FD3FF" stroke-width="1" stroke-opacity=".6"/></pattern>' +
    '<marker id="ah-' + UID + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#BFE3FF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>';
  s += '<g transform="translate(100,80)">';
  s += '<path class="bc" d="M' + g.cx + ' -26V' + (B.h + 26) + 'M-26 ' + g.cy + 'H' + (B.w + 26) + '"/>';
  s += '<rect class="board" width="' + B.w + '" height="' + B.h + '" rx="10"/><rect class="bd" x="12" y="12" width="' + (B.w - 24) + '" height="' + (B.h - 24) + '" rx="6"/>';
  [[22, 22], [B.w - 22, 22], [22, B.h - 22], [B.w - 22, B.h - 22]].forEach(function (p) { s += Ci(p[0], p[1], 6, 'bd'); });
  s += '<g class="flows">';
  function poly(path, cls) {
    var q = path.map(function (p) { return p.join(','); }).join(' ');
    return '<polyline class="fl fl-b ' + cls + '" points="' + q + '"/><polyline class="fl fl-d ' + cls + '" points="' + q + '"/>';
  }
  c.flows.power.forEach(function (p) { s += poly(p, 'pw'); });
  P.mem.chips.forEach(function (ch) {
    var x = ch[0] + (ch[2] || P.mem.w) / 2, y = ch[1] + (ch[3] || P.mem.h) / 2;
    s += '<line class="fl fl-b dt" x1="' + g.cx + '" y1="' + g.cy + '" x2="' + x + '" y2="' + y + '"/><line class="fl fl-d dt" x1="' + g.cx + '" y1="' + g.cy + '" x2="' + x + '" y2="' + y + '"/>';
  });
  c.flows.pcie.forEach(function (p) { s += poly(p, 'dt'); });
  s += '</g>';
  var p = P.pcie;
  s += part('pcie', R(p.x, p.y, 100, 16, 'fg') + R(p.x + 110, p.y, p.w - 110, 16, 'fg') + T(p.x + p.w / 2, p.y - 8, 'PCIe 3.0 ×16', 'bt', 'text-anchor="middle"'));
  var io = R(-34, 0, 34, B.h, 'bh'), y = 24;
  (c.ports || IO_PORTS).forEach(function (pt) {
    if (pt.length === 3) { io += R(-30, pt[1], 24, pt[2], 'bf') + T(-40, pt[1] + pt[2] / 2 + 4, pt[0], 'bt mu', 'text-anchor="end"'); return; }
    io += R(-30, y, 24, pt[1], 'bf') + T(-40, y + pt[1] / 2 + 4, pt[0], 'bt mu', 'text-anchor="end"'); y += pt[1] + 14;
  });
  s += part('io', io);
  var m = '';
  (P.mem.ghosts || []).forEach(function (gh) { m += '<rect class="ghost gh" x="' + gh[0] + '" y="' + gh[1] + '" width="' + gh[2] + '" height="' + gh[3] + '"/>'; });
  P.mem.chips.forEach(function (ch, i) { var cw = ch[2] || P.mem.w, chh = ch[3] || P.mem.h; m += R(ch[0], ch[1], cw, chh) + Ci(ch[0] + 7, ch[1] + 7, 2.2, 'bd') + T(ch[0] + cw / 2, ch[1] + chh / 2 + 4, 'M' + (i + 1), 'bt', 'text-anchor="middle"'); });
  s += part('mem', m);
  var mt = ''; P.mount.pts.forEach(function (q) { mt += Ci(q[0], q[1], 5) + '<path class="bl" d="M' + (q[0] - 9) + ' ' + q[1] + 'H' + (q[0] + 9) + 'M' + q[0] + ' ' + (q[1] - 9) + 'V' + (q[1] + 9) + '"/>'; });
  s += part('mount', mt);
  var h = g.pkg / 2;
  s += part('gpu', R(g.cx - h, g.cy - h, g.pkg, g.pkg) + R(g.cx - h + 10, g.cy - h + 10, g.pkg - 20, g.pkg - 20, 'bd') + R(g.cx - (g.dw || g.die) / 2, g.cy - (g.dh || g.die) / 2, g.dw || g.die, g.dh || g.die, 'bk') +
    T(g.cx, g.cy + 4, 'DIE', 'bt at', 'text-anchor="middle"') + T(g.cx, g.cy - h + 26, g.label, 'bt', 'text-anchor="middle"') + T(g.cx, g.cy + h - 18, g.area, 'bt mu', 'text-anchor="middle"'));
  var v = P.vrm, vm = '', i;
  if (v.dir === 'v') {
    v.rows.forEach(function (r, i) {
      var cxm = v.x + v.ch.dx, mn = Math.min(r.w, r.h);
      if (v.st) vm += R(v.x + v.st.dx, r.y + 3, v.st.w, r.h - 6);
      vm += R(cxm, r.y, r.w, r.h) + Ci(cxm + r.w / 2, r.y + r.h / 2, Math.max(6, mn / 2 - 4)) + T(cxm + r.w / 2, r.y + r.h / 2 + 3.5, 'L' + (i + 1), 'bt', 'text-anchor="middle"');
      if (v.cap) vm += Ci(v.x + v.cap.dx, r.y + r.h / 2, 8);
    });
    vm += T(v.bbox[0], v.bbox[3] + 16, 'VRM · ' + v.phases + ' PHASE', 'bt at');
  } else
  for (i = 0; i < v.phases; i++) {
    var x = v.x + i * v.pitch;
    vm += R(x, v.y, 38, 38) + Ci(x + 19, v.y + 19, 12) + T(x + 19, v.y + 23, 'L' + (i + 1), 'bt', 'text-anchor="middle"') + R(x + 2, v.y + 48, 16, 22) + R(x + 20, v.y + 48, 16, 22) + Ci(x + 10, v.y + 92, 9) + Ci(x + 28, v.y + 92, 9);
  }
  if (v.dir !== 'v') vm += T(v.x, v.y + 124, 'VRM · ' + v.phases + ' PHASE', 'bt at');
  s += part('vrm', vm);
  var w = P.pwm, pw = R(w.x, w.y, w.w, w.h, 'bk'), k;
  for (k = 0; k < 4; k++) pw += '<path class="ba" d="M' + (w.x - 6) + ' ' + (w.y + 9 + k * 11) + 'H' + w.x + 'M' + (w.x + w.w) + ' ' + (w.y + 9 + k * 11) + 'H' + (w.x + w.w + 6) + '"/>';
  s += part('pwm', pw + T(w.x + w.w / 2, w.y + w.h / 2 + 4, w.label, 'bt at', 'text-anchor="middle"'));
  var b = P.bios; s += part('bios', R(b.x, b.y, b.w, b.h) + T(b.x + b.w / 2, b.y + b.h / 2 + 4, b.label, 'bt', 'text-anchor="middle"'));
  var f = P.fan; s += part('fan', R(f.x, f.y, f.w, f.h) + T(f.x + f.w / 2, f.y + f.h / 2 + 4, f.label, 'bt', 'text-anchor="middle"'));
  var a = P.aux, ax = R(a.x, a.y, a.w, a.h), cols = a.pins / 2, pwid = (a.w - 16) / cols;
  for (var r = 0; r < 2; r++) for (var q = 0; q < cols; q++) ax += R(a.x + 8 + q * pwid + 2, a.y + 8 + r * 18, pwid - 4, 12, 'bk');
  var leftLab = a.x + a.w + 130 > B.w;
  s += part('aux', ax + (a.lab === 'below' ? T(a.x + a.w / 2, a.y + a.h + 14, a.label, 'bt at', 'text-anchor="middle"') : leftLab ? T(a.x - 8, a.y + a.h - 6, a.label, 'bt at', 'text-anchor="end"') : T(a.x + a.w + 8, a.y + a.h - 8, a.label, 'bt at')));
  ORDER.forEach(function (id, i) { var t = c.tags[id]; s += '<g class="badge" data-g="' + id + '" aria-hidden="true"><circle cx="' + t[0] + '" cy="' + t[1] + '" r="11"/><text class="bn" x="' + t[0] + '" y="' + t[1] + '">' + (i + 1) + '</text></g>'; });
  var Air = c.air;
  Air.fans.forEach(function (fn) {
    s += '<circle class="bd af" cx="' + fn.cx + '" cy="' + fn.cy + '" r="' + fn.r + '"/>';
    if (Air.type === 'axial') for (var n = 0; n < 8; n++) {
      var an = n * Math.PI / 4, r1 = fn.r * .3, r2 = fn.r * .85;
      s += '<line class="fl fl-d af" x1="' + f1(fn.cx + r1 * Math.cos(an)) + '" y1="' + f1(fn.cy + r1 * Math.sin(an)) + '" x2="' + f1(fn.cx + r2 * Math.cos(an)) + '" y2="' + f1(fn.cy + r2 * Math.sin(an)) + '" marker-end="url(#ah-' + UID + ')"/>';
    }
  });
  Air.arrows.forEach(function (ar) { s += '<line class="fl fl-d af" x1="' + ar[0][0] + '" y1="' + ar[0][1] + '" x2="' + ar[1][0] + '" y2="' + ar[1][1] + '" marker-end="url(#ah-' + UID + ')"/>'; });
  if (!opts.mini) {
    s += '<path class="ba" d="M0 ' + (B.h + 36) + 'H' + B.w + 'M0 ' + (B.h + 30) + 'v12M' + B.w + ' ' + (B.h + 30) + 'v12"/>' + T(B.w / 2, B.h + 56, B.len, 'bt at', 'text-anchor="middle"');
    s += '<path class="ba" d="M' + (B.w + 28) + ' 0V' + B.h + 'M' + (B.w + 22) + ' 0h12M' + (B.w + 22) + ' ' + B.h + 'h12"/>';
    var wid = B.wid === undefined ? '111 mm' : B.wid; if (wid) s += T(B.w + 38, B.h / 2 + 4, wid, 'bt at');
  }
  return s + '</g>';
}

/* ---------- exploded view ---------- */
var S = 1.15, L = 300, W = 130, OX = 215, Y0 = 40, VH = 780;
function px(u, v) { return OX + .866 * S * (u - v); }
function py(u, v) { return Y0 + .5 * S * (u + v); }
function pt(u, v, dy) { return px(u, v).toFixed(1) + ',' + (py(u, v) + (dy || 0)).toFixed(1); }
var MAT = 'matrix(' + (.866 * S).toFixed(4) + ' ' + (.5 * S).toFixed(4) + ' ' + (-.866 * S).toFixed(4) + ' ' + (.5 * S).toFixed(4) + ' ' + OX + ' ' + Y0 + ')';
function faces(t) { return '<polygon class="fc-l" points="' + pt(0, W) + ' ' + pt(L, W) + ' ' + pt(L, W, t) + ' ' + pt(0, W, t) + '"/><polygon class="fc-r" points="' + pt(L, W) + ' ' + pt(L, 0) + ' ' + pt(L, 0, t) + ' ' + pt(L, W, t) + '"/>'; }
function spin(u, v, dur) { return reduce ? '' : '<animateTransform attributeName="transform" type="rotate" from="0 ' + u + ' ' + v + '" to="360 ' + u + ' ' + v + '" dur="' + dur + 's" repeatCount="indefinite"/>'; }
function axialFan(u, v, r, dur) {
  var b = ''; for (var i = 0; i < 5; i++) { var a = i * 2 * Math.PI / 5; b += '<path class="bl" d="M' + u + ' ' + v + 'L' + f1(u + r * .8 * Math.cos(a)) + ' ' + f1(v + r * .8 * Math.sin(a)) + '"/>'; }
  return '<circle class="bl" cx="' + u + '" cy="' + v + '" r="' + r + '"/><circle class="bd" cx="' + u + '" cy="' + v + '" r="' + f1(r * .8) + '"/><g>' + b + spin(u, v, dur) + '</g><circle class="am" cx="' + u + '" cy="' + v + '" r="' + f1(r * .18) + '"/>';
}
function blowerFan(u, v, r, dur) {
  var b = ''; for (var i = 0; i < 10; i++) { var a = i * 2 * Math.PI / 10; b += '<path class="bl" d="M' + f1(u + r * .3 * Math.cos(a)) + ' ' + f1(v + r * .3 * Math.sin(a)) + 'L' + f1(u + r * .85 * Math.cos(a + .38)) + ' ' + f1(v + r * .85 * Math.sin(a + .38)) + '"/>'; }
  return '<circle class="bl" cx="' + u + '" cy="' + v + '" r="' + r + '"/><g>' + b + spin(u, v, dur) + '</g><circle class="am" cx="' + u + '" cy="' + v + '" r="' + f1(r * .22) + '"/>';
}
function layerTop(c, l) {
  var B = c.board, P = c.parts, g = P.gpu;
  function U(x) { return f1(x / B.w * L); }
  function V(y) { return f1(y / B.h * W); }
  function rc(x, y, w, h, cls) { return '<rect class="' + cls + '" x="' + U(x) + '" y="' + V(y) + '" width="' + f1(w / B.w * L) + '" height="' + f1(h / B.h * W) + '"/>'; }
  var t = '', u, v;
  switch (l.kind) {
    case 'shroud-axial':
      t = '<rect class="fc-t" width="' + L + '" height="' + W + '"/><rect class="bd" x="8" y="8" width="' + (L - 16) + '" height="' + (W - 16) + '"/>' + (l.fans === 1 ? axialFan(150, 65, 40, 1.3) : axialFan(95, 65, 34, 1.4) + axialFan(205, 65, 34, 1.2)); break;
    case 'shroud-blower':
      t = '<rect class="fc-t" width="' + L + '" height="' + W + '"/><rect class="bh" x="0" y="18" width="7" height="94" fill="url(#hat-' + UID + ')"/>' + blowerFan(232, 65, 44, 1.1) + '<path class="fl fl-d xf" d="M176 65H30" style="stroke-width:2.4"/>'; break;
    case 'heatsink':
      t = '<rect class="fc-t" width="' + L + '" height="' + W + '"/>';
      if (l.fins === 'v') { for (u = 14; u < L; u += 12) t += '<path class="fin" d="M' + u + ' 6V' + (W - 6) + '"/>'; }
      else { for (v = 10; v < W; v += 9) t += '<path class="fin" d="M30 ' + v + 'H' + (L - 30) + '"/>'; }
      if (l.heatpipes) [35, 55, 75, 95].forEach(function (vv) { t += '<path class="hp" d="M50 ' + vv + 'H250"/>'; });
      break;
    case 'base':
      t = '<rect class="ghost" width="' + L + '" height="' + W + '"/>';
      P.mem.chips.forEach(function (ch) { t += rc(ch[0], ch[1], ch[2] || P.mem.w, ch[3] || P.mem.h, 'pad'); });
      var vr = P.vrm; if (vr.dir === 'v') t += rc(vr.bbox[0] - 4, vr.bbox[1] - 4, vr.bbox[2] - vr.bbox[0] + 8, vr.bbox[3] - vr.bbox[1] + 8, 'pad'); else t += rc(vr.x - 4, vr.y - 4, (vr.phases - 1) * vr.pitch + 46, 106, 'pad');
      t += rc(g.cx - g.pkg * .45, g.cy - g.pkg * .45, g.pkg * .9, g.pkg * .9, 'cu') + rc(g.cx - g.die / 2, g.cy - g.die / 2, g.die, g.die, 'tim'); break;
    case 'pcb':
      t = '<rect class="fc-t" width="' + L + '" height="' + W + '"/>';
      t += rc(g.cx - g.pkg / 2, g.cy - g.pkg / 2, g.pkg, g.pkg, 'bf') + rc(g.cx - g.die / 2, g.cy - g.die / 2, g.die, g.die, 'bk');
      P.mem.chips.forEach(function (ch) { t += rc(ch[0], ch[1], ch[2] || P.mem.w, ch[3] || P.mem.h, 'bf'); });
      if (P.vrm.dir === 'v') P.vrm.rows.forEach(function (r) { t += rc(P.vrm.x + P.vrm.ch.dx, r.y, r.w, r.h, 'bf'); }); else for (var i = 0; i < P.vrm.phases; i++) t += rc(P.vrm.x + i * P.vrm.pitch, P.vrm.y, 38, 38, 'bf');
      t += rc(P.pwm.x, P.pwm.y, P.pwm.w, P.pwm.h, 'bk') + rc(P.aux.x, P.aux.y, P.aux.w, P.aux.h, 'bf') + rc(P.bios.x, P.bios.y, P.bios.w, P.bios.h, 'bf');
      t += '<rect class="am" x="' + U(P.pcie.x) + '" y="' + (W - 3) + '" width="' + f1(P.pcie.w / B.w * L) + '" height="3"/>'; break;
    case 'backplate':
      t = '<rect class="fc-t" width="' + L + '" height="' + W + '"/>';
      for (var s = 30; s <= 110; s += 16) t += '<path class="slot" d="M40 ' + s + 'H260"/>';
      t += '<rect class="bd" x="8" y="8" width="' + (L - 16) + '" height="' + (W - 16) + '"/>'; break;
  }
  return t;
}
function drawLayer(c, l, k) {
  var extra = '';
  if (l.kind === 'pcb') extra = '<polygon class="bh" fill="url(#hat-' + UID + ')" points="' + pt(0, 0) + ' ' + pt(0, W) + ' ' + pt(0, W, -34) + ' ' + pt(0, 0, -34) + '"/>';
  var cx = px(L, 0), cy = py(L, 0);
  var lab = '<g class="lab"><path class="ba" d="M' + f1(cx + 6) + ' ' + f1(cy) + 'H' + f1(cx + 44) + '"/>' + T(f1(cx + 52), f1(cy - 2), l.en, 'bt wh') + T(f1(cx + 52), f1(cy + 14), l.tag, 'bt mu') + '</g>';
  var fc = (l.kind === 'base') ? '' : faces(l.t);
  return '<g class="layer" data-l="' + l.id + '" tabindex="0" role="button" aria-label="' + l.fa + '" style="--k:' + k + '">' + fc + '<g class="pl" transform="' + MAT + '">' + layerTop(c, l) + '</g>' + extra + lab + '</g>';
}
function renderExp(c) {
  UID = 'u' + (++seq); CUR = c;
  var n = c.layers.length, s = '<defs><pattern id="hat-' + UID + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#8FD3FF" stroke-width="1" stroke-opacity=".6"/></pattern></defs><g class="stack">';
  for (var k = n - 1; k >= 0; k--) s += drawLayer(c, c.layers[k], k);
  return s + '</g>';
}
function applyGap(ex, c, pct) {
  var n = c.layers.length, gap = 18 + pct / 100 * 100;
  ex.style.setProperty('--gap', gap + 'px');
  var H = .5 * (L + W) * S + (n - 1) * gap + 26, shift = (VH - H) / 2 - Y0;
  var st = ex.querySelector('.stack'); if (st) st.style.transform = 'translateY(' + f1(shift) + 'px)';
  ex.setAttribute('data-open', pct > 45 ? '1' : '0');
}

A.draw = { vb: function (c) { return '0 0 ' + Math.round(c.board.w + 230) + ' 540'; }, renderTop: renderTop, renderExp: renderExp, applyGap: applyGap, f1: f1 };
})(window.A);

/* Language: Persian (fa, RTL) and English (en, LTR). Data keeps Persian in the card files;
   English texts live here, keyed by id, with accessors used by the UI. */
(function (A) {
'use strict';
var lang = 'fa';
try { var saved = localStorage.getItem('arioncore.lang'); if (saved === 'en' || saved === 'fa') lang = saved; } catch (_) { /* no storage */ }
function apply() { document.documentElement.lang = lang; document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'; document.title = 'ArionCore'; }
A.lang = function () { return lang; };
A.setLang = function (l) { lang = l === 'en' ? 'en' : 'fa'; try { localStorage.setItem('arioncore.lang', lang); } catch (_) { /* ignore */ } apply(); };
A.L = function (fa, en) { return lang === 'en' ? en : fa; };
apply();

var G = {
  gpu: ['GPU core', 'The brain of the card. Shaders, TMUs and ROPs sit on this die, and most of the heat comes from here.'],
  mem: ['Video memory (VRAM)', 'Each chip provides 32 bits of the memory bus, so the number of chips sets the bus width.'],
  vrm: ['Power delivery (VRM)', 'Converts the 12 V input into the low-voltage, high-current rail the GPU needs. Each phase has one choke and a pair of MOSFETs.'],
  pwm: ['PWM controller', 'Switches the phases on in turn and manages voltage and protections.'],
  aux: ['Auxiliary power connector', 'The card power ceiling is the 75 W PCIe slot plus whatever the connectors add.'],
  pcie: ['PCIe connection', 'Data to the motherboard and 75 W of slot power both come through this edge.'],
  bios: ['BIOS flash', 'SPI memory holding clocks, voltages and the fan curve.'],
  fan: ['Fan header', '4-pin fan connector with PWM and tach signals.'],
  io: ['Bracket and outputs', 'The video outputs sit on the bracket.'],
  mount: ['Cooler mounting holes', 'Spring-loaded screws give even pressure of the cooler on the die.']
};
var LY = {
  shroud: ['Shroud and fan', 'The fan pushes air through the fins and the shroud guides the airflow.'],
  heatsink: ['Heatsink', 'Fins (and heatpipes on bigger cards) carry the core heat into the airflow.'],
  base: ['Contact plate and TIM', 'Thermal paste on the die and pads on memory and VRM move heat into the cooler.'],
  pcb: ['Board (PCB)', 'Multilayer board carrying every component: GPU, memory, VRM and connectors.'],
  backplate: ['Backplate', 'Stiffens the board and, on some models, spreads extra heat.']
};
var CHIP = {
  gtx1060: 'GP106-400 · Pascal · Founders Edition layout from a photo',
  gtx1650: 'TU117 · Turing · approximate low-power layout',
  rtx3060: 'GA106-300 · Ampere · EVGA board layout from a photo',
  rx580: 'Polaris 20 XTX · GCN 4 · MSI board layout from a photo'
};
var CMP = { chip: 'Chip', node: 'Process node', die: 'Die', shaders: 'Shader cores', tmu: 'TMU / ROP', clock: 'Base / boost clock', mem: 'Memory', bus: 'Memory bus', bw: 'Bandwidth', tdp: 'TDP', power: 'Aux power', len: 'Length', cooler: 'Cooler' };
var SYM = {
  nodisplay: ['No picture', 'The computer powers on but the monitor shows no picture.'],
  artifacts: ['Lines or artifacts', 'I see colored lines, dots or artifacts on the screen.'],
  hot: ['Runs hot', 'The card gets very hot under load and the fans are loud.'],
  crash: ['Crash or reset in games', 'The system crashes or resets in the middle of a game.'],
  fan: ['Fan not spinning', 'The card fans do not spin or keep stopping.'],
  shutdown: ['System shuts down', 'With the card installed the PSU shuts the system down, or it will not power on at all.']
};

A.gName = function (id) { return lang === 'en' ? G[id][0] : A.GROUPS[id].fa; };
A.gRole = function (id) { return lang === 'en' ? G[id][1] : A.GROUPS[id].role; };
A.lName = function (l) { return lang === 'en' ? LY[l.id][0] : l.fa; };
A.lRole = function (l) { return lang === 'en' ? LY[l.id][1] : l.role; };
A.chip = function (c) { return lang === 'en' ? CHIP[c.id] : c.chipline; };
A.quality = function (c) {
  if (c.boardModel) return lang === 'en' ? ['Specs: reference', 'Layout: traced from a photo of ' + c.boardModel] : ['مشخصات: مرجع', 'چیدمان: از روی عکس برد ' + c.boardModel];
  return lang === 'en' ? ['Specs: reference', 'Layout: approximate'] : c.quality;
};
A.cmpLabel = function (row) { return lang === 'en' ? CMP[row[0]] : row[1]; };
A.symName = function (s) { return lang === 'en' ? SYM[s.id][0] : s.fa; };
A.symText = function (s) { return lang === 'en' ? SYM[s.id][1] : s.text; };
})(window.A = window.A || {});

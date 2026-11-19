/* Card library: every card is plain data. The renderer (draw.js) builds the blueprint, the exploded view,
   the flows and the info panels from it. Add a card by adding one block here. */
(function (A) {
'use strict';

A.ORDER = ['gpu', 'mem', 'vrm', 'pwm', 'aux', 'pcie', 'bios', 'fan', 'io', 'mount'];

A.GROUPS = {
  gpu: { fa: 'هسته‌ی گرافیکی', en: 'GPU', role: 'مغز کارت. شیدرها، TMU و ROP روی همین دای هستند و بیشترین گرما از اینجا می‌آید.' },
  mem: { fa: 'حافظه‌ی تصویری', en: 'VRAM', role: 'هر چیپ ۳۲ بیت از باس حافظه را می‌دهد، پس تعداد چیپ‌ها پهنای باس را تعیین می‌کند.' },
  vrm: { fa: 'بخش تغذیه (VRM)', en: 'VRM', role: 'ولتاژ ۱۲ ولت ورودی را به ولتاژ پایین و پرجریان هسته تبدیل می‌کند. هر فاز یک چوک و یک جفت ماسفت دارد.' },
  pwm: { fa: 'کنترلر PWM', en: 'PWM CONTROLLER', role: 'فازها را به‌نوبت روشن می‌کند و ولتاژ و محافظت‌ها را مدیریت می‌کند.' },
  aux: { fa: 'کانکتور برق کمکی', en: 'AUX POWER', role: 'سقف توان کارت برابر است با ۷۵ وات اسلات PCIe به‌اضافه‌ی توان کانکتورها.' },
  pcie: { fa: 'اتصال PCIe', en: 'PCIe EDGE', role: 'ارتباط داده با مادربرد و ۷۵ وات برق اسلات از همین لبه می‌آید.' },
  bios: { fa: 'فلش BIOS', en: 'vBIOS FLASH', role: 'حافظه‌ی SPI که کلاک‌ها، ولتاژها و منحنی فن در آن ذخیره است.' },
  fan: { fa: 'هدر فن', en: 'FAN HEADER', role: 'کانکتور ۴ پین فن با سیگنال PWM و تاکو.' },
  io: { fa: 'براکت و خروجی‌ها', en: 'I/O BRACKET', role: 'خروجی‌های تصویر روی براکت قرار دارند.' },
  mount: { fa: 'سوراخ‌های نصب کولر', en: 'COOLER MOUNT', role: 'پیچ‌های فنری فشار یکنواخت کولر روی دای را تأمین می‌کنند.' }
};

A.IO_PORTS = [['DP', 26], ['DP', 26], ['DP', 26], ['HDMI', 24], ['DVI', 58]];

A.CARDS = {
  gtx1060: {
    id: 'gtx1060', vendor: 'NVIDIA', short: 'GTX 1060', name: 'GeForce GTX 1060 6GB',
    chipline: 'GP106-400 · Pascal · چیدمان Founders Edition از روی عکس',
    board: { w: 800, h: 380, len: '≈ 250 mm (FE)' },
    stats: [['1280', 'CUDA'], ['192', 'GB/s'], ['120 W', 'TDP'], ['6 GB', 'GDDR5']],
    power: { slot: 75, aux: 75, tdp: 120, auxName: '6-pin' },
    quality: ['مشخصات: مرجع', 'چیدمان: تقریبی'],
    cmp: { chip: 'GP106-400 · Pascal', node: '16 nm TSMC', die: '≈200 mm² · 4.4 B', shaders: '1280 CUDA', tmu: '80 / 48', clock: '1506 / 1708 MHz', mem: '6 GB GDDR5 × 6 chips', bus: '192-bit', bw: '192 GB/s', tdp: '120 W', power: '1× 6-pin', len: '≈250 mm (FE)', cooler: 'Blower (Founders Edition)' },
    parts: {
      gpu: { cx: 330, cy: 190, pkg: 130, die: 54, label: 'GP106-400', area: '≈200 mm²', specs: ['GP106-400 · Pascal', '16 nm FinFET · TSMC', '≈200 mm² · 4.4 B transistors', '1280 CUDA · 80 TMU · 48 ROP', '1506 / 1708 MHz base / boost'] },
      mem: { w: 50, h: 58, chips: [[190, 128], [190, 194], [272, 44], [332, 44], [272, 278], [332, 278]], specs: ['6× GDDR5, 32-bit per chip', '192-bit bus', '8 Gbps → 192 GB/s', '6 GB (1 GB per chip)'] },
      vrm: { x: 470, y: 60, phases: 5, pitch: 50, specs: ['≈4+1 phases (GPU + memory), approx.', 'Varies by board model', 'Core rail around 1 V under load'] },
      pwm: { x: 500, y: 250, w: 60, h: 52, label: 'PWM', specs: ['Multi-phase controller', 'Part number is model-dependent'] },
      aux: { x: 560, y: -12, w: 90, h: 46, pins: 6, label: '6-PIN · 75 W', specs: ['6-pin PCIe · 75 W', '+ 75 W slot = 150 W budget', 'TDP 120 W'] },
      pcie: { x: 40, y: 364, w: 300, specs: ['PCIe 3.0 ×16 · 8 GT/s per lane', '≈15.75 GB/s per direction'] },
      bios: { x: 590, y: 262, w: 34, h: 22, label: 'SPI', specs: ['SPI flash · vBIOS'] },
      fan: { x: 690, y: 262, w: 48, h: 26, label: 'FAN', specs: ['4-pin PWM fan connector'] },
      io: { specs: ['FE: 1× DVI-D · 1× HDMI 2.0b · 3× DP 1.4'] },
      mount: { pts: [[245, 108], [415, 108], [245, 272], [415, 272]], specs: ['4 holes around the GPU package', 'Spring-loaded cooler screws'] }
    },
    tags: { gpu: [410, 118], mem: [170, 112], vrm: [455, 50], pwm: [490, 246], aux: [545, 8], pcie: [28, 356], bios: [606, 300], fan: [714, 312], io: [-17, -16], mount: [232, 96] },
    flows: {
      power: [[[605, 34], [605, 50], [470, 50]], [[605, 50], [712, 50]], [[470, 142], [430, 142], [430, 190], [395, 190]], [[430, 190], [430, 307], [382, 307]], [[430, 142], [430, 73], [382, 73]]],
      pcie: [[[327, 364], [327, 255]]]
    },
    air: { type: 'blower', fans: [{ cx: 700, cy: 190, r: 70 }], arrows: [[[630, 120], [10, 120]], [[630, 190], [10, 190]], [[630, 260], [10, 260]]] },
    layers: [
      { id: 'shroud', kind: 'shroud-blower', t: 14, fa: 'شراود و فن بلوور', en: 'SHROUD + BLOWER FAN', tag: 'EXHAUSTS VIA I/O BRACKET', specs: ['Radial (blower) fan', 'Air leaves through the I/O bracket'], role: 'فن بلوور هوا را از بالای کارت می‌کشد و از طریق براکت به بیرون کیس می‌دهد.' },
      { id: 'heatsink', kind: 'heatsink', fins: 'u', heatpipes: false, t: 26, fa: 'هیت‌سینک', en: 'HEATSINK', tag: 'AL FIN STACK', specs: ['Aluminium fin stack', 'Fins run along the airflow'], role: 'پره‌های آلومینیومی گرمای هسته را به جریان هوا می‌دهند.' },
      { id: 'base', kind: 'base', t: 6, fa: 'صفحه‌ی تماس و TIM', en: 'BASE PLATE + TIM', tag: 'PASTE + THERMAL PADS', specs: ['Thermal paste on the die', 'Thermal pads on VRM and VRAM'], role: 'خمیر حرارتی روی دای و پد حرارتی روی VRM و حافظه، گرما را به کولر منتقل می‌کنند.' },
      { id: 'pcb', kind: 'pcb', t: 12, fa: 'برد (PCB)', en: 'PCB ASSEMBLY', tag: 'GPU · 6× GDDR5 · VRM', specs: ['Multilayer FR-4 board', 'GPU, 6× GDDR5, VRM, connectors'], role: 'برد چندلایه با همه‌ی قطعات: GPU، حافظه، VRM و کانکتورها.' }
    ]
  },
  rx580: {
    id: 'rx580', vendor: 'AMD', short: 'RX 580', name: 'Radeon RX 580 8GB',
    chipline: 'Polaris 20 XTX · GCN 4 · چیدمان برد MSI از روی عکس',
    board: { w: 840, h: 380, len: '≈ 241 mm (ref.)' },
    stats: [['2304', 'SHADERS'], ['256', 'GB/s'], ['185 W', 'TDP'], ['8 GB', 'GDDR5']],
    power: { slot: 75, aux: 150, tdp: 185, auxName: '8-pin' },
    quality: ['مشخصات: مرجع', 'چیدمان: تقریبی'],
    cmp: { chip: 'Polaris 20 XTX · GCN 4', node: '14 nm GlobalFoundries', die: '≈232 mm² · 5.7 B', shaders: '2304 SP (36 CU)', tmu: '144 / 32', clock: '1257 / 1340 MHz', mem: '8 GB GDDR5 × 8 chips', bus: '256-bit', bw: '256 GB/s', tdp: '185 W', power: '1× 8-pin (ref.)', len: '≈241 mm (ref.)', cooler: 'Dual axial (typical AIB)' },
    parts: {
      gpu: { cx: 330, cy: 190, pkg: 150, die: 64, label: 'POLARIS 20', area: '≈232 mm²', specs: ['Polaris 20 XTX · GCN 4', '14 nm FinFET · GlobalFoundries', '≈232 mm² · 5.7 B transistors', '2304 SP (36 CU) · 144 TMU · 32 ROP', '1257 / 1340 MHz base / boost (ref.)'] },
      mem: { w: 50, h: 58, chips: [[176, 122], [176, 200], [255, 36], [315, 36], [375, 36], [255, 290], [315, 290], [375, 290]], specs: ['8× GDDR5, 32-bit per chip', '256-bit bus', '8 Gbps → 256 GB/s', '4 or 8 GB variants'] },
      vrm: { x: 520, y: 60, phases: 6, pitch: 48, specs: ['6-phase on the reference design', 'AIB boards: 5–8 phases', 'Core rail around 1 V under load'] },
      pwm: { x: 560, y: 250, w: 64, h: 52, label: 'PWM', specs: ['Multi-phase buck controller', 'e.g. IR3567B or uP9505 (model-dependent)'] },
      aux: { x: 620, y: -12, w: 120, h: 46, pins: 8, label: '8-PIN · 150 W', specs: ['8-pin PCIe · 150 W', '+ 75 W slot = 225 W budget', 'TDP 185 W (some boards: 6 + 8 pin)'] },
      pcie: { x: 40, y: 364, w: 300, specs: ['PCIe 3.0 ×16 · 8 GT/s per lane', '≈15.75 GB/s per direction', 'CrossFire via XDMA over PCIe'] },
      bios: { x: 650, y: 262, w: 36, h: 22, label: 'SPI', specs: ['SPI flash · vBIOS', 'Dual-BIOS switch on some models'] },
      fan: { x: 750, y: 262, w: 48, h: 26, label: 'FAN', specs: ['4-pin PWM + tach', 'Fan curve stored in the vBIOS'] },
      io: { specs: ['1× DVI-D · 1× HDMI 2.0b · 3× DP 1.4 (ref.)', 'Port mix varies by AIB model'] },
      mount: { pts: [[232, 102], [432, 102], [232, 278], [432, 278]], specs: ['4 holes around the GPU package', 'Spring-loaded screws · even die pressure'] }
    },
    tags: { gpu: [418, 112], mem: [160, 110], vrm: [505, 50], pwm: [548, 246], aux: [600, 8], pcie: [28, 356], bios: [666, 300], fan: [774, 312], io: [-17, -16], mount: [222, 90] },
    flows: {
      power: [[[680, 34], [680, 50], [520, 50]], [[680, 50], [800, 50]], [[520, 142], [466, 142], [466, 190], [405, 190]], [[466, 190], [466, 319], [425, 319]], [[466, 142], [466, 65], [425, 65]]],
      pcie: [[[310, 364], [310, 265]]]
    },
    air: { type: 'axial', fans: [{ cx: 250, cy: 190, r: 120 }, { cx: 590, cy: 190, r: 120 }], arrows: [] },
    layers: [
      { id: 'shroud', kind: 'shroud-axial', t: 14, fa: 'شراود و فن‌ها', en: 'SHROUD + 2× AXIAL FAN', tag: 'PWM-CONTROLLED', specs: ['2× axial fan (typical AIB)', 'PWM control with tach feedback'], role: 'فن‌های محوری هوا را روی فین‌ها می‌رانند و شراود مسیر هوا را هدایت می‌کند.' },
      { id: 'heatsink', kind: 'heatsink', fins: 'v', heatpipes: true, t: 26, fa: 'هیت‌سینک', en: 'HEATSINK', tag: 'AL FINS + CU HEATPIPES', specs: ['Aluminium fin stack', 'Copper heatpipes spread the heat'], role: 'هیت‌پایپ‌های مسی گرما را پخش می‌کنند و پره‌های آلومینیومی آن را به هوا می‌دهند.' },
      { id: 'base', kind: 'base', t: 6, fa: 'صفحه‌ی تماس و TIM', en: 'BASE PLATE + TIM', tag: 'PASTE + THERMAL PADS', specs: ['Copper plate on the die', 'Thermal pads on VRM and VRAM'], role: 'صفحه‌ی مسی روی دای می‌نشیند و پدهای حرارتی گرمای VRM و حافظه را به کولر می‌رسانند.' },
      { id: 'pcb', kind: 'pcb', t: 12, fa: 'برد (PCB)', en: 'PCB ASSEMBLY', tag: 'GPU · 8× GDDR5 · VRM', specs: ['Multilayer FR-4 board', 'GPU, 8× GDDR5, 6-phase VRM'], role: 'برد چندلایه با همه‌ی قطعات: GPU، حافظه، VRM و کانکتورها.' },
      { id: 'backplate', kind: 'backplate', t: 8, fa: 'بک‌پلیت', en: 'BACKPLATE', tag: 'OPTIONAL · MODEL-DEPENDENT', specs: ['Stiffener and extra heat spreader', 'Present on some models only'], role: 'برد را محکم نگه می‌دارد و روی بعضی مدل‌ها گرما را هم پخش می‌کند.' }
    ]
  },
  gtx1650: {
    id: 'gtx1650', vendor: 'NVIDIA', short: 'GTX 1650', name: 'GeForce GTX 1650 4GB',
    chipline: 'TU117 · Turing · چیدمان تقریبی مدل کم‌مصرف',
    board: { w: 680, h: 380, len: '≈ 170–200 mm (varies)' },
    ports: [['DP', 26], ['HDMI', 24], ['DVI', 58]],
    stats: [['896', 'CUDA'], ['128', 'GB/s'], ['75 W', 'TDP'], ['4 GB', 'GDDR5']],
    power: { slot: 75, aux: 0, tdp: 75, auxName: 'none' },
    quality: ['مشخصات: مرجع', 'چیدمان: تقریبی'],
    cmp: { chip: 'TU117 · Turing', node: '12 nm TSMC (FFN)', die: '≈200 mm² · 4.7 B', shaders: '896 CUDA', tmu: '56 / 32', clock: '1485 / 1665 MHz', mem: '4 GB GDDR5 × 4 chips', bus: '128-bit', bw: '128 GB/s', tdp: '75 W', power: 'None (some models: 6-pin)', len: '≈170–200 mm (varies)', cooler: 'Single or dual axial (typical)' },
    parts: {
      gpu: { cx: 300, cy: 190, pkg: 110, die: 46, label: 'TU117', area: '≈200 mm²', specs: ['TU117 · Turing', '12 nm FFN · TSMC', '≈200 mm² · 4.7 B transistors', '896 CUDA · 56 TMU · 32 ROP', '1485 / 1665 MHz base / boost'] },
      mem: { w: 50, h: 58, chips: [[165, 115], [165, 205], [255, 38], [255, 284]], specs: ['4× GDDR5 (some models GDDR6), 32-bit per chip', '128-bit bus', '8 Gbps → 128 GB/s (GDDR5)', '4 GB (1 GB per chip)'] },
      vrm: { x: 400, y: 60, phases: 4, pitch: 50, specs: ['≈3+1 phases, approx.', 'Fewer phases than the GTX 1060: lower power budget', 'Varies a lot between board models'] },
      pwm: { x: 420, y: 250, w: 56, h: 48, label: 'PWM', specs: ['Multi-phase controller', 'Part number is model-dependent'] },
      aux: { x: 500, y: -12, w: 80, h: 46, pins: 6, label: '6-PIN · OPT', specs: ['Most models: no connector, slot power only (75 W)', 'Some factory-OC models add a 6-pin', 'TDP 75 W'] },
      pcie: { x: 40, y: 364, w: 280, specs: ['PCIe 3.0 ×16 · 8 GT/s per lane', '≈15.75 GB/s per direction', 'Slot is the only power source on most models'] },
      bios: { x: 500, y: 262, w: 34, h: 22, label: 'SPI', specs: ['SPI flash · vBIOS'] },
      fan: { x: 590, y: 262, w: 48, h: 26, label: 'FAN', specs: ['4-pin PWM fan connector', 'Some models stop the fan at low load (0 dB mode)'] },
      io: { specs: ['Typical: 1× DVI-D · 1× HDMI 2.0b · 1× DP 1.4', 'Port mix varies by model'] },
      mount: { pts: [[225, 118], [375, 118], [225, 262], [375, 262]], specs: ['4 holes around the GPU package', 'Spring-loaded cooler screws'] }
    },
    tags: { gpu: [370, 128], mem: [145, 99], vrm: [385, 50], pwm: [410, 246], aux: [485, 8], pcie: [28, 356], bios: [516, 300], fan: [614, 312], io: [-17, -16], mount: [212, 106] },
    flows: {
      power: [[[540, 34], [540, 50], [400, 50]], [[540, 50], [592, 50]], [[400, 142], [380, 142], [380, 190], [355, 190]], [[380, 190], [380, 311], [305, 311]], [[380, 142], [380, 67], [305, 67]]],
      pcie: [[[300, 364], [300, 245]]]
    },
    air: { type: 'axial', fans: [{ cx: 300, cy: 190, r: 110 }], arrows: [] },
    layers: [
      { id: 'shroud', kind: 'shroud-axial', fans: 1, t: 12, fa: 'شراود و فن', en: 'SHROUD + AXIAL FAN', tag: 'SINGLE FAN (TYPICAL)', specs: ['1 or 2 axial fans depending on model', 'Zero-RPM mode on some models'], role: 'فن محوری هوا را روی فین‌ها می‌راند. روی مدل‌های ارزان معمولاً یک فن است.' },
      { id: 'heatsink', kind: 'heatsink', fins: 'v', heatpipes: false, t: 20, fa: 'هیت‌سینک', en: 'HEATSINK', tag: 'AL FIN STACK', specs: ['Small aluminium fin stack', 'Often no heatpipes at 75 W'], role: 'در توان ۷۵ وات یک بلوک آلومینیومی کوچک معمولاً کافی است و بیشتر مدل‌ها هیت‌پایپ ندارند.' },
      { id: 'base', kind: 'base', t: 6, fa: 'صفحه‌ی تماس و TIM', en: 'BASE PLATE + TIM', tag: 'PASTE + PADS', specs: ['Thermal paste on the die', 'Pads on memory on some models'], role: 'خمیر حرارتی روی دای قرار می‌گیرد و گرما را به کولر می‌رساند.' },
      { id: 'pcb', kind: 'pcb', t: 10, fa: 'برد (PCB)', en: 'PCB ASSEMBLY', tag: 'GPU · 4× GDDR5 · VRM', specs: ['Short multilayer FR-4 board', 'GPU, 4× memory, small VRM'], role: 'بُرد کوتاه چندلایه با GPU، چهار چیپ حافظه و VRM کوچک.' }
    ]
  },
  rtx3060: {
    id: 'rtx3060', vendor: 'NVIDIA', short: 'RTX 3060', name: 'GeForce RTX 3060 12GB',
    chipline: 'GA106-300 · Ampere · چیدمان برد EVGA از روی عکس',
    board: { w: 880, h: 380, len: '≈ 240–300 mm (varies)' },
    stats: [['3584', 'CUDA'], ['360', 'GB/s'], ['170 W', 'TDP'], ['12 GB', 'GDDR6']],
    power: { slot: 75, aux: 150, tdp: 170, auxName: '8-pin' },
    quality: ['مشخصات: مرجع', 'چیدمان: تقریبی'],
    cmp: { chip: 'GA106-300 · Ampere', node: '8 nm Samsung', die: '≈276 mm² · 12 B', shaders: '3584 CUDA', tmu: '112 / 48', clock: '1320 / 1777 MHz', mem: '12 GB GDDR6 × 6 chips', bus: '192-bit', bw: '360 GB/s', tdp: '170 W', power: '1× 8-pin (typical AIB)', len: '≈240–300 mm (varies)', cooler: 'Dual or triple axial (AIB)' },
    parts: {
      gpu: { cx: 330, cy: 190, pkg: 140, die: 62, label: 'GA106-300', area: '≈276 mm²', specs: ['GA106-300 · Ampere', '8 nm · Samsung', '≈276 mm² · 12 B transistors', '3584 CUDA · 112 TMU · 48 ROP', '1320 / 1777 MHz base / boost'] },
      mem: { w: 50, h: 58, chips: [[180, 126], [180, 196], [262, 38], [332, 38], [262, 284], [332, 284]], specs: ['6× GDDR6, 32-bit per chip', '192-bit bus', '15 Gbps → 360 GB/s', '12 GB (2 GB per chip); an 8 GB 128-bit variant also exists'] },
      vrm: { x: 500, y: 60, phases: 6, pitch: 48, specs: ['≈6 power-stage phases on typical AIB, approx.', 'Varies by board model (5–10)', 'Higher current than the GTX 1060'] },
      pwm: { x: 540, y: 250, w: 64, h: 52, label: 'PWM', specs: ['Multi-phase controller', 'Part number is model-dependent'] },
      aux: { x: 640, y: -12, w: 120, h: 46, pins: 8, label: '8-PIN · 150 W', specs: ['8-pin PCIe · 150 W (typical AIB)', '+ 75 W slot = 225 W budget', 'TDP 170 W'] },
      pcie: { x: 40, y: 364, w: 300, specs: ['PCIe 4.0 ×16 · 16 GT/s per lane', '≈31.5 GB/s per direction', 'Backward compatible with PCIe 3.0 slots'] },
      bios: { x: 650, y: 262, w: 34, h: 22, label: 'SPI', specs: ['SPI flash · vBIOS', 'Dual-BIOS switch on some models'] },
      fan: { x: 760, y: 262, w: 48, h: 26, label: 'FAN', specs: ['4-pin PWM fan connector', 'Fan stop at low load on most models'] },
      io: { specs: ['Typical: 3× DP 1.4a · 1× HDMI 2.1', 'Port mix varies by model'] },
      mount: { pts: [[238, 106], [422, 106], [238, 274], [422, 274]], specs: ['4 holes around the GPU package', 'Spring-loaded cooler screws'] }
    },
    tags: { gpu: [418, 112], mem: [165, 110], vrm: [485, 50], pwm: [528, 246], aux: [625, 8], pcie: [28, 356], bios: [666, 300], fan: [784, 312], io: [-17, -16], mount: [225, 94] },
    flows: {
      power: [[[700, 34], [700, 50], [500, 50]], [[700, 50], [782, 50]], [[500, 142], [455, 142], [455, 190], [400, 190]], [[455, 190], [455, 313], [382, 313]], [[455, 142], [455, 67], [382, 67]]],
      pcie: [[[310, 364], [310, 260]]]
    },
    air: { type: 'axial', fans: [{ cx: 260, cy: 190, r: 120 }, { cx: 620, cy: 190, r: 120 }], arrows: [] },
    layers: [
      { id: 'shroud', kind: 'shroud-axial', t: 14, fa: 'شراود و فن‌ها', en: 'SHROUD + 2× AXIAL FAN', tag: 'ZERO-RPM ON MOST MODELS', specs: ['2 or 3 axial fans (AIB)', 'Fans stop at low load'], role: 'فن‌های محوری هوا را روی فین‌ها می‌رانند و شراود مسیر هوا را هدایت می‌کند.' },
      { id: 'heatsink', kind: 'heatsink', fins: 'v', heatpipes: true, t: 26, fa: 'هیت‌سینک', en: 'HEATSINK', tag: 'AL FINS + CU HEATPIPES', specs: ['Aluminium fin stack', '2–4 copper heatpipes (model-dependent)'], role: 'هیت‌پایپ‌های مسی گرما را پخش می‌کنند و پره‌های آلومینیومی آن را به هوا می‌دهند.' },
      { id: 'base', kind: 'base', t: 6, fa: 'صفحه‌ی تماس و TIM', en: 'BASE PLATE + TIM', tag: 'PASTE + THERMAL PADS', specs: ['Copper plate on the die', 'Pads on GDDR6 and VRM'], role: 'صفحه‌ی مسی روی دای می‌نشیند و پدهای حرارتی گرمای VRM و حافظه را منتقل می‌کنند.' },
      { id: 'pcb', kind: 'pcb', t: 12, fa: 'برد (PCB)', en: 'PCB ASSEMBLY', tag: 'GPU · 6× GDDR6 · VRM', specs: ['Multilayer FR-4 board', 'GPU, 6× GDDR6, VRM, connectors'], role: 'برد چندلایه با همه‌ی قطعات: GPU، حافظه‌ی GDDR6، VRM و کانکتورها.' },
      { id: 'backplate', kind: 'backplate', t: 8, fa: 'بک‌پلیت', en: 'BACKPLATE', tag: 'COMMON ON AIB MODELS', specs: ['Stiffener and heat spreader', 'Present on most mid-range AIB models'], role: 'برد را محکم نگه می‌دارد و روی بیشتر مدل‌ها بخشی از گرما را پخش می‌کند.' }
    ]
  }
};
A.CARD_ORDER = ['gtx1060', 'gtx1650', 'rtx3060', 'rx580'];

A.CMP_ROWS = [['chip', 'چیپ'], ['node', 'فرایند ساخت'], ['die', 'دای'], ['shaders', 'هسته‌های پردازشی'], ['tmu', 'TMU / ROP'], ['clock', 'کلاک پایه / بوست'], ['mem', 'حافظه'], ['bus', 'باس حافظه'], ['bw', 'پهنای باند'], ['tdp', 'TDP'], ['power', 'برق کمکی'], ['len', 'طول'], ['cooler', 'خنک‌کننده']];

A.SYMPTOMS = [
  { id: 'nodisplay', fa: 'تصویر نمی‌دهد', text: 'کامپیوتر روشن می‌شود ولی مانیتور تصویر نمی‌دهد.' },
  { id: 'artifacts', fa: 'خطوط و آرتیفکت روی تصویر', text: 'روی تصویر خطوط رنگی، نقطه یا آرتیفکت می‌بینم.' },
  { id: 'hot', fa: 'داغ می‌کند', text: 'کارت زیر بار خیلی داغ می‌شود و فن‌ها بلند کار می‌کنند.' },
  { id: 'crash', fa: 'در بازی کرش یا ریست', text: 'وسط بازی سیستم کرش می‌کند یا ریست می‌شود.' },
  { id: 'fan', fa: 'فن نمی‌چرخد', text: 'فن‌های کارت نمی‌چرخند یا متناوب می‌ایستند.' },
  { id: 'shutdown', fa: 'سیستم خاموش می‌شود', text: 'با نصب کارت، منبع تغذیه سیستم را خاموش می‌کند یا اصلاً روشن نمی‌شود.' }
];

})(window.A = window.A || {});

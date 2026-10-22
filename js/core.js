/* Cyberdeck Circuits: core engine.
   State, assistant terminal, SVG drawing kit, panels, screens, music.
   Levels register themselves with CD.level({...}) from js/levels/*.js. */
(() => {
  const CD = (window.CD = window.CD || {});
  CD.levels = {};
  CD.level = (def) => { CD.levels[def.id] = def; };

  /* ================= physics (simplified for teaching) ================= */
  CD.PHYS = { LED_VF: 2.0, LED_MAX_MA: 20 };
  CD.ledMA = (supply, ohms) => (Math.max(0, supply - CD.PHYS.LED_VF) / ohms) * 1000;
  CD.fmtI = (mA) => (mA >= 1000 ? (mA / 1000).toFixed(1) + " A" : mA.toFixed(1) + " mA");
  CD.fmtR = (o) => (o >= 1000 ? o / 1000 + "kΩ" : o + "Ω");

  CD.CHAPTERS = [
    { n: 1, name: "POWER & LIGHT", th: "ไฟฟ้าและแสง", en: "Power and light", levels: [1, 2, 3, 4, 5] },
    { n: 2, name: "LOGIC GATES", th: "ลอจิกเกต: ให้วงจรตัดสินใจ", en: "Logic gates: circuits that decide", levels: [6, 7] },
    { n: 3, name: "ESP32 BASICS", th: "ไมโครคอนโทรลเลอร์ ESP32 สู่หุ่นยนต์", en: "The ESP32 microcontroller, toward robots", levels: [8, 9, 10] },
  ];
  const chapterOf = (id) => CD.CHAPTERS.find((c) => c.levels.includes(id));
  const ORDER = () => CD.CHAPTERS.flatMap((c) => c.levels).filter((id) => CD.levels[id]);

  /* ================= shared terminal lines ================= */
  const COMMON = {
    powerDownFirst: { t: "warn",
      th: "ปิดไฟก่อนแก้วงจรนะ ตัดไฟก่อนเปลี่ยนสายทุกครั้ง นิสัยนี้ช่วยรักษาบอร์ดของจริงได้",
      en: "Power down before you rewire. That habit saves real boards." },
    replaceFirst: { t: "warn",
      th: "LED ตัวนี้ไหม้ไปแล้ว กด [REPLACE LED] เพื่อเปลี่ยนตัวใหม่ก่อนนะ",
      en: "This LED is already burnt. Press [REPLACE LED] to install a fresh one first." },
    replaced: { t: "hint",
      th: "ติดตั้ง LED ตัวใหม่แล้ว ✔ ลองใหม่ได้เลย",
      en: "Fresh LED installed ✔ Try again." },
    reset: { t: "info", th: "รีเซ็ตวงจรแล้ว ลองประกอบเองอีกรอบ", en: "Circuit reset. Build it yourself." },
    bpDone: { t: "success",
      th: "✔ เสร็จแล้ว ลองกด [RESET] แล้วทำเองอีกรอบ ทำเองหนึ่งครั้งจำได้นานกว่าดูสิบครั้ง",
      en: "✔ Done. Now press [RESET] and do it yourself once. Doing beats watching." },
    allDone: { t: "success",
      th: "★ ผ่านทุกด่านที่มีตอนนี้แล้ว! จาก LED ดวงแรกจนถึงมอเตอร์หุ่นยนต์ คุณพร้อมลงมือประกอบของจริงแล้ว\nบทต่อไปกำลังสร้างอยู่",
      en: "★ You've cleared every level available. From the first LED to a robot motor, you're ready to build for real.\nMore chapters are under construction." },
  };

  /* ================= state ================= */
  const S = { screen: "menu", id: 1, st: null, auto: false, lang: "th", music: false, burned: 0, cleared: {}, log: [], typed: 0 };
  let nextId = 1, typer = null;
  const timers = [];
  const clearTimers = () => timers.splice(0).forEach((t) => { clearTimeout(t); clearInterval(t); });

  const KEY = "cyberdeck-circuits:v1";
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (saved.lang === "en" || saved.lang === "th") S.lang = saved.lang;
    if (saved.cleared && typeof saved.cleared === "object") S.cleared = saved.cleared;
    if (Number.isFinite(saved.burned)) S.burned = saved.burned;
  } catch (e) { /* storage unavailable: play without saving */ }
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ lang: S.lang, cleared: S.cleared, burned: S.burned })); } catch (e) { /* ignore */ }
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  CD.esc = esc;
  const t = (th, en) => (S.lang === "th" ? th : en);
  let app;

  /* ================= terminal ================= */
  const lookup = (e) => (CD.levels[e.lv] && CD.levels[e.lv].msgs && CD.levels[e.lv].msgs[e.key]) || COMMON[e.key];
  const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? vars[k] : m));
  const lineText = (e) => {
    const m = lookup(e);
    return m ? fill(m[S.lang], e.vars) : "[" + e.key + "]";
  };
  function say(key, vars) {
    S.log = [...S.log, { id: nextId++, key, vars, lv: S.id }].slice(-5);
    S.typed = 0;
    const box = document.getElementById("lines");
    if (box) box.innerHTML = terminalHTML();
    startTyping();
  }
  const latestText = () => (S.log.length ? lineText(S.log[S.log.length - 1]) : "");
  function startTyping() {
    clearInterval(typer);
    typer = setInterval(() => {
      const full = latestText();
      S.typed = Math.min(S.typed + 2, full.length);
      const el = document.getElementById("typing");
      if (el) el.textContent = full.slice(0, S.typed);
      if (S.typed >= full.length) clearInterval(typer);
    }, 18);
  }
  function terminalHTML() {
    return S.log.map((e, i) => {
      const m = lookup(e) || { t: "info" };
      if (i < S.log.length - 1) return `<p class="old t-${m.t}">${esc(lineText(e))}</p>`;
      return `<p class="t-${m.t}"><span id="typing">${esc(lineText(e).slice(0, S.typed))}</span><span class="caret">▌</span></p>`;
    }).join("");
  }

  /* ================= SVG kit (viewBox 0 0 800 380) ================= */
  const COL = { neon: "#39ff14", amber: "#ffb000", red: "#ff4d4d", copper: "#1f7a3a", bg: "#040806", dim: "#5a9466", cyan: "#5ee6ff", dark: "#14532d", gold: "#a07a1c" };
  const MONO = 'font-family="IBM Plex Mono, monospace"';
  const DISP = 'font-family="VT323, monospace"';
  const BAND = ["#1c1c1c", "#7c3f12", "#dc2626", "#f97316", "#facc15", "#16a34a", "#2563eb", "#7c3aed", "#9ca3af", "#f5f5f5"];
  CD.BAND = BAND;
  CD.BAND_NAMES = {
    th: ["ดำ", "น้ำตาล", "แดง", "ส้ม", "เหลือง", "เขียว", "น้ำเงิน", "ม่วง", "เทา", "ขาว"],
    en: ["Black", "Brown", "Red", "Orange", "Yellow", "Green", "Blue", "Violet", "Grey", "White"],
  };
  const bandIdx = (ohms) => { const s = String(ohms); return [+s[0], +(s[1] || 0), s.length - 2]; };
  CD.bandIdx = bandIdx;

  const SVG = {
    COL,
    text(x, y, str, o = {}) {
      return `<text x="${x}" y="${y}" text-anchor="${o.anchor || "middle"}" fill="${o.fill || COL.neon}" font-size="${o.size || 12}" ${o.display ? DISP : MONO}${o.weight ? ' font-weight="600"' : ""}${o.cls ? ` class="${o.cls}"` : ""}>${esc(str)}</text>`;
    },
    wire: (d, o = {}) => `<path class="w${o.dash ? " dash" : ""}" d="${d}"/>`,
    flow: (d, kind = "") => `<path class="flow ${kind}" d="${d}" filter="url(#glow)"/>`,
    sig: (d, hi) => (hi ? `<path class="sig" d="${d}" filter="url(#glow)"/>` : `<path class="w" d="${d}"/>`),
    node: (x, y, c = COL.neon) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`,
    hit(action, data, aria, box, inner) {
      const attrs = Object.entries(data || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join("");
      const [x, y, w, h] = box;
      return `<g data-action="${action}"${attrs} tabindex="0" role="button" aria-label="${esc(aria)}"><rect class="hit" x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="transparent"/>${inner}</g>`;
    },
    source(x, y, label = "3V3", sub = "POWER") {
      return `<rect x="${x - 50}" y="${y}" width="100" height="50" rx="6" fill="${COL.bg}" stroke="${COL.amber}" stroke-width="2"/>`
        + SVG.text(x, y + 33, label, { fill: COL.amber, size: 22, display: true })
        + SVG.text(x + 40, y + 18, "+", { fill: COL.amber, size: 14 })
        + SVG.text(x, y + 72, sub, { fill: COL.gold, size: 11 });
    },
    gnd(x, y, label = "GND") {
      return `<g stroke="${COL.neon}" stroke-width="3" stroke-linecap="round"><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 10}"/><line x1="${x - 20}" y1="${y + 10}" x2="${x + 20}" y2="${y + 10}"/><line x1="${x - 13}" y1="${y + 18}" x2="${x + 13}" y2="${y + 18}"/><line x1="${x - 6}" y1="${y + 26}" x2="${x + 6}" y2="${y + 26}"/></g>`
        + SVG.text(x, y + 46, label, { size: 12 });
    },
    sw(x1, x2, y, on, o = {}) {
      const len = x2 - x1 - 2, col = on ? COL.neon : COL.amber, label = o.label || "SW1";
      const inner = `<circle cx="${x1}" cy="${y}" r="6" fill="${COL.bg}" stroke="${COL.neon}" stroke-width="3"/>`
        + `<circle cx="${x2}" cy="${y}" r="6" fill="${COL.bg}" stroke="${COL.neon}" stroke-width="3"/>`
        + `<line class="lever" x1="${x1}" y1="${y}" x2="${x1 + len}" y2="${y}" stroke="${col}" stroke-width="5" stroke-linecap="round" style="transform-origin:${x1}px ${y}px;transform:rotate(${on ? 0 : -30}deg)"${on ? ' filter="url(#glow)"' : ""}/>`
        + SVG.text((x1 + x2) / 2, y + 48, `${label} [${on ? "ON" : "OFF"}]`, { fill: col });
      return SVG.hit(o.action || "switch", {}, `${label} ${on ? "on" : "off"}`, [x1 - 20, y - 50, x2 - x1 + 40, 84], inner);
    },
    /* vertical LED: anode lead starts at (x, y), cathode lead ends at (x, y + 80) */
    led(x, y, state = "off", o = {}) {
      const blown = state === "blown";
      const fills = { on: COL.neon, bright: "#c6ffb3", dim: "#1f8f12", faint: "#0f3d0a", surge: "#fffbe6", blown: "#3b0a0a" };
      const fillC = fills[state] || COL.bg, stroke = blown ? COL.red : COL.neon, cy = y + 38;
      let s = "";
      const bloom = { on: [40, 0.55], bright: [56, 0.75], dim: [26, 0.3], faint: [18, 0.15] }[state];
      if (bloom) s += `<circle cx="${x}" cy="${cy}" r="${bloom[0]}" fill="${COL.neon}" opacity="${bloom[1]}" filter="url(#bloom)"/>`;
      if (state === "surge") s += `<circle cx="${x}" cy="${cy}" r="60" fill="#fff7cc" opacity=".9" filter="url(#bloom)" class="flicker"/>`;
      s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 20}" stroke="${COL.copper}" stroke-width="4"/><line x1="${x}" y1="${y + 55}" x2="${x}" y2="${y + 80}" stroke="${COL.copper}" stroke-width="4"/>`;
      const tri = o.reversed ? `${x - 22},${y + 55} ${x + 22},${y + 55} ${x},${y + 20}` : `${x - 22},${y + 20} ${x + 22},${y + 20} ${x},${y + 55}`;
      const barY = o.reversed ? y + 20 : y + 55;
      s += `<polygon points="${tri}" fill="${fillC}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"${state === "on" || state === "bright" ? ' filter="url(#glow)"' : ""}${state === "surge" ? ' class="flicker"' : ""}/>`;
      s += `<line x1="${x - 22}" y1="${barY}" x2="${x + 22}" y2="${barY}" stroke="${stroke}" stroke-width="3"/>`;
      if (!blown) {
        const lit = ["on", "bright", "dim", "faint"].includes(state);
        s += `<g stroke="${lit ? COL.neon : COL.dark}" stroke-width="2" fill="none"><path d="M${x + 28} ${y + 26} L${x + 46} ${y + 14} M${x + 40} ${y + 14} H${x + 46} V${y + 20}"/><path d="M${x + 28} ${y + 42} L${x + 46} ${y + 30} M${x + 40} ${y + 30} H${x + 46} V${y + 36}"/></g>`;
      } else {
        s += `<polyline points="${x - 12},${y + 24} ${x - 2},${y + 36} ${x - 8},${y + 43} ${x + 4},${y + 52}" stroke="#ff8a8a" stroke-width="2" fill="none"/>`
          + `<polyline points="${x + 14},${y + 24} ${x + 6},${y + 34} ${x + 12},${y + 40}" stroke="#ff8a8a" stroke-width="2" fill="none"/>`
          + `<circle cx="${x - 8}" cy="${y + 8}" r="9" fill="#6b7280" opacity=".6" class="smoke"/>`
          + `<circle cx="${x + 8}" cy="${y + 4}" r="7" fill="#9ca3af" opacity=".5" class="smoke" style="animation-delay:.8s"/>`
          + `<circle cx="${x}" cy="${y + 10}" r="8" fill="#4b5563" opacity=".6" class="smoke" style="animation-delay:1.6s"/>`
          + SVG.text(x, y + 104, "✖ BURNT", { fill: COL.red, size: 14, weight: true });
      }
      if (o.label) {
        const lx = o.left ? x - 34 : x + 56, anchor = o.left ? "end" : "start";
        s += SVG.text(lx, y + 36, o.label, { fill: blown ? COL.red : COL.neon, size: 13, weight: true, anchor });
        (o.sub || []).forEach((line, i) => { s += SVG.text(lx, y + 52 + i * 14, line, { fill: COL.dim, size: 10, anchor }); });
      }
      return o.action ? SVG.hit(o.action, o.data, o.aria || "LED", [x - 40, y, 90, 90], s) : s;
    },
    resBody(cx, cy, w, h, ohms, vertical) {
      const [a, b, m] = bandIdx(ohms);
      const cols = [BAND[a], BAND[b], BAND[m], "#d4a017"];
      let s = `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2.5}" fill="#d6c29a" stroke="#8b7355" stroke-width="1.5"/>`;
      const pos = [-0.34, -0.17, 0, 0.28];
      cols.forEach((c, i) => {
        s += vertical
          ? `<rect x="${cx - w / 2}" y="${cy + pos[i] * h - 3}" width="${w}" height="6" fill="${c}"/>`
          : `<rect x="${cx + pos[i] * w - 3}" y="${cy - h / 2}" width="6" height="${h}" fill="${c}"/>`;
      });
      return s;
    },
    resH(x1, x2, y, ohms, o = {}) {
      const cx = (x1 + x2) / 2;
      let s = `<line x1="${x1}" y1="${y}" x2="${cx - 33}" y2="${y}" stroke="#9ca3af" stroke-width="3"/><line x1="${cx + 33}" y1="${y}" x2="${x2}" y2="${y}" stroke="#9ca3af" stroke-width="3"/>`
        + SVG.resBody(cx, y, 70, 26, ohms, false);
      if (o.label !== false) s += SVG.text(cx, y - 22, o.label || "R " + CD.fmtR(ohms), { fill: COL.amber, size: 13, weight: true });
      return s;
    },
    resV(x, y1, y2, ohms, o = {}) {
      const cy = (y1 + y2) / 2;
      let s = `<line x1="${x}" y1="${y1}" x2="${x}" y2="${cy - 28}" stroke="#9ca3af" stroke-width="3"/><line x1="${x}" y1="${cy + 28}" x2="${x}" y2="${y2}" stroke="#9ca3af" stroke-width="3"/>`
        + SVG.resBody(x, cy, 24, 56, ohms, true);
      if (o.label !== false) s += SVG.text(o.left ? x - 20 : x + 20, cy + 4, o.label || CD.fmtR(ohms), { fill: COL.amber, size: 12, weight: true, anchor: o.left ? "end" : "start" });
      return s;
    },
    /* ESP32 dev board drawn on the left; pins = [{ name, y, active, action }] on its right edge (x = 190) */
    esp32(pins, o = {}) {
      let s = `<g${o.cls ? ` class="${o.cls}"` : ""}><rect x="40" y="36" width="150" height="308" rx="8" fill="#06121a" stroke="${o.fault ? COL.red : COL.cyan}" stroke-width="2"/>`
        + `<rect x="62" y="70" width="84" height="100" rx="4" fill="#0b1f2a" stroke="#2b5566"/>`
        + SVG.text(104, 112, "ESP32", { fill: COL.cyan, size: 22, display: true })
        + SVG.text(104, 132, "WROOM-32", { fill: "#2b8aa0", size: 10 })
        + `<rect x="88" y="300" width="32" height="20" rx="3" fill="#0b1f2a" stroke="#2b5566"/>`
        + SVG.text(104, 336, "USB", { fill: "#2b8aa0", size: 9 });
      if (o.reset) s += SVG.text(104, 230, "RESET!", { fill: COL.red, size: 26, display: true, cls: "flash" });
      s += "</g>";
      pins.forEach((p) => {
        const col = p.active ? COL.amber : "#7fb7c4";
        const pad = `<rect x="182" y="${p.y - 7}" width="16" height="14" rx="2" fill="${p.active ? COL.amber : "#123040"}" stroke="${col}"/>`
          + SVG.text(176, p.y + 4, p.name, { fill: col, size: 11, anchor: "end" });
        s += p.action ? SVG.hit(p.action, { pin: p.name }, "Pin " + p.name, [110, p.y - 16, 100, 32], pad) : pad;
      });
      return s;
    },
  };

  const DEFS = `<defs>
    <!-- userSpaceOnUse: a glow on a perfectly straight line has a zero-height bounding box and would vanish -->
    <filter id="glow" filterUnits="userSpaceOnUse" x="0" y="0" width="800" height="380"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bloom" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>
    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#39ff14" opacity=".12"/></pattern>
  </defs><rect width="800" height="380" fill="url(#dots)"/>`;

  /* ================= panel kit ================= */
  const K = {
    t, svg: SVG, esc,
    btn(action, label, cls = "", o = {}) {
      const attrs = Object.entries(o.data || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join("");
      return `<button class="btn ${cls}" data-action="${action}"${attrs}${o.disabled ? " disabled" : ""}${o.pressed !== undefined ? ` aria-pressed="${o.pressed}"` : ""}>${label}</button>`;
    },
    btnSwitch: (on, disabled) => K.btn("switch", `⏻ SWITCH ${on ? "OFF" : "ON"}`, "sw" + (on ? " on" : ""), { disabled }),
    panel: (title, body, cls = "") => `<div class="panel ${cls}"><h3>// ${title}</h3>${body}</div>`,
    card: (title, big, small) => K.panel(title, `<div class="big">${big}</div>${small ? `<p>${small}</p>` : ""}`, "law"),
    tray(title, items, o = {}) {
      return K.panel(title, `<div class="tray ${o.cols ? "c" + o.cols : ""}">${items.map((it) => {
        const attrs = Object.entries(it.data || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join("");
        return `<button class="part ${it.sel ? "sel" : ""}" data-action="${it.action}"${attrs} aria-pressed="${!!it.sel}"${o.disabled ? " disabled" : ""}>${it.icon || ""}<b>${it.label}</b>${it.sub ? `<small>${it.sub}</small>` : ""}</button>`;
      }).join("")}</div>`);
    },
    seg(label, action, options, current, o = {}) {
      return `<div class="seg"><span>${label}</span><div class="opts">${options.map((op) =>
        `<button class="${current === op.v ? "sel" : ""}" data-action="${action}" data-v="${esc(op.v)}" aria-pressed="${current === op.v}"${o.disabled ? " disabled" : ""}>${op.label}</button>`).join("")}</div></div>`;
    },
    /* rows: [[label, value, cls]]; mA drives the gauge */
    meter(rows, mA, o = {}) {
      const limit = o.limit || CD.PHYS.LED_MAX_MA, over = mA > limit;
      const zone = o.zone ? `<span class="zone" style="left:${(o.zone[0] / limit) * 100}%;width:${((o.zone[1] - o.zone[0]) / limit) * 100}%"></span>` : "";
      return K.panel(o.title || "multimeter", `<dl>${rows.map(([dt, dd, cls]) => `<dt>${dt}</dt><dd class="${cls || ""}">${dd}</dd>`).join("")}</dl>`
        + (o.noGauge ? "" : `<div class="gauge" aria-hidden="true">${zone}<i class="${over ? "hot" : ""}" style="width:${Math.min(mA / limit, 1) * 100}%"></i></div>
          <div class="scale"><span>0</span>${o.zone ? `<span>${t("โซนเป้าหมาย", "target")} ${o.zone[0]}–${o.zone[1]} mA</span>` : ""}<span>${o.limitLabel || t("ขีดจำกัด LED", "LED limit")} ${limit} mA</span></div>
          ${over ? '<p class="warn">⚠ OVERLOAD</p>' : ""}`), "meter");
    },
    resIcon(ohms) {
      const [a, b, m] = bandIdx(ohms);
      return `<svg viewBox="0 0 80 24" width="64" height="20" aria-hidden="true"><line x1="2" y1="12" x2="78" y2="12" stroke="#9ca3af" stroke-width="2"/><rect x="20" y="4" width="40" height="16" rx="6" fill="#d6c29a"/><rect x="26" y="4" width="4" height="16" fill="${BAND[a]}"/><rect x="33" y="4" width="4" height="16" fill="${BAND[b]}"/><rect x="40" y="4" width="4" height="16" fill="${BAND[m]}"/><rect x="51" y="4" width="4" height="16" fill="#d4a017"/></svg>`;
    },
  };
  CD.kit = K;

  /* ================= level API ================= */
  const L = () => CD.levels[S.id];
  const api = {
    say,
    t,
    later: (fn, ms) => { timers.push(setTimeout(fn, ms)); },
    clearTimers,
    every: (fn, ms) => { timers.push(setInterval(fn, ms)); },
    render: () => renderGame(),
    renderBoard: () => renderBoard(),
    renderSide: () => { const el = document.getElementById("side"); if (el) el.innerHTML = L().side(S.st, K); },
    renderControls: () => { const el = document.getElementById("controls"); if (el) el.innerHTML = controlsHTML(); },
    refresh() { api.renderBoard(); api.renderSide(); api.renderControls(); },
    clear() { if (!S.cleared[S.id]) { S.cleared[S.id] = true; save(); } },
    burn() { S.burned += 1; save(); const b = document.querySelector(".counter b"); if (b) b.textContent = S.burned; },
    vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p || [60, 40, 140]); } catch (e) { /* ignore */ } },
    done(key = "bpDone", vars) { S.auto = false; api.clear(); renderGame(); say(key, vars); },
    get auto() { return S.auto; },
    set auto(v) { S.auto = v; },
  };
  CD.api = api;

  /* ================= screens ================= */
  function headerHTML() {
    const inGame = S.screen === "game";
    const lv = L(), ch = inGame ? chapterOf(S.id) : null;
    return `<header class="bar">
      <div>
        <div class="brand">CYBERDECK CIRCUITS</div>
        <div class="sub">${inGame ? `CH.${ch.n} // ${lv.code} : ${esc(lv.name)} ${S.cleared[S.id] ? '<span class="ok">[CLEARED ✔]</span>' : ""}` : "CHAPTER MAP"}</div>
      </div>
      <div class="tools">
        <span class="counter">LEDs sacrificed for science: <b>${S.burned}</b></span>
        ${inGame ? `<button class="chip" data-action="menu">◀ MAP</button>` : ""}
        <button class="chip" data-action="lang" aria-label="Switch language">${S.lang === "th" ? "ภาษา: TH" : "LANG: EN"}</button>
        <button class="chip ${S.music ? "on" : ""}" data-action="music" aria-pressed="${S.music}">♪ LO-FI ${S.music ? "ON" : "OFF"}</button>
      </div>
    </header>`;
  }

  function renderMenu() {
    S.screen = "menu";
    clearTimers(); clearInterval(typer);
    const ids = ORDER(), done = ids.filter((id) => S.cleared[id]).length;
    const card = (id) => {
      const lv = CD.levels[id];
      return `<button class="lvl" data-action="start" data-level="${id}">
        <span class="code">${lv.code}</span><span class="name">${esc(lv.name)}</span>
        <span class="what">${esc(lv[S.lang])}</span>
        <span class="state ${S.cleared[id] ? "ok" : ""}">${S.cleared[id] ? t("✔ ผ่านแล้ว · เล่นอีกครั้ง", "✔ cleared · play again") : t("▶ เล่น", "▶ play")}</span>
      </button>`;
    };
    app.innerHTML = headerHTML() + `
      <section class="hero">
        <span class="tag">${t("ฝึกวงจรก่อนลงมือประกอบหุ่นยนต์และคอมพิวเตอร์จริง", "Practice circuits before you build real robots and PCs")}</span>
        <h1>Boot up.<br>Wire it right.</h1>
        <p>${t("เกมไขปริศนาวงจรไฟฟ้า ตั้งแต่สวิตช์และ LED ไปจนถึงลอจิกเกตและการต่อสาย ESP32 กับมอเตอร์ ทำพลาดได้ไม่มีเกมโอเวอร์ ผู้ช่วยในเทอร์มินัลจะอธิบายว่าเกิดอะไรขึ้นทุกครั้ง",
          "A circuit puzzle game, from switches and LEDs up to logic gates, ESP32 wiring and motors. Mistakes never end the game; the assistant terminal explains what happened every time.")}</p>
        <span class="progress">${t("ผ่านแล้ว", "Cleared")} <b>${done}</b> / ${ids.length} ${t("ด่าน", "levels")}</span>
      </section>
      ${CD.CHAPTERS.map((ch) => `<section class="chapter">
        <header><h2>CHAPTER ${ch.n} · ${esc(ch.name)}</h2><span>${esc(ch[S.lang])}</span></header>
        <div class="levels">${ch.levels.filter((id) => CD.levels[id]).map(card).join("")}</div>
      </section>`).join("")}
      <section class="chapter soon">
        <header><h2>CHAPTER 4 · PC POWER</h2><span>${t("รางไฟ 12V / 5V / 3.3V ของ PSU และการประกอบคอม · กำลังสร้าง", "PSU rails 12V / 5V / 3.3V and PC assembly · under construction")}</span></header>
      </section>`;
  }

  function boardHTML() {
    const lv = L(), st = S.st;
    let status = lv.status ? lv.status(st) : ["", "warn"];
    if (typeof status === "string") status = [status, "warn"];
    return `<div class="boardhead"><h3>// breadboard_view</h3>${status[0] ? `<span class="status ${status[1]}">${esc(status[0])}</span>` : ""}</div>
      <svg viewBox="0 0 800 380" class="board" role="img" aria-label="${esc(lv.name)} circuit">${DEFS}${lv.board(st, K)}</svg>
      <p class="note">${lv.note ? lv.note(st, K) : ""}</p>`;
  }
  function renderBoard() {
    const box = document.getElementById("boardbox");
    if (!box) return;
    box.className = "panel boardbox " + (L().boardClass ? L().boardClass(S.st) : "");
    box.innerHTML = boardHTML();
  }
  function controlsHTML() {
    const lv = L(), st = S.st;
    const blown = lv.isBlown ? lv.isBlown(st) : false;
    const nextId = ORDER()[ORDER().indexOf(S.id) + 1];
    return (lv.buttons ? lv.buttons(st, K) : "")
      + K.btn("reset", blown ? "↻ REPLACE LED" : "↺ RESET", "reset" + (blown ? " alert" : ""), { disabled: S.auto })
      + K.btn("blueprint", "💡 BLUEPRINT", "bp", { disabled: S.auto })
      + (S.cleared[S.id] && !S.auto ? K.btn("next", nextId ? t("ด่านต่อไป ▶", "NEXT LEVEL ▶") : t("จบทุกด่าน ▶", "ALL CLEAR ▶"), "next") : "");
  }
  function renderGame() {
    const lv = L();
    app.innerHTML = headerHTML() + `
      <div class="grid">
        <section class="panel boardbox ${lv.boardClass ? lv.boardClass(S.st) : ""}" id="boardbox">${boardHTML()}</section>
        <aside class="side" id="side">${lv.side(S.st, K)}</aside>
      </div>
      <section class="panel term" data-action="skip" aria-live="polite" title="Tap to skip typing">
        <h3>// assistant_terminal</h3>
        <div class="lines" id="lines">${terminalHTML()}</div>
      </section>
      <nav class="controls" id="controls">${controlsHTML()}</nav>`;
  }
  const render = () => (S.screen === "game" ? renderGame() : renderMenu());

  function startLevel(id) {
    clearTimers();
    Object.assign(S, { screen: "game", id, auto: false, st: CD.levels[id].init(), log: [], typed: 0 });
    renderGame();
    if (L().enter) L().enter(S.st, api);
    say("intro");
    window.scrollTo({ top: 0 });
  }

  /* ================= lo-fi music (generated, no audio file) ================= */
  const Music = {
    ctx: null, out: null, noise: null, timer: null, t: 0, bar: 0, BAR: 2.4,
    CHORDS: [[57, 60, 64, 67], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 64]],
    BASS: [45, 41, 48, 43],
    hz: (m) => 440 * Math.pow(2, (m - 69) / 12),
    init() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const c = (this.ctx = new AC());
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500;
      this.out = c.createGain(); this.out.gain.value = 0;
      this.out.connect(lp); lp.connect(c.destination);
      const buf = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      return true;
    },
    tone(type, f, at, dur, peak, attack) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g); g.connect(this.out); o.start(at); o.stop(at + dur + 0.05);
    },
    kick(at) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(120, at); o.frequency.exponentialRampToValueAtTime(45, at + 0.15);
      g.gain.setValueAtTime(0.5, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.3);
      o.connect(g); g.connect(this.out); o.start(at); o.stop(at + 0.35);
    },
    hat(at) {
      const c = this.ctx, s = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noise; hp.type = "highpass"; hp.frequency.value = 6000;
      g.gain.setValueAtTime(0.06, at); g.gain.exponentialRampToValueAtTime(0.001, at + 0.06);
      s.connect(hp); hp.connect(g); g.connect(this.out); s.start(at); s.stop(at + 0.1);
    },
    playBar(at) {
      const i = this.bar++ % 4, B = this.BAR;
      this.CHORDS[i].forEach((m) => this.tone("triangle", this.hz(m), at, B, 0.05, 0.35));
      this.tone("sine", this.hz(this.BASS[i]), at, B * 0.9, 0.18, 0.05);
      this.kick(at); this.kick(at + B / 2 + B / 8);
      this.hat(at + B / 4); this.hat(at + (3 * B) / 4);
    },
    start() {
      if (!this.ctx && !this.init()) return false;
      this.ctx.resume();
      const now = this.ctx.currentTime;
      this.out.gain.cancelScheduledValues(now);
      this.out.gain.setTargetAtTime(0.55, now, 0.4);
      this.t = now + 0.1;
      const tick = () => { while (this.t < this.ctx.currentTime + 1) { this.playBar(this.t); this.t += this.BAR; } };
      tick(); clearInterval(this.timer); this.timer = setInterval(tick, 250);
      return true;
    },
    stop() {
      if (!this.ctx) return;
      clearInterval(this.timer);
      this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    },
  };

  /* ================= events ================= */
  function act(el) {
    const a = el.dataset.action, lv = L();
    switch (a) {
      case "start": return startLevel(Number(el.dataset.level));
      case "menu": return renderMenu();
      case "skip": {
        S.typed = latestText().length; clearInterval(typer);
        const tEl = document.getElementById("typing"); if (tEl) tEl.textContent = latestText();
        return;
      }
      case "lang":
        S.lang = S.lang === "th" ? "en" : "th"; save(); render();
        if (S.screen === "game") { S.typed = latestText().length; const box = document.getElementById("lines"); if (box) box.innerHTML = terminalHTML(); }
        return;
      case "music":
        if (S.music) { Music.stop(); S.music = false; } else { S.music = Music.start(); }
        el.classList.toggle("on", S.music); el.setAttribute("aria-pressed", S.music);
        el.textContent = "♪ LO-FI " + (S.music ? "ON" : "OFF");
        return;
      case "reset": {
        if (S.auto) return;
        clearTimers();
        const blown = lv.isBlown ? lv.isBlown(S.st) : false;
        S.st = lv.again ? lv.again(S.st) : lv.init();
        renderGame();
        if (lv.enter) lv.enter(S.st, api);
        return say(blown ? "replaced" : "reset");
      }
      case "blueprint":
        if (S.auto) return;
        clearTimers();
        S.st = lv.again ? lv.again(S.st) : lv.init(); S.auto = true;
        renderGame();
        if (lv.enter) lv.enter(S.st, api);
        return lv.blueprint(S.st, api);
      case "next": {
        const nextId = ORDER()[ORDER().indexOf(S.id) + 1];
        if (nextId) return startLevel(nextId);
        say("allDone");
        return api.later(renderMenu, 4000);
      }
      default:
        if (S.screen !== "game" || S.auto) return;
        if (lv.busy && lv.busy(S.st)) return;
        return lv.act(a, el, S.st, api);
    }
  }

  CD.boot = () => {
    app = document.getElementById("app");
    app.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (el && !el.disabled) act(el);
    });
    app.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target.closest("g[data-action]");
      if (el) { e.preventDefault(); act(el); }
    });
    // #lv5 opens level 5 directly (shareable links)
    const fromHash = () => {
      const id = Number((location.hash.match(/^#lv(\d+)$/) || [])[1]);
      if (CD.levels[id]) startLevel(id); else renderMenu();
    };
    window.addEventListener("hashchange", fromHash);
    fromHash();
  };
})();

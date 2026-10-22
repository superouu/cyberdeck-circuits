/* Chapter 1: Power & Light (LV.1 – LV.5) */
(() => {
  const { ledMA, fmtI, fmtR } = CD;
  const LOOP = "M100 150 V80 H680 V320 H100"; // 3V3 → top rail → LED at x=680 → GND
  const SURGE_MS = 900;

  /* ===================================================================== */
  /* LV.1 The Switch                                                       */
  /* ===================================================================== */
  CD.level({
    id: 1, code: "LV.1", name: "The Switch", th: "วงจรปิด / วงจรเปิด", en: "Open vs. closed circuits",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 1-1: สวิตช์ (THE SWITCH)\nไฟฟ้าจะไหลได้ต้องมี 'วงจรปิด' คือเส้นทางครบรอบจาก 3V3 ผ่าน LED กลับไปที่ GND\nตอนนี้สวิตช์ SW1 ยกขึ้นอยู่ วงจรจึงขาด แตะที่สวิตช์เพื่อปิดวงจร",
        en: "> MISSION 1-1: THE SWITCH\nCurrent only flows through a CLOSED circuit: a complete loop from 3V3, through the LED, back to GND.\nSW1 is lifted, so the loop is broken. Tap the switch to close it." },
      on: { t: "success",
        th: "✔ วงจรปิดแล้ว! กระแสไหล 3V3 → SW1 → LED → GND\nโมดูล LED ด่านนี้มีตัวต้านทานในตัว กระแสจึงอยู่ที่ราว 3.9mA ปลอดภัย\nสวิตช์ทำแค่ 'ต่อ' หรือ 'ตัด' เส้นทาง ต่อไปขา GPIO ของ ESP32 จะทำหน้าที่คล้ายๆ สวิตช์นี้ แต่สั่งด้วยโค้ด",
        en: "✔ Circuit closed! Current flows 3V3 → SW1 → LED → GND.\nThis LED module has a built-in resistor, so the current sits at a safe ≈3.9mA.\nA switch only connects or breaks the path. Later, an ESP32 GPIO pin will do the same job, controlled by code." },
      off: { t: "info", th: "ตัดวงจรแล้ว เส้นทางขาด กระแส = 0 LED จึงดับ", en: "Circuit broken. No path, current = 0, so the LED goes dark." },
      reset: { t: "info", th: "ตัดวงจรแล้ว ลองปิดวงจรเองอีกครั้ง", en: "Circuit open again. Close it yourself." },
      bp: { t: "hint",
        th: "💡 BLUEPRINT: กระแสต้องมีเส้นทางครบรอบถึงจะไหล ช่องที่ขาดอยู่คือสวิตช์ SW1\nกำลังกดสวิตช์ลงเพื่อปิดวงจรให้...",
        en: "💡 BLUEPRINT: current needs a complete loop. The only break is at SW1.\nPressing the switch down to close the loop..." },
    },
    init: () => ({ on: false }),
    status: (st) => (st.on ? ["CIRCUIT: CLOSED", "ok"] : ["CIRCUIT: OPEN", "warn"]),
    boardClass: (st) => (st.on ? "lit" : ""),
    board(st, k) {
      const s = k.svg;
      return s.wire("M100 150 V80 H220") + s.wire("M300 80 H680 V160") + s.wire("M680 240 V320 H100")
        + (st.on ? s.flow(LOOP) : "") + s.source(100, 150) + s.gnd(100, 320)
        + s.sw(220, 300, 80, st.on) + s.led(680, 160, st.on ? "on" : "off", { label: "LED1", sub: ["Vf≈2.0V", "+R inside"] });
    },
    note: (st, k) => k.t("แตะที่สวิตช์ในวงจรได้โดยตรง · เส้นประเคลื่อนที่ = กระแสไหล (+ → −)", "Tap the switch on the board · moving dashes = current flowing (+ → −)"),
    side(st, k) {
      const I = st.on ? ledMA(3.3, 330) : 0;
      return k.meter([["Supply", "3.3 V"], ["LED drop", "2.0 V"], ["Series R", "330Ω (built-in)"], ["Current", fmtI(I), I ? "good" : ""]], I)
        + k.card("closed loop", "3V3 → LED → GND", k.t("ขาดตรงไหน กระแสหยุดทั้งวง", "Break it anywhere and the whole loop stops"));
    },
    buttons: (st, k) => k.btnSwitch(st.on),
    act(a, el, st, api) {
      if (a !== "switch") return;
      st.on = !st.on;
      if (st.on) api.clear();
      api.render();
      api.say(st.on ? "on" : "off");
    },
    blueprint(st, api) {
      api.say("bp");
      api.later(() => { st.on = true; api.done(); }, 2000);
    },
  });

  /* ===================================================================== */
  /* LV.2 The Resistor                                                     */
  /* ===================================================================== */
  const PARTS2 = { wire: { name: "JUMPER WIRE", ohms: 0.1, spec: "≈0.1Ω" }, resistor: { name: "RESISTOR", ohms: 330, spec: "330Ω ±5%" } };
  CD.level({
    id: 2, code: "LV.2", name: "The Resistor", th: "กฎของโอห์มและความปลอดภัยของ LED", en: "Ohm's law and LED safety",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 1-2: ตัวต้านทาน (THE RESISTOR)\nด่านที่แล้ว LED มีตัวต้านทานในตัว ด่านนี้เป็น LED เปล่าๆ\nมีช่องว่าง [GAP] ระหว่างสวิตช์กับ LED เลือกชิ้นส่วนจากถาด PARTS มาวาง แล้วเปิดสวิตช์ทดสอบ\nลองผิดได้เต็มที่ ที่นี่คือแล็บของเรา",
        en: "> MISSION 1-2: THE RESISTOR\nLast level's LED had a built-in resistor. This one is a bare LED.\nThere's a [GAP] between the switch and the LED. Pick a part from the PARTS tray, then flip the switch.\nMistakes are welcome here. This is your lab." },
      gapHint: { t: "hint", th: "ช่องว่างยังว่างอยู่ แตะชิ้นส่วนในถาด PARTS เพื่อวางลงตรงนี้", en: "The gap is empty. Tap a part in the PARTS tray to drop it here." },
      placedWire: { t: "info",
        th: "วาง 'สายไฟ' แล้ว สายไฟมีความต้านทานแทบเป็นศูนย์ (≈0.1Ω)\nลองคิดดู: ถ้าไม่มีอะไรจำกัด กระแสที่ไหลผ่าน LED จะมากแค่ไหน? เปิดสวิตช์ดูได้เลย",
        en: "Wire placed. A wire has almost zero resistance (≈0.1Ω).\nWith nothing to limit it, how much current will rush through the LED? Flip the switch to find out." },
      placedResistor: { t: "info",
        th: "วาง 'ตัวต้านทาน 330Ω' แล้ว\nอ่านแถบสี: ส้ม(3) ส้ม(3) น้ำตาล(×10) = 330Ω, ทอง = คลาดเคลื่อน ±5%\nเปิดสวิตช์ทดสอบได้เลย",
        en: "Resistor placed: 330Ω.\nRead the bands: Orange(3) Orange(3) Brown(×10) = 330Ω, Gold = ±5% tolerance.\nFlip the switch to test." },
      removed: { t: "info", th: "ถอดชิ้นส่วนออกแล้ว ช่องว่างเปิดอีกครั้ง", en: "Part removed. The gap is open again." },
      openGap: { t: "warn",
        th: "สวิตช์เปิดแล้ว แต่ไม่มีกระแสไหล เพราะวงจรยังขาดตรงช่องว่าง\nกระแสต้องมีเส้นทางครบรอบจาก 3V3 กลับไปที่ GND วางชิ้นส่วนลงในช่องว่างก่อน",
        en: "Switch is ON but nothing flows. The loop is still broken at the gap.\nCurrent needs a complete path from 3V3 back to GND. Place a part first." },
      surge: { t: "error", th: "!! กระแสพุ่งสูง !! ไม่มีอะไรจำกัดกระแสเลย...", en: "!! CURRENT SURGE !! Nothing is limiting the current..." },
      blown: { t: "error",
        th: "💥 LED ไหม้แล้ว ไม่เป็นไรเลย วิศวกรทุกคนเคยเผา LED มาแล้วทั้งนั้น!\nทำไมถึงไหม้? LED ใช้แรงดันไปแค่ราว 2.0V ส่วนที่เหลือ 1.3V ไม่มีอะไรรับไว้นอกจากสายไฟ (≈0.1Ω)\nกฎของโอห์ม: I = V ÷ R = 1.3V ÷ 0.1Ω ≈ 13A (ตามทฤษฎี) ของจริงแหล่งจ่าย 3V3 จะถึงขีดจำกัดก่อน แต่ยังไงก็เกิน 20mA ที่ LED ทนได้หลายเท่า\n→ กด [REPLACE LED] แล้วลองหาชิ้นส่วนที่ 'จำกัดกระแส' ได้",
        en: "💥 The LED burned out. That's fine; every engineer has fried a few!\nWhy? The LED only uses about 2.0V. The leftover 1.3V had nothing to push against except a wire (≈0.1Ω).\nOhm's law: I = V ÷ R = 1.3V ÷ 0.1Ω ≈ 13A in theory. A real 3V3 supply hits its own limit first, but either way it's far beyond the LED's 20mA max.\n→ Press [REPLACE LED] and try a part that can LIMIT current." },
      success: { t: "success",
        th: "✔ LED ONLINE เยี่ยมมาก!\nตัวต้านทานรับแรงดันส่วนเกิน 1.3V ไว้และจำกัดกระแส: I = 1.3V ÷ 330Ω ≈ 3.9mA ต่ำกว่าขีดจำกัด 20mA อย่างปลอดภัย\nจำไว้ใช้กับโปรเจกต์ ESP32: LED ทุกดวงต้องมีตัวต้านทานต่ออนุกรม (บนไฟ 3V3 ใช้ราว 220Ω–1kΩ)",
        en: "✔ LED ONLINE. Great work, operator!\nThe resistor takes the extra 1.3V and limits the current: I = 1.3V ÷ 330Ω ≈ 3.9mA, safely under the LED's 20mA max.\nCarry this to your ESP32 builds: every LED needs a series resistor (≈220Ω–1kΩ on 3V3)." },
      switchOff: { t: "info", th: "ปิดสวิตช์ วงจรเปิด กระแส = 0", en: "Switch OFF. Circuit open, current = 0." },
      blownOff: { t: "info", th: "ปิดสวิตช์แล้ว กด [REPLACE LED] เพื่อเปลี่ยน LED ตัวใหม่", en: "Switch OFF. Press [REPLACE LED] to install a fresh LED." },
      alreadyBlown: { t: "warn",
        th: "LED ที่ไหม้แล้วจะขาดข้างใน กลายเป็น 'วงจรเปิด' กระแสจึงไม่ไหลอีก กด [REPLACE LED] ก่อนนะ",
        en: "A burnt LED is broken inside, so it acts like a gap in the circuit and no current flows. Press [REPLACE LED] first." },
      replaced: { t: "hint",
        th: "ติดตั้ง LED ตัวใหม่แล้ว ✔ ช่องว่างว่างอีกครั้ง\nคำใบ้: ชิ้นส่วนไหนที่ 'ต้านทาน' การไหลของกระแสได้?",
        en: "Fresh LED installed ✔ The gap is clear again.\nHint: which part RESISTS the flow of current?" },
      bp: { t: "hint",
        th: "💡 BLUEPRINT: กำลังเดินวงจรอัตโนมัติ...\nเป้าหมายกระแสราว 4mA: R = (V_supply − V_led) ÷ I = (3.3 − 2.0) ÷ 0.004 ≈ 325Ω → เลือกค่ามาตรฐานที่ใกล้ที่สุด = 330Ω\nวางต่ออนุกรมกับ LED แล้วเปิดสวิตช์...",
        en: "💡 BLUEPRINT: auto-routing...\nTarget ≈4mA: R = (V_supply − V_led) ÷ I = (3.3 − 2.0) ÷ 0.004 ≈ 325Ω → nearest standard value = 330Ω.\nPlacing it in series with the LED, then closing the switch..." },
    },
    init: () => ({ on: false, part: null, led: "off" }),
    busy: (st) => st.led === "surge",
    isBlown: (st) => st.led === "blown",
    status: (st) => (st.led === "blown" ? ["FAULT", "bad"] : st.led === "on" || st.led === "surge" ? ["CIRCUIT: CLOSED", "ok"] : ["CIRCUIT: OPEN", "warn"]),
    boardClass: (st) => (st.led === "blown" ? "fault" : st.led === "on" ? "lit" : st.led === "surge" ? "shake" : ""),
    board(st, k) {
      const s = k.svg, C = s.COL;
      let g = s.wire("M100 150 V80 H220") + s.wire("M300 80 H380") + s.wire("M520 80 H680 V160") + s.wire("M680 240 V320 H100");
      if (st.led === "on" || st.led === "surge") g += s.flow(LOOP, st.led === "surge" ? "fast" : "");
      g += s.source(100, 150) + s.gnd(100, 320) + s.sw(220, 300, 80, st.on);
      let gap = s.node(380, 80) + s.node(520, 80);
      if (!st.part) gap += `<g class="blink"><rect x="392" y="56" width="116" height="48" rx="4" fill="none" stroke="${C.amber}" stroke-width="2" stroke-dasharray="6 6"/>${s.text(450, 86, "[ GAP ]", { fill: C.amber, size: 16, display: true })}</g>`;
      else if (st.part === "wire") gap += `<line x1="380" y1="80" x2="520" y2="80" stroke="#c2410c" stroke-width="5" stroke-linecap="round"/>` + s.text(450, 60, "WIRE ≈0.1Ω", { fill: "#fb923c" });
      else gap += s.resH(380, 520, 80, 330, { label: "R1 330Ω" });
      g += s.hit("gap", {}, st.part ? "Gap filled, tap to remove" : "Empty gap", [375, 35, 150, 80], gap);
      g += s.led(680, 160, st.led, { label: "LED1", sub: ["Vf≈2.0V", "max 20mA"] });
      return g;
    },
    note: (st, k) => k.t("แตะที่สวิตช์หรือช่องว่างในวงจรได้โดยตรง", "Tap the switch or the gap on the board"),
    side(st, k) {
      const I = st.led === "on" || st.led === "surge" ? ledMA(3.3, PARTS2[st.part].ohms) : 0;
      return k.tray("parts_tray · tap to place", Object.entries(PARTS2).map(([id, p]) => ({
        action: "place", data: { part: id }, sel: st.part === id, label: p.name, sub: p.spec,
        icon: id === "wire" ? '<svg viewBox="0 0 80 24" width="64" height="20" aria-hidden="true"><line x1="4" y1="12" x2="76" y2="12" stroke="#c2410c" stroke-width="4" stroke-linecap="round"/></svg>' : k.resIcon(330),
      })), { disabled: st.led === "surge" })
        + k.meter([["Supply", "3.3 V"], ["LED drop", "2.0 V"], ["Series R", st.part ? PARTS2[st.part].spec : "— (gap)"],
          ["Current", st.led === "blown" ? "0.0 mA (open)" : fmtI(I), I > 20 ? "hot" : I ? "good" : ""]], I)
        + k.card("ohm's law", "V = I × R", "I = (3.3V − 2.0V) ÷ R");
    },
    buttons: (st, k) => k.btnSwitch(st.on, st.led === "surge"),
    act(a, el, st, api) {
      if (a === "place") {
        if (st.led === "blown") return api.say("replaceFirst");
        if (st.on) return api.say("powerDownFirst");
        st.part = el.dataset.part; api.refresh();
        return api.say(st.part === "wire" ? "placedWire" : "placedResistor");
      }
      if (a === "gap") {
        if (!st.part) return api.say("gapHint");
        if (st.led === "blown") return api.say("replaceFirst");
        if (st.on) return api.say("powerDownFirst");
        st.part = null; api.refresh();
        return api.say("removed");
      }
      if (a !== "switch") return;
      st.on = !st.on;
      if (!st.on) {
        if (st.led !== "blown") st.led = "off";
        api.refresh();
        return api.say(st.led === "blown" ? "blownOff" : "switchOff");
      }
      if (st.led === "blown") { api.refresh(); return api.say("alreadyBlown"); }
      if (!st.part) { api.refresh(); return api.say("openGap"); }
      if (st.part === "resistor") { st.led = "on"; api.clear(); api.render(); return api.say("success"); }
      st.led = "surge"; api.refresh(); api.say("surge"); api.vibrate();
      api.later(() => { st.led = "blown"; api.burn(); api.refresh(); api.say("blown"); }, SURGE_MS);
    },
    blueprint(st, api) {
      api.say("bp");
      api.later(() => { st.part = "resistor"; api.refresh(); }, 1500);
      api.later(() => { st.on = true; st.led = "on"; api.done(); }, 3000);
    },
  });

  /* ===================================================================== */
  /* LV.3 Polarity                                                         */
  /* ===================================================================== */
  CD.level({
    id: 3, code: "LV.3", name: "Polarity", th: "ขั้วของ LED: Anode / Cathode", en: "LED polarity: anode and cathode",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 1-3: ขั้วของ LED (POLARITY)\nLED คือ 'ไดโอด' ชนิดหนึ่ง ให้กระแสไหลได้ทางเดียว: จากขา Anode (+, ขายาว) ไปขา Cathode (−, ขาสั้น ฝั่งที่ขอบแบน)\nวงจรนี้มีตัวต้านทานครบแล้ว แต่มีบางอย่างแปลกๆ ลองเปิดสวิตช์ดู",
        en: "> MISSION 1-3: POLARITY\nAn LED is a DIODE: current flows one way only, from the Anode (+, long leg) to the Cathode (−, short leg, flat edge).\nThis circuit already has its resistor, but something is off. Flip the switch and see." },
      blocked: { t: "warn",
        th: "สวิตช์เปิดแล้ว แต่ LED ไม่ติด และกระแส = 0\nดูสัญลักษณ์ LED: สามเหลี่ยมชี้ 'ขึ้น' สวนทางกับกระแสที่ไหลลงมาจาก 3V3 ไดโอดเลยกั้นไว้ (เรียกว่า reverse bias)\nปิดสวิตช์ แล้วแตะที่ LED เพื่อกลับขา",
        en: "Switch is ON, but the LED stays dark and current = 0.\nLook at the LED symbol: the triangle points UP, against the current coming down from 3V3. The diode blocks it (reverse bias).\nTurn the switch off, then tap the LED to flip it." },
      flipped: { t: "info",
        th: "กลับขา LED แล้ว: Anode (+) หันไปทาง 3V3 และ Cathode (−) ลง GND ลองเปิดสวิตช์",
        en: "LED flipped: Anode (+) now faces 3V3 and Cathode (−) goes to GND. Flip the switch." },
      flippedBack: { t: "info", th: "กลับขา LED อีกครั้ง ตอนนี้สามเหลี่ยมชี้ขึ้น (กลับด้าน)", en: "LED flipped again. The triangle points up now (backwards)." },
      success: { t: "success",
        th: "✔ LED ติดแล้ว! สามเหลี่ยมในสัญลักษณ์ชี้ไปทางที่กระแสไหลได้\nของจริง: ขายาว = Anode (+) ต่อฝั่งไฟ, ขาสั้น/ขอบแบน = Cathode (−) ต่อฝั่ง GND\nใส่กลับด้านที่ 3.3V แบบนี้ LED ไม่พัง แต่ถ้าแรงดันย้อนทางเกินราว 5V อาจเสียได้",
        en: "✔ LED is lit! The triangle in the symbol points the way current can flow.\nOn a real LED: long leg = Anode (+) to the supply side, short leg / flat edge = Cathode (−) to GND.\nBackwards at 3.3V does no harm, but more than ≈5V in reverse can damage it." },
      off: { t: "info", th: "ปิดสวิตช์ กระแส = 0", en: "Switch OFF. Current = 0." },
      bp: { t: "hint",
        th: "💡 BLUEPRINT: ไดโอดนำกระแสเมื่อ Anode มีแรงดันสูงกว่า Cathode (forward bias)\nกำลังกลับขา LED ให้ Anode หันไปทาง 3V3 แล้วเปิดสวิตช์...",
        en: "💡 BLUEPRINT: a diode conducts when its Anode is at a higher voltage than its Cathode (forward bias).\nFlipping the LED so the Anode faces 3V3, then closing the switch..." },
    },
    init: () => ({ on: false, reversed: true }),
    status: (st) => (st.on && !st.reversed ? ["CIRCUIT: CLOSED", "ok"] : st.on ? ["BLOCKED BY DIODE", "warn"] : ["CIRCUIT: OPEN", "warn"]),
    boardClass: (st) => (st.on && !st.reversed ? "lit" : ""),
    board(st, k) {
      const s = k.svg, lit = st.on && !st.reversed;
      return s.wire("M100 150 V80 H220") + s.wire("M300 80 H380") + s.wire("M520 80 H680 V160") + s.wire("M680 240 V320 H100")
        + (lit ? s.flow(LOOP) : "") + s.source(100, 150) + s.gnd(100, 320) + s.sw(220, 300, 80, st.on)
        + s.resH(380, 520, 80, 330, { label: "R1 330Ω" })
        + s.led(680, 160, lit ? "on" : "off", { reversed: st.reversed, action: "flip", aria: "LED, tap to flip", label: "LED1", sub: st.reversed ? ["▲ reversed", "tap to flip"] : ["▼ forward", "A(+) top"] })
        + s.text(650, 176, st.reversed ? "−" : "+", { fill: s.COL.amber, size: 16, weight: true })
        + s.text(650, 236, st.reversed ? "+" : "−", { fill: s.COL.amber, size: 16, weight: true });
    },
    note: (st, k) => k.t("แตะที่ LED เพื่อกลับขา (ต้องปิดสวิตช์ก่อน)", "Tap the LED to flip it (switch off first)"),
    side(st, k) {
      const I = st.on && !st.reversed ? ledMA(3.3, 330) : 0;
      const anatomy = `<svg viewBox="0 0 220 120" width="220" height="120" aria-label="LED anatomy">
        <path d="M80 18 a30 30 0 0 1 60 0 V62 H80 Z" fill="#0f3d0a" stroke="#39ff14" stroke-width="2"/>
        <line x1="80" y1="62" x2="80" y2="30" stroke="#ffb000" stroke-width="3"/>
        <line x1="96" y1="62" x2="96" y2="112" stroke="#9ca3af" stroke-width="3"/>
        <line x1="124" y1="62" x2="124" y2="96" stroke="#9ca3af" stroke-width="3"/>
        <text x="90" y="118" text-anchor="end" fill="#ffb000" font-size="11" font-family="IBM Plex Mono, monospace">A (+) long</text>
        <text x="130" y="104" fill="#ffb000" font-size="11" font-family="IBM Plex Mono, monospace">K (−) short</text>
        <text x="74" y="40" text-anchor="end" fill="#5a9466" font-size="10" font-family="IBM Plex Mono, monospace">flat edge = K</text>
      </svg>`;
      return k.meter([["Supply", "3.3 V"], ["Series R", "330Ω"], ["LED", st.reversed ? k.t("กลับด้าน", "reversed") : k.t("ถูกทิศ", "forward"), st.reversed ? "mid" : "good"], ["Current", fmtI(I), I ? "good" : ""]], I)
        + `<div class="panel law"><h3>// led anatomy</h3>${anatomy}<p>${k.t("กระแสไหล A → K เท่านั้น", "Current flows A → K only")}</p></div>`;
    },
    buttons: (st, k) => k.btnSwitch(st.on) + k.btn("flip", k.t("⇅ กลับขา LED", "⇅ FLIP LED")),
    act(a, el, st, api) {
      if (a === "flip") {
        if (st.on) return api.say("powerDownFirst");
        st.reversed = !st.reversed; api.refresh();
        return api.say(st.reversed ? "flippedBack" : "flipped");
      }
      if (a !== "switch") return;
      st.on = !st.on;
      if (!st.on) { api.refresh(); return api.say("off"); }
      if (st.reversed) { api.refresh(); return api.say("blocked"); }
      api.clear(); api.render(); api.say("success");
    },
    blueprint(st, api) {
      api.say("bp");
      api.later(() => { st.reversed = false; api.refresh(); }, 1500);
      api.later(() => { st.on = true; api.done(); }, 3000);
    },
  });

  /* ===================================================================== */
  /* LV.4 Series & Parallel                                                */
  /* ===================================================================== */
  const LAYOUTS = {
    series: { label: "SERIES", sub: "R → LED → LED" },
    shared: { label: "PARALLEL · 1R", sub: "R → (LED ∥ LED)" },
    each: { label: "PARALLEL · 2R", sub: "(R+LED) ∥ (R+LED)" },
  };
  CD.level({
    id: 4, code: "LV.4", name: "Series & Parallel", th: "ต่อ LED หลายดวง: อนุกรม / ขนาน", en: "Driving two LEDs: series vs. parallel",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 1-4: อนุกรม & ขนาน\nเป้าหมาย: ให้ LED 2 ดวงสว่างเท่ากันจากไฟ 3V3\nตอนนี้ต่อแบบ 'อนุกรม' (เรียงต่อกันเป็นแถว) ลองเปิดสวิตช์ดูก่อน แล้วค่อยเลือกรูปแบบอื่นจากถาด LAYOUT",
        en: "> MISSION 1-4: SERIES & PARALLEL\nGoal: light two LEDs equally from 3V3.\nRight now they're in SERIES (one after the other). Flip the switch first, then try other layouts from the LAYOUT tray." },
      seriesOn: { t: "warn",
        th: "LED ไม่ติดทั้งสองดวง กระแส ≈ 0\nต่ออนุกรม แรงดันต้อง 'แบ่งกัน' ใช้: LED แต่ละดวงต้องการ 2.0V รวมเป็น 2.0 + 2.0 = 4.0V แต่แหล่งจ่ายมีแค่ 3.3V\nแรงดันไม่พอจะดัน LED ทั้งสองดวงให้นำกระแส (ถ้าใช้ไฟ 5V การต่ออนุกรมแบบนี้จะใช้ได้)",
        en: "Neither LED lights; current ≈ 0.\nIn series the voltage is SHARED: each LED needs 2.0V, so 2.0 + 2.0 = 4.0V, but the supply is only 3.3V.\nNot enough voltage to push both LEDs into conducting. (On a 5V supply this series string would work.)" },
      sharedOn: { t: "warn",
        th: "ติดแล้ว แต่สว่างไม่เท่ากัน! LED1 สว่าง LED2 จาง\nต่อขนานใช้ตัวต้านทานตัวเดียว: LED จริงแต่ละดวงมี Vf ต่างกันนิดหน่อย (เช่น 1.95V กับ 2.05V) ดวงที่ Vf ต่ำกว่าจะแย่งกระแสไปเกือบหมด\nถ้าดวงนั้นเสีย อีกดวงจะรับกระแสทั้งหมดทันที กฎ: LED ที่ต่อขนานต้องมีตัวต้านทานของตัวเองทุกดวง",
        en: "Lit, but unevenly! LED1 is bright, LED2 is dim.\nParallel with one shared resistor: real LEDs differ slightly in Vf (say 1.95V vs 2.05V) and the lower one hogs most of the current.\nIf that LED fails, the other suddenly gets all of it. Rule: every parallel LED gets its own resistor." },
      success: { t: "success",
        th: "✔ สว่างเท่ากันทั้งสองดวง!\nต่อขนาน: แต่ละกิ่งได้แรงดันเต็ม 3.3V และมีตัวต้านทาน 330Ω ของตัวเอง → กิ่งละ 3.9mA\nกระแสรวม = 3.9 + 3.9 = 7.8mA กระแสของกิ่งขนาน 'บวกกัน' ตอนต่อ LED หลายดวงกับ ESP32 ต้องคิดกระแสรวมไม่ให้เกินที่ขาหรือแหล่งจ่ายรับไหว",
        en: "✔ Both LEDs glow equally!\nParallel: each branch gets the full 3.3V and its own 330Ω → 3.9mA per branch.\nTotal = 3.9 + 3.9 = 7.8mA. Parallel currents ADD UP, so with many LEDs on an ESP32, keep the total within what the pin or supply can give." },
      layout: { t: "info", th: "เปลี่ยนรูปแบบเป็น {name} แล้ว เปิดสวิตช์ทดสอบได้เลย", en: "Layout changed to {name}. Flip the switch to test." },
      off: { t: "info", th: "ปิดสวิตช์ กระแส = 0", en: "Switch OFF. Current = 0." },
      bp: { t: "hint",
        th: "💡 BLUEPRINT: อนุกรมต้องการ 4.0V (ไม่พอ), ขนานตัวต้านทานเดียวแบ่งกระแสไม่เท่ากัน\nคำตอบคือ ขนานโดยให้ทุกกิ่งมี R ของตัวเอง กำลังต่อให้...",
        en: "💡 BLUEPRINT: series needs 4.0V (not enough); one shared resistor splits current unevenly.\nThe answer is parallel with a resistor in every branch. Wiring it..." },
    },
    init: () => ({ on: false, layout: "series" }),
    status(st) {
      if (!st.on) return ["CIRCUIT: OPEN", "warn"];
      if (st.layout === "series") return ["NOT ENOUGH VOLTAGE", "warn"];
      if (st.layout === "shared") return ["UNEVEN CURRENT", "warn"];
      return ["CIRCUIT: CLOSED", "ok"];
    },
    boardClass: (st) => (st.on && st.layout === "each" ? "lit" : ""),
    board(st, k) {
      const s = k.svg, on = st.on;
      let g = s.wire("M100 150 V80 H220") + s.source(100, 150) + s.gnd(100, 320);
      if (st.layout === "series") {
        g += s.wire("M300 80 H380") + s.wire("M520 80 H640 V100") + s.wire("M640 180 V200") + s.wire("M640 280 V320 H100")
          + s.resH(380, 520, 80, 330, { label: "R1 330Ω" })
          + s.led(640, 100, "off", { label: "LED1", sub: ["2.0V"] }) + s.led(640, 200, "off", { label: "LED2", sub: ["2.0V"] })
          + (on ? s.text(500, 230, "2.0 + 2.0 = 4.0V > 3.3V", { fill: s.COL.amber, size: 13, weight: true }) : "");
      } else if (st.layout === "shared") {
        g += s.wire("M300 80 H380") + s.wire("M520 80 H700 V160") + s.wire("M580 80 V160") + s.wire("M580 240 V320") + s.wire("M700 240 V320 H100")
          + (on ? s.flow("M100 150 V80 H580 V320 H100") + s.flow("M580 80 H700 V320 H580", "slow") : "")
          + s.resH(380, 520, 80, 330, { label: "R1 330Ω" }) + s.node(580, 80) + s.node(580, 320)
          + s.led(580, 160, on ? "bright" : "off", { label: "LED1", left: true, sub: on ? ["≈3.1mA"] : [] })
          + s.led(700, 160, on ? "faint" : "off", { label: "LED2", sub: on ? ["≈0.8mA"] : [] });
      } else {
        g += s.wire("M300 80 H680 V100") + s.wire("M520 80 V100") + s.wire("M520 170 V190") + s.wire("M680 170 V190")
          + s.wire("M520 270 V320") + s.wire("M680 270 V320 H100")
          + (on ? s.flow("M100 150 V80 H520 V320 H100") + s.flow("M520 80 H680 V320 H520") : "")
          + s.resV(520, 100, 170, 330, { label: "R1", left: true }) + s.resV(680, 100, 170, 330, { label: "R2" })
          + s.node(520, 80) + s.node(520, 320)
          + s.led(520, 190, on ? "on" : "off", { label: "LED1", left: true, sub: on ? ["3.9mA"] : [] })
          + s.led(680, 190, on ? "on" : "off", { label: "LED2", sub: on ? ["3.9mA"] : [] });
      }
      return g + s.sw(220, 300, 80, on);
    },
    note: (st, k) => k.t("เลือกรูปแบบการต่อจากถาด LAYOUT (ต้องปิดสวิตช์ก่อน)", "Pick a layout from the LAYOUT tray (switch off first)"),
    side(st, k) {
      const on = st.on;
      const each = on && st.layout === "each" ? 3.9 : on && st.layout === "shared" ? 3.9 : 0;
      const total = on && st.layout === "each" ? 7.8 : each;
      return k.tray("layout · tap to choose", Object.entries(LAYOUTS).map(([id, l]) => ({ action: "layout", data: { v: id }, sel: st.layout === id, label: l.label, sub: l.sub })), { cols: 3 })
        + k.meter([["Supply", "3.3 V"], [k.t("แรงดันที่ต้องการ", "Needed"), st.layout === "series" ? "4.0 V (2 × 2.0)" : k.t("2.0 V ต่อกิ่ง", "2.0 V per branch"), st.layout === "series" ? "mid" : ""],
          ["LED1", on && st.layout !== "series" ? (st.layout === "shared" ? "≈3.1 mA" : "3.9 mA") : "0.0 mA", on && st.layout === "each" ? "good" : ""],
          ["LED2", on && st.layout !== "series" ? (st.layout === "shared" ? "≈0.8 mA" : "3.9 mA") : "0.0 mA", on && st.layout === "each" ? "good" : ""],
          [k.t("กระแสรวม", "Total"), fmtI(total)]], total)
        + k.card("rules", k.t("อนุกรม: V บวกกัน<br>ขนาน: I บวกกัน", "Series: V adds<br>Parallel: I adds"));
    },
    buttons: (st, k) => k.btnSwitch(st.on),
    act(a, el, st, api) {
      if (a === "layout") {
        if (st.on) return api.say("powerDownFirst");
        st.layout = el.dataset.v; api.refresh();
        return api.say("layout", { name: LAYOUTS[st.layout].label });
      }
      if (a !== "switch") return;
      st.on = !st.on;
      if (!st.on) { api.refresh(); return api.say("off"); }
      if (st.layout === "each") { api.clear(); api.render(); return api.say("success"); }
      api.refresh();
      api.say(st.layout === "series" ? "seriesOn" : "sharedOn");
    },
    blueprint(st, api) {
      api.say("bp");
      api.later(() => { st.layout = "each"; api.refresh(); }, 1800);
      api.later(() => { st.on = true; api.done("success"); }, 3200);
    },
  });

  /* ===================================================================== */
  /* LV.5 Resistor Calculator (5V rail)                                    */
  /* ===================================================================== */
  const VALUES = [10, 47, 150, 220, 330, 1000, 10000];
  const V5 = 5.0, ZONE = [5, 15];
  const outcome = (r) => {
    const I = ledMA(V5, r);
    if (I > 25) return "burn";
    if (I > ZONE[1]) return "hot";
    if (I >= ZONE[0]) return "good";
    if (I >= 1) return "dim";
    return "faint";
  };
  CD.level({
    id: 5, code: "LV.5", name: "Resistor Calculator", th: "คำนวณค่า R เองบนไฟ 5V + อ่านแถบสี", en: "Pick R yourself on 5V and read color bands",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 1-5: คำนวณตัวต้านทาน\nคราวนี้ใช้ไฟ 5V จากพอร์ต USB เป้าหมาย: กระแส LED อยู่ในโซน 5–15mA (สว่างชัดและยืดอายุ LED)\nถาด RESISTOR REEL มีตัวต้านทานหลายค่า แต่บอกแค่ 'แถบสี' อ่านค่าเองจากตารางสี แล้วคำนวณ: I = (5.0 − 2.0) ÷ R",
        en: "> MISSION 1-5: RESISTOR CALCULATOR\nThis time the supply is 5V from USB. Goal: LED current in the 5–15mA zone (clearly bright, long life).\nThe RESISTOR REEL only shows COLOR BANDS. Read each value from the color chart, then work it out: I = (5.0 − 2.0) ÷ R" },
      placed: { t: "info", th: "วางตัวต้านทานแล้ว: {bands} = {R}\nคาดว่ากระแส = 3.0V ÷ {R} ≈ {I} ลองเปิดสวิตช์ยืนยัน", en: "Resistor placed: {bands} = {R}\nExpected current = 3.0V ÷ {R} ≈ {I}. Flip the switch to confirm." },
      noR: { t: "warn", th: "ยังไม่มีตัวต้านทานในวงจร เลือกจากถาด RESISTOR REEL ก่อน", en: "No resistor in the circuit yet. Pick one from the RESISTOR REEL first." },
      surge: { t: "error", th: "!! กระแสพุ่งสูง {I} !!", en: "!! CURRENT SURGE {I} !!" },
      burn: { t: "error",
        th: "💥 LED ไหม้ ไม่เป็นไรนะ!\n{R} น้อยเกินไปสำหรับไฟ 5V: I = 3.0V ÷ {R} ≈ {I} เกินขีดจำกัด 20mA ไปมาก\nบนไฟ 5V แรงดันส่วนเกินมี 3.0V (มากกว่าตอน 3V3 ที่มีแค่ 1.3V) จึงต้องใช้ R ค่าสูงขึ้น กด [REPLACE LED] แล้วลองค่าที่ใหญ่ขึ้น",
        en: "💥 LED burned out. No problem!\n{R} is far too small for 5V: I = 3.0V ÷ {R} ≈ {I}, way past the 20mA limit.\nOn 5V the leftover voltage is 3.0V (vs only 1.3V on 3V3), so you need a bigger R. Press [REPLACE LED] and try a larger value." },
      hot: { t: "warn",
        th: "LED สว่างจ้า แต่ร้อน! I ≈ {I} ชนเพดาน 20mA พอดี\nใช้งานได้ระยะสั้น แต่ไม่มีระยะเผื่อ อายุ LED จะสั้นลง เป้าหมายคือ 5–15mA ลองค่าที่ใหญ่ขึ้นอีกขั้น",
        en: "Very bright, but hot! I ≈ {I}, right at the 20mA ceiling.\nIt works short-term but has no safety margin and shortens LED life. The target is 5–15mA. Try the next value up." },
      good: { t: "success",
        th: "✔ อยู่ในโซนพอดี! {R} → I ≈ {I}\nสูตรเลือก R: R = (V_supply − V_led) ÷ I_เป้าหมาย เช่นอยากได้ 10mA: (5 − 2) ÷ 0.010 = 300Ω → ใช้ค่ามาตรฐานใกล้ๆ คือ 330Ω หรือ 220Ω ถ้าอยากสว่างขึ้น\nค่ามาตรฐาน (E12): 100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820",
        en: "✔ Right in the zone! {R} → I ≈ {I}\nHow to pick R: R = (V_supply − V_led) ÷ I_target. For 10mA: (5 − 2) ÷ 0.010 = 300Ω → use the nearby standard 330Ω, or 220Ω for brighter.\nStandard (E12) values: 100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820" },
      dim: { t: "warn",
        th: "ปลอดภัย แต่จางไป: I ≈ {I}\nใช้เป็นไฟบอกสถานะในห้องมืดได้ แต่ภารกิจต้องการ 5–15mA ลองค่าที่เล็กลง",
        en: "Safe, but dim: I ≈ {I}\nFine for a status light in a dark room, but the mission wants 5–15mA. Try a smaller value." },
      faint: { t: "warn",
        th: "แทบมองไม่เห็นแสง: I ≈ {I}\n{R} ใหญ่เกินไปมาก ตัวต้านทานกั้นกระแสจนเหลือนิดเดียว",
        en: "Barely any light: I ≈ {I}\n{R} is way too large; it chokes the current down to almost nothing." },
      off: { t: "info", th: "ปิดสวิตช์ กระแส = 0", en: "Switch OFF. Current = 0." },
      blownOff: { t: "info", th: "ปิดสวิตช์แล้ว กด [REPLACE LED] เพื่อเปลี่ยน LED", en: "Switch OFF. Press [REPLACE LED] to install a fresh LED." },
      replaced: { t: "hint", th: "ติดตั้ง LED ตัวใหม่แล้ว ✔ คำใบ้: ลองคำนวณ R = 3.0V ÷ 0.010A ดูก่อนเลือก", en: "Fresh LED installed ✔ Hint: work out R = 3.0V ÷ 0.010A before you pick." },
      bp: { t: "hint",
        th: "💡 BLUEPRINT: ตั้งเป้า 10mA → R = (5.0 − 2.0) ÷ 0.010 = 300Ω\nค่ามาตรฐานที่ใกล้และปลอดภัย = 330Ω (ส้ม-ส้ม-น้ำตาล) กำลังใส่และเปิดสวิตช์...",
        en: "💡 BLUEPRINT: target 10mA → R = (5.0 − 2.0) ÷ 0.010 = 300Ω.\nNearest safe standard value = 330Ω (orange-orange-brown). Placing it and closing the switch..." },
    },
    init: () => ({ on: false, r: null, led: "off" }),
    busy: (st) => st.led === "surge",
    isBlown: (st) => st.led === "blown",
    status(st) {
      if (st.led === "blown") return ["FAULT", "bad"];
      if (!st.on || !st.r) return ["CIRCUIT: OPEN", "warn"];
      const o = outcome(st.r);
      return o === "good" ? ["IN THE ZONE", "ok"] : o === "hot" || o === "burn" ? ["TOO MUCH CURRENT", "bad"] : ["TOO DIM", "warn"];
    },
    boardClass: (st) => (st.led === "blown" ? "fault" : st.led === "surge" ? "shake" : st.on && st.r && outcome(st.r) === "good" ? "lit" : ""),
    board(st, k) {
      const s = k.svg, C = s.COL;
      const ledState = { good: "on", hot: "bright", dim: "dim", faint: "faint" };
      const lit = st.on && st.r && st.led !== "blown";
      const shown = st.led === "blown" ? "blown" : st.led === "surge" ? "surge" : lit ? ledState[outcome(st.r)] : "off";
      let g = s.wire("M100 150 V80 H220") + s.wire("M300 80 H380") + s.wire("M520 80 H680 V160") + s.wire("M680 240 V320 H100");
      if (lit || st.led === "surge") g += s.flow(LOOP, st.led === "surge" ? "fast" : outcome(st.r) === "faint" || outcome(st.r) === "dim" ? "slow" : "");
      g += s.source(100, 150, "5V", "USB") + s.gnd(100, 320) + s.sw(220, 300, 80, st.on);
      g += st.r ? s.resH(380, 520, 80, st.r, { label: "R1 " + fmtR(st.r) })
        : s.node(380, 80) + s.node(520, 80) + `<g class="blink"><rect x="392" y="56" width="116" height="48" rx="4" fill="none" stroke="${C.amber}" stroke-width="2" stroke-dasharray="6 6"/>${s.text(450, 86, "[ R = ? ]", { fill: C.amber, size: 16, display: true })}</g>`;
      g += s.led(680, 160, shown, { label: "LED1", sub: ["Vf≈2.0V", "max 20mA"] });
      return g;
    },
    note: (st, k) => k.t("ถาดบอกแค่แถบสี: อ่านค่าเองจากตาราง COLOR CODE", "The reel only shows bands: read the value from the COLOR CODE chart"),
    side(st, k) {
      const lit = st.on && st.r && st.led !== "blown";
      const I = lit || st.led === "surge" ? ledMA(V5, st.r) : 0;
      const names = CD.BAND_NAMES[k.t("th", "en")];
      const chart = `<div class="swatches">${CD.BAND.map((c, i) => `<span><i style="background:${c}"></i>${i} ${names[i]}</span>`).join("")}</div>
        <p style="font-size:11px;color:var(--dim);margin:8px 0 0">${k.t("แถบ 1-2 = ตัวเลข · แถบ 3 = เติมศูนย์กี่ตัว · ทอง = ±5%", "Bands 1–2 = digits · band 3 = how many zeros · gold = ±5%")}</p>`;
      const cls = !I ? "" : I > 20 ? "hot" : I >= ZONE[0] && I <= ZONE[1] ? "good" : "mid";
      return k.tray("resistor reel · tap to place", VALUES.map((v) => ({ action: "place", data: { r: v }, sel: st.r === v, icon: k.resIcon(v), label: st.r === v ? fmtR(v) : "? Ω" })), { cols: 4, disabled: st.led === "surge" })
        + k.meter([["Supply", "5.0 V"], ["LED drop", "2.0 V"], ["Series R", st.r ? fmtR(st.r) : "—"], ["Current", st.led === "blown" ? "0.0 mA (open)" : fmtI(I), cls]], I, { zone: ZONE })
        + k.panel("color code", chart);
    },
    buttons: (st, k) => k.btnSwitch(st.on, st.led === "surge"),
    act(a, el, st, api) {
      if (a === "place") {
        if (st.led === "blown") return api.say("replaceFirst");
        if (st.on) return api.say("powerDownFirst");
        st.r = Number(el.dataset.r); api.refresh();
        const names = CD.BAND_NAMES[api.t("th", "en")];
        const [b1, b2, m] = CD.bandIdx(st.r);
        return api.say("placed", { bands: `${names[b1]}-${names[b2]}-${names[m]}`, R: fmtR(st.r), I: fmtI(ledMA(V5, st.r)) });
      }
      if (a !== "switch") return;
      st.on = !st.on;
      if (!st.on) {
        if (st.led !== "blown") st.led = "off";
        api.refresh();
        return api.say(st.led === "blown" ? "blownOff" : "off");
      }
      if (st.led === "blown") { api.refresh(); return api.say("replaceFirst"); }
      if (!st.r) { api.refresh(); return api.say("noR"); }
      const vars = { R: fmtR(st.r), I: fmtI(ledMA(V5, st.r)) };
      const o = outcome(st.r);
      if (o === "burn") {
        st.led = "surge"; api.refresh(); api.say("surge", vars); api.vibrate();
        return api.later(() => { st.led = "blown"; api.burn(); api.refresh(); api.say("burn", vars); }, SURGE_MS);
      }
      st.led = "on";
      if (o === "good") { api.clear(); api.render(); } else api.refresh();
      api.say(o, vars);
    },
    blueprint(st, api) {
      api.say("bp");
      api.later(() => { st.r = 330; api.refresh(); }, 1600);
      api.later(() => { st.on = true; st.led = "on"; api.done("good", { R: "330Ω", I: fmtI(ledMA(V5, 330)) }); }, 3200);
    },
  });
})();

/* Chapter 3: ESP32 Basics (LV.8 – LV.10) */
(() => {
  const { fmtI, ledMA } = CD;

  /* ===================================================================== */
  /* LV.8 Blink: GPIO output                                               */
  /* ===================================================================== */
  const PINS8 = [{ name: "3V3", y: 80 }, { name: "GPIO2", y: 130 }, { name: "GPIO4", y: 180 }, { name: "GPIO34", y: 230 }, { name: "GND", y: 300 }];
  const CODE_PINS = ["2", "4", "34"];
  const MODES = ["OUTPUT", "INPUT"];
  const pinY = (name) => (PINS8.find((p) => p.name === name) || {}).y;

  CD.level({
    id: 8, code: "LV.8", name: "Blink", th: "ESP32 ขา GPIO แบบ OUTPUT + โค้ดกะพริบไฟ", en: "ESP32 GPIO output and your first blink code",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 3-1: กะพริบไฟ (BLINK)\nมาถึงสมองของหุ่นยนต์แล้ว: ESP32 ขา GPIO ทำหน้าที่เหมือน 'สวิตช์ที่สั่งด้วยโค้ด' จ่าย 3.3V (HIGH) หรือ 0V (LOW)\n1) แตะขาบนบอร์ด ESP32 เพื่อต่อสายไปที่ LED\n2) เติมโค้ดในช่อง [?] ให้ตรงกับขาที่ต่อ\n3) กด UPLOAD & RUN",
        en: "> MISSION 3-1: BLINK\nMeet the robot's brain. An ESP32 GPIO pin is a switch controlled by code: it outputs 3.3V (HIGH) or 0V (LOW).\n1) Tap a pin on the ESP32 to wire it to the LED.\n2) Fill the [?] blanks in the code to match that pin.\n3) Press UPLOAD & RUN." },
      wired: { t: "info", th: "ต่อสาย LED เข้าขา {pin} แล้ว", en: "LED wired to {pin}." },
      code: { t: "info", th: "แก้โค้ด: {what}", en: "Code edited: {what}" },
      noWire: { t: "warn", th: "LED ยังไม่ได้ต่อกับขาใดเลย แตะขาบนบอร์ด ESP32 ก่อน", en: "The LED isn't connected to any pin yet. Tap a pin on the ESP32 first." },
      fillCode: { t: "warn", th: "โค้ดยังมีช่อง [?] อยู่ แตะช่องในโค้ดเพื่อเลือกค่า", en: "The code still has [?] blanks. Tap them to pick values." },
      always: { t: "warn",
        th: "LED ติดค้าง ไม่กะพริบเลย\nขา 3V3 เป็นขา 'จ่ายไฟ' ให้ 3.3V ตลอดเวลา โค้ดสั่งมันไม่ได้ ถ้าอยากควบคุมต้องต่อกับขา GPIO",
        en: "The LED is stuck on and never blinks.\n3V3 is a POWER pin: always 3.3V, code can't touch it. To control the LED, wire it to a GPIO pin." },
      gnd: { t: "warn",
        th: "LED ไม่ติดเลย ขา GND คือ 0V ทั้งสองฝั่งของ LED เป็น 0V เท่ากัน จึงไม่มีแรงดันดันกระแส ต่อกับขา GPIO แทน",
        en: "The LED never lights. GND is 0V, so both ends of the LED sit at 0V with nothing to push current. Use a GPIO pin instead." },
      mismatch: { t: "warn",
        th: "โค้ดกำลังสั่งขา GPIO{c} แต่ LED ต่ออยู่ที่ {pin}\nโค้ดกับสายต้องตรงกัน ESP32 ไม่รู้ว่าคุณต่ออะไรไว้ที่ไหน มันทำตามตัวเลขในโค้ดเท่านั้น",
        en: "The code drives GPIO{c}, but the LED is wired to {pin}.\nCode and wiring must match. The ESP32 can't see your wires; it only follows the pin number in the code." },
      input: { t: "warn",
        th: "LED ไม่ติด เพราะตั้งขาเป็น INPUT\nINPUT = 'ฟัง' แรงดันจากภายนอก ไม่จ่ายไฟออก ถ้าจะขับ LED ต้องเป็น OUTPUT",
        en: "The LED stays dark because the pin is set to INPUT.\nINPUT means LISTEN to an outside voltage, not drive one. To power an LED it must be OUTPUT." },
      inputOnly: { t: "warn",
        th: "LED ไม่ติดแม้โค้ดถูก! GPIO34–39 ของ ESP32 เป็นขา 'รับเข้าอย่างเดียว' (input-only) ไม่มีวงจรขับไฟออก\nข้อนี้เจอบ่อยมากในงานจริง เช็ก pinout ก่อนต่อทุกครั้ง ลองใช้ GPIO2 หรือ GPIO4",
        en: "The LED stays dark even though the code is right! ESP32 GPIO34–39 are INPUT-ONLY pins with no output driver.\nThis one bites people in real projects. Always check the pinout. Try GPIO2 or GPIO4." },
      success: { t: "success",
        th: "✔ LED กะพริบทุก 0.5 วินาที! โปรแกรมแรกบน ESP32 สำเร็จ\npinMode(…, OUTPUT) ตั้งขาให้จ่ายไฟ, digitalWrite HIGH = 3.3V, LOW = 0V, delay(500) = รอ 500 มิลลิวินาที\nสังเกตว่ายังมีตัวต้านทาน 330Ω อยู่ (I ≈ 3.9mA) ขา GPIO แนะนำให้จ่ายไม่เกิน ~20mA ต่อขา",
        en: "✔ The LED blinks every 0.5 s! Your first ESP32 program works.\npinMode(…, OUTPUT) makes the pin drive; digitalWrite HIGH = 3.3V, LOW = 0V; delay(500) waits 500 milliseconds.\nNote the 330Ω resistor is still there (I ≈ 3.9mA). Keep each GPIO under about 20mA." },
      stopped: { t: "info", th: "หยุดโปรแกรมแล้ว", en: "Program stopped." },
      bp: { t: "hint",
        th: "💡 BLUEPRINT: เลือกขาที่เป็น GPIO และส่งออกได้ → GPIO2\nโค้ด: pinMode(2, OUTPUT); แล้ว digitalWrite(2, HIGH/LOW) สลับกัน กำลังต่อและอัปโหลด...",
        en: "💡 BLUEPRINT: pick a GPIO that can output → GPIO2.\nCode: pinMode(2, OUTPUT); then alternate digitalWrite(2, HIGH/LOW). Wiring and uploading..." },
    },
    init: () => ({ pin: null, codePin: null, mode: null, running: false, phase: false, result: null }),
    status(st) {
      if (!st.running) return ["IDLE", "warn"];
      return st.result === "success" ? ["RUNNING · BLINK", "ok"] : ["RUNNING · NO BLINK", "warn"];
    },
    boardClass: (st) => (st.running && st.result === "success" ? "lit" : ""),
    board(st, k) {
      const s = k.svg, C = s.COL;
      const lit = st.running && ((st.result === "success" && st.phase) || st.result === "always");
      const pins = PINS8.map((p) => ({ ...p, active: st.pin === p.name, action: "pin" }));
      let g = s.esp32(pins);
      if (st.pin) {
        const y = pinY(st.pin);
        g += (lit ? s.flow(`M198 ${y} H280 V100 H320`) : s.wire(`M198 ${y} H280 V100 H320`));
      } else {
        g += `<g class="blink">${s.wire("M240 100 H320", { dash: true })}${s.text(250, 88, k.t("แตะขา ←", "tap a pin ←"), { fill: C.amber, size: 11, anchor: "start" })}</g>`;
      }
      g += s.resH(320, 460, 100, 330, { label: "R1 330Ω" })
        + (lit ? s.flow("M460 100 H600 V140") + s.flow("M600 220 V300 H198") : s.wire("M460 100 H600 V140") + s.wire("M600 220 V300 H198"))
        + s.led(600, 140, lit ? "on" : "off", { label: "LED1" });
      if (st.running && st.pin && st.pin.startsWith("GPIO")) g += s.text(300, st.pin === "GPIO2" ? 150 : 200, `${st.pin} = ${st.result === "success" ? (st.phase ? "HIGH" : "LOW") : "LOW"}`, { fill: st.phase && st.result === "success" ? C.neon : C.dim, size: 12, anchor: "start" });
      return g;
    },
    note: (st, k) => k.t("แตะขาบน ESP32 เพื่อต่อสาย · แตะช่อง [?] ในโค้ดเพื่อเลือกค่า", "Tap an ESP32 pin to wire it · tap the [?] blanks in the code"),
    side(st, k) {
      const slot = (action, val) => `<button class="slot ${val ? "set" : ""}" data-action="${action}">${val || "?"}</button>`;
      const code = `<pre class="code"><span class="kw">void</span> <span class="fn">setup</span>() {
  <span class="fn">pinMode</span>(${slot("codePin", st.codePin)}, ${slot("mode", st.mode)});
}
<span class="kw">void</span> <span class="fn">loop</span>() {
  <span class="fn">digitalWrite</span>(${st.codePin || "?"}, HIGH);
  <span class="fn">delay</span>(500);  <span class="cm">// ms</span>
  <span class="fn">digitalWrite</span>(${st.codePin || "?"}, LOW);
  <span class="fn">delay</span>(500);
}</pre>`;
      const I = st.running && st.result === "success" ? ledMA(3.3, 330) : 0;
      return k.panel("sketch.ino · tap [?]", code)
        + k.meter([[k.t("ขาที่ต่อ", "Wired pin"), st.pin || "—"], ["HIGH", "3.3 V"], ["Series R", "330Ω"], [k.t("กระแสตอน HIGH", "Current when HIGH"), fmtI(I), I ? "good" : ""]], I, { limitLabel: k.t("แนะนำต่อขา GPIO", "GPIO guideline"), limit: 20 })
        + k.card("esp32 pinout", "GPIO34–39 = INPUT ONLY", k.t("3V3 / GND = ขาไฟเลี้ยง ไม่ใช่ขาควบคุม", "3V3 / GND are power pins, not controllable"));
    },
    buttons: (st, k) => k.btn("run", st.running ? "■ STOP" : "▶ UPLOAD & RUN", "sw" + (st.running ? " on" : "")),
    act(a, el, st, api) {
      if (a === "pin") {
        if (st.running) return api.say("powerDownFirst");
        st.pin = el.dataset.pin; api.refresh();
        return api.say("wired", { pin: st.pin });
      }
      if (a === "codePin" || a === "mode") {
        if (st.running) return api.say("powerDownFirst");
        if (a === "codePin") st.codePin = CODE_PINS[(CODE_PINS.indexOf(st.codePin) + 1) % CODE_PINS.length];
        else st.mode = MODES[(MODES.indexOf(st.mode) + 1) % MODES.length];
        api.refresh();
        return api.say("code", { what: `pinMode(${st.codePin || "?"}, ${st.mode || "?"})` });
      }
      if (a !== "run") return;
      if (st.running) { api.clearTimers(); st.running = false; api.refresh(); return api.say("stopped"); }
      if (!st.pin) return api.say("noWire");
      if (!st.codePin || !st.mode) return api.say("fillCode");
      st.running = true;
      st.result = st.pin === "3V3" ? "always" : st.pin === "GND" ? "gnd" : st.pin !== "GPIO" + st.codePin ? "mismatch" : st.mode === "INPUT" ? "input" : st.pin === "GPIO34" ? "inputOnly" : "success";
      if (st.result === "success") {
        st.phase = true;
        api.every(() => { st.phase = !st.phase; api.renderBoard(); }, 500);
        api.clear(); api.render();
      } else api.refresh();
      api.say(st.result === "always" ? "always" : st.result, { c: st.codePin, pin: st.pin });
    },
    blueprint(st, api) {
      api.say("bp");
      api.later(() => { st.pin = "GPIO2"; api.refresh(); }, 1300);
      api.later(() => { st.codePin = "2"; st.mode = "OUTPUT"; api.refresh(); }, 2400);
      api.later(() => {
        st.running = true; st.result = "success"; st.phase = true;
        api.every(() => { st.phase = !st.phase; api.renderBoard(); }, 500);
        api.done("success");
      }, 3500);
    },
  });

  /* ===================================================================== */
  /* LV.9 Button input + pull-down                                         */
  /* ===================================================================== */
  const PULLS = [{ v: "none", label: "NONE" }, { v: "down", label: "PULL-DOWN 10k" }, { v: "up", label: "PULL-UP 10k" }];
  CD.level({
    id: 9, code: "LV.9", name: "Pull-Down", th: "อ่านปุ่มกดด้วย GPIO INPUT + ตัวต้านทาน pull-down", en: "Reading a button: INPUT pins and pull-down resistors",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 3-2: อ่านค่าปุ่มกด (PULL-DOWN)\nคราวนี้ GPIO4 เป็น INPUT: ESP32 'ฟัง' ว่าขาเป็น 1 หรือ 0 แล้วพิมพ์ออก Serial Monitor\nปุ่มต่ออยู่ระหว่าง 3V3 กับ GPIO4 กดแล้วขาควรเป็น 1 ปล่อยแล้วควรเป็น 0\nดู Serial Monitor ตอนยังไม่กดปุ่ม... แปลกไหม?",
        en: "> MISSION 3-2: PULL-DOWN\nNow GPIO4 is an INPUT: the ESP32 LISTENS for 1 or 0 and prints it to the Serial Monitor.\nThe button sits between 3V3 and GPIO4. Pressed should read 1, released should read 0.\nWatch the Serial Monitor while the button is NOT pressed... strange?" },
      floating: { t: "warn",
        th: "ค่ากระโดดไปมา 0, 1, 1, 0 ทั้งที่ไม่ได้กดปุ่ม! นี่คือ 'ขาลอย' (floating input)\nตอนปล่อยปุ่ม GPIO4 ไม่ได้ต่อกับอะไรเลย มันเลยทำตัวเหมือนเสาอากาศ รับสัญญาณรบกวนรอบตัว\nต้องมีตัวต้านทานคอย 'ดึง' ค่าเริ่มต้นไว้ แตะช่อง [PULL] บนบอร์ดเพื่อเลือก",
        en: "The reading jumps 0, 1, 1, 0 without touching the button! That's a FLOATING input.\nWith the button released, GPIO4 connects to nothing, so it acts like an antenna and picks up noise.\nA resistor must PULL it to a default level. Tap the [PULL] slot on the board to choose one." },
      pull: { t: "info", th: "ตัวต้านทานดึงค่า: {name}", en: "Pull resistor: {name}" },
      pullDown: { t: "info",
        th: "ใส่ pull-down 10kΩ จาก GPIO4 ลง GND แล้ว ตอนปล่อยปุ่ม ขาถูกดึงลงเป็น 0 อย่างนิ่ง\nตอนกดปุ่ม 3V3 ต่อตรงเข้าขา ค่าเป็น 1 (กระแสผ่าน 10k แค่ 0.33mA) ลองกดและปล่อยปุ่มดู",
        en: "10kΩ pull-down from GPIO4 to GND fitted. Released, the pin is held firmly at 0.\nPressed, 3V3 connects straight to the pin and it reads 1 (only 0.33mA flows through the 10k). Press and release the button." },
      pullUp: { t: "warn",
        th: "ใส่ pull-up 10kΩ ไปที่ 3V3 แล้ว แต่ดูสิ อ่านได้ 1 ตลอด ทั้งกดและไม่กด!\nปุ่มของเราต่อไปที่ 3V3 ซึ่งเป็นค่าเดียวกับที่ pull-up ดึงไว้อยู่แล้ว การกดจึงไม่เปลี่ยนอะไร\n(pull-up ใช้ได้ถ้าย้ายปุ่มไปต่อ GND แทน แบบนั้นกด = 0 เรียกว่า active-low)",
        en: "10kΩ pull-up to 3V3 fitted, but look: it reads 1 all the time, pressed or not!\nOur button connects to 3V3, the same level the pull-up already holds, so pressing changes nothing.\n(A pull-up works if the button goes to GND instead; then pressed = 0, called active-low.)" },
      none: { t: "warn", th: "ถอดตัวต้านทานออก ขากลับมาลอยอีกครั้ง", en: "Resistor removed. The pin is floating again." },
      press: { t: "info", th: "กดปุ่ม: GPIO4 อ่านได้ {v}", en: "Button pressed: GPIO4 reads {v}" },
      release: { t: "info", th: "ปล่อยปุ่ม: GPIO4 อ่านได้ {v}", en: "Button released: GPIO4 reads {v}" },
      success: { t: "success",
        th: "✔ อ่านปุ่มได้นิ่งและถูกต้อง: กด = 1 ปล่อย = 0\nทุกขา INPUT ต้องมีค่าเริ่มต้นที่แน่นอนเสมอ ไม่อย่างนั้นหุ่นยนต์จะ 'เห็นผี' กดปุ่มเองได้\nทริก: ESP32 มีตัวต้านทานดึงค่าในตัว ใช้ pinMode(4, INPUT_PULLDOWN) หรือ INPUT_PULLUP แทนการต่อ R ภายนอกได้",
        en: "✔ Clean, correct readings: pressed = 1, released = 0.\nEvery INPUT pin needs a defined default level, or your robot will see 'ghost' button presses.\nTip: the ESP32 has built-in pull resistors: pinMode(4, INPUT_PULLDOWN) or INPUT_PULLUP instead of an external R." },
      bp: { t: "hint",
        th: "💡 BLUEPRINT: ปุ่มต่อ 3V3 → ต้องการค่าเริ่มต้น 0 → ใช้ pull-down 10kΩ ลง GND\nกำลังใส่ แล้วทดลองกดและปล่อย...",
        en: "💡 BLUEPRINT: the button goes to 3V3 → we want a default of 0 → 10kΩ pull-down to GND.\nFitting it, then pressing and releasing..." },
    },
    init: () => ({ pull: "none", pressed: false, log: [], seen0: false, seen1: false, warned: false, done: false }),
    enter(st, api) {
      api.every(() => {
        const v = read(st);
        st.log = [...st.log, v].slice(-8);
        if (st.pull === "down") { if (v) st.seen1 = st.seen1 || st.pressed; else st.seen0 = st.seen0 || !st.pressed; }
        const el = document.getElementById("serial");
        if (el) el.innerHTML = serialHTML(st);
        if (st.pull === "none" && !st.pressed && !st.warned && st.log.length >= 6 && !api.auto) { st.warned = true; api.say("floating"); }
        if (st.pull === "down" && st.seen0 && st.seen1 && !st.done && !api.auto) { st.done = true; api.clear(); api.render(); api.say("success"); }
      }, 350);
    },
    status: (st) => (st.pull === "none" && !st.pressed ? ["INPUT FLOATING", "bad"] : st.pull === "up" ? ["STUCK HIGH", "warn"] : ["INPUT STABLE", "ok"]),
    boardClass: (st) => (st.done ? "lit" : ""),
    board(st, k) {
      const s = k.svg, C = s.COL;
      const pins = [{ name: "3V3", y: 80, active: true }, { name: "GPIO4", y: 180, active: true }, { name: "GND", y: 300, active: st.pull === "down" }];
      const hi = read(st, true);
      let g = s.esp32(pins);
      // button between 3V3 rail and GPIO4 node
      g += s.wire("M198 80 H420 V108") + s.sig(`M420 152 V180`, st.pressed) + (hi === 1 ? s.sig("M198 180 H520", true) : s.wire("M198 180 H520"));
      const btn = `<rect x="380" y="100" width="80" height="60" rx="6" fill="${C.bg}" stroke="${st.pressed ? C.neon : C.amber}" stroke-width="2"/>`
        + `<line x1="398" y1="${st.pressed ? 132 : 120}" x2="442" y2="${st.pressed ? 132 : 120}" stroke="${st.pressed ? C.neon : C.amber}" stroke-width="4" stroke-linecap="round"/>`
        + `<line x1="420" y1="${st.pressed ? 132 : 120}" x2="420" y2="${st.pressed ? 118 : 106}" stroke="${st.pressed ? C.neon : C.amber}" stroke-width="3"/>`
        + s.text(420, 152, st.pressed ? "PRESSED" : "BUTTON", { fill: st.pressed ? C.neon : C.amber, size: 10 });
      g += s.hit("press", {}, "Push button", [370, 92, 100, 76], btn) + s.node(520, 180);
      // pull resistor slot
      let pull;
      if (st.pull === "down") pull = s.wire("M520 180 V200") + s.resV(520, 200, 280, 10000, { label: "10kΩ ↓" }) + s.wire("M520 280 V300 H198");
      else if (st.pull === "up") pull = s.wire("M520 180 V160") + s.resV(520, 96, 160, 10000, { label: "10kΩ ↑" }) + s.wire("M520 96 V80 H460");
      else pull = `<g class="blink"><rect x="480" y="200" width="80" height="80" rx="4" fill="none" stroke="${C.amber}" stroke-width="2" stroke-dasharray="6 6"/>${s.text(520, 245, "[PULL]", { fill: C.amber, size: 16, display: true })}</g>`;
      g += s.hit("pull", {}, "Pull resistor slot", [470, 86, 100, 210], pull);
      g += s.text(640, 176, "GPIO4 →", { fill: C.dim, size: 11, anchor: "start" })
        + s.text(640, 214, hi === 1 ? "1" : hi === 0 ? "0" : "?", { fill: hi === 1 ? C.neon : hi === 0 ? C.dim : C.red, size: 40, display: true, anchor: "start", cls: hi === null ? "flicker" : "" });
      return g;
    },
    note: (st, k) => k.t("แตะปุ่มบนบอร์ดเพื่อกด/ปล่อย · แตะช่อง [PULL] เพื่อเลือกตัวต้านทาน", "Tap the button to press/release · tap the [PULL] slot to choose a resistor"),
    side(st, k) {
      return k.panel("serial monitor · 115200 baud", `<pre class="serial" id="serial">${serialHTML(st)}</pre>`)
        + k.panel("pull resistor", k.seg(k.t("เลือกตัวต้านทานดึงค่าของ GPIO4", "Choose GPIO4's pull resistor"), "pullSet", PULLS, st.pull))
        + k.panel("sketch.ino", `<pre class="code"><span class="kw">void</span> <span class="fn">setup</span>() {
  <span class="fn">pinMode</span>(4, INPUT);
  Serial.<span class="fn">begin</span>(115200);
}
<span class="kw">void</span> <span class="fn">loop</span>() {
  Serial.<span class="fn">println</span>(<span class="fn">digitalRead</span>(4));
}</pre>`);
    },
    buttons: (st, k) => k.btn("press", st.pressed ? k.t("🔘 ปล่อยปุ่ม", "🔘 RELEASE") : k.t("🔘 กดปุ่ม", "🔘 PRESS"), "sw" + (st.pressed ? " on" : ""), { pressed: st.pressed }),
    act(a, el, st, api) {
      if (a === "press") {
        st.pressed = !st.pressed; api.refresh();
        const v = read(st, true);
        return api.say(st.pressed ? "press" : "release", { v: v === null ? k9(api) : v });
      }
      if (a === "pull" || a === "pullSet") {
        const order = PULLS.map((p) => p.v);
        st.pull = a === "pullSet" ? el.dataset.v : order[(order.indexOf(st.pull) + 1) % order.length];
        st.seen0 = st.seen1 = false; st.log = [];
        api.refresh();
        return api.say(st.pull === "down" ? "pullDown" : st.pull === "up" ? "pullUp" : "none");
      }
    },
    blueprint(st, api) {
      api.say("bp");
      api.later(() => { st.pull = "down"; api.refresh(); }, 1500);
      api.later(() => { st.pressed = true; api.refresh(); }, 2700);
      api.later(() => { st.pressed = false; st.done = true; api.done("success"); }, 3900);
    },
  });
  const k9 = (api) => api.t("สุ่ม 0/1 (ลอย)", "random 0/1 (floating)");
  /* GPIO4's reading; with exact=true a floating pin returns null instead of noise */
  function read(st, exact) {
    if (st.pressed) return 1;
    if (st.pull === "down") return 0;
    if (st.pull === "up") return 1;
    if (exact) return null;
    return Math.random() < 0.5 ? 1 : 0;
  }
  function serialHTML(st) {
    if (!st.log.length) return '<span class="lo">waiting for data…</span>';
    return st.log.map((v) => `<span class="${v ? "hi" : "lo"}">GPIO4 = ${v}</span>`).join("\n");
  }

  /* ===================================================================== */
  /* LV.10 Robot motor + driver                                            */
  /* ===================================================================== */
  CD.level({
    id: 10, code: "LV.10", name: "Motor Driver", th: "หมุนล้อหุ่นยนต์: มอเตอร์ไดรเวอร์ แบตแยก และกราวด์ร่วม", en: "Spin a robot wheel: motor driver, separate battery, common ground",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 3-3: ล้อหุ่นยนต์ (MOTOR DRIVER)\nด่านสุดท้ายของบทนี้: ทำให้มอเตอร์ล้อหุ่นยนต์หมุน มอเตอร์ DC เล็กๆ กินกระแสราว 200–500mA\nตั้งค่า 3 อย่างในแผง WIRING: การต่อมอเตอร์, แหล่งไฟของมอเตอร์, สายกราวด์ร่วม แล้วกด RUN\nลองแบบง่ายที่สุดก่อนก็ได้ ต่อมอเตอร์ตรงเข้าขา GPIO",
        en: "> MISSION 3-3: MOTOR DRIVER\nThe chapter finale: spin a robot wheel motor. A small DC motor draws about 200–500mA.\nSet three things in the WIRING panel: how the motor connects, what powers it, and the common ground. Then press RUN.\nFeel free to try the simplest idea first: motor straight onto the GPIO pins." },
      setting: { t: "info", th: "{what}", en: "{what}" },
      choose: { t: "warn", th: "เลือกวิธีต่อมอเตอร์ในแผง WIRING ก่อน", en: "Choose how the motor connects in the WIRING panel first." },
      choosePower: { t: "warn", th: "เลือกแหล่งไฟของมอเตอร์ (VM) ในแผง WIRING ก่อน", en: "Choose the motor power source (VM) in the WIRING panel first." },
      gpio: { t: "error",
        th: "⚡ ล้อกระตุกนิดเดียว แล้ว ESP32 รีบูต! Serial: 'Brownout detector was triggered'\nขา GPIO จ่ายได้แค่ราว 20–40mA แต่มอเตอร์ต้องการหลายร้อย mA แรงดันบอร์ดเลยตก (brownout) และ ESP32 รีเซ็ตตัวเอง\nแย่กว่านั้น มอเตอร์สร้างแรงดันย้อนกลับ (back-EMF) ที่ทำให้ขาพังได้ ขา GPIO มีไว้ 'สั่ง' ไม่ใช่ 'จ่ายแรง' ลองใช้ Driver",
        en: "⚡ The wheel twitches once, then the ESP32 reboots! Serial: 'Brownout detector was triggered'.\nA GPIO pin gives about 20–40mA, but the motor wants hundreds of mA. The board voltage sags (brownout) and the ESP32 resets.\nWorse, motors kick back voltage spikes (back-EMF) that can kill a pin. GPIO pins are for SIGNALS, not muscle. Try the driver." },
      v33: { t: "error",
        th: "⚡ ล้อหมุนอืดๆ แล้ว ESP32 รีบูต!\nใช้ไดรเวอร์แล้วถูกต้อง แต่ไปดึงไฟมอเตอร์จากขา 3V3 ของบอร์ด ตัวควบคุมแรงดันบนบอร์ดจ่ายได้จำกัด และ ESP32 เองก็ใช้ไฟพุ่งถึง ~300mA ตอนส่ง WiFi\nมอเตอร์ดึงไฟจนแรงดันตก กฎ: มอเตอร์ต้องมีแบตของตัวเอง",
        en: "⚡ The wheel crawls, then the ESP32 reboots!\nThe driver is right, but its motor power comes from the board's 3V3 pin. That regulator has limited current, and the ESP32 itself spikes to ~300mA during WiFi.\nThe motor drags the voltage down. Rule: motors get their own battery." },
      noGnd: { t: "warn",
        th: "มอเตอร์เงียบ ไม่ขยับเลย ทั้งที่ ESP32 ส่ง IN1 = HIGH แล้ว\nแรงดันวัดเทียบกับ 'กราวด์' เสมอ ไดรเวอร์ใช้กราวด์ของแบต ESP32 ใช้กราวด์ของ USB ถ้าไม่ต่อถึงกัน 3.3V จาก ESP32 ไม่มีจุดอ้างอิงร่วม ไดรเวอร์จึงมองไม่เห็นสัญญาณ\nเปิด Common GND เพื่อต่อกราวด์ทุกส่วนเข้าด้วยกัน",
        en: "The motor sits silent, even though the ESP32 sets IN1 = HIGH.\nVoltage is always measured against a GROUND. The driver uses the battery's ground and the ESP32 uses USB's. Without a link, the ESP32's 3.3V has no shared reference, so the driver can't see the signal.\nTurn on Common GND to tie every ground together." },
      success: { t: "success",
        th: "✔ ล้อหมุนแล้ว! หุ่นยนต์ของคุณพร้อมวิ่ง\nสูตรต่อมอเตอร์: ESP32 (สั่ง) → มอเตอร์ไดรเวอร์ (ขยายกำลัง) → มอเตอร์ / แบตแยกสำหรับมอเตอร์ / กราวด์ทุกส่วนต่อถึงกัน\nไดรเวอร์มีวงจร H-bridge ข้างใน: IN1/IN2 กำหนดทิศ ลองกด FWD / REV / STOP ดูตารางด้านข้าง",
        en: "✔ The wheel spins! Your robot is ready to roll.\nThe motor recipe: ESP32 (signal) → motor driver (power) → motor / a separate battery for the motor / all grounds tied together.\nInside the driver is an H-bridge: IN1/IN2 set the direction. Try FWD / REV / STOP and watch the table." },
      dir: { t: "info", th: "{d}: IN1 = {a}, IN2 = {b}", en: "{d}: IN1 = {a}, IN2 = {b}" },
      stopped: { t: "info", th: "หยุดมอเตอร์แล้ว", en: "Motor stopped." },
      bp: { t: "hint",
        th: "💡 BLUEPRINT: ESP32 สั่ง → ไดรเวอร์ DRV8833 จ่ายกำลัง → แบต 4×AA (6V) เลี้ยงมอเตอร์ → ต่อ GND ร่วมทุกส่วน\nกำลังต่อแล้วกด RUN...",
        en: "💡 BLUEPRINT: ESP32 signals → DRV8833 driver supplies power → 4×AA (6V) battery feeds the motor → common GND everywhere.\nWiring it and pressing RUN..." },
    },
    init: () => ({ drive: null, power: null, gnd: false, running: false, result: null, dir: "fwd" }),
    status(st) {
      if (!st.running) return ["MOTOR: IDLE", "warn"];
      return { success: [st.dir === "stop" ? "MOTOR: STOP" : "MOTOR: SPINNING", "ok"], gpio: ["BROWNOUT RESET", "bad"], v33: ["BROWNOUT RESET", "bad"], noGnd: ["NO SIGNAL", "warn"] }[st.result];
    },
    boardClass: (st) => (st.running && st.result === "success" ? "lit" : st.running && (st.result === "gpio" || st.result === "v33") ? "fault" : ""),
    board(st, k) {
      const s = k.svg, C = s.COL, run = st.running, ok = run && st.result === "success";
      const brown = run && (st.result === "gpio" || st.result === "v33");
      const in1 = ok ? st.dir === "fwd" : run && st.result !== "success";
      const in2 = ok && st.dir === "rev";
      const pins = [{ name: "3V3", y: 80, active: st.power === "3v3" }, { name: "GPIO25", y: 150, active: !!st.drive }, { name: "GPIO26", y: 190, active: !!st.drive }, { name: "GND", y: 300, active: st.gnd }];
      let g = s.esp32(pins, { reset: brown, fault: brown });
      if (st.drive === "gpio") {
        g += s.sig("M198 150 H540 V165 H586", in1) + s.sig("M198 190 H540 V200 H586", in2);
      } else if (st.drive === "driver") {
        g += s.sig("M198 150 H330", in1) + s.sig("M198 190 H330", in2);
        g += (ok ? s.flow("M470 165 H586") + s.flow("M470 200 H586") : s.wire("M470 165 H586") + s.wire("M470 200 H586"));
        g += `<rect x="330" y="110" width="140" height="150" rx="6" fill="#0b0f1a" stroke="${C.cyan}" stroke-width="2"/>`
          + s.text(400, 140, "DRV8833", { fill: C.cyan, size: 20, display: true }) + s.text(400, 156, "MOTOR DRIVER", { fill: "#2b8aa0", size: 9 })
          + s.text(338, 154, "IN1", { fill: C.dim, size: 9, anchor: "start" }) + s.text(338, 194, "IN2", { fill: C.dim, size: 9, anchor: "start" })
          + s.text(338, 248, "GND", { fill: C.dim, size: 9, anchor: "start" }) + s.text(462, 162, "OUT1", { fill: C.dim, size: 9, anchor: "end" })
          + s.text(462, 197, "OUT2", { fill: C.dim, size: 9, anchor: "end" }) + s.text(400, 104, "VM", { fill: C.amber, size: 10 });
        if (st.power === "battery") g += (ok ? s.flow("M480 337 H500 V92 H400 V110") : s.wire("M480 337 H500 V92 H400 V110"));
        if (st.power === "3v3") g += (brown ? s.flow("M198 80 H400 V110", "fast") : s.wire("M198 80 H400 V110"));
        if (st.power === "battery") g += s.wire("M340 337 H300 V250 H330");
        g += st.gnd ? s.wire("M300 250 V300 H198") : s.wire("M300 260 V300 H198", { dash: true }) + s.text(250, 292, k.t("ไม่มี GND ร่วม", "no common GND"), { fill: C.amber, size: 10 });
      } else {
        g += `<g class="blink">${s.wire("M240 170 H560", { dash: true })}${s.text(400, 160, k.t("เลือกวิธีต่อในแผง WIRING", "choose wiring in the panel"), { fill: C.amber, size: 11 })}</g>`;
      }
      if (st.power === "battery" && st.drive === "driver") {
        g += `<rect x="340" y="318" width="140" height="38" rx="4" fill="#1a1205" stroke="${C.amber}" stroke-width="2"/>`
          + s.text(410, 342, "4×AA · 6V", { fill: C.amber, size: 13, weight: true }) + s.text(474, 332, "+", { fill: C.amber, size: 12 }) + s.text(346, 332, "−", { fill: C.amber, size: 12, anchor: "start" });
      }
      // motor + wheel
      const spin = ok && st.dir !== "stop" ? "spin" + (st.dir === "rev" ? " rev" : "") : brown ? "twitch" : "";
      g += `<circle cx="640" cy="182" r="54" fill="#0b1508" stroke="${ok ? C.neon : C.dim}" stroke-width="3"${ok ? ' filter="url(#glow)"' : ""}/>`
        + `<g class="${spin}"><circle cx="640" cy="182" r="40" fill="none" stroke="#2a2a2a" stroke-width="10"/>`
        + [0, 60, 120].map((a) => `<line x1="${640 + 34 * Math.cos((a * Math.PI) / 180)}" y1="${182 + 34 * Math.sin((a * Math.PI) / 180)}" x2="${640 - 34 * Math.cos((a * Math.PI) / 180)}" y2="${182 - 34 * Math.sin((a * Math.PI) / 180)}" stroke="${ok ? C.neon : "#5a6b5a"}" stroke-width="4"/>`).join("")
        + `</g><circle cx="640" cy="182" r="10" fill="${C.bg}" stroke="${ok ? C.neon : C.dim}" stroke-width="3"/>`
        + `<circle cx="586" cy="165" r="4" fill="${C.amber}"/><circle cx="586" cy="200" r="4" fill="${C.amber}"/>`
        + s.text(640, 262, k.t("มอเตอร์ล้อ", "WHEEL MOTOR"), { fill: ok ? C.neon : C.dim, size: 12, weight: true })
        + s.text(640, 278, "≈300 mA", { fill: C.dim, size: 10 });
      return g;
    },
    note: (st, k) => k.t("ตั้งค่าในแผง WIRING แล้วกด RUN · ถ้าเปลี่ยนสายระหว่างทำงาน ระบบจะหยุดมอเตอร์ให้ก่อน", "Set up the WIRING panel, then press RUN · changing wiring while running stops the motor first"),
    side(st, k) {
      const t = k.t;
      const wiring = k.seg(t("1. ต่อมอเตอร์", "1. Motor connection"), "drive", [{ v: "gpio", label: t("ตรงเข้า GPIO", "Direct to GPIO") }, { v: "driver", label: t("ผ่าน Driver", "Via driver") }], st.drive)
        + k.seg(t("2. ไฟเลี้ยงมอเตอร์ (VM)", "2. Motor power (VM)"), "power", [{ v: "3v3", label: t("ขา 3V3 ของ ESP32", "ESP32 3V3 pin") }, { v: "battery", label: t("แบต 4×AA 6V", "4×AA 6V battery") }], st.power, { disabled: st.drive !== "driver" })
        + k.seg(t("3. GND ร่วม", "3. Common GND"), "gnd", [{ v: "off", label: t("ไม่ต่อ", "Off") }, { v: "on", label: t("ต่อ", "On") }], st.gnd ? "on" : "off", { disabled: st.drive !== "driver" });
      const hb = `<table class="tt"><thead><tr><th>${t("ทิศ", "DIR")}</th><th>IN1</th><th>IN2</th></tr></thead><tbody>
        ${[["fwd", "FWD", 1, 0], ["rev", "REV", 0, 1], ["stop", "STOP", 0, 0]].map(([v, l, a, b]) => `<tr class="${st.running && st.result === "success" && st.dir === v ? "cur" : ""}"><td>${l}</td><td>${a}</td><td>${b}</td></tr>`).join("")}
      </tbody></table>`;
      return k.panel("wiring", wiring)
        + k.meter([[t("มอเตอร์ต้องการ", "Motor needs"), "≈300 mA", "mid"], [t("ขา GPIO จ่ายได้", "GPIO can give"), "≈20–40 mA"], ["VM", st.power === "battery" ? "6.0 V" : st.power === "3v3" ? "3.3 V" : "—"], ["GND", st.gnd ? t("ร่วม", "common") : t("แยก", "separate"), st.gnd ? "good" : ""]], 0, { noGauge: true })
        + k.panel("h-bridge truth table", hb);
    },
    buttons(st, k) {
      const ok = st.running && st.result === "success";
      return k.btn("run", st.running ? "■ STOP" : "▶ RUN", "sw" + (st.running ? " on" : ""))
        + (ok ? ["fwd", "rev", "stop"].map((d) => k.btn("dir", d.toUpperCase(), st.dir === d ? "sw on" : "", { data: { v: d } })).join("") : "");
    },
    act(a, el, st, api) {
      if (a === "drive" || a === "power" || a === "gnd") {
        const wasRunning = st.running;
        st.running = false;
        if (a === "drive") st.drive = el.dataset.v;
        if (a === "power") st.power = el.dataset.v;
        if (a === "gnd") st.gnd = el.dataset.v === "on";
        api.refresh();
        const what = a === "drive" ? (st.drive === "gpio" ? api.t("ต่อมอเตอร์ตรงเข้าขา GPIO25/26", "Motor wired straight to GPIO25/26") : api.t("ต่อมอเตอร์ผ่าน DRV8833 (GPIO25 → IN1, GPIO26 → IN2)", "Motor wired through the DRV8833 (GPIO25 → IN1, GPIO26 → IN2)"))
          : a === "power" ? (st.power === "3v3" ? api.t("VM ของไดรเวอร์ต่อกับขา 3V3 ของ ESP32", "Driver VM fed from the ESP32 3V3 pin") : api.t("VM ของไดรเวอร์ต่อกับแบต 4×AA (6V)", "Driver VM fed from the 4×AA (6V) battery"))
          : st.gnd ? api.t("ต่อ GND ของ ESP32 แบต และไดรเวอร์เข้าด้วยกันแล้ว", "ESP32, battery and driver grounds tied together") : api.t("ถอดสาย GND ร่วมออก", "Common GND wire removed");
        return api.say("setting", { what: (wasRunning ? api.t("(หยุดมอเตอร์ก่อนแก้สาย) ", "(motor stopped to rewire) ") : "") + what });
      }
      if (a === "dir") {
        st.dir = el.dataset.v; api.refresh();
        const [x, y] = { fwd: [1, 0], rev: [0, 1], stop: [0, 0] }[st.dir];
        return api.say("dir", { d: st.dir.toUpperCase(), a: x, b: y });
      }
      if (a !== "run") return;
      if (st.running) { st.running = false; api.refresh(); return api.say("stopped"); }
      if (!st.drive) return api.say("choose");
      if (st.drive === "driver" && !st.power) return api.say("choosePower");
      st.running = true; st.dir = "fwd";
      st.result = st.drive === "gpio" ? "gpio" : !st.gnd ? "noGnd" : st.power === "3v3" ? "v33" : "success";
      if (st.result === "success") { api.clear(); api.render(); } else { api.refresh(); if (st.result !== "noGnd") api.vibrate([40, 30, 40]); }
      api.say(st.result);
      if (st.result === "gpio" || st.result === "v33") api.later(() => { st.running = false; api.refresh(); }, 2600);
    },
    blueprint(st, api) {
      api.say("bp");
      api.later(() => { st.drive = "driver"; api.refresh(); }, 1200);
      api.later(() => { st.power = "battery"; api.refresh(); }, 2000);
      api.later(() => { st.gnd = true; api.refresh(); }, 2800);
      api.later(() => { st.running = true; st.result = "success"; st.dir = "fwd"; api.done("success"); }, 3800);
    },
  });
})();

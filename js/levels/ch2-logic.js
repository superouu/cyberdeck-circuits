/* Chapter 2: Logic Gates (LV.6 – LV.7)
   Both levels share one puzzle engine: inputs → gate slot(s) → LED,
   a goal written as a truth table, and a mission is cleared once
   every row of the table has been tested and matches. */
(() => {
  const GATES = {
    AND: { sym: "&", f: (a, b) => a && b },
    OR: { sym: "≥1", f: (a, b) => a || b },
    XOR: { sym: "=1", f: (a, b) => a !== b },
    NOT: { sym: "1○", f: (a) => !a },
    WIRE: { sym: "—", f: (a) => a },
  };
  const GATE_INFO = {
    AND: { th: "AND: ออก 1 ก็ต่อเมื่อ 'ทุก' อินพุตเป็น 1", en: "AND: output is 1 only when ALL inputs are 1" },
    OR: { th: "OR: ออก 1 เมื่ออินพุต 'อย่างน้อยหนึ่ง' เป็น 1", en: "OR: output is 1 when AT LEAST ONE input is 1" },
    XOR: { th: "XOR: ออก 1 เมื่ออินพุต 'ต่างกัน' (เป็น 1 อยู่ตัวเดียว)", en: "XOR: output is 1 when the inputs DIFFER (exactly one is 1)" },
    NOT: { th: "NOT: กลับค่า 1 → 0 และ 0 → 1", en: "NOT: flips the signal, 1 → 0 and 0 → 1" },
    WIRE: { th: "WIRE: ส่งค่าผ่านตรงๆ ไม่เปลี่ยนอะไร", en: "WIRE: passes the signal straight through" },
  };

  const COMMON_MSGS = {
    gate: { t: "info", th: "{slot} = {gate}\n{info}\nสลับอินพุตเพื่อทดสอบทุกแถวในตาราง", en: "{slot} = {gate}\n{info}\nToggle the inputs to test every row of the table." },
    chooseGate: { t: "hint", th: "ยังมีชิปที่เป็น [?] อยู่ แตะที่ชิปบนบอร์ดเพื่อเลือกเกตก่อน", en: "A chip is still [?]. Tap it on the board to choose a gate first." },
    rowOk: { t: "info", th: "{row} → LED {out} ✓ ตรงตามเป้าหมาย ({n}/{total} แถว)", en: "{row} → LED {out} ✓ matches the goal ({n}/{total} rows)" },
    rowBad: { t: "warn",
      th: "✗ {row} → LED {out} แต่เป้าหมายคือ {exp}\n{why}\nแตะชิปเพื่อลองเกตอื่น (ตารางจะเริ่มทดสอบใหม่)",
      en: "✗ {row} → LED {out}, but the goal says {exp}.\n{why}\nTap the chip to try another gate (the table restarts)." },
    nextMission: { t: "info", th: "ภารกิจถัดไป...", en: "Next mission..." },
  };

  const combos = (n) => Array.from({ length: 1 << n }, (_, i) => Array.from({ length: n }, (_, b) => !!((i >> (n - 1 - b)) & 1)));
  const rowKey = (vals) => vals.map((v) => (v ? 1 : 0)).join("");

  CD.logicLevel = (def) => {
    const msgs = Object.assign({}, COMMON_MSGS, def.msgs);
    const mission = (st) => def.missions[st.m];

    const output = (st) => {
      const M = mission(st), v = M.inputs.map((i) => st.inputs[i.id]);
      if (M.slots.some((s) => !st.slots[s.id])) return null;
      return M.evaluate(v, st.slots, GATES);
    };
    const rowText = (st, vals) => mission(st).inputs.map((inp, i) => `${inp.short}=${vals[i] ? 1 : 0}`).join(" ");
    const onOff = (b) => (b ? "ON" : "OFF");

    function fresh(m) {
      const M = def.missions[m];
      return { m, inputs: Object.fromEntries(M.inputs.map((i) => [i.id, false])), slots: Object.fromEntries(M.slots.map((s) => [s.id, null])), tested: {}, solved: false };
    }
    function test(st, api, quiet) {
      const M = mission(st), out = output(st);
      if (out === null) return api.say("chooseGate");
      const vals = M.inputs.map((i) => st.inputs[i.id]);
      const exp = M.spec(vals);
      st.tested[rowKey(vals)] = out;
      const total = 1 << M.inputs.length;
      const n = Object.keys(st.tested).length;
      if (out !== exp) {
        api.refresh();
        return api.say("rowBad", { row: rowText(st, vals), out: onOff(out), exp: onOff(exp), why: M.why[api.t("th", "en")] });
      }
      const allOk = n === total && combos(M.inputs.length).every((c) => st.tested[rowKey(c)] === M.spec(c));
      if (allOk) return complete(st, api);
      api.refresh();
      if (!quiet) api.say("rowOk", { row: rowText(st, vals), out: onOff(out), n, total });
    }
    function complete(st, api, viaBlueprint) {
      st.solved = true;
      const last = st.m === def.missions.length - 1;
      if (last) {
        if (viaBlueprint) return api.done("m" + st.m + "Done");
        api.clear(); api.render();
      } else {
        if (viaBlueprint) api.auto = false;
        api.render();
      }
      api.say("m" + st.m + "Done");
    }

    CD.level({
      id: def.id, code: def.code, name: def.name, th: def.th, en: def.en, msgs,
      init: () => fresh(0),
      status(st) {
        const out = output(st);
        if (st.solved) return ["MISSION " + (st.m + 1) + " ✔", "ok"];
        return out === null ? ["CHIP: ?", "warn"] : out ? ["LED: ON", "ok"] : ["LED: OFF", "warn"];
      },
      boardClass: (st) => (output(st) ? "lit" : ""),
      board(st, k) {
        const s = k.svg, C = s.COL, M = mission(st), out = output(st);
        const v = M.inputs.map((i) => st.inputs[i.id]);
        const inputBlock = (inp, y) => {
          const on = st.inputs[inp.id];
          const inner = `<rect x="40" y="${y - 30}" width="130" height="60" rx="6" fill="${C.bg}" stroke="${on ? C.neon : C.amber}" stroke-width="2"${on ? ' filter="url(#glow)"' : ""}/>`
            + s.text(105, y - 8, inp.label[k.t("th", "en")], { fill: on ? C.neon : C.amber, size: 11 })
            + s.text(105, y + 20, on ? "1 · HIGH" : "0 · LOW", { fill: on ? C.neon : C.dim, size: 22, display: true });
          return s.hit("input", { in: inp.id }, inp.label.en + (on ? " high" : " low"), [36, y - 34, 138, 68], inner);
        };
        const chip = (slot, x, y, w, h) => {
          const g = st.slots[slot.id];
          const inner = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#0b1508" stroke="${g ? C.neon : C.amber}" stroke-width="2"${g ? "" : ' stroke-dasharray="6 5"'}/>`
            + s.text(x + w / 2, y + h / 2 + 2, g || "?", { fill: g ? C.neon : C.amber, size: h > 60 ? 30 : 24, display: true })
            + s.text(x + w / 2, y + h / 2 + (h > 60 ? 24 : 18), g ? GATES[g].sym : k.t("แตะเพื่อเลือก", "tap to pick"), { fill: C.dim, size: 10 });
          return s.hit("slot", { slot: slot.id }, "Gate chip " + slot.id + ": " + (g || "empty"), [x - 4, y - 4, w + 8, h + 8], inner);
        };
        let g = "";
        if (M.layout === "2in") {
          g += s.sig("M170 120 H260 V170 H330", v[0]) + s.sig("M170 260 H260 V210 H330", v[1])
            + s.sig("M470 190 H640 V200", !!out) + s.wire("M640 280 V330")
            + inputBlock(M.inputs[0], 120) + inputBlock(M.inputs[1], 260) + chip(M.slots[0], 330, 140, 140, 100);
        } else if (M.layout === "1in") {
          g += s.sig("M170 190 H330", v[0]) + s.sig("M470 190 H640 V200", !!out) + s.wire("M640 280 V330")
            + inputBlock(M.inputs[0], 190) + chip(M.slots[0], 330, 140, 140, 100);
        } else {
          const g1 = st.slots[M.slots[0].id], mid = g1 ? GATES[g1].f(v[0]) : false;
          g += s.sig("M170 120 H220", v[0]) + s.sig("M320 120 H380 V170 H430", !!(g1 && mid)) + s.sig("M170 260 H380 V210 H430", v[1])
            + s.sig("M550 190 H640 V200", !!out) + s.wire("M640 280 V330")
            + inputBlock(M.inputs[0], 120) + inputBlock(M.inputs[1], 260)
            + chip(M.slots[0], 220, 92, 100, 56) + chip(M.slots[1], 430, 140, 120, 100);
        }
        g += s.led(640, 200, out ? "on" : "off", { label: M.output[k.t("th", "en")], sub: ["(+R inside)"] }) + s.gnd(640, 330);
        return g;
      },
      note: (st, k) => k.t("แตะกล่องอินพุตเพื่อสลับ 0/1 · แตะชิปเพื่อเปลี่ยนเกต · เส้นเรืองแสง = สัญญาณ HIGH (1)", "Tap an input to toggle 0/1 · tap a chip to change the gate · glowing line = HIGH (1)"),
      side(st, k) {
        const M = mission(st), lang = k.t("th", "en");
        const cur = rowKey(M.inputs.map((i) => st.inputs[i.id]));
        const rows = combos(M.inputs.length).map((c) => {
          const key = rowKey(c), exp = M.spec(c), got = st.tested[key];
          const res = got === undefined ? '<td class="na">·</td><td class="na"></td>' : `<td class="${got === exp ? "ok" : "bad"}">${got ? 1 : 0}</td><td class="${got === exp ? "ok" : "bad"}">${got === exp ? "✓" : "✗"}</td>`;
          return `<tr class="${key === cur ? "cur" : ""}">${c.map((b) => `<td>${b ? 1 : 0}</td>`).join("")}<td>${exp ? 1 : 0}</td>${res}</tr>`;
        }).join("");
        const table = `<table class="tt"><thead><tr>${M.inputs.map((i) => `<th>${i.short}</th>`).join("")}<th>${k.t("เป้า", "GOAL")}</th><th>LED</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
        const options = [...new Set(M.slots.flatMap((s) => s.options))];
        return k.panel(`mission ${st.m + 1} / ${def.missions.length}`, `<div class="mission"><b>${M.title[lang]}</b><p>${M.goal[lang]}</p></div>`)
          + k.panel("truth table", table)
          + k.panel("gate cheat sheet", `<div class="mission">${options.map((o) => `<p>${GATE_INFO[o][lang]}</p>`).join("")}</div>`);
      },
      buttons(st, k) {
        const M = mission(st);
        return M.inputs.map((i) => k.btn("input", `${i.short} = ${st.inputs[i.id] ? 1 : 0}`, "sw" + (st.inputs[i.id] ? " on" : ""), { data: { in: i.id }, pressed: st.inputs[i.id] })).join("")
          + (st.solved && st.m < def.missions.length - 1 ? k.btn("mission", k.t("ภารกิจถัดไป ▶", "NEXT MISSION ▶"), "next") : "");
      },
      act(a, el, st, api) {
        const M = mission(st);
        if (a === "mission") {
          Object.assign(st, fresh(st.m + 1));
          api.render();
          return api.say("m" + st.m + "Intro");
        }
        if (st.solved) return;
        if (a === "slot") {
          const slot = M.slots.find((s) => s.id === el.dataset.slot);
          const curI = slot.options.indexOf(st.slots[slot.id]);
          st.slots[slot.id] = slot.options[(curI + 1) % slot.options.length];
          st.tested = {};
          api.refresh();
          return api.say("gate", { slot: slot.name || "CHIP", gate: st.slots[slot.id], info: GATE_INFO[st.slots[slot.id]][api.t("th", "en")] });
        }
        if (a === "input") {
          st.inputs[el.dataset.in] = !st.inputs[el.dataset.in];
          return test(st, api);
        }
      },
      blueprint(st, api) {
        api.say("m" + st.m + "Bp");
        const M = mission(st);
        api.later(() => { Object.assign(st.slots, M.answer); api.refresh(); }, 1400);
        const rows = combos(M.inputs.length);
        rows.forEach((c, i) => {
          api.later(() => {
            M.inputs.forEach((inp, j) => { st.inputs[inp.id] = c[j]; });
            st.tested[rowKey(c)] = output(st);
            if (i === rows.length - 1) complete(st, api, true);
            else api.refresh();
          }, 2400 + i * 800);
        });
      },
      /* reset and blueprint restart the current mission, not mission 1 */
      again: (st) => fresh(st.m),
    });
  };

  /* ===================================================================== */
  /* LV.6 AND / OR / XOR                                                   */
  /* ===================================================================== */
  CD.logicLevel({
    id: 6, code: "LV.6", name: "Gate Keeper", th: "เกต AND / OR / XOR และตารางความจริง", en: "AND / OR / XOR and truth tables",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 2-1: ผู้เฝ้าประตู (GATE KEEPER)\nในโลกดิจิทัล สัญญาณมีแค่ 2 ค่า: 1 (HIGH ≈ 3.3V) กับ 0 (LOW ≈ 0V) 'ลอจิกเกต' คือชิปที่ตัดสินใจจากอินพุต\nภารกิจ 1: ประตูนิรภัยต้องเปิด (LED ติด) ก็ต่อเมื่อเสียบกุญแจ 'ทั้ง' A และ B\nแตะชิป [?] เพื่อเลือกเกต แล้วสลับอินพุตให้ครบทุกแถวในตารางความจริง",
        en: "> MISSION 2-1: GATE KEEPER\nDigital signals have just two values: 1 (HIGH ≈ 3.3V) and 0 (LOW ≈ 0V). A logic gate is a chip that decides based on its inputs.\nMission 1: the vault opens (LED on) only when BOTH key A and key B are in.\nTap the [?] chip to pick a gate, then toggle the inputs through every row of the truth table." },
      m0Done: { t: "success",
        th: "✔ ประตูนิรภัยปลอดภัย! AND เปิดเฉพาะเมื่อกุญแจครบทั้งสอง\nในหุ่นยนต์: 'เดินหน้าได้เมื่อ แบตพอ AND ไม่มีสิ่งกีดขวาง' ก็คือ AND\nกด [ภารกิจถัดไป] ต่อเลย",
        en: "✔ The vault is secure! AND only opens with both keys.\nIn a robot: 'drive forward when battery OK AND no obstacle' is an AND.\nPress [NEXT MISSION] to continue." },
      m0Bp: { t: "hint", th: "💡 BLUEPRINT: 'ทั้ง A และ B' = AND กำลังใส่ชิป AND แล้วทดสอบครบ 4 แถว...", en: "💡 BLUEPRINT: 'both A and B' = AND. Fitting an AND chip and testing all 4 rows..." },
      m1Intro: { t: "info",
        th: "> ภารกิจ 2: กริ่งบ้าน\nมีปุ่มกริ่ง 2 ที่: ประตูหน้า (F) และประตูหลัง (B) กดที่ไหนก็ได้ กริ่งต้องดัง (LED ติด)\nเลือกเกตแล้วทดสอบให้ครบ",
        en: "> MISSION 2: DOORBELL\nThere are two bell buttons: Front (F) and Back (B). Pressing either one must ring the bell (LED on).\nPick a gate and test every row." },
      m1Done: { t: "success",
        th: "✔ กริ่งดังจากทั้งสองประตู! OR ออก 1 เมื่ออินพุตใดก็ได้เป็น 1\nสังเกต: กดพร้อมกันทั้งคู่ก็ยังดัง ถ้าอยากให้ดังเฉพาะตอนกดปุ่มเดียว นั่นคือ XOR\nคุณใช้ AND กับ OR เป็นแล้ว นี่คือพื้นฐานของทุกการตัดสินใจในชิป ไปด่านต่อไปกัน",
        en: "✔ The bell rings from both doors! OR outputs 1 when any input is 1.\nNote: pressing both still rings. If it should ring only for exactly one button, that's XOR.\nYou can use AND and OR now, the basis of every decision inside a chip. On to the next level." },
      m1Bp: { t: "hint", th: "💡 BLUEPRINT: 'ปุ่มไหนก็ได้' = OR กำลังใส่ชิป OR แล้วทดสอบครบ 4 แถว...", en: "💡 BLUEPRINT: 'either button' = OR. Fitting an OR chip and testing all 4 rows..." },
    },
    missions: [
      {
        layout: "2in",
        title: { th: "ภารกิจ 1: ประตูนิรภัย", en: "Mission 1: The vault" },
        goal: { th: "LED (ประตูเปิด) ติดเฉพาะเมื่อ A = 1 และ B = 1", en: "LED (door open) only when A = 1 and B = 1" },
        inputs: [{ id: "A", short: "A", label: { th: "กุญแจ A", en: "KEY A" } }, { id: "B", short: "B", label: { th: "กุญแจ B", en: "KEY B" } }],
        output: { th: "ประตู", en: "DOOR" },
        slots: [{ id: "g", name: "CHIP", options: ["AND", "OR", "XOR"] }],
        evaluate: (v, slots, G) => G[slots.g].f(v[0], v[1]),
        spec: (v) => v[0] && v[1],
        answer: { g: "AND" },
        why: { th: "แบบนี้โจรที่มีกุญแจดอกเดียวก็เข้าได้ หรือคนที่มีครบสองดอกกลับเข้าไม่ได้", en: "That lets a thief with one key in, or locks out someone holding both." },
      },
      {
        layout: "2in",
        title: { th: "ภารกิจ 2: กริ่งบ้าน", en: "Mission 2: The doorbell" },
        goal: { th: "LED (กริ่ง) ติดเมื่อกดปุ่ม F หรือ B (หรือทั้งคู่)", en: "LED (bell) on when F or B is pressed (or both)" },
        inputs: [{ id: "F", short: "F", label: { th: "ปุ่มหน้าบ้าน", en: "FRONT BTN" } }, { id: "B", short: "B", label: { th: "ปุ่มหลังบ้าน", en: "BACK BTN" } }],
        output: { th: "กริ่ง", en: "BELL" },
        slots: [{ id: "g", name: "CHIP", options: ["AND", "OR", "XOR"] }],
        evaluate: (v, slots, G) => G[slots.g].f(v[0], v[1]),
        spec: (v) => v[0] || v[1],
        answer: { g: "OR" },
        why: { th: "แขกที่กดปุ่มอยู่จะไม่ได้ยินกริ่งในบางกรณี", en: "In some cases a visitor pressing a button gets no ring." },
      },
    ],
  });

  /* ===================================================================== */
  /* LV.7 NOT + combining gates                                            */
  /* ===================================================================== */
  CD.logicLevel({
    id: 7, code: "LV.7", name: "Night Light", th: "เกต NOT และการต่อเกตหลายตัว", en: "The NOT gate and chaining gates",
    msgs: {
      intro: { t: "info",
        th: "> ภารกิจ 2-2: ไฟกลางคืน (NIGHT LIGHT)\nเซนเซอร์แสง (LDR) ให้ค่า 1 ตอนสว่าง (กลางวัน) และ 0 ตอนมืด\nภารกิจ 1: ไฟ LED ต้องติด 'ตอนมืด' ถ้าต่อเซนเซอร์ตรงเข้า LED จะได้ผลกลับกัน ลองดู",
        en: "> MISSION 2-2: NIGHT LIGHT\nThe light sensor (LDR) outputs 1 when it's bright (day) and 0 when it's dark.\nMission 1: the LED must turn on in the DARK. Wiring the sensor straight to the LED does the opposite. Try it." },
      m0Done: { t: "success",
        th: "✔ ไฟติดเองตอนมืด! NOT กลับค่าสัญญาณ: สว่าง(1) → ดับ(0), มืด(0) → ติด(1)\nกด [ภารกิจถัดไป] เพื่อเพิ่มสวิตช์หลัก",
        en: "✔ The light turns on by itself in the dark! NOT flips the signal: bright(1) → off(0), dark(0) → on(1).\nPress [NEXT MISSION] to add a master switch." },
      m0Bp: { t: "hint", th: "💡 BLUEPRINT: ต้องการค่าตรงข้ามกับเซนเซอร์ = NOT กำลังใส่ชิปและทดสอบ...", en: "💡 BLUEPRINT: we need the opposite of the sensor = NOT. Fitting the chip and testing..." },
      m1Intro: { t: "info",
        th: "> ภารกิจ 2: ไฟกลางคืน + สวิตช์หลัก\nไฟต้องติดเมื่อ 'มืด' และ 'สวิตช์หลักเปิดอยู่' เท่านั้น\nมีชิป 2 ตัวต่อกัน: ชิป 1 รับสัญญาณเซนเซอร์ ชิป 2 รวมกับสวิตช์หลัก เลือกให้ถูกทั้งคู่",
        en: "> MISSION 2: NIGHT LIGHT + MASTER SWITCH\nThe light must be on only when it's DARK AND the master switch is ON.\nTwo chips in a chain: chip 1 takes the sensor, chip 2 combines it with the switch. Get both right." },
      m1Done: { t: "success",
        th: "✔ วงจรสมบูรณ์! LED = (NOT แสง) AND สวิตช์\nการต่อเกตหลายตัวแบบนี้คือหัวใจของ CPU: ทุกการคำนวณในคอมพิวเตอร์สร้างจากเกตเล็กๆ นับพันล้านตัว\nใน ESP32 คุณจะเขียนแบบเดียวกันเป็นโค้ด: if (!light && masterOn) { ... }",
        en: "✔ Circuit complete! LED = (NOT light) AND switch.\nChaining gates like this is the heart of a CPU: every computation in a computer is built from billions of tiny gates.\nOn an ESP32 you'll write the same thing in code: if (!light && masterOn) { ... }" },
      m1Bp: { t: "hint", th: "💡 BLUEPRINT: 'มืด' = NOT แสง แล้ว 'และ' สวิตช์ = AND กำลังใส่ชิปและทดสอบ 4 แถว...", en: "💡 BLUEPRINT: 'dark' = NOT light, then 'and' the switch = AND. Fitting the chips and testing 4 rows..." },
    },
    missions: [
      {
        layout: "1in",
        title: { th: "ภารกิจ 1: เปิดไฟตอนมืด", en: "Mission 1: On in the dark" },
        goal: { th: "LED ติดเมื่อ แสง = 0 (มืด)", en: "LED on when LIGHT = 0 (dark)" },
        inputs: [{ id: "L", short: "LIGHT", label: { th: "เซนเซอร์แสง", en: "LIGHT SENSOR" } }],
        output: { th: "ไฟ", en: "LAMP" },
        slots: [{ id: "g", name: "CHIP", options: ["WIRE", "NOT"] }],
        evaluate: (v, slots, G) => G[slots.g].f(v[0]),
        spec: (v) => !v[0],
        answer: { g: "NOT" },
        why: { th: "แบบนี้ไฟจะติดตอนกลางวันและดับตอนกลางคืน กลับด้านกับที่ต้องการ", en: "That lights the lamp by day and turns it off at night, the opposite of what we want." },
      },
      {
        layout: "chain",
        title: { th: "ภารกิจ 2: มืด และ สวิตช์เปิด", en: "Mission 2: Dark AND switch on" },
        goal: { th: "LED ติดเมื่อ แสง = 0 และ SW = 1", en: "LED on when LIGHT = 0 and SW = 1" },
        inputs: [{ id: "L", short: "LIGHT", label: { th: "เซนเซอร์แสง", en: "LIGHT SENSOR" } }, { id: "S", short: "SW", label: { th: "สวิตช์หลัก", en: "MASTER SW" } }],
        output: { th: "ไฟ", en: "LAMP" },
        slots: [{ id: "g1", name: "CHIP 1", options: ["WIRE", "NOT"] }, { id: "g2", name: "CHIP 2", options: ["AND", "OR"] }],
        evaluate: (v, slots, G) => G[slots.g2].f(G[slots.g1].f(v[0]), v[1]),
        spec: (v) => !v[0] && v[1],
        answer: { g1: "NOT", g2: "AND" },
        why: { th: "ลองไล่ทีละชิป: ชิป 1 ต้องให้ 1 ตอนมืด และชิป 2 ต้องการทั้งสองเงื่อนไขพร้อมกัน", en: "Work one chip at a time: chip 1 must give 1 in the dark, and chip 2 needs both conditions at once." },
      },
    ],
  });
})();

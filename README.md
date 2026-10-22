# cyberdeck-circuits
เกมฝึกต่อวงจร

**▶ เล่นได้ที่: https://superouu.github.io/cyberdeck-circuits/**

เกมไขปริศนาวงจรไฟฟ้าสไตล์เทอร์มินัลแฮกเกอร์ยุค 8-bit ฝึกพื้นฐานไว้ใช้กับโปรเจกต์หุ่นยนต์ (ESP32) และการประกอบคอมพิวเตอร์
ทำพลาดได้ ไม่มีเกมโอเวอร์ ผู้ช่วยในเทอร์มินัลจะอธิบายเหตุผลทางไฟฟ้าทุกครั้ง

## ด่านที่มีตอนนี้

| บท | ด่าน | เรื่องที่เรียน |
|---|---|---|
| 1 · Power & Light | LV.1 The Switch | วงจรปิด / วงจรเปิด |
| 1 · Power & Light | LV.2 The Resistor | กฎของโอห์ม (V = I × R) และทำไม LED ต้องมีตัวต้านทาน |
| 1 · Power & Light | LV.3 Polarity | ขั้ว LED: Anode (+) / Cathode (−) และไดโอด |
| 1 · Power & Light | LV.4 Series & Parallel | ต่อ LED หลายดวง: อนุกรม V บวกกัน, ขนาน I บวกกัน |
| 1 · Power & Light | LV.5 Resistor Calculator | คำนวณค่า R บนไฟ 5V และอ่านแถบสีตัวต้านทาน |
| 2 · Logic Gates | LV.6 Gate Keeper | เกต AND / OR / XOR และตารางความจริง |
| 2 · Logic Gates | LV.7 Night Light | เกต NOT และการต่อเกตหลายตัว |
| 3 · ESP32 Basics | LV.8 Blink | ขา GPIO แบบ OUTPUT, pinMode / digitalWrite, ขา input-only |
| 3 · ESP32 Basics | LV.9 Pull-Down | อ่านปุ่มกด, ขาลอย (floating), ตัวต้านทาน pull-down / pull-up |
| 3 · ESP32 Basics | LV.10 Motor Driver | มอเตอร์ไดรเวอร์, แบตแยก, GND ร่วม, H-bridge |

ลิงก์ตรงเข้าแต่ละด่าน: เติม `#lv` ตามด้วยเลขด่าน เช่น `https://superouu.github.io/cyberdeck-circuits/#lv8`

## วิธีเล่น
- แตะสวิตช์หรือช่องว่างบนวงจรได้โดยตรง หรือใช้ปุ่มด้านล่าง
- ติดตรงไหน กด **💡 BLUEPRINT** ให้เกมต่อวงจรให้พร้อมอธิบาย
- สลับภาษาไทย / อังกฤษ และเปิดเพลง Lo-Fi ได้ที่มุมขวาบน
- ความคืบหน้าเก็บไว้ในเบราว์เซอร์ของแต่ละเครื่อง
- บน iPad: เปิดใน Safari → Share → **Add to Home Screen** จะได้ไอคอนเหมือนแอป

## โครงสร้าง
HTML + CSS + JavaScript ล้วน ไม่ต้องติดตั้งหรือ build อะไร เปิด `index.html` ได้ทันที

```
index.html              หน้าเว็บ (โหลดไฟล์ด้านล่าง)
css/style.css           หน้าตาทั้งหมด
js/core.js              ระบบหลัก: เทอร์มินัล, ชุดวาดวงจร SVG, หน้าแผนที่ด่าน, เพลง
js/levels/ch1-power.js  บทที่ 1 (LV.1–5)
js/levels/ch2-logic.js  บทที่ 2 (LV.6–7)
js/levels/ch3-esp32.js  บทที่ 3 (LV.8–10)
```

เผยแพร่ผ่าน GitHub Pages: Settings → Pages → Branch `main` / root

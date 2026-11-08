# NBFC TRACKER - ไทย

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

การแข่งขัน เป้าหมาย และสมบัติชิ้นต่อไปของคุณ รวมอยู่ที่เดียว

[แดชบอร์ด](https://nbfct.nimnabro.com/dashboard)  /  [ดาวน์โหลดสำหรับ Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## พร้อมค้นพบเพิ่มเติมหรือยัง?

1. **เปิดใช้รีเพลย์.** ใน Fortnite: การตั้งค่า → เกม → รีเพลย์ → บันทึกรีเพลย์ → เปิด
2. **เปิดแอปคู่หู.** เปิด NBFC TRACKER บน Windows แอปอ่านรีเพลย์ที่บันทึกไว้และแยกแต่ละโปรไฟล์
3. **นำไปใช้ในสตรีม.** วาง URL โอเวอร์เลย์ในแหล่งเบราว์เซอร์ OBS และเปิดแอปคู่หูไว้

## การตั้งค่า

- **จำนวนหีบเริ่มต้น:** ตั้งยอดปัจจุบันของโปรไฟล์นี้ หีบใหม่จะเพิ่มโดยอัตโนมัติ ล้างค่าเพื่อใช้ยอดจากรีเพลย์
- **โฟลเดอร์รีเพลย์:** ต้องใช้แอปคู่หู Windows ใช้โฟลเดอร์เริ่มต้นหากรีเพลย์ไม่ได้อยู่ที่อื่น
- **การซูมแอป:** 50%–150%.
- **ภาษา:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## โอเวอร์เลย์สตรีม

เพิ่มตัวนับเป็นแหล่งเบราว์เซอร์ใน OBS ขนาด: 420 × 120

บันทึกการตั้งค่าที่นี่ OBS จะอัปเดตอัตโนมัติด้วย URL เดิม ให้เปิดแอปคู่หูและ OBS บนพีซีเครื่องเดียวกัน

~~~text
https://nbfct.nimnabro.com/overlay
~~~

อ่านรีเพลย์ในเครื่อง ไม่เข้าถึงหน่วยความจำเกม ไม่มีส่วนเกี่ยวข้องกับ Epic Games

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)

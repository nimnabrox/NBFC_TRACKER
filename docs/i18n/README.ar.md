# NBFC TRACKER - العربية

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

مبارياتك وإنجازاتك وكنزك القادم. كلها في مكان واحد.

[لوحة التحكم](https://nbfct.nimnabro.com)  /  [تنزيل لنظام Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## مستعد لاكتشاف المزيد؟

1. **فعّل الإعادات.** في فورتنايت: الإعدادات ← اللعبة ← الإعادات ← تسجيل الإعادات ← تشغيل.
2. **افتح التطبيق المرافق.** شغّل NBFC TRACKER على Windows. يقرأ الإعادات المحفوظة ويفصل ملفات اللاعبين.
3. **أضفه إلى بثك.** الصق رابط العداد في مصدر متصفح OBS. أبقِ التطبيق المرافق قيد التشغيل.

## الإعدادات

- **عدد الصناديق الابتدائي:** حدد إجمالي هذا الملف الحالي. تُضاف الصناديق الجديدة تلقائيًا. امسح القيمة لاستخدام إجمالي الإعادات.
- **مجلد الإعادات:** يتطلب تطبيق Windows. اترك المجلد الافتراضي ما لم تكن الإعادات في مكان آخر.
- **غرفة سحابية:** أدخل الغرفة من رابط عداد التطبيق لعرضها على جهاز آخر. روابط الغرف عامة.
- **اللغة:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## عداد البث

أضف العداد كمصدر متصفح في OBS. الأبعاد: 420 × 120.

~~~text
https://nbfct.nimnabro.com/overlay?room=YOUR_ROOM&lang=ar
~~~

يقرأ الإعادات المحلية. لا يصل إلى ذاكرة اللعبة. غير تابع لـ Epic Games.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)

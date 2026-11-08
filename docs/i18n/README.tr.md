# NBFC TRACKER - Türkçe

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Maçların, hedeflerin ve sıradaki hazinen. Hepsi bir arada.

[Gösterge paneli](https://nbfct.nimnabro.com/dashboard)  /  [Windows için indir](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Daha fazlasını keşfetmeye hazır mısın?

1. **Tekrarları etkinleştir.** Fortnite’ta: Ayarlar → Oyun → Tekrarlar → Tekrarları Kaydet → Açık.
2. **Yardımcı uygulamayı aç.** Windows’ta NBFC TRACKER’ı çalıştır. Kayıtlı tekrarları okur ve profilleri ayrı tutar.
3. **Yayınına ekle.** Katman URL’sini OBS Tarayıcı Kaynağına yapıştır. Yardımcı uygulama açık kalsın.

## Ayarlar

- **Başlangıç sandık sayısı:** Bu profilin mevcut toplamını ayarla. Yeni sandıklar otomatik eklenir. Tekrar toplamlarını kullanmak için temizle.
- **Tekrar klasörü:** Windows uygulaması gerekir. Tekrarlar başka yerde değilse varsayılan klasörü koru.
- **Uygulama yakınlaştırması:** 50%–150%.
- **Dil:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Yayın katmanı

Sayacı OBS Tarayıcı Kaynağı olarak ekle. Boyut: 420 × 120.

Ayarları burada kaydedin. OBS aynı URL üzerinden otomatik güncellenir. Uygulamayı ve OBS’yi aynı bilgisayarda çalıştırın.

~~~text
https://nbfct.nimnabro.com/overlay
~~~

Yerel tekrar dosyalarını okur. Oyun belleğine erişmez. Epic Games ile bağlantılı değildir.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)

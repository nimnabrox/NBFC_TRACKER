# NBFC TRACKER - Bahasa Indonesia

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Pertandingan, pencapaian, dan harta karun berikutnya. Semua di satu tempat.

[Dasbor](https://nbfct.nimnabro.com)  /  [Unduh untuk Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Siap menemukan lebih banyak?

1. **Aktifkan replay.** Di Fortnite: Pengaturan → Game → Replay → Rekam Replay → Aktif.
2. **Buka pendamping.** Jalankan NBFC TRACKER di Windows. Aplikasi membaca replay dan memisahkan setiap profil.
3. **Tampilkan di siaranmu.** Tempel URL overlay ke Sumber Browser OBS. Biarkan pendamping berjalan.

## Pengaturan

- **Jumlah peti awal:** Atur jumlah saat ini untuk profil ini. Peti baru ditambahkan otomatis. Kosongkan untuk memakai total replay.
- **Folder replay:** Memerlukan pendamping Windows. Gunakan folder bawaan kecuali replay disimpan di tempat lain.
- **Ruang cloud:** Masukkan ruang dari URL overlay pendamping untuk melihatnya di perangkat lain. Tautan ruang bersifat publik.
- **Bahasa:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Overlay siaran

Tambahkan penghitung sebagai Sumber Browser OBS. Ukuran: 420 × 120.

~~~text
https://nbfct.nimnabro.com/overlay?room=YOUR_ROOM&lang=id
~~~

Membaca replay lokal. Tidak mengakses memori game. Tidak berafiliasi dengan Epic Games.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)

# NBFC TRACKER - English

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Your matches, your milestones, your next treasure. All in one place.

[Dashboard](https://nbfct.nimnabro.com)  /  [Download for Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Ready to find more?

1. **Enable replays.** In Fortnite: Settings → Game → Replays → Record Replays → On.
2. **Open the companion.** Run NBFC TRACKER on Windows. It reads your saved replays and keeps profiles separate.
3. **Bring it to your stream.** Copy the overlay URL into an OBS Browser Source. Keep the companion running.

## Settings

- **Starting chest count:** Set your current milestone for this profile. Future chests are added automatically. Clear to use replay totals.
- **Replay folder:** Windows companion required. Leave the default unless your replays are elsewhere.
- **Cloud room:** Enter the room from your companion overlay URL to view it on another device. Room links are public.
- **Language:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Stream overlay

Add your counter as an OBS Browser Source. Size: 420 × 120.

~~~text
https://nbfct.nimnabro.com/overlay?room=YOUR_ROOM&lang=en
~~~

Reads local replay files. No game memory access. Not affiliated with Epic Games.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)

# NBFC TRACKER - Deutsch

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Deine Spiele, deine Meilensteine, dein nächster Schatz. Alles an einem Ort.

[Übersicht](https://nbfct.nimnabro.com/dashboard)  /  [Für Windows herunterladen](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Bereit für mehr Funde?

1. **Replays aktivieren.** In Fortnite: Einstellungen → Spiel → Replays → Replays aufnehmen → Ein.
2. **Begleit-App öffnen.** Starte NBFC TRACKER unter Windows. Die App liest gespeicherte Replays und trennt Profile.
3. **Ab in deinen Stream.** Füge die Overlay-URL in eine OBS-Browserquelle ein. Lass die Begleit-App laufen.

## Einstellungen

- **Startwert für Truhen:** Lege deinen aktuellen Meilenstein für dieses Profil fest. Neue Truhen werden automatisch addiert. Leeren nutzt Replay-Summen.
- **Replay-Ordner:** Windows-Begleit-App erforderlich. Behalte den Standardordner bei, sofern deine Replays nicht woanders liegen.
- **App-Zoom:** 50%–150%.
- **Sprache:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Stream-Overlay

Füge den Zähler als OBS-Browserquelle hinzu. Größe: 420 × 120.

Hier Einstellungen speichern. OBS übernimmt Änderungen automatisch über dieselbe URL. Begleit-App und OBS müssen auf demselben PC laufen.

~~~text
https://nbfct.nimnabro.com/overlay
~~~

Liest lokale Replays. Kein Zugriff auf den Spielspeicher. Nicht mit Epic Games verbunden.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)

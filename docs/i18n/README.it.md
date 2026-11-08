# NBFC TRACKER - Italiano

[Bahasa Indonesia](README.id.md)  /  [Deutsch](README.de.md)  /  [English](README.en.md)  /  [Español](README.es.md)  /  [Español (Latinoamérica)](README.es-419.md)  /  [Français](README.fr.md)  /  [Italiano](README.it.md)  /  [Polski](README.pl.md)  /  [Português (Brasil)](README.pt-BR.md)  /  [Tiếng Việt](README.vi.md)  /  [Türkçe](README.tr.md)  /  [Русский](README.ru.md)  /  [العربية](README.ar.md)  /  [ไทย](README.th.md)  /  [日本語](README.ja.md)  /  [简体中文](README.zh-Hans.md)  /  [繁體中文](README.zh-Hant.md)  /  [한국어](README.ko.md)

Le tue partite, i tuoi traguardi, il tuo prossimo tesoro. Tutto in un unico posto.

[Pannello](https://nbfct.nimnabro.com)  /  [Scarica per Windows](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)

## Pronto a scoprire altro?

1. **Attiva i replay.** In Fortnite: Impostazioni → Gioco → Replay → Registra replay → Sì.
2. **Apri l’app.** Avvia NBFC TRACKER su Windows. Legge i replay e mantiene separati i profili.
3. **Portalo nel tuo streaming.** Incolla l’URL dell’overlay in una sorgente browser di OBS. Lascia l’app aperta.

## Impostazioni

- **Conteggio iniziale dei forzieri:** Imposta il traguardo attuale per questo profilo. I nuovi forzieri si aggiungono automaticamente. Svuota per usare i totali dei replay.
- **Cartella replay:** Richiede l’app Windows. Mantieni la cartella predefinita se i replay non sono altrove.
- **Stanza cloud:** Inserisci la stanza dall’URL dell’overlay dell’app per visualizzarla su un altro dispositivo. I link sono pubblici.
- **Lingua:** Bahasa Indonesia, Deutsch, English, Español, Español (Latinoamérica), Français, Italiano, Polski, Português (Brasil), Tiếng Việt, Türkçe, Русский, العربية, ไทย, 日本語, 简体中文, 繁體中文, 한국어.

## Overlay streaming

Aggiungi il contatore come sorgente browser di OBS. Dimensioni: 420 × 120.

~~~text
https://nbfct.nimnabro.com/overlay.html?room=YOUR_ROOM&lang=it
~~~

Legge replay locali. Nessun accesso alla memoria del gioco. Non affiliato a Epic Games.

## Build / Cloudflare

~~~powershell
npm ci
npm run check
v3\build.bat
v3\deploy.bat
~~~

[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)

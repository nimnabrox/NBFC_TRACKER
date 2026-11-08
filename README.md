# NBFC TRACKER

An open-source Fortnite replay companion by **NimnaBro**. Track chest milestones, review matches, and add a transparent OBS counter. The desktop app and website share an original charcoal-and-gold interface in 18 languages.

[Web dashboard](https://nbfct.nimnabro.com) · [Windows download](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest) · [Report an issue](https://github.com/nimnabrox/NBFC_TRACKER/issues)

## Read in your language

[Bahasa Indonesia](docs/i18n/README.id.md) · [Deutsch](docs/i18n/README.de.md) · [English](docs/i18n/README.en.md) · [Español](docs/i18n/README.es.md) · [Español (Latinoamérica)](docs/i18n/README.es-419.md) · [Français](docs/i18n/README.fr.md) · [Italiano](docs/i18n/README.it.md) · [Polski](docs/i18n/README.pl.md) · [Português (Brasil)](docs/i18n/README.pt-BR.md) · [Tiếng Việt](docs/i18n/README.vi.md) · [Türkçe](docs/i18n/README.tr.md) · [Русский](docs/i18n/README.ru.md) · [العربية](docs/i18n/README.ar.md) · [ไทย](docs/i18n/README.th.md) · [日本語](docs/i18n/README.ja.md) · [简体中文](docs/i18n/README.zh-Hans.md) · [繁體中文](docs/i18n/README.zh-Hant.md) · [한국어](docs/i18n/README.ko.md)

## Get started

1. In Fortnite, enable **Settings → Game → Replays → Record Replays**. Enable the other replay options for the modes you play.
2. Download **NBFC.TRACKER.exe** from Releases and run it on Windows 10/11 x64. Microsoft Edge WebView2 Runtime is required for the embedded dashboard; the app offers a browser fallback when it cannot load.
3. The companion watches `%LOCALAPPDATA%\FortniteGame\Saved\Demos`. Play a match and let Fortnite finish writing the replay. Live analysis updates periodically; it is not an instantaneous game feed.
4. In Settings, choose a language or change the replay folder. Accounts are detected from saved replays; each keeps its own totals and starting milestone. Closing the window keeps tracking in the system tray.
5. Copy the overlay URL from your dashboard into an OBS **Browser Source**, width **420**, height **120**. Keep the companion running for updates.

Only locally available replays can be analyzed. The tracker cannot recover missing career history. Set a **Starting chest count** for a profile to begin at an existing milestone; new replay and live chests are then added. Reset uses recorded replay totals. Match history, charts, average, and victory count show the latest 150 exported matches; the main total includes the full saved profile history.

## Web and OBS

The website displays counts from the Windows companion. It does not estimate counts from file size or invent placements. The previous browser-only parser has been removed because it could not accurately decode Fortnite network replay events. Setup instructions are collapsed by default to keep the main dashboard focused on tracking.

On another device, open Settings → **Cloud room** and enter the room from the companion's overlay link. Direct URLs work too:

~~~text
https://nbfct.nimnabro.com/?room=YOUR_ROOM&lang=en
https://nbfct.nimnabro.com/overlay.html?room=YOUR_ROOM&lang=ja
~~~

Room names currently follow player display names. Rooms are public and unauthenticated; anyone who knows a room can view or replace its snapshot. They are intended for public stream counters, not private data. Cloud snapshots include player names, profile summaries, match statistics and replay filenames, never replay file contents. Cloudflare Durable Objects persist the latest snapshot per room; a heartbeat refreshes its connection status every 30 seconds. An unavailable companion leaves the last saved snapshot visible, marked offline. A real zero/reset is displayed correctly.

The local dashboard can also be used at `http://localhost:5088/`. Hosted browser access to the local companion depends on browser local-network permissions; the cloud room is the fallback. Changing native settings requires a local companion connection.

## Languages

All 18 languages listed above cover the dashboard, settings, setup guide, status messages, pagination, common game modes, and native tray menu. Arabic uses right-to-left layout. Numbers and dates follow the selected locale. Game account names, custom playlist identifiers, filenames, brands and URLs retain their original text. Legacy CLI output and generated legacy reports remain English/French.

Translations live in `v3/public/locales/`. Automated checks enforce complete keys, matching placeholders, valid UTF-8 and matching compatibility packages. Linguistic review from native speakers is welcome; automated coverage does not establish perfect translation quality.

## Build and develop

Requirements: **.NET 8 SDK**, **Windows x64**, **Node.js 22 or newer**, and npm.

~~~powershell
npm ci
npm run check
dotnet run --project tests/Smoke/Smoke.csproj -c Release -m:1
v3\build.bat
~~~

The source of the shared UI is **`v3/public/`**. The C# project embeds those files in the standalone executable. `src/ChestCounter/` contains the original replay engine, profile store, local server and native shell. `v3/web-cloud/` owns the Cloudflare Worker and configuration. Root `public/` and the older web packages are compatibility copies; run `npm run sync:web` after editing v3 files. `scripts/create-locales.mjs` holds translation source; after changes run it, sync the packages, then run `node scripts/readme-locales.mjs` to regenerate translated guides.

~~~powershell
npm run dev
~~~

Wrangler serves the dashboard and a local Durable Object emulator. Open its printed local URL. For deterministic desktop checks the smoke harness uses port 15088, isolated fixture data in `dist/smoke-data`, and disables cloud uploads. No fixture statistics are published.

## Cloudflare deployment

~~~powershell
npx wrangler login
v3\deploy.bat
~~~

The pinned CLI deploys Worker `nbfct`, assets from `v3/public`, the SQLite-backed `TrackerRoom` binding, and the existing custom domain `nbfct.nimnabro.com`. Keep the Durable Object migration history. Configure another account/domain in `v3/web-cloud/wrangler.toml` if forking. Cloudflare usage limits and pricing apply.

GitHub Actions can deploy on changes to `main` after repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are configured. A missing secret skips deployment; it does not affect local builds.

## Releases and updates

Tag a verified commit as `vX.Y.Z` and push the tag. The release workflow runs web checks, desktop smoke checks and a self-contained Windows publish. It uploads `NBFC.TRACKER.exe`, a web ZIP and SHA-256 checksums. The tag sets the executable version. The in-app updater selects the named tracker executable, validates its size and GitHub SHA-256 digest when supplied, and restarts after the previous instance exits. Unauthenticated update checks require a public repository; private releases require access through your signed-in GitHub browser.

~~~powershell
git tag v0.2.1
git push origin main v0.2.1
~~~

## Data and project notes

Your history and configuration remain in `%APPDATA%\ChestCounter`; back them up before moving PCs. The analyzer reads replay files rather than injecting into the game or reading game memory. Compatibility can change when Fortnite changes its replay format. No antivirus result or future game compatibility is guaranteed.

Inspired by the clear presentation of [Fortnite.bot Treasure](https://fortnite.bot/treasure); this project has its own layout and branding. Existing chest artwork and creator logo are retained. The bundled Barlow Condensed heading font uses the [SIL Open Font License](v3/public/assets/fonts/OFL.txt). Not affiliated with Epic Games.

Source code is available under the [MIT license](LICENSE). Support NimnaBro with creator code **NIMNABRO**.

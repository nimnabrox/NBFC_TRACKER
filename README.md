# NBFC TRACKER

A Fortnite replay companion by **NimnaBro**. Track chest milestones, review matches, and add a transparent OBS counter. The original website, compact desktop app and original OBS design support 18 languages.

[Download homepage](https://nbfct.nimnabro.com) · [Web dashboard](https://nbfct.nimnabro.com/dashboard) · [Windows release](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest) · [Report an issue](https://github.com/nimnabrox/NBFC_TRACKER/issues)

## Read in your language

[Bahasa Indonesia](docs/i18n/README.id.md) · [Deutsch](docs/i18n/README.de.md) · [English](docs/i18n/README.en.md) · [Español](docs/i18n/README.es.md) · [Español (Latinoamérica)](docs/i18n/README.es-419.md) · [Français](docs/i18n/README.fr.md) · [Italiano](docs/i18n/README.it.md) · [Polski](docs/i18n/README.pl.md) · [Português (Brasil)](docs/i18n/README.pt-BR.md) · [Tiếng Việt](docs/i18n/README.vi.md) · [Türkçe](docs/i18n/README.tr.md) · [Русский](docs/i18n/README.ru.md) · [العربية](docs/i18n/README.ar.md) · [ไทย](docs/i18n/README.th.md) · [日本語](docs/i18n/README.ja.md) · [简体中文](docs/i18n/README.zh-Hans.md) · [繁體中文](docs/i18n/README.zh-Hant.md) · [한국어](docs/i18n/README.ko.md)

## Get started

1. In Fortnite, enable **Settings → Game → Replays → Record Replays**. Enable the other replay options for the modes you play.
2. Download **NBFC.TRACKER.exe** from Releases and run it on Windows 10/11 x64. Microsoft Edge WebView2 Runtime is required for the embedded dashboard; the app offers a browser fallback when it cannot load.
3. The companion watches `%LOCALAPPDATA%\FortniteGame\Saved\Demos`. Play a match and let Fortnite finish writing the replay. Live analysis updates periodically; it is not an instantaneous game feed.
4. Choose a language from the readable dark language menu. Settings includes the replay folder, starting count, overlay editor and **App zoom** controls from 50% to 150%, with a 100% reset. Zoom is saved across restarts; accidental Ctrl+wheel zoom is disabled in the native window. Accounts are detected from saved replays; each keeps its own totals and starting milestone. Closing the window keeps tracking in the system tray.
5. Copy the overlay URL from your dashboard into an OBS **Browser Source**, width **420**, height **120**. Keep the companion running for updates.

Only locally available replays can be analyzed. The tracker cannot recover missing career history. Set a **Starting chest count** for a profile to begin at an existing milestone; new replay and live chests are then added. Reset uses recorded replay totals. Match history, charts, average, and victory count show the latest 150 exported matches; the main total includes the full saved profile history.

Fortnite keeps a limited set of local replays, often around 100 matches. The first count reflects the replays available on this PC, not the full season or career total. Enter a known milestone or your best estimate as the starting total; only new chests after saving are added. The tracker retains analyzed history as you continue using it, even when Fortnite later removes an old replay. Setting a starting total during a match also avoids recounting chests already opened in that match.

## Web and OBS

The website displays counts from the Windows companion. It does not estimate counts from file size or invent placements. The previous browser-only parser has been removed because it could not accurately decode Fortnite network replay events. The original layout is restored from the version before the redesign. Setup instructions remain collapsed by default.

Only the original design is offered. The native app opens in its compact window with Stats, Settings and OBS tabs. **Edit overlay** optionally adds a custom label such as “Chests opened” and a `+ last match` count. Both are off by default. Changes save to the desktop configuration and reach OBS automatically, including language and active-profile changes. Copy the URL once; it stays the same when settings change. Existing URLs containing old room, label, language or last-match parameters also follow the current companion settings.

The overlay saves the most recent total, last-match amount and appearance in browser storage. If the companion closes or the browser source reloads, it keeps the last verified count. An empty response does not reset it to zero; an intentional zero from a known profile is still accepted. Previous per-room caches migrate automatically. Clearing browser storage removes the local cache.

Run the Windows companion, dashboard and OBS on the **same PC**. The hosted frontend reads the companion at `http://localhost:5088`; there is no hosted sync service or remote-device room feature. Use this permanent Browser Source URL:

~~~text
https://nbfct.nimnabro.com/dashboard
https://nbfct.nimnabro.com/overlay
~~~

Replay files, player statistics and settings stay on this PC. The companion no longer uploads snapshots or heartbeats to Cloudflare. The static site has no Worker handler, cloud database, API polling or account sign-in. Static files are downloaded when pages load, and translations load when needed.

The local dashboard is also available at `http://localhost:5088/dashboard`, with a local Browser Source at `http://localhost:5088/overlay`. Hosted access to the companion depends on browser local-network permissions; allow access when prompted or use these local URLs. Changing saved overlay settings requires a companion connection. After installing this update, refresh an already-open OBS source once to load the new script; subsequent setting changes need no refresh or URL replacement.

The root website is the download homepage, with an animated chest welcome scene, automatic-counting explanation, setup guide, source links and download verification information. It supports the same 18 languages. The original dashboard remains at `/dashboard` and the native compact UI at `/app.html`. The homepage makes no antivirus or official Epic endorsement guarantee. The Windows executable is currently unsigned; inspect the public source, verify `SHA256SUMS.txt`, and review security prompts before running it.

The `advertisement/` folder stays local and is excluded from Git updates.

The dashboard shows a connecting screen while the companion is unavailable. It retries automatically and reveals the real statistics when the app opens, without a browser refresh. The homepage's clearly labelled preview counters change together as sample match results; those numbers are never used by the real dashboard or overlay. In the compact app, cards retain their natural height, only the main content area scrolls, and starting-count editing is in Settings.

The Windows x64 executable includes the .NET runtime, replay parser, UI files and all languages. No .NET SDK or separate DLL files are needed. The embedded native window uses Microsoft WebView2; if it is missing, the app opens its local browser dashboard and offers Microsoft's runtime download and a retry button. A completely offline PC without WebView2 and without a browser still needs a browser/runtime installed. Verify the published binary with `scripts/test-portable-build.ps1`; `--diagnose --diagnose-output report.json` checks its embedded dependencies without reading player files. `scripts/test-windows-sandbox.ps1` can also check it in an isolated Windows Sandbox with networking disabled.

VirusTotal scanning is performed against the exact downloadable EXE, identified by SHA-256. The website links a completed report only after a scan result is available. Results describe that file at that time; they do not guarantee safety or ban immunity. The source reads gameplay data from saved replay files without injection, game-memory access or modification of game files. Scan using `node scripts/scan-virustotal.mjs --file PATH --env-file PRIVATE_ENV_FILE --upload`; keep the API credential outside the repository and never put it in browser code.

## Languages

All 18 languages listed above cover the dashboard, settings, overlay editor, replay-history notice, setup guide, update/status messages, pagination, common game modes, and native tray menu. The language picker uses an explicit dark background and readable text, with keyboard navigation and Escape to close. Arabic uses right-to-left layout. Numbers and dates follow the selected locale. Fortnite display headings and buttons use uppercase styling. Player names, language names, custom playlist identifiers, filenames, brands and editable fields retain their original text and capitalization. Legacy CLI output and generated legacy reports remain English/French.

Translations live in `v3/public/locales/`. Automated checks enforce complete keys, matching placeholders, valid UTF-8 and matching compatibility packages. Linguistic review from native speakers is welcome; automated coverage does not establish perfect translation quality.

## Build and develop

Requirements: **.NET 8 SDK**, **Windows x64**, **Node.js 22 or newer**, and npm.

~~~powershell
npm ci
npm run check
dotnet run --project tests/Smoke/Smoke.csproj -c Release -m:1
v3\build.bat
~~~

The source of the shared UI is **`v3/public/`**. The C# project embeds those files in the standalone executable. `src/ChestCounter/` contains the original replay engine, profile store, local server and native shell. `v3/web-cloud/wrangler.toml` configures static Cloudflare hosting. Root `public/` and the older web packages are compatibility copies; run `npm run sync:web` after editing v3 files. `scripts/create-locales.mjs` holds translation source; after changes run it, sync the packages, then run `node scripts/readme-locales.mjs` to regenerate translated guides.

~~~powershell
npm run dev
~~~

Wrangler serves the static dashboard. Open its printed local URL and keep the companion running for live counts. For deterministic desktop checks the smoke harness uses port 15088 and isolated fixture data in `dist/smoke-data`. No fixture statistics are published.

## Cloudflare deployment

~~~powershell
npx wrangler login
v3\deploy.bat
~~~

The pinned CLI deploys static assets from `v3/public` to project `nbfct` and the existing custom domain `nbfct.nimnabro.com`. There is no Worker script or Durable Object binding. Cloudflare documents static-asset requests as free and unlimited; platform limits such as upload size still apply. See [Cloudflare static-asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/). Configure another account/domain in `v3/web-cloud/wrangler.toml` if forking.

GitHub Actions can deploy on changes to `main` after repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are configured. A missing secret skips deployment; it does not affect local builds.

## Releases and updates

`VERSION` is the single source for the desktop assembly, web manifest, visible website version, npm package and GitHub tag. After changing it, run `npm run version:sync`, commit the generated files, then tag the same commit as `vX.Y.Z`. CI rejects mismatched versions and tags. The release workflow runs UI and desktop checks and publishes `NBFC.TRACKER.exe`, the web ZIP, `version.json`, and SHA-256 checksums.

Public update checks and downloads work without a GitHub sign-in. If the repository is made private later, the updater can retry with an existing Git Credential Manager sign-in or `NBFC_GITHUB_TOKEN` with read access to this repository. Credentials remain in process memory and are sent only to this repository's GitHub API endpoints. The website can check its public version manifest without the companion.

Downloads use the authenticated GitHub asset API for private releases, validate the size, SHA-256 digest when supplied, and Windows executable header, and preserve the current executable if installation fails. Restarting retains command-line options and the data directory. A failed check reports its actual access/network state instead of claiming the app is up to date.

~~~powershell
git tag v0.1.0
git push origin main v0.1.0
~~~

## Data and project notes

Your history and configuration remain in `%APPDATA%\ChestCounter`; back them up before moving PCs. The analyzer reads replay files rather than injecting into the game or reading game memory. Compatibility can change when Fortnite changes its replay format. No antivirus result or future game compatibility is guaranteed.

The tracker retains NBFC's original layout, chest artwork and creator logo. Fortnite typography uses the Fort Small and Fort Black assets described in the [font notice](v3/public/assets/fonts/FONT-NOTICE.txt). The separate retained Barlow asset has its [SIL Open Font License](v3/public/assets/fonts/OFL.txt). Not affiliated with Epic Games.

Source code is available under the [MIT license](LICENSE). Support NimnaBro with creator code **NIMNABRO**.

If you reuse or adapt this project, please credit **NimnaBro** and link to this repository. See [credit and reuse instructions](ATTRIBUTION.md).

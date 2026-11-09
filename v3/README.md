# NBFC TRACKER v3 package

This is the maintained desktop and web package. The application release version comes from the root **VERSION** file, currently **0.1.0**; `v3` is the package directory name.

The root is a download homepage with a welcome scene, setup and source-verification information. The original dashboard remains at `/dashboard`, with the compact desktop app and original OBS overlay retained. All support 18 languages. Saved overlay settings update through the same URL; the overlay remembers its count when the app closes. App zoom from 50% to 150% is saved across restarts. Prepared poster and post drafts are in the root `advertisement/` folder.

App cards now keep their natural height, including at high zoom; the body scrolls instead of clipping the total and last-match/session details. Starting-count editing is in Settings. A connecting screen hides dashboard statistics until the companion is reachable, and reconnects automatically. Homepage Preview numbers change as sample data; real counts still come only from replays.

The self-contained EXE embeds .NET, the UI and all 18 languages. If WebView2 is unavailable, it offers the local browser dashboard and Microsoft's runtime download. Use the root portable-build and Windows Sandbox test scripts for compatibility checks. Completed VirusTotal results are published in `public/security.json`, tied to the exact release EXE's SHA-256. No antivirus or ban guarantee is made. Advertisement files remain local and are not included in repository updates.

- `public/`: authoritative shared desktop/web UI and 18 language files.
- The hosted site is frontend only. Live counts and saved overlay settings come directly from the companion on the same PC, with no cloud API or database.
- `web-cloud/wrangler.toml`: production Cloudflare configuration, serving `../public`.
- `build.bat`: builds the shared C# project into `v3/NBFC TRACKER.exe`.
- `deploy.bat`: validates and deploys this v3 package.
- `run.bat`: starts the built Windows companion.

See the [main documentation](../README.md) for setup, tests, releases, data privacy and all [translated guides](../docs/i18n/README.en.md).

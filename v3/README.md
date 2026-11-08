# NBFC TRACKER v3 package

This is the maintained desktop and web package. The application release version comes from the root **VERSION** file, currently **0.1.0**; `v3` is the package directory name.

The root is a download homepage with a welcome scene, setup and source-verification information. The original dashboard remains at `/dashboard`, with the compact desktop app and original OBS overlay retained. All support 18 languages. Saved overlay settings update through the same URL; the overlay remembers its count when the app closes. App zoom from 50% to 150% is saved across restarts. Prepared poster and post drafts are in the root `advertisement/` folder.

- `public/`: authoritative shared desktop/web UI and 18 language files.
- The hosted site is frontend only. Live counts and saved overlay settings come directly from the companion on the same PC, with no cloud API or database.
- `web-cloud/wrangler.toml`: production Cloudflare configuration, serving `../public`.
- `build.bat`: builds the shared C# project into `v3/NBFC TRACKER.exe`.
- `deploy.bat`: validates and deploys this v3 package.
- `run.bat`: starts the built Windows companion.

See the [main documentation](../README.md) for setup, tests, releases, data privacy and all [translated guides](../docs/i18n/README.en.md).

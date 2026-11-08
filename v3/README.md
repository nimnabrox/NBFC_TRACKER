# NBFC TRACKER v3 package

This is the maintained desktop and web package. The application release version comes from the root **VERSION** file, currently **0.1.0**; `v3` is the package directory name.

The original website, compact desktop app and OBS overlay are retained. The 18-language menu uses readable dark colors, and player names retain their original capitalization. The overlay editor optionally adds a custom label and the previous match's count; the default shows only the total. The overlay remembers its last count when the app closes.

- `public/`: authoritative shared desktop/web UI and 18 language files.
- `web-cloud/_worker.js`: persistent room sync using Cloudflare Durable Objects.
- `web-cloud/wrangler.toml`: production Cloudflare configuration, serving `../public`.
- `build.bat`: builds the shared C# project into `v3/NBFC TRACKER.exe`.
- `deploy.bat`: validates and deploys this v3 package.
- `run.bat`: starts the built Windows companion.

See the [main documentation](../README.md) for setup, tests, releases, data privacy and all [translated guides](../docs/i18n/README.en.md).

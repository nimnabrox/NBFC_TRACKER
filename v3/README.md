# NBFC TRACKER v3 package

This is the maintained desktop and web package. The application release version is currently **0.2.0**; `v3` is the package directory name.

- `public/`: authoritative shared desktop/web UI and 18 language files.
- `web-cloud/_worker.js`: persistent room sync using Cloudflare Durable Objects.
- `web-cloud/wrangler.toml`: production Cloudflare configuration, serving `../public`.
- `build.bat`: builds the shared C# project into `v3/NBFC TRACKER.exe`.
- `deploy.bat`: validates and deploys this v3 package.
- `run.bat`: starts the built Windows companion.

See the [main documentation](../README.md) for setup, tests, releases, data privacy and all [translated guides](../docs/i18n/README.en.md).

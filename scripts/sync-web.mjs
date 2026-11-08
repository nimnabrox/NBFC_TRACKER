import { cp, rm, readdir } from 'node:fs/promises';
// v3 owns the shared UI; other paths are compatibility packages, never separate implementations.
const source = 'v3/public';
for (const destination of ['public', 'v3/web-cloud', 'web-chest-tracker']) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    await cp(`${source}/${entry.name}`, `${destination}/${entry.name}`, { recursive: true });
  }
  for (const name of ['mini-app.js', 'replay-parser.js', 'sync.js', '_worker.js']) await rm(`${destination}/${name}`, { force: true });
}
console.log('Synchronized v3 dashboard, desktop resources, and legacy web packages.');

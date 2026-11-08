import { readFile, writeFile } from 'node:fs/promises';
const version = (await readFile('VERSION', 'utf8')).trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('VERSION must contain X.Y.Z');
const tag = 'v' + version, check = process.argv.includes('--check');
const tagIndex = process.argv.indexOf('--tag');
if (tagIndex >= 0 && process.argv[tagIndex + 1] !== tag) throw new Error(`Release tag must match VERSION (${tag})`);
async function output(path, content) {
  // Git's Windows checkout may use CRLF; compare generated text independently of line endings.
  if (check) { if ((await readFile(path, 'utf8')).replace(/\r\n/g, '\n') !== content.replace(/\r\n/g, '\n')) throw new Error(`Version out of sync: ${path}. Run npm run version:sync.`); }
  else await writeFile(path, content);
}
for (const path of ['package.json', 'package-lock.json']) {
  const data = JSON.parse(await readFile(path, 'utf8')); data.version = version;
  if (data.packages?.['']) data.packages[''].version = version;
  await output(path, JSON.stringify(data, null, 2) + '\n');
}
const manifest = { version, displayVersion: tag, releaseUrl: `https://github.com/nimnabrox/NBFC_TRACKER/releases/tag/${tag}` };
await output('v3/public/version.json', JSON.stringify(manifest, null, 2) + '\n');
await output('v3/public/version.js', `// Generated from VERSION by scripts/version.mjs.\nexport const version = ${JSON.stringify(version)};\nexport const displayVersion = ${JSON.stringify(tag)};\nexport const releaseUrl = ${JSON.stringify(manifest.releaseUrl)};\nexport function compareVersions(a, b) {\n  const left = String(a).replace(/^v/i, '').split('.').map(Number);\n  const right = String(b).replace(/^v/i, '').split('.').map(Number);\n  if (left.length !== 3 || right.length !== 3 || [...left, ...right].some(n => !Number.isInteger(n) || n < 0)) throw new Error('Invalid version');\n  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1;\n  return 0;\n}\n`);
for (const name of ['index.html', 'app.html', 'modern.html']) {
  const path = 'v3/public/' + name;
  const text = await readFile(path, 'utf8');
  await output(path, text.replace(/v\d+\.\d+\.\d+/g, tag));
}
const xmlPath = 'src/ChestCounter/app.manifest';
const xml = await readFile(xmlPath, 'utf8');
await output(xmlPath, xml.replace(/(<assemblyIdentity version=")[^"]+/, '$1' + version + '.0'));
console.log(`${check ? 'Verified' : 'Synchronized'} app, web, package and release version ${tag}.`);

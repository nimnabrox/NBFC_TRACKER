import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { languages } from '../v3/public/i18n.js';
await mkdir('docs/i18n', { recursive: true });
for (const [code, name] of languages) {
  const d = JSON.parse(await readFile(`v3/public/locales/${code}.json`, 'utf8'));
  const other = languages.map(([key, label]) => `[${label}](README.${key}.md)`).join('  /  ');
  const body = `# NBFC TRACKER - ${name}\n\n${other}\n\n${d.intro}\n\n[${d.dashboard}](https://nbfct.nimnabro.com)  /  [${d.download}](https://github.com/nimnabrox/NBFC_TRACKER/releases/latest)  /  [GitHub](https://github.com/nimnabrox/NBFC_TRACKER)\n\n## ${d.guide}\n\n1. **${d.step1}.** ${d.step1Body}\n2. **${d.step2}.** ${d.step2Body}\n3. **${d.step3}.** ${d.step3Body}\n\n## ${d.settings}\n\n- **${d.base}:** ${d.baseHint}\n- **${d.folder}:** ${d.folderHint}\n- **${d.room}:** ${d.roomHint}\n- **${d.language}:** ${languages.map(([, label]) => label).join(', ')}.\n\n## ${d.overlay}\n\n${d.overlayHint}\n\n~~~text\nhttps://nbfct.nimnabro.com/overlay.html?room=YOUR_ROOM&lang=${code}\n~~~\n\n${d.privacy}\n\n## Build / Cloudflare\n\n~~~powershell\nnpm ci\nnpm run check\nv3\\build.bat\nv3\\deploy.bat\n~~~\n\n[English developer documentation](../../README.md)  /  [MIT](../../LICENSE)\n`;
  await writeFile(`docs/i18n/README.${code}.md`, body.replace('/overlay.html?', '/overlay?'));
}
console.log('Wrote 18 translated quick-start guides.');


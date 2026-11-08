import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { activityDays, summarize, parseCount, matchesCsv } from '../v3/public/stats.js';
import { languages, resolveLanguage } from '../v3/public/i18n.js';
test('keeps authoritative total and does not invent placement or count', () => {
  assert.deepEqual(summarize({ total: 4084, session: 8, lastMatch: 8, matches: [
    { chestsOpened: 8, placement: null }, { chestsOpened: 4, placement: 1 }
  ] }), { total: 4084, session: 8, lastMatch: 8, average: 6, victories: 1 });
  assert.equal(summarize({ total: 0, matches: [] }).total, 0);
});
test('validates whole counts without silently accepting fractions, signs, or trailing text', () => {
  for (const value of ['-1', '2.5', '4oops', '2147483648', '1e3']) assert.equal(parseCount(value), null);
  for (const value of ['', '0', '4084', '2147483647']) assert.equal(parseCount(value), Number(value));
});
test('activity groups matches by local calendar day including month boundaries', () => {
  const today = new Date(2026, 10, 8, 12);
  const days = activityDays([{ matchStart: new Date(2026, 10, 8, 0, 30).toISOString(), chestsOpened: 9 },
    { matchStart: new Date(2026, 9, 31, 23, 59).toISOString(), chestsOpened: 4 }], today);
  assert.equal(days.length, 30); assert.equal(days[29].count, 9);
  assert.equal(days.find(d => d.date.getMonth() === 9 && d.date.getDate() === 31).count, 4);
});
test('CSV preserves delimiters and quotes and blocks spreadsheet formulas', () => {
  const csv = matchesCsv([{ playerName: '=SUM(1,2)', fileName: 'a"b\n.replay' }]);
  assert.ok(csv.startsWith('\uFEFF')); assert.ok(csv.includes("\"'=SUM(1,2)\"")); assert.ok(csv.includes('"a""b\n.replay"'));
});
test('all 18 language files cover every UI key and preserve placeholders', async () => {
  const en = JSON.parse(await readFile('v3/public/locales/en.json', 'utf8'));
  assert.equal(languages.length, 18);
  const html = (await Promise.all(['index.html', 'app.html', 'modern.html'].map(name => readFile('v3/public/' + name, 'utf8')))).join('\n');
  const uiKeys = [...html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)].map(m => m[1]);
  for (const [code] of languages) {
    const dict = JSON.parse(await readFile(`v3/public/locales/${code}.json`, 'utf8'));
    assert.deepEqual(Object.keys(dict).sort(), Object.keys(en).sort(), code);
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(value.trim(), `${code}.${key}`);
      assert.ok(!/[\uFFFD]/.test(value), `${code}.${key}: encoding`);
      assert.deepEqual([...value.matchAll(/\{\w+\}/g)].map(m => m[0]).sort(), [...en[key].matchAll(/\{\w+\}/g)].map(m => m[0]).sort(), `${code}.${key}`);
    }
    for (const key of uiKeys) assert.ok(dict[key], `${code}.${key}`);
  }
  assert.equal(resolveLanguage('zh-TW'), 'zh-Hant'); assert.equal(resolveLanguage('pt-PT'), 'pt-BR');
  assert.equal(resolveLanguage('es-419'), 'es-419'); assert.equal(resolveLanguage('ar-SA'), 'ar');
});
test('all compatibility UIs match v3 source and HTML IDs are unique', async () => {
  const files = (await readdir('v3/public')).filter(n => /\.(js|html|css)$/.test(n));
  for (const destination of ['public', 'v3/web-cloud', 'web-chest-tracker']) {
    for (const name of files) assert.equal(await readFile(`${destination}/${name}`, 'utf8'), await readFile(`v3/public/${name}`, 'utf8'), `${destination}/${name}`);
  }
  const app = await readFile('v3/public/app.js', 'utf8');
  const optional = new Set(['openWeb', 'obsUrl', 'obsUrlAlt', 'activeAccountName', 'matchesCount', 'accountList']);
  for (const name of ['index.html', 'app.html', 'modern.html']) {
    const html = await readFile('v3/public/' + name, 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, `Duplicate ID in ${name}`);
    for (const [, id] of app.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id) || optional.has(id), `Missing ${id} in ${name}`);
  }
  const server = await readFile('src/ChestCounter/WebDashboardServer.cs', 'utf8');
  for (const [, path] of app.matchAll(/(?:native|companion \+)\(['"]?(\/api\/[a-z-]+)/g)) assert.ok(server.includes('"' + path + '"'), `Missing API ${path}`);
});

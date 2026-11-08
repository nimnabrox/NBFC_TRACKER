import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
test('dashboard interactions: counts, safe names, profiles, RTL, resets, and settings', async () => {
  const win = new Window({ url: 'http://localhost:5088/', settings: { disableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
  win.document.write(await readFile('v3/public/index.html', 'utf8'));
  const originals = new Map();
  function install(name, value) { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }); }
  for (const name of ['window', 'document', 'navigator', 'location', 'history', 'localStorage', 'CustomEvent']) install(name, name === 'window' ? win : win[name]);
  const calls = [];
  let state = { room: 'alice', player: 'Alice', total: 4084, session: 6, lastMatch: 6, base: 4084,
    accounts: [{ key: 'alice', name: 'Alice', active: true }, { key: 'bob', name: '<img src=x onerror=alert(1)>' }],
    matches: [{ matchStart: new Date().toISOString(), playlist: 'Playlist_DefaultSolo', chestsOpened: 6, placement: 1, eliminations: 2 }] };
  install('fetch', async value => {
    const url = new URL(value); calls.push(url.pathname + url.search);
    if (url.protocol === 'file:') return new Response(await readFile(url, 'utf8'));
    if (url.pathname === '/api/live') return Response.json(state);
    if (url.pathname === '/api/settings') return Response.json({ demosFolder: 'C:\\Demos', startWithWindows: false, uiLanguage: 'en', version: 'v0.2.0' });
    if (url.pathname === '/api/set-profile') state = { ...state, player: 'Bob', room: 'bob', total: 9, base: null, matches: [] };
    if (url.pathname === '/api/set-base') state = { ...state, total: 0, base: null };
    return Response.json({ ok: true });
  });
  install('setInterval', () => 1); install('clearInterval', () => {});
  try {
    await import('../v3/public/app.js');
    const $ = id => win.document.getElementById(id);
    assert.equal($('total').textContent, '4,084');
    assert.equal($('profile').options.length, 2);
    assert.equal($('profile').querySelectorAll('img').length, 0, 'Profile names cannot inject markup');
    assert.equal($('matchRows').querySelectorAll('tr').length, 1);
    $('openSettings').click(); assert.ok($('settings').open); $('closeSettings').click(); assert.ok(!$('settings').open);
    const { setLanguage } = await import('../v3/public/i18n.js');
    await setLanguage('ar'); assert.equal(win.document.documentElement.dir, 'rtl');
    assert.equal($('statusText').textContent, 'التطبيق المرافق متصل');
    await setLanguage('ja'); assert.equal(win.document.documentElement.dir, 'ltr');
    assert.equal($('statusText').textContent, '連携アプリに接続済み');
    await $('profile').onchange({ target: { value: 'bob' } });
    assert.equal($('total').textContent, '9');
    $('base').value = '12'; $('base').dispatchEvent(new win.Event('input'));
    await $('baseForm').onsubmit({ preventDefault() {} });
    assert.ok(calls.some(path => path.startsWith('/api/set-base?')));
    assert.equal($('total').textContent, '0', 'True zero is rendered');
    $('openGuide').click(); assert.ok($('guide').open);
  } finally {
    win.dispatchEvent(new win.Event('pagehide'));
    await win.happyDOM.close();
    for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
import { version, displayVersion, releaseUrl } from '../v3/public/version.js';
async function waitFor(check) {
  for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(resolve => setTimeout(resolve, 10)); }
  assert.fail('UI did not update');
}
function contrast(a, b) {
  const luminance = color => {
    const rgb = color.startsWith('#') ? [1,3,5].map(i => parseInt(color.slice(i,i+2),16)) : color.match(/[\d.]+/g).slice(0,3).map(Number);
    const components = rgb.map(n => { n /= 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; });
    return components[0] * .2126 + components[1] * .7152 + components[2] * .0722;
  };
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
for (const page of ['dashboard.html', 'app.html', 'modern.html']) {
  test(`${page}: original controls, readable language picker, RTL, overlay styles and resets`, async () => {
    const win = new Window({ url: 'http://localhost:5088/' + page, settings: { disableJavaScriptEvaluation: true, disableJavaScriptFileLoading: true, disableCSSFileLoading: true } });
    win.document.write(await readFile('v3/public/' + page, 'utf8'));
    const style = win.document.createElement('style'); style.textContent = await readFile('v3/public/ui.css', 'utf8'); win.document.head.append(style);
    const originals = new Map();
    function install(name, value) { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }); }
    for (const name of ['window', 'document', 'navigator', 'location', 'history', 'localStorage', 'CustomEvent']) install(name, name === 'window' ? win : win[name]);
    const calls = [], overlaySaves = [];
    let pollTick, nativeAvailable = false;
    let checkResult = { available: true, hasUpdate: false, currentVersion: displayVersion, latestVersion: displayVersion };
    let state = { room: 'alice', player: 'Alice CamelCase', total: 4084, session: 6, lastMatch: 6, base: 4084,
      accounts: [{ key: 'alice', name: 'Alice CamelCase', active: true }, { key: 'bob', name: '<img src=x onerror=alert(1)>' }],
      matches: [{ matchStart: new Date().toISOString(), playlist: 'Playlist_DefaultSolo', chestsOpened: 6, placement: 1, eliminations: 2 }] };
    install('fetch', async (value, options) => {
      const url = new URL(value); calls.push(url.pathname + url.search);
      if (url.protocol === 'file:') return new Response(await readFile(url, 'utf8'));
      if (url.hostname === 'localhost' && url.pathname.startsWith('/api/') && !nativeAvailable) throw new Error('Companion offline');
      if (url.pathname === '/api/live') return Response.json(state);
      if (url.pathname === '/api/check-update') return Response.json(checkResult);
      if (url.pathname === '/api/apply-update') return Response.json({ success: true });
      if (url.pathname === '/api/update-status') return Response.json({ installing: false, status: 'failed' });
      if (url.pathname === '/version.json') return Response.json({ version, displayVersion, releaseUrl });
      if (url.pathname === '/api/set-zoom') return Response.json({ uiZoomPercent: Number(url.searchParams.get('percent')) });
      if (url.pathname === '/api/settings') return Response.json({ demosFolder: 'C:\\Demos', startWithWindows: false, uiLanguage: 'en', version: 'v0.2.2' });
      if (url.pathname === '/api/set-overlay-options') { const prefs = JSON.parse(options.body); overlaySaves.push(prefs); state = { ...state, overlayOptions: prefs }; }
      if (url.pathname === '/api/set-profile') state = { ...state, player: 'Bob', room: 'bob', total: 9, base: null, matches: [] };
      if (url.pathname === '/api/set-base') state = { ...state, total: 0, base: null };
      return Response.json({ ok: true });
    });
    install('setInterval', callback => { pollTick = callback; return 1; }); install('clearInterval', () => {});
    try {
      await import('../v3/public/app.js?test=' + page);
      const $ = id => win.document.getElementById(id);
      const shell=win.document.querySelector('.mini-shell,.app-layout');
      assert.equal($('companionGate').hidden,false,'Disconnected dashboard shows connection screen');
      assert.equal(shell.hidden,true,'Statistics stay hidden until the companion is connected');
      nativeAvailable=true;await pollTick();
      assert.equal($('companionGate').hidden,true,'Companion startup automatically removes the connection screen');
      assert.equal(shell.hidden,false,'No reload is required to reveal the dashboard');
      assert.equal($('total').textContent, '4,084');
      assert.equal($('statusText').textContent, 'Companion connected');
      for (const element of win.document.querySelectorAll('.version')) assert.equal(element.textContent, displayVersion);
      await $('checkUpdate').onclick(); assert.equal($('updateMessage').textContent, 'You are up to date.');
      checkResult = { available: false, errorCode: 'private_access', hasUpdate: false };
      await $('checkUpdate').onclick(); assert.ok($('updateMessage').textContent.includes('GitHub access')); assert.equal($('updateRelease').hidden, false);
      checkResult = { available: true, hasUpdate: true, latestVersion: 'v99.0.0' };
      await $('checkUpdate').onclick(); assert.equal($('installUpdate').hidden, false);
      await $('installUpdate').onclick(); assert.equal($('installUpdate').disabled, true);
      await pollTick(); assert.equal($('installUpdate').disabled, false); assert.ok($('updateMessage').textContent.includes('current app is preserved'));
      $('zoomOut').click(); await waitFor(() => $('zoomValue').textContent === '90%');
      $('zoomIn').click(); await waitFor(() => $('zoomValue').textContent === '100%');
      $('appZoom').value = '50'; $('appZoom').dispatchEvent(new win.Event('input')); $('appZoom').dispatchEvent(new win.Event('change')); await waitFor(() => calls.includes('/api/set-zoom?percent=50'));
      assert.ok($('zoomOut').disabled); $('resetZoom').click(); await waitFor(() => $('zoomValue').textContent === '100%');
      assert.equal($('profile').options.length, 2);
      assert.equal($('profile').querySelectorAll('img').length, 0);
      assert.equal($('profile').options[0].textContent, 'Alice CamelCase', 'Player name is unchanged');
      assert.equal($('matchRows').querySelectorAll('tr').length, 1);
      assert.equal($('layoutChoice'), null); assert.equal($('overlayChoice'), null);
      assert.ok(win.document.querySelector('.history-note').textContent.includes('100'));
      const stableUrl = $('previewOverlay').href;
      assert.equal(new URL(stableUrl).pathname, '/overlay', 'Original overlay URL is clean');
      assert.equal(new URL(stableUrl).search, '', 'URL does not freeze settings');
      assert.equal(new URL($('previewOverlay').href).searchParams.has('label'), false, 'Default is count only');
      $('showOverlayLabel').checked = true; $('showOverlayLabel').dispatchEvent(new win.Event('change'));
      $('overlayLabel').value = 'Chests <opened>'; $('overlayLabel').dispatchEvent(new win.Event('input'));
      $('showOverlayLast').checked = true; $('showOverlayLast').dispatchEvent(new win.Event('change'));
      const edited = new URL($('previewOverlay').href);
      assert.equal(edited.href, stableUrl, 'Editing never changes the OBS URL');
      await waitFor(() => overlaySaves.length > 0);
      assert.deepEqual(overlaySaves.at(-1), { showLabel: true, label: 'Chests <opened>', showLastMatch: true });
      assert.equal(win.document.querySelector('[data-overlay-label]').textContent, 'Chests <opened>');
      assert.equal(win.document.querySelector('[data-overlay-label]').children.length, 0, 'Edited text cannot inject markup');
      assert.equal(win.document.querySelector('[data-overlay-last]').textContent, '+6');
      $('openSettings').click(); assert.ok($('settings').open); $('closeSettings').click(); assert.ok(!$('settings').open);
      $('languageButton').click(); assert.equal($('languageMenu').hidden, false);
      const options = [...$('languageMenu').querySelectorAll('[role=option]')];
      assert.equal(options.length, 18);
      const normal = win.getComputedStyle(options.find(option => option.dataset.code === 'fr'));
      const selected = win.getComputedStyle(options.find(option => option.dataset.code === 'en'));
      assert.ok(contrast(normal.backgroundColor, normal.color) >= 4.5, `Unselected language text is readable: ${normal.backgroundColor} / ${normal.color}`);
      assert.ok(contrast(selected.backgroundColor, selected.color) >= 4.5, `Selected language text is readable: ${selected.backgroundColor} / ${selected.color}`);
      assert.ok(parseFloat(normal.fontSize) >= 14, 'Language names are not tiny');
      options[0].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      assert.equal($('languageMenu').hidden, true);
      $('languageButton').click(); options.find(option => option.dataset.code === 'ar').click();
      await waitFor(() => win.document.documentElement.dir === 'rtl');
      assert.equal($('statusText').textContent, 'التطبيق المرافق متصل');
      assert.equal($('languageName').textContent, 'العربية');
      assert.equal($('languageMenu').hidden, true);
      const { setLanguage } = await import('../v3/public/i18n.js');
      await setLanguage('ja'); assert.equal(win.document.documentElement.dir, 'ltr');
      assert.equal($('statusText').textContent, '連携アプリに接続済み');
      await $('profile').onchange({ target: { value: 'bob' } }); assert.equal($('total').textContent, '9');
      assert.equal($('previewOverlay').href, stableUrl, 'Switching profiles keeps the URL');
      $('base').value = '12'; await $('baseForm').onsubmit({ preventDefault() {} });
      assert.ok(calls.some(path => path.startsWith('/api/set-base?'))); assert.equal($('total').textContent, '0');
      $('openGuide').click(); assert.ok($('guide').open);
      if (page === 'app.html') {
        assert.ok($('baseForm').closest('#tabSettings'),'Starting-count editing belongs in Settings');
        assert.ok(!win.document.querySelector('.hero-stat-card form'),'The total card contains only stats');
        const pane=win.document.querySelector('.tab-pane.active'),card=win.document.querySelector('.hero-stat-card');
        assert.equal(win.getComputedStyle(pane).flexShrink,'0','Tab pane keeps its content height');
        assert.equal(win.getComputedStyle(card).flexShrink,'0','Total card cannot be compressed');
        assert.equal(win.getComputedStyle(pane).overflow,'visible','An inner scroll area cannot clip cards');
        win.document.querySelector('[data-tab=tabSettings]').click(); assert.ok($('tabSettings').classList.contains('active'));
        win.document.querySelector('[data-tab=tabObs]').click(); assert.ok($('tabObs').classList.contains('active'));
      }
      await setLanguage('en'); nativeAvailable = false; await pollTick();
      assert.equal($('companionGate').hidden,false);assert.equal(shell.hidden,true);
      await $('checkUpdate').onclick(); assert.equal($('updateMessage').textContent, 'You are up to date.');
      assert.equal($('installUpdate').hidden, true, 'Website without companion offers a download, not an install command');
      assert.ok(!calls.some(path => path.startsWith('/api/sync')), 'Offline frontend never polls a cloud API');
      nativeAvailable=true;await pollTick();assert.equal(shell.hidden,false,'Companion restart reconnects automatically');
    } finally {
      win.dispatchEvent(new win.Event('pagehide')); await win.happyDOM.close();
      for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
    }
  });
}
test('restored overlay keeps its original chest glow and divider and uses the Fortnite font', async () => {
  const html = await readFile('v3/public/overlay.html', 'utf8');
  assert.ok(html.includes('class="chest-halo"')); assert.ok(html.includes('class="divider"'));
  assert.ok(html.includes('Fort-Black.woff2'));
  const font = await readFile('v3/public/assets/fonts/Fort-Black.woff2'); assert.equal(font.subarray(0,4).toString(), 'wOF2');
});

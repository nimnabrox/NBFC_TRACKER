import { languages, resolveLanguage, setLanguage, t, number, locale } from './i18n.js';
import { summarize, activityDays, parseCount, matchesCsv } from './stats.js';

const $ = id => document.getElementById(id);
const local = ['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '5088';
const companion = local ? location.origin : 'http://localhost:5088';
const cloud = local ? 'https://nbfct.nimnabro.com' : location.origin;
let room = new URLSearchParams(location.search).get('room')?.trim().toLowerCase() || '';
let snapshot = { total: 0, matches: [], accounts: [] };
let connection = 'waiting', nativeConnected = false, polling = false, page = 1, timer, toastTimer, update;
let settingsLoaded = false;

function toast(key) {
  $('toast').textContent = t(key); $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}
async function request(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(3000), ...options });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
async function native(path, options) {
  if (!nativeConnected) throw new Error('companion');
  return request(companion + path, options);
}
async function copy(text) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const input = document.createElement('textarea'); input.value = text;
      input.style.position = 'fixed'; input.style.opacity = '0'; document.body.append(input);
      input.select(); const ok = document.execCommand('copy'); input.remove();
      if (!ok) throw new Error('Clipboard unavailable');
    }
    toast('copied');
  } catch { toast('error'); }
}
function overlayUrl() {
  const name = room || snapshot.room || snapshot.player || '';
  return `${cloud}/overlay.html?${new URLSearchParams({ room: name.toLowerCase(), lang: locale })}`;
}
function render() {
  const values = summarize(snapshot);
  for (const [key, value] of Object.entries(values)) $(key).textContent = number(value);
  $('overlayTotal').textContent = number(values.total);
  $('statusText').textContent = t(connection);
  $('status').classList.toggle('online', ['connected', 'cloud'].includes(connection));
  $('totalHint').textContent = snapshot.base > 0 ? `${t('base')}: ${number(snapshot.base)}` : t('fromReplays');
  $('matchStatus').textContent = t(snapshot.inProgress ? 'matchLive' : connection === 'offline' ? 'stale' : 'fromReplays');
  $('profile').disabled = !nativeConnected || !snapshot.accounts?.length;
  const profileSignature = JSON.stringify([snapshot.player, snapshot.accounts]);
  if ($('profile').dataset.signature !== profileSignature) {
    $('profile').replaceChildren();
    const accounts = snapshot.accounts?.length ? snapshot.accounts : [{ key: '', name: snapshot.player || t('noProfile') }];
    for (const account of accounts) {
      const option = document.createElement('option'); option.value = account.key || account.name;
      option.textContent = account.name || account.key;
      option.selected = account.active || account.name === snapshot.player || account.key === snapshot.player;
      $('profile').append(option);
    }
    $('profile').dataset.signature = profileSignature;
  }
  if (!snapshot.player && !snapshot.accounts?.length) $('profile').options[0].textContent = t('noProfile');
  $('previewOverlay').href = overlayUrl();
  $('copyOverlay').disabled = !(room || snapshot.player);
  $('previewOverlay').setAttribute('aria-disabled', String(!(room || snapshot.player)));
  if (!(room || snapshot.player)) $('previewOverlay').removeAttribute('href');
  if (document.activeElement !== $('base')) $('base').value = snapshot.base ?? '';
  ['base', 'resetBase', 'folder', 'startup'].forEach(id => { $(id).disabled = !nativeConnected; });
  $('baseForm').querySelector('button').disabled = !nativeConnected;
  $('folderForm').querySelector('button').disabled = !nativeConnected;
  renderMatches(); renderChart();
}
function renderMatches() {
  const matches = [...(snapshot.matches || [])].sort((a, b) => new Date(b.matchStart) - new Date(a.matchStart));
  const pages = Math.max(1, Math.ceil(matches.length / 10)); page = Math.min(page, pages);
  $('matchRows').replaceChildren();
  if (!matches.length) {
    const row = document.createElement('tr'), cell = document.createElement('td');
    cell.colSpan = 5; cell.className = 'empty-state'; cell.textContent = t('noMatches'); row.append(cell); $('matchRows').append(row);
  }
  for (const match of matches.slice((page - 1) * 10, page * 10)) {
    const row = document.createElement('tr');
    const date = new Date(match.matchStart);
    const values = [Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date),
      displayMode(match.playlist),
      match.placement ? `#${number(match.placement)}` : '—', number(match.chestsOpened), match.eliminations == null ? '—' : number(match.eliminations)];
    values.forEach((value, index) => {
      const cell = document.createElement('td'); cell.textContent = value;
      if (index === 3) cell.className = 'count';
      if (index === 2 && match.placement === 1) cell.className = 'win';
      row.append(cell);
    });
    $('matchRows').append(row);
  }
  $('pagination').hidden = !matches.length; $('export').disabled = !matches.length;
  $('pageLabel').textContent = t('page', { current: number(page), total: number(pages) });
  $('previous').disabled = page <= 1; $('next').disabled = page >= pages;
}
function displayMode(playlist) {
  if (!playlist) return '—';
  const mode = playlist.toLowerCase();
  const recognized = /default|nobuild|showdown|battle royale|zero build|solo|duo|trio|squad/.test(mode);
  if (!recognized) return playlist.replace(/^Playlist_/, '').replaceAll('_', ' ');
  const parts = [];
  if (/showdown|ranked/.test(mode)) parts.push(t('modeRanked'));
  parts.push(t(/nobuild|zero.?build/.test(mode) ? 'modeZB' : 'modeBR'));
  for (const [pattern, key] of [[/solo/, 'modeSolo'], [/duo/, 'modeDuo'], [/trio/, 'modeTrio'], [/squad/, 'modeSquad']]) if (pattern.test(mode)) parts.push(t(key));
  return parts.join(' · ');
}
function renderChart() {
  const days = activityDays(snapshot.matches || []), max = Math.max(1, ...days.map(day => day.count));
  $('chart').replaceChildren();
  for (const day of days) {
    const bar = document.createElement('div'); bar.className = 'bar' + (day.count ? '' : ' zero');
    bar.style.height = day.count ? `${Math.max(5, day.count / max * 100)}%` : '3px';
    bar.title = `${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(day.date)} · ${number(day.count)} ${t('chests')}`;
    bar.setAttribute('aria-label', bar.title); $('chart').append(bar);
  }
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  $('chartStart').textContent = fmt.format(days[0].date); $('chartEnd').textContent = fmt.format(days[29].date);
  $('chartEmpty').hidden = days.some(day => day.count > 0);
  $('chart').setAttribute('aria-label', `${t('activity')} · ${t('last30')}`);
}
async function poll() {
  if (polling) return;
  polling = true;
  try {
    const data = await request(companion + '/api/live', { signal: AbortSignal.timeout(1200) });
    if (typeof data.total !== 'number') throw new Error('Invalid snapshot');
    // Explicit remote rooms must never display an unrelated local player's stats.
    if (room && room !== (data.room || '').toLowerCase()) throw new Error('Different room');
    snapshot = data; nativeConnected = true; connection = 'connected';
    if (!settingsLoaded) { settingsLoaded = true; await loadSettings(); }
  } catch {
    nativeConnected = false; settingsLoaded = false;
    if (room) {
      try {
        const data = await request(`${cloud}/api/sync?room=${encodeURIComponent(room)}`);
        if (data.updatedAt) { snapshot = data; connection = Date.now() - data.updatedAt > 90000 ? 'offline' : 'cloud'; }
        else connection = 'waiting';
      } catch { connection = 'offline'; }
    } else connection = snapshot.player ? 'offline' : 'waiting';
  } finally { polling = false; render(); }
}
async function loadSettings() {
  try {
    const data = await native('/api/settings');
    $('folder').value = data.demosFolder || ''; $('startup').checked = !!data.startWithWindows;
    document.querySelectorAll('.version').forEach(el => { el.textContent = data.version || 'v0.2.0'; });
    if (!initialLanguage && data.uiLanguage) {
      await setLanguage(data.uiLanguage); $('language').value = locale;
    }
  } catch { /* Tracking remains available if settings cannot be fetched. */ }
}
async function saveBase(value) {
  if (!nativeConnected) return toast('requiresDesktop');
  const count = parseCount(value); if (count === null) return toast('invalidCount');
  try {
    await native(`/api/set-base?${new URLSearchParams({ count: count ? String(count) : 'clear', profile: snapshot.player || '' })}`);
    await poll(); toast('saved');
  } catch { toast('error'); }
}
for (const [code, label] of languages) { const option = document.createElement('option'); option.value = code; option.textContent = label; $('language').append(option); }
document.addEventListener('languagechange', render);
$('language').addEventListener('change', async event => {
  try {
    await setLanguage(event.target.value);
    if (nativeConnected) await native('/api/set-language?code=' + encodeURIComponent(locale));
  } catch { toast('error'); }
});
$('openSettings').onclick = () => { $('room').value = room || snapshot.room || ''; $('settings').showModal(); };
$('closeSettings').onclick = () => $('settings').close();
$('settings').addEventListener('click', event => { if (event.target === $('settings')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
$('copyOverlay').onclick = () => copy(overlayUrl());
$('creatorCode').onclick = () => copy('NIMNABRO');
$('openGuide').onclick = () => { $('guide').open = true; };
$('previous').onclick = () => { page--; renderMatches(); }; $('next').onclick = () => { page++; renderMatches(); };
$('export').onclick = () => {
  const url = URL.createObjectURL(new Blob([matchesCsv(snapshot.matches || [])], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'nbfc-matches.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('profile').onchange = async event => {
  try {
    await native('/api/set-profile?key=' + encodeURIComponent(event.target.value));
    room = ''; const url = new URL(location.href); url.searchParams.delete('room'); history.replaceState(null, '', url);
    page = 1; await poll();
  } catch { toast('error'); }
};
$('roomForm').onsubmit = async event => {
  event.preventDefault(); const value = $('room').value.trim().toLowerCase();
  if (!value || value.length > 128 || /[\u0000-\u001f\u007f]/.test(value)) return toast('invalidRoom');
  room = value; page = 1; snapshot = { total: 0, matches: [], accounts: [] }; connection = 'waiting';
  const url = new URL(location.href); url.searchParams.set('room', room); history.replaceState(null, '', url);
  await poll(); $('settings').close();
};
$('baseForm').onsubmit = event => { event.preventDefault(); return saveBase($('base').value); };
$('resetBase').onclick = () => saveBase('');
$('folderForm').onsubmit = async event => {
  event.preventDefault(); if (!nativeConnected) return toast('requiresDesktop');
  try { await native('/api/set-demos-folder?folder=' + encodeURIComponent($('folder').value)); toast('saved'); } catch { toast('error'); }
};
$('startup').onchange = async event => {
  try { await native('/api/set-startup?enabled=' + event.target.checked); toast('saved'); }
  catch { event.target.checked = !event.target.checked; toast('error'); }
};
$('checkUpdate').onclick = async () => {
  if (!nativeConnected) { window.open('https://github.com/nimnabrox/NBFC_TRACKER/releases/latest', '_blank', 'noopener'); return; }
  $('checkUpdate').disabled = true; $('updateMessage').textContent = t('loading');
  try { update = await native('/api/check-update', { signal: AbortSignal.timeout(15000) });
    $('updateMessage').textContent = update.available === false ? t('error') : update.hasUpdate ? t('newVersion', { version: update.latestVersion }) : t('upToDate');
    $('installUpdate').hidden = !update.hasUpdate;
  } catch { $('updateMessage').textContent = t('error'); }
  finally { $('checkUpdate').disabled = false; }
};
$('installUpdate').onclick = async () => {
  $('installUpdate').disabled = true;
  try { const result = await native('/api/apply-update', { signal: AbortSignal.timeout(15000) }); if (!result.success) throw new Error('Update failed'); }
  catch { toast('error'); }
  finally { $('installUpdate').disabled = false; }
};
let initialLanguage;
try { initialLanguage = localStorage.getItem('nbfc_language'); } catch {}
await setLanguage(resolveLanguage(new URLSearchParams(location.search).get('lang') || initialLanguage || navigator.language));
$('language').value = locale;
await poll(); timer = setInterval(poll, 2500);
window.addEventListener('pagehide', () => { clearInterval(timer); clearTimeout(toastTimer); });

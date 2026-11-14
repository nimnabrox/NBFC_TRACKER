import { languages, resolveLanguage, setLanguage, t, number, locale } from './i18n.js';
import { summarize, activityDays, parseCount, matchesCsv } from './stats.js';
import { mountLanguagePicker, mountMiniTabs } from './controls.js';
import { getOverlayOptions, setOverlayOptions, mountOverlayEditor } from './overlay-options.js';
import { mountZoom, setZoomValue } from './zoom.js';
import { renderConnectionGate } from './connection.js';
import { version, displayVersion, releaseUrl, compareVersions } from './version.js';

const $ = id => document.getElementById(id);
const local = ['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '5088';
const companion = local ? location.origin : 'http://localhost:5088';
const cloud = local ? 'https://nbfct.nimnabro.com' : location.origin;
let snapshot = { total: 0, matches: [], accounts: [] };
let connection = 'waiting', nativeConnected = false, polling = false, page = 1, timer, toastTimer, update;
let settingsLoaded = false;
let companionVersion = '', installing = false, installStartVersion = '';
let updateNotice = null;
let overlaySaveTimer, overlaySaving = false, overlayDirty = false, overlayRevision = 0;
function notice(key, values = {}) { updateNotice = { key, values }; $('updateMessage').textContent = t(key, values); }
const updateErrorKey = code => ({ private_access: 'updateAccess', rate_limited: 'updateRateLimited', release_missing: 'updateMissing' }[code] || 'updateOffline');

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
function overlayUrl() { return cloud + '/overlay'; }
async function saveOverlayOptions() {
  if (!nativeConnected || !overlayDirty || overlaySaving) return;
  overlaySaving = true;
  const revision = overlayRevision;
  try {
    await native('/api/set-overlay-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getOverlayOptions()) });
    if (revision === overlayRevision) overlayDirty = false;
  } catch { toast('error'); }
  finally { overlaySaving = false; }
}
function render() {
  renderConnectionGate(nativeConnected);
  const values = summarize(snapshot);
  for (const [key, value] of Object.entries(values)) {
    const el = $(key);
    if (el) el.textContent = number(value);
  }
  $('total').style.setProperty('--count-chars', Math.max(6, number(values.total).length));
  $('total').title = `${number(values.opened)} ${t('opened')} + ${number(values.destroyed)} ${t('destroyed')}`;
  if ($('lastMatch')) $('lastMatch').title = `${number(values.lastMatchOpened)} ${t('opened')} + ${number(values.lastMatchDestroyed)} ${t('destroyed')}`;
  if ($('session')) $('session').title = `${number(values.sessionOpened)} ${t('opened')} + ${number(values.sessionDestroyed)} ${t('destroyed')}`;
  document.querySelectorAll('[data-total-last]').forEach(el => { el.textContent = '+' + number(values.lastMatch); el.title = t('lastMatch'); });
  $('overlayTotal').textContent = number(values.total);
  $('overlayEditorTotal').textContent = number(values.total);
  const options = getOverlayOptions();
  document.querySelectorAll('[data-overlay-label]').forEach(el => { el.hidden = !options.showLabel; el.textContent = options.label.trim() || t('overlayDefaultLabel'); });
  document.querySelectorAll('[data-overlay-last]').forEach(el => { el.hidden = !options.showLastMatch; el.textContent = '+' + number(snapshot.lastMatch || 0); });
  $('statusText').textContent = t(connection);
  if (updateNotice) $('updateMessage').textContent = t(updateNotice.key, updateNotice.values);
  document.querySelectorAll('.version').forEach(el => { el.textContent = displayVersion; });
  $('status').classList.toggle('online', ['connected', 'cloud'].includes(connection));
  $('totalHint').textContent = snapshot.base > 0 ? `${t('base')}: ${number(snapshot.base)}` : t('fromReplays');
  $('matchStatus').textContent = t(snapshot.inProgress ? 'matchLive' : connection === 'offline' ? 'stale' : 'fromReplays');
  if ($('countTeam')) {
    $('countTeam').checked = !!snapshot.countTeam;
    $('countTeam').disabled = !nativeConnected;
  }
  $('profile').disabled = !nativeConnected || !snapshot.accounts?.length;
  const profileSignature = JSON.stringify([locale, snapshot.player, snapshot.accounts]);
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
    if ($('accountList')) {
      $('accountList').replaceChildren();
      for (const account of accounts) {
        const button = document.createElement('button'); button.type = 'button';
        const active = account.active || account.name === snapshot.player || account.key === snapshot.player;
        button.className = 'account-pill' + (active ? ' active' : ''); button.setAttribute('aria-pressed', String(!!active));
        const name = document.createElement('span'); name.className = 'account-name'; name.textContent = account.name || account.key;
        const meta = document.createElement('span'); meta.className = 'account-meta'; meta.textContent = `${number(account.chests || 0)} ${t('chests')}`;
        button.append(name, meta); button.disabled = !nativeConnected || !account.key;
        button.onclick = () => { $('profile').value = account.key || account.name; $('profile').dispatchEvent(new window.Event('change', { bubbles: true })); };
        $('accountList').append(button);
      }
      $('profile').hidden = accounts.some(account => account.key);
    }
  }
  if (!snapshot.player && !snapshot.accounts?.length) $('profile').options[0].textContent = t('noProfile');
  $('previewOverlay').href = overlayUrl();
  $('previewEditedOverlay').href = overlayUrl();
  $('copyEditedOverlay').disabled = !snapshot.player;
  $('copyOverlay').disabled = !snapshot.player;
  $('previewOverlay').setAttribute('aria-disabled', String(!snapshot.player));
  if (!snapshot.player) $('previewOverlay').removeAttribute('href');
  if ($('obsUrl')) $('obsUrl').textContent = overlayUrl();
  if ($('obsUrlAlt')) $('obsUrlAlt').textContent = overlayUrl();
  if ($('activeAccountName')) $('activeAccountName').textContent = snapshot.player || t('noProfile');
  if ($('matchesCount')) $('matchesCount').textContent = number(snapshot.matches?.length || 0);
  if ($('openWeb')) $('openWeb').href = cloud + '/dashboard';
  if (document.activeElement !== $('base')) $('base').value = snapshot.base ?? '';
  ['base', 'resetBase', 'folder', 'startup'].forEach(id => { $(id).disabled = !nativeConnected; });
  $('baseForm').querySelector('button').disabled = !nativeConnected;
  $('folderForm').querySelector('button').disabled = !nativeConnected;
  renderMatches(); renderChart(); renderTeammates();
}
function renderTeammates() {
  if (!$('teammatesList')) return;
  const teammates = Array.isArray(snapshot.teammates) ? snapshot.teammates : [];
  $('teammatesList').replaceChildren();
  if ($('teammatesSection')) $('teammatesSection').hidden = !teammates.length;
  if (!teammates.length) return;
  for (const mate of teammates) {
    const card = document.createElement('div');
    card.className = 'teammate-card';
    const name = document.createElement('div');
    name.className = 'teammate-name';
    name.textContent = mate.name;
    const stats = document.createElement('div');
    stats.className = 'teammate-stats';
    const count = document.createElement('strong');
    count.textContent = number(mate.chests);
    const label = document.createElement('span');
    label.textContent = ` ${t('chests')} · ${mate.matches} ${t('history')}`;
    stats.append(count, label);
    card.append(name, stats);
    $('teammatesList').append(card);
  }
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
    row.className = 'match-row-clickable';
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.onclick = () => showMatchDetails(match);
    row.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showMatchDetails(match); } };
    const date = new Date(match.matchStart);
    const values = [Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date),
      displayMode(match.playlist),
      match.placement ? `#${number(match.placement)}` : '—', number(match.chestsOpened), match.eliminations == null ? '—' : number(match.eliminations)];
    values.forEach((value, index) => {
      const cell = document.createElement('td'); cell.textContent = value;
      if (index === 3) {
        cell.className = 'count';
        if (match.chestsDestroyed > 0) {
          const openedOnly = match.chestsSearched ?? Math.max(0, match.chestsOpened - match.chestsDestroyed);
          cell.title = `${number(openedOnly)} ${t('opened')} + ${number(match.chestsDestroyed)} ${t('destroyed')}`;
        }
        if (match.teammates && match.teammates.length > 0) {
          const matesText = match.teammates.map(m => `${m.name}: ${number(m.chests)}`).join(', ');
          const teamTotal = match.teamChests ?? (match.chestsOpened + match.teammates.reduce((s, m) => s + m.chests, 0));
          cell.title = (cell.title ? cell.title + '\n' : '') + `${t('teamChests')}: ${number(teamTotal)} (${t('teammates')}: ${matesText})`;
          const matesCount = match.teammates.reduce((s, m) => s + (Number(m.chests) || 0), 0);
          cell.replaceChildren();
          const mainVal = document.createElement('strong');
          mainVal.textContent = number(match.chestsOpened);
          const subBadge = document.createElement('small');
          subBadge.className = 'team-chest-sub';
          subBadge.textContent = `+${number(matesCount)} 👥`;
          cell.append(mainVal, subBadge);
        }
      }
      if (index === 2 && match.placement === 1) cell.className = 'win';
      row.append(cell);
    });
    $('matchRows').append(row);
  }
  $('pagination').hidden = !matches.length; $('export').disabled = !matches.length;
  $('pageLabel').textContent = t('page', { current: number(page), total: number(pages) });
  $('previous').disabled = page <= 1; $('next').disabled = page >= pages;
}
function showMatchDetails(match) {
  const dlg = $('matchDetails');
  if (!dlg) return;
  const body = $('matchDetailsBody');
  if (!body) return;
  body.replaceChildren();

  const date = new Date(match.matchStart);
  const dateStr = Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  const modeStr = displayMode(match.playlist);
  const placeStr = match.placement ? `#${number(match.placement)}` : '—';
  const isWin = match.placement === 1;

  const headerCard = document.createElement('div');
  headerCard.className = 'match-detail-header' + (isWin ? ' win-banner' : '');
  const modeDiv = document.createElement('div');
  modeDiv.className = 'match-detail-mode';
  modeDiv.textContent = modeStr;
  const metaDiv = document.createElement('div');
  metaDiv.className = 'match-detail-meta';
  const placeSpan = document.createElement('strong');
  if (isWin) placeSpan.className = 'win-text';
  placeSpan.textContent = placeStr;
  metaDiv.append(document.createTextNode(dateStr + ' · '), placeSpan, document.createTextNode(` · ${number(match.eliminations || 0)} ${t('eliminations')}`));
  headerCard.append(modeDiv, metaDiv);
  body.append(headerCard);

  const playerCard = document.createElement('div');
  playerCard.className = 'match-player-card';
  const playerRow = document.createElement('div');
  playerRow.className = 'match-player-row';
  const nameCol = document.createElement('div');
  nameCol.className = 'match-player-name';
  const badge = document.createElement('span');
  badge.className = 'player-badge';
  badge.textContent = 'YOU';
  const nameText = document.createElement('strong');
  nameText.textContent = match.playerName || snapshot.player || t('profile');
  nameCol.append(badge, nameText);

  const chestCol = document.createElement('div');
  chestCol.className = 'match-player-chests';
  const chestVal = document.createElement('strong');
  chestVal.textContent = number(match.chestsOpened);
  chestCol.append(chestVal, document.createTextNode(' ' + t('chests')));
  playerRow.append(nameCol, chestCol);

  const breakdownRow = document.createElement('div');
  breakdownRow.className = 'match-player-breakdown';
  const openedOnly = match.chestsSearched ?? Math.max(0, match.chestsOpened - (match.chestsDestroyed || 0));
  const openedSpan = document.createElement('span');
  openedSpan.textContent = `${number(openedOnly)} ${t('opened')}`;
  breakdownRow.append(openedSpan);
  if (match.chestsDestroyed > 0) {
    const destroyedSpan = document.createElement('span');
    destroyedSpan.textContent = `· ${number(match.chestsDestroyed)} ${t('destroyed')}`;
    breakdownRow.append(destroyedSpan);
  }

  playerCard.append(playerRow, breakdownRow);
  body.append(playerCard);

  const teamSec = document.createElement('div');
  teamSec.className = 'match-team-section';

  const teamTitle = document.createElement('div');
  teamTitle.className = 'match-team-title';
  const teamTitleText = document.createElement('span');
  teamTitleText.textContent = t('teammates');
  const teammates = Array.isArray(match.teammates) ? match.teammates : [];
  const matesSum = teammates.reduce((s, m) => s + (Number(m.chests) || 0), 0);
  const teamTotalVal = match.teamChests ?? (match.chestsOpened + matesSum);
  const teamTotalSmall = document.createElement('small');
  teamTotalSmall.textContent = `${t('teamChests')}: `;
  const teamTotalStrong = document.createElement('strong');
  teamTotalStrong.textContent = number(teamTotalVal);
  teamTotalSmall.append(teamTotalStrong);
  teamTitle.append(teamTitleText, teamTotalSmall);
  teamSec.append(teamTitle);

  if (teammates.length > 0) {
    for (const mate of teammates) {
      const mateRow = document.createElement('div');
      mateRow.className = 'match-mate-row';
      const mateNameCol = document.createElement('div');
      mateNameCol.className = 'match-mate-name';
      const dot = document.createElement('span');
      dot.className = 'mate-dot';
      const mateName = document.createElement('span');
      mateName.textContent = mate.name;
      mateNameCol.append(dot, mateName);

      const mateChestCol = document.createElement('div');
      mateChestCol.className = 'match-mate-chests';
      const mateChestVal = document.createElement('strong');
      mateChestVal.textContent = number(mate.chests || 0);
      mateChestCol.append(mateChestVal, document.createTextNode(' ' + t('chests')));

      mateRow.append(mateNameCol, mateChestCol);
      teamSec.append(mateRow);
    }
  } else {
    const isSolo = /solo/.test(match.playlist?.toLowerCase() || '');
    const emptyRow = document.createElement('div');
    emptyRow.className = 'match-mate-empty';
    emptyRow.textContent = isSolo ? t('solo') : t('noActivity');
    teamSec.append(emptyRow);
  }
  body.append(teamSec);

  if (match.fileName) {
    const fileRow = document.createElement('div');
    fileRow.className = 'match-detail-file';
    fileRow.textContent = match.fileName;
    body.append(fileRow);
  }

  dlg.showModal();
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
    snapshot = data; nativeConnected = true; connection = 'connected';
    if (data.overlayOptions && !overlayDirty && !overlaySaving) setOverlayOptions(data.overlayOptions);
    if (overlayDirty) await saveOverlayOptions();
    if (!settingsLoaded) { settingsLoaded = true; await loadSettings(); }
    if (installing) {
      const state = await native('/api/update-status');
      if (state.status === 'failed') {
        installing = false; $('installUpdate').disabled = false; notice('installFailed');
      } else if (state.status === 'idle') {
        const current = await native('/api/settings');
        if (current.version !== installStartVersion) { installing = false; location.reload(); }
      }
    }
  } catch {
    nativeConnected = false; settingsLoaded = false; setZoomValue(undefined, false);
    connection = snapshot.player ? 'offline' : 'waiting';
  } finally { polling = false; render(); }
}
async function loadSettings() {
  try {
    const data = await native('/api/settings');
    setZoomValue(data.uiZoomPercent, nativeConnected);
    $('folder').value = data.demosFolder || ''; $('startup').checked = !!data.startWithWindows;
    if (data.overlayOptions && !overlayDirty) setOverlayOptions(data.overlayOptions);
    companionVersion = data.version || '';
    if (companionVersion && companionVersion !== displayVersion) {
      notice('versionMismatch', { app: companionVersion, web: displayVersion });
      $('updateRelease').hidden = false;
    }
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
mountLanguagePicker();
mountMiniTabs();
mountZoom(async percent => {
  try { const saved = await native('/api/set-zoom?percent=' + percent); setZoomValue(saved.uiZoomPercent, true); }
  catch { toast('error'); }
});
mountOverlayEditor(() => {
  overlayDirty = true; overlayRevision++; render(); clearTimeout(overlaySaveTimer);
  overlaySaveTimer = setTimeout(saveOverlayOptions, 250);
});
document.addEventListener('languagechange', render);
$('language').addEventListener('change', async event => {
  try {
    await setLanguage(event.target.value);
    const url = new URL(location.href); url.searchParams.set('lang', locale); history.replaceState(null, '', url);
    if (nativeConnected) await native('/api/set-language?code=' + encodeURIComponent(locale));
  } catch { toast('error'); }
});
$('openSettings').onclick = () => $('settings').showModal();
$('closeSettings').onclick = () => $('settings').close();
$('settings').addEventListener('click', event => { if (event.target === $('settings')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
if ($('closeMatchDetails')) $('closeMatchDetails').onclick = () => $('matchDetails').close();
if ($('matchDetails')) $('matchDetails').addEventListener('click', event => { if (event.target === $('matchDetails')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
$('retryConnection').onclick = () => poll();
$('copyOverlay').onclick = () => copy(overlayUrl());
$('copyEditedOverlay').onclick = () => copy(overlayUrl());
$('creatorCode').onclick = () => copy('NIMNABRO');
document.querySelectorAll('[data-copy-creator]').forEach(button => { button.onclick = () => copy('NIMNABRO'); });
$('openGuide').onclick = () => { $('guide').open = true; };
$('previous').onclick = () => { page--; renderMatches(); }; $('next').onclick = () => { page++; renderMatches(); };
$('export').onclick = () => {
  const url = URL.createObjectURL(new Blob([matchesCsv(snapshot.matches || [])], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'nbfc-matches.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('profile').onchange = async event => {
  try {
    await native('/api/set-profile?key=' + encodeURIComponent(event.target.value));
    const url = new URL(location.href); url.searchParams.delete('room'); history.replaceState(null, '', url);
    page = 1; await poll();
  } catch { toast('error'); }
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
if ($('countTeam')) {
  $('countTeam').onchange = async event => {
    try { await native('/api/set-count-team?enabled=' + event.target.checked); await poll(); toast('saved'); }
    catch { event.target.checked = !event.target.checked; toast('error'); }
  };
}
$('checkUpdate').onclick = async () => {
  $('checkUpdate').disabled = true; notice('loading');
  $('updateRelease').href = releaseUrl;
  try {
    if (nativeConnected) {
      update = await native('/api/check-update', { signal: AbortSignal.timeout(25000) });
      if (update.available === false) notice(updateErrorKey(update.errorCode));
      else if (update.hasUpdate) notice('newVersion', { version: update.latestVersion });
      else notice('upToDate');
      $('installUpdate').hidden = !update.hasUpdate;
      $('updateRelease').hidden = update.available !== false && !update.hasUpdate;
    } else {
      const latest = await request(`${cloud}/version.json`);
      const newer = compareVersions(latest.version, version) > 0;
      if (newer) notice('newVersion', { version: latest.displayVersion }); else notice('upToDate');
      $('installUpdate').hidden = true;
      $('updateRelease').hidden = false;
    }
  } catch { notice('updateOffline'); $('updateRelease').hidden = false; }
  finally { $('checkUpdate').disabled = false; }
};
$('installUpdate').onclick = async () => {
  $('installUpdate').disabled = true;
  installStartVersion = companionVersion || displayVersion;
  try {
    const result = await native('/api/apply-update', { signal: AbortSignal.timeout(25000) });
    if (!result.success) throw new Error('Update failed');
    installing = true; notice('installing');
  } catch { notice('installFailed'); $('installUpdate').disabled = false; }
};
$('updateRelease').href = releaseUrl;
let initialLanguage;
try { initialLanguage = localStorage.getItem('nbfc_language'); } catch {}
await setLanguage(resolveLanguage(new URLSearchParams(location.search).get('lang') || initialLanguage || navigator.language));
$('language').value = locale;
await poll(); timer = setInterval(poll, 2500);
window.addEventListener('pagehide', () => { clearInterval(timer); clearTimeout(toastTimer); clearTimeout(overlaySaveTimer); });

/**
 * ⚡ NimnaBro's Fortnite Chest Tracker v3 - Application Engine
 * Created by NimnaBro
 * 
 * High-performance, zero-memory-leak, SVG-only client engine.
 * Supports direct native companion sync (:5088), Cloudflare KV edge sync,
 * File System Access API, and direct .replay file imports.
 */

import { ReplayParser } from './replay-parser.js';
import { SyncManager } from './sync.js';

// --- Global Application State ---
const STATE = {
  room: new URLSearchParams(window.location.search).get('room') || '',
  directoryHandle: null,
  processedFiles: new Map(), // fileName -> lastModified
  matches: [],
  accounts: [],
  activeAccount: null,
  baseChestCount: null,
  sessionStart: Date.now(),
  isCompanionConnected: false,
  hasLoadedLocalMatches: false
};

let currentMatchPage = 1;
const MATCHES_PER_PAGE = 10;

// Initialize Universal Sync Manager
const sync = new SyncManager(STATE.room, false);
if (typeof Peer !== 'undefined') {
  try { sync.initPeerSync(Peer); } catch {}
}

// --- LocalStorage Persistence ---
function loadLocalConfig() {
  try {
    const savedBase = localStorage.getItem('nb_base_chest_count');
    if (savedBase && !isNaN(parseInt(savedBase, 10))) {
      STATE.baseChestCount = parseInt(savedBase, 10);
    }
    const savedAccount = localStorage.getItem('nb_active_account');
    if (savedAccount) {
      STATE.activeAccount = savedAccount;
    }
    const savedMatches = localStorage.getItem('nb_cached_matches');
    if (savedMatches) {
      const parsed = JSON.parse(savedMatches);
      if (Array.isArray(parsed) && parsed.length > 0) {
        STATE.matches = parsed;
      }
    }
  } catch (e) {
    console.warn("Could not load local cache:", e);
  }
}

function saveLocalMatches() {
  try {
    localStorage.setItem('nb_cached_matches', JSON.stringify(STATE.matches.slice(0, 200)));
  } catch (e) {}
}

// --- File System Access API (Connect Folder with Live Watcher) ---
export async function connectFolder() {
  try {
    if (!('showDirectoryPicker' in window)) {
      alert("Your browser does not support the File System Access API. Please use Google Chrome or Microsoft Edge on Windows.");
      return;
    }

    const dirHandle = await window.showDirectoryPicker({
      id: 'fortnite-replays-folder',
      mode: 'read',
      startIn: 'documents'
    });

    STATE.directoryHandle = dirHandle;
    updateFolderStatus(true, dirHandle.name);

    // Initial scan and continuous live watcher
    await scanReplayFolder();
    startWatcherLoop();
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.warn("Folder picker result:", err);

    // Show friendly guidance modal if user picked AppData
    const isSecurity = err.name === 'SecurityError' || (err.message && err.message.toLowerCase().includes('system'));
    if (isSecurity) {
      const modal = document.getElementById('chromeModal');
      if (modal) {
        modal.style.display = 'flex';
      } else {
        alert("Browser Restricted Folder Notice:\n\nGoogle Chrome forbids web apps from selecting AppData directly ('contains system files').\n\nPlease select: This PC > Local Disk (C:) > FortniteReplays\n(Opens with zero warnings and auto-updates live!)");
      }
    } else {
      alert("Folder access notice: " + (err.message || err.name));
    }
  }
}

// --- Direct .replay Files Picker (Bypasses all browser folder restrictions) ---
export async function handleFileInput(files) {
  if (!files || files.length === 0) return;

  const btnLabel = document.getElementById('btnSelectFilesLabel');
  if (btnLabel) btnLabel.textContent = `Parsing ${files.length} files...`;

  let added = 0;
  for (const file of files) {
    if (file.name.endsWith('.replay')) {
      try {
        const buffer = await file.arrayBuffer();
        const record = await ReplayParser.parse(buffer, file.name);
        const existingIdx = STATE.matches.findIndex(m => m.fileName === file.name);
        if (existingIdx >= 0) {
          STATE.matches[existingIdx] = record;
        } else {
          STATE.matches.push(record);
        }
        added++;
      } catch (e) {
        console.warn("Could not parse replay file:", file.name, e);
      }
    }
  }

  if (btnLabel) btnLabel.textContent = `Select .replay Files`;

  if (added > 0) {
    saveLocalMatches();
    updateFolderStatus(true, `${added} Replay Files Loaded`);
    renderApp();
  }
}

// --- Continuous Live Folder Watcher ---
let watcherInterval = null;
function startWatcherLoop() {
  if (watcherInterval) clearInterval(watcherInterval);
  watcherInterval = setInterval(async () => {
    if (STATE.directoryHandle) {
      await scanReplayFolder();
    }
  }, 2500);
}

async function scanReplayFolder() {
  if (!STATE.directoryHandle) return;

  let newMatchesFound = false;
  try {
    for await (const entry of STATE.directoryHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.replay')) {
        const file = await entry.getFile();
        const prevModified = STATE.processedFiles.get(entry.name);

        if (!prevModified || prevModified !== file.lastModified) {
          STATE.processedFiles.set(entry.name, file.lastModified);

          try {
            const buffer = await file.arrayBuffer();
            const record = await ReplayParser.parse(buffer, entry.name);

            const existingIdx = STATE.matches.findIndex(m => m.fileName === entry.name);
            if (existingIdx >= 0) {
              STATE.matches[existingIdx] = record;
            } else {
              STATE.matches.push(record);
            }
            newMatchesFound = true;
          } catch (parseErr) {
            console.warn("Could not parse replay:", entry.name, parseErr);
          }
        }
      }
    }

    if (newMatchesFound) {
      saveLocalMatches();
      renderApp();
    }
  } catch (err) {
    console.warn("Scan iteration notice:", err);
  }
}

function updateFolderStatus(connected, info) {
  const desc = document.getElementById('syncStatusDesc');
  const badgeText = document.getElementById('engineStatusText');

  if (connected) {
    if (desc) desc.textContent = `Connected: ${info} · Live auto-tracking active!`;
    if (badgeText) badgeText.textContent = "Live Watcher Active";
  } else {
    if (desc) desc.textContent = "Automatic companion engine active. Select folder or files to scan additional replays.";
  }
}

export async function handleFileDrop(files) {
  await handleFileInput(files);
}

// --- Custom Base Starting Chest Count ---
export function saveBaseCount(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('baseInput');
  const val = input ? input.value.trim() : '';

  if (!val || val === '0') {
    STATE.baseChestCount = null;
    localStorage.removeItem('nb_base_chest_count');
  } else {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      STATE.baseChestCount = num;
      localStorage.setItem('nb_base_chest_count', num.toString());
    }
  }

  const inTab = document.getElementById('baseInputTab');
  if (inTab) inTab.value = STATE.baseChestCount || '';

  // Also sync to local daemon if running
  try {
    fetch(`http://localhost:5088/api/set-base?count=${encodeURIComponent(STATE.baseChestCount || 0)}`, { mode: 'cors' });
  } catch {}

  renderApp();
}

export function saveBaseCountFromTab(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('baseInputTab');
  const val = input ? input.value.trim() : '';

  if (!val || val === '0') {
    STATE.baseChestCount = null;
    localStorage.removeItem('nb_base_chest_count');
  } else {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      STATE.baseChestCount = num;
      localStorage.setItem('nb_base_chest_count', num.toString());
    }
  }

  const inSide = document.getElementById('baseInput');
  if (inSide) inSide.value = STATE.baseChestCount || '';

  try {
    fetch(`http://localhost:5088/api/set-base?count=${encodeURIComponent(STATE.baseChestCount || 0)}`, { mode: 'cors' });
  } catch {}

  renderApp();
}

export function clearBaseCount() {
  STATE.baseChestCount = null;
  localStorage.removeItem('nb_base_chest_count');
  const input = document.getElementById('baseInput');
  if (input) input.value = '';
  const inputTab = document.getElementById('baseInputTab');
  if (inputTab) inputTab.value = '';

  try {
    fetch('http://localhost:5088/api/set-base?count=clear', { mode: 'cors' });
  } catch {}

  renderApp();
}

export function clearBaseCountFromTab() {
  STATE.baseChestCount = null;
  localStorage.removeItem('nb_base_chest_count');
  const inputTab = document.getElementById('baseInputTab');
  if (inputTab) inputTab.value = '';
  const inputSide = document.getElementById('baseInput');
  if (inputSide) inputSide.value = '';

  try {
    fetch('http://localhost:5088/api/set-base?count=clear', { mode: 'cors' });
  } catch {}

  renderApp();
}

export function copyObsUrlFromTab() {
  const codeEl = document.getElementById('obsFullUrlTab');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent.trim());
    const btnText = document.getElementById('btnCopyTextTab');
    if (btnText) {
      btnText.textContent = 'Copied!';
      setTimeout(() => { btnText.textContent = 'Copy Overlay URL'; }, 1800);
    }
  }
}

export async function setCustomDemosFolderFromTab() {
  const input = document.getElementById('customFolderInputTab');
  const folder = input?.value.trim();
  if (!folder) return;
  try {
    const res = await fetch(`http://localhost:5088/api/set-demos-folder?folder=${encodeURIComponent(folder)}`, { mode: 'cors' });
    if (res.ok) {
      const pathEl = document.getElementById('detectedFolderPathTab');
      if (pathEl) pathEl.textContent = folder;
      const pathElSide = document.getElementById('detectedFolderPath');
      if (pathElSide) pathElSide.textContent = folder;
      alert('Replay folder updated successfully!');
    }
  } catch (e) {
    alert('Please enter a valid directory path on this machine.');
  }
}

export function switchWebTab(tabId) {
  document.querySelectorAll('.web-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab-target') === tabId);
  });
  document.querySelectorAll('.web-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });
}

// --- Fortnite Account / Profile Switcher ---
export async function switchAccount(name) {
  STATE.activeAccount = name;
  localStorage.setItem('nb_active_account', name);

  // 1. Sync to local daemon
  try {
    await fetch(`http://localhost:5088/api/set-profile?key=${encodeURIComponent(name)}`, { mode: 'cors' });
  } catch {}

  // 2. Fetch updated matches for this profile
  try {
    const res = await fetch(`http://localhost:5088/api/matches`, { mode: 'cors' });
    if (res.ok) {
      const matches = await res.json();
      if (Array.isArray(matches)) {
        STATE.matches = matches;
        saveLocalMatches();
      }
    }
  } catch {}

  currentMatchPage = 1;
  updateObsLinks();
  renderApp();
}

// --- Copy OBS URL ---
export function copyObsUrl() {
  const codeEl = document.getElementById('obsUrlCode');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent.trim());
    const btnText = document.getElementById('btnCopyText');
    if (btnText) {
      btnText.textContent = 'Copied!';
      setTimeout(() => { btnText.textContent = 'Copy URL'; }, 1800);
    }
  }
}

function updateObsLinks() {
  const roomName = encodeURIComponent((STATE.activeAccount || STATE.room || 'nimnabro').toLowerCase());
  const origin = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'https://nbfct.nimnabro.com'
    : window.location.origin;

  const overlayUrl = `${origin}/overlay.html?room=${roomName}`;
  const obsLinkEl = document.getElementById('obsUrlCode');
  const obsOpenBtn = document.getElementById('obsOpenBtn');
  if (obsLinkEl) obsLinkEl.textContent = overlayUrl;
  if (obsOpenBtn) obsOpenBtn.href = overlayUrl;

  const obsLinkTab = document.getElementById('obsFullUrlTab');
  const obsOpenBtnTab = document.getElementById('obsOpenBtnTab');
  if (obsLinkTab) obsLinkTab.textContent = overlayUrl;
  if (obsOpenBtnTab) obsOpenBtnTab.href = overlayUrl;
}

// --- Main App Render ---
function renderApp() {
  // 1. Group matches and compute accounts dynamically
  const accountsMap = new Map();
  for (const m of STATE.matches) {
    const name = m.playerName || 'nimnabro';
    const acc = accountsMap.get(name) || { name, matches: 0, chests: 0, lastPlayed: 0 };
    acc.matches++;
    acc.chests += (m.chestsOpened || 0);
    const time = new Date(m.matchStart || 0).getTime();
    if (time > acc.lastPlayed) acc.lastPlayed = time;
    accountsMap.set(name, acc);
  }

  // Also include accounts from local daemon
  if (STATE.accounts && STATE.accounts.length > 0) {
    for (const da of STATE.accounts) {
      if (!accountsMap.has(da.name)) {
        accountsMap.set(da.name, {
          name: da.name,
          matches: da.matches,
          chests: da.chests,
          lastPlayed: Date.now()
        });
      }
    }
  }

  const allAccounts = Array.from(accountsMap.values()).sort((a, b) => b.matches - a.matches);

  // Set default active account
  if (allAccounts.length > 0) {
    if (!STATE.activeAccount || !accountsMap.has(STATE.activeAccount)) {
      STATE.activeAccount = allAccounts[0].name;
    }
  } else {
    STATE.activeAccount = null;
  }

  // Filter matches for active account
  const isAll = !STATE.activeAccount || STATE.activeAccount.toLowerCase() === 'all' || STATE.activeAccount.toLowerCase() === 'all accounts';
  const activeMatches = isAll
    ? STATE.matches
    : STATE.matches.filter(m => (m.playerName || '').toLowerCase() === STATE.activeAccount.toLowerCase());
  activeMatches.sort((a, b) => new Date(b.matchStart) - new Date(a.matchStart));

  // Compute metrics
  const replayTotalChests = activeMatches.reduce((acc, m) => acc + (m.chestsOpened || 0), 0);
  const sessionMatches = activeMatches.filter(m => new Date(m.matchStart).getTime() >= STATE.sessionStart - 120000);
  const sessionChests = sessionMatches.reduce((acc, m) => acc + (m.chestsOpened || 0), 0);
  const displayedTotal = (STATE.baseChestCount && STATE.baseChestCount > 0)
    ? STATE.baseChestCount + sessionChests
    : (replayTotalChests > 0 ? replayTotalChests : (STATE.baseChestCount || 0));

  const lastMatch = activeMatches.length > 0 ? (activeMatches[0].chestsOpened || 0) : 0;
  const avgChests = activeMatches.length > 0 ? (replayTotalChests / activeMatches.length).toFixed(1) : '0.0';
  const victoryRoyales = activeMatches.filter(m => m.placement === 1).length;

  // Update Stat Tiles
  document.getElementById('statTotal').textContent = Number(displayedTotal).toLocaleString('en-US');
  document.getElementById('statTotalSub').textContent = STATE.baseChestCount
    ? `chests counted (${STATE.baseChestCount.toLocaleString()} base + ${sessionChests} session)`
    : `chests counted across all matches`;

  document.getElementById('statLastMatch').textContent = lastMatch;
  document.getElementById('statSession').textContent = sessionChests;
  document.getElementById('statMatches').textContent = activeMatches.length.toLocaleString('en-US');
  document.getElementById('statAvg').textContent = avgChests;
  document.getElementById('statTreasures').textContent = victoryRoyales;

  const obsVal = document.getElementById('obsPreviewVal');
  if (obsVal) obsVal.textContent = Number(displayedTotal).toLocaleString('en-US');
  const obsValTab = document.getElementById('obsPreviewValTab');
  if (obsValTab) obsValTab.textContent = Number(displayedTotal).toLocaleString('en-US');

  const activeNameEl = document.getElementById('activeAccountName');
  if (activeNameEl) {
    activeNameEl.textContent = STATE.activeAccount || '—';
  }

  if (STATE.baseChestCount) {
    const baseInput = document.getElementById('baseInput');
    if (baseInput && !baseInput.value) baseInput.value = STATE.baseChestCount;
    const baseInputTab = document.getElementById('baseInputTab');
    if (baseInputTab && !baseInputTab.value) baseInputTab.value = STATE.baseChestCount;
  }

  // Render Account Switcher List
  renderAccountSwitcher(allAccounts);

  // Render 30-Day Activity Chart
  renderActivityChart(activeMatches);

  // Render Latest Matches Table
  renderMatchesTable(activeMatches);

  // Broadcast to OBS Overlay & Edge
  const liveState = {
    room: (STATE.activeAccount || STATE.room || 'nimnabro').toLowerCase(),
    total: displayedTotal,
    lastMatch,
    liveChests: 0,
    base: STATE.baseChestCount,
    session: sessionChests,
    player: STATE.activeAccount || 'nimnabro',
    accounts: allAccounts,
    inProgress: false
  };
  sync.broadcast(liveState);

  updateObsLinks();
}

function renderAccountSwitcher(accounts) {
  const container = document.getElementById('accountList');
  const countBadge = document.getElementById('accountCountBadge');
  if (!container) return;

  if (accounts.length === 0) {
    container.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:8px 0;">No profiles loaded yet. Launch companion app or connect replays.</div>`;
    if (countBadge) countBadge.textContent = "0 Profiles";
    return;
  }

  let html = '';
  for (const acc of accounts) {
    const isActive = acc.name === STATE.activeAccount;
    const matchLabel = acc.matches === 1 ? '1 match' : `${acc.matches} matches`;
    const chestLabel = `${acc.chests.toLocaleString()} chests`;

    html += `
      <div class="account-pill ${isActive ? 'active' : ''}" onclick="window.app.switchAccount('${acc.name}')">
        <div class="account-info">
          <div class="account-name" style="display:flex;align-items:center;gap:6px;">
            <svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${acc.name}</span>
          </div>
          <div class="account-meta">${matchLabel} · ${chestLabel}</div>
        </div>
        ${isActive
          ? `<span class="account-badge">ACTIVE</span>`
          : `<span style="font-size:11px;color:var(--accent);font-weight:700;">Switch →</span>`
        }
      </div>
    `;
  }

  container.innerHTML = html;
  if (countBadge) {
    countBadge.textContent = `${accounts.length} ${accounts.length === 1 ? 'Profile' : 'Profiles'}`;
  }
}

function renderActivityChart(matches) {
  const container = document.getElementById('chartBars');
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const perDay = days.map(d => {
    const dayStr = d.toISOString().slice(0, 10);
    return matches
      .filter(m => m.matchStart && m.matchStart.slice(0, 10) === dayStr)
      .reduce((sum, m) => sum + (m.chestsOpened || 0), 0);
  });

  const maxVal = Math.max(1, ...perDay);

  let html = '';
  for (let i = 0; i < days.length; i++) {
    const val = perDay[i];
    const pct = Math.round((val / maxVal) * 100);
    const dateFormatted = days[i].toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const isZero = val === 0;

    html += `
      <div class="bar-col ${isZero ? 'zero' : ''}">
        <div class="bar-fill" style="height:${isZero ? 4 : Math.max(8, pct)}%;"></div>
        <div class="tooltip">${dateFormatted}: ${val} ${val === 1 ? 'chest' : 'chests'}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderMatchesTable(matches) {
  const tbody = document.getElementById('matchesTableBody');
  const countIndicator = document.getElementById('matchCountIndicator');
  const paginationContainer = document.getElementById('matchesPagination');
  if (!tbody) return;

  const totalMatches = matches.length;
  if (countIndicator) {
    countIndicator.textContent = `${totalMatches} ${totalMatches === 1 ? 'match' : 'matches'}`;
  }

  if (totalMatches === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:34px;color:var(--muted);">No replay matches detected. Connect your replays or launch companion app.</td></tr>`;
    if (paginationContainer) paginationContainer.style.display = 'none';
    return;
  }

  const totalPages = Math.ceil(totalMatches / MATCHES_PER_PAGE) || 1;
  if (currentMatchPage > totalPages) currentMatchPage = totalPages;
  if (currentMatchPage < 1) currentMatchPage = 1;

  const startIndex = (currentMatchPage - 1) * MATCHES_PER_PAGE;
  const pageMatches = matches.slice(startIndex, startIndex + MATCHES_PER_PAGE);

  let html = '';
  for (const m of pageMatches) {
    const date = new Date(m.matchStart).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const isVictory = m.placement === 1;
    const placeHtml = isVictory
      ? `<span class="badge-victory">
           <svg class="svg-icon svg-accent" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
           </svg>
           Victory Royale
         </span>`
      : (m.placement ? `#${m.placement} / ${m.totalPlayers || 100}` : '—');

    const playlistClean = (m.playlist || 'Battle Royale').replace(/^Playlist_/, '').replace(/_/g, ' ');

    html += `
      <tr>
        <td style="white-space:nowrap;font-weight:600;">${date}</td>
        <td><span class="badge-mode">${playlistClean}</span></td>
        <td>${placeHtml}</td>
        <td style="text-align:right;" class="chest-count-cell">${m.chestsOpened || 0}</td>
        <td style="text-align:right;font-weight:700;">${m.eliminations !== undefined ? m.eliminations : '—'}</td>
        <td style="font-weight:700;color:var(--text);">${m.playerName || 'nimnabro'}</td>
      </tr>
    `;
  }

  tbody.innerHTML = html;

  // Pagination controls (10 matches per page)
  if (paginationContainer) {
    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
    } else {
      paginationContainer.style.display = 'flex';
      paginationContainer.innerHTML = `
        <div style="font-size:12px;color:var(--muted);font-weight:600;">
          Showing ${startIndex + 1}–${Math.min(startIndex + MATCHES_PER_PAGE, totalMatches)} of ${totalMatches} matches
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button type="button" class="btn btn-secondary" style="padding:5px 12px;font-size:11px;" ${currentMatchPage === 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''} onclick="window.app.prevMatchPage()">
            ← Previous
          </button>
          <span style="font-size:12px;font-weight:700;color:var(--text);padding:0 6px;">Page ${currentMatchPage} of ${totalPages}</span>
          <button type="button" class="btn btn-secondary" style="padding:5px 12px;font-size:11px;" ${currentMatchPage === totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''} onclick="window.app.nextMatchPage()">
            Next →
          </button>
        </div>
      `;
    }
  }
}

export function prevMatchPage() {
  if (currentMatchPage > 1) {
    currentMatchPage--;
    renderApp();
  }
}

export function nextMatchPage() {
  currentMatchPage++;
  renderApp();
}

// --- CSV Export ---
export function exportCsv() {
  const activeMatches = STATE.matches.filter(m => (m.playerName || 'nimnabro') === STATE.activeAccount);
  let csv = 'date;mode;player;placement;total_players;chests_opened;eliminations;file_name\r\n';
  for (const m of activeMatches) {
    csv += `${m.matchStart};${m.playlist};${m.playerName};${m.placement};${m.totalPlayers};${m.chestsOpened};${m.eliminations || 0};${m.fileName}\r\n`;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nimnabro_fortnite_chests_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function updateConnectionUI(connected) {
  STATE.isCompanionConnected = connected;
  const badge = document.getElementById('desktopAppStatusBadge');
  const dot = document.getElementById('desktopAppStatusDot');
  const text = document.getElementById('desktopAppStatusText');
  if (badge && dot && text) {
    if (connected) {
      badge.style.background = 'rgba(72, 187, 120, 0.12)';
      badge.style.color = '#48bb78';
      badge.style.borderColor = 'rgba(72, 187, 120, 0.3)';
      dot.style.background = '#48bb78';
      dot.style.boxShadow = '0 0 8px #48bb78';
      text.textContent = 'Desktop App Connected';
    } else {
      badge.style.background = 'rgba(255, 255, 255, 0.05)';
      badge.style.color = '#8c93a4';
      badge.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      dot.style.background = '#8c93a4';
      dot.style.boxShadow = 'none';
      text.textContent = 'Desktop App Disconnected';
    }
  }
}

// --- Background Synchronization Engine ---
let isPollingSync = false;
async function pollExternalSync() {
  if (isPollingSync) return;
  isPollingSync = true;

  let localConnected = false;

  // 1. Try local companion daemon at http://localhost:5088 and http://127.0.0.1:5088
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 900);
    const res = await fetch('http://localhost:5088/api/live', { signal: ctrl.signal, mode: 'cors' });
    clearTimeout(tid);

    if (res.ok) {
      const d = await res.json();
      if (d && (d.total !== undefined || d.player)) {
        localConnected = true;
        updateConnectionUI(true);
        applyCompanionDaemonState(d);

        if (!STATE.hasLoadedLocalMatches) {
          await fetchLocalMatchesOnce();
        }
        isPollingSync = false;
        return;
      }
    }
  } catch {}

  if (!localConnected) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 900);
      const res = await fetch('http://127.0.0.1:5088/api/live', { signal: ctrl.signal, mode: 'cors' });
      clearTimeout(tid);

      if (res.ok) {
        const d = await res.json();
        if (d && (d.total !== undefined || d.player)) {
          localConnected = true;
          updateConnectionUI(true);
          applyCompanionDaemonState(d);

          if (!STATE.hasLoadedLocalMatches) {
            await fetchLocalMatchesOnce();
          }
          isPollingSync = false;
          return;
        }
      }
    } catch {}
  }

  updateConnectionUI(false);

  // 2. Fallback to Cloudflare Edge Sync ONLY if a room is explicitly configured or requested
  const targetRoom = STATE.room || new URLSearchParams(window.location.search).get('room');
  if (targetRoom && targetRoom.trim() && targetRoom.trim() !== 'all') {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 1200);
      const baseApi = (window.location.origin && window.location.origin.startsWith('http') && !window.location.origin.includes(':5088'))
        ? window.location.origin
        : 'https://nbfct.nimnabro.com';
      const res = await fetch(`${baseApi}/api/sync?room=${encodeURIComponent(targetRoom.toLowerCase())}`, {
        cache: 'no-store',
        signal: ctrl.signal
      });
      clearTimeout(tid);

      if (res.ok) {
        const d = await res.json();
        if (d && (d.total !== undefined || d.accounts?.length > 0 || d.matches?.length > 0)) {
          applyEdgeSyncState(d);
        }
      }
    } catch {}
  }

  isPollingSync = false;
}

function fetchLocalMatchesOnce() {
  return new Promise(async (resolve) => {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch('http://localhost:5088/api/matches', { signal: ctrl.signal, mode: 'cors' });
      clearTimeout(tid);

      if (res.ok) {
        const matches = await res.json();
        if (Array.isArray(matches) && matches.length > 0) {
          STATE.matches = matches;
          STATE.hasLoadedLocalMatches = true;
          saveLocalMatches();
          renderApp();
        }
      }
    } catch {}
    resolve();
  });
}

function applyCompanionDaemonState(d) {
  STATE.isCompanionConnected = true;

  const engineStatusText = document.getElementById('engineStatusText');
  if (engineStatusText) {
    engineStatusText.textContent = "Live Tracking";
  }

  const desc = document.getElementById('syncStatusDesc');
  if (desc) {
    desc.textContent = "Auto-tracking active. Matches and chests update live in real-time.";
  }

  if (d.base && !STATE.baseChestCount) {
    STATE.baseChestCount = d.base;
  }

  if (d.accounts && Array.isArray(d.accounts)) {
    STATE.accounts = d.accounts;
  }

  if (d.player && (!STATE.activeAccount || STATE.activeAccount === '—')) {
    STATE.activeAccount = d.player;
  }

  if (d.total !== undefined && (!STATE.matches || STATE.matches.length === 0)) {
    const totalEl = document.getElementById('statTotal');
    if (totalEl) totalEl.textContent = Number(d.total).toLocaleString('en-US');
    const lastEl = document.getElementById('statLastMatch');
    if (lastEl) lastEl.textContent = Number(d.lastMatch || 0).toLocaleString('en-US');
    const sessionEl = document.getElementById('statSession');
    if (sessionEl) sessionEl.textContent = Number(d.session || 0).toLocaleString('en-US');
  }

  renderApp();
}

function applyEdgeSyncState(d) {
  if (d.accounts && Array.isArray(d.accounts) && d.accounts.length > 0) {
    STATE.accounts = d.accounts;
  }
  if (d.player && (!STATE.activeAccount || STATE.activeAccount === '—')) {
    STATE.activeAccount = d.player;
  }
  if (d.base && !STATE.baseChestCount) {
    STATE.baseChestCount = d.base;
  }
  if (d.matches && Array.isArray(d.matches) && d.matches.length > 0) {
    STATE.matches = d.matches;
    saveLocalMatches();
  }
  if (d.total !== undefined) {
    const totalEl = document.getElementById('statTotal');
    if (totalEl) totalEl.textContent = Number(d.total).toLocaleString('en-US');
    const lastEl = document.getElementById('statLastMatch');
    if (lastEl) lastEl.textContent = Number(d.lastMatch || 0).toLocaleString('en-US');
    const sessionEl = document.getElementById('statSession');
    if (sessionEl) sessionEl.textContent = Number(d.session || 0).toLocaleString('en-US');
  }

  const engineStatusText = document.getElementById('engineStatusText');
  if (engineStatusText) {
    engineStatusText.textContent = "Live Tracking";
  }
  const desc = document.getElementById('syncStatusDesc');
  if (desc) {
    desc.textContent = "Live cloud edge synchronization active via nbfct.nimnabro.com.";
  }

  renderApp();
}

// --- Settings & Configuration Helpers ---
export async function toggleStartup(enabled) {
  try {
    await fetch(`http://localhost:5088/api/set-startup?enabled=${enabled ? 'true' : 'false'}`, { mode: 'cors' });
  } catch (e) {
    console.warn("Could not set startup on local daemon:", e);
  }
}

export async function setCustomDemosFolder() {
  const input = document.getElementById('customFolderInput');
  const folder = input?.value.trim();
  if (!folder) return;
  try {
    const res = await fetch(`http://localhost:5088/api/set-demos-folder?folder=${encodeURIComponent(folder)}`, { mode: 'cors' });
    if (res.ok) {
      const pathEl = document.getElementById('detectedFolderPath');
      if (pathEl) pathEl.textContent = folder;
      const pathElTab = document.getElementById('detectedFolderPathTab');
      if (pathElTab) pathElTab.textContent = folder;
      if (input) input.value = '';
      await fetchLocalMatchesOnce();
    }
  } catch (e) {
    alert("Could not update folder on local daemon: " + e.message);
  }
}

async function fetchSettings() {
  try {
    const res = await fetch('http://localhost:5088/api/settings', { mode: 'cors' });
    if (res.ok) {
      const s = await res.json();
      const chk = document.getElementById('chkStartup');
      if (chk && s.startWithWindows !== undefined) chk.checked = s.startWithWindows;
      const chkTab = document.getElementById('chkStartupTab');
      if (chkTab && s.startWithWindows !== undefined) chkTab.checked = s.startWithWindows;

      const pathEl = document.getElementById('detectedFolderPath');
      if (pathEl && s.demosFolder) pathEl.textContent = s.demosFolder;
      const pathElTab = document.getElementById('detectedFolderPathTab');
      if (pathElTab && s.demosFolder) pathElTab.textContent = s.demosFolder;
    }
  } catch {}
}

// --- Setup Global Window API & Startup ---
window.app = {
  connectFolder,
  handleFileInput,
  handleFileDrop,
  saveBaseCount,
  saveBaseCountFromTab,
  clearBaseCount,
  clearBaseCountFromTab,
  switchAccount,
  copyObsUrl,
  copyObsUrlFromTab,
  exportCsv,
  toggleStartup,
  setCustomDemosFolder,
  setCustomDemosFolderFromTab,
  prevMatchPage,
  nextMatchPage,
  switchWebTab
};

document.addEventListener('DOMContentLoaded', () => {
  loadLocalConfig();
  renderApp();

  // Start polling daemon, settings & cloud edge
  pollExternalSync();
  fetchSettings();
  setInterval(pollExternalSync, 2000);

  // Setup drag & drop handlers
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFileDrop(e.dataTransfer.files);
    }
  });

  updateObsLinks();
});

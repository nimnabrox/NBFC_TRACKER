/**
 * ⚡ NBFC TRACKER - Desktop Mini Companion Engine
 * Created by NimnaBro - https://guns.lol/nimnabro
 */

(function () {
  'use strict';

  const STATE = {
    room: '',
    player: '',
    accounts: [],
    total: 0,
    lastMatch: 0,
    session: 0,
    base: null,
    inProgress: false,
    demosFolder: '%LOCALAPPDATA%\\FortniteGame\\Saved\\Demos',
    startWithWindows: false
  };

  // --- Tab Navigation ---
  const tabButtons = document.querySelectorAll('.mini-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });

  // --- Toast Notification Helper ---
  function showToast(msg) {
    const toast = document.getElementById('toastNotice');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
  }

  // --- URL Helpers ---
  function getOverlayUrl() {
    const room = encodeURIComponent((STATE.player || 'nimnabro').toLowerCase());
    return `https://nbfct.nimnabro.com/overlay.html?room=${room}`;
  }

  function updateUrls() {
    const url = getOverlayUrl();
    const d1 = document.getElementById('obsUrlDisplay');
    const d2 = document.getElementById('obsFullUrl');
    const testBtn = document.getElementById('btnTestObs');

    if (d1) d1.textContent = url;
    if (d2) d2.textContent = url;
    if (testBtn) testBtn.href = url;
  }

  // --- Copy Buttons ---
  function copyTextToClipboard(text, btnElement, defaultText) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    showToast("OBS URL Copied to Clipboard!");
    if (btnElement) {
      const orig = btnElement.textContent;
      btnElement.textContent = "Copied!";
      setTimeout(() => { btnElement.textContent = defaultText || orig; }, 1800);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  const btnCopy1 = document.getElementById('btnCopyOverlay');
  if (btnCopy1) {
    btnCopy1.addEventListener('click', () => {
      copyTextToClipboard(getOverlayUrl(), document.getElementById('btnCopyOverlayText'), "Copy OBS Overlay URL");
    });
  }

  const btnCopy2 = document.getElementById('btnCopyObs2');
  if (btnCopy2) {
    btnCopy2.addEventListener('click', () => {
      copyTextToClipboard(getOverlayUrl(), btnCopy2, "Copy URL");
    });
  }

  // --- Profile Switcher ---
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileDropdown) {
    profileDropdown.addEventListener('change', async () => {
      const key = profileDropdown.value;
      try {
        await fetch(`http://localhost:5088/api/set-profile?key=${encodeURIComponent(key)}`);
        await pollLive();
        showToast("Profile Updated & Synced to Cloud!");
      } catch (e) {
        console.warn("Could not set profile:", e);
      }
    });
  }

  // --- Startup Toggle ---
  const chkStartup = document.getElementById('chkStartupMini');
  if (chkStartup) {
    chkStartup.addEventListener('change', async () => {
      const enabled = chkStartup.checked;
      try {
        await fetch(`http://localhost:5088/api/set-startup?enabled=${enabled ? 'true' : 'false'}`);
        showToast(enabled ? "Startup Enabled (Runs in Tray)" : "Startup Disabled");
      } catch (e) {
        console.warn("Could not update startup:", e);
      }
    });
  }

  // --- Custom Replay Folder ---
  const btnSaveFolder = document.getElementById('btnSaveCustomFolder');
  const inputFolder = document.getElementById('inputCustomFolder');
  if (btnSaveFolder && inputFolder) {
    btnSaveFolder.addEventListener('click', async () => {
      const folder = inputFolder.value.trim();
      if (!folder) return;
      try {
        const res = await fetch(`http://localhost:5088/api/set-demos-folder?folder=${encodeURIComponent(folder)}`);
        if (res.ok) {
          const det = document.getElementById('detectedFolderText');
          if (det) det.textContent = folder;
          inputFolder.value = '';
          showToast("Replay Folder Saved!");
        }
      } catch (e) {
        alert("Could not update folder: " + e.message);
      }
    });
  }

  // --- Starting Chest Offset (Tab 1 Hero & Tab 2 Settings) ---
  const inputBaseHero = document.getElementById('inputBaseHero');
  const btnSaveBaseHero = document.getElementById('btnSaveBaseHero');
  const btnResetBaseHero = document.getElementById('btnResetBaseHero');
  const heroBaseBadge = document.getElementById('heroBaseBadge');

  const inputBase = document.getElementById('inputBaseChest');
  const btnSaveBase = document.getElementById('btnSaveBaseChest');
  const btnResetBase = document.getElementById('btnResetBaseChest');

  function syncBaseTyping(source, target) {
    if (!source) return;
    source.addEventListener('input', () => {
      const raw = source.value.trim();
      if (target && document.activeElement !== target) target.value = raw;
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 0) {
        // Show EXACTLY the custom typed amount (never add session)
        const totalEl = document.getElementById('statTotalChests');
        if (totalEl) totalEl.textContent = val.toLocaleString('en-US');
        const previewEl = document.getElementById('previewChestsVal');
        if (previewEl) previewEl.textContent = val.toLocaleString('en-US');
        if (heroBaseBadge) heroBaseBadge.textContent = 'Typing Custom Offset...';
      } else if (!raw) {
        const totalEl = document.getElementById('statTotalChests');
        if (totalEl) totalEl.textContent = Number(STATE.total).toLocaleString('en-US');
        const previewEl = document.getElementById('previewChestsVal');
        if (previewEl) previewEl.textContent = Number(STATE.total).toLocaleString('en-US');
        if (heroBaseBadge) heroBaseBadge.textContent = (STATE.base && STATE.base > 0) ? 'Custom Offset' : 'Replay Count';
      }
    });

    source.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveBaseCount();
      }
    });
  }

  syncBaseTyping(inputBaseHero, inputBase);
  syncBaseTyping(inputBase, inputBaseHero);

  async function saveBaseCount() {
    const raw = (inputBaseHero && inputBaseHero.value.trim()) || (inputBase && inputBase.value.trim()) || '';
    const val = parseInt(raw, 10);
    if (isNaN(val) || val < 0) return;
    try {
      const p = encodeURIComponent(STATE.player || '');
      await fetch(`http://localhost:5088/api/set-base?count=${val}&profile=${p}`);
      STATE.base = val;
      STATE.total = val;
      const totalEl = document.getElementById('statTotalChests');
      if (totalEl) totalEl.textContent = val.toLocaleString('en-US');
      const previewEl = document.getElementById('previewChestsVal');
      if (previewEl) previewEl.textContent = val.toLocaleString('en-US');
      if (heroBaseBadge) heroBaseBadge.textContent = 'Custom Offset';
      showToast(`Custom Offset Saved: ${val.toLocaleString()} chests`);
      pollLive();
    } catch (e) {
      alert("Could not save offset: " + e.message);
    }
  }

  async function resetBaseCount() {
    try {
      const p = encodeURIComponent(STATE.player || '');
      await fetch(`http://localhost:5088/api/set-base?count=clear&profile=${p}`);
      STATE.base = null;
      if (inputBaseHero) inputBaseHero.value = '';
      if (inputBase) inputBase.value = '';
      if (heroBaseBadge) heroBaseBadge.textContent = 'Replay Count';
      showToast("Offset Reset to Replays Default");
      pollLive();
    } catch (e) {
      alert("Could not reset offset: " + e.message);
    }
  }

  if (btnSaveBaseHero) btnSaveBaseHero.addEventListener('click', saveBaseCount);
  if (btnResetBaseHero) btnResetBaseHero.addEventListener('click', resetBaseCount);
  if (btnSaveBase) btnSaveBase.addEventListener('click', saveBaseCount);
  if (btnResetBase) btnResetBase.addEventListener('click', resetBaseCount);

  // --- Item Shop Creator Code Copy ---
  const btnCopyCodeMini = document.getElementById('btnCopyCodeMini');
  if (btnCopyCodeMini) {
    btnCopyCodeMini.addEventListener('click', () => {
      const code = 'NIMNABRO';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => fallbackCopy(code));
      } else {
        fallbackCopy(code);
      }
      showToast("Creator Code NIMNABRO Copied! 💛");
      const textEl = document.getElementById('btnCopyCodeMiniText');
      if (textEl) {
        const orig = textEl.textContent;
        textEl.textContent = 'Copied!';
        setTimeout(() => { textEl.textContent = orig; }, 1800);
      }
    });
  }

  // --- YouTube Live Status Check ---
  async function checkYouTubeLiveMini() {
    const badge = document.getElementById('ytLiveBadgeMini');
    if (!badge) return;
    try {
      const res = await fetch('http://localhost:5088/api/youtube-live', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const d = await res.json();
        if (d && d.isLive) {
          badge.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#ff0000;box-shadow:0 0 8px #ff0000;animation:pulse 1s infinite;"></span><span>🔴 LIVE NOW</span>';
          badge.style.background = 'rgba(255, 0, 0, 0.2)';
          badge.style.borderColor = '#ff0000';
          badge.style.color = '#ff4d4d';
        } else {
          badge.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#8c93a4;"></span><span>OFFICIAL CHANNEL</span>';
          badge.style.background = 'rgba(255, 255, 255, 0.06)';
          badge.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          badge.style.color = '#a0aec0';
        }

        if (d.thumbnail) {
          const img = document.getElementById('ytThumbImgMini');
          if (img && img.src !== d.thumbnail) img.src = d.thumbnail;
        }
        if (d.title) {
          const titleEl = document.getElementById('ytVideoTitleMini');
          if (titleEl) titleEl.textContent = (d.isLive ? '🔴 ' : '') + d.title;
        }
        if (d.liveUrl) {
          const link = document.getElementById('ytThumbLinkMini');
          if (link) link.href = d.liveUrl;
        }
      }
    } catch {}
  }

  // --- Live Polling Engine (Low Spec, 0 memory leaks) ---
  let isPolling = false;
  async function pollLive() {
    if (isPolling) return;
    isPolling = true;

    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 900);
      const res = await fetch('http://localhost:5088/api/live', { signal: ctrl.signal });
      clearTimeout(tid);

      if (res.ok) {
        const d = await res.json();
        if (d) {
          applyState(d);
        }
      }
    } catch {}

    isPolling = false;
  }

  function applyState(d) {
    STATE.total = d.total || 0;
    STATE.lastMatch = d.lastMatch || 0;
    STATE.session = d.session || 0;
    STATE.player = d.player || 'nimnabro';
    STATE.base = d.base || null;
    STATE.inProgress = !!d.inProgress;

    // Update numbers (unless user is actively typing an offset)
    const isBaseFocused = (inputBase && document.activeElement === inputBase) || (inputBaseHero && document.activeElement === inputBaseHero);

    if (!isBaseFocused) {
      const totalEl = document.getElementById('statTotalChests');
      if (totalEl) totalEl.textContent = Number(STATE.total).toLocaleString('en-US');

      const previewEl = document.getElementById('previewChestsVal');
      if (previewEl) previewEl.textContent = Number(STATE.total).toLocaleString('en-US');

      if (inputBase) inputBase.value = (d.base && d.base > 0) ? d.base : '';
      if (inputBaseHero) inputBaseHero.value = (d.base && d.base > 0) ? d.base : '';
      if (heroBaseBadge) heroBaseBadge.textContent = (d.base && d.base > 0) ? 'Custom Offset' : 'Replay Count';
    }

    const lastEl = document.getElementById('statLastMatch');
    if (lastEl) lastEl.textContent = Number(STATE.lastMatch).toLocaleString('en-US');

    const sessEl = document.getElementById('statSession');
    if (sessEl) sessEl.textContent = Number(STATE.session).toLocaleString('en-US');

    const nameEl = document.getElementById('activePlayerName');
    if (nameEl) nameEl.textContent = STATE.player || '—';

    const progEl = document.getElementById('statMatchProgress');
    if (progEl) {
      progEl.textContent = STATE.inProgress ? "🟢 Match In Progress..." : "Auto-updates after every match";
      progEl.style.color = STATE.inProgress ? "#48bb78" : "#8c93a4";
    }

    // Populate profile dropdown if accounts list changed (strictly individual profiles, never 'all')
    if (d.accounts && Array.isArray(d.accounts) && d.accounts.length > 0) {
      const accountsJson = JSON.stringify(d.accounts);
      if (accountsJson !== STATE._lastAccountsJson) {
        STATE._lastAccountsJson = accountsJson;
        STATE.accounts = d.accounts;
        if (profileDropdown) {
          profileDropdown.innerHTML = '';
          let anySelected = false;
          d.accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.key || acc.name;
            opt.textContent = `${acc.name || acc.key} (${(acc.chests || 0).toLocaleString()} chests)`;
            if (acc.active) {
              opt.selected = true;
              anySelected = true;
            }
            profileDropdown.appendChild(opt);
          });
          if (!anySelected && profileDropdown.options.length > 0) {
            profileDropdown.selectedIndex = 0;
          }
        }
      }
    }

    updateUrls();
  }

  // --- Initial Settings Fetch ---
  async function fetchSettingsOnce() {
    try {
      const res = await fetch('http://localhost:5088/api/settings');
      if (res.ok) {
        const s = await res.json();
        if (chkStartup && s.startWithWindows !== undefined) {
          chkStartup.checked = s.startWithWindows;
        }
        if (s.demosFolder) {
          const det = document.getElementById('detectedFolderText');
          if (det) det.textContent = s.demosFolder;
        }
        if (s.baseChestCount) {
          if (inputBase) inputBase.value = s.baseChestCount;
          if (inputBaseHero) inputBaseHero.value = s.baseChestCount;
          if (heroBaseBadge) heroBaseBadge.textContent = 'Custom Offset';
        }
      }
    } catch {}
  }

  // --- Start Engines ---
  fetchSettingsOnce();
  pollLive();
  checkYouTubeLiveMini();
  setInterval(pollLive, 1000);
  setInterval(checkYouTubeLiveMini, 60000);
})();

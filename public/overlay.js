import { resolveLanguage } from './i18n.js';
const params = new URLSearchParams(location.search);
const room = (params.get('room') || '').trim().toLowerCase();
const locale = resolveLanguage(params.get('lang') || navigator.language);
document.documentElement.lang = locale;
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
const formatter = new Intl.NumberFormat(locale);
const element = document.getElementById('total');
const label = (params.get('label') || '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0,64).trim();
const showLast = params.get('last') === '1';
const labelElement = document.getElementById('overlayCaption'), lastElement = document.getElementById('overlayLast');
document.body.classList.toggle('detailed', !!label || showLast);
const cacheKey = 'nbfc_overlay_v1_' + (room || 'local');
let polling = false, lastUpdate = 0, total = null, lastMatch = null;
const validCount = value => Number.isSafeInteger(value) && value >= 0;
function paint() {
  element.textContent = total === null ? '—' : formatter.format(total);
  if (labelElement) { labelElement.hidden = !label; labelElement.textContent = label; labelElement.title = label; }
  if (lastElement) { lastElement.hidden = !showLast || lastMatch === null; lastElement.textContent = lastMatch === null ? '' : '+' + formatter.format(lastMatch); }
}
try {
  const saved = JSON.parse(localStorage.getItem(cacheKey));
  if (saved && validCount(saved.total)) {
    total = saved.total;
    if (validCount(saved.lastMatch)) lastMatch = saved.lastMatch;
    lastUpdate = Number(saved.updatedAt) || 0;
  }
} catch { /* Cloud persistence still works when browser storage is disabled. */ }
paint();
const local = ['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '5088';
const cloud = local ? 'https://nbfct.nimnabro.com' : location.origin;
function show(data, native = false) {
  if (!validCount(data.total)) return;
  // An empty/offline response is not a reset. A known profile may genuinely reset to zero.
  if (data.total === 0 && !data.player) return;
  const timestamp = native ? Date.now() : Number(data.updatedAt) || 0;
  if (!native && timestamp < lastUpdate) return;
  lastUpdate = timestamp;
  total = data.total;
  if (validCount(data.lastMatch)) lastMatch = data.lastMatch;
  paint();
  try { localStorage.setItem(cacheKey, JSON.stringify({ total, lastMatch, updatedAt: timestamp })); } catch {}
}
async function read(url) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(1800) });
  if (!response.ok) throw new Error('Unavailable');
  return response.json();
}
async function poll() {
  if (polling) return; polling = true;
  try {
    let data;
    try {
      const candidate = await read('http://localhost:5088/api/live');
      if ((!room && local) || room === (candidate.room || '').toLowerCase()) {
        if (candidate.total !== 0 || candidate.player) data = candidate;
      }
    } catch {}
    if (data) show(data, true);
    else if (room) {
      const candidate = await read(`${cloud}/api/sync?room=${encodeURIComponent(room)}`);
      if (candidate.updatedAt) show(candidate);
    }
  } catch { /* Keep the last verified value while the companion or network is unavailable. */ }
  finally { polling = false; }
}
await poll();
const timer = setInterval(poll, 2000);
window.addEventListener('pagehide', () => clearInterval(timer));

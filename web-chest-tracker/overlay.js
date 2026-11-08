import { resolveLanguage } from './i18n.js';
const params = new URLSearchParams(location.search);
const room = (params.get('room') || '').trim().toLowerCase();
const locale = resolveLanguage(params.get('lang') || navigator.language);
document.documentElement.lang = locale;
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
const formatter = new Intl.NumberFormat(locale);
let polling = false;
const local = ['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '5088';
const cloud = local ? 'https://nbfct.nimnabro.com' : location.origin;
function show(value) {
  if (!Number.isSafeInteger(value) || value < 0) return;
  // A genuine zero/reset must replace an older nonzero value.
  document.getElementById('total').textContent = formatter.format(value);
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
    // An explicitly named cloud room cannot be replaced by an unrelated local profile.
    try {
      const candidate = await read('http://localhost:5088/api/live');
      if ((!room && local) || room === (candidate.room || '').toLowerCase()) data = candidate;
    } catch {}
    if (!data && room) { const candidate = await read(`${cloud}/api/sync?room=${encodeURIComponent(room)}`); if (candidate.updatedAt) data = candidate; }
    if (data) show(data.total);
  } catch { /* Preserve last verified value while disconnected. */ }
  finally { polling = false; }
}
await poll();
const timer = setInterval(poll, 2000);
window.addEventListener('pagehide', () => clearInterval(timer));

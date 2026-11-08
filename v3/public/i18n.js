export const languages = [
  ['id', 'Bahasa Indonesia'], ['de', 'Deutsch'], ['en', 'English'], ['es', 'Español'],
  ['es-419', 'Español (Latinoamérica)'], ['fr', 'Français'], ['it', 'Italiano'], ['pl', 'Polski'],
  ['pt-BR', 'Português (Brasil)'], ['vi', 'Tiếng Việt'], ['tr', 'Türkçe'], ['ru', 'Русский'],
  ['ar', 'العربية'], ['th', 'ไทย'], ['ja', '日本語'], ['zh-Hans', '简体中文'], ['zh-Hant', '繁體中文'], ['ko', '한국어']
];
export function resolveLanguage(value) {
  const code = String(value || '').toLowerCase();
  return languages.find(([key]) => key.toLowerCase() === code)?.[0]
    || (code.startsWith('zh') ? (/tw|hk|hant/.test(code) ? 'zh-Hant' : 'zh-Hans') : null)
    || languages.find(([key]) => key.toLowerCase() === code.split('-')[0])?.[0]
    || (code.startsWith('pt') ? 'pt-BR' : 'en');
}
export let locale = 'en';
let dictionary = {};
let requestId = 0;
export function t(key, values = {}) {
  return (dictionary[key] || key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
export const number = value => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Number(value) || 0);
export async function setLanguage(code) {
  const id = ++requestId;
  code = resolveLanguage(code);
  const response = await fetch(new URL(`./locales/${code}.json`, import.meta.url));
  if (!response.ok) throw new Error('Language file unavailable');
  const next = await response.json();
  if (id !== requestId) return false;
  dictionary = next;
  locale = code;
  document.documentElement.lang = code;
  document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  document.title = `NBFC Tracker · ${t('tagline')}`;
  try { localStorage.setItem('nbfc_language', code); } catch {}
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
  document.dispatchEvent(new CustomEvent('languagechange'));
  return true;
}

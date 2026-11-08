import { languages, locale, t } from './i18n.js';

export function mountLanguagePicker() {
  const button = document.getElementById('languageButton');
  const menu = document.getElementById('languageMenu');
  const select = document.getElementById('language');
  if (!button || !menu || !select) return;
  const options = [];
  function close(focus = false) { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); if (focus) button.focus(); }
  function open() { menu.hidden = false; button.setAttribute('aria-expanded', 'true'); (options.find(option => option.dataset.code === locale) || options[0]).focus(); }
  function choose(code) {
    select.value = code;
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
    close(true);
  }
  for (const [code, name] of languages) {
    const option = document.createElement('button');
    option.type = 'button'; option.role = 'option'; option.tabIndex = -1; option.dataset.code = code;
    option.lang = code; option.dir = code === 'ar' ? 'rtl' : 'ltr'; option.textContent = name;
    option.addEventListener('click', () => choose(code));
    menu.append(option); options.push(option);
  }
  function refresh() {
    const name = languages.find(([code]) => code === locale)?.[1] || 'English';
    document.getElementById('languageName').textContent = name;
    button.setAttribute('aria-label', `${t('language')}: ${name}`); menu.setAttribute('aria-label', t('language'));
    for (const option of options) option.setAttribute('aria-selected', String(option.dataset.code === locale));
  }
  button.addEventListener('click', () => menu.hidden ? open() : close());
  button.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); open(); }
  });
  menu.addEventListener('keydown', event => {
    const index = options.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); close(true); }
    else if (event.key === 'Tab') close();
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[next].focus();
    }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.language-picker')) close(); });
  document.addEventListener('languagechange', refresh); refresh();
}

export function mountAppearance(onOverlayChange) {
  const layout = document.getElementById('layoutChoice');
  const overlay = document.getElementById('overlayChoice');
  if (layout) {
    layout.value = document.body.dataset.layout || 'classic';
    layout.addEventListener('change', () => {
      try { localStorage.setItem('nbfc_layout', layout.value); } catch {}
      const url = new URL(location.href);
      url.searchParams.set('layout', layout.value);
      url.searchParams.set('lang', locale);
      const local = location.port === '5088' && ['localhost', '127.0.0.1'].includes(location.hostname);
      url.pathname = url.pathname.replace(/[^/]*$/, layout.value === 'modern' ? 'modern.html' : local ? 'app.html' : 'index.html');
      location.assign(url.href);
    });
  }
  if (overlay) {
    try { overlay.value = localStorage.getItem('nbfc_overlay') === 'modern' ? 'modern' : 'classic'; } catch {}
    overlay.addEventListener('change', () => {
      try { localStorage.setItem('nbfc_overlay', overlay.value); } catch {}
      onOverlayChange();
    });
  }
  document.querySelectorAll('.mini-tab-btn[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.mini-tab-btn').forEach(tab => tab.classList.toggle('active', tab === button));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.toggle('active', pane.id === button.dataset.tab));
    });
  });
}

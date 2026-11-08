import { t } from './i18n.js';
const defaults = () => ({ showLabel: false, label: '', showLastMatch: false });
let preferences = defaults();
export function getOverlayOptions() { return { ...preferences }; }
export function setOverlayOptions(value) {
  preferences = { showLabel: value?.showLabel === true, label: typeof value?.label === 'string' ? value.label.slice(0,64) : '', showLastMatch: value?.showLastMatch === true };
  try { localStorage.setItem('nbfc_overlay_options', JSON.stringify(preferences)); } catch {}
  const label = document.getElementById('overlayLabel');
  if (label) { label.value = preferences.label; label.disabled = !preferences.showLabel; label.placeholder = t('overlayDefaultLabel'); }
  const show = document.getElementById('showOverlayLabel'), last = document.getElementById('showOverlayLast');
  if (show) show.checked = preferences.showLabel;
  if (last) last.checked = preferences.showLastMatch;
}
export function mountOverlayEditor(onChange) {
  let saved; try { saved = JSON.parse(localStorage.getItem('nbfc_overlay_options')); } catch {}
  setOverlayOptions(saved || defaults());
  for (const id of ['showOverlayLabel','overlayLabel','showOverlayLast']) {
    const input = document.getElementById(id);
    input?.addEventListener(id === 'overlayLabel' ? 'input' : 'change', () => {
      setOverlayOptions({ showLabel: document.getElementById('showOverlayLabel').checked, label: document.getElementById('overlayLabel').value, showLastMatch: document.getElementById('showOverlayLast').checked });
      onChange(getOverlayOptions());
    });
  }
  document.addEventListener('languagechange', () => {
    const input = document.getElementById('overlayLabel'); if (input) input.placeholder = t('overlayDefaultLabel');
  });
}

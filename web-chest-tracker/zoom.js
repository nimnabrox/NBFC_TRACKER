let value = 100, save;
const $ = id => document.getElementById(id);
export function setZoomValue(percent = 100, connected = false) {
  value = Number.isInteger(percent) ? Math.max(50, Math.min(150, percent)) : 100;
  $('appZoom').value = value;
  $('zoomValue').textContent = value + '%';
  $('appZoom').disabled = !connected;
  $('zoomOut').disabled = !connected || value <= 50;
  $('zoomIn').disabled = !connected || value >= 150;
  $('resetZoom').disabled = !connected || value === 100;
}
export function mountZoom(onSave) {
  save = onSave;
  $('appZoom').oninput = event => setZoomValue(Number(event.target.value), true);
  $('appZoom').onchange = () => save(value);
  $('zoomOut').onclick = () => save(Math.max(50, value - 10));
  $('zoomIn').onclick = () => save(Math.min(150, value + 10));
  $('resetZoom').onclick = () => save(100);
  setZoomValue();
}

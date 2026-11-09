export function renderConnectionGate(connected){
  document.getElementById('companionGate').hidden=connected;
  const dashboard=document.querySelector('.mini-shell, .app-layout');
  dashboard.hidden=!connected;
  dashboard.inert=!connected;
  document.body.dataset.connection=connected?'connected':'waiting';
}

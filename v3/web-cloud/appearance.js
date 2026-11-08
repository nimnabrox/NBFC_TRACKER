// Runs before the stylesheet to avoid flashing the wrong saved layout.
(function () {
  try {
    const url = new URL(location.href);
    const requested = url.searchParams.get('layout');
    const modernPage = /(?:^|\/)modern(?:\.html)?\/?$/.test(url.pathname);
    const saved = localStorage.getItem('nbfc_layout');
    const choice = ['classic', 'modern'].includes(requested) ? requested : saved || (modernPage ? 'modern' : 'classic');
    if (choice === 'modern' && !modernPage || choice === 'classic' && modernPage) {
      const local = location.port === '5088' && ['localhost', '127.0.0.1'].includes(location.hostname);
      const base = url.pathname.replace(/(?:index|app|modern)(?:\.html)?\/?$/, '').replace(/[^/]*$/, '');
      url.pathname = base + (choice === 'modern' ? 'modern.html' : local ? 'app.html' : 'index.html');
      location.replace(url.href);
    }
  } catch { /* A disabled preference store still permits the default classic layout. */ }
})();

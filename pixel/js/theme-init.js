/* Aplica o tema salvo/lido ANTES do primeiro paint, evitando flash. */
(() => {
  let t = 'light';
  try {
    t = localStorage.getItem('px-trans-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) {}
  document.documentElement.dataset.theme = t;

  /* Barra de status/endereço no mobile acompanha o tema (PWA-like). */
  const setMeta = (theme) => {
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'theme-color';
      document.head.appendChild(m);
    }
    m.content = theme === 'dark' ? '#0f0f12' : '#f5f3ee';
  };
  setMeta(t);
  window.__pxSetThemeColor = setMeta;
})();
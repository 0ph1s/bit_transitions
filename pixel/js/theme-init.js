/* Aplica o tema salvo/lido ANTES do primeiro paint, evitando flash. */
(() => {
  let t = 'light';
  try {
    t = localStorage.getItem('px-trans-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) {}
  document.documentElement.dataset.theme = t;
})();
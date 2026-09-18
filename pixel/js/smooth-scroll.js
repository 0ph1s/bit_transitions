/* Smooth scroll: lerp por rAF sobre o scroll nativo (fixed/sticky intactos).
   - Captura wheel e teclas de navegação; touch e barra de rolagem seguem nativos.
   - Durante transições de pixel (body.is-transitioning) apenas sincroniza:
     o salto da navegação acontece atrás da cortina, sem drift após o reveal.
   - prefers-reduced-motion → sai e deixa o scroll nativo. */
(function () {
  'use strict';
  const reduceM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const BODY = document.body;
  if (reduceM.matches || !('scrollTo' in window) || window.__pxSmooth) return;
  window.__pxSmooth = true;

  const html = document.documentElement;
  const FRAME = 1000 / 60;
  const DAMP = 0.09; // lerp por frame base ~60fps
  let current = window.scrollY;
  let target = current;
  let raf = 0;
  let prev = performance.now();

  const busy = () => BODY.classList.contains('is-transitioning');

  function norm() { target = current = window.scrollY; }
  // Sincroniza apenas desvios EXTERNOS (barra de rolagem, âncora nativa);
  // nossos próprios scrollTo() chegam exatamente em `current` e não resetam o alvo.
  document.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (Math.abs(y - current) > 0.6) {
      current = target = y;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
  }, { passive: true, capture: true });

  function scrollTo(y) {
    const clamped = Math.max(0, Math.min(y, Math.max(0, html.scrollHeight - window.innerHeight)));
    window.scrollTo(0, clamped);
  }

  function frame(now) {
    raf = 0;
    if (busy()) {
      norm();
      prev = now;
      return;
    }
    // Mudança de origem não nossa (barra de rolagem, âncora externa) → realinha.
    const y = window.scrollY;
    if (Math.abs(y - current) > 0.6) norm();
    else {
      const dt = Math.min(50, now - prev || FRAME);
      const k = 1 - Math.pow(1 - DAMP, dt / FRAME);
      current += (target - current) * k;
      if (Math.abs(target - current) > 0.2) scrollTo(current);
      else current = target;
    }
    prev = now;
    if (target !== current) raf = requestAnimationFrame(frame);
  }
  function tick() { if (!raf) raf = requestAnimationFrame(frame); }

  function shiftY(delta) {
    if (busy()) { norm(); return; }
    target += delta;
    target = Math.max(0, Math.min(target, Math.max(0, html.scrollHeight - window.innerHeight)));
    tick();
  }

  /* Roda sobre campos de formulário → deixa o comportamento nativo (focus/fim de texto). */
  const inField = (t) => t && (t.matches('input, textarea, select, [contenteditable="true"]') || t.closest('input, textarea, select, [contenteditable="true"]'));

  document.addEventListener('wheel', (e) => {
    if (inField(e.target)) return;
    e.preventDefault();
    shiftY(e.deltaY === 0 ? 0 : e.deltaY * 1.02);
  }, { passive: false, capture: true });

  const KEY_STEP = Math.round(window.innerHeight * 0.72);
  function keyStep(delta) {
    if (busy()) { norm(); return; }
    target += delta;
    target = Math.max(0, Math.min(target, Math.max(0, html.scrollHeight - window.innerHeight)));
    tick();
  }

  document.addEventListener('keydown', (e) => {
    if (inField(e.target)) return;
    if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) return;
    const mod = e.ctrlKey || e.metaKey || e.shiftKey;
    e.preventDefault();
    if (e.key === 'ArrowUp') keyStep(mod ? -html.scrollHeight : -KEY_STEP);
    else if (e.key === 'ArrowDown') keyStep(mod ? html.scrollHeight : KEY_STEP);
    else if (e.key === 'PageUp') keyStep(-html.scrollHeight);
    else if (e.key === 'PageDown') keyStep(html.scrollHeight);
    else if (e.key === 'Home') { target = 0; tick(); }
    else if (e.key === 'End') { target = html.scrollHeight; tick(); }
    else if (e.key === ' ') keyStep(e.shiftKey ? -html.scrollHeight : html.scrollHeight);
  });

  current = window.scrollY; target = current;
})();
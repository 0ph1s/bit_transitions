/* Preloader da abertura:
   - conta 0 → 100% suave em ~3,3s (easeInOutCubic no contador);
   - ao chegar em 100%, mantém a página coberta pela cortina de pixels
     (PixelTransition.hold) e dispara o reveal aleatório no fade-out do overlay.
   - prefers-reduced-motion: pula animação e contador; página já aparece. */
(function () {
  'use strict';
  const el = document.getElementById('preloader');
  if (!el) return;
  const pct = document.getElementById('preloadPct');
  const fill = document.getElementById('preloadFill');
  const engine = window.PixelTransition;
  const reduceM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 3300; // contador entre 3 e 4 s
  let raf = 0;
  let done = false;

  function cleanup() {
    if (raf) cancelAnimationFrame(raf);
    el.classList.add('preloader--done');
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
  }

  function finishIntro() {
    if (done) return;
    done = true;
    cleanup();
    if (engine && typeof engine.reveal === 'function') engine.reveal();
  }

  // reduces motion → mostra a página imediatamente, sem loader nem cortina.
  if (reduceM.matches) {
    if (pct) pct.textContent = '100';
    if (fill) fill.style.width = '100%';
    cleanup();
    return;
  }

  // Cobre a página com o estado estático da cortina (só se WebGL estiver OK).
  const held = !!(engine && typeof engine.hold === 'function' && engine.hold());
  // Sem cortina (ex.: sem WebGL) o contador ainda roda — só não há o que revelar.

  const t0 = performance.now();
  const easeInOutCubic = (r) => (r < 0.5 ? 4 * r * r * r : 1 - Math.pow(-2 * r + 2, 3) / 2);

  function frame(ts) {
    const r = Math.min(1, (ts - t0) / DURATION);
    const v = Math.round(easeInOutCubic(r) * 100);
    if (pct) pct.textContent = String(v);
    if (fill) fill.style.width = v + '%';
    if (r < 1) { raf = requestAnimationFrame(frame); return; }
    if (fill) fill.style.width = '100%';
    // pausa breve em "100%" antes do fade + revelação.
    setTimeout(finishIntro, 260);
  }
  raf = requestAnimationFrame(frame);

  void held;
})();
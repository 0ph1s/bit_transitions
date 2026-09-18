/* ══════════ Coreografia de scroll (GSAP + ScrollTrigger) ══════════ */
'use strict';

(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });

  /* --- Marquee: clones suficientes para o trilho nunca ficar mais curto que a tela --- */
  let marqueeTween = null;
  function startMarquee() {
    const wrap = document.querySelector('.marquee');
    const track = document.querySelector('.marquee-track');
    if (!wrap || !track) return;
    const probe = track.querySelector('.mq-group'); // grupo vivo para medir
    if (!probe) return;
    const period = Math.round(probe.getBoundingClientRect().width) + 34;
    if (!period) return;
    const viewW = Math.round(wrap.getBoundingClientRect().width);
    const copies = Math.max(2, Math.ceil((viewW + period) / period));
    if (marqueeTween) marqueeTween.kill();
    track.textContent = '';
    for (let i = 0; i < copies; i++) track.appendChild(probe.cloneNode(true));
    gsap.set(track, { x: 0 });
    marqueeTween = gsap.to(track, { x: -period, duration: 30, ease: 'none', repeat: -1 });
  }
  startMarquee();
  window.addEventListener('load', startMarquee);
  window.addEventListener('resize', startMarquee);

  /* --- Manifesto: linhas em cascata + contadores --- */
  gsap.from('.manifesto', {
    y: 56, autoAlpha: 0, stagger: 0.18,
    scrollTrigger: { trigger: '#manifesto', start: 'top 74%' },
  });

  gsap.utils.toArray('.stat-num').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.val).toLocaleString('pt-BR'); },
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* --- Modos: cards em cascata --- */
  gsap.from('.mode-card', {
    y: 46, autoAlpha: 0, stagger: 0.08,
    scrollTrigger: { trigger: '.modes-grid', start: 'top 82%' },
  });

  /* --- Como funciona: passos revelados --- */
  gsap.from('.how-step', {
    y: 50, autoAlpha: 0, stagger: 0.14,
    scrollTrigger: { trigger: '#como', start: 'top 76%' },
  });

  gsap.from('pre.codeblock', {
    y: 40, autoAlpha: 0,
    scrollTrigger: { trigger: 'pre.codeblock', start: 'top 88%' },
  });

  /* --- CTA --- */
  gsap.from('.cta h2, .cta p, .cta .pill-cta', {
    y: 44, autoAlpha: 0, stagger: 0.12,
    scrollTrigger: { trigger: '#cta', start: 'top 86%' },
  });

  ScrollTrigger.refresh();
})();
/* ════════════════════════════════════════════════════════════════════════════════
   PIXEL·TRAN — transição de página pixelada (WebGL 2.0 → WebGL 1.0 → CSS fallback)

   Arquitetura:
     - Um único <canvas> fixo sobre a viewport.
     - Um único triângulo full-screen (3 vértices) num VBO estático.
     - O fragment shader faz TODO o trabalho: descobre a célula de cada
       fragmento, calcula o atraso do modo escolhido, aplica easing e devolve
       a opacidade da cor configurada. Nenhum elemento DOM por bloco.
     - requestAnimationFrame só existe para impulsionar o progresso (u_progress).
     - Cada frame = 1 gl.drawArrays. Sem arrays, sem alocações no loop.

   Cadeia da navegação:
     1) clique em um link → 2) navegação interceptada → 3) canvas cobre a tela
     4) shader calcula os blocos → 5) página atual coberta → 6) novo conteúdo
     7) canvas revela a nova página → 8) navegação concluída.
   ════════════════════════════════════════════════════════════════════════════════ */
'use strict';

(() => {
  const HEADER_OFFSET = 96; // fallback (reduntante); o valor real é lido em runtime
  const headerEl = document.querySelector('header');

  /* ══════════ Configuração (tudo mudável — veja README) ══════════ */
  const CONFIG = {
    color:    [0, 0, 0], // cor dos blocos: preto (RGB 0..1); null → var(--ink) do tema
    grid:     null,    // grade lógica: null → presets responsivos; ou { columns, rows }
duration: 1.15,   // duração (s) POR fase — cover e reveal
    interval: 0.075,   // intervalo entre blocos: fração do progresso (suaviza a "cortina")
    easing:   'expo',  // easing aplicado NO shader: 'expo' | 'cubic' | 'linear'
    mode:     'random',// padrão: 'diagonal' | 'radial' | 'leftright' | 'rightleft' | 'random'
    swapAt:   1.0,     // fração da cobertura onde o conteúdo é trocado (1.0 = só com a tela 100% coberta)
    dpr:      2,       // teto de devicePixelRatio (performance em 1080p/1440p/4K)
  };

  /* Grade lógica responsiva — controla a QUANTIDADE VISUAL de blocos.
     Não cria nenhum elemento: é apenas quantas células o shader usa. */
  function gridPreset(w) {
    if (w >= 1024) return { columns: 48, rows: 28 };   // desktop
    if (w >= 768)  return { columns: 34, rows: 24 };   // tablet
    return                   { columns: 24, rows: 38 }; // mobile
  }
  let baseGrid = CONFIG.grid || gridPreset(window.innerWidth);
  // Grade efetivamente renderizada. Nas cortinas (esq→dir / dir→esq) os blocos
  // ficam MAIORES (grade mais grossa) para o pixel ser bem visível.
  const renderGrid = { columns: baseGrid.columns, rows: baseGrid.rows };
  const CURTAIN_SCALE = 0.42; // 1/0.42 ≈ 2.4× maior
  function updateRenderGrid() {
    const curtain = CONFIG.mode === 'leftright' || CONFIG.mode === 'rightleft';
    if (CONFIG.grid || !curtain) {
      renderGrid.columns = baseGrid.columns;
      renderGrid.rows = baseGrid.rows;
    } else {
      renderGrid.columns = Math.max(6, Math.round(baseGrid.columns * CURTAIN_SCALE));
      renderGrid.rows = Math.max(5, Math.round(baseGrid.rows * (CURTAIN_SCALE + 0.06)));
    }
  }
  updateRenderGrid();
  const RANGE = 1 + CONFIG.interval; // progresso vai até 1 + interval para a última célula completar

  /* ══════════ Acessibilidade: menos movimento → sem animação ══════════ */
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ══════════ Elementos ══════════ */
  const canvas   = document.getElementById('pixelCanvas');
  const lockEl   = document.getElementById('pxLock');
  const errorEl  = document.getElementById('pxError');
  const cssCover = document.querySelector('.px-css-cover');

  /* ══════════ Shaders ══════════ */

  /* GLSL 3.00 (WebGL 2). Toda a "lógica dos pixels" mora aqui:
     - cell  = floor(uv * u_grid)  → célula de cada fragmento;
     - delay = função do modo (diagonal, radial, cortinas, hash determinístico);
     - local = (u_progress - delay) / interval  → progresso da célula;
     - easing no shader + alpha final. */
  const FRAG_GL2 = /* glsl */ `#version 300 es
    precision highp float;
    in vec2 v_uv;
    uniform vec2  u_grid;
    uniform float u_progress;
    uniform float u_interval;
    uniform int   u_mode;   // 0 diagonal | 1 radial | 2 esq→dir | 3 dir→esq | 4 random
    uniform int   u_ease;   // 0 linear | 1 cubic | 2 expo
    uniform vec3  u_color;
    out vec4 outColor;

    // Hash determinístico: mesmo padrão sempre, nenhum Math.random aqui.
    float hash(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }
    float easeOutCubic(float t) { float x = 1.0 - t; return 1.0 - x * x * x; }
    float easeOutExpo(float t)   { return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); }

    void main() {
      vec2 cell = floor(v_uv * u_grid);
      vec2 g    = u_grid;

      float delay;
      if (u_mode == 1)      delay = distance(cell / g, vec2(0.5));            // radial: centro
      else if (u_mode == 2) delay = cell.x / g.x;                             // cortina esq → dir
      else if (u_mode == 3) delay = 1.0 - cell.x / g.x;                       // cortina dir → esq
      else if (u_mode == 4) delay = hash(cell);                               // aleatório determinístico
      else                  delay = (cell.x / g.x + cell.y / g.y) * 0.5;      // diagonal

      float t = clamp((u_progress - delay) / max(u_interval, 1e-5), 0.0, 1.0);
      float a = u_ease == 1 ? easeOutCubic(t) : u_ease == 2 ? easeOutExpo(t) : t;
      outColor = vec4(u_color, a); // bloco translúcido: mesma cor do tema, alpha = progresso
    }
  `;

  /* ── Fallback WebGL 1 (GLSL ES 1.00) ── */
  const VERT_GL1 = /* glsl */ `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;
  const FRAG_GL1 = /* glsl */ `
    precision mediump float;
    varying vec2 v_uv;
    uniform vec2  u_grid;
    uniform float u_progress;
    uniform float u_interval;
    uniform int   u_mode;
    uniform int   u_ease;
    uniform vec3  u_color;

    float hash(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }
    float easeOutCubic(float t) { float x = 1.0 - t; return 1.0 - x * x * x; }
    float easeOutExpo(float t)   { return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); }

    void main() {
      vec2 cell = floor(v_uv * u_grid);
      vec2 g    = u_grid;
      float delay;
      if (u_mode == 1)      delay = distance(cell / g, vec2(0.5));
      else if (u_mode == 2) delay = cell.x / g.x;
      else if (u_mode == 3) delay = 1.0 - cell.x / g.x;
      else if (u_mode == 4) delay = hash(cell);
      else                  delay = (cell.x / g.x + cell.y / g.y) * 0.5;

      float t = clamp((u_progress - delay) / max(u_interval, 1e-5), 0.0, 1.0);
      float a = u_ease == 1 ? easeOutCubic(t) : u_ease == 2 ? easeOutExpo(t) : t;
      gl_FragColor = vec4(u_color, a);
    }
  `;

  /* ══════════ Inicialização WebGL (2 → 1) ══════════ */
  const EASE_ID = { linear: 0, cubic: 1, expo: 2 };
  const MODE_ID = { diagonal: 0, radial: 1, leftright: 2, rightleft: 3, random: 4 };

  let gl = null, isGL2 = false, prog = null, vbo = null, aPos = 0;
  let webglOK = false;
  const u = { grid: null, progress: null, interval: null, mode: null, ease: null, color: null };

  function initGL() {
    if (!window.PX || !canvas) return false;
    const attrs = { alpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true };
    gl = canvas.getContext('webgl2', attrs);            // 1) tenta WebGL 2
    isGL2 = !!gl;
    if (!gl) {                                          // 2) fallback WebGL 1
      gl = canvas.getContext('webgl', attrs) || canvas.getContext('experimental-webgl', attrs);
      if (!gl) return false;
    }
    prog = window.PX.makeProgram(gl, isGL2 ? window.PX.GLSL_VERT : VERT_GL1, isGL2 ? FRAG_GL2 : FRAG_GL1);
    if (!prog) { console.error('[px] não foi possível compilar o programa'); return false; }
    vbo = window.PX.makeFullscreenTriangle(gl);

    gl.useProgram(prog);
    aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    u.grid     = gl.getUniformLocation(prog, 'u_grid');
    u.progress = gl.getUniformLocation(prog, 'u_progress');
    u.interval = gl.getUniformLocation(prog, 'u_interval');
    u.mode     = gl.getUniformLocation(prog, 'u_mode');
    u.ease     = gl.getUniformLocation(prog, 'u_ease');
    u.color    = gl.getUniformLocation(prog, 'u_color');

    resize();
    window.addEventListener('resize', resize, { passive: true });
    webglOK = true;
    return true;
  }

  /* Sobrecusto de contexto: mantém buffers/shader/programa; só re-cria no resize. */
  function resize() {
    if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.dpr);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    canvas.style.width  = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, w, h);
    baseGrid = CONFIG.grid || gridPreset(window.innerWidth);
    updateRenderGrid();
    // Durante a transição o draw() já limpa+e repinta a cada frame;
    // limpar aqui abriria um frame de página nua (o "pisca" na troca de idioma).
    if (!busy) gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /* Cor dos blocos lida do tema (--ink): preto no claro, quase-branco no escuro. */
  function readInk() {
    const hex = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return [0, 0, 0];
    const n = parseInt(m[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  /* ÚNICO ponto de desenho: 1 clear + 1 drawArrays por chamada, sem qualquer
     alocação. O clear evita acúmulo de alpha no buffer (senão o preto "gruda"
     e a revelação termina num estalo para a página). */
  function draw(progress) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const curtain = CONFIG.mode === 'leftright' || CONFIG.mode === 'rightleft';
    // Nas cortinas o intervalo fica menor → bloco aparece/some com aresta dura (pixel nítido).
    const interval = curtain ? Math.min(CONFIG.interval, 0.02) : CONFIG.interval;
    const ink = CONFIG.color || readInk();
    gl.uniform2f(u.grid, renderGrid.columns, renderGrid.rows);
    gl.uniform1f(u.progress, Math.max(0, progress));
    gl.uniform1f(u.interval, interval);
    gl.uniform1i(u.mode, MODE_ID[CONFIG.mode] ?? 0);
    gl.uniform1i(u.ease, EASE_ID[CONFIG.easing] ?? 2);
    gl.uniform3f(u.color, ink[0], ink[1], ink[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3); // o único triângulo full-screen
  }

  /* ══════════ Máquina de estados: cover → swap → reveal ══════════ */
  let busy = false;        // bloqueia cliques repetidos durante a transição
  let rafId = 0;
  let phaseStart = 0;
  let coverDur = CONFIG.duration;
  let swapped = false;    // já trocou o conteúdo (occult behind the curtain)
  let swapPending = null; // Promise do swap (fetch, se houver)
  let swapFn = null;

  const clamp01 = (v) => v <= 0 ? 0 : v >= 1 ? 1 : v;

  function doSwap() {
    let res;
    try { res = swapFn(); } catch (err) { res = Promise.reject(err); }
    swapPending = Promise.resolve(res).then(
      () => { swapPending = null; },
      (err) => {
        // Falha (ex.: fetch 404) → a página ORIGINAL continua; apenas revela de novo.
        swapPending = null;
        showError(window.__pxT ? window.__pxT('toast.load') : 'Não foi possível carregar a página — veja o console.');
        console.error('[px] navegação falhou:', err);
      },
    );
  }

  function coverFrame(ts) {
    if (!busy) { cancelAnimationFrame(rafId); return; }
    const ratio = clamp01((ts - phaseStart) / 1000 / coverDur);
    if (webglOK) draw(ratio * RANGE);
    if (!swapped && ratio >= CONFIG.swapAt) { swapped = true; doSwap(); }
    if (ratio < 1) { rafId = requestAnimationFrame(coverFrame); return; }
    if (swapPending) { rafId = requestAnimationFrame(waitSwap); return; }
    beginReveal(ts);
  }

  // Enquanto o conteúdo carrega, permanece totalmente coberto (cortina digital).
  function waitSwap() {
    if (!busy) return;
    if (webglOK) draw(RANGE);
    if (swapPending) { rafId = requestAnimationFrame(waitSwap); return; }
    beginReveal(performance.now());
  }

  function beginReveal(ts) { phaseStart = ts; rafId = requestAnimationFrame(revealFrame); }

  function revealFrame(ts) {
    if (!busy) return;
    const ratio = clamp01((ts - phaseStart) / 1000 / coverDur);
    if (webglOK) draw((1 - ratio) * RANGE); // progresso decrescente: mesmos blocos, inverso
    if (ratio < 1) { rafId = requestAnimationFrame(revealFrame); return; }
    finish();
  }

  function finish() {
    cancelAnimationFrame(rafId); rafId = 0;
    busy = false; swapped = false; swapPending = null; swapFn = null;
    canvas.classList.remove('active');
    document.body.classList.remove('is-transitioning');
    if (lockEl) lockEl.style.display = 'none';
    // Intro: restaura o modo escolhido depois do reveal aleatório.
    if (introPrevMode) { CONFIG.mode = introPrevMode; introPrevMode = null; }
    if (prerevealFn) { const f = prerevealFn; prerevealFn = null; try { f(); } catch (e) { console.error('[px] post-reveal:', e); } }
  }

  /* ── Fallback CSS simples: sem WebGL, ainda há transição (nunca trava a navegação) ── */
  function cssLaunch() {
    const el = cssCover;
    if (!el) { instantRun(); return; }
    const ink = CONFIG.color || readInk();
    el.style.backgroundColor = 'rgb(' + Math.round(ink[0] * 255) + ',' + Math.round(ink[1] * 255) + ',' + Math.round(ink[2] * 255) + ')';
    el.style.opacity = '1';
    setTimeout(() => {
      swapped = true;
      doSwap();
      el.style.opacity = '0';
      const done = () => finish();
      el.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 400); // garantia caso transitionend não dispare
    }, 280);
  }

  /* ── reduced-motion: navegação imediata, sem bloquear nada ── */
  function instantRun() {
    try {
      const r = swapFn && swapFn();
      if (r && typeof r.then === 'function') r.catch((e) => console.error('[px] nav:', e));
    } catch (e) { console.error('[px] nav:', e); }
  }

  /* ══════════ Preloader intro: mantém a página coberta e revela em aleatório ══════════ */
  let introHeld = false;
  let introPrevMode = null;
  let prerevealFn = null; // roda quando a revelação termina

  function holdCovered() {
    if (!webglOK || busy) return false;
    busy = true;
    swapped = false; swapPending = null; swapFn = null;
    coverDur = CONFIG.duration;
    updateRenderGrid();
    document.body.classList.add('is-transitioning');
    if (lockEl) lockEl.style.display = 'block';
    canvas.classList.add('active');
    draw(RANGE); // desenha uma vez: progresso total → viewport 100% coberto, estático
    introHeld = true;
    return true;
  }

  function revealFromHold(onDone) {
    if (!introHeld) return false;
    introHeld = false;
    prerevealFn = onDone || null;
    CONFIG.mode = 'random'; // revelação de abertura: transição aleatória de pixel
    beginReveal(performance.now());
    return true;
  }

  /* ══════════ API pública ══════════ */
  function launchTransition(swap) {
    if (busy) return false;             // bloqueia cliques repetidos → retorna false
    swapFn = swap;
    if (REDUCED.matches) { closeMenu(); instantRun(); return true; } // sem animação

    busy = true;
    swapped = false; swapPending = null;
    coverDur = CONFIG.duration;
    updateRenderGrid(); // modo mudou? a grade (maior nas cortinas) acompanha
    document.body.classList.add('is-transitioning');
    if (lockEl) lockEl.style.display = 'block';
    if (webglOK) canvas.classList.add('active');

    if (webglOK) { phaseStart = performance.now(); rafId = requestAnimationFrame(coverFrame); }
    else cssLaunch();
    return true;
  }

  /* Navegação entre páginas reais (ex.: outro .html) via fetch + DOMParser.
     O swap devolve uma Promise: a cortina fica fechada até o conteúdo chegar.
     Em erro, reabre sobre a página original e mostra a mensagem. */
  function navigateTo(href, opts = {}) {
    launchTransition(async () => {
      try {
        const res = await fetch(href, { headers: { Accept: 'text/html' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const app = document.getElementById('app');
        const src = doc.getElementById('app') || doc.body;
        if (app && src) app.innerHTML = src.innerHTML;
        if (doc.title) document.title = doc.title;
        if (opts.push !== false) history.pushState({}, '', href);
        window.scrollTo({ top: 0, behavior: 'auto' });
        bindModes(); // o novo conteúdo pode trazer novos mode-cards
      } catch (err) {
        throw err; // launchTransition já revela e mostra o toast de erro
      }
    });
  }

  /* Toast de erro (a11y-friendly: role=status para leitores de tela) */
  let errTimer = 0;
  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.classList.add('show');
    clearTimeout(errTimer);
    errTimer = setTimeout(() => errorEl.classList.remove('show'), 4200);
  }

  window.PixelTransition = {
    CONFIG,
    launch: launchTransition,
    navigateTo,
    setMode: (m) => { CONFIG.mode = m; },
    setEasing: (e) => { CONFIG.easing = e; },
    hold: holdCovered,
    reveal: revealFromHold,
  };

  /* ══════════ UI da página ══════════ */

  /* Contador de células ativas — reflete a grade efetivamente renderizada. */
  const cellCount = document.getElementById('cell-count');
  function updateCount() {
    if (!cellCount) return;
    updateRenderGrid();
    cellCount.textContent = String(renderGrid.columns * renderGrid.rows);
  }
  window.addEventListener('resize', updateCount, { passive: true });
  updateCount();

  /* Menu hambúrguer */
  const navToggle = document.getElementById('navToggle');
  const navPanel = document.getElementById('navPanel');
  function closeMenu() {
    if (!navPanel) return;
    navPanel.classList.remove('open');
    if (navToggle) { navToggle.setAttribute('aria-expanded', 'false'); navToggle.classList.remove('open'); }
  }
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = navPanel.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.classList.toggle('open', open);
    });
  }
  const navBackdrop = document.getElementById('navBackdrop');
  if (navBackdrop) navBackdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* Rolar para uma seção + refletir o link ativo */
  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    // A pill é fixed (18px do topo + 50px de altura): a seção-alvo para
    // logo abaixo dela, sem sobra da seção anterior em cima.
    const pill = document.getElementById('navPanel');
    const offset = pill
      ? Math.round(pill.getBoundingClientRect().bottom) + 12
      : (headerEl ? headerEl.getBoundingClientRect().height : HEADER_OFFSET);
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: 'auto' });
    document.querySelectorAll('.px-pill__link').forEach((a) => a.classList.toggle('active', a.dataset.goto === id));
  }

  /* Navegação entre SEÇÕES (as "páginas" deste showcase):
     cover → pushState(#id) → scroll → reveal. */
  function bindNav() {
    document.querySelectorAll('a[data-goto]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        if (a.closest('.nav-panel')) closeMenu(); // fecha o menu quando é do painel
        const id = a.dataset.goto;
        launchTransition(() => {
          history.pushState({}, '', '#' + id);
          scrollToSection(id);
        });
      });
    });
  }

  /* Voltou no histórico → segue a âncora direto (sem re-animar). */
  window.addEventListener('popstate', () => {
    const id = location.hash ? location.hash.slice(1) : 'top';
    scrollToSection(id);
  });

  /* Toggle de tema com transição de cortina */
  const themeBtn = document.getElementById('themeToggle');
  const currentTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    window.__fxTheme = t; // o rastro do cursor acompanha o tema
    try { localStorage.setItem('px-trans-theme', t); } catch (e) {}
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      if (busy) return;
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      launchTransition(() => applyTheme(next));
    });
  }
  applyTheme(currentTheme());

  /* Demo dos modos: seleciona o padrão e cobre/revela a mesma página. */
  function bindModes() {
    document.querySelectorAll('.mode-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (busy) return;
        document.querySelectorAll('.mode-card').forEach((b) => b.classList.toggle('active', b === btn));
        CONFIG.mode = btn.dataset.demo || CONFIG.mode;
        launchTransition(() => { /* demo: nada muda por trás da cortina */ });
      });
    });
  }

  /* Link real para outro documento (multi-página) — opcional, desligado por padrão. */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-navigate]');
    if (!a) return;
    e.preventDefault();
    navigateTo(a.getAttribute('href'));
  });

  /* Limpeza: cancela o rAF ao sair da página. */
  window.addEventListener('pagehide', () => cancelAnimationFrame(rafId));

  /* Boot */
  if (!initGL()) console.warn('[px] WebGL indisponível → fallback CSS ativo.');
  bindNav();
  bindModes();
  applyTheme(currentTheme());
  if (location.hash) scrollToSection(location.hash.slice(1));
})();
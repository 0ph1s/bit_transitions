/* ══════════ Internacionalização (pt-BR · en · es) ══════════
   - dicionário por idioma; textos simples via data-i18n, textos ricos (com
     <code>/<em>) via data-i18n-html, atributos via data-i18n-attr;
   - aplica em DOMContentLoaded (cabe no <head>) e expõe window.__pxT / set. */
'use strict';

const PX_I18N = (() => {
  const DICT = {
    'pt-BR': {
      'doc.title': 'PIXEL·TRAN — transição pixelada em WebGL',
      'meta.desc': 'PIXEL·TRAN — showcase de transição pixelada com WebGL. Um draw call, milhões de pixels, zero divs.',
      'theme.title': 'Alternar tema claro/escuro',
      'lang.label': 'Idioma',
      'lang.pt': 'Português',
      'lang.en': 'English',
      'lang.es': 'Español',
      'badges.est': 'est. 2026 — webgl native',
      'badges.cells': 'células ativas',
      'hero.a': 'Um draw',
      'hero.b': 'call.',
      'hero.c': 'Milhões',
      'hero.d': 'de pixels.',
      'hero.lede': 'Cada fragmento do viewport calcula sua célula, seu atraso e sua opacidade em paralelo na GPU. O JavaScript só troca <em>u_progress</em> e chama um único draw.',
      'cta.explore': 'Explorar os modos ↓',
      'mq.1': 'um draw call', 'mq.2': '1 triângulo', 'mq.3': 'zero divs',
      'mq.4': 'gpu nativo', 'mq.5': '60 fps', 'mq.6': 'células no shader',
      'man.1': 'Zero divs por pixel. Nenhum loop por célula em JavaScript.',
      'man.2': 'A grade vive no fragment shader — <em>cada fragmento decide o que pinta</em>.',
      'man.3': 'Um draw call cobre a tela. Milhões de pixels, em paralelo.',
      'stat.divs': 'divs no dom',
      'stat.fps': 'fps alvo',
      'stat.modes': 'padrões de cobertura',
      'stat.draws': 'draw call por frame',
      'sec.manifesto': 'Manifesto',
      'sec.modos': 'Modos',
      'sec.como': 'Como funciona',
      'nav.label': 'Navegação',
      'nav.ticker': 'um draw · milhões de pixels',
      'nav.menu': 'Menu',
      'nav.manifesto': 'Manifesto',
      'nav.modos': 'Modos',
      'nav.como': 'Como funciona',
      'modos.lede': 'Clique em um padrão para cobrir a tela com ele — a mesma fórmula, indo e voltando. Determinístico por célula, calculado inteiramente na GPU.',
      'm.diag.name': 'Diagonal',
      'm.diag.desc': 'Varredura 45° somando coluna + linha. O clássico da casa.',
      'm.radial.name': 'Radial',
      'm.radial.desc': 'Explosão do centro pela distância euclidiana das células.',
      'm.rand.name': 'Aleatório',
      'm.rand.desc': 'Hash determinístico por célula — sempre o mesmo padrão.',
      'm.cta': 'testar →',
      'how.1t': 'Um triângulo cobre o viewport',
      'how.1p': 'Três vértices <code>(-1,-1) (3,-1) (-1,3)</code> num VBO estático. A hipotenusa <code>x+y=2</code> nunca corta o quadrado NDC <code>[-1,1]²</code> — a viewport inteira cai dentro do triângulo. O vertex shader só passa a UV <code>[0,1]</code>.',
      'how.2t': 'Uma grade lógica, não DOM',
      'how.2p': '<code>48×28</code> no desktop, <code>34×24</code> no tablet, <code>24×38</code> no mobile. São números que vão para o uniform <code>u_grid</code> — nenhum elemento HTML nasce por bloco. O badge "células ativas" é literal: é o produto <code>colunas × linhas</code> da grade em uso.',
      'how.3t': 'Cada fragmento é uma célula',
      'how.3p': '<code>cell = floor(v_uv × u_grid)</code> e um atraso por célula: a diagonal soma coluna+linha; a radial usa a distância ao centro; o aleatório consulta um hash determinístico pela posição da célula. Zero <code>Math.random()</code>.',
      'how.4t': 'Easing e opacidade sem divisórias',
      'how.4p': '<code>t = (u_progress − delay) / interval</code>, rampa <code>easeOutExpo</code> no shader e saída <code>vec4(u_color, a)</code>. Cada fragmento é pintado com alpha — a grade é contígua por construção, sem linhas vazias entre blocos.',
      'how.5t': 'Cobre → troca → revela',
      'how.5p': 'A tela só é considerada coberta quando <code>u_progress = 1 + interval</code>: totalmente preta. Só então o conteúdo muda (<code>history.pushState</code> + rolagem, ou um <code>fetch</code> em páginas reais) e a revelação reutiliza o mesmo shader com progresso decrescente, sem recompilar.',
      'how.6t': 'Fallback e acessibilidade',
      'how.6p': 'WebGL 2 → WebGL 1 → cortina CSS por opacidade. E <code>prefers-reduced-motion</code> corta a animação e troca o conteúdo na hora — a navegação nunca depende do suporte gráfico.',
      'tut.flow.title': 'O ciclo da transição',
      'tut.flow.cover': 'cobrir',
      'tut.flow.cover.note': 'progresso 0 → 1',
      'tut.flow.swap': 'trocar',
      'tut.flow.swap.note': 'conteúdo entra em <code>swapAt = 1.0</code>',
      'tut.flow.reveal': 'revelar',
      'tut.flow.reveal.note': 'mesmo shader, progresso decrescente',
      'tut.flow.foot': 'Nada recopila: nos três estágios é o <em>mesmo programa</em> — só <code>u_progress</code> muda de direção.',
      'tut.gloss.title': 'Decifrando os uniformes',
      'tut.gloss.grid': 'colunas × linhas da grade lógica — desktop 48×28',
      'tut.gloss.progress': 'o relógio da fase — avança no cover, volta no reveal',
      'tut.gloss.interval': 'atraso entre células vizinhas — o "espaço" entre blocos',
      'tut.gloss.mode': 'o padrão de varredura: diagonal | radial | aleatório',
      'tut.gloss.ease': 'a rampa de entrada de cada bloco (expo | cubic | linear)',
      'tut.gloss.color': 'a cor dos blocos — ler do <code>--ink</code> do tema',
      'cta.title': 'Crie a sua.',
      'cta.sub': 'Um arquivo. Zero imagens. Um <code>requestAnimationFrame</code>.',
      'cta.top': 'Voltar ao topo ↑',
      'foot.show': 'PIXEL·TRAN — showcase',
      'foot.axio': 'AXIO · webgl pixel motif · 2026',
      'toast.load': 'Não foi possível carregar a página — veja o console.',
    },

    en: {
      'doc.title': 'PIXEL·TRAN — WebGL pixel transition',
      'meta.desc': 'PIXEL·TRAN — a WebGL pixel transition showcase. One draw call, millions of pixels, zero divs.',
      'theme.title': 'Toggle light/dark theme',
      'lang.label': 'Language',
      'lang.pt': 'Português',
      'lang.en': 'English',
      'lang.es': 'Español',
      'badges.est': 'est. 2026 — webgl native',
      'badges.cells': 'active cells',
      'hero.a': 'One draw',
      'hero.b': 'call.',
      'hero.c': 'Millions',
      'hero.d': 'of pixels.',
      'hero.lede': 'Each viewport fragment computes its cell, its delay and its opacity in parallel on the GPU. JavaScript only swaps <em>u_progress</em> and fires a single draw.',
      'cta.explore': 'Explore the modes ↓',
      'mq.1': 'one draw call', 'mq.2': '1 triangle', 'mq.3': 'zero divs',
      'mq.4': 'native gpu', 'mq.5': '60 fps', 'mq.6': 'cells in the shader',
      'man.1': 'Zero divs per pixel. No loop per cell in JavaScript.',
      'man.2': 'The grid lives in the fragment shader — <em>each fragment decides what it paints</em>.',
      'man.3': 'One draw call covers the screen. Millions of pixels, in parallel.',
      'stat.divs': 'divs in the dom',
      'stat.fps': 'target fps',
      'stat.modes': 'cover patterns',
      'stat.draws': 'draw call per frame',
      'sec.manifesto': 'Manifesto',
      'sec.modos': 'Modes',
      'sec.como': 'How it works',
      'nav.label': 'Navigation',
      'nav.ticker': 'one draw · millions of pixels',
      'nav.menu': 'Menu',
      'nav.manifesto': 'Manifesto',
      'nav.modos': 'Modes',
      'nav.como': 'How it works',
      'modos.lede': 'Click a pattern to cover the screen with it — the same formula, back and forth. Deterministic per cell, computed entirely on the GPU.',
      'm.diag.name': 'Diagonal',
      'm.diag.desc': 'A 45° sweep adding column + row. The house classic.',
      'm.radial.name': 'Radial',
      'm.radial.desc': 'Center burst by euclidean distance of cells.',
      'm.rand.name': 'Random',
      'm.rand.desc': 'Deterministic hash per cell — always the same pattern.',
      'm.cta': 'try →',
      'how.1t': 'One triangle covers the viewport',
      'how.1p': 'Three vertices <code>(-1,-1) (3,-1) (-1,3)</code> in a static VBO. The hypotenuse <code>x+y=2</code> never clips the NDC square <code>[-1,1]²</code> — the whole viewport falls inside the triangle. The vertex shader only passes the UV <code>[0,1]</code>.',
      'how.2t': 'A logical grid, not DOM',
      'how.2p': '<code>48×28</code> on desktop, <code>34×24</code> on tablet, <code>24×38</code> on mobile. Just numbers sent to the <code>u_grid</code> uniform — no HTML element is ever born per block. The "active cells" badge is literal: the product <code>columns × rows</code>.',
      'how.3t': 'Each fragment is a cell',
      'how.3p': '<code>cell = floor(v_uv × u_grid)</code> plus a per-cell delay: diagonal sums column+row; radial uses distance to center; random queries a deterministic hash by cell position. Zero <code>Math.random()</code>.',
      'how.4t': 'Easing and opacity, no seams',
      'how.4p': '<code>t = (u_progress − delay) / interval</code>, an <code>easeOutExpo</code> ramp in the shader and output <code>vec4(u_color, a)</code>. Every fragment is painted with alpha — the grid is contiguous by construction, with no empty lines between blocks.',
      'how.5t': 'Cover → swap → reveal',
      'how.5p': 'The screen only counts as covered once <code>u_progress = 1 + interval</code>: fully black. Only then does the content change (<code>history.pushState</code> + scrolling, or a <code>fetch</code> on real pages) and the reveal reuses the same shader with decreasing progress, no recompilation.',
      'how.6t': 'Fallback and accessibility',
      'how.6p': 'WebGL 2 → WebGL 1 → CSS opacity curtain. And <code>prefers-reduced-motion</code> skips the animation and swaps the content instantly — navigation never depends on graphics support.',
      'tut.flow.title': 'The transition cycle',
      'tut.flow.cover': 'cover',
      'tut.flow.cover.note': 'progress 0 → 1',
      'tut.flow.swap': 'swap',
      'tut.flow.swap.note': 'content swaps in at <code>swapAt = 1.0</code>',
      'tut.flow.reveal': 'reveal',
      'tut.flow.reveal.note': 'same shader, decreasing progress',
      'tut.flow.foot': 'Nothing gets recompiled: all three stages run the <em>same program</em> — only <code>u_progress</code> changes direction.',
      'tut.gloss.title': 'Deciphering the uniforms',
      'tut.gloss.grid': 'logical grid columns × rows — desktop 48×28',
      'tut.gloss.progress': 'the phase clock — runs forward on cover, rewinds on reveal',
      'tut.gloss.interval': 'neighbor-cell delay — the "spacing" between blocks',
      'tut.gloss.mode': 'the sweep pattern: diagonal | radial | random',
      'tut.gloss.ease': 'how each block eases in (expo | cubic | linear)',
      'tut.gloss.color': 'the block color — read from the theme <code>--ink</code>',
      'cta.title': 'Make yours.',
      'cta.sub': 'One file. Zero images. One <code>requestAnimationFrame</code>.',
      'cta.top': 'Back to top ↑',
      'foot.show': 'PIXEL·TRAN — showcase',
      'foot.axio': 'AXIO · webgl pixel motif · 2026',
      'toast.load': "Couldn't load the page — check the console.",
    },

    es: {
      'doc.title': 'PIXEL·TRAN — transición de píxeles en WebGL',
      'meta.desc': 'PIXEL·TRAN — showcase de transición de píxeles con WebGL. Un draw call, millones de píxeles, cero divs.',
      'theme.title': 'Cambiar tema claro/oscuro',
      'lang.label': 'Idioma',
      'lang.pt': 'Português',
      'lang.en': 'English',
      'lang.es': 'Español',
      'badges.est': 'est. 2026 — webgl native',
      'badges.cells': 'celdas activas',
      'hero.a': 'Un draw',
      'hero.b': 'call.',
      'hero.c': 'Millones',
      'hero.d': 'de píxeles.',
      'hero.lede': 'Cada fragmento del viewport calcula su celda, su retraso y su opacidad en paralelo en la GPU. JavaScript solo cambia <em>u_progress</em> y hace un único draw.',
      'cta.explore': 'Explorar los modos ↓',
      'mq.1': 'una llamada draw', 'mq.2': '1 triángulo', 'mq.3': 'cero divs',
      'mq.4': 'gpu nativa', 'mq.5': '60 fps', 'mq.6': 'celdas en el shader',
      'man.1': 'Cero divs por píxel. Ningún bucle por celda en JavaScript.',
      'man.2': 'La grilla vive en el fragment shader — <em>cada fragmento decide qué pinta</em>.',
      'man.3': 'Un draw call cubre la pantalla. Millones de píxeles, en paralelo.',
      'stat.divs': 'divs en el dom',
      'stat.fps': 'fps objetivo',
      'stat.modes': 'patrones de cobertura',
      'stat.draws': 'draw call por frame',
      'sec.manifesto': 'Manifiesto',
      'sec.modos': 'Modos',
      'sec.como': 'Cómo funciona',
      'nav.label': 'Navegación',
      'nav.ticker': 'un draw · millones de píxeles',
      'nav.menu': 'Menú',
      'nav.manifesto': 'Manifiesto',
      'nav.modos': 'Modos',
      'nav.como': 'Cómo funciona',
      'modos.lede': 'Haz clic en un patrón para cubrir la pantalla con él — la misma fórmula, de ida y vuelta. Determinístico por celda, calculado por completo en la GPU.',
      'm.diag.name': 'Diagonal',
      'm.diag.desc': 'Barrido a 45° sumando columna + fila. El clásico de la casa.',
      'm.radial.name': 'Radial',
      'm.radial.desc': 'Explosión desde el centro por distancia euclidiana de las celdas.',
      'm.rand.name': 'Aleatorio',
      'm.rand.desc': 'Hash determinístico por celda — siempre el mismo patrón.',
      'm.cta': 'probar →',
      'how.1t': 'Un triángulo cubre el viewport',
      'how.1p': 'Tres vértices <code>(-1,-1) (3,-1) (-1,3)</code> en un VBO estático. La hipotenusa <code>x+y=2</code> nunca corta el cuadrado NDC <code>[-1,1]²</code> — todo el viewport cae dentro del triángulo. El vertex shader solo pasa la UV <code>[0,1]</code>.',
      'how.2t': 'Una grilla lógica, no DOM',
      'how.2p': '<code>48×28</code> en desktop, <code>34×24</code> en tablet, <code>24×38</code> en móvil. Son números que van al uniform <code>u_grid</code> — ningún elemento HTML nace por bloque. La insignia "celdas activas" es literal: el producto <code>columnas × filas</code>.',
      'how.3t': 'Cada fragmento es una celda',
      'how.3p': '<code>cell = floor(v_uv × u_grid)</code> y un retraso por celda: la diagonal suma columna+fila; la radial usa la distancia al centro; el aleatorio consulta un hash determinístico según la posición de la celda. Cero <code>Math.random()</code>.',
      'how.4t': 'Easing y opacidad sin divisiones',
      'how.4p': '<code>t = (u_progress − delay) / interval</code>, rampa <code>easeOutExpo</code> en el shader y salida <code>vec4(u_color, a)</code>. Cada fragmento se pinta con alpha — la grilla es contigua por construcción, sin líneas vacías entre bloques.',
      'how.5t': 'Cubrir → cambiar → revelar',
      'how.5p': 'La pantalla solo cuenta como cubierta cuando <code>u_progress = 1 + interval</code>: totalmente negra. Recién entonces cambia el contenido (<code>history.pushState</code> + scroll, o un <code>fetch</code> en páginas reales) y la revelación reutiliza el mismo shader con progreso decreciente, sin recompilar.',
      'how.6t': 'Fallback y accesibilidad',
      'how.6p': 'WebGL 2 → WebGL 1 → cortina CSS por opacidad. Y <code>prefers-reduced-motion</code> corta la animación y cambia el contenido al instante — la navegación nunca depende del soporte gráfico.',
      'tut.flow.title': 'El ciclo de la transición',
      'tut.flow.cover': 'cubrir',
      'tut.flow.cover.note': 'progreso 0 → 1',
      'tut.flow.swap': 'intercambiar',
      'tut.flow.swap.note': 'el contenido entra en <code>swapAt = 1.0</code>',
      'tut.flow.reveal': 'revelar',
      'tut.flow.reveal.note': 'mismo shader, progreso decreciente',
      'tut.flow.foot': 'Nada se recompila: en las tres etapas es el <em>mismo programa</em> — solo <code>u_progress</code> cambia de dirección.',
      'tut.gloss.title': 'Descifrando los uniformes',
      'tut.gloss.grid': 'columnas × filas de la grilla lógica — desktop 48×28',
      'tut.gloss.progress': 'el reloj de la fase — avanza en cover, retrocede en reveal',
      'tut.gloss.interval': 'retraso entre celdas vecinas — el "espacio" entre bloques',
      'tut.gloss.mode': 'el patrón de barrido: diagonal | radial | aleatorio',
      'tut.gloss.ease': 'la rampa de entrada de cada bloque (expo | cubic | linear)',
      'tut.gloss.color': 'el color de los bloques — se lee del <code>--ink</code> del tema',
      'cta.title': 'Crea la tuya.',
      'cta.sub': 'Un archivo. Cero imágenes. Un <code>requestAnimationFrame</code>.',
      'cta.top': 'Volver arriba ↑',
      'foot.show': 'PIXEL·TRAN — showcase',
      'foot.axio': 'AXIO · webgl pixel motif · 2026',
      'toast.load': 'No se pudo cargar la página — revisa la consola.',
    },
  };

  const LANGS = ['pt-BR', 'en', 'es'];
  const STORE_KEY = 'px-trans-lang';
  const DOC_LANG = { 'pt-BR': 'pt-BR', en: 'en', es: 'es' };

  let current = (() => {
    try {
      const v = localStorage.getItem(STORE_KEY);
      if (LANGS.includes(v)) return v;
    } catch (e) {}
    return 'pt-BR';
  })();

  /* Aplica o idioma a <html>, título, metas, textos [data-i18n] ou [data-i18n-html] e atributos. */
  function apply() {
    const d = DICT[current];
    document.documentElement.lang = DOC_LANG[current];
    document.querySelectorAll('[data-i18n], [data-i18n-html]').forEach((el) => {
      const key = (el.dataset.i18n || el.dataset.i18nHtml || '').trim();
      if (!key) return;
      const val = d[key];
      if (val == null) return;
      const attrs = (el.dataset.i18nAttr || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (attrs.length) attrs.forEach((a) => el.setAttribute(a, val));
      else if (el.dataset.i18nHtml !== undefined) el.innerHTML = val;
      else el.textContent = val;
    });
    // Widget do seletor: código do idioma no botão + seleção destacada.
    const btn = document.getElementById('langBtn');
    const opts = document.querySelectorAll('#langMenu li[data-lang]');
    if (btn) btn.textContent = current.startsWith('pt') ? 'PT' : current.toUpperCase();
    opts.forEach((li) => li.setAttribute('aria-selected', String(li.dataset.lang === current)));
    // Textos mudados podem alterar larguras (ex.: marquee) → re-medições.
    window.dispatchEvent(new Event('resize'));
  }

  function set(lang) {
    if (!DICT[lang]) return;
    current = lang;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    // Troca de idioma também passa pela cortina de pixels (reduced-motion → instantâneo).
    const started = window.PixelTransition && typeof window.PixelTransition.launch === 'function'
      ? window.PixelTransition.launch(() => apply())
      : false;
    if (!started) { apply(); } // motor ocupado/indisponível → aplica na hora, nunca engole o clique
  }

  /* Widget no header: abre/fecha o menu e fecha por clique fora ou Esc.
     Anexado em DOMContentLoaded — este script roda no <head>, antes do DOM. */
  function initWidget() {
    const wrapper = document.getElementById('langSwitch');
    const btn = document.getElementById('langBtn');
    const menu = document.getElementById('langMenu');
    if (!wrapper || !btn || !menu) return;

    function toggle(force) {
      const open = force != null ? force : !wrapper.classList.contains('open');
      wrapper.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    }

    btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    menu.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-lang]');
      if (!li || li.dataset.lang === current) { toggle(false); return; }
      set(li.dataset.lang);
      toggle(false);
    });
    document.addEventListener('click', () => toggle(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
    apply();
  }

  window.addEventListener('DOMContentLoaded', initWidget);

  // Exposto para outros módulos (ex.: toast de erro do motor) e para debug.
  window.__pxLang = () => current;
  window.__pxT = (key) => (DICT[current] && DICT[current][key]) || key;
  window.__pxSetLang = set;
})();
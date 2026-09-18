/* Rastro do cursor (WebGL):
   - ring buffer com os últimos N samples de posição + rotação;
   - a cada frame: clear transparente + 1 drawArrays POR SAMPLE,
     com alpha decrescente (o "rastro" é a história recente do sprite);
   - o sprite vive no fragment shader (célula + rotação), sem VBO dinâmico. */
'use strict';

(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.PX) return;

  const { GLSL_VERT, makeProgram, makeFullscreenTriangle } = window.PX;

  const canvas = document.getElementById('fxCanvas');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false });
  if (!gl) return;

  /* Sprite: o fragmento testa a célula local no corpo do losango pixelado.
     u_alpha controla a intensidade de cada instância do rastro. */
  const OBJ = /* glsl */ `#version 300 es
    precision highp float;
    in vec2 v_uv;
    uniform vec2  u_resolution;
    uniform vec2  u_pointer;
    uniform float u_cell;
    uniform float u_rot;
    uniform float u_time;
    uniform float u_alpha;
    uniform vec3  u_tint;
    out vec4 outColor;
    void main() {
      vec2 pos = v_uv * u_resolution;        // CSS px do fragmento
      vec2 d   = (pos - u_pointer) / u_cell; // em células
      vec2 c   = floor(d);                   // célula do bloco
      float R  = 3.0 + 0.35 * sin(u_time * 2.2); // pulso suave
      float ca = cos(u_rot), sa = sin(u_rot);
      vec2 q   = mat2(ca, -sa, sa, ca) * c;  // rotação do sprite
      float a  = (abs(q.x) + abs(q.y)) < R ? 1.0 : 0.0; // losango
      outColor = vec4(u_tint, a * u_alpha);
    }
  `;

  const prog = makeProgram(gl, GLSL_VERT, OBJ);
  if (!prog) return;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const vbo = makeFullscreenTriangle(gl);

  const u = {
    res:   gl.getUniformLocation(prog, 'u_resolution'),
    ptr:   gl.getUniformLocation(prog, 'u_pointer'),
    cell:  gl.getUniformLocation(prog, 'u_cell'),
    rot:   gl.getUniformLocation(prog, 'u_rot'),
    time:  gl.getUniformLocation(prog, 'u_time'),
    alpha: gl.getUniformLocation(prog, 'u_alpha'),
    tint:  gl.getUniformLocation(prog, 'u_tint'),
  };

  const CELL = 12;             // px do "pixel" do objeto

  let px = innerWidth / 2, py = innerHeight / 2;
  let tx = px, ty = py;
  let time = 0, rot = 0, last = 0;
  let raf = 0;
  let visible = false; // só mostra o objeto depois de um mouse de verdade

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return; // toque/dedo → ignora
    visible = true;
    tx = e.clientX; ty = e.clientY;
  }, { passive: true });

  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function currentTheme() {
    if (window.__fxTheme) return window.__fxTheme;
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }
  function drawSprite(sx, sy, srot, a) {
    const dark = currentTheme() === 'dark';
    const tint = dark ? [0.92, 0.9, 0.86] : [0.0, 0.0, 0.0];
    gl.uniform2f(u.res, innerWidth, innerHeight);
    gl.uniform2f(u.ptr, sx, sy);
    gl.uniform1f(u.cell, CELL * (innerWidth > 768 ? 1 : 1.5));
    gl.uniform1f(u.rot, srot);
    gl.uniform1f(u.time, time);
    gl.uniform1f(u.alpha, a * (dark ? 0.45 : 1));
    gl.uniform3f(u.tint, tint[0], tint[1], tint[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (document.hidden) { last = t; return; }

    const dt = Math.min(0.064, (t - last) / 1000) || 0.016;
    last = t;
    time += dt;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!visible) return; // sem mouse → canvas transparente, objeto nunca aparece

    const alpha = 1 - Math.pow(0.02, dt); // perseguição suave, independente de FPS
    px += (tx - px) * alpha;
    py += (ty - py) * alpha;

    const speed = Math.hypot(tx - px, ty - py); // rotação ∝ velocidade, com teto
    rot += Math.min(2.6, 0.8 + speed / 90) * dt;

    // sem rastro: um único sprite na posição atual
    drawSprite(px, innerHeight - py, rot, 1);
  }

  raf = requestAnimationFrame(loop);
})();
/* Helpers WebGL compartilhados entre o rastro do cursor e a transição
   pixelada. Expostos em window.PX para carregamento simples por <script>. */
'use strict';

const GLSL_VERT = /* glsl */ `#version 300 es
  layout(location = 0) in vec2 a_pos;
  out vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('[px] shader:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function makeProgram(gl, vsSrc, fsSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('[px] link:', gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

function makeFullscreenTriangle(gl) {
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  return vbo;
}

window.PX = { GLSL_VERT, compileShader, makeProgram, makeFullscreenTriangle };
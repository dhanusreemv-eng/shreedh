/**
 * Lightfall.js — Standalone WebGL background for the Hero section
 * Ported from the React/OGL Lightfall component to vanilla JS.
 * Uses raw WebGL (no external dependencies).
 *
 * Usage: called automatically on DOMContentLoaded.
 * The canvas is injected into #lightfall-bg inside the #home section.
 */

(function () {
  'use strict';

  /* ─── Configuration ──────────────────────────────────────────────── */
  const CONFIG = {
    colors:          ['#A6C8FF', '#5227FF', '#FF9FFC'],
    backgroundColor: '#0A29FF',
    speed:           0.5,
    streakCount:     2,
    streakWidth:     1.0,
    streakLength:    1.0,
    glow:            1.0,
    density:         0.6,
    twinkle:         1.0,
    zoom:            3.0,
    backgroundGlow:  0.5,
    opacity:         1.0,
    mouseInteraction:true,
    mouseStrength:   0.5,
    mouseRadius:     1.0,
    mouseDampening:  0.15,
  };

  /* ─── Helpers ────────────────────────────────────────────────────── */
  const MAX_COLORS = 8;

  function hexToRGB(hex) {
    const c = hex.replace('#', '').padEnd(6, '0');
    return [
      parseInt(c.slice(0, 2), 16) / 255,
      parseInt(c.slice(2, 4), 16) / 255,
      parseInt(c.slice(4, 6), 16) / 255,
    ];
  }

  function prepColors(input) {
    const base = (input && input.length ? input : ['#A6C8FF', '#5227FF', '#FF9FFC']).slice(0, MAX_COLORS);
    const count = base.length;
    const arr = [];
    for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRGB(base[Math.min(i, base.length - 1)]));
    const avg = [0, 0, 0];
    for (let i = 0; i < count; i++) { avg[0] += arr[i][0]; avg[1] += arr[i][1]; avg[2] += arr[i][2]; }
    avg[0] /= count; avg[1] /= count; avg[2] /= count;
    return { arr, count, avg };
  }

  /* ─── Shaders ────────────────────────────────────────────────────── */
  const VERTEX_SRC = `
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SRC = `
    precision highp float;

    uniform vec3  iResolution;
    uniform vec2  iMouse;
    uniform float iTime;

    uniform vec3  uColor0; uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3;
    uniform vec3  uColor4; uniform vec3 uColor5; uniform vec3 uColor6; uniform vec3 uColor7;
    uniform int   uColorCount;

    uniform vec3  uBgColor;
    uniform vec3  uMouseColor;
    uniform float uSpeed;
    uniform int   uStreakCount;
    uniform float uStreakWidth;
    uniform float uStreakLength;
    uniform float uGlow;
    uniform float uDensity;
    uniform float uTwinkle;
    uniform float uZoom;
    uniform float uBgGlow;
    uniform float uOpacity;
    uniform float uMouseEnabled;
    uniform float uMouseStrength;
    uniform float uMouseRadius;

    varying vec2 vUv;

    vec3 palette(float h) {
      int count = uColorCount;
      if (count < 1) count = 1;
      int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
      if (idx <= 0) return uColor0;
      if (idx == 1) return uColor1;
      if (idx == 2) return uColor2;
      if (idx == 3) return uColor3;
      if (idx == 4) return uColor4;
      if (idx == 5) return uColor5;
      if (idx == 6) return uColor6;
      return uColor7;
    }

    vec3 tanhv(vec3 x) {
      vec3 e = exp(-2.0 * x);
      return (1.0 - e) / (1.0 + e);
    }

    vec2 sceneC(vec2 frag, vec2 r) {
      vec2 P = (frag + frag - r) / r.x;
      float z = 0.0;
      float d = 1e3;
      vec4 O = vec4(0.0);
      for (int k = 0; k < 39; k++) {
        if (d <= 1e-4) break;
        O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
        d = 1.0 - sqrt(length(O * O));
        z += d;
      }
      return vec2(O.x, atan(O.z, O.y));
    }

    void mainImage(out vec4 o, vec2 C) {
      vec2 r = iResolution.xy;
      vec2 uv0 = (C + C - r) / r.x;
      float T = 0.1 * iTime * uSpeed + 9.0;
      float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
      vec2 Y = vec2(5e-3, 6.28318530718 / angRings);

      vec2 c0  = sceneC(C, r);
      vec2 cdx = sceneC(C + vec2(1.0, 0.0), r);
      vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
      vec2 dCx = cdx - c0;
      vec2 dCy = cdy - c0;
      dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5);
      dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
      vec2 fw = abs(dCx) + abs(dCy);
      C = c0;

      vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
      vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P, P) + 6.0), 0.0);

      float mGlow = 0.0;
      if (uMouseEnabled > 0.5) {
        vec2 mN = (iMouse + iMouse - r) / r.x;
        float md = length(uv0 - mN);
        mGlow = exp(-md * md / max(uMouseRadius * uMouseRadius, 1e-4)) * uMouseStrength;
        O.rgb += uMouseColor * mGlow * 0.25;
      }

      float zr  = 5e-4 * uStreakWidth;
      vec2  rr  = vec2(max(length(fw), 1e-5));
      float tail = 19.0 / max(uStreakLength, 0.05);

      for (int m = 0; m < 16; m++) {
        if (m >= uStreakCount) break;
        float jf = float(m) + 1.0;
        float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
        vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
        Pp -= floor(Pp / Y + 0.5) * Y;
        float h   = fract(8663.0 * ic);
        vec3  col = palette(h);
        float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle);
        weight *= (1.0 + mGlow * 2.0);
        vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
        vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
        O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
        C.x += Y.x / 8.0;
      }

      vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
      o = vec4(colr, uOpacity);
    }

    void main() {
      vec4 color;
      mainImage(color, vUv * iResolution.xy);
      gl_FragColor = color;
    }
  `;

  /* ─── Main Init ──────────────────────────────────────────────────── */
  function initLightfall() {
    const wrapper = document.getElementById('lightfall-bg');
    if (!wrapper) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'lightfall-canvas';
    wrapper.appendChild(canvas);

    // WebGL context
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('Lightfall: WebGL not supported');
      wrapper.style.display = 'none';
      return;
    }

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    /* ── Compile shaders ── */
    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Lightfall shader error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER,   VERTEX_SRC));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SRC));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Lightfall link error:', gl.getProgramInfoLog(program));
      return;
    }

    /* ── Full-screen quad (positions + UVs) ── */
    // Two triangles covering the entire clip space
    const vertices = new Float32Array([
      -1, -1,  0, 0,
       1, -1,  1, 0,
      -1,  1,  0, 1,
       1,  1,  1, 1,
    ]);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    const uvLoc  = gl.getAttribLocation(program, 'uv');
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(uvLoc,  2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(uvLoc);

    gl.useProgram(program);

    /* ── Uniform helpers ── */
    const loc   = name => gl.getUniformLocation(program, name);
    const set1f = (name, v) => gl.uniform1f(loc(name), v);
    const set1i = (name, v) => gl.uniform1i(loc(name), v);
    const set3f = (name, v) => gl.uniform3f(loc(name), v[0], v[1], v[2]);
    const set2f = (name, x, y) => gl.uniform2f(loc(name), x, y);

    /* ── Colours ── */
    const { arr, count, avg } = prepColors(CONFIG.colors);
    set3f('uColor0', arr[0]); set3f('uColor1', arr[1]);
    set3f('uColor2', arr[2]); set3f('uColor3', arr[3]);
    set3f('uColor4', arr[4]); set3f('uColor5', arr[5]);
    set3f('uColor6', arr[6]); set3f('uColor7', arr[7]);
    set1i('uColorCount', count);
    set3f('uBgColor',    hexToRGB(CONFIG.backgroundColor));
    set3f('uMouseColor', avg);

    /* ── Effect uniforms ── */
    set1f('uSpeed',       CONFIG.speed);
    set1i('uStreakCount', Math.max(1, Math.min(16, Math.round(CONFIG.streakCount))));
    set1f('uStreakWidth',  CONFIG.streakWidth);
    set1f('uStreakLength', CONFIG.streakLength);
    set1f('uGlow',         CONFIG.glow);
    set1f('uDensity',      CONFIG.density);
    set1f('uTwinkle',      CONFIG.twinkle);
    set1f('uZoom',         CONFIG.zoom);
    set1f('uBgGlow',       CONFIG.backgroundGlow);
    set1f('uOpacity',      CONFIG.opacity);
    set1f('uMouseEnabled', CONFIG.mouseInteraction ? 1.0 : 0.0);
    set1f('uMouseStrength',CONFIG.mouseStrength);
    set1f('uMouseRadius',  CONFIG.mouseRadius);

    /* ── Resolution uniform ── */
    const resLoc  = loc('iResolution');
    const timeLoc = loc('iTime');

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = wrapper.clientWidth;
      const h = wrapper.clientHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform3f(resLoc, canvas.width, canvas.height, 1.0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();

    /* ── Mouse tracking ── */
    let mouseTarget = [0, 0];
    let mouseCurrent = [0, 0];
    let lastT = 0;

    if (CONFIG.mouseInteraction) {
      wrapper.addEventListener('pointermove', e => {
        const rect = canvas.getBoundingClientRect();
        const dpr  = window.devicePixelRatio || 1;
        mouseTarget[0] = (e.clientX - rect.left) * dpr;
        mouseTarget[1] = (rect.height - (e.clientY - rect.top)) * dpr;
      });
    }

    /* ── Render loop ── */
    let rafId;
    function loop(t) {
      rafId = requestAnimationFrame(loop);
      gl.uniform1f(timeLoc, t * 0.001);

      // Dampen mouse
      if (CONFIG.mouseDampening > 0 && CONFIG.mouseInteraction) {
        const dt = lastT ? (t - lastT) / 1000 : 0;
        lastT = t;
        const tau = Math.max(1e-4, CONFIG.mouseDampening);
        const factor = Math.min(1, 1 - Math.exp(-dt / tau));
        mouseCurrent[0] += (mouseTarget[0] - mouseCurrent[0]) * factor;
        mouseCurrent[1] += (mouseTarget[1] - mouseCurrent[1]) * factor;
      } else {
        lastT = t;
        mouseCurrent[0] = mouseTarget[0];
        mouseCurrent[1] = mouseTarget[1];
      }
      set2f('iMouse', mouseCurrent[0], mouseCurrent[1]);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    rafId = requestAnimationFrame(loop);

    // Cleanup on page unload (optional)
    window.addEventListener('beforeunload', () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    });
  }

  /* ─── Boot ───────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightfall);
  } else {
    initLightfall();
  }

})();

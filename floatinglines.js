/**
 * FloatingLines.js — Vanilla JS / Three.js port
 * Renders animated floating wave lines via WebGL shader on the hero section.
 * Requires Three.js to be loaded globally (THREE) before this script.
 *
 * Mounts automatically into #hero-bg on DOMContentLoaded.
 */

(function () {
  'use strict';

  /* ─── Configuration (mirrors the React component props) ─────────── */
  const CONFIG = {
    enabledWaves:      ['top', 'middle', 'bottom'],
    lineCount:         8,           // same count for all waves
    lineDistance:      8,           // same distance for all waves
    bendRadius:        8,
    bendStrength:      -2,
    interactive:       true,
    parallax:          true,
    animationSpeed:    1,
    gradientStart:     '#e945f5',
    gradientMid:       '#6f6f6f',
    gradientEnd:       '#6a6a6a',
    mouseDamping:      0.05,
    parallaxStrength:  0.2,
  };

  /* ─── Helpers ────────────────────────────────────────────────────── */
  const MAX_GRADIENT_STOPS = 8;

  function hexToVec3(hex) {
    let v = hex.trim().replace('#', '');
    if (v.length === 3) v = v[0]+v[0]+v[1]+v[1]+v[2]+v[2];
    return new THREE.Vector3(
      parseInt(v.slice(0,2),16)/255,
      parseInt(v.slice(2,4),16)/255,
      parseInt(v.slice(4,6),16)/255
    );
  }

  function getLineCount(waveType) {
    if (typeof CONFIG.lineCount === 'number') return CONFIG.lineCount;
    const i = CONFIG.enabledWaves.indexOf(waveType);
    return (i >= 0 ? CONFIG.lineCount[i] : null) ?? 6;
  }

  function getLineDistance(waveType) {
    if (typeof CONFIG.lineDistance === 'number') return CONFIG.lineDistance;
    const i = CONFIG.enabledWaves.indexOf(waveType);
    return (i >= 0 ? CONFIG.lineDistance[i] : null) ?? 5;
  }

  /* ─── Shaders ────────────────────────────────────────────────────── */
  const VERTEX_SRC = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

  const FRAGMENT_SRC = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2  iMouse;
uniform bool  interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool  parallax;
uniform float parallaxStrength;
uniform vec2  parallaxOffset;

uniform vec3 lineGradient[8];
uniform int  lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;
  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) return baseColor;

  vec3 gradientColor;
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled   = clampedT * float(lineGradientCount - 1);
    int   idx      = int(floor(scaled));
    float f        = fract(scaled);
    int   idx2     = min(idx + 1, lineGradientCount - 1);
    vec3  c1 = lineGradient[idx];
    vec3  c2 = lineGradient[idx2];
    gradientColor = mix(c1, c2, f);
  }
  return gradientColor * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time       = iTime * animationSpeed;
  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2  d         = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    float bendOff   = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOff;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;

  if (parallax) baseUv += parallaxOffset;

  vec3 col = vec3(0.0);
  vec3 b   = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi  = float(i);
      float t   = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lc   = getLineColor(t, b);
      float ang = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv  = baseUv * rotate(ang);
      col += lc * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi, baseUv, mouseUv, interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi  = float(i);
      float t   = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lc   = getLineColor(t, b);
      float ang = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv  = baseUv * rotate(ang);
      col += lc * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi, baseUv, mouseUv, interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi  = float(i);
      float t   = fi / max(float(topLineCount - 1), 1.0);
      vec3 lc   = getLineColor(t, b);
      float ang = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv  = baseUv * rotate(ang);
      ruv.x *= -1.0;
      col += lc * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi, baseUv, mouseUv, interactive
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

  /* ─── Main Init ──────────────────────────────────────────────────── */
  function initFloatingLines() {
    const container = document.getElementById('hero-bg');
    if (!container) return;

    if (typeof THREE === 'undefined') {
      console.warn('FloatingLines: THREE.js not loaded');
      return;
    }

    /* ── Wave counts / distances ── */
    const waves = CONFIG.enabledWaves;
    const topLineCount    = waves.includes('top')    ? getLineCount('top')    : 0;
    const middleLineCount = waves.includes('middle') ? getLineCount('middle') : 0;
    const bottomLineCount = waves.includes('bottom') ? getLineCount('bottom') : 0;

    const topLineDistance    = (waves.includes('top')    ? getLineDistance('top')    : 5) * 0.01;
    const middleLineDistance = (waves.includes('middle') ? getLineDistance('middle') : 5) * 0.01;
    const bottomLineDistance = (waves.includes('bottom') ? getLineDistance('bottom') : 5) * 0.01;

    /* ── Gradient stops ── */
    const gradientHexes = [CONFIG.gradientStart, CONFIG.gradientMid, CONFIG.gradientEnd].filter(Boolean);
    const gradientVecs  = Array.from({ length: MAX_GRADIENT_STOPS }, () => new THREE.Vector3(1,1,1));
    gradientHexes.slice(0, MAX_GRADIENT_STOPS).forEach((h, i) => {
      const v = hexToVec3(h);
      gradientVecs[i].set(v.x, v.y, v.z);
    });

    /* ── Three.js setup ── */
    const scene    = new THREE.Scene();
    const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset    = '0';
    renderer.domElement.style.width    = '100%';
    renderer.domElement.style.height   = '100%';
    container.appendChild(renderer.domElement);

    /* ── Uniforms ── */
    const uniforms = {
      iTime:              { value: 0 },
      iResolution:        { value: new THREE.Vector3(1, 1, 1) },
      animationSpeed:     { value: CONFIG.animationSpeed },

      enableTop:          { value: waves.includes('top') },
      enableMiddle:       { value: waves.includes('middle') },
      enableBottom:       { value: waves.includes('bottom') },

      topLineCount:       { value: topLineCount },
      middleLineCount:    { value: middleLineCount },
      bottomLineCount:    { value: bottomLineCount },

      topLineDistance:    { value: topLineDistance },
      middleLineDistance: { value: middleLineDistance },
      bottomLineDistance: { value: bottomLineDistance },

      topWavePosition:    { value: new THREE.Vector3(10.0,  0.5, -0.4) },
      middleWavePosition: { value: new THREE.Vector3( 5.0,  0.0,  0.2) },
      bottomWavePosition: { value: new THREE.Vector3( 2.0, -0.7,  0.4) },

      iMouse:             { value: new THREE.Vector2(-1000, -1000) },
      interactive:        { value: CONFIG.interactive },
      bendRadius:         { value: CONFIG.bendRadius },
      bendStrength:       { value: CONFIG.bendStrength },
      bendInfluence:      { value: 0 },

      parallax:           { value: CONFIG.parallax },
      parallaxStrength:   { value: CONFIG.parallaxStrength },
      parallaxOffset:     { value: new THREE.Vector2(0, 0) },

      lineGradient:       { value: gradientVecs },
      lineGradientCount:  { value: gradientHexes.length },
    };

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX_SRC, fragmentShader: FRAGMENT_SRC });
    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    /* ── Resize ── */
    function setSize() {
      const w = container.clientWidth  || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      const cw = renderer.domElement.width;
      const ch = renderer.domElement.height;
      uniforms.iResolution.value.set(cw, ch, 1);
    }
    setSize();

    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    /* ── Mouse / parallax tracking (damped) ── */
    const targetMouse    = new THREE.Vector2(-1000, -1000);
    const currentMouse   = new THREE.Vector2(-1000, -1000);
    const targetParallax = new THREE.Vector2(0, 0);
    const currentParallax= new THREE.Vector2(0, 0);
    let   targetInfluence  = 0;
    let   currentInfluence = 0;

    function onPointerMove(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      const dpr  = renderer.getPixelRatio();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;
      targetMouse.set(x * dpr, (rect.height - y) * dpr);
      targetInfluence = 1.0;

      if (CONFIG.parallax) {
        const cx = rect.width  / 2;
        const cy = rect.height / 2;
        targetParallax.set(
          ((x - cx) / rect.width)  *  CONFIG.parallaxStrength,
          ((y - cy) / rect.height) * -CONFIG.parallaxStrength
        );
      }
    }

    function onPointerLeave() { targetInfluence = 0; }

    if (CONFIG.interactive) {
      renderer.domElement.addEventListener('pointermove',  onPointerMove);
      renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    }

    /* ── Render loop ── */
    const clock = new THREE.Clock();
    let rafId;

    function loop() {
      rafId = requestAnimationFrame(loop);
      uniforms.iTime.value = clock.getElapsedTime();

      if (CONFIG.interactive) {
        currentMouse.lerp(targetMouse, CONFIG.mouseDamping);
        uniforms.iMouse.value.copy(currentMouse);

        currentInfluence += (targetInfluence - currentInfluence) * CONFIG.mouseDamping;
        uniforms.bendInfluence.value = currentInfluence;
      }

      if (CONFIG.parallax) {
        currentParallax.lerp(targetParallax, CONFIG.mouseDamping);
        uniforms.parallaxOffset.value.copy(currentParallax);
      }

      renderer.render(scene, camera);
    }
    rafId = requestAnimationFrame(loop);

    /* ── Cleanup ── */
    window.addEventListener('beforeunload', () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    });
  }

  /* ─── Boot ───────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingLines);
  } else {
    initFloatingLines();
  }

})();

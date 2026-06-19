import { Renderer, Program, Mesh, Triangle } from 'ogl';

function hexToVec3(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  ];
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uRingCount;
uniform float uSpokeCount;
uniform float uRingThickness;
uniform float uSpokeThickness;
uniform float uSweepSpeed;
uniform float uSweepWidth;
uniform float uSweepLobes;
uniform vec3 uColor;
uniform vec3 uBgColor;
uniform float uFalloff;
uniform float uBrightness;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318530718
#define PI 3.14159265359

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  st = st * 2.0 - 1.0;
  st.x *= uResolution.x / uResolution.y;

  if (uEnableMouse) {
    vec2 mShift = (uMouse * 2.0 - 1.0);
    mShift.x *= uResolution.x / uResolution.y;
    st -= mShift * uMouseInfluence;
  }

  st *= uScale;

  float dist = length(st);
  float theta = atan(st.y, st.x);
  float t = uTime * uSpeed;

  float ringPhase = dist * uRingCount - t;
  float ringDist = abs(fract(ringPhase) - 0.5);
  float ringGlow = 1.0 - smoothstep(0.0, uRingThickness, ringDist);

  float spokeAngle = abs(fract(theta * uSpokeCount / TAU + 0.5) - 0.5) * TAU / uSpokeCount;
  float arcDist = spokeAngle * dist;
  float spokeGlow = (1.0 - smoothstep(0.0, uSpokeThickness, arcDist)) * smoothstep(0.0, 0.1, dist);

  float sweepPhase = t * uSweepSpeed;
  float sweepBeam = pow(max(0.5 * sin(uSweepLobes * theta + sweepPhase) + 0.5, 0.0), uSweepWidth);

  float fade = smoothstep(1.05, 0.85, dist) * pow(max(1.0 - dist, 0.0), uFalloff);

  float intensity = max((ringGlow + spokeGlow + sweepBeam) * fade * uBrightness, 0.0);
  vec3 col = uColor * intensity + uBgColor;

  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

export class Radar {
  constructor(container, options = {}) {
    this.container = container;
    
    const defaultOptions = {
      speed: 0.3,
      scale: 0.4,
      ringCount: 7.0,
      spokeCount: 7.0,
      ringThickness: 0.04,
      spokeThickness: 0.01,
      sweepSpeed: 0.9,
      sweepWidth: 3.0,
      sweepLobes: 1.0,
      color: '#045ced',
      backgroundColor: '#000000',
      falloff: 2.0,
      brightness: 1.0,
      enableMouseInteraction: true,
      mouseInfluence: 0.1
    };
    
    this.options = { ...defaultOptions, ...options };
    
    this.renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    
    this.currentMouse = [0.5, 0.5];
    this.targetMouse = [0.5, 0.5];
    
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.resize = this.resize.bind(this);
    this.update = this.update.bind(this);
    
    this.init();
  }
  
  init() {
    window.addEventListener('resize', this.resize);
    
    const geometry = new Triangle(this.gl);
    this.program = new Program(this.gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [this.gl.canvas.width, this.gl.canvas.height, this.gl.canvas.width / this.gl.canvas.height] },
        uSpeed: { value: this.options.speed },
        uScale: { value: this.options.scale },
        uRingCount: { value: this.options.ringCount },
        uSpokeCount: { value: this.options.spokeCount },
        uRingThickness: { value: this.options.ringThickness },
        uSpokeThickness: { value: this.options.spokeThickness },
        uSweepSpeed: { value: this.options.sweepSpeed },
        uSweepWidth: { value: this.options.sweepWidth },
        uSweepLobes: { value: this.options.sweepLobes },
        uColor: { value: hexToVec3(this.options.color) },
        uBgColor: { value: hexToVec3(this.options.backgroundColor) },
        uFalloff: { value: this.options.falloff },
        uBrightness: { value: this.options.brightness },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseInfluence: { value: this.options.mouseInfluence },
        uEnableMouse: { value: this.options.enableMouseInteraction }
      }
    });
    
    this.mesh = new Mesh(this.gl, { geometry, program: this.program });
    
    // Add radar-container class to the canvas wrapper
    this.canvasWrapper = document.createElement('div');
    this.canvasWrapper.className = 'radar-container';
    this.canvasWrapper.appendChild(this.gl.canvas);
    this.container.appendChild(this.canvasWrapper);
    
    this.resize();
    
    if (this.options.enableMouseInteraction) {
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseleave', this.handleMouseLeave);
    }
    
    this.animationFrameId = requestAnimationFrame(this.update);
  }
  
  handleMouseMove(e) {
    this.targetMouse = [
      e.clientX / window.innerWidth,
      1.0 - (e.clientY / window.innerHeight)
    ];
  }
  
  handleMouseLeave() {
    this.targetMouse = [0.5, 0.5];
  }
  
  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.program) {
      this.program.uniforms.uResolution.value = [this.gl.canvas.width, this.gl.canvas.height, this.gl.canvas.width / this.gl.canvas.height];
    }
  }
  
  update(time) {
    this.animationFrameId = requestAnimationFrame(this.update);
    this.program.uniforms.uTime.value = time * 0.001;
    
    if (this.options.enableMouseInteraction) {
      this.currentMouse[0] += 0.05 * (this.targetMouse[0] - this.currentMouse[0]);
      this.currentMouse[1] += 0.05 * (this.targetMouse[1] - this.currentMouse[1]);
      this.program.uniforms.uMouse.value[0] = this.currentMouse[0];
      this.program.uniforms.uMouse.value[1] = this.currentMouse[1];
    } else {
      this.program.uniforms.uMouse.value[0] = 0.5;
      this.program.uniforms.uMouse.value[1] = 0.5;
    }
    
    this.renderer.render({ scene: this.mesh });
  }
  
  destroy() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.resize);
    if (this.options.enableMouseInteraction) {
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseleave', this.handleMouseLeave);
    }
    if (this.canvasWrapper && this.canvasWrapper.parentNode) {
      this.canvasWrapper.parentNode.removeChild(this.canvasWrapper);
    }
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

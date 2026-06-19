import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';

const defaultColors = ['#ffffff', '#ffffff', '#ffffff'];

const hexToRgb = hex => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(c => c + c)
      .join('');
  }
  const int = parseInt(hex, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    
    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

export class ParticlesBackground {
    constructor(container, options = {}) {
        this.container = container;
        this.particleCount = options.particleCount !== undefined ? options.particleCount : 200;
        this.particleSpread = options.particleSpread !== undefined ? options.particleSpread : 10;
        this.speed = options.speed !== undefined ? options.speed : 0.1;
        this.particleColors = options.particleColors || defaultColors;
        this.moveParticlesOnHover = options.moveParticlesOnHover !== undefined ? options.moveParticlesOnHover : false;
        this.particleHoverFactor = options.particleHoverFactor !== undefined ? options.particleHoverFactor : 1;
        this.alphaParticles = options.alphaParticles !== undefined ? options.alphaParticles : false;
        this.particleBaseSize = options.particleBaseSize !== undefined ? options.particleBaseSize : 100;
        this.sizeRandomness = options.sizeRandomness !== undefined ? options.sizeRandomness : 1;
        this.cameraDistance = options.cameraDistance !== undefined ? options.cameraDistance : 20;
        this.disableRotation = options.disableRotation !== undefined ? options.disableRotation : false;
        this.pixelRatio = options.pixelRatio || (window.devicePixelRatio || 1);
        
        this.mouse = { x: 0, y: 0 };
        
        this.init();
    }

    init() {
        this.renderer = new Renderer({
            dpr: this.pixelRatio,
            depth: false,
            alpha: true
        });
        const gl = this.renderer.gl;
        this.gl = gl;
        
        gl.canvas.style.position = 'absolute';
        gl.canvas.style.inset = '0';
        gl.canvas.style.width = '100%';
        gl.canvas.style.height = '100%';
        gl.canvas.style.pointerEvents = 'none';
        
        this.container.appendChild(gl.canvas);
        gl.clearColor(0, 0, 0, 0);

        this.camera = new Camera(gl, { fov: 15 });
        this.camera.position.set(0, 0, this.cameraDistance);

        this.resizeHandler = this.resize.bind(this);
        window.addEventListener('resize', this.resizeHandler, false);
        this.resize();

        this.mouseMoveHandler = e => {
            const rect = this.container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
            this.mouse = { x, y };
        };

        if (this.moveParticlesOnHover) {
            window.addEventListener('mousemove', this.mouseMoveHandler);
        }

        const count = this.particleCount;
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count * 4);
        const colors = new Float32Array(count * 3);
        const palette = this.particleColors && this.particleColors.length > 0 ? this.particleColors : defaultColors;

        for (let i = 0; i < count; i++) {
            let x, y, z, len;
            do {
                x = Math.random() * 2 - 1;
                y = Math.random() * 2 - 1;
                z = Math.random() * 2 - 1;
                len = x * x + y * y + z * z;
            } while (len > 1 || len === 0);
            const r = Math.cbrt(Math.random());
            positions.set([x * r, y * r, z * r], i * 3);
            randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
            const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
            colors.set(col, i * 3);
        }

        const geometry = new Geometry(gl, {
            position: { size: 3, data: positions },
            random: { size: 4, data: randoms },
            color: { size: 3, data: colors }
        });

        this.program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uSpread: { value: this.particleSpread },
                uBaseSize: { value: this.particleBaseSize * this.pixelRatio },
                uSizeRandomness: { value: this.sizeRandomness },
                uAlphaParticles: { value: this.alphaParticles ? 1 : 0 }
            },
            transparent: true,
            depthTest: false
        });

        this.particles = new Mesh(gl, { mode: gl.POINTS, geometry, program: this.program });

        this.lastTime = performance.now();
        this.elapsed = 0;
        
        this.render = this.render.bind(this);
        this.rafId = requestAnimationFrame(this.render);
    }

    resize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.renderer.setSize(width, height);
        this.camera.perspective({ aspect: this.gl.canvas.width / this.gl.canvas.height });
    }

    render(t) {
        this.rafId = requestAnimationFrame(this.render);
        const delta = t - this.lastTime;
        this.lastTime = t;
        this.elapsed += delta * this.speed;

        this.program.uniforms.uTime.value = this.elapsed * 0.001;

        if (this.moveParticlesOnHover) {
            this.particles.position.x = -this.mouse.x * this.particleHoverFactor;
            this.particles.position.y = -this.mouse.y * this.particleHoverFactor;
        } else {
            this.particles.position.x = 0;
            this.particles.position.y = 0;
        }

        if (!this.disableRotation) {
            this.particles.rotation.x = Math.sin(this.elapsed * 0.0002) * 0.1;
            this.particles.rotation.y = Math.cos(this.elapsed * 0.0005) * 0.15;
            this.particles.rotation.z += 0.01 * this.speed;
        }

        this.renderer.render({ scene: this.particles, camera: this.camera });
    }

    destroy() {
        cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', this.resizeHandler);
        if (this.moveParticlesOnHover) {
            window.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.container.contains(this.gl.canvas)) {
            this.container.removeChild(this.gl.canvas);
        }
    }
}

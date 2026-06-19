import { Radar } from './radar.js';
import { GalaxyBackground } from './galaxy.js';

class BackgroundSystem {
    constructor() {
        this.container = document.getElementById('dynamic-bg-container');
        this.currentType = 0; // Forcing Galaxy background
        localStorage.setItem('bg-type', 0);
        this.backgrounds = [
            'Galaxy',
            'Animated Gradient',
            'Hexagonal Grid',
            'Neon Glow Waves',
            'Particle',
            'Starfield',
            'Radar'
        ];
        this.activeInstance = null;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        const toggleBtn = document.getElementById('bg-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.changeBackground();
            });
        }
        
        // Listen to theme changes to update background colors if needed
        window.addEventListener('themeChanged', () => {
            if (this.currentType === 2 || this.currentType === 3) {
                // Restart canvas-based theme-dependent backgrounds
                this.applyBackground(this.currentType);
            }
        });

        this.applyBackground(this.currentType);
    }

    changeBackground() {
        this.currentType = (this.currentType + 1) % this.backgrounds.length;
        localStorage.setItem('bg-type', this.currentType);
        this.applyBackground(this.currentType);
    }

    clearBackground() {
        // Stop any running animations
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Cleanup active instance (like Radar)
        if (this.activeInstance && typeof this.activeInstance.destroy === 'function') {
            this.activeInstance.destroy();
            this.activeInstance = null;
        }

        // Clear container HTML and inline styles
        this.container.innerHTML = '';
        this.container.className = 'dynamic-bg-container';
        this.container.style = '';
    }

    applyBackground(type) {
        this.clearBackground();
        
        // Create canvas if needed by the background type
        let canvas, ctx;
        if ([2, 3, 4, 5].includes(type)) {
            canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
            this.container.appendChild(canvas);
            
            if (type !== 3) { // 3 is WebGL
                ctx = canvas.getContext('2d');
            }
        }

        switch(type) {
            case 0:
                this.initGalaxy();
                break;
            case 1:
                this.initAnimatedGradient();
                break;
            case 2:
                this.initHexagonalGrid(canvas, ctx);
                break;
            case 3:
                this.initNeonGlowWaves(canvas);
                break;
            case 4:
                this.initParticleBackground(canvas, ctx);
                break;
            case 5:
                this.initStarfield(canvas, ctx);
                break;
            case 6:
                this.initRadar();
                break;
        }
    }

    // 0. Galaxy
    initGalaxy() {
        this.activeInstance = new GalaxyBackground(this.container, {
            density: 1.5,
            glowIntensity: 0.5,
            hueShift: 240,
            saturation: 0.8,
            transparent: true
        });
    }

    // 0. Animated Gradient
    initAnimatedGradient() {
        this.container.classList.add('bg-animated-gradient');
    }

    // 1. Hexagonal Grid (adapted from original)
    initHexagonalGrid(canvas, ctx) {
        let width, height;
        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        let time = 0;
        const hexSize = 40;

        const drawHexagon = (x, y, size, opacity) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hx = x + size * Math.cos(angle);
                const hy = y + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            
            const computedStyle = getComputedStyle(document.documentElement);
            const neonBlue = computedStyle.getPropertyValue('--neon-blue').trim() || '#00f0ff';
            
            ctx.strokeStyle = neonBlue;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            time += 0.01;
            const hexHeight = Math.sqrt(3) * hexSize;
            const hexWidth = 2 * hexSize;
            const vertDist = hexHeight;
            const horizDist = hexWidth * 0.75;
            
            for (let y = 0; y < height + hexHeight; y += vertDist) {
                for (let x = 0, row = 0; x < width + hexWidth; x += horizDist, row++) {
                    const yOffset = (row % 2 === 1) ? hexHeight / 2 : 0;
                    const noise = Math.sin(x * 0.01 + time) * Math.cos(y * 0.01 + time);
                    const opacity = Math.max(0.02, 0.15 + noise * 0.1);
                    drawHexagon(x, y + yOffset, hexSize - 2, opacity);
                }
            }
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();

        // Save destroy logic
        this.activeInstance = {
            destroy: () => window.removeEventListener('resize', resize)
        };
    }

    // 2. Neon Glow Waves (adapted from original Lightfall)
    initNeonGlowWaves(canvas) {
        // To avoid duplicating the massive webgl code, we'll just re-trigger the original logic on the new canvas
        // Wait, original logic looks for "lightfall-container" which we removed.
        // I will copy the WebGL Lightfall logic here.
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return;

        const MAX_COLORS = 8;
        const hexToRGB = hex => {
            const c = hex.replace('#', '').padEnd(6, '0');
            const r = parseInt(c.slice(0, 2), 16) / 255;
            const g = parseInt(c.slice(2, 4), 16) / 255;
            const b = parseInt(c.slice(4, 6), 16) / 255;
            return [r, g, b];
        };

        const prepColors = input => {
            const base = (input && input.length ? input : ['#A6C8FF', '#5227FF', '#FF9FFC']).slice(0, MAX_COLORS);
            const count = base.length;
            const arr = [];
            for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRGB(base[Math.min(i, base.length - 1)]));
            const avg = [0, 0, 0];
            for (let i = 0; i < count; i++) {
                avg[0] += arr[i][0];
                avg[1] += arr[i][1];
                avg[2] += arr[i][2];
            }
            avg[0] /= count;
            avg[1] /= count;
            avg[2] /= count;
            return { arr, count, avg };
        };

        const vertexSrc = `
            attribute vec2 position;
            attribute vec2 uv;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentSrc = `
            precision highp float;

            uniform vec3  iResolution;
            uniform vec2  iMouse;
            uniform float iTime;

            uniform vec3  uColor0; uniform vec3  uColor1; uniform vec3  uColor2; uniform vec3  uColor3;
            uniform vec3  uColor4; uniform vec3  uColor5; uniform vec3  uColor6; uniform vec3  uColor7;
            uniform int   uColorCount;

            uniform vec3  uBgColor; uniform vec3  uMouseColor; uniform float uSpeed;
            uniform int   uStreakCount; uniform float uStreakWidth; uniform float uStreakLength;
            uniform float uGlow; uniform float uDensity; uniform float uTwinkle; uniform float uZoom;
            uniform float uBgGlow; uniform float uOpacity; uniform float uMouseEnabled;
            uniform float uMouseStrength; uniform float uMouseRadius;

            varying vec2 vUv;

            vec3 palette(float h) {
                int count = uColorCount;
                if (count < 1) count = 1;
                int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
                if (idx <= 0) return uColor0; if (idx == 1) return uColor1; if (idx == 2) return uColor2; if (idx == 3) return uColor3;
                if (idx == 4) return uColor4; if (idx == 5) return uColor5; if (idx == 6) return uColor6; return uColor7;
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

                vec2 c0 = sceneC(C, r);
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

                float zr = 5e-4 * uStreakWidth;
                vec2 rr = vec2(max(length(fw), 1e-5));
                float tail = 19.0 / max(uStreakLength, 0.05);

                for (int m = 0; m < 16; m++) {
                    if (m >= uStreakCount) break;
                    float jf = float(m) + 1.0;
                    float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
                    vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
                    Pp -= floor(Pp / Y + 0.5) * Y;
                    float h = fract(8663.0 * ic);
                    vec3 col = palette(h);
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

        function compileShader(type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
            return shader;
        }

        const program = gl.createProgram();
        gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSrc));
        gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSrc));
        gl.linkProgram(program);

        const vertices = new Float32Array([-1,-1,0,0, 1,-1,1,0, -1,1,0,1, 1,1,1,1]);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, 'position');
        const uvLoc = gl.getAttribLocation(program, 'uv');
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);
        gl.enableVertexAttribArray(uvLoc);

        gl.useProgram(program);

        const updateLightfallTheme = () => {
            const currentBgDark = getComputedStyle(document.documentElement).getPropertyValue('--bg-dark').trim();
            const currentPurple = getComputedStyle(document.documentElement).getPropertyValue('--neon-purple').trim();
            const currentBlue = getComputedStyle(document.documentElement).getPropertyValue('--neon-blue').trim();

            const finalBgColor = currentBgDark ? hexToRGB(currentBgDark) : hexToRGB('#000000');
            const themeColorsArr = [
                currentBlue || '#27d8ff', 
                currentPurple || '#9ffffb', 
                '#A6C8FF', '#5227FF', '#FF9FFC', '#284633'
            ];
            
            const currentPrep = prepColors(themeColorsArr);
            const set3f = (name, v) => gl.uniform3f(gl.getUniformLocation(program, name), v[0], v[1], v[2]);
            const set1i = (name, v) => gl.uniform1i(gl.getUniformLocation(program, name), v);

            set3f('uColor0', currentPrep.arr[0]); set3f('uColor1', currentPrep.arr[1]);
            set3f('uColor2', currentPrep.arr[2]); set3f('uColor3', currentPrep.arr[3]);
            set3f('uColor4', currentPrep.arr[4]); set3f('uColor5', currentPrep.arr[5]);
            set3f('uColor6', currentPrep.arr[6]); set3f('uColor7', currentPrep.arr[7]);
            set1i('uColorCount', currentPrep.count);
            set3f('uBgColor', finalBgColor);
            set3f('uMouseColor', currentPrep.avg);
        };

        updateLightfallTheme();

        const set1f = (name, v) => gl.uniform1f(gl.getUniformLocation(program, name), v);
        set1f('uSpeed', 0.3);
        gl.uniform1i(gl.getUniformLocation(program, 'uStreakCount'), 8);
        set1f('uStreakWidth', 0.8);
        set1f('uStreakLength', 1.4);
        set1f('uGlow', 1.1);
        set1f('uDensity', 0.4);
        set1f('uTwinkle', 0.35);
        set1f('uZoom', 3.7);
        set1f('uBgGlow', 2.6);
        set1f('uOpacity', 1.0);
        set1f('uMouseEnabled', 0.0);

        const resLoc = gl.getUniformLocation(program, 'iResolution');
        const timeLoc = gl.getUniformLocation(program, 'iTime');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform3f(resLoc, canvas.width, canvas.height, 1.0);
        };
        window.addEventListener('resize', resize);
        resize();

        const loop = t => {
            gl.uniform1f(timeLoc, t * 0.001);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);

        this.activeInstance = {
            destroy: () => window.removeEventListener('resize', resize)
        };
    }

    // 3. Particle Background
    initParticleBackground(canvas, ctx) {
        let width, height;
        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                size: Math.random() * 2 + 1
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            const computedStyle = getComputedStyle(document.documentElement);
            const color = computedStyle.getPropertyValue('--neon-purple').trim() || '#9f29ff';
            ctx.fillStyle = color;

            for (let p of particles) {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw lines between close particles
            ctx.strokeStyle = color;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        ctx.globalAlpha = 1 - (dist / 100);
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                        ctx.globalAlpha = 1.0;
                    }
                }
            }

            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        this.activeInstance = {
            destroy: () => window.removeEventListener('resize', resize)
        };
    }

    // 4. Starfield / Space Effect
    initStarfield(canvas, ctx) {
        let width, height;
        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            // Center the origin
            ctx.translate(width / 2, height / 2);
        };
        window.addEventListener('resize', resize);
        resize();

        const stars = [];
        for (let i = 0; i < 400; i++) {
            stars.push({
                x: (Math.random() - 0.5) * 2000,
                y: (Math.random() - 0.5) * 2000,
                z: Math.random() * 2000
            });
        }

        const animate = () => {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform for clearRect
            ctx.clearRect(0, 0, width, height);
            ctx.translate(width / 2, height / 2);
            
            ctx.fillStyle = '#ffffff';

            for (let s of stars) {
                s.z -= 2; // move towards viewer
                if (s.z <= 0) {
                    s.z = 2000;
                    s.x = (Math.random() - 0.5) * 2000;
                    s.y = (Math.random() - 0.5) * 2000;
                }

                const px = s.x / (s.z * 0.001);
                const py = s.y / (s.z * 0.001);
                
                // only draw if within screen bounds
                if (px >= -width/2 && px <= width/2 && py >= -height/2 && py <= height/2) {
                    const size = Math.max(0.1, (2000 - s.z) * 0.002);
                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        this.activeInstance = {
            destroy: () => window.removeEventListener('resize', resize)
        };
    }

    // 5. Radar Background
    initRadar() {
        // We use the imported Radar class
        const computedStyle = getComputedStyle(document.documentElement);
        const color = computedStyle.getPropertyValue('--neon-purple').trim() || '#9f29ff';
        const bgColor = computedStyle.getPropertyValue('--bg-dark').trim() || '#0a0a0a';

        this.activeInstance = new Radar(this.container, {
            color: color,
            backgroundColor: bgColor,
            enableMouseInteraction: true
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.backgroundSystem = new BackgroundSystem();
});

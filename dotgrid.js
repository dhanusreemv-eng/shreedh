function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16)
  };
}

const throttle = (func, limit) => {
  let lastCall = 0;
  return function (...args) {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

export class DotGridBackground {
  constructor(container, options = {}) {
    this.container = container;
    this.dotSize = options.dotSize || 16;
    this.gap = options.gap || 32;
    this.baseColor = options.baseColor || '#5227FF';
    this.activeColor = options.activeColor || '#5227FF';
    this.proximity = options.proximity || 150;
    this.speedTrigger = options.speedTrigger || 100;
    this.shockRadius = options.shockRadius || 250;
    this.shockStrength = options.shockStrength || 5;
    this.maxSpeed = options.maxSpeed || 5000;
    this.resistance = options.resistance || 750;
    this.returnDuration = options.returnDuration || 1.5;

    this.pointer = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 0,
      lastTime: 0,
      lastX: 0,
      lastY: 0
    };

    this.baseRgb = hexToRgb(this.baseColor);
    this.activeRgb = hexToRgb(this.activeColor);

    this.init();
  }

  updateColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
        this.baseColor = '#cbd5e1'; 
        this.activeColor = '#3b82f6';
    } else {
        this.baseColor = '#334155'; 
        this.activeColor = '#8b5cf6'; 
    }
    this.baseRgb = hexToRgb(this.baseColor);
    this.activeRgb = hexToRgb(this.activeColor);
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.inset = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.circlePath = new Path2D();
    this.circlePath.arc(0, 0, this.dotSize / 2, 0, Math.PI * 2);

    this.buildGrid();

    this.resizeHandler = this.buildGrid.bind(this);
    window.addEventListener('resize', this.resizeHandler);

    this.themeHandler = this.updateColors.bind(this);
    window.addEventListener('themeChanged', this.themeHandler);

    this.onMove = e => {
      const now = performance.now();
      const pr = this.pointer;
      const dt = pr.lastTime ? now - pr.lastTime : 16;
      const dx = e.clientX - pr.lastX;
      const dy = e.clientY - pr.lastY;
      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);
      
      if (speed > this.maxSpeed) {
        const scale = this.maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = this.maxSpeed;
      }
      
      pr.lastTime = now;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const rect = this.canvas.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      for (const dot of this.dots) {
        const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
        if (speed > this.speedTrigger && dist < this.proximity && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          if (window.gsap) window.gsap.killTweensOf(dot);
          const pushX = dot.cx - pr.x + vx * 0.005;
          const pushY = dot.cy - pr.y + vy * 0.005;
          
          if (window.gsap) {
            window.gsap.to(dot, {
              xOffset: pushX,
              yOffset: pushY,
              duration: 0.5, // Simulate inertia duration
              ease: "power2.out",
              onComplete: () => {
                window.gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: this.returnDuration,
                  ease: 'elastic.out(1,0.75)'
                });
                dot._inertiaApplied = false;
              }
            });
          }
        }
      }
    };

    this.onClick = e => {
      const rect = this.canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      for (const dot of this.dots) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < this.shockRadius && !dot._inertiaApplied) {
          dot._inertiaApplied = true;
          if (window.gsap) window.gsap.killTweensOf(dot);
          const falloff = Math.max(0, 1 - dist / this.shockRadius);
          const pushX = (dot.cx - cx) * this.shockStrength * falloff;
          const pushY = (dot.cy - cy) * this.shockStrength * falloff;
          
          if (window.gsap) {
            window.gsap.to(dot, {
              xOffset: pushX,
              yOffset: pushY,
              duration: 0.5, // Simulate inertia duration
              ease: "power2.out",
              onComplete: () => {
                window.gsap.to(dot, {
                  xOffset: 0,
                  yOffset: 0,
                  duration: this.returnDuration,
                  ease: 'elastic.out(1,0.75)'
                });
                dot._inertiaApplied = false;
              }
            });
          }
        }
      }
    };

    this.throttledMove = throttle(this.onMove, 50);
    window.addEventListener('mousemove', this.throttledMove, { passive: true });
    window.addEventListener('click', this.onClick);

    this.render = this.render.bind(this);
    this.rafId = requestAnimationFrame(this.render);
  }

  buildGrid() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);

    const cols = Math.floor((width + this.gap) / (this.dotSize + this.gap));
    const rows = Math.floor((height + this.gap) / (this.dotSize + this.gap));
    const cell = this.dotSize + this.gap;

    const gridW = cell * cols - this.gap;
    const gridH = cell * rows - this.gap;

    const extraX = width - gridW;
    const extraY = height - gridH;

    const startX = extraX / 2 + this.dotSize / 2;
    const startY = extraY / 2 + this.dotSize / 2;

    this.dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = startX + x * cell;
        const cy = startY + y * cell;
        this.dots.push({ cx, cy, xOffset: 0, yOffset: 0, _inertiaApplied: false });
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const { x: px, y: py } = this.pointer;
    const proxSq = this.proximity * this.proximity;

    for (const dot of this.dots) {
      const ox = dot.cx + dot.xOffset;
      const oy = dot.cy + dot.yOffset;
      const dx = dot.cx - px;
      const dy = dot.cy - py;
      const dsq = dx * dx + dy * dy;

      let style = this.baseColor;
      if (dsq <= proxSq) {
        const dist = Math.sqrt(dsq);
        const t = 1 - dist / this.proximity;
        const r = Math.round(this.baseRgb.r + (this.activeRgb.r - this.baseRgb.r) * t);
        const g = Math.round(this.baseRgb.g + (this.activeRgb.g - this.baseRgb.g) * t);
        const b = Math.round(this.baseRgb.b + (this.activeRgb.b - this.baseRgb.b) * t);
        style = `rgb(${r},${g},${b})`;
      }

      this.ctx.save();
      this.ctx.translate(ox, oy);
      this.ctx.fillStyle = style;
      this.ctx.fill(this.circlePath);
      this.ctx.restore();
    }

    this.rafId = requestAnimationFrame(this.render);
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('themeChanged', this.themeHandler);
    window.removeEventListener('mousemove', this.throttledMove);
    window.removeEventListener('click', this.onClick);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

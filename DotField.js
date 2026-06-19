/**
 * DotField – Vanilla JS port of the React Bits DotField component.
 *
 * Usage:
 *   const df = new DotField(containerElement, { dotRadius: 1.5, dotSpacing: 14, ... });
 *   // To destroy:
 *   df.destroy();
 */

const TWO_PI = Math.PI * 2;

export class DotField {
  constructor(container, options = {}) {
    this.container = container;

    // Props (with React Bits defaults)
    this.opts = {
      dotRadius:    options.dotRadius    ?? 1.5,
      dotSpacing:   options.dotSpacing   ?? 14,
      cursorRadius: options.cursorRadius ?? 500,
      cursorForce:  options.cursorForce  ?? 0.1,
      bulgeOnly:    options.bulgeOnly    ?? true,
      bulgeStrength:options.bulgeStrength?? 67,
      glowRadius:   options.glowRadius   ?? 160,
      sparkle:      options.sparkle      ?? false,
      waveAmplitude:options.waveAmplitude?? 0,
      gradientFrom: options.gradientFrom ?? 'rgba(168, 85, 247, 0.35)',
      gradientTo:   options.gradientTo   ?? 'rgba(180, 151, 207, 0.25)',
      glowColor:    options.glowColor    ?? '#120F17',
    };

    this._dots        = [];
    this._mouse       = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    this._size        = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
    this._glowOpacity = 0;
    this._engagement  = 0;
    this._frameCount  = 0;
    this._rafId       = null;
    this._resizeTimer = null;
    this._glowId      = `dot-field-glow-${Math.random().toString(36).slice(2, 9)}`;

    this._init();
  }

  /* ------------------------------------------------------------------ */
  /*  Initialise canvas + SVG + event listeners                          */
  /* ------------------------------------------------------------------ */
  _init() {
    const container = this.container;

    // ── Canvas ──────────────────────────────────────────────────────────
    this._canvas = document.createElement('canvas');
    Object.assign(this._canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'auto',
    });
    container.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d', { alpha: true });
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);

    // ── SVG glow ────────────────────────────────────────────────────────
    const NS = 'http://www.w3.org/2000/svg';
    this._svg = document.createElementNS(NS, 'svg');
    Object.assign(this._svg.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });

    const defs = document.createElementNS(NS, 'defs');
    const radGrad = document.createElementNS(NS, 'radialGradient');
    radGrad.setAttribute('id', this._glowId);

    const stop0 = document.createElementNS(NS, 'stop');
    stop0.setAttribute('offset', '0%');
    stop0.setAttribute('stop-color', this.opts.glowColor);

    const stop1 = document.createElementNS(NS, 'stop');
    stop1.setAttribute('offset', '100%');
    stop1.setAttribute('stop-color', 'transparent');

    radGrad.appendChild(stop0);
    radGrad.appendChild(stop1);
    defs.appendChild(radGrad);
    this._svg.appendChild(defs);

    this._glowCircle = document.createElementNS(NS, 'circle');
    this._glowCircle.setAttribute('cx', '-9999');
    this._glowCircle.setAttribute('cy', '-9999');
    this._glowCircle.setAttribute('r', String(this.opts.glowRadius));
    this._glowCircle.setAttribute('fill', `url(#${this._glowId})`);
    this._glowCircle.style.opacity = '0';
    this._glowCircle.style.willChange = 'opacity';
    this._svg.appendChild(this._glowCircle);

    container.appendChild(this._svg);

    // ── Event listeners ─────────────────────────────────────────────────
    this._onMouseMove = (e) => {
      const s = this._size;
      this._mouse.x = e.pageX - s.offsetX;
      this._mouse.y = e.pageY - s.offsetY;
    };

    this._speedInterval = setInterval(() => {
      const m = this._mouse;
      const dx = m.prevX - m.x;
      const dy = m.prevY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      m.speed += (dist - m.speed) * 0.5;
      if (m.speed < 0.001) m.speed = 0;
      m.prevX = m.x;
      m.prevY = m.y;
    }, 20);

    this._onResize = () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._doResize(), 100);
    };

    window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    window.addEventListener('resize', this._onResize);

    // ── First layout pass ───────────────────────────────────────────────
    this._doResize();
    this._rafId = requestAnimationFrame(() => this._tick());
  }

  /* ------------------------------------------------------------------ */
  /*  Resize / grid build                                                */
  /* ------------------------------------------------------------------ */
  _doResize() {
    const rect = this.container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = this._dpr;

    this._canvas.width  = w * dpr;
    this._canvas.height = h * dpr;
    this._canvas.style.width  = `${w}px`;
    this._canvas.style.height = `${h}px`;
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this._size = {
      w,
      h,
      offsetX: rect.left + window.scrollX,
      offsetY: rect.top  + window.scrollY,
    };

    this._buildDots(w, h);
  }

  _buildDots(w, h) {
    const { dotRadius, dotSpacing } = this.opts;
    const step = dotRadius + dotSpacing;
    const cols = Math.floor(w / step);
    const rows = Math.floor(h / step);
    const padX = (w % step) / 2;
    const padY = (h % step) / 2;
    const dots = new Array(rows * cols);
    let idx = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
      }
    }
    this._dots = dots;
  }

  /* ------------------------------------------------------------------ */
  /*  Animation loop                                                     */
  /* ------------------------------------------------------------------ */
  _tick() {
    this._frameCount++;
    const dots = this._dots;
    const m    = this._mouse;
    const { w, h } = this._size;
    const p    = this.opts;
    const len  = dots.length;
    const t    = this._frameCount * 0.02;
    const ctx  = this._ctx;

    // engagement / speed
    const targetEng = Math.min(m.speed / 5, 1);
    this._engagement += (targetEng - this._engagement) * 0.06;
    if (this._engagement < 0.001) this._engagement = 0;
    const eng = this._engagement;

    // glow circle
    this._glowOpacity += (eng - this._glowOpacity) * 0.08;
    this._glowCircle.setAttribute('cx', m.x);
    this._glowCircle.setAttribute('cy', m.y);
    this._glowCircle.style.opacity = this._glowOpacity;

    // draw
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, p.gradientFrom);
    grad.addColorStop(1, p.gradientTo);
    ctx.fillStyle = grad;

    const cr   = p.cursorRadius;
    const crSq = cr * cr;
    const rad  = p.dotRadius / 2;
    const isBulge = p.bulgeOnly;

    ctx.beginPath();

    for (let i = 0; i < len; i++) {
      const d = dots[i];
      const dx = m.x - d.ax;
      const dy = m.y - d.ay;
      const distSq = dx * dx + dy * dy;

      if (distSq < crSq && eng > 0.01) {
        const dist = Math.sqrt(distSq);
        if (isBulge) {
          const tVal = 1 - dist / cr;
          const push = tVal * tVal * p.bulgeStrength * eng;
          const angle = Math.atan2(dy, dx);
          d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
          d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
        } else {
          const angle = Math.atan2(dy, dx);
          const move  = (500 / dist) * (m.speed * p.cursorForce);
          d.vx += Math.cos(angle) * -move;
          d.vy += Math.sin(angle) * -move;
        }
      } else if (isBulge) {
        d.sx += (d.ax - d.sx) * 0.1;
        d.sy += (d.ay - d.sy) * 0.1;
      }

      if (!isBulge) {
        d.vx *= 0.9;
        d.vy *= 0.9;
        d.x = d.ax + d.vx;
        d.y = d.ay + d.vy;
        d.sx += (d.x - d.sx) * 0.1;
        d.sy += (d.y - d.sy) * 0.1;
      }

      let drawX = d.sx;
      let drawY = d.sy;
      if (p.waveAmplitude > 0) {
        drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
        drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
      }

      if (p.sparkle) {
        const hash = ((i * 2654435761) ^ (this._frameCount >> 3)) >>> 0;
        if ((hash % 100) < 3) {
          ctx.moveTo(drawX + rad * 1.8, drawY);
          ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
        } else {
          ctx.moveTo(drawX + rad, drawY);
          ctx.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      } else {
        ctx.moveTo(drawX + rad, drawY);
        ctx.arc(drawX, drawY, rad, 0, TWO_PI);
      }
    }

    ctx.fill();

    this._rafId = requestAnimationFrame(() => this._tick());
  }

  /* ------------------------------------------------------------------ */
  /*  Public: update a prop at runtime                                   */
  /* ------------------------------------------------------------------ */
  setOption(key, value) {
    this.opts[key] = value;
    // rebuild grid if spacing changed
    if (key === 'dotRadius' || key === 'dotSpacing') {
      const { w, h } = this._size;
      if (w > 0 && h > 0) this._buildDots(w, h);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Destroy                                                            */
  /* ------------------------------------------------------------------ */
  destroy() {
    cancelAnimationFrame(this._rafId);
    clearInterval(this._speedInterval);
    clearTimeout(this._resizeTimer);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize',    this._onResize);
    this._canvas.remove();
    this._svg.remove();
  }
}

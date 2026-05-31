import { Scene } from '../core/scene.js';
import { COLORS, DEPTH_COLORS } from '../constants.js';

export class GameScene extends Scene {
  constructor(input, sceneManager) {
    super('game');
    this.input = input;
    this.sceneManager = sceneManager;
    this.player = { x: 100, y: 300, vx: 0, vy: 0, onGround: false, facing: 1 };
    this.anchors = [];
    this.anchorCount = 0;
    this.depth = 0;
    this.particles = [];
    this.time = 0;
    this.erosionLevel = 0;
  }

  init() {
    super.init();
    this._generateAnchors();
    this._generateParticles();
  }

  _generateAnchors() {
    this.anchors = [];
    const positions = [
      { x: 300, y: 280 },
      { x: 550, y: 200 },
      { x: 800, y: 350 },
      { x: 1050, y: 250 },
    ];
    for (const pos of positions) {
      this.anchors.push({
        x: pos.x,
        y: pos.y,
        collected: false,
        pulse: Math.random() * Math.PI * 2,
        size: 12,
      });
    }
  }

  _generateParticles() {
    this.particles = [];
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.7 ? COLORS.FLUORESCENT_CYAN : COLORS.MOONLIGHT_WHITE,
      });
    }
  }

  onEnter() {
    super.onEnter();
    this.player.x = 100;
    this.player.y = 300;
    this.player.vx = 0;
    this.player.vy = 0;
    this.anchorCount = 0;
    this.depth = 0;
    this.erosionLevel = 0;
    this._generateAnchors();
  }

  update(dt) {
    this.time += dt;
    const dtSec = dt / 1000;

    const speed = 200;
    const gravity = 800;
    const jumpForce = -400;

    if (this.input.isDown('ArrowLeft') || this.input.isDown('KeyA')) {
      this.player.vx = -speed;
      this.player.facing = -1;
    } else if (this.input.isDown('ArrowRight') || this.input.isDown('KeyD')) {
      this.player.vx = speed;
      this.player.facing = 1;
    } else {
      this.player.vx *= 0.85;
    }

    if ((this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW') || this.input.justPressed('Space')) && this.player.onGround) {
      this.player.vy = jumpForce;
      this.player.onGround = false;
    }

    this.player.vy += gravity * dtSec;
    this.player.x += this.player.vx * dtSec;
    this.player.y += this.player.vy * dtSec;

    const groundY = 500;
    if (this.player.y >= groundY) {
      this.player.y = groundY;
      this.player.vy = 0;
      this.player.onGround = true;
    }

    this.player.x = Math.max(20, Math.min(1260, this.player.x));

    for (const anchor of this.anchors) {
      if (anchor.collected) continue;
      const dx = this.player.x - anchor.x;
      const dy = this.player.y - anchor.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        anchor.collected = true;
        this.anchorCount++;
      }
    }

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = 730;
        p.x = Math.random() * 1280;
      }
      if (p.x < -10) p.x = 1290;
      if (p.x > 1290) p.x = -10;
    }

    this.erosionLevel = this.anchorCount / this.anchors.length;

    if (this.input.justPressed('Escape')) {
      this.sceneManager.switchTo('pause');
    }
  }

  render(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;

    const depthColor = DEPTH_COLORS[Math.min(this.depth, DEPTH_COLORS.length - 1)];
    ctx.fillStyle = depthColor;
    ctx.fillRect(0, 0, w, h);

    this._renderBackground(ctx, w, h);
    this._renderGround(ctx, w, h);
    this._renderAnchors(ctx, w, h);
    this._renderParticles(ctx, w, h);
    this._renderPlayer(ctx, w, h);
    this._renderHUD(ctx, w, h);
  }

  _renderBackground(ctx, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.3;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    gradient.addColorStop(0, 'rgba(0, 255, 212, 0.02)');
    gradient.addColorStop(0.5, 'rgba(26, 16, 53, 0.3)');
    gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    this._renderAbyssFog(ctx, w, h);
    this._renderErosionEffect(ctx, w, h);
  }

  _renderAbyssFog(ctx, w, h) {
    const breathCycle = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
    const fogAlpha = 0.15 + this.erosionLevel * 0.2;
    const driftX = Math.sin(this.time * 0.0003) * 50;
    const driftY = Math.cos(this.time * 0.00025) * 30;

    const fogLayers = [
      { cx: w * 0.3 + driftX, cy: h * 0.4 + driftY, r: w * 0.35, color: '26, 16, 53' },
      { cx: w * 0.7 - driftX * 0.7, cy: h * 0.6 - driftY * 0.5, r: w * 0.3, color: '15, 21, 40' },
      { cx: w * 0.5 + driftX * 0.3, cy: h * 0.8 + driftY * 0.4, r: w * 0.4, color: '42, 10, 26' },
    ];

    for (const fog of fogLayers) {
      const r = fog.r * (0.8 + breathCycle * 0.3);
      const gradient = ctx.createRadialGradient(fog.cx, fog.cy, 0, fog.cx, fog.cy, r);
      gradient.addColorStop(0, `rgba(${fog.color}, ${fogAlpha * 0.5})`);
      gradient.addColorStop(0.4, `rgba(${fog.color}, ${fogAlpha * 0.2})`);
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderErosionEffect(ctx, w, h) {
    if (this.erosionLevel < 0.1) return;

    const breathCycle = Math.sin(this.time * 0.001) * 0.5 + 0.5;
    const intensity = this.erosionLevel;

    const erosionPoints = [
      { x: w * 0.15, y: h * 0.2 },
      { x: w * 0.85, y: h * 0.35 },
      { x: w * 0.6, y: h * 0.7 },
      { x: w * 0.3, y: h * 0.85 },
    ];

    for (let i = 0; i < erosionPoints.length; i++) {
      if (i / erosionPoints.length >= intensity) break;

      const ep = erosionPoints[i];
      const pulse = Math.sin(this.time * 0.002 + i * 1.5) * 0.5 + 0.5;
      const r = (60 + intensity * 120) * (0.7 + pulse * 0.3);
      const cx = ep.x + Math.sin(this.time * 0.0005 + i) * 15;
      const cy = ep.y + Math.cos(this.time * 0.0004 + i) * 10;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const isVoid = i % 2 === 0;
      if (isVoid) {
        gradient.addColorStop(0, `rgba(255, 107, 53, ${0.06 * intensity * pulse})`);
        gradient.addColorStop(0.5, `rgba(255, 0, 68, ${0.03 * intensity})`);
      } else {
        gradient.addColorStop(0, `rgba(0, 255, 212, ${0.04 * intensity * pulse})`);
        gradient.addColorStop(0.5, `rgba(0, 136, 255, ${0.02 * intensity})`);
      }
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      if (isVoid && intensity > 0.3 && pulse > 0.6) {
        ctx.strokeStyle = `rgba(255, 107, 53, ${0.15 * intensity * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const crackAngle = this.time * 0.0003 + i * 2;
        for (let j = 0; j < 3; j++) {
          const a = crackAngle + j * Math.PI * 2 / 3;
          const len = r * 0.7;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        }
        ctx.stroke();
      }
    }

    if (intensity > 0.5) {
      const vignetteAlpha = (intensity - 0.5) * 0.3;
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
      vignette.addColorStop(0, 'rgba(10, 14, 26, 0)');
      vignette.addColorStop(1, `rgba(10, 0, 5, ${vignetteAlpha})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderGround(ctx, w, h) {
    const groundY = 500;
    const gradient = ctx.createLinearGradient(0, groundY, 0, h);
    gradient.addColorStop(0, '#1A2744');
    gradient.addColorStop(0.3, '#0F1A2E');
    gradient.addColorStop(1, '#0A0E1A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, groundY, w, h - groundY);

    ctx.strokeStyle = 'rgba(0, 255, 212, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();
  }

  _renderAnchors(ctx) {
    for (const anchor of this.anchors) {
      if (anchor.collected) continue;

      anchor.pulse += 0.05;
      const pulseSize = 1 + 0.3 * Math.sin(anchor.pulse);
      const size = anchor.size * pulseSize;

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 212, 0.08)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
  }

  _renderParticles(ctx) {
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba').replace('##', '#');

      const alpha = p.alpha;
      if (p.color === COLORS.FLUORESCENT_CYAN) {
        ctx.fillStyle = `rgba(0, 255, 212, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(232, 230, 240, ${alpha})`;
      }
      ctx.fill();
    }
  }

  _renderPlayer(ctx) {
    const p = this.player;
    const size = 16;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);

    ctx.fillStyle = '#2D1B69';
    ctx.beginPath();
    ctx.ellipse(0, -size * 1.5, size * 0.8, size * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
    ctx.beginPath();
    ctx.ellipse(0, -size * 2.5, size * 0.6, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
    ctx.beginPath();
    ctx.arc(3, -size * 2.6, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1A1035';
    ctx.beginPath();
    ctx.moveTo(-size * 0.6, -size * 3);
    ctx.lineTo(0, -size * 4.5);
    ctx.lineTo(size * 0.6, -size * 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0A0E1A';
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 3.2);
    ctx.lineTo(0, -size * 4);
    ctx.lineTo(size * 0.3, -size * 3.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _renderHUD(ctx, w) {
    ctx.save();

    const hudX = 30;
    const hudY = 30;

    for (let i = 0; i < this.anchors.length; i++) {
      const ax = hudX + i * 28;
      const ay = hudY;

      if (i < this.anchorCount) {
        ctx.beginPath();
        ctx.arc(ax, ay, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
        ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(ax, ay, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 212, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'right';
    ctx.fillText(`深度 ${this.depth}`, w - 30, 35);

    ctx.restore();
  }
}

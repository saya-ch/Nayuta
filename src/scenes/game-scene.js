import { Scene } from '../core/scene.js';
import { COLORS, DEPTH_COLORS } from '../constants.js';
import { PuzzleManager } from '../core/puzzle-manager.js';
import { LevelData } from '../core/level-data.js';

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
    this.levelStars = [];
    this.time = 0;
    this.erosionLevel = 0;
    this.puzzleManager = new PuzzleManager();
    this.platforms = [];
    this.decorations = [];
    this.currentLevel = null;
    this.interactHint = '';
    this.interactHintAlpha = 0;
    this.levelComplete = false;
    this.levelCompleteAlpha = 0;
    this.transitioning = false;
    this.transitionAlpha = 0;
  }

  init() {
    super.init();
  }

  onEnter() {
    super.onEnter();
    this._loadLevel(this.depth);
  }

  _loadLevel(depthIndex) {
    const level = LevelData.getLevel(depthIndex);
    this.currentLevel = level;
    this.platforms = level.platforms;
    this.decorations = level.decorations || [];

    this.player.x = level.playerStart.x;
    this.player.y = level.playerStart.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onGround = false;
    this.player.facing = 1;

    this.anchors = [];
    for (const pos of level.anchors) {
      this.anchors.push({
        x: pos.x,
        y: pos.y,
        collected: false,
        pulse: Math.random() * Math.PI * 2,
        size: 12,
      });
    }
    this.anchorCount = 0;

    this.puzzleManager.clear();
    for (const pe of level.puzzleElements) {
      this.puzzleManager.addElement(pe.x, pe.y, pe.type, pe.config || {});
    }
    this.puzzleManager.onSolve = () => {
      this.levelComplete = true;
    };

    this._generateParticles(level);
    this._generateStars(level);

    this.levelComplete = false;
    this.levelCompleteAlpha = 0;
    this.erosionLevel = 0;
    this.interactHint = '';
    this.interactHintAlpha = 0;
  }

  _generateParticles(level) {
    this.particles = [];
    const count = level.ambientParticleCount || 40;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.1,
        isCyan: Math.random() > 0.6,
      });
    }
  }

  _generateStars(level) {
    this.levelStars = [];
    const count = level.starCount || 100;
    for (let i = 0; i < count; i++) {
      this.levelStars.push({
        x: Math.random() * 1280,
        y: Math.random() * 500,
        size: Math.random() * 1.5 + 0.3,
        brightness: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(dt) {
    this.time += dt;
    const dtSec = dt / 1000;

    if (this.transitioning) {
      this.transitionAlpha += dt * 0.003;
      if (this.transitionAlpha >= 1) {
        this.transitioning = false;
        this.transitionAlpha = 1;
        this._loadLevel(this.depth);
        setTimeout(() => {
          this._fadeBackIn();
        }, 200);
      }
      return;
    }

    if (this._fadingIn) {
      this.transitionAlpha -= dt * 0.004;
      if (this.transitionAlpha <= 0) {
        this.transitionAlpha = 0;
        this._fadingIn = false;
      }
      return;
    }

    if (this.levelComplete) {
      this.levelCompleteAlpha = Math.min(1, this.levelCompleteAlpha + dt * 0.001);
      if (this.levelCompleteAlpha >= 1 && this.input.justPressed('Enter')) {
        this.depth++;
        if (this.depth >= 4) {
          this.depth = 0;
          this.sceneManager.switchTo('menu');
          return;
        }
        this.transitioning = true;
        this.transitionAlpha = 0;
        this.levelComplete = false;
        this.levelCompleteAlpha = 0;
      }
      return;
    }

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

    if (this.input.justPressed('KeyE')) {
      this.puzzleManager.tryInteract(this.player.x, this.player.y);
    }

    this.player.vy += gravity * dtSec;
    this.player.x += this.player.vx * dtSec;
    this.player.y += this.player.vy * dtSec;

    this.player.onGround = false;
    const playerW = 16;
    const playerH = 48;

    for (const plat of this.platforms) {
      if (this._checkPlatformCollision(plat, playerW, playerH)) {
        this._resolvePlatformCollision(plat, playerW, playerH);
      }
    }

    for (const door of this.puzzleManager.getCollidableElements()) {
      const bounds = door.getBounds();
      const plat = { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height };
      if (this._checkPlatformCollision(plat, playerW, playerH)) {
        this._resolvePlatformCollision(plat, playerW, playerH);
      }
    }

    this.player.x = Math.max(20, Math.min(1260, this.player.x));

    if (this.player.y > 750) {
      this.player.x = this.currentLevel.playerStart.x;
      this.player.y = this.currentLevel.playerStart.y;
      this.player.vx = 0;
      this.player.vy = 0;
    }

    for (const anchor of this.anchors) {
      if (anchor.collected) continue;
      const dx = this.player.x - anchor.x;
      const dy = (this.player.y - 24) - anchor.y;
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

    this.erosionLevel = this.anchorCount / Math.max(1, this.anchors.length);

    this.puzzleManager.update(dt, this.player.x, this.player.y - 24, this.player.onGround);

    this._updateInteractHint();

    if (this.input.justPressed('Escape')) {
      this.sceneManager.switchTo('pause');
    }
  }

  _fadeBackIn() {
    this._fadingIn = true;
  }

  _checkPlatformCollision(plat, playerW, playerH) {
    const px = this.player.x - playerW / 2;
    const py = this.player.y - playerH;
    return px + playerW > plat.x &&
           px < plat.x + plat.w &&
           py + playerH > plat.y &&
           py < plat.y + plat.h;
  }

  _resolvePlatformCollision(plat, playerW, playerH) {
    const px = this.player.x - playerW / 2;
    const py = this.player.y - playerH;

    const overlapLeft = (px + playerW) - plat.x;
    const overlapRight = (plat.x + plat.w) - px;
    const overlapTop = (py + playerH) - plat.y;
    const overlapBottom = (plat.y + plat.h) - py;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapTop && this.player.vy >= 0) {
      this.player.y = plat.y;
      this.player.vy = 0;
      this.player.onGround = true;
    } else if (minOverlap === overlapBottom && this.player.vy < 0) {
      this.player.y = plat.y + plat.h + playerH;
      this.player.vy = 0;
    } else if (minOverlap === overlapLeft) {
      this.player.x = plat.x - playerW / 2;
      this.player.vx = 0;
    } else if (minOverlap === overlapRight) {
      this.player.x = plat.x + plat.w + playerW / 2;
      this.player.vx = 0;
    }
  }

  _updateInteractHint() {
    let nearestDist = Infinity;
    let hint = '';

    for (const el of this.puzzleManager.elements) {
      if (el.type !== 'switch' && el.type !== 'lightMirror') continue;
      const dx = this.player.x - el.x;
      const dy = (this.player.y - 24) - el.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 45 && dist < nearestDist) {
        nearestDist = dist;
        if (el.type === 'switch') {
          hint = el.activated ? 'E 关闭' : 'E 开启';
        } else if (el.type === 'lightMirror') {
          hint = 'E 旋转镜面';
        }
      }
    }

    this.interactHint = hint;
    this.interactHintAlpha = hint ? Math.min(1, this.interactHintAlpha + 0.08) : Math.max(0, this.interactHintAlpha - 0.08);
  }

  render(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;

    const level = this.currentLevel || LevelData.getLevel(0);

    ctx.fillStyle = level.bgColor;
    ctx.fillRect(0, 0, w, h);

    this._renderLevelBackground(ctx, w, h, level);
    this._renderLevelStars(ctx, w, h);
    this._renderLevelFog(ctx, w, h, level);
    this._renderDecorations(ctx, w, h);
    this._renderPlatforms(ctx, w, h, level);
    this._renderAnchors(ctx, w, h);
    this.puzzleManager.render(ctx);
    this._renderParticles(ctx, w, h, level);
    this._renderPlayer(ctx, w, h);
    this._renderInteractHint(ctx, w, h);
    this._renderHUD(ctx, w, h, level);
    this._renderErosionOverlay(ctx, w, h);

    if (this.levelComplete) {
      this._renderLevelComplete(ctx, w, h, level);
    }

    if (this.transitionAlpha > 0) {
      ctx.fillStyle = `rgba(10, 14, 26, ${this.transitionAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderLevelBackground(ctx, w, h, level) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    for (const stop of level.bgGradientStops) {
      gradient.addColorStop(stop.pos, stop.color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.3;
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    radGrad.addColorStop(0, 'rgba(0, 255, 212, 0.015)');
    radGrad.addColorStop(0.5, `rgba(${level.fogColor}, 0.2)`);
    radGrad.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, w, h);
  }

  _renderLevelStars(ctx, w, h) {
    for (const star of this.levelStars) {
      const twinkle = 0.4 + 0.6 * Math.sin(this.time * 0.002 + star.phase);
      const alpha = star.brightness * twinkle;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 230, 240, ${alpha})`;
      ctx.fill();

      if (star.size > 1.0 && star.brightness > 0.5) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 212, ${alpha * 0.08})`;
        ctx.fill();
      }
    }
  }

  _renderLevelFog(ctx, w, h, level) {
    const breathCycle = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
    const fogAlpha = level.fogAlpha + this.erosionLevel * 0.1;
    const driftX = Math.sin(this.time * 0.0003) * 40;
    const driftY = Math.cos(this.time * 0.00025) * 25;

    const fogLayers = [
      { cx: w * 0.3 + driftX, cy: h * 0.4 + driftY, r: w * 0.35 },
      { cx: w * 0.7 - driftX * 0.7, cy: h * 0.6 - driftY * 0.5, r: w * 0.3 },
      { cx: w * 0.5 + driftX * 0.3, cy: h * 0.8 + driftY * 0.4, r: w * 0.4 },
    ];

    for (const fog of fogLayers) {
      const r = fog.r * (0.8 + breathCycle * 0.3);
      const gradient = ctx.createRadialGradient(fog.cx, fog.cy, 0, fog.cx, fog.cy, r);
      gradient.addColorStop(0, `rgba(${level.fogColor}, ${fogAlpha * 0.5})`);
      gradient.addColorStop(0.4, `rgba(${level.fogColor}, ${fogAlpha * 0.2})`);
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderDecorations(ctx, w, h) {
    for (const dec of this.decorations) {
      switch (dec.type) {
        case 'crystal':
          this._renderCrystal(ctx, dec);
          break;
        case 'glowOrb':
          this._renderGlowOrb(ctx, dec);
          break;
        case 'rune':
          this._renderRune(ctx, dec);
          break;
      }
    }
  }

  _renderCrystal(ctx, dec) {
    const pulse = Math.sin(this.time * 0.002 + dec.x * 0.01) * 0.3 + 0.7;
    const s = dec.size;

    ctx.save();
    ctx.translate(dec.x, dec.y);

    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.lineTo(-s * 0.1, -s);
    ctx.lineTo(s * 0.1, -s * 0.8);
    ctx.lineTo(s * 0.3, 0);
    ctx.closePath();
    ctx.fillStyle = `rgba(0, 255, 212, ${0.15 * pulse})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 255, 212, ${0.3 * pulse})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const glow = ctx.createRadialGradient(0, -s * 0.5, 0, 0, -s * 0.5, s * 1.5);
    glow.addColorStop(0, `rgba(0, 255, 212, ${0.06 * pulse})`);
    glow.addColorStop(1, 'rgba(0, 255, 212, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-s * 1.5, -s * 2, s * 3, s * 3);

    ctx.restore();
  }

  _renderGlowOrb(ctx, dec) {
    const pulse = Math.sin(this.time * 0.003 + dec.x * 0.02) * 0.4 + 0.6;
    const floatY = Math.sin(this.time * 0.001 + dec.x * 0.01) * 5;

    ctx.save();
    ctx.translate(dec.x, dec.y + floatY);

    const isCyan = dec.color === 'cyan';
    const baseColor = isCyan ? '0, 255, 212' : '232, 230, 240';

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, dec.size * 4);
    glow.addColorStop(0, `rgba(${baseColor}, ${0.15 * pulse})`);
    glow.addColorStop(1, `rgba(${baseColor}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(-dec.size * 4, -dec.size * 4, dec.size * 8, dec.size * 8);

    ctx.beginPath();
    ctx.arc(0, 0, dec.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${baseColor}, ${0.6 * pulse})`;
    ctx.shadowColor = isCyan ? '#00FFD4' : '#E8E6F0';
    ctx.shadowBlur = 10 * pulse;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  _renderRune(ctx, dec) {
    const pulse = Math.sin(this.time * 0.002 + dec.symbol * 2) * 0.3 + 0.7;

    ctx.save();
    ctx.translate(dec.x, dec.y);

    const symbols = ['◇', '△', '○'];
    ctx.font = `${10 + pulse * 2}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = `rgba(0, 255, 212, ${0.2 * pulse})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbols[dec.symbol % symbols.length], 0, 0);

    ctx.restore();
  }

  _renderPlatforms(ctx, w, h, level) {
    for (const plat of this.platforms) {
      const gradient = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
      gradient.addColorStop(0, level.platformColor);
      gradient.addColorStop(0.3, '#0F1A2E');
      gradient.addColorStop(1, '#0A0E1A');
      ctx.fillStyle = gradient;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

      ctx.strokeStyle = level.platformEdgeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plat.x, plat.y);
      ctx.lineTo(plat.x + plat.w, plat.y);
      ctx.stroke();

      if (plat.h <= 16) {
        const edgeGlow = ctx.createLinearGradient(plat.x, plat.y, plat.x + plat.w, plat.y);
        edgeGlow.addColorStop(0, 'rgba(0, 255, 212, 0)');
        edgeGlow.addColorStop(0.5, level.platformGlowColor);
        edgeGlow.addColorStop(1, 'rgba(0, 255, 212, 0)');
        ctx.fillStyle = edgeGlow;
        ctx.fillRect(plat.x, plat.y - 2, plat.w, 4);
      }
    }
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

  _renderParticles(ctx, w, h, level) {
    for (const p of this.particles) {
      const alpha = p.alpha;
      if (p.isCyan) {
        ctx.fillStyle = `rgba(0, 255, 212, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(232, 230, 240, ${alpha})`;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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

  _renderInteractHint(ctx, w, h) {
    if (this.interactHintAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.interactHintAlpha * (0.6 + 0.3 * Math.sin(this.time * 0.004));
    ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.interactHint, this.player.x, this.player.y - 85);
    ctx.restore();
  }

  _renderHUD(ctx, w, h, level) {
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
    ctx.fillText(`深度 ${this.depth + 1}`, w - 30, 30);

    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(107, 107, 141, 0.6)';
    ctx.fillText(level.name, w - 30, 48);

    ctx.restore();
  }

  _renderErosionOverlay(ctx, w, h) {
    if (this.erosionLevel < 0.1) return;

    const intensity = this.erosionLevel;
    const level = this.currentLevel;
    const depthIndex = level ? level.depthIndex : 0;

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
      const isVoid = i % 2 === 0 || depthIndex >= 2;
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

  _renderLevelComplete(ctx, w, h, level) {
    ctx.save();
    ctx.globalAlpha = this.levelCompleteAlpha * 0.6;
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = this.levelCompleteAlpha;

    const breathCycle = Math.sin(this.time * 0.002) * 0.5 + 0.5;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 30 * (0.7 + breathCycle * 0.3);
    ctx.font = '600 42px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
    ctx.fillText(level.completionText, w / 2, h * 0.4);
    ctx.shadowBlur = 0;

    ctx.font = '300 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText(level.completionSubtext, w / 2, h * 0.5);

    if (this.levelCompleteAlpha >= 1) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.time * 0.003);
      ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.fillText('按 Enter 继续深入', w / 2, h * 0.62);
    }

    ctx.restore();
  }
}

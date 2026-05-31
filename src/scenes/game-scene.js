import { Scene } from '../core/scene.js';
import { COLORS, DEPTH_COLORS } from '../constants.js';
import { PuzzleManager } from '../core/puzzle-manager.js';
import { LevelData } from '../core/level-data.js';
import { NarrativeSystem } from '../core/narrative-system.js';

export class GameScene extends Scene {
  constructor(input, sceneManager, audioSystem) {
    super('game');
    this.input = input;
    this.sceneManager = sceneManager;
    this.audio = audioSystem;
    this.player = { x: 100, y: 300, vx: 0, vy: 0, onGround: false, facing: 1 };
    this.anchors = [];
    this.anchorCount = 0;
    this.depth = 0;
    this.particles = [];
    this.levelStars = [];
    this.time = 0;
    this.erosionLevel = 0;
    this.puzzleManager = new PuzzleManager();
    this.narrativeSystem = new NarrativeSystem();
    this.platforms = [];
    this.decorations = [];
    this.currentLevel = null;
    this.interactHint = '';
    this.interactHintAlpha = 0;
    this.levelComplete = false;
    this.levelCompleteAlpha = 0;
    this.transitioning = false;
    this.transitionAlpha = 0;
    this.levelIntroAlpha = 0;
    this.levelIntroTimer = 0;
    this.showingLevelIntro = false;
    this.transitionPhase = 0;
    this.transitionProgress = 0;
    this.nextDepth = 0;
    this.fallStreaks = [];
    this.vignetteRadius = 1;
    this.playerTrail = [];
    this.erosionTime = 0;
    this.scanLines = [];
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.colorShiftAmount = 0;
    this.glitchTimer = 0;
    this.glitchBurst = false;
    this.glitchBurstTimer = 0;
    this.realityCracks = [];
    this._bgGradientCache = null;
    this._bgGradientKey = '';
    this._scanLineImage = null;
    this._scanLineDirty = true;
  }

  init() {
    super.init();
  }

  onEnter() {
    super.onEnter();
    this._loadLevel(this.depth);
    if (this.audio) {
      this.audio.playBGM(this.depth);
      this.audio.playAmbient(this.depth);
    }
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
      if (this.audio) this.audio.playSFX('levelComplete');
    };

    this.narrativeSystem.loadLevelNarrative(depthIndex);

    this._generateParticles(level);
    this._generateStars(level);

    this.levelComplete = false;
    this.levelCompleteAlpha = 0;
    this.erosionLevel = 0;
    this.interactHint = '';
    this.interactHintAlpha = 0;

    this.showingLevelIntro = true;
    this.levelIntroAlpha = 0;
    this.levelIntroTimer = 0;
    this.playerTrail = [];
    this.erosionTime = 0;
    this.scanLines = [];
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.colorShiftAmount = 0;
    this.glitchTimer = 8000 + Math.random() * 7000;
    this.glitchBurst = false;
    this.glitchBurstTimer = 0;
    this.realityCracks = [];
    this._initScanLines();
    this._initRealityCracks();
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
        colorType: 'default',
      });
    }
    this._assignParticleColors();
  }

  _assignParticleColors() {
    for (const p of this.particles) {
      if (this.depth >= 2 && Math.random() < 0.3) {
        p.colorType = 'orange';
      } else if (this.depth >= 1 && Math.random() < 0.35) {
        p.colorType = 'purple';
      } else {
        p.colorType = 'default';
      }
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

  _generateFallStreaks() {
    this.fallStreaks = [];
    for (let i = 0; i < 60; i++) {
      this.fallStreaks.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        speed: Math.random() * 400 + 200,
        length: Math.random() * 60 + 20,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
  }

  update(dt) {
    this.time += dt;
    const dtSec = dt / 1000;

    if (this.transitioning) {
      this._updateTransition(dt);
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

    if (this.showingLevelIntro) {
      this._updateLevelIntro(dt);
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
        this.transitionPhase = 1;
        this.transitionProgress = 0;
        this.transitionAlpha = 0;
        this.nextDepth = this.depth;
        this.vignetteRadius = 1;
        this.levelComplete = false;
        this.levelCompleteAlpha = 0;
        this._generateFallStreaks();
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
      if (this.audio) this.audio.playSFX('jump');
    }

    if (this.input.justPressed('KeyE')) {
      const interacted = this.puzzleManager.tryInteract(this.player.x, this.player.y);
      if (interacted && this.audio) this.audio.playSFX('switchToggle');
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

    if (this.depth >= 1) {
      this.playerTrail.push({ x: this.player.x, y: this.player.y, facing: this.player.facing, alpha: 0.4 });
      if (this.playerTrail.length > 8) {
        this.playerTrail.shift();
      }
      for (let i = 0; i < this.playerTrail.length; i++) {
        this.playerTrail[i].alpha *= 0.88;
      }
    }

    for (const anchor of this.anchors) {
      if (anchor.collected) continue;
      const dx = this.player.x - anchor.x;
      const dy = (this.player.y - 24) - anchor.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        anchor.collected = true;
        this.anchorCount++;
        if (this.audio) this.audio.playSFX('anchorCollect');
      }
    }

    for (const p of this.particles) {
      let vxMod = p.vx;
      let vyMod = p.vy;

      if (this.depth >= 3) {
        vxMod += (Math.random() - 0.5) * 2;
        vyMod += (Math.random() - 0.5) * 2;
      }

      p.x += vxMod;
      p.y += vyMod;
      if (p.y < -10) {
        p.y = 730;
        p.x = Math.random() * 1280;
      }
      if (p.x < -10) p.x = 1290;
      if (p.x > 1290) p.x = -10;
    }

    this.erosionLevel = this.anchorCount / Math.max(1, this.anchors.length);

    this.erosionTime += dt;
    this.colorShiftAmount = this.depth * 0.25 + this.erosionLevel * 0.15;

    if (this.depth >= 2) {
      this.glitchTimer -= dt;
      if (this.glitchTimer <= 0) {
        this.glitchBurst = true;
        this.glitchBurstTimer = 200;
        this.glitchTimer = 8000 + Math.random() * 7000;
        if (this.audio) this.audio.playSFX('erosionGlitch');
      }
    }

    if (this.glitchBurst) {
      this.glitchBurstTimer -= dt;
      if (this.glitchBurstTimer <= 0) {
        this.glitchBurst = false;
      }
    }

    if (this.depth >= 2) {
      const shakeChance = this.depth >= 3 ? 0.03 : 0.01;
      if (Math.random() < shakeChance) {
        const maxIntensity = this.depth >= 3 ? 5 : 2;
        this.screenShake.intensity = Math.random() * maxIntensity + 1;
      }
    }

    if (this.screenShake.intensity > 0) {
      this.screenShake.x = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
      this.screenShake.intensity *= 0.9;
      if (this.screenShake.intensity < 0.3) {
        this.screenShake.intensity = 0;
        this.screenShake.x = 0;
        this.screenShake.y = 0;
      }
    }

    this._updateRealityCracks(dt);

    this.puzzleManager.update(dt, this.player.x, this.player.y - 24, this.player.onGround);

    this.narrativeSystem.update(dt, this.player.x, this.player.y - 24, this.anchorCount, this.anchors.length);

    this._updateInteractHint();

    if (this.input.justPressed('Escape')) {
      this.sceneManager.switchTo('pause');
    }
  }

  _updateTransition(dt) {
    this.transitionProgress += dt * 0.0008;

    if (this.transitionProgress <= 0.3) {
      this.transitionPhase = 1;
      const t = this.transitionProgress / 0.3;
      this.vignetteRadius = 1 - t * 0.9;
      this.transitionAlpha = t * 0.6;
      for (const p of this.particles) {
        p.vy += 0.5;
      }
    } else if (this.transitionProgress <= 0.7) {
      this.transitionPhase = 2;
      const t = (this.transitionProgress - 0.3) / 0.4;
      this.transitionAlpha = 1;
      this.vignetteRadius = 0.1;
      for (const s of this.fallStreaks) {
        s.y -= s.speed * (dt / 1000);
        if (s.y + s.length < 0) {
          s.y = 720 + Math.random() * 100;
          s.x = Math.random() * 1280;
        }
      }
    } else if (this.transitionProgress <= 1.0) {
      this.transitionPhase = 3;
      const t = (this.transitionProgress - 0.7) / 0.3;
      if (this.transitionPhase === 3 && !this._levelLoaded) {
        this.depth = this.nextDepth;
        this._loadLevel(this.depth);
        this._levelLoaded = true;
      }
      this.transitionAlpha = 1 - t;
      this.vignetteRadius = 0.1 + t * 0.9;
    } else {
      this.transitioning = false;
      this.transitionAlpha = 0;
      this.transitionPhase = 0;
      this.transitionProgress = 0;
      this.vignetteRadius = 1;
      this._levelLoaded = false;
    }
  }

  _updateLevelIntro(dt) {
    this.levelIntroTimer += dt;

    if (this.levelIntroTimer < 600) {
      this.levelIntroAlpha = this.levelIntroTimer / 600;
    } else if (this.levelIntroTimer < 2400) {
      this.levelIntroAlpha = 1;
    } else if (this.levelIntroTimer < 3000) {
      this.levelIntroAlpha = 1 - (this.levelIntroTimer - 2400) / 600;
    } else {
      this.levelIntroAlpha = 0;
      this.showingLevelIntro = false;
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

    ctx.save();
    ctx.translate(this.screenShake.x, this.screenShake.y);

    if (this.glitchBurst) {
      ctx.translate((Math.random() - 0.5) * 10, 0);
    }

    ctx.fillStyle = level.bgColor;
    ctx.fillRect(-10, -10, w + 20, h + 20);

    this._renderLevelBackground(ctx, w, h, level);
    this._renderLevelStars(ctx, w, h);
    this._renderLevelFog(ctx, w, h, level);
    this._renderDecorations(ctx, w, h);
    this._renderPlatforms(ctx, w, h, level);
    this._renderAnchors(ctx, w, h);
    this.narrativeSystem.renderFragments(ctx);
    this.puzzleManager.render(ctx);
    this._renderParticles(ctx, w, h, level);
    this._renderPlayerTrail(ctx);
    this._renderPlayer(ctx, w, h);
    this._renderInteractHint(ctx, w, h);
    this._renderHUD(ctx, w, h, level);
    this._renderErosionOverlay(ctx, w, h);
    this._renderColorShift(ctx, w, h);
    this._renderScanLines(ctx, w, h);
    this._renderRealityCracks(ctx, w, h);
    this._renderDepthEffects(ctx, w, h);
    this.narrativeSystem.renderLightFlares(ctx);
    this.narrativeSystem.renderWhisperParticles(ctx);
    this.narrativeSystem.renderNarrativeEvent(ctx, w, h, this.depth);

    if (this.levelComplete) {
      this._renderLevelComplete(ctx, w, h, level);
    }

    if (this.showingLevelIntro) {
      this._renderLevelIntro(ctx, w, h, level);
    }

    if (this.transitioning) {
      this._renderTransition(ctx, w, h);
    } else if (this.transitionAlpha > 0) {
      ctx.fillStyle = `rgba(10, 14, 26, ${this.transitionAlpha})`;
      ctx.fillRect(-10, -10, w + 20, h + 20);
    }

    ctx.restore();
  }

  _renderTransition(ctx, w, h) {
    if (this.transitionPhase === 1) {
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);
      const r = maxR * this.vignetteRadius;
      const gradient = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, maxR);
      gradient.addColorStop(0, 'rgba(10, 14, 26, 0)');
      gradient.addColorStop(0.6, `rgba(10, 14, 26, ${this.transitionAlpha * 0.5})`);
      gradient.addColorStop(1, `rgba(10, 14, 26, ${this.transitionAlpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    } else if (this.transitionPhase === 2) {
      ctx.fillStyle = 'rgba(10, 14, 26, 1)';
      ctx.fillRect(0, 0, w, h);

      for (const s of this.fallStreaks) {
        const gradient = ctx.createLinearGradient(s.x, s.y + s.length, s.x, s.y);
        gradient.addColorStop(0, `rgba(0, 255, 212, 0)`);
        gradient.addColorStop(1, `rgba(0, 255, 212, ${s.alpha})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y + s.length);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }

      const displayDepth = this.nextDepth + 1;
      const t = (this.transitionProgress - 0.3) / 0.4;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 72px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = `rgba(0, 255, 212, ${0.3 + 0.4 * Math.sin(this.time * 0.005)})`;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 30;
      ctx.fillText(`${displayDepth}`, w / 2, h / 2);
      ctx.shadowBlur = 0;
      ctx.font = '300 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = `rgba(107, 107, 141, ${0.5 + 0.3 * Math.sin(this.time * 0.003)})`;
      ctx.fillText('深度', w / 2, h / 2 + 50);
      ctx.restore();
    } else if (this.transitionPhase === 3) {
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);
      const t = (this.transitionProgress - 0.7) / 0.3;
      const r = maxR * t;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      gradient.addColorStop(0, `rgba(10, 14, 26, 0)`);
      gradient.addColorStop(Math.min(t, 0.99), `rgba(10, 14, 26, 0)`);
      gradient.addColorStop(1, `rgba(10, 14, 26, ${1 - t})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderLevelIntro(ctx, w, h, level) {
    if (this.levelIntroAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.levelIntroAlpha;

    const cx = w / 2;
    const cy = h / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 40 * this.levelIntroAlpha;
    ctx.font = '600 48px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
    ctx.fillText(level.name, cx, cy - 20);
    ctx.shadowBlur = 0;

    ctx.font = '300 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText(level.subtitle || '', cx, cy + 25);

    const lineProgress = Math.min(1, this.levelIntroTimer / 800);
    const lineWidth = lineProgress * 200;
    ctx.strokeStyle = COLORS.FLUORESCENT_CYAN;
    ctx.lineWidth = 1;
    ctx.globalAlpha = this.levelIntroAlpha * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - lineWidth / 2, cy + 48);
    ctx.lineTo(cx + lineWidth / 2, cy + 48);
    ctx.stroke();

    ctx.restore();
  }

  _renderDepthEffects(ctx, w, h) {
    if (this.depth < 1) return;

    const vignetteStrength = this.depth * 0.12;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const gradient = ctx.createRadialGradient(cx, cy, maxR * 0.4, cx, cy, maxR);
    gradient.addColorStop(0, 'rgba(10, 14, 26, 0)');
    gradient.addColorStop(1, `rgba(10, 14, 26, ${vignetteStrength})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _renderPlayerTrail(ctx) {
    if (this.depth < 1) return;

    const size = 16;
    for (const t of this.playerTrail) {
      if (t.alpha < 0.02) continue;
      ctx.save();
      ctx.globalAlpha = t.alpha * 0.3;
      ctx.translate(t.x, t.y);
      ctx.scale(t.facing, 1);
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.beginPath();
      ctx.ellipse(0, -size * 1.5, size * 0.8, size * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _renderLevelBackground(ctx, w, h, level) {
    const key = level.bgColor + level.fogColor + w + h;
    if (this._bgGradientKey !== key) {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      for (const stop of level.bgGradientStops) {
        gradient.addColorStop(stop.pos, stop.color);
      }
      this._bgGradientCache = gradient;
      this._bgGradientKey = key;
    }
    ctx.fillStyle = this._bgGradientCache;
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
      { cx: w * 0.35 + driftX, cy: h * 0.5 + driftY, r: w * 0.45 },
      { cx: w * 0.65 - driftX * 0.5, cy: h * 0.7 - driftY * 0.3, r: w * 0.4 },
    ];

    for (const fog of fogLayers) {
      const r = fog.r * (0.85 + breathCycle * 0.15);
      const gradient = ctx.createRadialGradient(fog.cx, fog.cy, 0, fog.cx, fog.cy, r);
      gradient.addColorStop(0, `rgba(${level.fogColor}, ${fogAlpha * 0.4})`);
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

      let pulseMultiplier = 1;
      if (this.depth >= 3) {
        pulseMultiplier = 1 + 0.5 * Math.sin(this.time * 0.02 + anchor.pulse * 3);
      }

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size * 3 * pulseMultiplier, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 212, 0.08)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
  }

  _renderParticles(ctx, w, h, level) {
    const orangeParts = [];
    const purpleParts = [];
    const cyanParts = [];
    const whiteParts = [];

    for (const p of this.particles) {
      if (p.colorType === 'orange') orangeParts.push(p);
      else if (p.colorType === 'purple') purpleParts.push(p);
      else if (p.isCyan) cyanParts.push(p);
      else whiteParts.push(p);
    }

    if (orangeParts.length) {
      ctx.fillStyle = 'rgba(255, 107, 53, 1)';
      for (const p of orangeParts) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (purpleParts.length) {
      ctx.fillStyle = 'rgba(138, 43, 226, 1)';
      for (const p of purpleParts) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (cyanParts.length) {
      ctx.fillStyle = 'rgba(0, 255, 212, 1)';
      for (const p of cyanParts) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (whiteParts.length) {
      ctx.fillStyle = 'rgba(232, 230, 240, 1)';
      for (const p of whiteParts) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
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

    const eyeColor = this.depth >= 3 ? COLORS.VOID_ORANGE : COLORS.FLUORESCENT_CYAN;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(3, -size * 2.6, 2, 0, Math.PI * 2);
    ctx.fill();

    if (this.depth >= 2) {
      const flicker = Math.sin(this.time * 0.03) > 0.3 ? 1 : 0.3;
      ctx.globalAlpha = flicker;
    }

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

    ctx.globalAlpha = 1;
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
        let pulseSize = 8;
        if (this.depth >= 3) {
          pulseSize = 8 + 3 * Math.sin(this.time * 0.02 + i * 2);
        }
        ctx.beginPath();
        ctx.arc(ax, ay, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
        ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
        ctx.shadowBlur = 6;
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

    let depthText = `深度 ${this.depth + 1}`;
    if (this.depth >= 2) {
      const glitchChars = '!@#$%^&*<>[]{}|~';
      if (Math.random() < 0.08) {
        const idx = Math.floor(Math.random() * depthText.length);
        depthText = depthText.substring(0, idx) + glitchChars[Math.floor(Math.random() * glitchChars.length)] + depthText.substring(idx + 1);
      }
    }

    ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'right';
    ctx.fillText(depthText, w - 30, 30);

    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(107, 107, 141, 0.6)';
    ctx.fillText(level.name, w - 30, 48);

    ctx.restore();
  }

  _renderErosionOverlay(ctx, w, h) {
    const effectiveErosion = this.erosionLevel * 0.6 + this.depth * 0.15;
    if (effectiveErosion < 0.05) return;

    const intensity = Math.min(1, effectiveErosion);
    const depthIndex = this.currentLevel ? this.currentLevel.depthIndex : 0;

    const erosionPoints = [
      { x: w * 0.15, y: h * 0.2 },
      { x: w * 0.85, y: h * 0.35 },
      { x: w * 0.6, y: h * 0.7 },
      { x: w * 0.3, y: h * 0.85 },
    ];

    const maxPoints = Math.floor(intensity * erosionPoints.length);
    for (let i = 0; i < maxPoints; i++) {
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

  _initScanLines() {
    this.scanLines = [];
    for (let y = 0; y < 720; y += 3) {
      this.scanLines.push({
        y,
        isGlitch: Math.random() < 0.05,
        offset: Math.random() * 6 - 3,
        thickness: 1,
      });
    }
  }

  _renderScanLines(ctx, w, h) {
    if (this.depth < 1) return;

    const baseAlpha = this.depth === 1 ? 0.02 : this.depth === 2 ? 0.04 : 0.07;
    const glitchBoost = this.glitchBurst ? 0.15 : 0;

    ctx.save();
    ctx.globalAlpha = baseAlpha + glitchBoost * 0.3;

    if (this.depth >= 3) {
      ctx.fillStyle = 'rgba(255, 107, 53, 1)';
    } else {
      ctx.fillStyle = 'rgba(10, 14, 26, 1)';
    }

    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    if (this.glitchBurst) {
      const burstY = Math.random() * h;
      const burstH = 10 + Math.random() * 40;
      ctx.globalAlpha = 0.08 + Math.random() * 0.07;
      ctx.fillStyle = 'rgba(255, 107, 53, 1)';
      ctx.fillRect((Math.random() - 0.5) * 15, burstY, w, burstH);
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = 'rgba(0, 255, 212, 1)';
      ctx.fillRect((Math.random() - 0.5) * 8, burstY + 2, w, burstH * 0.5);
    }

    ctx.restore();
  }

  _renderColorShift(ctx, w, h) {
    if (this.colorShiftAmount < 0.01) return;

    ctx.save();
    const alpha = Math.min(0.25, this.colorShiftAmount * 0.15);

    if (this.depth >= 2) {
      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, `rgba(255, 107, 53, ${alpha * 0.6})`);
      gradient.addColorStop(0.4, `rgba(180, 40, 20, ${alpha * 0.3})`);
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    } else if (this.depth >= 1) {
      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, `rgba(180, 100, 60, ${alpha * 0.3})`);
      gradient.addColorStop(0.5, `rgba(80, 60, 100, ${alpha * 0.1})`);
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    if (this.depth >= 3) {
      const pulse = Math.sin(this.erosionTime * 0.001) * 0.5 + 0.5;
      const bleedAlpha = 0.03 * pulse * this.colorShiftAmount;
      ctx.fillStyle = `rgba(255, 60, 20, ${bleedAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  _initRealityCracks() {
    this.realityCracks = [];
    if (this.depth < 2) return;

    const crackCount = this.depth >= 3 ? 5 : 2;
    const edges = ['top', 'bottom', 'left', 'right'];

    for (let i = 0; i < crackCount; i++) {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      let x, y, angle;

      switch (edge) {
        case 'top':
          x = Math.random() * 1280;
          y = 0;
          angle = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
          break;
        case 'bottom':
          x = Math.random() * 1280;
          y = 720;
          angle = -Math.PI * 0.3 - Math.random() * Math.PI * 0.4;
          break;
        case 'left':
          x = 0;
          y = Math.random() * 720;
          angle = -Math.PI * 0.2 + Math.random() * Math.PI * 0.4;
          break;
        case 'right':
          x = 1280;
          y = Math.random() * 720;
          angle = Math.PI * 0.6 + Math.random() * Math.PI * 0.4;
          break;
      }

      const segments = [];
      const totalSegments = 4 + Math.floor(Math.random() * 6);
      let cx = x, cy = y, ca = angle;

      for (let j = 0; j < totalSegments; j++) {
        const len = 15 + Math.random() * 35;
        const nx = cx + Math.cos(ca) * len;
        const ny = cy + Math.sin(ca) * len;
        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });
        cx = nx;
        cy = ny;
        ca += (Math.random() - 0.5) * 0.8;
      }

      this.realityCracks.push({
        segments,
        growth: 0,
        maxGrowth: totalSegments,
        healTimer: 10000 + Math.random() * 15000,
        age: 0,
        edge,
      });
    }
  }

  _updateRealityCracks(dt) {
    for (const crack of this.realityCracks) {
      crack.age += dt;

      if (crack.growth < crack.maxGrowth) {
        crack.growth += dt * 0.003;
        if (crack.growth > crack.maxGrowth) crack.growth = crack.maxGrowth;
      }

      crack.healTimer -= dt;
      if (crack.healTimer <= 0) {
        crack.growth = 0;
        crack.healTimer = 10000 + Math.random() * 15000;
        crack.age = 0;
      }
    }
  }

  _renderRealityCracks(ctx, w, h) {
    if (this.depth < 2) return;

    ctx.save();
    for (const crack of this.realityCracks) {
      const visibleSegments = Math.floor(crack.growth);
      if (visibleSegments <= 0) continue;

      const partialProgress = crack.growth - visibleSegments;

      for (let i = 0; i < Math.min(visibleSegments, crack.segments.length); i++) {
        const seg = crack.segments[i];
        const isLast = i === visibleSegments - 1;
        const segAlpha = isLast ? partialProgress : 1;

        const flicker = Math.sin(this.erosionTime * 0.005 + i * 0.5) * 0.3 + 0.7;

        ctx.strokeStyle = `rgba(255, 107, 53, ${0.4 * segAlpha * flicker})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 200, 150, ${0.15 * segAlpha * flicker})`;
        ctx.lineWidth = 0.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }

      if (crack.growth > 2) {
        const tipSeg = crack.segments[Math.min(visibleSegments - 1, crack.segments.length - 1)];
        const glow = ctx.createRadialGradient(tipSeg.x2, tipSeg.y2, 0, tipSeg.x2, tipSeg.y2, 15);
        glow.addColorStop(0, `rgba(255, 107, 53, ${0.12 * Math.sin(this.erosionTime * 0.004) * 0.5 + 0.5})`);
        glow.addColorStop(1, 'rgba(255, 107, 53, 0)');
        ctx.fillStyle = glow;
        ctx.shadowBlur = 0;
        ctx.fillRect(tipSeg.x2 - 15, tipSeg.y2 - 15, 30, 30);
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

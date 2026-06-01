import { Scene } from '../core/scene.js';
import { COLORS } from '../constants.js';

export class PrologueScene extends Scene {
  constructor(input, sceneManager, audioSystem) {
    super('prologue');
    this.input = input;
    this.sceneManager = sceneManager;
    this.audio = audioSystem;
    this.time = 0;
    this.phase = 0;
    this.phaseTime = 0;
    this.stars = [];
    this.fragments = [];
    this.streaks = [];
    this.scrollOffset = 0;
    this.characterY = 0;
    this.characterAlpha = 0;
    this.coreGlowRadius = 0;
    this.bgColor = { r: 0, g: 0, b: 0 };
    this.texts = [];
    this.scanLines = [];
    this.cracks = [];
    this.skipped = false;
    this.consciousnessStreams = [];
    this.phaseTimers = [4000, 6000, 8000, 8000, 6000];
    this._clickHandler = null;
    this._keyHandler = null;
  }

  onEnter() {
    super.onEnter();
    this.time = 0;
    this.phase = 0;
    this.phaseTime = 0;
    this.stars = [];
    this.fragments = [];
    this.streaks = [];
    this.scrollOffset = 0;
    this.characterY = 0;
    this.characterAlpha = 0;
    this.coreGlowRadius = 0;
    this.bgColor = { r: 0, g: 0, b: 0 };
    this.texts = [];
    this.scanLines = [];
    this.cracks = [];
    this.skipped = false;
    this.consciousnessStreams = [];
    this._generateStars();
    this._generateFragments();
    this._generateStreaks();
    this._generateConsciousnessStreams();
    this._setupSkipHandlers();
    if (this.audio && this.audio.initialized) {
      this.audio.stopBGM();
      this.audio.playBGM(-2);
    }
  }

  onExit() {
    if (this._clickHandler) {
      window.removeEventListener('click', this._clickHandler);
    }
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
    }
  }

  _setupSkipHandlers() {
    this._clickHandler = () => {
      this._advancePhase();
    };
    this._keyHandler = (e) => {
      if (e.code === 'Escape') {
        this.skipped = true;
        this.sceneManager.switchTo('game');
      } else {
        this._advancePhase();
      }
    };
    window.addEventListener('click', this._clickHandler);
    window.addEventListener('keydown', this._keyHandler);
  }

  _advancePhase() {
    if (this.phase < 4) {
      this.phase++;
      this.phaseTime = 0;
      this.texts = [];
      this._onPhaseEnter(this.phase);
    }
  }

  _onPhaseEnter(phase) {
    switch (phase) {
      case 1:
        this._showText('你是谁？', 0.5, 0.45, COLORS.FLUORESCENT_CYAN, 24, COLORS.FLUORESCENT_CYAN, 15);
        break;
      case 2:
        this._showText('这些……是我的记忆吗？', 0.5, 0.45, COLORS.MOONLIGHT_WHITE, 22, null, 0);
        break;
      case 3:
        this._showText('忘却之海……在等待', 0.5, 0.45, COLORS.STARDUST_GRAY, 22, null, 0);
        break;
      case 4:
        this._showText('那由他', 0.5, 0.45, COLORS.FLUORESCENT_CYAN, 48, COLORS.FLUORESCENT_CYAN, 25);
        break;
    }
  }

  _showText(text, xRatio, yRatio, color, fontSize, glowColor, glowSize) {
    this.texts.push({
      text,
      x: xRatio,
      y: yRatio,
      alpha: 0,
      targetAlpha: 1,
      fadeInDuration: 800,
      holdDuration: 2000,
      fadeOutDuration: 500,
      elapsed: 0,
      font: `${fontSize}px "Segoe UI", system-ui, sans-serif`,
      color,
      glowColor: glowColor || color,
      glowSize,
      state: 'fadeIn',
    });
  }

  _generateStars() {
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.stars.push({
        angle,
        dist: 0,
        speed: 0.5 + Math.random() * 2.5,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        active: false,
        delay: Math.random() * 2000,
      });
    }
  }

  _generateFragments() {
    this.fragments = [];
    const shapes = ['diamond', 'hexagon', 'triangle'];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
      const startDist = 1.2 + Math.random() * 0.3;
      this.fragments.push({
        shape: shapes[i % 3],
        x: 0.5 + Math.cos(angle) * startDist,
        y: 0.5 + Math.sin(angle) * startDist,
        targetX: 0.3 + Math.random() * 0.4,
        targetY: 0.25 + Math.random() * 0.5,
        size: 8 + Math.random() * 12,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.002,
        alpha: 0,
        color: Math.random() > 0.3 ? COLORS.FLUORESCENT_CYAN : COLORS.MOONLIGHT_WHITE,
        trail: [],
        speed: 0.0003 + Math.random() * 0.0004,
      });
    }
  }

  _generateStreaks() {
    this.streaks = [];
    for (let i = 0; i < 60; i++) {
      this.streaks.push({
        x: Math.random(),
        y: 1.0 + Math.random() * 0.5,
        length: 0.05 + Math.random() * 0.15,
        speed: 0.0005 + Math.random() * 0.0015,
        alpha: 0,
        delay: Math.random() * 3000,
        active: false,
      });
    }
  }

  _generateConsciousnessStreams() {
    this.consciousnessStreams = [];
    for (let i = 0; i < 150; i++) {
      this.consciousnessStreams.push({
        x: Math.random(),
        y: Math.random(),
        vx: 0,
        vy: 0,
        memoryWeight: 0.3 + Math.random() * 0.7,
        baseAlpha: 0.05 + Math.random() * 0.2,
        isCyan: Math.random() > 0.35,
        trail: [],
        maxTrail: 8 + Math.floor(Math.random() * 12),
        life: 200 + Math.random() * 600,
        maxLife: 800,
      });
    }
  }

  update(dt) {
    this.time += dt;
    this.phaseTime += dt;

    if (this.phase >= this.phaseTimers.length) return;

    if (this.phaseTime >= this.phaseTimers[this.phase] && !this.skipped) {
      this.phase++;
      this.phaseTime = 0;
      this.texts = [];
      this._onPhaseEnter(this.phase);
      if (this.phase >= 5) {
        this.sceneManager.switchTo('game');
        return;
      }
    }

    switch (this.phase) {
      case 0:
        this._updatePhase0(dt);
        break;
      case 1:
        this._updatePhase1(dt);
        break;
      case 2:
        this._updatePhase2(dt);
        break;
      case 3:
        this._updatePhase3(dt);
        break;
      case 4:
        this._updatePhase4(dt);
        break;
    }

    this._updateTexts(dt);
    this._updateConsciousnessStreams(dt);
  }

  _updatePhase0(dt) {
    this.coreGlowRadius = Math.min(3, this.phaseTime / 4000 * 3);
    if (this.phaseTime >= 500 && this.texts.length === 0) {
      this._showText('……', 0.5, 0.45, COLORS.MOONLIGHT_WHITE, 28, null, 0);
    }
  }

  _updatePhase1(dt) {
    const progress = this.phaseTime / 6000;
    this.coreGlowRadius = 3 + progress * 27;
    const pulse = Math.sin(this.phaseTime * 0.003) * 0.3 + 0.7;
    this.coreGlowRadius *= pulse;

    this.characterAlpha = Math.min(0.6, progress * 0.6);

    for (const star of this.stars) {
      if (this.phaseTime < star.delay) continue;
      star.active = true;
      star.dist += star.speed * dt * (0.5 + star.dist * 0.01);
    }
  }

  _updatePhase2(dt) {
    const progress = this.phaseTime / 8000;
    this.bgColor.r += (10 - this.bgColor.r) * 0.01;
    this.bgColor.g += (14 - this.bgColor.g) * 0.01;
    this.bgColor.b += (26 - this.bgColor.b) * 0.01;

    for (const frag of this.fragments) {
      frag.x += (frag.targetX - frag.x) * frag.speed * dt;
      frag.y += (frag.targetY - frag.y) * frag.speed * dt;
      frag.rotation += frag.rotSpeed * dt;
      frag.alpha = Math.min(0.8, frag.alpha + dt * 0.0005);
      frag.trail.push({ x: frag.x, y: frag.y, alpha: 0.4 });
      if (frag.trail.length > 20) frag.trail.shift();
      for (const t of frag.trail) {
        t.alpha *= 0.95;
      }
    }
  }

  _updatePhase3(dt) {
    const progress = this.phaseTime / 8000;
    this.scrollOffset += dt * (0.02 + progress * 0.08);
    this.characterY += dt * (0.03 + progress * 0.1);

    for (const streak of this.streaks) {
      if (this.phaseTime < streak.delay) continue;
      streak.active = true;
      streak.y -= streak.speed * dt;
      streak.alpha = Math.min(0.6, streak.alpha + dt * 0.002);
      if (streak.y + streak.length < -0.1) {
        streak.y = 1.0 + Math.random() * 0.3;
        streak.x = Math.random();
        streak.alpha = 0;
      }
    }

    if (Math.random() < 0.02) {
      this.scanLines.push({
        y: Math.random(),
        alpha: 0.1 + Math.random() * 0.15,
        speed: 0.0002 + Math.random() * 0.0003,
      });
    }
    for (let i = this.scanLines.length - 1; i >= 0; i--) {
      this.scanLines[i].y += this.scanLines[i].speed * dt;
      this.scanLines[i].alpha *= 0.998;
      if (this.scanLines[i].alpha < 0.01 || this.scanLines[i].y > 1.1) {
        this.scanLines.splice(i, 1);
      }
    }

    if (Math.random() < 0.005) {
      this.cracks.push({
        x: 0.2 + Math.random() * 0.6,
        y: 0.2 + Math.random() * 0.6,
        length: 20 + Math.random() * 60,
        angle: Math.random() * Math.PI * 2,
        alpha: 0.1 + Math.random() * 0.2,
        life: 1000 + Math.random() * 2000,
      });
    }
    for (let i = this.cracks.length - 1; i >= 0; i--) {
      this.cracks[i].life -= dt;
      this.cracks[i].alpha *= 0.997;
      if (this.cracks[i].life <= 0 || this.cracks[i].alpha < 0.01) {
        this.cracks.splice(i, 1);
      }
    }
  }

  _updatePhase4(dt) {
    const progress = this.phaseTime / 6000;
    this.bgColor.r *= 0.998;
    this.bgColor.g *= 0.998;
    this.bgColor.b *= 0.998;
    this.characterY += dt * 0.05;
    this.characterAlpha = Math.max(0, this.characterAlpha - dt * 0.0003);
    this.coreGlowRadius = Math.max(0, this.coreGlowRadius - dt * 0.005);

    for (const frag of this.fragments) {
      frag.alpha = Math.max(0, frag.alpha - dt * 0.0005);
    }
    for (const star of this.stars) {
      star.alpha = Math.max(0, star.alpha - dt * 0.0003);
    }
  }

  _updateTexts(dt) {
    for (const t of this.texts) {
      t.elapsed += dt;
      switch (t.state) {
        case 'fadeIn':
          t.alpha = Math.min(1, t.elapsed / t.fadeInDuration);
          if (t.elapsed >= t.fadeInDuration) {
            t.state = 'hold';
            t.elapsed = 0;
            t.alpha = 1;
          }
          break;
        case 'hold':
          t.alpha = 1;
          if (t.elapsed >= t.holdDuration) {
            t.state = 'fadeOut';
            t.elapsed = 0;
          }
          break;
        case 'fadeOut':
          t.alpha = Math.max(0, 1 - t.elapsed / t.fadeOutDuration);
          if (t.elapsed >= t.fadeOutDuration) {
            t.state = 'done';
            t.alpha = 0;
          }
          break;
      }
    }
  }

  _updateConsciousnessStreams(dt) {
    if (this.phase < 2) return;

    const dtSec = dt / 1000;
    const flowSpeed = this.phase >= 3 ? 2.0 : 1.0;
    const noiseScale = 0.003;

    for (const stream of this.consciousnessStreams) {
      let px = stream.x * 1200;
      let py = stream.y * 800;

      let noiseVal = Math.sin(px * noiseScale + this.time * 0.0003) * Math.cos(py * noiseScale + this.time * 0.0002);
      let angle = noiseVal * Math.PI * 4;
      let forceX = Math.cos(angle) * flowSpeed * 0.001;
      let forceY = Math.sin(angle) * flowSpeed * 0.001;

      for (const frag of this.fragments) {
        if (frag.alpha <= 0) continue;
        let dx = frag.x - stream.x;
        let dy = frag.y - stream.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.15 && dist > 0.01) {
          let attraction = frag.size * 0.0001 * (1.0 - dist / 0.15);
          forceX += (dx / dist) * attraction;
          forceY += (dy / dist) * attraction;
        }
      }

      if (this.phase >= 3) {
        forceY += 0.0005;
      }

      stream.vx = stream.vx * 0.92 + forceX * 0.08;
      stream.vy = stream.vy * 0.92 + forceY * 0.08;
      stream.x += stream.vx;
      stream.y += stream.vy;

      stream.trail.push({ x: stream.x, y: stream.y });
      if (stream.trail.length > stream.maxTrail) {
        stream.trail.shift();
      }

      stream.life -= dt * 0.05;

      if (stream.x < -0.1 || stream.x > 1.1 || stream.y < -0.1 || stream.y > 1.1 || stream.life <= 0) {
        stream.x = Math.random();
        stream.y = Math.random();
        stream.vx = 0;
        stream.vy = 0;
        stream.trail = [];
        stream.life = 200 + Math.random() * 600;
        stream.maxLife = stream.life;
      }
    }

    if (this.phase >= 4) {
      for (const stream of this.consciousnessStreams) {
        stream.baseAlpha = Math.max(0, stream.baseAlpha - dt * 0.0001);
      }
    }
  }

  render(ctx) {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    this._renderBackground(ctx, w, h);
    this._renderConsciousnessStreams(ctx, w, h);
    this._renderCoreGlow(ctx, w, h);
    this._renderStars(ctx, w, h);
    this._renderCharacter(ctx, w, h);
    this._renderFragments(ctx, w, h);
    this._renderStreaks(ctx, w, h);
    this._renderScanLines(ctx, w, h);
    this._renderCracks(ctx, w, h);
    this._renderTexts(ctx, w, h);
    this._renderDepthGradient(ctx, w, h);
  }

  _renderBackground(ctx, w, h) {
    const r = Math.round(this.bgColor.r);
    const g = Math.round(this.bgColor.g);
    const b = Math.round(this.bgColor.b);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, w, h);
  }

  _renderConsciousnessStreams(ctx, w, h) {
    if (this.phase < 2) return;

    for (const stream of this.consciousnessStreams) {
      if (stream.trail.length < 2 || stream.baseAlpha <= 0) continue;

      let lifeRatio = stream.life / stream.maxLife;
      let alpha = stream.baseAlpha * lifeRatio;

      for (let i = 1; i < stream.trail.length; i++) {
        let segAlpha = alpha * (i / stream.trail.length);
        if (segAlpha < 0.005) continue;

        let color = stream.isCyan ? '0, 255, 212' : '232, 230, 240';
        ctx.strokeStyle = `rgba(${color}, ${segAlpha})`;
        ctx.lineWidth = Math.max(0.3, 1.2 * lifeRatio * (i / stream.trail.length));
        ctx.beginPath();
        ctx.moveTo(stream.trail[i - 1].x * w, stream.trail[i - 1].y * h);
        ctx.lineTo(stream.trail[i].x * w, stream.trail[i].y * h);
        ctx.stroke();
      }
    }
  }

  _renderCoreGlow(ctx, w, h) {
    if (this.coreGlowRadius <= 0) return;
    const cx = w * 0.5;
    const cy = h * 0.5 - this.scrollOffset;

    const pulse = Math.sin(this.time * 0.003) * 0.3 + 0.7;
    const r = this.coreGlowRadius * pulse;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
    gradient.addColorStop(0, `rgba(0, 255, 212, ${0.3 * pulse})`);
    gradient.addColorStop(0.3, `rgba(0, 255, 212, ${0.1 * pulse})`);
    gradient.addColorStop(0.6, `rgba(0, 136, 255, ${0.05 * pulse})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0.5, r * 0.15), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * pulse})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0.5, r * 0.3), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 212, ${0.2 * pulse})`;
    ctx.fill();
  }

  _renderStars(ctx, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.5 - this.scrollOffset;

    for (const star of this.stars) {
      if (!star.active || star.alpha <= 0) continue;
      const sx = cx + Math.cos(star.angle) * star.dist;
      const sy = cy + Math.sin(star.angle) * star.dist;
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 0.003 + star.phase);

      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();

      if (star.size > 1) {
        ctx.globalAlpha = star.alpha * twinkle * 0.15;
        ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  _renderCharacter(ctx, w, h) {
    if (this.characterAlpha <= 0) return;
    const cx = w * 0.5;
    const cy = h * 0.5 + this.characterY - this.scrollOffset;

    ctx.save();
    ctx.globalAlpha = this.characterAlpha;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    gradient.addColorStop(0, 'rgba(26, 16, 53, 0.8)');
    gradient.addColorStop(0.6, 'rgba(26, 16, 53, 0.4)');
    gradient.addColorStop(1, 'rgba(26, 16, 53, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 20, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.phase >= 3) {
      const cloakWave = Math.sin(this.time * 0.005) * 5;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 15);
      ctx.quadraticCurveTo(cx - 15 + cloakWave, cy + 45, cx - 8, cy + 55);
      ctx.quadraticCurveTo(cx, cy + 50, cx + 8, cy + 55);
      ctx.quadraticCurveTo(cx + 15 - cloakWave, cy + 45, cx + 12, cy + 15);
      ctx.fillStyle = 'rgba(26, 16, 53, 0.5)';
      ctx.fill();
    }

    ctx.restore();
  }

  _renderFragments(ctx, w, h) {
    for (const frag of this.fragments) {
      if (frag.alpha <= 0) continue;

      for (let i = 0; i < frag.trail.length; i++) {
        const t = frag.trail[i];
        if (t.alpha < 0.01) continue;
        ctx.globalAlpha = t.alpha * 0.3;
        ctx.fillStyle = frag.color;
        ctx.beginPath();
        ctx.arc(t.x * w, t.y * h, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.globalAlpha = frag.alpha;
      ctx.translate(frag.x * w, frag.y * h);
      ctx.rotate(frag.rotation);
      ctx.fillStyle = frag.color;

      switch (frag.shape) {
        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(0, -frag.size);
          ctx.lineTo(frag.size * 0.6, 0);
          ctx.lineTo(0, frag.size);
          ctx.lineTo(-frag.size * 0.6, 0);
          ctx.closePath();
          ctx.fill();
          break;
        case 'hexagon':
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
            const px = Math.cos(a) * frag.size * 0.7;
            const py = Math.sin(a) * frag.size * 0.7;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -frag.size);
          ctx.lineTo(frag.size * 0.866, frag.size * 0.5);
          ctx.lineTo(-frag.size * 0.866, frag.size * 0.5);
          ctx.closePath();
          ctx.fill();
          break;
      }

      ctx.globalAlpha = frag.alpha * 0.15;
      ctx.shadowColor = frag.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  _renderStreaks(ctx, w, h) {
    for (const streak of this.streaks) {
      if (!streak.active || streak.alpha <= 0) continue;
      const sx = streak.x * w;
      const sy = streak.y * h;
      const len = streak.length * h;

      const gradient = ctx.createLinearGradient(sx, sy, sx, sy - len);
      gradient.addColorStop(0, `rgba(0, 255, 212, 0)`);
      gradient.addColorStop(0.3, `rgba(0, 255, 212, ${streak.alpha})`);
      gradient.addColorStop(0.7, `rgba(0, 136, 255, ${streak.alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(0, 255, 212, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy - len);
      ctx.stroke();
    }
  }

  _renderScanLines(ctx, w, h) {
    for (const line of this.scanLines) {
      if (line.alpha < 0.01) continue;
      ctx.globalAlpha = line.alpha;
      ctx.fillStyle = 'rgba(0, 255, 212, 0.3)';
      ctx.fillRect(0, line.y * h, w, 2);
    }
    ctx.globalAlpha = 1;
  }

  _renderCracks(ctx, w, h) {
    for (const crack of this.cracks) {
      if (crack.alpha < 0.01) continue;
      ctx.save();
      ctx.globalAlpha = crack.alpha;
      ctx.strokeStyle = COLORS.STARDUST_GRAY;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const sx = crack.x * w;
      const sy = crack.y * h;
      ctx.moveTo(sx, sy);
      const segments = 3 + Math.floor(Math.random() * 3);
      let cx = sx;
      let cy = sy;
      const segLen = crack.length / segments;
      for (let i = 0; i < segments; i++) {
        const a = crack.angle + (Math.random() - 0.5) * 0.8;
        cx += Math.cos(a) * segLen;
        cy += Math.sin(a) * segLen;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  _renderTexts(ctx, w, h) {
    for (const t of this.texts) {
      if (t.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.font = t.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = t.color;
      if (t.glowSize > 0) {
        ctx.shadowColor = t.glowColor;
        ctx.shadowBlur = t.glowSize;
      }
      ctx.fillText(t.text, t.x * w, t.y * h);
      if (t.glowSize > 0) {
        ctx.globalAlpha = t.alpha * 0.3;
        ctx.shadowBlur = t.glowSize * 2;
        ctx.fillText(t.text, t.x * w, t.y * h);
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  _renderDepthGradient(ctx, w, h) {
    if (this.phase < 3) return;
    const progress = Math.min(1, this.phaseTime / 8000);
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, `rgba(26, 39, 68, ${progress * 0.3})`);
    gradient.addColorStop(0.33, `rgba(26, 16, 53, ${progress * 0.3})`);
    gradient.addColorStop(0.66, `rgba(42, 10, 26, ${progress * 0.3})`);
    gradient.addColorStop(1, `rgba(10, 0, 5, ${progress * 0.3})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }
}

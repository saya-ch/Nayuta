import { Scene } from '../core/scene.js';
import { COLORS, DEPTH_COLORS } from '../constants.js';
import { saveSystem } from '../core/save-system.js';
import { LevelData } from '../core/level-data.js';

const LEVEL_INFO = [
  { name: '浅层记忆', subtitle: '蓝色童话', depthLabel: 'I', accent: '#00FFD4', accentRgb: '0, 255, 212' },
  { name: '中层记忆', subtitle: '紫色神秘', depthLabel: 'II', accent: '#8B5CF6', accentRgb: '139, 92, 246' },
  { name: '深层记忆', subtitle: '红色压迫', depthLabel: 'III', accent: '#FF6B35', accentRgb: '255, 107, 53' },
  { name: '最深层', subtitle: '宇宙恐怖', depthLabel: 'IV', accent: '#FF0044', accentRgb: '255, 0, 68' },
];

export class LevelSelectScene extends Scene {
  constructor(input, sceneManager, audioSystem) {
    super('levelSelect');
    this.input = input;
    this.sceneManager = sceneManager;
    this.audio = audioSystem;
    this.selectedIndex = 0;
    this.time = 0;
    this.fadeAlpha = 1;
    this.stars = [];
    this.particles = [];
    this.cardAlphas = [0, 0, 0, 0];
    this.hoverGlow = 0;
    this.mouseX = 0.5;
    this.mouseY = 0.5;
  }

  init() {
    super.init();
    this._generateStars();
    this._generateParticles();
    this._setupInput();
  }

  _setupInput() {
    this._mouseMoveHandler = (e) => {
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
    };
    this._clickHandler = (e) => {
      if (this.fadeAlpha > 0.3) return;
      this._handleClick(e.clientX, e.clientY);
    };
    window.addEventListener('mousemove', this._mouseMoveHandler);
    window.addEventListener('click', this._clickHandler);

    this._touchEndHandler = (e) => {
      if (this.fadeAlpha > 0.3) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      this._handleClick(touch.clientX, touch.clientY);
    };
    window.addEventListener('touchend', this._touchEndHandler, { passive: true });
  }

  _handleClick(clientX, clientY) {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cardW = Math.min(220, w * 0.22);
    const cardH = Math.min(280, h * 0.52);
    const gap = Math.min(24, w * 0.02);
    const totalW = 4 * cardW + 3 * gap;
    const startX = (w - totalW) / 2;
    const startY = h * 0.28;

    for (let i = 0; i < 4; i++) {
      const cx = startX + i * (cardW + gap);
      const cy = startY;
      if (clientX >= cx && clientX <= cx + cardW && clientY >= cy && clientY <= cy + cardH) {
        this.selectedIndex = i;
        if (this.audio) this.audio.playSFX('menuSelect');
        this._confirmSelection();
        break;
      }
    }

    const backY = h * 0.88;
    if (clientY >= backY - 20 && clientY <= backY + 20) {
      this._goBack();
    }
  }

  _generateStars() {
    this.stars = [];
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.3,
        brightness: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random(),
      });
    }
  }

  _generateParticles() {
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00008,
        vy: -(Math.random() * 0.0002 + 0.00005),
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  onEnter() {
    super.onEnter();
    this.fadeAlpha = 1;
    this.selectedIndex = 0;
    this.cardAlphas = [0, 0, 0, 0];
    this.hoverGlow = 0;
    this.time = 0;

    const unlocked = saveSystem.getUnlockedDepth();
    this.selectedIndex = Math.min(unlocked, 3);

    if (this.audio) {
      this.audio.playBGM(-1);
    }
  }

  onExit() {
    if (this._mouseMoveHandler) window.removeEventListener('mousemove', this._mouseMoveHandler);
    if (this._clickHandler) window.removeEventListener('click', this._clickHandler);
    if (this._touchEndHandler) window.removeEventListener('touchend', this._touchEndHandler);
  }

  update(dt) {
    this.time += dt;

    if (this.fadeAlpha > 0) {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 0.002);
    }

    for (let i = 0; i < 4; i++) {
      const delay = i * 200;
      if (this.time > delay) {
        this.cardAlphas[i] = Math.min(1, this.cardAlphas[i] + dt * 0.003);
      }
    }

    this.hoverGlow = Math.sin(this.time * 0.003) * 0.3 + 0.7;

    if (this.input.justPressed('ArrowLeft') || this.input.justPressed('KeyA')) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      if (this.audio) this.audio.playSFX('menuSelect');
    }
    if (this.input.justPressed('ArrowRight') || this.input.justPressed('KeyD')) {
      this.selectedIndex = Math.min(3, this.selectedIndex + 1);
      if (this.audio) this.audio.playSFX('menuSelect');
    }
    if (this.input.justPressed('Enter') || this.input.justPressed('Space')) {
      this._confirmSelection();
    }
    if (this.input.justPressed('Escape') || this.input.justPressed('Backspace')) {
      this._goBack();
    }

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
    }
  }

  _confirmSelection() {
    const unlocked = saveSystem.getUnlockedDepth();
    if (this.selectedIndex > unlocked) {
      if (this.audio) this.audio.playSFX('erosionGlitch');
      return;
    }
    if (this.audio) this.audio.playSFX('menuConfirm');
    saveSystem.saveCurrentDepth(this.selectedIndex);
    this.sceneManager.preloadScene('game');
    this.sceneManager.switchTo('game');
  }

  _goBack() {
    if (this.audio) this.audio.playSFX('menuSelect');
    this.sceneManager.switchTo('menu');
  }

  render(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = COLORS.ABYSS_BLUE;
    ctx.fillRect(0, 0, w, h);

    this._renderBackground(ctx, w, h);
    this._renderStars(ctx, w, h);
    this._renderParticles(ctx, w, h);
    this._renderTitle(ctx, w, h);
    this._renderCards(ctx, w, h);
    this._renderBackHint(ctx, w, h);
    this._renderScanLines(ctx, w, h);

    if (this.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(10, 14, 26, ${this.fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  _renderBackground(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0A0E1A');
    gradient.addColorStop(0.3, '#0F1528');
    gradient.addColorStop(0.7, '#1A1035');
    gradient.addColorStop(1, '#0A0812');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const breathCycle = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
    const cx = w * 0.5;
    const cy = h * 0.15;
    const nebula = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.4);
    nebula.addColorStop(0, `rgba(26, 16, 53, ${0.2 + breathCycle * 0.1})`);
    nebula.addColorStop(0.5, `rgba(26, 16, 53, ${0.05 + breathCycle * 0.03})`);
    nebula.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, w, h);
  }

  _renderStars(ctx, w, h) {
    const parallaxX = (this.mouseX - 0.5) * 8;
    const parallaxY = (this.mouseY - 0.5) * 8;

    for (const star of this.stars) {
      const twinkle = 0.4 + 0.6 * Math.sin(this.time * 0.002 + star.phase);
      const alpha = star.brightness * twinkle;
      const sx = star.x * w + parallaxX * star.depth;
      const sy = star.y * h + parallaxY * star.depth;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(232, 230, 240, 1)';
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _renderParticles(ctx, w, h) {
    for (const p of this.particles) {
      const sx = p.x * w;
      const sy = p.y * h;
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 0.003 + p.phase);
      ctx.globalAlpha = p.alpha * twinkle;
      ctx.fillStyle = 'rgba(0, 255, 212, 1)';
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _renderTitle(ctx, w, h) {
    const titleY = h * 0.1;
    const titleAlpha = Math.min(1, this.time / 800);

    ctx.save();
    ctx.globalAlpha = titleAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText('选择深渊层级', w / 2, titleY);

    const lineW = 120;
    ctx.strokeStyle = `rgba(0, 255, 212, 0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - lineW / 2, titleY + 16);
    ctx.lineTo(w / 2 + lineW / 2, titleY + 16);
    ctx.stroke();

    ctx.restore();
  }

  _renderCards(ctx, w, h) {
    const cardW = Math.min(220, w * 0.22);
    const cardH = Math.min(280, h * 0.52);
    const gap = Math.min(24, w * 0.02);
    const totalW = 4 * cardW + 3 * gap;
    const startX = (w - totalW) / 2;
    const startY = h * 0.2;
    const unlocked = saveSystem.getUnlockedDepth();
    const saveData = saveSystem.getData();

    for (let i = 0; i < 4; i++) {
      const cx = startX + i * (cardW + gap);
      const cy = startY;
      const info = LEVEL_INFO[i];
      const isUnlocked = i <= unlocked;
      const isSelected = i === this.selectedIndex;
      const cardAlpha = this.cardAlphas[i] || 0;

      if (cardAlpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = cardAlpha;

      this._renderCardBackground(ctx, cx, cy, cardW, cardH, info, isUnlocked, isSelected);

      if (isUnlocked) {
        this._renderCardContent(ctx, cx, cy, cardW, cardH, info, i, saveData, isSelected);
      } else {
        this._renderLockedCard(ctx, cx, cy, cardW, cardH, info, i);
      }

      ctx.restore();
    }
  }

  _renderCardBackground(ctx, cx, cy, cardW, cardH, info, isUnlocked, isSelected) {
    const r = 8;

    ctx.beginPath();
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(cx + cardW - r, cy);
    ctx.arcTo(cx + cardW, cy, cx + cardW, cy + r, r);
    ctx.lineTo(cx + cardW, cy + cardH - r);
    ctx.arcTo(cx + cardW, cy + cardH, cx + cardW - r, cy + cardH, r);
    ctx.lineTo(cx + r, cy + cardH);
    ctx.arcTo(cx, cy + cardH, cx, cy + cardH - r, r);
    ctx.lineTo(cx, cy + r);
    ctx.arcTo(cx, cy, cx + r, cy, r);
    ctx.closePath();

    if (isUnlocked) {
      const gradient = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
      gradient.addColorStop(0, `rgba(${info.accentRgb}, 0.04)`);
      gradient.addColorStop(0.5, 'rgba(10, 14, 26, 0.85)');
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0.95)');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.7)';
    }
    ctx.fill();

    if (isSelected && isUnlocked) {
      const glowPulse = this.hoverGlow;
      ctx.strokeStyle = `rgba(${info.accentRgb}, ${0.4 * glowPulse})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = info.accent;
      ctx.shadowBlur = 15 * glowPulse;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const glowGrad = ctx.createRadialGradient(
        cx + cardW / 2, cy + cardH / 2, 0,
        cx + cardW / 2, cy + cardH / 2, cardW * 0.6
      );
      glowGrad.addColorStop(0, `rgba(${info.accentRgb}, ${0.06 * glowPulse})`);
      glowGrad.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(cx - 20, cy - 20, cardW + 40, cardH + 40);
    } else if (isUnlocked) {
      ctx.strokeStyle = `rgba(${info.accentRgb}, 0.1)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(107, 107, 141, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  _renderCardContent(ctx, cx, cy, cardW, cardH, info, depthIndex, saveData, isSelected) {
    const centerX = cx + cardW / 2;
    const progress = saveData.levelProgress[depthIndex] || { anchorsCollected: 0, totalAnchors: 0, completed: false };
    const level = LevelData.getLevel(depthIndex);
    const totalAnchors = level.anchors ? level.anchors.length : (progress.totalAnchors || 0);
    const anchorsCollected = progress.anchorsCollected || 0;
    const isCompleted = progress.completed;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '200 42px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(${info.accentRgb}, ${isSelected ? 0.8 : 0.4})`;
    if (isSelected) {
      ctx.shadowColor = info.accent;
      ctx.shadowBlur = 20 * this.hoverGlow;
    }
    ctx.fillText(info.depthLabel, centerX, cy + 45);
    ctx.shadowBlur = 0;

    ctx.font = '500 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = isSelected ? COLORS.MOONLIGHT_WHITE : COLORS.STARDUST_GRAY;
    ctx.fillText(info.name, centerX, cy + 90);

    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(${info.accentRgb}, 0.5)`;
    ctx.fillText(info.subtitle, centerX, cy + 112);

    const dividerY = cy + 135;
    ctx.strokeStyle = `rgba(${info.accentRgb}, 0.15)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 20, dividerY);
    ctx.lineTo(cx + cardW - 20, dividerY);
    ctx.stroke();

    const anchorY = cy + 165;
    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'left';
    ctx.fillText('记忆之锚', cx + 20, anchorY);

    ctx.textAlign = 'right';
    ctx.fillStyle = isCompleted ? info.accent : COLORS.MOONLIGHT_WHITE;
    ctx.fillText(`${anchorsCollected}/${totalAnchors}`, cx + cardW - 20, anchorY);

    const barY = anchorY + 16;
    const barW = cardW - 40;
    const barH = 4;
    const barProgress = totalAnchors > 0 ? anchorsCollected / totalAnchors : 0;

    ctx.fillStyle = 'rgba(107, 107, 141, 0.15)';
    ctx.fillRect(cx + 20, barY, barW, barH);

    if (barProgress > 0) {
      const barGrad = ctx.createLinearGradient(cx + 20, barY, cx + 20 + barW * barProgress, barY);
      barGrad.addColorStop(0, `rgba(${info.accentRgb}, 0.8)`);
      barGrad.addColorStop(1, `rgba(${info.accentRgb}, 0.4)`);
      ctx.fillStyle = barGrad;
      ctx.fillRect(cx + 20, barY, barW * barProgress, barH);
    }

    if (isCompleted) {
      const checkY = cy + cardH - 40;
      ctx.textAlign = 'center';
      ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = `rgba(${info.accentRgb}, 0.6)`;
      ctx.fillText('✦ 已完成', centerX, checkY);
    }

    if (isSelected) {
      const pulseR = 3 + Math.sin(this.time * 0.005) * 1.5;
      ctx.beginPath();
      ctx.arc(cx + 12, cy + 12, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${info.accentRgb}, ${0.5 * this.hoverGlow})`;
      ctx.fill();
    }
  }

  _renderLockedCard(ctx, cx, cy, cardW, cardH, info, depthIndex) {
    const centerX = cx + cardW / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '200 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(107, 107, 141, 0.2)';
    ctx.fillText(info.depthLabel, centerX, cy + 50);

    ctx.font = '300 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(107, 107, 141, 0.25)';
    ctx.fillText('◇', centerX, cy + cardH / 2 - 10);

    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(107, 107, 141, 0.3)';
    ctx.fillText('未解锁', centerX, cy + cardH / 2 + 20);

    const requiredDepth = depthIndex;
    ctx.font = '300 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(107, 107, 141, 0.2)';
    ctx.fillText(`完成第${requiredDepth}层解锁`, centerX, cy + cardH / 2 + 40);
  }

  _renderBackHint(ctx, w, h) {
    const y = h * 0.88;
    const alpha = Math.min(1, Math.max(0, (this.time - 1500) / 500));
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha * (0.4 + 0.2 * Math.sin(this.time * 0.002));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText('← → 选择  ·  Enter 确认  ·  Esc 返回', w / 2, y);
    ctx.restore();
  }

  _renderScanLines(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.012;
    ctx.fillStyle = 'rgba(10, 14, 26, 1)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
  }
}

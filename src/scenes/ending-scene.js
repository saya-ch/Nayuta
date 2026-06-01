import { Scene } from '../core/scene.js';
import { COLORS } from '../constants.js';
import { saveSystem } from '../core/save-system.js';
import { achievementSystem } from '../core/achievement-system.js';

export class EndingScene extends Scene {
  constructor(input, sceneManager, audioSystem) {
    super('ending');
    this.input = input;
    this.sceneManager = sceneManager;
    this.audio = audioSystem;
    this.time = 0;
    this.phase = 'descent';
    this.phaseTimer = 0;
    this.selectedChoice = -1;
    this.choiceAlpha = 0;
    this.fadeAlpha = 0;
    this.particles = [];
    this.eyeParticles = [];
    this.cracks = [];
    this.choiceMade = false;
    this.endingAlpha = 0;
    this.endingTimer = 0;
    this.endingText = '';
    this.endingSubtext = '';
    this.stars = [];
    this.pulseRings = [];
    this.finalFadeAlpha = 0;
    this.showCredits = false;
    this.creditsAlpha = 0;
    this.creditsScroll = 0;
    this.statsAlpha = 0;
    this.statsLineAlphas = [];
    this.statsProgressBars = [];
    this.statsData = null;
  }

  onEnter() {
    super.onEnter();
    this.time = 0;
    this.phase = 'descent';
    this.phaseTimer = 0;
    this.selectedChoice = -1;
    this.choiceAlpha = 0;
    this.fadeAlpha = 1;
    this.choiceMade = false;
    this.endingAlpha = 0;
    this.endingTimer = 0;
    this.finalFadeAlpha = 0;
    this.showCredits = false;
    this.creditsAlpha = 0;
    this.creditsScroll = 0;
    this._generateParticles();
    this._generateStars();
    this._generateCracks();
    if (this.audio) {
      this.audio.playBGM(3);
    }
  }

  _generateParticles() {
    this.particles = [];
    for (let i = 0; i < 200; i++) {
      this.particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        isCyan: Math.random() > 0.5,
        isOrange: Math.random() > 0.8,
      });
    }
  }

  _generateStars() {
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        size: Math.random() * 1.2 + 0.3,
        brightness: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  _generateCracks() {
    this.cracks = [];
    for (let i = 0; i < 8; i++) {
      const edge = Math.floor(Math.random() * 4);
      let x, y, angle;
      switch (edge) {
        case 0: x = Math.random() * 1280; y = 0; angle = Math.PI * 0.3 + Math.random() * Math.PI * 0.4; break;
        case 1: x = Math.random() * 1280; y = 720; angle = -Math.PI * 0.3 - Math.random() * Math.PI * 0.4; break;
        case 2: x = 0; y = Math.random() * 720; angle = -Math.PI * 0.2 + Math.random() * Math.PI * 0.4; break;
        case 3: x = 1280; y = Math.random() * 720; angle = Math.PI * 0.6 + Math.random() * Math.PI * 0.4; break;
      }
      const segments = [];
      let cx = x, cy = y, ca = angle;
      const totalSeg = 3 + Math.floor(Math.random() * 5);
      for (let j = 0; j < totalSeg; j++) {
        const len = 10 + Math.random() * 30;
        const nx = cx + Math.cos(ca) * len;
        const ny = cy + Math.sin(ca) * len;
        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });
        cx = nx; cy = ny;
        ca += (Math.random() - 0.5) * 0.8;
      }
      this.cracks.push({ segments, growth: 0, maxGrowth: totalSeg });
    }
  }

  update(dt) {
    this.time += dt;
    this.phaseTimer += dt;

    if (this.fadeAlpha > 0 && this.phase !== 'finalFade') {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 0.001);
    }

    switch (this.phase) {
      case 'descent':
        this._updateDescent(dt);
        break;
      case 'reveal':
        this._updateReveal(dt);
        break;
      case 'choice':
        this._updateChoice(dt);
        break;
      case 'ending':
        this._updateEnding(dt);
        break;
      case 'finalFade':
        this._updateFinalFade(dt);
        break;
      case 'credits':
        this._updateCredits(dt);
        break;
      case 'stats':
        this._updateStats(dt);
        break;
    }

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = 1290;
      if (p.x > 1290) p.x = -10;
      if (p.y < -10) p.y = 730;
      if (p.y > 730) p.y = -10;
    }

    for (const crack of this.cracks) {
      if (crack.growth < crack.maxGrowth) {
        crack.growth += dt * 0.002;
      }
    }

    achievementSystem.update(dt);
  }

  _updateDescent(dt) {
    for (const p of this.particles) {
      p.vy += 0.02;
    }
    if (this.phaseTimer > 3000) {
      this.phase = 'reveal';
      this.phaseTimer = 0;
    }
  }

  _updateReveal(dt) {
    if (this.phaseTimer > 4000) {
      this.phase = 'choice';
      this.phaseTimer = 0;
      this.selectedChoice = 0;
    }
  }

  _updateChoice(dt) {
    this.choiceAlpha = Math.min(1, this.choiceAlpha + dt * 0.001);

    if (!this.choiceMade) {
      if (this.input.justPressed('ArrowLeft') || this.input.justPressed('KeyA')) {
        this.selectedChoice = 0;
        if (this.audio) this.audio.playSFX('menuSelect');
      }
      if (this.input.justPressed('ArrowRight') || this.input.justPressed('KeyD')) {
        this.selectedChoice = 1;
        if (this.audio) this.audio.playSFX('menuSelect');
      }
      if (this.input.justPressed('Enter') || this.input.justPressed('Space')) {
        this.choiceMade = true;
        this.phase = 'ending';
        this.phaseTimer = 0;
        if (this.audio) this.audio.playSFX('anchorCollect');

        if (this.selectedChoice === 0) {
          this.endingText = '回归虚无';
          this.endingSubtext = '那由他选择了安宁，让一切归于沉寂。深渊中的记忆，终将消散于无尽的黑暗。';
          saveSystem.saveEnding('void');
        } else {
          this.endingText = '凝视深渊';
          this.endingSubtext = '那由他以凡人之躯凝视了不可名状的存在。她的眼中，从此映照着宇宙的真相。';
          saveSystem.saveEnding('abyss');
        }

        this._checkEndingAchievements();
      }
    }
  }

  _updateEnding(dt) {
    this.endingAlpha = Math.min(1, this.endingAlpha + dt * 0.0005);
    this.endingTimer += dt;

    if (this.selectedChoice === 0) {
      for (const p of this.particles) {
        p.alpha *= 0.998;
        p.vy *= 0.99;
      }
    } else {
      for (const p of this.particles) {
        const dx = 640 - p.x;
        const dy = 360 - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        p.vx += dx / dist * 0.01;
        p.vy += dy / dist * 0.01;
      }
    }

    if (this.endingTimer > 8000) {
      this.phase = 'finalFade';
      this.phaseTimer = 0;
    }
  }

  _updateFinalFade(dt) {
    this.finalFadeAlpha = Math.min(1, this.finalFadeAlpha + dt * 0.0008);
    if (this.finalFadeAlpha >= 1) {
      this.phase = 'credits';
      this.phaseTimer = 0;
    }
  }

  _updateCredits(dt) {
    this.creditsAlpha = Math.min(1, this.creditsAlpha + dt * 0.001);
    this.creditsScroll += dt * 0.02;

    if (this.input.justPressed('Enter') || this.input.justPressed('Space') || this.input.justPressed('Escape')) {
      if (this.creditsAlpha > 0.5) {
        this.phase = 'stats';
        this.phaseTimer = 0;
        this._computeStats();
      }
    }
  }

  render(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    switch (this.phase) {
      case 'descent':
        this._renderDescent(ctx, w, h);
        break;
      case 'reveal':
        this._renderReveal(ctx, w, h);
        break;
      case 'choice':
        this._renderChoice(ctx, w, h);
        break;
      case 'ending':
        this._renderEnding(ctx, w, h);
        break;
      case 'finalFade':
        this._renderEnding(ctx, w, h);
        ctx.fillStyle = `rgba(0, 0, 0, ${this.finalFadeAlpha})`;
        ctx.fillRect(0, 0, w, h);
        break;
      case 'credits':
        this._renderCredits(ctx, w, h);
        break;
      case 'stats':
        this._renderStats(ctx, w, h);
        break;
    }

    if (this.fadeAlpha > 0 && this.phase !== 'finalFade') {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    achievementSystem.renderNotifications(ctx, w, h);
  }

  _renderDescent(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6);
    gradient.addColorStop(0, 'rgba(10, 0, 5, 0.8)');
    gradient.addColorStop(0.5, 'rgba(5, 0, 3, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    this._renderParticles(ctx, w, h);

    const textProgress = Math.min(1, this.phaseTimer / 2000);
    if (textProgress > 0) {
      ctx.save();
      ctx.globalAlpha = textProgress * (0.6 + 0.4 * Math.sin(this.time * 0.002));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '300 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
      ctx.fillText('你已到达深渊的尽头', cx, cy - 20);
      ctx.restore();
    }
  }

  _renderReveal(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const breathCycle = Math.sin(this.time * 0.001) * 0.5 + 0.5;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    gradient.addColorStop(0, `rgba(255, 107, 53, ${0.03 + breathCycle * 0.02})`);
    gradient.addColorStop(0.3, `rgba(255, 0, 68, ${0.015 + breathCycle * 0.01})`);
    gradient.addColorStop(0.6, 'rgba(10, 0, 5, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    this._renderParticles(ctx, w, h);
    this._renderCracks(ctx, w, h);

    const eyeOpenProgress = Math.min(1, this.phaseTimer / 3000);
    if (eyeOpenProgress > 0) {
      ctx.save();
      ctx.globalAlpha = eyeOpenProgress;

      const eyeW = 120 * eyeOpenProgress;
      const eyeH = 40 * eyeOpenProgress * (0.3 + 0.7 * Math.abs(Math.sin(this.time * 0.0008)));

      ctx.beginPath();
      ctx.ellipse(cx, cy - 40, eyeW, eyeH, 0, 0, Math.PI * 2);
      const eyeGrad = ctx.createRadialGradient(cx, cy - 40, 0, cx, cy - 40, eyeW);
      eyeGrad.addColorStop(0, `rgba(255, 107, 53, ${0.8 * eyeOpenProgress})`);
      eyeGrad.addColorStop(0.3, `rgba(255, 60, 20, ${0.5 * eyeOpenProgress})`);
      eyeGrad.addColorStop(0.7, `rgba(255, 0, 68, ${0.2 * eyeOpenProgress})`);
      eyeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = eyeGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(cx, cy - 40, 15 * eyeOpenProgress, 15 * eyeOpenProgress, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 100, ${0.9 * eyeOpenProgress})`;
      ctx.shadowColor = '#FF6B35';
      ctx.shadowBlur = 30 * eyeOpenProgress;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    const textProgress = Math.max(0, Math.min(1, (this.phaseTimer - 2000) / 2000));
    if (textProgress > 0) {
      ctx.save();
      ctx.globalAlpha = textProgress * (0.5 + 0.3 * Math.sin(this.time * 0.003));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '300 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
      ctx.fillText('...它在注视着你', cx, cy + 60);
      ctx.restore();
    }
  }

  _renderChoice(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const breathCycle = Math.sin(this.time * 0.001) * 0.5 + 0.5;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    gradient.addColorStop(0, `rgba(255, 107, 53, ${0.02 + breathCycle * 0.015})`);
    gradient.addColorStop(0.5, 'rgba(10, 0, 5, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    this._renderParticles(ctx, w, h);
    this._renderCracks(ctx, w, h);

    ctx.save();
    ctx.globalAlpha = 0.6;
    const eyeH = 40 * (0.3 + 0.7 * Math.abs(Math.sin(this.time * 0.0008)));
    ctx.beginPath();
    ctx.ellipse(cx, cy - 80, 80, eyeH, 0, 0, Math.PI * 2);
    const eyeGrad = ctx.createRadialGradient(cx, cy - 80, 0, cx, cy - 80, 80);
    eyeGrad.addColorStop(0, 'rgba(255, 107, 53, 0.6)');
    eyeGrad.addColorStop(0.5, 'rgba(255, 0, 68, 0.2)');
    eyeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = eyeGrad;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = this.choiceAlpha;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 32px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 20 * (0.7 + breathCycle * 0.3);
    ctx.fillText('最终抉择', cx, cy - 20);
    ctx.shadowBlur = 0;

    ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText('深渊的尽头，你将如何选择？', cx, cy + 15);

    const choiceY = cy + 70;
    const choiceSpacing = 200;
    const leftX = cx - choiceSpacing / 2;
    const rightX = cx + choiceSpacing / 2;

    this._renderChoiceOption(ctx, leftX, choiceY, '回归虚无', '让一切归于沉寂', this.selectedChoice === 0, w, h);
    this._renderChoiceOption(ctx, rightX, choiceY, '凝视深渊', '以凡人之躯面对真相', this.selectedChoice === 1, w, h);

    ctx.globalAlpha = this.choiceAlpha * (0.3 + 0.2 * Math.sin(this.time * 0.003));
    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'center';
    ctx.fillText('← → 选择  ·  Enter 确认', cx, h - 50);

    ctx.restore();
  }

  _renderChoiceOption(ctx, x, y, title, subtitle, isSelected, w, h) {
    ctx.save();

    if (isSelected) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 80);
      glow.addColorStop(0, 'rgba(0, 255, 212, 0.06)');
      glow.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 80, y - 40, 160, 80);

      ctx.strokeStyle = 'rgba(0, 255, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 70, y - 30, 140, 60);

      ctx.font = '500 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 10;
    } else {
      ctx.strokeStyle = 'rgba(107, 107, 141, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 70, y - 30, 140, 60);

      ctx.font = '400 18px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, x, y - 8);
    ctx.shadowBlur = 0;

    ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = isSelected ? 'rgba(0, 255, 212, 0.5)' : 'rgba(107, 107, 141, 0.4)';
    ctx.fillText(subtitle, x, y + 14);

    ctx.restore();
  }

  _renderEnding(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    if (this.selectedChoice === 0) {
      ctx.fillStyle = `rgba(0, 0, 5, ${0.3 + this.endingAlpha * 0.5})`;
      ctx.fillRect(0, 0, w, h);

      this._renderParticles(ctx, w, h);

      const fadeParticles = Math.max(0, 1 - this.endingAlpha);
      ctx.globalAlpha = fadeParticles;
      this._renderStars(ctx, w, h);
      ctx.globalAlpha = 1;
    } else {
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6);
      const intensity = this.endingAlpha;
      gradient.addColorStop(0, `rgba(255, 107, 53, ${0.05 * intensity})`);
      gradient.addColorStop(0.3, `rgba(255, 0, 68, ${0.03 * intensity})`);
      gradient.addColorStop(0.6, `rgba(10, 0, 5, 0.5)`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      this._renderParticles(ctx, w, h);
      this._renderCracks(ctx, w, h);

      const eyeSize = 60 + this.endingAlpha * 60;
      const eyeH = eyeSize * (0.3 + 0.7 * Math.abs(Math.sin(this.time * 0.0006)));
      ctx.beginPath();
      ctx.ellipse(cx, cy - 60, eyeSize, eyeH, 0, 0, Math.PI * 2);
      const eyeGrad = ctx.createRadialGradient(cx, cy - 60, 0, cx, cy - 60, eyeSize);
      eyeGrad.addColorStop(0, `rgba(255, 107, 53, ${0.8 * this.endingAlpha})`);
      eyeGrad.addColorStop(0.5, `rgba(255, 0, 68, ${0.3 * this.endingAlpha})`);
      eyeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = eyeGrad;
      ctx.fill();
    }

    ctx.save();
    ctx.globalAlpha = this.endingAlpha;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = this.selectedChoice === 0 ? COLORS.FLUORESCENT_CYAN : COLORS.VOID_ORANGE;
    ctx.shadowBlur = 30 * this.endingAlpha;
    ctx.font = '600 48px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = this.selectedChoice === 0 ? COLORS.MOONLIGHT_WHITE : COLORS.VOID_ORANGE;
    ctx.fillText(this.endingText, cx, cy + 40);
    ctx.shadowBlur = 0;

    if (this.endingAlpha > 0.3) {
      const subAlpha = Math.min(1, (this.endingAlpha - 0.3) / 0.7);
      ctx.globalAlpha = subAlpha * 0.7;
      ctx.font = '300 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
      this._renderWrappedText(ctx, this.endingSubtext, cx, cy + 90, w * 0.6, 24);
    }

    ctx.restore();
  }

  _renderCredits(ctx, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;

    const credits = [
      { type: 'title', text: 'NAYUTA' },
      { type: 'subtitle', text: '那由他之梦' },
      { type: 'spacer' },
      { type: 'role', text: '设计 & 开发' },
      { type: 'name', text: 'Saya' },
      { type: 'spacer' },
      { type: 'role', text: '世界观' },
      { type: 'desc', text: '宇宙恐怖 × 暗黑童话' },
      { type: 'spacer' },
      { type: 'role', text: '视觉风格' },
      { type: 'desc', text: '深渊美学 · 生物荧光 · 记忆侵蚀' },
      { type: 'spacer' },
      { type: 'role', text: '技术栈' },
      { type: 'desc', text: 'HTML5 Canvas · Web Audio API · Vite' },
      { type: 'spacer' },
      { type: 'role', text: '算法艺术' },
      { type: 'desc', text: 'p5.js · 程序化生成 · Shader 特效' },
      { type: 'spacer' },
      { type: 'spacer' },
      { type: 'quote', text: '"那由他——不可计数之遥远"' },
      { type: 'spacer' },
      { type: 'spacer' },
      { type: 'thanks', text: '感谢你到达深渊的尽头' },
    ];

    ctx.save();
    ctx.globalAlpha = this.creditsAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const startY = h + 50 - this.creditsScroll;
    let y = startY;

    for (const line of credits) {
      switch (line.type) {
        case 'title':
          ctx.font = '600 56px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
          ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
          ctx.shadowBlur = 30;
          ctx.fillText(line.text, cx, y);
          ctx.shadowBlur = 0;
          y += 70;
          break;
        case 'subtitle':
          ctx.font = '300 20px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = COLORS.STARDUST_GRAY;
          ctx.fillText(line.text, cx, y);
          y += 50;
          break;
        case 'role':
          ctx.font = '500 16px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
          ctx.fillText(line.text, cx, y);
          y += 30;
          break;
        case 'name':
          ctx.font = '400 24px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
          ctx.fillText(line.text, cx, y);
          y += 40;
          break;
        case 'desc':
          ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = COLORS.STARDUST_GRAY;
          ctx.fillText(line.text, cx, y);
          y += 30;
          break;
        case 'quote':
          ctx.font = '300 18px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = 'rgba(0, 255, 212, 0.5)';
          ctx.fillText(line.text, cx, y);
          y += 50;
          break;
        case 'thanks':
          ctx.font = '300 16px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
          ctx.fillText(line.text, cx, y);
          y += 40;
          break;
        case 'spacer':
          y += 30;
          break;
      }
    }

    ctx.globalAlpha = this.creditsAlpha * (0.3 + 0.2 * Math.sin(this.time * 0.002));
    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText('按任意键返回主菜单', cx, h - 40);

    ctx.restore();
  }

  _renderParticles(ctx, w, h) {
    for (const p of this.particles) {
      if (p.alpha < 0.01) continue;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      if (p.isOrange) {
        ctx.fillStyle = 'rgba(255, 107, 53, 1)';
      } else if (p.isCyan) {
        ctx.fillStyle = 'rgba(0, 255, 212, 1)';
      } else {
        ctx.fillStyle = 'rgba(232, 230, 240, 1)';
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _renderStars(ctx, w, h) {
    for (const star of this.stars) {
      const twinkle = 0.4 + 0.6 * Math.sin(this.time * 0.002 + star.phase);
      const alpha = star.brightness * twinkle;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 230, 240, ${alpha})`;
      ctx.fill();
    }
  }

  _renderCracks(ctx, w, h) {
    ctx.save();
    for (const crack of this.cracks) {
      const visibleSegs = Math.floor(crack.growth);
      for (let i = 0; i < Math.min(visibleSegs, crack.segments.length); i++) {
        const seg = crack.segments[i];
        const flicker = Math.sin(this.time * 0.005 + i * 0.5) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 107, 53, ${0.3 * flicker})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _renderWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '';
    let currentY = y;

    for (const char of chars) {
      const testLine = line + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, currentY);
        line = char;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, currentY);
    }
  }

  _computeStats() {
    const data = saveSystem.getData();
    const totalAnchors = 6 + 6 + 7 + 8;
    let collectedAnchors = 0;
    for (let d = 0; d < 4; d++) {
      const lp = data.levelProgress && data.levelProgress[d];
      if (lp) {
        collectedAnchors += lp.anchorsCollected || 0;
      }
    }

    this.statsData = {
      anchorsCollected: collectedAnchors,
      anchorsTotal: totalAnchors,
      deathCount: saveSystem.getDeathCount(),
      playTime: saveSystem.formatPlayTime(data.playTime || 0),
      unlockedDepth: (data.unlockedDepth || 0) + 1,
      endingsSeen: data.endingsSeen || [],
      completionPercent: Math.round((collectedAnchors / totalAnchors) * 100),
    };

    this.statsLineAlphas = new Array(8).fill(0);
    this.statsProgressBars = new Array(5).fill(0);
  }

  _updateStats(dt) {
    this.statsAlpha = Math.min(1, this.statsAlpha + dt * 0.001);

    for (let i = 0; i < this.statsLineAlphas.length; i++) {
      const delay = i * 300;
      if (this.phaseTimer > delay) {
        this.statsLineAlphas[i] = Math.min(1, this.statsLineAlphas[i] + dt * 0.003);
      }
    }

    for (let i = 0; i < this.statsProgressBars.length; i++) {
      const delay = 1500 + i * 200;
      if (this.phaseTimer > delay) {
        this.statsProgressBars[i] = Math.min(1, this.statsProgressBars[i] + dt * 0.002);
      }
    }

    if (this.input.justPressed('Enter') || this.input.justPressed('Space') || this.input.justPressed('Escape')) {
      if (this.statsAlpha > 0.5) {
        this.sceneManager.switchTo('menu');
      }
    }
  }

  _renderStats(ctx, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    this._renderParticles(ctx, w, h);

    if (!this.statsData) return;

    const cx = w / 2;
    const startY = h * 0.12;
    const sd = this.statsData;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lineAlpha0 = this.statsLineAlphas[0] || 0;
    if (lineAlpha0 > 0) {
      ctx.globalAlpha = lineAlpha0;
      const breathCycle = Math.sin(this.time * 0.002) * 0.15 + 0.85;
      ctx.font = '600 36px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 25 * breathCycle;
      ctx.fillText('深渊记录', cx, startY);
      ctx.shadowBlur = 0;

      const lineW = 120 * Math.min(1, this.phaseTimer / 800);
      ctx.strokeStyle = COLORS.FLUORESCENT_CYAN;
      ctx.lineWidth = 1;
      ctx.globalAlpha = lineAlpha0 * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx - lineW / 2, startY + 28);
      ctx.lineTo(cx + lineW / 2, startY + 28);
      ctx.stroke();
    }

    const statsY = startY + 70;
    const statSpacing = 52;
    const leftX = cx - 180;
    const rightX = cx + 180;

    const statLines = [
      { label: '记忆之锚', value: `${sd.anchorsCollected} / ${sd.anchorsTotal}`, lineIndex: 1 },
      { label: '深渊吞噬', value: `${sd.deathCount} 次`, lineIndex: 2 },
      { label: '探索时长', value: sd.playTime, lineIndex: 3 },
      { label: '抵达深度', value: `${sd.unlockedDepth} / 4`, lineIndex: 4 },
    ];

    for (let i = 0; i < statLines.length; i++) {
      const stat = statLines[i];
      const alpha = this.statsLineAlphas[stat.lineIndex] || 0;
      if (alpha <= 0) continue;

      const y = statsY + i * statSpacing;

      ctx.globalAlpha = alpha;
      ctx.font = '300 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
      ctx.textAlign = 'left';
      ctx.fillText(stat.label, leftX, y);

      ctx.textAlign = 'right';
      ctx.font = '500 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 8;
      ctx.fillText(stat.value, rightX, y);
      ctx.shadowBlur = 0;
    }

    const progressY = statsY + statLines.length * statSpacing + 20;
    const progressAlpha = this.statsLineAlphas[5] || 0;
    if (progressAlpha > 0) {
      ctx.globalAlpha = progressAlpha;
      ctx.textAlign = 'center';
      ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
      ctx.fillText('收集进度', cx, progressY);

      const barW = 300;
      const barH = 6;
      const barX = cx - barW / 2;
      const barY = progressY + 18;

      ctx.fillStyle = 'rgba(107, 107, 141, 0.2)';
      ctx.fillRect(barX, barY, barW, barH);

      const fillProgress = this.statsProgressBars[0] || 0;
      const fillW = barW * (sd.completionPercent / 100) * fillProgress;
      const barGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      barGrad.addColorStop(0, COLORS.FLUORESCENT_CYAN);
      barGrad.addColorStop(1, 'rgba(0, 136, 255, 0.8)');
      ctx.fillStyle = barGrad;
      ctx.fillRect(barX, barY, fillW, barH);

      ctx.font = '500 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      const displayPercent = Math.round(sd.completionPercent * fillProgress);
      ctx.fillText(`${displayPercent}%`, cx, barY + 28);
    }

    const endingsY = progressY + 80;
    const endingsAlpha = this.statsLineAlphas[6] || 0;
    if (endingsAlpha > 0) {
      ctx.globalAlpha = endingsAlpha;
      ctx.textAlign = 'center';
      ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
      ctx.fillText('结局记录', cx, endingsY);

      const endingSpacing = 160;
      const endingStartX = cx - endingSpacing / 2;

      const endings = [
        { id: 'void', name: '回归虚无', color: COLORS.FLUORESCENT_CYAN },
        { id: 'abyss', name: '凝视深渊', color: COLORS.VOID_ORANGE },
      ];

      for (let i = 0; i < endings.length; i++) {
        const ex = endingStartX + i * endingSpacing;
        const ey = endingsY + 35;
        const seen = sd.endingsSeen.includes(endings[i].id);
        const barProgress = this.statsProgressBars[i + 1] || 0;

        if (seen) {
          const pulse = Math.sin(this.time * 0.003 + i * 2) * 0.15 + 0.85;
          ctx.globalAlpha = endingsAlpha * barProgress;

          ctx.strokeStyle = endings[i].color;
          ctx.lineWidth = 1;
          ctx.strokeRect(ex - 55, ey - 18, 110, 36);

          ctx.font = '500 15px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = endings[i].color;
          ctx.shadowColor = endings[i].color;
          ctx.shadowBlur = 10 * pulse;
          ctx.fillText(endings[i].name, ex, ey);
          ctx.shadowBlur = 0;
        } else {
          ctx.globalAlpha = endingsAlpha * 0.3;
          ctx.strokeStyle = 'rgba(107, 107, 141, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(ex - 55, ey - 18, 110, 36);

          ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = COLORS.STARDUST_GRAY;
          ctx.fillText('???', ex, ey);
        }
      }
    }

    const hintAlpha = this.statsLineAlphas[7] || 0;
    if (hintAlpha > 0) {
      ctx.globalAlpha = hintAlpha * (0.3 + 0.2 * Math.sin(this.time * 0.002));
      ctx.textAlign = 'center';
      ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
      ctx.fillText('按任意键返回主菜单', cx, h - 40);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _checkEndingAchievements() {
    const data = saveSystem.getData();
    const stats = {
      totalAnchors: data.totalAnchorsCollected || 0,
      maxDepth: data.unlockedDepth || 0,
      deathCount: data.deathCount || 0,
      playTime: data.playTime || 0,
      endingsSeen: data.endingsSeen || [],
      completedGame: true,
      discoveredFragments: (data.discoveredFragments || []).length,
    };
    achievementSystem.checkAll(stats);
  }
}

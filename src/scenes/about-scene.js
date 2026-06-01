import { Scene } from '../core/scene.js';
import { COLORS } from '../constants.js';

export class AboutScene extends Scene {
  constructor(input, sceneManager, audioSystem) {
    super('about');
    this.input = input;
    this.sceneManager = sceneManager;
    this.audio = audioSystem;
    this.time = 0;
    this.alpha = 0;
    this.scrollY = 0;
    this.maxScroll = 0;
    this.stars = [];
    this.particles = [];
  }

  onEnter() {
    super.onEnter();
    this.alpha = 0;
    this.scrollY = 0;
    this._generateStars();
    this._generateParticles();
    this._setupTouch();
  }

  onExit() {
    this._removeTouch();
  }

  _generateStars() {
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        size: Math.random() * 1.2 + 0.3,
        brightness: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  _generateParticles() {
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -Math.random() * 0.3 - 0.1,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        isCyan: Math.random() > 0.6,
      });
    }
  }

  _setupTouch() {
    this._touchStartY = 0;
    this._touchScrollY = 0;
    this._touchStartHandler = (e) => {
      this._touchStartY = e.changedTouches[0].clientY;
      this._touchScrollY = this.scrollY;
    };
    this._touchMoveHandler = (e) => {
      const dy = (e.changedTouches[0].clientY - this._touchStartY) * 1.5;
      this.scrollY = Math.max(0, Math.min(this.maxScroll, this._touchScrollY - dy));
    };
    this._touchEndHandler = (e) => {
      if (Math.abs(e.changedTouches[0].clientY - this._touchStartY) < 10) {
        const touch = e.changedTouches[0];
        const h = window.innerHeight;
        if (touch.clientY > h * 0.88) {
          this._goBack();
        }
      }
    };
    window.addEventListener('touchstart', this._touchStartHandler, { passive: true });
    window.addEventListener('touchmove', this._touchMoveHandler, { passive: true });
    window.addEventListener('touchend', this._touchEndHandler, { passive: true });
  }

  _removeTouch() {
    window.removeEventListener('touchstart', this._touchStartHandler);
    window.removeEventListener('touchmove', this._touchMoveHandler);
    window.removeEventListener('touchend', this._touchEndHandler);
  }

  _goBack() {
    if (this.audio) this.audio.playSFX('menuConfirm');
    this.sceneManager.switchTo('menu');
  }

  update(dt) {
    this.time += dt;
    if (this.alpha < 1) {
      this.alpha = Math.min(1, this.alpha + dt * 0.002);
    }

    if (this.input.justPressed('Escape') || this.input.justPressed('Backspace')) {
      this._goBack();
      return;
    }

    if (this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW')) {
      this.scrollY = Math.max(0, this.scrollY - 40);
    }
    if (this.input.justPressed('ArrowDown') || this.input.justPressed('KeyS')) {
      this.scrollY = Math.min(this.maxScroll, this.scrollY + 40);
    }

    const scrollSpeed = 2;
    if (this.input.isDown('ArrowUp') || this.input.isDown('KeyW')) {
      this.scrollY = Math.max(0, this.scrollY - scrollSpeed);
    }
    if (this.input.isDown('ArrowDown') || this.input.isDown('KeyS')) {
      this.scrollY = Math.min(this.maxScroll, this.scrollY + scrollSpeed);
    }

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = 730; p.x = Math.random() * 1280; }
      if (p.x < -10) p.x = 1290;
      if (p.x > 1290) p.x = -10;
    }
  }

  render(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;

    ctx.fillStyle = COLORS.ABYSS_BLUE;
    ctx.fillRect(0, 0, w, h);

    this._renderBackground(ctx, w, h);
    this._renderStars(ctx, w, h);
    this._renderParticles(ctx, w, h);

    ctx.save();
    ctx.globalAlpha = this.alpha;

    const contentX = w * 0.12;
    const contentW = w * 0.76;
    let y = 60 - this.scrollY;
    const lineH = 28;

    const sections = this._getContent(w, contentW);

    for (const section of sections) {
      if (y > -100 && y < h + 100) {
        switch (section.type) {
          case 'title':
            ctx.font = '600 52px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
            ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
            ctx.shadowBlur = 30 * (0.7 + 0.3 * Math.sin(this.time * 0.002));
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(section.text, w / 2, y);
            ctx.shadowBlur = 0;
            y += 70;
            break;
          case 'subtitle':
            ctx.font = '300 18px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = COLORS.STARDUST_GRAY;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(section.text, w / 2, y);
            y += 40;
            break;
          case 'divider':
            const lineW = 120;
            const pulse = 0.5 + 0.5 * Math.sin(this.time * 0.003);
            ctx.strokeStyle = `rgba(0, 255, 212, ${0.2 + pulse * 0.15})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(w / 2 - lineW / 2, y);
            ctx.lineTo(w / 2 + lineW / 2, y);
            ctx.stroke();
            y += 35;
            break;
          case 'heading':
            ctx.font = '500 22px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
            ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
            ctx.shadowBlur = 8;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(section.text, contentX, y);
            ctx.shadowBlur = 0;
            y += 36;
            break;
          case 'body':
            ctx.font = '300 15px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = 'rgba(232, 230, 240, 0.75)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            y = this._renderWrappedText(ctx, section.text, contentX, y, contentW, lineH);
            y += 12;
            break;
          case 'feature':
            const breathCycle = Math.sin(this.time * 0.002 + section.index * 0.5) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(0, 255, 212, ${0.05 + breathCycle * 0.03})`;
            ctx.fillRect(contentX, y - 4, contentW, 32);

            ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(section.icon, contentX + 12, y + 12);

            ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
            ctx.fillText(section.title, contentX + 36, y + 12);

            ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = COLORS.STARDUST_GRAY;
            ctx.textAlign = 'right';
            ctx.fillText(section.desc, contentX + contentW - 12, y + 12);
            y += 44;
            break;
          case 'credit':
            ctx.font = '500 14px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(section.role, contentX, y);

            ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
            ctx.textAlign = 'right';
            ctx.fillText(section.name, contentX + contentW, y);
            y += 30;
            break;
          case 'spacer':
            y += section.height || 20;
            break;
          case 'quote':
            const qPulse = Math.sin(this.time * 0.0015) * 0.5 + 0.5;
            ctx.font = '300 17px "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = `rgba(0, 255, 212, ${0.4 + qPulse * 0.2})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(section.text, w / 2, y);
            y += 35;
            break;
        }
      } else {
        const heights = {
          title: 70, subtitle: 40, divider: 35, heading: 36,
          body: 60, feature: 44, credit: 30, spacer: section.height || 20, quote: 35,
        };
        y += heights[section.type] || 30;
      }
    }

    this.maxScroll = Math.max(0, y + this.scrollY - h + 80);

    if (this.maxScroll > 0) {
      const scrollFrac = this.scrollY / this.maxScroll;
      const barH = Math.max(30, h * (h / (y + this.scrollY)));
      const barY = scrollFrac * (h - barH);
      ctx.fillStyle = 'rgba(0, 255, 212, 0.15)';
      ctx.fillRect(w - 6, barY, 3, barH);
    }

    ctx.globalAlpha = this.alpha * (0.3 + 0.2 * Math.sin(this.time * 0.002));
    ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑↓ 滚动  ·  Esc 返回  ·  触控滑动', w / 2, h - 30);

    ctx.restore();
  }

  _getContent(w, contentW) {
    return [
      { type: 'title', text: 'NAYUTA' },
      { type: 'subtitle', text: '那由他之梦' },
      { type: 'divider' },
      { type: 'heading', text: '世界观' },
      { type: 'body', text: '在时间的尽头，少女"那由他"从一场无始无终的梦中醒来，发现自己身处由破碎记忆构成的深渊——"忘却之海"。每一层深渊都是一段被遗忘的世界记忆：坍缩的星系、沉没的神殿、被吞噬的文明。她必须收集散落的"记忆之锚"，才能向下深入，接近深渊底部的真相。但越深入，现实的边界越模糊——那些记忆并非属于人类，而是来自一个远超人类认知的宇宙存在。当最后的锚被找到，那由他将面对一个选择：回归虚无的安宁，还是以凡人之躯凝视深渊？' },
      { type: 'spacer', height: 10 },
      { type: 'heading', text: '核心特色' },
      { type: 'feature', index: 0, icon: '◆', title: '记忆即关卡', desc: '每层深渊是一段被遗忘的世界记忆' },
      { type: 'feature', index: 1, icon: '◈', title: '现实侵蚀系统', desc: '随深度增加，UI/画面/音效逐渐异变' },
      { type: 'feature', index: 2, icon: '◇', title: '零对白叙事', desc: '全程无文字对白，环境与光影讲述故事' },
      { type: 'feature', index: 3, icon: '△', title: '深渊美学', desc: '宇宙恐怖 × 暗黑童话的视觉融合' },
      { type: 'feature', index: 4, icon: '○', title: '生物荧光', desc: '记忆之锚的脉冲式荧光青光' },
      { type: 'spacer', height: 10 },
      { type: 'heading', text: '核心循环' },
      { type: 'body', text: '探索深渊层 → 发现记忆碎片 → 解谜解锁新区域 → 收集记忆之锚 → 深入下一层 → 世界逐渐异变 → 最终抉择' },
      { type: 'spacer', height: 10 },
      { type: 'heading', text: '操作说明' },
      { type: 'body', text: '← → / A D 移动  ·  ↑ / W / Space 跳跃  ·  E 交互  ·  Esc 暂停  ·  移动端：左侧虚拟摇杆，右侧触控按钮' },
      { type: 'spacer', height: 10 },
      { type: 'divider' },
      { type: 'heading', text: '制作' },
      { type: 'credit', role: '设计 & 开发', name: 'Saya' },
      { type: 'credit', role: '世界观', name: '宇宙恐怖 × 暗黑童话' },
      { type: 'credit', role: '视觉风格', name: '深渊美学 · 生物荧光 · 记忆侵蚀' },
      { type: 'credit', role: '技术栈', name: 'HTML5 Canvas · Web Audio API · Vite' },
      { type: 'credit', role: '算法艺术', name: 'p5.js · 程序化生成 · Shader 特效' },
      { type: 'spacer', height: 15 },
      { type: 'quote', text: '"那由他——不可计数之遥远"' },
      { type: 'spacer', height: 30 },
    ];
  }

  _renderBackground(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0A0E1A');
    gradient.addColorStop(0.4, '#0F1528');
    gradient.addColorStop(0.7, '#1A1035');
    gradient.addColorStop(1, '#0A0812');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const breathCycle = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
    const cx = w * 0.5;
    const cy = h * 0.3;
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.4);
    radGrad.addColorStop(0, `rgba(26, 16, 53, ${0.25 + breathCycle * 0.1})`);
    radGrad.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, w, h);
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

  _renderParticles(ctx, w, h) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.isCyan ? 'rgba(0, 255, 212, 1)' : 'rgba(232, 230, 240, 1)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
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
      currentY += lineHeight;
    }
    return currentY;
  }
}

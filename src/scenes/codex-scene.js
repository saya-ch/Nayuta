import { Scene } from '../core/scene.js';
import { COLORS } from '../constants.js';
import { saveSystem } from '../core/save-system.js';

const DEPTH_META = [
  { name: '浅层记忆', accent: '#00FFD4', accentRgb: '0, 255, 212', symbol: '◇' },
  { name: '中层记忆', accent: '#8B5CF6', accentRgb: '139, 92, 246', symbol: '△' },
  { name: '深层记忆', accent: '#FF6B35', accentRgb: '255, 107, 53', symbol: '○' },
  { name: '最深层', accent: '#FF0044', accentRgb: '255, 0, 68', symbol: '□' },
];

const FRAGMENT_DATA = {
  0: [
    { id: 'd1_f1', text: '曾经这里有光', hint: '触碰记忆...' },
    { id: 'd1_f2', text: '她记得星星的形状', hint: '碎片在低语' },
    { id: 'd1_f3', text: '每一个光点都是一段过往', hint: '记忆在呼吸' },
    { id: 'd1_f4', text: '深渊并非一直如此寂静', hint: '聆听深渊' },
  ],
  1: [
    { id: 'd2_f1', text: '时间在这里是弯曲的', hint: '记忆在碎裂' },
    { id: 'd2_f2', text: '那些眼睛从未闭合', hint: '深渊在注视' },
    { id: 'd2_f3', text: '记忆的颜色开始改变', hint: '现实在偏移' },
    { id: 'd2_f4', text: '虚空中有低语', hint: '聆听虚空' },
  ],
  2: [
    { id: 'd3_f1', text: '光在这里会灼伤', hint: '现实在崩塌' },
    { id: 'd3_f2', text: '深渊的心跳越来越快', hint: '深渊在呼吸' },
    { id: 'd3_f3', text: '这些记忆正在被吞噬', hint: '记忆在燃烧' },
  ],
  3: [
    { id: 'd4_f1', text: '你终于看到了', hint: '真相在等待' },
    { id: 'd4_f2', text: '深渊的底部是另一片天空', hint: '深渊的尽头' },
    { id: 'd4_f3', text: '凝视与被凝视之间', hint: '选择在逼近' },
  ],
};

const EVENT_DATA = {
  0: [
    { text: '这些记忆...不属于人类', subtext: '浅层记忆 · 第一道裂缝' },
    { text: '你听到了远方的回响', subtext: '来自更深处的呼唤' },
  ],
  1: [
    { text: '你不属于这里', subtext: '中层记忆 · 影子的呢喃' },
    { text: '记忆的碎片在重组', subtext: '但它们拼出的不是你的故事' },
  ],
  2: [
    { text: '现实正在渗血', subtext: '深层记忆 · 边界的崩塌' },
    { text: '它在看着你', subtext: '从时间的尽头' },
  ],
  3: [
    { text: '你已无法回头', subtext: '最深层 · 凝视深渊' },
    { text: '那由他...不可计数之遥远', subtext: '这就是你的名字的含义' },
  ],
};

export class CodexScene extends Scene {
  constructor(input, sceneManager, audioSystem) {
    super('codex');
    this.input = input;
    this.sceneManager = sceneManager;
    this.audio = audioSystem;
    this.selectedDepth = 0;
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.maxScrollY = 0;
    this.time = 0;
    this.fadeAlpha = 1;
    this.stars = [];
    this.particles = [];
    this.contentAlpha = 0;
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
    this._wheelHandler = (e) => {
      this.targetScrollY += e.deltaY * 0.5;
      this.targetScrollY = Math.max(0, Math.min(this.maxScrollY, this.targetScrollY));
    };
    this._clickHandler = (e) => {
      if (this.fadeAlpha > 0.3) return;
      this._handleClick(e.clientX, e.clientY);
    };
    window.addEventListener('mousemove', this._mouseMoveHandler);
    window.addEventListener('wheel', this._wheelHandler, { passive: true });
    window.addEventListener('click', this._clickHandler);

    this._touchStartY = 0;
    this._touchStartHandler = (e) => {
      const touch = e.changedTouches[0];
      if (touch) this._touchStartY = touch.clientY;
    };
    this._touchMoveHandler = (e) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dy = this._touchStartY - touch.clientY;
      this.targetScrollY += dy * 0.8;
      this.targetScrollY = Math.max(0, Math.min(this.maxScrollY, this.targetScrollY));
      this._touchStartY = touch.clientY;
    };
    this._touchEndHandler = (e) => {
      if (this.fadeAlpha > 0.3) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      this._handleClick(touch.clientX, touch.clientY);
    };
    window.addEventListener('touchstart', this._touchStartHandler, { passive: true });
    window.addEventListener('touchmove', this._touchMoveHandler, { passive: true });
    window.addEventListener('touchend', this._touchEndHandler, { passive: true });
  }

  _handleClick(clientX, clientY) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const tabY = h * 0.13;
    const tabW = Math.min(140, w * 0.14);
    const tabGap = Math.min(12, w * 0.01);
    const totalTabW = 4 * tabW + 3 * tabGap;
    const tabStartX = (w - totalTabW) / 2;

    for (let i = 0; i < 4; i++) {
      const tx = tabStartX + i * (tabW + tabGap);
      if (clientX >= tx && clientX <= tx + tabW && clientY >= tabY - 16 && clientY <= tabY + 16) {
        if (this.selectedDepth !== i) {
          this.selectedDepth = i;
          this.contentAlpha = 0;
          this.scrollY = 0;
          this.targetScrollY = 0;
          if (this.audio) this.audio.playSFX('menuSelect');
        }
        return;
      }
    }

    const backY = h * 0.93;
    if (clientY >= backY - 18 && clientY <= backY + 18) {
      this._goBack();
    }
  }

  _generateStars() {
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.2 + 0.3,
        brightness: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random(),
      });
    }
  }

  _generateParticles() {
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00006,
        vy: -(Math.random() * 0.00015 + 0.00003),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.2 + 0.03,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  onEnter() {
    super.onEnter();
    this.fadeAlpha = 1;
    this.contentAlpha = 0;
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.selectedDepth = 0;
    this.time = 0;

    if (this.audio) {
      this.audio.playBGM(-1);
    }
  }

  onExit() {
    if (this._mouseMoveHandler) window.removeEventListener('mousemove', this._mouseMoveHandler);
    if (this._wheelHandler) window.removeEventListener('wheel', this._wheelHandler);
    if (this._clickHandler) window.removeEventListener('click', this._clickHandler);
    if (this._touchStartHandler) window.removeEventListener('touchstart', this._touchStartHandler);
    if (this._touchMoveHandler) window.removeEventListener('touchmove', this._touchMoveHandler);
    if (this._touchEndHandler) window.removeEventListener('touchend', this._touchEndHandler);
  }

  update(dt) {
    this.time += dt;

    if (this.fadeAlpha > 0) {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - dt * 0.002);
    }

    this.contentAlpha = Math.min(1, this.contentAlpha + dt * 0.003);

    this.scrollY += (this.targetScrollY - this.scrollY) * 0.15;

    if (this.input.justPressed('ArrowLeft') || this.input.justPressed('KeyA')) {
      this.selectedDepth = Math.max(0, this.selectedDepth - 1);
      this.contentAlpha = 0;
      this.scrollY = 0;
      this.targetScrollY = 0;
      if (this.audio) this.audio.playSFX('menuSelect');
    }
    if (this.input.justPressed('ArrowRight') || this.input.justPressed('KeyD')) {
      this.selectedDepth = Math.min(3, this.selectedDepth + 1);
      this.contentAlpha = 0;
      this.scrollY = 0;
      this.targetScrollY = 0;
      if (this.audio) this.audio.playSFX('menuSelect');
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
    this._renderDepthTabs(ctx, w, h);
    this._renderContent(ctx, w, h);
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
  }

  _renderStars(ctx, w, h) {
    const parallaxX = (this.mouseX - 0.5) * 6;
    const parallaxY = (this.mouseY - 0.5) * 6;
    for (const star of this.stars) {
      const twinkle = 0.4 + 0.6 * Math.sin(this.time * 0.002 + star.phase);
      ctx.globalAlpha = star.brightness * twinkle;
      ctx.fillStyle = 'rgba(232, 230, 240, 1)';
      ctx.beginPath();
      ctx.arc(star.x * w + parallaxX * star.depth, star.y * h + parallaxY * star.depth, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _renderParticles(ctx, w, h) {
    for (const p of this.particles) {
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 0.003 + p.phase);
      ctx.globalAlpha = p.alpha * twinkle;
      ctx.fillStyle = 'rgba(0, 255, 212, 1)';
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _renderTitle(ctx, w, h) {
    const titleAlpha = Math.min(1, this.time / 600);
    ctx.save();
    ctx.globalAlpha = titleAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText('记忆图鉴', w / 2, h * 0.06);

    const lineW = 80;
    ctx.strokeStyle = 'rgba(0, 255, 212, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - lineW / 2, h * 0.06 + 14);
    ctx.lineTo(w / 2 + lineW / 2, h * 0.06 + 14);
    ctx.stroke();

    ctx.restore();
  }

  _renderDepthTabs(ctx, w, h) {
    const tabY = h * 0.13;
    const tabW = Math.min(140, w * 0.14);
    const tabGap = Math.min(12, w * 0.01);
    const totalTabW = 4 * tabW + 3 * tabGap;
    const tabStartX = (w - totalTabW) / 2;

    for (let i = 0; i < 4; i++) {
      const meta = DEPTH_META[i];
      const tx = tabStartX + i * (tabW + tabGap);
      const isSelected = i === this.selectedDepth;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isSelected) {
        const glowPulse = Math.sin(this.time * 0.003) * 0.3 + 0.7;
        const glow = ctx.createRadialGradient(tx + tabW / 2, tabY, 0, tx + tabW / 2, tabY, tabW * 0.6);
        glow.addColorStop(0, `rgba(${meta.accentRgb}, ${0.06 * glowPulse})`);
        glow.addColorStop(1, 'rgba(10, 14, 26, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(tx - 10, tabY - 20, tabW + 20, 40);

        ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = meta.accent;
        ctx.shadowColor = meta.accent;
        ctx.shadowBlur = 8 * glowPulse;
        ctx.fillText(meta.name, tx + tabW / 2, tabY);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = `rgba(${meta.accentRgb}, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx + 10, tabY + 12);
        ctx.lineTo(tx + tabW - 10, tabY + 12);
        ctx.stroke();
      } else {
        ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = COLORS.STARDUST_GRAY;
        ctx.fillText(meta.name, tx + tabW / 2, tabY);
      }

      ctx.restore();
    }
  }

  _renderContent(ctx, w, h) {
    const contentY = h * 0.2;
    const contentH = h * 0.65;
    const meta = DEPTH_META[this.selectedDepth];
    const discovered = saveSystem.getDiscoveredFragments();
    const fragments = FRAGMENT_DATA[this.selectedDepth] || [];
    const events = EVENT_DATA[this.selectedDepth] || [];

    const contentW = Math.min(600, w * 0.7);
    const contentX = (w - contentW) / 2;

    const totalContentH = this._calculateContentHeight(fragments, events);
    this.maxScrollY = Math.max(0, totalContentH - contentH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, contentY, w, contentH);
    ctx.clip();

    ctx.globalAlpha = this.contentAlpha;

    const offsetY = contentY - this.scrollY;

    this._renderFragmentSection(ctx, contentX, offsetY, contentW, fragments, discovered, meta);
    const fragSectionH = 60 + fragments.length * 52 + 20;
    this._renderEventSection(ctx, contentX, offsetY + fragSectionH, contentW, events, meta);

    ctx.restore();
  }

  _calculateContentHeight(fragments, events) {
    const fragH = 60 + fragments.length * 52 + 20;
    const eventH = 60 + events.length * 52 + 40;
    return fragH + eventH;
  }

  _renderFragmentSection(ctx, x, y, w, fragments, discovered, meta) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(${meta.accentRgb}, 0.6)`;
    ctx.fillText('记忆碎片', x, y + 20);

    const discoveredCount = fragments.filter(f => discovered.includes(f.id)).length;
    ctx.textAlign = 'right';
    ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText(`${discoveredCount}/${fragments.length}`, x + w, y + 20);

    ctx.strokeStyle = `rgba(${meta.accentRgb}, 0.1)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 35);
    ctx.lineTo(x + w, y + 35);
    ctx.stroke();

    for (let i = 0; i < fragments.length; i++) {
      const frag = fragments[i];
      const fy = y + 50 + i * 52;
      const isDiscovered = discovered.includes(frag.id);

      if (isDiscovered) {
        const pulse = Math.sin(this.time * 0.003 + i * 0.5) * 0.15 + 0.85;
        ctx.fillStyle = `rgba(${meta.accentRgb}, ${0.03 * pulse})`;
        ctx.fillRect(x, fy - 8, w, 44);

        ctx.strokeStyle = `rgba(${meta.accentRgb}, 0.08)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, fy - 8);
        ctx.lineTo(x, fy + 36);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '300 10px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = `rgba(${meta.accentRgb}, 0.4)`;
        ctx.fillText(frag.hint, x + 16, fy + 4);

        ctx.font = '400 14px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
        ctx.fillText(`"${frag.text}"`, x + 16, fy + 24);

        ctx.fillStyle = meta.accent;
        ctx.globalAlpha = 0.5 * pulse;
        ctx.beginPath();
        ctx.arc(x + 6, fy + 14, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = this.contentAlpha;
      } else {
        ctx.fillStyle = 'rgba(107, 107, 141, 0.03)';
        ctx.fillRect(x, fy - 8, w, 44);

        ctx.textAlign = 'left';
        ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(107, 107, 141, 0.25)';
        ctx.fillText('· · · · · ·', x + 16, fy + 12);

        ctx.font = '300 10px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(107, 107, 141, 0.15)';
        ctx.fillText('未发现', x + 16, fy + 28);
      }
    }

    ctx.restore();
  }

  _renderEventSection(ctx, x, y, w, events, meta) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(${meta.accentRgb}, 0.6)`;
    ctx.fillText('深渊低语', x, y + 20);

    ctx.textAlign = 'right';
    ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText(`${events.length} 段回响`, x + w, y + 20);

    ctx.strokeStyle = `rgba(${meta.accentRgb}, 0.1)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 35);
    ctx.lineTo(x + w, y + 35);
    ctx.stroke();

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      const ey = y + 50 + i * 52;

      const pulse = Math.sin(this.time * 0.002 + i * 0.7) * 0.1 + 0.9;
      ctx.fillStyle = `rgba(${meta.accentRgb}, ${0.02 * pulse})`;
      ctx.fillRect(x, ey - 8, w, 44);

      ctx.strokeStyle = `rgba(${meta.accentRgb}, 0.06)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, ey - 8);
      ctx.lineTo(x, ey + 36);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = '400 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = `rgba(${meta.accentRgb}, 0.7)`;
      ctx.fillText(`"${evt.text}"`, x + 16, ey + 8);

      ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
      ctx.fillText(evt.subtext, x + 16, ey + 26);
    }

    ctx.restore();
  }

  _renderBackHint(ctx, w, h) {
    const y = h * 0.93;
    const alpha = Math.min(1, Math.max(0, (this.time - 1200) / 500));
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha * (0.4 + 0.2 * Math.sin(this.time * 0.002));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText('← → 切换层级  ·  滚轮浏览  ·  Esc 返回', w / 2, y);
    ctx.restore();
  }

  _renderScanLines(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.01;
    ctx.fillStyle = 'rgba(10, 14, 26, 1)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
  }
}

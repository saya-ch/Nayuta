import { Scene } from '../core/scene.js';
import { COLORS } from '../constants.js';

export class MenuScene extends Scene {
  constructor(input, sceneManager) {
    super('menu');
    this.input = input;
    this.sceneManager = sceneManager;
    this.selectedIndex = 0;
    this.menuItems = ['开始探索', '设置', '关于'];
    this.stars = [];
    this.stardust = [];
    this.time = 0;
    this.titleAlpha = 0;
    this.subtitleAlpha = 0;
    this.menuAlpha = 0;
    this.hintAlpha = 0;
    this.titlePulse = 0;
    this.mouseX = 0.5;
    this.mouseY = 0.5;
  }

  init() {
    super.init();
    this._generateStars();
    this._generateStardust();
    this._setupMouseTracking();
  }

  _setupMouseTracking() {
    this._mouseMoveHandler = (e) => {
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
    };
    this._clickHandler = (e) => {
      if (this.menuAlpha < 0.8) return;
      const h = window.innerHeight;
      const startY = h * 0.55;
      const itemHeight = 50;
      const clickY = e.clientY;
      for (let i = 0; i < this.menuItems.length; i++) {
        const itemY = startY + i * itemHeight;
        if (Math.abs(clickY - itemY) < 25) {
          this.selectedIndex = i;
          this._selectItem();
          break;
        }
      }
    };
    window.addEventListener('mousemove', this._mouseMoveHandler);
    window.addEventListener('click', this._clickHandler);
  }

  _generateStars() {
    this.stars = [];
    for (let i = 0; i < 300; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 0.3,
        speed: Math.random() * 0.00015 + 0.00003,
        brightness: Math.random() * 0.7 + 0.3,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random(),
      });
    }
  }

  _generateStardust() {
    this.stardust = [];
    for (let i = 0; i < 80; i++) {
      this.stardust.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0001,
        vy: -(Math.random() * 0.0003 + 0.0001),
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.4 + 0.05,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.7 ? 'cyan' : 'white',
      });
    }
  }

  onEnter() {
    super.onEnter();
    this.titleAlpha = 0;
    this.subtitleAlpha = 0;
    this.menuAlpha = 0;
    this.hintAlpha = 0;
    this.selectedIndex = 0;
  }

  onExit() {
    if (this._mouseMoveHandler) {
      window.removeEventListener('mousemove', this._mouseMoveHandler);
    }
    if (this._clickHandler) {
      window.removeEventListener('click', this._clickHandler);
    }
  }

  update(dt) {
    this.time += dt;
    this.titlePulse += dt * 0.002;

    if (this.titleAlpha < 1) {
      this.titleAlpha = Math.min(1, this.titleAlpha + dt * 0.0008);
    }
    if (this.titleAlpha > 0.6 && this.subtitleAlpha < 1) {
      this.subtitleAlpha = Math.min(1, this.subtitleAlpha + dt * 0.001);
    }
    if (this.subtitleAlpha > 0.5 && this.menuAlpha < 1) {
      this.menuAlpha = Math.min(1, this.menuAlpha + dt * 0.0012);
    }
    if (this.menuAlpha > 0.8 && this.hintAlpha < 1) {
      this.hintAlpha = Math.min(1, this.hintAlpha + dt * 0.001);
    }

    if (this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW')) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
    }
    if (this.input.justPressed('ArrowDown') || this.input.justPressed('KeyS')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
    }
    if (this.input.justPressed('Enter') || this.input.justPressed('Space')) {
      this._selectItem();
    }

    for (const d of this.stardust) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.y < -0.05) {
        d.y = 1.05;
        d.x = Math.random();
      }
    }
  }

  _selectItem() {
    switch (this.selectedIndex) {
      case 0:
        this.sceneManager.switchTo('game');
        break;
    }
  }

  render(ctx) {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    ctx.fillStyle = COLORS.ABYSS_BLUE;
    ctx.fillRect(0, 0, w, h);

    this._renderDepthGradient(ctx, w, h);
    this._renderStars(ctx, w, h);
    this._renderNebula(ctx, w, h);
    this._renderStardust(ctx, w, h);
    this._renderAbyssGlow(ctx, w, h);
    this._renderTitle(ctx, w, h);
    this._renderMenu(ctx, w, h);
    this._renderHint(ctx, w, h);
  }

  _renderDepthGradient(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0A0E1A');
    gradient.addColorStop(0.4, '#0F1528');
    gradient.addColorStop(0.7, '#1A1035');
    gradient.addColorStop(1, '#0A0812');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _renderStars(ctx, w, h) {
    const parallaxX = (this.mouseX - 0.5) * 10;
    const parallaxY = (this.mouseY - 0.5) * 10;

    for (const star of this.stars) {
      star.y -= star.speed * 16;
      if (star.y < -0.02) star.y += 1.04;

      const twinkle = 0.4 + 0.6 * Math.sin(this.time * 0.002 + star.phase);
      const alpha = star.brightness * twinkle;
      const px = parallaxX * star.depth;
      const py = parallaxY * star.depth;
      const sx = star.x * w + px;
      const sy = star.y * h + py;

      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 230, 240, ${alpha})`;
      ctx.fill();

      if (star.size > 1.2 && star.brightness > 0.6) {
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 212, ${alpha * 0.1})`;
        ctx.fill();
      }
    }
  }

  _renderNebula(ctx, w, h) {
    const breathCycle = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
    const nebulaAlpha = 0.3 + breathCycle * 0.15;

    const cx = w * 0.5;
    const cy = h * 0.25;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.45);
    gradient.addColorStop(0, `rgba(26, 16, 53, ${nebulaAlpha})`);
    gradient.addColorStop(0.4, `rgba(26, 16, 53, ${nebulaAlpha * 0.4})`);
    gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const cx2 = w * 0.65;
    const cy2 = h * 0.5;
    const gradient2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, w * 0.25);
    gradient2.addColorStop(0, `rgba(0, 255, 212, ${0.02 + breathCycle * 0.01})`);
    gradient2.addColorStop(0.5, `rgba(0, 136, 255, ${0.01 + breathCycle * 0.005})`);
    gradient2.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, w, h);

    const cx3 = w * 0.3;
    const cy3 = h * 0.7;
    const gradient3 = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, w * 0.2);
    gradient3.addColorStop(0, `rgba(255, 107, 53, ${0.015 + breathCycle * 0.008})`);
    gradient3.addColorStop(0.5, `rgba(255, 0, 68, ${0.008})`);
    gradient3.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient3;
    ctx.fillRect(0, 0, w, h);
  }

  _renderStardust(ctx, w, h) {
    for (const d of this.stardust) {
      const sx = d.x * w;
      const sy = d.y * h;
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 0.003 + d.phase);
      const alpha = d.alpha * twinkle;

      if (d.hue === 'cyan') {
        ctx.fillStyle = `rgba(0, 255, 212, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(232, 230, 240, ${alpha * 0.6})`;
      }

      ctx.beginPath();
      ctx.arc(sx, sy, d.size, 0, Math.PI * 2);
      ctx.fill();

      if (d.size > 2 && d.hue === 'cyan') {
        ctx.beginPath();
        ctx.arc(sx, sy, d.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 212, ${alpha * 0.1})`;
        ctx.fill();
      }
    }
  }

  _renderAbyssGlow(ctx, w, h) {
    const breathCycle = Math.sin(this.time * 0.0006) * 0.5 + 0.5;
    const cx = w * 0.5;
    const cy = h * 0.85;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    gradient.addColorStop(0, `rgba(0, 255, 212, ${0.02 + breathCycle * 0.015})`);
    gradient.addColorStop(0.3, `rgba(0, 136, 255, ${0.01 + breathCycle * 0.008})`);
    gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _renderTitle(ctx, w, h) {
    ctx.save();

    const pulse = Math.sin(this.titlePulse) * 0.15 + 0.85;
    const titleY = h * 0.28;

    ctx.globalAlpha = this.titleAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 40 * pulse;
    ctx.font = '600 80px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(232, 230, 240, ${0.95 * pulse})`;
    ctx.fillText('NAYUTA', w / 2, titleY);

    ctx.shadowBlur = 80 * pulse;
    ctx.fillStyle = `rgba(0, 255, 212, ${0.15 * pulse})`;
    ctx.fillText('NAYUTA', w / 2, titleY);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = this.subtitleAlpha;
    ctx.font = '300 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.letterSpacing = '8px';
    ctx.fillText('那 由 他 之 梦', w / 2, titleY + 55);

    ctx.restore();
  }

  _renderMenu(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.menuAlpha;

    const startY = h * 0.55;
    const itemHeight = 52;

    for (let i = 0; i < this.menuItems.length; i++) {
      const y = startY + i * itemHeight;
      const isSelected = i === this.selectedIndex;
      const hoverOffset = isSelected ? Math.sin(this.time * 0.003) * 2 : 0;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(w / 2 - 80, y + hoverOffset, 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
        ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(w / 2 - 80, y + hoverOffset, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 212, 0.1)';
        ctx.fill();

        ctx.font = '400 22px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.menuItems[i], w / 2, y + hoverOffset);
      } else {
        ctx.font = '400 18px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = COLORS.STARDUST_GRAY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.menuItems[i], w / 2, y);
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _renderHint(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.hintAlpha * (0.4 + 0.3 * Math.sin(this.time * 0.002));
    ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑↓ 选择  ·  Enter 确认  ·  鼠标点击', w / 2, h * 0.88);
    ctx.restore();
  }
}

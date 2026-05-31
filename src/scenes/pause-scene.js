import { Scene } from '../core/scene.js';
import { COLORS } from '../constants.js';

export class PauseScene extends Scene {
  constructor(input, sceneManager) {
    super('pause');
    this.input = input;
    this.sceneManager = sceneManager;
    this.selectedIndex = 0;
    this.menuItems = ['继续探索', '设置', '返回主菜单'];
    this.time = 0;
    this.alpha = 0;
    this.showSettings = false;
    this.settingsIndex = 0;
    this.settingsItems = [
      { label: '粒子效果', key: 'particles', values: ['高', '中', '低'], valueIndex: 0 },
      { label: '雾气浓度', key: 'fogDensity', values: ['浓', '中', '淡'], valueIndex: 1 },
      { label: '侵蚀效果', key: 'erosion', values: ['开', '关'], valueIndex: 0 },
    ];
    this.settings = {
      particles: 0,
      fogDensity: 1,
      erosion: 0,
    };
  }

  onEnter() {
    super.onEnter();
    this.alpha = 0;
    this.selectedIndex = 0;
    this.showSettings = false;
    this.settingsIndex = 0;
  }

  update(dt) {
    this.time += dt;
    if (this.alpha < 1) {
      this.alpha = Math.min(1, this.alpha + dt * 0.004);
    }

    if (this.showSettings) {
      this._updateSettings(dt);
    } else {
      this._updateMenu(dt);
    }
  }

  _updateMenu(dt) {
    if (this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW')) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
    }
    if (this.input.justPressed('ArrowDown') || this.input.justPressed('KeyS')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
    }
    if (this.input.justPressed('Enter') || this.input.justPressed('Space')) {
      this._selectMenuItem();
    }
    if (this.input.justPressed('Escape')) {
      this.sceneManager.switchTo('game');
    }
  }

  _updateSettings(dt) {
    if (this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW')) {
      this.settingsIndex = (this.settingsIndex - 1 + this.settingsItems.length) % this.settingsItems.length;
    }
    if (this.input.justPressed('ArrowDown') || this.input.justPressed('KeyS')) {
      this.settingsIndex = (this.settingsIndex + 1) % this.settingsItems.length;
    }
    if (this.input.justPressed('ArrowLeft') || this.input.justPressed('KeyA')) {
      const item = this.settingsItems[this.settingsIndex];
      item.valueIndex = (item.valueIndex - 1 + item.values.length) % item.values.length;
      this.settings[item.key] = item.valueIndex;
    }
    if (this.input.justPressed('ArrowRight') || this.input.justPressed('KeyD')) {
      const item = this.settingsItems[this.settingsIndex];
      item.valueIndex = (item.valueIndex + 1) % item.values.length;
      this.settings[item.key] = item.valueIndex;
    }
    if (this.input.justPressed('Escape') || this.input.justPressed('Enter') || this.input.justPressed('Space')) {
      this.showSettings = false;
    }
  }

  _selectMenuItem() {
    switch (this.selectedIndex) {
      case 0:
        this.sceneManager.switchTo('game');
        break;
      case 1:
        this.showSettings = true;
        this.settingsIndex = 0;
        break;
      case 2:
        this.sceneManager.switchTo('menu');
        break;
    }
  }

  render(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;

    ctx.save();
    ctx.globalAlpha = this.alpha * 0.7;
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    if (this.showSettings) {
      this._renderSettings(ctx, w, h);
    } else {
      this._renderMenu(ctx, w, h);
    }

    ctx.restore();
  }

  _renderMenu(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const titleY = h * 0.25;
    const breathCycle = Math.sin(this.time * 0.002) * 0.5 + 0.5;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 30 * (0.7 + breathCycle * 0.3);
    ctx.font = '600 48px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(232, 230, 240, ${0.9 + breathCycle * 0.1})`;
    ctx.fillText('暂停', w / 2, titleY);
    ctx.shadowBlur = 0;

    ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText('深渊中的片刻安宁', w / 2, titleY + 40);

    const startY = h * 0.45;
    const itemHeight = 56;

    for (let i = 0; i < this.menuItems.length; i++) {
      const y = startY + i * itemHeight;
      const isSelected = i === this.selectedIndex;
      const hoverOffset = isSelected ? Math.sin(this.time * 0.003) * 2 : 0;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(w / 2 - 70, y + hoverOffset, 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
        ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '400 20px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.menuItems[i], w / 2, y + hoverOffset);
      } else {
        ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = COLORS.STARDUST_GRAY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.menuItems[i], w / 2, y);
      }
    }

    ctx.globalAlpha = this.alpha * (0.3 + 0.2 * Math.sin(this.time * 0.002));
    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ 选择  ·  Enter 确认  ·  Esc 继续', w / 2, h * 0.85);

    ctx.restore();
  }

  _renderSettings(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const titleY = h * 0.2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 20;
    ctx.font = '600 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
    ctx.fillText('设置', w / 2, titleY);
    ctx.shadowBlur = 0;

    const startY = h * 0.35;
    const itemHeight = 60;

    for (let i = 0; i < this.settingsItems.length; i++) {
      const y = startY + i * itemHeight;
      const item = this.settingsItems[i];
      const isSelected = i === this.settingsIndex;

      if (isSelected) {
        const glowAlpha = 0.05 + Math.sin(this.time * 0.003) * 0.02;
        ctx.fillStyle = `rgba(0, 255, 212, ${glowAlpha})`;
        ctx.fillRect(w * 0.2, y - 20, w * 0.6, 40);
      }

      ctx.font = isSelected ? '500 18px "Segoe UI", system-ui, sans-serif' : '400 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = isSelected ? COLORS.MOONLIGHT_WHITE : COLORS.STARDUST_GRAY;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, w / 2 - 20, y);

      ctx.textAlign = 'left';
      for (let v = 0; v < item.values.length; v++) {
        const vx = w / 2 + 20 + v * 60;
        const isActive = v === item.valueIndex;

        if (isActive && isSelected) {
          ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
          ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
          ctx.shadowBlur = 8;
        } else if (isActive) {
          ctx.fillStyle = `rgba(0, 255, 212, 0.7)`;
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = `rgba(107, 107, 141, 0.5)`;
          ctx.shadowBlur = 0;
        }

        ctx.font = isActive ? '500 15px "Segoe UI", system-ui, sans-serif' : '400 14px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(item.values[v], vx, y);
        ctx.shadowBlur = 0;
      }
    }

    ctx.globalAlpha = this.alpha * (0.3 + 0.2 * Math.sin(this.time * 0.002));
    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'center';
    ctx.fillText('← → 调整  ·  Esc 返回', w / 2, h * 0.85);

    ctx.restore();
  }
}

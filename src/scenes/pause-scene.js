import { Scene } from '../core/scene.js';
import { COLORS } from '../constants.js';
import { saveSystem } from '../core/save-system.js';

export class PauseScene extends Scene {
  constructor(input, sceneManager, audioSystem) {
    super('pause');
    this.input = input;
    this.sceneManager = sceneManager;
    this.audio = audioSystem;
    this.selectedIndex = 0;
    this.menuItems = ['继续探索', '设置', '辅助模式', '返回主菜单'];
    this.time = 0;
    this.alpha = 0;
    this.showSettings = false;
    this.showAssist = false;
    this.settingsIndex = 0;
    this.assistIndex = 0;
    this.settingsItems = [
      { label: '粒子效果', key: 'particles', values: ['高', '中', '低'], valueIndex: 0 },
      { label: '雾气浓度', key: 'fogDensity', values: ['浓', '中', '淡'], valueIndex: 1 },
      { label: '侵蚀效果', key: 'erosion', values: ['开', '关'], valueIndex: 0 },
      { label: '音量', key: 'volume', values: ['高', '中', '低', '静音'], valueIndex: 1 },
    ];
    this.settings = {
      particles: 0,
      fogDensity: 1,
      erosion: 0,
      volume: 1,
    };
    this.assistItems = [
      { label: '游戏速度', key: 'gameSpeed', values: ['1.0x', '0.8x', '0.6x', '0.4x'], valueIndex: 0 },
      { label: '无敌模式', key: 'invincible', values: ['关', '开'], valueIndex: 0 },
      { label: '无限跳跃', key: 'infiniteJump', values: ['关', '开'], valueIndex: 0 },
      { label: '低重力', key: 'lowGravity', values: ['关', '开'], valueIndex: 0 },
    ];
    this.assistSettings = {
      gameSpeed: 0,
      invincible: 0,
      infiniteJump: 0,
      lowGravity: 0,
    };
  }

  onEnter() {
    super.onEnter();
    this.alpha = 0;
    this.selectedIndex = 0;
    this.showSettings = false;
    this.showAssist = false;
    this.settingsIndex = 0;
    this.assistIndex = 0;
    this._loadAssistSettings();
  }

  _loadAssistSettings() {
    const saved = saveSystem.loadSettings();
    if (saved && saved.assist) {
      this.assistSettings = { ...this.assistSettings, ...saved.assist };
      for (const item of this.assistItems) {
        if (item.key in this.assistSettings) {
          item.valueIndex = this.assistSettings[item.key];
        }
      }
    }
  }

  _saveAssistSettings() {
    const saved = saveSystem.loadSettings() || {};
    saved.assist = { ...this.assistSettings };
    saveSystem.saveSettings(saved);
  }

  update(dt) {
    this.time += dt;
    if (this.alpha < 1) {
      this.alpha = Math.min(1, this.alpha + dt * 0.004);
    }

    if (this.showAssist) {
      this._updateAssist(dt);
    } else if (this.showSettings) {
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
      this._applySetting(item.key, item.valueIndex);
    }
    if (this.input.justPressed('ArrowRight') || this.input.justPressed('KeyD')) {
      const item = this.settingsItems[this.settingsIndex];
      item.valueIndex = (item.valueIndex + 1) % item.values.length;
      this.settings[item.key] = item.valueIndex;
      this._applySetting(item.key, item.valueIndex);
    }
    if (this.input.justPressed('Escape') || this.input.justPressed('Enter') || this.input.justPressed('Space')) {
      this.showSettings = false;
    }
  }

  _updateAssist(dt) {
    if (this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW')) {
      this.assistIndex = (this.assistIndex - 1 + this.assistItems.length) % this.assistItems.length;
    }
    if (this.input.justPressed('ArrowDown') || this.input.justPressed('KeyS')) {
      this.assistIndex = (this.assistIndex + 1) % this.assistItems.length;
    }
    if (this.input.justPressed('ArrowLeft') || this.input.justPressed('KeyA')) {
      const item = this.assistItems[this.assistIndex];
      item.valueIndex = (item.valueIndex - 1 + item.values.length) % item.values.length;
      this.assistSettings[item.key] = item.valueIndex;
      this._saveAssistSettings();
    }
    if (this.input.justPressed('ArrowRight') || this.input.justPressed('KeyD')) {
      const item = this.assistItems[this.assistIndex];
      item.valueIndex = (item.valueIndex + 1) % item.values.length;
      this.assistSettings[item.key] = item.valueIndex;
      this._saveAssistSettings();
    }
    if (this.input.justPressed('Escape') || this.input.justPressed('Enter') || this.input.justPressed('Space')) {
      this.showAssist = false;
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
        this.showAssist = true;
        this.assistIndex = 0;
        break;
      case 3:
        this.sceneManager.switchTo('menu');
        break;
    }
  }

  _applySetting(key, valueIndex) {
    if (key === 'volume' && this.audio) {
      const volumes = [0.8, 0.5, 0.2, 0];
      this.audio.setVolume(volumes[valueIndex]);
      if (valueIndex === 3) {
        this.audio.toggleMute();
      }
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

    if (this.showAssist) {
      this._renderAssist(ctx, w, h);
    } else if (this.showSettings) {
      this._renderSettings(ctx, w, h);
    } else {
      this._renderMenu(ctx, w, h);
    }

    ctx.restore();
  }

  _renderMenu(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const titleY = h * 0.22;
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

    const startY = h * 0.42;
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
    ctx.fillText('↑↓ 选择  ·  Enter 确认  ·  Esc 继续', w / 2, h * 0.88);

    ctx.restore();
  }

  _renderSettings(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const titleY = h * 0.18;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 20;
    ctx.font = '600 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
    ctx.fillText('设置', w / 2, titleY);
    ctx.shadowBlur = 0;

    const startY = h * 0.32;
    const itemHeight = 55;

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
    ctx.fillText('← → 调整  ·  Esc 返回', w / 2, h * 0.88);

    ctx.restore();
  }

  _renderAssist(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const titleY = h * 0.12;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 20;
    ctx.font = '600 32px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
    ctx.fillText('辅助模式', w / 2, titleY);
    ctx.shadowBlur = 0;

    ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText('深渊不应拒绝任何人 — 调整游戏难度以适合你的体验', w / 2, titleY + 32);

    const startY = h * 0.32;
    const itemHeight = 62;

    for (let i = 0; i < this.assistItems.length; i++) {
      const y = startY + i * itemHeight;
      const item = this.assistItems[i];
      const isSelected = i === this.assistIndex;

      if (isSelected) {
        const glowAlpha = 0.04 + Math.sin(this.time * 0.003) * 0.02;
        ctx.fillStyle = `rgba(0, 255, 212, ${glowAlpha})`;
        ctx.fillRect(w * 0.15, y - 22, w * 0.7, 44);
      }

      ctx.font = isSelected ? '500 17px "Segoe UI", system-ui, sans-serif' : '400 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = isSelected ? COLORS.MOONLIGHT_WHITE : COLORS.STARDUST_GRAY;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, w / 2 - 30, y);

      const valuesStartX = w / 2 + 10;
      const valueSpacing = item.values.length <= 2 ? 80 : 65;
      ctx.textAlign = 'left';
      for (let v = 0; v < item.values.length; v++) {
        const vx = valuesStartX + v * valueSpacing;
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

        ctx.font = isActive ? '500 14px "Segoe UI", system-ui, sans-serif' : '400 13px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(item.values[v], vx, y);
        ctx.shadowBlur = 0;
      }
    }

    const anyAssistActive = this.assistSettings.invincible === 1 ||
      this.assistSettings.infiniteJump === 1 ||
      this.assistSettings.lowGravity === 1 ||
      this.assistSettings.gameSpeed > 0;

    if (anyAssistActive) {
      const noticeY = startY + this.assistItems.length * itemHeight + 20;
      ctx.globalAlpha = this.alpha * (0.5 + 0.3 * Math.sin(this.time * 0.003));
      ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.VOID_ORANGE;
      ctx.textAlign = 'center';
      ctx.fillText('辅助模式已启用 — 成就系统仍可正常解锁', w / 2, noticeY);
      ctx.globalAlpha = this.alpha;
    }

    ctx.globalAlpha = this.alpha * (0.3 + 0.2 * Math.sin(this.time * 0.002));
    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'center';
    ctx.fillText('← → 调整  ·  Esc 返回', w / 2, h * 0.88);

    ctx.restore();
  }
}

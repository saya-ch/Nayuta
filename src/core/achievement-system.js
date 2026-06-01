import { saveSystem } from './save-system.js';

const ACHIEVEMENTS = [
  {
    id: 'first_anchor',
    name: '初次触碰',
    desc: '收集第一个记忆之锚',
    icon: '◇',
    check: (stats) => stats.totalAnchors >= 1,
  },
  {
    id: 'half_anchors',
    name: '半途之忆',
    desc: '收集超过一半的记忆之锚',
    icon: '△',
    check: (stats) => stats.totalAnchors >= 14,
  },
  {
    id: 'all_anchors',
    name: '全知之锚',
    desc: '收集所有记忆之锚',
    icon: '○',
    check: (stats) => stats.totalAnchors >= 27,
  },
  {
    id: 'depth_1',
    name: '浅层潜入',
    desc: '抵达第2层深渊',
    icon: '▽',
    check: (stats) => stats.maxDepth >= 1,
  },
  {
    id: 'depth_2',
    name: '紫雾迷途',
    desc: '抵达第3层深渊',
    icon: '⬡',
    check: (stats) => stats.maxDepth >= 2,
  },
  {
    id: 'depth_3',
    name: '深渊凝视',
    desc: '抵达第4层深渊',
    icon: '✧',
    check: (stats) => stats.maxDepth >= 3,
  },
  {
    id: 'void_ending',
    name: '回归虚无',
    desc: '选择回归虚无的安宁',
    icon: '□',
    check: (stats) => stats.endingsSeen.includes('void'),
  },
  {
    id: 'abyss_ending',
    name: '凝视深渊',
    desc: '以凡人之躯凝视深渊',
    icon: '⬢',
    check: (stats) => stats.endingsSeen.includes('abyss'),
  },
  {
    id: 'both_endings',
    name: '双重真相',
    desc: '见证两种结局',
    icon: '∞',
    check: (stats) => stats.endingsSeen.length >= 2,
  },
  {
    id: 'first_death',
    name: '深渊吞噬',
    desc: '首次被深渊吞噬',
    icon: '▽',
    check: (stats) => stats.deathCount >= 1,
  },
  {
    id: 'many_deaths',
    name: '永恒轮回',
    desc: '被深渊吞噬10次',
    icon: '◎',
    check: (stats) => stats.deathCount >= 10,
  },
  {
    id: 'speed_runner',
    name: '超越时间',
    desc: '在30分钟内通关',
    icon: '◇',
    check: (stats) => stats.completedGame && stats.playTime < 1800000,
  },
  {
    id: 'explorer',
    name: '记忆猎人',
    desc: '发现10个叙事碎片',
    icon: '△',
    check: (stats) => stats.discoveredFragments >= 10,
  },
  {
    id: 'no_death',
    name: '无瑕之躯',
    desc: '通关游戏且未被吞噬',
    icon: '✧',
    check: (stats) => stats.completedGame && stats.deathCount === 0,
  },
  {
    id: 'first_secret',
    name: '隐秘之光',
    desc: '发现第一个隐藏记忆',
    icon: '◇',
    check: (stats) => stats.discoveredSecrets >= 1,
  },
  {
    id: 'all_secrets',
    name: '深渊全知',
    desc: '发现所有隐藏记忆',
    icon: '✧',
    check: (stats) => stats.discoveredSecrets >= 7,
  },
];

class AchievementSystem {
  constructor() {
    this.notifications = [];
    this._unlocked = null;
  }

  _loadUnlocked() {
    if (this._unlocked) return this._unlocked;
    const data = saveSystem.getData();
    this._unlocked = data.achievements || [];
    return this._unlocked;
  }

  _saveUnlocked() {
    const data = saveSystem.getData();
    data.achievements = this._unlocked;
    saveSystem.save(data);
  }

  checkAll(stats) {
    const unlocked = this._loadUnlocked();
    const newlyUnlocked = [];

    for (const ach of ACHIEVEMENTS) {
      if (unlocked.includes(ach.id)) continue;
      if (ach.check(stats)) {
        unlocked.push(ach.id);
        newlyUnlocked.push(ach);
      }
    }

    if (newlyUnlocked.length > 0) {
      this._saveUnlocked();
      for (const ach of newlyUnlocked) {
        this.notifications.push({
          achievement: ach,
          timer: 0,
          duration: 3500,
          phase: 'enter',
          alpha: 0,
          slideX: 0,
        });
      }
    }

    return newlyUnlocked;
  }

  getStats() {
    const unlocked = this._loadUnlocked();
    return {
      total: ACHIEVEMENTS.length,
      unlocked: unlocked.length,
      achievements: ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: unlocked.includes(a.id),
      })),
    };
  }

  isUnlocked(id) {
    return this._loadUnlocked().includes(id);
  }

  update(dt) {
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const notif = this.notifications[i];
      notif.timer += dt;

      if (notif.timer < 400) {
        notif.phase = 'enter';
        notif.alpha = notif.timer / 400;
        notif.slideX = (1 - notif.alpha) * 300;
      } else if (notif.timer < notif.duration - 600) {
        notif.phase = 'visible';
        notif.alpha = 1;
        notif.slideX = 0;
      } else if (notif.timer < notif.duration) {
        notif.phase = 'exit';
        const exitProgress = (notif.timer - (notif.duration - 600)) / 600;
        notif.alpha = 1 - exitProgress;
        notif.slideX = exitProgress * 300;
      } else {
        this.notifications.splice(i, 1);
      }
    }
  }

  renderNotifications(ctx, w, h) {
    for (let i = 0; i < this.notifications.length; i++) {
      const notif = this.notifications[i];
      const ach = notif.achievement;

      const boxW = 280;
      const boxH = 64;
      const boxX = w - boxW - 20 + notif.slideX;
      const boxY = 80 + i * (boxH + 12);

      ctx.save();
      ctx.globalAlpha = notif.alpha;

      ctx.fillStyle = 'rgba(10, 14, 26, 0.92)';
      ctx.strokeStyle = 'rgba(0, 255, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();

      const pulse = Math.sin(notif.timer * 0.005) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(0, 255, 212, ${0.15 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2, 7);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 255, 212, 0.06)';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#00FFD4';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#00FFD4';
      ctx.shadowBlur = 8 * pulse;
      ctx.fillText(ach.icon, boxX + 30, boxY + boxH / 2);
      ctx.shadowBlur = 0;

      ctx.textAlign = 'left';
      ctx.font = '500 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#00FFD4';
      ctx.fillText('成就解锁', boxX + 56, boxY + 20);

      ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#E8E6F0';
      ctx.fillText(ach.name, boxX + 56, boxY + 40);

      ctx.font = '300 10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#6B6B8D';
      ctx.fillText(ach.desc, boxX + 56, boxY + 54);

      ctx.restore();
    }
  }

  renderPanel(ctx, w, h, scrollY) {
    const stats = this.getStats();
    const panelW = Math.min(600, w - 80);
    const panelH = h - 80;
    const panelX = (w - panelW) / 2;
    const panelY = 40;

    ctx.save();

    ctx.fillStyle = 'rgba(10, 14, 26, 0.95)';
    ctx.strokeStyle = 'rgba(0, 255, 212, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();

    const headerY = panelY + 30;
    ctx.textAlign = 'center';
    ctx.font = '600 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#E8E6F0';
    ctx.shadowColor = '#00FFD4';
    ctx.shadowBlur = 15;
    ctx.fillText('深渊记录', w / 2, headerY);
    ctx.shadowBlur = 0;

    const progressW = 200;
    const progressH = 3;
    const progressX = (w - progressW) / 2;
    const progressY = headerY + 18;
    const progressRatio = stats.unlocked / stats.total;

    ctx.fillStyle = 'rgba(107, 107, 141, 0.3)';
    ctx.fillRect(progressX, progressY, progressW, progressH);

    const gradient = ctx.createLinearGradient(progressX, 0, progressX + progressW * progressRatio, 0);
    gradient.addColorStop(0, '#00FFD4');
    gradient.addColorStop(1, '#0088FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(progressX, progressY, progressW * progressRatio, progressH);

    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#6B6B8D';
    ctx.fillText(`${stats.unlocked} / ${stats.total}`, w / 2, progressY + 18);

    const listY = progressY + 40;
    const itemH = 52;
    const listX = panelX + 30;
    const listW = panelW - 60;

    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX, listY - 5, panelW, panelH - (listY - panelY) - 15);
    ctx.clip();

    for (let i = 0; i < stats.achievements.length; i++) {
      const ach = stats.achievements[i];
      const iy = listY + i * itemH - scrollY;

      if (iy < listY - itemH || iy > panelY + panelH) continue;

      if (ach.unlocked) {
        const pulse = Math.sin(Date.now() * 0.003 + i * 0.5) * 0.15 + 0.85;
        ctx.fillStyle = `rgba(0, 255, 212, ${0.04 * pulse})`;
        ctx.beginPath();
        ctx.roundRect(listX, iy, listW, itemH - 6, 4);
        ctx.fill();

        ctx.strokeStyle = `rgba(0, 255, 212, ${0.12 * pulse})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(listX, iy, listW, itemH - 6, 4);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.font = '600 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = ach.unlocked ? '#00FFD4' : 'rgba(107, 107, 141, 0.4)';
      ctx.fillText(ach.icon, listX + 22, iy + itemH / 2 - 3);

      ctx.textAlign = 'left';
      ctx.font = '500 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = ach.unlocked ? '#E8E6F0' : 'rgba(107, 107, 141, 0.5)';
      ctx.fillText(ach.name, listX + 48, iy + 20);

      ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = ach.unlocked ? '#6B6B8D' : 'rgba(107, 107, 141, 0.35)';
      ctx.fillText(ach.desc, listX + 48, iy + 36);

      if (!ach.unlocked) {
        ctx.textAlign = 'right';
        ctx.font = '300 10px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(107, 107, 141, 0.3)';
        ctx.fillText('未解锁', listX + listW - 10, iy + 28);
      }
    }

    ctx.restore();
    ctx.restore();

    return stats.achievements.length * itemH;
  }
}

export const achievementSystem = new AchievementSystem();
export { ACHIEVEMENTS };

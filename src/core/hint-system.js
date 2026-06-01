export class HintSystem {
  constructor() {
    this.hints = [];
    this.shownHints = new Set();
    this.time = 0;
  }

  loadFromSave(saveData) {
    if (saveData && saveData.shownHints) {
      for (const id of saveData.shownHints) {
        this.shownHints.add(id);
      }
    }
  }

  getShownHints() {
    return Array.from(this.shownHints);
  }

  reset() {
    this.hints = [];
    this.time = 0;
  }

  trigger(id, text, x, y, duration = 4000) {
    if (this.shownHints.has(id)) return;
    this.shownHints.add(id);

    this.hints.push({
      id,
      text,
      x,
      y,
      alpha: 0,
      timer: 0,
      duration,
      fadeInDuration: 500,
      fadeOutDuration: 800,
      phase: 'fadeIn',
      offsetY: 0,
    });
  }

  update(dt, playerX, playerY) {
    this.time += dt;

    for (let i = this.hints.length - 1; i >= 0; i--) {
      const hint = this.hints[i];
      hint.timer += dt;
      hint.x = playerX;
      hint.y = playerY - 90 + hint.offsetY;

      if (hint.phase === 'fadeIn') {
        hint.alpha = Math.min(1, hint.timer / hint.fadeInDuration);
        if (hint.timer >= hint.fadeInDuration) {
          hint.phase = 'visible';
          hint.timer = 0;
        }
      } else if (hint.phase === 'visible') {
        hint.alpha = 1;
        if (hint.timer >= hint.duration) {
          hint.phase = 'fadeOut';
          hint.timer = 0;
        }
      } else if (hint.phase === 'fadeOut') {
        hint.alpha = Math.max(0, 1 - hint.timer / hint.fadeOutDuration);
        if (hint.timer >= hint.fadeOutDuration) {
          this.hints.splice(i, 1);
        }
      }
    }
  }

  checkTriggers(playerX, playerY, input, anchorCount, anchorNearby, portalNearby, movingPlatformNearby, onGround) {
    if (!this.shownHints.has('move')) {
      if (input.isDown('ArrowLeft') || input.isDown('ArrowRight') ||
          input.isDown('KeyA') || input.isDown('KeyD') ||
          (input.isMobile() && input.getJoystickState().active)) {
        this.trigger('move', '← → 移动', playerX, playerY - 90, 2500);
      }
    }

    if (!this.shownHints.has('move_remind') && !this.shownHints.has('move')) {
      if (this.time > 3000) {
        this.trigger('move_remind', '← → 或 A D 移动', playerX, playerY - 90, 3500);
      }
    }

    if (!this.shownHints.has('jump') && this.shownHints.has('move')) {
      if (input.justPressed('ArrowUp') || input.justPressed('KeyW') || input.justPressed('Space')) {
        this.trigger('jump', '↑ 或 空格 跳跃', playerX, playerY - 90, 2500);
      }
    }

    if (!this.shownHints.has('jump_remind') && this.shownHints.has('move') && !this.shownHints.has('jump')) {
      if (this.time > 8000 && onGround) {
        this.trigger('jump_remind', '↑ 或 空格 跳跃', playerX, playerY - 90, 3500);
      }
    }

    if (!this.shownHints.has('interact') && this.shownHints.has('jump')) {
      if (input.justPressed('KeyE')) {
        this.trigger('interact', 'E 交互 / 旋转镜面', playerX, playerY - 90, 3000);
      }
    }

    if (!this.shownHints.has('anchor') && anchorNearby && this.shownHints.has('jump')) {
      this.trigger('anchor', '靠近记忆之锚即可收集', playerX, playerY - 90, 3500);
    }

    if (!this.shownHints.has('portal') && portalNearby) {
      this.trigger('portal', '踏入传送门，穿越空间', playerX, playerY - 90, 3500);
    }

    if (!this.shownHints.has('moving_platform') && movingPlatformNearby) {
      this.trigger('moving_platform', '浮动平台会移动，注意节奏', playerX, playerY - 90, 3500);
    }

    if (!this.shownHints.has('pause') && this.shownHints.has('jump') && this.time > 15000) {
      this.trigger('pause', 'Esc 暂停', playerX, playerY - 90, 2500);
    }
  }

  render(ctx) {
    for (const hint of this.hints) {
      if (hint.alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = hint.alpha * (0.7 + 0.2 * Math.sin(this.time * 0.003));

      const padding = 12;
      ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
      const textWidth = ctx.measureText(hint.text).width;
      const boxW = textWidth + padding * 2;
      const boxH = 26;
      const boxX = hint.x - boxW / 2;
      const boxY = hint.y - boxH / 2;

      ctx.fillStyle = 'rgba(10, 14, 26, 0.7)';
      ctx.beginPath();
      const r = 4;
      ctx.moveTo(boxX + r, boxY);
      ctx.lineTo(boxX + boxW - r, boxY);
      ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
      ctx.lineTo(boxX + boxW, boxY + boxH - r);
      ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
      ctx.lineTo(boxX + r, boxY + boxH);
      ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
      ctx.lineTo(boxX, boxY + r);
      ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 255, 212, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#E8E6F0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hint.text, hint.x, hint.y);

      ctx.restore();
    }
  }
}

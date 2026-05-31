export class PuzzleElement {
  constructor(x, y, type, config = {}) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.activated = false;
    this.config = config;
    this.time = 0;
    this.pulse = Math.random() * Math.PI * 2;
    this.targetIds = config.targetIds || [];
    this.id = config.id || '';
  }

  update(dt, playerX, playerY, playerOnGround, puzzleManager) {
    this.time += dt;
    this.pulse += dt * 0.003;

    switch (this.type) {
      case 'switch':
        this._updateSwitch(playerX, playerY, puzzleManager);
        break;
      case 'pressurePlate':
        this._updatePressurePlate(playerX, playerY, puzzleManager);
        break;
      case 'lightSource':
        this._updateLightSource(puzzleManager);
        break;
      case 'lightMirror':
        this._updateMirror();
        break;
      case 'lightTarget':
        this._updateLightTarget(puzzleManager);
        break;
      case 'door':
        this._updateDoor(puzzleManager);
        break;
    }
  }

  _updateSwitch(playerX, playerY, puzzleManager) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this._playerNear = dist < 40;
  }

  _updatePressurePlate(playerX, playerY, puzzleManager) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const wasActivated = this.activated;
    this.activated = dist < 35;

    if (this.activated !== wasActivated) {
      this._notifyTargets(puzzleManager);
    }
  }

  _updateLightSource(puzzleManager) {
    if (this.activated) {
      this._castLight(puzzleManager);
    }
  }

  _updateMirror() {
    if (!this.config.angle) this.config.angle = 0;
  }

  _updateLightTarget(puzzleManager) {
    if (this.activated && this.config.onActivate) {
      this.config.onActivate(puzzleManager);
    }
  }

  _updateDoor(puzzleManager) {
    const prevActivated = this.activated;
    this.activated = puzzleManager.areAllSourcesActive(this.targetIds);
    if (this.activated && !prevActivated) {
      this._openProgress = 0;
    }
    if (this.activated && this._openProgress < 1) {
      this._openProgress = Math.min(1, (this._openProgress || 0) + 0.02);
    }
    if (!this.activated && prevActivated) {
      this._openProgress = 1;
    }
    if (!this.activated && (this._openProgress || 0) > 0) {
      this._openProgress = Math.max(0, (this._openProgress || 1) - 0.02);
    }
  }

  _notifyTargets(puzzleManager) {
    for (const tid of this.targetIds) {
      const target = puzzleManager.getElementById(tid);
      if (target) {
        if (this.activated) {
          target.activators = (target.activators || 0) + 1;
        } else {
          target.activators = Math.max(0, (target.activators || 0) - 1);
        }
        target.activated = target.activators > 0;
      }
    }
  }

  _castLight(puzzleManager) {
    if (!this.config.lightDir) this.config.lightDir = { x: 1, y: 0 };
    const dir = this.config.lightDir;
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    const nx = dir.x / len;
    const ny = dir.y / len;

    const maxDist = this.config.lightRange || 500;
    const step = 5;

    for (let d = 0; d < maxDist; d += step) {
      const lx = this.x + nx * d;
      const ly = this.y + ny * d;

      const mirror = puzzleManager.getMirrorAt(lx, ly);
      if (mirror) {
        const angle = mirror.config.angle || 0;
        const rad = angle * Math.PI / 180;
        const cos = Math.cos(2 * rad);
        const sin = Math.sin(2 * rad);
        const newDx = nx * cos + ny * sin;
        const newDy = nx * sin - ny * cos;
        mirror.config.lightDir = { x: newDx, y: newDy };
        mirror.activated = true;
        mirror._castFromMirror(puzzleManager, lx, ly, newDx, newDy, maxDist - d);
        break;
      }

      const target = puzzleManager.getLightTargetAt(lx, ly);
      if (target) {
        target.activated = true;
        target._hitTime = this.time;
        break;
      }
    }
  }

  _castFromMirror(puzzleManager, startX, startY, dx, dy, maxDist) {
    const step = 5;
    for (let d = 0; d < maxDist; d += step) {
      const lx = startX + dx * d;
      const ly = startY + dy * d;

      const mirror = puzzleManager.getMirrorAt(lx, ly);
      if (mirror && mirror !== this) {
        const angle = mirror.config.angle || 0;
        const rad = angle * Math.PI / 180;
        const cos = Math.cos(2 * rad);
        const sin = Math.sin(2 * rad);
        const newDx = dx * cos + dy * sin;
        const newDy = dx * sin - dy * cos;
        mirror.config.lightDir = { x: newDx, y: newDy };
        mirror.activated = true;
        mirror._castFromMirror(puzzleManager, lx, ly, newDx, newDy, maxDist - d);
        break;
      }

      const target = puzzleManager.getLightTargetAt(lx, ly);
      if (target) {
        target.activated = true;
        target._hitTime = this.time;
        break;
      }
    }
  }

  interact(puzzleManager) {
    if (this.type === 'switch') {
      this.activated = !this.activated;
      this._notifyTargets(puzzleManager);
      return true;
    }
    if (this.type === 'lightMirror') {
      this.config.angle = ((this.config.angle || 0) + 45) % 360;
      return true;
    }
    return false;
  }

  render(ctx) {
    switch (this.type) {
      case 'switch':
        this._renderSwitch(ctx);
        break;
      case 'pressurePlate':
        this._renderPressurePlate(ctx);
        break;
      case 'lightSource':
        this._renderLightSource(ctx);
        break;
      case 'lightMirror':
        this._renderMirror(ctx);
        break;
      case 'lightTarget':
        this._renderLightTarget(ctx);
        break;
      case 'door':
        this._renderDoor(ctx);
        break;
    }
  }

  _renderSwitch(ctx) {
    const pulseVal = Math.sin(this.pulse) * 0.3 + 0.7;
    const baseColor = this.activated ? '#00FFD4' : '#6B6B8D';
    const glowColor = this.activated ? 'rgba(0, 255, 212, 0.3)' : 'rgba(107, 107, 141, 0.1)';

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#1A1035';
    ctx.fill();
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.activated) {
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#00FFD4';
      ctx.shadowColor = '#00FFD4';
      ctx.shadowBlur = 15 * pulseVal;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (this._playerNear && !this.activated) {
      ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = `rgba(0, 255, 212, ${0.5 + pulseVal * 0.3})`;
      ctx.textAlign = 'center';
      ctx.fillText('E 交互', 0, -25);
    }

    ctx.restore();
  }

  _renderPressurePlate(ctx) {
    const pressOffset = this.activated ? 4 : 0;
    const alpha = this.activated ? 0.8 : 0.4;

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = 'rgba(107, 107, 141, 0.15)';
    ctx.fillRect(-25, -5, 50, 10);

    ctx.fillStyle = this.activated ? 'rgba(0, 255, 212, 0.6)' : `rgba(107, 107, 141, ${alpha})`;
    ctx.fillRect(-22, -3 + pressOffset, 44, 6 - pressOffset);

    if (this.activated) {
      ctx.strokeStyle = 'rgba(0, 255, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-25, -7, 50, 14);
    }

    ctx.restore();
  }

  _renderLightSource(ctx) {
    const pulseVal = Math.sin(this.pulse) * 0.2 + 0.8;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.activated) {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
      gradient.addColorStop(0, `rgba(0, 255, 212, ${0.15 * pulseVal})`);
      gradient.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-40, -40, 80, 80);

      const dir = this.config.lightDir || { x: 1, y: 0 };
      const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
      const nx = dir.x / len;
      const ny = dir.y / len;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      const range = this.config.lightRange || 500;
      const spread = 8;
      ctx.lineTo(nx * range + ny * spread, ny * range - nx * spread);
      ctx.lineTo(nx * range - ny * spread, ny * range + nx * spread);
      ctx.closePath();
      const beamGrad = ctx.createLinearGradient(0, 0, nx * range, ny * range);
      beamGrad.addColorStop(0, `rgba(0, 255, 212, ${0.12 * pulseVal})`);
      beamGrad.addColorStop(0.5, `rgba(0, 255, 212, ${0.06 * pulseVal})`);
      beamGrad.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = this.activated ? '#00FFD4' : '#1A1035';
    ctx.shadowColor = this.activated ? '#00FFD4' : 'transparent';
    ctx.shadowBlur = this.activated ? 20 * pulseVal : 0;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.strokeStyle = this.activated ? '#00FFD4' : '#6B6B8D';
    ctx.lineWidth = 2;
    ctx.stroke();

    const starPoints = 6;
    ctx.beginPath();
    for (let i = 0; i < starPoints * 2; i++) {
      const a = (i * Math.PI) / starPoints - Math.PI / 2;
      const r = i % 2 === 0 ? 8 : 4;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = this.activated ? '#FFFFFF' : '#6B6B8D';
    ctx.fill();

    ctx.restore();
  }

  _renderMirror(ctx) {
    const angle = this.config.angle || 0;
    const rad = angle * Math.PI / 180;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(rad);

    if (this.activated && this.config.lightDir) {
      const dir = this.config.lightDir;
      const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
      const nx = dir.x / len;
      const ny = dir.y / len;
      const range = 400;

      ctx.save();
      ctx.rotate(-rad);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const spread = 6;
      ctx.lineTo(nx * range + ny * spread, ny * range - nx * spread);
      ctx.lineTo(nx * range - ny * spread, ny * range + nx * spread);
      ctx.closePath();
      const beamGrad = ctx.createLinearGradient(0, 0, nx * range, ny * range);
      beamGrad.addColorStop(0, 'rgba(0, 255, 212, 0.1)');
      beamGrad.addColorStop(0.5, 'rgba(0, 255, 212, 0.05)');
      beamGrad.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = this.activated ? 'rgba(0, 255, 212, 0.1)' : 'rgba(107, 107, 141, 0.05)';
    ctx.fillRect(-15, -15, 30, 30);

    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(0, -12);
    ctx.lineTo(12, 0);
    ctx.closePath();
    ctx.fillStyle = this.activated ? 'rgba(0, 255, 212, 0.5)' : 'rgba(107, 107, 141, 0.3)';
    ctx.fill();
    ctx.strokeStyle = this.activated ? '#00FFD4' : '#6B6B8D';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(12, 0);
    ctx.closePath();
    ctx.fillStyle = this.activated ? 'rgba(0, 255, 212, 0.3)' : 'rgba(107, 107, 141, 0.15)';
    ctx.fill();

    ctx.restore();
  }

  _renderLightTarget(ctx) {
    const pulseVal = Math.sin(this.pulse) * 0.3 + 0.7;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.activated) {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
      gradient.addColorStop(0, `rgba(0, 255, 212, ${0.2 * pulseVal})`);
      gradient.addColorStop(0.5, `rgba(0, 136, 255, ${0.1 * pulseVal})`);
      gradient.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-35, -35, 70, 70);
    }

    const outerR = 14;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : outerR * 0.6;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = this.activated ? '#00FFD4' : '#1A1035';
    ctx.shadowColor = this.activated ? '#00FFD4' : 'transparent';
    ctx.shadowBlur = this.activated ? 15 * pulseVal : 0;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = this.activated ? '#00FFD4' : '#6B6B8D';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = this.activated ? '#FFFFFF' : '#6B6B8D';
    ctx.fill();

    ctx.restore();
  }

  _renderDoor(ctx) {
    const openProgress = this._openProgress || 0;
    const doorHeight = 80;
    const doorWidth = 40;
    const visibleHeight = doorHeight * (1 - openProgress);

    ctx.save();
    ctx.translate(this.x, this.y);

    if (visibleHeight > 2) {
      const gradient = ctx.createLinearGradient(0, -doorHeight, 0, 0);
      gradient.addColorStop(0, '#1A1035');
      gradient.addColorStop(0.5, '#2D1B69');
      gradient.addColorStop(1, '#1A1035');
      ctx.fillStyle = gradient;
      ctx.fillRect(-doorWidth / 2, -visibleHeight, doorWidth, visibleHeight);

      ctx.strokeStyle = 'rgba(0, 255, 212, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-doorWidth / 2, -visibleHeight, doorWidth, visibleHeight);

      const runeCount = 3;
      for (let i = 0; i < runeCount; i++) {
        const ry = -visibleHeight + (visibleHeight / (runeCount + 1)) * (i + 1);
        const runePulse = Math.sin(this.pulse + i * 1.2) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(0, ry, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 212, ${0.3 * runePulse})`;
        ctx.fill();
      }
    }

    if (openProgress > 0 && openProgress < 1) {
      const glowAlpha = Math.sin(this.pulse * 2) * 0.1 + 0.15;
      const gradient = ctx.createRadialGradient(0, -doorHeight / 2, 0, 0, -doorHeight / 2, doorWidth);
      gradient.addColorStop(0, `rgba(0, 255, 212, ${glowAlpha})`);
      gradient.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-doorWidth, -doorHeight, doorWidth * 2, doorHeight);
    }

    if (openProgress >= 1) {
      const gradient = ctx.createRadialGradient(0, -doorHeight / 2, 0, 0, -doorHeight / 2, doorWidth * 0.8);
      gradient.addColorStop(0, 'rgba(0, 255, 212, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-doorWidth, -doorHeight, doorWidth * 2, doorHeight);
    }

    ctx.restore();
  }

  isSolid() {
    if (this.type === 'door') {
      return (this._openProgress || 0) < 0.9;
    }
    return false;
  }

  getBounds() {
    if (this.type === 'door') {
      return {
        x: this.x - 20,
        y: this.y - 80,
        width: 40,
        height: 80,
      };
    }
    if (this.type === 'pressurePlate') {
      return {
        x: this.x - 25,
        y: this.y - 5,
        width: 50,
        height: 10,
      };
    }
    return {
      x: this.x - 15,
      y: this.y - 15,
      width: 30,
      height: 30,
    };
  }
}

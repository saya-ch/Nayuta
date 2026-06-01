export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothing = 0.08;
    this.lookAheadX = 80;
    this.lookAheadY = 40;
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 1280;
    this.boundsH = 720;
    this.viewportW = 1280;
    this.viewportH = 720;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.92;
  }

  setBounds(x, y, w, h) {
    this.boundsX = x;
    this.boundsY = y;
    this.boundsW = w;
    this.boundsH = h;
  }

  setViewport(w, h) {
    this.viewportW = w;
    this.viewportH = h;
  }

  follow(playerX, playerY, facing) {
    this.targetX = playerX + facing * this.lookAheadX;
    this.targetY = playerY - this.lookAheadY;
  }

  update(dt) {
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;

    const minX = this.boundsX + this.viewportW / 2;
    const maxX = this.boundsX + this.boundsW - this.viewportW / 2;
    const minY = this.boundsY + this.viewportH / 2;
    const maxY = this.boundsY + this.boundsH - this.viewportH / 2;

    if (minX < maxX) {
      this.x = Math.max(minX, Math.min(maxX, this.x));
    } else {
      this.x = this.boundsX + this.boundsW / 2;
    }
    if (minY < maxY) {
      this.y = Math.max(minY, Math.min(maxY, this.y));
    } else {
      this.y = this.boundsY + this.boundsH / 2;
    }

    if (this.shakeIntensity > 0.3) {
      this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }
  }

  addShake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  getOffsetX() {
    return -this.x + this.viewportW / 2 + this.shakeX;
  }

  getOffsetY() {
    return -this.y + this.viewportH / 2 + this.shakeY;
  }

  screenToWorld(sx, sy) {
    return {
      x: sx - this.getOffsetX(),
      y: sy - this.getOffsetY(),
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx + this.getOffsetX(),
      y: wy + this.getOffsetY(),
    };
  }

  isVisible(wx, wy, margin) {
    margin = margin || 100;
    const sx = wx + this.getOffsetX();
    const sy = wy + this.getOffsetY();
    return sx > -margin && sx < this.viewportW + margin &&
           sy > -margin && sy < this.viewportH + margin;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;
  }
}

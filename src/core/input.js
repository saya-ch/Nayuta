export class InputManager {
  constructor() {
    this.keys = new Set();
    this.keysJustPressed = new Set();
    this.keysJustReleased = new Set();
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    this._touchJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, dx: 0, dy: 0 };
    this._touchButtons = new Map();
    this._isMobile = false;
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._detectMobile();
  }

  _detectMobile() {
    this._isMobile = ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (window.innerWidth <= 900);
  }

  isMobile() {
    return this._isMobile;
  }

  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    if (this._isMobile) {
      this._initTouchControls();
    }
  }

  _initTouchControls() {
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
      canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    }
  }

  _onTouchStart(e) {
    e.preventDefault();
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;

    for (const touch of e.changedTouches) {
      const tx = (touch.clientX - rect.left) * scaleX;
      const ty = (touch.clientY - rect.top) * scaleY;

      if (tx < 640) {
        this._touchJoystick.active = true;
        this._touchJoystick.startX = tx;
        this._touchJoystick.startY = ty;
        this._touchJoystick.currentX = tx;
        this._touchJoystick.currentY = ty;
        this._touchJoystick.touchId = touch.identifier;
      } else {
        this._touchButtons.set(touch.identifier, { x: tx, y: ty, pressed: true });
        if (ty < 360) {
          this._simulateKey('KeyE', true);
        } else if (ty >= 360 && ty < 540) {
          this._simulateKey('Space', true);
        } else {
          this._simulateKey('Escape', true);
        }
      }
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;

    for (const touch of e.changedTouches) {
      if (touch.identifier === this._touchJoystick.touchId) {
        const tx = (touch.clientX - rect.left) * scaleX;
        const ty = (touch.clientY - rect.top) * scaleY;
        this._touchJoystick.currentX = tx;
        this._touchJoystick.currentY = ty;
        const dx = tx - this._touchJoystick.startX;
        const dy = ty - this._touchJoystick.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 80;
        if (dist > maxDist) {
          this._touchJoystick.dx = (dx / dist) * maxDist;
          this._touchJoystick.dy = (dy / dist) * maxDist;
        } else {
          this._touchJoystick.dx = dx;
          this._touchJoystick.dy = dy;
        }
      }
    }
  }

  _onTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this._touchJoystick.touchId) {
        this._touchJoystick.active = false;
        this._touchJoystick.dx = 0;
        this._touchJoystick.dy = 0;
        this._touchJoystick.touchId = null;
      }
      if (this._touchButtons.has(touch.identifier)) {
        const btn = this._touchButtons.get(touch.identifier);
        if (btn.y < 360) {
          this._simulateKey('KeyE', false);
        } else if (btn.y >= 360 && btn.y < 540) {
          this._simulateKey('Space', false);
        } else {
          this._simulateKey('Escape', false);
        }
        this._touchButtons.delete(touch.identifier);
      }
    }
  }

  _simulateKey(code, pressed) {
    if (pressed) {
      if (!this.keys.has(code)) {
        this.keysJustPressed.add(code);
      }
      this.keys.add(code);
    } else {
      this.keys.delete(code);
      this.keysJustReleased.add(code);
    }
  }

  getJoystickDirection() {
    if (!this._touchJoystick.active) return { x: 0, y: 0 };
    const maxDist = 80;
    return {
      x: this._touchJoystick.dx / maxDist,
      y: this._touchJoystick.dy / maxDist,
    };
  }

  getJoystickState() {
    return this._touchJoystick;
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.removeEventListener('touchstart', this._onTouchStart);
      canvas.removeEventListener('touchmove', this._onTouchMove);
      canvas.removeEventListener('touchend', this._onTouchEnd);
      canvas.removeEventListener('touchcancel', this._onTouchEnd);
    }
  }

  _onKeyDown(e) {
    if (!this.keys.has(e.code)) {
      this.keysJustPressed.add(e.code);
    }
    this.keys.add(e.code);
    e.preventDefault();
  }

  _onKeyUp(e) {
    this.keys.delete(e.code);
    this.keysJustReleased.add(e.code);
    e.preventDefault();
  }

  isDown(code) {
    return this.keys.has(code);
  }

  justPressed(code) {
    return this.keysJustPressed.has(code);
  }

  justReleased(code) {
    return this.keysJustReleased.has(code);
  }

  postUpdate() {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
  }
}

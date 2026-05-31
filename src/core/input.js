export class InputManager {
  constructor() {
    this.keys = new Set();
    this.keysJustPressed = new Set();
    this.keysJustReleased = new Set();
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
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

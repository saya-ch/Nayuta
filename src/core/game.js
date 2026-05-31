export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.running = false;
    this.lastTime = 0;
    this.sceneManager = null;
    this.input = null;
    this._fps = 0;
    this._frameCount = 0;
    this._fpsTime = 0;
  }

  init(sceneManager, inputManager) {
    this.sceneManager = sceneManager;
    this.input = inputManager;
    this.input.init();
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  stop() {
    this.running = false;
  }

  _loop(timestamp) {
    if (!this.running) return;

    const dt = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;

    this._frameCount++;
    this._fpsTime += dt;
    if (this._fpsTime >= 1000) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._fpsTime -= 1000;
    }

    this._update(dt);
    this._render();

    this.input.postUpdate();
    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    if (this.sceneManager) {
      this.sceneManager.update(dt);
    }
  }

  _render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.sceneManager) {
      this.sceneManager.render(this.ctx);
    }
  }

  getFPS() {
    return this._fps;
  }
}

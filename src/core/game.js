export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.lastTime = 0;
    this.sceneManager = null;
    this.input = null;
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
}

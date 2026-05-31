export class Scene {
  constructor(name) {
    this.name = name;
    this.initialized = false;
  }

  init() {
    this.initialized = true;
  }

  update(dt) {}

  render(ctx) {}

  onEnter() {
    if (!this.initialized) {
      this.init();
    }
  }

  onExit() {}
}

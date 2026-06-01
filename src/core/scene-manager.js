import { Scene } from './scene.js';

export class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.currentScene = null;
    this.transitioning = false;
    this.transitionAlpha = 0;
    this.transitionDuration = 500;
    this.transitionElapsed = 0;
    this.pendingScene = null;
    this._preloadedScenes = new Set();
  }

  register(name, scene) {
    this.scenes.set(name, scene);
  }

  switchTo(name) {
    const scene = this.scenes.get(name);
    if (!scene) {
      console.error(`Scene "${name}" not found`);
      return;
    }
    this.pendingScene = scene;
    this.transitioning = true;
    this.transitionAlpha = 0;
    this.transitionElapsed = 0;
  }

  preloadScene(name) {
    const scene = this.scenes.get(name);
    if (!scene || this._preloadedScenes.has(name)) return;
    if (!scene.initialized) {
      scene.init();
    }
    this._preloadedScenes.add(name);
  }

  update(dt) {
    if (this.transitioning) {
      this.transitionElapsed += dt;
      const halfDuration = this.transitionDuration / 2;

      if (this.transitionElapsed < halfDuration) {
        this.transitionAlpha = this.transitionElapsed / halfDuration;
      } else {
        if (this.pendingScene) {
          if (this.currentScene) {
            this.currentScene.onExit();
          }
          this.currentScene = this.pendingScene;
          this.currentScene.onEnter();
          this.pendingScene = null;
        }

        const fadeOutElapsed = this.transitionElapsed - halfDuration;
        this.transitionAlpha = 1 - (fadeOutElapsed / halfDuration);
      }

      if (this.transitionElapsed >= this.transitionDuration) {
        this.transitioning = false;
        this.transitionAlpha = 0;
      }
    }

    if (this.currentScene) {
      this.currentScene.update(dt);
    }
  }

  render(ctx) {
    if (this.currentScene) {
      this.currentScene.render(ctx);
    }

    if (this.transitioning && this.transitionAlpha > 0) {
      ctx.fillStyle = `rgba(10, 14, 26, ${this.transitionAlpha})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }
}

import { Scene } from './scene.js';

export class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.currentScene = null;
    this.transitioning = false;
    this.transitionAlpha = 0;
    this.transitionDuration = 800;
    this.transitionElapsed = 0;
    this.pendingScene = null;
    this._preloadedScenes = new Set();
    this._loadingParticles = [];
    this._loadingTime = 0;
    this._loadingTexts = [
      '深渊在呼吸...',
      '记忆正在沉淀...',
      '维度正在折叠...',
      '时间正在扭曲...',
      '虚空在低语...',
      '现实正在侵蚀...',
      '锚点正在凝聚...',
      '深渊在等待...',
    ];
    this._loadingTextIndex = 0;
    this._loadingTextTimer = 0;
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
    this._loadingTime = 0;
    this._loadingTextTimer = 0;
    this._loadingTextIndex = Math.floor(Math.random() * this._loadingTexts.length);
    this._initLoadingParticles();
  }

  preloadScene(name) {
    const scene = this.scenes.get(name);
    if (!scene || this._preloadedScenes.has(name)) return;
    if (!scene.initialized) {
      scene.init();
    }
    this._preloadedScenes.add(name);
  }

  _initLoadingParticles() {
    this._loadingParticles = [];
    for (let i = 0; i < 40; i++) {
      this._loadingParticles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.0003 + 0.0001,
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }
  }

  update(dt) {
    if (this.transitioning) {
      this.transitionElapsed += dt;
      this._loadingTime += dt;
      this._loadingTextTimer += dt;

      if (this._loadingTextTimer > 1500) {
        this._loadingTextTimer = 0;
        this._loadingTextIndex = (this._loadingTextIndex + 1) % this._loadingTexts.length;
      }

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
      this._renderLoadingScreen(ctx);
    }
  }

  _renderLoadingScreen(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = `rgba(10, 14, 26, ${this.transitionAlpha * 0.95})`;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    for (const p of this._loadingParticles) {
      p.y -= p.speed * 16;
      if (p.y < -0.05) p.y = 1.05;
      const px = p.x * w + Math.sin(this._loadingTime * 0.001 + p.phase) * 15;
      const py = p.y * h;
      const pulse = 0.7 + 0.3 * Math.sin(this._loadingTime * 0.003 + p.phase);

      ctx.beginPath();
      ctx.arc(px, py, p.size * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 212, ${p.alpha * this.transitionAlpha * pulse})`;
      ctx.fill();
    }

    const ringRadius = 25;
    const ringPulse = 1 + 0.1 * Math.sin(this._loadingTime * 0.004);
    const ringAlpha = this.transitionAlpha * 0.6;

    ctx.beginPath();
    ctx.arc(cx, cy - 20, ringRadius * ringPulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 212, ${ringAlpha * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const progress = Math.min(this.transitionElapsed / this.transitionDuration, 1);
    ctx.beginPath();
    ctx.arc(cx, cy - 20, ringRadius * ringPulse, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 212, ${ringAlpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    const coreGlow = ctx.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, ringRadius * 0.6);
    coreGlow.addColorStop(0, `rgba(0, 255, 212, ${0.15 * this.transitionAlpha * ringPulse})`);
    coreGlow.addColorStop(1, `rgba(0, 255, 212, 0)`);
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy - 20, ringRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    const textPulse = 0.6 + 0.4 * Math.sin(this._loadingTime * 0.003);
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(0, 255, 212, ${0.5 * this.transitionAlpha * textPulse})`;
    ctx.fillText(this._loadingTexts[this._loadingTextIndex], cx, cy + 25);

    const dotCount = 3;
    const dotPhase = (this._loadingTime * 0.005) % (Math.PI * 2);
    for (let i = 0; i < dotCount; i++) {
      const dotAngle = dotPhase + (i * Math.PI * 2) / dotCount;
      const dotX = cx + Math.cos(dotAngle) * (ringRadius + 12) * ringPulse;
      const dotY = cy - 20 + Math.sin(dotAngle) * (ringRadius + 12) * ringPulse;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 212, ${0.4 * this.transitionAlpha})`;
      ctx.fill();
    }

    ctx.restore();
  }
}

import { Scene } from '../core/scene.js';
import { COLORS } from '../constants.js';
import { saveSystem } from '../core/save-system.js';

export class MenuScene extends Scene {
  constructor(input, sceneManager, audioSystem) {
    super('menu');
    this.input = input;
    this.sceneManager = sceneManager;
    this.audio = audioSystem;
    this.selectedIndex = 0;
    this.menuItems = ['开始探索', '设置', '关于'];
    this.hasContinue = false;
    this.stars = [];
    this.stardust = [];
    this.time = 0;
    this.titleAlpha = 0;
    this.subtitleAlpha = 0;
    this.menuAlpha = 0;
    this.hintAlpha = 0;
    this.titlePulse = 0;
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.singularityParticles = [];
    this.pulseRings = [];
    this.titleRevealProgress = 0;
    this.menuItemAlphas = [];
    this.floatingRunes = [];
    this.lightStreaks = [];
  }

  init() {
    super.init();
    this._generateStars();
    this._generateStardust();
    this._generateSingularityParticles();
    this._generateFloatingRunes();
    this._generateLightStreaks();
    this._setupMouseTracking();
    this._setupTouchTracking();
  }

  _setupMouseTracking() {
    this._mouseMoveHandler = (e) => {
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
    };
    this._clickHandler = (e) => {
      if (this.menuAlpha < 0.8) return;
      const h = window.innerHeight;
      const startY = h * 0.55;
      const itemHeight = 50;
      const clickY = e.clientY;
      for (let i = 0; i < this.menuItems.length; i++) {
        const itemY = startY + i * itemHeight;
        if (Math.abs(clickY - itemY) < 25) {
          this.selectedIndex = i;
          this._selectItem();
          break;
        }
      }
    };
    window.addEventListener('mousemove', this._mouseMoveHandler);
    window.addEventListener('click', this._clickHandler);
  }

  _setupTouchTracking() {
    this._touchStartHandler = (e) => {
      if (this.menuAlpha < 0.8) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const h = window.innerHeight;
      const startY = h * 0.55;
      const itemHeight = 50;
      const touchY = touch.clientY;
      for (let i = 0; i < this.menuItems.length; i++) {
        const itemY = startY + i * itemHeight;
        if (Math.abs(touchY - itemY) < 30) {
          this.selectedIndex = i;
          if (this.audio) this.audio.playSFX('menuSelect');
          break;
        }
      }
    };
    this._touchEndHandler = (e) => {
      if (this.menuAlpha < 0.8) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const h = window.innerHeight;
      const startY = h * 0.55;
      const itemHeight = 50;
      const touchY = touch.clientY;
      for (let i = 0; i < this.menuItems.length; i++) {
        const itemY = startY + i * itemHeight;
        if (Math.abs(touchY - itemY) < 30) {
          this.selectedIndex = i;
          this._selectItem();
          break;
        }
      }
    };
    window.addEventListener('touchstart', this._touchStartHandler, { passive: true });
    window.addEventListener('touchend', this._touchEndHandler, { passive: true });
  }

  _generateStars() {
    this.stars = [];
    for (let i = 0; i < 300; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 0.3,
        speed: Math.random() * 0.00015 + 0.00003,
        brightness: Math.random() * 0.7 + 0.3,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random(),
      });
    }
  }

  _generateStardust() {
    this.stardust = [];
    for (let i = 0; i < 80; i++) {
      this.stardust.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0001,
        vy: -(Math.random() * 0.0003 + 0.0001),
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.4 + 0.05,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.7 ? 'cyan' : 'white',
      });
    }
  }

  _generateSingularityParticles() {
    this.singularityParticles = [];
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 200;
      this.singularityParticles.push({
        angle,
        dist,
        orbitSpeed: (0.001 + Math.random() * 0.004) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        phase: Math.random() * Math.PI * 2,
        spiralRate: Math.random() * 0.02 + 0.005,
      });
    }
  }

  _generateFloatingRunes() {
    this.floatingRunes = [];
    const symbols = ['◇', '△', '○', '□', '⬡', '✧'];
    for (let i = 0; i < 12; i++) {
      this.floatingRunes.push({
        x: Math.random(),
        y: Math.random(),
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        size: 8 + Math.random() * 12,
        alpha: 0,
        targetAlpha: 0.05 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.00005,
        driftY: (Math.random() - 0.5) * 0.00003,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.001,
        visibleTimer: Math.random() * 8000,
        visible: false,
      });
    }
  }

  _generateLightStreaks() {
    this.lightStreaks = [];
    for (let i = 0; i < 5; i++) {
      this.lightStreaks.push({
        x: Math.random(),
        y: Math.random() * 0.6,
        length: 0.05 + Math.random() * 0.15,
        alpha: 0,
        speed: 0.0001 + Math.random() * 0.0002,
        phase: Math.random() * Math.PI * 2,
        active: false,
        timer: Math.random() * 15000,
      });
    }
  }

  onEnter() {
    super.onEnter();
    this.titleAlpha = 0;
    this.subtitleAlpha = 0;
    this.menuAlpha = 0;
    this.hintAlpha = 0;
    this.selectedIndex = 0;
    this.titleRevealProgress = 0;
    this.menuItemAlphas = [];
    this.pulseRings = [];
    this.hasContinue = saveSystem.hasSave() && saveSystem.getUnlockedDepth() > 0;
    if (this.hasContinue) {
      this.menuItems = ['继续探索', '关卡选择', '记忆图鉴', '重新开始', '关于'];
    } else {
      this.menuItems = ['开始探索', '关于'];
    }
    for (let i = 0; i < this.menuItems.length; i++) {
      this.menuItemAlphas.push(0);
    }
    if (this.audio) {
      this.audio.playBGM(-1);
    }
  }

  onExit() {
    if (this._mouseMoveHandler) {
      window.removeEventListener('mousemove', this._mouseMoveHandler);
    }
    if (this._clickHandler) {
      window.removeEventListener('click', this._clickHandler);
    }
    if (this._touchStartHandler) {
      window.removeEventListener('touchstart', this._touchStartHandler);
    }
    if (this._touchEndHandler) {
      window.removeEventListener('touchend', this._touchEndHandler);
    }
  }

  update(dt) {
    this.time += dt;
    this.titlePulse += dt * 0.002;

    if (this.titleAlpha < 1) {
      this.titleAlpha = Math.min(1, this.titleAlpha + dt * 0.0008);
    }
    if (this.titleAlpha > 0.3) {
      this.titleRevealProgress = Math.min(1, this.titleRevealProgress + dt * 0.0015);
    }
    if (this.titleAlpha > 0.6 && this.subtitleAlpha < 1) {
      this.subtitleAlpha = Math.min(1, this.subtitleAlpha + dt * 0.001);
    }
    if (this.subtitleAlpha > 0.5 && this.menuAlpha < 1) {
      this.menuAlpha = Math.min(1, this.menuAlpha + dt * 0.0012);
    }
    for (let i = 0; i < this.menuItems.length; i++) {
      const delay = i * 300;
      const elapsed = this.time - (this.subtitleAlpha > 0.5 ? (this.subtitleAlpha - 0.5) * 1000 + delay : 0);
      if (elapsed > 0) {
        this.menuItemAlphas[i] = Math.min(1, (this.menuItemAlphas[i] || 0) + dt * 0.002);
      }
    }
    if (this.menuAlpha > 0.8 && this.hintAlpha < 1) {
      this.hintAlpha = Math.min(1, this.hintAlpha + dt * 0.001);
    }

    if (this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW')) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      if (this.audio) this.audio.playSFX('menuSelect');
    }
    if (this.input.justPressed('ArrowDown') || this.input.justPressed('KeyS')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      if (this.audio) this.audio.playSFX('menuSelect');
    }
    if (this.input.justPressed('Enter') || this.input.justPressed('Space')) {
      if (this.audio) this.audio.playSFX('menuConfirm');
      this._selectItem();
    }

    for (const d of this.stardust) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.y < -0.05) {
        d.y = 1.05;
        d.x = Math.random();
      }
    }

    for (const p of this.singularityParticles) {
      p.angle += p.orbitSpeed;
      p.dist -= p.spiralRate;
      if (p.dist < 5) {
        p.dist = 30 + Math.random() * 200;
        p.angle = Math.random() * Math.PI * 2;
      }
    }

    const breathCycle = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
    if (breathCycle > 0.85 && Math.random() < 0.01) {
      this.pulseRings.push({
        radius: 10,
        maxRadius: 300,
        alpha: 0.3,
      });
    }
    for (let i = this.pulseRings.length - 1; i >= 0; i--) {
      const ring = this.pulseRings[i];
      ring.radius += dt * 0.08;
      ring.alpha *= 0.997;
      if (ring.radius > ring.maxRadius || ring.alpha < 0.01) {
        this.pulseRings.splice(i, 1);
      }
    }

    for (const rune of this.floatingRunes) {
      rune.visibleTimer -= dt;
      if (rune.visibleTimer <= 0) {
        rune.visible = !rune.visible;
        rune.visibleTimer = rune.visible ? 3000 + Math.random() * 5000 : 5000 + Math.random() * 10000;
      }
      rune.alpha += ((rune.visible ? rune.targetAlpha : 0) - rune.alpha) * 0.02;
      rune.x += rune.driftX;
      rune.y += rune.driftY;
      rune.rotation += rune.rotSpeed;
      if (rune.x < -0.05) rune.x = 1.05;
      if (rune.x > 1.05) rune.x = -0.05;
      if (rune.y < -0.05) rune.y = 1.05;
      if (rune.y > 1.05) rune.y = -0.05;
    }

    for (const streak of this.lightStreaks) {
      streak.timer -= dt;
      if (streak.timer <= 0) {
        streak.active = !streak.active;
        streak.timer = streak.active ? 800 + Math.random() * 1500 : 8000 + Math.random() * 15000;
        if (streak.active) {
          streak.x = Math.random();
          streak.y = Math.random() * 0.6;
        }
      }
      if (streak.active) {
        streak.alpha = Math.min(0.15, streak.alpha + dt * 0.0005);
        streak.x += streak.speed;
      } else {
        streak.alpha *= 0.95;
      }
    }
  }

  _selectItem() {
    if (this.hasContinue) {
      switch (this.selectedIndex) {
        case 0:
          this.sceneManager.preloadScene('game');
          this.sceneManager.switchTo('game');
          break;
        case 1:
          this.sceneManager.switchTo('levelSelect');
          break;
        case 2:
          this.sceneManager.switchTo('codex');
          break;
        case 3:
          saveSystem.clearSave();
          this.sceneManager.preloadScene('game');
          this.sceneManager.switchTo('game');
          break;
        case 4:
          this.sceneManager.switchTo('about');
          break;
      }
    } else {
      switch (this.selectedIndex) {
        case 0:
          this.sceneManager.preloadScene('game');
          this.sceneManager.switchTo('game');
          break;
        case 1:
          this.sceneManager.switchTo('about');
          break;
      }
    }
  }

  render(ctx) {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1);
    const h = ctx.canvas.height / (window.devicePixelRatio || 1);

    ctx.fillStyle = COLORS.ABYSS_BLUE;
    ctx.fillRect(0, 0, w, h);

    this._renderDepthGradient(ctx, w, h);
    this._renderStars(ctx, w, h);
    this._renderNebula(ctx, w, h);
    this._renderLightStreaks(ctx, w, h);
    this._renderFloatingRunes(ctx, w, h);
    this._renderStardust(ctx, w, h);
    this._renderAbyssGlow(ctx, w, h);
    this._renderSingularity(ctx, w, h);
    this._renderPulseRings(ctx, w, h);
    this._renderTitle(ctx, w, h);
    this._renderMenu(ctx, w, h);
    this._renderHint(ctx, w, h);
    this._renderScanLines(ctx, w, h);
  }

  _renderDepthGradient(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0A0E1A');
    gradient.addColorStop(0.4, '#0F1528');
    gradient.addColorStop(0.7, '#1A1035');
    gradient.addColorStop(1, '#0A0812');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _renderStars(ctx, w, h) {
    const parallaxX = (this.mouseX - 0.5) * 10;
    const parallaxY = (this.mouseY - 0.5) * 10;

    ctx.fillStyle = 'rgba(232, 230, 240, 1)';
    for (const star of this.stars) {
      star.y -= star.speed * 16;
      if (star.y < -0.02) star.y += 1.04;

      const twinkle = 0.4 + 0.6 * Math.sin(this.time * 0.002 + star.phase);
      const alpha = star.brightness * twinkle;
      const px = parallaxX * star.depth;
      const py = parallaxY * star.depth;
      const sx = star.x * w + px;
      const sy = star.y * h + py;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(0, 255, 212, 1)';
    for (const star of this.stars) {
      if (star.size <= 1.2 || star.brightness <= 0.6) continue;
      const twinkle = 0.4 + 0.6 * Math.sin(this.time * 0.002 + star.phase);
      const alpha = star.brightness * twinkle;
      const px = parallaxX * star.depth;
      const py = parallaxY * star.depth;
      const sx = star.x * w + px;
      const sy = star.y * h + py;

      ctx.globalAlpha = alpha * 0.1;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _renderNebula(ctx, w, h) {
    const breathCycle = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
    const nebulaAlpha = 0.3 + breathCycle * 0.15;

    const cx = w * 0.5;
    const cy = h * 0.25;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.45);
    gradient.addColorStop(0, `rgba(26, 16, 53, ${nebulaAlpha})`);
    gradient.addColorStop(0.4, `rgba(26, 16, 53, ${nebulaAlpha * 0.4})`);
    gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const cx2 = w * 0.65;
    const cy2 = h * 0.5;
    const gradient2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, w * 0.25);
    gradient2.addColorStop(0, `rgba(0, 255, 212, ${0.02 + breathCycle * 0.01})`);
    gradient2.addColorStop(0.5, `rgba(0, 136, 255, ${0.01 + breathCycle * 0.005})`);
    gradient2.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, w, h);

    const cx3 = w * 0.3;
    const cy3 = h * 0.7;
    const gradient3 = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, w * 0.2);
    gradient3.addColorStop(0, `rgba(255, 107, 53, ${0.015 + breathCycle * 0.008})`);
    gradient3.addColorStop(0.5, `rgba(255, 0, 68, ${0.008})`);
    gradient3.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient3;
    ctx.fillRect(0, 0, w, h);
  }

  _renderStardust(ctx, w, h) {
    for (const d of this.stardust) {
      const sx = d.x * w;
      const sy = d.y * h;
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 0.003 + d.phase);
      const alpha = d.alpha * twinkle;

      if (d.hue === 'cyan') {
        ctx.fillStyle = 'rgba(0, 255, 212, 1)';
        ctx.globalAlpha = alpha;
      } else {
        ctx.fillStyle = 'rgba(232, 230, 240, 1)';
        ctx.globalAlpha = alpha * 0.6;
      }

      ctx.beginPath();
      ctx.arc(sx, sy, d.size, 0, Math.PI * 2);
      ctx.fill();

      if (d.size > 2 && d.hue === 'cyan') {
        ctx.globalAlpha = alpha * 0.1;
        ctx.beginPath();
        ctx.arc(sx, sy, d.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  _renderAbyssGlow(ctx, w, h) {
    const breathCycle = Math.sin(this.time * 0.0006) * 0.5 + 0.5;
    const cx = w * 0.5;
    const cy = h * 0.85;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    gradient.addColorStop(0, `rgba(0, 255, 212, ${0.02 + breathCycle * 0.015})`);
    gradient.addColorStop(0.3, `rgba(0, 136, 255, ${0.01 + breathCycle * 0.008})`);
    gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _renderTitle(ctx, w, h) {
    ctx.save();

    const pulse = Math.sin(this.titlePulse) * 0.15 + 0.85;
    const titleY = h * 0.28;

    ctx.globalAlpha = this.titleAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const titleText = 'NAYUTA';
    ctx.font = '600 80px "Segoe UI", system-ui, sans-serif';
    const titleWidth = ctx.measureText(titleText).width;
    const charWidth = titleWidth / titleText.length;
    const startX = w / 2 - titleWidth / 2;

    for (let i = 0; i < titleText.length; i++) {
      const charProgress = Math.min(1, Math.max(0, this.titleRevealProgress * titleText.length - i));
      if (charProgress <= 0) continue;

      const charX = startX + i * charWidth + charWidth / 2;
      const charOffsetY = (1 - charProgress) * 20;
      const charAlpha = charProgress;
      const charScale = 0.8 + charProgress * 0.2;

      ctx.save();
      ctx.translate(charX, titleY + charOffsetY);
      ctx.scale(charScale, charScale);
      ctx.globalAlpha = this.titleAlpha * charAlpha;

      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 40 * pulse * charProgress;
      ctx.fillStyle = `rgba(232, 230, 240, ${0.95 * pulse})`;
      ctx.fillText(titleText[i], 0, 0);

      ctx.shadowBlur = 80 * pulse * charProgress;
      ctx.fillStyle = `rgba(0, 255, 212, ${0.15 * pulse})`;
      ctx.fillText(titleText[i], 0, 0);

      ctx.restore();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = this.subtitleAlpha;
    ctx.font = '300 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.letterSpacing = '8px';
    ctx.fillText('那 由 他 之 梦', w / 2, titleY + 55);

    const lineProgress = Math.min(1, this.titleRevealProgress * 1.5);
    if (lineProgress > 0) {
      ctx.globalAlpha = this.subtitleAlpha * 0.3 * lineProgress;
      ctx.strokeStyle = COLORS.FLUORESCENT_CYAN;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const lineW = 180 * lineProgress;
      ctx.moveTo(w / 2 - lineW / 2, titleY + 75);
      ctx.lineTo(w / 2 + lineW / 2, titleY + 75);
      ctx.stroke();
    }

    ctx.restore();
  }

  _renderMenu(ctx, w, h) {
    ctx.save();

    const startY = h * 0.55;
    const itemHeight = 52;

    for (let i = 0; i < this.menuItems.length; i++) {
      const y = startY + i * itemHeight;
      const isSelected = i === this.selectedIndex;
      const itemAlpha = this.menuItemAlphas[i] || 0;
      if (itemAlpha <= 0) continue;

      const hoverOffset = isSelected ? Math.sin(this.time * 0.003) * 2 : 0;

      ctx.globalAlpha = this.menuAlpha * itemAlpha;

      if (isSelected) {
        const glowPulse = Math.sin(this.time * 0.004) * 0.3 + 0.7;
        const glow = ctx.createRadialGradient(w / 2, y + hoverOffset, 0, w / 2, y + hoverOffset, 120);
        glow.addColorStop(0, `rgba(0, 255, 212, ${0.04 * glowPulse})`);
        glow.addColorStop(0.5, `rgba(0, 136, 255, ${0.015 * glowPulse})`);
        glow.addColorStop(1, 'rgba(0, 255, 212, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(w / 2 - 150, y + hoverOffset - 30, 300, 60);

        ctx.beginPath();
        ctx.arc(w / 2 - 80, y + hoverOffset, 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
        ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(w / 2 - 80, y + hoverOffset, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 212, 0.1)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(w / 2 + 80, y + hoverOffset, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 212, ${0.3 * glowPulse})`;
        ctx.fill();

        ctx.font = '400 22px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
        ctx.shadowBlur = 8 * glowPulse;
        ctx.fillText(this.menuItems[i], w / 2, y + hoverOffset);
        ctx.shadowBlur = 0;
      } else {
        ctx.font = '400 18px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = COLORS.STARDUST_GRAY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.menuItems[i], w / 2, y);
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _renderHint(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.hintAlpha * (0.4 + 0.3 * Math.sin(this.time * 0.002));
    ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↑↓ 选择  ·  Enter 确认  ·  触控点击', w / 2, h * 0.88);
    ctx.restore();

    if (this.hasContinue) {
      const data = saveSystem.getData();
      ctx.save();
      ctx.globalAlpha = this.hintAlpha * 0.4;
      ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.STARDUST_GRAY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const depthText = `已解锁深度 ${data.unlockedDepth + 1}/4`;
      const timeText = `游玩时间 ${saveSystem.formatPlayTime(data.playTime || 0)}`;
      ctx.fillText(`${depthText}  ·  ${timeText}`, w / 2, h * 0.93);
      ctx.restore();
    }
  }

  _renderSingularity(ctx, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.85;
    const breathCycle = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
    const pulseR = 15 + breathCycle * 25;

    for (let layer = 2; layer >= 0; layer--) {
      const r = pulseR * (1 + layer * 0.6);
      const alpha = (0.02 + breathCycle * 0.03) * (1 - layer * 0.25);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 212, ${alpha})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 5 + breathCycle * 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 212, ${0.3 + breathCycle * 0.4})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 2 + breathCycle * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + breathCycle * 0.3})`;
    ctx.fill();

    for (const p of this.singularityParticles) {
      const px = cx + Math.cos(p.angle) * p.dist;
      const py = cy + Math.sin(p.angle) * p.dist;
      const distRatio = p.dist / 230;
      const cr = Math.floor(0 + (1 - distRatio) * 255);
      const cg = Math.floor(255 * distRatio + 107 * (1 - distRatio));
      const cb = Math.floor(212 * distRatio + 53 * (1 - distRatio));
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * 0.003 + p.phase);
      ctx.globalAlpha = p.alpha * twinkle * (0.3 + breathCycle * 0.4);
      ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _renderPulseRings(ctx, w, h) {
    const cx = w * 0.5;
    const cy = h * 0.85;
    for (const ring of this.pulseRings) {
      const progress = ring.radius / ring.maxRadius;
      const cr = Math.floor(0 + progress * 255);
      const cg = Math.floor(255 * (1 - progress) + 107 * progress);
      const cb = Math.floor(212 * (1 - progress) + 53 * progress);
      ctx.beginPath();
      ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${ring.alpha})`;
      ctx.lineWidth = 1.5 * (1 - progress * 0.5);
      ctx.stroke();
    }
  }

  _renderFloatingRunes(ctx, w, h) {
    for (const rune of this.floatingRunes) {
      if (rune.alpha < 0.005) continue;
      ctx.save();
      ctx.globalAlpha = rune.alpha;
      ctx.translate(rune.x * w, rune.y * h);
      ctx.rotate(rune.rotation);
      ctx.font = `${rune.size}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rune.symbol, 0, 0);
      ctx.restore();
    }
  }

  _renderLightStreaks(ctx, w, h) {
    for (const streak of this.lightStreaks) {
      if (streak.alpha < 0.005) continue;
      const sx = streak.x * w;
      const sy = streak.y * h;
      const len = streak.length * w;
      const gradient = ctx.createLinearGradient(sx, sy, sx + len, sy);
      gradient.addColorStop(0, `rgba(0, 255, 212, 0)`);
      gradient.addColorStop(0.3, `rgba(0, 255, 212, ${streak.alpha})`);
      gradient.addColorStop(0.7, `rgba(0, 136, 255, ${streak.alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(0, 255, 212, 0)`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + len, sy);
      ctx.stroke();
    }
  }

  _renderScanLines(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.015;
    ctx.fillStyle = 'rgba(10, 14, 26, 1)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
  }
}

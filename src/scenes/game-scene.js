import { Scene } from '../core/scene.js';
import { COLORS, DEPTH_COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { PuzzleManager } from '../core/puzzle-manager.js';
import { LevelData } from '../core/level-data.js';
import { NarrativeSystem } from '../core/narrative-system.js';
import { HintSystem } from '../core/hint-system.js';
import { resourceManager } from '../core/resource-manager.js';
import { saveSystem } from '../core/save-system.js';
import { Camera } from '../core/camera.js';

export class GameScene extends Scene {
  constructor(input, sceneManager, audioSystem) {
    super('game');
    this.input = input;
    this.sceneManager = sceneManager;
    this.audio = audioSystem;
    this.player = { x: 100, y: 300, vx: 0, vy: 0, onGround: false, facing: 1 };
    this.coyoteTimer = 0;
    this.coyoteDuration = 120;
    this.jumpBufferTimer = 0;
    this.jumpBufferDuration = 150;
    this.isJumping = false;
    this.jumpCutMultiplier = 0.45;
    this.wasOnGround = false;
    this.landingParticles = [];
    this.landingImpactTimer = 0;
    this.anchors = [];
    this.anchorCount = 0;
    this.depth = 0;
    this.particles = [];
    this.levelStars = [];
    this.time = 0;
    this.erosionLevel = 0;
    this.puzzleManager = new PuzzleManager();
    this.narrativeSystem = new NarrativeSystem();
    this.hintSystem = new HintSystem();
    this.platforms = [];
    this.decorations = [];
    this.currentLevel = null;
    this.interactHint = '';
    this.interactHintAlpha = 0;
    this.levelComplete = false;
    this.levelCompleteAlpha = 0;
    this.transitioning = false;
    this.transitionAlpha = 0;
    this.levelIntroAlpha = 0;
    this.levelIntroTimer = 0;
    this.showingLevelIntro = false;
    this.transitionPhase = 0;
    this.transitionProgress = 0;
    this.nextDepth = 0;
    this.fallStreaks = [];
    this.vignetteRadius = 1;
    this.playerTrail = [];
    this.erosionTime = 0;
    this.scanLines = [];
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.colorShiftAmount = 0;
    this.glitchTimer = 0;
    this.glitchBurst = false;
    this.glitchBurstTimer = 0;
    this.realityCracks = [];
    this._bgGradientCache = null;
    this._bgGradientKey = '';
    this._nebulaCache = null;
    this._nebulaCacheKey = -1;
    this._scanLineImage = null;
    this._scanLineDirty = true;
    this.dying = false;
    this.respawning = false;
    this.deathTimer = 0;
    this.respawnTimer = 0;
    this.deathParticles = [];
    this.respawnParticles = [];
    this.deathTendrils = [];
    this.deathAlpha = 0;
    this.respawnAlpha = 0;
    this.deathCount = 0;
    this.playerDissolveProgress = 0;
    this.respawnGlowRadius = 0;
    this.respawnFlashAlpha = 0;
    this.movingPlatforms = [];
    this.portals = [];
    this.portalCooldown = 0;
    this.portalParticles = [];
    this.waterReflectionTime = 0;
    this.camera = new Camera();
  }

  init() {
    super.init();
  }

  onEnter() {
    super.onEnter();
    const saveData = saveSystem.load();
    if (saveData && saveData.currentDepth > 0 && saveData.unlockedDepth >= saveData.currentDepth) {
      this.depth = saveData.currentDepth;
    }
    this.deathCount = saveSystem.getDeathCount();
    this.hintSystem.loadFromSave(saveData);
    this._loadLevel(this.depth);
    if (this.audio) {
      this.audio.playBGM(this.depth);
      this.audio.playAmbient(this.depth);
    }
    LevelData.preloadAdjacentLevels(this.depth);
    this._preloadNextLevelResources();
    this._playTimeAccum = 0;
  }

  _preloadNextLevelResources() {
    const nextDepth = this.depth + 1;
    if (nextDepth < 4) {
      const nextLevel = LevelData.getLevel(nextDepth);
      resourceManager.set(`level_${nextDepth}_data`, nextLevel);
    }
  }

  _loadLevel(depthIndex) {
    this._releaseLevelResources();

    const level = resourceManager.get(`level_${depthIndex}_data`) || LevelData.getLevel(depthIndex);
    this.currentLevel = level;
    this.platforms = level.platforms;
    this.decorations = level.decorations || [];

    this.movingPlatforms = [];
    for (const mp of (level.movingPlatforms || [])) {
      this.movingPlatforms.push({
        originX: mp.x,
        originY: mp.y,
        x: mp.x,
        y: mp.y,
        w: mp.w,
        h: mp.h,
        moveType: mp.moveType,
        range: mp.range,
        speed: mp.speed,
        phase: Math.random() * Math.PI * 2,
        prevX: mp.x,
        prevY: mp.y,
      });
    }

    this.portals = [];
    for (const p of (level.portals || [])) {
      this.portals.push({
        x: p.x,
        y: p.y,
        id: p.id,
        pairedId: p.pairedId,
        pulse: Math.random() * Math.PI * 2,
        particles: [],
      });
    }
    this.portalCooldown = 0;
    this.portalParticles = [];

    this.player.x = level.playerStart.x;
    this.player.y = level.playerStart.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onGround = false;
    this.player.facing = 1;

    this.anchors = [];
    for (const pos of level.anchors) {
      this.anchors.push({
        x: pos.x,
        y: pos.y,
        collected: false,
        pulse: Math.random() * Math.PI * 2,
        size: 12,
      });
    }
    this.anchorCount = 0;

    this.puzzleManager.clear();
    for (const pe of level.puzzleElements) {
      this.puzzleManager.addElement(pe.x, pe.y, pe.type, pe.config || {});
    }
    this.puzzleManager.onSolve = () => {
      this.levelComplete = true;
      if (this.audio) this.audio.playSFX('levelComplete');
    };

    this.narrativeSystem.loadLevelNarrative(depthIndex);
    this.hintSystem.reset();

    this._generateParticles(level);
    this._generateStars(level);

    this.levelComplete = false;
    this.levelCompleteAlpha = 0;
    this.erosionLevel = 0;
    this.interactHint = '';
    this.interactHintAlpha = 0;
    this.dying = false;
    this.respawning = false;
    this.deathTimer = 0;
    this.respawnTimer = 0;
    this.deathAlpha = 0;
    this.respawnAlpha = 0;
    this.playerDissolveProgress = 0;
    this.respawnGlowRadius = 0;
    this.respawnFlashAlpha = 0;
    this.deathParticles = [];
    this.respawnParticles = [];
    this.deathTendrils = [];

    this.showingLevelIntro = true;
    this.levelIntroAlpha = 0;
    this.levelIntroTimer = 0;
    this.playerTrail = [];
    this.erosionTime = 0;
    this.scanLines = [];
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.colorShiftAmount = 0;
    this.glitchTimer = 8000 + Math.random() * 7000;
    this.glitchBurst = false;
    this.glitchBurstTimer = 0;
    this.realityCracks = [];
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isJumping = false;
    this.wasOnGround = false;
    this.landingParticles = [];
    this.landingImpactTimer = 0;
    this._initScanLines();
    this._initRealityCracks();

    const levelW = level.width || GAME_WIDTH;
    const levelH = level.height || GAME_HEIGHT;
    this.camera.setViewport(GAME_WIDTH, GAME_HEIGHT);
    this.camera.setBounds(0, 0, levelW, levelH);
    this.camera.reset(level.playerStart.x, level.playerStart.y - 40);
  }

  _releaseLevelResources() {
    if (this.depth > 0) {
      resourceManager.releasePattern(`level_${this.depth - 1}_`);
    }
    this.particles = [];
    this.levelStars = [];
    this.playerTrail = [];
    this.fallStreaks = [];
    this.realityCracks = [];
    this.scanLines = [];
    this.movingPlatforms = [];
    this.portals = [];
    this.portalParticles = [];
  }

  _generateParticles(level) {
    this.particles = [];
    const count = level.ambientParticleCount || 40;
    const lw = level.width || 1280;
    const lh = level.height || 720;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * lw,
        y: Math.random() * lh,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.1,
        isCyan: Math.random() > 0.6,
        colorType: 'default',
      });
    }
    this._assignParticleColors();
  }

  _assignParticleColors() {
    for (const p of this.particles) {
      if (this.depth >= 2 && Math.random() < 0.3) {
        p.colorType = 'orange';
      } else if (this.depth >= 1 && Math.random() < 0.35) {
        p.colorType = 'purple';
      } else {
        p.colorType = 'default';
      }
    }
  }

  _generateStars(level) {
    this.levelStars = [];
    const count = level.starCount || 100;
    const lw = level.width || 1280;
    for (let i = 0; i < count; i++) {
      this.levelStars.push({
        x: Math.random() * lw,
        y: Math.random() * 500,
        size: Math.random() * 1.5 + 0.3,
        brightness: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  _generateFallStreaks() {
    this.fallStreaks = [];
    const lw = this.currentLevel ? (this.currentLevel.width || 1280) : 1280;
    const lh = this.currentLevel ? (this.currentLevel.height || 720) : 720;
    for (let i = 0; i < 60; i++) {
      this.fallStreaks.push({
        x: Math.random() * lw,
        y: Math.random() * lh,
        speed: Math.random() * 400 + 200,
        length: Math.random() * 60 + 20,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }
  }

  update(dt) {
    this.time += dt;
    this.waterReflectionTime += dt / 1000;
    const dtSec = dt / 1000;

    this._playTimeAccum = (this._playTimeAccum || 0) + dt;
    if (this._playTimeAccum >= 5000) {
      saveSystem.addPlayTime(this._playTimeAccum);
      saveSystem.saveShownHints(this.hintSystem.getShownHints());
      this._playTimeAccum = 0;
    }

    if (this.transitioning) {
      this._updateTransition(dt);
      return;
    }

    if (this.dying) {
      this._updateDeath(dt);
      return;
    }

    if (this.respawning) {
      this._updateRespawn(dt);
      return;
    }

    if (this._fadingIn) {
      this.transitionAlpha -= dt * 0.004;
      if (this.transitionAlpha <= 0) {
        this.transitionAlpha = 0;
        this._fadingIn = false;
      }
      return;
    }

    if (this.showingLevelIntro) {
      this._updateLevelIntro(dt);
    }

    if (this.levelComplete) {
      this.levelCompleteAlpha = Math.min(1, this.levelCompleteAlpha + dt * 0.001);
      if (this.levelCompleteAlpha >= 1 && this.input.justPressed('Enter')) {
        saveSystem.saveLevelProgress(this.depth, this.anchorCount, this.anchors.length, true);
        this.depth++;
        if (this.depth >= 4) {
          saveSystem.saveCurrentDepth(0);
          this.depth = 0;
          this.sceneManager.switchTo('ending');
          return;
        }
        saveSystem.saveCurrentDepth(this.depth);
        this.transitioning = true;
        this.transitionPhase = 1;
        this.transitionProgress = 0;
        this.transitionAlpha = 0;
        this.nextDepth = this.depth;
        this.vignetteRadius = 1;
        this.levelComplete = false;
        this.levelCompleteAlpha = 0;
        this._generateFallStreaks();
      }
      return;
    }

    const speed = 200;
    const gravity = 800;
    const jumpForce = -400;

    this.wasOnGround = this.player.onGround;

    if (this.player.onGround) {
      this.coyoteTimer = this.coyoteDuration;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    const jumpPressed = this.input.justPressed('ArrowUp') || this.input.justPressed('KeyW') || this.input.justPressed('Space');
    if (jumpPressed) {
      this.jumpBufferTimer = this.jumpBufferDuration;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    const jumpReleased = this.input.justReleased('ArrowUp') || this.input.justReleased('KeyW') || this.input.justReleased('Space');

    if (this.isJumping && jumpReleased && this.player.vy < 0) {
      this.player.vy *= this.jumpCutMultiplier;
      this.isJumping = false;
    }

    if (this.input.isMobile() && this.input.getJoystickState().active) {
      const dir = this.input.getJoystickDirection();
      if (Math.abs(dir.x) > 0.2) {
        this.player.vx = dir.x * speed;
        this.player.facing = dir.x > 0 ? 1 : -1;
      } else {
        this.player.vx *= 0.85;
      }
    } else if (this.input.isDown('ArrowLeft') || this.input.isDown('KeyA')) {
      this.player.vx = -speed;
      this.player.facing = -1;
    } else if (this.input.isDown('ArrowRight') || this.input.isDown('KeyD')) {
      this.player.vx = speed;
      this.player.facing = 1;
    } else {
      this.player.vx *= 0.85;
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isJumping) {
      this.player.vy = jumpForce;
      this.player.onGround = false;
      this.isJumping = true;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      if (this.audio) this.audio.playSFX('jump');
    }

    if (this.input.justPressed('KeyE')) {
      const interacted = this.puzzleManager.tryInteract(this.player.x, this.player.y);
      if (interacted && this.audio) this.audio.playSFX('switchToggle');
    }

    this.player.vy += gravity * dtSec;
    this.player.x += this.player.vx * dtSec;
    this.player.y += this.player.vy * dtSec;

    this.player.onGround = false;
    const playerW = 16;
    const playerH = 48;

    for (const plat of this.platforms) {
      if (this._checkPlatformCollision(plat, playerW, playerH)) {
        this._resolvePlatformCollision(plat, playerW, playerH);
      }
    }

    for (const door of this.puzzleManager.getCollidableElements()) {
      const bounds = door.getBounds();
      const plat = { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height };
      if (this._checkPlatformCollision(plat, playerW, playerH)) {
        this._resolvePlatformCollision(plat, playerW, playerH);
      }
    }

    this._updateMovingPlatforms(dt);

    for (const mp of this.movingPlatforms) {
      if (this._checkPlatformCollision(mp, playerW, playerH)) {
        this._resolvePlatformCollision(mp, playerW, playerH);
        if (this.player.onGround) {
          this.player.x += mp.x - mp.prevX;
          this.player.y += mp.y - mp.prevY;
        }
      }
    }

    if (this.player.onGround && !this.wasOnGround && this.isJumping) {
      this.isJumping = false;
      this._spawnLandingParticles();
    }
    if (this.player.onGround && this.player.vy >= 0) {
      this.isJumping = false;
    }

    this._updateLandingParticles(dt);

    this._updatePortals(dt, playerW, playerH);

    this.player.x = Math.max(20, Math.min(1260, this.player.x));

    this.camera.follow(this.player.x, this.player.y - 24, this.player.facing);
    this.camera.update(dt);

    const deathY = (this.currentLevel ? (this.currentLevel.height || 720) : 720) + 50;
    if (this.player.y > deathY && !this.dying && !this.respawning) {
      this._triggerDeath();
    }

    if (this.depth >= 1) {
      this.playerTrail.push({ x: this.player.x, y: this.player.y, facing: this.player.facing, alpha: 0.4 });
      if (this.playerTrail.length > 8) {
        this.playerTrail.shift();
      }
      for (let i = 0; i < this.playerTrail.length; i++) {
        this.playerTrail[i].alpha *= 0.88;
      }
    }

    for (const anchor of this.anchors) {
      if (anchor.collected) continue;
      const dx = this.player.x - anchor.x;
      const dy = (this.player.y - 24) - anchor.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        anchor.collected = true;
        this.anchorCount++;
        if (this.audio) this.audio.playSFX('anchorCollect');
        saveSystem.saveLevelProgress(this.depth, this.anchorCount, this.anchors.length, false);
      }
    }

    const lw = this.currentLevel ? (this.currentLevel.width || 1280) : 1280;
    const lh = this.currentLevel ? (this.currentLevel.height || 720) : 720;
    for (const p of this.particles) {
      let vxMod = p.vx;
      let vyMod = p.vy;

      if (this.depth >= 3) {
        vxMod += (Math.random() - 0.5) * 2;
        vyMod += (Math.random() - 0.5) * 2;
      }

      p.x += vxMod;
      p.y += vyMod;
      if (p.y < -10) {
        p.y = lh + 10;
        p.x = Math.random() * lw;
      }
      if (p.x < -10) p.x = lw + 10;
      if (p.x > lw + 10) p.x = -10;
    }

    this.erosionLevel = this.anchorCount / Math.max(1, this.anchors.length);

    this.erosionTime += dt;
    this.colorShiftAmount = this.depth * 0.25 + this.erosionLevel * 0.15;

    if (this.depth >= 2) {
      this.glitchTimer -= dt;
      if (this.glitchTimer <= 0) {
        this.glitchBurst = true;
        this.glitchBurstTimer = 200;
        this.glitchTimer = 8000 + Math.random() * 7000;
        if (this.audio) this.audio.playSFX('erosionGlitch');
      }
    }

    if (this.glitchBurst) {
      this.glitchBurstTimer -= dt;
      if (this.glitchBurstTimer <= 0) {
        this.glitchBurst = false;
      }
    }

    if (this.depth >= 2) {
      const shakeChance = this.depth >= 3 ? 0.03 : 0.01;
      if (Math.random() < shakeChance) {
        const maxIntensity = this.depth >= 3 ? 5 : 2;
        this.screenShake.intensity = Math.random() * maxIntensity + 1;
      }
    }

    if (this.screenShake.intensity > 0) {
      this.screenShake.x = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * 2 * this.screenShake.intensity;
      this.screenShake.intensity *= 0.9;
      if (this.screenShake.intensity < 0.3) {
        this.screenShake.intensity = 0;
        this.screenShake.x = 0;
        this.screenShake.y = 0;
      }
    }

    this._updateRealityCracks(dt);

    this.puzzleManager.update(dt, this.player.x, this.player.y - 24, this.player.onGround);

    this.narrativeSystem.update(dt, this.player.x, this.player.y - 24, this.anchorCount, this.anchors.length);

    this._updateInteractHint();

    let anchorNearby = false;
    for (const anchor of this.anchors) {
      if (anchor.collected) continue;
      const dx = this.player.x - anchor.x;
      const dy = (this.player.y - 24) - anchor.y;
      if (Math.sqrt(dx * dx + dy * dy) < 60) {
        anchorNearby = true;
        break;
      }
    }

    let portalNearby = false;
    for (const portal of this.portals) {
      const dx = this.player.x - portal.x;
      const dy = (this.player.y - 24) - portal.y;
      if (Math.sqrt(dx * dx + dy * dy) < 50) {
        portalNearby = true;
        break;
      }
    }

    let movingPlatformNearby = false;
    for (const mp of this.movingPlatforms) {
      const dx = this.player.x - (mp.x + mp.w / 2);
      const dy = (this.player.y - 24) - (mp.y + mp.h / 2);
      if (Math.sqrt(dx * dx + dy * dy) < 80) {
        movingPlatformNearby = true;
        break;
      }
    }

    this.hintSystem.checkTriggers(
      this.player.x, this.player.y - 24,
      this.input, this.anchorCount,
      anchorNearby, portalNearby, movingPlatformNearby,
      this.player.onGround
    );
    this.hintSystem.update(dt, this.player.x, this.player.y);

    if (this.input.justPressed('Escape') && !this.dying && !this.respawning) {
      this.sceneManager.switchTo('pause');
    }
  }

  _updateTransition(dt) {
    this.transitionProgress += dt * 0.0008;

    if (this.transitionProgress <= 0.3) {
      this.transitionPhase = 1;
      const t = this.transitionProgress / 0.3;
      this.vignetteRadius = 1 - t * 0.9;
      this.transitionAlpha = t * 0.6;
      for (const p of this.particles) {
        p.vy += 0.5;
      }
    } else if (this.transitionProgress <= 0.7) {
      this.transitionPhase = 2;
      const t = (this.transitionProgress - 0.3) / 0.4;
      this.transitionAlpha = 1;
      this.vignetteRadius = 0.1;
      if (!this._bgmCrossfaded) {
        this._bgmCrossfaded = true;
        if (this.audio) {
          this.audio.playBGM(this.nextDepth);
          this.audio.playAmbient(this.nextDepth);
        }
      }
      for (const s of this.fallStreaks) {
        s.y -= s.speed * (dt / 1000);
        const lh = this.currentLevel ? (this.currentLevel.height || 720) : 720;
        if (s.y + s.length < 0) {
          s.y = lh + Math.random() * 100;
          s.x = Math.random() * (this.currentLevel ? (this.currentLevel.width || 1280) : 1280);
        }
      }
    } else if (this.transitionProgress <= 1.0) {
      this.transitionPhase = 3;
      const t = (this.transitionProgress - 0.7) / 0.3;
      if (this.transitionPhase === 3 && !this._levelLoaded) {
        this.depth = this.nextDepth;
        this._loadLevel(this.depth);
        this._levelLoaded = true;
      }
      this.transitionAlpha = 1 - t;
      this.vignetteRadius = 0.1 + t * 0.9;
    } else {
      this.transitioning = false;
      this.transitionAlpha = 0;
      this.transitionPhase = 0;
      this.transitionProgress = 0;
      this.vignetteRadius = 1;
      this._levelLoaded = false;
      this._bgmCrossfaded = false;
    }
  }

  _updateLevelIntro(dt) {
    this.levelIntroTimer += dt;

    if (this.levelIntroTimer < 600) {
      this.levelIntroAlpha = this.levelIntroTimer / 600;
    } else if (this.levelIntroTimer < 2400) {
      this.levelIntroAlpha = 1;
    } else if (this.levelIntroTimer < 3000) {
      this.levelIntroAlpha = 1 - (this.levelIntroTimer - 2400) / 600;
    } else {
      this.levelIntroAlpha = 0;
      this.showingLevelIntro = false;
    }
  }

  _fadeBackIn() {
    this._fadingIn = true;
  }

  _checkPlatformCollision(plat, playerW, playerH) {
    const px = this.player.x - playerW / 2;
    const py = this.player.y - playerH;
    return px + playerW > plat.x &&
           px < plat.x + plat.w &&
           py + playerH > plat.y &&
           py < plat.y + plat.h;
  }

  _resolvePlatformCollision(plat, playerW, playerH) {
    const px = this.player.x - playerW / 2;
    const py = this.player.y - playerH;

    const overlapLeft = (px + playerW) - plat.x;
    const overlapRight = (plat.x + plat.w) - px;
    const overlapTop = (py + playerH) - plat.y;
    const overlapBottom = (plat.y + plat.h) - py;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapTop && this.player.vy >= 0) {
      this.player.y = plat.y;
      this.player.vy = 0;
      this.player.onGround = true;
    } else if (minOverlap === overlapBottom && this.player.vy < 0) {
      this.player.y = plat.y + plat.h + playerH;
      this.player.vy = 0;
    } else if (minOverlap === overlapLeft) {
      this.player.x = plat.x - playerW / 2;
      this.player.vx = 0;
    } else if (minOverlap === overlapRight) {
      this.player.x = plat.x + plat.w + playerW / 2;
      this.player.vx = 0;
    }
  }

  _updateMovingPlatforms(dt) {
    const dtSec = dt / 1000;
    for (const mp of this.movingPlatforms) {
      mp.prevX = mp.x;
      mp.prevY = mp.y;
      mp.phase += mp.speed * dtSec;

      switch (mp.moveType) {
        case 'horizontal':
          mp.x = mp.originX + Math.sin(mp.phase) * mp.range;
          break;
        case 'vertical':
          mp.y = mp.originY + Math.sin(mp.phase) * mp.range;
          break;
        case 'circular':
          mp.x = mp.originX + Math.cos(mp.phase) * mp.range;
          mp.y = mp.originY + Math.sin(mp.phase) * mp.range * 0.6;
          break;
      }
    }
  }

  _updatePortals(dt, playerW, playerH) {
    if (this.portalCooldown > 0) {
      this.portalCooldown -= dt;
    }

    for (const portal of this.portals) {
      portal.pulse += dt * 0.004;

      if (Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 15;
        portal.particles.push({
          x: portal.x + Math.cos(angle) * dist,
          y: portal.y + Math.sin(angle) * dist,
          vx: Math.cos(angle) * 0.3,
          vy: -Math.random() * 0.5 - 0.2,
          size: Math.random() * 2 + 1,
          alpha: 0.8,
          life: 800,
        });
      }

      for (let i = portal.particles.length - 1; i >= 0; i--) {
        const p = portal.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / 800);
        if (p.life <= 0) {
          portal.particles.splice(i, 1);
        }
      }
    }

    for (const p of this.portalParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 600);
    }
    this.portalParticles = this.portalParticles.filter(p => p.life > 0);

    if (this.portalCooldown > 0) return;

    const px = this.player.x;
    const py = this.player.y - playerH / 2;

    for (const portal of this.portals) {
      const dx = px - portal.x;
      const dy = py - portal.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 25) {
        const pairedPortal = this.portals.find(p => p.id === portal.pairedId);
        if (pairedPortal) {
          this.player.x = pairedPortal.x;
          this.player.y = pairedPortal.y + playerH / 2;
          this.player.vx = 0;
          this.player.vy = 0;
          this.portalCooldown = 1000;

          for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            this.portalParticles.push({
              x: pairedPortal.x,
              y: pairedPortal.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: Math.random() * 3 + 1,
              alpha: 1,
              life: 600,
            });
          }

          if (this.audio) this.audio.playSFX('mirrorRotate');
          break;
        }
      }
    }
  }

  _updateInteractHint() {
    let nearestDist = Infinity;
    let hint = '';

    for (const el of this.puzzleManager.elements) {
      if (el.type !== 'switch' && el.type !== 'lightMirror') continue;
      const dx = this.player.x - el.x;
      const dy = (this.player.y - 24) - el.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 45 && dist < nearestDist) {
        nearestDist = dist;
        if (el.type === 'switch') {
          hint = el.activated ? 'E 关闭' : 'E 开启';
        } else if (el.type === 'lightMirror') {
          hint = 'E 旋转镜面';
        }
      }
    }

    this.interactHint = hint;
    this.interactHintAlpha = hint ? Math.min(1, this.interactHintAlpha + 0.08) : Math.max(0, this.interactHintAlpha - 0.08);
  }

  render(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;

    const level = this.currentLevel || LevelData.getLevel(0);

    ctx.save();
    ctx.translate(this.screenShake.x, this.screenShake.y);

    if (this.glitchBurst) {
      ctx.translate((Math.random() - 0.5) * 10, 0);
    }

    ctx.fillStyle = level.bgColor;
    ctx.fillRect(-10, -10, w + 20, h + 20);

    this._renderLevelBackground(ctx, w, h, level);
    this._renderLevelStars(ctx, w, h);

    ctx.save();
    ctx.translate(this.camera.getOffsetX(), this.camera.getOffsetY());

    this._renderLevelFog(ctx, w, h, level);
    this._renderWaterReflection(ctx, w, h, level);
    this._renderDecorations(ctx, w, h);
    this._renderPlatforms(ctx, w, h, level);
    this._renderMovingPlatforms(ctx, w, h, level);
    this._renderAnchors(ctx, w, h);
    this._renderPortals(ctx, w, h);
    this.narrativeSystem.renderFragments(ctx);
    this.puzzleManager.render(ctx);
    this._renderParticles(ctx, w, h, level);
    this._renderPlayerTrail(ctx);
    this._renderLandingParticles(ctx);
    this._renderPlayer(ctx, w, h);
    this._renderInteractHint(ctx, w, h);
    this.hintSystem.render(ctx);

    ctx.restore();

    this._renderHUD(ctx, w, h, level);
    this._renderErosionOverlay(ctx, w, h);
    this._renderColorShift(ctx, w, h);
    this._renderScanLines(ctx, w, h);
    this._renderRealityCracks(ctx, w, h);
    this._renderDepthEffects(ctx, w, h);
    this.narrativeSystem.renderLightFlares(ctx);
    this.narrativeSystem.renderWhisperParticles(ctx);
    this.narrativeSystem.renderNarrativeEvent(ctx, w, h, this.depth);

    if (this.levelComplete) {
      this._renderLevelComplete(ctx, w, h, level);
    }

    if (this.showingLevelIntro) {
      this._renderLevelIntro(ctx, w, h, level);
    }

    if (this.transitioning) {
      this._renderTransition(ctx, w, h);
    } else if (this.transitionAlpha > 0) {
      ctx.fillStyle = `rgba(10, 14, 26, ${this.transitionAlpha})`;
      ctx.fillRect(-10, -10, w + 20, h + 20);
    }

    if (this.dying) {
      ctx.save();
      ctx.translate(this.camera.getOffsetX(), this.camera.getOffsetY());
      this._renderDeath(ctx, w, h);
      ctx.restore();
    }

    if (this.respawning) {
      ctx.save();
      ctx.translate(this.camera.getOffsetX(), this.camera.getOffsetY());
      this._renderRespawn(ctx, w, h);
      ctx.restore();
    }

    if (this.input.isMobile()) {
      this._renderTouchControls(ctx, w, h);
    }

    ctx.restore();
  }

  _renderTransition(ctx, w, h) {
    if (this.transitionPhase === 1) {
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);
      const r = maxR * this.vignetteRadius;
      const gradient = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, maxR);
      gradient.addColorStop(0, 'rgba(10, 14, 26, 0)');
      gradient.addColorStop(0.6, `rgba(10, 14, 26, ${this.transitionAlpha * 0.5})`);
      gradient.addColorStop(1, `rgba(10, 14, 26, ${this.transitionAlpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    } else if (this.transitionPhase === 2) {
      ctx.fillStyle = 'rgba(10, 14, 26, 1)';
      ctx.fillRect(0, 0, w, h);

      for (const s of this.fallStreaks) {
        const gradient = ctx.createLinearGradient(s.x, s.y + s.length, s.x, s.y);
        gradient.addColorStop(0, `rgba(0, 255, 212, 0)`);
        gradient.addColorStop(1, `rgba(0, 255, 212, ${s.alpha})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y + s.length);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }

      const displayDepth = this.nextDepth + 1;
      const t = (this.transitionProgress - 0.3) / 0.4;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 72px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = `rgba(0, 255, 212, ${0.3 + 0.4 * Math.sin(this.time * 0.005)})`;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 30;
      ctx.fillText(`${displayDepth}`, w / 2, h / 2);
      ctx.shadowBlur = 0;
      ctx.font = '300 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = `rgba(107, 107, 141, ${0.5 + 0.3 * Math.sin(this.time * 0.003)})`;
      ctx.fillText('深度', w / 2, h / 2 + 50);
      ctx.restore();
    } else if (this.transitionPhase === 3) {
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);
      const t = (this.transitionProgress - 0.7) / 0.3;
      const r = maxR * t;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      gradient.addColorStop(0, `rgba(10, 14, 26, 0)`);
      gradient.addColorStop(Math.min(t, 0.99), `rgba(10, 14, 26, 0)`);
      gradient.addColorStop(1, `rgba(10, 14, 26, ${1 - t})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderLevelIntro(ctx, w, h, level) {
    if (this.levelIntroAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.levelIntroAlpha;

    const cx = w / 2;
    const cy = h / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 40 * this.levelIntroAlpha;
    ctx.font = '600 48px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
    ctx.fillText(level.name, cx, cy - 20);
    ctx.shadowBlur = 0;

    ctx.font = '300 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText(level.subtitle || '', cx, cy + 25);

    const lineProgress = Math.min(1, this.levelIntroTimer / 800);
    const lineWidth = lineProgress * 200;
    ctx.strokeStyle = COLORS.FLUORESCENT_CYAN;
    ctx.lineWidth = 1;
    ctx.globalAlpha = this.levelIntroAlpha * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - lineWidth / 2, cy + 48);
    ctx.lineTo(cx + lineWidth / 2, cy + 48);
    ctx.stroke();

    ctx.restore();
  }

  _renderDepthEffects(ctx, w, h) {
    if (this.depth < 1) return;

    const vignetteStrength = this.depth * 0.12;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const gradient = ctx.createRadialGradient(cx, cy, maxR * 0.4, cx, cy, maxR);
    gradient.addColorStop(0, 'rgba(10, 14, 26, 0)');
    gradient.addColorStop(1, `rgba(10, 14, 26, ${vignetteStrength})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _renderPlayerTrail(ctx) {
    if (this.depth < 1) return;

    const size = 16;
    for (const t of this.playerTrail) {
      if (t.alpha < 0.02) continue;
      ctx.save();
      ctx.globalAlpha = t.alpha * 0.3;
      ctx.translate(t.x, t.y);
      ctx.scale(t.facing, 1);
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.beginPath();
      ctx.ellipse(0, -size * 1.5, size * 0.8, size * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _spawnLandingParticles() {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = 1 + Math.random() * 3;
      this.landingParticles.push({
        x: this.player.x + (Math.random() - 0.5) * 20,
        y: this.player.y,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.random() * 2 - 0.5,
        size: Math.random() * 3 + 1,
        alpha: 0.7 + Math.random() * 0.3,
        life: 400 + Math.random() * 200,
        maxLife: 600,
        isCyan: Math.random() > 0.3,
      });
    }
    this.landingImpactTimer = 200;
  }

  _updateLandingParticles(dt) {
    for (let i = this.landingParticles.length - 1; i >= 0; i--) {
      const p = this.landingParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= dt;
      p.alpha = Math.max(0, (p.life / p.maxLife) * 0.8);
      p.size *= 0.98;
      if (p.life <= 0) {
        this.landingParticles.splice(i, 1);
      }
    }
    if (this.landingImpactTimer > 0) {
      this.landingImpactTimer -= dt;
    }
  }

  _renderLandingParticles(ctx) {
    for (const p of this.landingParticles) {
      if (p.alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.isCyan ? COLORS.FLUORESCENT_CYAN : COLORS.MOONLIGHT_WHITE;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.landingImpactTimer > 0) {
      const progress = 1 - this.landingImpactTimer / 200;
      const radius = progress * 40;
      const alpha = (1 - progress) * 0.15;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = COLORS.FLUORESCENT_CYAN;
      ctx.lineWidth = 1.5 * (1 - progress);
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _renderLevelBackground(ctx, w, h, level) {
    const key = level.bgColor + level.fogColor + w + h;
    if (this._bgGradientKey !== key) {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      for (const stop of level.bgGradientStops) {
        gradient.addColorStop(stop.pos, stop.color);
      }
      this._bgGradientCache = gradient;
      this._bgGradientKey = key;
    }
    ctx.fillStyle = this._bgGradientCache;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.3;
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    radGrad.addColorStop(0, 'rgba(0, 255, 212, 0.015)');
    radGrad.addColorStop(0.5, `rgba(${level.fogColor}, 0.2)`);
    radGrad.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, w, h);

    this._renderNebulaLayer(ctx, w, h, level);
  }

  _renderNebulaLayer(ctx, w, h, level) {
    if (!this._nebulaCache || this._nebulaCacheKey !== this.depth) {
      this._nebulaCacheKey = this.depth;
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const nctx = offscreen.getContext('2d');

      const nebulaBlobs = this.depth >= 3 ? 8 : (this.depth >= 2 ? 6 : 4);
      const seed = this.depth * 1337 + 42;
      const rng = this._seededRandom(seed);

      for (let i = 0; i < nebulaBlobs; i++) {
        const bx = rng() * w;
        const by = rng() * h * 0.8;
        const br = (rng() * 200 + 100) * (1 + this.depth * 0.3);
        const alpha = rng() * 0.06 + 0.02;

        const colors = [
          `rgba(${level.fogColor}, ${alpha})`,
          `rgba(0, 255, 212, ${alpha * 0.3})`,
          `rgba(255, 107, 53, ${alpha * 0.2})`,
        ];

        for (let j = 0; j < 3; j++) {
          const ox = (rng() - 0.5) * br * 0.5;
          const oy = (rng() - 0.5) * br * 0.5;
          const grad = nctx.createRadialGradient(
            bx + ox, by + oy, 0,
            bx + ox, by + oy, br
          );
          grad.addColorStop(0, colors[j]);
          grad.addColorStop(0.6, `rgba(${level.fogColor}, ${alpha * 0.3})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          nctx.fillStyle = grad;
          nctx.fillRect(0, 0, w, h);
        }
      }

      this._nebulaCache = offscreen;
    }

    const parallaxX = -this.camera.x * 0.05;
    const parallaxY = -this.camera.y * 0.03;
    ctx.drawImage(this._nebulaCache, parallaxX, parallaxY);
  }

  _seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  _renderLevelStars(ctx, w, h) {
    const parallaxX = -this.camera.x * 0.02;
    const parallaxY = -this.camera.y * 0.01;
    for (const star of this.levelStars) {
      const sx = star.x + parallaxX;
      const sy = star.y + parallaxY;
      const twinkle = 0.4 + 0.6 * Math.sin(this.time * 0.002 + star.phase);
      const alpha = star.brightness * twinkle;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 230, 240, ${alpha})`;
      ctx.fill();

      if (star.size > 1.0 && star.brightness > 0.5) {
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 212, ${alpha * 0.08})`;
        ctx.fill();
      }
    }
  }

  _renderLevelFog(ctx, w, h, level) {
    const breathCycle = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
    const fogAlpha = level.fogAlpha + this.erosionLevel * 0.1;
    const driftX = Math.sin(this.time * 0.0003) * 40;
    const driftY = Math.cos(this.time * 0.00025) * 25;

    const fogLayers = [
      { cx: w * 0.35 + driftX, cy: h * 0.5 + driftY, r: w * 0.45 },
      { cx: w * 0.65 - driftX * 0.5, cy: h * 0.7 - driftY * 0.3, r: w * 0.4 },
    ];

    for (const fog of fogLayers) {
      const r = fog.r * (0.85 + breathCycle * 0.15);
      const gradient = ctx.createRadialGradient(fog.cx, fog.cy, 0, fog.cx, fog.cy, r);
      gradient.addColorStop(0, `rgba(${level.fogColor}, ${fogAlpha * 0.4})`);
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderWaterReflection(ctx, w, h, level) {
    const waterY = h * 0.78;
    const t = this.waterReflectionTime;
    const breathCycle = Math.sin(t * 0.8) * 0.5 + 0.5;
    const depthGlow = 0.5;

    ctx.save();

    for (let x = 0; x < w; x += 6) {
      const waveOffset = Math.sin(x * 0.02 + t * 1.5) * 2 + Math.sin(x * 0.05 + t * 0.8) * 1.5;
      const wy = waterY + waveOffset;

      const surfaceAlpha = 0.04 + breathCycle * 0.02;
      ctx.strokeStyle = `rgba(0, 255, 212, ${surfaceAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, wy);
      ctx.lineTo(x + 6, wy + Math.sin((x + 6) * 0.02 + t * 1.5) * 2);
      ctx.stroke();
    }

    for (let i = 0; i < 15; i++) {
      const cx = (Math.sin(i * 2.3 + t * 0.1) * 0.5 + 0.5) * w;
      const cy = waterY + (h - waterY) * (0.2 + (Math.sin(i * 1.7 + t * 0.05) * 0.5 + 0.5) * 0.6);
      const pulse = Math.sin(t * 2 + i * 1.5) * 0.5 + 0.5;
      const r = 15 + pulse * 25;

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      glow.addColorStop(0, `rgba(0, 255, 212, ${0.03 * depthGlow * pulse})`);
      glow.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    if (this.depth >= 1) {
      const erosionAlpha = this.depth * 0.02;
      for (let i = 0; i < 3; i++) {
        const cx = (Math.sin(i * 3.7 + t * 0.1) * 0.5 + 0.5) * w;
        const cy = waterY + (h - waterY) * (0.3 + Math.sin(i * 5.1 + t * 0.08) * 0.3);
        const pulse = Math.sin(t * 3 + i * 2) * 0.5 + 0.5;

        ctx.strokeStyle = `rgba(255, 107, 53, ${0.1 * erosionAlpha * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const len = 15 + this.depth * 10;
        const angle = Math.sin(i * 2.1) * Math.PI;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  _renderDecorations(ctx, w, h) {
    for (const dec of this.decorations) {
      switch (dec.type) {
        case 'crystal':
          this._renderCrystal(ctx, dec);
          break;
        case 'glowOrb':
          this._renderGlowOrb(ctx, dec);
          break;
        case 'rune':
          this._renderRune(ctx, dec);
          break;
      }
    }
  }

  _renderCrystal(ctx, dec) {
    const pulse = Math.sin(this.time * 0.002 + dec.x * 0.01) * 0.3 + 0.7;
    const s = dec.size;

    ctx.save();
    ctx.translate(dec.x, dec.y);

    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.lineTo(-s * 0.1, -s);
    ctx.lineTo(s * 0.1, -s * 0.8);
    ctx.lineTo(s * 0.3, 0);
    ctx.closePath();
    ctx.fillStyle = `rgba(0, 255, 212, ${0.15 * pulse})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 255, 212, ${0.3 * pulse})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const glow = ctx.createRadialGradient(0, -s * 0.5, 0, 0, -s * 0.5, s * 1.5);
    glow.addColorStop(0, `rgba(0, 255, 212, ${0.06 * pulse})`);
    glow.addColorStop(1, 'rgba(0, 255, 212, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-s * 1.5, -s * 2, s * 3, s * 3);

    ctx.restore();
  }

  _renderGlowOrb(ctx, dec) {
    const pulse = Math.sin(this.time * 0.003 + dec.x * 0.02) * 0.4 + 0.6;
    const floatY = Math.sin(this.time * 0.001 + dec.x * 0.01) * 5;

    ctx.save();
    ctx.translate(dec.x, dec.y + floatY);

    const isCyan = dec.color === 'cyan';
    const baseColor = isCyan ? '0, 255, 212' : '232, 230, 240';

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, dec.size * 4);
    glow.addColorStop(0, `rgba(${baseColor}, ${0.15 * pulse})`);
    glow.addColorStop(1, `rgba(${baseColor}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(-dec.size * 4, -dec.size * 4, dec.size * 8, dec.size * 8);

    ctx.beginPath();
    ctx.arc(0, 0, dec.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${baseColor}, ${0.6 * pulse})`;
    ctx.shadowColor = isCyan ? '#00FFD4' : '#E8E6F0';
    ctx.shadowBlur = 10 * pulse;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  _renderRune(ctx, dec) {
    const pulse = Math.sin(this.time * 0.002 + dec.symbol * 2) * 0.3 + 0.7;

    ctx.save();
    ctx.translate(dec.x, dec.y);

    const symbols = ['◇', '△', '○'];
    ctx.font = `${10 + pulse * 2}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = `rgba(0, 255, 212, ${0.2 * pulse})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbols[dec.symbol % symbols.length], 0, 0);

    ctx.restore();
  }

  _renderPlatforms(ctx, w, h, level) {
    for (const plat of this.platforms) {
      const gradient = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
      gradient.addColorStop(0, level.platformColor);
      gradient.addColorStop(0.3, '#0F1A2E');
      gradient.addColorStop(1, '#0A0E1A');
      ctx.fillStyle = gradient;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

      ctx.strokeStyle = level.platformEdgeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plat.x, plat.y);
      ctx.lineTo(plat.x + plat.w, plat.y);
      ctx.stroke();

      if (plat.h <= 16) {
        const edgeGlow = ctx.createLinearGradient(plat.x, plat.y, plat.x + plat.w, plat.y);
        edgeGlow.addColorStop(0, 'rgba(0, 255, 212, 0)');
        edgeGlow.addColorStop(0.5, level.platformGlowColor);
        edgeGlow.addColorStop(1, 'rgba(0, 255, 212, 0)');
        ctx.fillStyle = edgeGlow;
        ctx.fillRect(plat.x, plat.y - 2, plat.w, 4);
      }
    }
  }

  _renderMovingPlatforms(ctx, w, h, level) {
    for (const mp of this.movingPlatforms) {
      const gradient = ctx.createLinearGradient(mp.x, mp.y, mp.x, mp.y + mp.h);
      gradient.addColorStop(0, level.platformColor);
      gradient.addColorStop(0.3, '#0F1A2E');
      gradient.addColorStop(1, '#0A0E1A');
      ctx.fillStyle = gradient;
      ctx.fillRect(mp.x, mp.y, mp.w, mp.h);

      const pulse = Math.sin(this.time * 0.004 + mp.phase) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(0, 255, 212, ${0.2 * pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mp.x, mp.y);
      ctx.lineTo(mp.x + mp.w, mp.y);
      ctx.stroke();

      const edgeGlow = ctx.createLinearGradient(mp.x, mp.y, mp.x + mp.w, mp.y);
      edgeGlow.addColorStop(0, 'rgba(0, 255, 212, 0)');
      edgeGlow.addColorStop(0.5, `rgba(0, 255, 212, ${0.12 * pulse})`);
      edgeGlow.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = edgeGlow;
      ctx.fillRect(mp.x, mp.y - 2, mp.w, 4);

      const trailAlpha = 0.06 * pulse;
      if (mp.moveType === 'horizontal' || mp.moveType === 'circular') {
        const trailW = Math.abs(mp.x - mp.prevX) * 3;
        if (trailW > 1) {
          ctx.fillStyle = `rgba(0, 255, 212, ${trailAlpha})`;
          ctx.fillRect(mp.x - trailW, mp.y, mp.w + trailW * 2, mp.h);
        }
      }
      if (mp.moveType === 'vertical' || mp.moveType === 'circular') {
        const trailH = Math.abs(mp.y - mp.prevY) * 3;
        if (trailH > 1) {
          ctx.fillStyle = `rgba(0, 255, 212, ${trailAlpha})`;
          ctx.fillRect(mp.x, mp.y - trailH, mp.w, mp.h + trailH * 2);
        }
      }
    }
  }

  _renderPortals(ctx, w, h) {
    for (const portal of this.portals) {
      const pulse = Math.sin(portal.pulse) * 0.3 + 0.7;
      const outerR = 22 * pulse;
      const innerR = 10 * pulse;

      const glow = ctx.createRadialGradient(portal.x, portal.y, 0, portal.x, portal.y, outerR * 2);
      glow.addColorStop(0, `rgba(0, 255, 212, ${0.15 * pulse})`);
      glow.addColorStop(0.5, `rgba(0, 136, 255, ${0.06 * pulse})`);
      glow.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(portal.x - outerR * 2, portal.y - outerR * 2, outerR * 4, outerR * 4);

      ctx.save();
      ctx.translate(portal.x, portal.y);
      ctx.rotate(this.time * 0.002);

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const r = i % 2 === 0 ? outerR : innerR;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(0, 255, 212, ${0.15 * pulse})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(0, 255, 212, ${0.5 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00FFD4';
      ctx.shadowBlur = 8 * pulse;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(0, 0, innerR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 212, ${0.3 * pulse})`;
      ctx.fill();

      ctx.restore();

      for (const p of portal.particles) {
        if (p.alpha <= 0) continue;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    for (const p of this.portalParticles) {
      if (p.alpha <= 0) continue;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  _renderAnchors(ctx) {
    for (const anchor of this.anchors) {
      if (anchor.collected) continue;

      anchor.pulse += 0.05;
      const pulseSize = 1 + 0.3 * Math.sin(anchor.pulse);
      const size = anchor.size * pulseSize;

      let pulseMultiplier = 1;
      if (this.depth >= 3) {
        pulseMultiplier = 1 + 0.5 * Math.sin(this.time * 0.02 + anchor.pulse * 3);
      }

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size * 3 * pulseMultiplier, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 212, 0.08)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
  }

  _renderParticles(ctx, w, h, level) {
    const orangeParts = [];
    const purpleParts = [];
    const cyanParts = [];
    const whiteParts = [];

    for (const p of this.particles) {
      if (p.colorType === 'orange') orangeParts.push(p);
      else if (p.colorType === 'purple') purpleParts.push(p);
      else if (p.isCyan) cyanParts.push(p);
      else whiteParts.push(p);
    }

    if (orangeParts.length) {
      ctx.fillStyle = 'rgba(255, 107, 53, 1)';
      for (const p of orangeParts) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (purpleParts.length) {
      ctx.fillStyle = 'rgba(138, 43, 226, 1)';
      for (const p of purpleParts) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (cyanParts.length) {
      ctx.fillStyle = 'rgba(0, 255, 212, 1)';
      for (const p of cyanParts) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (whiteParts.length) {
      ctx.fillStyle = 'rgba(232, 230, 240, 1)';
      for (const p of whiteParts) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  _renderPlayer(ctx) {
    const p = this.player;
    const size = 16;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.facing, 1);

    ctx.fillStyle = '#2D1B69';
    ctx.beginPath();
    ctx.ellipse(0, -size * 1.5, size * 0.8, size * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
    ctx.beginPath();
    ctx.ellipse(0, -size * 2.5, size * 0.6, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const eyeColor = this.depth >= 3 ? COLORS.VOID_ORANGE : COLORS.FLUORESCENT_CYAN;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(3, -size * 2.6, 2, 0, Math.PI * 2);
    ctx.fill();

    if (this.depth >= 2) {
      const flicker = Math.sin(this.time * 0.03) > 0.3 ? 1 : 0.3;
      ctx.globalAlpha = flicker;
    }

    ctx.fillStyle = '#1A1035';
    ctx.beginPath();
    ctx.moveTo(-size * 0.6, -size * 3);
    ctx.lineTo(0, -size * 4.5);
    ctx.lineTo(size * 0.6, -size * 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0A0E1A';
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 3.2);
    ctx.lineTo(0, -size * 4);
    ctx.lineTo(size * 0.3, -size * 3.2);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _renderInteractHint(ctx, w, h) {
    if (this.interactHintAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.interactHintAlpha * (0.6 + 0.3 * Math.sin(this.time * 0.004));
    ctx.font = '300 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.interactHint, this.player.x, this.player.y - 85);
    ctx.restore();
  }

  _renderHUD(ctx, w, h, level) {
    ctx.save();

    const hudX = 30;
    const hudY = 30;

    for (let i = 0; i < this.anchors.length; i++) {
      const ax = hudX + i * 28;
      const ay = hudY;

      if (i < this.anchorCount) {
        let pulseSize = 8;
        if (this.depth >= 3) {
          pulseSize = 8 + 3 * Math.sin(this.time * 0.02 + i * 2);
        }
        ctx.beginPath();
        ctx.arc(ax, ay, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
        ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(ax, ay, 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 212, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    let depthText = `深度 ${this.depth + 1}`;
    if (this.depth >= 2) {
      const glitchChars = '!@#$%^&*<>[]{}|~';
      if (Math.random() < 0.08) {
        const idx = Math.floor(Math.random() * depthText.length);
        depthText = depthText.substring(0, idx) + glitchChars[Math.floor(Math.random() * glitchChars.length)] + depthText.substring(idx + 1);
      }
    }

    ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.textAlign = 'right';
    ctx.fillText(depthText, w - 30, 30);

    if (this.deathCount > 0) {
      ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 107, 53, 0.5)';
      ctx.fillText(`深渊吞噬 ×${this.deathCount}`, w - 30, 48);
    }

    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(107, 107, 141, 0.6)';
    ctx.fillText(level.name, w - 30, this.deathCount > 0 ? 64 : 48);

    ctx.restore();
  }

  _renderErosionOverlay(ctx, w, h) {
    const effectiveErosion = this.erosionLevel * 0.6 + this.depth * 0.15;
    if (effectiveErosion < 0.05) return;

    const intensity = Math.min(1, effectiveErosion);
    const depthIndex = this.currentLevel ? this.currentLevel.depthIndex : 0;

    const erosionPoints = [
      { x: w * 0.15, y: h * 0.2 },
      { x: w * 0.85, y: h * 0.35 },
      { x: w * 0.6, y: h * 0.7 },
      { x: w * 0.3, y: h * 0.85 },
    ];

    const maxPoints = Math.floor(intensity * erosionPoints.length);
    for (let i = 0; i < maxPoints; i++) {
      const ep = erosionPoints[i];
      const pulse = Math.sin(this.time * 0.002 + i * 1.5) * 0.5 + 0.5;
      const r = (60 + intensity * 120) * (0.7 + pulse * 0.3);
      const cx = ep.x + Math.sin(this.time * 0.0005 + i) * 15;
      const cy = ep.y + Math.cos(this.time * 0.0004 + i) * 10;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const isVoid = i % 2 === 0 || depthIndex >= 2;
      if (isVoid) {
        gradient.addColorStop(0, `rgba(255, 107, 53, ${0.06 * intensity * pulse})`);
        gradient.addColorStop(0.5, `rgba(255, 0, 68, ${0.03 * intensity})`);
      } else {
        gradient.addColorStop(0, `rgba(0, 255, 212, ${0.04 * intensity * pulse})`);
        gradient.addColorStop(0.5, `rgba(0, 136, 255, ${0.02 * intensity})`);
      }
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      if (isVoid && intensity > 0.3 && pulse > 0.6) {
        ctx.strokeStyle = `rgba(255, 107, 53, ${0.15 * intensity * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const crackAngle = this.time * 0.0003 + i * 2;
        for (let j = 0; j < 3; j++) {
          const a = crackAngle + j * Math.PI * 2 / 3;
          const len = r * 0.7;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        }
        ctx.stroke();
      }
    }

    if (intensity > 0.5) {
      const vignetteAlpha = (intensity - 0.5) * 0.3;
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
      vignette.addColorStop(0, 'rgba(10, 14, 26, 0)');
      vignette.addColorStop(1, `rgba(10, 0, 5, ${vignetteAlpha})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderLevelComplete(ctx, w, h, level) {
    ctx.save();
    ctx.globalAlpha = this.levelCompleteAlpha * 0.6;
    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = this.levelCompleteAlpha;

    const breathCycle = Math.sin(this.time * 0.002) * 0.5 + 0.5;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
    ctx.shadowBlur = 30 * (0.7 + breathCycle * 0.3);
    ctx.font = '600 42px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.MOONLIGHT_WHITE;
    ctx.fillText(level.completionText, w / 2, h * 0.4);
    ctx.shadowBlur = 0;

    ctx.font = '300 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COLORS.STARDUST_GRAY;
    ctx.fillText(level.completionSubtext, w / 2, h * 0.5);

    if (this.levelCompleteAlpha >= 1) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.time * 0.003);
      ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.fillText('按 Enter 继续深入', w / 2, h * 0.62);
    }

    ctx.restore();
  }

  _initScanLines() {
    this.scanLines = [];
    const lh = this.currentLevel ? (this.currentLevel.height || 720) : 720;
    for (let y = 0; y < lh; y += 3) {
      this.scanLines.push({
        y,
        isGlitch: Math.random() < 0.05,
        offset: Math.random() * 6 - 3,
        thickness: 1,
      });
    }
  }

  _renderScanLines(ctx, w, h) {
    if (this.depth < 1) return;

    const baseAlpha = this.depth === 1 ? 0.02 : this.depth === 2 ? 0.04 : 0.07;
    const glitchBoost = this.glitchBurst ? 0.15 : 0;

    ctx.save();
    ctx.globalAlpha = baseAlpha + glitchBoost * 0.3;

    if (this.depth >= 3) {
      ctx.fillStyle = 'rgba(255, 107, 53, 1)';
    } else {
      ctx.fillStyle = 'rgba(10, 14, 26, 1)';
    }

    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    if (this.glitchBurst) {
      const burstY = Math.random() * h;
      const burstH = 10 + Math.random() * 40;
      ctx.globalAlpha = 0.08 + Math.random() * 0.07;
      ctx.fillStyle = 'rgba(255, 107, 53, 1)';
      ctx.fillRect((Math.random() - 0.5) * 15, burstY, w, burstH);
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = 'rgba(0, 255, 212, 1)';
      ctx.fillRect((Math.random() - 0.5) * 8, burstY + 2, w, burstH * 0.5);
    }

    ctx.restore();
  }

  _renderColorShift(ctx, w, h) {
    if (this.colorShiftAmount < 0.01) return;

    ctx.save();
    const alpha = Math.min(0.25, this.colorShiftAmount * 0.15);

    if (this.depth >= 2) {
      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, `rgba(255, 107, 53, ${alpha * 0.6})`);
      gradient.addColorStop(0.4, `rgba(180, 40, 20, ${alpha * 0.3})`);
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    } else if (this.depth >= 1) {
      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, `rgba(180, 100, 60, ${alpha * 0.3})`);
      gradient.addColorStop(0.5, `rgba(80, 60, 100, ${alpha * 0.1})`);
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    if (this.depth >= 3) {
      const pulse = Math.sin(this.erosionTime * 0.001) * 0.5 + 0.5;
      const bleedAlpha = 0.03 * pulse * this.colorShiftAmount;
      ctx.fillStyle = `rgba(255, 60, 20, ${bleedAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  _initRealityCracks() {
    this.realityCracks = [];
    if (this.depth < 2) return;

    const crackCount = this.depth >= 3 ? 5 : 2;
    const edges = ['top', 'bottom', 'left', 'right'];
    const lw = this.currentLevel ? (this.currentLevel.width || 1280) : 1280;
    const lh = this.currentLevel ? (this.currentLevel.height || 720) : 720;

    for (let i = 0; i < crackCount; i++) {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      let x, y, angle;

      switch (edge) {
        case 'top':
          x = Math.random() * lw;
          y = 0;
          angle = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
          break;
        case 'bottom':
          x = Math.random() * lw;
          y = lh;
          angle = -Math.PI * 0.3 - Math.random() * Math.PI * 0.4;
          break;
        case 'left':
          x = 0;
          y = Math.random() * lh;
          angle = -Math.PI * 0.2 + Math.random() * Math.PI * 0.4;
          break;
        case 'right':
          x = lw;
          y = Math.random() * lh;
          angle = Math.PI * 0.6 + Math.random() * Math.PI * 0.4;
          break;
      }

      const segments = [];
      const totalSegments = 4 + Math.floor(Math.random() * 6);
      let cx = x, cy = y, ca = angle;

      for (let j = 0; j < totalSegments; j++) {
        const len = 15 + Math.random() * 35;
        const nx = cx + Math.cos(ca) * len;
        const ny = cy + Math.sin(ca) * len;
        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });
        cx = nx;
        cy = ny;
        ca += (Math.random() - 0.5) * 0.8;
      }

      this.realityCracks.push({
        segments,
        growth: 0,
        maxGrowth: totalSegments,
        healTimer: 10000 + Math.random() * 15000,
        age: 0,
        edge,
      });
    }
  }

  _updateRealityCracks(dt) {
    for (const crack of this.realityCracks) {
      crack.age += dt;

      if (crack.growth < crack.maxGrowth) {
        crack.growth += dt * 0.003;
        if (crack.growth > crack.maxGrowth) crack.growth = crack.maxGrowth;
      }

      crack.healTimer -= dt;
      if (crack.healTimer <= 0) {
        crack.growth = 0;
        crack.healTimer = 10000 + Math.random() * 15000;
        crack.age = 0;
      }
    }
  }

  _renderRealityCracks(ctx, w, h) {
    if (this.depth < 2) return;

    ctx.save();
    for (const crack of this.realityCracks) {
      const visibleSegments = Math.floor(crack.growth);
      if (visibleSegments <= 0) continue;

      const partialProgress = crack.growth - visibleSegments;

      for (let i = 0; i < Math.min(visibleSegments, crack.segments.length); i++) {
        const seg = crack.segments[i];
        const isLast = i === visibleSegments - 1;
        const segAlpha = isLast ? partialProgress : 1;

        const flicker = Math.sin(this.erosionTime * 0.005 + i * 0.5) * 0.3 + 0.7;

        ctx.strokeStyle = `rgba(255, 107, 53, ${0.4 * segAlpha * flicker})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 200, 150, ${0.15 * segAlpha * flicker})`;
        ctx.lineWidth = 0.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }

      if (crack.growth > 2) {
        const tipSeg = crack.segments[Math.min(visibleSegments - 1, crack.segments.length - 1)];
        const glow = ctx.createRadialGradient(tipSeg.x2, tipSeg.y2, 0, tipSeg.x2, tipSeg.y2, 15);
        glow.addColorStop(0, `rgba(255, 107, 53, ${0.12 * Math.sin(this.erosionTime * 0.004) * 0.5 + 0.5})`);
        glow.addColorStop(1, 'rgba(255, 107, 53, 0)');
        ctx.fillStyle = glow;
        ctx.shadowBlur = 0;
        ctx.fillRect(tipSeg.x2 - 15, tipSeg.y2 - 15, 30, 30);
      }
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _triggerDeath() {
    this.dying = true;
    this.deathTimer = 0;
    this.deathAlpha = 0;
    this.playerDissolveProgress = 0;
    this.deathCount = saveSystem.addDeath();
    this.player.vx = 0;
    this.player.vy = 0;

    this.deathParticles = [];
    for (let i = 0; i < 30; i++) {
      this.deathParticles.push({
        x: this.player.x + (Math.random() - 0.5) * 20,
        y: this.player.y - 24 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 4 + 2,
        alpha: 1,
        color: Math.random() > 0.4 ? 'orange' : 'cyan',
      });
    }

    this.deathTendrils = [];
    for (let i = 0; i < 8; i++) {
      const baseX = this.player.x + (Math.random() - 0.5) * 100;
      const segments = [];
      let cx = baseX;
      let cy = (this.currentLevel ? (this.currentLevel.height || 720) : 720);
      const targetY = this.player.y - 24;
      const steps = 6 + Math.floor(Math.random() * 4);
      for (let j = 0; j < steps; j++) {
        const nx = cx + (Math.random() - 0.5) * 30;
        const ny = cy - (720 - targetY) / steps;
        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });
        cx = nx;
        cy = ny;
      }
      this.deathTendrils.push({
        segments,
        growth: 0,
        maxGrowth: steps,
        alpha: 0.6 + Math.random() * 0.4,
        width: 1 + Math.random() * 2,
      });
    }

    if (this.audio) this.audio.playSFX('playerDeath');
  }

  _updateDeath(dt) {
    this.deathTimer += dt;
    const deathDuration = 1500;
    const progress = Math.min(1, this.deathTimer / deathDuration);

    if (progress <= 0.3) {
      const t = progress / 0.3;
      this.deathAlpha = t * 0.4;
      this.playerDissolveProgress = 0;
      for (const tendril of this.deathTendrils) {
        tendril.growth = Math.min(tendril.maxGrowth, tendril.growth + dt * 0.015);
      }
    } else if (progress <= 0.7) {
      const t = (progress - 0.3) / 0.4;
      this.deathAlpha = 0.4 + t * 0.4;
      this.playerDissolveProgress = t;
      for (const p of this.deathParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.alpha = Math.max(0, 1 - t * 1.2);
        p.size *= 0.98;
      }
      for (const tendril of this.deathTendrils) {
        tendril.growth = tendril.maxGrowth;
        tendril.alpha = Math.max(0, tendril.alpha - dt * 0.001);
      }
    } else if (progress <= 1.0) {
      const t = (progress - 0.7) / 0.3;
      this.deathAlpha = 0.8 + t * 0.2;
      this.playerDissolveProgress = 1;
      for (const p of this.deathParticles) {
        p.alpha = 0;
      }
      for (const tendril of this.deathTendrils) {
        tendril.alpha = Math.max(0, tendril.alpha - dt * 0.003);
      }
    }

    if (progress >= 1.0) {
      this.dying = false;
      this.deathAlpha = 1;
      this._triggerRespawn();
    }
  }

  _triggerRespawn() {
    this.respawning = true;
    this.respawnTimer = 0;
    this.respawnAlpha = 1;
    this.respawnGlowRadius = 0;
    this.respawnFlashAlpha = 0;

    this.player.x = this.currentLevel.playerStart.x;
    this.player.y = this.currentLevel.playerStart.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onGround = false;
    this.player.facing = 1;

    this.respawnParticles = [];
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 80;
      this.respawnParticles.push({
        x: this.player.x + Math.cos(angle) * dist,
        y: this.player.y - 24 + Math.sin(angle) * dist,
        targetX: this.player.x + (Math.random() - 0.5) * 10,
        targetY: this.player.y - 24 + (Math.random() - 0.5) * 20,
        size: Math.random() * 3 + 1,
        alpha: 0,
        delay: Math.random() * 400,
        arrived: false,
      });
    }

    if (this.audio) this.audio.playSFX('playerRespawn');
  }

  _updateRespawn(dt) {
    this.respawnTimer += dt;
    const respawnDuration = 1500;
    const progress = Math.min(1, this.respawnTimer / respawnDuration);

    if (progress <= 0.25) {
      const t = progress / 0.25;
      this.respawnAlpha = 1 - t * 0.5;
      this.respawnGlowRadius = t * 40;
      for (const p of this.respawnParticles) {
        if (this.respawnTimer > p.delay) {
          p.alpha = Math.min(1, p.alpha + dt * 0.005);
        }
      }
    } else if (progress <= 0.6) {
      const t = (progress - 0.25) / 0.35;
      this.respawnAlpha = 0.5 - t * 0.3;
      this.respawnGlowRadius = 40 + t * 30;
      for (const p of this.respawnParticles) {
        p.alpha = Math.min(1, p.alpha + dt * 0.005);
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        p.x += dx * 0.08;
        p.y += dy * 0.08;
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
          p.arrived = true;
        }
      }
    } else if (progress <= 0.85) {
      const t = (progress - 0.6) / 0.25;
      this.respawnAlpha = 0.2 - t * 0.15;
      this.respawnGlowRadius = 70 + t * 20;
      this.respawnFlashAlpha = t * 0.6;
      for (const p of this.respawnParticles) {
        p.x += (p.targetX - p.x) * 0.15;
        p.y += (p.targetY - p.y) * 0.15;
        p.alpha = Math.max(0, 1 - t);
      }
    } else {
      const t = (progress - 0.85) / 0.15;
      this.respawnAlpha = Math.max(0, 0.05 * (1 - t));
      this.respawnGlowRadius = 90 * (1 - t);
      this.respawnFlashAlpha = 0.6 * (1 - t);
      for (const p of this.respawnParticles) {
        p.alpha = 0;
      }
    }

    if (progress >= 1.0) {
      this.respawning = false;
      this.respawnAlpha = 0;
      this.respawnFlashAlpha = 0;
      this.respawnGlowRadius = 0;
      this.deathAlpha = 0;
      this.deathParticles = [];
      this.respawnParticles = [];
      this.deathTendrils = [];
      this.playerDissolveProgress = 0;
    }
  }

  _renderDeath(ctx, w, h) {
    ctx.save();

    if (this.deathAlpha > 0) {
      ctx.fillStyle = `rgba(10, 14, 26, ${this.deathAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    const progress = Math.min(1, this.deathTimer / 1500);
    if (progress > 0.15) {
      const glowIntensity = Math.min(1, (progress - 0.15) / 0.5);
      const pulse = Math.sin(this.time * 0.008) * 0.3 + 0.7;
      const glow = ctx.createRadialGradient(
        this.player.x, h, 0,
        this.player.x, h, 300 * glowIntensity
      );
      glow.addColorStop(0, `rgba(255, 107, 53, ${0.3 * glowIntensity * pulse})`);
      glow.addColorStop(0.5, `rgba(255, 0, 68, ${0.1 * glowIntensity * pulse})`);
      glow.addColorStop(1, 'rgba(255, 107, 53, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(this.player.x - 300, h - 300, 600, 300);
    }

    for (const tendril of this.deathTendrils) {
      if (tendril.alpha <= 0) continue;
      const visibleSegs = Math.floor(tendril.growth);
      ctx.strokeStyle = `rgba(255, 107, 53, ${tendril.alpha})`;
      ctx.lineWidth = tendril.width;
      ctx.shadowColor = '#FF6B35';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < Math.min(visibleSegs, tendril.segments.length); i++) {
        const seg = tendril.segments[i];
        if (!started) {
          ctx.moveTo(seg.x1, seg.y1);
          started = true;
        }
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    for (const p of this.deathParticles) {
      if (p.alpha <= 0) continue;
      ctx.globalAlpha = p.alpha;
      const color = p.color === 'orange' ? '255, 107, 53' : '0, 255, 212';
      ctx.fillStyle = `rgba(${color}, 1)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.playerDissolveProgress > 0 && this.playerDissolveProgress < 1) {
      ctx.globalAlpha = 1 - this.playerDissolveProgress;
      this._renderPlayer(ctx);
      ctx.globalAlpha = 1;
    } else if (this.playerDissolveProgress >= 1) {
      // player fully dissolved, don't render
    }

    ctx.restore();
  }

  _renderRespawn(ctx, w, h) {
    ctx.save();

    if (this.respawnAlpha > 0) {
      ctx.fillStyle = `rgba(10, 14, 26, ${this.respawnAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (this.respawnGlowRadius > 0) {
      const pulse = Math.sin(this.time * 0.006) * 0.3 + 0.7;
      const glow = ctx.createRadialGradient(
        this.player.x, this.player.y - 24, 0,
        this.player.x, this.player.y - 24, this.respawnGlowRadius
      );
      glow.addColorStop(0, `rgba(0, 255, 212, ${0.25 * pulse})`);
      glow.addColorStop(0.4, `rgba(0, 136, 255, ${0.1 * pulse})`);
      glow.addColorStop(1, 'rgba(0, 255, 212, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    for (const p of this.respawnParticles) {
      if (p.alpha <= 0) continue;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    const respawnProgress = Math.min(1, this.respawnTimer / 1500);
    if (respawnProgress > 0.3) {
      const materialize = Math.min(1, (respawnProgress - 0.3) / 0.4);
      ctx.globalAlpha = materialize;
      this._renderPlayer(ctx);
      ctx.globalAlpha = 1;
    }

    if (this.respawnFlashAlpha > 0) {
      ctx.fillStyle = `rgba(0, 255, 212, ${this.respawnFlashAlpha * 0.3})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  _renderTouchControls(ctx, w, h) {
    ctx.save();

    const joystick = this.input.getJoystickState();
    const jx = 160;
    const jy = h - 140;
    const baseR = 60;
    const thumbR = 25;

    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(jx, jy, baseR, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.FLUORESCENT_CYAN;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(10, 14, 26, 0.3)';
    ctx.fill();

    if (joystick.active) {
      const thumbX = jx + joystick.dx;
      const thumbY = jy + joystick.dy;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(thumbX, thumbY, thumbR, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.shadowColor = COLORS.FLUORESCENT_CYAN;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(jx, jy, thumbR, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.FLUORESCENT_CYAN;
      ctx.fill();
    }

    const buttons = [
      { x: w - 180, y: h - 200, r: 32, label: 'E', key: 'KeyE' },
      { x: w - 100, y: h - 120, r: 38, label: '↑', key: 'Space' },
      { x: w - 180, y: h - 60, r: 28, label: '||', key: 'Escape' },
    ];

    for (const btn of buttons) {
      const isPressed = this.input.isDown(btn.key);
      ctx.globalAlpha = isPressed ? 0.5 : 0.2;
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      ctx.fillStyle = isPressed ? COLORS.FLUORESCENT_CYAN : 'rgba(10, 14, 26, 0.4)';
      ctx.fill();
      ctx.strokeStyle = COLORS.FLUORESCENT_CYAN;
      ctx.lineWidth = isPressed ? 2 : 1;
      ctx.stroke();

      ctx.globalAlpha = isPressed ? 0.9 : 0.4;
      ctx.font = `500 ${btn.r * 0.7}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = isPressed ? COLORS.ABYSS_BLUE : COLORS.FLUORESCENT_CYAN;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x, btn.y);
    }

    ctx.restore();
  }
}

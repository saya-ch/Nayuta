import { PuzzleElement } from './puzzle-element.js';

export class PuzzleManager {
  constructor() {
    this.elements = [];
    this._elementMap = new Map();
    this._collidableCache = [];
    this._doorCache = [];
    this._dirty = true;
    this.solved = false;
    this.onSolve = null;
  }

  addElement(x, y, type, config = {}) {
    const element = new PuzzleElement(x, y, type, config);
    this.elements.push(element);
    if (element.id) {
      this._elementMap.set(element.id, element);
    }
    this._dirty = true;
    return element;
  }

  clear() {
    this.elements = [];
    this._elementMap.clear();
    this._collidableCache = [];
    this._doorCache = [];
    this._dirty = true;
    this.solved = false;
  }

  getElementById(id) {
    return this._elementMap.get(id) || null;
  }

  areAllSourcesActive(ids) {
    for (const id of ids) {
      const el = this._elementMap.get(id);
      if (!el || !el.activated) return false;
    }
    return true;
  }

  _rebuildCaches() {
    this._collidableCache = [];
    this._doorCache = [];
    for (const el of this.elements) {
      if (el.type === 'door') {
        this._doorCache.push(el);
        if (el.isSolid()) {
          this._collidableCache.push(el);
        }
      }
    }
    this._dirty = false;
  }

  getMirrorAt(x, y) {
    for (const el of this.elements) {
      if (el.type === 'lightMirror') {
        const dx = x - el.x;
        const dy = y - el.y;
        if (dx * dx + dy * dy < 400) {
          return el;
        }
      }
    }
    return null;
  }

  getLightTargetAt(x, y) {
    for (const el of this.elements) {
      if (el.type === 'lightTarget') {
        const dx = x - el.x;
        const dy = y - el.y;
        if (dx * dx + dy * dy < 400) {
          return el;
        }
      }
    }
    return null;
  }

  update(dt, playerX, playerY, playerOnGround) {
    for (const el of this.elements) {
      if (el.type === 'lightTarget') {
        el.activated = false;
      }
      if (el.type === 'lightMirror') {
        el.activated = false;
        el.config.lightDir = null;
      }
    }

    for (const el of this.elements) {
      el.update(dt, playerX, playerY, playerOnGround, this);
    }

    const allTargetsHit = this.elements
      .filter(e => e.type === 'lightTarget')
      .every(e => e.activated);

    if (allTargetsHit && this.elements.some(e => e.type === 'lightTarget')) {
      this.solved = true;
      if (this.onSolve) this.onSolve();
    }

    this._dirty = true;
  }

  tryInteract(playerX, playerY) {
    for (const el of this.elements) {
      const dx = playerX - el.x;
      const dy = playerY - el.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < 2025 && (el.type === 'switch' || el.type === 'lightMirror')) {
        el.interact(this);
        return true;
      }
    }
    return false;
  }

  render(ctx) {
    for (const el of this.elements) {
      el.render(ctx);
    }
  }

  getDoors() {
    if (this._dirty) this._rebuildCaches();
    return this._doorCache;
  }

  getCollidableElements() {
    if (this._dirty) this._rebuildCaches();
    return this._collidableCache;
  }
}

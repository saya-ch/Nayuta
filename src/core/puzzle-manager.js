import { PuzzleElement } from './puzzle-element.js';

export class PuzzleManager {
  constructor() {
    this.elements = [];
    this.solved = false;
    this.onSolve = null;
  }

  addElement(x, y, type, config = {}) {
    const element = new PuzzleElement(x, y, type, config);
    this.elements.push(element);
    return element;
  }

  clear() {
    this.elements = [];
    this.solved = false;
  }

  getElementById(id) {
    return this.elements.find(e => e.id === id);
  }

  areAllSourcesActive(ids) {
    for (const id of ids) {
      const el = this.getElementById(id);
      if (!el || !el.activated) return false;
    }
    return true;
  }

  getMirrorAt(x, y) {
    for (const el of this.elements) {
      if (el.type === 'lightMirror') {
        const dx = x - el.x;
        const dy = y - el.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
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
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
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
  }

  tryInteract(playerX, playerY) {
    for (const el of this.elements) {
      const dx = playerX - el.x;
      const dy = playerY - el.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 45 && (el.type === 'switch' || el.type === 'lightMirror')) {
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
    return this.elements.filter(e => e.type === 'door');
  }

  getCollidableElements() {
    return this.elements.filter(e => e.isSolid());
  }
}

const SAVE_KEY = 'nayuta_save';
const SETTINGS_KEY = 'nayuta_settings';

class SaveSystem {
  constructor() {
    this._data = null;
  }

  _getDefault() {
    return {
      currentDepth: 0,
      unlockedDepth: 0,
      totalAnchorsCollected: 0,
      levelProgress: {
        0: { anchorsCollected: 0, totalAnchors: 0, completed: false },
        1: { anchorsCollected: 0, totalAnchors: 0, completed: false },
        2: { anchorsCollected: 0, totalAnchors: 0, completed: false },
        3: { anchorsCollected: 0, totalAnchors: 0, completed: false },
      },
      endingsSeen: [],
      playTime: 0,
      deathCount: 0,
      shownHints: [],
      lastSaved: null,
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        this._data = JSON.parse(raw);
        const defaults = this._getDefault();
        for (const key of Object.keys(defaults)) {
          if (!(key in this._data)) {
            this._data[key] = defaults[key];
          }
        }
        if (!this._data.levelProgress) {
          this._data.levelProgress = defaults.levelProgress;
        }
        for (let i = 0; i < 4; i++) {
          if (!this._data.levelProgress[i]) {
            this._data.levelProgress[i] = { anchorsCollected: 0, totalAnchors: 0, completed: false };
          }
        }
        if (!this._data.endingsSeen) {
          this._data.endingsSeen = [];
        }
        if (!this._data.shownHints) {
          this._data.shownHints = [];
        }
      } else {
        this._data = this._getDefault();
      }
    } catch (e) {
      this._data = this._getDefault();
    }
    return this._data;
  }

  save(data) {
    try {
      this._data = { ...this._data, ...data, lastSaved: Date.now() };
      localStorage.setItem(SAVE_KEY, JSON.stringify(this._data));
      return true;
    } catch (e) {
      return false;
    }
  }

  getData() {
    if (!this._data) {
      this.load();
    }
    return this._data;
  }

  saveLevelProgress(depth, anchorsCollected, totalAnchors, completed) {
    const data = this.getData();
    data.levelProgress[depth] = { anchorsCollected, totalAnchors, completed };
    if (completed && depth + 1 <= 3) {
      data.unlockedDepth = Math.max(data.unlockedDepth, depth + 1);
    }
    data.totalAnchorsCollected = Object.values(data.levelProgress).reduce((sum, lp) => sum + (lp.anchorsCollected || 0), 0);
    this.save(data);
  }

  saveCurrentDepth(depth) {
    const data = this.getData();
    data.currentDepth = depth;
    this.save(data);
  }

  saveEnding(endingId) {
    const data = this.getData();
    if (!data.endingsSeen.includes(endingId)) {
      data.endingsSeen.push(endingId);
      this.save(data);
    }
  }

  addPlayTime(ms) {
    const data = this.getData();
    data.playTime = (data.playTime || 0) + ms;
    this.save(data);
  }

  addDeath() {
    const data = this.getData();
    data.deathCount = (data.deathCount || 0) + 1;
    this.save(data);
    return data.deathCount;
  }

  getDeathCount() {
    const data = this.getData();
    return data.deathCount || 0;
  }

  saveShownHints(hints) {
    const data = this.getData();
    data.shownHints = hints;
    this.save(data);
  }

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  hasCompletedGame() {
    const data = this.getData();
    return data.levelProgress[3] && data.levelProgress[3].completed;
  }

  getUnlockedDepth() {
    const data = this.getData();
    return data.unlockedDepth || 0;
  }

  clearSave() {
    localStorage.removeItem(SAVE_KEY);
    this._data = this._getDefault();
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  formatPlayTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}

export const saveSystem = new SaveSystem();

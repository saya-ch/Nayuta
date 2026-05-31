export class ResourceManager {
  constructor() {
    this._cache = new Map();
    this._loading = new Map();
    this._preloadQueue = [];
    this._isPreloading = false;
  }

  get(key) {
    return this._cache.get(key) || null;
  }

  set(key, resource) {
    this._cache.set(key, resource);
  }

  has(key) {
    return this._cache.has(key);
  }

  delete(key) {
    const resource = this._cache.get(key);
    if (resource && typeof resource.dispose === 'function') {
      resource.dispose();
    }
    this._cache.delete(key);
  }

  clear() {
    for (const [, resource] of this._cache) {
      if (resource && typeof resource.dispose === 'function') {
        resource.dispose();
      }
    }
    this._cache.clear();
    this._loading.clear();
    this._preloadQueue = [];
    this._isPreloading = false;
  }

  async load(key, loader) {
    if (this._cache.has(key)) {
      return this._cache.get(key);
    }

    if (this._loading.has(key)) {
      return this._loading.get(key);
    }

    const promise = loader().then(resource => {
      this._cache.set(key, resource);
      this._loading.delete(key);
      return resource;
    }).catch(err => {
      this._loading.delete(key);
      console.warn(`ResourceManager: Failed to load "${key}"`, err);
      return null;
    });

    this._loading.set(key, promise);
    return promise;
  }

  preload(keys, loaderFn) {
    for (const key of keys) {
      if (!this._cache.has(key) && !this._loading.has(key)) {
        this._preloadQueue.push({ key, loader: () => loaderFn(key) });
      }
    }

    if (!this._isPreloading) {
      this._processPreloadQueue();
    }
  }

  async _processPreloadQueue() {
    this._isPreloading = true;

    while (this._preloadQueue.length > 0) {
      const item = this._preloadQueue.shift();
      if (this._cache.has(item.key)) continue;

      await this.load(item.key, item.loader);

      if (this._preloadQueue.length > 0) {
        await new Promise(r => setTimeout(r, 4));
      }
    }

    this._isPreloading = false;
  }

  getLoadingCount() {
    return this._loading.size + this._preloadQueue.length;
  }

  isReady() {
    return this._loading.size === 0 && this._preloadQueue.length === 0;
  }

  getCacheSize() {
    return this._cache.size;
  }

  getCacheKeys() {
    return Array.from(this._cache.keys());
  }

  releasePattern(pattern) {
    const keysToRemove = [];
    for (const key of this._cache.keys()) {
      if (key.startsWith(pattern)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      this.delete(key);
    }
    return keysToRemove.length;
  }
}

export const resourceManager = new ResourceManager();

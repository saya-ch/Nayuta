export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.initialized = false;
    this.currentBGM = null;
    this.bgmNodes = [];
    this.ambientNodes = [];
    this.muted = false;
    this.volume = 0.5;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.3;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.2;
      this.ambientGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('AudioSystem: Web Audio API not available', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
  }

  stopBGM() {
    for (const node of this.bgmNodes) {
      try {
        if (node.gain) {
          node.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        }
        if (node.stop) {
          node.stop(this.ctx.currentTime + 1.5);
        }
        if (node.disconnect) {
          node.disconnect();
        }
      } catch (e) { /* ignore */ }
    }
    this.bgmNodes = [];
    this.currentBGM = null;
  }

  stopAmbient() {
    for (const node of this.ambientNodes) {
      try {
        if (node.gain) {
          node.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        }
        if (node.stop) {
          node.stop(this.ctx.currentTime + 1);
        }
        if (node.disconnect) {
          node.disconnect();
        }
      } catch (e) { /* ignore */ }
    }
    this.ambientNodes = [];
  }

  playBGM(depthIndex) {
    if (!this.initialized) return;
    this.resume();

    const bgmKey = `depth_${depthIndex}`;
    if (this.currentBGM === bgmKey) return;

    this.stopBGM();
    this.currentBGM = bgmKey;

    switch (depthIndex) {
      case -1:
        this._playMenuBGM();
        break;
      case 0:
        this._playDepth1BGM();
        break;
      case 1:
        this._playDepth2BGM();
        break;
      case 2:
        this._playDepth3BGM();
        break;
      case 3:
        this._playDepth4BGM();
        break;
    }
  }

  _createDrone(freq, detune, gain, type = 'sine') {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gainNode.gain.value = 0;
    gainNode.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 2);
    osc.connect(gainNode);
    gainNode.connect(this.bgmGain);
    osc.start();
    this.bgmNodes.push(osc, gainNode);
    gainNode._isGain = true;
    this.bgmNodes.push(gainNode);
    return { osc, gainNode };
  }

  _createFilteredNoise(filterFreq, filterQ, gain) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0;
    gainNode.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 2);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.bgmGain);
    source.start();

    this.bgmNodes.push(source, filter, gainNode);
    return { source, filter, gainNode };
  }

  _playMenuBGM() {
    this._createDrone(55, 0, 0.15, 'sine');
    this._createDrone(82.5, 5, 0.08, 'sine');
    this._createDrone(110, -3, 0.05, 'triangle');
    this._createFilteredNoise(200, 1, 0.03);
  }

  _playDepth1BGM() {
    this._createDrone(65, 0, 0.12, 'sine');
    this._createDrone(98, 3, 0.06, 'sine');
    this._createDrone(130, -2, 0.04, 'triangle');
    this._createDrone(196, 7, 0.02, 'sine');
    this._createFilteredNoise(300, 0.5, 0.02);
  }

  _playDepth2BGM() {
    this._createDrone(55, 0, 0.1, 'sine');
    this._createDrone(73, -5, 0.08, 'sine');
    this._createDrone(110, 8, 0.04, 'triangle');
    this._createDrone(146, -3, 0.03, 'sawtooth');
    this._createFilteredNoise(250, 2, 0.04);
  }

  _playDepth3BGM() {
    this._createDrone(41, 0, 0.1, 'sine');
    this._createDrone(55, 10, 0.07, 'sawtooth');
    this._createDrone(82, -8, 0.05, 'triangle');
    this._createDrone(123, 5, 0.03, 'square');
    this._createFilteredNoise(180, 3, 0.06);
  }

  _playDepth4BGM() {
    this._createDrone(33, 0, 0.08, 'sine');
    this._createDrone(44, 15, 0.06, 'sawtooth');
    this._createDrone(66, -12, 0.04, 'square');
    this._createDrone(99, 8, 0.03, 'sawtooth');
    this._createFilteredNoise(120, 5, 0.08);
    this._createFilteredNoise(60, 8, 0.04);
  }

  playAmbient(depthIndex) {
    if (!this.initialized) return;
    this.resume();
    this.stopAmbient();

    switch (depthIndex) {
      case 0:
        this._playDepth1Ambient();
        break;
      case 1:
        this._playDepth2Ambient();
        break;
      case 2:
        this._playDepth3Ambient();
        break;
      case 3:
        this._playDepth4Ambient();
        break;
    }
  }

  _createAmbientNoise(filterFreq, filterQ, gain, lfoFreq, lfoDepth) {
    const bufferSize = this.ctx.sampleRate * 6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    if (lfoFreq) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = lfoFreq;
      lfoGain.gain.value = lfoDepth || 50;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.ambientNodes.push(lfo, lfoGain);
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0;
    gainNode.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 3);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ambientGain);
    source.start();

    this.ambientNodes.push(source, filter, gainNode);
  }

  _playDepth1Ambient() {
    this._createAmbientNoise(400, 0.3, 0.15, 0.1, 30);
    this._createAmbientNoise(800, 0.5, 0.05, 0.05, 50);
  }

  _playDepth2Ambient() {
    this._createAmbientNoise(300, 0.4, 0.12, 0.08, 40);
    this._createAmbientNoise(600, 0.6, 0.06, 0.15, 60);
  }

  _playDepth3Ambient() {
    this._createAmbientNoise(200, 0.5, 0.15, 0.2, 50);
    this._createAmbientNoise(500, 0.8, 0.08, 0.3, 80);
  }

  _playDepth4Ambient() {
    this._createAmbientNoise(100, 0.8, 0.2, 0.5, 40);
    this._createAmbientNoise(300, 1.0, 0.1, 0.8, 100);
    this._createAmbientNoise(50, 1.2, 0.08, 1.0, 20);
  }

  playSFX(type) {
    if (!this.initialized) return;
    this.resume();

    switch (type) {
      case 'anchorCollect':
        this._playAnchorCollect();
        break;
      case 'switchToggle':
        this._playSwitchToggle();
        break;
      case 'jump':
        this._playJump();
        break;
      case 'land':
        this._playLand();
        break;
      case 'mirrorRotate':
        this._playMirrorRotate();
        break;
      case 'doorOpen':
        this._playDoorOpen();
        break;
      case 'fragmentDiscover':
        this._playFragmentDiscover();
        break;
      case 'levelComplete':
        this._playLevelComplete();
        break;
      case 'narrativeEvent':
        this._playNarrativeEvent();
        break;
      case 'erosionGlitch':
        this._playErosionGlitch();
        break;
      case 'menuSelect':
        this._playMenuSelect();
        break;
      case 'menuConfirm':
        this._playMenuConfirm();
        break;
      case 'playerDeath':
        this._playPlayerDeath();
        break;
      case 'playerRespawn':
        this._playPlayerRespawn();
        break;
    }
  }

  _playTone(freq, duration, gain, type = 'sine', attack = 0.01, decay = 0.1) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.value = 0;
    gainNode.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.1);
  }

  _playAnchorCollect() {
    this._playTone(880, 0.3, 0.15, 'sine', 0.01, 0.1);
    this._playTone(1320, 0.4, 0.1, 'sine', 0.05, 0.15);
    this._playTone(1760, 0.5, 0.06, 'triangle', 0.1, 0.2);
  }

  _playSwitchToggle() {
    this._playTone(220, 0.15, 0.12, 'square', 0.005, 0.05);
    this._playTone(330, 0.1, 0.08, 'square', 0.02, 0.05);
  }

  _playJump() {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 200;
    osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.1);
    gainNode.gain.value = 0.08;
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  _playLand() {
    this._playTone(80, 0.1, 0.1, 'triangle', 0.005, 0.03);
    this._playTone(60, 0.08, 0.06, 'sine', 0.005, 0.02);
  }

  _playMirrorRotate() {
    this._playTone(440, 0.2, 0.06, 'triangle', 0.01, 0.08);
    this._playTone(550, 0.15, 0.04, 'sine', 0.05, 0.06);
  }

  _playDoorOpen() {
    this._playTone(110, 0.5, 0.1, 'sine', 0.01, 0.2);
    this._playTone(165, 0.6, 0.08, 'triangle', 0.1, 0.25);
    this._playTone(220, 0.7, 0.05, 'sine', 0.2, 0.3);
  }

  _playFragmentDiscover() {
    this._playTone(660, 0.4, 0.1, 'sine', 0.01, 0.15);
    this._playTone(990, 0.5, 0.07, 'triangle', 0.08, 0.2);
    this._playTone(1320, 0.6, 0.04, 'sine', 0.15, 0.25);
  }

  _playLevelComplete() {
    const notes = [440, 554, 659, 880];
    for (let i = 0; i < notes.length; i++) {
      setTimeout(() => {
        this._playTone(notes[i], 0.8, 0.12, 'sine', 0.01, 0.3);
      }, i * 150);
    }
  }

  _playNarrativeEvent() {
    this._playTone(220, 0.8, 0.06, 'sine', 0.1, 0.3);
    this._playTone(330, 1.0, 0.04, 'triangle', 0.2, 0.4);
  }

  _playErosionGlitch() {
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0.08;
    source.connect(gainNode);
    gainNode.connect(this.sfxGain);
    source.start();
  }

  _playMenuSelect() {
    this._playTone(440, 0.08, 0.06, 'sine', 0.005, 0.03);
  }

  _playPlayerDeath() {
    this._playTone(120, 1.0, 0.15, 'sawtooth', 0.01, 0.5);
    this._playTone(80, 1.2, 0.1, 'sine', 0.1, 0.6);
    setTimeout(() => {
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = this.ctx.createGain();
      gainNode.gain.value = 0.1;
      source.connect(gainNode);
      gainNode.connect(this.sfxGain);
      source.start();
    }, 200);
  }

  _playPlayerRespawn() {
    this._playTone(220, 0.6, 0.08, 'sine', 0.1, 0.3);
    this._playTone(440, 0.8, 0.06, 'triangle', 0.2, 0.4);
    this._playTone(660, 1.0, 0.04, 'sine', 0.4, 0.5);
  }

  _playMenuConfirm() {
    this._playTone(523, 0.12, 0.08, 'sine', 0.005, 0.04);
    this._playTone(659, 0.15, 0.06, 'sine', 0.04, 0.05);
  }

  destroy() {
    this.stopBGM();
    this.stopAmbient();
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

export const audioSystem = new AudioSystem();

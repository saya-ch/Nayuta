import { saveSystem } from './save-system.js';

export class NarrativeSystem {
  constructor() {
    this.fragments = [];
    this.activeEvents = [];
    this.discoveredFragments = new Set();
    this.eventTriggers = [];
    this.time = 0;
    this.currentEvent = null;
    this.eventAlpha = 0;
    this.eventTimer = 0;
    this.lightFlares = [];
    this.whisperParticles = [];
    this.storyProgress = 0;
  }

  clear() {
    this.fragments = [];
    this.activeEvents = [];
    this.eventTriggers = [];
    this.lightFlares = [];
    this.whisperParticles = [];
    this.currentEvent = null;
    this.eventAlpha = 0;
    this.eventTimer = 0;
  }

  loadLevelNarrative(depthIndex) {
    this.clear();
    const narrativeData = NarrativeData.getNarrative(depthIndex);
    const savedFragments = saveSystem.getDiscoveredFragments();
    this.fragments = narrativeData.fragments.map(f => ({
      ...f,
      discovered: savedFragments.includes(f.id),
      pulse: Math.random() * Math.PI * 2,
      revealAlpha: 0,
    }));
    for (const f of this.fragments) {
      if (f.discovered) this.discoveredFragments.add(f.id);
    }
    this.eventTriggers = narrativeData.eventTriggers.map(e => ({
      ...e,
      triggered: false,
    }));
  }

  update(dt, playerX, playerY, anchorCount, totalAnchors) {
    this.time += dt;
    this.storyProgress = anchorCount / Math.max(1, totalAnchors);

    for (const frag of this.fragments) {
      if (frag.discovered) continue;
      const dx = playerX - frag.x;
      const dy = playerY - frag.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 50) {
        frag.revealAlpha = Math.min(1, frag.revealAlpha + dt * 0.003);
      } else {
        frag.revealAlpha = Math.max(0, frag.revealAlpha - dt * 0.002);
      }

      if (dist < 30 && !frag.discovered) {
        frag.discovered = true;
        this.discoveredFragments.add(frag.id);
        saveSystem.addDiscoveredFragment(frag.id);
        this._triggerFragmentDiscovery(frag);
      }

      frag.pulse += dt * 0.003;
    }

    for (const trigger of this.eventTriggers) {
      if (trigger.triggered) continue;
      const dx = playerX - trigger.x;
      const dy = playerY - trigger.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < trigger.radius) {
        if (trigger.condition === 'proximity' ||
            (trigger.condition === 'anchorCount' && anchorCount >= trigger.requiredAnchors)) {
          trigger.triggered = true;
          this._triggerNarrativeEvent(trigger);
        }
      }
    }

    if (this.currentEvent) {
      this.eventTimer += dt;
      const duration = this.currentEvent.duration || 3000;
      if (this.eventTimer < duration * 0.3) {
        this.eventAlpha = this.eventTimer / (duration * 0.3);
      } else if (this.eventTimer < duration * 0.7) {
        this.eventAlpha = 1;
      } else {
        this.eventAlpha = 1 - (this.eventTimer - duration * 0.7) / (duration * 0.3);
      }
      if (this.eventTimer >= duration) {
        this.currentEvent = null;
        this.eventAlpha = 0;
        this.eventTimer = 0;
      }
    }

    for (let i = this.lightFlares.length - 1; i >= 0; i--) {
      const flare = this.lightFlares[i];
      flare.age += dt;
      flare.alpha = Math.max(0, 1 - flare.age / flare.duration);
      flare.x += flare.vx * (dt / 1000);
      flare.y += flare.vy * (dt / 1000);
      if (flare.alpha <= 0) {
        this.lightFlares[i] = this.lightFlares[this.lightFlares.length - 1];
        this.lightFlares.pop();
      }
    }

    for (let i = this.whisperParticles.length - 1; i >= 0; i--) {
      const wp = this.whisperParticles[i];
      wp.age += dt;
      wp.alpha = Math.max(0, 1 - wp.age / wp.duration) * 0.4;
      wp.x += wp.vx * (dt / 1000);
      wp.y += wp.vy * (dt / 1000);
      wp.vy -= 0.02;
      if (wp.alpha <= 0) {
        this.whisperParticles[i] = this.whisperParticles[this.whisperParticles.length - 1];
        this.whisperParticles.pop();
      }
    }
  }

  _triggerFragmentDiscovery(fragment) {
    const flareCount = 8;
    for (let i = 0; i < flareCount; i++) {
      const angle = (i / flareCount) * Math.PI * 2;
      this.lightFlares.push({
        x: fragment.x,
        y: fragment.y,
        vx: Math.cos(angle) * 40,
        vy: Math.sin(angle) * 40,
        alpha: 1,
        age: 0,
        duration: 800,
        size: 3 + Math.random() * 2,
        color: fragment.color || '0, 255, 212',
      });
    }

    const whisperCount = 5;
    for (let i = 0; i < whisperCount; i++) {
      this.whisperParticles.push({
        x: fragment.x + (Math.random() - 0.5) * 20,
        y: fragment.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 20 - 10,
        alpha: 0.4,
        age: 0,
        duration: 2000 + Math.random() * 1000,
        size: 2 + Math.random() * 3,
        symbol: fragment.symbol || '◇',
      });
    }
  }

  _triggerNarrativeEvent(trigger) {
    this.currentEvent = {
      type: trigger.eventType,
      data: trigger.data,
      duration: trigger.duration || 3000,
    };
    this.eventTimer = 0;
    this.eventAlpha = 0;
  }

  renderFragments(ctx) {
    for (const frag of this.fragments) {
      this._renderFragment(ctx, frag);
    }
  }

  _renderFragment(ctx, frag) {
    const pulse = Math.sin(frag.pulse) * 0.3 + 0.7;
    const baseAlpha = frag.discovered ? 0.15 : (0.3 + pulse * 0.2);
    const revealAlpha = frag.revealAlpha;

    ctx.save();
    ctx.translate(frag.x, frag.y);

    if (!frag.discovered) {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
      glow.addColorStop(0, `rgba(${frag.color || '0, 255, 212'}, ${0.08 * pulse})`);
      glow.addColorStop(1, `rgba(${frag.color || '0, 255, 212'}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(-35, -35, 70, 70);

      const floatY = Math.sin(this.time * 0.002 + frag.x * 0.01) * 4;
      ctx.translate(0, floatY);

      ctx.beginPath();
      const s = frag.size || 8;
      const points = frag.shape === 'diamond' ? 4 : frag.shape === 'triangle' ? 3 : 6;
      for (let i = 0; i < points; i++) {
        const a = (i / points) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? s : s * 0.5;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${frag.color || '0, 255, 212'}, ${baseAlpha})`;
      ctx.shadowColor = `rgba(${frag.color || '0, 255, 212'}, 0.8)`;
      ctx.shadowBlur = 12 * pulse;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = `rgba(${frag.color || '0, 255, 212'}, ${baseAlpha * 0.6})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else {
      const fadeAlpha = 0.15 + pulse * 0.05;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${frag.color || '0, 255, 212'}, ${fadeAlpha})`;
      ctx.fill();
    }

    if (revealAlpha > 0 && !frag.discovered) {
      ctx.globalAlpha = revealAlpha * 0.8;
      ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = `rgba(${frag.color || '0, 255, 212'}, 0.7)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frag.hint || '', 0, -20);
    }

    ctx.restore();
  }

  renderLightFlares(ctx) {
    for (const flare of this.lightFlares) {
      ctx.save();
      ctx.globalAlpha = flare.alpha;
      ctx.beginPath();
      ctx.arc(flare.x, flare.y, flare.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${flare.color}, ${flare.alpha})`;
      ctx.shadowColor = `rgba(${flare.color}, 0.5)`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  renderWhisperParticles(ctx) {
    for (const wp of this.whisperParticles) {
      ctx.save();
      ctx.globalAlpha = wp.alpha;
      ctx.font = `${wp.size * 3}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(0, 255, 212, 0.3)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(wp.symbol, wp.x, wp.y);
      ctx.restore();
    }
  }

  renderNarrativeEvent(ctx, w, h, depth) {
    if (!this.currentEvent || this.eventAlpha <= 0) return;

    const event = this.currentEvent;
    ctx.save();
    ctx.globalAlpha = this.eventAlpha;

    switch (event.type) {
      case 'memoryFlash':
        this._renderMemoryFlash(ctx, w, h, event.data, depth);
        break;
      case 'shadowWhisper':
        this._renderShadowWhisper(ctx, w, h, event.data, depth);
        break;
      case 'realityBleed':
        this._renderRealityBleed(ctx, w, h, event.data, depth);
        break;
      case 'ancientEcho':
        this._renderAncientEcho(ctx, w, h, event.data, depth);
        break;
    }

    ctx.restore();
  }

  _renderMemoryFlash(ctx, w, h, data, depth) {
    const cx = w / 2;
    const cy = h / 2;
    const pulse = Math.sin(this.time * 0.005) * 0.3 + 0.7;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.4);
    gradient.addColorStop(0, `rgba(0, 255, 212, ${0.06 * pulse * this.eventAlpha})`);
    gradient.addColorStop(0.3, `rgba(0, 136, 255, ${0.03 * pulse * this.eventAlpha})`);
    gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '300 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(0, 255, 212, ${0.5 * this.eventAlpha})`;
    ctx.shadowColor = '#00FFD4';
    ctx.shadowBlur = 20;
    ctx.fillText(data.text, cx, cy);
    ctx.shadowBlur = 0;

    ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(107, 107, 141, ${0.4 * this.eventAlpha})`;
    ctx.fillText(data.subtext || '', cx, cy + 28);
  }

  _renderShadowWhisper(ctx, w, h, data, depth) {
    const pulse = Math.sin(this.time * 0.003) * 0.5 + 0.5;

    for (let i = 0; i < 3; i++) {
      const cx = w * (0.2 + i * 0.3);
      const cy = h * (0.3 + Math.sin(this.time * 0.001 + i) * 0.1);
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      gradient.addColorStop(0, `rgba(255, 107, 53, ${0.04 * pulse * this.eventAlpha})`);
      gradient.addColorStop(1, 'rgba(10, 14, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - 80, cy - 80, 160, 160);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '300 14px "Segoe UI", system-ui, sans-serif';
    const glitchOffset = (Math.random() - 0.5) * 3;
    ctx.fillStyle = `rgba(255, 107, 53, ${0.35 * this.eventAlpha})`;
    ctx.fillText(data.text, w / 2 + glitchOffset, h * 0.45);

    ctx.font = '300 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(107, 107, 141, ${0.3 * this.eventAlpha})`;
    ctx.fillText(data.subtext || '', w / 2, h * 0.52);
  }

  _renderRealityBleed(ctx, w, h, data, depth) {
    const pulse = Math.sin(this.time * 0.008) * 0.5 + 0.5;

    ctx.fillStyle = `rgba(255, 0, 68, ${0.03 * pulse * this.eventAlpha})`;
    ctx.fillRect(0, 0, w, h);

    const lineCount = 5;
    for (let i = 0; i < lineCount; i++) {
      const y = h * (0.2 + i * 0.15);
      const xOff = Math.sin(this.time * 0.004 + i * 2) * 50;
      ctx.strokeStyle = `rgba(255, 107, 53, ${0.1 * this.eventAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.1 + xOff, y);
      ctx.lineTo(w * 0.9 + xOff, y);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(255, 107, 53, ${0.4 * this.eventAlpha})`;
    ctx.shadowColor = '#FF6B35';
    ctx.shadowBlur = 15;
    ctx.fillText(data.text, w / 2, h * 0.4);
    ctx.shadowBlur = 0;

    ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(107, 107, 141, ${0.35 * this.eventAlpha})`;
    ctx.fillText(data.subtext || '', w / 2, h * 0.48);
  }

  _renderAncientEcho(ctx, w, h, data, depth) {
    const pulse = Math.sin(this.time * 0.002) * 0.5 + 0.5;
    const cx = w / 2;
    const cy = h / 2;

    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const r = 50 + i * 40 + pulse * 20;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 212, ${0.06 * this.eventAlpha * (1 - i * 0.3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '300 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(232, 230, 240, ${0.5 * this.eventAlpha})`;
    ctx.shadowColor = '#00FFD4';
    ctx.shadowBlur = 10;
    ctx.fillText(data.text, cx, cy);
    ctx.shadowBlur = 0;

    ctx.font = '300 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = `rgba(107, 107, 141, ${0.4 * this.eventAlpha})`;
    ctx.fillText(data.subtext || '', cx, cy + 25);
  }

  getDiscoveredCount() {
    return this.discoveredFragments.size;
  }

  getTotalFragments() {
    return this.fragments.length;
  }
}

class NarrativeData {
  static getNarrative(depthIndex) {
    switch (depthIndex) {
      case 0: return NarrativeData.DEPTH_1;
      case 1: return NarrativeData.DEPTH_2;
      case 2: return NarrativeData.DEPTH_3;
      case 3: return NarrativeData.DEPTH_4;
      default: return NarrativeData.DEPTH_1;
    }
  }

  static get DEPTH_1() {
    return {
      fragments: [
        { id: 'd1_f1', x: 150, y: 290, hint: '触碰记忆...', text: '曾经这里有光', shape: 'diamond', color: '0, 255, 212', size: 9 },
        { id: 'd1_f2', x: 500, y: 240, hint: '碎片在低语', text: '她记得星星的形状', shape: 'diamond', color: '0, 255, 212', size: 8 },
        { id: 'd1_f3', x: 750, y: 300, hint: '记忆在呼吸', text: '每一个光点都是一段过往', shape: 'triangle', color: '0, 136, 255', size: 10 },
        { id: 'd1_f4', x: 1060, y: 280, hint: '聆听深渊', text: '深渊并非一直如此寂静', shape: 'diamond', color: '0, 255, 212', size: 7 },
      ],
      eventTriggers: [
        {
          x: 300, y: 350, radius: 60, condition: 'proximity',
          eventType: 'memoryFlash',
          data: { text: '这些记忆...不属于人类', subtext: '浅层记忆 · 第一道裂缝' },
          duration: 3500,
        },
        {
          x: 900, y: 350, radius: 50, condition: 'anchorCount', requiredAnchors: 3,
          eventType: 'ancientEcho',
          data: { text: '你听到了远方的回响', subtext: '来自更深处的呼唤' },
          duration: 3000,
        },
      ],
    };
  }

  static get DEPTH_2() {
    return {
      fragments: [
        { id: 'd2_f1', x: 200, y: 280, hint: '记忆在碎裂', text: '时间在这里是弯曲的', shape: 'triangle', color: '138, 43, 226', size: 9 },
        { id: 'd2_f2', x: 450, y: 260, hint: '深渊在注视', text: '那些眼睛从未闭合', shape: 'diamond', color: '138, 43, 226', size: 8 },
        { id: 'd2_f3', x: 700, y: 300, hint: '现实在偏移', text: '记忆的颜色开始改变', shape: 'triangle', color: '0, 136, 255', size: 10 },
        { id: 'd2_f4', x: 1000, y: 270, hint: '聆听虚空', text: '虚空中有低语', shape: 'diamond', color: '138, 43, 226', size: 7 },
      ],
      eventTriggers: [
        {
          x: 350, y: 350, radius: 55, condition: 'proximity',
          eventType: 'shadowWhisper',
          data: { text: '你不属于这里', subtext: '中层记忆 · 影子的呢喃' },
          duration: 3000,
        },
        {
          x: 800, y: 350, radius: 50, condition: 'anchorCount', requiredAnchors: 3,
          eventType: 'memoryFlash',
          data: { text: '记忆的碎片在重组', subtext: '但它们拼出的不是你的故事' },
          duration: 3500,
        },
      ],
    };
  }

  static get DEPTH_3() {
    return {
      fragments: [
        { id: 'd3_f1', x: 150, y: 300, hint: '现实在崩塌', text: '光在这里会灼伤', shape: 'triangle', color: '255, 107, 53', size: 9 },
        { id: 'd3_f2', x: 400, y: 280, hint: '深渊在呼吸', text: '深渊的心跳越来越快', shape: 'diamond', color: '255, 107, 53', size: 8 },
        { id: 'd3_f3', x: 700, y: 290, hint: '记忆在燃烧', text: '这些记忆正在被吞噬', shape: 'triangle', color: '255, 0, 68', size: 10 },
      ],
      eventTriggers: [
        {
          x: 250, y: 350, radius: 50, condition: 'proximity',
          eventType: 'realityBleed',
          data: { text: '现实正在渗血', subtext: '深层记忆 · 边界的崩塌' },
          duration: 2500,
        },
        {
          x: 850, y: 350, radius: 45, condition: 'anchorCount', requiredAnchors: 2,
          eventType: 'shadowWhisper',
          data: { text: '它在看着你', subtext: '从时间的尽头' },
          duration: 3000,
        },
      ],
    };
  }

  static get DEPTH_4() {
    return {
      fragments: [
        { id: 'd4_f1', x: 200, y: 300, hint: '真相在等待', text: '你终于看到了', shape: 'diamond', color: '255, 0, 68', size: 8 },
        { id: 'd4_f2', x: 600, y: 280, hint: '深渊的尽头', text: '深渊的底部是另一片天空', shape: 'triangle', color: '255, 0, 68', size: 9 },
        { id: 'd4_f3', x: 1000, y: 310, hint: '选择在逼近', text: '凝视与被凝视之间', shape: 'diamond', color: '255, 107, 53', size: 7 },
      ],
      eventTriggers: [
        {
          x: 350, y: 350, radius: 40, condition: 'proximity',
          eventType: 'realityBleed',
          data: { text: '你已无法回头', subtext: '最深层 · 凝视深渊' },
          duration: 2500,
        },
        {
          x: 800, y: 350, radius: 45, condition: 'anchorCount', requiredAnchors: 2,
          eventType: 'ancientEcho',
          data: { text: '那由他...不可计数之遥远', subtext: '这就是你的名字的含义' },
          duration: 4000,
        },
      ],
    };
  }
}

export class LevelData {
  static getLevel(levelIndex) {
    switch (levelIndex) {
      case 0: return LevelData.LEVEL_1;
      case 1: return LevelData.LEVEL_2;
      case 2: return LevelData.LEVEL_3;
      case 3: return LevelData.LEVEL_4;
      default: return LevelData.LEVEL_1;
    }
  }

  static get LEVEL_1() {
    return {
      name: '浅层记忆',
      subtitle: '蓝色童话',
      depthIndex: 0,
      bgColor: '#1A2744',
      bgGradientStops: [
        { pos: 0, color: '#0F1A2E' },
        { pos: 0.4, color: '#1A2744' },
        { pos: 0.7, color: '#0F2040' },
        { pos: 1, color: '#0A0E1A' },
      ],
      platformColor: '#1A2744',
      platformEdgeColor: 'rgba(0, 255, 212, 0.12)',
      platformGlowColor: 'rgba(0, 255, 212, 0.06)',
      fogColor: '26, 39, 68',
      fogAlpha: 0.12,
      starCount: 120,
      ambientParticleColor: 'rgba(0, 255, 212, 0.15)',
      ambientParticleCount: 40,
      playerStart: { x: 80, y: 400 },
      platforms: [
        { x: 0, y: 500, w: 350, h: 40 },
        { x: 400, y: 500, w: 200, h: 40 },
        { x: 660, y: 500, w: 200, h: 40 },
        { x: 920, y: 500, w: 360, h: 40 },
        { x: 180, y: 410, w: 100, h: 14 },
        { x: 350, y: 350, w: 90, h: 14 },
        { x: 520, y: 390, w: 110, h: 14 },
        { x: 700, y: 340, w: 100, h: 14 },
        { x: 880, y: 380, w: 80, h: 14 },
        { x: 1020, y: 320, w: 100, h: 14 },
        { x: 1150, y: 400, w: 90, h: 14 },
      ],
      anchors: [
        { x: 220, y: 380 },
        { x: 390, y: 320 },
        { x: 570, y: 360 },
        { x: 750, y: 310 },
        { x: 1060, y: 290 },
      ],
      puzzleElements: [
        {
          type: 'switch',
          x: 230,
          y: 402,
          config: { id: 'l1_sw1', targetIds: ['l1_door1'] },
        },
        {
          type: 'pressurePlate',
          x: 560,
          y: 382,
          config: { id: 'l1_pp1', targetIds: ['l1_door1'] },
        },
        {
          type: 'lightSource',
          x: 720,
          y: 332,
          config: {
            id: 'l1_ls1',
            lightDir: { x: 1, y: -0.3 },
            lightRange: 350,
          },
        },
        {
          type: 'lightMirror',
          x: 920,
          y: 332,
          config: { id: 'l1_lm1', angle: 150 },
        },
        {
          type: 'lightTarget',
          x: 920,
          y: 240,
          config: { id: 'l1_lt1' },
        },
        {
          type: 'door',
          x: 1240,
          y: 500,
          config: { id: 'l1_door1', targetIds: ['l1_sw1', 'l1_pp1'] },
        },
      ],
      decorations: [
        { type: 'crystal', x: 50, y: 490, size: 20 },
        { type: 'crystal', x: 310, y: 490, size: 15 },
        { type: 'crystal', x: 640, y: 490, size: 18 },
        { type: 'crystal', x: 1100, y: 490, size: 22 },
        { type: 'glowOrb', x: 150, y: 300, size: 8, color: 'cyan' },
        { type: 'glowOrb', x: 450, y: 250, size: 6, color: 'cyan' },
        { type: 'glowOrb', x: 800, y: 280, size: 10, color: 'cyan' },
        { type: 'glowOrb', x: 1000, y: 220, size: 7, color: 'white' },
        { type: 'rune', x: 200, y: 498, symbol: 0 },
        { type: 'rune', x: 500, y: 498, symbol: 1 },
        { type: 'rune', x: 900, y: 498, symbol: 2 },
      ],
      completionText: '浅层记忆之门已开启',
      completionSubtext: '更深处的记忆在呼唤...',
    };
  }

  static get LEVEL_2() {
    return {
      name: '中层记忆',
      subtitle: '紫色神秘',
      depthIndex: 1,
      bgColor: '#1A1035',
      bgGradientStops: [
        { pos: 0, color: '#0F0A20' },
        { pos: 0.4, color: '#1A1035' },
        { pos: 0.7, color: '#150D2A' },
        { pos: 1, color: '#0A0812' },
      ],
      platformColor: '#1A1035',
      platformEdgeColor: 'rgba(0, 255, 212, 0.1)',
      platformGlowColor: 'rgba(0, 136, 255, 0.05)',
      fogColor: '26, 16, 53',
      fogAlpha: 0.18,
      starCount: 80,
      ambientParticleColor: 'rgba(0, 136, 255, 0.12)',
      ambientParticleCount: 30,
      playerStart: { x: 80, y: 400 },
      platforms: [
        { x: 0, y: 500, w: 250, h: 40 },
        { x: 300, y: 500, w: 180, h: 40 },
        { x: 530, y: 500, w: 150, h: 40 },
        { x: 740, y: 500, w: 200, h: 40 },
        { x: 1000, y: 500, w: 280, h: 40 },
      ],
      anchors: [
        { x: 150, y: 300 },
        { x: 400, y: 280 },
        { x: 650, y: 320 },
      ],
      puzzleElements: [],
      decorations: [],
      completionText: '中层记忆之门已开启',
      completionSubtext: '黑暗在逼近...',
    };
  }

  static get LEVEL_3() {
    return {
      name: '深层记忆',
      subtitle: '红色压迫',
      depthIndex: 2,
      bgColor: '#2A0A1A',
      bgGradientStops: [
        { pos: 0, color: '#1A0510' },
        { pos: 0.4, color: '#2A0A1A' },
        { pos: 0.7, color: '#200815' },
        { pos: 1, color: '#0A0005' },
      ],
      platformColor: '#2A0A1A',
      platformEdgeColor: 'rgba(255, 107, 53, 0.1)',
      platformGlowColor: 'rgba(255, 0, 68, 0.04)',
      fogColor: '42, 10, 26',
      fogAlpha: 0.22,
      starCount: 40,
      ambientParticleColor: 'rgba(255, 107, 53, 0.1)',
      ambientParticleCount: 20,
      playerStart: { x: 80, y: 400 },
      platforms: [
        { x: 0, y: 500, w: 200, h: 40 },
        { x: 280, y: 500, w: 150, h: 40 },
        { x: 500, y: 500, w: 120, h: 40 },
        { x: 680, y: 500, w: 180, h: 40 },
        { x: 920, y: 500, w: 360, h: 40 },
      ],
      anchors: [
        { x: 120, y: 320 },
        { x: 350, y: 300 },
      ],
      puzzleElements: [],
      decorations: [],
      completionText: '深层记忆之门已开启',
      completionSubtext: '你已接近真相...',
    };
  }

  static get LEVEL_4() {
    return {
      name: '最深层',
      subtitle: '纯黑宇宙恐怖',
      depthIndex: 3,
      bgColor: '#0A0005',
      bgGradientStops: [
        { pos: 0, color: '#050003' },
        { pos: 0.4, color: '#0A0005' },
        { pos: 0.7, color: '#080004' },
        { pos: 1, color: '#000000' },
      ],
      platformColor: '#0A0005',
      platformEdgeColor: 'rgba(255, 0, 68, 0.08)',
      platformGlowColor: 'rgba(255, 107, 53, 0.03)',
      fogColor: '10, 0, 5',
      fogAlpha: 0.3,
      starCount: 15,
      ambientParticleColor: 'rgba(255, 0, 68, 0.08)',
      ambientParticleCount: 10,
      playerStart: { x: 80, y: 400 },
      platforms: [
        { x: 0, y: 500, w: 150, h: 40 },
        { x: 220, y: 500, w: 100, h: 40 },
        { x: 380, y: 500, w: 80, h: 40 },
        { x: 520, y: 500, w: 100, h: 40 },
        { x: 700, y: 500, w: 580, h: 40 },
      ],
      anchors: [
        { x: 100, y: 340 },
      ],
      puzzleElements: [],
      decorations: [],
      completionText: '你凝视了深渊',
      completionSubtext: '而深渊也凝视了你...',
    };
  }
}

import { Game } from './core/game.js';
import { SceneManager } from './core/scene-manager.js';
import { InputManager } from './core/input.js';
import { audioSystem } from './core/audio-system.js';
import { resourceManager } from './core/resource-manager.js';
import { MenuScene } from './scenes/menu-scene.js';
import { GameScene } from './scenes/game-scene.js';
import { PauseScene } from './scenes/pause-scene.js';
import { EndingScene } from './scenes/ending-scene.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
const sceneManager = new SceneManager();
const input = new InputManager();

const menuScene = new MenuScene(input, sceneManager, audioSystem);
const gameScene = new GameScene(input, sceneManager, audioSystem);
const pauseScene = new PauseScene(input, sceneManager, audioSystem);
const endingScene = new EndingScene(input, sceneManager, audioSystem);

sceneManager.register('menu', menuScene);
sceneManager.register('game', gameScene);
sceneManager.register('pause', pauseScene);
sceneManager.register('ending', endingScene);

game.init(sceneManager, input);

const initAudio = () => {
  audioSystem.init();
  audioSystem.resume();
  document.removeEventListener('click', initAudio);
  document.removeEventListener('keydown', initAudio);
};
document.addEventListener('click', initAudio);
document.addEventListener('keydown', initAudio);

sceneManager.switchTo('menu');

game.start();

const fpsEl = document.getElementById('fps-display');
if (fpsEl) {
  setInterval(() => {
    const rmInfo = resourceManager.isReady() ? '' : ` [Loading: ${resourceManager.getLoadingCount()}]`;
    fpsEl.textContent = game.getFPS() + ' FPS' + rmInfo;
  }, 500);
}

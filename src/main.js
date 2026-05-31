import { Game } from './core/game.js';
import { SceneManager } from './core/scene-manager.js';
import { InputManager } from './core/input.js';
import { MenuScene } from './scenes/menu-scene.js';
import { GameScene } from './scenes/game-scene.js';
import { PauseScene } from './scenes/pause-scene.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
const sceneManager = new SceneManager();
const input = new InputManager();

const menuScene = new MenuScene(input, sceneManager);
const gameScene = new GameScene(input, sceneManager);
const pauseScene = new PauseScene(input, sceneManager);

sceneManager.register('menu', menuScene);
sceneManager.register('game', gameScene);
sceneManager.register('pause', pauseScene);

game.init(sceneManager, input);

sceneManager.switchTo('menu');

game.start();

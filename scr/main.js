import * as THREE from '../node_modules/three/build/three.module.js';
import { CreateEnum } from './EnumUtils.js';
import { InputManager } from './InputManager.js';
import { Pipe } from './PipeUtils.js';
import { Player } from './Player.js';
// import { Text } from 'troika-three-text';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

let bgColor = new THREE.Color(0x000000);
scene.background = bgColor;
scene.fog = new THREE.Fog(bgColor, 0.1, 25);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Make Canvas Responsive
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight); // Update size
  camera.aspect = window.innerWidth / window.innerHeight; // Update aspect ratio
  camera.updateProjectionMatrix(); // Apply changes
});

const clk = new THREE.Clock();

const input = new InputManager();

// Line Pool
let lineCount = 0;
const maxLines = 500;
const linePool = [maxLines];
for (let i = 0; i < maxLines; i++) {
  linePool[i] = new THREE.Line();
  linePool[i].visible = false;
  scene.add(linePool[i]);
}

// Text Pool
let textCount = 0;
const maxText = 10;
const textPool = [maxText];
for (let i = 0; i < maxText; i++) {
  textPool[i] = new THREE.Line();
  textPool[i].visible = false;
  scene.add(textPool[i]);
}

function DrawLine(_position, _zRotation, _scale, _geometry, _material) {
  if (lineCount < maxLines || true) {
    linePool[lineCount].position.copy(_position);
    linePool[lineCount].rotateZ(_zRotation * Math.PI / 180);
    linePool[lineCount].scale.copy(_scale);
    linePool[lineCount].geometry = _geometry;
    linePool[lineCount].material = _material;
    linePool[lineCount].visible = true;
    lineCount++;
  }
}

function ResetLinePool() {
  for (let i = 0; i < lineCount; i++) {
    linePool[i].position.copy(new THREE.Vector3(0, 0, 0));
    linePool[i].setRotationFromEuler(new THREE.Euler(0, 0, 0, 'XYZ'));
    linePool[i].scale.copy(new THREE.Vector3(1, 1, 1));
    linePool[i].visible = false;
  }
  lineCount = 0;
}

function GetPlayerWinZ(_t) { return -1.5 * Math.pow(_t, 2) + 1.25 * _t + 4; }

const pipe = new Pipe();
const entityQueue = [];
const player = new Player();

function GenerateStage() {
  let zOffset = 25;
  let angleOffset = 0;
  for (let i = 0; i < 48; i++) {
    entityQueue.push(new THREE.Vector3(0, 60 * i + angleOffset, -(i + zOffset)));
    entityQueue.push(new THREE.Vector3(1, 60 * i + angleOffset, -(i + 3 + zOffset)));
  }
}

const States = CreateEnum([
  "MainMenu",
  "StartUp",
  "Playing",
  "StageCleared",
  "GameOver"
]);
let currentState = States.MainMenu;
let stepCounter = 0;
let stepTimer = 0;

let stageIndex = 0;
let spawnedCoins = 0;
let collectedCoins = 0;

function Update(_dt) {
  switch (currentState) {

    case States.MainMenu:
      switch (stepCounter) {
        // Wait For User Input
        case 0:
          if (input.PressingBrakes()) {
            stepTimer = 0;
            stepCounter = 1;
          }
          break;
        // Set Up Gameplay State
        case 16:
          stepTimer += _dt;
          if (stepTimer >= 0.75) {
            stageIndex = 0;
            spawnedCoins = 0;
            collectedCoins = 0;
            GenerateStage();
            currentState = States.Playing;
            stepCounter = 0;
            stepTimer -= 0.75;
          }
          break;
        // Flash Text
        default:
          stepTimer += _dt;
          if (stepTimer >= 0.05) {
            stepCounter++;
            stepTimer -= 0.05;
          }
          break;
      }
      break;

    case States.Playing:
      switch (stepCounter) {
        case 0:
          // Update Pipe
          pipe.UpdatePipe(_dt);
          // Update Entities
          for (let i = 0; i < entityQueue.length; i++) { entityQueue[i].z += pipe.GetScrollSpeed() * _dt; }
          // Remove Out Of Bounds Entities
          for (let i = entityQueue.length - 1; i >= 0; i--) { if (entityQueue[i].z > 5) { entityQueue.splice(i, 1); } }
          if (entityQueue.length > 0) {
            // Update Player
            player.Update(input.GetHorizontalAxis(), input.PressingBoost(), input.PressingBrakes(), _dt);
            // Collision Checks
            let playerCheckPos = new THREE.Vector3(Math.sin(player.GetAngle() * Math.PI / 180), Math.cos(player.GetAngle() * Math.PI / 180), 4);
            for (let i = entityQueue.length - 1; i >= 0; i--) {
              if (playerCheckPos.distanceTo(new THREE.Vector3(Math.sin(entityQueue[i].y * Math.PI / 180), Math.cos(entityQueue[i].y * Math.PI / 180), entityQueue[i].z)) < 0.25) {
                if (entityQueue[i].x == 1) {
                  currentState = States.GameOver;
                }
                else {
                  collectedCoins++;
                  entityQueue.splice(i, 1);
                }
              }
            }
          }
          break;
      }
      break;

  }
};

function Draw() {
  switch (currentState) {

    case States.Playing:
      switch (stepCounter) {
        case 0:
          // Draw Pipe
          pipe.DrawPipe(DrawLine);
          // Draw Entities
          for (let i = 0; i < entityQueue.length; i++) {
            if (entityQueue[i].x == 1) { pipe.DrawStar(entityQueue[i].y, entityQueue[i].z, DrawLine); }
            else { pipe.DrawCoin(entityQueue[i].y, entityQueue[i].z, DrawLine); }
          }
          // Draw Player
          pipe.DrawPlayer(player.GetAngle(), 4, DrawLine);
          // Render Scene
          renderer.render(scene, camera);
          break;
      }
      break;

  }
};

function tick() {
  // Set Function Callback
  requestAnimationFrame(tick);
  // Get Delta Time
  let dt = clk.getDelta();
  // Adjust Maximum Time Step
  if (dt > 0.15) { dt = 0.15; }
  // Update Scene
  Update(dt);
  // Draw Scene
  Draw();
  // Reset Line Pool
  ResetLinePool();
};

tick();
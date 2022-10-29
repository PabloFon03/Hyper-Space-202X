import * as THREE from '../node_modules/three/build/three.module.js';
import { CreateEnum } from './EnumUtils.js';
import { InputManager } from './InputManager.js';
import { RandomInt, RandomSign } from './MathUtils.js';
import { Pipe } from './PipeUtils.js';
import { Player } from './Player.js';

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
  if (lineCount < maxLines) {
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

let stageIndex = 0;
let missedCoins = 0;
let collectedCoins = 0;
let score = 0;

// Add Coin To Entity Queue
function AddCoin(_angle, _z) { entityQueue.push(new THREE.Vector3(0, _angle, _z)); }

// Add Spike To Entity Queue
function AddSpike(_angle, _z) { entityQueue.push(new THREE.Vector3(1, _angle, _z)); }

function GenerateStage() {
  let zOffset = 25;
  let angleOffset = 0;
  let obstacleIdPool = [];
  let obstacleCount = 0;
  switch (stageIndex) {
    case 0:
      obstacleCount = 3;
      obstacleIdPool = [0];
      break;
    case 1:
      obstacleCount = 3;
      obstacleIdPool = [0, 0, 0, 1];
      break;
    default:
      obstacleCount = RandomInt(10, 15);
      obstacleIdPool = [8];
      break;
  }
  for (let a = 0; a < obstacleCount; a++) {
    if (a > 0) {
      let offsetFactor = RandomInt(5, 12);
      zOffset += offsetFactor;
      angleOffset += 90 * offsetFactor * Math.random() * RandomSign();
    }
    let obstacleId = obstacleIdPool[RandomInt(0, obstacleIdPool.length)];
    switch (5) {
      // Basic Coin Trail
      case 0:
        {
          let rowCount = RandomInt(2, 5);
          for (let i = 0; i < rowCount; i++) {
            let coinCount = RandomInt(3, 7);
            for (let j = 0; j < coinCount; j++) { AddCoin(angleOffset, -(j + zOffset)); }
            if (i < rowCount - 1) {
              zOffset += coinCount + RandomInt(3, 7);
              angleOffset += RandomInt(0, 5) > 0 ? RandomInt(15, 60) * RandomSign() : 0;
            }
            else { zOffset += coinCount; }
          }
        }
        break;
      // Double Coin Trail
      case 1:
        {
          let rowCount = RandomInt(3, 8);
          for (let i = 0; i < rowCount; i++) {
            let coinCount = RandomInt(4, 10);
            for (let j = 0; j < coinCount; j++) {
              if (j == 0 || j == coinCount - 1) { AddCoin(angleOffset, -(j + zOffset)); }
              else { for (let k = -1; k <= 1; k += 2) { AddCoin(15 * k + angleOffset, -(j + zOffset)); } }
            }
            if (i < rowCount - 1) {
              zOffset += coinCount + RandomInt(2, 5);
              angleOffset += RandomInt(0, 5) > 0 ? RandomInt(30, 90) * RandomSign() : 0;
            }
            else { zOffset += coinCount; }
          }
        }
        break;
      // Diamond Coin
      case 2:
        {
          let arrowCount = RandomInt(3, 8);
          for (let i = 0; i < arrowCount; i++) {
            for (let j = 0; j < 3; j++) {
              let startAngleOffset = -15 * (j % 2);
              for (let k = 0; k < j % 2 + 1; k++) { AddCoin(30 * k + startAngleOffset + angleOffset, -(j + zOffset)); }
            }
            if (i < arrowCount - 1) {
              zOffset += 3 + RandomInt(3, 8);
              angleOffset += RandomInt(0, 5) > 0 ? RandomInt(30, 90) * RandomSign() : 0;
            }
            else { zOffset += 3; }
          }
        }
        break;
      // Basic Spike Ring
      case 3:
        {
          let ringAmount = RandomInt(1, 7);
          for (let i = 0; i < ringAmount; i++) {
            let coinSlot = RandomInt(0, 8);
            for (let j = 0; j < 8; j++) {
              let currentAngle = 45 * j + angleOffset;
              if (j == coinSlot) { AddCoin(currentAngle, -(zOffset)); } else { AddSpike(currentAngle, -(zOffset)); }
            }
            if (i < ringAmount - 1) {
              zOffset += 3 + RandomInt(2, 5);
              angleOffset += RandomInt(0, 5) > 0 ? RandomInt(30, 75) * RandomSign() : 0;
            }
          }
        }
        break;
      // Triple Spike Ring
      case 4:
        {
          let ringSetAmount = RandomInt(1, 10);
          for (let i = 0; i < ringSetAmount; i++) {
            let coinSlot = RandomInt(0, 8);
            for (let j = 0; j < 3; j++) {
              for (let k = 0; k < 8; k++) {
                let currentAngle = 45 * k + angleOffset;
                if (k == coinSlot) { AddCoin(currentAngle, -(zOffset)); } else { AddSpike(currentAngle, -(zOffset)); }
              }
              zOffset++;
            }
            if (i < ringSetAmount - 1) {
              zOffset += 3 + RandomInt(0, 3);
              angleOffset += RandomInt(0, 5) > 0 ? RandomInt(60, 120) * RandomSign() : 0;
            }
          }
        }
        break;
      // Slightly Curved Ring Corridor
      case 5:
        {
          let ringAmount = RandomInt(5, 20);
          let ringAngleOffset = RandomInt(5, 20) * RandomSign();
          let ringSpikeAmount = RandomInt(2, 6);
          for (let i = 0; i < ringAmount; i++) {
            for (let j = 0; j < ringSpikeAmount; j++) {
              let currentAngle = 360 / ringSpikeAmount * (j + 0.5) + angleOffset;
              AddSpike(currentAngle, -(zOffset));
            }
            AddCoin(angleOffset, -(zOffset));
            zOffset++;
            angleOffset += ringAngleOffset;
          }
        }
        break;
      // Spiral
      case 8:
        {
          let length = RandomInt(10, 32);
          let sign = RandomSign();
          for (let i = 0; i < length; i++) {
            AddCoin(60 * i * sign + angleOffset, -(i + zOffset));
            AddSpike(60 * i * sign + angleOffset, -(i + 3 + zOffset));
          }
          zOffset += length + 3;
          angleOffset += 60 * length * sign;
        }
        break;
      // Undefined ID Error
      default:
        console.log("Error! Obstacle pattern not defined for case ", obstacleId);
        break;
    }
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

let titleScreen = document.querySelector("#TitleScreen");
let mainHUD = document.querySelector("#HUD");
let stageDisplay = document.querySelector("#StageIndex");
let scoreDisplay = document.querySelector("#Score");
let fpsDisplay = document.querySelector("#FPS");

function AddScore(_amount) {
  score += _amount;
  scoreDisplay.innerHTML = score;
}

function LoadTitleScreen() {
  currentState = States.MainMenu;
  stepCounter = 0;
  stepTimer = 0;
  titleScreen.style.display = 'block';
}

function StartGame() {
  stageIndex = 0;
  collectedCoins = 0;
  missedCoins = 0;
  score = 0;
  currentState = States.Playing;
  stepCounter = 0;
  stepTimer = 0;
  entityQueue.length = 0;
}

function Update(_dt) {
  switch (currentState) {

    case States.MainMenu:
      switch (stepCounter) {
        // Wait For User Input
        case 0:
          if (input.IsKeyPressed("Space")) {
            stepTimer = 0;
            stepCounter = 1;
          }
          break;
        // Flash Text
        default:
          stepTimer += _dt;
          if (stepTimer >= 0.05) {
            titleScreen.style.display = stepCounter % 2 == 0 ? 'block' : 'none';
            stepCounter++;
            // Set Up Gameplay State
            if (stepCounter == 16) { StartGame(); }
            else { stepTimer -= 0.05; }
          }
          break;
      }
      break;

    case States.Playing:
      switch (stepCounter) {
        case 0:
          stepTimer += _dt;
          if (stepTimer >= 0.75) {
            GenerateStage();
            stageDisplay.innerHTML = stageIndex;
            mainHUD.style.display = 'block';
            stepCounter++;
            stepTimer -= 0.75;
          }
          break;
        case 1:
          // Update Pipe
          pipe.UpdatePipe(_dt);
          // Update Player
          player.Update(input.GetHorizontalAxis(), input.PressingBrakes(), input.PressingDash(), input.PressingBoost(), _dt);
          // Update Entities
          for (let i = 0; i < entityQueue.length; i++) { entityQueue[i].z += pipe.GetScrollSpeed() * _dt; }
          // Remove Out Of Bounds Entities
          for (let i = entityQueue.length - 1; i >= 0; i--) {
            if (entityQueue[i].z > 5) {
              // Missed Coin Check
              if (entityQueue[i].x != 1) { missedCoins++; }
              entityQueue.splice(i, 1);
            }
          }
          // Collision Checks
          if (entityQueue.length > 0) {
            let playerCheckPos = new THREE.Vector3(Math.sin(player.GetAngle() * Math.PI / 180), Math.cos(player.GetAngle() * Math.PI / 180), 4);
            for (let i = entityQueue.length - 1; i >= 0; i--) {
              if (Math.abs(entityQueue[i].z - 4) <= 0.25 && playerCheckPos.distanceTo(new THREE.Vector3(Math.sin(entityQueue[i].y * Math.PI / 180), Math.cos(entityQueue[i].y * Math.PI / 180), entityQueue[i].z)) < (entityQueue[i].x == 1 ? 0.25 : 0.5)) {
                // Hit Spike
                if (entityQueue[i].x == 1) {
                  currentState = States.GameOver;
                }
                // Hit Coin
                else {
                  collectedCoins++;
                  AddScore(10);
                  entityQueue.splice(i, 1);
                }
              }
            }
          }
          // Set Stage Clear Flag
          else {
            currentState = States.StageCleared;
            stepTimer = -5;
          }
          break;
      }
      break;

    case States.StageCleared:
      // Update Pipe
      pipe.UpdatePipe(_dt);
      // Update Player (No Player Input)
      player.Update(0, false, false, false, _dt);
      // Update State Timer
      stepTimer += 2.5 * _dt;
      if (stepTimer >= 5) {
        stageIndex++;
        AddScore(250);
        currentState = States.Playing;
        stepCounter = 0;
        stepTimer -= 5;
      }
      break;

    case States.GameOver:
      if (input.IsKeyPressed("Space")) { StartGame(); }
      break;

  }
};

function Draw() {
  switch (currentState) {

    case States.Playing:
      switch (stepCounter) {
        case 1:
          // Draw Pipe
          pipe.DrawPipe(DrawLine);
          // Draw Entities
          for (let i = 0; i < entityQueue.length; i++) {
            if (entityQueue[i].z >= -25) {
              if (entityQueue[i].x == 1) { pipe.DrawStar(entityQueue[i].y, entityQueue[i].z, DrawLine); }
              else { pipe.DrawCoin(entityQueue[i].y, entityQueue[i].z, DrawLine); }
            }
          }
          // Draw Player
          pipe.DrawPlayer(player.GetAngle(), 4, DrawLine);
          break;
      }
      break;

    case States.StageCleared:
      // Draw Pipe
      pipe.DrawPipe(DrawLine);
      // Draw Player
      pipe.DrawPlayer(player.GetAngle(), stepTimer >= 0 ? GetPlayerWinZ(stepTimer) : 4, DrawLine);
      break;

    case States.GameOver:
      // Draw Pipe
      pipe.DrawPipe(DrawLine);
      // Draw Entities
      for (let i = 0; i < entityQueue.length; i++) {
        if (entityQueue[i].z >= -25) {
          if (entityQueue[i].x == 1) { pipe.DrawStar(entityQueue[i].y, entityQueue[i].z, DrawLine); }
          else { pipe.DrawCoin(entityQueue[i].y, entityQueue[i].z, DrawLine); }
        }
      }
      // Draw Player
      pipe.DrawPlayer(player.GetAngle(), 4, DrawLine);
      break;

  }
  // Render Scene
  renderer.render(scene, camera);
};

function tick() {
  // Set Function Callback
  requestAnimationFrame(tick);
  // Get Delta Time
  let dt = clk.getDelta();
  // Update FPS Display
  fpsDisplay.innerHTML = Math.round(1 / dt);
  // Adjust Maximum Time Step
  if (dt > 0.15) { dt = 0.15; }
  // Update Input Manager
  input.Update(dt);
  // Update Scene
  Update(dt);
  // Draw Scene
  Draw();
  // Reset Line Pool
  ResetLinePool();
};

LoadTitleScreen();
tick();
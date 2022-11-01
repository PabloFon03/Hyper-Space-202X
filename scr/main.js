import * as THREE from '../node_modules/three/build/three.module.js';
import { CreateEnum } from './EnumUtils.js';
import { InputManager } from './InputManager.js';
import { RandomFloat, RandomInt, RandomSign } from './MathUtils.js';
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

let pipeRandomizeCooldown = 0;

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
      obstacleIdPool = [0, 0, 1, 2];
      break;
    case 1:
      obstacleCount = 5;
      obstacleIdPool = [0, 0, 1, 1, 2, 2, 3];
      break;
    case 2:
      obstacleCount = 4;
      obstacleIdPool = [0, 2, 3, 3, 3, 4];
      break;
    case 3:
      obstacleCount = 5;
      obstacleIdPool = [2, 3, 3, 4, 4, 4, 5, 6];
      break;
    case 4:
      obstacleCount = 4;
      obstacleIdPool = [0, 2, 3, 3, 4, 4, 6, 8, 8];
      break;
    case 5:
      obstacleCount = 3;
      obstacleIdPool = [0, 1, 2, 2, 3, 3, 4, 4, 5];
      break;
    case 6:
      obstacleCount = 3;
      obstacleIdPool = [1, 3, 3, 4, 4, 6, 8, 8, 8];
      break;
    case 7:
      obstacleCount = 3;
      obstacleIdPool = [0, 3, 5, 6, 7, 7, 7, 9, 9];
      break;
    case 8:
      obstacleCount = 3;
      obstacleIdPool = [2, 3, 7, 7, 8, 9, 9];
      break;
    default:
      obstacleCount = stageIndex < 15 ? RandomInt(5, 10) : RandomInt(10, 15);
      obstacleIdPool = [0, 1, 2, 2, 3, 3, 3, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9];
      break;
  }
  for (let a = 0; a < obstacleCount; a++) {
    if (a > 0) {
      let offsetFactor = RandomInt(3, 10);
      zOffset += offsetFactor;
      angleOffset += 90 * offsetFactor * Math.random() * RandomSign();
    }
    let obstacleId = obstacleIdPool[RandomInt(0, obstacleIdPool.length)];
    switch (obstacleId) {
      // Basic Coin Trail
      case 0:
        {
          let rowCount = RandomInt(2, 5);
          for (let i = 0; i < rowCount; i++) {
            let coinCount = RandomInt(3, 7);
            for (let j = 0; j < coinCount; j++) { AddCoin(angleOffset, -(j + zOffset)); }
            if (i < rowCount - 1) {
              zOffset += coinCount + RandomInt(2, 5);
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
          let diamondCount = RandomInt(3, 8);
          for (let i = 0; i < diamondCount; i++) {
            for (let j = 0; j < 3; j++) {
              let startAngleOffset = -15 * (j % 2);
              for (let k = 0; k < j % 2 + 1; k++) { AddCoin(30 * k + startAngleOffset + angleOffset, -(j + zOffset)); }
            }
            if (i < diamondCount - 1) {
              zOffset += 4 + RandomInt(0, 3);
              angleOffset += RandomInt(0, 4) > 0 ? RandomInt(30, 90) * RandomSign() : 0;
            }
            else { zOffset += 3; }
          }
        }
        break;
      // Diamond Spike
      case 3:
        {
          let diamondCount = RandomInt(1, 5) * 2 + 1;
          for (let i = 0; i < diamondCount; i++) {
            for (let j = 0; j < 3; j++) {
              let startAngleOffset = -15 * (j % 2);
              for (let k = 0; k < j % 2 + 1; k++) {
                let currentAngle = 30 * k + startAngleOffset + angleOffset;
                if (i % 2 == 0) { AddSpike(currentAngle, -(j + zOffset)); }
                else {
                  for (let l = 0; l < 2; l++) { AddSpike(currentAngle + 120 * (l - 0.5), -(j + zOffset)); }
                  AddCoin(currentAngle, -(j + zOffset));
                }
              }
            }
            zOffset += 4 + RandomInt(0, 2);
          }
        }
        break;
      // Telegraphed Spike Ring
      case 4:
        {
          let ringSetAmount = RandomInt(3, 10);
          for (let i = 0; i < ringSetAmount; i++) {
            let coinSlot = RandomInt(0, 8);
            for (let j = 0; j < 3; j++) {
              for (let k = -j * 1.5; k <= j * 1.5; k++) {
                let currentAngle = 45 * (coinSlot + k + 4) + angleOffset;
                AddSpike(currentAngle, -(zOffset));
              }
              if (j == 2) { AddCoin(45 * coinSlot + angleOffset, -(zOffset)); }
              zOffset++;
            }
            if (i < ringSetAmount - 1) {
              zOffset += 3 + RandomInt(0, 3);
              angleOffset += RandomInt(0, 5) > 0 ? RandomInt(60, 180) * RandomSign() : 0;
            }
          }
        }
        break;
      // Single Spike Ring
      case 5:
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
      case 6:
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
      case 7:
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
      // 3-Lane Cross
      case 8:
        {
          let lengths = [];
          lengths.length = RandomInt(3, 10) * 2 + 1;
          let totalLenght = 0;
          for (let i = 0; i < lengths.length; i++) {
            let n = i % 2 != 0 ? RandomInt(3, 8) : RandomInt(2, 5);
            lengths[i] = n;
            totalLenght += n;
          }
          if (totalLenght % 2 == 0) { lengths[lengths.length - 1]++; }
          let zCoin = zOffset;
          let sign = RandomSign();
          for (let i = 0; i < lengths.length; i++) {
            // Coin Row
            if (i % 2 != 0) {
              for (let j = 0; j < lengths[i]; j++) {
                AddCoin(45 * sign + angleOffset, -zCoin);
                zCoin++;
              }
            }
            // Empty Buffer
            else {
              zCoin += lengths[i];
              if (RandomInt(0, 8) > 0) { sign *= -1; }
            }
          }
          for (let i = 0; i < totalLenght; i += 2) { AddSpike(angleOffset, -(i + zOffset)); }
          zOffset += totalLenght;
        }
        break;
      // Spiral
      case 9:
        {
          let length = RandomInt(10, 32);
          let sign = RandomSign();
          for (let i = 0; i < length; i++) {
            AddCoin(60 * i * sign + angleOffset, -(i + zOffset));
            AddSpike(60 * i * sign + angleOffset, -(i + 3 + zOffset));
          }
          zOffset += length + RandomInt(0, 3);
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
  "Playing",
  "Paused",
  "StageCleared",
  "GameOver"
]);
let currentState = States.MainMenu;
let stepCounter = 0;
let stepTimer = 0;

let titleScreen = document.querySelector("#TitleScreen");
let mainHUD = document.querySelector("#HUD");
let stageDisplay = document.querySelector("#HUD #StageIndex");
let scoreDisplay = document.querySelector("#HUD #Score");
let fpsDisplay = document.querySelector("#FPS");
let pauseMenu = document.querySelector("#Pause");
let gameOverScreen = document.querySelector("#GameOver");
let gameOverStageDisplay = document.querySelector("#GameOver #StageIndex");
let gameOverScoreDisplay = document.querySelector("#GameOver #Score");
let gameOverCollectedCoinsDisplay = document.querySelector("#GameOver #CollectedCoins");
let gameOverMissedCoinsDisplay = document.querySelector("#GameOver #MissedCoins");
let gameOverCoinAccuracyDisplay = document.querySelector("#GameOver #Accuracy");

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

function StageSelectCheatCheck() {
  for (let i = 0; i < 10; i++) {
    if (input.IsKeyPressed("") || input.IsKeyPressed("")) {

    }
  }
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
            entityQueue.length = 0;
            GenerateStage();
            pipe.Randomize(-1);
            player.Reset();
            stageDisplay.innerHTML = stageIndex + 1;
            mainHUD.style.display = 'block';
            pipeRandomizeCooldown = RandomFloat(1, 4);
            stepCounter++;
            stepTimer -= 0.75;
          }
          break;
        case 1:
          // Pause Game
          if (stepTimer < 0) { stepTimer += _dt; }
          else if (input.IsKeyPressed("Space")) {
            pauseMenu.style.display = 'block';
            stepTimer = -0.1;
            currentState = States.Paused;
          }
          // Update Pipe Randomize Cooldown
          pipeRandomizeCooldown -= _dt;
          if (pipeRandomizeCooldown <= 0) {
            pipe.Randomize(stageIndex);
            pipeRandomizeCooldown += RandomFloat(1, 4);
          }
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
                  gameOverStageDisplay.innerHTML = stageIndex;
                  gameOverScoreDisplay.innerHTML = score;
                  gameOverCollectedCoinsDisplay.innerHTML = collectedCoins;
                  gameOverMissedCoinsDisplay.innerHTML = missedCoins;
                  gameOverCoinAccuracyDisplay.innerHTML = missedCoins + collectedCoins > 0 ? Math.round(100 * collectedCoins / (missedCoins + collectedCoins)).toString() + "%" : "---";
                  gameOverScreen.style.display = 'block';
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

    case States.Paused:
      if (stepTimer < 0) { stepTimer += _dt; }
      else {
        // Unpause Game
        if (input.IsKeyPressed("Space")) {
          pauseMenu.style.display = 'none';
          stepTimer = -0.1;
          currentState = States.Playing;
        }
        // Stage Select Cheat
        StageSelectCheatCheck();
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
        mainHUD.style.display = 'none';
        currentState = States.Playing;
        stepCounter = 0;
        stepTimer -= 5;
      }
      break;

    case States.GameOver:
      if (input.IsKeyPressed("Space")) {
        mainHUD.style.display = 'none';
        gameOverScreen.style.display = 'none';
        StartGame();
      }
      break;

  }
};

function DefaultDraw() {
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
}

function Draw() {
  switch (currentState) {

    case States.Playing:
      if (stepCounter == 1) { DefaultDraw(); }
      break;

    case States.Paused:
      DefaultDraw();
      break;

    case States.StageCleared:
      // Draw Pipe
      pipe.DrawPipe(DrawLine);
      // Draw Player
      pipe.DrawPlayer(player.GetAngle(), stepTimer >= 0 ? GetPlayerWinZ(stepTimer) : 4, DrawLine);
      break;

    case States.GameOver:
      DefaultDraw();
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
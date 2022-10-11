import * as THREE from '../node_modules/three/build/three.module.js';
import { InputManager } from './InputManager.js';
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

const pipe = new Pipe();
const entityQueue = [];
const player = new Player();

function Draw() {

  // Draw Pipe
  pipe.DrawPipe(DrawLine);

  // Draw Entities
  for (let i = 0; i < entityQueue.length; i++) { pipe.DrawStar(entityQueue[i].y, entityQueue[i].z, DrawLine); }
  for (let i = 0; i < entityQueue.length; i++) { pipe.DrawCoin(entityQueue[i].y, entityQueue[i].z + 3, DrawLine); }

  // Draw Player
  pipe.DrawPlayer(player.GetAngle(), 4, DrawLine);

  // Render Scene
  renderer.render(scene, camera);

}

function tick() {

  requestAnimationFrame(tick);

  // Get Delta Time
  let dt = clk.getDelta();
  console.log(1 / dt);

  console.log(input.GetHorizontalAxis());

  if (dt > 0.15) { dt = 0.15; }

  // Update Pipe
  pipe.UpdatePipe(dt);

  // Update Tunnel Entities
  for (let i = 0; i < entityQueue.length; i++) { entityQueue[i].z += pipe.GetScrollSpeed() * dt; }

  // Remove Out Of Bounds Entities
  for (let i = entityQueue.length - 1; i >= 0; i--) { if (entityQueue[i].z > 5) { entityQueue.splice(i, 1); } }

  if (entityQueue.length == 0) { entityQueue.push(new THREE.Vector3(1, 30, 4.5)); }
  while (entityQueue[entityQueue.length - 1].z > -25) { entityQueue.push(new THREE.Vector3(1, entityQueue[entityQueue.length - 1].y + 60, entityQueue[entityQueue.length - 1].z - 1)); }

  // Update Player
  player.Update(input.GetHorizontalAxis(), input.PressingBoost(), input.PressingBrakes(), dt);

  // Draw Scene
  Draw();

  // Reset Line Pool
  ResetLinePool();

};

tick();
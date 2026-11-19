import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.163.0/examples/jsm/controls/OrbitControls.js';
import Fighter from './fighter.js';
import { getSafeSession } from './supabaseClient.js';

const canvas = document.getElementById('gameCanvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const camHeight = 6;
const camera = new THREE.OrthographicCamera(
  (-camHeight * aspect) / 2,
  (camHeight * aspect) / 2,
  camHeight / 2,
  -camHeight / 2,
  0.1,
  100
);
camera.position.set(0, 3, 10);
camera.lookAt(0, 1, 0);
new OrbitControls(camera, renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 8, 5);
scene.add(dirLight);

const p1 = new Fighter({ scene, x: -2, color: 0x00fffc });
const p2 = new Fighter({ scene, x:  2, color: 0xff00aa });

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup',   e => keys[e.code] = false);

function getInputP1() {
  return {
    left:   keys['ArrowLeft'],
    right:  keys['ArrowRight'],
    jump:   keys['ArrowUp'],
    attack: keys['KeyZ']
  };
}
function getInputP2() {
  return {
    left:   keys['KeyA'],
    right:  keys['KeyD'],
    jump:   keys['KeyW'],
    attack: keys['KeyF']
  };
}

// Prototype-level visibility fix: the box fighters should not occupy the same
// screen space during normal combat. Character-specific throws/specials are
// deliberately NOT implemented in this old prototype.
const MIN_FIGHTER_SPACING = 1.2;
function keepBothFightersVisible() {
  const dx = p2.mesh.position.x - p1.mesh.position.x;
  const distance = Math.abs(dx);
  if (distance >= MIN_FIGHTER_SPACING) return;
  const direction = dx < 0 ? -1 : 1;
  const correction = (MIN_FIGHTER_SPACING - distance) / 2;
  p1.mesh.position.x -= direction * correction;
  p2.mesh.position.x += direction * correction;
}

function updateCamera() {
  const midX = (p1.mesh.position.x + p2.mesh.position.x) / 2;
  camera.position.x = midX;
}

let shakeFrames = 0;
function cameraShake(strength = 4) { shakeFrames = strength; }
function applyShake() {
  if (shakeFrames <= 0) return;
  camera.position.x += (Math.random() - 0.5) * 0.3;
  camera.position.y += (Math.random() - 0.5) * 0.3;
  shakeFrames--;
}

function checkHits() {
  const p1Hit = p1.hitbox, p2Hit = p2.hitbox;
  if (p1Hit && p1Hit.intersectsBox(p2.hurtbox)) {
    p2.mesh.position.x += 0.5 * Math.sign(p2.mesh.position.x - p1.mesh.position.x);
    cameraShake(6);
  }
  if (p2Hit && p2Hit.intersectsBox(p1.hurtbox)) {
    p1.mesh.position.x += 0.5 * Math.sign(p1.mesh.position.x - p2.mesh.position.x);
    cameraShake(6);
  }
}

async function init() {
  const session = await getSafeSession();
  if (!session) console.warn('[Game] Running in Guest Mode.');

  renderer.setAnimationLoop(loop);
}

function loop() {
  p1.step(getInputP1(), p2);
  p2.step(getInputP2(), p1);
  checkHits();
  keepBothFightersVisible();

  updateCamera();
  applyShake();

  renderer.render(scene, camera);
}

init();
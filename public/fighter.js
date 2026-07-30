import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';
import { Phase, StateMachine } from './stateMachine.js';

export default class Fighter {
  constructor({ scene, x = 0, color = 0xff0000 }) {
    this.state = new StateMachine();

    const geom = new THREE.BoxGeometry(1, 2, 1);
    const mat  = new THREE.MeshPhongMaterial({ color });
    this.mesh  = new THREE.Mesh(geom, mat);
    this.mesh.position.set(x, 1, 0);
    scene.add(this.mesh);

    this.activeHitbox = null;

    this.speed = 0.08;
    this.jumpVel = 0.25;
    this.velY = 0;
    this.onGround = true;
  }

  face(opponent) {
    this.mesh.rotation.y = (opponent.mesh.position.x < this.mesh.position.x) ? Math.PI : 0;
  }

  #spawnHitbox() {
    if (this.activeHitbox) return;
    const g = new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.MeshBasicMaterial({ visible: false });
    this.activeHitbox = new THREE.Mesh(g, m);
    this.activeHitbox.position.set(0.7, 1, 0);
    this.mesh.add(this.activeHitbox);
  }
  #destroyHitbox() {
    if (!this.activeHitbox) return;
    this.mesh.remove(this.activeHitbox);
    this.activeHitbox.geometry.dispose();
    this.activeHitbox.material.dispose();
    this.activeHitbox = null;
  }

  step(input, opponent) {
    this.state.tick();

    switch (this.state.phase) {
      case Phase.IDLE:
        if (input.left)  this.mesh.position.x -= this.speed;
        if (input.right) this.mesh.position.x += this.speed;
        if (input.jump && this.onGround) {
          this.velY = this.jumpVel;
          this.onGround = false;
        }
        if (input.attack) this.state.phase = Phase.STARTUP;
        break;

      case Phase.STARTUP:
        if (this.state.frame >= 5) {
          this.state.phase = Phase.ACTIVE;
          this.#spawnHitbox();
        }
        break;

      case Phase.ACTIVE:
        if (this.state.frame >= 5) {
          this.state.phase = Phase.RECOVERY;
          this.#destroyHitbox();
        }
        break;

      case Phase.RECOVERY:
        if (this.state.frame >= 10) this.state.phase = Phase.IDLE;
        break;
    }

    if (!this.onGround) {
      this.velY -= 0.012;
      this.mesh.position.y += this.velY;
      if (this.mesh.position.y <= 1) {
        this.mesh.position.y = 1;
        this.velY = 0;
        this.onGround = true;
      }
    }

    this.face(opponent);
  }

  get hurtbox() {
    return new THREE.Box3().setFromObject(this.mesh);
  }
  get hitbox() {
    if (!this.activeHitbox) return null;
    return new THREE.Box3().setFromObject(this.activeHitbox);
  }
}
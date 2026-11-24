import { finisherFor } from './Fucktalities.mjs';
import { slamPose, slamTime, slamOpponentHeight, slamOptionsFor, SLAM_WORLD_SCALE, SLAM_ACTION_END } from './KardozoSlam.mjs';
import {emote, personalityTick, personalityHit, personalityMiss, startSignature} from './Personality.mjs';
import { BOSS_ID, DOG_SPECIAL } from './Boss.mjs';
import { fighterScale } from './FighterScale.mjs';
import * as THREE from '../vendor/three.module.mjs';
import { specialFor, METER_MAX, SPECIAL_MOVES } from './SpecialMoves.mjs';
import { LIMB_ACTIONS, limbMove } from './LimbMoves.mjs';
import { comedyFor } from './ComedyMoves.mjs';

export const STEP = 1 / 60;
export const ROUND_SECONDS = 60;
export const MOVES = Object.freeze(Object.fromEntries(Object.entries({
  punch: { label: 'JAB', level: 'high', startup: 6/60, active: 5/60, recovery: 10/60, reach: .85, height: .70, y: 1.65, damage: 7, stun: .34, push: 2.6 },
  kick: { label: 'BODY KICK', level: 'mid', startup: 10/60, active: 7/60, recovery: 16/60, reach: 1.2, height: .8, y: 1.0, damage: 11, stun: .34, push: 4.6 },
  heavyPunch: { label: 'POWER PUNCH', level: 'high', startup: 13/60, active: 7/60, recovery: 23/60, reach: 1.05, height: .8, y: 1.65, damage: 13, stun: .43, push: 6.2, heavy: true },
  driveKick: { label: 'DRIVE KICK', level: 'mid', startup: 15/60, active: 8/60, recovery: 25/60, reach: 1.4, height: .85, y: 1.1, damage: 15, stun: .40, push: 8.2, heavy: true, knockdown: .35, launch: 3.5 },
  uppercut: { label: 'UPPERCUT', level: 'mid', startup: 10/60, active: 9/60, recovery: 26/60, reach: .98, height: 1.75, y: 1.95, damage: 15, stun: .50, push: 4.5, heavy: true, launch: 10.6, knockdown: .38 },
  sweep: { label: 'SWEEP', level: 'low', startup: 12/60, active: 7/60, recovery: 24/60, reach: 1.3, height: .5, y: .27, damage: 10, stun: .45, push: 4, crouch: true, knockdown: .52, launch: 3.2 },
  airPunch: { label: 'JUMP PUNCH', level: 'overhead', startup: 5/60, active: 12/60, recovery: 12/60, reach: .95, height: .75, y: 1.25, damage: 9, stun: .36, push: 3.4, air: true },
  airKick: { label: 'FLYING KICK', level: 'overhead', startup: 8/60, active: 16/60, recovery: 14/60, reach: 1.35, height: .75, y: .7, damage: 13, stun: .42, push: 6, air: true, heavy: true },
}).map(([name, move]) => [name, Object.freeze(move)])));
// Two deliberate close-range throws. The simultaneous button chords are separate
// from limb strikes; Kardozo's protected slam system is not affected.
export const CHORD_THROWS = Object.freeze({
  punchThrow: Object.freeze({id:'punch-throw', name:'SHOULDER TOSS', label:'SHOULDER TOSS', kind:'grab', chordThrow:true,
    startup:.15, active:.36, recovery:.35, captureWindow:.25, reach:1.05, height:1.6, y:1.25,
    damage:14, level:'mid', stun:.30, push:4.8, color:0xf4bc69, unblockable:true}),
  kickThrow: Object.freeze({id:'kick-throw', name:'LEG TRIP', label:'LEG TRIP', kind:'grab', chordThrow:true,
    startup:.18, active:.32, recovery:.38, captureWindow:.23, reach:1.2, height:.85, y:.60,
    damage:12, level:'low', stun:.35, push:4.3, color:0x81b2f5, unblockable:true}),
});
export const GAG_COST = 35;
const LIMIT = 5.5;
const RADIUS = .43;
const clamp = THREE.MathUtils.clamp;
const emptyInput = () => ({ left: false, right: false, jump: false, down: false, punch: false, kick: false, block: false, comedy: false, special: false, punchLeft: false, punchRight: false, kickLeft: false, kickRight: false });

function makeFighter(definition, index) {
  const group = new THREE.Group();
  const ghost = new THREE.MeshBasicMaterial({ visible: false });
  const hurtMesh = new THREE.Mesh(new THREE.BoxGeometry(.82, 2.5, .7), ghost);
  hurtMesh.position.y = 1.25;
  group.add(hurtMesh);
  return { definition, index, bossForm:definition.id===BOSS_ID?1:null, special: definition.id===BOSS_ID?DOG_SPECIAL:specialFor(definition.id), comedy: comedyFor(definition.id), meter: 0, noticeUntil: 0, group, ghost, hurtMesh, hurtbox: new THREE.Box3(), hitMesh: null, hitbox: null,
    x: index === 0 ? -2.3 : 2.3, y: 0, vx: 0, vy: 0, facing: index === 0 ? 1 : -1,
    hp: 100, wins: 0, state: 'idle', clock: 0, move: null, moveName: null, hitTargets: new Set(), blocking: false, gagReadyUntil: 0,
    pulseIndex: -1, grabTarget: null, capturedBy: null, crouching: false, wasAirborne: false, hitConfirmed: false, guardStun: false, hitRegion: null, reactionUntil: 0 };
}

/** Local two-player combat. No remote calls or account writes are performed. */
export class CombatModel {
  constructor(definitions) {
    if (!Array.isArray(definitions) || definitions.length !== 2 || definitions[0].id === definitions[1].id) {
      throw new Error('Choose two distinct fighters.');
    }
    this.fighters = definitions.map(makeFighter);
    this.bossBattle=definitions.some(d=>d.id===BOSS_ID);this.bossClock=0;
    this.previous = [emptyInput(), emptyInput()];
    this.round = 1;
    this.time = ROUND_SECONDS;
    this.countdown = 3;
    this.phase = 'countdown';
    this.paused = false;
    this.result = null;
    this.events = [];
    this.projectiles = [];
    this.serial = 0;
    this.elapsed = 0;
    this.hitStop = 0; this.combos = [{ hits: 0, damage: 0, until: 0 }, { hits: 0, damage: 0, until: 0 }];
    this.disposed = false;
    this.sync();
  }

  sync() {
    for (const f of this.fighters) {
      const height = fighterScale(f.definition.id) * (['knockdown','knockedOut'].includes(f.state) && f.y < .05 ? .55 : f.crouching || f.state === 'gettingUp' ? 1.4 : 3.0);
      f.hurtMesh.scale.y = height / 2.5; f.hurtMesh.position.y = height / 2;
      f.group.position.set(f.x, f.y, 0);
      f.group.rotation.y = f.facing === 1 ? 0 : Math.PI;
      f.group.updateMatrixWorld(true);
      f.hurtbox.setFromObject(f.hurtMesh);
      if (f.hitMesh) f.hitbox.setFromObject(f.hitMesh);
    }
  }

  removeHitbox(f) {
    if (f.hitMesh) { f.group.remove(f.hitMesh); f.hitMesh.geometry.dispose(); }
    f.hitMesh = null;
    f.hitbox = null;
  }

  activate(f) {
    this.removeHitbox(f);
    const move = f.move;
    if(move.kind==='dogs'||move.cosmetic)return;
    if (move.projectile) { this.spawnProjectile(f); return; }
    if (move.comedy && !move.pulses) this.events.push({ type: 'comedyBeat', serial: ++this.serial, owner: f.index, move, beat: 0 });
    f.hitMesh = new THREE.Mesh(new THREE.BoxGeometry(move.reach, move.height * fighterScale(f.definition.id), .9), f.ghost);
    f.hitMesh.position.set(.38 + move.reach / 2, move.y * fighterScale(f.definition.id), 0);
    f.group.add(f.hitMesh);
    f.hitbox = new THREE.Box3();
  }

  startMove(f, name, customMove = null) {
    if (f.state !== 'idle' || f.blocking || f.hp <= 0) return;
    f.moveName = name;
    f.move = customMove ?? MOVES[name];
    f.hitConfirmed = false;
    f.state = 'startup';
    f.clock = f.move.startup;
    f.hitTargets.clear();
    f.vx = f.facing * .7;
    this.gainMeter(f, 8);
  }

  startComedy(f) {
    if (this.bossBattle) return;
    if (f.state !== 'idle' || f.blocking || f.hp <= 0 || f.y > .001 || f.vy > 0 || !f.comedy) return;
    const other = this.fighters[1 - f.index];
    // The gag has to be earned AND set up with a nearby clean hit. It cannot be
    // spammed at neutral or activated from across the arena.
    if (f.definition.id !== 'kardozo') {
      if (f.meter < GAG_COST || this.elapsed > (other.gagReadyUntil ?? 0) ||
          Math.abs(f.x - other.x) > 2.5 || other.hp <= 0) {
        f.noticeUntil = this.elapsed + 1.2; return;
      }
      f.meter -= GAG_COST;
      other.state = 'stun'; other.clock = Math.max(other.clock, f.comedy.startup + f.comedy.active + .15);
      other.blocking = false; other.vx = 0; other.move = null; other.moveName = null;
      this.removeHitbox(other);
      other.gagReadyUntil = 0;
    }
    if(f.definition.id==='gaibden'&&f.crouching){this.startMove(f,'ranged-lightning',{...SPECIAL_MOVES.gaibden,damage:12,personalityFrame:11});return;}
    f.moveName = 'comedy'; f.move = f.comedy; f.state = 'startup'; f.clock = f.move.startup;
    f.hitTargets.clear(); f.pulseIndex = -1; f.vx = 0; f.crouching = false; f.hitConfirmed = false;
    if (f.definition.id === 'kardozo') this.gainMeter(f, 8);
    this.events.push({ type: 'comedyStart', serial: ++this.serial, owner: f.index, move: f.move });
  }

  gainMeter(f, amount) { f.meter = clamp(f.meter + amount, 0, METER_MAX); }

  startSpecial(f) {
    if(this.bossBattle&&f.definition.id!==BOSS_ID)return;
    if (f.state !== 'idle' || f.blocking || f.hp <= 0 || f.y > .001 || f.vy > 0 || !f.special) return;
    if (f.meter < METER_MAX) { f.noticeUntil = this.elapsed + 1.3; return; }
    f.meter = 0; f.noticeUntil = 0;
    f.moveName = 'special'; f.move = f.special; f.state = 'startup'; f.clock = f.move.startup;
    f.hitTargets.clear(); f.pulseIndex = -1; f.vx = 0; f.crouching = false; f.hitConfirmed = false;
    this.events.push({ type: 'specialStart', serial: ++this.serial, owner: f.index, move: f.move });
  }

  spawnProjectile(f) {
    const spec = f.move.projectile;
    const count = spec.count ?? 1;
    for (let n = 0; n < count; n++) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(spec.width, spec.height, .7), f.ghost);
      const projectile = { id: ++this.serial, owner: f.index, move: f.move, facing: f.facing, volleyIndex: n,
        x: f.x + f.facing * .65, y: f.move.kind==='lightning'&&!this.bossBattle?this.fighters[1-f.index].y+3*fighterScale(this.fighters[1-f.index].definition.id)*.34:f.y + spec.y + (spec.yOffsets?.[n] ?? 0), vx: f.facing * spec.speed,
        delay: n * (spec.interval ?? 0), life: spec.life, mesh, box: new THREE.Box3() };
      this.projectiles.push(projectile);
    }
    this.events.push({ type: 'specialRelease', serial: ++this.serial, owner: f.index, move: f.move });
  }

  clearProjectiles() {
    for (const projectile of this.projectiles) projectile.mesh?.geometry?.dispose();
    this.projectiles = [];
  }

  pulse(f) {
    if (f.state !== 'active' || !f.move || !f.move.pulses) return;
    const elapsed = f.move.active - f.clock - (f.move.pulseDelay ?? 0);
    const interval = (f.move.active - (f.move.pulseDelay ?? 0)) / f.move.pulses;
    const index = f.move.beats ? f.move.beats.filter(time => elapsed >= time - 1e-8).length - 1 : elapsed < -1e-8 ? -1 : Math.min(f.move.pulses - 1, Math.floor((elapsed + 1e-8) / interval));
    if (index !== f.pulseIndex) {
      f.pulseIndex = index; f.hitTargets.clear();
      if (f.move.comedy && index >= 0) this.events.push({ type: 'comedyBeat', serial: ++this.serial, owner: f.index, move: f.move, beat: index });
      if (f.move.comedy === 'tantrum' && f.hitMesh) f.hitMesh.position.y = index === 2 ? .95 : f.move.y;
    }
  }

  capture(f, defender) {
    if (f.state !== 'active' || f.move?.kind !== 'grab' || f.grabTarget !== null || (defender.y > .25&&f.move?.id!=='four-slams') || defender.hp <= 0) return;
    if (f.facing > 0) f.x = Math.min(f.x, LIMIT - .75);
    else f.x = Math.max(f.x, -LIMIT + .75);
    f.grabTarget = defender.index; f.vx = 0;
    if (f.move.id === 'four-slams') f.slamStart = {
      x: 800 + (defender.x - f.x) * f.facing / SLAM_WORLD_SCALE,
      y: 700 - defender.y / SLAM_WORLD_SCALE,
    };
    this.removeHitbox(defender);
    defender.capturedBy = f.index; defender.move = null; defender.moveName = null; defender.blocking = false;
    defender.state = 'stun'; defender.clock = .15; defender.vx = 0; defender.vy = 0;
  }

  releaseGrab(f, completed = false) {
    if (f.grabTarget === null) return;
    const defender = this.fighters[f.grabTarget];
    f.grabTarget = null;
    if (defender.capturedBy !== f.index) return;
    defender.capturedBy = null; defender.choreoAngle=0; defender.state = completed ? 'knockdown' : 'stun'; defender.clock = completed ? .55 : .12;
    defender.vx = completed ? (f.move?.id==='four-slams'?(Math.sign(defender.x-f.x)||f.facing):f.facing) * 7 : 0; defender.vy = completed ? 6.5 : 0;
    if (completed && f.move?.chordThrow) {
      defender.hp = Math.max(0, defender.hp - f.move.damage);
      defender.hitRegion = f.move.id === 'kick-throw' ? 'legs' : 'torso';
      this.gainMeter(f, 12);
      this.events.push({type:'hit',serial:++this.serial,attacker:f.index,defender:defender.index,
        x:defender.x,y:.35,damage:f.move.damage,heavy:true,knockdown:true,region:defender.hitRegion,
        moveName:f.move.label,kind:'throw'});
    }
    if (completed && f.move?.id === 'four-slams') {
      // The fourth landing is the release: do not launch the body a fifth time.
      defender.y = 0; defender.vx = 0; defender.vy = 0; defender.clock = .85;
    }
    if (completed) this.events.push({ type: 'slam', serial: ++this.serial, owner: f.index, defender: defender.index, x: defender.x, y: .25, kind: 'grab' });
  }

  updateDogs() {
    const boss=this.fighters.find(f=>f.definition.id===BOSS_ID);if(!boss)return;
    const defender=this.fighters[1-boss.index];
    if(boss.move?.kind!=='dogs'||boss.state!=='active'){
      if(defender.capturedBy===boss.index&&boss.grabTarget===null){defender.capturedBy=null;defender.state=defender.hp>0?'stun':'knockedOut';defender.clock=.2;}
      boss.dogBeat=-1;return;
    }
    const t=boss.move.active-boss.clock;
    if(boss.dogBeat==null||boss.dogBeat<0){boss.dogBeat=0;boss.dogStart=defender.x;boss.dogMiss=Math.abs(boss.x-defender.x)>4.2||defender.blocking;}
    if(boss.dogMiss)return;
    if(t>=.4&&t<5.8){defender.capturedBy=boss.index;defender.move=null;defender.moveName=null;defender.blocking=false;defender.y=0;defender.vy=0;defender.state=t<2.8?'knockdown':'stun';
      if(t<2.8)defender.x=clamp(boss.dogStart-boss.facing*Math.min(1.5,(t-.4)*.7),-LIMIT,LIMIT);
      else defender.x=defender.x+(boss.x-boss.facing*.9-defender.x)*.035;
    }
    const beats=[.4,1.8,3.4,5.8];
    if(boss.dogBeat<4&&t>=beats[boss.dogBeat]){
      const final=boss.dogBeat===3;defender.hp=Math.max(final?0:1,defender.hp-(final?18:5));
      this.events.push({type:'hit',serial:++this.serial,attacker:boss.index,defender:defender.index,x:defender.x,y:1,damage:final?18:5,heavy:final,region:'torso'});
      boss.dogBeat++;
      if(final){defender.capturedBy=null;defender.state='knockdown';defender.clock=.8;defender.vx=boss.facing*8;defender.vy=6;}
    }
  }

  updateCaptures() {
    for (const f of this.fighters) {
      if (f.grabTarget === null) continue;
      if (f.state !== 'active' || f.move?.kind !== 'grab' || f.hp <= 0) { this.releaseGrab(f); continue; }
      const defender = this.fighters[f.grabTarget];
      if (f.move.id === 'four-slams') {
        const pose = slamPose(slamTime(f.move.active - f.clock, f.move.active), {
          opponentHeight: slamOpponentHeight(defender.definition.id), startGrip: f.slamStart,
        });
        defender.x = clamp(f.x + f.facing * (pose.victimCenter.x - 800) * SLAM_WORLD_SCALE, -LIMIT, LIMIT);
        defender.y = Math.max(0, (700 - pose.victimCenter.y) * SLAM_WORLD_SCALE);
        defender.choreoAngle = pose.theta;
        if (f.pulseIndex >= 0 && !f.hitTargets.has(defender.index)) {
          f.hitTargets.add(defender.index); this.applyHit(this.makeHit(f.index, f.move, f.facing));
        }
      } else {
        defender.x = clamp(f.x + f.facing * .68, -LIMIT, LIMIT); defender.y = 0; defender.choreoAngle = 0;
      }
      defender.vx = 0; defender.vy = 0;
    }
  }

  advanceState(f, dt) {
    if (f.state === 'idle' || f.state === 'knockedOut' || (f.state === 'knockdown' && f.y > .001)) return;
    f.clock -= dt;
    while (f.clock <= 1e-8 && f.state !== 'idle') {
      if (f.state === 'startup') {
        f.state = 'active';
        f.clock += f.move.active;
        this.activate(f);
      } else if (f.state === 'active') {
        this.releaseGrab(f, true);
        f.state = 'recovery';
        f.clock += f.move.recovery;
        this.removeHitbox(f);
      } else if (f.state === 'knockdown') {
        f.state = f.hp > 0 ? 'gettingUp' : 'knockedOut'; f.clock = f.hp > 0 ? .55 : 0;
        if (f.hp <= 0) break;
      } else {
        if(f.move?.heavy&&!f.move.projectile&&!f.hitConfirmed&&f.hitTargets.size===0)personalityMiss(this,f);
        f.state = 'idle';
        f.clock = 0; f.guardStun = false;
        f.move = null;
        f.moveName = null;
        this.removeHitbox(f);
      }
    }
  }

  step(dt = STEP, supplied = [emptyInput(), emptyInput()]) {
    if (this.disposed || this.paused) return;
    if (!Number.isFinite(dt) || dt <= 0 || dt > 1 / 30 + 1e-8) throw new Error('Use a fixed combat step of at most 1/30 second.');
    this.events = [];
    const inputs = [0, 1].map(index => ({ ...emptyInput(), ...supplied[index] }));
    const pressed = inputs.map((input, i) => ({
      jump: input.jump && !this.previous[i].jump,
      punch: input.punch && !this.previous[i].punch,
      kick: input.kick && !this.previous[i].kick,
      special: input.special && !this.previous[i].special,
      comedy: input.comedy && !this.previous[i].comedy,
      ...Object.fromEntries(LIMB_ACTIONS.map(action=>[action, Boolean(input[action] && !this.previous[i][action])])),
    }));
    if (this.hitStop > 0) { this.hitStop = Math.max(0, this.hitStop - dt); return; }
    this.previous = inputs;
    this.elapsed += dt;
    personalityTick(this,dt);
    if (this.phase === 'countdown') {
      this.countdown = Math.max(0, this.countdown - dt);
      if (this.countdown <= 1e-8) { this.countdown = 0; this.phase = 'fight'; }
      return;
    }
    if(this.phase==='celebration'){this.celebrationClock+=dt;this.settleBodies(dt);if(this.celebrationClock>=4.2)this.phase=this.afterCelebration;return;}
    if(this.phase==='bossTransform'){
      this.bossClock+=dt;this.fighters.forEach(f=>{f.vx=0;f.vy=0;f.y=0;});
      const boss=this.fighters.find(f=>f.definition.id===BOSS_ID);
      if(this.bossClock>=4)boss.bossForm=2;
      if(this.bossClock>=6){boss.hp=100;boss.state='idle';boss.move=null;this.phase='countdown';this.countdown=2;this.time=ROUND_SECONDS;this.fighters.forEach(f=>{f.state='idle';f.move=null;f.moveName=null;});}
      this.sync();return;
    }
    if (this.phase === 'finishReady') { this.finishClock += dt; this.settleBodies(dt); if(this.finishClock >= 1.1){this.phase='finisher';this.finishClock=0;} return; }
    if (this.phase === 'finisher') {
      const winner=this.fighters[this.result.matchWinner],victim=this.fighters[1-winner.index];
      if(winner.definition.id==='kardozo'&&!winner.slamFinisherStart){
        const options=slamOptionsFor(winner,victim,true);
        winner.slamFinisherStart={startGrip:options.startGrip,startAngle:options.startAngle};
      }
      this.finishClock=Math.min(10,this.finishClock+dt);
      if(winner.definition.id==='kardozo'){
        const pose=slamPose(this.finishClock,slamOptionsFor(winner,victim,true));
        victim.x=clamp(winner.x+winner.facing*(pose.victimCenter.x-800)*SLAM_WORLD_SCALE,-LIMIT,LIMIT);
        victim.y=this.finishClock>=SLAM_ACTION_END?0:Math.max(0,(700-pose.victimCenter.y)*SLAM_WORLD_SCALE);
        victim.vx=0;victim.vy=0;this.sync();
      }
      if(this.finishClock>=10){this.result.reason='FUCKTALITY';this.startVictory('matchOver');}return;
    }
    if (this.phase !== 'fight') { this.settleBodies(dt);return; }
    this.time = Math.max(0, this.time - dt);
    for (let i = 0; i < 2; i++) {
      const f = this.fighters[i], other = this.fighters[1 - i], input = inputs[i];
      if (f.capturedBy !== null) continue;
      // Attack edges are consumed during startup, active and recovery/stun; no queued repeats.
      if(f.state==='idle')startSignature(this,f);
      const rightThrow = input.punchRight && input.kickRight && (pressed[i].punchRight || pressed[i].kickRight);
      const leftThrow = input.punchLeft && input.kickLeft && (pressed[i].punchLeft || pressed[i].kickLeft);
      // Throw chords: RIGHT PUNCH+RIGHT KICK = throw #1; LEFT PUNCH+LEFT KICK = throw #2.
      // Kardozo remains excluded from this generic throw path.
      const chord = f.definition.id === 'kardozo' ? null : rightThrow ? 'punchThrow' : leftThrow ? 'kickThrow' : null;
      // Let the second limb button cancel a punch/kick's early windup to
      // recognize a deliberately simultaneous chord on keyboard or touch.
      if (chord && f.state === 'startup' && f.move?.limb && f.clock > f.move.startup - .16) {
        f.state = 'idle'; f.move = null; f.moveName = null; f.clock = 0;
      }
      const free = f.state === 'idle'&&!f.emoteLock;
      if (free || f.state === 'stun') f.facing = Math.sign(other.x - f.x) || f.facing;
      const grounded = f.y <= .001 && f.vy <= 0;
      if (free || (f.state === 'stun' && f.guardStun)) f.crouching = Boolean(grounded && input.down);
      else f.crouching = Boolean(f.move?.crouch || (f.moveName === 'uppercut' && f.state === 'startup'));
      const backHeld = f.facing > 0 ? Boolean(input.left) : Boolean(input.right);
      const attackEdge = pressed[i].punchLeft || pressed[i].punchRight || pressed[i].kickLeft || pressed[i].kickRight;
      const backAttack = backHeld && attackEdge;
      const wantsSpecialChord = input.block && pressed[i].punchRight && f.meter >= METER_MAX && f.definition.id !== 'kardozo';
      // Holding AWAY from the opponent is the defensive retreat: block + move backward.
      // An attack edge while holding BACK takes priority so BACK+attack can become a distinct retreating strike.
      f.blocking = Boolean(!wantsSpecialChord && !backAttack && (free || (f.state === 'stun' && f.guardStun)) &&
        (input.block || (backHeld && !input.jump)) && grounded);
      if (free && !f.blocking) {
        if (backAttack) f.vx = f.facing * -1.65;
        else f.vx = f.crouching ? 0 : (Number(input.right) - Number(input.left)) * 3.6;
        if (pressed[i].jump && grounded && !input.down) { f.vy = 9.8; f.crouching = false; }
        const aerial = !grounded || f.vy > 0;
        const forward = f.facing > 0 ? input.right : input.left;
        // H+T / L+I is a simple two-key special shortcut. Dedicated SPECIAL
        // remains available as E / U and on touch controls.
        const specialChord = input.block && pressed[i].punchRight && f.meter >= METER_MAX;
        if (chord) this.startMove(f, chord, CHORD_THROWS[chord]);
        else if (pressed[i].special || specialChord) this.startSpecial(f);
        else if (pressed[i].comedy) this.startComedy(f);
        else {
          const action=LIMB_ACTIONS.find(name=>pressed[i][name]) ?? (pressed[i].punch?'punchLeft':pressed[i].kick?'kickLeft':null);
          if(action){const posture=aerial?'air':input.down?'crouch':'stand';const move=limbMove(f.definition.id,action,posture,Boolean(forward&&!aerial&&!input.down));this.startMove(f,action,move);}
        }
      } else if (f.blocking) {
        // Defensive retreat: keep the fighter moving away while guarding.
        const retreatSpeed = f.crouching ? 0.9 : 1.55;
        f.vx = f.facing * -retreatSpeed;
      }
      else f.vx *= Math.exp(-9 * dt);
      if (f.state === 'active' && f.move?.rushSpeed) f.vx = f.facing * f.move.rushSpeed;
      f.x = clamp(f.x + f.vx * dt, -LIMIT, LIMIT);
      const wasAirborne = f.y > .001;
      f.vy -= 23 * dt;
      f.y = Math.max(0, f.y + f.vy * dt);
      if (f.y === 0) {
        f.vy = 0;
        if (wasAirborne && f.state === 'knockdown') this.events.push({ type: 'land', serial: ++this.serial, owner: i, x: f.x, y: .2 });
        if (wasAirborne && f.move?.air) {
          this.removeHitbox(f); f.move = null; f.moveName = null; f.state = 'stun'; f.clock = .10;
        }
      }
      this.advanceState(f, dt);
      this.pulse(f);
    }
    this.updateDogs();
    this.updateCaptures();
    this.separateBodies();
    this.sync();
    const pending = [];
    const captures = [];
    for (let i = 0; i < 2; i++) {
      const attacker = this.fighters[i], defender = this.fighters[1 - i];
      if (attacker.state === 'active' && attacker.move?.kind === 'grab' && attacker.grabTarget === null) {
        const canCatch = attacker.move.active - attacker.clock <= attacker.move.captureWindow && !['knockdown','knockedOut','gettingUp'].includes(defender.state);
        if (canCatch && attacker.hitbox?.intersectsBox(defender.hurtbox) && (defender.y <= .25||attacker.move.id==='four-slams')) captures.push({ attacker, defender });
        continue;
      }
      const pulseReady = !attacker.move?.pulses || attacker.pulseIndex >= 0;
      if (attacker.state === 'active' && attacker.hitbox && pulseReady && !['knockdown','knockedOut','gettingUp'].includes(defender.state) && !attacker.hitTargets.has(1 - i) && attacker.hitbox.intersectsBox(defender.hurtbox)) {
        attacker.hitTargets.add(1 - i);
        pending.push(this.makeHit(i, attacker.move, attacker.facing));
      }
    }
    for (let n = this.projectiles.length - 1; n >= 0; n--) {
      const projectile = this.projectiles[n];
      if (projectile.delay > 0) { projectile.delay = Math.max(0, projectile.delay - dt); continue; }
      if(projectile.move.kind==='skulls'){const target=this.fighters[1-projectile.owner];projectile.vx=Math.sign(target.x-projectile.x)*projectile.move.projectile.speed;projectile.y+=(target.y+3*fighterScale(target.definition.id)*.38-projectile.y)*dt*4;}
      projectile.x += projectile.vx * dt; projectile.life -= dt;
      projectile.mesh.position.set(projectile.x, projectile.y, 0); projectile.mesh.updateMatrixWorld(true);
      projectile.box.setFromObject(projectile.mesh);
      const defender = this.fighters[1 - projectile.owner];
      const hits = !['knockdown','knockedOut','gettingUp'].includes(defender.state) && projectile.box.intersectsBox(defender.hurtbox);
      if (hits) pending.push(this.makeHit(projectile.owner, projectile.move, projectile.facing, projectile.volleyIndex === (projectile.move.projectile.count ?? 1) - 1));
      if (hits || projectile.life <= 0 || Math.abs(projectile.x) > 8) {
        projectile.mesh?.geometry?.dispose(); this.projectiles.splice(n, 1);
      }
    }
    // Gather before applying: genuinely simultaneous attacks can trade and double-KO.
    for (const hit of pending) this.applyHit(hit);
    for (const pair of captures) this.capture(pair.attacker, pair.defender);
    this.updateCaptures();
    this.sync();
    const [a, b] = this.fighters;
    // Finish the visible four-landings sequence before announcing a KO/time-up.
    if (this.fighters.some(f => f.hp > 0 && f.state === 'active' && f.move?.id === 'four-slams' && f.grabTarget !== null)) return;
    if (a.hp <= 0 || b.hp <= 0) this.finishRound(a.hp === b.hp ? null : a.hp > b.hp ? 0 : 1, a.hp === b.hp ? 'DOUBLE KO' : 'KO');
    else if (this.time <= 1e-8) this.finishRound(a.hp === b.hp ? null : a.hp > b.hp ? 0 : 1, a.hp === b.hp ? 'DRAW' : 'TIME UP');
  }

  settleBodies(dt) {
    for(const f of this.fighters){if(f.hp>0){f.state='idle';f.move=null;f.moveName=null;f.y=0;f.vy=0;continue;}
      f.vy-=23*dt;f.y=Math.max(0,f.y+f.vy*dt);if(f.y===0){f.vy=0;f.state='knockedOut';} }
    this.sync();
  }

  separateBodies() {
    const [a, b] = this.fighters;
    if (a.capturedBy !== null || b.capturedBy !== null) return;
    if (Math.abs(a.y - b.y) >= 1.55) return;
    const distance = Math.abs(b.x - a.x);
    if (distance >= RADIUS * 2) return;
    const direction = Math.sign(b.x - a.x) || a.facing;
    const overlap = RADIUS * 2 - distance;
    const firstA = clamp(a.x - direction * overlap / 2, -LIMIT, LIMIT);
    const firstB = clamp(b.x + direction * overlap / 2, -LIMIT, LIMIT);
    a.x = firstA; b.x = firstB;
    const remaining = RADIUS * 2 - Math.abs(b.x - a.x);
    if (remaining > 0) {
      if (Math.abs(a.x) >= LIMIT - .0001) b.x = clamp(a.x + direction * RADIUS * 2, -LIMIT, LIMIT);
      else a.x = clamp(b.x - direction * RADIUS * 2, -LIMIT, LIMIT);
    }
  }

  makeHit(i, move, facing, finalOverride) {
    const attacker = this.fighters[i], defender = this.fighters[1 - i];
    const front = move.projectile ? -facing === defender.facing : (Math.sign(attacker.x - defender.x) || -facing) === defender.facing;
    const guardsLevel = move.level === 'low' ? defender.crouching : move.level === 'overhead' ? !defender.crouching : true;
    return { i, move, facing, final: finalOverride ?? (!move.pulses || attacker.pulseIndex === move.pulses - 1),
      blocked: Boolean(!move.unblockable && defender.blocking && front && guardsLevel) };
  }

  applyHit({ i, move, facing, blocked, final = true }) {
    const attacker = this.fighters[i], defender = this.fighters[1 - i];
    if(defender.emote==='bong'){defender.x=clamp(defender.x-defender.facing*.22,-LIMIT,LIMIT);this.events.push({type:'dodge',owner:defender.index});return;}
    const continuing = defender.state === 'stun' || defender.capturedBy !== null;
    this.releaseGrab(defender);
    defender.hp = Math.max(0, defender.hp - (blocked ? 0 : move.damage));
    const knockdown = !blocked && (defender.hp===0 || final && move.knockdown) && defender.capturedBy === null;
    const impactHeight=attacker.y+(move.y??move.projectile?.y??1.3)*fighterScale(attacker.definition.id)-defender.y;
    defender.hitRegion=blocked?null:(impactHeight>=2.1*fighterScale(defender.definition.id)?'head':impactHeight<.65*fighterScale(defender.definition.id)?'legs':'torso');
    if (!blocked) {
      personalityHit(this,defender,defender.hitRegion);
      if (attacker.definition.id !== 'kardozo') defender.gagReadyUntil = this.elapsed + 1.45;
    }
    if(!blocked&&move.id==='eyebrow-skulls'){emote(this,attacker,'miss',2);attacker.emoteText='NOW YOU KNOW HOW TO FUCKING HURRY! FINISH GETTING YOUR ASS BIT—I GOTTA PEE!';}
    defender.reactionUntil=this.elapsed+(knockdown?1.4:move.stun??.4);
    defender.vx = defender.capturedBy !== null ? 0 : facing * (blocked ? 1.0 : final ? move.finalPush ?? move.push : move.push);
    defender.state = knockdown ? 'knockdown' : 'stun';
    defender.clock = blocked ? .10 : knockdown ? Math.max(.78,move.knockdown||0) : move.stun;
    defender.guardStun = blocked;
    if (!blocked && final && move.launch && defender.capturedBy === null) defender.vy = move.launch;
    defender.move = null; defender.moveName = null; defender.blocking = false; defender.crouching = false;
    this.removeHitbox(defender);
    if (blocked) { this.gainMeter(defender, 10); if (!move.kind) this.gainMeter(attacker, move.comedy ? Math.max(1, Math.floor(4 / (move.pulses ?? 1))) : 4); }
    else { this.gainMeter(defender, Math.ceil(move.damage * .5)); if (!move.kind) this.gainMeter(attacker, move.comedy ? Math.max(1, Math.floor(12 / (move.pulses ?? 1))) : 12); }
    if (!blocked) {
      const combo = this.combos[i];
      if (!continuing || this.elapsed > combo.until) { combo.hits = 0; combo.damage = 0; }
      combo.hits++; combo.damage += move.damage; combo.until = this.elapsed + 1.15;
      attacker.hitConfirmed = true;
      this.hitStop = Math.max(this.hitStop, move.kind ? .075 : move.heavy ? .065 : .035);
    }
    const slamImpact = move.id === 'four-slams' && attacker.grabTarget !== null ? slamPose(slamTime(attacker.move.active - attacker.clock, attacker.move.active), {opponentHeight:slamOpponentHeight(defender.definition.id),startGrip:attacker.slamStart}).impactPoint : null;
    this.events.push({ serial: ++this.serial, type: blocked ? 'block' : 'hit', attacker: i, defender: 1 - i,
      x: slamImpact ? attacker.x + facing * (slamImpact.x - 800) * SLAM_WORLD_SCALE : defender.x - facing * .3,
      y: slamImpact ? .15 : defender.y + (move.y ?? move.projectile?.y ?? 1.3),
      region: defender.hitRegion, damage: blocked ? 0 : move.damage, special: move.kind ? move.id : null, kind: move.kind, comedy: move.comedy ?? null, comicId: move.comedy ? move.id : null, comicQuip: move.quips?.[Math.max(0, attacker.pulseIndex) % move.quips.length],
      heavy: Boolean(move.heavy || move.kind), knockdown: Boolean(knockdown), final, moveName: move.label ?? move.name });
  }

  finishRound(winner, reason) {
    if (this.phase !== 'fight') return;
    const boss=this.fighters.find(f=>f.definition.id===BOSS_ID);
    if(boss&&winner!==null&&this.fighters[winner]!==boss&&boss.bossForm===1){
      for(const f of this.fighters){this.releaseGrab(f);this.removeHitbox(f);f.move=null;f.moveName=null;f.blocking=false;f.vx=0;}
      this.clearProjectiles();this.bossClock=0;this.phase='bossTransform';this.result=null;this.hitStop=0;return;
    }
    if(boss&&winner!==null)this.fighters[winner].wins=1;
    for (const f of this.fighters) { this.releaseGrab(f); this.removeHitbox(f); f.blocking = false; f.vx = 0; f.slamFinisherStart=null; }
    this.clearProjectiles();
    if (winner !== null) this.fighters[winner].wins++;
    const matchWinner = this.fighters.findIndex(f => f.wins >= 2);
    this.result = { winner, reason, matchWinner: matchWinner < 0 ? null : matchWinner };
    // On a completed normal match, always play the winner's finisher, whether
    // the last round ended by KO or by time-up. Keep Kardozo's original KO-only rule.
    const winnerId = winner===null ? null : this.fighters[winner].definition.id;
    const showFinisher = winnerId && !this.bossBattle && finisherFor(winnerId) &&
      (reason==='KO' || (winnerId!=='kardozo' && reason==='TIME UP'));
    this.phase = matchWinner < 0 ? 'roundOver' : showFinisher ? 'finishReady' : 'matchOver';
    this.finishClock=0;
    if(this.phase==='finishReady')this.events.push({type:'finisherStart',serial:++this.serial,owner:matchWinner,defender:1-matchWinner});
    if(this.phase==='roundOver'||this.phase==='matchOver')this.startVictory(this.phase);
  }

  startVictory(after){
    if(this.bossBattle||this.result?.winner===null){this.phase=after;return;}
    this.afterCelebration=after;this.phase='celebration';this.celebrationClock=0;
    const winner=this.fighters[this.result.winner],loser=this.fighters[1-this.result.winner];
    emote(this,winner,winner.hp<=10?'closeWin':'win',4.2);emote(this,loser,'loss',4.2);
  }

  setPaused(value) { this.paused = Boolean(value); this.previous = [emptyInput(), emptyInput()]; }

  nextRound() {
    if (this.phase !== 'roundOver') return;
    this.round = this.fighters[0].wins + this.fighters[1].wins + 1;
    this.resetRound();
  }

  rematch() { for (const f of this.fighters) f.wins = 0; this.round = 1; this.resetRound(); }

  resetRound() {
    this.clearProjectiles(); this.hitStop = 0; this.combos = [{ hits: 0, damage: 0, until: 0 }, { hits: 0, damage: 0, until: 0 }];
    this.fighters.forEach((f, i) => {
      this.removeHitbox(f);
      Object.assign(f, { x: i === 0 ? -2.3 : 2.3, y: 0, vx: 0, vy: 0, facing: i === 0 ? 1 : -1,
        emote:null,emoteLock:false,emoteTime:0,emoteText:'',introPlayed:false,requestSignature:null,guardWait:0,bigMisses:0,hp: 100, bossForm:f.definition.id===BOSS_ID?1:null, meter: 0, noticeUntil: 0, state: 'idle', clock: 0, move: null, moveName: null, blocking: false,
        pulseIndex: -1, grabTarget: null, capturedBy: null, crouching: false, wasAirborne: false, hitConfirmed: false, guardStun: false,hitRegion:null,reactionUntil:0,gagReadyUntil:0 });
      f.hitTargets.clear();
    });
    this.previous = [emptyInput(), emptyInput()];
    this.finishClock=0;this.time = ROUND_SECONDS; this.countdown = 3; this.phase = 'countdown'; this.result = null; this.paused = false; this.events = [];
    this.sync();
  }

  snapshot() {
    return { phase: this.phase, paused: this.paused, round: this.round, time: Math.ceil(Math.max(0, this.time - 1e-8)),
      bossClock:this.bossClock??0,bossForm:this.fighters.find(f=>f.definition.id===BOSS_ID)?.bossForm??null,finisherTime:this.finishClock??0,finisherId:this.result?.matchWinner!=null?this.fighters[this.result.matchWinner].definition.id:null,
      countdown: Math.ceil(this.countdown), result: this.result ? { ...this.result } : null,
      players: this.fighters.map(f => ({ id: f.definition.id, name: f.definition.name, health: f.hp, wins: f.wins,
        emoteText:f.move?.kind==='minions'?(f.state==='recovery'?'BITCHES! WRONG FUCKING WAY! I GOT BUGLES! GET YOUR ASSES BACK HERE!':'THAT’S RIGHT! GARE-CHI GOT BITCHES!'):f.emoteText??'',emote:f.emote??null,hitRegion:f.hitRegion, reaction:this.elapsed < f.reactionUntil ? f.hitRegion : null,
        x: f.x, y: f.y, facing: f.facing, state: f.state, blocking: f.blocking, crouching: f.crouching, move: f.moveName,
        moveLabel: f.move?.comedy === 'sneeze' && f.state === 'active' ? 'SNEEZE ' + Math.max(0, f.pulseIndex + 1) + '/6' : f.move?.label ?? (f.moveName === 'special' ? f.special?.name : '') ?? '',
        combo: this.elapsed < this.combos[f.index].until && this.combos[f.index].hits > 1 ? { hits: this.combos[f.index].hits, damage: this.combos[f.index].damage } : null,
        comedyName: f.comedy?.label ?? '', comedyId: f.comedy?.id ?? '',
        meter: Math.floor(f.meter), specialName: f.special?.name ?? '', specialId: f.special?.id ?? '',
        gagReady: f.definition.id !== 'kardozo' && f.meter >= GAG_COST && this.elapsed <= this.fighters[1-f.index].gagReadyUntil && Math.abs(f.x-this.fighters[1-f.index].x)<2.5,
        notice: this.elapsed < f.noticeUntil ? 'EARN A GAG: 35 METER + CLEAN HIT' : '' })) };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.clearProjectiles();
    for (const f of this.fighters) { this.removeHitbox(f); f.hurtMesh.geometry.dispose(); f.ghost.dispose(); }
  }
}

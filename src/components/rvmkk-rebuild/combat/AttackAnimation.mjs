export const POSE_NAMES = Object.freeze(['guard', 'punch-strike', 'kick-chamber', 'kick-strike']);

/** Pose changes follow the existing simulation clock, including while paused. */
export function attackPose(fighter) {
  const special = specialPose(fighter);
  if (special) return special.frame;
  if (!fighter.move || !fighter.moveName) return 0;
  if (fighter.moveName === 'punch') {
    if (fighter.state === 'active') return 1;
    if (fighter.state === 'recovery' && fighter.clock > fighter.move.recovery - .06) return 1;
    return 0;
  }
  if (fighter.moveName === 'kick') {
    if (fighter.state === 'startup') return 2;
    if (fighter.state === 'active') return 3;
    if (fighter.state === 'recovery') {
      if (fighter.clock > fighter.move.recovery - .10) return 3;
      if (fighter.clock > fighter.move.recovery * .25) return 2;
    }
  }
  return 0;
}

/** Sample one isolated atlas frame; inset by half a texel to avoid adjacent frames. */
export function setPoseUV(geometry, rectangle, imageWidth, imageHeight) {
  const [x, y, width, height] = rectangle;
  const left = (x + .5) / imageWidth, right = (x + width - .5) / imageWidth;
  const top = 1 - (y + .5) / imageHeight, bottom = 1 - (y + height - .5) / imageHeight;
  const uv = geometry.attributes.uv;
  uv.setXY(0, left, top); uv.setXY(1, right, top);
  uv.setXY(2, left, bottom); uv.setXY(3, right, bottom);
  uv.needsUpdate = true;
}
import { specialPose } from './SpecialMoves.mjs';
import { comedyPose } from './ComedyMoves.mjs';


export function combatPose(fighter) {
  if (['knockedOut','knockdown'].includes(fighter.state) && fighter.definition.id === 'kitaria')
    return {atlas:'base',frame:0,name:'kitaria-whole-body-down'};
  if (fighter.state === 'knockedOut' || fighter.state === 'knockdown') return {atlas:'limbs',frame:15,name:fighter.y>.05?'falling-on-back':'flat-on-back'};
  if (fighter.state === 'gettingUp' && fighter.definition.id === 'kitaria')
    return {atlas:'base',frame:0,name:'kitaria-whole-body-getting-up'};
  if (fighter.state === 'gettingUp') return {atlas:'limbs',frame:4,name:'getting-up'};
  if (fighter.state === 'stun' && !fighter.guardStun && fighter.hitRegion) return {atlas:'limbs',frame:{head:12,torso:13,legs:14}[fighter.hitRegion],name:'pain-'+fighter.hitRegion};
  if (fighter.move?.limb) {
    const move=fighter.move;
    if(fighter.state==='startup') {
      const right=move.limb.endsWith('Right'),kick=move.limb.startsWith('kick');
      const index=right?(move.posture==='air'?4:move.posture==='crouch'?2:0)+(kick?1:0):move.frame;
      return {atlas:right?'opposite':'limbs',frame:index,name:'windup-'+move.posture+'-'+move.limb};
    }
    if(fighter.state==='active'||fighter.state==='recovery'&&fighter.clock>move.recovery*.45){
      const right=move.limb.endsWith('Right');const frame=right?(move.posture==='air'?4:move.posture==='crouch'?2:0)+(move.limb.startsWith('kick')?1:0):move.frame;
      return {atlas:right?'opposite':'limbs',frame,name:move.posture+'-'+move.limb};
    }
    return {atlas:'base',frame:0,name:'recover-'+move.limb};
  }

  if (fighter.move?.chordThrow) {
    const kick=fighter.move.id==='kick-throw';
    return {atlas:kick?'expanded':'limbs',frame:kick?2:1,name:fighter.move.id+'-'+fighter.state};
  }
  const comedy = comedyPose(fighter);
  if (comedy) return comedy;
  const special = specialPose(fighter);
  if (special) return special;
  const name = fighter.moveName, state = fighter.state, move = fighter.move;
  if (name === 'uppercut') {
    if (state === 'startup') return { atlas: 'expanded', frame: 0, name: 'uppercut-windup' };
    if (state === 'active' || (state === 'recovery' && fighter.clock > move.recovery - .15)) return { atlas: 'expanded', frame: 1, name: 'uppercut-strike' };
  }
  if (name === 'sweep') return { atlas: 'expanded', frame: state === 'active' || (state === 'recovery' && fighter.clock > move.recovery - .13) ? 2 : 0, name: state === 'active' ? 'sweep-strike' : 'sweep-windup' };
  if (name === 'airPunch' || name === 'airKick') return { atlas: 'expanded', frame: name === 'airPunch' ? 3 : 4, name: name === 'airPunch' ? 'jump-punch' : 'flying-kick' };
  if (fighter.crouching) return { atlas: 'expanded', frame: 0, name: fighter.blocking ? 'low-block' : 'crouch' };
  if (name === 'heavyPunch') return { atlas: 'base', frame: state === 'active' || (state === 'recovery' && fighter.clock > move.recovery - .13) ? 1 : 0, name: 'power-punch' };
  if (name === 'driveKick') return { atlas: 'base', frame: state === 'startup' || (state === 'recovery' && fighter.clock < move.recovery - .14) ? 2 : 3, name: 'drive-kick' };
  if (fighter.state === 'idle' && fighter.y > .05) return { atlas: 'base', frame: 2, name: 'jump' };
  const frame = attackPose(fighter);
  return { atlas: 'base', frame, name: POSE_NAMES[frame] };
}

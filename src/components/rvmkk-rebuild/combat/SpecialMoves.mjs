import {SIGNATURES} from './Personality.mjs';
export const METER_MAX = 100;

export const SPECIAL_MOVES = Object.freeze({
  'keen-kahn': Object.freeze({ id: 'royal-decree', name: 'ROYAL DECREE', kind: 'stamp', color: 0xff574d,
    startup: .42, active: .18, recovery: .48, reach: 2.15, height: 2.5, y: 1.25, damage: 34, stun: .50, push: 8.2,
    launch: 4.5, knockdown: .60, level: 'overhead' }),
  kitaria: Object.freeze({ id: 'fan-frenzy', name: 'FAN FRENZY', kind: 'fans', color: 0xc16cff,
    startup: .24, active: .64, recovery: .34, reach: 1.85, height: 2.3, y: 1.3, damage: 10, stun: .30,
    push: .7, finalPush: 6.5, launch: 8.3, knockdown: .38, pulses: 3, level: 'mid' }),
  treytaro: Object.freeze({ id: 'pizza-delivery', name: 'PIZZA DELIVERY', kind: 'pizza', color: 0xffad42,
    startup: .30, active: .16, recovery: .32, damage: 32, stun: .48, push: 7.5, launch: 5.8, knockdown: .48, level: 'mid',
    projectile: Object.freeze({ speed: 8.2, width: 1.0, height: .55, y: 1.3, life: 1.65 }) }),
  kardozo: Object.freeze({ id: 'four-arm-hug', name: 'FOUR-ARM HUG', kind: 'grab', color: 0xf1ad63,
    startup: .26, active: .84, recovery: .38, reach: 1.05, height: 1.8, y: 1.2, damage: 8, stun: .22, push: 0,
    pulses: 4, pulseDelay: .10, captureWindow: .20, unblockable: true, rushSpeed: .85 }),
  gaibden: Object.freeze({ id: 'bad-connection', name: 'BAD CONNECTION', kind: 'lightning', color: 0x71c7ff,
    startup: .40, active: .18, recovery: .36, damage: 33, stun: .58, push: 7.8, launch: 5.4, knockdown: .42, level: 'mid',
    projectile: Object.freeze({ speed: 11, width: 1.15, height: .50, y: 1.55, life: 1.2 }) }),
  'datennisha-blaze': Object.freeze({ id: 'blaze-rush', name: 'BLAZE RUSH', kind: 'rush', color: 0xffbb5f,
    startup: .22, active: .72, recovery: .38, reach: 1.30, height: 1.3, y: 1.05, damage: 8, stun: .27,
    push: .65, finalPush: 8.2, launch: 5.8, knockdown: .45, pulses: 4, rushSpeed: 5.0, level: 'mid' }),
  // November import: playable first-pass specials (custom character animation
  // still requires approved art/QA). Existing projectile/rush VFX are reused.
  nicoleena: Object.freeze({ id:'tongue-whiplash',name:'TONGUE WHIPLASH',kind:'tongue',color:0xc47cee,
    startup:.27,active:.20,recovery:.42,damage:24,stun:.65,push:7.1,launch:3.2,knockdown:.48,level:'mid',
    projectile:Object.freeze({speed:12,width:1.4,height:.42,y:1.4,life:.9}) }),
  'cokane-o': Object.freeze({ id:'thirteen-count',name:'THIRTEEN COUNT',kind:'rush',color:0xed7961,
    startup:.26,active:.72,recovery:.42,reach:1.5,height:1.5,y:1.3,damage:9,stun:.34,push:.7,
    finalPush:7,launch:4.3,knockdown:.5,pulses:3,rushSpeed:3.3,level:'mid' }),
  scorpurtis: Object.freeze({ id:'chain-pull',name:'CHAIN PULL',kind:'chain',color:0xffc857,
    startup:.34,active:.16,recovery:.48,damage:27,stun:.58,push:7.2,launch:4.5,knockdown:.5,level:'mid',
    projectile:Object.freeze({speed:11,width:1.1,height:.38,y:1.45,life:1.1}) }),
  'gare-chi': Object.freeze({ id: 'bugles-burst', name: 'BUGLES BURST', kind: 'bugles', color: 0xffd35a,
    startup: .25, active: .26, recovery: .34, damage: 10, stun: .26, push: .65, finalPush: 7.6,
    launch: 4.3, knockdown: .40, level: 'mid',
    projectile: Object.freeze({ speed: 9.5, width: .65, height: .50, y: 1.15, life: 1.4, count: 3, interval: .10,
      yOffsets: Object.freeze([0, .30, -.10]) }) }),
});

export function specialFor(id) { const move={gaibden:SIGNATURES.flight,'datennisha-blaze':SIGNATURES.skulls,'gare-chi':SIGNATURES.minions,kardozo:SIGNATURES['four-slams']}[id];return move?{...move,name:move.name??move.label}:SPECIAL_MOVES[id]??null; }

/** Pose selection is driven only by the fixed simulation clock. */
export function specialPose(fighter) {
  const move = fighter.move;
  if (fighter.moveName !== 'special' || !move) return null;
  if (['tongue','chain'].includes(move.kind)) {
    if(fighter.state==='startup')return {atlas:'base',frame:2,name:move.id+'-charge'};
    return {atlas:'expanded',frame:4,name:move.id+'-release'};
  }
  if (move.kind === 'grab') {
    if (fighter.state === 'startup') return { atlas: 'hug', frame: 0, name: 'hug-windup' };
    if (fighter.state === 'active') {
      const elapsed = move.active - fighter.clock;
      const frame = fighter.grabTarget === null ? 1 : Math.floor(elapsed / .13) % 2 ? 2 : 3;
      return { atlas: 'hug', frame, name: fighter.grabTarget === null ? 'hug-reach' : 'hug-squeeze' };
    }
    return { atlas: 'base', frame: 0, name: 'hug-recovery' };
  }
  if (fighter.state === 'recovery' && fighter.clock < move.recovery * .45) return { atlas: 'base', frame: 0, name: 'special-recovery' };
  if (move.kind === 'rush') {
    if (fighter.state === 'startup') return { atlas: 'base', frame: 2, name: 'blaze-chamber' };
    if (fighter.state === 'active') {
      const phase = Math.floor((move.active - fighter.clock) / (move.active / move.pulses));
      if (phase === 0) return { atlas: 'base', frame: 1, name: 'blaze-jab' };
      if (phase === 1) return { atlas: 'expanded', frame: 5, name: 'blaze-knee' };
      if (phase === 2) return { atlas: 'base', frame: 3, name: 'blaze-body-kick' };
      return { atlas: 'expanded', frame: 4, name: 'blaze-finishing-kick' };
    }
  }
  if (move.kind === 'stamp') return fighter.state === 'startup'
    ? { atlas: 'expanded', frame: 5, name: 'decree-windup' }
    : { atlas: 'base', frame: 1, name: 'decree-slam' };
  return { atlas: 'expanded', frame: 5, name: move.id + (fighter.state === 'startup' ? '-charge' : '-release') };
}

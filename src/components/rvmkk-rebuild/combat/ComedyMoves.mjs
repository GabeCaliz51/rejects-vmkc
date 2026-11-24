const move = data => Object.freeze({ level: 'mid', height: 1.0, y: 1.4, stun: .25, push: .35, ...data });
export const COMEDY_MOVES = Object.freeze({
  'cokane-o': move({
    id: 'cokane-poses', label: 'COKANE-O POSES', comedy: 'cokane-poses',
    startup: .2, active: 5.2, recovery: .25, cosmetic: true,
    color: 0xef705d,
  }),
  nicoleena: move({
    id: 'gecko-tongue', label: 'GECKO TONGUE', comedy: 'gecko-tongue',
    startup: .25, active: 3.6, recovery: .3, cosmetic: true,
    color: 0xc07ccb,
  }),
  gaibden: move({ id: 'doggy-paddle', label: 'DOGGY-PADDLE SLAPS', comedy: 'paddle', startup: .16, active: .66, recovery: .28,
    reach: 1.12, damage: 2, pulses: 6, stun: .18, finalPush: 3.6, color: 0x9fe6ff, quips: ['PAD!', 'PAD!', 'SPLAT!'], alternating: true }),
  'keen-kahn': move({ id: 'royal-tantrum', label: 'ROYAL TANTRUM', comedy: 'tantrum', startup: .22, active: .82, recovery: .38,
    reach: 1.25, damage: 5, pulses: 3, beats: Object.freeze([0, .22, .56]), stun: .38, finalPush: 7.2, launch: 3.2, knockdown: .35,
    color: 0xffd16e, quips: ['HOW DARE!', 'STOMP!', 'THRUST ISSUES!'], alternating: true }),
  kitaria: move({ id: 'six-sneeze-salute', label: 'SIX-SNEEZE SALUTE', comedy: 'sneeze', startup: .26, active: 1.08, recovery: .38,
    reach: 1.5, y: 1.95, height: .70, level: 'high', damage: 2, pulses: 6, pulseDelay: .08, stun: .22,
    push: .15, finalPush: 4.2, color: 0xd3a6ff, quips: ['ACHOO!'], alternating: true }),
  treytaro: move({ id: 'donkey-kick', label: 'DOUBLE-HOOF DONKEY KICK', comedy: 'hoof', startup: .30, active: .18, recovery: .40,
    reach: 1.55, y: .95, height: 1.05, damage: 16, stun: .38, push: 7.5, launch: 3.8, knockdown: .38,
    heavy: true, color: 0xffb76d, quips: ['ASS DELIVERY!'] }),
  kardozo: move({ id: 'pat-a-cake', label: 'FOUR-ARM PAT-A-CAKE', comedy: 'patty', startup: .20, active: .60, recovery: .30,
    reach: 1.12, y: 1.4, height: 1.25, damage: 5, pulses: 3, stun: .26, finalPush: 4.8, color: 0xffbb83,
    quips: ['PAT!', 'CAKE!', 'SPLAT!'], alternating: true }),
  'datennisha-blaze': move({ id: 'hip-check', label: 'BOOT CAMP HIP CHECK', comedy: 'hip', startup: .24, active: .18, recovery: .38,
    reach: 1.22, y: 1.0, height: 1.0, damage: 14, stun: .40, push: 8, launch: 3.1, knockdown: .35,
    rushSpeed: 2.5, heavy: true, color: 0xffca85, quips: ['BOOTY DUTY!'] }),
  'gare-chi': move({ id: 'snack-smack', label: 'SNACK BAG SMACK', comedy: 'snack', startup: .28, active: .15, recovery: .38,
    reach: 1.38, y: 1.7, height: .85, level: 'high', damage: 13, stun: .38, push: 5.8,
    color: 0xffdf7a, quips: ['HANDS OFF MY CHIPS!'] }),
});
export function comedyFor(id) { return COMEDY_MOVES[id] ?? null; }
export function comedyPose(fighter) {
  if (fighter.moveName !== 'comedy' || !fighter.move) return null;
  const m = fighter.move;
  const elapsed = fighter.state === 'active' ? m.active - fighter.clock : 0;
  if (m.comedy === 'cokane-poses') {
    const frame = fighter.state === 'startup' ? 0
      : fighter.state === 'recovery' ? 12
      : Math.min(12, Math.max(0, Math.floor(elapsed / m.active * 13)));
    return { atlas: 'poses', frame, name: 'cokane-pose-' + frame };
  }
  if (m.comedy === 'gecko-tongue') {
    const frame = fighter.state === 'startup' ? 0
      : fighter.state === 'recovery' ? 8
      : Math.min(8, Math.floor(elapsed / m.active * 9));
    return { atlas: 'tongue', frame, name: 'gecko-tongue-' + frame };
  }
  if (m.comedy === 'tantrum' && ((fighter.state === 'active' && elapsed >= .42) || fighter.state === 'recovery')) {
    const frame = fighter.state === 'recovery' ? 3 : elapsed < .49 ? 0 : elapsed < .56 ? 1 : 2;
    return { atlas: 'thrust', frame, name: frame === 2 ? 'royal-pelvic-thrust' : frame === 3 ? 'thrust-recoil' : 'thrust-windup' };
  }
  if (m.comedy === 'sneeze') {
    const interval = (m.active - m.pulseDelay) / m.pulses;
    const phase = Math.max(0, elapsed - m.pulseDelay) % interval;
    const frame = fighter.state === 'startup' ? 0 : fighter.state === 'recovery' ? 3 : elapsed < m.pulseDelay ? 0 : phase < .07 ? 1 : 2;
    return { atlas: 'comedy', frame, name: m.id + (frame === 1 ? '-achoo' : frame === 2 ? '-breathe' : frame === 3 ? '-recovery' : '-windup') };
  }
  let frame = 0;
  if (fighter.state === 'startup') frame = !m.alternating && fighter.clock < m.startup * .5 ? 1 : 0;
  if (fighter.state === 'active') frame = m.alternating ? 1 + Math.min((m.pulses ?? 1) - 1, Math.floor((m.active - fighter.clock) / (m.active / (m.pulses ?? 1)))) % 2 : 2;
  if (fighter.state === 'recovery') frame = fighter.clock > m.recovery * .18 ? 3 : 0;
  return { atlas: 'comedy', frame, name: m.id + '-' + ['windup', 'swing-a', 'swing-b', 'recoil'][frame] };
}

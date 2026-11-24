// This cosmetic clock never writes to the combat model, damage, hit boxes, or round results.
export class StageDirector {
  constructor(stage) {
    this.stage = stage;
    this.reset();
  }

  reset() {
    this.time = 0; this.nextAmbient = 1.4; this.nextReaction = 2;
    this.active = null; this.serial = 0; this.reactions = 0; this.pulse = 0;
    this.lastSource = ''; this.ambientIndex = 0; this.nearTime = 0; this.lastPositions = null;
  }

  begin(index, source) {
    const gag = this.stage.gags[index % this.stage.gags.length];
    this.active = { ...gag, started: this.time, duration: 4.8, source };
    this.serial++; this.pulse = 1; this.lastSource = source;
    if (source !== 'ambient') this.reactions++;
    this.nextReaction = this.time + 6;
    this.nextAmbient = this.time + 7.5;
    return true;
  }

  update(delta, phase) {
    if (!(delta > 0) || (phase !== 'fight' && phase !== 'countdown')) return;
    this.time += Math.min(delta, .1);
    this.pulse *= Math.exp(-2.5 * delta);
    if (this.active && this.time - this.active.started >= this.active.duration) this.active = null;
    if (!this.active && this.time >= this.nextAmbient) this.begin(this.ambientIndex++, 'ambient');
  }

  nearest(u, v, maximum = .18) {
    let best = -1, distance = Infinity;
    this.stage.gags.forEach((gag, index) => {
      const [x, y] = gag.actor;
      const d = Math.hypot((u - x) * 1.3, v - y);
      if (d < distance && d <= Math.max(maximum, gag.radius || .11)) { best = index; distance = d; }
    });
    return best;
  }

  tap(u, v, phase) {
    if (phase !== 'fight' && phase !== 'countdown') return false;
    const nearest = this.nearest(u, v, .1);
    const index = nearest < 0 ? this.ambientIndex++ % this.stage.gags.length : nearest;
    if (index < 0 || (this.active && this.time - this.active.started < 1.2)) return false;
    return this.begin(index, 'tap');
  }

  impact(event, u, v, phase) {
    if (phase !== 'fight' || event.type !== 'hit' || !(event.heavy || event.special) || this.active || this.time < this.nextReaction) return false;
    const index = this.nearest(u, v, .42);
    return index >= 0 ? this.begin(index, 'impact') : false;
  }

  proximity(points, phase) {
    if (phase !== 'fight') return;
    if (!this.lastPositions) { this.lastPositions = points.map(p => p[0]); return; }
    const moved = points.some((p, i) => Math.abs(p[0] - this.lastPositions[i]) > .012);
    this.lastPositions = points.map(p => p[0]);
    if (!moved || this.active || this.time < this.nextReaction + 3) return;
    for (const [u, v] of points) {
      const index = this.nearest(u, v, .2);
      if (index >= 0) { this.begin(index, 'proximity'); break; }
    }
  }
}

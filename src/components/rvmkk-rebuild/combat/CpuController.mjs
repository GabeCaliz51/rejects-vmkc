// CPU makes decisions at human reaction intervals and uses the same inputs as players.
export class CpuController {
  constructor({ random = Math.random, difficulty = 1 } = {}) { this.random=random; this.difficulty=difficulty; this.reset(); }
  reset() { this.wait=0; this.held={}; }
  read(model, dt) {
    if(model.paused || model.phase!=='fight') { this.reset(); return {}; }
    const self=model.fighters[1], other=model.fighters[0];
    this.wait-=dt;
    if(this.wait>0) return this.held;
    const r=this.random, distance=Math.abs(other.x-self.x), towards=other.x<self.x?'left':'right', away=towards==='left'?'right':'left';
    const input={};
    this.wait=.17+r()*.22/this.difficulty;
    if(self.state!=='idle') { this.held={};return {}; }
    if(distance>1.6) { input[towards]=true; if(r()<.10) input.jump=true; }
    else {
      const roll=r();
      if(other.state==='startup' && roll<.35) { input.block=true;input.down=other.crouching; }
      else if(roll<.13) input[away]=true;
      else if(roll<.24) { input.jump=true;input.kickRight=true; }
      else if(roll<.38) { input.down=true; input.kickLeft=true; }
      else if(self.special && self.meter>=100 && roll<.58) input.special=true;
      else if(self.comedy && roll<.52) input.comedy=true;
      else { input[['punchLeft','punchRight','kickLeft','kickRight'][Math.floor(r()*4)]]=true; if(r()<.25)input[towards]=true; }
    }
    // Edge actions last one tick; held movement/guard continues until next decision.
    this.held=Object.fromEntries(Object.entries(input).filter(([key])=>['left','right','down','block'].includes(key)));
    return input;
  }
}

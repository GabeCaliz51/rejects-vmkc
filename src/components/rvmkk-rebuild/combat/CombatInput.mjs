export const KEYMAP = Object.freeze({
  KeyA: [0, 'left'], KeyD: [0, 'right'], KeyW: [0, 'jump'], KeyS: [0, 'down'], KeyF: [0, 'punchLeft'], KeyG: [0, 'kickLeft'], KeyH: [0, 'block'], KeyT: [0, 'punchRight'], KeyY: [0, 'kickRight'], KeyE: [0, 'special'], KeyR: [0, 'comedy'],
  ArrowLeft: [1, 'left'], ArrowRight: [1, 'right'], ArrowUp: [1, 'jump'], ArrowDown: [1, 'down'], KeyJ: [1, 'punchLeft'], KeyK: [1, 'kickLeft'], KeyL: [1, 'block'], KeyI: [1, 'punchRight'], KeyP: [1, 'kickRight'], KeyU: [1, 'special'], KeyO: [1, 'comedy'],
});
const EDGE_ACTIONS = new Set(['jump', 'punchLeft', 'punchRight', 'kickLeft', 'kickRight', 'special', 'comedy']);

/** Keep short taps for one simulation step, then consume them even during a locked move. */
export class LocalInput {
  constructor() { this.keys = new Set(); this.pointers = new Map(); this.pressed = [new Set(), new Set()]; this.edgeFrames = [new Map(),new Map()]; }
  keyDown(code) {
    const mapping = KEYMAP[code];
    if (mapping && !this.keys.has(code) && EDGE_ACTIONS.has(mapping[1])) {
      this.pressed[mapping[0]].add(mapping[1]);
      this.edgeFrames[mapping[0]].set(mapping[1],10);
    }
    this.keys.add(code);
  }
  keyUp(code) { this.keys.delete(code); }
  setPointer(player, action, id, down) {
    if (down) {
      if (!this.pointers.has(id) && EDGE_ACTIONS.has(action)) {
        this.pressed[player].add(action);
        this.edgeFrames[player].set(action,10);
      }
      this.pointers.set(id, [player, action]);
    } else this.pointers.delete(id);
  }
  read() {
    const states = [{}, {}];
    for (const key of this.keys) { const mapping = KEYMAP[key]; if (mapping) states[mapping[0]][mapping[1]] = true; }
    for (const [player, action] of this.pointers.values()) states[player][action] = true;
    this.pressed.forEach((actions, player) => {
      for (const action of actions) states[player][action] = true; actions.clear();
      for (const [action,frames] of this.edgeFrames[player]) {
        states[player][action] = true;
        if(frames<=1)this.edgeFrames[player].delete(action);
        else this.edgeFrames[player].set(action,frames-1);
      }
    });
    return states;
  }
  clear() { this.keys.clear(); this.pointers.clear(); this.pressed.forEach(actions => actions.clear()); this.edgeFrames.forEach(frames => frames.clear()); }
}

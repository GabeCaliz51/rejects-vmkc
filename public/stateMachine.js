export const Phase = Object.freeze({
  IDLE: 'idle',
  STARTUP: 'startup',
  ACTIVE: 'active',
  RECOVERY: 'recovery'
});

export class StateMachine {
  #phase = Phase.IDLE;
  #phaseFrame = 0;

  set phase(val) {
    if (this.#phase !== val) {
      this.#phase = val;
      this.#phaseFrame = 0;
    }
  }
  get phase() { return this.#phase; }
  get frame() { return this.#phaseFrame; }

  tick() { this.#phaseFrame++; }
  in(...allowed) { return allowed.includes(this.#phase); }
}
import { Timer } from "three";

// R3F 9.8 expects Clock's interface; Three r185 deprecates Clock in favour of Timer.
// This adapter owns no DOM listeners and does not change Three or silence warnings.
export class FrameClock {
  constructor() {
    this.timer = new Timer();
    this.running = false;
    this.autoStart = true;
    this.elapsedTime = 0;
    this.oldTime = 0;
  }
  start() {
    this.timer.reset();
    this.elapsedTime = 0;
    this.running = true;
  }
  stop() {
    this.running = false;
    this.autoStart = false;
  }
  getDelta() {
    if (!this.running) {
      if (this.autoStart) this.start();
      return 0;
    }
    this.timer.update();
    const delta = this.timer.getDelta();
    this.elapsedTime += delta;
    return delta;
  }
  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }
}

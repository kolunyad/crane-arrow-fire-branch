export class Sfx {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  muted = false;
  musicOn = false;
  private voices = 0;
  private step = 0;
  private acc = 0;

  unlock() {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.22;
      this.sfxBus.gain.value = 0.85;
      this.musicBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.master.gain.value = this.muted ? 0 : 0.9;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.03);
  }

  tick(dt: number) {
    if (!this.musicOn || !this.ctx || this.muted || !this.musicBus) return;
    this.acc += dt;
    const stepDur = 0.32;
    while (this.acc >= stepDur) {
      this.acc -= stepDur;
      this.note(this.step);
      this.step += 1;
    }
  }

  private note(step: number) {
    const scale = [146.83, 174.61, 196, 220, 261.63, 293.66];
    const pattern = [0, 2, 4, 3, 2, 4, 5, 3, 1, 2, 3, 2];
    const freq = scale[pattern[step % pattern.length] ?? 0] ?? 196;
    if (!this.ctx || !this.musicBus) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq / (step % 8 === 0 ? 2 : 1);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(step % 8 === 0 ? 0.09 : 0.045, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(gain);
    gain.connect(this.musicBus);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  rocket() {
    this.noise(0.18, 180, 90, 0.2, "sawtooth");
  }

  boom() {
    this.noise(0.32, 140, 40, 0.35, "square");
  }

  hit() {
    this.blip(520, 0.06, 0.08, "square");
  }

  hurt() {
    this.blip(90, 0.18, 0.2, "sawtooth");
  }

  gem() {
    this.blip(880, 0.07, 0.06, "triangle");
  }

  level() {
    this.blip(523, 0.1, 0.08, "triangle");
    window.setTimeout(() => this.blip(659, 0.12, 0.08, "triangle"), 90);
    window.setTimeout(() => this.blip(784, 0.16, 0.09, "triangle"), 180);
  }

  swing() {
    this.noise(0.08, 400, 180, 0.12, "square");
  }

  die() {
    this.blip(70, 0.4, 0.25, "sawtooth");
  }

  win() {
    this.blip(392, 0.16, 0.1, "triangle");
    window.setTimeout(() => this.blip(523, 0.2, 0.1, "triangle"), 140);
    window.setTimeout(() => this.blip(659, 0.28, 0.12, "triangle"), 280);
  }

  private blip(freq: number, dur: number, vol: number, type: OscillatorType) {
    if (!this.ctx || !this.sfxBus || this.voices > 16) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * (0.94 + Math.random() * 0.12), t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    this.voices += 1;
    osc.onended = () => {
      this.voices = Math.max(0, this.voices - 1);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, from: number, to: number, vol: number, type: OscillatorType) {
    if (!this.ctx || !this.sfxBus || this.voices > 16) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    this.voices += 1;
    osc.onended = () => {
      this.voices = Math.max(0, this.voices - 1);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}

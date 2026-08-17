/**
 * Procedural sound effects - no audio files, everything is synthesised with
 * WebAudio so hits, guns and explosions cost nothing to ship.
 */

import type { FxEvent } from "./match";

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  muted = false;
  volume = 0.5;

  /** Must be called from a user gesture before any sound can play. */
  resume() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.makeNoise(this.ctx);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : this.volume;
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.6);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private noise(opts: {
    duration: number;
    gain: number;
    filter: number;
    type?: BiquadFilterType;
    sweepTo?: number;
    delay?: number;
  }) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noiseBuffer || this.muted) return;
    const t = ctx.currentTime + (opts.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type ?? "bandpass";
    filter.frequency.setValueAtTime(opts.filter, t);
    if (opts.sweepTo) filter.frequency.exponentialRampToValueAtTime(opts.sweepTo, t + opts.duration);
    filter.Q.value = 1.1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.gain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.duration);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + opts.duration + 0.02);
  }

  private tone(opts: {
    freq: number;
    to?: number;
    duration: number;
    gain: number;
    type?: OscillatorType;
    delay?: number;
  }) {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted) return;
    const t = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? "square";
    osc.frequency.setValueAtTime(opts.freq, t);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + opts.duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.gain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + opts.duration + 0.02);
  }

  /** Plays whatever a simulation effect should sound like. */
  play(e: FxEvent) {
    if (!this.ctx || this.muted) return;
    const s = Math.min(2, e.scale ?? 1);
    switch (e.kind) {
      case "blunt":
        this.noise({ duration: 0.13, gain: 0.5 * s, filter: 900, sweepTo: 180 });
        this.tone({ freq: 150, to: 60, duration: 0.1, gain: 0.28 * s, type: "triangle" });
        break;
      case "slash":
        this.noise({ duration: 0.16, gain: 0.36 * s, filter: 3200, sweepTo: 900, type: "highpass" });
        this.tone({ freq: 900, to: 320, duration: 0.09, gain: 0.12, type: "sawtooth" });
        break;
      case "pierce":
        this.noise({ duration: 0.1, gain: 0.32 * s, filter: 2400, sweepTo: 700 });
        this.tone({ freq: 620, to: 240, duration: 0.08, gain: 0.14, type: "square" });
        break;
      case "shot":
        this.noise({ duration: 0.07, gain: 0.55, filter: 2600, sweepTo: 300, type: "highpass" });
        this.tone({ freq: 260, to: 70, duration: 0.12, gain: 0.3, type: "square" });
        break;
      case "explode":
        this.noise({ duration: 0.5, gain: 0.6 * s, filter: 700, sweepTo: 90, type: "lowpass" });
        this.tone({ freq: 110, to: 34, duration: 0.42, gain: 0.34, type: "triangle" });
        break;
      case "burn":
        this.noise({ duration: 0.3, gain: 0.3, filter: 1400, sweepTo: 400 });
        break;
      case "block":
        this.noise({ duration: 0.09, gain: 0.3, filter: 1800, type: "bandpass" });
        this.tone({ freq: 420, to: 300, duration: 0.07, gain: 0.1, type: "square" });
        break;
      case "parry":
        this.tone({ freq: 1180, to: 1600, duration: 0.16, gain: 0.24, type: "sine" });
        this.tone({ freq: 1760, duration: 0.2, gain: 0.12, type: "sine", delay: 0.03 });
        break;
      case "spark":
        this.noise({ duration: 0.08, gain: 0.22, filter: 3800, type: "highpass" });
        break;
      case "dust":
        this.noise({ duration: 0.1, gain: 0.1, filter: 600, type: "lowpass" });
        break;
      case "super":
        this.tone({ freq: 180, to: 720, duration: 0.5, gain: 0.3, type: "sawtooth" });
        this.noise({ duration: 0.6, gain: 0.28, filter: 400, sweepTo: 3000, type: "bandpass" });
        break;
      case "guardBreak":
        this.tone({ freq: 320, to: 90, duration: 0.4, gain: 0.34, type: "square" });
        this.noise({ duration: 0.3, gain: 0.3, filter: 1200, sweepTo: 200 });
        break;
      case "ko":
        this.tone({ freq: 420, to: 60, duration: 0.8, gain: 0.4, type: "sawtooth" });
        this.noise({ duration: 0.7, gain: 0.4, filter: 900, sweepTo: 80, type: "lowpass" });
        break;
      case "spawn":
        this.noise({ duration: 0.06, gain: 0.14, filter: 2200 });
        break;
      default:
        break;
    }
  }

  /** Round announcer blips, used for "Round 1" / "Fight!" / round end. */
  cue(kind: "round" | "fight" | "win") {
    if (!this.ctx || this.muted) return;
    if (kind === "round") {
      this.tone({ freq: 440, duration: 0.18, gain: 0.2, type: "square" });
    } else if (kind === "fight") {
      this.tone({ freq: 660, duration: 0.14, gain: 0.24, type: "square" });
      this.tone({ freq: 990, duration: 0.24, gain: 0.2, type: "square", delay: 0.12 });
    } else {
      this.tone({ freq: 523, duration: 0.2, gain: 0.22, type: "triangle" });
      this.tone({ freq: 659, duration: 0.2, gain: 0.22, type: "triangle", delay: 0.16 });
      this.tone({ freq: 784, duration: 0.4, gain: 0.24, type: "triangle", delay: 0.32 });
    }
  }
}

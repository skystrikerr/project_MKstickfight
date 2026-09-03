/**
 * Procedural music.
 *
 * `music.ts` plays files and says music is not something you can fake. That is
 * true of a song and untrue of a score: what this game wants behind it is a
 * pulse, a drone and a handful of notes that do not repeat obviously, and all
 * three of those are cheaper to generate than to ship. It also means the game
 * has music at all, which it did not, because the one thing that cannot be
 * committed to this repository is somebody else's recording.
 *
 * Everything is synthesised from oscillators and filtered noise, the same way
 * `Sfx` already does hits and gunfire. No files, nothing to license, and it
 * still gets out of the way the moment a real track is dropped into
 * `public/music/` - `music.ts` prefers a file wherever it finds one.
 *
 * The writing is deliberately modal rather than major or minor. A roster that
 * runs from 3300 BC to 1965 across five continents has no business being
 * scored in functional harmony, and a drone with a Dorian line over it reads
 * as "old and from somewhere" without imitating anywhere in particular.
 */

export type ScoreCue = "menu" | "select" | "fight" | "victory";

/** Semitones above the root. Dorian: minor, but with the bright sixth. */
const DORIAN = [0, 2, 3, 5, 7, 9, 10, 12];
/** The five notes that cannot sound wrong over a drone, for the melody. */
const PENTA = [0, 3, 5, 7, 10, 12, 15];

export interface CueDef {
  /** Beats per minute. */
  bpm: number;
  /** Root note in Hz. */
  root: number;
  /** Drone level, 0 = none. */
  drone: number;
  /** Chance per eighth-note of a melodic note. */
  density: number;
  /** Which sixteenths in a bar carry a low drum. */
  kick: number[];
  /** Which sixteenths carry a rattle. */
  rattle: number[];
  /** Bass note per bar, as a scale degree. */
  bass: number[];
  loop: boolean;
}

export const CUES: Record<ScoreCue, CueDef> = {
  // Slow, wide and mostly air. The title screen is a place to stand still.
  menu: {
    bpm: 64, root: 98, drone: 0.16, density: 0.22,
    kick: [0], rattle: [10],
    bass: [0, 0, 5, 3], loop: true,
  },
  // The same bed a step busier, so moving to the roster feels like moving.
  select: {
    bpm: 76, root: 98, drone: 0.14, density: 0.3,
    kick: [0, 8], rattle: [6, 14],
    bass: [0, 3, 5, 3], loop: true,
  },
  // A frame drum and an ostinato. Nothing clever - it has to sit under the
  // sound effects without arguing with them, so the melody stays sparse and
  // the whole thing lives below the frequencies the hits occupy.
  fight: {
    bpm: 132, root: 110, drone: 0.1, density: 0.34,
    kick: [0, 6, 10], rattle: [4, 8, 12, 14],
    bass: [0, 0, 5, 7], loop: true,
  },
  // Four bars that resolve and stop.
  victory: {
    bpm: 96, root: 131, drone: 0.12, density: 0.55,
    kick: [0, 8], rattle: [4, 12],
    bass: [0, 5, 7, 0], loop: false,
  },
};

const semi = (root: number, n: number) => root * Math.pow(2, n / 12);

/**
 * A lookahead scheduler.
 *
 * WebAudio events have to be booked against the audio clock rather than fired
 * from a timer, or every note lands wherever the main thread happened to be.
 * The timer only decides *when to book*, and everything it books is stamped
 * with an exact time - so a busy frame delays the booking and never the note.
 */
const LOOKAHEAD_MS = 90;
const SCHEDULE_AHEAD = 0.35;

export class Score {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNote = 0;
  private step = 0;
  private cueDef: CueDef | null = null;
  cue: ScoreCue | null = null;
  muted = false;
  volume = 0.4;

  /** Must be called from a user gesture, same as the sound effects. */
  private ensure(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return true;
  }

  play(cue: ScoreCue) {
    if (this.cue === cue) return;
    if (!this.ensure() || !this.ctx || !this.master) return;
    const wasPlaying = this.cue !== null;
    this.cue = cue;
    this.cueDef = CUES[cue];
    this.step = 0;
    this.nextNote = this.ctx.currentTime + 0.06;
    // Fade in rather than cut, and a little slower from silence than between
    // two cues, where the ear is already occupied.
    const target = this.muted ? 0 : this.volume * 0.5;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + (wasPlaying ? 0.5 : 1.4));
    if (!this.timer && typeof setInterval !== "undefined") {
      this.timer = setInterval(() => this.tick(), LOOKAHEAD_MS);
    }
  }

  stop() {
    this.cue = null;
    this.cueDef = null;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(0, now + 0.4);
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyGain();
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.applyGain();
  }

  private applyGain() {
    if (!this.ctx || !this.master || !this.cue) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : this.volume * 0.5, now + 0.12);
  }

  private tick() {
    const ctx = this.ctx;
    const def = this.cueDef;
    if (!ctx || !def) return;
    const secondsPerStep = 60 / def.bpm / 4;
    while (this.nextNote < ctx.currentTime + SCHEDULE_AHEAD) {
      this.emit(this.step, this.nextNote, def);
      this.nextNote += secondsPerStep;
      this.step++;
      // A one-shot cue runs four bars and then leaves quietly.
      if (!def.loop && this.step >= 64) {
        this.stop();
        return;
      }
    }
  }

  /** Books everything that happens on one sixteenth. */
  private emit(step: number, at: number, def: CueDef) {
    const inBar = step % 16;
    const bar = Math.floor(step / 16) % def.bass.length;

    if (inBar === 0) {
      this.bass(semi(def.root / 2, DORIAN[def.bass[bar]]), at, 60 / def.bpm * 2);
      if (def.drone > 0 && bar === 0) this.drone(def.root / 2, at, (60 / def.bpm) * 16, def.drone);
    }
    if (def.kick.includes(inBar)) this.drum(at, 0.9);
    if (def.rattle.includes(inBar)) this.rattle(at, 0.35);
    // Melody on eighths only, so it never crowds the drum.
    if (inBar % 2 === 0 && Math.random() < def.density) {
      const deg = PENTA[Math.floor(Math.random() * PENTA.length)];
      this.pluck(semi(def.root * 2, deg), at, 0.5);
    }
  }

  // -- voices ---------------------------------------------------------------

  private out(): GainNode | null {
    return this.master;
  }

  /** A struck string: bright attack, fast decay, no sustain. */
  private pluck(freq: number, at: number, level: number) {
    const ctx = this.ctx, dest = this.out();
    if (!ctx || !dest) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.value = freq;
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(freq * 6, at);
    filt.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.5), at + 0.28);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level * 0.5, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
    osc.connect(filt).connect(gain).connect(dest);
    osc.start(at);
    osc.stop(at + 0.5);
  }

  /** The low note under the bar. */
  private bass(freq: number, at: number, dur: number) {
    const ctx = this.ctx, dest = this.out();
    if (!ctx || !dest) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 320;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.34, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(filt).connect(gain).connect(dest);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  /** Two detuned saws held under everything, for weight rather than pitch. */
  private drone(freq: number, at: number, dur: number, level: number) {
    const ctx = this.ctx, dest = this.out();
    if (!ctx || !dest) return;
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 500;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(level, at + dur * 0.25);
    gain.gain.linearRampToValueAtTime(0.0001, at + dur);
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filt);
      osc.start(at);
      osc.stop(at + dur + 0.1);
    }
    filt.connect(gain).connect(dest);
  }

  /** A frame drum: a pitch that drops fast, plus a slap of noise. */
  private drum(at: number, level: number) {
    const ctx = this.ctx, dest = this.out();
    if (!ctx || !dest || !this.noise) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, at);
    osc.frequency.exponentialRampToValueAtTime(48, at + 0.11);
    gain.gain.setValueAtTime(level * 0.6, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    osc.connect(gain).connect(dest);
    osc.start(at);
    osc.stop(at + 0.25);

    const src = ctx.createBufferSource();
    const ng = ctx.createGain();
    const hp = ctx.createBiquadFilter();
    src.buffer = this.noise;
    hp.type = "bandpass";
    hp.frequency.value = 1600;
    ng.gain.setValueAtTime(level * 0.12, at);
    ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
    src.connect(hp).connect(ng).connect(dest);
    src.start(at);
    src.stop(at + 0.08);
  }

  /** Shaken seeds, more or less. Keeps the pulse without another drum. */
  private rattle(at: number, level: number) {
    const ctx = this.ctx, dest = this.out();
    if (!ctx || !dest || !this.noise) return;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    const hp = ctx.createBiquadFilter();
    src.buffer = this.noise;
    src.playbackRate.value = 1.6;
    hp.type = "highpass";
    hp.frequency.value = 5200;
    gain.gain.setValueAtTime(level * 0.16, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    src.connect(hp).connect(gain).connect(dest);
    src.start(at);
    src.stop(at + 0.07);
  }
}

export const score = new Score();

/**
 * Background music.
 *
 * Two sources, and files win. Drop an audio file into `public/music/`, name it
 * in `TRACKS`, and that is what plays. A cue with no file falls through to the
 * procedural score in `score.ts`, which is synthesised from oscillators the
 * same way the sound effects are.
 *
 * That fallback is why the game has music at all. The one thing that cannot be
 * committed to this repository is somebody else's recording, so for a long
 * time every screen after the title was silent - not because silence was the
 * design, but because the design had no way to fill it.
 */

import { score } from "./score";

/** The moments the game asks for music. */
export type MusicCue = "menu" | "select" | "fight" | "victory";

export interface TrackDef {
  /** File name inside `public/music/`, e.g. "theme.mp3". */
  file: string;
  /** Per-track trim, 0..1, for files mastered hotter or quieter than the rest. */
  gain?: number;
  /** Looping tracks run until the cue changes; stings play once. */
  loop?: boolean;
}

/**
 * Which file plays when. Give a cue an array and one is picked at random each
 * time, which is how you get a different fight theme per round.
 *
 * See `public/music/README.md` for how to add one.
 */
export const TRACKS: Partial<Record<MusicCue, TrackDef | TrackDef[]>> = {
  // Empty on purpose. Every cue falls through to the procedural score, which
  // is the only music this repository is allowed to contain. Name a file here
  // and it takes that cue over immediately - the fallback is a floor, not a
  // preference.
};

// Vite rewrites this at build time; the fallback keeps the module importable
// from node (the self-tests) where `import.meta.env` does not exist.
const BASE = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "./";
const FADE_MS = 700;

function pick(cue: MusicCue): TrackDef | null {
  const entry = TRACKS[cue];
  if (!entry) return null;
  if (!Array.isArray(entry)) return entry;
  if (entry.length === 0) return null;
  return entry[Math.floor(Math.random() * entry.length)];
}

/**
 * Crossfading two-deck player.
 *
 * Uses plain `Audio` elements rather than WebAudio: a music track is a long
 * file that wants streaming and looping, which is exactly what the element
 * already does, and it means music keeps working even if the `AudioContext`
 * never gets its gesture.
 */
export class Music {
  private decks: HTMLAudioElement[] = [];
  private active = -1;
  private fade: ReturnType<typeof setInterval> | null = null;
  /** The cue currently playing, so repeated requests do not restart the track. */
  cue: MusicCue | null = null;
  /** The file the deck was last pointed at. Read by the self-tests. */
  started: string | null = null;
  muted = false;
  volume = 0.4;
  /** Set once a real gesture has happened; before that, play requests are held. */
  private unlocked = false;
  private pending: MusicCue | null = null;

  private deck(i: number): HTMLAudioElement | null {
    if (typeof Audio === "undefined") return null;
    if (!this.decks[i]) {
      const el = new Audio();
      el.preload = "auto";
      el.volume = 0;
      this.decks[i] = el;
    }
    return this.decks[i];
  }

  /** Browsers will not start audio before a gesture; the page calls this on one. */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const cue = this.pending;
    if (!cue) return;
    this.pending = null;
    // `play` ignores the cue it is already on, and the held cue *is* the one
    // it is already on - so clear it, or the deferred track never starts.
    this.cue = null;
    this.play(cue);
  }

  /**
   * Starts `cue`, crossfading out whatever was playing. Asking for the cue
   * that is already running does nothing, so it is safe to call every frame.
   */
  play(cue: MusicCue) {
    if (this.cue === cue) return;
    const track = pick(cue);
    this.cue = cue;
    if (!this.unlocked) {
      this.pending = cue;
      return;
    }
    if (!track) {
      // Nothing shipped for this cue, so the score writes one. The decks fade
      // out first: a file and the synth playing over each other is worse than
      // either alone.
      this.crossfade(-1, 0);
      this.started = null;
      score.setMuted(this.muted);
      score.setVolume(this.volume);
      score.play(cue);
      return;
    }
    // A real file takes over from the score rather than joining it.
    score.stop();

    const src = `${BASE}music/${track.file}`;
    this.started = src;
    const next = this.active === 0 ? 1 : 0;
    const el = this.deck(next);
    if (!el) return;
    el.src = src;
    el.loop = track.loop ?? cue !== "victory";
    el.currentTime = 0;
    el.volume = 0;
    const target = this.muted ? 0 : this.volume * (track.gain ?? 1);
    void el.play().catch(() => {
      // A missing or unplayable file is not worth breaking the game over.
      if (this.cue === cue) this.cue = null;
    });
    this.crossfade(next, target);
    this.active = next;
  }

  /** Fades everything out and stops. */
  stop() {
    this.cue = null;
    this.pending = null;
    this.started = null;
    score.stop();
    this.crossfade(-1, 0);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    score.setMuted(muted);
    const el = this.active >= 0 ? this.decks[this.active] : null;
    if (el) el.volume = muted ? 0 : this.volume;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    score.setVolume(this.volume);
    if (!this.muted) this.setMuted(false);
  }

  /** Ramps the incoming deck up and every other deck down. */
  private crossfade(incoming: number, target: number) {
    if (this.fade) clearInterval(this.fade);
    if (typeof setInterval === "undefined") return;
    const step = 40;
    let t = 0;
    const from = this.decks.map((el) => el?.volume ?? 0);
    this.fade = setInterval(() => {
      t += step;
      const k = Math.min(1, t / FADE_MS);
      this.decks.forEach((el, i) => {
        if (!el) return;
        const to = i === incoming ? target : 0;
        el.volume = Math.max(0, Math.min(1, from[i] + (to - from[i]) * k));
        if (k >= 1 && i !== incoming) {
          el.pause();
          el.currentTime = 0;
        }
      });
      if (k >= 1 && this.fade) {
        clearInterval(this.fade);
        this.fade = null;
      }
    }, step);
  }
}

/** One soundtrack plays at a time, so the player is shared. */
export const music = new Music();

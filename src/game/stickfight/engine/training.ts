/**
 * Training mode.
 *
 * A place to hold a button down and see what the move actually does: infinite
 * resources, a dummy that behaves predictably instead of fighting back, a round
 * that never ends, and a readout of the frame data for whatever you just threw.
 *
 * All of it sits *on top of* the simulation rather than inside it. `Match` is
 * the pure 60 Hz model that the self-tests and the AI both run against, and
 * threading a "this is practice" flag through it would put a branch in every
 * scoring path for the sake of one mode. Instead the rules here run after each
 * step and put the world back the way training wants it, which means training
 * can never change how a real match plays.
 */

import { COMBAT, FPS, MATCH } from "../constants";
import type { MoveDef } from "../types";
import type { Fighter } from "./fighter";
import { EMPTY_INPUT, type RawInput } from "./input";
import type { Match } from "./match";

/** What the practice dummy does while you work on it. */
export type DummyAction = "stand" | "crouch" | "jump" | "block" | "cpu";

export const DUMMY_ACTIONS: { id: DummyAction; label: string; hint: string }[] = [
  { id: "stand", label: "Stand", hint: "Does nothing. Use it to check reach and damage." },
  { id: "crouch", label: "Crouch", hint: "Holds down, so overheads whiff-punish differently." },
  { id: "jump", label: "Jump", hint: "Hops on a loop. For practising anti-airs." },
  { id: "block", label: "Block", hint: "Holds guard. Shows blockstun and chip." },
  { id: "cpu", label: "Fight back", hint: "The normal AI, at the difficulty you picked." },
];

export interface TrainingOptions {
  dummy: DummyAction;
  /** Health is topped straight back up, so you never have to restart. */
  refillHealth: boolean;
  /** Meter and the character resource stay full. */
  infiniteMeter: boolean;
}

export const DEFAULT_TRAINING: TrainingOptions = {
  dummy: "stand",
  refillHealth: true,
  infiniteMeter: true,
};

/**
 * Frame data for one move, worked out from its own hit windows.
 *
 * Startup is the frames before the first hitbox is live, active is how long it
 * stays live, and recovery is everything after the last one. A move with no
 * hitboxes at all (a dash, a stance) reports only its length.
 */
export interface FrameData {
  name: string;
  notation?: string;
  startup: number | null;
  active: number | null;
  recovery: number | null;
  duration: number;
  damage: number;
}

export function frameData(move: MoveDef): FrameData {
  const hits = move.hits ?? [];
  const base: FrameData = {
    name: move.name,
    notation: move.notation,
    startup: null,
    active: null,
    recovery: null,
    duration: move.duration,
    damage: hits.reduce((sum, h) => sum + h.damage, 0),
  };
  if (hits.length === 0) return base;

  const first = Math.min(...hits.map((h) => h.from));
  const last = Math.max(...hits.map((h) => h.to));
  return {
    ...base,
    // Startup is counted the way a frame-data table does: the first active
    // frame is frame `from`, so a hitbox live on frame 4 is 4 frames of
    // startup, not 3.
    startup: first,
    active: last - first + 1,
    recovery: Math.max(0, move.duration - last - 1),
  };
}

/** What the training panel shows about the last thing you threw. */
export interface TrainingReadout {
  last: FrameData | null;
  /** Damage the dummy took from the most recent combo. */
  comboDamage: number;
  comboHits: number;
}

export class TrainingRoom {
  options: TrainingOptions;
  readout: TrainingReadout = { last: null, comboDamage: 0, comboHits: 0 };

  private jumpTimer = 0;
  private lastMoveId: string | null = null;

  constructor(options: TrainingOptions = DEFAULT_TRAINING) {
    this.options = { ...options };
  }

  /** The dummy's input for this frame. Returns null when the AI should drive. */
  dummyInput(): RawInput | null {
    switch (this.options.dummy) {
      case "cpu":
        return null;
      case "crouch":
        return { ...EMPTY_INPUT, down: true };
      case "block":
        return { ...EMPTY_INPUT, S: true };
      case "jump": {
        // Hop on a loop with a gap, so there is a window to land an anti-air
        // rather than an unbroken wall of jumps.
        this.jumpTimer = (this.jumpTimer + 1) % 46;
        return { ...EMPTY_INPUT, up: this.jumpTimer < 4 };
      }
      case "stand":
      default:
        return { ...EMPTY_INPUT };
    }
  }

  /**
   * Puts the world back the way training wants it. Runs after `match.step`, so
   * the hit has already been scored and the readout can report it before the
   * health it took is handed back.
   */
  apply(match: Match) {
    const [player] = match.fighters;

    // No round ceremony in a practice room. A match earns its "Round 1 / Fight"
    // announcement; a place you come to hold a button down and read frame data
    // should be ready the instant it opens, and ready again the instant you
    // reset.
    if (match.phase !== "fight") {
      match.phase = "fight";
      match.phaseFrame = 0;
      match.freeze = 0;
      // The fighters are parked in their intro pose by `resetPositions`, and
      // the normal intro-to-fight transition is what wakes them. Skipping the
      // ceremony means doing that part by hand, or they stand there frozen and
      // ignore every input.
      for (const f of match.fighters) {
        if (f.state === "intro" || f.state === "win" || f.state === "ko") f.setState("idle");
      }
    }

    this.track(player);

    // The combo banner is the match's own bookkeeping; training just surfaces
    // it, and keeps the last completed one on screen after it expires so you
    // can read the damage without freeze-framing.
    const banner = match.combo[0];
    if (banner) {
      this.readout.comboHits = banner.hits;
      this.readout.comboDamage = banner.damage;
    }

    // A practice round has no clock and no winner.
    match.timer = MATCH.roundTime * FPS;

    if (this.options.refillHealth) {
      // Only top up once they are out of hitstun, or the health bar snaps back
      // mid-combo and you cannot see what the combo actually did.
      for (const f of match.fighters) {
        if (f.hitstun <= 0 && f.blockstun <= 0 && f.state !== "hitstun" && f.state !== "hitstunAir") {
          f.health = f.def.stats.health;
        }
        f.guard = COMBAT.maxGuard;
      }
    }

    if (this.options.infiniteMeter) {
      for (const f of match.fighters) {
        f.meter = COMBAT.maxMeter;
        if (f.def.resource) f.resource = f.def.resource.max;
      }
    }
  }

  /** Remembers the frame data of each new move the player starts. */
  private track(player: Fighter) {
    const move = player.move;
    const id = move?.id ?? null;
    if (id !== this.lastMoveId) {
      this.lastMoveId = id;
      if (move && !move.internal) this.readout.last = frameData(move);
    }
  }

  /** Puts both fighters back on their starting marks. */
  reset(match: Match) {
    match.resetPositions();
    match.timer = MATCH.roundTime * FPS;
    for (const f of match.fighters) {
      f.health = f.def.stats.health;
      f.setState("idle");
    }
    this.apply(match);
    this.readout = { last: this.readout.last, comboDamage: 0, comboHits: 0 };
  }
}

/**
 * CPU opponent.
 *
 * The AI does not touch the fighter directly - it produces the same RawInput a
 * human would, including motion inputs, so it plays by exactly the same rules.
 */

import type { AiLevel } from "../constants";
import type { Facing, MoveDef, Motion } from "../types";
import type { Fighter } from "./fighter";
import type { Match } from "./match";
import { EMPTY_INPUT, type RawInput } from "./input";

interface Step {
  input: Partial<RawInput>;
  frames: number;
}

interface Profile {
  /** Frames before the AI notices something. */
  reaction: number;
  /** 0..1 chance to block an incoming attack. */
  block: number;
  /** 0..1 chance to anti-air a jumping opponent. */
  antiAir: number;
  /** 0..1 chance to use a special instead of a normal. */
  special: number;
  /** 0..1 how often it closes distance. */
  aggression: number;
  /** 0..1 chance to try a reversal on wake-up. */
  reversal: number;
  /** 0..1 chance to punish a whiffed move. */
  punish: number;
  /** Frames between decisions. */
  think: number;
}

const PROFILES: Record<AiLevel, Profile> = {
  Rookie: { reaction: 22, block: 0.25, antiAir: 0.1, special: 0.15, aggression: 0.45, reversal: 0.05, punish: 0.15, think: 26 },
  Brawler: { reaction: 16, block: 0.45, antiAir: 0.25, special: 0.3, aggression: 0.6, reversal: 0.12, punish: 0.3, think: 20 },
  Veteran: { reaction: 11, block: 0.65, antiAir: 0.45, special: 0.45, aggression: 0.7, reversal: 0.22, punish: 0.5, think: 15 },
  Champion: { reaction: 7, block: 0.82, antiAir: 0.65, special: 0.6, aggression: 0.8, reversal: 0.32, punish: 0.7, think: 11 },
  Legend: { reaction: 4, block: 0.94, antiAir: 0.85, special: 0.75, aggression: 0.9, reversal: 0.45, punish: 0.9, think: 8 },
};

const MOTION_DIRS: Record<Motion, number[]> = {
  none: [],
  qcf: [2, 3, 6],
  qcb: [2, 1, 4],
  dp: [6, 2, 3],
  rdp: [4, 2, 1],
  hcf: [4, 1, 2, 3, 6],
  hcb: [6, 3, 2, 1, 4],
  dd: [2, 5, 2],
  ff: [6, 5, 6],
  bb: [4, 5, 4],
  chargeB: [4, 4, 4, 6],
  chargeD: [2, 2, 2, 8],
};

function numToRaw(num: number, facing: Facing): Partial<RawInput> {
  const fwd = facing === 1 ? "right" : "left";
  const back = facing === 1 ? "left" : "right";
  const out: Partial<RawInput> = {};
  if (num === 6 || num === 3 || num === 9) out[fwd as "left"] = true;
  if (num === 4 || num === 1 || num === 7) out[back as "left"] = true;
  if (num === 2 || num === 1 || num === 3) out.down = true;
  if (num === 8 || num === 7 || num === 9) out.up = true;
  return out;
}

export class AiController {
  level: AiLevel;
  private queue: Step[] = [];
  private held: Partial<RawInput> = {};
  private heldFrames = 0;
  private thinkTimer = 0;
  private reactTimer = 0;
  private lastOpponentState = "";

  constructor(level: AiLevel = "Veteran") {
    this.level = level;
  }

  get profile(): Profile {
    return PROFILES[this.level];
  }

  reset() {
    this.queue = [];
    this.held = {};
    this.heldFrames = 0;
    this.thinkTimer = 0;
  }

  step(match: Match, self: Fighter, opponent: Fighter): RawInput {
    if (match.phase !== "fight") return { ...EMPTY_INPUT };

    if (this.queue.length > 0) {
      const step = this.queue[0];
      step.frames--;
      if (step.frames <= 0) this.queue.shift();
      return { ...EMPTY_INPUT, ...step.input };
    }

    if (this.heldFrames > 0) {
      this.heldFrames--;
      return { ...EMPTY_INPUT, ...this.held };
    }

    this.thinkTimer--;
    if (this.thinkTimer > 0) return { ...EMPTY_INPUT };
    this.thinkTimer = this.profile.think;

    this.decide(match, self, opponent);
    if (this.queue.length > 0) {
      const step = this.queue[0];
      step.frames--;
      if (step.frames <= 0) this.queue.shift();
      return { ...EMPTY_INPUT, ...step.input };
    }
    return { ...EMPTY_INPUT, ...this.held };
  }

  // -------------------------------------------------------------------------

  private decide(match: Match, self: Fighter, opponent: Fighter) {
    const p = this.profile;
    const dist = Math.abs(opponent.x - self.x);
    const facing = self.facing;
    const roll = Math.random();

    // React to being knocked down: sometimes reversal.
    if (self.state === "knockdown" || self.state === "wakeup") {
      if (roll < p.reversal) {
        const dp = this.pickMove(self, (m) => m.input.motion === "dp" && !m.meterCost);
        if (dp) return this.queueMove(self, dp);
      }
      return this.hold({ ...numToRaw(4, facing) }, 10);
    }

    if (!self.actionable && self.state !== "air") return;

    // Anti-air a jumping opponent.
    if (!opponent.grounded && opponent.y > 30 && dist < 190 && roll < p.antiAir) {
      const aa =
        this.pickMove(self, (m) => m.input.motion === "dp") ??
        this.pickMove(self, (m) => m.tags?.includes("launcher") ?? false);
      if (aa) return this.queueMove(self, aa);
    }

    // Block when the opponent commits to something close by.
    const threat = opponent.state === "move" && dist < 210;
    if (threat && Math.random() < p.block) {
      const low = opponent.move?.hits?.some((h) => h.guard === "low");
      return this.hold({ ...numToRaw(low ? 1 : 4, facing) }, this.profile.reaction + 8);
    }

    // Punish a whiffed heavy.
    if (opponent.state === "move" && opponent.moveHasHit === false && dist < 120 && Math.random() < p.punish) {
      const punish = this.pickMove(self, (m) => (m.tags?.includes("heavy") ?? false) && !m.input.motion);
      if (punish) return this.queueMove(self, punish);
    }

    // Super when it is available and they are close enough to connect.
    if (self.meter >= 100 && dist < 260 && Math.random() < p.special * 0.7) {
      const sup = this.pickMove(self, (m) => m.tags?.includes("super") ?? false);
      if (sup) return this.queueMove(self, sup);
    }

    if (dist > 300) {
      // Far: zone or approach.
      const proj = this.pickMove(self, (m) => m.tags?.includes("projectile") ?? false);
      if (proj && Math.random() < p.special && this.canAfford(self, proj)) return this.queueMove(self, proj);
      if (Math.random() < p.aggression) return this.hold({ ...numToRaw(6, facing) }, 22);
      return this.hold({}, 12);
    }

    if (dist > 150) {
      // Mid: pokes, dashes, jump-ins.
      const r = Math.random();
      if (r < 0.24) {
        const poke = this.pickMove(self, (m) => m.id === "5B" || m.id === "2B");
        if (poke) return this.queueMove(self, poke);
      }
      if (r < 0.4 && p.special > 0.3) {
        const sp = this.pickMove(self, (m) => (m.tags?.includes("special") ?? false) && !m.meterCost);
        if (sp && this.canAfford(self, sp)) return this.queueMove(self, sp);
      }
      if (r < 0.62 * p.aggression + 0.3) {
        // Dash in.
        this.queue.push({ input: numToRaw(6, facing), frames: 3 });
        this.queue.push({ input: {}, frames: 2 });
        this.queue.push({ input: numToRaw(6, facing), frames: 16 });
        return;
      }
      if (r < 0.8) {
        // Jump in with an attack.
        this.queue.push({ input: numToRaw(9, facing), frames: 4 });
        this.queue.push({ input: numToRaw(6, facing), frames: 14 });
        this.queue.push({ input: { ...numToRaw(6, facing), C: true }, frames: 4 });
        return;
      }
      return this.hold({ ...numToRaw(4, facing) }, 14);
    }

    // Close range.
    const r = Math.random();
    if (r < 0.16) {
      const grab = this.pickMove(self, (m) => m.tags?.includes("throw") ?? false);
      if (grab) return this.queueMove(self, grab);
    }
    if (r < 0.3 + p.special * 0.3) {
      const sp = this.pickMove(self, (m) => (m.tags?.includes("special") ?? false) && !m.internal && this.canAfford(self, m));
      if (sp) return this.queueMove(self, sp);
    }
    if (r < 0.86) {
      // Simple blockstring: light -> medium -> heavy.
      const chain: MoveDef[] = [];
      const a = this.pickMove(self, (m) => m.id === (Math.random() < 0.5 ? "5A" : "2A"));
      const bmv = this.pickMove(self, (m) => m.id === (Math.random() < 0.5 ? "5B" : "2B"));
      const c = this.pickMove(self, (m) => m.id === (Math.random() < 0.5 ? "5C" : "2C"));
      if (a) chain.push(a);
      if (bmv) chain.push(bmv);
      if (c && Math.random() < 0.6) chain.push(c);
      for (const m of chain) this.queueMove(self, m, false);
      return;
    }
    return this.hold({ ...numToRaw(4, facing) }, 16);
  }

  // -------------------------------------------------------------------------

  private canAfford(self: Fighter, move: MoveDef): boolean {
    if (move.meterCost && self.meter < move.meterCost) return false;
    if (move.resourceMin !== undefined && self.resource < move.resourceMin) return false;
    if (move.resourceCost && self.resource < move.resourceCost) return false;
    return true;
  }

  private pickMove(self: Fighter, pred: (m: MoveDef) => boolean): MoveDef | undefined {
    const candidates = self.def.moves.filter((m) => !m.internal && pred(m) && this.canAfford(self, m));
    if (candidates.length === 0) return undefined;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /** Turns a move definition into the button/stick sequence that performs it. */
  private queueMove(self: Fighter, move: MoveDef, clear = true) {
    if (clear) this.queue = [];
    const facing = self.facing;
    const motion = move.input.motion ?? "none";
    const dirs = MOTION_DIRS[motion];

    for (const d of dirs) {
      this.queue.push({ input: numToRaw(d, facing), frames: motion.startsWith("charge") ? 14 : 3 });
    }

    const buttons: Partial<RawInput> = {};
    for (const b of move.input.buttons ?? []) buttons[b] = true;
    if (move.input.button) buttons[move.input.button] = true;

    const dirHold = move.input.dir
      ? numToRaw(
          move.input.dir === "f" ? 6 : move.input.dir === "b" ? 4 : move.input.dir === "d" ? 2 : move.input.dir === "df" ? 3 : 5,
          facing,
        )
      : dirs.length > 0
        ? numToRaw(dirs[dirs.length - 1], facing)
        : {};

    this.queue.push({ input: { ...dirHold, ...buttons }, frames: 4 });
    this.queue.push({ input: {}, frames: Math.max(4, Math.round(move.duration * 0.35)) });
  }

  private hold(input: Partial<RawInput>, frames: number) {
    this.held = input;
    this.heldFrames = frames;
  }
}

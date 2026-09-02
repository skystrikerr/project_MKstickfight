/**
 * CPU opponent.
 *
 * The AI does not touch the fighter directly - it produces the same RawInput a
 * human would, including motion inputs, so it plays by exactly the same rules.
 */

import type { AiLevel } from "../constants";
import type { Facing, MoveDef, Motion } from "../types";
import type { Fighter } from "./fighter";
import type { Match, Projectile } from "./match";
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

/**
 * What a fighter *wants* to do, layered on top of the difficulty profile.
 * Difficulty controls how well the AI executes and reads the match; style
 * controls what it is trying to accomplish, so a Legend Dienekes and a
 * Legend Wyatt Earp play the same match with the same skill and completely
 * different game plans.
 *
 * Every number is a multiplier on the matching profile value (or on a fixed
 * chance elsewhere in `decide`), so a style can never make an AI stronger -
 * only more itself. A fighter missing from `STYLES` gets `DEFAULT_STYLE`,
 * which is neutral in every field, so a new roster addition is never left
 * without an AI personality by accident.
 */
export interface Style {
  /** How eagerly it closes distance and presses a chain once it is in. */
  aggression: number;
  /** How readily it reaches for a special over a normal. */
  special: number;
  /** How often it goes for a throw at point-blank range. */
  throw: number;
  /** How often it pokes instead of committing, at mid-range. */
  poke: number;
  /** Scales block and whiff-punish chance - a patient fighter reads the match rather than pressing through it. */
  patience: number;
  /** The range it tries to hold. "far" backs off to keep zoning; "close" does not retreat. */
  range: "far" | "mid" | "close";
}

export const DEFAULT_STYLE: Style = { aggression: 1, special: 1, throw: 1, poke: 1, patience: 1, range: "mid" };

/**
 * One entry per roster id. A structural self-test checks this covers the
 * whole roster and nothing else, the same way `ladder.ts` checks its rival
 * table - a fighter silently missing a personality is worse than the test
 * being annoying to keep in sync.
 */
export const STYLES: Record<string, Style> = {
  // Zoner / Wall: the scutum holds ground, the pilum keeps them off it.
  roman: { aggression: 0.7, special: 1.15, throw: 0.75, poke: 1.3, patience: 1.2, range: "far" },
  // Grappler / Wall: aspis holds the line, then the arms do the rest.
  spartan: { aggression: 0.95, special: 0.9, throw: 1.8, poke: 1.05, patience: 1.15, range: "mid" },
  // Berserker / Bruiser: axe first, questions never.
  viking: { aggression: 1.5, special: 0.85, throw: 1.1, poke: 0.6, patience: 0.5, range: "close" },
  // Rushdown / Mix-up: cutlass and pistol both want her on top of you.
  pirate: { aggression: 1.4, special: 1.0, throw: 1.2, poke: 0.7, patience: 0.6, range: "close" },
  // Footsies / Counter: wins by reading, not by rushing.
  samurai: { aggression: 0.7, special: 0.9, throw: 0.9, poke: 1.6, patience: 1.55, range: "mid" },
  // Rushdown / Clinch: closes for the clinch and does not let go.
  muaythai: { aggression: 1.5, special: 0.9, throw: 1.6, poke: 0.6, patience: 0.6, range: "close" },
  // Mix-up / Mobility: kunai at range, tanto up close, never where you look.
  ninja: { aggression: 1.15, special: 1.2, throw: 1.1, poke: 0.9, patience: 0.85, range: "mid" },
  // Zoner / Charge: the bow wants distance and time to draw.
  mongol: { aggression: 0.6, special: 1.3, throw: 0.7, poke: 1.1, patience: 1.3, range: "far" },
  // Zoner / Punisher: the six-shooter waits for the opening it needs.
  western: { aggression: 0.6, special: 1.1, throw: 0.7, poke: 1.0, patience: 1.45, range: "far" },
  // Zoner / Resource: ammo is finite, so the M16 is fired from range, not up close.
  soldier: { aggression: 0.65, special: 1.15, throw: 0.7, poke: 1.0, patience: 1.25, range: "far" },
  // Armoured Bruiser: the armour lets him walk into things others cannot.
  knight: { aggression: 1.2, special: 0.85, throw: 1.0, poke: 0.85, patience: 0.9, range: "close" },
  // Rushdown / Mix-up: obsidian rewards being the one attacking.
  jaguar: { aggression: 1.4, special: 1.0, throw: 1.2, poke: 0.7, patience: 0.6, range: "close" },
  // Pressure / Footsies: the iklwa was built for exactly this range.
  zulu: { aggression: 1.15, special: 0.9, throw: 1.0, poke: 1.3, patience: 1.0, range: "mid" },
  // Zoner / Stance: the staff keeps them out, the stances buy the time to reset it.
  shaolin: { aggression: 0.7, special: 1.25, throw: 0.8, poke: 1.1, patience: 1.2, range: "far" },
  // Zoner / Resource: the chakram is thrown from a distance it can be thrown from again.
  nihang: { aggression: 0.65, special: 1.25, throw: 0.7, poke: 1.0, patience: 1.25, range: "far" },
  // Mix-up / Wildcard: no single range is home, so every tool gets used.
  shade: { aggression: 1.1, special: 1.35, throw: 1.0, poke: 0.95, patience: 1.0, range: "mid" },
  // Footsies / Stance: the taiaha owns a band of space, so he pokes and holds
  // it rather than chasing anybody into their own range.
  maori: { aggression: 0.85, special: 1.0, throw: 1.05, poke: 1.5, patience: 1.2, range: "mid" },
  // Punisher / Guard Break: waits for the block, then goes round it.
  ethiopia: { aggression: 0.9, special: 1.3, throw: 0.85, poke: 1.0, patience: 1.35, range: "mid" },
  // Counter / Footsies: measures, and only commits to what she has read.
  duelist: { aggression: 0.7, special: 1.15, throw: 0.75, poke: 1.65, patience: 1.55, range: "mid" },
  // Brawler / Armour: slow and heavy, and happy to eat one to land one.
  iceman: { aggression: 1.25, special: 0.85, throw: 1.15, poke: 0.7, patience: 0.75, range: "close" },
  // Momentum / Rushdown: everything he owns works better once he is already in.
  celt: { aggression: 1.45, special: 1.05, throw: 1.0, poke: 0.75, patience: 0.55, range: "close" },
  // Zoner / Ranks: shoots while the Ranks refill, and only closes when they do not.
  persian: { aggression: 0.7, special: 1.25, throw: 0.8, poke: 1.25, patience: 1.3, range: "far" },
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

  private style(self: Fighter): Style {
    return STYLES[self.def.id] ?? DEFAULT_STYLE;
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

  /**
   * The nearest enemy projectile actually on its way here, and roughly how
   * many frames until it arrives.
   *
   * Nothing in this file used to read `match.projectiles` at all, so every
   * fighter walked straight into everything thrown at them. That one gap was
   * worth tens of percentage points in the balance matrix: measured over the
   * whole roster, every fighter above 65% owned a projectile and every
   * fighter below 35% did not, and deleting all projectiles pulled the
   * melee-only fighters back to even on its own. It was never a numbers
   * problem in the fighter files.
   */
  private incoming(match: Match, self: Fighter): { p: Projectile; frames: number } | null {
    let best: { p: Projectile; frames: number } | null = null;
    for (const p of match.projectiles) {
      if (p.dead || p.owner === self.index) continue;
      const dx = p.x - self.x;
      // Closing only. Something already past him is somebody else's problem,
      // and a stationary one (a settled caltrop) is not arriving at all.
      if (Math.abs(p.vx) < 0.5) continue;
      if (dx > 0 === p.vx > 0) continue;
      const frames = (Math.abs(dx) - self.def.stats.width) / Math.abs(p.vx);
      // Beyond about two-thirds of a second there is nothing to react to yet,
      // and reacting early just means standing in guard for no reason.
      if (frames < 0 || frames > 40) continue;
      if (!best || frames < best.frames) best = { p, frames };
    }
    return best;
  }

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

    // Answer something already in the air and coming at him. This sits ahead
    // of every approach branch on purpose: the bug was not that the AI chose
    // badly under fire, it was that it walked forward as though the screen
    // were empty.
    const inbound = this.incoming(match, self);
    if (inbound && self.grounded) {
      const st = this.style(self);
      // Reading a projectile is a skill like any other, so it runs off the
      // same block chance - a Rookie still eats a lot of them, which is what
      // makes the difficulty levels mean anything.
      if (inbound.frames <= p.reaction + 12 && Math.random() < Math.min(0.97, p.block * st.patience)) {
        const r = Math.random();
        // How badly this fighter needs to be somewhere else. Simply guarding
        // a shot keeps the health but loses the round: the zoner is happy to
        // trade chip for time all day, so anyone whose game is inside has to
        // answer by closing, not by surviving. Guarding everything is what
        // turned the first version of this into a draw machine.
        const wantsIn = st.range === "close" ? 1.6 : st.range === "far" ? 0.35 : 1;
        // Dodging through beats guarding outright, because the universal
        // dodges carry strike invulnerability and projectiles honour it, and
        // it covers ground while it does.
        if (r < 0.22 * wantsIn * st.aggression) {
          const dodge = this.pickMove(self, (m) => (m.tags?.includes("dodge") ?? false) && m.input.dir === "f");
          if (dodge) return this.queueMove(self, dodge);
        }
        // Or jump it, carrying the jump forward so getting over it is also
        // progress rather than just survival.
        if (r < 0.5 * wantsIn && inbound.frames > 7 && inbound.p.spec.guard !== "overhead") {
          this.queue.push({ input: numToRaw(9, facing), frames: 4 });
          this.queue.push({ input: numToRaw(6, facing), frames: 13 });
          return;
        }
        // Otherwise guard it - but only for as long as it takes to arrive,
        // and then immediately spend the recovery walking in.
        const low = inbound.p.spec.guard === "low";
        this.queue.push({
          input: numToRaw(low ? 1 : 4, facing),
          frames: Math.max(5, Math.min(15, Math.ceil(inbound.frames) + 4)),
        });
        if (st.range !== "far") this.queue.push({ input: numToRaw(6, facing), frames: 14 });
        return;
      }
    }

    // Anti-air a jumping opponent.
    if (!opponent.grounded && opponent.y > 30 && dist < 190 && roll < p.antiAir) {
      const aa =
        this.pickMove(self, (m) => m.input.motion === "dp") ??
        this.pickMove(self, (m) => m.tags?.includes("launcher") ?? false);
      if (aa) return this.queueMove(self, aa);
    }

    // Block when the opponent commits to something close by.
    const style = this.style(self);
    const threat = opponent.state === "move" && dist < 210;
    if (threat && Math.random() < Math.min(0.98, p.block * style.patience)) {
      const low = opponent.move?.hits?.some((h) => h.guard === "low");
      return this.hold({ ...numToRaw(low ? 1 : 4, facing) }, this.profile.reaction + 8);
    }

    // Punish a whiffed heavy.
    if (opponent.state === "move" && opponent.moveHasHit === false && dist < 120 && Math.random() < Math.min(0.98, p.punish * style.patience)) {
      const punish = this.pickMove(self, (m) => (m.tags?.includes("heavy") ?? false) && !m.input.motion);
      if (punish) return this.queueMove(self, punish);
    }

    // Super when it is available and they are close enough to connect.
    if (self.meter >= 100 && dist < 260 && Math.random() < Math.min(0.95, p.special * style.special * 0.7)) {
      const sup = this.pickMove(self, (m) => m.tags?.includes("super") ?? false);
      if (sup) return this.queueMove(self, sup);
    }

    if (dist > 300) {
      // Far: zone or approach, depending on what this fighter actually wants.
      const proj = this.pickMove(self, (m) => m.tags?.includes("projectile") ?? false);
      if (proj && Math.random() < Math.min(0.95, p.special * style.special) && this.canAfford(self, proj)) {
        return this.queueMove(self, proj);
      }
      // A "far" fighter would rather keep the gap open than walk into range,
      // so instead of just standing, it steps back the way a real zoner does.
      if (style.range === "far" && Math.random() < 0.4) return this.hold({ ...numToRaw(4, facing) }, 16);
      if (Math.random() < Math.min(0.95, p.aggression * style.aggression)) {
        // Cross the gap at a run rather than a walk. This used to be a plain
        // forward hold, which meant a melee fighter closed full screen at
        // walking pace directly into everything a zoner could throw - and a
        // zoner backing off at their own walk speed was never actually caught.
        // Half of what looked like projectiles being overpowered was really
        // the approach being this slow.
        this.queue.push({ input: numToRaw(6, facing), frames: 3 });
        this.queue.push({ input: {}, frames: 2 });
        this.queue.push({ input: numToRaw(6, facing), frames: 20 });
        return;
      }
      return this.hold({}, 12);
    }

    if (dist > 150) {
      // Mid: pokes, dashes, jump-ins - weighted by what this fighter is for.
      const r = Math.random();
      if (r < 0.24 * style.poke) {
        const poke = this.pickMove(self, (m) => m.id === "5B" || m.id === "2B");
        if (poke) return this.queueMove(self, poke);
      }
      if (r < 0.4 && p.special * style.special > 0.3) {
        const sp = this.pickMove(self, (m) => (m.tags?.includes("special") ?? false) && !m.meterCost);
        if (sp && this.canAfford(self, sp)) return this.queueMove(self, sp);
      }
      // A far-style fighter holds the line here rather than closing it -
      // that is the entire behavioural difference between a zoner and
      // everyone else, and it has to live here, at the range a zoner cares
      // about most.
      const closeLean = style.range === "far" ? 0.55 : style.range === "close" ? 1.25 : 1;
      if (r < 0.62 * p.aggression * style.aggression * closeLean + 0.3) {
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
    if (r < 0.16 * style.throw) {
      const grab = this.pickMove(self, (m) => m.tags?.includes("throw") ?? false);
      if (grab) return this.queueMove(self, grab);
    }
    if (r < 0.3 + p.special * style.special * 0.3) {
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

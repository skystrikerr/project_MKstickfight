/**
 * Towers: a run of fights with the rules bent, in the Mortal Kombat sense.
 *
 * The arcade ladder in `ladder.ts` is a fixed eight fights chosen to tell a
 * story about the character you picked. A tower is the opposite idea - the
 * opponents matter less than the conditions, and the same tower played twice
 * should not be the same climb. So a tower is authored as a shape (how tall,
 * how hard, how much interference) and the floors are dealt from a seed.
 *
 * Two things are deliberate:
 *
 * Nothing here imports React or storage, and nothing mutates. `buildTower` is
 * a pure function of (tower, fighter, seed), exactly like `buildLadder`, so a
 * run in progress is three numbers and can be rebuilt rather than serialised.
 *
 * Modifiers are data, not engine changes. Each one is a `MatchRule` - a pair
 * of optional callbacks the match runs at known points - plus the text used to
 * warn the player about it. The simulation has five scalar knobs on a fighter
 * and nothing else; if a modifier cannot be expressed with those, it does not
 * go in until the knob does. That is what keeps a mode built out of exceptions
 * from quietly becoming a second engine.
 */

import { AI_LEVELS, COMBAT, type AiLevel } from "./constants";
import type { MatchRule } from "./engine/match";
import { ROSTER } from "./fighters";

// ---------------------------------------------------------------------------
// Deterministic randomness
// ---------------------------------------------------------------------------

/**
 * A small seeded generator, so a run can be rebuilt from its seed instead of
 * stored. `Math.random` would mean serialising every floor and every modifier,
 * and would make a bug in floor seven impossible to look at twice.
 */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 0x100000000;
  };
}

const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length) % xs.length];

// ---------------------------------------------------------------------------
// Modifiers
// ---------------------------------------------------------------------------

export interface TowerModifier {
  id: string;
  name: string;
  /** One line, written as a warning to the player rather than as a spec. */
  desc: string;
  /** Who it acts on. Only used to colour the readout. */
  side: "you" | "them" | "both";
  /**
   * Negative hurts the player, positive helps. Floors are dealt so the total
   * lands near a target, which is what stops a floor rolling three punishments
   * at once and reading as broken rather than hard.
   */
  weight: number;
  rule: MatchRule;
}

/** The player is always seat 0; the tower only ever fills seat 1. */
const you = (m: { fighters: readonly unknown[] }) => (m as any).fighters[0];
const them = (m: { fighters: readonly unknown[] }) => (m as any).fighters[1];

export const MODIFIERS: TowerModifier[] = [
  {
    id: "regen",
    name: "Regeneration",
    desc: "They heal, slowly and constantly. Trade and you lose the trade.",
    side: "them",
    weight: -2,
    rule: { onRoundStart: (m) => { them(m).healthDrain = -14; } },
  },
  {
    id: "poison",
    name: "Poisoned",
    desc: "You are losing health the whole fight. It will not kill you, but it will not stop.",
    side: "you",
    weight: -2,
    rule: { onRoundStart: (m) => { you(m).healthDrain = 12; } },
  },
  {
    id: "brittle",
    name: "Brittle",
    desc: "Everything they land hurts half again as much.",
    side: "you",
    weight: -2,
    rule: { onRoundStart: (m) => { you(m).damageTakenScale = 1.5; } },
  },
  {
    id: "dry",
    name: "Dry Meter",
    desc: "You build no meter. No EX specials, no super, all fight.",
    side: "you",
    weight: -2,
    rule: { onRoundStart: (m) => { you(m).meterScale = 0; } },
  },
  {
    id: "berserk",
    name: "Berserker",
    desc: "They hit like a truck and take the same in return.",
    side: "both",
    weight: -1,
    rule: {
      onRoundStart: (m) => {
        them(m).damageDealtScale = 1.4;
        them(m).damageTakenScale = 1.4;
      },
    },
  },
  {
    id: "leadboots",
    name: "Lead Boots",
    desc: "You come down twice as fast as you went up. Jumping is close to useless.",
    side: "you",
    weight: -1,
    rule: { onRoundStart: (m) => { you(m).gravityScale = 2; } },
  },
  {
    id: "headstart",
    name: "Head Start",
    desc: "They begin the round with a super already banked.",
    side: "them",
    weight: -2,
    // Half the bar is exactly one super at the documented costs, which is what
    // the warning says they have. A full bar would be two, and a modifier that
    // quietly does twice what it claims is worse than a harder one.
    rule: { onRoundStart: (m) => { them(m).meter = COMBAT.maxMeter / 2; } },
  },
  // --- and the ones that are on your side -----------------------------------
  {
    id: "second-wind",
    name: "Second Wind",
    desc: "You recover health steadily. Survive the opening and you get it back.",
    side: "you",
    weight: 2,
    rule: { onRoundStart: (m) => { you(m).healthDrain = -16; } },
  },
  {
    id: "charged",
    name: "Charged",
    desc: "You start every round on a full meter. Spend it.",
    side: "you",
    weight: 2,
    rule: { onRoundStart: (m) => { you(m).meter = COMBAT.maxMeter; } },
  },
  {
    id: "sharpened",
    name: "Sharpened",
    desc: "Your weapon bites: everything you land does half again as much.",
    side: "you",
    weight: 2,
    rule: { onRoundStart: (m) => { you(m).damageDealtScale = 1.5; } },
  },
  {
    id: "moon",
    name: "Low Gravity",
    desc: "Both of you hang in the air. Whole fight happens off the ground.",
    side: "both",
    weight: 0,
    rule: {
      onRoundStart: (m) => {
        you(m).gravityScale = 0.55;
        them(m).gravityScale = 0.55;
      },
    },
  },
  {
    id: "wounded",
    name: "Already Bleeding",
    desc: "They start the round hurt. Finish it before they settle.",
    side: "them",
    weight: 2,
    rule: { onRoundStart: (m) => { them(m).health = Math.round(them(m).def.stats.health * 0.7); } },
  },
];

export const MODIFIER_BY_ID: Record<string, TowerModifier> = Object.fromEntries(
  MODIFIERS.map((mod) => [mod.id, mod]),
);

// ---------------------------------------------------------------------------
// Towers
// ---------------------------------------------------------------------------

export interface Tower {
  id: string;
  name: string;
  /** Shown on the tower list. Says what the climb actually asks of you. */
  blurb: string;
  floors: number;
  /** Difficulty of the first floor; the climb walks up from here. */
  base: AiLevel;
  /** How many modifiers each floor carries, low floor to top floor. */
  modifiers: [number, number];
  /**
   * Health carried between floors instead of a fresh bar each time, and how
   * much of the bar winning a floor gives back.
   */
  survival?: { healPerWin: number };
  /** One round a fight rather than best of three. */
  singleRound?: boolean;
}

export const TOWERS: Tower[] = [
  {
    id: "climb",
    name: "The Long Climb",
    blurb:
      "Ten fights, nobody interfering, and it gets harder the whole way. No modifiers and nowhere to hide - this is the one that tells you whether you can actually play the character.",
    floors: 10,
    base: "Brawler",
    modifiers: [0, 0],
  },
  {
    id: "turning",
    name: "The Turning Tower",
    blurb:
      "Eight floors and the rules change on every one. Some of it is aimed at you, some of it is handed to you, and you are told which before you commit.",
    floors: 8,
    base: "Veteran",
    modifiers: [1, 2],
  },
  {
    id: "survivor",
    name: "Last Man Standing",
    blurb:
      "One round a fight, one health bar for the whole run, and it never ends - it only stops. Winning a floor gives a little back. Nothing else does.",
    floors: 30,
    base: "Brawler",
    modifiers: [0, 1],
    survival: { healPerWin: 0.18 },
    singleRound: true,
  },
];

export const TOWER_BY_ID: Record<string, Tower> = Object.fromEntries(TOWERS.map((t) => [t.id, t]));

export interface TowerFloor {
  /** 1-based, so it reads as "Floor 3 of 10" without arithmetic. */
  index: number;
  opponent: string;
  level: AiLevel;
  modifiers: string[];
}

function shift(level: AiLevel, n: number): AiLevel {
  const i = AI_LEVELS.indexOf(level);
  return AI_LEVELS[Math.max(0, Math.min(AI_LEVELS.length - 1, i + n))];
}

/**
 * Deals the whole tower up front.
 *
 * Opponents are drawn without immediate repeats, because the thing that makes
 * a long tower feel cheap is meeting the same fighter twice in three floors.
 * Modifiers are drawn to a target weight that walks from "mostly in your
 * favour" at the bottom to "mostly against you" at the top, so difficulty
 * comes from the conditions and not only from the AI level.
 */
export function buildTower(tower: Tower, playerId: string, seed: number): TowerFloor[] {
  const r = rng(seed);
  const pool = ROSTER.filter((f) => f.id !== playerId).map((f) => f.id);
  const floors: TowerFloor[] = [];
  const recent: string[] = [];
  for (let i = 0; i < tower.floors; i++) {
    const t = tower.floors === 1 ? 1 : i / (tower.floors - 1);

    let opponent = pick(r, pool);
    for (let tries = 0; tries < 8 && recent.includes(opponent); tries++) opponent = pick(r, pool);
    recent.push(opponent);
    if (recent.length > Math.min(4, pool.length - 1)) recent.shift();

    // Bottom of the tower sits a step below the billed difficulty and the top
    // sits a step above it, so the same tower can be a warm-up and a wall.
    const level = shift(tower.base, t < 0.34 ? -1 : t < 0.75 ? 0 : 1);

    const [lo, hi] = tower.modifiers;
    const count = lo + Math.floor(r() * (hi - lo + 1));
    const target = Math.round(2 - 4 * t); // +2 helpful at the foot, -2 hostile at the top
    const chosen: string[] = [];
    let weight = 0;
    for (let k = 0; k < count; k++) {
      // Prefer whichever unused modifier moves the floor closest to target.
      const options = MODIFIERS.filter((mod) => !chosen.includes(mod.id));
      if (!options.length) break;
      let best = options[0];
      let bestGap = Infinity;
      // Walk from a random offset so equally-good modifiers do not always
      // resolve to the same one.
      const off = Math.floor(r() * options.length);
      for (let j = 0; j < options.length; j++) {
        const mod = options[(j + off) % options.length];
        const gap = Math.abs(weight + mod.weight - target);
        if (gap < bestGap) { bestGap = gap; best = mod; }
      }
      chosen.push(best.id);
      weight += best.weight;
    }
    floors.push({ index: i + 1, opponent, level, modifiers: chosen });
  }
  return floors;
}

/** Every rule a floor imposes, ready to hand to a match. */
export function rulesFor(floor: TowerFloor, tower: Tower, carryHealth: number | null): MatchRule[] {
  const rules = floor.modifiers.map((id) => MODIFIER_BY_ID[id]?.rule).filter(Boolean) as MatchRule[];
  if (tower.survival && carryHealth !== null) {
    // Survival carries one bar for the whole run. This has to run after the
    // modifiers so a floor that also sets health cannot overwrite the carry.
    rules.push({ onRoundStart: (m) => { (m as any).fighters[0].health = Math.max(1, carryHealth); } });
  }
  return rules;
}

// ---------------------------------------------------------------------------
// Run state
// ---------------------------------------------------------------------------

export interface TowerRun {
  tower: string;
  fighter: string;
  seed: number;
  floors: TowerFloor[];
  at: number;
  /** Survival only: health carried into the next floor. */
  carry: number | null;
  phase: "versus" | "fight" | "lost" | "cleared";
  /** How many floors were beaten, which is the score for an endless tower. */
  cleared: number;
}

export function startTower(towerId: string, fighter: string, seed = (Math.random() * 0xffffffff) >>> 0): TowerRun {
  const tower = TOWER_BY_ID[towerId] ?? TOWERS[0];
  return {
    tower: tower.id,
    fighter,
    seed,
    floors: buildTower(tower, fighter, seed),
    at: 0,
    // No carry on the first floor: everyone starts a run on a full bar, and
    // survival only starts carrying once there is something to carry.
    carry: null,
    phase: "versus",
    cleared: 0,
  };
}

/**
 * Applies the result of one floor.
 *
 * Mirrors `advanceRun`: only a run that is actually fighting can be advanced,
 * because the match-end phase lasts many frames and a stray second report
 * must not skip a floor.
 */
export function advanceTower(
  run: TowerRun,
  playerWon: boolean,
  /** Health the player finished the floor on, and the size of their bar. */
  health: { left: number; max: number } | null = null,
): TowerRun {
  if (run.phase !== "fight") return run;
  if (!playerWon) return { ...run, phase: "lost" };
  const tower = TOWER_BY_ID[run.tower];
  const cleared = run.cleared + 1;
  if (run.at + 1 >= run.floors.length) return { ...run, cleared, phase: "cleared" };

  let carry = run.carry;
  if (tower?.survival && health) {
    carry = Math.min(health.max, health.left + tower.survival.healPerWin * health.max);
  }
  return { ...run, at: run.at + 1, cleared, carry, phase: "versus" };
}

/** Survival has no continues; the other towers put you back on the same floor. */
export function continueTower(run: TowerRun): TowerRun {
  if (run.phase !== "lost") return run;
  if (TOWER_BY_ID[run.tower]?.survival) return run;
  return { ...run, phase: "versus" };
}

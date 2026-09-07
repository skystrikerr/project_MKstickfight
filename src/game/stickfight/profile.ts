/**
 * The eight numbers on a fighter's profile page.
 *
 * Every one of them is measured off the fighter's own move list and stat
 * block rather than typed in by hand. That is the whole design of this file,
 * and it is worth saying why, because a hand-authored bar chart would have
 * been a tenth of the work:
 *
 *  - A hand-written number is a claim, and claims rot. Dienekes lost his
 *    shield spam and gained five javelins in one afternoon; a hand-written
 *    "Range 7" would still say 7 today and nobody would ever notice.
 *  - The roster is aiming at four figures. Twenty-six sets of eight numbers
 *    is an afternoon. A thousand sets is a job nobody will do, and the ones
 *    that do get done will be graded against whatever the author happened to
 *    remember rather than against the roster.
 *  - A derived number is a free balance signal. If a fighter reads 9 for
 *    power and 2 for range, that is what they actually are, and if that is
 *    not what they were meant to be then the kit is wrong, not the bar.
 *
 * The cost is that the numbers move when the game moves, which is the point.
 *
 * Everything is graded on a curve against the rest of the roster: the raw
 * measurements are in wildly different units (units of reach, frames, hit
 * points) and none of them has a meaningful absolute maximum. A fighter's 8
 * for speed means "eighth-decile walk and dash on this roster", which is the
 * only thing a player can act on anyway - they are choosing between these
 * fighters, not against some universal scale.
 */

import { ROSTER } from "./fighters";
import type { FighterDef, MoveDef } from "./types";

export interface ProfileStat {
  key: StatKey;
  label: string;
  /** 1..10, graded against the rest of the roster. */
  value: number;
  /** What the number was measured from, for the tooltip. */
  note: string;
  /** The measurement itself, ungraded. The bar is a rank; this is the fact. */
  raw: number;
}

export type StatKey =
  | "strength"
  | "speed"
  | "technique"
  | "range"
  | "durability"
  | "defence"
  | "power"
  | "agility";

export const STAT_LABELS: Record<StatKey, string> = {
  strength: "Strength",
  speed: "Speed",
  technique: "Technique",
  range: "Range",
  durability: "Durability",
  defence: "Defence",
  power: "Power",
  agility: "Agility",
};

const STAT_NOTES: Record<StatKey, string> = {
  strength: "Average damage across the normals",
  speed: "Walk and dash speed",
  technique: "Specials, follow-ups and cancels to learn",
  range: "How far the longest normals reach",
  durability: "Health, and how far a hit sends them",
  defence: "Armour, invulnerability, parries and dodges",
  power: "The hardest single blow in the kit",
  agility: "Jump, double jump, air dash and air moves",
};

const has = (m: MoveDef, tag: string) => !!m.tags?.includes(tag as never);
/** The moves a player actually presses - not the halves of a throw or a stance. */
const real = (def: FighterDef) => def.moves.filter((m) => !m.internal);
const normals = (def: FighterDef) =>
  real(def).filter((m) => ["light", "medium", "heavy"].some((t) => has(m, t)) && !has(m, "special"));

/** Every point of damage a move can do, projectiles and zones included. */
function moveDamage(m: MoveDef): number {
  let d = 0;
  // Hits sharing a group only land once, so a three-frame sword sweep written
  // as three overlapping boxes is one blow and has to be counted as one.
  const groups = new Map<number, number>();
  for (const h of m.hits ?? []) {
    if (h.group === undefined) d += h.damage;
    else groups.set(h.group, Math.max(groups.get(h.group) ?? 0, h.damage));
  }
  for (const v of groups.values()) d += v;
  for (const p of m.projectiles ?? []) d += p.damage ?? 0;
  for (const z of m.zones ?? []) d += z.damage ?? 0;
  d += m.throwPayload?.damage ?? 0;
  return d;
}

/** How far in front of the fighter a move's boxes reach. */
function moveReach(m: MoveDef): number {
  let far = 0;
  for (const h of m.hits ?? []) far = Math.max(far, h.box.x + h.box.w);
  return far;
}

const RAW: Record<StatKey, (def: FighterDef) => number> = {
  // What a normal exchange is worth. Deliberately the normals rather than the
  // whole list: a fighter is not strong because their super is big.
  strength: (def) => {
    const ns = normals(def);
    if (!ns.length) return 0;
    return ns.reduce((a, m) => a + moveDamage(m), 0) / ns.length;
  },

  speed: (def) => {
    const s = def.stats;
    return s.walkF * 2 + s.walkB + s.dashSpeed * 1.5;
  },

  // How much there is to learn. Counted as distinct things to press and
  // distinct places to press them, which is what execution actually is.
  technique: (def) => {
    const list = real(def);
    let n = 0;
    for (const m of list) {
      if (has(m, "special") || has(m, "super") || has(m, "skill")) n += 2;
      if (has(m, "ex")) n += 1;
      n += (m.followUps?.length ?? 0) * 0.5;
      if (m.cancelInto?.length) n += 0.5;
      if (m.holdLoop) n += 1;
      if (m.parryWindow) n += 1;
      if (m.input.motion) n += 0.5;
    }
    if (def.resource) n += 3;
    return n;
  },

  // The reach that governs neutral. Averaged over the three longest normals
  // rather than taken from the single longest, so one outlier poke does not
  // make a short-ranged fighter read as a zoner.
  range: (def) => {
    const rs = normals(def)
      .map(moveReach)
      .sort((a, b) => b - a)
      .slice(0, 3);
    if (!rs.length) return 0;
    return rs.reduce((a, b) => a + b, 0) / rs.length;
  },

  // Not just the health bar. Knockback is divided by weight, so a light
  // fighter with the same health takes the same damage and then spends the
  // next two seconds in the air being hit again.
  durability: (def) => def.stats.health * def.stats.weight,

  // What the kit can do about being hit. Weighted so that a real defensive
  // option counts for more than a long list of small ones.
  defence: (def) => {
    let n = 0;
    for (const m of real(def)) {
      for (const w of m.invuln ?? []) n += (w.to - w.from + 1) * (w.kind === "full" ? 0.6 : 0.3);
      for (const w of m.armor ?? []) n += (w.to - w.from + 1) * 0.4;
      if (m.parryWindow) n += 12;
      if (has(m, "dodge")) n += 6;
    }
    for (const p of def.props) if (p.armour) n += 10;
    return n;
  },

  // The hardest single thing they can do, super included - this is the bar
  // that answers "what happens if they get one clean opening".
  power: (def) => Math.max(0, ...real(def).map(moveDamage)),

  agility: (def) => {
    const s = def.stats;
    return (
      s.jumpVel * 3 +
      s.jumpFwd * 2 +
      (s.doubleJump ? 8 : 0) +
      (s.airDash ? 8 : 0) +
      s.airMoves * 4 -
      s.gravity * 10
    );
  },
};

/**
 * The curve, built once from the whole roster.
 *
 * A percentile rather than a linear stretch between the lowest and highest.
 * On a roster with one extreme outlier - and there always is one; Kuro's
 * whole design is an extreme - a linear stretch squashes everybody else into
 * the bottom two bars and the chart stops distinguishing the twenty-four
 * fighters a player is actually choosing between.
 */
const CURVE: Record<StatKey, number[]> = (() => {
  const out = {} as Record<StatKey, number[]>;
  for (const key of Object.keys(RAW) as StatKey[]) {
    out[key] = ROSTER.map((d) => RAW[key](d)).sort((a, b) => a - b);
  }
  return out;
})();

function grade(key: StatKey, raw: number): number {
  const sorted = CURVE[key];
  // Ties share a rank, so two fighters with identical health cannot end up a
  // bar apart because of the order they happen to sit in the roster file.
  const below = sorted.filter((v) => v < raw).length;
  const equal = sorted.filter((v) => v === raw).length;
  const pct = (below + equal / 2) / sorted.length;
  return Math.min(10, Math.max(1, Math.round(pct * 9 + 1)));
}

/** The eight bars for one fighter, in the order they are drawn. */
export function statsFor(def: FighterDef): ProfileStat[] {
  return (Object.keys(RAW) as StatKey[]).map((key) => {
    const raw = RAW[key](def);
    return { key, label: STAT_LABELS[key], value: grade(key, raw), note: STAT_NOTES[key], raw };
  });
}

/** The raw measurement, unrounded - for the tools and the self-tests. */
export function rawStat(def: FighterDef, key: StatKey): number {
  return RAW[key](def);
}

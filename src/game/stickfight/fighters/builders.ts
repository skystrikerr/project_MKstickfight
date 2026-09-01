/**
 * Small authoring helpers so a fighter file reads like a move list instead of
 * a wall of object literals, plus the universal moves every fighter gets.
 */

import type { Box, ClipDef, Ease, HitDef, Keyframe, MoveDef, Pose } from "../types";

/** Box in facing space: x forward from the fighter, y up from the ground. */
export const bx = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export const kf = (t: number, p: Pose, ease?: Ease): Keyframe => ({ t, p, ease });

/** Additive keyframe - offsets layered on the fighter's stance. */
export const kfa = (t: number, add: Pose, ease?: Ease): Keyframe => ({ t, add, ease });

export function hit(
  from: number,
  to: number,
  box: Box,
  damage: number,
  o: Partial<HitDef> = {},
): HitDef {
  return {
    from,
    to,
    box,
    damage,
    hitstun: o.hitstun ?? Math.round(11 + damage * 0.45),
    blockstun: o.blockstun ?? Math.round(8 + damage * 0.28),
    hitstop: o.hitstop ?? Math.round(6 + damage * 0.16),
    pushX: o.pushX ?? 3 + damage * 0.12,
    guard: o.guard ?? "mid",
    fx: o.fx ?? "blunt",
    ...o,
  };
}

/** Frames-per-second sanity helper for readable durations. */
export const f = (n: number) => n;

// ---------------------------------------------------------------------------
// Universal moves
// ---------------------------------------------------------------------------

export interface UniversalOptions {
  /** Damage of the forward throw. */
  throwDamage?: number;
  /** Damage of the back throw. */
  backThrowDamage?: number;
  /** Reach of the grab in units. */
  throwRange?: number;
  /** Sidestep distance multiplier. */
  rollSpeed?: number;
  /** Weapon-holding fighters keep the arm angled during universal moves. */
  weaponIdle?: Pose;
}

/**
 * The universal kit every fighter carries: block, parry, two dodges and two
 * throws. Characters differ in their five specials, their skill and their
 * super - the defensive fundamentals are identical so the game reads the
 * same on both sides of the screen.
 *
 * Control scheme:
 *   S (hold)      Block          ← + S   Parry
 *   → + S         Sidestep       ← ← (tap back twice)   Backstep
 *   ↓ + S         Low guard      A + B  Throw       ← + A + B  Back throw
 */
export function universalMoves(opts: UniversalOptions = {}): MoveDef[] {
  const throwDamage = opts.throwDamage ?? 120;
  const backThrowDamage = opts.backThrowDamage ?? 130;
  const range = opts.throwRange ?? 62;
  // Per-fighter dodge distance. `rollSpeed` kept its name from the roll this
  // replaced so no fighter file has to change. The push now fires on frame 3
  // rather than frame 1 - he has to get off the ground first - so the same
  // authored number is given back the two frames of travel that cost it.
  // Roughly two and a half character-widths of net travel, not one -
  // a dodge that barely outruns a walk is not worth committing invuln to.
  const stepSpeed = (opts.rollSpeed ?? 7.5) * 2.05;
  const w = opts.weaponIdle ?? {};

  return [
    {
      id: "throwF",
      name: "Grab",
      input: { buttons: ["A", "B"], stance: "stand" },
      tags: ["throw"],
      priority: 60,
      duration: 24,
      throwDef: { from: 3, to: 6, range, success: "throwFSuccess" },
      desc: "Grabs the opponent. Beats blocking, loses to jumps and strikes.",
      notation: "A + B",
      frames: [
        kf(0, { ...w, shoulderF: 40, elbowF: 40, shoulderB: 30, elbowB: 44, torso: 8 }, "out"),
        kf(4, { ...w, shoulderF: 86, elbowF: 8, shoulderB: 78, elbowB: 12, torso: 14, offX: 4 }),
        kf(10, { ...w, shoulderF: 84, elbowF: 10, shoulderB: 76, elbowB: 14, torso: 12 }, "inOut"),
        kf(24, { ...w, torso: 2 }),
      ],
    },
    {
      id: "throwFSuccess",
      name: "Throw",
      input: { stance: "stand" },
      tags: ["throw"],
      internal: true,
      duration: 46,
      grabOffset: [40, 6],
      throwPayload: {
        at: 22,
        damage: throwDamage,
        launch: [7.5, 9],
        knockdown: "hard",
        hitstop: 10,
        fx: "blunt",
      },
      desc: "",
      frames: [
        kf(0, { ...w, shoulderF: 88, elbowF: 10, shoulderB: 80, elbowB: 14, torso: 12, offX: 2 }),
        kf(10, { ...w, shoulderF: 110, elbowF: 24, shoulderB: 96, elbowB: 20, torso: -14, hipF: -10, kneeF: 26, offY: 2 }, "inOut"),
        kf(22, { ...w, shoulderF: 140, elbowF: 10, shoulderB: 128, elbowB: 8, torso: 26, hipF: 24, kneeF: 20, hipB: -22, kneeB: 40, offX: 6 }, "out"),
        kf(34, { ...w, shoulderF: 60, elbowF: 40, shoulderB: 50, elbowB: 36, torso: 16, hipF: 16, kneeF: 26 }, "inOut"),
        kf(46, { ...w }),
      ],
    },
    {
      id: "throwB",
      name: "Back Throw",
      input: { buttons: ["A", "B"], dir: "b", stance: "stand" },
      tags: ["throw"],
      priority: 70,
      duration: 24,
      throwDef: { from: 3, to: 6, range, success: "throwBSuccess" },
      desc: "Grabs and hurls the opponent behind you. Great for corner escapes.",
      notation: "← + A + B",
      frames: [
        kf(0, { ...w, shoulderF: 40, elbowF: 40, shoulderB: 30, elbowB: 44, torso: 6 }, "out"),
        kf(4, { ...w, shoulderF: 84, elbowF: 10, shoulderB: 76, elbowB: 14, torso: 10, offX: 3 }),
        kf(24, { ...w, torso: 2 }),
      ],
    },
    {
      id: "throwBSuccess",
      name: "Back Throw",
      input: { stance: "stand" },
      tags: ["throw"],
      internal: true,
      duration: 48,
      grabOffset: [38, 8],
      throwPayload: {
        at: 24,
        damage: backThrowDamage,
        launch: [-8, 8.5],
        knockdown: "hard",
        hitstop: 10,
        fx: "blunt",
      },
      desc: "",
      frames: [
        kf(0, { ...w, shoulderF: 88, elbowF: 12, shoulderB: 80, elbowB: 16, torso: 10 }),
        kf(12, { ...w, shoulderF: 126, elbowF: 30, shoulderB: 118, elbowB: 26, torso: -20, spin: -10, offY: 4 }, "inOut"),
        kf(24, { ...w, shoulderF: 168, elbowF: 14, shoulderB: 160, elbowB: 10, torso: -34, spin: -24, hipF: -16, kneeF: 30 }, "out"),
        kf(36, { ...w, shoulderF: 70, elbowF: 40, shoulderB: 60, elbowB: 36, torso: -6, spin: -6 }, "inOut"),
        kf(48, { ...w }),
      ],
    },
    {
      id: "block",
      name: "Block",
      input: { stance: ["stand", "crouch"] },
      tags: ["block"],
      internal: true,
      duration: 1,
      desc: "Hold Guard (S) to block high attacks, or Guard + ↓ to block lows. Holding back blocks too. Blocking drains your guard bar - it breaks if you never fight back.",
      notation: "S (hold)",
      frames: [kf(0, { ...w })],
    },
    {
      id: "parry",
      name: "Parry",
      input: { button: "S", dir: "b", stance: ["stand", "crouch"] },
      tags: ["block"],
      priority: 55,
      duration: 18,
      parryWindow: [1, 6],
      friction: 0.8,
      desc: "Tap back + Guard just before a hit to deflect it and gain meter.",
      notation: "← + S",
      frames: [
        kf(0, { ...w, torso: 4, shoulderF: 50, elbowF: 50 }, "out"),
        kf(3, { ...w, torso: 10, shoulderF: 104, elbowF: 34, shoulderB: 40, elbowB: 56, offX: 3 }),
        kf(9, { ...w, torso: 6, shoulderF: 74, elbowF: 52, shoulderB: 30, elbowB: 50 }, "inOut"),
        kf(18, { ...w }),
      ],
    },
    {
      id: "sidestep",
      name: "Sidestep",
      input: { button: "S", dir: "f", stance: ["stand", "crouch"] },
      tags: ["dodge"],
      priority: 55,
      duration: 20,
      invuln: [{ from: 3, to: 13, kind: "strike" }],
      // The push happens on the ground; the travel happens in the air. Moving
      // this fast with a foot planted is what made it skate.
      vel: [
        { at: 3, x: stepSpeed },
        { at: 13, x: 0 },
      ],
      friction: 0.95,
      desc: "A hard step past the attack, staying on your feet and facing them the whole way.",
      notation: "\u2192 + S",
      /**
       * A step, not a tumble - and not a skate either.
       *
       * The roll this replaced turned 360 degrees while covering less ground
       * than simply walking for the same thirty frames, which is why it looked
       * like spinning on the spot. Replacing it with a grounded step fixed the
       * distance and introduced a different lie: 119 units of foot slide over
       * 59 units of travel, because a planted foot cannot carry a body that
       * fast. Feet slid across the floor faster than he moved.
       *
       * So the weight goes onto the back leg, that leg drives, and he is off
       * the ground for the whole fast part - which is what a real sidestep
       * does. Nothing is planted while he is moving, so nothing can slide.
       */
      frames: [
        // Gather: weight drops onto the back leg. Feet planted, body still.
        kf(0, { ...w, torso: 10, crouch: 0.34, hipF: 10, kneeF: 40, hipB: -30, kneeB: 58, offX: -3 }, "out"),
        // Drive: the back leg extends hard against the floor, the lead knee
        // picks up. Last frame with anything on the ground.
        kf(3, { ...w, torso: 18, crouch: 0.16, hipF: 44, kneeF: 74, hipB: -46, kneeB: 20, offX: -1, head: -4 }, "out"),
        // Off the ground, opening into the stride.
        kf(6, { ...w, free: 1, torso: 16, hipF: 62, kneeF: 44, hipB: -54, kneeB: 18, offY: 9, head: -4 }, "linear"),
        // Full extension, still square to the opponent.
        kf(10, { ...w, free: 1, torso: 13, hipF: 68, kneeF: 26, hipB: -50, kneeB: 22, offY: 7, head: -3 }, "in"),
        // Reaching for the floor with the lead foot.
        kf(12, { ...w, free: 1, torso: 12, hipF: 50, kneeF: 30, hipB: -34, kneeB: 34, offY: 2, head: -2 }, "in"),
        // Land: the lead foot takes the weight and the knee absorbs it.
        kf(14, { ...w, torso: 14, crouch: 0.38, hipF: 28, kneeF: 60, hipB: -18, kneeB: 50, head: -2 }, "out"),
        // Trailing leg swings through underneath and he stands up into stance.
        kf(17, { ...w, torso: 9, crouch: 0.16, hipF: 20, kneeF: 34, hipB: -22, kneeB: 38 }, "inOut"),
        kf(20, { ...w }),
      ],
    },
    {
      id: "backstep",
      name: "Backstep",
      // Motion rather than a button: tap back-neutral-back, same shape as a
      // forward or back dash everywhere else in the genre. It costs nothing
      // to bind - `bb` has been recognised by the input buffer since the
      // motion system was built, and nothing on the roster has ever claimed
      // it, so this could not collide with an existing special.
      input: { motion: "bb", stance: ["stand", "crouch"] },
      tags: ["dodge"],
      priority: 55,
      duration: 20,
      invuln: [{ from: 3, to: 13, kind: "strike" }],
      // Same drive, same air time, same everything as the sidestep - only the
      // sign flips. A hurried retreat and a hurried step past someone look
      // like the same push off the same leg; the difference is which way you
      // committed to go, not the motion your body makes doing it.
      vel: [
        { at: 3, x: -stepSpeed },
        { at: 13, x: 0 },
      ],
      friction: 0.95,
      desc: "Tap back twice to snap out of range instead of past them. Same invulnerability, opposite direction.",
      notation: "← ←",
      // A mirror of the sidestep's leg work, not just its numbers run
      // backward. Moving away means the *front* leg is the one that has to
      // drive - pushing off toward the opponent to launch the body away from
      // them - while the back leg lifts and reaches out behind to catch the
      // landing. Reusing the forward step's pose with the roles left alone
      // would have the drive leg pushing the wrong way while the body moves
      // backward underneath it: skating, the exact fault the forward step
      // was already rebuilt once to get rid of.
      frames: [
        kf(0, { ...w, torso: 10, crouch: 0.34, hipF: -30, kneeF: 58, hipB: 10, kneeB: 40, offX: 3 }, "out"),
        kf(3, { ...w, torso: 18, crouch: 0.16, hipF: -46, kneeF: 20, hipB: 44, kneeB: 74, offX: 1, head: -4 }, "out"),
        kf(6, { ...w, free: 1, torso: 16, hipF: -54, kneeF: 18, hipB: 62, kneeB: 44, offY: 9, head: -4 }, "linear"),
        kf(10, { ...w, free: 1, torso: 13, hipF: -50, kneeF: 22, hipB: 68, kneeB: 26, offY: 7, head: -3 }, "in"),
        kf(12, { ...w, free: 1, torso: 12, hipF: -34, kneeF: 34, hipB: 50, kneeB: 30, offY: 2, head: -2 }, "in"),
        kf(14, { ...w, torso: 14, crouch: 0.38, hipF: -18, kneeF: 50, hipB: 28, kneeB: 60, head: -2 }, "out"),
        kf(17, { ...w, torso: 9, crouch: 0.16, hipF: -22, kneeF: 38, hipB: 20, kneeB: 34 }, "inOut"),
        kf(20, { ...w }),
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * A fighter's three guard poses, written as absolute angles.
 *
 * The shared block clips are additive deltas on top of the stance, which means
 * a fighter who already holds their hands high ends up with the arms folded
 * into their own head, and a fighter with a shield covers with the wrong arm.
 * Authoring the guard per fighter fixes both: everyone blocks with the thing
 * they are actually carrying.
 */
export interface Guard {
  /** Standing guard, held while blocking high. */
  high: Pose;
  /** Crouching guard. `crouch` is filled in if the pose leaves it out. */
  low: Pose;
  /** Airborne guard. Defaults to the standing guard with the legs tucked. */
  air?: Pose;
}

/** Nudges a guard pose a little tighter, for the overshoot on the way in. */
function tighten(p: Pose, k: number): Pose {
  const bump = (v: number | undefined, d: number) => (v === undefined ? undefined : v + d * k);
  return {
    ...p,
    torso: bump(p.torso, -4),
    head: bump(p.head, -2),
    shoulderF: bump(p.shoulderF, 5),
    shoulderB: bump(p.shoulderB, 4),
    elbowF: bump(p.elbowF, 7),
    elbowB: bump(p.elbowB, 6),
    offX: (p.offX ?? 0) - 2 * k,
  };
}

/**
 * Builds the three guard clips from a fighter's authored guard.
 *
 * The shape is the same for everyone so blocking feels consistent across the
 * roster: the guard snaps up over four frames, overshoots slightly, then
 * settles. Being hit while guarding does not restart these clips - the recoil
 * is a separate decaying shove, so a blockstring keeps the arms up.
 */
export function guardClips(g: Guard): { blockHigh: ClipDef; blockLow: ClipDef; blockAir: ClipDef } {
  const low: Pose = { crouch: 1, ...g.low };
  const air: Pose = g.air ?? { ...g.high, free: 1, hipF: 34, kneeF: 52, hipB: -22, kneeB: 46 };
  air.free = 1;

  const clip = (p: Pose, raise: number): ClipDef => ({
    length: 8,
    frames: [
      { t: 0, add: {}, ease: "out" },
      { t: raise, p: tighten(p, 1) },
      { t: 8, p, ease: "inOut" },
    ],
  });

  return { blockHigh: clip(g.high, 4), blockLow: clip(low, 4), blockAir: clip(air, 3) };
}

/**
 * Small authoring helpers so a fighter file reads like a move list instead of
 * a wall of object literals, plus the universal moves every fighter gets.
 */

import type { Box, Ease, HitDef, Keyframe, MoveDef, Pose } from "../types";

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
  /** Roll distance multiplier. */
  rollSpeed?: number;
  /** Weapon-holding fighters keep the arm angled during universal moves. */
  weaponIdle?: Pose;
}

/**
 * The universal kit every fighter carries: block, parry, dodge and two throws.
 * Characters differ in their five specials, their skill and their super - the
 * defensive fundamentals are identical so the game reads the same on both
 * sides of the screen.
 *
 * Control scheme:
 *   S (hold)  Block        ← + S  Parry       → + S  Dodge roll
 *   ↓ + S     Character skill     A + B  Throw       ← + A + B  Back throw
 */
export function universalMoves(opts: UniversalOptions = {}): MoveDef[] {
  const throwDamage = opts.throwDamage ?? 120;
  const backThrowDamage = opts.backThrowDamage ?? 130;
  const range = opts.throwRange ?? 62;
  const rollSpeed = opts.rollSpeed ?? 7.5;
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
      id: "roll",
      name: "Dodge Roll",
      input: { button: "S", dir: "f", stance: ["stand", "crouch"] },
      tags: ["dodge"],
      priority: 55,
      duration: 30,
      invuln: [{ from: 4, to: 20, kind: "strike" }],
      vel: [
        { at: 1, x: rollSpeed },
        { at: 22, x: 0 },
      ],
      friction: 0.86,
      desc: "Rolls through attacks and past the opponent. Vulnerable on recovery.",
      notation: "→ + S",
      frames: [
        kf(0, { ...w, torso: 20, crouch: 0.6, hipF: 30, kneeF: 50 }, "out"),
        kf(8, { free: 1, spin: -140, torso: 30, crouch: 1, offY: 16, hipF: 70, kneeF: 110, hipB: -40, kneeB: 120, shoulderF: 60, elbowF: 90, shoulderB: 50, elbowB: 84 }, "linear"),
        kf(16, { free: 1, spin: -300, torso: 24, crouch: 1, offY: 14, hipF: 60, kneeF: 100, hipB: -30, kneeB: 110, shoulderF: 40, elbowF: 80, shoulderB: 34, elbowB: 76 }, "linear"),
        kf(22, { ...w, spin: -360, torso: 16, crouch: 0.7, hipF: 34, kneeF: 60, hipB: -20, kneeB: 60 }, "out"),
        kf(30, { ...w }),
      ],
    },
  ];
}

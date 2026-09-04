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
  /** Dodge distance multiplier - scales both the roll and the backstep. */
  rollSpeed?: number;
  /**
   * Extra rotation, in degrees, applied to a hand's weapon through the roll.
   *
   * The roll holds each weapon at the angle its owner already carries it at,
   * which keeps every grip intact - but a weapon carried point-down (the
   * Viking's axe, the ninja's reversed tanto) then digs into the stage when
   * the hand swings past the floor. These lift those few blades clear without
   * imposing one generic carry on the whole roster.
   */
  rollCarry?: { front?: number; back?: number };
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
 *   → + S         Roll           ← ← (tap back twice)   Backstep
 *   ↓ + S         Low guard      A + B  Throw       ← + A + B  Back throw
 */
export function universalMoves(opts: UniversalOptions = {}): MoveDef[] {
  const throwDamage = opts.throwDamage ?? 120;
  const backThrowDamage = opts.backThrowDamage ?? 130;
  const range = opts.throwRange ?? 62;
  // Per-fighter dodge distance, in units, against a 40-unit hurtbox.
  //
  // The push fires on frame 3 rather than frame 1 - he has to get off the
  // ground first - so the authored number is scaled back up to pay for the two
  // frames of travel that costs. A roll ends up crossing something like eight
  // character widths, which is the whole mechanic: nothing here makes a
  // fighter untouchable, so a dodge that barely outruns a walk does not avoid
  // anything at all. The distance is the defence.
  //
  // The roll commits and covers ground; the backstep is a short sharp exit and
  // is deliberately left at the distance it always had. They are separate
  // numbers because they are separate decisions - raising one to make the roll
  // feel like a roll should not quietly lengthen the other.
  const rollSpeed = (opts.rollSpeed ?? 7.5) * 2.3;
  const stepSpeed = (opts.rollSpeed ?? 7.5) * 2.05;
  const w = opts.weaponIdle ?? {};

  /**
   * Weapon angles for the roll.
   *
   * A hand-held prop hangs off the rig group, so the tumble turns it too - and
   * unlike the body, a weapon cannot tuck. Left on its idle angle the blade
   * sweeps a circle of its own length: measured, the duelist's smallsword
   * drove its tip 135 units below the stage, deeper than he is tall, and every
   * armed fighter raked the floor to some degree.
   *
   * So the weapon is counter-rotated. Each value cancels that frame's body
   * spin and the change in forearm angle since the stance, which holds the
   * blade at the angle the fighter was already carrying it at while his body
   * turns underneath - what you would actually do with a sword in your hand.
   * Writing them as offsets from the idle angle rather than as absolute
   * numbers keeps every fighter's own grip.
   *
   * The offsets end on a whole turn rather than returning to zero, for the
   * same reason the body's `spin` holds at 360: -360 and 0 draw the same
   * picture but interpolate as a full turn, which would spin the weapon in
   * his hand all through the recovery.
   */
  const lift = opts.rollCarry ?? {};
  const carry = (front: number, back: number): Pose => ({
    weapon: (w.weapon ?? 0) + front + (lift.front ?? 0),
    weaponBack: (w.weaponBack ?? 0) + back + (lift.back ?? 0),
  });

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
      name: "Roll",
      input: { button: "S", dir: "f", stance: ["stand", "crouch"] },
      tags: ["dodge"],
      priority: 55,
      duration: 26,
      // No invulnerability. What avoids the attack is where his body is: for
      // the sixteen frames he is tucked he is a ball forty-six units tall,
      // less than half his standing height and lower than a crouch, so a swing
      // aimed at a standing man passes over him. The moment he starts standing
      // back up he is a full-sized target again, which is what makes the
      // recovery the price of the move rather than a formality.
      hurtboxAt: [{ from: 3, to: 18, box: { x: -22, y: 0, w: 44, h: 46 } }],
      vel: [
        { at: 3, x: rollSpeed },
        { at: 18, x: 0 },
      ],
      // Higher than the old step's 0.95 so he keeps sliding out of the tumble
      // rather than stopping dead the moment the push ends.
      friction: 0.97,
      desc: "A committed roll that covers real ground. He tucks under head-height while he tumbles, and is a full-sized target again the moment he stands up.",
      notation: "\u2192 + S",
      /**
       * A tuck and roll, the way Dark Souls does it.
       *
       * There was a roll here once and it was cut, because it turned a full
       * 360 while covering less ground than simply walking for the same
       * length of time - it read as spinning on the spot. The fault was never
       * the rolling. It was that the distance and the pivot were both wrong:
       * a body that pinwheels around its ankles goes nowhere, which is what
       * `spinPivot` exists to fix. Turning about the middle instead, with
       * enough push behind it to cross two body lengths, is a roll.
       *
       * Nothing is planted while he is turning, so nothing can slide.
       */
      frames: [
        // Load: weight drops and the chest pitches over the lead foot.
        kf(0, { ...w, torso: 22, crouch: 0.42, hipF: 26, kneeF: 56, hipB: -22, kneeB: 48, head: 6, offX: -2 }, "in"),
        // Dive: he commits, leaves the floor and starts to close up. The pivot
        // rises from the floor to the centre of the ball he is becoming.
        kf(3, { ...w, free: 1, torso: 48, crouch: 0.62, spin: 30, spinPivot: 14, offX: -9, offY: 13,
                hipF: 68, kneeF: 92, hipB: 18, kneeB: 78,
                shoulderF: 28, elbowF: 104, shoulderB: 22, elbowB: 98, head: 18, ...carry(-133, -59) }, "linear"),
        // Tucked. Every joint is now inside the ball, which is what lets the
        // next four frames be pure rotation.
        kf(7, { ...w, free: 1, torso: 75, crouch: 0.92, squash: 0.92, spin: 128, spinPivot: 22, offX: -21, offY: 1,
                hipF: 104, kneeF: 124, hipB: 92, kneeB: 118,
                shoulderF: 30, elbowF: 150, shoulderB: 24, elbowB: 146, head: 35, ...carry(-288, -216) }, "linear"),
        // All the way round, holding exactly the same shape. A ball that
        // changes shape while it is upside down is a fighter flailing, not
        // rolling - the tumble is carried by the rotation alone, and holding
        // the tuck this late is also what keeps his head out of the floor
        // through the bottom of the turn.
        kf(13, { ...w, free: 1, torso: 75, crouch: 0.92, squash: 0.92, spin: 268, spinPivot: 22, offX: -21, offY: 1,
                 hipF: 104, kneeF: 124, hipB: 92, kneeB: 118,
                 shoulderF: 30, elbowF: 150, shoulderB: 24, elbowB: 146, head: 35, ...carry(-428, -356) }, "linear"),
        // Opening out: the legs come down under him while the last of the
        // rotation carries him upright.
        kf(16, { ...w, free: 1, torso: 58, crouch: 0.84, squash: 0.95, spin: 330, spinPivot: 22, offX: -14, offY: 4,
                 hipF: 82, kneeF: 100, hipB: 54, kneeB: 92,
                 shoulderF: 28, elbowF: 118, shoulderB: 22, elbowB: 112, head: 22, ...carry(-450, -376) }, "out"),
        // Feet down, spin unwound, the knee taking the landing.
        kf(18, { ...w, torso: 30, crouch: 0.62, spin: 360, spinPivot: 22, hipF: 40, kneeF: 78, hipB: -14, kneeB: 58,
                 head: 6, offY: 1, ...carry(-363, -363) }, "in"),
        // Up out of it - and this is the part that can be punished.
        //
        // These hold spin at 360 rather than dropping it to 0. Three hundred
        // and sixty degrees is the same picture as zero, but interpolating
        // between them is not: leaving these unset let the tween run 360 back
        // down to 0 across the recovery, so he landed the roll and then
        // unwound a full turn backwards on his feet.
        //
        // The rise is eased in, not out. Standing straight up on the first
        // frame after landing spends the whole punish window looking idle,
        // which reads as the game ignoring you rather than as a cost you are
        // paying: he stays down over the knee and only comes up at the end.
        kf(21, { ...w, spin: 360, spinPivot: 22, torso: 26, crouch: 0.5, hipF: 34, kneeF: 66, hipB: -18, kneeB: 52,
                 head: 4, ...carry(-360, -360) }, "in"),
        kf(24, { ...w, spin: 360, spinPivot: 22, torso: 14, crouch: 0.2, hipF: 20, kneeF: 38, hipB: -20, kneeB: 38, ...carry(-360, -360) }, "inOut"),
        kf(26, { ...w, spin: 360, spinPivot: 22, ...carry(-360, -360) }),
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
      // Also no invulnerability, and it never needed any: measured against
      // every attack in the game it was already avoiding all of them purely by
      // leaving, and stripping the window out changed nothing it does.
      //
      // The short sharp exit, deliberately left exactly as it was: same
      // distance and timing it has always had. The leg work
      // that makes this direction honest lives in the frames below, not here.
      vel: [
        { at: 3, x: -stepSpeed },
        { at: 13, x: 0 },
      ],
      friction: 0.95,
      desc: "Tap back twice to leave the range instead of rolling past them. Nothing protects you but the distance, so make it early.",
      notation: "← ←",
      // A mirror of a forward step's leg work, not just its numbers run
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

/** Global rules of the game. Fighter-specific numbers live in FighterDef.stats. */

export const FPS = 60;
export const DT = 1 / FPS;

/** Stage bounds in world units (x = 0 is the centre of the arena). */
export const STAGE_HALF_WIDTH = 520;
export const GROUND_Y = 0;

/** How far apart fighters start. */
export const START_X = 150;

/** Camera framing. */
export const CAMERA = {
  minViewWidth: 620,
  maxViewWidth: 980,
  padding: 210,
  height: 96,
  lerp: 0.12,
};

export const MATCH = {
  roundTime: 99,
  roundsToWin: 2,
  koFreeze: 40,
  roundEndDelay: 110,
  introFrames: 70,
};

export const COMBAT = {
  /** Universal jump squat before leaving the ground. */
  jumpSquat: 4,
  landRecovery: 4,
  /** Frames of extra hitstop applied to the attacker on a counter hit. */
  counterBonus: 4,
  counterDamageScale: 1.25,
  counterHitstunBonus: 6,
  /** Damage scaling per combo hit, clamped by minScale. */
  scaleStep: 0.9,
  minScale: 0.28,
  /** Hitstun decays over a long combo so juggles end. */
  juggleDecay: 0.9,
  minHitstun: 8,
  maxJuggle: 6,
  /** Chip damage cannot kill; the defender is left at this much health. */
  chipFloor: 1,
  /** Meter, in units. Supers cost 100. */
  maxMeter: 200,
  meterOnWhiff: 1.2,
  meterOnHit: 6,
  meterOnBlock: 2,
  meterOnTakeHit: 4,
  /** Guard meter: block too much and the guard breaks. */
  maxGuard: 100,
  guardRegen: 0.35,
  guardBreakStun: 60,
  /**
   * Knockback scaling. A hit's authored `pushX` is the shove a *mid-weight*
   * blow gives; the multiplier below reads the damage on top of that, so a jab
   * nudges and a two-handed overhead sends them across the arena. Without it
   * every hit moved the opponent about the same distance and the roster's
   * weight numbers did nothing you could see.
   */
  knockbackBase: 0.62,
  knockbackPerDamage: 0.0052,
  knockbackMin: 0.6,
  knockbackMax: 1.9,
  /** Fraction of the multiplier that reaches a launch (juggles stay framed). */
  knockbackLaunchMix: 0.4,
  /** Fraction that reaches a blocked hit. */
  knockbackBlockMix: 0.55,
  /**
   * Knockback decays over a combo so long strings do not walk the pair into
   * the corner and out of the camera.
   */
  knockbackComboDecay: 0.94,
  knockbackComboFloor: 0.62,
  /**
   * How hard the weight difference tilts the shove. 0 = weight only affects
   * launches, 1 = a heavyweight hitting a featherweight doubles the distance.
   */
  knockbackWeightSwing: 0.45,
  /** Pushback applied when two fighters overlap. */
  pushSpeed: 1.4,
  /** Grounded friction per frame while not moving. */
  friction: 0.82,
  airFriction: 0.985,
  /** Extra gravity while holding down in the air. */
  fastFall: 0.45,
  /** Wake-up options window. */
  wakeupFrames: 20,
  hardKnockdownFrames: 34,
  softKnockdownFrames: 18,
  /** Parry window and reward. */
  parryWindow: 6,
  parryRecovery: 12,
  parryMeter: 14,
  parryFreeze: 14,
  /** Throw tech window after being grabbed. */
  throwTechWindow: 8,
  /** Input buffer length for specials and cancels. */
  bufferFrames: 10,
  motionWindow: 14,
  chargeFrames: 40,
  dashInputWindow: 12,
};

export const HURTBOX = {
  stand: { x: -16, y: 0, w: 40, h: 104 },
  crouch: { x: -16, y: 0, w: 44, h: 66 },
  air: { x: -18, y: 0, w: 42, h: 84 },
  /** Head area - used for anti-air and juggle detection. */
  headHeight: 78,
};

export const AI_LEVELS = ["Rookie", "Brawler", "Veteran", "Champion", "Legend"] as const;
export type AiLevel = (typeof AI_LEVELS)[number];

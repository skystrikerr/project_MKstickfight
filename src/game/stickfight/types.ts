/**
 * Core data types for the Stick Fighter engine.
 *
 * Everything about a character - stats, animation, hitboxes, props - is plain
 * data. Adding a new fighter means adding one file that exports a FighterDef
 * and registering it in `fighters/index.ts`; no engine or renderer changes.
 *
 * Units: 1 unit ~= 1 pixel at default zoom. Ground is y = 0, a fighter is about
 * 106 units tall. All positions inside a move (hitboxes, offsets) are expressed
 * in *facing space*: +x is the direction the fighter is looking.
 * Time is measured in simulation frames at 60 fps.
 */

export type Facing = 1 | -1;

/** Which side of the screen a fighter belongs to. */
export type PlayerIndex = 0 | 1;

// ---------------------------------------------------------------------------
// Poses & animation
// ---------------------------------------------------------------------------

/**
 * A pose is a set of joint angles in degrees, layered on top of the fighter's
 * base stance. Every field is optional - omitted joints keep the stance value.
 *
 * Angle conventions (all degrees, all in facing space):
 *  - `hipF/hipB`      0 = thigh straight down, positive swings the leg forward.
 *  - `kneeF/kneeB`    0 = straight leg, positive bends the shin backward.
 *  - `shoulderF/B`    0 = arm hanging down, positive raises it forward/up.
 *  - `elbowF/elbowB`  0 = straight arm, positive bends the forearm forward.
 *  - `torso`          0 = upright spine, positive leans toward the opponent.
 *  - `head`           extra tilt on top of the torso lean.
 *  - `weapon`         weapon rotation relative to the holding forearm.
 *
 * "F" is the front (lead) limb - the one nearer the opponent - and "B" the back
 * limb. That keeps poses readable no matter which way the fighter faces.
 */
export interface Pose {
  torso?: number;
  head?: number;
  shoulderF?: number;
  elbowF?: number;
  shoulderB?: number;
  elbowB?: number;
  hipF?: number;
  kneeF?: number;
  hipB?: number;
  kneeB?: number;
  weapon?: number;
  /** Weapon held in the back hand instead of the front hand for this pose. */
  weaponBack?: number;
  /** Body offset in facing space, units. */
  offX?: number;
  offY?: number;
  /** 0..1 crouch amount: pulls the hips down without changing the leg angles. */
  crouch?: number;
  /** Whole-body rotation in degrees (rolls, flips, spin attacks). */
  spin?: number;
  /**
   * Height above the ground that `spin` turns about, in units. The default of
   * 0 pivots on the floor between the feet, which is right for a cartwheel or
   * a spinning attack that keeps a foot planted. A tuck-and-roll needs the
   * body turning about its own middle instead, or the figure pinwheels around
   * its ankles rather than rolling along the ground.
   */
  spinPivot?: number;
  /** Vertical squash/stretch, 1 = neutral. */
  squash?: number;
  /** When true the feet are not glued to the floor (airborne poses). */
  free?: number;
}

export type Ease = "linear" | "in" | "out" | "inOut" | "step";

export interface Keyframe {
  /** Frame index, relative to the start of the move or clip. */
  t: number;
  /** Absolute joint angles. Joints left out fall back to the fighter's stance. */
  p?: Pose;
  /**
   * Angles *added* to the stance instead of replacing it. Shared movement
   * clips use this so every fighter keeps their own silhouette while walking.
   */
  add?: Pose;
  ease?: Ease;
}

/** A looping or one-shot animation used by movement states. */
export interface ClipDef {
  length: number;
  loop?: boolean;
  frames: Keyframe[];
}

export type ClipName =
  | "idle"
  | "walkF"
  | "walkB"
  | "crouch"
  | "jumpSquat"
  | "jumpUp"
  | "jumpFall"
  | "land"
  | "dash"
  | "backdash"
  | "blockHigh"
  | "blockLow"
  | "blockAir"
  | "parry"
  | "hitHigh"
  | "hitMid"
  | "hitLow"
  | "hitAir"
  | "launched"
  | "knockdown"
  | "wakeup"
  | "ko"
  | "win"
  | "taunt"
  | "grabbed"
  | "dizzy";

// ---------------------------------------------------------------------------
// Boxes & hits
// ---------------------------------------------------------------------------

/** Axis-aligned box in facing space: x forward, y up from the ground. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type GuardHeight = "high" | "mid" | "low" | "overhead" | "unblockable";

/**
 * A ledge you can stand on, jump up through from below, and drop off by
 * holding down. Thickness is drawn, not simulated: only the top edge exists to
 * the physics, which is what makes passing up through one feel right.
 */
export interface Platform {
  /** Left edge, in stage coordinates. */
  x: number;
  /** Height of the top surface above the floor. */
  y: number;
  w: number;
}

export type KnockdownKind =
  | "none"
  | "soft"
  | "hard"
  | "launch"
  | "wallbounce"
  | "groundbounce"
  | "sweep"
  | "crumple";

export type HitFx = "slash" | "blunt" | "pierce" | "shot" | "explode" | "burn" | "spark";

export interface HitDef {
  /** Active window, inclusive, in frames from the start of the move. */
  from: number;
  to: number;
  box: Box;
  damage: number;
  /** Frames of hitstun applied to a grounded opponent. */
  hitstun: number;
  blockstun: number;
  /** Freeze frames on connect - the punch of a good hit. */
  hitstop?: number;
  /** Horizontal pushback applied to the defender. */
  pushX?: number;
  /** Horizontal pushback applied to the attacker. */
  selfPushX?: number;
  /** Velocity given to the defender when this hit launches. */
  launch?: [number, number];
  guard?: GuardHeight;
  knockdown?: KnockdownKind;
  chip?: number;
  meterGain?: number;
  meterGainDefender?: number;
  /** Hits sharing a group only connect once per move (multi-hit sequences). */
  group?: number;
  fx?: HitFx;
  /** Extra stun/juggle bookkeeping. */
  juggleCost?: number;
  /** Scales the screen shake this hit produces. */
  shake?: number;
}

export interface ThrowDef {
  from: number;
  to: number;
  /** Forward reach of the grab, units. */
  range: number;
  /** Vertical window the opponent must be inside. */
  minY?: number;
  maxY?: number;
  airOk?: boolean;
  /** Move id to switch into when the grab connects. */
  success: string;
  /** Move id to switch into when it whiffs (defaults to staying in the move). */
  whiff?: string;
}

/** Damage dealt by a throw once the victim is already held. */
export interface ThrowPayload {
  at: number;
  damage: number;
  launch: [number, number];
  knockdown?: KnockdownKind;
  hitstop?: number;
  shake?: number;
  fx?: HitFx;
  /** Extra hits landed before the release (pummels, spinning piledrivers). */
  ticks?: { at: number; damage: number; fx?: HitFx }[];
}

export interface ProjectileSpawn {
  at: number;
  kind: string;
  /** Spawn offset in facing space. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity?: number;
  life: number;
  box: Box;
  damage: number;
  hitstun: number;
  blockstun: number;
  guard?: GuardHeight;
  knockdown?: KnockdownKind;
  pushX?: number;
  chip?: number;
  /** How many opponents/projectiles it can hit before disappearing. */
  hits?: number;
  /** Destroyed when it collides with an enemy projectile. */
  clashes?: boolean;
  /** Energy kept when it hits the floor (0 = no bounce). */
  bounce?: number;
  /** How many times it may bounce before it settles or detonates. */
  bounces?: number;
  /** Air resistance per frame, 0..1. */
  drag?: number;
  fx?: HitFx;
  hitstop?: number;
  meterGain?: number;
  /** Explodes into an area hit when its life runs out or it lands. */
  detonate?: {
    radius: number;
    damage: number;
    hitstun: number;
    blockstun: number;
    knockdown?: KnockdownKind;
    guard?: GuardHeight;
    chip?: number;
  };
  scale?: number;
  spin?: number;
  color?: string;
  trail?: string;
}

export type InvulnKind = "full" | "strike" | "throw" | "projectile" | "low" | "high";

export interface InvulnWindow {
  from: number;
  to: number;
  kind: InvulnKind;
}

export interface ArmorWindow {
  from: number;
  to: number;
  /** Number of hits absorbed. */
  hits: number;
  /** Fraction of damage still taken while absorbing. */
  damageScale?: number;
}

export interface VelChange {
  at: number;
  x?: number;
  y?: number;
  mode?: "set" | "add";
}

export type Stance = "stand" | "crouch" | "air";

export type MoveTag =
  | "light"
  | "medium"
  | "heavy"
  | "command"
  | "special"
  | "super"
  | "throw"
  | "movement"
  | "block"
  | "dodge"
  | "skill"
  | "overhead"
  | "low"
  | "launcher"
  | "air"
  | "ex"
  | "stance"
  | "projectile";

export type Motion =
  | "none"
  | "qcf" // down, down-forward, forward
  | "qcb"
  | "dp" // forward, down, down-forward
  | "rdp"
  | "hcf"
  | "hcb"
  | "dd" // down, down
  | "ff" // forward, forward (dash motion)
  | "bb"
  | "chargeB" // hold back, then forward
  | "chargeD"; // hold down, then up

export type Dir = "n" | "f" | "b" | "d" | "u" | "df" | "db" | "uf" | "ub";

export type Button = "A" | "B" | "C" | "S";

export interface MoveInput {
  button?: Button;
  /** Two buttons pressed together (throws, EX specials). */
  buttons?: Button[];
  dir?: Dir;
  motion?: Motion;
  stance: Stance | Stance[];
}

export interface MoveDef {
  id: string;
  name: string;
  input: MoveInput;
  duration: number;
  tags?: MoveTag[];
  /** Higher priority wins when several moves match the same input. */
  priority?: number;
  hits?: HitDef[];
  projectiles?: ProjectileSpawn[];
  throwDef?: ThrowDef;
  throwPayload?: ThrowPayload;
  /** Where the held opponent sits during a throw, in facing space. */
  grabOffset?: [number, number];
  vel?: VelChange[];
  /** Gravity applies during the move (set automatically for air moves). */
  airborne?: boolean;
  /** Ends early on landing. */
  landCancel?: boolean;
  /** Frames of landing recovery when a land-cancelled air move touches down. */
  landRecovery?: number;
  friction?: number;
  invuln?: InvulnWindow[];
  armor?: ArmorWindow[];
  meterCost?: number;
  meterGain?: number;
  /** Fighter-specific resource (bullets, powder, rum...) consumed on startup. */
  resourceCost?: number;
  /** Resource restored at the end of the move. */
  resourceGain?: number;
  /** Requires at least this much resource to come out. */
  resourceMin?: number;
  /** Tags this move may be cancelled into once it has connected. */
  cancelInto?: MoveTag[];
  /** Frames during which a cancel is allowed (defaults to on/after contact). */
  cancelWindow?: [number, number];
  /** Can be cancelled even on block. */
  cancelOnBlock?: boolean;
  /** Follow-up move ids reachable by pressing a button during this move. */
  /**
   * Routes into another move when the button is pressed in the window,
   * whether the hit landed or was blocked. `string` names the sequence it
   * belongs to, which is how the move list groups it.
   */
  followUps?: { button: Button; move: string; from: number; to: number; string?: string }[];
  /** Loops back to this frame while the button is held (stances, charges). */
  holdLoop?: { from: number; to: number; button: Button; maxFrames?: number };
  /** Move to run when the hold ends (for stances). */
  holdRelease?: string;
  hurtbox?: Box;
  /** Frames during which an incoming strike is parried instead of blocked. */
  parryWindow?: [number, number];
  /** Skips the normal turn-to-face check during the move. */
  noTurn?: boolean;
  frames: Keyframe[];
  /** Sound key played on startup. */
  sfx?: string;
  /** Visual effect key spawned during the move. */
  vfx?: { at: number; kind: string; x: number; y: number; scale?: number; color?: string }[];
  /** Screen-freeze on activation, used by supers. */
  superFreeze?: number;
  /** Conditional prop ids (pistols, dynamite...) shown during this move. */
  showProps?: string[];
  /** Prop ids hidden during this move (a thrown javelin, a holstered gun). */
  hideProps?: string[];
  /** Description shown in the move list. */
  desc: string;
  /** Notation shown in the move list, e.g. "↓↘→ + B". */
  notation?: string;
  /** Hidden from the move list (internal states like throw animations). */
  internal?: boolean;
  /**
   * Marks this move as an alternate version of another special (the air
   * version of a shot, for example). Variants are listed under their parent
   * and do not count towards the character's five specials.
   */
  variant?: string;
}

// ---------------------------------------------------------------------------
// Props (the bits that make a stickman look like a pirate)
// ---------------------------------------------------------------------------

export type ShapeGeo =
  | "box"
  | "cyl"
  | "cone"
  | "sphere"
  | "disc"
  | "blade"
  | "tri"
  /** Arbitrary silhouette: `size` is a flat list of x,y pairs. */
  | "poly"
  /** Annulus: `size` is [outerRadius, thickness]. */
  | "ring";

export interface ShapePart {
  geo: ShapeGeo;
  /**
   * [w, h] for flat shapes, [r] for round ones, [len, w, taper] for blades,
   * [r, thickness] for rings, and a flat x,y point list for polygons.
   */
  size: number[];
  pos: [number, number];
  rot?: number;
  color?: string;
  /** Depth sorting nudge; higher renders in front. */
  z?: number;
  /** Renders behind the body (capes, back-mounted shields). */
  behind?: boolean;
}

export type PropAttach =
  | "head"
  | "neck"
  | "torso"
  | "pelvis"
  | "handF"
  | "handB"
  | "forearmF"
  | "forearmB"
  | "back"
  | "footF"
  | "footB";

/** A simulated cape/tail hanging from the prop's attachment point. */
export interface PropCloth {
  segments: number;
  segmentLength: number;
  width: number;
  endWidth?: number;
  color: string;
  lining?: string;
  gravity?: number;
  stiffness?: number;
  drift?: number;
}

export interface PropDef {
  id: string;
  attach: PropAttach;
  parts: ShapePart[];
  /** Physics cloth hanging from this prop (capes, coat tails, cloaks). */
  cloth?: PropCloth;
  /** Hidden unless the current move/state lists this prop id in `showProps`. */
  conditional?: boolean;
}

// ---------------------------------------------------------------------------
// Fighters
// ---------------------------------------------------------------------------

export interface FighterPalette {
  body: string;
  outline: string;
  accent: string;
  cloth: string;
  metal: string;
  aura: string;
}

export interface ResourceDef {
  name: string;
  max: number;
  start: number;
  /** Passive regeneration per frame. */
  regen?: number;
  /** Regeneration only while grounded and not attacking. */
  regenIdleOnly?: boolean;
  /** Gained each time one of this fighter's attacks connects. */
  gainOnHit?: number;
  /** Gained each time this fighter is hit - rage that feeds on punishment. */
  gainOnTakeHit?: number;
  /** Gained when one of this fighter's attacks is blocked. */
  gainOnBlocked?: number;
  color: string;
  /** Rendered as discrete pips (bullets) instead of a bar. */
  pips?: boolean;
  /**
   * Spare magazines. When set, what a reload refills is finite: the fighter
   * carries this many refills and no more, so the ammunition that matters is
   * the total across the round rather than what is in the weapon now.
   *
   * Left unset, reloads are unlimited - a revolver and a handful of loose
   * cartridges, rather than a rifleman's three magazines.
   */
  spares?: number;
  /** What one spare is called, for the HUD. */
  spareName?: string;
}

export interface FighterStats {
  health: number;
  walkF: number;
  walkB: number;
  dashSpeed: number;
  dashFrames: number;
  backdashFrames: number;
  jumpVel: number;
  jumpFwd: number;
  gravity: number;
  /** Multiplies incoming knockback. Lighter fighters fly further. */
  weight: number;
  airMoves: number;
  doubleJump: boolean;
  airDash: boolean;
  /** Pushbox half-width. */
  width: number;
  standHeight: number;
  crouchHeight: number;
  scale: number;
}

export interface FighterDef {
  id: string;
  name: string;
  title: string;
  era: string;
  bio: string;
  palette: FighterPalette;
  stats: FighterStats;
  /** Base stance layered under every pose. */
  stance: Pose;
  clips?: Partial<Record<ClipName, ClipDef>>;
  moves: MoveDef[];
  props: PropDef[];
  resource?: ResourceDef;
  /** 1 (easy) .. 5 (execution heavy) - shown on the select screen. */
  difficulty: number;
  archetype: string;
  strengths: string[];
  weaknesses: string[];
  /** Line shown when the fighter wins a round. */
  winQuote: string;
}

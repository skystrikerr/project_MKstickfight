/**
 * Core data types for the Plank Fighter World engine.
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

/**
 * The kind of protection a prop represents, so an attack can aim at a piece of
 * armour without naming twenty-two fighters' prop ids.
 *
 * Only worn protection is tagged. A hat is not a helmet and a cloak is not a
 * cuirass: if losing it would not change what an attack does to the man, it
 * has no slot.
 */
export type ArmourSlot = "head" | "shield" | "body";

/**
 * Armour knocked off the defender by a hit, for the rest of the round.
 *
 * Pigafetta watched the Mactan warriors put Magellan's helmet on the sand
 * twice before they killed him, and the fight turned on it. Nothing else on
 * the roster reaches across and takes a piece of the other fighter's kit, so
 * this is deliberately narrow: it names a slot rather than a prop, it only
 * fires on a clean hit, and against someone who is not wearing that slot it
 * does nothing at all beyond the damage the hit was already doing.
 */
export interface StripDef {
  slot: ArmourSlot;
  /** Multiplies damage the stripped fighter takes afterwards. */
  damageTaken?: number;
}

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
  /** Armour this hit takes off the defender permanently. */
  strips?: StripDef;
  /**
   * Guard bar taken when this hit is blocked, instead of the usual half its
   * damage.
   *
   * Normally a blocked hit costs guard in proportion to how hard it was, which
   * is the right default and makes chipping someone down a matter of volume.
   * It leaves no way to author the other thing: a single blow whose whole
   * purpose is that the shield does not help. A lance is not a heavier sword.
   */
  guardDamage?: number;
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
  /**
   * How far the shot has to travel before it can hurt anyone, in units.
   *
   * You cannot shoot a man who is already on top of you. Without this a
   * projectile is live the instant it leaves the hand, which makes a gun a
   * better melee button than a melee button - and measurably so: these moves
   * beat everything the melee side has at every range, not just at range.
   * Arming the shot late gives whoever got inside a pocket where the weapon
   * is simply the wrong tool, which is the whole point of getting inside.
   *
   * Defaults to `COMBAT.projectileArm`. Set it to 0 for things that are meant
   * to land at your feet - a sweep along the ground, a grapple, caltrops.
   */
  armAfter?: number;
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
  /**
   * Frames after which the shot turns round and comes back to whoever threw
   * it, disappearing when it reaches them.
   *
   * The Nihang's chakram has always *said* he catches it again and never
   * actually did - it slowed on drag and expired wherever it happened to be.
   * A thrown shield has to come back or the fighter has given away the thing
   * he blocks with, so this makes the return real: it reverses, it can hit on
   * the way home, and it is caught rather than dropped.
   */
  returnAfter?: number;
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

/**
 * A patch of ground a move leaves behind.
 *
 * A projectile is a thing that travels and then stops existing; this is the
 * opposite - it never moves, it never deals damage, and all it does is change
 * what the ground underfoot is worth. It exists because the Mactan warriors
 * chose the beach: the boats grounded on the reef and the Spanish had to come
 * the last stretch on foot through the shallows, which is not a hit anyone
 * lands, it is a place that costs you something to stand in.
 *
 * The owner is not exempt. Whoever is happy fighting at walking pace in
 * knee-deep water gets the better of it, and that is a matchup rather than a
 * privilege.
 */
export interface ZoneSpawn {
  /** Frame of the move it appears on. */
  at: number;
  /** Renderer key. */
  kind: string;
  /** Centre offset in facing space. */
  x: number;
  w: number;
  /** Frames it lasts. */
  life: number;
  /** Multiplies dash speed for anyone standing in it. */
  dashScale?: number;
  /** Backdashing out is not possible from inside it. */
  noBackdash?: boolean;
  /**
   * Damage a fighter standing in it takes on each tick.
   *
   * Floored the same way chip is, so ground can never finish anybody: burning
   * a patch of stage is pressure, not a win condition you set once and walk
   * away from. Blocking does not help - the point of it is that the place
   * itself is the problem and the answer is to leave.
   */
  damage?: number;
  /** Frames between damage ticks. Defaults to 30 - twice a second. */
  every?: number;
  /** The fighter who laid it is not hurt by it. */
  ownerImmune?: boolean;
  color?: string;
}

/**
 * A rule knob change a move grants its user for the rest of the round.
 *
 * The tower modifiers already move the fight by turning these five scalars,
 * and a buff that lasts is the same idea reached from inside a move instead of
 * from outside the match. Grants multiply on top of whatever the modifiers set
 * rather than overwriting it, so a fighter can be buffed inside a tower floor
 * that is already changing the same number.
 */
export interface GrantDef {
  /**
   * The next blow that would finish this fighter leaves them on 1 instead,
   * and the grant is spent.
   *
   * Anne Bonny was condemned at St Jago de la Vega and escaped the rope by
   * declaring she was pregnant - "pleading the belly". It is the most
   * documented thing about her and the reason nobody knows how she died.
   * Nothing else on the roster cheats a loss.
   */
  survive?: boolean;
  /**
   * How many copies of this grant may be held at once. Grants normally
   * refresh - pressing the move again re-arms it rather than doubling it,
   * which is right for a stance and wrong for a thing you are supposed to
   * accumulate.
   */
  stacks?: number;
  /**
   * The fighter can no longer back away: the backdash is gone and the backward
   * walk is halved, for as long as the grant is held.
   *
   * Every other grant on the roster gives a fighter something. This one takes
   * an option off them permanently, and it exists because Cortes ran his ships
   * aground at Veracruz in 1519 so that nobody under his command could argue
   * for going home. A buff that costs a movement option is a different kind of
   * decision from a buff that costs a bar, and there is nothing else here that
   * makes it.
   */
  noRetreat?: boolean;
  /**
   * Only counts while the user is at or below this fraction of their maximum
   * health. Omitted means it applies the whole time.
   */
  belowHealth?: number;
  /** Multiplies damage the user deals. */
  damageDealt?: number;
  /** Multiplies damage the user takes. */
  damageTaken?: number;
  /** Frames it lasts. Omitted means the rest of the round. */
  frames?: number;
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
  /**
   * Resource gained each time this armour absorbs something, doubled for a
   * projectile.
   *
   * Armour has only ever been a cost you pay less of. This lets it be a
   * position worth taking: standing behind the shield while they shoot at you
   * is not merely survivable, it is how you get paid. Herodotus has Dienekes
   * told the Persian arrows would blot out the sun, and answering that it was
   * good news - they would fight in the shade.
   */
  gainPerHit?: number;
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
  /**
   * Only available while a forward dash is still running.
   *
   * Without this a dash attack shares its whole input with 6C - same button,
   * same direction, same stance, same priority - and the move picker breaks
   * that tie by declaration order, so 6C won every time and every fighter's
   * dash attack was unreachable content.
   */
  whileDashing?: boolean;
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
  /** Ground this move leaves changed behind it. */
  zones?: ZoneSpawn[];
  /**
   * Lasting buffs the move gives its user, applied when the move starts.
   * Re-using the move refreshes them rather than stacking.
   */
  grants?: GrantDef[];
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
  /**
   * This move fills the resource to its maximum instead of adding to it, and
   * refuses to start when it is already full.
   *
   * For a resource that is a container rather than a running total. A magazine
   * holds thirty rounds whether you seat it with two left in the old one or
   * twenty-nine; `resourceGain` could only ever add a fixed number and then
   * clamp, so reloading at 28/30 quietly burned a whole spare magazine to buy
   * two rounds, and the player had no way to see that coming.
   */
  resourceRefill?: boolean;
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
  /**
   * Hurtbox overrides for frame ranges, first match winning, falling back to
   * `hurtbox` and then to the stance.
   *
   * This is what lets a move avoid an attack by where the body actually is
   * rather than by being briefly untouchable: a roll that tucks into a ball
   * genuinely passes under a swing aimed at a standing man. A single static
   * `hurtbox` cannot express it, because it would leave the fighter just as
   * small while he stands back up - making the recovery, which is meant to be
   * the price of the move, safe from exactly the attacks it should lose to.
   */
  hurtboxAt?: { from: number; to: number; box: Box }[];
  /** Frames during which an incoming strike is parried instead of blocked. */
  parryWindow?: [number, number];
  /**
   * Move to switch into the instant this one parries something.
   *
   * The existing counters are hold-and-release: you read the attack, then you
   * press the button for the answer. That is right for a stance you can sit
   * in. It is wrong for a move that costs a hundred meter and is over in half
   * a second - a super has to pay out on the read itself, or the read is not
   * what you spent the meter on.
   *
   * Whiffing is the price. A counter super that catches nothing has no hitbox
   * anywhere in it and a recovery long enough to be punished for guessing.
   */
  parryInto?: string;
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
  /**
   * The same two lists, but only for a range of frames, layered over the
   * whole-move ones above.
   *
   * A throw needs this: `showProps` alone keeps the javelin in his hand for
   * the entire animation, so he releases it and is still holding one, and the
   * throw stops reading as a throw at the exact frame it matters. With a
   * window the weapon leaves on the frame the projectile appears, which is
   * the whole point of the wind-up.
   */
  propsAt?: { from: number; to: number; show?: string[]; hide?: string[] }[];
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
  | "footB"
  /**
   * Standing on the floor at the fighter's feet rather than hanging off a
   * bone, for things that are put down rather than carried - a cannon wheeled
   * into place, a planted banner. It still mirrors with the fighter, so
   * "forward" is forward whichever way they are facing, and it does not
   * inherit any joint's rotation.
   */
  | "ground";

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
  /**
   * Only drawn while the fighter holds at least this much of their resource.
   *
   * For a consumable that is a physical object rather than a number: the stake
   * across Lapulapu's back is either there or it is lying in the sand where he
   * threw it, and no move can express that, because the frames it is missing
   * for are all the frames in between his moves.
   */
  needsResource?: number;
  /**
   * What this prop protects, if anything. Tagged props can be knocked off by
   * a hit carrying a matching `strips`, and stay off for the round.
   */
  armour?: ArmourSlot;
  /**
   * This prop IS the projectile of the same id, so it leaves the body while
   * one of them is in the air and comes back when it lands.
   *
   * Opt-in on purpose. The renderer used to infer this from the names alone -
   * any projectile whose kind matched a prop id hid that prop - which is right
   * for a thrown axe and catastrophically wrong for a rifle, because the
   * Trooper's bullets are `kind: "rifle"` and his weapon is `id: "rifle"`, so
   * the gun vanished out of his hands the instant he fired it and stayed gone
   * until the bullet expired. Every fighter who shoots something rather than
   * throwing it would have hit the same thing; a self-test now holds the rest
   * of the roster to declaring it.
   */
  thrown?: boolean;
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
  /**
   * Gained each time this fighter blocks an attack.
   *
   * The mirror of `gainOnBlocked`, and a different idea: that one pays a
   * fighter for being answered, this one pays a fighter for standing it. Every
   * other resource on the roster fills by attacking, taking punishment, or
   * simply waiting - none of them fill by holding guard, which is the one
   * thing a fighter does when the plan is to still be there afterwards.
   */
  gainOnGuard?: number;
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

/**
 * The physical facts of the stage a fight happens on, as opposed to the rules
 * of the fight itself.
 *
 * One object rather than more positional arguments on the Match constructor.
 * There were already five, two of them stage properties, and the last time a
 * sixth was needed it went in at the wrong position at both call sites without
 * anything complaining.
 */
export interface StageRules {
  /** Half the playable width. Arcade levels are wider than arenas. */
  halfWidth?: number;
  /**
   * What a long drop costs.
   *
   * Only on stages built out of storeys - an arena has nowhere to fall from,
   * and adding it there would change the meaning of every jump on the roster.
   */
  fall?: {
    /** Drops shorter than this cost nothing. */
    from: number;
    /** Damage per hundred units beyond that. */
    per100: number;
    /** Never more than this from one landing. */
    max: number;
  };
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
  /**
   * Which factions this fighter belongs to - see `factions.ts`.
   *
   * Declared on the fighter rather than listed on the faction, so a faction's
   * roster assembles itself. With twenty-five fighters either direction works;
   * at the size this roster is aiming for, a hand-maintained membership list
   * is a file every single new fighter has to be threaded into and eventually
   * forgets somebody.
   *
   * A fighter is normally in several: one faith, one polity, sometimes a
   * creed. Boudica is Celtic Polytheism, the Iceni, and the Resistance.
   */
  factions?: string[];
  /**
   * Character art for the fighter's own page, as an imported asset URL.
   *
   * Optional. Without it the page draws the in-game rig large instead, which
   * is a real picture of the fighter rather than a placeholder box - so a
   * fighter with no art yet still has a page worth opening.
   */
  art?: string;
  /**
   * Flag or standard of where they are from, as an imported asset URL.
   *
   * Not always a national flag and often anachronistic if it were - Otzi has
   * no polity and Kuro has no century. Optional for that reason as much as
   * for the missing files.
   */
  flag?: string;
}

/**
 * The match: collision, hit resolution, projectiles, rounds and the effect
 * queue the renderer draws from. Pure simulation - no three.js in here.
 */

import { COMBAT, FPS, GROUND_Y, MATCH, STAGE_HALF_WIDTH } from "../constants";
import type { Box, FighterDef, GuardHeight, HitDef, HitFx, ProjectileSpawn, Platform, StageRules, StripDef,
  ZoneSpawn,
} from "../types";
import { Fighter, boxesOverlap, toWorldBox, type WorldBox } from "./fighter";
import { EMPTY_INPUT, type RawInput } from "./input";

export type Phase = "intro" | "fight" | "roundEnd" | "matchEnd";

export interface FxEvent {
  kind: HitFx | "block" | "parry" | "dust" | "smoke" | "spawn" | "super" | "guardBreak" | "ko" | "trail" | "strip" | "aura";
  x: number;
  y: number;
  scale?: number;
  color?: string;
  angle?: number;
  facing?: number;
}

export interface ComboBanner {
  hits: number;
  damage: number;
  owner: 0 | 1;
  life: number;
}

export interface Projectile {
  id: number;
  owner: 0 | 1;
  kind: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  age: number;
  spec: ProjectileSpawn;
  hitsLeft: number;
  bouncesLeft: number;
  facing: 1 | -1;
  spin: number;
  dead: boolean;
  /** Where it was fired from, so an arming distance can be measured. */
  spawnX: number;
  /** The move that spawned it, for attributing a hit back to a move name. */
  sourceMove: string;
  /**
   * Whether a super fired it.
   *
   * Carried on the shot because a projectile outlives the move that fired it -
   * a summoned rank walks up the screen for seconds after the animation has
   * finished - so reading the attacker's *current* move when it lands says
   * "not a super" and skips the decay entirely. The count itself lives on the
   * fighter, so a volley of six arrows decays as one super rather than as six
   * first hits.
   */
  fromSuper: boolean;
  /**
   * Frames until this shot may hurt the same fighter again.
   *
   * `hits` is documented as how many *opponents* a shot can pass through, and
   * in a one-on-one game there is only ever one - so without a cooldown the
   * only thing it could count was how many consecutive frames the shot spent
   * inside the same hurtbox. Every multi-hit projectile on the roster was
   * therefore landing all of its hits in three or four frames: Subutai's
   * Arrow Storm is six arrows at `hits: 3` and a seventh at `hits: 6`, which
   * is up to twenty-four hits inside about a second, and it read on screen
   * exactly as it was - a health bar disappearing.
   *
   * With a cooldown a fast shot passes through and hits once, which is what
   * the field always said it did, and a slow or lingering one still hits
   * repeatedly - just spaced far enough apart to see.
   */
  hitCooldown: number;
  /**
   * Multiplier on the damage this particular shot does, as distinct from the
   * damage its spec declares.
   *
   * A deflected pilum is the same pilum with a different owner, so it cannot
   * carry its numbers on the spec - the spec is the move definition, shared
   * by every shot the move ever fires, and writing to it would have quietly
   * rebalanced the move for the rest of the match.
   */
  damageScale: number;
  /** How many times this shot has been turned around, so it cannot ping-pong forever. */
  deflects: number;
}

/**
 * A live patch of changed ground. It has no hitbox and never expires early;
 * the only thing it does is sit there and be inconvenient.
 */
export interface Zone {
  id: number;
  owner: 0 | 1;
  kind: string;
  /** Stage coordinates, already resolved out of the owner's facing. */
  x: number;
  w: number;
  life: number;
  age: number;
  spec: ZoneSpawn;
}

export interface RoundResult {
  winner: 0 | 1 | null;
  reason: "ko" | "time" | "double" | "ringOut";
  /** What actually landed the last real hit on the fighter who lost - only
   *  meaningful for a "ko" or a "ringOut" (the hit that carried them off the
   *  edge is still the finishing move), so a timeout never claims one. */
  finishingMove?: string;
  finishingDamage?: number;
}

/**
 * A per-fight rule change. `onRoundStart` runs after the fighters are reset,
 * so it is the place to set up anything that should hold for the round;
 * `onFrame` runs once per frame of live play.
 */
export interface MatchRule {
  onRoundStart?: (m: Match) => void;
  onFrame?: (m: Match) => void;
}

/**
 * Whether a shot has travelled far enough to hurt anyone yet.
 *
 * Exported because the renderer has to agree with the simulation about it: a
 * projectile that cannot hit is drawn unsettled, and the two would drift apart
 * the first time either side of the rule was edited on its own.
 */
export function projectileArmed(p: Projectile): boolean {
  return Math.abs(p.x - p.spawnX) >= (p.spec.armAfter ?? COMBAT.projectileArm);
}

let projId = 0;
let zoneId = 0;

export class Match {
  readonly fighters: [Fighter, Fighter];
  projectiles: Projectile[] = [];
  zones: Zone[] = [];
  fx: FxEvent[] = [];

  phase: Phase = "intro";
  phaseFrame = 0;
  frame = 0;
  round = 1;
  timer = MATCH.roundTime * FPS;
  shake = 0;
  /** Global hit-freeze used by supers. */
  freeze = 0;
  slowmo = 0;
  combo: [ComboBanner | null, ComboBanner | null] = [null, null];
  lastResult: RoundResult | null = null;
  /** The most recent real hit each fighter has taken, for the KO recap. */
  private lastHitTaken: [{ move: string; damage: number } | null, { move: string; damage: number } | null] = [null, null];
  matchWinner: 0 | 1 | null = null;
  roundsToWin: number;

  /**
   * A short line for the HUD, and how many frames it has left.
   *
   * Armour coming off is worth real damage for the rest of the round and the
   * only sign of it was the prop quietly not being drawn any more - which
   * reads as a graphical glitch rather than as something you did. A mechanic
   * with a number attached has to say so.
   */
  banner: { text: string; life: number } | null = null;

  /**
   * Extra rules for this fight, used by the towers.
   *
   * The engine deliberately knows nothing about what a rule is called or what
   * it is worth - only when to run it. Everything presentational lives with
   * the tower data, so a modifier can be added there without touching the
   * simulation.
   */
  rules: MatchRule[] = [];

  /**
   * `platforms` are the ledges of whatever stage this is being played on. The
   * engine is handed them rather than looking a stage up, so it stays free of
   * anything to do with drawing.
   */
  /** Half the playable width. Arcade levels are wider than arenas. */
  readonly halfWidth: number;
  /** What the stage itself does to the fighters standing on it. */
  readonly stage: StageRules;

  constructor(
    defs: [FighterDef, FighterDef],
    roundsToWin = MATCH.roundsToWin,
    platforms: Platform[] = [],
    rules: MatchRule[] = [],
    stage: StageRules = {},
  ) {
    this.fighters = [new Fighter(defs[0], 0), new Fighter(defs[1], 1)];
    this.roundsToWin = roundsToWin;
    this.stage = stage;
    this.halfWidth = stage.halfWidth ?? STAGE_HALF_WIDTH;
    for (const f of this.fighters) {
      f.platforms = platforms;
      f.halfWidth = this.halfWidth;
      f.fall = stage.fall;
      f.ringOutBeyond = stage.ringOut?.beyond;
    }
    this.rules = rules;
    this.resetPositions();
    // The first round never goes through `startRound` - that only runs between
    // rounds - so applying the rules there alone left round one, and every
    // round of a single-round fight, quietly unmodified.
    this.applyRules();
  }

  /** Runs every rule's round-start hook. Called for the first round too. */
  private applyRules() {
    for (const rule of this.rules) rule.onRoundStart?.(this);
  }

  /** Puts both fighters back on their marks. Training mode reuses this. */
  resetPositions() {
    const [a, b] = this.fighters;
    a.x = -150;
    b.x = 150;
    for (const f of this.fighters) {
      f.y = GROUND_Y;
      f.standing = null;
      f.vx = 0;
      f.vy = 0;
      f.health = f.def.stats.health;
      f.meter = Math.min(f.meter, COMBAT.maxMeter * 0.5);
      f.guard = COMBAT.maxGuard;
      f.resource = f.def.resource?.start ?? 0;
      f.hitstun = 0;
      f.blockstun = 0;
      f.hitstop = 0;
      f.endCombo();
      f.releaseHold();
      f.grabbedBy = null;
      f.pendingKnockdown = "none";
      f.input.reset();
      // Rule knobs are reset with the rest of the fighter and re-applied by
      // `onRoundStart` below, so a modifier cannot leak into the next round
      // and cannot stack with itself across a three-round match.
      f.gravityScale = 1;
      f.damageDealtScale = 1;
      f.damageTakenScale = 1;
      f.meterScale = 1;
      f.healthDrain = 0;
      // Buffs and lost armour are both round-scoped. A helmet knocked off in
      // round one is back on for round two - the round is the unit the game
      // already resets everything else on, and a strip that carried across
      // would decide the match on one hit rather than the round.
      f.grants.length = 0;
      f.stripped.clear();
      f.terrainDash = 1;
      f.terrainNoBackdash = false;
      f.setState("intro");
    }
    a.facing = 1;
    b.facing = -1;
    this.projectiles = [];
    this.zones = [];
    this.combo = [null, null];
    this.banner = null;
  }

  startRound() {
    this.resetPositions();
    this.phase = "intro";
    this.phaseFrame = 0;
    this.timer = MATCH.roundTime * FPS;
    this.lastResult = null;
    this.applyRules();
  }

  get roundActive(): boolean {
    return this.phase === "fight";
  }

  // -------------------------------------------------------------------------
  // Main step
  // -------------------------------------------------------------------------

  step(inputs: [RawInput, RawInput]) {
    this.frame++;
    this.phaseFrame++;
    this.fx.length = 0;
    if (this.shake > 0) this.shake *= 0.86;
    if (this.shake < 0.05) this.shake = 0;

    for (let i = 0; i < 2; i++) {
      const f = this.fighters[i];
      f.pushInput(this.phase === "fight" ? inputs[i] : EMPTY_INPUT);
      f.tickAnim();
    }

    if (this.freeze > 0) {
      this.freeze--;
      return;
    }

    switch (this.phase) {
      case "intro":
        if (this.phaseFrame >= MATCH.introFrames) {
          this.phase = "fight";
          this.phaseFrame = 0;
          for (const f of this.fighters) f.setState("idle");
        }
        break;
      case "fight":
        this.stepFight();
        break;
      case "roundEnd":
        this.stepRoundEnd();
        break;
      case "matchEnd":
        this.stepPassive();
        break;
    }

    if (this.banner && --this.banner.life <= 0) this.banner = null;
    for (const banner of this.combo) {
      if (banner && banner.life > 0) banner.life--;
    }
    if (this.combo[0] && this.combo[0]!.life <= 0) this.combo[0] = null;
    if (this.combo[1] && this.combo[1]!.life <= 0) this.combo[1] = null;
  }

  private stepPassive() {
    for (const f of this.fighters) {
      f.update(this.other(f), false);
      f.stepRagdoll();
    }
    this.updateProjectiles();
  }

  private stepFight() {
    for (const rule of this.rules) rule.onFrame?.(this);
    // Drain and regeneration are resolved here rather than inside a modifier
    // so every rule that moves health does it at the same point in the frame,
    // and so none of them can win the round outright: a fight has to be
    // finished by someone hitting someone.
    for (const f of this.fighters) {
      if (f.healthDrain === 0) continue;
      const next = f.health - f.healthDrain / FPS;
      f.health = Math.max(1, Math.min(f.def.stats.health, next));
    }
    const [a, b] = this.fighters;

    a.faceOpponent(b);
    b.faceOpponent(a);

    this.applyTerrain();

    a.update(b, true);
    b.update(a, true);

    for (const f of this.fighters) {
      f.stepRagdoll();
      if (f.bounced !== "none") {
        this.pushFx({
          kind: f.bounced === "wall" ? "spark" : "dust",
          x: f.x,
          y: f.bounced === "wall" ? f.y + 50 : f.y + 4,
          scale: 1.5,
        });
        this.shake = Math.max(this.shake, 4);
        f.bounced = "none";
      }
    }

    this.separate();
    this.resolveThrows(a, b);
    this.resolveThrows(b, a);
    this.resolveHits(a, b);
    this.resolveHits(b, a);
    this.spawnProjectiles(a);
    this.spawnProjectiles(b);
    this.spawnZones(a);
    this.spawnZones(b);
    this.updateZones();
    this.updateProjectiles();
    this.emitMovementFx();

    if (this.timer > 0) this.timer--;

    // A ring-out is checked the same way a health death is - crossing the
    // line ends the round on this same frame, not on some later health tick.
    const aOut = a.ringOutBeyond !== undefined && Math.abs(a.x) > a.ringOutBeyond;
    const bOut = b.ringOutBeyond !== undefined && Math.abs(b.x) > b.ringOutBeyond;
    const aDead = a.health <= 0 || aOut;
    const bDead = b.health <= 0 || bOut;
    if (aDead || bDead || this.timer <= 0) {
      this.endRound(aDead, bDead, aOut || bOut);
    }
  }

  private endRound(aDead: boolean, bDead: boolean, ringOut = false) {
    const [a, b] = this.fighters;
    let winner: 0 | 1 | null = null;
    let reason: RoundResult["reason"] = ringOut ? "ringOut" : "ko";

    if (aDead && bDead) {
      reason = "double";
    } else if (aDead) {
      winner = 1;
    } else if (bDead) {
      winner = 0;
    } else {
      reason = "time";
      if (a.health > b.health) winner = 0;
      else if (b.health > a.health) winner = 1;
      else reason = "double";
    }

    const loser = winner === 0 ? 1 : winner === 1 ? 0 : null;
    const finishing = (reason === "ko" || reason === "ringOut") && loser !== null ? this.lastHitTaken[loser] : null;
    this.lastResult = {
      winner,
      reason,
      finishingMove: finishing?.move,
      finishingDamage: finishing?.damage,
    };
    if (winner !== null) this.fighters[winner].wins++;
    this.phase = "roundEnd";
    this.phaseFrame = 0;
    this.freeze = reason === "time" ? 0 : 12;
    this.shake = Math.max(this.shake, reason === "time" ? 2 : 9);

    for (const f of this.fighters) {
      f.releaseHold();
      f.endCombo();
    }
    if (winner !== null) {
      const loser = this.fighters[winner === 0 ? 1 : 0];
      loser.setState("ko");
      // A ring-out keeps whatever velocity actually carried them off the
      // edge, so the ragdoll keeps sailing in that direction instead of
      // snapping into the ordinary KO's small backward hop - the fall is the
      // finish, and it should still look like the fall.
      if (reason !== "ringOut") {
        loser.vy = 6;
        loser.vx = -loser.facing * 3.2;
      }
      loser.startRagdoll(1.8);
      this.pushFx({ kind: "ko", x: loser.x, y: loser.y + 60, scale: 2 });
    }

    const a0 = this.fighters[0].wins;
    const b0 = this.fighters[1].wins;
    if (a0 >= this.roundsToWin || b0 >= this.roundsToWin) {
      this.matchWinner = a0 > b0 ? 0 : b0 > a0 ? 1 : null;
    }
  }

  private stepRoundEnd() {
    for (const f of this.fighters) {
      f.update(this.other(f), false);
      f.stepRagdoll();
    }
    this.updateProjectiles();

    if (this.phaseFrame === 40 && this.lastResult?.winner !== null && this.lastResult) {
      const w = this.fighters[this.lastResult.winner!];
      if (w.state !== "ko") w.setState("win");
    }
    if (this.phaseFrame >= MATCH.roundEndDelay) {
      if (this.matchWinner !== null) {
        this.phase = "matchEnd";
        this.phaseFrame = 0;
      } else {
        this.round++;
        this.startRound();
      }
    }
  }

  other(f: Fighter): Fighter {
    return this.fighters[f.index === 0 ? 1 : 0];
  }

  pushFx(e: FxEvent) {
    this.fx.push(e);
  }

  // -------------------------------------------------------------------------
  // Pushboxes
  // -------------------------------------------------------------------------

  private separate() {
    const [a, b] = this.fighters;
    if (a.state === "grabbed" || b.state === "grabbed") return;
    const pa = a.pushbox();
    const pb = b.pushbox();
    if (!boxesOverlap(pa, pb)) return;

    const overlap = Math.min(pa.right - pb.left, pb.right - pa.left);
    if (overlap <= 0) return;
    const dir = a.x <= b.x ? -1 : 1;
    const push = Math.min(overlap / 2, COMBAT.pushSpeed);

    const aWall = Math.abs(a.x) >= this.halfWidth - a.def.stats.width - 1;
    const bWall = Math.abs(b.x) >= this.halfWidth - b.def.stats.width - 1;

    if (aWall && !bWall) {
      b.x -= dir * push * 2;
    } else if (bWall && !aWall) {
      a.x += dir * push * 2;
    } else {
      a.x += dir * push;
      b.x -= dir * push;
    }
  }

  // -------------------------------------------------------------------------
  // Strikes
  // -------------------------------------------------------------------------

  private resolveHits(attacker: Fighter, defender: Fighter) {
    if (attacker.hitstop > 0) return;
    for (const { hit, box } of attacker.activeHits()) {
      if (defender.state === "grabbed" && defender.grabbedBy === attacker) continue;
      if (defender.hasInvuln("strike")) continue;
      const hurt = defender.hurtboxes();
      if (!hurt.some((h) => boxesOverlap(box, h))) continue;

      const contact = {
        x: (Math.max(box.left, hurt[0].left) + Math.min(box.right, hurt[0].right)) / 2,
        y: (Math.max(box.bottom, hurt[0].bottom) + Math.min(box.top, hurt[0].top)) / 2,
      };
      this.applyHit(attacker, defender, hit, contact, false, attacker.move?.name);
      break;
    }
  }

  private parryActive(f: Fighter): boolean {
    const w = f.move?.parryWindow;
    return f.state === "move" && !!w && f.moveFrame >= w[0] && f.moveFrame <= w[1];
  }

  canBlock(defender: Fighter, guard: GuardHeight = "mid"): boolean {
    if (guard === "unblockable") return false;
    const guarding =
      defender.state === "block" ||
      defender.state === "blockLow" ||
      defender.state === "blockAir" ||
      defender.state === "blockstun" ||
      (defender.actionable && (defender.input.holding("S") || defender.input.holdingBack()));
    if (!guarding) return false;
    if (defender.stance === "air") return true;
    const crouching = defender.stance === "crouch" || defender.input.holdingDown();
    if (guard === "low") return crouching;
    if (guard === "overhead" || guard === "high") return !crouching;
    return true;
  }

  /**
   * How far this hit shoves the defender, as a multiplier on the move's
   * authored pushback.
   *
   * Three things feed it. The damage on the hit is the bulk of it - a 30-point
   * jab barely moves them, a 130-point finisher throws them. The weight
   * difference between the two fighters tilts it, so a knight hitting a monk
   * carries further than the other way round. Finally it decays over a combo,
   * because otherwise a long string walks both fighters into the corner and
   * the juggle ends up off the top of the screen.
   *
   * `hit.damage` is used rather than the scaled damage on purpose: it is the
   * authored weight of the blow, and the combo decay below already accounts
   * for where in the string it landed.
   */
  private knockbackScale(attacker: Fighter, defender: Fighter, hit: HitDef, comboHits: number): number {
    const fromDamage = COMBAT.knockbackBase + hit.damage * COMBAT.knockbackPerDamage;
    const clamped = Math.min(COMBAT.knockbackMax, Math.max(COMBAT.knockbackMin, fromDamage));

    const heft = (attacker.def.stats.weight || 1) / (defender.def.stats.weight || 1);
    const swing = 1 + (heft - 1) * COMBAT.knockbackWeightSwing;

    const decay = Math.max(
      COMBAT.knockbackComboFloor,
      Math.pow(COMBAT.knockbackComboDecay, Math.max(0, comboHits)),
    );

    return clamped * swing * decay;
  }

  private applyHit(
    attacker: Fighter,
    defender: Fighter,
    hit: HitDef,
    contact: { x: number; y: number },
    fromProjectile = false,
    moveName?: string,
    shot?: Projectile,
  ) {
    // A direct strike names itself from the attacker's own active move; a
    // projectile has to say so explicitly, because by the time it lands the
    // attacker is very likely doing something else entirely.
    const name = moveName ?? attacker.move?.name ?? "an attack";
    const guard = hit.guard ?? "mid";

    // Parry beats everything blockable.
    if (this.parryActive(defender) && guard !== "unblockable") {
      attacker.markConnected(hit, true);
      defender.addMeter(COMBAT.parryMeter);
      defender.hitstop = COMBAT.parryFreeze;
      attacker.hitstop = COMBAT.parryFreeze + 6;
      defender.parrySuccess = 20;
      this.freeze = 6;
      this.pushFx({ kind: "parry", x: contact.x, y: contact.y, scale: 1.2 });
      // A move that answers its own parry. Read before the switch, because
      // `startMove` replaces the move this is asking about.
      const answer = defender.move?.parryInto;
      if (answer) defender.startMove(answer, true);
      return;
    }

    const blocked = this.canBlock(defender, guard);
    attacker.markConnected(hit, blocked);

    const dirSign = attacker.x <= defender.x ? 1 : -1;
    const weight = defender.def.stats.weight || 1;
    // How much of the hit's authored pushback actually gets used. Heavy blows
    // shove; jabs tap. See `knockbackScale`.
    const kb = this.knockbackScale(attacker, defender, hit, this.combo[attacker.index]?.hits ?? 0);
    // Launches and blocked hits only take part of it - launch arcs are tuned
    // per move, and blockstun pushback is about spacing rather than weight.
    const kbLaunch = 1 + (kb - 1) * COMBAT.knockbackLaunchMix;
    const kbBlock = 1 + (kb - 1) * COMBAT.knockbackBlockMix;

    if (blocked) {
      const stun = hit.blockstun;
      defender.blockstun = stun;
      defender.setState("blockstun");
      defender.guard -= hit.guardDamage ?? Math.max(4, hit.damage * 0.5);
      const chip = hit.chip ?? 0;
      if (chip > 0) defender.health = Math.max(COMBAT.chipFloor, defender.health - chip);
      defender.vx = dirSign * (hit.pushX ?? 6) * 0.5 * kbBlock;
      attacker.vx = -dirSign * (hit.selfPushX ?? 2) * kbBlock;
      defender.addMeter(COMBAT.meterOnBlock);
      attacker.addMeter(COMBAT.meterOnBlock * 0.6);
      attacker.addResource(attacker.def.resource?.gainOnBlocked ?? 0);
      defender.addResource(defender.def.resource?.gainOnGuard ?? 0);
      attacker.hitstop = Math.max(2, (hit.hitstop ?? 6) - 2);
      defender.hitstop = Math.max(2, (hit.hitstop ?? 6) - 2);
      defender.guardShove = Math.min(
        COMBAT.guardShoveMax,
        COMBAT.guardShoveBase + hit.damage * COMBAT.guardShovePerDamage,
      );
      this.shake = Math.max(this.shake, 1.4);
      this.pushFx({ kind: "block", x: contact.x, y: contact.y, scale: 0.9 });

      if (defender.guard <= 0) {
        defender.guard = 0;
        defender.setState("guardBreak");
        defender.endCombo();
        this.pushFx({ kind: "guardBreak", x: defender.x, y: defender.y + 70, scale: 1.4 });
        this.shake = Math.max(this.shake, 6);
      }
      return;
    }

    // Armor absorbs the hit but still takes chip-ish damage.
    if (defender.armorLeft > 0 && guard !== "unblockable") {
      defender.armorLeft--;
      // The window that is actually open, not the first one authored - a move
      // with two armour phases was being read from the wrong one.
      const win = defender.move?.armor?.[defender.armorWindow] ?? defender.move?.armor?.[0];
      const armorScale = win?.damageScale ?? 0.4;
      // Arrows are worth double, because arrows are the thing this is for.
      if (win?.gainPerHit) defender.addResource(win.gainPerHit * (fromProjectile ? 2 : 1));
      defender.health = Math.max(1, defender.health - hit.damage * armorScale);
      defender.flash = 6;
      attacker.hitstop = 6;
      defender.hitstop = 4;
      this.pushFx({ kind: "spark", x: contact.x, y: contact.y, scale: 1.1 });
      return;
    }

    const counter = defender.inStartup && !fromProjectile;
    /**
     * How much of a hit's authored damage survives scaling.
     *
     * A super uses its own curve *instead of* the ordinary combo curve, not on
     * top of it. Multiplying the two was the first attempt and it was wrong in
     * a way the numbers made obvious: a six-hit super ate 0.9^n and 0.8^n at
     * once, so Lapu-Lapu's 368 authored damage came out at 125 while Wyatt
     * Earp's 240, authored as three big hits, came out at 294. Two decays
     * multiplying is not a design, it is an accident, and it punished authors
     * for writing a super as several blows rather than one.
     *
     * Taking the stronger of the two keeps the intent - a move that lands six
     * times falls off faster than a chain of six separate moves - without
     * charging twice for it.
     *
     * A direct hit counts against the move's own landed hits; a shot counts
     * against its own, because the move is usually long over by the time a
     * summoned rank reaches anybody.
     */
    const isSuper = shot ? shot.fromSuper : !!attacker.move?.tags?.includes("super");
    const comboScale = Math.max(COMBAT.minScale, defender.scaling);
    const scale = isSuper
      ? Math.min(comboScale, Math.max(COMBAT.superMinScale, Math.pow(COMBAT.superScaleStep, attacker.superHits)))
      : comboScale;
    if (isSuper) attacker.superHits++;
    const damage = Math.max(
      1,
      Math.round(
        hit.damage *
          scale *
          (counter ? COMBAT.counterDamageScale : 1) *
          attacker.dealtScale *
          defender.takenScale,
      ),
    );

    // The one thing on the roster that cheats a loss. Spent, not permanent,
    // and it leaves them on a single point of health rather than healing them.
    if (defender.health - damage <= 0 && defender.cheatDeath()) {
      defender.health = 1;
      this.banner = { text: "Pleaded the Belly", life: 90 };
      this.pushFx({ kind: "aura", x: defender.x, y: defender.y + 46, scale: 1.6, color: "#e8c46a" });
      this.shake = Math.max(this.shake, 5);
    } else {
      defender.health = Math.max(0, defender.health - damage);
    }
    this.lastHitTaken[defender.index] = { move: name, damage };
    // Only a clean hit takes armour off. Blocked and absorbed hits have both
    // already returned above, which is the point: getting your guard up is
    // what keeps your helmet on.
    if (hit.strips) this.applyStrip(defender, hit.strips, contact);
    defender.flash = 8;
    defender.releaseHold();
    defender.scaling = Math.max(COMBAT.minScale, defender.scaling * COMBAT.scaleStep);

    const stunBase = hit.hitstun + (counter ? COMBAT.counterHitstunBonus : 0);
    const juggleScale = Math.pow(COMBAT.juggleDecay, defender.juggleCount);
    defender.hitstun = Math.max(COMBAT.minHitstun, Math.round(stunBase * juggleScale));

    const hitstop = (hit.hitstop ?? 8) + (counter ? COMBAT.counterBonus : 0);
    attacker.hitstop = hitstop;
    defender.hitstop = hitstop;

    attacker.addMeter((hit.meterGain ?? COMBAT.meterOnHit) * (counter ? 1.3 : 1));
    defender.addMeter(hit.meterGainDefender ?? COMBAT.meterOnTakeHit);
    // Rage-style resources feed on the exchange itself.
    attacker.addResource(attacker.def.resource?.gainOnHit ?? 0);
    defender.addResource(defender.def.resource?.gainOnTakeHit ?? 0);

    const kd = hit.knockdown ?? "none";
    const airborne = !defender.grounded || kd === "launch" || hit.launch;

    if (kd === "wallbounce" || kd === "groundbounce") defender.bouncesLeft = 1;
    if (defender.ragdoll) {
      // Hitting a body that is already down just knocks it further along.
      defender.ragdollImpulse(dirSign * (hit.pushX ?? 5) * 0.6 * kb, -2);
    }

    if (hit.launch || kd === "launch") {
      const [lx, ly] = hit.launch ?? [3, 11];
      defender.vx = dirSign * lx * kbLaunch * (1 / weight);
      defender.vy = ly * (1 / Math.max(0.75, weight));
      defender.y = Math.max(defender.y, GROUND_Y + 1);
      defender.juggleCount++;
      defender.setState("hitstunAir");
      defender.pendingKnockdown = "soft";
    } else if (airborne) {
      // Already in the air: the shove carries much further with nothing under
      // their feet, which is what makes an air-to-air heavy feel like one.
      defender.vx = dirSign * (hit.pushX ?? 5) * 0.6 * kb * (1 / weight);
      defender.vy = Math.max(defender.vy * 0.4, 2.2);
      defender.juggleCount++;
      defender.setState("hitstunAir");
      defender.pendingKnockdown = kd === "none" ? "soft" : kd;
    } else if (kd === "sweep" || kd === "hard" || kd === "soft" || kd === "crumple") {
      defender.vx = dirSign * (hit.pushX ?? 6) * kb * (1 / weight);
      defender.knockDown(kd === "sweep" ? "soft" : kd);
      defender.hitstun = 0;
    } else {
      defender.vx = dirSign * (hit.pushX ?? 5) * kb * (1 / weight);
      defender.lastHitHeight = guard === "low" ? "low" : guard === "overhead" || guard === "high" ? "high" : "mid";
      defender.setState("hitstun");
    }

    // Corner pushback: the defender has nowhere to go, so the attacker gets
    // moved instead - and a heavy blow into the corner shoves them right back
    // out of their own pressure.
    const wall = this.halfWidth - defender.def.stats.width - 2;
    if (Math.abs(defender.x) >= wall && Math.sign(defender.x) === dirSign) {
      attacker.vx = -dirSign * (hit.pushX ?? 5) * 0.7 * kb;
    } else if (hit.selfPushX) {
      attacker.vx = -dirSign * hit.selfPushX * kb;
    }

    const banner = this.combo[attacker.index];
    const hits = (banner?.hits ?? 0) + 1;
    this.combo[attacker.index] = {
      hits,
      damage: (banner?.damage ?? 0) + damage,
      owner: attacker.index,
      life: 100,
    };
    defender.comboHits = hits;

    this.shake = Math.max(this.shake, (hit.shake ?? 1) * (2 + damage * 0.09) * (counter ? 1.4 : 1));
    this.pushFx({
      kind: hit.fx ?? "blunt",
      x: contact.x,
      y: contact.y,
      scale: 0.8 + damage * 0.02,
      angle: dirSign > 0 ? 0 : Math.PI,
      facing: dirSign,
    });
    if (counter) this.pushFx({ kind: "spark", x: contact.x, y: contact.y, scale: 1.3 });
  }

  // -------------------------------------------------------------------------
  // Throws
  // -------------------------------------------------------------------------

  private resolveThrows(attacker: Fighter, defender: Fighter) {
    const t = attacker.move?.throwDef;
    if (!t || attacker.state !== "move") return;
    if (attacker.moveFrame < t.from || attacker.moveFrame > t.to) return;
    if (attacker.holding) return;

    const inRange =
      Math.abs(defender.x - attacker.x) <= t.range &&
      (t.airOk || defender.grounded) &&
      defender.y >= (t.minY ?? -10) &&
      defender.y <= (t.maxY ?? 60);

    const throwable =
      !defender.hasInvuln("throw") &&
      defender.state !== "knockdown" &&
      defender.state !== "hitstunAir" &&
      defender.state !== "ko" &&
      !defender.holding;

    if (!inRange || !throwable) {
      if (attacker.moveFrame === t.to && t.whiff) attacker.startMove(t.whiff, true);
      return;
    }

    attacker.holding = defender;
    defender.grabbedBy = attacker;
    defender.setState("grabbed");
    defender.endCombo();
    attacker.startMove(t.success, true);
    attacker.hitstop = 6;
    defender.hitstop = 6;
    this.pushFx({ kind: "spark", x: (attacker.x + defender.x) / 2, y: attacker.y + 60, scale: 1 });
  }

  // -------------------------------------------------------------------------
  // Projectiles
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Zones
  // -------------------------------------------------------------------------

  private spawnZones(f: Fighter) {
    if (f.state !== "move" || !f.move?.zones || f.hitstop > 0) return;
    for (const spec of f.move.zones) {
      if (spec.at !== f.moveFrame) continue;
      const x = f.x + f.facing * spec.x;
      // Laying a second patch replaces the first rather than adding to it, so
      // the move cannot be stacked into a slick covering the whole stage.
      this.zones = this.zones.filter((z) => !(z.owner === f.index && z.kind === spec.kind));
      this.zones.push({
        id: ++zoneId,
        owner: f.index,
        kind: spec.kind,
        x,
        w: spec.w,
        life: spec.life,
        age: 0,
        spec,
      });
      this.pushFx({ kind: "dust", x, y: GROUND_Y + 4, scale: 2.2 });
    }
  }

  private updateZones() {
    if (!this.zones.length) return;
    for (const z of this.zones) {
      z.age++;
      z.life--;
    }
    this.zones = this.zones.filter((z) => z.life > 0);
  }

  /**
   * Works out what the ground under each fighter is worth this frame.
   *
   * Recomputed from scratch every frame rather than applied on entry and undone
   * on exit: a zone can expire underneath someone, and the version that tracked
   * transitions had to get every one of those cases right to avoid leaving a
   * fighter permanently slowed on dry sand.
   */
  private applyTerrain() {
    for (const f of this.fighters) {
      f.terrainDash = 1;
      f.terrainNoBackdash = false;
      if (!f.grounded) continue;
      for (const z of this.zones) {
        if (Math.abs(f.x - z.x) > z.w / 2) continue;
        f.terrainDash = Math.min(f.terrainDash, z.spec.dashScale ?? 1);
        if (z.spec.noBackdash) f.terrainNoBackdash = true;
        // Ground that hurts. Floored at the chip floor so a burning patch of
        // stage can never actually finish somebody - standing in a fire is
        // meant to be a reason to move, not a way to win by leaving one lit.
        const dmg = z.spec.damage ?? 0;
        if (dmg <= 0) continue;
        if (z.spec.ownerImmune && f.index === z.owner) continue;
        if (z.age % (z.spec.every ?? 30) !== 0) continue;
        if (f.health <= COMBAT.chipFloor) continue;
        f.health = Math.max(COMBAT.chipFloor, f.health - dmg);
        this.pushFx({ kind: "spark", x: f.x, y: f.y + 20, scale: 1, color: z.spec.color });
      }
    }
  }

  /**
   * Takes a piece of armour off the defender, when they have that piece to
   * lose. Whoever is not wearing it is simply not affected by this, which is
   * the intended shape: the move is a matchup, not a universal debuff.
   */
  private applyStrip(defender: Fighter, strip: StripDef, at: { x: number; y: number }) {
    const taken = defender.stripArmour(strip.slot);
    if (!taken.length) return;
    if (strip.damageTaken !== undefined) {
      defender.applyGrants(`stripped:${strip.slot}`, [{ damageTaken: strip.damageTaken }]);
    }
    this.pushFx({ kind: "strip", x: at.x, y: at.y, scale: 1.6 });
    this.shake = Math.max(this.shake, 5);
    const what = strip.slot === "head" ? "Helm" : strip.slot === "shield" ? "Shield" : "Armour";
    this.banner = { text: `${what} Struck Off`, life: 90 };
  }

  private spawnProjectiles(f: Fighter) {
    if (f.state !== "move" || !f.move?.projectiles || f.hitstop > 0) return;
    for (let i = 0; i < f.move.projectiles.length; i++) {
      const spec = f.move.projectiles[i];
      if (spec.at !== f.moveFrame) continue;
      if (f.spawned.has(i)) continue;
      f.spawned.add(i);
      this.projectiles.push({
        id: ++projId,
        owner: f.index,
        kind: spec.kind,
        x: f.x + f.facing * spec.x,
        spawnX: f.x + f.facing * spec.x,
        y: f.y + spec.y,
        vx: f.facing * spec.vx,
        vy: spec.vy,
        gravity: spec.gravity ?? 0,
        life: spec.life,
        age: 0,
        spec,
        hitsLeft: spec.hits ?? 1,
        bouncesLeft: spec.bounces ?? 0,
        facing: f.facing,
        spin: spec.spin ?? 0,
        dead: false,
        sourceMove: f.move.name,
        fromSuper: !!f.move.tags?.includes("super"),
        hitCooldown: 0,
        damageScale: 1,
        deflects: 0,
      });
      this.pushFx({ kind: "spawn", x: f.x + f.facing * spec.x, y: f.y + spec.y, scale: spec.scale ?? 1 });
    }
  }

  private updateProjectiles() {
    for (const p of this.projectiles) {
      if (p.dead) continue;
      p.age++;
      p.vy -= p.gravity;
      if (p.spec.drag) {
        p.vx *= 1 - p.spec.drag;
        p.vy *= 1 - p.spec.drag;
      }
      // A returning shot reverses once, then flies home and is caught. The
      // owner's current position is the target rather than the launch point:
      // he has usually moved, and a shield that comes back to where he was
      // standing looks like a bug.
      if (p.spec.returnAfter !== undefined && p.age === p.spec.returnAfter) {
        p.vx = -p.vx;
        p.facing = -p.facing as 1 | -1;
        // Coming back it may hurt again, so the cooldown is cleared and the
        // hit budget topped up by one - the catch is what ends it, not a
        // hit count that ran out on the way out.
        p.hitCooldown = 0;
        p.hitsLeft = Math.max(p.hitsLeft, 1);
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.spec.returnAfter !== undefined && p.age > p.spec.returnAfter) {
        const owner = this.fighters[p.owner];
        if (Math.abs(p.x - owner.x) < 34) {
          this.killProjectile(p, false);
          this.pushFx({ kind: "spark", x: p.x, y: p.y, scale: 0.7 });
          continue;
        }
      }

      // Thrown objects skip off the ground before they come to rest.
      if (p.spec.bounce && p.bouncesLeft > 0 && p.y <= GROUND_Y + 4 && p.vy < 0) {
        p.bouncesLeft--;
        p.y = GROUND_Y + 4;
        p.vy = -p.vy * p.spec.bounce;
        p.vx *= 0.72;
        this.pushFx({ kind: "dust", x: p.x, y: GROUND_Y + 2, scale: 0.7 });
      }

      if (p.spec.trail && p.age % 2 === 0) {
        this.pushFx({ kind: "trail", x: p.x, y: p.y, color: p.spec.trail, scale: p.spec.scale ?? 1 });
      }

      const grounded = p.y <= GROUND_Y + 2 && p.gravity > 0 && p.bouncesLeft <= 0;
      const expired = p.age >= p.life || Math.abs(p.x) > this.halfWidth + 60;

      if (this.roundActive) {
        const target = this.fighters[p.owner === 0 ? 1 : 0];
        const box = toWorldBox(p.spec.box, p.x, p.y, p.facing);
        // A shield up in the way is asked before anything else. It changes
        // hands, so everything below this line - who it can hurt, which way
        // it is flying - has already been decided differently.
        if (this.tryDeflect(p, target, box)) continue;
        // A shot that has not travelled far enough yet passes straight
        // through. It is not destroyed and it is not blocked - as far as
        // anyone standing this close is concerned, it simply is not a weapon
        // yet. See `armAfter`.
        if (p.hitCooldown > 0) p.hitCooldown--;
        if (p.hitCooldown <= 0 && projectileArmed(p) && !target.hasInvuln("projectile") && !target.hasInvuln("strike")) {
          const hurt = target.hurtboxes();
          if (hurt.some((h) => boxesOverlap(box, h))) {
            const hitDef: HitDef = {
              from: 0,
              to: 0,
              box: p.spec.box,
              damage: Math.round(p.spec.damage * p.damageScale),
              hitstun: p.spec.hitstun,
              blockstun: p.spec.blockstun,
              guard: p.spec.guard,
              knockdown: p.spec.knockdown,
              chip: p.spec.chip === undefined ? undefined : Math.round(p.spec.chip * p.damageScale),
              pushX: p.spec.pushX,
              hitstop: p.spec.hitstop,
              fx: p.spec.fx,
              meterGain: p.spec.meterGain,
            };
            const owner = this.fighters[p.owner];
            this.applyHit(owner, target, hitDef, { x: p.x, y: p.y }, true, p.sourceMove, p);
            p.hitCooldown = COMBAT.projectileRehit;
            p.hitsLeft--;
            if (p.hitsLeft <= 0) this.killProjectile(p, false);
          }
        }
      }

      // Projectile clashes.
      if (p.spec.clashes && !p.dead) {
        for (const q of this.projectiles) {
          if (q.dead || q.owner === p.owner || !q.spec.clashes) continue;
          const bp = toWorldBox(p.spec.box, p.x, p.y, p.facing);
          const bq = toWorldBox(q.spec.box, q.x, q.y, q.facing);
          if (boxesOverlap(bp, bq)) {
            this.killProjectile(p, false);
            this.killProjectile(q, false);
            this.pushFx({ kind: "spark", x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, scale: 1.4 });
          }
        }
      }

      if (!p.dead && (expired || grounded)) this.killProjectile(p, true);
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  /**
   * Hand a shot back to the fighter it was aimed at.
   *
   * Deliberately not gated on the shot having armed. A pilum thrown into a
   * raised scutum from two feet away is the clearest case there is of a
   * deflect, and it costs the thrower nothing extra, because the shot re-arms
   * from where it turned - it has the whole way back to travel before it can
   * hurt anyone again.
   */
  private tryDeflect(p: Projectile, target: Fighter, box: WorldBox): boolean {
    if (p.spec.deflectable === false || p.deflects >= COMBAT.maxDeflects) return false;
    const w = target.move?.deflect;
    if (!w || target.state !== "move") return false;
    if (target.moveFrame < w.from || target.moveFrame > w.to) return false;

    const surface: Box | undefined = w.box;
    const caught = surface
      ? boxesOverlap(box, toWorldBox(surface, target.x, target.y, target.facing))
      : target.hurtboxes().some((h) => boxesOverlap(box, h));
    if (!caught) return false;

    p.owner = target.index;
    p.deflects++;
    p.vx = -p.vx * (w.speed ?? 1);
    // Whatever arc it had is flattened out. A javelin knocked off a shield
    // goes back roughly level; keeping its fall makes it plough into the
    // floor two paces away and read as a fizzle rather than an answer.
    p.vy *= 0.3;
    p.facing = -p.facing as 1 | -1;
    p.spin = -p.spin;
    p.spawnX = p.x;
    p.age = 0;
    p.hitCooldown = 0;
    p.hitsLeft = Math.max(p.hitsLeft, 1);
    p.damageScale *= w.damage ?? 1;
    // Attributed to the deflect from here on, so the kill card names the
    // shield rather than the javelin the other man threw.
    p.sourceMove = target.move!.name;
    p.fromSuper = false;
    target.addMeter(w.meterGain ?? COMBAT.parryMeter);
    this.pushFx({ kind: "parry", x: p.x, y: p.y, scale: 1.2 });
    this.pushFx({ kind: "spark", x: p.x, y: p.y, scale: 1.3 });
    return true;
  }

  private killProjectile(p: Projectile, natural: boolean) {
    if (p.dead) return;
    p.dead = true;
    const det = p.spec.detonate;
    if (!det) {
      this.pushFx({ kind: p.spec.fx ?? "spark", x: p.x, y: Math.max(p.y, GROUND_Y + 4), scale: 0.8 });
      return;
    }
    if (!natural && p.hitsLeft > 0) return;

    this.pushFx({ kind: "explode", x: p.x, y: Math.max(p.y, GROUND_Y + 10), scale: det.radius / 40 });
    this.shake = Math.max(this.shake, 7);
    const owner = this.fighters[p.owner];
    const target = this.fighters[p.owner === 0 ? 1 : 0];
    const dist = Math.hypot(target.x - p.x, target.y + 40 - p.y);
    if (dist <= det.radius && this.roundActive && !target.hasInvuln("strike")) {
      const hitDef: HitDef = {
        from: 0,
        to: 0,
        box: { x: -det.radius, y: 0, w: det.radius * 2, h: det.radius * 2 },
        damage: det.damage,
        hitstun: det.hitstun,
        blockstun: det.blockstun,
        guard: det.guard ?? "mid",
        knockdown: det.knockdown ?? "hard",
        chip: det.chip,
        pushX: 8,
        launch: det.knockdown === "launch" ? [4, 12] : undefined,
        fx: "explode",
        hitstop: 10,
        shake: 2,
      };
      const dir = target.x >= p.x ? 1 : -1;
      const saved = owner.x;
      owner.x = p.x - dir * 10;
      this.applyHit(owner, target, hitDef, { x: target.x, y: target.y + 40 }, true, p.sourceMove, p);
      owner.x = saved;
    }
  }

  // -------------------------------------------------------------------------
  // Ambient effects
  // -------------------------------------------------------------------------

  private emitMovementFx() {
    for (const f of this.fighters) {
      if (f.hitstop > 0) continue;
      if ((f.state === "dash" || f.state === "backdash") && f.stateFrame % 4 === 1) {
        this.pushFx({ kind: "dust", x: f.x - f.facing * 12, y: GROUND_Y + 2, scale: 0.8 });
      }
      if (f.state === "land" && f.stateFrame === 1) {
        this.pushFx({ kind: "dust", x: f.x, y: GROUND_Y + 2, scale: 1.1 });
      }
      if (f.state === "knockdown" && f.stateFrame === 1) {
        this.pushFx({ kind: "dust", x: f.x, y: GROUND_Y + 4, scale: 1.6 });
        this.shake = Math.max(this.shake, 4);
      }
      if (f.state === "move" && f.move?.vfx) {
        for (const v of f.move.vfx) {
          if (v.at !== f.moveFrame) continue;
          this.pushFx({
            kind: v.kind as FxEvent["kind"],
            x: f.x + f.facing * v.x,
            y: f.y + v.y,
            scale: v.scale ?? 1,
            color: v.color,
            facing: f.facing,
          });
        }
      }
      if (f.state === "move" && f.move?.superFreeze && f.moveFrame === 1) {
        this.freeze = f.move.superFreeze;
        this.pushFx({ kind: "super", x: f.x, y: f.y + 50, scale: 2, color: f.def.palette.aura });
        this.shake = Math.max(this.shake, 5);
      }
    }
  }

  /**
   * Where the camera should look.
   *
   * `y` and `vspread` only matter on a stage with platforms - an arena keeps
   * both fighters within a few units of the floor for the whole match, so
   * they stay at zero and nothing about how the camera used to behave changes
   * for the 25 stages that are not built out of storeys. On one that is, a
   * fighter three storeys up is exactly the situation "zoom out" has to
   * answer: `vspread` is what lets the renderer treat height apart the same
   * way it already treats distance apart, and `y` is what lets it pan up to
   * follow them there instead of always centring on the ground.
   */
  cameraFocus(): { x: number; y: number; spread: number; vspread: number } {
    const [a, b] = this.fighters;
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      spread: Math.abs(a.x - b.x),
      vspread: Math.abs(a.y - b.y),
    };
  }
}

export type { WorldBox };

/**
 * A single fighter: movement, state machine, move selection and reactions.
 *
 * The runtime holds no rendering state at all - `pose()` returns joint angles
 * that the renderer turns into a stickman.
 */

import { clipFor } from "../clips";
import { COMBAT, GROUND_Y, HURTBOX, STAGE_HALF_WIDTH } from "../constants";
import { buildSkeleton, sampleClip, sampleFrames } from "../skeleton";
import { PHYSICS, Ragdoll } from "./physics";
import type {
  Box,
  ClipName,
  Facing,
  FighterDef,
  HitDef,
  InvulnKind,
  MoveDef,
  Pose,
  Stance,
} from "../types";
import { InputBuffer, type RawInput } from "./input";

export type StateName =
  | "intro"
  | "idle"
  | "walkF"
  | "walkB"
  | "crouch"
  | "jumpSquat"
  | "air"
  | "land"
  | "dash"
  | "backdash"
  | "block"
  | "blockLow"
  | "blockAir"
  | "parry"
  | "hitstun"
  | "hitstunAir"
  | "blockstun"
  | "knockdown"
  | "wakeup"
  | "grabbed"
  | "move"
  | "guardBreak"
  | "ko"
  | "win";

export interface WorldBox extends Box {
  /** World-space left edge. */
  left: number;
  right: number;
  bottom: number;
  top: number;
}

export function toWorldBox(box: Box, x: number, y: number, facing: Facing): WorldBox {
  const left = facing === 1 ? x + box.x : x - box.x - box.w;
  return {
    ...box,
    left,
    right: left + box.w,
    bottom: y + box.y,
    top: y + box.y + box.h,
  };
}

export function boxesOverlap(a: WorldBox, b: WorldBox): boolean {
  return a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;
}

export interface HitResult {
  blocked: boolean;
  counter: boolean;
  damage: number;
}

let uid = 0;

export class Fighter {
  readonly id = ++uid;
  readonly def: FighterDef;
  readonly index: 0 | 1;
  readonly input = new InputBuffer();

  x = 0;
  y = GROUND_Y;
  vx = 0;
  vy = 0;
  facing: Facing = 1;

  health: number;
  meter = 0;
  guard = COMBAT.maxGuard;
  resource: number;

  state: StateName = "idle";
  stateFrame = 0;
  move: MoveDef | null = null;
  moveFrame = 0;

  hitstop = 0;
  hitstun = 0;
  blockstun = 0;
  /**
   * Frames spent continuously guarding. The guard clips run off this instead
   * of `stateFrame`, because taking a blocked hit means `setState("blockstun")`
   * and that zeroes `stateFrame` - which used to drop the guard and re-raise it
   * between every hit of a blockstring.
   */
  guardHold = 0;
  /**
   * Frames since the guard was last up. Blockstun ends by dropping to `idle`
   * for a frame before the guard check runs again, so the hold survives a
   * short gap - otherwise the arms flicker back down between blocked hits.
   */
  private guardGap = 0;
  /** Recoil from the last blocked hit, 0..1.5, decaying back to 0. */
  guardShove = 0;
  /** Frames left before a knocked-down fighter can get up. */
  downTimer = 0;

  comboHits = 0;
  comboDamage = 0;
  juggleCount = 0;
  /** Damage scaling applied to the *opponent's* current combo on this fighter. */
  scaling = 1;

  airJumpsUsed = 0;
  airDashUsed = false;
  airMovesUsed = 0;

  /** Hit groups from the current move that already connected. */
  private connected = new Set<number>();
  moveHasHit = false;
  moveHasBlocked = false;
  private cancelled = false;
  armorLeft = 0;
  private armorWindow = -1;

  /** Set while this fighter is held by the opponent's throw. */
  grabbedBy: Fighter | null = null;
  /** Set while this fighter is holding the opponent. */
  holding: Fighter | null = null;

  parrySuccess = 0;
  wins = 0;
  /** Physics body that takes over the pose while down or knocked out. */
  ragdoll: Ragdoll | null = null;
  /** Bounces left for the current launch (wall/ground splats). */
  bouncesLeft = 0;
  /** Frames of "just got hit" flash, used by the renderer. */
  flash = 0;
  /** Counter-hit state: true whenever this fighter is in attack startup. */
  private lastFacingChange = 0;

  constructor(def: FighterDef, index: 0 | 1) {
    this.def = def;
    this.index = index;
    this.health = def.stats.health;
    this.resource = def.resource?.start ?? 0;
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  get grounded(): boolean {
    return this.y <= GROUND_Y + 0.001;
  }

  get stance(): Stance {
    if (!this.grounded) return "air";
    if (this.state === "crouch" || this.state === "blockLow") return "crouch";
    if (this.move && this.isCrouchMove(this.move)) return "crouch";
    return "stand";
  }

  private isCrouchMove(move: MoveDef): boolean {
    const s = move.input.stance;
    return Array.isArray(s) ? s.includes("crouch") && !s.includes("stand") : s === "crouch";
  }

  get alive(): boolean {
    return this.health > 0;
  }

  get busy(): boolean {
    return (
      this.state === "move" ||
      this.state === "hitstun" ||
      this.state === "hitstunAir" ||
      this.state === "blockstun" ||
      this.state === "knockdown" ||
      this.state === "wakeup" ||
      this.state === "grabbed" ||
      this.state === "guardBreak" ||
      this.state === "ko" ||
      this.state === "win" ||
      this.state === "intro"
    );
  }

  /** Holding a guard, or being shoved back inside one. */
  guarding(): boolean {
    return (
      this.state === "block" ||
      this.state === "blockLow" ||
      this.state === "blockAir" ||
      this.state === "blockstun"
    );
  }

  /** Can this fighter act right now (start a move, walk, jump)? */
  get actionable(): boolean {
    if (this.hitstop > 0) return false;
    switch (this.state) {
      case "idle":
      case "walkF":
      case "walkB":
      case "crouch":
      case "block":
      case "blockLow":
      case "blockAir":
      case "air":
      case "dash":
        return true;
      case "land":
        return this.stateFrame >= COMBAT.landRecovery;
      default:
        return false;
    }
  }

  hurtboxes(): WorldBox[] {
    if (this.state === "knockdown" || this.state === "ko") return [];
    const base = this.move?.hurtbox
      ? this.move.hurtbox
      : this.stance === "crouch"
        ? HURTBOX.crouch
        : this.stance === "air"
          ? HURTBOX.air
          : HURTBOX.stand;
    return [toWorldBox(base, this.x, this.y, this.facing)];
  }

  pushbox(): WorldBox {
    const w = this.def.stats.width;
    const h = this.stance === "crouch" ? this.def.stats.crouchHeight : this.def.stats.standHeight;
    return toWorldBox({ x: -w, y: 0, w: w * 2, h }, this.x, this.y, this.facing);
  }

  activeHits(): { hit: HitDef; box: WorldBox }[] {
    if (this.state !== "move" || !this.move?.hits) return [];
    const out: { hit: HitDef; box: WorldBox }[] = [];
    for (const hit of this.move.hits) {
      if (this.moveFrame < hit.from || this.moveFrame > hit.to) continue;
      if (this.connected.has(hit.group ?? 0)) continue;
      out.push({ hit, box: toWorldBox(hit.box, this.x, this.y, this.facing) });
    }
    return out;
  }

  hasInvuln(kind: InvulnKind): boolean {
    if (this.state === "knockdown") return true;
    if (this.state !== "move" || !this.move?.invuln) return false;
    return this.move.invuln.some(
      (w) =>
        this.moveFrame >= w.from &&
        this.moveFrame <= w.to &&
        (w.kind === "full" ||
          w.kind === kind ||
          (kind === "strike" && w.kind === "strike") ||
          (kind === "throw" && w.kind === "throw")),
    );
  }

  /** True during attack startup - used for counter-hit detection. */
  get inStartup(): boolean {
    if (this.state !== "move" || !this.move) return false;
    const first = this.move.hits?.[0]?.from ?? this.move.throwDef?.from;
    return first !== undefined && this.moveFrame < first;
  }

  // -------------------------------------------------------------------------
  // State transitions
  // -------------------------------------------------------------------------

  setState(state: StateName) {
    if (this.state === state) return;
    if (state !== "knockdown" && state !== "ko" && state !== "wakeup") this.ragdoll = null;
    this.state = state;
    this.stateFrame = 0;
    if (state !== "move") {
      this.move = null;
      this.moveFrame = 0;
      this.connected.clear();
      this.moveHasHit = false;
      this.moveHasBlocked = false;
      this.armorLeft = 0;
      this.armorWindow = -1;
    }
  }

  findMove(id: string): MoveDef | undefined {
    return this.def.moves.find((m) => m.id === id);
  }

  startMove(move: MoveDef | string, keepMomentum = false): boolean {
    const def = typeof move === "string" ? this.findMove(move) : move;
    if (!def) return false;
    if (def.meterCost && this.meter < def.meterCost) return false;
    if (def.resourceMin !== undefined && this.resource < def.resourceMin) return false;
    if (def.resourceCost && this.resource < def.resourceCost) return false;

    if (def.meterCost) this.meter -= def.meterCost;
    if (def.resourceCost) this.resource = Math.max(0, this.resource - def.resourceCost);

    this.state = "move";
    this.stateFrame = 0;
    this.move = def;
    this.moveFrame = 0;
    this.connected.clear();
    this.moveHasHit = false;
    this.moveHasBlocked = false;
    this.cancelled = false;
    this.armorLeft = 0;
    this.armorWindow = -1;
    if (!keepMomentum && this.grounded) {
      this.vx = 0;
    }
    return true;
  }

  markConnected(hit: HitDef, blocked: boolean) {
    this.connected.add(hit.group ?? 0);
    if (blocked) this.moveHasBlocked = true;
    else this.moveHasHit = true;
  }

  faceOpponent(other: Fighter, force = false) {
    if (!force) {
      if (this.move?.noTurn) return;
      if (this.state === "move" || this.state === "hitstun" || this.state === "hitstunAir") return;
      if (this.state === "knockdown" || this.state === "grabbed") return;
    }
    const want: Facing = other.x >= this.x ? 1 : -1;
    if (want !== this.facing && this.stateFrame - this.lastFacingChange > 2) {
      this.facing = want;
      this.lastFacingChange = this.stateFrame;
    }
  }

  // -------------------------------------------------------------------------
  // Per-frame update
  // -------------------------------------------------------------------------

  pushInput(raw: RawInput) {
    this.input.push(raw, this.facing);
  }

  update(opponent: Fighter, roundActive: boolean) {
    if (this.flash > 0) this.flash--;
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }

    this.stateFrame++;
    if (this.guarding()) {
      this.guardHold++;
      this.guardGap = 0;
    } else if (++this.guardGap > COMBAT.guardHoldGrace) {
      this.guardHold = 0;
    }
    if (this.guardShove > 0) this.guardShove = Math.max(0, this.guardShove - COMBAT.guardShoveDecay);
    this.regenResource();
    if (this.guard < COMBAT.maxGuard) this.guard = Math.min(COMBAT.maxGuard, this.guard + COMBAT.guardRegen);

    if (this.state === "grabbed") {
      this.updateGrabbed();
      return;
    }

    if (roundActive && this.state !== "ko" && this.state !== "win" && this.state !== "intro") {
      this.handleState(opponent);
    }

    this.integrate();
  }

  private regenResource() {
    const r = this.def.resource;
    if (!r?.regen) return;
    if (r.regenIdleOnly && (this.state === "move" || !this.grounded)) return;
    this.resource = Math.min(r.max, this.resource + r.regen);
  }

  private handleState(opponent: Fighter) {
    switch (this.state) {
      case "hitstun":
      case "hitstunAir":
        this.hitstun--;
        if (this.hitstun <= 0) {
          if (this.grounded) {
            this.endCombo();
            this.setState("idle");
          } else if (this.state === "hitstun") {
            this.setState("air");
          }
        }
        if (this.state === "hitstunAir" && this.grounded && this.vy <= 0) {
          this.knockDown(this.hitstun > 0 ? "hard" : "soft");
        }
        return;

      case "blockstun":
        this.blockstun--;
        if (this.blockstun <= 0) this.setState(this.input.holdingDown() ? "crouch" : "idle");
        return;

      case "guardBreak":
        if (this.stateFrame >= COMBAT.guardBreakStun) {
          this.guard = COMBAT.maxGuard;
          this.setState("idle");
        }
        return;

      case "knockdown":
        this.downTimer--;
        if (this.downTimer <= 0) this.setState("wakeup");
        return;

      case "wakeup":
        // The physics body is dropped the moment they start getting up.
        this.ragdoll = null;
        if (this.stateFrame >= COMBAT.wakeupFrames) {
          this.endCombo();
          this.setState("idle");
        }
        return;

      case "move":
        this.updateMove(opponent);
        return;

      case "jumpSquat":
        if (this.stateFrame >= COMBAT.jumpSquat) this.launchJump();
        return;

      case "dash":
        this.updateDash(opponent);
        return;

      case "backdash":
        if (this.stateFrame >= this.def.stats.backdashFrames) {
          this.vx = 0;
          this.setState("idle");
        }
        return;

      case "land":
        if (this.stateFrame >= COMBAT.landRecovery) this.setState("idle");
        else return;
        break;
    }

    // Free states: read the stick.
    if (!this.grounded) {
      this.updateAir(opponent);
      return;
    }
    this.updateGround(opponent);
  }

  private updateGround(opponent: Fighter) {
    if (this.tryMove(opponent)) return;

    const s = this.def.stats;
    const holdingBack = this.input.holdingBack();
    const holdingDown = this.input.holdingDown();

    // Dashes.
    if (this.input.hasMotion("ff") && this.state !== "dash") {
      this.input.consumeDash();
      this.setState("dash");
      this.vx = this.facing * s.dashSpeed;
      return;
    }
    if (this.input.hasMotion("bb")) {
      this.input.consumeDash();
      this.setState("backdash");
      this.vx = -this.facing * s.dashSpeed * 0.85;
      this.y = GROUND_Y + 0.5;
      this.vy = 3.4;
      return;
    }

    if (this.input.holdingUp()) {
      this.setState("jumpSquat");
      return;
    }

    // Guard is explicit (hold S) or classic (hold back while threatened).
    const guarding = this.input.holding("S");
    if (holdingDown) {
      const guardLow = guarding || (this.threatened(opponent) && holdingBack);
      this.setState(guardLow ? "blockLow" : "crouch");
      this.vx *= COMBAT.friction;
      return;
    }

    if (guarding || (holdingBack && this.threatened(opponent))) {
      this.setState("block");
      if (holdingBack) this.accelerate(-this.facing * s.walkB);
      else this.vx *= PHYSICS.groundDrag;
      return;
    }

    // Walking accelerates towards its target instead of snapping to it, so
    // fighters carry a little momentum in and out of every step.
    if (this.input.holdingForward()) {
      this.setState("walkF");
      this.accelerate(this.facing * s.walkF);
    } else if (holdingBack) {
      this.setState("walkB");
      this.accelerate(-this.facing * s.walkB);
    } else {
      this.setState("idle");
      this.vx *= PHYSICS.groundDrag;
      if (Math.abs(this.vx) < 0.12) this.vx = 0;
    }
  }

  /**
   * Blocking only engages when something is actually coming, which keeps
   * walking backwards readable but still gives instant guard when needed.
   */
  private threatened(opponent: Fighter): boolean {
    if (opponent.state === "move" && opponent.move) {
      const dist = Math.abs(opponent.x - this.x);
      if (dist < 320) return true;
    }
    return false;
  }

  private updateAir(opponent: Fighter) {
    if (this.tryMove(opponent)) return;
    const s = this.def.stats;

    if (this.input.holding("S") || (this.input.holdingBack() && this.threatened(opponent))) {
      this.setState("blockAir");
    } else if (this.state !== "air") {
      this.setState("air");
    }

    // Double jump / air dash.
    if (s.doubleJump && this.airJumpsUsed < 1 && this.input.holdingUp() && this.vy < 2 && this.stateFrame > 6) {
      this.airJumpsUsed++;
      this.vy = s.jumpVel * 0.92;
      const dir = this.input.holdingForward() ? 1 : this.input.holdingBack() ? -1 : 0;
      this.vx = this.facing * dir * s.jumpFwd;
      this.stateFrame = 0;
    }

    // Air control.
    const drift = this.input.holdingForward() ? 0.12 : this.input.holdingBack() ? -0.12 : 0;
    this.vx += this.facing * drift;
    const maxAir = s.jumpFwd * 1.15;
    this.vx = Math.max(-maxAir, Math.min(maxAir, this.vx));
    if (this.input.holdingDown() && this.vy < 0) this.vy -= COMBAT.fastFall * 0.4;
  }

  private updateDash(opponent: Fighter) {
    if (this.tryMove(opponent)) return;
    const s = this.def.stats;
    if (this.input.holdingUp()) {
      this.setState("jumpSquat");
      return;
    }
    if (this.stateFrame >= s.dashFrames && !this.input.holdingForward()) {
      this.vx = 0;
      this.setState("idle");
      return;
    }
    // Running: holding forward keeps the dash alive.
    this.accelerate(this.facing * s.dashSpeed, PHYSICS.walkAccel * 3);
    if (this.stateFrame > s.dashFrames * 3) this.accelerate(this.facing * s.dashSpeed * 0.9);
  }

  private launchJump() {
    const s = this.def.stats;
    this.vy = s.jumpVel;
    const dir = this.input.holdingForward() ? 1 : this.input.holdingBack() ? -1 : 0;
    this.vx = this.facing * dir * s.jumpFwd;
    this.y = GROUND_Y + 0.5;
    this.airJumpsUsed = 0;
    this.airDashUsed = false;
    this.airMovesUsed = 0;
    this.setState("air");
  }

  private updateMove(opponent: Fighter) {
    const move = this.move!;
    this.moveFrame++;

    if (move.vel) {
      for (const v of move.vel) {
        if (v.at !== this.moveFrame) continue;
        if (v.mode === "add") {
          if (v.x !== undefined) this.vx += this.facing * v.x;
          if (v.y !== undefined) this.vy += v.y;
        } else {
          if (v.x !== undefined) this.vx = this.facing * v.x;
          if (v.y !== undefined) this.vy = v.y;
        }
      }
    }

    if (move.armor) {
      const index = move.armor.findIndex((a) => this.moveFrame >= a.from && this.moveFrame <= a.to);
      if (index === -1) {
        this.armorLeft = 0;
        this.armorWindow = -1;
      } else if (index !== this.armorWindow) {
        // Entering a window stocks it once; hits absorbed during it are spent.
        this.armorWindow = index;
        this.armorLeft = move.armor[index].hits;
      }
    }

    if (move.friction !== undefined && this.grounded) this.vx *= move.friction;

    // Held stances (Roman shield wall, western quickdraw crouch...).
    if (move.holdLoop) {
      const h = move.holdLoop;
      if (this.moveFrame > h.to) {
        const held = this.input.holding(h.button);
        const maxed = h.maxFrames !== undefined && this.stateFrame > h.maxFrames;
        if (held && !maxed) {
          this.moveFrame = h.from;
        } else if (move.holdRelease) {
          this.startMove(move.holdRelease, true);
          return;
        }
      }
    }

    // Button follow-ups (rekkas, gun chains).
    if (move.followUps) {
      for (const f of move.followUps) {
        if (this.moveFrame < f.from || this.moveFrame > f.to) continue;
        if (!this.input.pressedWithin(f.button, 6)) continue;
        const next = this.findMove(f.move);
        if (!next) continue;
        if (next.resourceMin !== undefined && this.resource < next.resourceMin) continue;
        this.input.consume(f.button);
        this.startMove(next, true);
        return;
      }
    }

    // Cancels into other moves once the attack has connected.
    if ((this.moveHasHit || (this.moveHasBlocked && move.cancelOnBlock)) && move.cancelInto?.length) {
      const w = move.cancelWindow;
      if (!w || (this.moveFrame >= w[0] && this.moveFrame <= w[1])) {
        if (this.tryMove(opponent, move.cancelInto)) return;
      }
    }

    if (move.throwPayload && this.holding) {
      this.applyThrowPayload(move, this.holding);
    }

    const landed = move.landCancel && this.grounded && this.moveFrame > 2;
    if (this.moveFrame >= move.duration || landed) {
      if (move.resourceGain) {
        this.resource = Math.min(this.def.resource?.max ?? 0, this.resource + move.resourceGain);
      }
      if (move.meterGain) this.addMeter(move.meterGain);
      else if (move.hits?.length && !this.moveHasHit && !this.moveHasBlocked) {
        // A whiffed swing still builds a trickle of meter.
        this.addMeter(COMBAT.meterOnWhiff);
      }
      if (this.holding) this.releaseHold();
      if (landed) {
        this.vx *= 0.4;
        this.setState("land");
        this.stateFrame = Math.max(0, COMBAT.landRecovery - (move.landRecovery ?? COMBAT.landRecovery));
      } else if (!this.grounded) {
        this.setState("air");
      } else {
        this.setState("idle");
      }
    }
  }

  private applyThrowPayload(move: MoveDef, victim: Fighter) {
    const p = move.throwPayload!;
    for (const tick of p.ticks ?? []) {
      if (tick.at === this.moveFrame) {
        victim.health = Math.max(0, victim.health - tick.damage);
        victim.flash = 6;
        this.hitstop = 4;
        victim.hitstop = 4;
      }
    }
    if (this.moveFrame === p.at) {
      victim.health = Math.max(0, victim.health - p.damage);
      victim.flash = 10;
      victim.grabbedBy = null;
      this.holding = null;
      // Throws read the weight difference directly: a knight hurls a monk
      // across the arena, and the monk barely shifts the knight.
      const heft = (this.def.stats.weight || 1) / (victim.def.stats.weight || 1);
      const swing = 1 + (heft - 1) * COMBAT.knockbackWeightSwing;
      victim.vx = this.facing * p.launch[0] * swing;
      victim.vy = p.launch[1] * (1 + (swing - 1) * 0.4);
      victim.y = Math.max(victim.y, GROUND_Y + 1);
      victim.hitstun = 30;
      victim.setState("hitstunAir");
      victim.pendingKnockdown = p.knockdown ?? "hard";
      this.hitstop = p.hitstop ?? 8;
      victim.hitstop = p.hitstop ?? 8;
      this.meter = Math.min(COMBAT.maxMeter, this.meter + 10);
    }
  }

  pendingKnockdown: "none" | "soft" | "hard" | "launch" | "wallbounce" | "groundbounce" | "sweep" | "crumple" =
    "none";

  private updateGrabbed() {
    const holder = this.grabbedBy;
    if (!holder) {
      this.setState("idle");
      return;
    }
    const off = holder.move?.grabOffset ?? [34, 0];
    this.x = holder.x + holder.facing * off[0];
    this.y = Math.max(GROUND_Y, holder.y + off[1]);
    this.facing = (holder.facing === 1 ? -1 : 1) as Facing;
    this.vx = 0;
    this.vy = 0;
  }

  releaseHold() {
    if (this.holding) {
      this.holding.grabbedBy = null;
      if (this.holding.state === "grabbed") this.holding.setState("idle");
      this.holding = null;
    }
  }

  /** Moves `vx` towards `target` at a fixed acceleration. */
  private accelerate(target: number, accel = PHYSICS.walkAccel) {
    const diff = target - this.vx;
    if (Math.abs(diff) <= accel) this.vx = target;
    else this.vx += Math.sign(diff) * accel;
  }

  private integrate() {
    const s = this.def.stats;
    const airborne = !this.grounded || this.vy > 0;

    if (airborne) {
      const holdingDown = this.input.holdingDown();
      this.vy -= s.gravity * (holdingDown && this.state === "air" ? 1 + COMBAT.fastFall : 1);
      this.vx *= PHYSICS.airDrag;
      if (this.vy < -PHYSICS.terminalVelocity) this.vy = -PHYSICS.terminalVelocity;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.y <= GROUND_Y) {
      const impact = this.vy;
      this.y = GROUND_Y;
      this.vy = 0;
      // A hard enough launch skips off the floor before it settles.
      if (
        this.bouncesLeft > 0 &&
        impact < -PHYSICS.bounceThreshold &&
        (this.state === "hitstunAir" || this.pendingKnockdown === "groundbounce")
      ) {
        this.bouncesLeft--;
        this.vy = -impact * PHYSICS.groundRestitution;
        this.vx *= 0.7;
        this.y = GROUND_Y + 0.5;
        this.bounced = "ground";
      } else if (impact < 0) {
        this.onLand();
      }
    }

    const limit = STAGE_HALF_WIDTH - s.width;
    for (const side of [-1, 1] as const) {
      const wall = side * limit;
      if (side < 0 ? this.x < wall : this.x > wall) {
        this.x = wall;
        const into = side < 0 ? this.vx < 0 : this.vx > 0;
        if (!into) continue;
        // Getting slammed into the corner bounces you back out of it.
        if (this.bouncesLeft > 0 && Math.abs(this.vx) > PHYSICS.bounceThreshold && this.state === "hitstunAir") {
          this.bouncesLeft--;
          this.vx = -this.vx * PHYSICS.wallRestitution;
          this.vy = Math.max(this.vy, 4);
          this.bounced = "wall";
        } else {
          this.vx = 0;
        }
      }
    }
  }

  /** Set for one frame when a bounce happens, so the match can spawn effects. */
  bounced: "none" | "ground" | "wall" = "none";

  private onLand() {
    this.airJumpsUsed = 0;
    this.airDashUsed = false;
    this.airMovesUsed = 0;

    if (this.state === "hitstunAir" || this.pendingKnockdown !== "none") {
      this.knockDown(this.pendingKnockdown === "none" ? "soft" : this.pendingKnockdown);
      return;
    }
    if (this.state === "move") {
      if (this.move?.landCancel) return;
      if (this.move?.airborne) {
        this.setState("land");
      }
      return;
    }
    if (this.state === "air" || this.state === "blockAir" || this.state === "backdash") {
      this.vx *= PHYSICS.landKeep;
      this.setState("land");
    }
  }

  knockDown(kind: "none" | "soft" | "hard" | "launch" | "wallbounce" | "groundbounce" | "sweep" | "crumple") {
    this.pendingKnockdown = "none";
    this.vx *= 0.3;
    this.vy = 0;
    this.y = GROUND_Y;
    this.endCombo();
    if (kind === "none") {
      this.setState("land");
      return;
    }
    this.setState("knockdown");
    this.downTimer = kind === "hard" ? COMBAT.hardKnockdownFrames : COMBAT.softKnockdownFrames;
    this.startRagdoll(kind === "hard" ? 1.4 : 0.9);
  }

  /**
   * Hands the current pose over to a physics body. Called on knockdown and KO;
   * the ragdoll drives the visuals while the simulation keeps owning position.
   */
  startRagdoll(force = 1) {
    const { pose, grounded } = this.pose();
    const sk = buildSkeleton(pose, grounded, 1);
    this.ragdoll = new Ragdoll(
      sk,
      this.x,
      this.y,
      this.facing,
      this.vx * force,
      Math.max(this.vy, 1.5) * force,
      force,
    );
  }

  /** Advances the ragdoll, if one is active. */
  stepRagdoll() {
    if (!this.ragdoll) return;
    if (this.ragdoll.settled && this.state === "knockdown") return;
    this.ragdoll.step(this.x, this.y, this.grounded);
  }

  endCombo() {
    this.bouncesLeft = 0;
    this.comboHits = 0;
    this.comboDamage = 0;
    this.juggleCount = 0;
    this.scaling = 1;
  }

  /** Nudges an active ragdoll, e.g. a body being blown across the floor. */
  ragdollImpulse(x: number, y: number) {
    this.ragdoll?.impulse(x, y);
  }

  addMeter(amount: number) {
    this.meter = Math.min(COMBAT.maxMeter, this.meter + amount);
  }

  addResource(amount: number) {
    if (!amount || !this.def.resource) return;
    this.resource = Math.max(0, Math.min(this.def.resource.max, this.resource + amount));
  }

  // -------------------------------------------------------------------------
  // Move selection
  // -------------------------------------------------------------------------

  /**
   * Scans the moveset for the highest priority move whose input matches. When
   * `allowTags` is given (a cancel), only moves carrying one of those tags are
   * considered.
   */
  tryMove(opponent: Fighter, allowTags?: MoveDef["tags"]): boolean {
    if (this.hitstop > 0) return false;
    const stance = this.stance;
    let best: MoveDef | null = null;
    let bestScore = -1;

    for (const move of this.def.moves) {
      if (move.internal) continue;
      if (allowTags && !move.tags?.some((t) => allowTags.includes(t))) continue;
      if (!this.stanceAllows(move, stance)) continue;
      if (stance === "air" && this.airMovesUsed >= this.def.stats.airMoves && !allowTags) continue;
      if (move.meterCost && this.meter < move.meterCost) continue;
      if (move.resourceMin !== undefined && this.resource < move.resourceMin) continue;
      if (move.resourceCost && this.resource < move.resourceCost) continue;
      if (!this.inputMatches(move)) continue;

      const score = this.moveScore(move);
      if (score > bestScore) {
        best = move;
        bestScore = score;
      }
    }

    if (!best) return false;
    if (best.throwDef && opponent.hasInvuln("throw")) return false;

    for (const b of best.input.buttons ?? []) this.input.consume(b);
    if (best.input.button) this.input.consume(best.input.button);
    if (best.input.motion && best.input.motion !== "none") this.input.consumeMotion();
    if (stance === "air") this.airMovesUsed++;
    return this.startMove(best, true);
  }

  /**
   * More specific inputs win. A motion always beats a direction+button, so
   * ↓↘→ + S gives the EX special rather than the forward+S roll that shares
   * its final direction.
   */
  private moveScore(move: MoveDef): number {
    let score = move.priority ?? 0;
    if (move.input.motion && move.input.motion !== "none") score += 100;
    if (move.input.buttons?.length) score += 60;
    if (move.input.dir && move.input.dir !== "n") score += 30;
    if (move.meterCost) score += 5;
    return score;
  }

  private stanceAllows(move: MoveDef, stance: Stance): boolean {
    const s = move.input.stance;
    return Array.isArray(s) ? s.includes(stance) : s === stance;
  }

  private inputMatches(move: MoveDef): boolean {
    const inp = move.input;

    if (inp.motion && inp.motion !== "none" && !this.input.hasMotion(inp.motion)) return false;

    if (inp.buttons?.length) {
      if (!inp.buttons.every((b) => this.input.pressedWithin(b, 4))) return false;
    } else if (inp.button) {
      if (!this.input.pressedWithin(inp.button, COMBAT.bufferFrames)) return false;
    }

    if (inp.dir && inp.dir !== "n") {
      const cur = this.input.dir;
      const ok =
        cur === inp.dir ||
        (inp.dir === "f" && (cur === "df" || cur === "uf")) ||
        (inp.dir === "b" && (cur === "db" || cur === "ub")) ||
        (inp.dir === "d" && (cur === "df" || cur === "db"));
      if (!ok) return false;
    } else if (!inp.motion || inp.motion === "none") {
      // Plain normals must not eat command-normal inputs; handled by scoring.
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // Pose
  // -------------------------------------------------------------------------

  /** Current animation pose, ready for `buildSkeleton`. */
  pose(): { pose: Pose; grounded: boolean } {
    const base = this.def.stance;
    const clips = this.def.clips;

    if (this.state === "move" && this.move) {
      return { pose: sampleFrames(this.move.frames, this.moveFrame, base), grounded: this.grounded };
    }

    const clipName = this.clipForState();
    const clip = clipFor(clipName, clips);
    const frame = this.clipFrame(clipName);
    const pose = sampleClip(clip, frame, base);
    if (this.guardShove > 0 && this.guarding()) this.applyGuardShove(pose);
    return { pose, grounded: this.grounded && clipName !== "backdash" };
  }

  /**
   * Blocked hits shove the guard rather than replacing it: the body gives
   * ground, the elbows fold in and the head snaps back, all decaying over the
   * next few frames. Doing it here rather than as its own clip means a fighter
   * with a custom guard gets the reaction for free.
   */
  private applyGuardShove(pose: Pose) {
    const s = this.guardShove;
    const add = (key: keyof Pose, d: number) => {
      pose[key] = (pose[key] ?? 0) + d * s;
    };
    add("offX", -6);
    add("torso", -7);
    add("head", -5);
    add("shoulderF", 6);
    add("shoulderB", 5);
    add("elbowF", 11);
    add("elbowB", 9);
    add("kneeF", 7);
    add("kneeB", 6);
    pose.squash = (pose.squash ?? 1) - 0.03 * s;
  }

  private clipForState(): ClipName {
    switch (this.state) {
      case "walkF":
        return "walkF";
      case "walkB":
        return "walkB";
      case "crouch":
        return "crouch";
      case "jumpSquat":
        return "jumpSquat";
      case "air":
        return this.vy > 0 ? "jumpUp" : "jumpFall";
      case "land":
        return "land";
      case "dash":
        return "dash";
      case "backdash":
        return "backdash";
      case "block":
        return "blockHigh";
      case "blockLow":
        return "blockLow";
      case "blockAir":
        return "blockAir";
      case "blockstun":
        return this.stance === "crouch" ? "blockLow" : this.stance === "air" ? "blockAir" : "blockHigh";
      case "parry":
        return "parry";
      case "hitstun":
        return this.lastHitHeight === "low" ? "hitLow" : this.lastHitHeight === "high" ? "hitHigh" : "hitMid";
      case "hitstunAir":
        return this.juggleCount > 1 ? "launched" : "hitAir";
      case "knockdown":
        return "knockdown";
      case "wakeup":
        return "wakeup";
      case "grabbed":
        return "grabbed";
      case "guardBreak":
        return "dizzy";
      case "ko":
        return "ko";
      case "win":
        return "win";
      default:
        return "idle";
    }
  }

  private clipFrame(name: ClipName): number {
    switch (name) {
      case "blockHigh":
      case "blockLow":
      case "blockAir":
        return this.guardHold;
      case "idle":
      case "walkF":
      case "walkB":
      case "launched":
      case "dizzy":
      case "win":
        return this.animClock;
      default:
        return this.stateFrame;
    }
  }

  /** Free-running clock so looping idle/walk animations do not restart. */
  animClock = 0;
  lastHitHeight: "high" | "mid" | "low" = "mid";

  tickAnim() {
    this.animClock++;
  }
}

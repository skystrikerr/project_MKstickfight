/**
 * Physical simulation helpers used by the fighters.
 *
 * The headline piece is a verlet ragdoll: when a fighter is knocked down or
 * knocked out, the animated pose is handed over to a mass-and-stick body that
 * falls, folds and settles on its own. It runs in the engine (plain maths, no
 * three.js) and hands back a Skeleton the renderer draws exactly like an
 * animated one.
 *
 * Gameplay position stays authoritative: the ragdoll's hips are leashed to the
 * fighter's simulated x/y, so physics changes how a body *looks* as it falls,
 * never where the game thinks it is.
 */

import { BONES, type Joint, type Skeleton } from "../skeleton";
import type { Facing } from "../types";

export const PHYSICS = {
  /** Ground acceleration towards the walk target, units per frame². */
  walkAccel: 0.62,
  /** How fast a fighter sheds speed when the stick returns to neutral. */
  groundDrag: 0.72,
  /** Air resistance applied to horizontal motion each frame. */
  airDrag: 0.988,
  /** Fastest a body may fall. */
  terminalVelocity: 19,
  /** Horizontal speed kept when landing out of a jump. */
  landKeep: 0.55,
  /** Bounce kept when a launched body hits the floor. */
  groundRestitution: 0.42,
  /** Bounce kept when a launched body hits the wall. */
  wallRestitution: 0.46,
  /** Minimum impact speed that produces a bounce at all. */
  bounceThreshold: 5.5,

  ragdoll: {
    gravity: 0.62,
    damping: 0.985,
    /** Constraint solver passes per frame - more is stiffer. */
    iterations: 7,
    /** Energy kept when a joint hits the floor. */
    restitution: 0.22,
    /** Sideways speed kept when a joint scrapes along the floor. */
    friction: 0.62,
    /** How hard the hips are pulled back to the gameplay position. */
    leash: 0.32,
    /** Limbs start with this share of the body's velocity, plus noise. */
    inherit: 0.85,
  },
};

interface Point {
  x: number;
  y: number;
  px: number;
  py: number;
  /** Feet and hands are heavier so limbs whip rather than float. */
  mass: number;
}

interface Stick {
  a: number;
  b: number;
  len: number;
  /** 0..1, how much of the error is corrected per pass. */
  stiff: number;
}

const JOINTS = [
  "pelvis",
  "neck",
  "head",
  "kneeF",
  "footF",
  "toeF",
  "kneeB",
  "footB",
  "toeB",
  "elbowF",
  "handF",
  "elbowB",
  "handB",
] as const;

type JointName = (typeof JOINTS)[number];

const INDEX = Object.fromEntries(JOINTS.map((j, i) => [j, i])) as Record<JointName, number>;

/** Bones plus a few loose braces that stop the body folding through itself. */
const LINKS: [JointName, JointName, number][] = [
  ["pelvis", "neck", 1],
  ["neck", "head", 1],
  ["pelvis", "kneeF", 1],
  ["kneeF", "footF", 1],
  ["footF", "toeF", 1],
  ["pelvis", "kneeB", 1],
  ["kneeB", "footB", 1],
  ["footB", "toeB", 1],
  ["neck", "elbowF", 1],
  ["elbowF", "handF", 1],
  ["neck", "elbowB", 1],
  ["elbowB", "handB", 1],
  // Braces: keep some shape without locking the pose.
  ["pelvis", "elbowF", 0.18],
  ["pelvis", "elbowB", 0.18],
  ["neck", "kneeF", 0.12],
  ["neck", "kneeB", 0.12],
  ["kneeF", "kneeB", 0.08],
  ["head", "pelvis", 0.1],
];

const MASS: Partial<Record<JointName, number>> = {
  head: 1.5,
  handF: 1.25,
  handB: 1.25,
  footF: 1.4,
  footB: 1.4,
  pelvis: 2.2,
};

export class Ragdoll {
  private points: Point[] = [];
  private sticks: Stick[] = [];
  private facing: Facing;
  /** Frames since the ragdoll took over, used to fade the hip leash in. */
  private age = 0;
  settled = false;

  constructor(sk: Skeleton, x: number, y: number, facing: Facing, vx: number, vy: number, spin = 0) {
    this.facing = facing;

    // Seed from the current pose, converted into world space.
    for (const name of JOINTS) {
      const j = sk[name] as Joint;
      const wx = x + j.x * facing;
      const wy = y + j.y;
      // Limbs inherit the body's momentum, with a little scatter and spin so
      // two knockdowns never look identical.
      const scatter = (Math.random() - 0.5) * 1.4;
      const lever = (wy - y - BONES.hip) * 0.02 * spin;
      this.points.push({
        x: wx,
        y: wy,
        px: wx - (vx * PHYSICS.ragdoll.inherit + scatter + lever) ,
        py: wy - (vy * PHYSICS.ragdoll.inherit + (Math.random() - 0.5) * 0.8),
        mass: MASS[name] ?? 1,
      });
    }

    for (const [a, b, stiff] of LINKS) {
      const pa = this.points[INDEX[a]];
      const pb = this.points[INDEX[b]];
      this.sticks.push({
        a: INDEX[a],
        b: INDEX[b],
        len: Math.hypot(pa.x - pb.x, pa.y - pb.y),
        stiff,
      });
    }
  }

  /**
   * Advances one frame. `rootX`/`rootY` are the fighter's authoritative
   * position; the hips are drawn towards them so the visual never separates
   * from the hitbox.
   */
  step(rootX: number, rootY: number, grounded: boolean) {
    const cfg = PHYSICS.ragdoll;
    this.age++;

    for (const p of this.points) {
      const vx = (p.x - p.px) * cfg.damping;
      const vy = (p.y - p.py) * cfg.damping;
      p.px = p.x;
      p.py = p.y;
      p.x += vx;
      p.y += vy - cfg.gravity / p.mass;
    }

    for (let i = 0; i < cfg.iterations; i++) {
      for (const s of this.sticks) {
        const a = this.points[s.a];
        const b = this.points[s.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const diff = ((dist - s.len) / dist) * s.stiff * 0.5;
        const ox = dx * diff;
        const oy = dy * diff;
        const wa = b.mass / (a.mass + b.mass);
        const wb = a.mass / (a.mass + b.mass);
        a.x += ox * 2 * wa;
        a.y += oy * 2 * wa;
        b.x -= ox * 2 * wb;
        b.y -= oy * 2 * wb;
      }

      // Floor: joints stop at ground level, keeping a little bounce and drag.
      for (const p of this.points) {
        if (p.y >= 0) continue;
        const vx = p.x - p.px;
        const vy = p.y - p.py;
        p.y = 0;
        p.py = p.y + vy * cfg.restitution;
        p.px = p.x - vx * cfg.friction;
      }
    }

    // Leash the hips to the gameplay position, easing in so the initial
    // tumble still looks like it came from the hit.
    const pelvis = this.points[INDEX.pelvis];
    const strength = Math.min(1, this.age / 24) * cfg.leash;
    const targetY = grounded ? Math.max(rootY + 10, pelvis.y) : rootY + BONES.hip;
    pelvis.x += (rootX - pelvis.x) * strength;
    pelvis.y += (targetY - pelvis.y) * strength * 0.5;

    // A body that has stopped moving can skip the solver next frame.
    let energy = 0;
    for (const p of this.points) energy += Math.abs(p.x - p.px) + Math.abs(p.y - p.py);
    this.settled = energy < 0.35;
  }

  /** Converts back into the facing-space Skeleton the renderer expects. */
  toSkeleton(rootX: number, rootY: number, facing: Facing): Skeleton {
    const local = (i: number): Joint => {
      const p = this.points[i];
      return { x: (p.x - rootX) * facing, y: p.y - rootY };
    };

    const pelvis = local(INDEX.pelvis);
    const neck = local(INDEX.neck);
    const head = local(INDEX.head);
    const elbowF = local(INDEX.elbowF);
    const handF = local(INDEX.handF);
    const elbowB = local(INDEX.elbowB);
    const handB = local(INDEX.handB);

    const angle = (a: Joint, b: Joint) => (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI;

    return {
      pelvis,
      neck,
      head,
      kneeF: local(INDEX.kneeF),
      footF: local(INDEX.footF),
      toeF: local(INDEX.toeF),
      kneeB: local(INDEX.kneeB),
      footB: local(INDEX.footB),
      toeB: local(INDEX.toeB),
      elbowF,
      handF,
      elbowB,
      handB,
      foreAngleF: angle(elbowF, handF),
      foreAngleB: angle(elbowB, handB),
      torsoAngle: angle(neck, pelvis),
      weapon: 0,
      weaponBack: 0,
      spin: 0,
    };
  }

  /** Nudges the whole body, e.g. when a downed fighter is hit again. */
  impulse(x: number, y: number) {
    for (const p of this.points) {
      p.px -= x * (1 / p.mass);
      p.py -= y * (1 / p.mass);
    }
    this.settled = false;
  }
}

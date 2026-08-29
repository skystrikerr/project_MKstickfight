/**
 * Stickman skeleton: forward kinematics, pose blending and clip evaluation.
 *
 * The engine never touches three.js - it produces a `Skeleton` of plain 2D
 * joint positions in facing space, and the renderer draws bones between them.
 */

import type { ClipDef, Ease, Keyframe, Pose } from "./types";

export const BONES = {
  thigh: 26,
  shin: 25,
  foot: 9,
  spine: 34,
  neck: 8,
  headR: 9.5,
  upperArm: 20,
  foreArm: 19,
  hand: 4,
  /** Hip height with straight legs. */
  hip: 51,
  shoulderDrop: 4,
};

export interface Joint {
  x: number;
  y: number;
}

export interface Skeleton {
  pelvis: Joint;
  neck: Joint;
  head: Joint;
  kneeF: Joint;
  footF: Joint;
  toeF: Joint;
  kneeB: Joint;
  footB: Joint;
  toeB: Joint;
  elbowF: Joint;
  handF: Joint;
  elbowB: Joint;
  handB: Joint;
  /** Absolute angle of each forearm, degrees, for attaching weapons. */
  foreAngleF: number;
  foreAngleB: number;
  torsoAngle: number;
  /** Weapon rotation to apply on top of the holding forearm. */
  weapon: number;
  weaponBack: number;
  /** Whole-body roll applied by the renderer. */
  spin: number;
  /** Height the roll turns about; 0 is the floor between the feet. */
  spinPivot: number;
}

const DEG = Math.PI / 180;

function dirDown(angleDeg: number): Joint {
  const a = angleDeg * DEG;
  return { x: Math.sin(a), y: -Math.cos(a) };
}

function dirUp(angleDeg: number): Joint {
  const a = angleDeg * DEG;
  return { x: Math.sin(a), y: Math.cos(a) };
}

export const NEUTRAL: Required<Omit<Pose, never>> = {
  torso: 0,
  head: 0,
  shoulderF: 0,
  elbowF: 0,
  shoulderB: 0,
  elbowB: 0,
  hipF: 0,
  kneeF: 0,
  hipB: 0,
  kneeB: 0,
  weapon: 0,
  weaponBack: 0,
  offX: 0,
  offY: 0,
  crouch: 0,
  spin: 0,
  spinPivot: 0,
  squash: 1,
  free: 0,
};

/** Layers `over` on top of `base`, returning a complete pose. */
export function mergePose(base: Pose, over?: Pose): Pose {
  if (!over) return { ...base };
  return { ...base, ...over };
}

/** Resolves one keyframe against the stance: absolute joints, then additive. */
function resolveKey(k: Keyframe, base: Pose): Pose {
  const out = mergePose(base, k.p);
  if (k.add) {
    for (const key of POSE_KEYS) {
      const delta = k.add[key];
      if (delta === undefined) continue;
      out[key] = (out[key] ?? NEUTRAL[key]) + delta;
    }
  }
  return out;
}

function ease(t: number, kind: Ease | undefined): number {
  switch (kind) {
    case "in":
      return t * t;
    case "out":
      return 1 - (1 - t) * (1 - t);
    case "inOut":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "step":
      return 0;
    default:
      return t;
  }
}

const POSE_KEYS = Object.keys(NEUTRAL) as (keyof Pose)[];

function lerpPose(a: Pose, b: Pose, t: number, base: Pose): Pose {
  const out: Pose = {};
  for (const k of POSE_KEYS) {
    const av = a[k] ?? base[k] ?? NEUTRAL[k];
    const bv = b[k] ?? base[k] ?? NEUTRAL[k];
    out[k] = av + (bv - av) * t;
  }
  return out;
}

/**
 * Samples a keyframe list at frame `t`. Frames outside the listed range clamp
 * to the first/last keyframe. `base` supplies values for joints a keyframe
 * leaves out, so poses only mention the joints they actually move.
 */
export function sampleFrames(frames: Keyframe[], t: number, base: Pose): Pose {
  if (frames.length === 0) return { ...base };
  if (frames.length === 1 || t <= frames[0].t) return resolveKey(frames[0], base);
  const last = frames[frames.length - 1];
  if (t >= last.t) return resolveKey(last, base);

  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].t <= t) i++;
  const a = frames[i];
  const b = frames[i + 1];
  const span = b.t - a.t;
  const raw = span <= 0 ? 1 : (t - a.t) / span;
  return lerpPose(resolveKey(a, base), resolveKey(b, base), ease(raw, a.ease), base);
}

export function sampleClip(clip: ClipDef, frame: number, base: Pose): Pose {
  const t = clip.loop ? ((frame % clip.length) + clip.length) % clip.length : Math.min(frame, clip.length);
  return sampleFrames(clip.frames, t, base);
}

/**
 * Builds joint positions from a pose. Coordinates are in facing space with the
 * origin between the feet at ground level; the renderer mirrors x for facing.
 *
 * When `grounded` is true the whole body is shifted so the lower foot rests on
 * y = 0, which keeps stances readable without hand-tuning hip heights.
 */
export function buildSkeleton(pose: Pose, grounded: boolean, scale = 1): Skeleton {
  const p = { ...NEUTRAL, ...pose };
  const squash = p.squash || 1;
  const L = {
    thigh: BONES.thigh * squash,
    shin: BONES.shin * squash,
    spine: BONES.spine * squash,
    neck: BONES.neck * squash,
    upperArm: BONES.upperArm,
    foreArm: BONES.foreArm,
    foot: BONES.foot,
  };

  const hipH = BONES.hip * squash - p.crouch * 26;
  const pelvis: Joint = { x: 0, y: hipH };

  // Legs -----------------------------------------------------------------
  const legs = (hip: number, knee: number) => {
    const thighDir = dirDown(hip);
    const kneeJ: Joint = { x: pelvis.x + thighDir.x * L.thigh, y: pelvis.y + thighDir.y * L.thigh };
    const shinAngle = hip - knee;
    const shinDir = dirDown(shinAngle);
    const foot: Joint = { x: kneeJ.x + shinDir.x * L.shin, y: kneeJ.y + shinDir.y * L.shin };
    // The toe points forward, tilting with the shin so kicks read cleanly.
    const toe: Joint = { x: foot.x + L.foot * Math.cos(shinAngle * DEG * 0.4), y: foot.y + 1.5 };
    return { knee: kneeJ, foot, toe };
  };
  const front = legs(p.hipF, p.kneeF);
  const back = legs(p.hipB, p.kneeB);

  // Spine, head ----------------------------------------------------------
  const spineDir = dirUp(p.torso);
  const neck: Joint = { x: pelvis.x + spineDir.x * L.spine, y: pelvis.y + spineDir.y * L.spine };
  const headDir = dirUp(p.torso + p.head);
  const head: Joint = {
    x: neck.x + headDir.x * (L.neck + BONES.headR * 0.55),
    y: neck.y + headDir.y * (L.neck + BONES.headR * 0.55),
  };

  // Arms hang from just under the neck ------------------------------------
  const shoulder: Joint = {
    x: neck.x - spineDir.x * BONES.shoulderDrop,
    y: neck.y - spineDir.y * BONES.shoulderDrop,
  };
  const arm = (shoulderAngle: number, elbowBend: number) => {
    const upperAngle = shoulderAngle + p.torso * 0.35;
    const upDir = dirDown(upperAngle);
    const elbow: Joint = { x: shoulder.x + upDir.x * L.upperArm, y: shoulder.y + upDir.y * L.upperArm };
    const foreAngle = upperAngle + elbowBend;
    const foreDir = dirDown(foreAngle);
    const hand: Joint = { x: elbow.x + foreDir.x * L.foreArm, y: elbow.y + foreDir.y * L.foreArm };
    return { elbow, hand, foreAngle };
  };
  const armF = arm(p.shoulderF, p.elbowF);
  const armB = arm(p.shoulderB, p.elbowB);

  const sk: Skeleton = {
    pelvis,
    neck,
    head,
    kneeF: front.knee,
    footF: front.foot,
    toeF: front.toe,
    kneeB: back.knee,
    footB: back.foot,
    toeB: back.toe,
    elbowF: armF.elbow,
    handF: armF.hand,
    elbowB: armB.elbow,
    handB: armB.hand,
    foreAngleF: armF.foreAngle,
    foreAngleB: armB.foreAngle,
    torsoAngle: p.torso,
    weapon: p.weapon,
    weaponBack: p.weaponBack,
    spin: p.spin,
    spinPivot: p.spinPivot,
  };

  // Ground the pose, then apply the authored offset.
  let dy = p.offY;
  if (grounded && !p.free) {
    dy -= Math.min(sk.footF.y, sk.footB.y);
  }
  const dx = p.offX;
  if (dx !== 0 || dy !== 0) {
    for (const key of [
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
    ] as const) {
      sk[key].x += dx;
      sk[key].y += dy;
    }
  }

  if (scale !== 1) {
    for (const key of [
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
    ] as const) {
      sk[key].x *= scale;
      sk[key].y *= scale;
    }
  }

  return sk;
}

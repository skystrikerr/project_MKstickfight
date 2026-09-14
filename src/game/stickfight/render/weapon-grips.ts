import { BONES, type Joint, type Skeleton } from "../skeleton";

/** Supporting grips in game units, relative to the main hand's weapon axis. */
export const SUPPORT_GRIPS: Record<string, { prop: string; main: "F" | "B"; x: number; y: number }> = {
  samurai: { prop: "katana", main: "F", x: -5, y: 0 },
  soldier: { prop: "rifle", main: "B", x: 3, y: 2 },
  shaolin: { prop: "staff", main: "F", x: -16, y: 0 },
  maori: { prop: "taiaha", main: "F", x: -14, y: 0 },
  jaguar: { prop: "macuahuitl", main: "F", x: -5, y: 0 },
};

/** Render-only IK. Never mutate the simulation's skeleton or weapon anchor. */
export function supportWeapon(sk: Skeleton, id: string, active: boolean): Skeleton {
  const grip = SUPPORT_GRIPS[id];
  if (!grip || !active) return sk;
  const side = grip.main === "F" ? "B" : "F";
  const origin = sk[`hand${grip.main}`];
  const angle = (sk[`foreAngle${grip.main}`] - 90 +
    (grip.main === "F" ? sk.weapon : sk.weaponBack)) * Math.PI / 180;
  const target = {
    x: origin.x + Math.cos(angle) * grip.x - Math.sin(angle) * grip.y,
    y: origin.y + Math.sin(angle) * grip.x + Math.cos(angle) * grip.y,
  };
  const hand = sk[`hand${side}`];
  const gap = Math.hypot(hand.x - target.x, hand.y - target.y);
  // A hand deliberately pulled away is a release, strike, or recovery pose.
  // Blend out over a range so transitions don't snap the supporting wrist.
  const weight = 1 - Math.max(0, Math.min(1, (gap - 18) / 14));
  if (weight === 0) return sk;
  const spine = Math.hypot(sk.neck.x - sk.pelvis.x, sk.neck.y - sk.pelvis.y) || 1;
  const shoulder = {
    x: sk.neck.x - (sk.neck.x - sk.pelvis.x) / spine * BONES.shoulderDrop,
    y: sk.neck.y - (sk.neck.y - sk.pelvis.y) / spine * BONES.shoulderDrop,
  };
  const wrist = { x: hand.x + (target.x - hand.x) * weight, y: hand.y + (target.y - hand.y) * weight };
  const dx = wrist.x - shoulder.x, dy = wrist.y - shoulder.y;
  const distance = Math.hypot(dx, dy);
  // Unreachable grips release; don't stretch an arm to force contact.
  if (distance > BONES.upperArm + BONES.foreArm - 0.01 || distance < 1.01) return sk;
  const along = (BONES.upperArm ** 2 - BONES.foreArm ** 2 + distance ** 2) / (2 * distance);
  const height = Math.sqrt(Math.max(0, BONES.upperArm ** 2 - along ** 2));
  const ux = dx / distance, uy = dy / distance;
  const elbows: Joint[] = [-1, 1].map(sign => ({
    x: shoulder.x + ux * along - uy * height * sign,
    y: shoulder.y + uy * along + ux * height * sign,
  }));
  const old = sk[`elbow${side}`];
  const elbow = elbows.sort((a, b) => Math.hypot(a.x - old.x, a.y - old.y) - Math.hypot(b.x - old.x, b.y - old.y))[0];
  return { ...sk, [`hand${side}`]: wrist, [`elbow${side}`]: elbow,
    [`foreAngle${side}`]: Math.atan2(wrist.x - elbow.x, -(wrist.y - elbow.y)) * 180 / Math.PI };
}

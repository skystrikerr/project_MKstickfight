import assert from 'node:assert/strict';
import { ROSTER } from '../src/game/stickfight/fighters/index.ts';
import { BONES, buildSkeleton, sampleFrames } from '../src/game/stickfight/skeleton.ts';
import { SUPPORT_GRIPS, supportWeapon } from '../src/game/stickfight/render/weapon-grips.ts';

let adjusted = 0;
for (const fighter of ROSTER) {
  if (!SUPPORT_GRIPS[fighter.id]) continue;
  for (const move of fighter.moves) for (let frame = 0; frame <= move.duration; frame++) {
    const sk = buildSkeleton(sampleFrames(move.frames, frame, fighter.stance), true);
    const before = JSON.stringify(sk);
    assert.equal(supportWeapon(sk, fighter.id, false), sk, 'hidden/switched weapon must release');
    const posed = supportWeapon(sk, fighter.id, true);
    assert.equal(JSON.stringify(sk), before, 'combat skeleton must be immutable');
    const main = SUPPORT_GRIPS[fighter.id].main;
    assert.deepEqual(posed[`hand${main}`], sk[`hand${main}`], 'main grip must not move');
    if (posed === sk) continue;
    const side = main === 'F' ? 'B' : 'F';
    const d = Math.hypot(sk.neck.x - sk.pelvis.x, sk.neck.y - sk.pelvis.y);
    const shoulder = { x: sk.neck.x - (sk.neck.x - sk.pelvis.x) / d * BONES.shoulderDrop,
      y: sk.neck.y - (sk.neck.y - sk.pelvis.y) / d * BONES.shoulderDrop };
    const elbow = posed[`elbow${side}`], wrist = posed[`hand${side}`];
    assert(Math.abs(Math.hypot(elbow.x - shoulder.x, elbow.y - shoulder.y) - BONES.upperArm) < 1e-7);
    assert(Math.abs(Math.hypot(wrist.x - elbow.x, wrist.y - elbow.y) - BONES.foreArm) < 1e-7);
    assert(Number.isFinite(posed[`foreAngle${side}`]));
    adjusted++;
  }
}
assert(adjusted > 0);
console.log(`Weapon support: ${adjusted} adjusted poses preserve arm lengths, primary grip and combat state.`);

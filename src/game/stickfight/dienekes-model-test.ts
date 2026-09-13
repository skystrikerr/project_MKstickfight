/** Run with `npx tsx src/game/stickfight/dienekes-model-test.ts`. */
import assert from "node:assert/strict";
import * as THREE from "three";
import { SPARTAN } from "./fighters/spartan";
import { BONES, buildSkeleton, sampleFrames } from "./skeleton";
import { StickRig, attachTransform } from "./render/rig";

const before = JSON.stringify(SPARTAN);
const rig = new StickRig(SPARTAN);
const model = rig.group.getObjectByName("DienekesModel")!;
assert.ok(model, "Dienekes uses the approved model");
const bounds = (part: string, mesh: string) => {
  const geometry = (model.getObjectByName(`dienekes:${part}`)!.getObjectByName(mesh) as THREE.Mesh).geometry;
  geometry.computeBoundingBox();
  return geometry.boundingBox!;
};
assert.ok(Math.abs(bounds("dory", "LeafBlade").max.x - 116) < 1e-4, "spear tip retains authored reach");
assert.ok(Math.abs(bounds("dory", "ButtTip").min.x + 56) < 1e-4, "spear butt retains authored reach");
assert.ok(bounds("aspis", "CrimsonFace").min.z > 5, "shield face retains exported depth");
assert.ok(bounds("aspis", "Rivet0").min.x > 24, "shield details retain exported offsets");
assert.ok(Math.abs(bounds("footF", "Sandal-1").min.y) < 1e-4, "sandal sole meets foot joint");
let samples = 0;
for (const move of SPARTAN.moves) {
  for (let frame = 0; frame <= move.duration; frame++) {
    const visible = new Set(move.showProps ?? []), hidden = new Set(move.hideProps ?? []);
    for (const window of move.propsAt ?? []) {
      if (frame < window.from || frame > window.to) continue;
      for (const id of window.show ?? []) { visible.add(id); hidden.delete(id); }
      for (const id of window.hide ?? []) { hidden.add(id); visible.delete(id); }
    }
    const sk = buildSkeleton(sampleFrames(move.frames ?? [], frame, SPARTAN.stance), true);
    const snapshot = JSON.stringify(sk);
    for (const facing of [1, -1] as const) {
      rig.update(sk, { x: 120, y: 0, facing, visibleProps: visible, hiddenProps: hidden, flash: 0, airborne: false });
      rig.group.updateMatrixWorld(true);
      assert.equal(JSON.stringify(sk), snapshot, "drawing does not mutate combat joints");
      for (const [part, end, nominal] of [
        ["thighF", sk.kneeF, BONES.thigh], ["shinF", sk.footF, BONES.shin],
        ["foreArmF", sk.handF, BONES.foreArm], ["foreArmB", sk.handB, BONES.foreArm],
      ] as const) {
        const carrier = model.getObjectByName(`dienekes:${part}`)!;
        const actual = new THREE.Vector3(0, -nominal, 0).applyMatrix4(carrier.matrixWorld);
        const expected = new THREE.Vector3(end.x, end.y, carrier.position.z).applyMatrix4(rig.group.matrixWorld);
        assert.ok(actual.distanceTo(expected) < 1e-5, `${move.id}/${frame}/${facing}: ${part} follows combat joint`);
      }
      assert.equal(model.getObjectByName("dienekes:dory")!.visible, !hidden.has("dory"), `${move.id}/${frame}: spear visibility`);
      const attachment = attachTransform(sk, "handB");
      const spear = model.getObjectByName("dienekes:dory")!;
      assert.equal(spear.position.x, attachment.x);
      assert.equal(spear.position.y, attachment.y);
      assert.ok(Math.abs(spear.rotation.z - attachment.rot * Math.PI / 180) < 1e-10);
      model.traverse(object => assert.ok(object.matrixWorld.elements.every(Number.isFinite), "finite matrices"));
      samples++;
    }
  }
}
const sk = buildSkeleton(SPARTAN.stance, true);
const stripped = new Set(["helm", "cuirass", "aspis", "dory", "cloak", "greaveF", "greaveB"]);
rig.update(sk, { x: 0, y: 0, facing: 1, visibleProps: new Set(), hiddenProps: stripped, flash: 8, airborne: false });
for (const part of ["helm", "torso", "skirt", "aspis", "dory", "cloak", "greaveF", "greaveB"]) assert.equal(model.getObjectByName(`dienekes:${part}`)!.visible, false, `stripped ${part}`);
assert.equal(model.getObjectByName("dienekes:underbody")!.visible, true);
assert.equal(JSON.stringify(SPARTAN), before, "move definitions and fighter stats unchanged");
rig.dispose();
const other = new StickRig({ ...SPARTAN, id: "test-other-fighter" });
assert.equal(other.group.getObjectByName("DienekesModel"), undefined, "other fighters retain the original rig");
other.dispose();
console.log(`Dienekes model: ${SPARTAN.moves.length} moves, ${samples} frame/facing samples; joint mapping, equipment, stripping, and definition immutability passed.`);

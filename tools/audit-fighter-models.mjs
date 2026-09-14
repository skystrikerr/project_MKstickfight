import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ROSTER } from "../src/game/stickfight/fighters/index.ts";
import { propModelAssetId } from "../src/game/stickfight/render/fighter-model.ts";

const modelDir = path.resolve("src/assets/models");
const files = new Set(fs.readdirSync(modelDir));
const requiredJoints = new Set([
  "Pelvis", "Torso", "Head",
  "Hip_L", "Hip_R", "Knee_L", "Knee_R",
  "Shoulder_L", "Shoulder_R", "Elbow_L", "Elbow_R",
]);

function glbJson(filename) {
  const bytes = fs.readFileSync(path.join(modelDir, filename));
  assert.equal(bytes.toString("ascii", 0, 4), "glTF", `${filename}: invalid GLB magic`);
  assert.equal(bytes.readUInt32LE(4), 2, `${filename}: unsupported GLB version`);
  assert.equal(bytes.readUInt32LE(8), bytes.length, `${filename}: incorrect byte length`);
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.toString("ascii", 16, 20), "JSON", `${filename}: missing JSON chunk`);
  return JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength).trimEnd());
}

assert.equal(ROSTER.length, 26, "expected the complete 26-fighter roster");

let equipmentCount = 0;
let moveCount = 0;
const mappedEquipment = new Set();
for (const fighter of ROSTER) {
  moveCount += fighter.moves.length;
  const bodyFile = `${fighter.id}-body.glb`;
  assert(files.has(bodyFile), `${fighter.name}: missing ${bodyFile}`);
  const body = glbJson(bodyFile);
  const names = new Set((body.nodes ?? []).map((node) => node.name));
  for (const joint of requiredJoints) {
    assert(names.has(joint), `${fighter.name}: body is missing joint ${joint}`);
  }
  assert((body.meshes ?? []).length > 0, `${fighter.name}: body has no meshes`);

  for (const prop of fighter.props) {
    const assetId = propModelAssetId(fighter.id, prop.id);
    const filename = `${fighter.id}-${assetId}.glb`;
    if (!files.has(filename)) continue;
    mappedEquipment.add(filename);
    const model = glbJson(filename);
    assert((model.meshes ?? []).length > 0, `${filename}: equipment has no meshes`);
    equipmentCount++;
  }
}

const bodyFiles = [...files].filter((file) => file.endsWith("-body.glb"));
assert.equal(bodyFiles.length, ROSTER.length, "body count does not match roster count");

// The Roman pack includes a gladius for possible future move-set work. The
// current fighter definition uses spear and shield, so intentionally leave it
// unattached rather than changing gameplay to make a spare model appear.
const allowedUnused = new Set(["roman-gladius.glb"]);
const unusedEquipment = [...files].filter((file) =>
  file.endsWith(".glb") && !file.endsWith("-body.glb") &&
  !mappedEquipment.has(file) && !allowedUnused.has(file));
assert.deepEqual(unusedEquipment, [], `unmapped equipment: ${unusedEquipment.join(", ")}`);

console.log(
  `Fighter models: ${ROSTER.length} bodies, ${equipmentCount} mapped equipment props, ` +
  `${moveCount} moves; GLB structure and joint contracts passed.`,
);

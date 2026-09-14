/**
 * A GLB fighter body, posed by the game's own skeleton.
 *
 * The prototype packs are rigid hierarchies of named empties with meshes
 * hanging off them - no skin weights and no clips - which is exactly right
 * here: the simulation already produces a full pose every frame, so a model
 * that names its joints correctly inherits every move for free.
 *
 * Only the body comes from the GLB. Weapons stay with the stick rig's props,
 * which already carry the reach the sim checks against and already appear and
 * vanish on the right frames. Swapping those for pack equipment is a separate
 * job and not one worth blocking 26 bodies on.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BONES, type Joint, type Skeleton } from "../skeleton";
import type { FighterPalette } from "../types";
import type { StageLight } from "./shapes";

const DEG = Math.PI / 180;

/**
 * Bone lengths as the prototype packs authored them - all 26 share this
 * figure, verified by reading the joint matrices out of every body.
 */
const PACK = {
  upperArm: 0.33,
  foreArm: 0.31,
  thigh: 0.39,
  shin: 0.435,
  spine: 0.65,
  neck: 0.12,
  hip: 1.04,
} as const;

interface Scales {
  upperArm: number;
  foreArm: number;
  thigh: number;
  shin: number;
  spine: number;
  neck: number;
  girth: number;
}

/**
 * How far each bone has to stretch for this particular model.
 *
 * Two eras of asset live side by side. The prototype packs are authored at
 * roughly 1/60 with proportions that disagree with BONES - a thigh wants
 * x66.7 while hip height wants x49 - so no uniform scale fits and each bone
 * is stretched on its own. The Blender models are built at true game scale
 * against the real skeleton and need no correction at all; stretching those
 * by the pack factors would produce a sixty-metre fighter.
 *
 * Which is which is read off the model rather than configured, so a fighter
 * upgraded from a pack to a Blender build needs no code change.
 */
function scalesFor(source: THREE.Object3D): Scales {
  const pelvis = source.getObjectByName("Pelvis");
  const hip = pelvis ? Math.abs(pelvis.position.y) : PACK.hip;
  // A model already near game scale is passed straight through.
  if (hip > BONES.hip * 0.5) {
    return { upperArm: 1, foreArm: 1, thigh: 1, shin: 1, spine: 1, neck: 1, girth: 1 };
  }
  const s = {
    upperArm: BONES.upperArm / PACK.upperArm,
    foreArm: BONES.foreArm / PACK.foreArm,
    thigh: BONES.thigh / PACK.thigh,
    shin: BONES.shin / PACK.shin,
    spine: BONES.spine / PACK.spine,
    neck: BONES.neck / PACK.neck,
    girth: 1,
  };
  // Girth tracks the mean length stretch. Left to drift - it was a flat 45
  // against length scales of 57-67 - every limb comes out a third too thin.
  s.girth = (s.upperArm + s.foreArm + s.thigh + s.shin) / 4;
  return s;
}

/**
 * Put back a mesh that was authored where the figure stands rather than where
 * its joint is.
 *
 * Almost every mesh in the set is authored against its joint, or carries a
 * node offset that cancels the joint's height - either way the walk above
 * lands it correctly. One does not: the roman's `Tunic_Torso` sits at its
 * world height with an identity transform, so baking it against the torso
 * leaves it floating a chest above the chest, and the fighter goes bare under
 * the armour. That was invisible while the flat ink tunic was still drawn on
 * top of the model, and obvious the moment it was not.
 *
 * The rule is measured rather than named, so it also catches the next export
 * that does this: a mesh whose centre lands further from its joint than a
 * whole hip height, and which comes home when exactly the joint's own height
 * is taken off it, was authored in world space. Anything else is left alone -
 * a crest plume or a cape genuinely does reach a long way from its joint.
 */
function reseat(geo: THREE.BufferGeometry, jointY: number, hip: number) {
  if (!jointY) return;
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const centre = (box.min.y + box.max.y) / 2;
  const far = hip * 0.6;
  if (Math.abs(centre) <= far || Math.abs(centre - jointY) > far) return;
  geo.translate(0, -jointY, 0);
}

/** Yaw off pure profile, so the model reads as a figure and not a cutout. */
const YAW = 0.8;

/** Worn on the foot rather than the shin: the ankle splits one joint in two. */
const SHOD = /^(Sandal|Foot|Boot|Shoe)/;

/** Held or worn at the wrist rather than along the forearm. */
const HELD = /^Hand/;

const BODY_PARTS = [
  "pelvis", "torso", "neck", "head",
  "thighF", "shinF", "footF", "upperArmF", "foreArmF", "handF",
  "thighB", "shinB", "footB", "upperArmB", "foreArmB", "handB",
] as const;
type BodyPart = (typeof BODY_PARTS)[number];

/**
 * The nodes every body names, which is what makes one model poseable by a
 * skeleton built for another. A piece is everything under its joint and above
 * the next one, so these double as the boundaries the walk below stops at.
 */
const JOINTS = new Set([
  "Pelvis", "Torso", "Neck", "Head",
  "Hip_L", "Hip_R", "Knee_L", "Knee_R",
  "Shoulder_L", "Shoulder_R", "Elbow_L", "Elbow_R",
]);

/**
 * Every mesh belonging to one joint: its whole subtree, stopping wherever the
 * next joint starts.
 *
 * The old walk read a joint's direct mesh children only, which quietly lost
 * anything a modeller had grouped - the capes, most of the roman's helmet
 * furniture - and left the fighters wearing the flat ink versions of the same
 * kit instead. Descending properly is what lets the model own its own costume.
 */
function meshesUnder(joint: THREE.Object3D, include: (name: string) => boolean): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  const walk = (o: THREE.Object3D, root: boolean) => {
    if (!root && JOINTS.has(o.name)) return; // the next piece's business
    if (o instanceof THREE.Mesh && include(o.name)) out.push(o);
    for (const child of o.children) walk(child, false);
  };
  walk(joint, true);
  return out;
}

let loader: GLTFLoader | null = null;

function modelUrls(): Record<string, () => Promise<string>> {
  // Globbed inside a function, not at module scope: the self-tests import
  // this module's neighbours under Node, where import.meta.glob does not
  // exist. Vite still sees the pattern statically and bundles every match.
  return import.meta.glob("../../../assets/models/*-body.glb", {
    import: "default",
    query: "?url",
  }) as Record<string, () => Promise<string>>;
}

/**
 * Colour a model's material from the fighter's own palette.
 *
 * The packs and the Blender set both ship deliberately neutral surfaces -
 * MODELING_RULES.md forbids baked emblems and heraldry so that colour and
 * insignia can be applied later. Correct, but it means a shield arrives blank,
 * and blank is a downgrade on a flat prop that was painted. Mapping the agreed
 * material names onto the palette gives each fighter their colours back now,
 * and does not stand in the way of textures doing it properly later.
 */
/**
 * Props whose broad face is painted rather than bare. A shield carries more of
 * a fighter's identity than anything else they hold, and the models ship its
 * face untinted because MODELING_RULES forbids baked heraldry - so left alone
 * it renders as a bare board or a blank steel disc. Dienekes' hand-built aspis
 * has a crimson face, and that one difference is most of why he read like a
 * character while the rest of the roster read like prototypes.
 */
const PAINTED_FACE = /shield|aspis|buckler|scutum|rodela|kalasag|isihlangu|spara|gasha/i;

/**
 * Push a model's material toward the fighter's palette - but only the slots
 * that carry identity.
 *
 * The first version remapped everything, including the physical materials the
 * model had already got right. Freydis' buckler is 69% `metal`, so forcing
 * that to her pale palette steel turned it into a blank disc, and a third of
 * her body is `leather` that reads better at the brown it was authored with
 * than at anything a palette can offer. Cloth and trim say who someone is;
 * leather, fur, skin and hair just say what they are made of.
 */
function tint(name: string | undefined, base: THREE.Color, palette?: FighterPalette,
              painted = false): THREE.Color {
  if (!palette || !name) return base;
  const slot = name.toLowerCase();
  const of = (hex: string) => new THREE.Color(hex);

  // A painted face takes the fighter's colours whatever it is made of.
  if (painted) {
    if (/wood|plank|board|metal|iron|steel|face|hide/.test(slot)) return of(palette.accent);
    if (/gold|bronze|edge|rim|boss/.test(slot)) return of(palette.metal);
  }

  // Identity: what the fighter wears and is trimmed with.
  if (/cloth|crimson|tunic|sash|cloak|surcoat/.test(slot)) return of(palette.cloth);
  if (/redhighlight|highlight/.test(slot)) return of(palette.cloth).lerp(of("#ffffff"), 0.22);
  if (/goldedge|gold|brass/.test(slot)) return of(palette.accent);
  if (/darkbronze/.test(slot)) return of(palette.metal).multiplyScalar(0.6);
  if (/^bronze$/.test(slot)) return of(palette.metal);
  if (/ivory/.test(slot)) return of(palette.body);

  // Everything else - leather, metal, fur, skin, hair, wood, linen, shadow -
  // keeps the colour the model was built with.
  return base;
}

/**
 * Lights for the fighter models, added once to whatever scene they join.
 *
 * The arena is drawn entirely in MeshBasicMaterial, which ignores lights - so
 * putting real ones in changes nothing about the stages, the flat rigs or the
 * props, and only the modelled fighters respond. That is the difference
 * between a model looking like its own source mesh and looking like a flat
 * cutout of it: baking a single direction into vertex colours could never
 * produce the soft fill that makes these read as solid.
 */
function ensureLights(scene: THREE.Object3D, light?: StageLight) {
  if (scene.getObjectByName("fighterKey")) return;
  const key = new THREE.DirectionalLight(light?.key ?? "#fff4e2", 1.55);
  key.name = "fighterKey";
  key.position.set(-0.45, 1.0, 0.85);
  scene.add(key);
  const fill = new THREE.HemisphereLight(
    light?.key ?? "#ffffff", light?.fill ?? "#33281c", 1.35);
  fill.name = "fighterFill";
  scene.add(fill);
  const rim = new THREE.DirectionalLight("#9fc0ff", 0.42);
  rim.name = "fighterRim";
  rim.position.set(0.7, 0.25, -0.9);
  scene.add(rim);
}

/**
 * Swap a flat prop's shapes for its 3D model, fitted to the space the flat one
 * occupied.
 *
 * Fitting to the existing group rather than positioning the model myself is
 * the whole trick: the rig already moves that group to the right hand, at the
 * right angle, on the right frames, and the simulation already checks reach
 * against the flat parts. Replacing only what is drawn inside it means a
 * modelled weapon inherits all of that and cannot drift from what the game
 * thinks it is holding.
 *
 * Orientation is matched by longest axis rather than assumed, because the
 * packs lay a blade along Y while the flat props run along X.
 */
export async function fitPropModel(
  fighterId: string,
  propId: string,
  group: THREE.Group,
  light?: StageLight,
  palette?: FighterPalette,
): Promise<boolean> {
  const urls = import.meta.glob("../../../assets/models/*.glb", {
    import: "default",
    query: "?url",
  }) as Record<string, () => Promise<string>>;
  const entry = urls[`../../../assets/models/${fighterId}-${propId}.glb`];
  if (!entry) return false;

  // What the flat prop occupies, measured off the geometry actually built.
  const target = new THREE.Box3();
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.computeBoundingBox();
      target.union(o.geometry.boundingBox!.clone().applyMatrix4(o.matrix));
    }
  });
  if (target.isEmpty()) return false;

  loader ??= new GLTFLoader();
  const gltf = await loader.loadAsync(await entry());

  const source = new THREE.Box3().setFromObject(gltf.scene);
  const ts = target.getSize(new THREE.Vector3());
  const ss = source.getSize(new THREE.Vector3());
  // Longest axis of each, so a blade authored up the Y lies down along X.
  const spin = ss.y > ss.x ? -Math.PI / 2 : 0;
  const srcLong = Math.max(ss.x, ss.y) || 1;
  const srcThin = Math.min(ss.x, ss.y) || 1;
  const fit = Math.max(ts.x, ts.y) / srcLong;
  const thin = Math.max(ts.x, ts.y) > 0 ? Math.min(ts.x, ts.y) / srcThin : fit;

  const built: THREE.Mesh[] = [];
  const shared = new Map<string, THREE.MeshLambertMaterial>();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (spin) geo.rotateZ(spin);
    geo.scale(fit, Math.min(thin, fit * 2.2), fit);
    const src = o.material as THREE.MeshStandardMaterial;
    let mat = shared.get(src.uuid);
    if (!mat) {
      const base = tint(src.name, src.color?.clone() ?? new THREE.Color("#c8c8c8"),
                        palette, PAINTED_FACE.test(propId));
      mat = new THREE.MeshLambertMaterial({ color: base, emissive: base,
                                            emissiveIntensity: 0.18 });
      shared.set(src.uuid, mat);
    }
    geo.computeVertexNormals();
    built.push(new THREE.Mesh(geo, mat));
  });
  if (!built.length) return false;

  // Sit the model where the flat one sat, so grip and tip land the same.
  const placed = new THREE.Box3();
  for (const m of built) {
    m.geometry.computeBoundingBox();
    placed.union(m.geometry.boundingBox!);
  }
  const shift = target.getCenter(new THREE.Vector3()).sub(placed.getCenter(new THREE.Vector3()));
  for (const m of built) m.geometry.translate(shift.x, shift.y, 0);

  for (const child of [...group.children]) {
    if (child instanceof THREE.Mesh) child.geometry.dispose();
    group.remove(child);
  }
  for (const m of built) group.add(m);
  let root: THREE.Object3D | null = group;
  while (root?.parent) root = root.parent;
  if (root) ensureLights(root, light);
  gltf.scene.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
  return true;
}

/** Whether a fighter has a body model sitting in the assets folder. */
export function hasBodyModel(id: string): boolean {
  return `../../../assets/models/${id}-body.glb` in modelUrls();
}

export class FighterModel {
  readonly group = new THREE.Group();
  private parts = new Map<BodyPart, THREE.Group>();
  private materials: { material: THREE.MeshLambertMaterial; base: THREE.Color }[] = [];
  ready = false;
  private lit = false;

  constructor(private id: string, private light?: StageLight,
              private palette?: FighterPalette) {
    this.group.name = `FighterModel:${id}`;
  }

  async load(): Promise<boolean> {
    const entry = modelUrls()[`../../../assets/models/${this.id}-body.glb`];
    if (!entry) return false;
    loader ??= new GLTFLoader();
    const url = await entry();
    const gltf = await loader.loadAsync(url);
    this.build(gltf.scene);
    this.ready = true;
    return true;
  }

  private build(source: THREE.Object3D) {
    source.updateMatrixWorld(true);
    const S = scalesFor(source);
    const pelvis = source.getObjectByName("Pelvis");
    const hip = pelvis
      ? Math.abs(new THREE.Vector3().setFromMatrixPosition(pelvis.matrixWorld).y)
      : PACK.hip;
    const seen = new Map<string, { material: THREE.MeshLambertMaterial; base: THREE.Color }>();

    const piece = (
      part: BodyPart,
      jointName: string,
      include: (name: string) => boolean,
      originY: number,
      lengthScale: number,
    ) => {
      const group = new THREE.Group();
      group.name = `${this.id}:${part}`;
      const joint = source.getObjectByName(jointName);
      if (joint) {
        const toJoint = joint.matrixWorld.clone().invert();
        const jointY = new THREE.Vector3().setFromMatrixPosition(joint.matrixWorld).y;
        const local = new THREE.Matrix4();
        for (const child of meshesUnder(joint, include)) {
          // Relative to the joint through the model's own world matrices, not
          // through one local matrix. Two things depend on it: costume hung
          // under a group rather than straight off the joint (every cape in
          // the prototype set is a `Cape` group of folds), and meshes authored
          // in world space with a compensating offset, which the Blender-era
          // bodies use and a lone local matrix reads as a metre of altitude.
          const geo = child.geometry
            .clone()
            .applyMatrix4(local.multiplyMatrices(toJoint, child.matrixWorld));
          reseat(geo, jointY, hip);
          geo.translate(0, -originY, 0);
          geo.scale(S.girth, lengthScale, S.girth);
          geo.rotateY(YAW);

          const src = child.material as THREE.MeshStandardMaterial;
          const key = src.uuid;
          let entry = seen.get(key);
          if (!entry) {
            // Mapped onto this fighter's palette, the way the hand-built
            // Dienekes did. The packs ship deliberately neutral prototype
            // colours, so taking them literally is what made the whole roster
            // read flat while he read like a character.
            const base = tint(src.name,
                              src.color?.clone() ?? new THREE.Color("#c8c8c8"),
                              this.palette);
            entry = {
              material: new THREE.MeshLambertMaterial({ color: base, emissive: base,
                                                        emissiveIntensity: 0.18 }),
              base,
            };
            seen.set(key, entry);
            this.materials.push(entry);
          }

          geo.computeVertexNormals();
          group.add(new THREE.Mesh(geo, entry.material));
        }
      }
      this.parts.set(part, group);
      this.group.add(group);
    };

    const all = () => true;
    // Joints bound each piece, so these filters only have to split the two
    // places where one joint carries two of them: the ankle inside the shin,
    // and the hand inside the forearm.
    piece("pelvis", "Pelvis", all, 0, S.girth);
    piece("torso", "Torso", all, 0, S.spine);
    piece("neck", "Neck", all, 0, S.neck);
    piece("head", "Head", all, 0, S.girth);
    for (const [suffix, side] of [["F", "L"], ["B", "R"]] as const) {
      piece(`thigh${suffix}` as BodyPart, `Hip_${side}`, all, 0, S.thigh);
      piece(`shin${suffix}` as BodyPart, `Knee_${side}`, (n) => !SHOD.test(n), 0, S.shin);
      piece(`foot${suffix}` as BodyPart, `Knee_${side}`, (n) => SHOD.test(n),
            // The foot mesh is authored down at the ankle, and it is then
            // placed at the foot joint too - so its own offset has to come off
            // first or the feet land a shin's length below the leg.
            S.girth > 2 ? -0.4725 : -BONES.shin, S.girth);
      piece(`upperArm${suffix}` as BodyPart, `Shoulder_${side}`, all, 0, S.upperArm);
      piece(`foreArm${suffix}` as BodyPart, `Elbow_${side}`, (n) => !HELD.test(n),
            0, S.foreArm);
      piece(`hand${suffix}` as BodyPart, `Elbow_${side}`, (n) => HELD.test(n),
            S.girth > 2 ? -PACK.foreArm : -BONES.foreArm, S.girth);
    }

    // The parsed original is scratch; every runtime piece owns its geometry.
    source.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material)?.dispose?.();
      }
    });
  }

  update(sk: Skeleton, flash: number) {
    if (!this.ready) return;
    // The group is parented after load, so the scene is only reachable here.
    if (!this.lit) {
      const scene = this.group.parent ? this.group.parent : null;
      let root: THREE.Object3D | null = scene;
      while (root?.parent) root = root.parent;
      if (root) { ensureLights(root, this.light); this.lit = true; }
    }
    const place = (part: BodyPart, at: Joint, z: number, rot = 0) => {
      const g = this.parts.get(part);
      if (!g) return null;
      g.position.set(at.x, at.y, z);
      g.rotation.z = rot;
      return g;
    };
    const bone = (part: BodyPart, a: Joint, b: Joint, z: number, nominal: number, up = false) => {
      const g = place(part, a, z, Math.atan2(b.y - a.y, b.x - a.x) + (up ? -Math.PI / 2 : Math.PI / 2));
      if (g) g.scale.y = Math.hypot(b.x - a.x, b.y - a.y) / nominal;
    };

    const dx = sk.neck.x - sk.pelvis.x;
    const dy = sk.neck.y - sk.pelvis.y;
    const len = Math.hypot(dx, dy) || 1;
    const shoulder = {
      x: sk.neck.x - (dx / len) * BONES.shoulderDrop,
      y: sk.neck.y - (dy / len) * BONES.shoulderDrop,
    };

    place("pelvis", sk.pelvis, 29, -sk.torsoAngle * DEG * 0.5);
    bone("torso", sk.pelvis, sk.neck, 30, BONES.spine, true);
    bone("neck", sk.neck, sk.head, 33, BONES.neck, true);
    place("head", sk.head, 46, -sk.torsoAngle * DEG * 0.6);

    for (const suffix of ["F", "B"] as const) {
      const z = suffix === "F" ? 40 : 20;
      const knee = sk[`knee${suffix}`];
      const foot = sk[`foot${suffix}`];
      const toe = sk[`toe${suffix}`];
      const elbow = sk[`elbow${suffix}`];
      const hand = sk[`hand${suffix}`];
      bone(`thigh${suffix}` as BodyPart, sk.pelvis, knee, z, BONES.thigh);
      bone(`shin${suffix}` as BodyPart, knee, foot, z + 1, BONES.shin);
      place(`foot${suffix}` as BodyPart, foot, z + 2, Math.atan2(toe.y - foot.y, toe.x - foot.x));
      bone(`upperArm${suffix}` as BodyPart, shoulder, elbow, z + 2, BONES.upperArm);
      bone(`foreArm${suffix}` as BodyPart, elbow, hand, z + 3, BONES.foreArm);
      place(`hand${suffix}` as BodyPart, hand, z + 4, sk[`foreAngle${suffix}`] * DEG);
    }

    const white = new THREE.Color("white");
    const t = Math.min(1, Math.max(0, flash) / 8) * 0.8;
    for (const { material, base } of this.materials) material.color.copy(base).lerp(white, t);
  }

  dispose() {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    for (const { material } of this.materials) material.dispose();
    this.group.clear();
  }
}

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

/** Yaw off pure profile, so the model reads as a figure and not a cutout. */
const YAW = 0.8;

const BODY_PARTS = [
  "pelvis", "torso", "neck", "head",
  "thighF", "shinF", "footF", "upperArmF", "foreArmF", "handF",
  "thighB", "shinB", "footB", "upperArmB", "foreArmB", "handB",
] as const;
type BodyPart = (typeof BODY_PARTS)[number];

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
function tint(name: string | undefined, base: THREE.Color, palette?: FighterPalette): THREE.Color {
  if (!palette || !name) return base;
  const slot = name.toLowerCase();
  if (slot.includes("cloth") || slot.includes("crimson")) return new THREE.Color(palette.cloth);
  if (slot.includes("bronze") || slot.includes("gold")) return new THREE.Color(palette.accent);
  if (slot.includes("metal") || slot.includes("iron") || slot.includes("steel")) {
    return new THREE.Color(palette.metal);
  }
  if (slot.includes("linen")) return new THREE.Color(palette.body);
  return base;
}

/** Bake facet light into vertex colours, since the arena is unlit. */
function bakeShading(geo: THREE.BufferGeometry, lightDir: THREE.Vector3) {
  const normals = geo.getAttribute("normal");
  const colors = new Float32Array(normals.count * 3);
  const n = new THREE.Vector3();
  for (let i = 0; i < normals.count; i++) {
    const ndl = 0.5 + 0.5 * n.fromBufferAttribute(normals, i).normalize().dot(lightDir);
    const shade = 0.46 + 0.76 * ndl * ndl;
    colors.set([shade, shade, shade], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
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
  const lightDir = new THREE.Vector3(-0.4, 0.8, 0.65).normalize();

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
  const shared = new Map<string, THREE.MeshBasicMaterial>();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (spin) geo.rotateZ(spin);
    geo.scale(fit, Math.min(thin, fit * 2.2), fit);
    const src = o.material as THREE.MeshStandardMaterial;
    let mat = shared.get(src.uuid);
    if (!mat) {
      const base = tint(src.name, src.color?.clone() ?? new THREE.Color("#c8c8c8"), palette);
      if (light) base.lerp(new THREE.Color(light.key), (light.strength ?? 1) * 0.1);
      mat = new THREE.MeshBasicMaterial({ color: base, vertexColors: true });
      shared.set(src.uuid, mat);
    }
    bakeShading(geo, lightDir);
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
  private materials: { material: THREE.MeshBasicMaterial; base: THREE.Color }[] = [];
  ready = false;

  constructor(private id: string, private light?: StageLight) {
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
    const S = scalesFor(source);
    const lightDir = new THREE.Vector3(-0.4, 0.8, 0.65).normalize();
    const seen = new Map<string, { material: THREE.MeshBasicMaterial; base: THREE.Color }>();

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
        for (const child of joint.children) {
          if (!(child instanceof THREE.Mesh) || !include(child.name)) continue;
          child.updateMatrix();
          const geo = child.geometry.clone().applyMatrix4(child.matrix);
          geo.translate(0, -originY, 0);
          geo.scale(S.girth, lengthScale, S.girth);
          geo.rotateY(YAW);

          const src = child.material as THREE.MeshStandardMaterial;
          const key = src.uuid;
          let entry = seen.get(key);
          if (!entry) {
            const base = src.color?.clone() ?? new THREE.Color("#c8c8c8");
            if (this.light) {
              base.lerp(new THREE.Color(this.light.key), (this.light.strength ?? 1) * 0.1);
            }
            entry = { material: new THREE.MeshBasicMaterial({ color: base, vertexColors: true }), base };
            seen.set(key, entry);
            this.materials.push(entry);
          }

          bakeShading(geo, lightDir);
          group.add(new THREE.Mesh(geo, entry.material));
        }
      }
      this.parts.set(part, group);
      this.group.add(group);
    };

    const all = () => true;
    piece("pelvis", "Pelvis", (n) => !/^(Torso|Hip_|Knee_)/.test(n), 0, S.girth);
    piece("torso", "Torso", (n) => !/^(Shoulder_|Elbow_|Head|Neck)/.test(n), 0, S.spine);
    piece("neck", "Torso", (n) => n === "Neck", 0, S.neck);
    piece("head", "Head", all, 0, S.girth);
    for (const [suffix, side] of [["F", "L"], ["B", "R"]] as const) {
      piece(`thigh${suffix}` as BodyPart, `Hip_${side}`, (n) => !n.startsWith("Knee"),
            0, S.thigh);
      piece(`shin${suffix}` as BodyPart, `Knee_${side}`,
            (n) => !/^(Sandal|Foot|Boot|Shoe)/.test(n), 0, S.shin);
      piece(`foot${suffix}` as BodyPart, `Knee_${side}`,
            (n) => /^(Sandal|Foot|Boot|Shoe)/.test(n),
            // The foot mesh is authored down at the ankle, and it is then
            // placed at the foot joint too - so its own offset has to come off
            // first or the feet land a shin's length below the leg.
            S.girth > 2 ? -0.4725 : -BONES.shin, S.girth);
      piece(`upperArm${suffix}` as BodyPart, `Shoulder_${side}`, (n) => !n.startsWith("Elbow"),
            0, S.upperArm);
      piece(`foreArm${suffix}` as BodyPart, `Elbow_${side}`, (n) => !n.startsWith("Hand"),
            0, S.foreArm);
      piece(`hand${suffix}` as BodyPart, `Elbow_${side}`, (n) => n.startsWith("Hand"),
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

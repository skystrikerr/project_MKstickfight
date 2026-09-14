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
import type { StageLight } from "./shapes";

const DEG = Math.PI / 180;

/**
 * Bone lengths as the packs authored them. Every one of the 26 uses the same
 * figure, which is what makes a single loader possible - verified by reading
 * the joint matrices out of all 26 bodies, not assumed.
 *
 * They do not agree with BONES: the packs want x66.7 on a thigh and x49 on
 * hip height, so no uniform scale fits. Each bone is therefore stretched to
 * the length the simulation expects, which is the only version that keeps the
 * visible body matching the hurtbox.
 */
const AUTHORED = {
  upperArm: 0.33,
  foreArm: 0.31,
  thigh: 0.39,
  shin: 0.435,
  spine: 0.65,
  neck: 0.12,
} as const;

/**
 * Girth scale. Thickness is free where length is not, but it cannot drift far
 * from the length scales or the figure distorts: the bones stretch by 57-67x
 * here, so girth at 45 was making every limb about a third too thin and the
 * roster came out spindly.
 */
const GIRTH = 58;

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
          geo.scale(GIRTH, lengthScale, GIRTH);
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

          // Facet light baked into vertex colours, because the arena is unlit.
          // Wrapped across the full range rather than clamped at zero: a plain
          // max(0, n.l) leaves every face turned away from the key at one flat
          // value and a whole side of the model goes dead.
          const normals = geo.getAttribute("normal");
          const colors = new Float32Array(normals.count * 3);
          const n = new THREE.Vector3();
          for (let i = 0; i < normals.count; i++) {
            const ndl = 0.5 + 0.5 * n.fromBufferAttribute(normals, i).normalize().dot(lightDir);
            const shade = 0.46 + 0.76 * ndl * ndl;
            colors.set([shade, shade, shade], i * 3);
          }
          geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          group.add(new THREE.Mesh(geo, entry.material));
        }
      }
      this.parts.set(part, group);
      this.group.add(group);
    };

    const all = () => true;
    piece("pelvis", "Pelvis", (n) => !/^(Torso|Hip_|Knee_)/.test(n), 0, GIRTH);
    piece("torso", "Torso", (n) => !/^(Shoulder_|Elbow_|Head|Neck)/.test(n), 0,
          BONES.spine / AUTHORED.spine);
    piece("neck", "Torso", (n) => n === "Neck", 0, BONES.neck / AUTHORED.neck);
    piece("head", "Head", all, 0, GIRTH);
    for (const [suffix, side] of [["F", "L"], ["B", "R"]] as const) {
      piece(`thigh${suffix}` as BodyPart, `Hip_${side}`, (n) => !n.startsWith("Knee"),
            0, BONES.thigh / AUTHORED.thigh);
      piece(`shin${suffix}` as BodyPart, `Knee_${side}`,
            (n) => !/^(Sandal|Foot|Boot|Shoe)/.test(n), 0, BONES.shin / AUTHORED.shin);
      piece(`foot${suffix}` as BodyPart, `Knee_${side}`,
            (n) => /^(Sandal|Foot|Boot|Shoe)/.test(n), -0.4725, GIRTH);
      piece(`upperArm${suffix}` as BodyPart, `Shoulder_${side}`, (n) => !n.startsWith("Elbow"),
            0, BONES.upperArm / AUTHORED.upperArm);
      piece(`foreArm${suffix}` as BodyPart, `Elbow_${side}`, (n) => !n.startsWith("Hand"),
            0, BONES.foreArm / AUTHORED.foreArm);
      piece(`hand${suffix}` as BodyPart, `Elbow_${side}`, (n) => n.startsWith("Hand"),
            -AUTHORED.foreArm, GIRTH);
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

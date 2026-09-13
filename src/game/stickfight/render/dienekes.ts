/** The approved low-poly model, driven only by the existing combat skeleton. */
import * as THREE from "three";
import modelData from "../../../assets/models/dienekes.json";
import { BONES, type Joint, type Skeleton } from "../skeleton";
import type { FighterDef } from "../types";
import type { StageLight } from "./shapes";

type Attachment = { x: number; y: number; rot: number };
const DEG = Math.PI / 180;
const YAW = 0.8;
export const DIENEKES_MODEL_PROPS = new Set(["helm", "aspis", "dory", "cloak", "cuirass", "greaveF", "greaveB"]);

export class DienekesModel {
  readonly group = new THREE.Group();
  private parts: Record<string, THREE.Group> = {};
  private armor: THREE.Group[] = [];
  private materials = new Map<string, { material: THREE.MeshBasicMaterial; base: THREE.Color }>();

  constructor(def: FighterDef, light?: StageLight) {
    this.group.name = "DienekesModel";
    const source = new THREE.ObjectLoader().parse(modelData);
    const lightDir = new THREE.Vector3(-0.4, 0.8, 0.65).normalize();
    const piece = (name: string, parent: string, include: (name: string) => boolean,
      origin: [number, number, number], scale: [number, number, number], yaw = YAW) => {
      const result = new THREE.Group();
      result.name = `dienekes:${name}`;
      const original = source.getObjectByName(parent);
      if (!original) throw new Error(`Missing Dienekes model part: ${parent}`);
      for (const child of original.children) {
        if (!(child instanceof THREE.Mesh) || !include(child.name)) continue;
        child.updateMatrix();
        const geometry = child.geometry.clone().applyMatrix4(child.matrix);
        geometry.translate(-origin[0], -origin[1], -origin[2]);
        geometry.scale(...scale);
        geometry.rotateY(yaw);
        const originalMaterial = child.material as THREE.MeshStandardMaterial;
        let entry = this.materials.get(originalMaterial.uuid);
        if (!entry) {
          const base = originalMaterial.color.clone();
          if (originalMaterial.name === "crimson") base.set(def.palette.cloth);
          if (originalMaterial.name === "redHighlight") base.set(def.palette.cloth).lerp(new THREE.Color("white"), 0.18);
          if (originalMaterial.name === "bronze") base.set(def.palette.metal);
          if (light) base.lerp(new THREE.Color(light.key), (light.strength ?? 1) * 0.1);
          const material = new THREE.MeshBasicMaterial({ color: base, vertexColors: true });
          entry = { material, base };
          this.materials.set(originalMaterial.uuid, entry);
        }
        // Facet lighting is baked so this mesh works with the game's unlit stage.
        const normals = geometry.getAttribute("normal");
        const colors = new Float32Array(normals.count * 3);
        const normal = new THREE.Vector3();
        for (let i = 0; i < normals.count; i++) {
          const shade = 0.6 + 0.4 * Math.max(0, normal.fromBufferAttribute(normals, i).normalize().dot(lightDir));
          colors.set([shade, shade, shade], i * 3);
        }
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const mesh = new THREE.Mesh(geometry, entry.material);
        mesh.name = child.name;
        result.add(mesh);
      }
      this.parts[name] = result;
      this.group.add(result);
      return result;
    };
    const all = () => true;
    piece("pelvis", "Pelvis", n => n === "Tunic", [0, 0, 0], [45, 45, 45]);
    this.armor.push(piece("skirt", "Pelvis", n => n.startsWith("FrontPteruges"), [0, 0, 0], [45, 45, 45]));
    this.armor.push(piece("torso", "Torso", n => n !== "Neck", [0, -0.21, 0], [45, BONES.spine / 0.65, 45]));
    piece("neck", "Torso", n => n === "Neck", [0, 0.46, 0], [45, BONES.neck / 0.12, 45]);
    piece("face", "Head", n => n === "Face", [0, 0, 0], [50, 50, 50]);
    piece("helm", "Head", n => n !== "Face", [0, 0, 0], [50, 50, 50]);
    piece("cloak", "Cape", all, [0, 0, 0], [45, 50, 45]);
    // A modest under-tunic keeps the body intact when cuirass stripping occurs.
    const underbody = new THREE.Group();
    underbody.name = "dienekes:underbody";
    const vestMaterial = new THREE.MeshBasicMaterial({ color: def.palette.body });
    this.materials.set("underbody", { material: vestMaterial, base: new THREE.Color(def.palette.body) });
    const vest = new THREE.Mesh(new THREE.BoxGeometry(21, 30, 11), vestMaterial);
    vest.position.y = 14;
    underbody.add(vest);
    this.group.add(underbody);
    this.parts.underbody = underbody;
    for (const [side, suffix] of [["L", "F"], ["R", "B"]] as const) {
      piece(`thigh${suffix}`, `Hip_${side}`, all, [0, 0, 0], [45, BONES.thigh / 0.39, 45]);
      piece(`shin${suffix}`, `Knee_${side}`, n => n.startsWith("Shin"), [0, 0, 0], [45, BONES.shin / 0.435, 45]);
      piece(`greave${suffix}`, `Knee_${side}`, n => n.startsWith("Greave"), [0, 0, 0], [45, BONES.shin / 0.435, 45]);
      piece(`foot${suffix}`, `Knee_${side}`, n => /^(Sandal|Foot)/.test(n), [0, -0.4725, 0], [40, 40, 40], Math.PI / 2);
      piece(`upperArm${suffix}`, `Shoulder_${side}`, all, [0, 0, 0], [45, BONES.upperArm / 0.33, 45]);
      piece(`foreArm${suffix}`, `Elbow_${side}`, n => !n.startsWith("Hand"), [0, 0, 0], [45, BONES.foreArm / 0.33, 45]);
      piece(`hand${suffix}`, `Elbow_${side}`, n => n.startsWith("Hand"), [0, -0.33, 0], [45, 45, 45]);
    }
    piece("aspis", "Dienekes_Shield", all, [0, 0, 0], [27 / 0.47, 27 / 0.47, 35], 0);
    const spear = piece("dory", "Dienekes_Spear", all, [0, 0, 0], [85, 1, 40], 0);
    // Keep the existing dory's authored tip (+116), butt (-56), and grip (+2).
    for (const child of spear.children) {
      const geometry = (child as THREE.Mesh).geometry;
      const position = geometry.getAttribute("position");
      for (let i = 0; i < position.count; i++) {
        const y = position.getY(i);
        position.setY(i, y * (y >= 0 ? 114 / 1.64 : 58 / 1.105) + 2);
      }
      geometry.rotateZ(-Math.PI / 2);
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
    // Parsed originals are temporary; each runtime piece owns its geometry.
    source.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    const originals = new Set<THREE.Material>();
    source.traverse(o => { if (o instanceof THREE.Mesh) originals.add(o.material as THREE.Material); });
    originals.forEach(material => material.dispose());
  }

  update(sk: Skeleton, hidden: Set<string>, flash: number, shield: Attachment, spear: Attachment, speed = 0) {
    const place = (name: string, point: Joint, z: number, rotation = 0) => {
      const part = this.parts[name];
      part.position.set(point.x, point.y, z);
      part.rotation.z = rotation;
      return part;
    };
    const bone = (name: string, a: Joint, b: Joint, z: number, nominal: number, up = false) => {
      const part = place(name, a, z, Math.atan2(b.y - a.y, b.x - a.x) + (up ? -Math.PI / 2 : Math.PI / 2));
      part.scale.y = Math.hypot(b.x - a.x, b.y - a.y) / nominal;
    };
    const dx = sk.neck.x - sk.pelvis.x, dy = sk.neck.y - sk.pelvis.y;
    const length = Math.hypot(dx, dy) || 1;
    const shoulder = { x: sk.neck.x - dx / length * BONES.shoulderDrop, y: sk.neck.y - dy / length * BONES.shoulderDrop };
    place("pelvis", sk.pelvis, 29, -sk.torsoAngle * DEG * 0.5);
    place("skirt", sk.pelvis, 30, -sk.torsoAngle * DEG * 0.5);
    bone("torso", sk.pelvis, sk.neck, 30, BONES.spine, true);
    bone("underbody", sk.pelvis, sk.neck, 29, BONES.spine, true);
    this.parts.underbody.visible = hidden.has("cuirass");
    bone("neck", sk.neck, sk.head, 33, BONES.neck, true);
    place("face", sk.head, 46, -sk.torsoAngle * DEG * 0.6);
    place("helm", sk.head, 46, -sk.torsoAngle * DEG * 0.6);
    place("cloak", { x: sk.neck.x, y: sk.neck.y - 3 }, 13, (-sk.torsoAngle + Math.max(-10, Math.min(10, speed * 1.5))) * DEG);
    for (const suffix of ["F", "B"] as const) {
      const z = suffix === "F" ? 40 : 20;
      const knee = sk[`knee${suffix}`], foot = sk[`foot${suffix}`], toe = sk[`toe${suffix}`];
      const elbow = sk[`elbow${suffix}`], hand = sk[`hand${suffix}`];
      bone(`thigh${suffix}`, sk.pelvis, knee, z, BONES.thigh);
      bone(`shin${suffix}`, knee, foot, z + 1, BONES.shin);
      bone(`greave${suffix}`, knee, foot, z + 2, BONES.shin);
      place(`foot${suffix}`, foot, z + 2, Math.atan2(toe.y - foot.y, toe.x - foot.x));
      bone(`upperArm${suffix}`, shoulder, elbow, z + 2, BONES.upperArm);
      bone(`foreArm${suffix}`, elbow, hand, z + 3, BONES.foreArm);
      place(`hand${suffix}`, hand, z + 4, sk[`foreAngle${suffix}`] * DEG);
    }
    const a = shield.rot * DEG;
    place("aspis", { x: shield.x + Math.cos(a) * 15, y: shield.y + Math.sin(a) * 15 }, 55, a);
    place("dory", spear, 24, spear.rot * DEG);
    for (const name of ["helm", "aspis", "dory", "cloak", "greaveF", "greaveB"]) this.parts[name].visible = !hidden.has(name);
    for (const part of this.armor) part.visible = !hidden.has("cuirass");
    for (const { material, base } of this.materials.values()) material.color.copy(base).lerp(new THREE.Color("white"), Math.min(1, Math.max(0, flash) / 8) * 0.8);
  }

  dispose() {
    this.group.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    for (const { material } of this.materials.values()) material.dispose();
    this.group.clear();
  }
}

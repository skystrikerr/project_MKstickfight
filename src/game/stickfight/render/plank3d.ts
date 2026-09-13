/** Experimental, textured-material-ready 3D fighter. No combat rules live here. */
import * as THREE from "three";

export type MaterialSlot = "cloth" | "trim" | "leather" | "metal" | "skin";
export type PreviewPose = "idle" | "walk" | "guard" | "strike";

export interface PlankFighter3D {
  root: THREE.Group;
  materials: Record<MaterialSlot, THREE.MeshStandardMaterial>;
  setPose: (pose: PreviewPose, seconds: number) => void;
  setTexture: (slot: MaterialSlot, texture: THREE.Texture) => void;
  dispose: () => void;
}

/** All pieces use UV-bearing Three.js geometry. Maps can be added without remeshing. */
export function createPlankFighter3D(): PlankFighter3D {
  const materials: Record<MaterialSlot, THREE.MeshStandardMaterial> = {
    cloth: new THREE.MeshStandardMaterial({ color: 0x8f3026, roughness: 0.94, flatShading: true }),
    trim: new THREE.MeshStandardMaterial({ color: 0xe2b25e, roughness: 0.6, metalness: 0.32, flatShading: true }),
    leather: new THREE.MeshStandardMaterial({ color: 0x3b2b24, roughness: 0.96, flatShading: true }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9a9da0, roughness: 0.47, metalness: 0.65, flatShading: true }),
    skin: new THREE.MeshStandardMaterial({ color: 0xc89373, roughness: 0.85, flatShading: true }),
  };
  const root = new THREE.Group();
  root.name = "PlankFighter3D";
  const geometries: THREE.BufferGeometry[] = [];
  const box = (parent: THREE.Object3D, w: number, h: number, d: number, slot: MaterialSlot, x: number, y: number, z = 0) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, materials[slot]);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (parent: THREE.Object3D, top: number, bottom: number, height: number, slot: MaterialSlot, x: number, y: number, z = 0, sides = 8) => {
    const geometry = new THREE.CylinderGeometry(top, bottom, height, sides);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, materials[slot]);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const body = new THREE.Group();
  body.position.y = 1.08;
  root.add(body);
  box(body, 0.65, 0.73, 0.35, "cloth", 0, 0.24);
  box(body, 0.72, 0.13, 0.38, "leather", 0, -0.11, 0.02);
  box(body, 0.75, 0.3, 0.4, "cloth", 0, -0.31);
  box(body, 0.1, 0.45, 0.045, "trim", 0, 0.27, 0.205);
  for (const side of [-1, 1]) {
    box(body, 0.24, 0.2, 0.4, "metal", side * 0.33, 0.55);
    box(body, 0.12, 0.2, 0.06, "trim", side * 0.23, -0.13, 0.24);
  }

  const head = new THREE.Group();
  head.position.set(0, 0.77, 0);
  body.add(head);
  box(head, 0.32, 0.35, 0.3, "skin", 0, 0.02, 0.015);
  cylinder(head, 0.22, 0.2, 0.19, "metal", 0, 0.24);
  box(head, 0.48, 0.055, 0.39, "trim", 0, 0.155, 0.025);
  box(head, 0.09, 0.24, 0.08, "cloth", 0, 0.38);
  box(head, 0.23, 0.06, 0.08, "cloth", -0.08, 0.45);

  const arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.4, 0.5, 0);
    body.add(arm);
    box(arm, 0.21, 0.42, 0.22, "cloth", side * 0.02, -0.21);
    box(arm, 0.24, 0.16, 0.25, "metal", side * 0.02, -0.48);
    const forearm = new THREE.Group();
    forearm.position.y = -0.47;
    arm.add(forearm);
    box(forearm, 0.17, 0.4, 0.19, "skin", 0, -0.2);
    box(forearm, 0.2, 0.23, 0.24, "leather", 0, -0.17);
    box(forearm, 0.18, 0.15, 0.2, "skin", 0, -0.46);
    if (side < 0) {
      const shield = new THREE.Group();
      shield.position.set(-0.03, -0.27, 0.22);
      forearm.add(shield);
      box(shield, 0.5, 0.72, 0.07, "leather", 0, 0);
      box(shield, 0.4, 0.6, 0.045, "cloth", 0, 0, 0.05);
      box(shield, 0.07, 0.58, 0.05, "trim", 0, 0, 0.087);
      box(shield, 0.37, 0.055, 0.05, "trim", 0, 0, 0.09);
    }
    arms.push(arm);
  }

  const legs: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.18, 0.82, 0);
    root.add(leg);
    box(leg, 0.24, 0.42, 0.27, "cloth", 0, -0.21);
    const shin = new THREE.Group();
    shin.position.y = -0.42;
    leg.add(shin);
    box(shin, 0.2, 0.39, 0.23, "leather", 0, -0.2);
    box(shin, 0.23, 0.13, 0.36, "leather", 0, -0.45, 0.08);
    legs.push(leg);
  }

  const setPose = (pose: PreviewPose, seconds: number) => {
    const cycle = Math.sin(seconds * 7);
    body.position.y = 1.08 + (pose === "walk" ? Math.abs(cycle) * 0.03 : Math.sin(seconds * 2) * 0.009);
    body.rotation.z = pose === "strike" ? -0.12 : pose === "walk" ? cycle * 0.035 : Math.sin(seconds * 1.4) * 0.009;
    head.rotation.z = -body.rotation.z * 0.3;
    arms[0].rotation.x = pose === "guard" ? -0.8 : pose === "walk" ? cycle * 0.3 : 0.08;
    arms[1].rotation.x = pose === "guard" ? -0.65 : pose === "walk" ? -cycle * 0.3 : pose === "strike" ? -1.1 + Math.sin(seconds * 5) * 0.13 : -0.08;
    arms[0].rotation.z = pose === "guard" ? -0.16 : -0.06;
    arms[1].rotation.z = pose === "guard" ? 0.2 : 0.06;
    legs[0].rotation.x = pose === "walk" ? -cycle * 0.42 : 0;
    legs[1].rotation.x = pose === "walk" ? cycle * 0.42 : 0;
  };

  const setTexture = (slot: MaterialSlot, texture: THREE.Texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = materials[slot];
    material.map = texture;
    material.needsUpdate = true;
  };
  const dispose = () => {
    geometries.forEach((geometry) => geometry.dispose());
    Object.values(materials).forEach((material) => material.dispose());
  };
  setPose("idle", 0);
  return { root, materials, setPose, setTexture, dispose };
}

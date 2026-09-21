/**
 * The presentation layer for modelled fighters: outline, ramp, and how much
 * of the frame they are allowed to own.
 *
 * The models were dropped into a scene built for flat ink art and lit as if
 * they were going to carry a realistic look on their own. They cannot - they
 * are prototype meshes of tubes and lofted boxes, and no light rig turns those
 * into sculpted characters. What the meshes CAN carry is a deliberate
 * stylisation, and the two things that separate "stylised" from "untextured
 * prototype" are both cheap:
 *
 *   an outline, so the silhouette survives a painted backdrop
 *   a banded ramp, so a form reads as shaped rather than smoothly grey
 *
 * Both are the standard answer for 3D characters over 2D art - Xrd and FighterZ
 * are the same two tricks - and neither needs a single new model. The flat rigs
 * already had outlines; that is exactly what was lost in the switch, and why
 * the roster went from "crisp but flat" to "soft and flat".
 */

import * as THREE from "three";

export type Look = "lit" | "inked";

let look: Look = "inked";

/** Swap presentation. `lit` is the pre-outline renderer, kept for A/B shots. */
export function setLook(next: Look) {
  look = next;
}

export function currentLook(): Look {
  return look;
}

/**
 * Line weight, in game units.
 *
 * A fighter stands 108 units tall and the camera shows roughly 350 units of
 * height across 720 lines, so one unit is about two pixels: 0.85 is a line a
 * little under two pixels wide, which is what reads as drawn rather than as a
 * black halo.
 */
const INK = 2.1;
const INK_COLOR = 0x140e0a;

/**
 * Three bands and a hard edge between them.
 *
 * A continuous ramp on an untextured mesh gives a smooth grey gradient, which
 * is exactly the plastic look. Quantising it puts a definite terminator on
 * every limb, and a definite terminator is the thing the eye reads as form.
 */
let ramp: THREE.DataTexture | null = null;
function gradientMap(): THREE.DataTexture {
  if (ramp) return ramp;
  const steps = new Uint8Array([64, 58, 56, 255, 150, 143, 136, 255, 255, 249, 238, 255]);
  ramp = new THREE.DataTexture(steps, 3, 1, THREE.RGBAFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

/**
 * Light levels for the ramp.
 *
 * The lit rig ran key 1.55 against a 1.35 hemisphere fill - over 2.0 of light
 * before a rim was added, which is fine on a smooth material and fatal under a
 * ramp: everything saturates into the top band and the banding never appears.
 * Under a ramp the fill has to leave room for the shadow band to exist.
 */
export const LIGHTS = () => look === "inked"
  ? { key: 1.05, fill: 0.42, rim: 0.55 }
  : { key: 1.55, fill: 1.35, rim: 0.42 };

/**
 * A toon material carrying over what the standard one was showing.
 *
 * Colour and map only: roughness and metalness have no meaning under a ramp,
 * and the packs set them to prototype defaults anyway.
 */
export function toonify(src: THREE.MeshStandardMaterial): THREE.Material {
  if (look === "lit") return src;
  const mat = new THREE.MeshToonMaterial({
    color: src.color.clone(),
    map: src.map ?? null,
    gradientMap: gradientMap(),
    transparent: src.transparent,
    opacity: src.opacity,
    side: src.side,
  });
  mat.name = src.name;
  return mat;
}

/**
 * The silhouette pass: the same geometry pushed out along its own normals and
 * drawn back-faces-only, so it survives behind the fighter as a line.
 *
 * Done on the geometry rather than by scaling a copy of the mesh, because
 * these parts are positioned by the rig - scaling a limb group moves it away
 * from its joint, while pushing vertices leaves every origin where it was.
 *
 * Returns null when the geometry has no normals to push along, and in `lit`.
 */
export function outlineFor(geo: THREE.BufferGeometry): THREE.Mesh | null {
  if (look === "lit") return null;
  const pos = geo.getAttribute("position");
  const nrm = geo.getAttribute("normal");
  if (!pos || !nrm) return null;

  const shell = geo.clone();
  const p = shell.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(
      i,
      p.getX(i) + nrm.getX(i) * INK,
      p.getY(i) + nrm.getY(i) * INK,
      p.getZ(i) + nrm.getZ(i) * INK,
    );
  }
  p.needsUpdate = true;
  shell.deleteAttribute("uv");

  const mesh = new THREE.Mesh(
    shell,
    new THREE.MeshBasicMaterial({ color: INK_COLOR, side: THREE.BackSide }),
  );
  mesh.name = "ink";
  return mesh;
}

/**
 * How much of the frame the fighters are allowed to own.
 *
 * The camera was tuned for flat ink figures, which read fine small because a
 * flat figure has no detail to lose. A modelled one does, and at the shipped
 * framing a fighter is about 31% of frame height - against roughly 45-55% in
 * the genre. Everything the models have is being thrown away by the zoom
 * before shading ever gets a chance.
 */
let framing = 1;

export function setFraming(scale: number) {
  framing = scale;
}

export function frameScale(): number {
  return framing;
}

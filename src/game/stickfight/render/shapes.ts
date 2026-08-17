/**
 * Shape builders for the fighter rig.
 *
 * The look is a classic inked stick figure: limbs are thin strokes that taper
 * slightly towards the far end, the head is an open circle, and the hands and
 * feet are solid blobs. Everything a fighter wears sits on top of that as a
 * prop, so the costume carries the colour and the body stays ink.
 */

import * as THREE from "three";

const CAP_SEGMENTS = 7;

export interface ShadeOptions {
  /** Base colour of the limb. */
  color: THREE.ColorRepresentation;
  /** How much lighter the top edge gets, 0..1. */
  highlight?: number;
  /** How much darker the bottom edge gets, 0..1. */
  shade?: number;
}

/** Applies a light-to-dark gradient across the shape's local y axis. */
function shadeGeometry(geo: THREE.BufferGeometry, opts: ShadeOptions) {
  const pos = geo.getAttribute("position");
  const base = new THREE.Color(opts.color);
  const light = base.clone().lerp(new THREE.Color("#ffffff"), opts.highlight ?? 0.22);
  const dark = base.clone().lerp(new THREE.Color("#000000"), opts.shade ?? 0.3);

  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const minY = bb.min.y;
  const spanY = Math.max(0.0001, bb.max.y - minY);

  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - minY) / spanY;
    // Slightly biased so the lit band sits above the middle.
    c.copy(dark).lerp(light, Math.pow(t, 0.8));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/**
 * A limb: runs along +x from the origin to (len, 0), with rounded ends of
 * different radii. `grow` inflates both ends evenly for the outline pass.
 */
export function limbGeometry(
  len: number,
  rStart: number,
  rEnd: number,
  grow = 0,
  shade?: ShadeOptions,
): THREE.BufferGeometry {
  const r1 = rStart + grow;
  const r2 = rEnd + grow;
  const shape = new THREE.Shape();

  // Tangent angle so the sides meet both circles cleanly on a taper.
  const dr = r1 - r2;
  const phi = Math.asin(Math.max(-1, Math.min(1, dr / Math.max(len, 0.001))));

  shape.absarc(0, 0, r1, Math.PI / 2 + phi, (Math.PI * 3) / 2 - phi, false);
  shape.absarc(len, 0, r2, (Math.PI * 3) / 2 - phi, Math.PI / 2 + phi, false);
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape, CAP_SEGMENTS);
  if (shade) shadeGeometry(geo, shade);
  return geo;
}

/**
 * A hand: a solid blob swelling off the end of the forearm, fatter than the
 * stroke that feeds it and slightly egg-shaped so a fist reads as a fist.
 * Points along +x from the wrist.
 */
export function handGeometry(size: number, grow = 0, shade?: ShadeOptions): THREE.BufferGeometry {
  const s = size + grow;
  const shape = new THREE.Shape();
  shape.moveTo(-s * 0.35, -s * 0.5);
  shape.quadraticCurveTo(s * 0.85, -s * 1.02, s * 1.12, -s * 0.18);
  shape.quadraticCurveTo(s * 1.3, s * 0.72, s * 0.35, s * 0.94);
  shape.quadraticCurveTo(-s * 0.55, s * 1.02, -s * 0.62, s * 0.16);
  shape.quadraticCurveTo(-s * 0.66, -s * 0.24, -s * 0.35, -s * 0.5);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 10);
  if (shade) shadeGeometry(geo, shade);
  return geo;
}

/**
 * A foot: a solid teardrop lying along the floor, blunt at the heel and drawn
 * out to a rounded toe. Runs along +x from the ankle.
 */
export function bootGeometry(len: number, height: number, grow = 0, shade?: ShadeOptions): THREE.BufferGeometry {
  const g = grow;
  const h = height * 0.5 + g;
  const shape = new THREE.Shape();
  shape.moveTo(-h * 0.9, h * 0.15);
  shape.quadraticCurveTo(-h * 1.15, -h * 0.95, h * 0.2, -h * 0.98);
  shape.quadraticCurveTo(len * 0.75, -h * 1.05, len + g, -h * 0.35);
  shape.quadraticCurveTo(len * 1.06 + g, h * 0.34, len * 0.62, h * 0.5);
  shape.quadraticCurveTo(h * 0.5, h * 0.72, -h * 0.9, h * 0.15);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 10);
  if (shade) shadeGeometry(geo, shade);
  return geo;
}

/**
 * A head: a plain circle. `grow` inflates it for the ink ring drawn behind.
 */
export function headGeometry(r: number, grow = 0, shade?: ShadeOptions): THREE.BufferGeometry {
  const geo = new THREE.CircleGeometry(r + grow, 26);
  if (shade) shadeGeometry(geo, shade);
  return geo;
}

/** The ink ring around the head - the open circle of a stick figure. */
export function headRingGeometry(r: number, thickness: number): THREE.BufferGeometry {
  return new THREE.RingGeometry(r - thickness * 0.5, r + thickness * 0.5, 30);
}

/** Reusable flat material. Set `vertexColors` for shaded limb geometry. */
export function rigMaterial(
  color: THREE.ColorRepresentation,
  opts: { vertexColors?: boolean; opacity?: number } = {},
): THREE.MeshBasicMaterial {
  const translucent = (opts.opacity ?? 1) < 1;
  return new THREE.MeshBasicMaterial({
    color,
    vertexColors: opts.vertexColors ?? false,
    transparent: translucent,
    opacity: opts.opacity ?? 1,
    depthTest: true,
    depthWrite: !translucent,
    side: THREE.DoubleSide,
  });
}

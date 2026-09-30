// Blue Murder: a battered state-police interceptor sedan with a spiked ram,
// wire cages over the glass and a caged light bar on the roof.
//
// Everything is built procedurally from three.js primitives plus one painted
// 2048x2048 livery atlas, so the car can be regenerated or re-tuned from code.
// Units are metres, +Y is up and the car faces +Z (the glTF model-front axis,
// which is also Godot's MODEL_FRONT). Each wheel is its own node with its
// origin on the axle so the game can spin and steer it.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  box, extrudeProfile, makeSteelTexture, makeWireTexture, merged, place, poly, quad, rng, sidePanel, spike,
  stencilText, tube,
} from "./kit.js";

// ---------------------------------------------------------------- dimensions
const BODY_HW = 0.99; // half width of the lower body
const FRONT_AXLE = 1.5;
const REAR_AXLE = -1.41;
const AXLE_Y = 0.36;
const WHEEL_R = 0.36;
const ARCH_R = 0.47;
const TRACK_HW = 0.8;
const CABIN_BASE_HW = 0.92;
const CABIN_TOP_TAPER = 0.24; // fraction the cabin narrows from belt to roof
const BELT_Y = 0.9;
const ROOF_Y = 1.46;

// Atlas layout (canvas pixels, origin top-left; the texture uses flipY=false
// so v grows downwards exactly like the canvas).
const ATLAS = 2048;
const SPAN_Z = 2.9; // side/top regions cover z in [-2.9, 2.9]
const SIDE_S = ATLAS / (2 * SPAN_Z); // px per metre
const SIDE_H = 1.6 * SIDE_S;
const LEFT_Y0 = 0;
const RIGHT_Y0 = 640;
const TOP_Y0 = 1280;
const TOP_H = 512;
const TOP_SPAN_X = 1.1;
const END_Y0 = 1792;
const END_H = 256;
const END_W = 1024;
const END_S_X = END_W / (2 * TOP_SPAN_X);
const END_S_Y = END_H / 1.6;

const cabinHW = (y) => CABIN_BASE_HW * (1 - CABIN_TOP_TAPER * THREE.MathUtils.clamp((y - BELT_Y) / (ROOF_Y - BELT_Y), 0, 1));

// ---------------------------------------------------------------- livery atlas
// Side views: world (z, y) -> canvas px. Left side is seen from -X, so the
// nose is on the right; right side is seen from +X, so the nose is on the left.
function sidePx(side, z, y) {
  const x = side === "L" ? (z + SPAN_Z) * SIDE_S : (SPAN_Z - z) * SIDE_S;
  const y0 = side === "L" ? LEFT_Y0 : RIGHT_Y0;
  return [x, y0 + (1.6 - y) * SIDE_S];
}
function topPx(z, x) {
  return [(z + SPAN_Z) * SIDE_S, TOP_Y0 + ((x + TOP_SPAN_X) / (2 * TOP_SPAN_X)) * TOP_H];
}
function endPx(end, x, y) {
  const px = end === "F" ? (x + TOP_SPAN_X) * END_S_X : END_W + (TOP_SPAN_X - x) * END_S_X;
  return [px, END_Y0 + (1.6 - y) * END_S_Y];
}

const BLUE = "#2f4f7e";
const BLUE_DARK = "#1f3558";
const WHITE = "#e4e2d8";
const GLASS = "#10151c";
const TRIM = "#1a1a1c";

function drawSkull(ctx, cx, cy, size, flip) {
  // A fanged, cracked skull in the style of the door art: grey bone, black
  // sockets, drawn in pixel space so it never gets mirrored.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flip ? -size : size, size);
  ctx.lineJoin = "round";
  // shadowed outline
  ctx.fillStyle = "#1b1b1d";
  ctx.beginPath();
  ctx.ellipse(0, -0.12, 0.56, 0.52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-0.36, 0.1, 0.72, 0.5);
  // cranium
  const bone = ctx.createLinearGradient(-0.5, -0.6, 0.5, 0.6);
  bone.addColorStop(0, "#c9c7c0");
  bone.addColorStop(1, "#6f6d6a");
  ctx.fillStyle = bone;
  ctx.beginPath();
  ctx.ellipse(0, -0.14, 0.5, 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
  // cheek/jaw block
  ctx.beginPath();
  ctx.moveTo(-0.42, 0.05);
  ctx.lineTo(0.42, 0.05);
  ctx.lineTo(0.3, 0.52);
  ctx.lineTo(-0.3, 0.52);
  ctx.closePath();
  ctx.fill();
  // eye sockets, angry slant
  ctx.fillStyle = "#0b0b0c";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 0.06, -0.06);
    ctx.lineTo(s * 0.4, -0.2);
    ctx.quadraticCurveTo(s * 0.42, 0.08, s * 0.2, 0.12);
    ctx.quadraticCurveTo(s * 0.05, 0.1, s * 0.06, -0.06);
    ctx.fill();
  }
  // nose
  ctx.beginPath();
  ctx.moveTo(0, 0.14);
  ctx.lineTo(-0.08, 0.3);
  ctx.lineTo(0.08, 0.3);
  ctx.closePath();
  ctx.fill();
  // teeth
  ctx.fillRect(-0.3, 0.36, 0.6, 0.12);
  ctx.fillStyle = "#d8d6cf";
  for (let i = 0; i < 6; i++) {
    const x = -0.28 + i * 0.095;
    ctx.beginPath();
    ctx.moveTo(x, 0.35);
    ctx.lineTo(x + 0.08, 0.35);
    ctx.lineTo(x + 0.04, i === 1 || i === 4 ? 0.5 : 0.44);
    ctx.closePath();
    ctx.fill();
  }
  // crack
  ctx.strokeStyle = "#2a2a2c";
  ctx.lineWidth = 0.025;
  ctx.beginPath();
  ctx.moveTo(0.05, -0.58);
  ctx.lineTo(0.12, -0.42);
  ctx.lineTo(0.02, -0.3);
  ctx.lineTo(0.1, -0.18);
  ctx.stroke();
  ctx.restore();
}

function paintSide(ctx, side) {
  const m = (z, y) => sidePx(side, z, y);
  // below-body band stays dark: underside faces sample it
  const [, gTop] = m(0, 0.2);
  const y0 = side === "L" ? LEFT_Y0 : RIGHT_Y0;
  ctx.fillStyle = "#121212";
  ctx.fillRect(0, gTop, ATLAS, y0 + 640 - gTop);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, y0, ATLAS, gTop - y0);

  // white rear door (the black-and-white pattern, in blue), as on the card
  ctx.fillStyle = WHITE;
  poly(ctx, m, [[-0.36, 0.21], [-0.36, 0.95], [-1.3, 0.95], [-1.3, 0.21]]);
  ctx.fill();
  // cabin above the belt is white; the glass is painted over it
  poly(ctx, m, [[1.1, 0.88], [1.1, 1.62], [-1.6, 1.62], [-1.6, 0.88]]);
  ctx.fill();

  // side glass
  ctx.fillStyle = GLASS;
  poly(ctx, m, [[0.8, 0.97], [0.14, 1.36], [-0.32, 1.37], [-0.32, 0.97]]);
  ctx.fill();
  poly(ctx, m, [[-0.43, 0.97], [-0.43, 1.37], [-0.84, 1.37], [-0.98, 1.2], [-0.98, 0.97]]);
  ctx.fill();
  poly(ctx, m, [[-1.05, 0.97], [-1.05, 1.13], [-1.24, 0.97]]);
  ctx.fill();
  // glint
  ctx.strokeStyle = "rgba(160,190,220,0.25)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(...m(0.55, 1.02));
  ctx.lineTo(...m(0.2, 1.3));
  ctx.stroke();

  // black body-side rubbing strip
  ctx.fillStyle = TRIM;
  poly(ctx, m, [[2.62, 0.5], [2.62, 0.56], [-2.62, 0.56], [-2.62, 0.5]]);
  ctx.fill();
  // rocker panel shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  poly(ctx, m, [[2.6, 0.2], [2.6, 0.28], [-2.6, 0.28], [-2.6, 0.2]]);
  ctx.fill();

  // panel seams and handles
  ctx.strokeStyle = "#141414";
  ctx.lineWidth = 3;
  for (const pts of [
    [[0.95, 0.23], [0.95, 0.93], [0.82, 0.97]],
    [[-0.36, 0.23], [-0.36, 1.38]],
    [[-1.3, 0.5], [-1.3, 0.93], [-1.02, 0.97]],
    [[1.85, 0.9], [2.62, 0.86]], // hood shut line
    [[-1.4, 0.93], [-2.6, 0.93]], // trunk shut line
  ]) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...m(...p)) : ctx.moveTo(...m(...p))));
    ctx.stroke();
  }
  ctx.fillStyle = "#2a2a2a";
  for (const z of [0.08, -1.12]) {
    poly(ctx, m, [[z, 0.8], [z, 0.84], [z - 0.16, 0.84], [z - 0.16, 0.8]]);
    ctx.fill();
  }
  // fuel door on the right rear quarter
  if (side === "R") {
    ctx.strokeStyle = "#1c2c47";
    const [fx, fy] = m(-1.95, 0.74);
    ctx.strokeRect(fx - 22, fy - 22, 44, 44);
  }
  // indicator/marker lights
  ctx.fillStyle = "#c77a1c";
  poly(ctx, m, [[2.5, 0.6], [2.5, 0.66], [2.38, 0.66], [2.38, 0.6]]);
  ctx.fill();
  ctx.fillStyle = "#8a1a16";
  poly(ctx, m, [[-2.48, 0.6], [-2.48, 0.66], [-2.36, 0.66], [-2.36, 0.6]]);
  ctx.fill();

  // STATE POLICE across the blue front door
  const flip = side === "R";
  const [tx, ty] = m(0.3, 0.7);
  stencilText(ctx, "STATE POLICE", tx, ty, 62, WHITE, 1.12 * SIDE_S, "#0d1a30");
  // HWY PATROL over a skull on the white rear door
  const [hx, hy] = m(-0.83, 0.83);
  stencilText(ctx, "HWY PATROL", hx, hy, 30, BLUE_DARK, 0.66 * SIDE_S);
  const [sx, sy] = m(-0.83, 0.52);
  drawSkull(ctx, sx, sy, 0.34 * SIDE_S, flip);
  // unit number on the rear quarter
  const [nx, ny] = m(-2.05, 0.75);
  stencilText(ctx, "13", nx, ny, 70, WHITE, null, "#0d1a30");
}

function paintTop(ctx) {
  const m = (z, x) => topPx(z, x);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, TOP_Y0, ATLAS, TOP_H);
  // white roof and pillars, plus the shoulder over the white rear doors
  ctx.fillStyle = WHITE;
  poly(ctx, m, [[-0.36, -1.2], [-0.36, 1.2], [-1.3, 1.2], [-1.3, -1.2]]);
  ctx.fill();
  poly(ctx, m, [[0.95, -0.9], [0.95, 0.9], [-1.46, 0.9], [-1.46, -0.9]]);
  ctx.fill();
  // windshield and rear glass seen from above
  ctx.fillStyle = GLASS;
  poly(ctx, m, [[0.9, -0.8], [0.9, 0.8], [0.1, 0.63], [0.1, -0.63]]);
  ctx.fill();
  poly(ctx, m, [[-0.9, -0.63], [-0.9, 0.63], [-1.4, 0.76], [-1.4, -0.76]]);
  ctx.fill();
  ctx.strokeStyle = "rgba(170,200,230,0.22)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(...m(0.75, -0.3));
  ctx.lineTo(...m(0.25, 0.25));
  ctx.stroke();
  // roof unit number, for the helicopter
  const [rx, ry] = m(-0.42, 0);
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(Math.PI / 2);
  stencilText(ctx, "13", 0, 0, 120, "#1d1d20", null);
  ctx.restore();
  // hood and trunk shut lines
  ctx.strokeStyle = "#141414";
  ctx.lineWidth = 3;
  poly(ctx, m, [[2.62, -0.9], [2.62, 0.9], [1.0, 0.9], [1.0, -0.9]]);
  ctx.stroke();
  poly(ctx, m, [[-1.5, -0.9], [-1.5, 0.9], [-2.6, 0.9], [-2.6, -0.9]]);
  ctx.stroke();
  // hood power bulge highlight
  const g = ctx.createLinearGradient(...m(0, -0.5), ...m(0, 0.5));
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.5, "rgba(255,255,255,0.06)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  poly(ctx, m, [[2.6, -0.5], [2.6, 0.5], [1.05, 0.5], [1.05, -0.5]]);
  ctx.fill();
}

function paintEnds(ctx) {
  // front
  const f = (x, y) => endPx("F", x, y);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, END_Y0, END_W, END_H);
  ctx.fillStyle = "#151517";
  poly(ctx, f, [[-1.1, 0.0], [1.1, 0.0], [1.1, 0.46], [-1.1, 0.46]]); // bumper
  ctx.fill();
  poly(ctx, f, [[-0.42, 0.55], [0.42, 0.55], [0.42, 0.74], [-0.42, 0.74]]); // grille
  ctx.fill();
  ctx.strokeStyle = "#8d8f93"; // chrome grille surround + bars
  ctx.lineWidth = 3;
  poly(ctx, f, [[-0.42, 0.55], [0.42, 0.55], [0.42, 0.74], [-0.42, 0.74]]);
  ctx.stroke();
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(...f(-0.42, 0.55 + i * 0.032));
    ctx.lineTo(...f(0.42, 0.55 + i * 0.032));
    ctx.stroke();
  }
  for (const s of [-1, 1]) {
    // composite headlight + amber corner
    ctx.fillStyle = "#d9dccf";
    poly(ctx, f, [[s * 0.46, 0.57], [s * 0.8, 0.57], [s * 0.8, 0.74], [s * 0.46, 0.74]]);
    ctx.fill();
    ctx.fillStyle = "#9fa6a4";
    poly(ctx, f, [[s * 0.5, 0.6], [s * 0.64, 0.6], [s * 0.64, 0.71], [s * 0.5, 0.71]]);
    ctx.fill();
    ctx.fillStyle = "#c98224";
    poly(ctx, f, [[s * 0.82, 0.57], [s * 0.97, 0.57], [s * 0.97, 0.72], [s * 0.82, 0.72]]);
    ctx.fill();
  }
  // rear
  const r = (x, y) => endPx("R", x, y);
  ctx.fillStyle = BLUE;
  ctx.fillRect(END_W, END_Y0, END_W, END_H);
  ctx.fillStyle = "#151517";
  poly(ctx, r, [[-1.1, 0.0], [1.1, 0.0], [1.1, 0.48], [-1.1, 0.48]]);
  ctx.fill();
  ctx.fillStyle = "#6b0f0c"; // full-width tail panel
  poly(ctx, r, [[-0.95, 0.66], [0.95, 0.66], [0.95, 0.82], [-0.95, 0.82]]);
  ctx.fill();
  ctx.fillStyle = "#b8231b";
  for (const s of [-1, 1]) {
    poly(ctx, r, [[s * 0.55, 0.67], [s * 0.95, 0.67], [s * 0.95, 0.81], [s * 0.55, 0.81]]);
    ctx.fill();
  }
  ctx.fillStyle = "#d8d8d0"; // plate
  poly(ctx, r, [[-0.16, 0.5], [0.16, 0.5], [0.16, 0.64], [-0.16, 0.64]]);
  ctx.fill();
  const [px, py] = r(0, 0.57);
  stencilText(ctx, "BLU-666", px, py, 20, "#1a2d6e", 60);
  const [lx, ly] = r(0, 0.74);
  stencilText(ctx, "POLICE", lx, ly, 24, "#e8e1d0", 140);
}

function weather(ctx, rand) {
  // Everything after the livery: dirt, rust, scratches and chipped paint.
  const regions = [
    [0, LEFT_Y0, ATLAS, 640],
    [0, RIGHT_Y0, ATLAS, 640],
    [0, TOP_Y0, ATLAS, TOP_H],
    [0, END_Y0, ATLAS, END_H],
  ];
  for (const [x0, y0, w, h] of regions) {
    // fine noise
    const img = ctx.getImageData(x0, y0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rand() - 0.5) * 22;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(img, x0, y0);
    // grime blotches
    for (let i = 0; i < 260; i++) {
      const r = 6 + rand() * 60;
      const x = x0 + rand() * w;
      const y = y0 + rand() * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(40,34,26,${0.05 + rand() * 0.18})`);
      g.addColorStop(1, "rgba(40,34,26,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // rust spots
    for (let i = 0; i < 40; i++) {
      const x = x0 + rand() * w;
      const y = y0 + rand() * h;
      const r = 2 + rand() * 9;
      ctx.fillStyle = `rgba(${110 + rand() * 40},${55 + rand() * 20},${25},${0.25 + rand() * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.5 + rand()), rand() * 3, 0, Math.PI * 2);
      ctx.fill();
      // rust streak running down
      ctx.fillStyle = "rgba(95,50,22,0.18)";
      ctx.fillRect(x - r * 0.3, y, r * 0.6, r * (2 + rand() * 5));
    }
    // scratches and chips showing grey primer
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 220; i++) {
      const x = x0 + rand() * w;
      const y = y0 + rand() * h;
      const a = rand() * Math.PI;
      const l = 5 + rand() * 40;
      ctx.strokeStyle = `rgba(200,200,195,${0.1 + rand() * 0.35})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  }
  // road grime heavier along the bottom of both sides
  for (const y0 of [LEFT_Y0, RIGHT_Y0]) {
    const top = y0 + (1.6 - 0.62) * SIDE_S;
    const bot = y0 + (1.6 - 0.2) * SIDE_S;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, "rgba(52,44,34,0)");
    g.addColorStop(1, "rgba(52,44,34,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, top, ATLAS, bot - top);
  }
}

function makeLiveryTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = ATLAS;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0e0e0e";
  ctx.fillRect(0, 0, ATLAS, ATLAS);
  paintSide(ctx, "L");
  paintSide(ctx, "R");
  paintTop(ctx);
  paintEnds(ctx);
  weather(ctx, rng(0xb1e));
  // a solid dark swatch for wheel wells / underside, bottom-right corner
  ctx.fillStyle = "#0c0c0c";
  ctx.fillRect(ATLAS - 64, ATLAS - 64, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.mimeType = "image/jpeg";
  tex.name = "blue_murder_livery";
  return tex;
}

// ---------------------------------------------------------------- geometry
function arch(pts, cz, from, to) {
  // Wheel-arch notch cut up into the bottom edge of the silhouette.
  const steps = 18;
  pts.push([from, 0.22]);
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI - (i / steps) * Math.PI;
    pts.push([cz + Math.cos(a) * ARCH_R, AXLE_Y + Math.max(Math.sin(a) * ARCH_R, -0.14)]);
  }
  pts.push([to, 0.22]);
}

// Project UVs into the livery atlas by each triangle's facing direction.
function atlasUVs(geo) {
  geo.computeVertexNormals();
  const p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const n = new THREE.Vector3(), ctr = new THREE.Vector3();
  const dark = [(ATLAS - 32) / ATLAS, (ATLAS - 32) / ATLAS];
  for (let t = 0; t < p.count; t += 3) {
    a.fromBufferAttribute(p, t);
    b.fromBufferAttribute(p, t + 1);
    c.fromBufferAttribute(p, t + 2);
    n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
    ctr.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    for (let k = 0; k < 3; k++) {
      const v = [a, b, c][k];
      let px;
      if (ax >= ay && ax >= az) px = sidePx(n.x < 0 ? "L" : "R", v.z, v.y);
      else if (ay >= az) px = n.y > 0 ? topPx(v.z, v.x) : null;
      else if (Math.abs(ctr.z) > 2.2) px = endPx(n.z > 0 ? "F" : "R", v.x, v.y);
      else px = null; // wheel-well walls
      const i = (t + k) * 2;
      if (px) {
        uv[i] = px[0] / ATLAS;
        uv[i + 1] = px[1] / ATLAS;
      } else {
        uv[i] = dark[0];
        uv[i + 1] = dark[1];
      }
    }
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

function lowerBody() {
  const pts = [[-2.62, 0.3], [-2.48, 0.22]];
  arch(pts, REAR_AXLE, REAR_AXLE - ARCH_R, REAR_AXLE + ARCH_R);
  arch(pts, FRONT_AXLE, FRONT_AXLE - ARCH_R, FRONT_AXLE + ARCH_R);
  pts.push(
    [2.5, 0.22], [2.64, 0.3], [2.7, 0.46], [2.7, 0.62], [2.66, 0.75], [2.55, 0.81],
    [2.1, 0.85], [1.6, 0.87], [1.0, 0.9], [-1.05, 0.92], [-1.35, 0.94], [-2.3, 0.95],
    [-2.58, 0.93], [-2.66, 0.82], [-2.67, 0.6], [-2.66, 0.42],
  );
  const geo = extrudeProfile(pts, BODY_HW, { thickness: 0.07, size: 0.045, segments: 3 });
  // round the nose and tail in plan view
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i);
    const t = Math.max(0, (Math.abs(z) - 2.1) / 0.6);
    p.setX(i, p.getX(i) * (1 - 0.07 * t * t));
  }
  return atlasUVs(geo);
}

function cabin() {
  const pts = [
    [1.02, 0.86], [0.95, 0.92], [0.08, 1.42], [-0.1, 1.46], [-0.6, 1.465], [-0.86, 1.44],
    [-1.47, 0.95], [-1.5, 0.86],
  ];
  const geo = extrudeProfile(pts, CABIN_BASE_HW, { thickness: 0.05, size: 0.03, segments: 2 });
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    p.setX(i, p.getX(i) * (cabinHW(y) / CABIN_BASE_HW));
  }
  return atlasUVs(geo);
}

// ---------------------------------------------------------------- parts
function buildWheel(mats, name) {
  const g = new THREE.Group();
  g.name = name;
  // tyre: lathe profile around Y, then turned so the axle runs along X
  const prof = [];
  const w = 0.125, rIn = 0.235;
  prof.push(new THREE.Vector2(rIn, -w * 0.92));
  prof.push(new THREE.Vector2(WHEEL_R - 0.05, -w));
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI;
    prof.push(new THREE.Vector2(WHEEL_R - 0.05 + Math.cos(a) * 0.05, Math.sin(a) * (w - 0.02) * (i === 0 || i === 8 ? 1.02 : 1)));
  }
  prof.push(new THREE.Vector2(WHEEL_R - 0.05, w));
  prof.push(new THREE.Vector2(rIn, w * 0.92));
  const tyre = new THREE.LatheGeometry(prof, 36);
  // tread blocks
  const tread = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    for (const s of [-1, 1]) {
      const b = box(0.05, 0.02, 0.07, { pos: [0, WHEEL_R - 0.004, s * 0.05 + (i % 2 ? 0.012 : -0.012)] });
      b.rotateY(0);
      b.applyMatrix4(new THREE.Matrix4().makeRotationZ(a));
      tread.push(b);
    }
  }
  // tread blocks were built around Z; bring them into the lathe's frame (axis Y)
  const treadGeo = mergeGeometries(tread.map((t) => t.toNonIndexed()));
  treadGeo.rotateX(Math.PI / 2);
  const tyreMesh = merged([tyre, treadGeo], mats.rubber, name + "_tyre");
  tyreMesh.rotation.z = Math.PI / 2;
  g.add(tyreMesh);

  // black steel wheel with a chrome dog-dish cap, facing outboard (+Y before turn)
  const rim = [
    new THREE.CylinderGeometry(0.24, 0.24, 0.2, 28, 1, true),
    place(new THREE.CylinderGeometry(0.235, 0.21, 0.02, 28), { pos: [0, 0.08, 0] }),
  ];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    rim.push(place(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 8), { pos: [Math.cos(a) * 0.165, 0.085, Math.sin(a) * 0.165] }));
  }
  const rimMesh = merged(rim, mats.rimBlack, name + "_rim");
  rimMesh.rotation.z = -Math.PI / 2;
  g.add(rimMesh);
  const cap = [
    place(new THREE.CylinderGeometry(0.12, 0.13, 0.03, 24), { pos: [0, 0.1, 0] }),
    place(new THREE.SphereGeometry(0.11, 20, 8, 0, Math.PI * 2, 0, 0.55), { pos: [0, 0.03, 0] }),
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    cap.push(place(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 6), { pos: [Math.cos(a) * 0.08, 0.13, Math.sin(a) * 0.08] }));
  }
  const capMesh = merged(cap, mats.chrome, name + "_cap");
  capMesh.rotation.z = -Math.PI / 2;
  g.add(capMesh);
  return g;
}

function buildRam(mats) {
  // Welded push-frame bolted through the front bumper, bristling with spikes.
  const zF = 2.86;
  const frame = [];
  const R = 0.028;
  const xs = [-0.9, -0.64, -0.38, -0.13, 0.13, 0.38, 0.64, 0.9];
  for (const y of [0.24, 0.5, 0.78]) frame.push(tube([-0.96, y, zF], [0.96, y, zF], R));
  for (const x of xs) frame.push(tube([x, 0.2, zF], [x, 0.82, zF], R * 0.9));
  // side wings sweeping back around the corners
  for (const s of [-1, 1]) {
    for (const y of [0.24, 0.5, 0.78]) frame.push(tube([s * 0.96, y, zF], [s * 1.02, y, 2.6], R));
    frame.push(tube([s * 1.02, 0.22, 2.6], [s * 1.02, 0.8, 2.6], R));
    // mounting struts back under the bumper
    frame.push(tube([s * 0.5, 0.28, zF], [s * 0.5, 0.28, 2.4], 0.035));
  }
  // welded backing plates behind the spike rows
  const plates = [
    box(1.84, 0.1, 0.03, { pos: [0, 0.37, zF - 0.02] }),
    box(1.84, 0.1, 0.03, { pos: [0, 0.64, zF - 0.02] }),
  ];
  // heavy bumper behind the frame
  const bumper = [box(1.96, 0.24, 0.16, { pos: [0, 0.34, 2.68] })];

  const spikes = [];
  const rand = rng(1313);
  const rows = [
    { y: 0.37, xs: [-0.77, -0.51, -0.25, 0, 0.25, 0.51, 0.77] },
    { y: 0.64, xs: [-0.9, -0.64, -0.38, -0.13, 0.13, 0.38, 0.64, 0.9] },
    { y: 0.26, xs: [-0.64, -0.13, 0.38, 0.9, -0.9] },
  ];
  for (const r of rows) {
    for (const x of r.xs) {
      const len = 0.2 + rand() * 0.09;
      const dir = [x * 0.12 + (rand() - 0.5) * 0.1, (rand() - 0.5) * 0.12, 1];
      spikes.push(spike([x, r.y, zF + 0.01], dir, len, 0.04));
      spikes.push(place(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 10), { pos: [x, r.y, zF + 0.01], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  // corner spikes angled outward
  for (const s of [-1, 1]) {
    for (const y of [0.35, 0.65]) spikes.push(spike([s * 1.0, y, 2.74], [s, 0, 0.8], 0.22, 0.04));
  }
  const g = new THREE.Group();
  g.name = "Ram";
  g.add(merged([...frame, ...plates], mats.steel, "Ram_frame"));
  g.add(merged(bumper, mats.trim, "Ram_bumper"));
  g.add(merged(spikes, mats.spike, "Ram_spikes"));
  return g;
}

function buildCages(mats) {
  const g = new THREE.Group();
  g.name = "Cages";
  const wire = [], bars = [];
  const off = 0.035;
  const S = 7; // UV repeats per metre -> ~14 cm diamonds

  // windshield: a quad floating just off the glass
  const wsBot = 0.92, wsTop = 1.4;
  const zb = 0.93, zt = 0.12;
  const nrm = new THREE.Vector3(0, zb - zt, wsTop - wsBot).normalize(); // (y,z) outward normal
  const o = (x, y, z) => [x, y + nrm.y * off, z + nrm.z * off];
  const hb = cabinHW(wsBot) - 0.08, ht = cabinHW(wsTop) - 0.07;
  const WA = o(-hb, wsBot, zb), WB = o(hb, wsBot, zb), WC = o(ht, wsTop, zt), WD = o(-ht, wsTop, zt);
  wire.push(quad(WA, WB, WC, WD, S));
  for (const [a, b] of [[WA, WB], [WB, WC], [WC, WD], [WD, WA]]) bars.push(tube(a, b, 0.018));
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    bars.push(tube(WA.map((v, k) => v + (WB[k] - WA[k]) * t), WD.map((v, k) => v + (WC[k] - WD[k]) * t), 0.012));
  }

  // side windows: follow the tapered cabin side
  for (const s of [-1, 1]) {
    const xOf = (z, y) => s * (cabinHW(y) + off);
    const panes = [
      [[0.82, 0.95], [0.12, 1.38], [-0.34, 1.39], [-0.34, 0.95]],
      [[-0.41, 0.95], [-0.41, 1.39], [-0.86, 1.39], [-1.28, 0.95]],
    ];
    for (const pts of panes) {
      wire.push(sidePanel(pts, xOf, S));
      for (let i = 0; i < pts.length; i++) {
        const [z1, y1] = pts[i], [z2, y2] = pts[(i + 1) % pts.length];
        bars.push(tube([xOf(z1, y1), y1, z1], [xOf(z2, y2), y2, z2], 0.016));
      }
    }
  }
  // rear window
  const rb = 0.95, rt = 1.42, zrb = -1.45, zrt = -0.88;
  const rn = new THREE.Vector3(0, zrt - zrb, -(rt - rb)).normalize();
  const ro = (x, y, z) => [x, y + rn.y * off, z + rn.z * off];
  const RA = ro(cabinHW(rb) - 0.1, rb, zrb), RB = ro(-(cabinHW(rb) - 0.1), rb, zrb);
  const RC = ro(-(cabinHW(rt) - 0.08), rt, zrt), RD = ro(cabinHW(rt) - 0.08, rt, zrt);
  wire.push(quad(RA, RB, RC, RD, S));
  for (const [a, b] of [[RA, RB], [RB, RC], [RC, RD], [RD, RA]]) bars.push(tube(a, b, 0.016));

  g.add(merged(wire, mats.wire, "Cages_mesh"));
  g.add(merged(bars, mats.steelDark, "Cages_frame"));
  return g;
}

function buildRoofRack(mats) {
  const g = new THREE.Group();
  g.name = "RoofRack";
  const y0 = ROOF_Y + 0.01, h = 0.24, hw = 0.64, z0 = -0.12, z1 = -0.74;
  const y1 = y0 + h;
  const bars = [];
  const r = 0.02;
  const corners = [];
  for (const x of [-hw, hw]) for (const z of [z0, z1]) corners.push([x, z]);
  for (const [x, z] of corners) bars.push(tube([x, y0 - 0.02, z], [x, y1, z], r));
  for (const y of [y0 + 0.03, y1]) {
    bars.push(tube([-hw, y, z0], [hw, y, z0], r));
    bars.push(tube([-hw, y, z1], [hw, y, z1], r));
    bars.push(tube([-hw, y, z0], [-hw, y, z1], r));
    bars.push(tube([hw, y, z0], [hw, y, z1], r));
  }
  // top cross-rails and a hoop over the beacon
  for (const x of [-0.32, 0, 0.32]) bars.push(tube([x, y1, z0], [x, y1, z1], r * 0.8));
  // feet clamped to the roof edges
  const feet = [];
  for (const [x, z] of corners) feet.push(box(0.1, 0.03, 0.12, { pos: [x, y0 - 0.02, z] }));

  // wire mesh: top, front, back, sides
  const S = 7;
  const wire = [
    quad([-hw, y1, z0], [hw, y1, z0], [hw, y1, z1], [-hw, y1, z1], S).rotateY(0),
    quad([-hw, y0, z0], [hw, y0, z0], [hw, y1, z0], [-hw, y1, z0], S),
    quad([hw, y0, z1], [-hw, y0, z1], [-hw, y1, z1], [hw, y1, z1], S),
    quad([hw, y0, z0], [hw, y0, z1], [hw, y1, z1], [hw, y1, z0], S),
    quad([-hw, y0, z1], [-hw, y0, z0], [-hw, y1, z0], [-hw, y1, z1], S),
  ];
  // flip top so it faces up
  wire[0] = quad([-hw, y1, z1], [hw, y1, z1], [hw, y1, z0], [-hw, y1, z0], S);

  // light bar inside the cage
  const lbY = y0 + 0.07, lbZ = (z0 + z1) / 2;
  const housing = [box(1.1, 0.08, 0.26, { pos: [0, lbY, lbZ] })];
  const red = [], blue = [], clear = [];
  for (let i = 0; i < 4; i++) {
    const x = -0.51 + i * 0.12;
    red.push(box(0.1, 0.07, 0.27, { pos: [x, lbY + 0.012, lbZ] }));
    blue.push(box(0.1, 0.07, 0.27, { pos: [-x, lbY + 0.012, lbZ] }));
  }
  clear.push(box(0.1, 0.07, 0.27, { pos: [0, lbY + 0.012, lbZ] }));
  // single rotating beacon on top of the cage, as in the reference art
  const beacon = [
    place(new THREE.SphereGeometry(0.075, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [0, y1 + 0.03, lbZ] }),
    place(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 20), { pos: [0, y1 + 0.015, lbZ] }),
  ];
  const beaconBase = [place(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 20), { pos: [0, y1 + 0.0, lbZ] })];

  g.add(merged(bars, mats.steelDark, "RoofRack_frame"));
  g.add(merged([...feet, ...housing, ...beaconBase], mats.trim, "RoofRack_mounts"));
  g.add(merged(wire, mats.wire, "RoofRack_mesh"));
  g.add(merged(red, mats.lensRed, "LightBar_red"));
  g.add(merged(blue, mats.lensBlue, "LightBar_blue"));
  g.add(merged([...clear, ...beacon], mats.lensClear, "LightBar_beacon"));
  return g;
}

function buildTrim(mats) {
  const trim = [], chrome = [];
  // rear bumper
  trim.push(box(1.96, 0.22, 0.14, { pos: [0, 0.36, -2.7] }));
  // mirrors
  for (const s of [-1, 1]) {
    trim.push(box(0.05, 0.1, 0.16, { pos: [s * 1.0, 1.0, 0.72], rot: [0, s * 0.2, 0] }));
    trim.push(box(0.1, 0.03, 0.05, { pos: [s * 0.95, 0.96, 0.74] }));
  }
  // A-pillar spotlight on the driver's side
  trim.push(tube([-0.92, 0.98, 0.78], [-1.0, 1.07, 0.78], 0.012));
  chrome.push(place(new THREE.CylinderGeometry(0.055, 0.045, 0.14, 14), { pos: [-1.03, 1.1, 0.8], rot: [Math.PI / 2, 0, 0] }));
  // exhaust
  chrome.push(place(new THREE.CylinderGeometry(0.035, 0.035, 0.25, 12), { pos: [0.55, 0.2, -2.62], rot: [Math.PI / 2, 0, 0] }));
  // whip antenna on the trunk
  trim.push(tube([0.45, 0.95, -2.3], [0.47, 1.75, -2.4], 0.004, 5));
  trim.push(place(new THREE.CylinderGeometry(0.025, 0.03, 0.03, 10), { pos: [0.45, 0.96, -2.3] }));
  // push-bar mount bolts on the hood lip
  return [merged(trim, mats.trim, "Body_trim"), merged(chrome, mats.chrome, "Body_chrome")];
}

// ---------------------------------------------------------------- assembly
export function buildBlueMurder() {
  const livery = makeLiveryTexture();
  const wireTex = makeWireTexture();
  const steelTex = makeSteelTexture();
  const mats = {
    paint: new THREE.MeshStandardMaterial({ name: "BM_Paint", map: livery, roughness: 0.62, metalness: 0.2 }),
    trim: new THREE.MeshStandardMaterial({ name: "BM_Trim", color: 0x1c1c1e, roughness: 0.7, metalness: 0.2 }),
    chrome: new THREE.MeshStandardMaterial({ name: "BM_Chrome", color: 0xd0d2d4, roughness: 0.22, metalness: 1 }),
    rubber: new THREE.MeshStandardMaterial({ name: "BM_Rubber", color: 0x151515, roughness: 0.92, metalness: 0 }),
    rimBlack: new THREE.MeshStandardMaterial({ name: "BM_SteelWheel", color: 0x202224, roughness: 0.5, metalness: 0.5 }),
    steel: new THREE.MeshStandardMaterial({ name: "BM_RamSteel", map: steelTex, roughness: 0.5, metalness: 0.75 }),
    spike: new THREE.MeshStandardMaterial({ name: "BM_Spikes", color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 }),
    steelDark: new THREE.MeshStandardMaterial({ name: "BM_CageSteel", color: 0x55585b, roughness: 0.55, metalness: 0.7 }),
    wire: new THREE.MeshStandardMaterial({
      name: "BM_WireMesh", map: wireTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.7,
    }),
    lensRed: new THREE.MeshStandardMaterial({ name: "BM_LensRed", color: 0x9a1010, emissive: 0xff1a1a, emissiveIntensity: 0.6, roughness: 0.2 }),
    lensBlue: new THREE.MeshStandardMaterial({ name: "BM_LensBlue", color: 0x10309a, emissive: 0x2050ff, emissiveIntensity: 0.6, roughness: 0.2 }),
    lensClear: new THREE.MeshStandardMaterial({ name: "BM_LensClear", color: 0xdfe6ee, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.1 }),
  };

  const root = new THREE.Group();
  root.name = "BlueMurder";

  const body = new THREE.Group();
  body.name = "Body";
  body.add(merged([lowerBody(), cabin()], mats.paint, "Body_shell"));
  for (const m of buildTrim(mats)) body.add(m);
  root.add(body);

  for (const [name, x, z] of [
    ["Wheel_FL", -TRACK_HW, FRONT_AXLE],
    ["Wheel_FR", TRACK_HW, FRONT_AXLE],
    ["Wheel_RL", -TRACK_HW, REAR_AXLE],
    ["Wheel_RR", TRACK_HW, REAR_AXLE],
  ]) {
    const w = buildWheel(mats, name);
    w.position.set(x, AXLE_Y, z);
    if (x < 0) w.rotation.y = Math.PI; // outboard face points away from the car
    root.add(w);
  }

  root.add(buildRam(mats));
  root.add(buildCages(mats));
  root.add(buildRoofRack(mats));

  root.userData = {
    vehicle: "Blue Murder",
    units: "metres",
    forward: "+Z",
    wheelRadius: WHEEL_R,
    wheelbase: FRONT_AXLE - REAR_AXLE,
    track: TRACK_HW * 2,
  };
  return root;
}

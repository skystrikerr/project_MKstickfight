// Mail Truck: a lifted, armoured postal delivery van. Grimy white box body
// with red and blue stripes, a caged windshield, a heavy black push bumper
// with a bull bar and lamps, a roof light bar and a rack loaded with mail
// crates, bolted steel skirts and big off-road tyres.
//
// Same conventions as Blue Murder: metres, +Y up, the van faces +Z, and
// each wheel is its own node with its origin on the axle.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  box, extrudeProfile, makeSteelTexture, makeWireTexture, merged, place, poly, quad, rng, sidePanel, stencilText, tube,
} from "./kit.js";

// ---------------------------------------------------------------- dimensions
const BODY_HW = 1.08;
const FRONT_AXLE = 1.8;
const REAR_AXLE = -1.55;
const AXLE_Y = 0.5;
const WHEEL_R = 0.5;
const ARCH_R = 0.6;
const TRACK_HW = 0.97;
const SILL_Y = 0.62; // bottom edge of the body
const ROOF_Y = 2.46;
const NOSE_Z = 2.84;

// Atlas: 2048 x 3072, origin top-left, flipY=false.
const AW = 2048;
const AH = 3072;
const SPAN_Z = 2.95;
const SPAN_Y = 2.76;
const S = AW / (2 * SPAN_Z); // side px per metre
const SIDE_H = SPAN_Y * S; // ~958
const LEFT_Y0 = 0;
const RIGHT_Y0 = 960;
const TOP_Y0 = 1920;
const TOP_H = 640;
const SPAN_X = 1.2;
const END_Y0 = 2560;
const END_H = 480;
const END_W = 1024;
const END_SX = END_W / (2 * SPAN_X);
const END_SY = END_H / SPAN_Y;
const DARK_UV = [(AW - 16) / AW, (AH - 16) / AH]; // swatch in the unused strip

const sidePx = (side, z, y) => [
  side === "L" ? (z + SPAN_Z) * S : (SPAN_Z - z) * S,
  (side === "L" ? LEFT_Y0 : RIGHT_Y0) + (SPAN_Y - y) * S,
];
const topPx = (z, x) => [(z + SPAN_Z) * S, TOP_Y0 + ((x + SPAN_X) / (2 * SPAN_X)) * TOP_H];
const endPx = (end, x, y) => [
  end === "F" ? (x + SPAN_X) * END_SX : END_W + (SPAN_X - x) * END_SX,
  END_Y0 + (SPAN_Y - y) * END_SY,
];

const WHITE = "#dedbd0";
const RED = "#b3261e";
const BLUE = "#23407a";
const GLASS = "#0f141a";
const DARK = "#161618";

// ---------------------------------------------------------------- livery
function drawEmblem(ctx, cx, cy, size, flip) {
  // Fictional postal emblem: a winged envelope on a navy badge.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(flip ? -size : size, size);
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.roundRect(-0.62, -0.42, 1.24, 0.84, 0.1);
  ctx.fill();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 0.035;
  ctx.stroke();
  // wings sweeping back from the envelope
  ctx.fillStyle = WHITE;
  for (let i = 0; i < 4; i++) {
    const y = -0.2 + i * 0.1;
    ctx.beginPath();
    ctx.moveTo(-0.08, y);
    ctx.lineTo(-0.52 + i * 0.07, y - 0.08);
    ctx.lineTo(-0.5 + i * 0.07, y + 0.02);
    ctx.lineTo(-0.08, y + 0.07);
    ctx.fill();
  }
  // envelope
  ctx.fillRect(-0.08, -0.2, 0.52, 0.36);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 0.035;
  ctx.beginPath();
  ctx.moveTo(-0.08, -0.2);
  ctx.lineTo(0.18, 0.0);
  ctx.lineTo(0.44, -0.2);
  ctx.stroke();
  // speed line
  ctx.fillStyle = RED;
  ctx.fillRect(-0.55, 0.26, 1.0, 0.05);
  ctx.restore();
}

function paintSide(ctx, side) {
  const m = (z, y) => sidePx(side, z, y);
  const y0 = side === "L" ? LEFT_Y0 : RIGHT_Y0;
  const [, sill] = m(0, SILL_Y - 0.02);
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, y0, AW, sill - y0);
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, sill, AW, y0 + 960 - sill);

  // red stripe over a blue one, full length
  ctx.fillStyle = RED;
  poly(ctx, m, [[-3, 1.4], [3, 1.4], [3, 1.3], [-3, 1.3]]);
  ctx.fill();
  ctx.fillStyle = BLUE;
  poly(ctx, m, [[-3, 1.27], [3, 1.27], [3, 1.19], [-3, 1.19]]);
  ctx.fill();

  // cab side glass, raked to follow the windshield
  ctx.fillStyle = GLASS;
  poly(ctx, m, [[2.12, 1.6], [1.86, 2.28], [1.36, 2.28], [1.36, 1.6]]);
  ctx.fill();
  ctx.strokeStyle = "rgba(170,200,230,0.22)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(...m(1.95, 1.7));
  ctx.lineTo(...m(1.7, 2.1));
  ctx.stroke();

  // seams: cab door, cab/box join, box panels
  ctx.strokeStyle = "#1c1c1c";
  ctx.lineWidth = 3;
  for (const pts of [
    [[2.18, 0.66], [2.18, 1.52], [1.9, 2.32], [1.3, 2.32], [1.3, 0.66]],
    [[1.2, 0.66], [1.2, 2.42]],
    [[2.3, 1.42], [2.8, 1.38]],
  ]) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...m(...p)) : ctx.moveTo(...m(...p))));
    ctx.stroke();
  }
  // rivet rows on the cargo box
  ctx.fillStyle = "rgba(60,60,60,0.55)";
  for (const y of [0.7, 2.38]) {
    for (let z = -2.65; z < 1.15; z += 0.12) {
      const [x, py] = m(z, y);
      ctx.beginPath();
      ctx.arc(x, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const z of [-0.2, -1.5]) {
    ctx.beginPath();
    ctx.moveTo(...m(z, 0.66));
    ctx.lineTo(...m(z, 2.42));
    ctx.stroke();
  }
  // door handle and marker lamps
  ctx.fillStyle = "#2a2a2a";
  poly(ctx, m, [[1.5, 1.52], [1.5, 1.56], [1.38, 1.56], [1.38, 1.52]]);
  ctx.fill();
  ctx.fillStyle = "#cc7a1a";
  poly(ctx, m, [[2.6, 1.0], [2.6, 1.08], [2.48, 1.08], [2.48, 1.0]]);
  ctx.fill();
  ctx.fillStyle = "#8f1a14";
  poly(ctx, m, [[-2.58, 1.0], [-2.58, 1.08], [-2.46, 1.08], [-2.46, 1.0]]);
  ctx.fill();
  for (const z of [-2.6, -1.3, 0.1, 1.1]) {
    ctx.fillStyle = "#cc7a1a";
    poly(ctx, m, [[z, 2.36], [z, 2.4], [z - 0.06, 2.4], [z - 0.06, 2.36]]);
    ctx.fill();
  }

  // emblem and lettering on the cargo box
  const flip = side === "R";
  const [ex, ey] = m(-0.85, 1.9);
  drawEmblem(ctx, ex, ey, 0.46 * S, flip);
  const [tx, ty] = m(-0.85, 1.55);
  stencilText(ctx, "POSTAL", tx, ty, 54, BLUE, 0.95 * S);
  const [nx, ny] = m(0.55, 2.05);
  stencilText(ctx, "NO 0666", nx, ny, 30, "#2a2a2a", 0.5 * S);
  const [wx, wy] = m(-2.05, 1.72);
  stencilText(ctx, "RETURN TO SENDER", wx, wy, 24, "#8f1a14", 0.9 * S);
}

function paintTop(ctx) {
  const m = (z, x) => topPx(z, x);
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, TOP_Y0, AW, TOP_H);
  // roof panel seams and a walkway of grime down the middle
  ctx.strokeStyle = "rgba(40,40,40,0.5)";
  ctx.lineWidth = 3;
  for (let z = -2.4; z < 1.9; z += 0.6) {
    ctx.beginPath();
    ctx.moveTo(...m(z, -1.05));
    ctx.lineTo(...m(z, 1.05));
    ctx.stroke();
  }
  ctx.strokeStyle = "#1c1c1c";
  poly(ctx, m, [[2.8, -0.95], [2.8, 0.95], [2.3, 0.95], [2.3, -0.95]]); // hood
  ctx.stroke();
  // windshield seen from above (its steep face mostly maps to the front
  // region, but the top of the rake lands here)
  ctx.fillStyle = GLASS;
  poly(ctx, m, [[2.2, -0.95], [2.2, 0.95], [1.9, 0.95], [1.9, -0.95]]);
  ctx.fill();
  // roof number for the helicopter
  const [rx, ry] = m(-0.6, 0);
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(Math.PI / 2);
  stencilText(ctx, "0666", 0, 0, 130, "#23232a", 340);
  ctx.restore();
}

function paintEnds(ctx) {
  const f = (x, y) => endPx("F", x, y);
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, END_Y0, END_W, END_H);
  // grille and windshield
  ctx.fillStyle = DARK;
  poly(ctx, f, [[-0.7, 0.72], [0.7, 0.72], [0.7, 1.22], [-0.7, 1.22]]);
  ctx.fill();
  ctx.strokeStyle = "#5c5e60";
  ctx.lineWidth = 3;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(...f(-0.7, 0.72 + i * 0.083));
    ctx.lineTo(...f(0.7, 0.72 + i * 0.083));
    ctx.stroke();
  }
  ctx.fillStyle = GLASS;
  poly(ctx, f, [[-0.98, 1.55], [0.98, 1.55], [0.98, 2.33], [-0.98, 2.33]]);
  ctx.fill();
  ctx.fillStyle = "#2b2b2b"; // centre pillar of the split windshield
  poly(ctx, f, [[-0.03, 1.55], [0.03, 1.55], [0.03, 2.33], [-0.03, 2.33]]);
  ctx.fill();
  ctx.fillStyle = "#e8e3cf"; // small stock headlamps above the bumper
  for (const s of [-1, 1]) {
    poly(ctx, f, [[s * 0.78, 0.9], [s * 1.0, 0.9], [s * 1.0, 1.12], [s * 0.78, 1.12]]);
    ctx.fill();
  }

  const r = (x, y) => endPx("R", x, y);
  ctx.fillStyle = WHITE;
  ctx.fillRect(END_W, END_Y0, END_W, END_H);
  // roll-up cargo door
  ctx.fillStyle = "#cfccc1";
  poly(ctx, r, [[-0.88, 0.72], [0.88, 0.72], [0.88, 2.3], [-0.88, 2.3]]);
  ctx.fill();
  ctx.strokeStyle = "#8d8a80";
  ctx.lineWidth = 2;
  for (let y = 0.8; y < 2.3; y += 0.1) {
    ctx.beginPath();
    ctx.moveTo(...r(-0.88, y));
    ctx.lineTo(...r(0.88, y));
    ctx.stroke();
  }
  ctx.fillStyle = "#333";
  poly(ctx, r, [[-0.12, 0.82], [0.12, 0.82], [0.12, 0.88], [-0.12, 0.88]]);
  ctx.fill();
  ctx.fillStyle = "#b8231b"; // tall tail lamps
  for (const s of [-1, 1]) {
    poly(ctx, r, [[s * 0.94, 0.8], [s * 1.06, 0.8], [s * 1.06, 1.3], [s * 0.94, 1.3]]);
    ctx.fill();
  }
  ctx.fillStyle = RED;
  poly(ctx, r, [[-1.2, 1.3], [-0.92, 1.3], [-0.92, 1.4], [-1.2, 1.4]]);
  ctx.fill();
  poly(ctx, r, [[0.92, 1.3], [1.2, 1.3], [1.2, 1.4], [0.92, 1.4]]);
  ctx.fill();
  const [lx, ly] = r(0, 2.05);
  stencilText(ctx, "KEEP BACK 200 FT", lx, ly, 22, "#8f1a14", 300);
}

function weather(ctx, rand) {
  const regions = [
    [LEFT_Y0, 960],
    [RIGHT_Y0, 960],
    [TOP_Y0, TOP_H],
    [END_Y0, END_H],
  ];
  for (const [y0, h] of regions) {
    const img = ctx.getImageData(0, y0, AW, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rand() - 0.5) * 20;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(img, 0, y0);
    for (let i = 0; i < 220; i++) {
      const r = 8 + rand() * 70;
      const x = rand() * AW;
      const y = y0 + rand() * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(58,48,36,${0.05 + rand() * 0.17})`);
      g.addColorStop(1, "rgba(58,48,36,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // rust weeping from rivets and seams
    for (let i = 0; i < 60; i++) {
      const x = rand() * AW;
      const y = y0 + rand() * h;
      const w = 2 + rand() * 6;
      const g = ctx.createLinearGradient(x, y, x, y + 40 + rand() * 90);
      g.addColorStop(0, "rgba(120,62,24,0.5)");
      g.addColorStop(1, "rgba(120,62,24,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - w / 2, y, w, 130);
    }
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 260; i++) {
      const x = rand() * AW;
      const y = y0 + rand() * h;
      const a = rand() * Math.PI;
      const l = 6 + rand() * 45;
      ctx.strokeStyle = `rgba(70,70,70,${0.1 + rand() * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  }
  // road spray up the lower sides
  for (const y0 of [LEFT_Y0, RIGHT_Y0]) {
    const top = y0 + (SPAN_Y - 1.25) * S;
    const bot = y0 + (SPAN_Y - SILL_Y) * S;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, "rgba(60,50,38,0)");
    g.addColorStop(1, "rgba(60,50,38,0.65)");
    ctx.fillStyle = g;
    ctx.fillRect(0, top, AW, bot - top);
  }
}

function makeLivery() {
  const c = document.createElement("canvas");
  c.width = AW;
  c.height = AH;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0e0e0e";
  ctx.fillRect(0, 0, AW, AH);
  paintSide(ctx, "L");
  paintSide(ctx, "R");
  paintTop(ctx);
  paintEnds(ctx);
  weather(ctx, rng(0x3a11));
  ctx.fillStyle = "#0c0c0c";
  ctx.fillRect(0, AH - 32, AW, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.mimeType = "image/jpeg";
  tex.name = "mail_truck_livery";
  return tex;
}

// ---------------------------------------------------------------- body
function atlasUVs(geo) {
  geo.computeVertexNormals();
  const p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const e = new THREE.Vector3(), n = new THREE.Vector3();
  for (let t = 0; t < p.count; t += 3) {
    a.fromBufferAttribute(p, t);
    b.fromBufferAttribute(p, t + 1);
    c.fromBufferAttribute(p, t + 2);
    n.subVectors(c, b).cross(e.subVectors(a, b)).normalize();
    const cz = (a.z + b.z + c.z) / 3;
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    [a, b, c].forEach((v, k) => {
      let px = null;
      if (ax >= ay && ax >= az) px = sidePx(n.x < 0 ? "L" : "R", v.z, v.y);
      else if (ay >= az) px = n.y > 0 ? topPx(v.z, v.x) : null;
      else if (Math.abs(cz) > 2.5 || v.y > 1.45) px = endPx(n.z > 0 ? "F" : "R", v.x, v.y);
      const i = (t + k) * 2;
      uv[i] = px ? px[0] / AW : DARK_UV[0];
      uv[i + 1] = px ? px[1] / AH : DARK_UV[1];
    });
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

function archPoints(pts, cz) {
  const alpha = Math.asin((SILL_Y - AXLE_Y) / ARCH_R);
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const ang = Math.PI - alpha - (i / steps) * (Math.PI - 2 * alpha);
    pts.push([cz + Math.cos(ang) * ARCH_R, AXLE_Y + Math.sin(ang) * ARCH_R]);
  }
}

function bodyShell() {
  const pts = [[-2.72, 0.72], [-2.62, SILL_Y]];
  archPoints(pts, REAR_AXLE);
  archPoints(pts, FRONT_AXLE);
  pts.push(
    [2.62, SILL_Y], [2.8, 0.72], [NOSE_Z, 1.2], [2.78, 1.36], [2.35, 1.46], [2.22, 1.5],
    [1.92, 2.34], [1.8, 2.44], [-2.62, ROOF_Y], [-2.72, 2.38], [-2.74, 0.8],
  );
  const geo = extrudeProfile(pts, BODY_HW, { thickness: 0.06, size: 0.05, segments: 3 });
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i), y = p.getY(i);
    const nose = Math.max(0, (z - 2.3) / 0.6);
    const roof = THREE.MathUtils.clamp((y - 2.0) / 0.5, 0, 1);
    p.setX(i, p.getX(i) * (1 - 0.06 * nose * nose) * (1 - 0.035 * roof));
  }
  return atlasUVs(geo);
}

// ---------------------------------------------------------------- parts
function buildWheel(mats, name) {
  const g = new THREE.Group();
  g.name = name;
  const hw = 0.17, rIn = 0.3, shoulder = 0.07;
  const prof = [new THREE.Vector2(rIn, -hw * 0.9), new THREE.Vector2(WHEEL_R - shoulder, -hw)];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI;
    prof.push(new THREE.Vector2(WHEEL_R - shoulder + Math.cos(a) * shoulder, Math.sin(a) * hw));
  }
  prof.push(new THREE.Vector2(WHEEL_R - shoulder, hw), new THREE.Vector2(rIn, hw * 0.9));
  const tyre = new THREE.LatheGeometry(prof, 40);
  // chunky mud-terrain lugs: staggered centre blocks plus shoulder lugs
  const lugs = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rot = new THREE.Matrix4().makeRotationZ(a);
    const st = i % 2 ? 1 : -1;
    lugs.push(box(0.1, 0.035, 0.13, { pos: [0, WHEEL_R - 0.005, st * 0.055] }).applyMatrix4(rot));
    lugs.push(box(0.09, 0.03, 0.07, { pos: [0, WHEEL_R - 0.03, -st * 0.15], rot: [0.4 * st, 0, 0] }).applyMatrix4(rot));
  }
  const lugGeo = mergeGeometries(lugs.map((l) => l.toNonIndexed()));
  lugGeo.rotateX(Math.PI / 2);
  const tyreMesh = merged([tyre, lugGeo], mats.rubber, name + "_tyre");
  tyreMesh.rotation.z = Math.PI / 2;
  g.add(tyreMesh);

  const rim = [
    new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32, 1, true),
    place(new THREE.CylinderGeometry(0.29, 0.25, 0.03, 32), { pos: [0, 0.1, 0] }),
    place(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 16), { pos: [0, 0.14, 0] }),
  ];
  const nuts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    rim.push(place(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), { pos: [Math.cos(a) * 0.2, 0.12, Math.sin(a) * 0.2] }));
    nuts.push(place(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 6), { pos: [Math.cos(a + 0.4) * 0.14, 0.18, Math.sin(a + 0.4) * 0.14] }));
  }
  const rimMesh = merged(rim, mats.rimBlack, name + "_rim");
  rimMesh.rotation.z = -Math.PI / 2;
  g.add(rimMesh);
  const nutMesh = merged(nuts, mats.chrome, name + "_nuts");
  nutMesh.rotation.z = -Math.PI / 2;
  g.add(nutMesh);
  return g;
}

function buildFront(mats) {
  // Heavy push bumper with lamps, a bull bar up over the grille, skid plate.
  const g = new THREE.Group();
  g.name = "Bumper";
  const zB = 3.0;
  const black = [
    box(2.34, 0.36, 0.28, { pos: [0, 0.78, zB] }),
    box(2.0, 0.08, 0.5, { pos: [0, 0.56, 2.72], rot: [-0.25, 0, 0] }), // skid plate
  ];
  for (const s of [-1, 1]) black.push(box(0.2, 0.3, 0.26, { pos: [s * 1.12, 0.78, 2.9], rot: [0, s * 0.5, 0] }));
  const bars = [];
  for (const x of [-0.95, -0.35, 0.35, 0.95]) bars.push(tube([x, 0.95, zB], [x * 0.95, 1.46, zB - 0.06], 0.035));
  bars.push(tube([-0.95, 1.46, zB - 0.06], [0.95, 1.46, zB - 0.06], 0.035));
  bars.push(tube([-0.35, 1.22, zB - 0.03], [0.35, 1.22, zB - 0.03], 0.03));
  for (const s of [-1, 1]) bars.push(tube([s * 0.95, 1.46, zB - 0.06], [s * 1.02, 1.5, 2.55], 0.035));
  // tow hooks
  for (const s of [-1, 1]) bars.push(new THREE.TorusGeometry(0.05, 0.015, 6, 12).rotateY(Math.PI / 2).translate(s * 0.7, 0.62, zB + 0.12));
  const lampGlass = [], lampCans = [];
  for (const x of [-0.85, -0.55, 0.55, 0.85]) {
    lampCans.push(place(new THREE.CylinderGeometry(0.095, 0.095, 0.06, 18), { pos: [x, 0.8, zB + 0.15], rot: [Math.PI / 2, 0, 0] }));
    lampGlass.push(place(new THREE.CircleGeometry(0.08, 18), { pos: [x, 0.8, zB + 0.182] }));
  }
  g.add(merged(black, mats.bumper, "Bumper_body"));
  g.add(merged(bars, mats.barSteel, "Bumper_bullbar"));
  g.add(merged(lampCans, mats.chrome, "Bumper_lampcans"));
  g.add(merged(lampGlass, mats.lamp, "Bumper_lamps"));
  return g;
}

function buildArmour(mats) {
  const g = new THREE.Group();
  g.name = "Armour";
  const plates = [], bolts = [], flares = [];
  const xs = BODY_HW + 0.02;
  for (const s of [-1, 1]) {
    // lower skirts between the wheels and behind the rear wheel
    for (const [z0, z1] of [[-0.9, 1.1], [-2.68, -2.2]]) {
      plates.push(box(0.03, 0.46, z1 - z0, { pos: [s * xs, 0.9, (z0 + z1) / 2] }));
      for (let z = z0 + 0.08; z < z1; z += 0.22) {
        for (const y of [0.72, 1.08]) {
          bolts.push(place(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6), { pos: [s * (xs + 0.02), y, z], rot: [0, 0, Math.PI / 2] }));
        }
      }
    }
    // welded plate over the lower cab door
    plates.push(box(0.03, 0.34, 0.7, { pos: [s * xs, 1.22, 1.72], rot: [0.04, 0, 0] }));
    // fender flares
    for (const cz of [FRONT_AXLE, REAR_AXLE]) {
      const f = new THREE.TorusGeometry(ARCH_R + 0.03, 0.05, 6, 20, Math.PI * 0.84);
      f.rotateZ(Math.PI * 0.08);
      f.scale(1, 1, 2.6);
      f.rotateY(-Math.PI / 2);
      f.translate(s * (BODY_HW - 0.02), AXLE_Y, cz);
      flares.push(f);
    }
  }
  // rear step bumper
  plates.push(box(2.1, 0.16, 0.3, { pos: [0, 0.7, -2.86] }));
  g.add(merged(plates, mats.plate, "Armour_plates"));
  g.add(merged(bolts, mats.barSteel, "Armour_bolts"));
  g.add(merged(flares, mats.bumper, "Armour_flares"));
  return g;
}

function buildCages(mats) {
  const g = new THREE.Group();
  g.name = "Cages";
  const wire = [], bars = [];
  const off = 0.05;
  // windshield runs from (z 2.22, y 1.5) up to (z 1.92, y 2.34)
  const n = new THREE.Vector3(0, 0.3, 0.84).normalize();
  const o = (x, y, z) => [x, y + n.y * off, z + n.z * off];
  const hw = BODY_HW - 0.1;
  const A = o(-hw, 1.54, 2.21), B = o(hw, 1.54, 2.21), C = o(hw, 2.32, 1.93), D = o(-hw, 2.32, 1.93);
  wire.push(quad(A, B, C, D, 6));
  for (const [p, q] of [[A, B], [B, C], [C, D], [D, A]]) bars.push(tube(p, q, 0.025));
  for (const t of [0.35, 0.7]) {
    const lerp = (P, Q) => P.map((v, k) => v + (Q[k] - v) * t);
    bars.push(tube(lerp(A, D), lerp(B, C), 0.02));
  }
  bars.push(tube(o(0, 1.54, 2.21), o(0, 2.32, 1.93), 0.02));
  // cab side windows
  for (const s of [-1, 1]) {
    const x = () => s * (BODY_HW + 0.04);
    const pts = [[2.14, 1.58], [1.87, 2.3], [1.34, 2.3], [1.34, 1.58]];
    wire.push(sidePanel(pts, x, 6));
    for (let i = 0; i < pts.length; i++) {
      const [z1, y1] = pts[i], [z2, y2] = pts[(i + 1) % pts.length];
      bars.push(tube([x(), y1, z1], [x(), y2, z2], 0.02));
    }
    for (const y of [1.82, 2.06]) bars.push(tube([x(), y, 2.06 - (y - 1.58) * 0.37], [x(), y, 1.34], 0.016));
  }
  g.add(merged(wire, mats.wire, "Cages_mesh"));
  g.add(merged(bars, mats.barSteel, "Cages_frame"));
  return g;
}

function buildRoof(mats) {
  const g = new THREE.Group();
  g.name = "Roof";
  const y0 = ROOF_Y + 0.04;
  // light bar of spot lamps along the front roof edge
  const housing = [box(1.8, 0.1, 0.16, { pos: [0, y0 + 0.08, 1.62] })];
  for (const s of [-1, 1]) housing.push(box(0.06, 0.12, 0.06, { pos: [s * 0.8, y0 + 0.02, 1.62] }));
  const cans = [], glass = [];
  for (let i = 0; i < 6; i++) {
    const x = -0.75 + i * 0.3;
    cans.push(place(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 16), { pos: [x, y0 + 0.2, 1.64], rot: [Math.PI / 2, 0, 0] }));
    glass.push(place(new THREE.CircleGeometry(0.06, 16), { pos: [x, y0 + 0.2, 1.691] }));
  }
  // roof rack
  const rack = [];
  const rx = 0.98, z0 = -2.5, z1 = 1.35, ry = y0 + 0.16;
  for (const x of [-rx, rx]) {
    rack.push(tube([x, ry, z0], [x, ry, z1], 0.025));
    rack.push(tube([x, ry + 0.14, z0], [x, ry + 0.14, z1], 0.02));
    for (let z = z0; z <= z1 + 0.01; z += (z1 - z0) / 5) rack.push(tube([x, y0 - 0.02, z], [x, ry + 0.14, z], 0.02));
  }
  for (let z = z0; z <= z1 + 0.01; z += (z1 - z0) / 5) rack.push(tube([-rx, ry, z], [rx, ry, z], 0.02));
  rack.push(tube([-rx, ry + 0.14, z0], [rx, ry + 0.14, z0], 0.02));
  rack.push(tube([-rx, ry + 0.14, z1], [rx, ry + 0.14, z1], 0.02));

  // cargo: mail totes, a strapped parcel pile and a sack
  const rand = rng(99);
  const totes = [], parcels = [], sacks = [];
  for (const [x, z] of [[-0.45, -1.7], [0.1, -1.75], [-0.4, -1.15]]) {
    totes.push(box(0.5, 0.3, 0.45, { pos: [x, ry + 0.17, z], rot: [0, (rand() - 0.5) * 0.2, 0] }));
  }
  for (const [x, z, w, h, d] of [[0.5, -0.9, 0.5, 0.28, 0.4], [0.45, -0.35, 0.42, 0.22, 0.36], [0.5, -0.62, 0.3, 0.2, 0.3]]) {
    parcels.push(box(w, h, d, { pos: [x, ry + 0.02 + h / 2 + (z === -0.62 ? 0.28 : 0), z], rot: [0, (rand() - 0.5) * 0.4, 0] }));
  }
  sacks.push(place(new THREE.SphereGeometry(0.3, 14, 10), { pos: [-0.35, ry + 0.2, -0.3], scale: [1.1, 0.6, 1.5] }));
  sacks.push(place(new THREE.SphereGeometry(0.06, 8, 6), { pos: [-0.35, ry + 0.34, 0.12], scale: [1, 1, 1.6] }));

  g.add(merged(housing, mats.bumper, "Roof_lightbar"));
  g.add(merged(cans, mats.chrome, "Roof_lampcans"));
  g.add(merged(glass, mats.lamp, "Roof_lamps"));
  g.add(merged(rack, mats.barSteel, "Roof_rack"));
  g.add(merged(totes, mats.tote, "Roof_totes"));
  g.add(merged(parcels, mats.cardboard, "Roof_parcels"));
  g.add(merged(sacks, mats.canvas, "Roof_sack"));
  return g;
}

function buildTrim(mats) {
  const trim = [], chrome = [];
  // West-coast mirrors on tube arms
  for (const s of [-1, 1]) {
    chrome.push(tube([s * 1.06, 1.62, 2.2], [s * 1.36, 1.72, 2.26], 0.015));
    chrome.push(tube([s * 1.06, 2.1, 2.05], [s * 1.36, 2.02, 2.22], 0.015));
    trim.push(box(0.06, 0.4, 0.2, { pos: [s * 1.38, 1.86, 2.25] }));
  }
  // exhaust stack up the rear corner
  chrome.push(tube([0.95, 0.6, -2.4], [0.95, 0.6, -2.82], 0.045, 12));
  // CB antenna
  trim.push(tube([-1.0, 2.1, 2.0], [-1.02, 3.1, 1.9], 0.006, 5));
  return [merged(trim, mats.bumper, "Body_trim"), merged(chrome, mats.chrome, "Body_chrome")];
}

// ---------------------------------------------------------------- assembly
export function buildMailTruck() {
  const plateTex = makeSteelTexture();
  plateTex.repeat.set(2, 2);
  const mats = {
    paint: new THREE.MeshStandardMaterial({ name: "MT_Paint", map: makeLivery(), roughness: 0.7, metalness: 0.15 }),
    bumper: new THREE.MeshStandardMaterial({ name: "MT_BlackSteel", color: 0x19191b, roughness: 0.6, metalness: 0.5 }),
    barSteel: new THREE.MeshStandardMaterial({ name: "MT_BarSteel", color: 0x3a3c3f, roughness: 0.5, metalness: 0.7 }),
    plate: new THREE.MeshStandardMaterial({ name: "MT_ArmourPlate", map: plateTex, color: 0xd6d0c6, roughness: 0.55, metalness: 0.45 }),
    chrome: new THREE.MeshStandardMaterial({ name: "MT_Chrome", color: 0xc8cacc, roughness: 0.25, metalness: 1 }),
    rubber: new THREE.MeshStandardMaterial({ name: "MT_Rubber", color: 0x141414, roughness: 0.95, metalness: 0 }),
    rimBlack: new THREE.MeshStandardMaterial({ name: "MT_Wheel", color: 0x1d1e20, roughness: 0.5, metalness: 0.5 }),
    wire: new THREE.MeshStandardMaterial({
      name: "MT_WireMesh", map: makeWireTexture(), color: 0x6a6c6e, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.7,
    }),
    lamp: new THREE.MeshStandardMaterial({ name: "MT_Lamp", color: 0xfff6dc, emissive: 0xfff0c8, emissiveIntensity: 1.6, roughness: 0.1 }),
    tote: new THREE.MeshStandardMaterial({ name: "MT_Tote", color: 0x2e4a7a, roughness: 0.6, metalness: 0 }),
    cardboard: new THREE.MeshStandardMaterial({ name: "MT_Cardboard", color: 0x9a7547, roughness: 0.9, metalness: 0 }),
    canvas: new THREE.MeshStandardMaterial({ name: "MT_Canvas", color: 0x8e8672, roughness: 1, metalness: 0 }),
  };

  const root = new THREE.Group();
  root.name = "MailTruck";
  const body = new THREE.Group();
  body.name = "Body";
  body.add(merged([bodyShell()], mats.paint, "Body_shell"));
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
    if (x < 0) w.rotation.y = Math.PI;
    root.add(w);
  }
  root.add(buildFront(mats));
  root.add(buildArmour(mats));
  root.add(buildCages(mats));
  root.add(buildRoof(mats));

  root.userData = {
    vehicle: "Mail Truck",
    units: "metres",
    forward: "+Z",
    wheelRadius: WHEEL_R,
    wheelbase: FRONT_AXLE - REAR_AXLE,
    track: TRACK_HW * 2,
  };
  return root;
}

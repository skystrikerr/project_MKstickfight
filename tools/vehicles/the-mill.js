// The Mill: a rusted-out square-body pickup turned lumber-yard killer. A
// raked plough of steel plates on the nose, a spinning circular saw blade on
// an arm beside each front wheel, a caged windshield, roof spotlights, a stack
// behind the cab and a flatbed carrying a strapped drum and a tank.
//
// Same conventions as the other cars: metres, +Y up, facing +Z, each wheel is
// its own node on its axle. Each saw blade is its own node too (Saw_L/Saw_R),
// with its origin on the hub and its spin axis along X, so the game can spin it.
import * as THREE from "three";
import {
  box, createAtlas, extrudeProfile, makeSteelTexture, makeWireTexture, merged, place, poly, quad, rng, sidePanel,
  spike, stencilText, tube,
} from "./kit.js";

// ---------------------------------------------------------------- dimensions
const WHEEL_R = 0.46;
const AXLE_Y = 0.46;
const FRONT_AXLE = 1.6;
const REAR_AXLE = -1.6;
const TRACK_HW = 0.9;
const ARCH_R = 0.56;
const BODY_HW = 0.98;
const SILL_Y = 0.78;
const NOSE_Z = 2.5; // grille face including bevel
const CAB_BACK = -0.55;
const SAW_R = 0.5;
const SAW_POS = [1.24, 0.62, 2.62];

const cabTaper = (y) => 1 - 0.06 * THREE.MathUtils.clamp((y - 1.45) / 0.6, 0, 1);

const RED = "#6b2a1e";
const RED_FADED = "#8a4a3a";
const PRIMER = "#6f6d68";
const CREAM = "#d8ccb0";
const GLASS = "#0d1014";

// ---------------------------------------------------------------- livery
function millEmblem(ctx, cx, cy, s) {
  // A faded hand-painted yard sign: saw blade ring around a pine tree.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  const teeth = 24;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * s * 0.44, Math.sin(a) * s * 0.44);
    ctx.lineTo(Math.cos(a + 0.18) * s * 0.5, Math.sin(a + 0.18) * s * 0.5);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CREAM; // pine tree
  for (let i = 0; i < 3; i++) {
    const top = -s * 0.28 + i * s * 0.1, w = s * (0.1 + i * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(w, top + s * 0.16);
    ctx.lineTo(-w, top + s * 0.16);
    ctx.fill();
  }
  ctx.fillRect(-s * 0.03, s * 0.1, s * 0.06, s * 0.1);
  ctx.restore();
}

function paintSide(A, side) {
  const { ctx } = A;
  const m = (z, y) => A.sidePx(side, z, y);
  const y0 = side === "L" ? A.L0 : A.R0;
  ctx.fillStyle = RED;
  ctx.fillRect(0, y0, A.width, A.sideH);
  // sun-faded upper panels and a grey-primered replacement fender
  const g = ctx.createLinearGradient(...m(0, 2.05), ...m(0, 1.2));
  g.addColorStop(0, "rgba(160,110,90,0.35)");
  g.addColorStop(1, "rgba(160,110,90,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, A.width, A.sideH);
  ctx.fillStyle = PRIMER;
  poly(ctx, m, side === "L" ? [[2.5, 0.8], [2.5, 1.4], [1.95, 1.42], [1.95, 0.8]] : [[1.0, 0.8], [1.0, 1.1], [0.9, 1.1], [0.9, 0.8]]);
  ctx.fill();
  // shut lines, body crease and the chrome-less trim channel
  ctx.strokeStyle = "#1e0e09";
  ctx.lineWidth = 4;
  for (const pts of [
    [[0.88, 0.82], [0.88, 1.46], [0.46, 2.0], [-0.34, 2.0], [-0.34, 0.82]],
    [[2.45, 1.2], [-0.55, 1.2]],
    [[2.45, 1.38], [0.95, 1.42]],
  ]) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...m(...p)) : ctx.moveTo(...m(...p))));
    ctx.stroke();
  }
  ctx.fillStyle = "#1a1512";
  poly(ctx, m, [[0.02, 1.36], [0.02, 1.4], [-0.14, 1.4], [-0.14, 1.36]]);
  ctx.fill();
  ctx.fillStyle = "#c77a1a"; // side marker
  poly(ctx, m, [[2.4, 1.05], [2.4, 1.11], [2.28, 1.11], [2.28, 1.05]]);
  ctx.fill();
  // door sign
  const [ex, ey] = m(0.3, 1.02);
  millEmblem(ctx, ex, ey, 0.36 * A.S);
  const [tx, ty] = m(0.3, 0.84);
  stencilText(ctx, "THE MILL", tx, ty, 40, CREAM, 0.55 * A.S);
  const [lx, ly] = m(1.55, 1.3);
  stencilText(ctx, "LUMBER & SALVAGE  EST. 1987", lx, ly, 18, "rgba(216,204,176,0.7)", 0.95 * A.S);
}

function paintTop(A) {
  const { ctx } = A;
  const m = (z, x) => A.topPx(z, x);
  ctx.fillStyle = RED_FADED;
  ctx.fillRect(0, A.T0, A.width, A.topH);
  ctx.strokeStyle = "#1e0e09";
  ctx.lineWidth = 4;
  poly(ctx, m, [[2.45, -0.92], [2.45, 0.92], [0.96, 0.92], [0.96, -0.92]]);
  ctx.stroke();
  for (const x of [-0.5, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(...m(2.4, x));
    ctx.lineTo(...m(1.0, x));
    ctx.stroke();
  }
}

function paintEnds(A) {
  const { ctx } = A;
  const f = (x, y) => A.endPx("F", x, y);
  ctx.fillStyle = RED;
  ctx.fillRect(0, A.E0, A.endW, A.endH);
  ctx.fillStyle = "#0b0b0b";
  poly(ctx, f, [[-0.95, 0.88], [0.95, 0.88], [0.95, 1.34], [-0.95, 1.34]]);
  ctx.fill();
  const r = (x, y) => A.endPx("R", x, y);
  ctx.fillStyle = RED;
  ctx.fillRect(A.endW, A.E0, A.endW, A.endH);
}

// Glass goes on after the weathering so rust never lands on a window.
function paintGlass(A) {
  const { ctx } = A;
  for (const side of ["L", "R"]) {
    const m = (z, y) => A.sidePx(side, z, y);
    ctx.fillStyle = GLASS;
    poly(ctx, m, [[0.8, 1.5], [0.46, 1.94], [-0.4, 1.96], [-0.4, 1.5]]);
    ctx.fill();
    ctx.strokeStyle = "rgba(170,190,210,0.2)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(...m(0.55, 1.55));
    ctx.lineTo(...m(0.3, 1.88));
    ctx.stroke();
  }
  ctx.fillStyle = GLASS; // top of the windshield rake
  poly(ctx, (z, x) => A.topPx(z, x), [[0.88, -0.85], [0.88, 0.85], [0.5, 0.8], [0.5, -0.8]]);
  ctx.fill();
  poly(ctx, (x, y) => A.endPx("F", x, y), [[-0.86, 1.52], [0.86, 1.52], [0.8, 1.96], [-0.8, 1.96]]);
  ctx.fill();
  const r = (x, y) => A.endPx("R", x, y);
  poly(ctx, r, [[-0.7, 1.52], [0.7, 1.52], [0.7, 1.9], [-0.7, 1.9]]);
  ctx.fill();
  const [gx, gy] = r(0, 1.7);
  ctx.fillStyle = "rgba(90,60,40,0.6)"; // gun rack silhouette through the glass
  ctx.fillRect(gx - 160, gy - 3, 320, 6);
  ctx.fillRect(gx - 160, gy + 25, 320, 6);
}

function weather(A, rand) {
  const { ctx, width } = A;
  for (const [y0, h] of [[A.L0, A.sideH], [A.R0, A.sideH], [A.T0, A.topH], [A.E0, A.endH]]) {
    const img = ctx.getImageData(0, y0, width, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rand() - 0.5) * 26;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(img, 0, y0);
    for (let i = 0; i < 240; i++) {
      const r = 10 + rand() * 90, x = rand() * width, y = y0 + rand() * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(25,18,14,${0.06 + rand() * 0.2})`);
      g.addColorStop(1, "rgba(25,18,14,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // The truck is more rust than paint: big eaten-through patches with
    // pitted edges and streaks, plus flaking clusters everywhere.
    for (let i = 0; i < 90; i++) {
      const x = rand() * width, y = y0 + rand() * h;
      const r = 8 + rand() * (i < 18 ? 70 : 28);
      for (let k = 0; k < 16; k++) {
        const ox = x + (rand() - 0.5) * r * 1.6, oy = y + (rand() - 0.5) * r * 0.8;
        const rr = 2 + rand() * r * 0.35;
        ctx.fillStyle = `rgba(${95 + rand() * 45},${42 + rand() * 22},${18 + rand() * 10},${0.4 + rand() * 0.45})`;
        ctx.beginPath();
        ctx.ellipse(ox, oy, rr * (1 + rand()), rr, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      const g = ctx.createLinearGradient(x, y, x, y + r * 3);
      g.addColorStop(0, "rgba(100,48,20,0.45)");
      g.addColorStop(1, "rgba(100,48,20,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r * 0.4, y, r * 0.8, r * 3);
    }
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 260; i++) {
      const x = rand() * width, y = y0 + rand() * h, a = rand() * Math.PI, l = 6 + rand() * 60;
      ctx.strokeStyle = `rgba(200,190,180,${0.05 + rand() * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  }
  for (const y0 of [A.L0, A.R0]) {
    const top = y0 + (2.1 - 1.3) * A.S, bot = y0 + A.sideH;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, "rgba(50,38,28,0)");
    g.addColorStop(1, "rgba(50,38,28,0.65)");
    ctx.fillStyle = g;
    ctx.fillRect(0, top, width, bot - top);
  }
}

// ---------------------------------------------------------------- body
function bodyShell(A) {
  const pts = [[CAB_BACK, SILL_Y], [FRONT_AXLE - 0.62, SILL_Y]];
  const alpha = Math.asin((SILL_Y - AXLE_Y) / ARCH_R);
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI - alpha - (i / 18) * (Math.PI - 2 * alpha);
    pts.push([FRONT_AXLE + Math.cos(a) * ARCH_R, AXLE_Y + Math.sin(a) * ARCH_R]);
  }
  pts.push(
    [2.3, SILL_Y], [2.45, 0.85], [2.47, 1.35], [2.4, 1.4], [0.95, 1.44], [0.88, 1.46], [0.47, 2.0],
    [0.35, 2.04], [-0.45, 2.05], [CAB_BACK, 1.98],
  );
  const geo = extrudeProfile(pts, BODY_HW, { thickness: 0.04, size: 0.03, segments: 2 });
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * cabTaper(p.getY(i)));
  return A.uvs(geo);
}

function planarUV(geo, s = 1.2) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getZ(i) + p.getX(i) * 0.7) * s;
    uv[i * 2 + 1] = (p.getY(i) + p.getX(i) * 0.3) * s;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

// ---------------------------------------------------------------- wheels & saws
function buildWheel(mats, name) {
  const g = new THREE.Group();
  g.name = name;
  const hw = 0.16, rIn = 0.27, sh = 0.07;
  const prof = [new THREE.Vector2(rIn, -hw * 0.9), new THREE.Vector2(WHEEL_R - sh, -hw)];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI;
    prof.push(new THREE.Vector2(WHEEL_R - sh + Math.cos(a) * sh, Math.sin(a) * hw));
  }
  prof.push(new THREE.Vector2(WHEEL_R - sh, hw), new THREE.Vector2(rIn, hw * 0.9));
  const tyre = [new THREE.LatheGeometry(prof, 40)];
  const N = 20;
  for (let i = 0; i < N; i++) {
    const rot = new THREE.Matrix4().makeRotationZ((i / N) * Math.PI * 2);
    const st = i % 2 ? 1 : -1;
    tyre.push(box(0.1, 0.035, 0.12, { pos: [0, WHEEL_R - 0.005, st * 0.05] }).applyMatrix4(rot).rotateX(Math.PI / 2));
    tyre.push(box(0.09, 0.03, 0.07, { pos: [0, WHEEL_R - 0.03, -st * 0.14], rot: [0.4 * st, 0, 0] }).applyMatrix4(rot).rotateX(Math.PI / 2));
  }
  const tyreMesh = merged(tyre, mats.rubber, name + "_tyre");
  tyreMesh.rotation.z = Math.PI / 2;
  g.add(tyreMesh);
  const rim = [
    new THREE.CylinderGeometry(0.27, 0.27, 0.28, 28, 1, true),
    place(new THREE.CylinderGeometry(0.26, 0.22, 0.03, 28), { pos: [0, 0.09, 0] }),
    place(new THREE.CylinderGeometry(0.08, 0.1, 0.1, 16), { pos: [0, 0.13, 0] }),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    rim.push(place(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 10), { pos: [Math.cos(a) * 0.17, 0.105, Math.sin(a) * 0.17] }));
    rim.push(place(new THREE.CylinderGeometry(0.014, 0.014, 0.04, 6), { pos: [Math.cos(a + 0.5) * 0.12, 0.12, Math.sin(a + 0.5) * 0.12] }));
  }
  const rimMesh = merged(rim, mats.rim, name + "_rim");
  rimMesh.rotation.z = -Math.PI / 2;
  g.add(rimMesh);
  return g;
}

function sawBlade(mats, name) {
  // Hook-toothed circular blade, spin axis along X, origin on the hub.
  const g = new THREE.Group();
  g.name = name;
  const teeth = 32;
  const shape = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2, step = (Math.PI * 2) / teeth;
    const pts = [
      [a, SAW_R * 0.86],
      [a + step * 0.15, SAW_R * 0.9],
      [a + step * 0.72, SAW_R],
      [a + step * 0.78, SAW_R * 0.93],
    ];
    pts.forEach(([ang, r], k) => {
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      if (i === 0 && k === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.05, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const disc = new THREE.ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: false, curveSegments: 6 });
  disc.translate(0, 0, -0.007);
  disc.rotateY(Math.PI / 2);
  // planar UVs so the steel texture swirls across the face
  const discUV = disc.toNonIndexed();
  const p = discUV.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getZ(i) * 1.5 + 0.5;
    uv[i * 2 + 1] = p.getY(i) * 1.5 + 0.5;
  }
  discUV.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  const hub = [
    place(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 20), { rot: [0, 0, Math.PI / 2] }),
    place(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), { rot: [0, 0, Math.PI / 2] }),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    hub.push(place(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6), { pos: [0, Math.cos(a) * 0.08, Math.sin(a) * 0.08], rot: [0, 0, Math.PI / 2] }));
  }
  g.add(merged([discUV], mats.saw, name + "_blade"));
  g.add(merged(hub, mats.chrome, name + "_hub"));
  return g;
}

// ---------------------------------------------------------------- parts
function buildFront(mats) {
  const g = new THREE.Group();
  g.name = "Front";
  const z = NOSE_Z + 0.01;
  const chrome = [], black = [], lamps = [], amber = [];
  chrome.push(box(1.9, 0.05, 0.05, { pos: [0, 1.34, z] }), box(1.9, 0.05, 0.05, { pos: [0, 0.9, z] }));
  for (const x of [-0.93, -0.3, 0.3, 0.93]) chrome.push(box(0.05, 0.46, 0.05, { pos: [x, 1.12, z] }));
  for (let i = 0; i < 4; i++) black.push(box(0.56, 0.02, 0.03, { pos: [0, 0.98 + i * 0.1, z] }));
  for (const s of [-1, 1]) {
    for (const y of [1.2, 1.03]) {
      chrome.push(box(0.26, 0.15, 0.03, { pos: [s * 0.61, y, z] }));
      lamps.push(box(0.21, 0.11, 0.02, { pos: [s * 0.61, y, z + 0.018] }));
    }
    amber.push(box(0.18, 0.06, 0.03, { pos: [s * 0.61, 0.86, z] }));
  }
  g.add(merged(chrome, mats.chrome, "Front_grille"));
  g.add(merged(black, mats.black, "Front_grillebars"));
  g.add(merged(lamps, mats.lamp, "Front_headlamps"));
  g.add(merged(amber, mats.amber, "Front_parklamps"));
  return g;
}

function buildPlough(mats) {
  // A V of raked steel plates with torn top edges, a grille guard above it,
  // and the arms that carry the saw motors out beside the front wheels.
  const g = new THREE.Group();
  g.name = "Ram";
  const plates = [], frame = [], teeth = [], motors = [];
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.3;
    const zc = 3.02 - Math.abs(x) * 0.28;
    plates.push(box(0.29, 0.84, 0.045, { pos: [x, 0.56, zc], rot: [-0.22, -Math.sign(x) * 0.28, 0] }));
    // jagged top edge and a spike per plate
    teeth.push(spike([x - 0.07, 0.99, zc - 0.1], [0, 1, 0.3], 0.1, 0.03), spike([x + 0.07, 0.99, zc - 0.1], [0, 1, 0.3], 0.07, 0.025));
    teeth.push(spike([x, 0.45, zc + 0.03], [x * 0.2, -0.1, 1], 0.2, 0.04));
  }
  for (const y of [0.35, 0.8]) frame.push(tube([-1.0, y, 2.72], [1.0, y, 2.72], 0.045));
  for (const s of [-1, 1]) frame.push(tube([s * 0.5, 0.6, 2.72], [s * 0.5, 0.82, 2.3], 0.05));
  // bumper and grille guard
  frame.push(box(2.0, 0.22, 0.2, { pos: [0, 0.92, 2.62] }));
  for (const x of [-0.72, -0.3, 0.3, 0.72]) frame.push(tube([x, 1.03, 2.68], [x, 1.5, 2.62], 0.035));
  frame.push(tube([-0.72, 1.5, 2.62], [0.72, 1.5, 2.62], 0.035));
  // saw arms and motor housings
  for (const s of [-1, 1]) {
    const [hx, hy, hz] = [s * SAW_POS[0], SAW_POS[1], SAW_POS[2]];
    frame.push(tube([s * 0.95, 0.62, 2.72], [s * (SAW_POS[0] - 0.14), hy, hz], 0.06));
    frame.push(tube([s * 0.95, 0.35, 2.72], [s * (SAW_POS[0] - 0.14), hy - 0.1, hz - 0.1], 0.04));
    motors.push(place(new THREE.CylinderGeometry(0.15, 0.15, 0.26, 18), { pos: [hx - s * 0.18, hy, hz], rot: [0, 0, Math.PI / 2] }));
    motors.push(box(0.1, 0.34, 0.34, { pos: [hx - s * 0.08, hy, hz] }));
    // guard hoop over the top of each blade
    const hoop = new THREE.TorusGeometry(SAW_R + 0.06, 0.025, 6, 20, Math.PI * 0.55);
    hoop.rotateZ(Math.PI * 0.35);
    hoop.rotateY(Math.PI / 2);
    hoop.translate(hx - s * 0.06, hy, hz);
    frame.push(hoop);
  }
  g.add(merged(plates.map((p) => planarUV(p)), mats.plough, "Ram_plates"));
  g.add(merged(frame.map((p) => planarUV(p)), mats.rustSteel, "Ram_frame"));
  g.add(merged(teeth, mats.teeth, "Ram_spikes"));
  g.add(merged(motors, mats.black, "Saw_motors"));
  return g;
}

function buildBed(mats) {
  const g = new THREE.Group();
  g.name = "Bed";
  const steel = [], rust = [], black = [], red = [], strap = [];
  const zF = -0.68, zR = -2.78, yD = 1.06;
  steel.push(box(2.02, 0.08, zF - zR, { pos: [0, yD, (zF + zR) / 2] }));
  // stake sides
  for (const s of [-1, 1]) {
    for (let z = zF - 0.05; z >= zR; z -= 0.52) steel.push(box(0.06, 0.42, 0.06, { pos: [s * 0.98, yD + 0.25, z] }));
    for (const y of [yD + 0.25, yD + 0.44]) steel.push(tube([s * 0.98, y, zF], [s * 0.98, y, zR], 0.03));
    // flat fenders over the rear wheels
    const f = new THREE.TorusGeometry(WHEEL_R + 0.08, 0.035, 6, 16, Math.PI * 0.8);
    f.rotateZ(Math.PI * 0.1);
    f.scale(1, 1, 5);
    f.rotateY(-Math.PI / 2);
    f.translate(s * TRACK_HW, AXLE_Y, REAR_AXLE);
    rust.push(f);
    red.push(box(0.12, 0.1, 0.04, { pos: [s * 0.8, 0.92, zR - 0.08] }));
  }
  steel.push(tube([-0.98, yD + 0.44, zR], [0.98, yD + 0.44, zR], 0.03));
  // rear bumper and hitch
  black.push(box(2.0, 0.16, 0.14, { pos: [0, 0.82, zR - 0.1] }));
  black.push(box(0.12, 0.1, 0.25, { pos: [0, 0.72, zR - 0.25] }));
  // frame rails
  for (const s of [-1, 1]) black.push(box(0.12, 0.2, 5.5, { pos: [s * 0.45, 0.86, -0.05] }));
  // cargo: a strapped horizontal drum and a squat tank with plumbing
  rust.push(place(new THREE.CylinderGeometry(0.36, 0.36, 1.25, 24), { pos: [0, yD + 0.4, -1.2], rot: [0, 0, Math.PI / 2] }));
  for (const x of [-0.45, 0.45]) strap.push(place(new THREE.TorusGeometry(0.365, 0.012, 5, 24), { pos: [x, yD + 0.4, -1.2], rot: [0, Math.PI / 2, 0] }));
  rust.push(box(0.95, 0.72, 0.7, { pos: [0.28, yD + 0.4, -2.3] }));
  steel.push(tube([0.28, yD + 0.76, -2.3], [0.28, yD + 0.95, -2.3], 0.05), tube([0.28, yD + 0.95, -2.3], [0.6, yD + 0.95, -2.3], 0.04));
  steel.push(place(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 14), { pos: [-0.1, yD + 0.78, -2.2] }));
  // headache rack behind the cab
  const rack = [];
  const zRack = -0.64;
  for (const s of [-1, 1]) rack.push(tube([s * 0.95, yD, zRack], [s * 0.95, 2.14, zRack], 0.035));
  for (const y of [1.5, 2.14]) rack.push(tube([-0.95, y, zRack], [0.95, y, zRack], 0.03));
  const wire = [quad([-0.93, yD + 0.05, zRack - 0.01], [-0.93, 2.12, zRack - 0.01], [0.93, 2.12, zRack - 0.01], [0.93, yD + 0.05, zRack - 0.01], 6)];

  g.add(merged(steel.map((p) => planarUV(p)), mats.rustSteel, "Bed_steel"));
  g.add(merged(rust.map((p) => planarUV(p, 0.9)), mats.drum, "Bed_cargo"));
  g.add(merged(black, mats.black, "Bed_frame"));
  g.add(merged(red, mats.tail, "Bed_taillamps"));
  g.add(merged(strap, mats.black, "Bed_straps"));
  g.add(merged(rack.map((p) => planarUV(p)), mats.rustSteel, "Bed_rack"));
  g.add(merged(wire, mats.wire, "Bed_rackmesh"));
  return g;
}

function buildCab(mats) {
  const g = new THREE.Group();
  g.name = "CabParts";
  const wire = [], bars = [], chrome = [], black = [], lamps = [], amber = [];
  const off = 0.04;
  // windshield cage
  const n = new THREE.Vector3(0, 0.41, 0.54).normalize();
  const o = (x, y, z) => [x, y + n.y * off, z + n.z * off];
  const A = o(-0.86, 1.5, 0.85), B = o(0.86, 1.5, 0.85), C = o(0.8, 1.97, 0.49), D = o(-0.8, 1.97, 0.49);
  wire.push(quad(A, B, C, D, 6));
  for (const [p, q] of [[A, B], [B, C], [C, D], [D, A]]) bars.push(tube(p, q, 0.022));
  bars.push(tube(o(0, 1.5, 0.85), o(0, 1.97, 0.49), 0.018));
  // side-window cages
  for (const s of [-1, 1]) {
    const xOf = (z, y) => s * (BODY_HW * cabTaper(y) + 0.035);
    const pts = [[0.8, 1.48], [0.46, 1.95], [-0.4, 1.97], [-0.4, 1.48]];
    wire.push(sidePanel(pts, xOf, 6));
    for (let i = 0; i < pts.length; i++) {
      const [z1, y1] = pts[i], [z2, y2] = pts[(i + 1) % pts.length];
      bars.push(tube([xOf(z1, y1), y1, z1], [xOf(z2, y2), y2, z2], 0.018));
    }
    // mirrors
    chrome.push(tube([s * 0.98, 1.5, 0.82], [s * 1.2, 1.55, 0.86], 0.014));
    black.push(box(0.05, 0.28, 0.16, { pos: [s * 1.22, 1.6, 0.86] }));
    // running boards
    black.push(box(0.2, 0.04, 1.1, { pos: [s * 1.05, 0.66, 0.2] }));
  }
  // roof: a pair of big spotlights and a beacon
  const yR = 2.08;
  bars.push(tube([-0.6, yR, 0.1], [0.6, yR, 0.1], 0.025));
  for (const s of [-1, 1]) {
    bars.push(tube([s * 0.5, yR - 0.02, 0.1], [s * 0.5, yR + 0.1, 0.1], 0.02));
    chrome.push(place(new THREE.CylinderGeometry(0.1, 0.085, 0.14, 18), { pos: [s * 0.5, yR + 0.16, 0.12], rot: [Math.PI / 2, 0, 0] }));
    lamps.push(place(new THREE.CircleGeometry(0.085, 18), { pos: [s * 0.5, yR + 0.16, 0.191] }));
  }
  amber.push(place(new THREE.SphereGeometry(0.07, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [0, yR + 0.02, -0.2] }));
  black.push(place(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 14), { pos: [0, yR + 0.01, -0.2] }));
  // exhaust stack up the back corner of the cab
  chrome.push(tube([0.86, 0.85, -0.6], [0.86, 2.5, -0.6], 0.06, 14), tube([0.86, 2.5, -0.6], [0.86, 2.62, -0.75], 0.06, 14));
  g.add(merged(wire, mats.wire, "Cages_mesh"));
  g.add(merged(bars.map((p) => planarUV(p)), mats.rustSteel, "Cages_frame"));
  g.add(merged(chrome, mats.chrome, "Cab_chrome"));
  g.add(merged(black, mats.black, "Cab_trim"));
  g.add(merged(lamps, mats.lamp, "Roof_spotlights"));
  g.add(merged(amber, mats.amber, "Roof_beacon"));
  return g;
}

// ---------------------------------------------------------------- assembly
export function buildTheMill() {
  const A = createAtlas({
    width: 2048, height: 2624, spanZ: 1.6, centerZ: 0.95, spanY: 2.1, spanX: 1.05,
    sideH: 896, topH: 400, endH: 400, endMinZ: 1.3, endMinY: 1.4,
  });
  paintSide(A, "L");
  paintSide(A, "R");
  paintTop(A);
  paintEnds(A);
  weather(A, rng(0x5a3));
  paintGlass(A);
  const mats = {
    paint: new THREE.MeshStandardMaterial({ name: "TM_Paint", map: A.texture("the_mill_livery"), roughness: 0.75, metalness: 0.2 }),
    rustSteel: new THREE.MeshStandardMaterial({ name: "TM_RustSteel", map: makeSteelTexture(), color: 0x9a8c80, roughness: 0.6, metalness: 0.65 }),
    plough: new THREE.MeshStandardMaterial({ name: "TM_Plough", map: makeSteelTexture(), color: 0x9a8a7e, roughness: 0.55, metalness: 0.65 }),
    drum: new THREE.MeshStandardMaterial({ name: "TM_Drum", map: makeSteelTexture(), color: 0x8c4a2a, roughness: 0.8, metalness: 0.4 }),
    saw: new THREE.MeshStandardMaterial({ name: "TM_SawBlade", map: makeSteelTexture(), color: 0xeceef0, roughness: 0.35, metalness: 0.7, side: THREE.DoubleSide }),
    teeth: new THREE.MeshStandardMaterial({ name: "TM_Spikes", color: 0xb4b6b8, roughness: 0.35, metalness: 0.9 }),
    chrome: new THREE.MeshStandardMaterial({ name: "TM_Chrome", color: 0xc4c6c8, roughness: 0.28, metalness: 1 }),
    black: new THREE.MeshStandardMaterial({ name: "TM_Black", color: 0x171717, roughness: 0.75, metalness: 0.3 }),
    rubber: new THREE.MeshStandardMaterial({ name: "TM_Rubber", color: 0x141414, roughness: 0.94, metalness: 0 }),
    rim: new THREE.MeshStandardMaterial({ name: "TM_Rim", color: 0x2c2826, roughness: 0.55, metalness: 0.6 }),
    wire: new THREE.MeshStandardMaterial({
      name: "TM_WireMesh", map: makeWireTexture(), color: 0x7a6e66, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.6,
    }),
    lamp: new THREE.MeshStandardMaterial({ name: "TM_Lamp", color: 0xfff2d4, emissive: 0xffe2a8, emissiveIntensity: 1.6, roughness: 0.1 }),
    amber: new THREE.MeshStandardMaterial({ name: "TM_Amber", color: 0xffa228, emissive: 0xff8a10, emissiveIntensity: 1.3, roughness: 0.2 }),
    tail: new THREE.MeshStandardMaterial({ name: "TM_TailLamp", color: 0x9a1418, emissive: 0x900a0a, emissiveIntensity: 0.7, roughness: 0.2 }),
  };

  const root = new THREE.Group();
  root.name = "TheMill";
  const body = new THREE.Group();
  body.name = "Body";
  body.add(merged([bodyShell(A)], mats.paint, "Body_shell"));
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
  for (const [name, s] of [["Saw_L", -1], ["Saw_R", 1]]) {
    const saw = sawBlade(mats, name);
    saw.position.set(s * SAW_POS[0], SAW_POS[1], SAW_POS[2]);
    root.add(saw);
  }
  root.add(buildFront(mats));
  root.add(buildPlough(mats));
  root.add(buildBed(mats));
  root.add(buildCab(mats));

  root.userData = {
    vehicle: "The Mill",
    units: "metres",
    forward: "+Z",
    wheelRadius: WHEEL_R,
    wheelbase: FRONT_AXLE - REAR_AXLE,
    track: TRACK_HW * 2,
    sawRadius: SAW_R,
    sawSpinAxis: "X",
  };
  return root;
}

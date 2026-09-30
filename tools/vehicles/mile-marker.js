// Mile Marker: "Turnpike" Dalton's rig. A rusted blue long-nose semi tractor
// with a sleeper cab, twin chrome stacks, amber-lit visor and roof, a tall
// chrome grille behind a spiked steel grille guard, chrome fuel tanks and
// air cleaners, and a tandem drive axle on dual wheels.
//
// Same conventions as the other cars: metres, +Y up, facing +Z. Every axle
// end is its own wheel node with its origin on the axle; the rear ones hold
// both tyres of a dual set.
import * as THREE from "three";
import {
  box, createAtlas, extrudeProfile, makeSteelTexture, merged, place, poly, rng, spike, stencilText, tube,
} from "./kit.js";

// ---------------------------------------------------------------- dimensions
const WHEEL_R = 0.52;
const AXLE_Y = 0.52;
const FRONT_AXLE = 2.6;
const REAR_AXLES = [-2.65, -4.0];
const FRONT_TRACK_HW = 1.04;
const REAR_TRACK_HW = 0.94; // centre of each dual pair
const DUAL_OFFSET = 0.16;
const HOOD_HW = 0.7;
const CAB_HW = 1.12;
const CAB_FLOOR = 1.02;
const NOSE_Z = 4.12; // hood front including bevel

const BLUE = "#34507c";
const BLUE_DARK = "#243a5c";
const GLASS = "#0d1116";
const CREAM = "#d9d2bd";

// ---------------------------------------------------------------- livery
function rivets(ctx, m, z0, z1, y, step = 0.09) {
  for (let z = z0; z <= z1; z += step) {
    const [x, py] = m(z, y);
    ctx.fillStyle = "rgba(20,26,36,0.7)";
    ctx.beginPath();
    ctx.arc(x + 1, py + 1, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(170,185,205,0.55)";
    ctx.beginPath();
    ctx.arc(x, py, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function mileSign(ctx, cx, cy, s) {
  // A green interstate mile-marker post, the truck's emblem. Drawn in pixel
  // space, so it reads correctly on both sides.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#1f5a3a";
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.roundRect(-s * 0.32, -s * 0.5, s * 0.64, s, s * 0.06);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CREAM;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${s * 0.18}px "Arial Black", Arial, sans-serif`;
  ctx.fillText("MILE", 0, -s * 0.27);
  ctx.font = `900 ${s * 0.46}px "Arial Black", Arial, sans-serif`;
  ctx.fillText("88", 0, s * 0.12);
  ctx.restore();
}

function paintSide(A, side) {
  const { ctx } = A;
  const m = (z, y) => A.sidePx(side, z, y);
  const y0 = side === "L" ? A.L0 : A.R0;
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, y0, A.width, A.sideH);

  // cab door, side glass and the sleeper's little bunk window
  ctx.fillStyle = GLASS;
  poly(ctx, m, [[1.2, 2.3], [1.03, 2.9], [0.36, 2.92], [0.36, 2.3]]);
  ctx.fill();
  poly(ctx, m, [[-1.0, 2.55], [-1.0, 2.82], [-1.4, 2.82], [-1.4, 2.55]]);
  ctx.fill();
  ctx.strokeStyle = "rgba(160,190,220,0.22)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(...m(1.0, 2.38));
  ctx.lineTo(...m(0.72, 2.82));
  ctx.stroke();
  ctx.strokeStyle = "#141c28";
  ctx.lineWidth = 4;
  for (const pts of [
    [[1.3, 1.08], [1.3, 2.25], [1.1, 2.98], [0.26, 3.0], [0.26, 1.08]], // door
    [[0.14, 1.05], [0.14, 3.1]], // cab/sleeper join
    [[1.35, 1.9], [4.05, 1.86]], // hood side crease
  ]) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...m(...p)) : ctx.moveTo(...m(...p))));
    ctx.stroke();
  }
  // hood side louvres by the cowl
  ctx.fillStyle = "#0f151f";
  for (let i = 0; i < 6; i++) {
    const z = 1.55 + i * 0.09;
    poly(ctx, m, [[z, 1.35], [z, 1.75], [z - 0.035, 1.75], [z - 0.035, 1.35]]);
    ctx.fill();
  }
  // rivet lines along every panel edge
  for (const y of [1.08, 2.18, 3.0]) rivets(ctx, m, -1.6, 1.3, y);
  for (const y of [1.08, 1.95]) rivets(ctx, m, 1.4, 4.0, y);
  for (const y of [3.28]) rivets(ctx, m, -1.45, 0.0, y);
  for (const z of [0.2, -1.55]) {
    for (let y = 1.12; y < 3.0; y += 0.09) rivets(ctx, m, z, z, y);
  }
  // door handle, grab handle
  ctx.fillStyle = "#b8bcc0";
  poly(ctx, m, [[0.5, 2.1], [0.5, 2.14], [0.38, 2.14], [0.38, 2.1]]);
  ctx.fill();
  // lettering: the carrier line on the door, name and emblem on the sleeper
  const [dx, dy] = m(0.78, 1.95);
  stencilText(ctx, "T. DALTON HAULING", dx, dy, 26, CREAM, 0.88 * A.S);
  const [ux, uy] = m(0.78, 1.8);
  stencilText(ctx, "USDOT 0088  -  TURNPIKE, NJ", ux, uy, 16, CREAM, 0.88 * A.S);
  const [sx, sy] = m(-0.62, 2.2);
  mileSign(ctx, sx, sy, 0.6 * A.S);
  const [tx, ty] = m(-0.85, 1.38);
  stencilText(ctx, "MILE MARKER", tx, ty, 48, CREAM, 1.1 * A.S, "#141c28");
}

function paintTop(A) {
  const { ctx } = A;
  const m = (z, x) => A.topPx(z, x);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, A.T0, A.width, A.topH);
  ctx.strokeStyle = "#141c28";
  ctx.lineWidth = 4;
  ctx.beginPath(); // hood centre seam
  ctx.moveTo(...m(4.05, 0));
  ctx.lineTo(...m(1.35, 0));
  ctx.stroke();
  for (const x of [-0.6, -0.08, 0.08, 0.6]) rivets(ctx, (z, y) => m(z, y), 1.4, 4.0, x);
  for (const x of [-1.05, 1.05]) rivets(ctx, (z, y) => m(z, y), -1.55, 0.85, x);
  // roof hatch on the sleeper
  ctx.strokeStyle = "#141c28";
  poly(ctx, m, [[-0.5, -0.35], [-0.5, 0.35], [-1.05, 0.35], [-1.05, -0.35]]);
  ctx.stroke();
}

function paintEnds(A) {
  const { ctx } = A;
  const f = (x, y) => A.endPx("F", x, y);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, A.E0, A.endW, A.endH);
  // split flat windshield
  ctx.fillStyle = GLASS;
  for (const s of [-1, 1]) {
    poly(ctx, f, [[s * 0.04, 2.25], [s * 1.02, 2.25], [s * 1.02, 2.92], [s * 0.04, 2.92]]);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(160,190,220,0.2)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(...f(-0.8, 2.35));
  ctx.lineTo(...f(-0.45, 2.85));
  ctx.stroke();
  ctx.fillStyle = "#0b0d10"; // behind the grille
  poly(ctx, f, [[-0.75, 0.9], [0.75, 0.9], [0.75, 2.05], [-0.75, 2.05]]);
  ctx.fill();
  rivets(ctx, (x, y) => f(x, y), -1.05, 1.05, 3.0, 0.1);

  const r = (x, y) => A.endPx("R", x, y);
  ctx.fillStyle = BLUE;
  ctx.fillRect(A.endW, A.E0, A.endW, A.endH);
  for (const y of [1.1, 2.2, 3.2]) rivets(ctx, (x, yy) => r(x, yy), -1.05, 1.05, y, 0.1);
  ctx.fillStyle = BLUE_DARK;
  poly(ctx, r, [[-0.9, 1.3], [0.9, 1.3], [0.9, 2.9], [-0.9, 2.9]]);
  ctx.fill();
  const [lx, ly] = r(0, 2.4);
  stencilText(ctx, "IF YOU CAN'T SEE MY MIRRORS", lx, ly, 20, CREAM, 360);
  const [kx, ky] = r(0, 2.2);
  stencilText(ctx, "YOU'RE ROADKILL", kx, ky, 26, "#c9a23a", 300);
}

function weather(A, rand) {
  const { ctx, width } = A;
  for (const [y0, h] of [[A.L0, A.sideH], [A.R0, A.sideH], [A.T0, A.topH], [A.E0, A.endH]]) {
    const img = ctx.getImageData(0, y0, width, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rand() - 0.5) * 24;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(img, 0, y0);
    // broad tired-paint mottling
    for (let i = 0; i < 260; i++) {
      const r = 10 + rand() * 80, x = rand() * width, y = y0 + rand() * h;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const light = rand() < 0.4;
      g.addColorStop(0, light ? `rgba(120,150,190,${0.05 + rand() * 0.12})` : `rgba(22,20,20,${0.06 + rand() * 0.18})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // rust: pitted clusters that bleed down the panels
    for (let i = 0; i < 70; i++) {
      const x = rand() * width, y = y0 + rand() * h;
      const r = 6 + rand() * 30;
      for (let k = 0; k < 12; k++) {
        const ox = x + (rand() - 0.5) * r * 1.6, oy = y + (rand() - 0.5) * r * 0.7;
        const rr = 2 + rand() * r * 0.3;
        ctx.fillStyle = `rgba(${100 + rand() * 35},${48 + rand() * 18},${22 + rand() * 8},${0.35 + rand() * 0.45})`;
        ctx.beginPath();
        ctx.ellipse(ox, oy, rr * (1 + rand()), rr, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      const g = ctx.createLinearGradient(x, y, x, y + r * 3);
      g.addColorStop(0, "rgba(105,52,22,0.4)");
      g.addColorStop(1, "rgba(105,52,22,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r * 0.35, y, r * 0.7, r * 3);
    }
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 220; i++) {
      const x = rand() * width, y = y0 + rand() * h, a = rand() * Math.PI, l = 6 + rand() * 50;
      ctx.strokeStyle = `rgba(190,195,205,${0.06 + rand() * 0.22})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  }
  // road grime climbing the lower cab
  for (const y0 of [A.L0, A.R0]) {
    const top = y0 + (3.45 - 1.7) * A.S, bot = y0 + A.sideH;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, "rgba(55,45,34,0)");
    g.addColorStop(1, "rgba(55,45,34,0.6)");
    ctx.fillStyle = g;
    ctx.fillRect(0, top, width, bot - top);
  }
}

// ---------------------------------------------------------------- body
function bodyShell(A) {
  const hood = extrudeProfile(
    [[1.3, CAB_FLOOR], [4.02, CAB_FLOOR], [4.08, 1.2], [4.08, 1.98], [3.95, 2.04], [1.3, 2.12]],
    HOOD_HW,
    { thickness: 0.07, size: 0.05, segments: 3 },
  );
  const h = hood.attributes.position;
  for (let i = 0; i < h.count; i++) {
    const t = THREE.MathUtils.clamp((h.getY(i) - 1.6) / 0.5, 0, 1);
    h.setX(i, h.getX(i) * (1 - 0.1 * t));
  }
  const cab = extrudeProfile(
    [
      [-1.6, CAB_FLOOR], [1.35, CAB_FLOOR], [1.35, 2.15], [1.22, 2.2], [1.02, 2.95], [0.88, 3.06],
      [0.12, 3.08], [-0.04, 3.3], [-1.45, 3.36], [-1.6, 3.26],
    ],
    CAB_HW,
    { thickness: 0.07, size: 0.05, segments: 3 },
  );
  return [A.uvs(hood), A.uvs(cab)];
}

// World-scaled planar UVs for parts that use a tiling texture.
function planarUV(geo, s = 0.6) {
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

function archBand(cz, cy, rOut, rIn, a0, a1, hw, x) {
  const pts = [];
  const N = 20;
  for (let i = 0; i <= N; i++) {
    const a = a0 + (i / N) * (a1 - a0);
    pts.push([cz + Math.cos(a) * rOut, cy + Math.sin(a) * rOut]);
  }
  for (let i = N; i >= 0; i--) {
    const a = a0 + (i / N) * (a1 - a0);
    pts.push([cz + Math.cos(a) * rIn, cy + Math.sin(a) * rIn]);
  }
  const g = extrudeProfile(pts, hw, { thickness: 0.03, size: 0.02, segments: 2 });
  g.translate(x, 0, 0);
  return planarUV(g);
}

// ---------------------------------------------------------------- wheels
function tyreGeo() {
  const hw = 0.14, rIn = 0.33, sh = 0.06;
  const prof = [new THREE.Vector2(rIn, -hw * 0.9), new THREE.Vector2(WHEEL_R - sh, -hw)];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI;
    prof.push(new THREE.Vector2(WHEEL_R - sh + Math.cos(a) * sh, Math.sin(a) * hw));
  }
  prof.push(new THREE.Vector2(WHEEL_R - sh, hw), new THREE.Vector2(rIn, hw * 0.9));
  const tyre = new THREE.LatheGeometry(prof, 40);
  // highway rib tread: shallow circumferential grooves via thin rings
  const ribs = [-0.07, 0, 0.07].map((y) => place(new THREE.TorusGeometry(WHEEL_R - 0.004, 0.012, 4, 40), { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] }));
  return [tyre, ...ribs];
}

function buildWheel(mats, name, dual) {
  // Built with the axle along Y, outboard face at +Y, then turned onto X.
  const g = new THREE.Group();
  g.name = name;
  const offsets = dual ? [DUAL_OFFSET, -DUAL_OFFSET] : [0];
  const tyres = [], rims = [], chrome = [];
  offsets.forEach((o, k) => {
    for (const t of tyreGeo()) tyres.push(t.translate(0, o, 0));
    rims.push(place(new THREE.CylinderGeometry(0.33, 0.33, 0.26, 32, 1, true), { pos: [0, o, 0] }));
    if (k === 0) {
      // outboard face: dished steel disc with hand holes, hub and lug nuts
      rims.push(place(new THREE.CylinderGeometry(0.32, 0.26, 0.03, 32), { pos: [0, o + 0.1, 0] }));
      chrome.push(place(new THREE.CylinderGeometry(0.12, 0.15, 0.1, 20), { pos: [0, o + 0.14, 0] }));
      chrome.push(place(new THREE.ConeGeometry(0.09, dual ? 0.08 : 0.22, 16), { pos: [0, o + (dual ? 0.23 : 0.3), 0] }));
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        chrome.push(place(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 6), { pos: [Math.cos(a) * 0.2, o + 0.13, Math.sin(a) * 0.2] }));
        if (i % 2 === 0) rims.push(place(new THREE.CylinderGeometry(0.035, 0.035, 0.035, 10), { pos: [Math.cos(a + 0.3) * 0.27, o + 0.11, Math.sin(a + 0.3) * 0.27] }));
      }
    }
  });
  const turn = (mesh) => {
    mesh.rotation.z = -Math.PI / 2;
    g.add(mesh);
  };
  turn(merged(tyres, mats.rubber, name + "_tyre"));
  turn(merged(rims, mats.rim, name + "_rim"));
  turn(merged(chrome, mats.chrome, name + "_hub"));
  return g;
}

// ---------------------------------------------------------------- parts
function buildFront(mats) {
  const g = new THREE.Group();
  g.name = "Front";
  const zG = NOSE_Z + 0.02;
  const chrome = [], dark = [], lamps = [];
  // tall grille: surround, header badge, horizontal bars
  for (const s of [-1, 1]) chrome.push(box(0.08, 1.02, 0.08, { pos: [s * 0.64, 1.55, zG] }));
  chrome.push(box(1.36, 0.1, 0.08, { pos: [0, 2.04, zG] }), box(1.36, 0.07, 0.08, { pos: [0, 1.06, zG] }));
  chrome.push(box(0.36, 0.1, 0.03, { pos: [0, 2.0, zG + 0.05] }));
  dark.push(box(1.22, 0.92, 0.02, { pos: [0, 1.55, zG - 0.02] }));
  for (let i = 0; i < 15; i++) chrome.push(box(1.22, 0.022, 0.035, { pos: [0, 1.13 + i * 0.058, zG] }));
  chrome.push(box(0.03, 0.92, 0.04, { pos: [0, 1.55, zG + 0.01] }));
  // headlamp pods on the fender noses
  for (const s of [-1, 1]) {
    for (const dx of [-0.13, 0.13]) {
      chrome.push(place(new THREE.CylinderGeometry(0.1, 0.11, 0.1, 18), { pos: [s * 0.95 + dx, 1.12, 3.3], rot: [Math.PI / 2, 0, 0] }));
      lamps.push(place(new THREE.CircleGeometry(0.085, 18), { pos: [s * 0.95 + dx, 1.12, 3.352] }));
    }
    chrome.push(box(0.12, 0.2, 0.2, { pos: [s * 0.95, 1.0, 3.2] }));
  }
  g.add(merged(chrome, mats.chrome, "Grille_chrome"));
  g.add(merged(dark, mats.black, "Grille_back"));
  g.add(merged(lamps, mats.lamp, "Headlamps"));
  return g;
}

function buildGuard(mats) {
  // Welded grille guard: heavy bumper, tall posts, and a toothed plough skirt.
  const g = new THREE.Group();
  g.name = "Ram";
  const steel = [], teeth = [], lamps = [];
  const zB = 4.36, zP = 4.56;
  steel.push(box(2.56, 0.36, 0.34, { pos: [0, 0.8, zB] }));
  const xs = [-1.18, -0.78, -0.3, 0.3, 0.78, 1.18];
  for (const x of xs) steel.push(box(0.11, 1.36, 0.11, { pos: [x, 1.38, zP] }));
  for (const y of [1.4, 2.05]) steel.push(box(2.48, 0.1, 0.1, { pos: [0, y, zP] }));
  for (const s of [-1, 1]) steel.push(tube([s * 1.18, 2.05, zP], [s * 1.0, 1.9, 3.4], 0.04));
  // plough skirt: a raked plate with fins, finished in wedge teeth
  steel.push(box(2.5, 0.34, 0.04, { pos: [0, 0.46, zP + 0.1], rot: [-0.55, 0, 0] }));
  for (const x of xs) steel.push(box(0.05, 0.36, 0.32, { pos: [x, 0.47, zP - 0.02], rot: [-0.55, 0, 0] }));
  for (let i = 0; i < 9; i++) {
    const x = -1.12 + i * 0.28;
    teeth.push(spike([x, 0.3, zP + 0.18], [0, -0.45, 1], 0.24, 0.06));
  }
  for (const x of [-0.78, 0.78]) teeth.push(spike([x, 1.4, zP + 0.05], [0, 0, 1], 0.2, 0.045));
  for (const x of [-1.18, 1.18]) teeth.push(spike([x, 2.1, zP], [x * 0.2, 0.6, 1], 0.2, 0.045));
  // driving lamps in the bumper ends
  for (const s of [-1, 1]) {
    for (const x of [0.95, 1.12]) {
      steel.push(place(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 16), { pos: [s * x, 0.82, zB + 0.18], rot: [Math.PI / 2, 0, 0] }));
      lamps.push(place(new THREE.CircleGeometry(0.06, 16), { pos: [s * x, 0.82, zB + 0.212] }));
    }
  }
  g.add(merged(steel.map((s) => planarUV(s, 1.2)), mats.rustSteel, "Ram_frame"));
  g.add(merged(teeth, mats.teeth, "Ram_teeth"));
  g.add(merged(lamps, mats.lamp, "Ram_lamps"));
  return g;
}

function buildChassis(mats) {
  const g = new THREE.Group();
  g.name = "Chassis";
  const black = [], steel = [], chrome = [], paint = [], red = [], rubber = [];
  // frame rails and cross members
  for (const s of [-1, 1]) black.push(box(0.12, 0.28, 8.8, { pos: [s * 0.48, 0.86, -0.3] }));
  for (const z of [3.8, 1.5, -1.2, -3.3, -4.6]) black.push(box(0.84, 0.18, 0.1, { pos: [0, 0.86, z] }));
  // front fenders sweeping over the steer axle, rear quarter fenders
  for (const s of [-1, 1]) {
    paint.push(archBand(FRONT_AXLE, AXLE_Y, 0.74, 0.6, 0.06 * Math.PI, 0.98 * Math.PI, 0.27, s * 0.92));
    for (const cz of REAR_AXLES) {
      const f = new THREE.TorusGeometry(WHEEL_R + 0.1, 0.04, 6, 18, Math.PI * 0.62);
      f.rotateZ(Math.PI * 0.19);
      f.scale(1, 1, 8);
      f.rotateY(-Math.PI / 2);
      f.translate(s * REAR_TRACK_HW, AXLE_Y, cz);
      chrome.push(f);
    }
    // mud flaps behind the last axle and between the drives
    rubber.push(box(0.6, 0.62, 0.02, { pos: [s * REAR_TRACK_HW, 0.58, -4.68] }));
    chrome.push(box(0.62, 0.04, 0.04, { pos: [s * REAR_TRACK_HW, 0.9, -4.67] }));
    // fuel tanks with straps
    chrome.push(place(new THREE.CylinderGeometry(0.32, 0.32, 1.12, 24), { pos: [s * 0.98, 0.82, 0.65], rot: [Math.PI / 2, 0, 0] }));
    for (const z of [0.25, 1.05]) black.push(place(new THREE.TorusGeometry(0.325, 0.018, 6, 24), { pos: [s * 0.98, 0.82, z] }));
    // steps and a toolbox under the sleeper
    for (const [y, z] of [[0.52, 1.4], [0.82, 1.52]]) steel.push(box(0.36, 0.05, 0.3, { pos: [s * 1.02, y, z] }));
    steel.push(box(0.46, 0.5, 0.95, { pos: [s * 0.98, 0.8, -0.9] }));
    // air cleaner cans on the cowl
    chrome.push(place(new THREE.CylinderGeometry(0.22, 0.22, 0.85, 24), { pos: [s * 0.98, 1.78, 1.58] }));
    chrome.push(place(new THREE.SphereGeometry(0.22, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [s * 0.98, 2.2, 1.58], scale: [1, 0.35, 1] }));
    chrome.push(tube([s * 0.98, 1.55, 1.58], [s * 0.62, 1.55, 1.7], 0.07, 12));
    // tail lamps on the frame ends
    red.push(box(0.2, 0.08, 0.04, { pos: [s * 0.75, 0.95, -4.7] }));
  }
  // deck plate and fifth wheel
  steel.push(box(1.3, 0.04, 0.6, { pos: [0, 1.02, -1.95] }));
  steel.push(box(1.3, 0.1, 1.05, { pos: [0, 1.1, -3.3] }));
  black.push(box(0.12, 0.11, 0.5, { pos: [0, 1.11, -3.05] }));
  steel.push(box(1.1, 0.14, 0.4, { pos: [0, 0.98, -3.3] }));
  g.add(merged(black, mats.black, "Chassis_frame"));
  g.add(merged(steel.map((x) => planarUV(x, 1.2)), mats.rustSteel, "Chassis_steel"));
  g.add(merged(chrome, mats.chrome, "Chassis_chrome"));
  g.add(merged(paint, mats.fenderPaint, "Chassis_fenders"));
  g.add(merged(red, mats.tail, "Chassis_taillamps"));
  g.add(merged(rubber, mats.rubber, "Chassis_mudflaps"));
  return g;
}

function buildCabParts(mats) {
  const g = new THREE.Group();
  g.name = "CabParts";
  const chrome = [], shield = [], dark = [], amber = [];
  // twin stacks at the back of the cab, with heat shields and rain caps
  for (const s of [-1, 1]) {
    const x = s * 1.22, z = 0.02;
    chrome.push(tube([x, 1.0, z], [x, 4.25, z], 0.085, 16));
    shield.push(place(new THREE.CylinderGeometry(0.112, 0.112, 1.1, 20, 1, true), { pos: [x, 2.35, z] }));
    for (const y of [1.85, 2.85]) chrome.push(place(new THREE.TorusGeometry(0.114, 0.014, 6, 20), { pos: [x, y, z], rot: [Math.PI / 2, 0, 0] }));
    dark.push(box(0.2, 0.012, 0.2, { pos: [x, 4.27, z - 0.04], rot: [-0.35, 0, 0] }));
    // mounting brackets to the cab
    chrome.push(tube([x, 1.6, z], [s * 1.12, 1.6, z], 0.025), tube([x, 2.95, z], [s * 1.12, 2.95, z], 0.025));
    // west-coast mirrors
    chrome.push(tube([s * 1.13, 2.35, 1.2], [s * 1.46, 2.4, 1.28], 0.018));
    chrome.push(tube([s * 1.13, 2.85, 1.05], [s * 1.46, 2.8, 1.28], 0.018));
    dark.push(box(0.07, 0.55, 0.22, { pos: [s * 1.48, 2.6, 1.3] }));
    chrome.push(box(0.08, 0.58, 0.24, { pos: [s * 1.47, 2.6, 1.3] }));
    // air horns on the cab roof
    chrome.push(place(new THREE.CylinderGeometry(0.035, 0.07, 0.5, 14), { pos: [s * 0.35, 3.18, 0.55], rot: [Math.PI / 2, 0, 0] }));
  }
  // sun visor with a row of cab marker lamps
  dark.push(box(2.1, 0.04, 0.3, { pos: [0, 3.05, 1.05], rot: [0.28, 0, 0] }));
  for (let i = 0; i < 5; i++) amber.push(place(new THREE.SphereGeometry(0.045, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [-0.5 + i * 0.25, 3.08, 1.18] }));
  // sleeper roof lamp bar and corner markers
  dark.push(box(1.9, 0.08, 0.1, { pos: [0, 3.4, -0.02] }));
  for (let i = 0; i < 7; i++) amber.push(box(0.1, 0.07, 0.05, { pos: [-0.9 + i * 0.3, 3.4, 0.04] }));
  for (const s of [-1, 1]) for (const z of [-1.5, 0.0]) amber.push(place(new THREE.SphereGeometry(0.04, 10, 6), { pos: [s * 1.1, 3.3, z] }));
  // hood ornament and marker lamps on the fenders
  chrome.push(place(new THREE.ConeGeometry(0.03, 0.12, 8), { pos: [0, 2.14, 3.95], rot: [Math.PI / 2 - 0.3, 0, 0] }));
  for (const s of [-1, 1]) amber.push(place(new THREE.SphereGeometry(0.035, 8, 6), { pos: [s * 0.92, 1.28, 2.6] }));
  g.add(merged(chrome, mats.chrome, "Cab_chrome"));
  g.add(merged(shield, mats.heatShield, "Cab_heatshields"));
  g.add(merged(dark, mats.black, "Cab_trim"));
  g.add(merged(amber, mats.amber, "Cab_markerlamps"));
  return g;
}

// ---------------------------------------------------------------- assembly
export function buildMileMarker() {
  const A = createAtlas({
    width: 2048, height: 2752, spanZ: 3.05, centerZ: 1.25, spanY: 3.45, spanX: 1.25,
    sideH: 840, topH: 512, endH: 512, endMinZ: 0,
  });
  paintSide(A, "L");
  paintSide(A, "R");
  paintTop(A);
  paintEnds(A);
  weather(A, rng(0x88));
  const steelTex = makeSteelTexture();
  const fenderTex = makeSteelTexture();
  const mats = {
    paint: new THREE.MeshStandardMaterial({ name: "MM_Paint", map: A.texture("mile_marker_livery"), roughness: 0.6, metalness: 0.3 }),
    fenderPaint: new THREE.MeshStandardMaterial({ name: "MM_FenderPaint", map: fenderTex, color: 0x5d7fb5, roughness: 0.6, metalness: 0.35 }),
    rustSteel: new THREE.MeshStandardMaterial({ name: "MM_RustSteel", map: steelTex, color: 0xa9a49c, roughness: 0.55, metalness: 0.7 }),
    teeth: new THREE.MeshStandardMaterial({ name: "MM_Teeth", color: 0xb0b3b6, roughness: 0.35, metalness: 0.9 }),
    chrome: new THREE.MeshStandardMaterial({ name: "MM_Chrome", color: 0xc9cbcc, roughness: 0.25, metalness: 1 }),
    heatShield: new THREE.MeshStandardMaterial({ name: "MM_HeatShield", color: 0x55585c, roughness: 0.5, metalness: 0.8 }),
    black: new THREE.MeshStandardMaterial({ name: "MM_Black", color: 0x17181a, roughness: 0.7, metalness: 0.3 }),
    rubber: new THREE.MeshStandardMaterial({ name: "MM_Rubber", color: 0x141414, roughness: 0.93, metalness: 0 }),
    rim: new THREE.MeshStandardMaterial({ name: "MM_Rim", color: 0x2b2d30, roughness: 0.5, metalness: 0.6 }),
    lamp: new THREE.MeshStandardMaterial({ name: "MM_Headlamp", color: 0xfff4d8, emissive: 0xffe6b0, emissiveIntensity: 1.5, roughness: 0.1 }),
    amber: new THREE.MeshStandardMaterial({ name: "MM_Amber", color: 0xffa228, emissive: 0xff8a10, emissiveIntensity: 1.4, roughness: 0.2 }),
    tail: new THREE.MeshStandardMaterial({ name: "MM_TailLamp", color: 0x9a1418, emissive: 0x900a0a, emissiveIntensity: 0.7, roughness: 0.2 }),
  };

  const root = new THREE.Group();
  root.name = "MileMarker";
  const body = new THREE.Group();
  body.name = "Body";
  body.add(merged(bodyShell(A), mats.paint, "Body_shell"));
  root.add(body);

  const wheels = [
    ["Wheel_FL", -FRONT_TRACK_HW, FRONT_AXLE, false],
    ["Wheel_FR", FRONT_TRACK_HW, FRONT_AXLE, false],
    ["Wheel_R1L", -REAR_TRACK_HW, REAR_AXLES[0], true],
    ["Wheel_R1R", REAR_TRACK_HW, REAR_AXLES[0], true],
    ["Wheel_R2L", -REAR_TRACK_HW, REAR_AXLES[1], true],
    ["Wheel_R2R", REAR_TRACK_HW, REAR_AXLES[1], true],
  ];
  for (const [name, x, z, dual] of wheels) {
    const w = buildWheel(mats, name, dual);
    w.position.set(x, AXLE_Y, z);
    if (x < 0) w.rotation.y = Math.PI;
    root.add(w);
  }
  root.add(buildFront(mats));
  root.add(buildGuard(mats));
  root.add(buildChassis(mats));
  root.add(buildCabParts(mats));

  root.userData = {
    vehicle: "Mile Marker",
    driver: "\"Turnpike\" Dalton",
    class: "Semi (Heavy)",
    units: "metres",
    forward: "+Z",
    wheelRadius: WHEEL_R,
    axles: [FRONT_AXLE, ...REAR_AXLES],
    frontTrack: FRONT_TRACK_HW * 2,
    rearTrack: REAR_TRACK_HW * 2,
    fifthWheel: [0, 1.16, -3.3],
  };
  return root;
}

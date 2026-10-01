// Formula Racer: an open-wheel single-seater in the style of a junior
// formula car, silver and white with red panels. A lofted monocoque with a
// raised nose, sidepods with open intakes, a roll hoop and airbox, wishbone
// suspension out to slick tyres on mesh wheels, a two-element front wing and
// a big rear wing on tall endplates.
//
// Same conventions as the other cars: metres, +Y up, facing +Z, each wheel is
// its own node with its origin on the axle.
import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { box, createAtlas, extrudeProfile, merged, place, poly, rng, stencilText, tube } from "./kit.js";

// ---------------------------------------------------------------- dimensions
const FRONT = { z: 1.3, r: 0.27, w: 0.2, x: 0.72 };
const REAR = { z: -1.25, r: 0.29, w: 0.28, x: 0.7 };

const RED = "#c8161d";
const RED_DARK = "#8e0f14";
const WHITE = "#eeeeec";
const SILVER = "#b9bcc0";
const BLACK = "#121214";

// Monocoque and sidepod cross sections: z, centre x, half width, bottom, top.
const TUB = [
  [2.08, 0, 0.05, 0.17, 0.25],
  [1.85, 0, 0.11, 0.13, 0.32],
  [1.45, 0, 0.19, 0.1, 0.44],
  [1.0, 0, 0.25, 0.1, 0.55],
  [0.55, 0, 0.3, 0.1, 0.6],
  [0.3, 0, 0.32, 0.1, 0.5],
  [-0.2, 0, 0.33, 0.1, 0.5],
  [-0.4, 0, 0.32, 0.1, 0.62],
  [-0.72, 0, 0.27, 0.1, 0.74],
  [-1.1, 0, 0.2, 0.1, 0.6],
  [-1.5, 0, 0.13, 0.12, 0.42],
  [-1.82, 0, 0.07, 0.15, 0.3],
];
const POD = [
  [0.46, 0.52, 0.2, 0.12, 0.42],
  [0.1, 0.54, 0.23, 0.1, 0.44],
  [-0.5, 0.5, 0.21, 0.1, 0.4],
  [-1.0, 0.38, 0.12, 0.1, 0.27],
];

// ---------------------------------------------------------------- livery
function paintSide(A, side) {
  const { ctx } = A;
  const m = (z, y) => A.sidePx(side, z, y);
  const y0 = side === "L" ? A.L0 : A.R0;
  // silver lower, white upper
  const g = ctx.createLinearGradient(...m(0, 0.1), ...m(0, 0.75));
  g.addColorStop(0, SILVER);
  g.addColorStop(0.45, "#d4d6d8");
  g.addColorStop(1, WHITE);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, A.width, A.sideH);
  // red flash sweeping down the nose side and back along the sidepod
  ctx.fillStyle = RED;
  poly(ctx, m, [[2.05, 0.22], [1.6, 0.36], [0.55, 0.42], [0.46, 0.3], [-0.9, 0.24], [-0.9, 0.12], [0.46, 0.12], [1.2, 0.18]]);
  ctx.fill();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(...m(2.0, 0.26));
  ctx.lineTo(...m(1.6, 0.4));
  ctx.lineTo(...m(0.55, 0.46));
  ctx.stroke();
  // silver chevron on the engine cover
  ctx.fillStyle = SILVER;
  poly(ctx, m, [[-0.3, 0.46], [-0.75, 0.72], [-1.1, 0.62], [-0.6, 0.46]]);
  ctx.fill();
  ctx.fillStyle = RED;
  poly(ctx, m, [[-0.62, 0.46], [-1.1, 0.6], [-1.45, 0.44], [-1.0, 0.4]]);
  ctx.fill();
  // cockpit edge in black
  ctx.fillStyle = BLACK;
  poly(ctx, m, [[0.34, 0.5], [0.3, 0.53], [-0.26, 0.53], [-0.3, 0.5]]);
  ctx.fill();
  // race number roundel on the sidepod
  const [nx, ny] = m(-0.25, 0.27);
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(nx, ny, 0.1 * A.S, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = 4;
  ctx.stroke();
  stencilText(ctx, "27", nx, ny + 2, 0.13 * A.S, BLACK);
  // panel fasteners
  ctx.fillStyle = "rgba(60,60,64,0.6)";
  for (const [z, y] of [[1.7, 0.3], [1.2, 0.36], [0.7, 0.44], [-0.9, 0.5], [-1.3, 0.4]]) {
    const [x, py] = m(z, y);
    ctx.beginPath();
    ctx.arc(x, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintTop(A) {
  const { ctx } = A;
  const m = (z, x) => A.topPx(z, x);
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, A.T0, A.width, A.topH);
  // silver edges down the nose and tub
  ctx.fillStyle = SILVER;
  for (const s of [-1, 1]) {
    poly(ctx, m, [[2.1, s * 0.03], [1.5, s * 0.17], [0.6, s * 0.28], [0.6, s * 0.4], [2.1, s * 0.4]]);
    ctx.fill();
  }
  // red kite on the nose with a white keyline
  const kite = [[2.02, 0], [1.6, -0.08], [0.95, -0.17], [0.62, -0.14], [0.62, 0.14], [0.95, 0.17], [1.6, 0.08]];
  ctx.fillStyle = RED;
  poly(ctx, m, kite);
  ctx.fill();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 8;
  poly(ctx, m, kite);
  ctx.stroke();
  // cockpit opening and the padded rim
  ctx.fillStyle = BLACK;
  ctx.beginPath();
  const [cx, cy] = m(0.05, 0);
  ctx.ellipse(cx, cy, 0.33 * A.S, 0.24 * (A.topH / 1.8), 0, 0, Math.PI * 2);
  ctx.fill();
  // red sidepod tops with a white diagonal
  for (const s of [-1, 1]) {
    ctx.fillStyle = RED;
    poly(ctx, m, [[0.48, s * 0.34], [0.48, s * 0.74], [-0.55, s * 0.72], [-1.0, s * 0.5], [-1.0, s * 0.3]]);
    ctx.fill();
    ctx.fillStyle = WHITE;
    poly(ctx, m, [[0.2, s * 0.34], [0.05, s * 0.34], [-0.25, s * 0.74], [-0.1, s * 0.74]]);
    ctx.fill();
  }
  // engine cover: silver spine, red chevrons
  ctx.fillStyle = SILVER;
  poly(ctx, m, [[-0.35, -0.12], [-0.35, 0.12], [-1.85, 0.05], [-1.85, -0.05]]);
  ctx.fill();
  ctx.fillStyle = RED;
  for (const z of [-1.0, -1.3]) {
    poly(ctx, m, [[z, -0.2], [z + 0.12, 0], [z, 0.2], [z - 0.08, 0.2], [z + 0.04, 0], [z - 0.08, -0.2]]);
    ctx.fill();
  }
}

function paintEnds(A) {
  const { ctx } = A;
  const f = (x, y) => A.endPx("F", x, y);
  ctx.fillStyle = SILVER;
  ctx.fillRect(0, A.E0, A.endW, A.endH);
  ctx.fillStyle = RED;
  poly(ctx, f, [[-0.06, 0.2], [0.06, 0.2], [0.06, 0.26], [-0.06, 0.26]]);
  ctx.fill();
  // open sidepod intakes
  ctx.fillStyle = "#050506";
  for (const s of [-1, 1]) {
    poly(ctx, f, [[s * 0.35, 0.15], [s * 0.69, 0.15], [s * 0.71, 0.38], [s * 0.35, 0.4]]);
    ctx.fill();
  }
  ctx.fillStyle = SILVER;
  ctx.fillRect(A.endW, A.E0, A.endW, A.endH);
}

function weather(A, rand) {
  // A kept race car: fine grain, a few stone chips low on the nose and pods,
  // brake-dust haze at the bottom edge.
  const { ctx, width } = A;
  for (const [y0, h] of [[A.L0, A.sideH], [A.R0, A.sideH], [A.T0, A.topH], [A.E0, A.endH]]) {
    const img = ctx.getImageData(0, y0, width, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rand() - 0.5) * 8;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(img, 0, y0);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(80,80,84,${0.2 + rand() * 0.4})`;
      ctx.beginPath();
      ctx.arc(rand() * width, y0 + h * (0.5 + rand() * 0.5), 1 + rand() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const y0 of [A.L0, A.R0]) {
    const top = y0 + (1.0 - 0.25) * A.S, bot = y0 + A.sideH;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, "rgba(60,55,50,0)");
    g.addColorStop(1, "rgba(60,55,50,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, top, width, bot - top);
  }
}

// ---------------------------------------------------------------- geometry
// Loft rounded-box cross sections (a superellipse ring each) front to back.
function loft(sections, xSign = 1, N = 28, n = 3.2) {
  const rings = sections.map(([z, x, hw, yb, yt]) => {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      pts.push(new THREE.Vector3(
        xSign * x + hw * Math.sign(c) * Math.abs(c) ** (2 / n),
        (yb + yt) / 2 + ((yt - yb) / 2) * Math.sign(s) * Math.abs(s) ** (2 / n),
        z,
      ));
    }
    return pts;
  });
  const pos = [];
  const push = (...vs) => vs.forEach((v) => pos.push(v.x, v.y, v.z));
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < N; i++) {
      const a = rings[j][i], b = rings[j + 1][i], c = rings[j + 1][(i + 1) % N], d = rings[j][(i + 1) % N];
      push(a, b, c, a, c, d);
    }
  }
  // caps: front faces +Z, back faces -Z
  const cap = (ring, front) => {
    const ctr = ring.reduce((acc, v) => acc.add(v), new THREE.Vector3()).multiplyScalar(1 / N);
    for (let i = 0; i < N; i++) {
      const a = ring[i], b = ring[(i + 1) % N];
      if (front) push(ctr, a, b);
      else push(ctr, b, a);
    }
  };
  cap(rings[0], true);
  cap(rings[rings.length - 1], false);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

// The atlas mapper leaves flat per-face normals; give the curved bodywork
// smooth ones by welding a copy by position and averaging.
function smoothNormals(geo) {
  const copy = geo.clone();
  copy.deleteAttribute("uv");
  copy.deleteAttribute("normal");
  const welded = mergeVertices(copy, 1e-4);
  welded.computeVertexNormals();
  geo.setAttribute("normal", welded.toNonIndexed().attributes.normal);
  return geo;
}

function airfoil(chord, span, thick = 0.1) {
  // Cambered section, leading edge at z=0, running back to z=-chord.
  const t = chord * thick;
  const pts = [
    [0, 0], [-0.04 * chord, 0.5 * t], [-0.25 * chord, 0.95 * t], [-0.55 * chord, 0.75 * t], [-chord, 0.08 * t],
    [-chord, 0], [-0.6 * chord, -0.05 * t], [-0.25 * chord, -0.2 * t], [-0.05 * chord, -0.25 * t],
  ];
  return extrudeProfile(pts, span, { thickness: 0.004, size: 0.003, segments: 1 });
}

// ---------------------------------------------------------------- wheels
function buildWheel(mats, name, spec) {
  const g = new THREE.Group();
  g.name = name;
  const hw = spec.w / 2, rIn = spec.r * 0.62, sh = 0.05;
  const prof = [new THREE.Vector2(rIn, -hw * 0.94), new THREE.Vector2(spec.r - sh, -hw)];
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI;
    prof.push(new THREE.Vector2(spec.r - sh + Math.cos(a) * sh, Math.sin(a) * (hw - sh * 0.2)));
  }
  prof.push(new THREE.Vector2(spec.r - sh, hw), new THREE.Vector2(rIn, hw * 0.94));
  const tyre = merged([new THREE.LatheGeometry(prof, 40)], mats.slick, name + "_tyre");
  tyre.rotation.z = Math.PI / 2;
  g.add(tyre);
  // mesh wheel: barrel, lip, criss-cross spokes, centre-lock nut
  const rim = [
    new THREE.CylinderGeometry(rIn, rIn, spec.w * 0.9, 28, 1, true),
    place(new THREE.TorusGeometry(rIn, 0.008, 6, 28), { pos: [0, hw * 0.85, 0], rot: [Math.PI / 2, 0, 0] }),
    place(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 12), { pos: [0, hw * 0.6, 0] }),
  ];
  const N = 12;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    for (const lean of [-0.35, 0.35]) {
      rim.push(tube([Math.cos(a + lean) * 0.05, hw * 0.55, Math.sin(a + lean) * 0.05], [Math.cos(a) * (rIn - 0.01), hw * 0.75, Math.sin(a) * (rIn - 0.01)], 0.007, 4));
    }
  }
  const nut = [place(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 6), { pos: [0, hw * 0.7, 0] })];
  const disc = [place(new THREE.CylinderGeometry(rIn * 0.8, rIn * 0.8, 0.02, 24), { pos: [0, -hw * 0.3, 0] })];
  for (const [geos, mat, suffix] of [[rim, mats.rim, "_rim"], [nut, mats.red, "_nut"], [disc, mats.darkMetal, "_disc"]]) {
    const mesh = merged(geos, mat, name + suffix);
    mesh.rotation.z = -Math.PI / 2;
    g.add(mesh);
  }
  return g;
}

// ---------------------------------------------------------------- parts
function buildWings(mats) {
  const g = new THREE.Group();
  g.name = "Wings";
  const silver = [], red = [], black = [];
  // front wing: silver main plane, red flap, silver endplates with red faces
  silver.push(airfoil(0.34, 0.86, 0.1).translate(0, 0.1, 2.3));
  const flap = airfoil(0.18, 0.84, 0.12);
  flap.rotateX(0.45);
  red.push(flap.translate(0, 0.16, 2.0));
  for (const s of [-1, 1]) {
    silver.push(box(0.025, 0.2, 0.44, { pos: [s * 0.88, 0.16, 2.08] }));
    red.push(box(0.027, 0.08, 0.3, { pos: [s * 0.88, 0.14, 2.03] }));
    black.push(tube([s * 0.06, 0.2, 2.12], [s * 0.1, 0.12, 2.12], 0.012));
  }
  // rear wing: red main plane, silver flap, tall silver endplates, pylons
  const main = airfoil(0.34, 0.5, 0.12);
  main.rotateX(0.15);
  red.push(main.translate(0, 0.9, -1.7));
  const rflap = airfoil(0.2, 0.49, 0.12);
  rflap.rotateX(0.6);
  silver.push(rflap.translate(0, 0.98, -1.98));
  for (const s of [-1, 1]) {
    silver.push(box(0.022, 0.52, 0.52, { pos: [s * 0.51, 0.84, -1.93] }));
    red.push(box(0.024, 0.16, 0.5, { pos: [s * 0.51, 1.02, -1.93] }));
    black.push(box(0.03, 0.62, 0.12, { pos: [s * 0.12, 0.6, -1.85], rot: [0.15, 0, 0] }));
  }
  g.add(merged(silver, mats.silver, "Wings_silver"));
  g.add(merged(red, mats.red, "Wings_red"));
  g.add(merged(black, mats.black, "Wings_pylons"));
  return g;
}

function buildSuspension(mats) {
  const g = new THREE.Group();
  g.name = "Suspension";
  const arms = [], uprights = [];
  for (const s of [-1, 1]) {
    for (const [spec, inX, zF, zB] of [[FRONT, 0.15, 0.18, -0.12], [REAR, 0.15, 0.2, -0.22]]) {
      const hub = [s * (spec.x - spec.w / 2 - 0.04), spec.r, spec.z];
      for (const [y, dy] of [[0.13, -0.1], [0.38, 0.1]]) {
        const joint = [hub[0], hub[1] + dy, hub[2]];
        arms.push(tube([s * inX, y, spec.z + zF], joint, 0.012, 6), tube([s * inX, y, spec.z + zB], joint, 0.012, 6));
      }
      arms.push(tube([hub[0], hub[1] - 0.1, hub[2]], [s * 0.18, 0.46, spec.z + 0.05], 0.01, 6)); // pushrod
      arms.push(tube([s * inX, 0.26, spec.z - 0.08], [hub[0], hub[1], hub[2] - 0.08], 0.009, 6)); // toe link
      uprights.push(box(0.05, 0.26, 0.08, { pos: hub }));
    }
  }
  g.add(merged(arms, mats.black, "Suspension_arms"));
  g.add(merged(uprights, mats.darkMetal, "Suspension_uprights"));
  return g;
}

function buildCockpit(mats) {
  const g = new THREE.Group();
  g.name = "Cockpit";
  const black = [], white = [], red = [];
  // roll hoop: an arch of tube segments behind the driver
  const hoop = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI;
    hoop.push([Math.cos(a) * 0.19, 0.55 + Math.sin(a) * 0.36, -0.36]);
  }
  for (let i = 0; i < hoop.length - 1; i++) black.push(tube(hoop[i], hoop[i + 1], 0.022, 8));
  black.push(tube([0, 0.9, -0.36], [0, 0.72, -0.72], 0.02, 6));
  // seat back, headrest pads, steering wheel and dash
  black.push(box(0.4, 0.34, 0.06, { pos: [0, 0.42, -0.26], rot: [-0.25, 0, 0] }));
  for (const s of [-1, 1]) black.push(box(0.07, 0.06, 0.28, { pos: [s * 0.25, 0.51, -0.12] }));
  black.push(place(new THREE.TorusGeometry(0.12, 0.018, 8, 20), { pos: [0, 0.55, 0.36], rot: [-0.3, 0, 0] }));
  black.push(box(0.36, 0.04, 0.06, { pos: [0, 0.54, 0.36] }));
  // mirrors on stalks at the front of the sidepods
  for (const s of [-1, 1]) {
    black.push(tube([s * 0.34, 0.45, 0.42], [s * 0.42, 0.6, 0.42], 0.008, 5));
    white.push(place(new THREE.SphereGeometry(0.05, 12, 8), { pos: [s * 0.44, 0.62, 0.42], scale: [1.2, 0.8, 0.7] }));
  }
  // floor, gearbox, exhaust and rain light
  const floor = [box(1.28, 0.03, 1.7, { pos: [0, 0.075, -0.25] }), box(0.5, 0.03, 0.9, { pos: [0, 0.075, 1.0] })];
  // matte insert over the painted cockpit opening so it reads as a hole, not a mirror
  floor.push(place(new THREE.CylinderGeometry(1, 1, 0.004, 28), { pos: [0, 0.505, 0.05], scale: [0.2, 1, 0.3] }));
  black.push(box(0.3, 0.22, 0.45, { pos: [0, 0.26, -1.8] }));
  const exhaust = [place(new THREE.CylinderGeometry(0.035, 0.04, 0.3, 12), { pos: [0, 0.42, -1.85], rot: [Math.PI / 2 + 0.3, 0, 0] })];
  red.push(box(0.12, 0.06, 0.03, { pos: [0, 0.3, -2.04] }));
  g.add(merged(black, mats.black, "Cockpit_black"));
  g.add(merged(floor, mats.floor, "Floor"));
  g.add(merged(white, mats.silver, "Cockpit_mirrors"));
  g.add(merged(exhaust, mats.darkMetal, "Cockpit_exhaust"));
  g.add(merged(red, mats.rainLight, "RainLight"));
  return g;
}

// ---------------------------------------------------------------- assembly
export function buildFormulaRacer() {
  const A = createAtlas({
    width: 2048, height: 1800, spanZ: 2.05, centerZ: 0.1, spanY: 1.0, spanX: 0.9,
    sideH: 500, topH: 512, endH: 256, endMinZ: 0,
  });
  paintSide(A, "L");
  paintSide(A, "R");
  paintTop(A);
  paintEnds(A);
  weather(A, rng(27));
  const mats = {
    paint: new THREE.MeshStandardMaterial({ name: "FR_Paint", map: A.texture("formula_livery"), roughness: 0.28, metalness: 0.15 }),
    red: new THREE.MeshStandardMaterial({ name: "FR_Red", color: 0xc8161d, roughness: 0.3, metalness: 0.15 }),
    silver: new THREE.MeshStandardMaterial({ name: "FR_Silver", color: 0xc4c7cb, roughness: 0.3, metalness: 0.4 }),
    black: new THREE.MeshStandardMaterial({ name: "FR_Black", color: 0x141416, roughness: 0.55, metalness: 0.2 }),
    darkMetal: new THREE.MeshStandardMaterial({ name: "FR_DarkMetal", color: 0x3a3c40, roughness: 0.4, metalness: 0.8 }),
    rim: new THREE.MeshStandardMaterial({ name: "FR_Rim", color: 0xd0d2d4, roughness: 0.25, metalness: 0.95 }),
    slick: new THREE.MeshStandardMaterial({ name: "FR_Slick", color: 0x2c2b2a, roughness: 0.85, metalness: 0 }),
    floor: new THREE.MeshStandardMaterial({ name: "FR_Floor", color: 0x101011, roughness: 0.95, metalness: 0 }),
    rainLight: new THREE.MeshStandardMaterial({ name: "FR_RainLight", color: 0xb01010, emissive: 0xff1010, emissiveIntensity: 1.2, roughness: 0.2 }),
  };
  const root = new THREE.Group();
  root.name = "FormulaRacer";
  const body = new THREE.Group();
  body.name = "Body";
  body.add(merged([loft(TUB), loft(POD, 1), loft(POD, -1)].map((g) => smoothNormals(A.uvs(g))), mats.paint, "Body_shell"));
  root.add(body);
  for (const [name, spec, s] of [
    ["Wheel_FL", FRONT, -1], ["Wheel_FR", FRONT, 1], ["Wheel_RL", REAR, -1], ["Wheel_RR", REAR, 1],
  ]) {
    const w = buildWheel(mats, name, spec);
    w.position.set(s * spec.x, spec.r, spec.z);
    if (s < 0) w.rotation.y = Math.PI;
    root.add(w);
  }
  root.add(buildWings(mats));
  root.add(buildSuspension(mats));
  root.add(buildCockpit(mats));
  root.userData = {
    vehicle: "Formula Racer",
    units: "metres",
    forward: "+Z",
    wheelRadius: { front: FRONT.r, rear: REAR.r },
    wheelbase: FRONT.z - REAR.z,
    track: { front: FRONT.x * 2, rear: REAR.x * 2 },
  };
  return root;
}

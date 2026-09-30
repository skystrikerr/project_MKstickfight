// Last Song: "Jukebox" Vale's car. A rusted purple late-70s luxury land
// yacht with tarnished gold trim, gold wire wheels, a chrome waterfall grille,
// a golden plow under the bumper and a wall of speaker cabinets strapped where
// the trunk lid used to be.
//
// Same conventions as the other cars: metres, +Y up, facing +Z, and each wheel
// is its own node with its origin on the axle.
import * as THREE from "three";
import {
  box, createAtlas, extrudeProfile, makeSteelTexture, merged, place, poly, rng, spike, stencilText, tube,
} from "./kit.js";

// ---------------------------------------------------------------- dimensions
const BODY_HW = 1.02;
const FRONT_AXLE = 1.75;
const REAR_AXLE = -1.35;
const AXLE_Y = 0.37;
const WHEEL_R = 0.37;
const ARCH_R = 0.48;
const TRACK_HW = 0.83;
const SILL_Y = 0.26;
const CABIN_BASE_HW = 0.93;
const CABIN_TOP_TAPER = 0.22;
const BELT_Y = 0.9;
const ROOF_Y = 1.41;
const NOSE_Z = 3.02; // front face including bevel
const TAIL_Z = -2.97;

const cabinHW = (y) => CABIN_BASE_HW * (1 - CABIN_TOP_TAPER * THREE.MathUtils.clamp((y - BELT_Y) / (ROOF_Y - BELT_Y), 0, 1));

const PURPLE = "#4a2961";
const PURPLE_DEEP = "#2d1840";
const VINYL = "#1b1420";
const GOLD = "#c7a04a";
const CHROME = "#bdb8ac";
const GLASS = "#0e1117";

// ---------------------------------------------------------------- livery
function paintSide(A, side) {
  const { ctx } = A;
  const m = (z, y) => A.sidePx(side, z, y);
  const y0 = side === "L" ? A.L0 : A.R0;
  const [, sill] = m(0, SILL_Y);
  ctx.fillStyle = PURPLE;
  ctx.fillRect(0, y0, A.width, sill - y0);
  ctx.fillStyle = "#0f0d10";
  ctx.fillRect(0, sill, A.width, y0 + A.sideH - sill);
  // metallic sheen band along the shoulder
  const [, sh0] = m(0, 0.92);
  const [, sh1] = m(0, 0.6);
  const g = ctx.createLinearGradient(0, sh0, 0, sh1);
  g.addColorStop(0, "rgba(190,150,230,0.22)");
  g.addColorStop(1, "rgba(190,150,230,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, sh0, A.width, sh1 - sh0);

  // landau vinyl over the rear half of the greenhouse
  ctx.fillStyle = PURPLE_DEEP;
  poly(ctx, m, [[1.1, 0.9], [1.1, 1.6], [-1.6, 1.6], [-1.6, 0.9]]);
  ctx.fill();
  ctx.fillStyle = VINYL;
  poly(ctx, m, [[-0.4, 0.93], [-0.4, 1.6], [-1.6, 1.6], [-1.6, 0.93]]);
  ctx.fill();
  // glass: front door, rear door, and a little opera window in the C-pillar
  ctx.fillStyle = GLASS;
  poly(ctx, m, [[0.92, 0.96], [0.2, 1.34], [-0.33, 1.35], [-0.33, 0.96]]);
  ctx.fill();
  poly(ctx, m, [[-0.44, 0.96], [-0.44, 1.35], [-0.9, 1.35], [-0.9, 0.96]]);
  ctx.fill();
  poly(ctx, m, [[-1.02, 1.08], [-1.02, 1.24], [-1.14, 1.24], [-1.14, 1.08]]);
  ctx.fill();
  ctx.strokeStyle = GOLD; // opera-window surround
  ctx.lineWidth = 3;
  poly(ctx, m, [[-1.02, 1.08], [-1.02, 1.24], [-1.14, 1.24], [-1.14, 1.08]]);
  ctx.stroke();
  ctx.strokeStyle = "rgba(200,180,230,0.2)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(...m(0.7, 1.0));
  ctx.lineTo(...m(0.35, 1.28));
  ctx.stroke();

  // brightwork: belt moulding, bodyside strip, rocker, arch lips
  const strip = (yA, yB, colour) => {
    ctx.fillStyle = colour;
    poly(ctx, m, [[-3.1, yA], [3.1, yA], [3.1, yB], [-3.1, yB]]);
    ctx.fill();
  };
  strip(0.9, 0.925, GOLD);
  strip(0.53, 0.565, CHROME);
  strip(0.27, 0.33, CHROME);
  ctx.strokeStyle = GOLD; // double pinstripe
  ctx.lineWidth = 2;
  for (const y of [0.79, 0.805]) {
    ctx.beginPath();
    ctx.moveTo(...m(2.9, y));
    ctx.lineTo(...m(-2.9, y));
    ctx.stroke();
  }
  ctx.strokeStyle = CHROME;
  ctx.lineWidth = 7;
  for (const cz of [FRONT_AXLE, REAR_AXLE]) {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI - (i / 24) * Math.PI;
      const p = m(cz + Math.cos(a) * (ARCH_R + 0.01), AXLE_Y + Math.sin(a) * (ARCH_R + 0.01));
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.stroke();
  }
  // shut lines and handles
  ctx.strokeStyle = "#140c1a";
  ctx.lineWidth = 3;
  for (const pts of [
    [[1.0, 0.3], [1.0, 0.92], [0.94, 0.96]],
    [[-0.38, 0.3], [-0.38, 1.36]],
    [[-0.95, 0.9], [-0.95, 0.4]],
    [[-1.4, 0.92], [-2.85, 0.92]],
    [[2.0, 0.89], [2.95, 0.87]],
  ]) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...m(...p)) : ctx.moveTo(...m(...p))));
    ctx.stroke();
  }
  ctx.fillStyle = CHROME;
  for (const z of [0.05, -1.0]) {
    poly(ctx, m, [[z, 0.83], [z, 0.86], [z - 0.15, 0.86], [z - 0.15, 0.83]]);
    ctx.fill();
  }
  // fender badge and the car's name in gold script on the rear quarter
  const [bx, by] = m(2.35, 0.68);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(bx, by - 14);
  ctx.lineTo(bx + 12, by);
  ctx.lineTo(bx, by + 14);
  ctx.lineTo(bx - 12, by);
  ctx.fill();
  const [nx, ny] = m(-2.1, 0.68);
  ctx.save();
  ctx.font = 'italic 700 46px "Brush Script MT", "Georgia", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#1a0f22";
  ctx.strokeText("Last Song", nx, ny);
  ctx.fillStyle = GOLD;
  ctx.fillText("Last Song", nx, ny);
  ctx.restore();
  // music-note decal on the front door
  const [mx, my] = m(0.3, 0.63);
  ctx.save();
  ctx.translate(mx, my);
  ctx.fillStyle = "rgba(199,160,74,0.85)";
  for (const dx of [-26, 26]) {
    ctx.beginPath();
    ctx.ellipse(dx, 30, 17, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(dx + 11, -40, 6, 70);
  }
  ctx.beginPath();
  ctx.moveTo(-15 + 2, -40);
  ctx.lineTo(43, -52);
  ctx.lineTo(43, -38);
  ctx.lineTo(-13, -26);
  ctx.fill();
  ctx.restore();
}

function paintTop(A) {
  const { ctx } = A;
  const m = (z, x) => A.topPx(z, x);
  ctx.fillStyle = PURPLE;
  ctx.fillRect(0, A.T0, A.width, A.topH);
  ctx.fillStyle = PURPLE_DEEP;
  poly(ctx, m, [[1.05, -1.2], [1.05, 1.2], [-1.45, 1.2], [-1.45, -1.2]]);
  ctx.fill();
  ctx.fillStyle = VINYL; // landau roof
  poly(ctx, m, [[-0.35, -0.8], [-0.35, 0.8], [-1.1, 0.8], [-1.1, -0.8]]);
  ctx.fill();
  ctx.fillStyle = GLASS;
  poly(ctx, m, [[1.0, -0.82], [1.0, 0.82], [0.22, 0.66], [0.22, -0.66]]);
  ctx.fill();
  poly(ctx, m, [[-1.1, -0.6], [-1.1, 0.6], [-1.36, 0.7], [-1.36, -0.7]]);
  ctx.fill();
  // hood: gold centre pinstripes and the long shut lines
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  for (const x of [-0.05, 0.05]) {
    ctx.beginPath();
    ctx.moveTo(...m(2.95, x));
    ctx.lineTo(...m(1.1, x));
    ctx.stroke();
  }
  ctx.strokeStyle = "#140c1a";
  poly(ctx, m, [[2.95, -0.92], [2.95, 0.92], [1.1, 0.92], [1.1, -0.92]]);
  ctx.stroke();
  const g = ctx.createLinearGradient(...m(0, -0.9), ...m(0, 0.9));
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.5, "rgba(210,170,255,0.12)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(...m(2.95, -0.9), (2.95 - 1.1) * A.S, (A.topH * 1.8) / 2.3);
}

function paintEnds(A) {
  const { ctx } = A;
  const f = (x, y) => A.endPx("F", x, y);
  ctx.fillStyle = PURPLE;
  ctx.fillRect(0, A.E0, A.endW, A.endH);
  ctx.fillStyle = "#0b0a0c";
  poly(ctx, f, [[-1.0, 0.45], [1.0, 0.45], [1.0, 0.86], [-1.0, 0.86]]);
  ctx.fill();
  const r = (x, y) => A.endPx("R", x, y);
  ctx.fillStyle = PURPLE;
  ctx.fillRect(A.endW, A.E0, A.endW, A.endH);
  ctx.fillStyle = "#a01c24"; // tall fin tail lamps
  for (const s of [-1, 1]) {
    poly(ctx, r, [[s * 0.84, 0.42], [s * 1.02, 0.42], [s * 1.02, 0.88], [s * 0.84, 0.88]]);
    ctx.fill();
  }
  ctx.fillStyle = "#5e0f16";
  poly(ctx, r, [[-0.8, 0.62], [0.8, 0.62], [0.8, 0.72], [-0.8, 0.72]]);
  ctx.fill();
  ctx.fillStyle = "#d6cfb8";
  poly(ctx, r, [[-0.17, 0.46], [0.17, 0.46], [0.17, 0.6], [-0.17, 0.6]]);
  ctx.fill();
  const [px, py] = r(0, 0.53);
  stencilText(ctx, "LST SNG", px, py, 22, "#4a2961", 90);
}

function weather(A, rand) {
  const { ctx, width } = A;
  // Rust only where the steel is: below the belt on the sides, on the hood
  // and trunk from above, anywhere on the ends. Never on glass or vinyl.
  const sideRust = (y0) => () => [rand() * width, y0 + (1.6 - 0.88 + rand() * (0.88 - 0.3)) * A.S];
  const topRust = () => {
    const [x, y] = A.topPx(rand() < 0.75 ? 1.15 + rand() * 1.8 : -1.5 - rand() * 1.4, (rand() - 0.5) * 2);
    return [x, y];
  };
  const regions = [
    [A.L0, A.sideH, sideRust(A.L0), 45],
    [A.R0, A.sideH, sideRust(A.R0), 45],
    [A.T0, A.topH, topRust, 22],
    [A.E0, A.endH, () => [rand() * width, A.E0 + rand() * A.endH], 16],
  ];
  for (const [y0, h, rustAt, rustCount] of regions) {
    const img = ctx.getImageData(0, y0, width, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      // metallic flake: tiny bright specks over the noise
      const n = (rand() - 0.5) * 22 + (rand() < 0.01 ? 40 : 0);
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(img, 0, y0);
    // big rust patches with pitted edges, the car's defining look
    // rust patches: clusters of small pits rather than one round blot, each
    // bleeding a streak downward
    for (let i = 0; i < rustCount; i++) {
      const [x, y] = rustAt();
      const r = 8 + rand() * 34;
      for (let k = 0; k < 14; k++) {
        const ox = x + (rand() - 0.5) * r * 1.6, oy = y + (rand() - 0.5) * r * 0.7;
        const rr = 2 + rand() * r * 0.3;
        ctx.fillStyle = `rgba(${95 + rand() * 30},${45 + rand() * 15},${22 + rand() * 8},${0.35 + rand() * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(ox, oy, rr * (1 + rand()), rr, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      const gr = ctx.createLinearGradient(x, y, x, y + r * 2.5);
      gr.addColorStop(0, "rgba(90,45,22,0.35)");
      gr.addColorStop(1, "rgba(90,45,22,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(x - r * 0.4, y, r * 0.8, r * 2.5);
    }
    for (let i = 0; i < 240; i++) {
      const r = 6 + rand() * 50;
      const x = rand() * width, y = y0 + rand() * h;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(30,24,20,${0.05 + rand() * 0.2})`);
      gr.addColorStop(1, "rgba(30,24,20,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 200; i++) {
      const x = rand() * width, y = y0 + rand() * h, a = rand() * Math.PI, l = 5 + rand() * 40;
      ctx.strokeStyle = `rgba(210,200,220,${0.05 + rand() * 0.18})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  }
  for (const y0 of [A.L0, A.R0]) {
    const top = y0 + (1.6 - 0.6) * A.S, bot = y0 + (1.6 - SILL_Y) * A.S;
    const gr = ctx.createLinearGradient(0, top, 0, bot);
    gr.addColorStop(0, "rgba(60,40,28,0)");
    gr.addColorStop(1, "rgba(60,40,28,0.6)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, top, width, bot - top);
  }
}

// ---------------------------------------------------------------- body
function arch(pts, cz) {
  pts.push([cz - ARCH_R, SILL_Y]);
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI - (i / 18) * Math.PI;
    pts.push([cz + Math.cos(a) * ARCH_R, AXLE_Y + Math.sin(a) * ARCH_R]);
  }
  pts.push([cz + ARCH_R, SILL_Y]);
}

function bodyShell(A) {
  const pts = [[-2.9, 0.34], [-2.8, SILL_Y]];
  arch(pts, REAR_AXLE);
  arch(pts, FRONT_AXLE);
  pts.push(
    [2.8, SILL_Y], [2.93, 0.32], [2.97, 0.48], [2.97, 0.8], [2.92, 0.87], [2.2, 0.89], [1.1, 0.9],
    [-1.2, 0.92], [-2.7, 0.93], [-2.88, 0.9], [-2.93, 0.7], [-2.92, 0.45],
  );
  const lower = extrudeProfile(pts, BODY_HW, { thickness: 0.07, size: 0.045, segments: 3 });
  const p = lower.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = Math.max(0, (Math.abs(p.getZ(i)) - 2.35) / 0.65);
    p.setX(i, p.getX(i) * (1 - 0.045 * t * t));
  }
  const cab = extrudeProfile(
    [[1.08, 0.86], [1.0, 0.92], [0.2, 1.37], [0.05, 1.4], [-0.95, ROOF_Y], [-1.08, 1.36], [-1.36, 0.95], [-1.4, 0.86]],
    CABIN_BASE_HW,
    { thickness: 0.05, size: 0.03, segments: 2 },
  );
  const c = cab.attributes.position;
  for (let i = 0; i < c.count; i++) c.setX(i, c.getX(i) * (cabinHW(c.getY(i)) / CABIN_BASE_HW));
  return [A.uvs(lower), A.uvs(cab)];
}

// ---------------------------------------------------------------- parts
function buildWheel(mats, name) {
  const g = new THREE.Group();
  g.name = name;
  const w = 0.125, rIn = 0.25;
  const prof = [new THREE.Vector2(rIn, -w * 0.92), new THREE.Vector2(WHEEL_R - 0.05, -w)];
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI;
    prof.push(new THREE.Vector2(WHEEL_R - 0.05 + Math.cos(a) * 0.05, Math.sin(a) * (w - 0.02)));
  }
  prof.push(new THREE.Vector2(WHEEL_R - 0.05, w), new THREE.Vector2(rIn, w * 0.92));
  const tyre = merged([new THREE.LatheGeometry(prof, 36)], mats.rubber, name + "_tyre");
  tyre.rotation.z = Math.PI / 2;
  g.add(tyre);

  // gold wire wheel: dished barrel, lip, crossed spokes and a knock-off spinner
  const gold = [
    new THREE.CylinderGeometry(0.25, 0.25, 0.2, 32, 1, true),
    place(new THREE.TorusGeometry(0.245, 0.014, 6, 32), { pos: [0, 0.1, 0], rot: [Math.PI / 2, 0, 0] }),
    place(new THREE.CylinderGeometry(0.24, 0.24, 0.01, 32), { pos: [0, 0.0, 0] }),
    place(new THREE.CylinderGeometry(0.07, 0.085, 0.07, 16), { pos: [0, 0.1, 0] }),
  ];
  const N = 18;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    for (const lean of [-0.25, 0.25]) {
      const hub = [Math.cos(a + lean) * 0.07, 0.11, Math.sin(a + lean) * 0.07];
      const rim = [Math.cos(a) * 0.235, 0.02, Math.sin(a) * 0.235];
      gold.push(tube(hub, rim, 0.006, 4));
    }
  }
  const spinner = [
    place(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 8), { pos: [0, 0.16, 0] }),
    box(0.2, 0.025, 0.035, { pos: [0, 0.17, 0] }),
    box(0.035, 0.025, 0.2, { pos: [0, 0.17, 0] }),
  ];
  const wheel = merged([...gold, ...spinner], mats.gold, name + "_rim");
  wheel.rotation.z = -Math.PI / 2;
  g.add(wheel);
  return g;
}

function buildFront(mats) {
  const g = new THREE.Group();
  g.name = "Front";
  const zF = NOSE_Z + 0.01;
  const chrome = [], black = [], lamps = [], amber = [];
  // waterfall grille: frame, header, vertical bars
  black.push(box(0.86, 0.34, 0.03, { pos: [0, 0.67, zF] }));
  chrome.push(box(0.94, 0.05, 0.06, { pos: [0, 0.86, zF + 0.02] }));
  chrome.push(box(0.94, 0.03, 0.05, { pos: [0, 0.49, zF + 0.02] }));
  for (const s of [-1, 1]) chrome.push(box(0.04, 0.4, 0.06, { pos: [s * 0.45, 0.67, zF + 0.02] }));
  for (let i = 0; i < 17; i++) chrome.push(box(0.014, 0.34, 0.04, { pos: [-0.4 + i * 0.05, 0.67, zF + 0.02] }));
  for (const y of [0.58, 0.76]) chrome.push(box(0.86, 0.01, 0.035, { pos: [0, y, zF + 0.015] }));
  // stacked square headlamps in chrome bezels, parking lamps below
  for (const s of [-1, 1]) {
    chrome.push(box(0.5, 0.2, 0.04, { pos: [s * 0.74, 0.73, zF] }));
    black.push(box(0.46, 0.16, 0.02, { pos: [s * 0.74, 0.73, zF + 0.015] }));
    for (const x of [0.62, 0.86]) lamps.push(box(0.2, 0.13, 0.02, { pos: [s * x, 0.73, zF + 0.027] }));
    amber.push(box(0.36, 0.06, 0.03, { pos: [s * 0.74, 0.56, zF + 0.01] }));
  }
  // heavy chrome bumper with wraparound ends and rubber strip
  chrome.push(box(2.0, 0.2, 0.17, { pos: [0, 0.39, zF + 0.08] }));
  for (const s of [-1, 1]) chrome.push(box(0.25, 0.2, 0.17, { pos: [s * 1.02, 0.39, zF - 0.01], rot: [0, s * 0.6, 0] }));
  black.push(box(2.02, 0.04, 0.02, { pos: [0, 0.4, zF + 0.17] }));
  // hood ornament: a stand-up wreath
  chrome.push(place(new THREE.CylinderGeometry(0.03, 0.04, 0.03, 12), { pos: [0, 0.92, 2.88] }));
  chrome.push(place(new THREE.TorusGeometry(0.04, 0.007, 6, 16), { pos: [0, 0.97, 2.88] }));
  chrome.push(place(new THREE.ConeGeometry(0.012, 0.06, 6), { pos: [0, 0.99, 2.88] }));

  // golden plow: a raked blade with fins and a row of teeth
  const plow = [];
  const zP = zF + 0.3;
  plow.push(box(1.9, 0.2, 0.035, { pos: [0, 0.18, zP], rot: [-0.5, 0, 0] }));
  for (let i = 0; i < 7; i++) {
    const x = -0.9 + i * 0.3;
    plow.push(box(0.04, 0.26, 0.28, { pos: [x, 0.22, zP - 0.1], rot: [-0.5, 0, 0] }));
  }
  for (const s of [-1, 1]) {
    plow.push(tube([s * 0.55, 0.3, zF + 0.05], [s * 0.55, 0.24, zP - 0.1], 0.035));
    plow.push(box(0.18, 0.2, 0.035, { pos: [s * 1.02, 0.18, zP - 0.1], rot: [-0.5, s * 0.7, 0] }));
  }
  const teeth = [];
  for (let i = 0; i < 9; i++) teeth.push(spike([-0.96 + i * 0.24, 0.1, zP + 0.05], [0, -0.3, 1], 0.14, 0.032));

  g.add(merged(chrome, mats.chrome, "Front_chrome"));
  g.add(merged(black, mats.trim, "Front_black"));
  g.add(merged(lamps, mats.lamp, "Front_headlamps"));
  g.add(merged(amber, mats.amber, "Front_parklamps"));
  g.add(merged(plow, mats.brass, "Plow"));
  g.add(merged(teeth, mats.brass, "Plow_teeth"));
  return g;
}

// A speaker built facing +Y, then turned to face `dir` and moved to `pos`.
function speaker(parts, R, pos, dir) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
  const put = (geo, list) => list.push(geo.applyQuaternion(q).translate(...pos));
  put(place(new THREE.CylinderGeometry(R * 1.1, R * 1.1, 0.02, 28), { pos: [0, 0.01, 0] }), parts.basket);
  put(place(new THREE.TorusGeometry(R * 0.9, R * 0.08, 6, 28), { pos: [0, 0.03, 0], rot: [Math.PI / 2, 0, 0] }), parts.cone);
  put(new THREE.LatheGeometry([new THREE.Vector2(R * 0.3, 0.022), new THREE.Vector2(R * 0.84, 0.032)], 28), parts.cone);
  put(place(new THREE.SphereGeometry(R * 0.3, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [0, 0.02, 0], scale: [1, 0.5, 1] }), parts.cap);
  put(place(new THREE.TorusGeometry(R * 1.13, 0.007, 5, 32), { pos: [0, 0.022, 0], rot: [Math.PI / 2, 0, 0] }), parts.neon);
}
function horn(parts, pos, dir) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
  parts.basket.push(place(new THREE.CylinderGeometry(0.1, 0.03, 0.08, 4, 1, true), { pos: [0, 0.04, 0], rot: [0, Math.PI / 4, 0] }).applyQuaternion(q).translate(...pos));
  parts.cone.push(place(new THREE.CircleGeometry(0.03, 8), { pos: [0, 0.005, 0], rot: [-Math.PI / 2, 0, 0] }).applyQuaternion(q).translate(...pos));
}

function buildSoundSystem(mats) {
  // Three tiers of cabinets over the trunk, cones out the sides and back.
  const g = new THREE.Group();
  g.name = "SoundSystem";
  const cabinets = [], corners = [], straps = [], posts = [];
  const parts = { basket: [], cone: [], cap: [], neon: [] };
  const cab = (hw, y0, y1, z0, z1) => {
    cabinets.push(box(hw * 2, y1 - y0, z0 - z1, { pos: [0, (y0 + y1) / 2, (z0 + z1) / 2] }));
    for (const x of [-hw, hw]) for (const y of [y0, y1]) for (const z of [z0, z1]) corners.push(box(0.06, 0.06, 0.06, { pos: [x, y, z] }));
  };
  // tier 1 fills the trunk
  cab(0.96, 0.93, 1.42, -1.46, -2.8);
  for (const s of [-1, 1]) for (const z of [-1.75, -2.13, -2.5]) speaker(parts, 0.15, [s * 0.96, 1.17, z], [s, 0, 0]);
  for (const x of [-0.48, 0.48]) speaker(parts, 0.2, [x, 1.17, -2.8], [0, 0, -1]);
  horn(parts, [0, 1.17, -2.8], [0, 0, -1]);
  // tier 2 overhangs the rear window on two posts
  cab(0.86, 1.42, 1.93, -1.0, -2.62);
  for (const s of [-1, 1]) for (const z of [-1.3, -1.81, -2.32]) speaker(parts, 0.19, [s * 0.86, 1.675, z], [s, 0, 0]);
  for (const x of [-0.54, 0, 0.54]) speaker(parts, 0.19, [x, 1.675, -2.62], [0, 0, -1]);
  for (const x of [-0.6, 0.6]) horn(parts, [x, 1.675, -1.0], [0, 0, 1]);
  speaker(parts, 0.16, [0, 1.675, -1.0], [0, 0, 1]);
  for (const s of [-1, 1]) posts.push(tube([s * 0.7, 0.95, -1.44], [s * 0.7, 1.42, -1.08], 0.03));
  // tier 3 on top
  cab(0.52, 1.93, 2.3, -1.55, -2.5);
  for (const s of [-1, 1]) for (const z of [-1.78, -2.25]) speaker(parts, 0.13, [s * 0.52, 2.115, z], [s, 0, 0]);
  for (const x of [-0.24, 0.24]) horn(parts, [x, 2.115, -2.5], [0, 0, -1]);
  // ratchet straps holding the stack down to the body
  for (const z of [-1.62, -2.66]) {
    straps.push(box(1.94, 0.012, 0.05, { pos: [0, 1.43, z] }));
    for (const s of [-1, 1]) straps.push(box(0.012, 0.52, 0.05, { pos: [s * 0.97, 1.17, z] }));
  }
  for (const z of [-1.72, -2.4]) {
    straps.push(box(1.06, 0.012, 0.05, { pos: [0, 2.31, z] }));
    for (const s of [-1, 1]) straps.push(tube([s * 0.53, 2.31, z], [s * 0.87, 1.93, z], 0.01, 4));
  }

  g.add(merged(cabinets, mats.tolex, "Speakers_cabinets"));
  g.add(merged([...corners, ...posts], mats.chrome, "Speakers_hardware"));
  g.add(merged(parts.basket, mats.trim, "Speakers_baskets"));
  g.add(merged(parts.cone, mats.cone, "Speakers_cones"));
  g.add(merged(parts.cap, mats.chrome, "Speakers_caps"));
  g.add(merged(parts.neon, mats.neon, "Speakers_neon"));
  g.add(merged(straps, mats.strap, "Speakers_straps"));
  return g;
}

function buildTrim(mats) {
  const chrome = [], red = [];
  chrome.push(box(2.0, 0.18, 0.15, { pos: [0, 0.4, TAIL_Z - 0.06] }));
  for (const s of [-1, 1]) {
    chrome.push(box(0.22, 0.18, 0.15, { pos: [s * 1.0, 0.4, TAIL_Z + 0.03], rot: [0, -s * 0.6, 0] }));
    // bullet mirrors on the doors
    chrome.push(tube([s * 0.97, 0.95, 0.85], [s * 1.08, 1.0, 0.82], 0.012));
    chrome.push(place(new THREE.SphereGeometry(0.06, 12, 8), { pos: [s * 1.1, 1.02, 0.8], scale: [0.7, 0.8, 1.2] }));
    // fin-top tail lamp lenses
    red.push(box(0.06, 0.44, 0.03, { pos: [s * 0.93, 0.65, TAIL_Z + 0.02] }));
  }
  // twin exhausts
  for (const x of [-0.6, -0.45]) chrome.push(place(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 12), { pos: [x, 0.22, TAIL_Z + 0.05], rot: [Math.PI / 2, 0, 0] }));
  // padded landau vinyl top over the rear of the roof, piped in chrome
  const vinyl = [box(1.34, 0.018, 0.68, { pos: [0, ROOF_Y + 0.038, -0.62] })];
  chrome.push(box(1.36, 0.012, 0.02, { pos: [0, ROOF_Y + 0.04, -0.27] }));
  return [
    merged(chrome, mats.chrome, "Body_chrome"),
    merged(red, mats.tail, "Body_taillamps"),
    merged(vinyl, mats.vinyl, "Body_vinylroof"),
  ];
}

// ---------------------------------------------------------------- assembly
export function buildLastSong() {
  const A = createAtlas({
    spanZ: 3.05, spanY: 1.6, spanX: 1.15, sideH: 560, topH: 480, endH: 400, endMinZ: 2.6, endMinY: 0.95,
  });
  paintSide(A, "L");
  paintSide(A, "R");
  paintTop(A);
  paintEnds(A);
  weather(A, rng(0x50ba));
  const brassTex = makeSteelTexture();
  const mats = {
    paint: new THREE.MeshStandardMaterial({ name: "LS_Paint", map: A.texture("last_song_livery"), roughness: 0.52, metalness: 0.3 }),
    vinyl: new THREE.MeshStandardMaterial({ name: "LS_Vinyl", color: 0x1e1724, roughness: 0.95, metalness: 0 }),
    chrome: new THREE.MeshStandardMaterial({ name: "LS_Chrome", color: 0xd4cfc4, roughness: 0.2, metalness: 1 }),
    gold: new THREE.MeshStandardMaterial({ name: "LS_Gold", color: 0xd2a445, roughness: 0.28, metalness: 1 }),
    brass: new THREE.MeshStandardMaterial({ name: "LS_PlowBrass", map: brassTex, color: 0xc49a52, roughness: 0.45, metalness: 0.85 }),
    trim: new THREE.MeshStandardMaterial({ name: "LS_Trim", color: 0x151416, roughness: 0.7, metalness: 0.2 }),
    rubber: new THREE.MeshStandardMaterial({ name: "LS_Rubber", color: 0x141414, roughness: 0.92, metalness: 0 }),
    lamp: new THREE.MeshStandardMaterial({ name: "LS_Headlamp", color: 0xfff4d8, emissive: 0xffe8b8, emissiveIntensity: 1.4, roughness: 0.1 }),
    amber: new THREE.MeshStandardMaterial({ name: "LS_Amber", color: 0xd08a2a, emissive: 0x803a00, emissiveIntensity: 0.4, roughness: 0.2 }),
    tail: new THREE.MeshStandardMaterial({ name: "LS_TailLamp", color: 0x9a1418, emissive: 0x800a0a, emissiveIntensity: 0.6, roughness: 0.2 }),
    tolex: new THREE.MeshStandardMaterial({ name: "LS_Tolex", color: 0x19171b, roughness: 0.92, metalness: 0.05 }),
    cone: new THREE.MeshStandardMaterial({ name: "LS_Cone", color: 0x262428, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }),
    neon: new THREE.MeshStandardMaterial({ name: "LS_Neon", color: 0xb070ff, emissive: 0x9a40ff, emissiveIntensity: 1.8, roughness: 0.3 }),
    strap: new THREE.MeshStandardMaterial({ name: "LS_Strap", color: 0xc9661a, roughness: 0.8, metalness: 0 }),
  };

  const root = new THREE.Group();
  root.name = "LastSong";
  const body = new THREE.Group();
  body.name = "Body";
  body.add(merged(bodyShell(A), mats.paint, "Body_shell"));
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
  root.add(buildSoundSystem(mats));

  root.userData = {
    vehicle: "Last Song",
    driver: "\"Jukebox\" Vale",
    class: "Luxury (Heavy)",
    units: "metres",
    forward: "+Z",
    wheelRadius: WHEEL_R,
    wheelbase: FRONT_AXLE - REAR_AXLE,
    track: TRACK_HW * 2,
  };
  return root;
}

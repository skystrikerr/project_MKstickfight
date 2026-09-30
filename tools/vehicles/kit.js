// Shared building blocks for the procedural vehicle builders: geometry
// helpers, text/polygon painting and the common steel and wire textures.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";


// Seeded RNG so the grime is identical every time the car is rebuilt.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function poly(ctx, map, pts) {
  ctx.beginPath();
  pts.forEach(([a, b], i) => {
    const [x, y] = map(a, b);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
}

export function stencilText(ctx, text, cx, cy, heightPx, color, widthPx, outline) {
  ctx.save();
  ctx.font = `900 ${heightPx}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const w = ctx.measureText(text).width;
  ctx.translate(cx, cy);
  if (widthPx) ctx.scale(widthPx / w, 1);
  if (outline) {
    ctx.lineWidth = heightPx * 0.14;
    ctx.strokeStyle = outline;
    ctx.strokeText(text, 0, 0);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function makeWireTexture() {
  // Welded diamond mesh, alpha-tested.
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 128, 128);
  ctx.strokeStyle = "#b9bbbd";
  ctx.lineWidth = 7;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(128, 128);
  ctx.moveTo(128, 0);
  ctx.lineTo(0, 128);
  ctx.moveTo(-64, 64);
  ctx.lineTo(64, -64);
  ctx.moveTo(64, 192);
  ctx.lineTo(192, 64);
  ctx.moveTo(64, -64);
  ctx.lineTo(192, 64);
  ctx.moveTo(-64, 64);
  ctx.lineTo(64, 192);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.name = "wire_mesh";
  return tex;
}

export function makeSteelTexture() {
  // Grimy welded steel for the ram and roof rack.
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const rand = rng(77);
  ctx.fillStyle = "#8b8e90";
  ctx.fillRect(0, 0, 256, 256);
  const img = ctx.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 40;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 40; i++) {
    const r = 2 + rand() * 10;
    ctx.fillStyle = `rgba(${100 + rand() * 30},${60 + rand() * 20},36,${0.15 + rand() * 0.3})`;
    ctx.beginPath();
    ctx.arc(rand() * 256, rand() * 256, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.mimeType = "image/jpeg";
  tex.name = "rusted_steel";
  return tex;
}

// Extrude a side silhouette (drawn in the z/y plane) across the car's width.
export function extrudeProfile(points, halfWidth, bevel, holes = []) {
  const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
  for (const h of holes) shape.holes.push(h);
  const depth = 2 * (halfWidth - bevel.thickness);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel.thickness,
    bevelSize: bevel.size,
    bevelSegments: bevel.segments,
    curveSegments: 16,
  }).toNonIndexed();
  // shape (sx, sy, sz) -> car (sz - depth/2, sy, sx). Swapping two axes is a
  // mirror, so reverse every triangle to keep faces pointing outward.
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const sx = p.getX(i);
    p.setXYZ(i, p.getZ(i) - depth / 2, p.getY(i), sx);
  }
  for (let i = 0; i < p.count; i += 3) {
    const ax = p.getX(i + 1), ay = p.getY(i + 1), az = p.getZ(i + 1);
    p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2));
    p.setXYZ(i + 2, ax, ay, az);
  }
  geo.deleteAttribute("uv");
  geo.deleteAttribute("normal");
  geo.clearGroups();
  return geo;
}


export function place(geo, { pos = [0, 0, 0], rot = [0, 0, 0], scale } = {}) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(...(scale ?? [1, 1, 1])),
  );
  return geo.applyMatrix4(m);
}
export function box(w, h, d, opts) {
  return place(new THREE.BoxGeometry(w, h, d), opts);
}
export function tube(a, b, r, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  g.applyQuaternion(q);
  g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  return g;
}
export function spike(base, dir, len, r) {
  const D = new THREE.Vector3(...dir).normalize();
  const g = new THREE.ConeGeometry(r, len, 10, 1);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), D));
  g.translate(...base);
  return g;
}
export function merged(geos, material, name) {
  const clean = geos.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (!n.attributes.uv) n.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    for (const k of Object.keys(n.attributes)) if (!["position", "normal", "uv"].includes(k)) n.deleteAttribute(k);
    if (!n.attributes.normal) n.computeVertexNormals();
    return n;
  });
  const mesh = new THREE.Mesh(mergeGeometries(clean), material);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
// A flat polygon given in (z, y) and lifted onto a surface via xOf(z, y).
export function sidePanel(pts2, xOf, uvScale) {
  const contour = pts2.map(([z, y]) => new THREE.Vector2(z, y));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const pos = [], uv = [];
  for (const t of tris) {
    const order = xOf(0, 1) > 0 ? t : [t[0], t[2], t[1]];
    for (const k of order) {
      const [z, y] = pts2[k];
      pos.push(xOf(z, y), y, z);
      uv.push(z * uvScale, y * uvScale);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
export function quad(a, b, c, d, uvScale) {
  // Planar quad a-b-c-d (counter-clockwise from the outside), world-scaled UVs.
  const P = [a, b, c, d].map((p) => new THREE.Vector3(...p));
  const e1 = P[1].clone().sub(P[0]).normalize();
  const nrm = P[1].clone().sub(P[0]).cross(P[3].clone().sub(P[0])).normalize();
  const e2 = nrm.clone().cross(e1);
  const uvs = P.map((p) => [p.clone().sub(P[0]).dot(e1) * uvScale, p.clone().sub(P[0]).dot(e2) * uvScale]);
  const g = new THREE.BufferGeometry();
  const idx = [0, 1, 2, 0, 2, 3];
  g.setAttribute("position", new THREE.Float32BufferAttribute(idx.flatMap((i) => P[i].toArray()), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(idx.flatMap((i) => uvs[i]), 2));
  g.computeVertexNormals();
  return g;
}

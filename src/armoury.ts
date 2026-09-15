/** Every weapon model, laid out on one sheet and lit the way the game lights them. */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const q = new URLSearchParams(location.search);
const names = (q.get("w") ?? "").split(",").filter(Boolean);
const COLS = Number(q.get("cols") ?? 7);
const CELL = Number(q.get("cell") ?? 190);
const rows = Math.ceil(names.length / COLS);
const W = COLS * CELL;
const H = rows * CELL;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H, false);
renderer.setClearColor(0x14100c);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -4000, 4000);
cam.position.set(0, 0, 900);

scene.add(new THREE.HemisphereLight(0xffffff, 0x33281c, 1.35));
const key = new THREE.DirectionalLight(0xfff4e2, 1.55);
key.position.set(-0.45, 1.0, 0.85);
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc0ff, 0.42);
rim.position.set(0.7, 0.25, -0.9);
scene.add(rim);

const loader = new GLTFLoader();
const load = (f: string) => new Promise<THREE.Group>((ok, no) =>
  loader.load(`/src/assets/models/${f}.glb`, (g) => ok(g.scene), undefined, no));

(async () => {
  for (let i = 0; i < names.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = -W / 2 + CELL * (col + 0.5);
    const cy = H / 2 - CELL * (row + 0.5);
    let obj: THREE.Group;
    try { obj = await load(names[i]); } catch { continue; }
    // Normalise each piece into its cell: longest axis laid across, then
    // scaled to fit with a margin, so a 200-unit smallsword and a 16-unit
    // shuriken are both legible on the same sheet.
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const holder = new THREE.Group();
    if (size.y > size.x) obj.rotation.z = -Math.PI / 2;
    holder.add(obj);
    const b2 = new THREE.Box3().setFromObject(holder);
    const s2 = b2.getSize(new THREE.Vector3());
    const fit = (CELL * 0.76) / Math.max(s2.x, s2.y, 0.001);
    holder.scale.setScalar(fit);
    const c2 = b2.getCenter(new THREE.Vector3()).multiplyScalar(fit);
    holder.position.set(cx - c2.x, cy - c2.y, 0);
    scene.add(holder);
  }
  renderer.render(scene, cam);
  (window as unknown as { shotReady: boolean }).shotReady = true;
})().catch((e) => { console.error(e); document.title = "ERR " + e.message; });

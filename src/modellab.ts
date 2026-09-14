/** Look at a model pack the way the game will: orthographic, side-on, small. */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const q = new URLSearchParams(location.search);
const name = q.get("m") ?? "anne";
const weapons = (q.get("w") ?? "").split(",").filter(Boolean);
const yaw = Number(q.get("yaw") ?? 32) * (Math.PI / 180);
const W = Number(q.get("w2") ?? 520);
const H = Number(q.get("h") ?? 760);
const span = Number(q.get("span") ?? 130);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H, false);
renderer.setClearColor(0x14100c);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const aspect = W / H;
const cam = new THREE.OrthographicCamera(
  -span * aspect / 2, span * aspect / 2, span / 2, -span / 2, -1000, 1000);
cam.position.set(Math.sin(yaw) * 200, 55, Math.cos(yaw) * 200);
cam.lookAt(0, 55, 0);

// Roughly the stage key/fill the arena uses, so shapes read as they will in play.
scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2118, 1.5));
const key = new THREE.DirectionalLight(0xfff2dd, 1.9);
key.position.set(-0.4, 0.9, 0.7);
scene.add(key);
const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
rim.position.set(0.6, 0.2, -0.8);
scene.add(rim);

const loader = new GLTFLoader();
const load = (f: string) => new Promise<THREE.Group>((ok, no) =>
  loader.load(`/src/assets/models/${f}.glb`, (g) => ok(g.scene), undefined, no));

(async () => {
  const body = await load(`${name}-body`);
  scene.add(body);
  const main = body.getObjectByName("MainHandSocket");
  const off = body.getObjectByName("OffHandSocket");
  for (let i = 0; i < weapons.length; i++) {
    const w = await load(`${name}-${weapons[i]}`);
    const HEAD_WORN = /mongkhon|hat|helm|crown|mask|patch/;
    const socket = HEAD_WORN.test(weapons[i])
      ? body.getObjectByName("Head")
      : i === 0 ? main : off;
    (socket ?? body).add(w);
  }
  renderer.render(scene, cam);
  (window as unknown as { shotReady: boolean }).shotReady = true;
})().catch((e) => { console.error(e); document.title = "ERR " + e.message; });

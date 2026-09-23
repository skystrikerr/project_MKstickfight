/** Local viewer for the experimental 3D fighter. Open /planklab.html in Vite. */
import * as THREE from "three";
import { createPlankFighter3D, type PreviewPose } from "@/game/stickfight/render/plank3d";

const mount = document.getElementById("app")!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#242b37");
scene.fog = new THREE.Fog("#242b37", 8, 18);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
let azimuth = 0.28;
let distance = 4.7;
const look = () => camera.position.set(Math.sin(azimuth) * distance, 2.1, Math.cos(azimuth) * distance);
look();
camera.lookAt(0, 1.1, 0);

scene.add(new THREE.HemisphereLight(0xe2ebff, 0x40332f, 2.15));
const key = new THREE.DirectionalLight(0xffdaa3, 3.1);
key.position.set(-3, 6, 5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -3;
key.shadow.camera.right = 3;
key.shadow.camera.top = 4;
key.shadow.camera.bottom = -3;
scene.add(key);
const rim = new THREE.DirectionalLight(0x889bc5, 1.4);
rim.position.set(3, 4, -4);
scene.add(rim);

const floorGeo = new THREE.CylinderGeometry(1.7, 1.75, 0.16, 12);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x565151, roughness: 0.93, flatShading: true });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.y = -0.14;
floor.receiveShadow = true;
scene.add(floor);
const fighter = createPlankFighter3D();
scene.add(fighter.root);

let pose: PreviewPose = "idle";
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-pose]"));
buttons.forEach((button) => button.addEventListener("click", () => {
  pose = button.dataset.pose as PreviewPose;
  buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
}));

let dragX: number | null = null;
renderer.domElement.addEventListener("pointerdown", (e) => { dragX = e.clientX; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener("pointermove", (e) => {
  if (dragX === null) return;
  azimuth += (e.clientX - dragX) * 0.009;
  dragX = e.clientX;
});
renderer.domElement.addEventListener("pointerup", () => { dragX = null; });
renderer.domElement.addEventListener("pointercancel", () => { dragX = null; });
renderer.domElement.addEventListener("wheel", (e) => {
  e.preventDefault();
  distance = THREE.MathUtils.clamp(distance + e.deltaY * 0.002, 3, 8);
}, { passive: false });

function resize() {
  const width = mount.clientWidth;
  const height = mount.clientHeight;
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener("resize", resize);
resize();
const clock = new THREE.Clock();
function frame() {
  const time = clock.getElapsedTime();
  fighter.setPose(pose, time);
  look();
  camera.lookAt(0, 1.1, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();

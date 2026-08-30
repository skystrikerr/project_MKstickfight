/**
 * Animation lab - a dev-only filmstrip for looking at one move in isolation.
 *
 * Driving the real match to inspect an animation means fighting the camera, the
 * opponent and the input layer. This mounts the actual StickRig, samples a
 * move's keyframes exactly the way the engine does, and lays the frames out
 * side by side so a roll can be judged on its own.
 *
 *   /animlab.html?fighter=roman&move=roll&from=0&to=30&step=2
 *   /animlab.html?fighter=spartan&clip=blockHigh&to=10&step=1&w=110
 *
 * `w` widens the framed area, for poses that put a spear outside the default.
 */

import * as THREE from "three";
import { clipFor } from "@/game/stickfight/clips";
import { getFighter } from "@/game/stickfight/fighters";
import { StickRig } from "@/game/stickfight/render/rig";
import { buildSkeleton, sampleClip, sampleFrames } from "@/game/stickfight/skeleton";
import type { ClipName, Pose } from "@/game/stickfight/types";

const q = new URLSearchParams(location.search);
const def = getFighter(q.get("fighter") ?? "roman");

// Either a move's own keyframes, or one of the shared/overridden clips - the
// guards, walks and reactions only exist as clips.
const clipName = q.get("clip") as ClipName | null;
const move = clipName ? null : def.moves.find((m) => m.id === (q.get("move") ?? "roll"));
if (!clipName && !move) throw new Error(`no move ${q.get("move")}`);
const clip = clipName ? clipFor(clipName, def.clips) : null;
const at = (t: number): Pose =>
  clip ? sampleClip(clip, t, def.stance) : sampleFrames(move!.frames, t, def.stance);

const from = Number(q.get("from") ?? 0);
const to = Number(q.get("to") ?? (clip ? clip.length : move!.duration));
const step = Number(q.get("step") ?? 2);
const HALF = Number(q.get("w") ?? 70);
const CELL = 230;

const strip = document.getElementById("strip")!;

for (let t = from; t <= to; t += step) {
  const cell = document.createElement("div");
  cell.className = "cell";
  const label = document.createElement("span");
  label.textContent = String(t);
  cell.appendChild(label);
  strip.appendChild(cell);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(CELL, CELL);
  renderer.setClearColor("#1b1b26");
  cell.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-HALF, HALF, HALF * 2, 0, -500, 500);

  const rig = new StickRig(def);
  scene.add(rig.group, rig.worldGroup, rig.shadowMesh);

  // Exactly what the engine feeds the rig each frame.
  const pose = at(t);
  const sk = buildSkeleton(pose, !pose.free, def.stats.scale);
  rig.update(sk, {
    x: 0,
    y: 0,
    facing: 1,
    visibleProps: new Set<string>(),
    hiddenProps: new Set<string>(),
    flash: 0,
    airborne: !!pose.free,
  });

  renderer.render(scene, camera);
}

document.title = `${def.id} / ${clipName ?? move!.id} ready`;

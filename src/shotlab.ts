/**
 * Shot lab - a dev-only harness for looking at the game the way it actually
 * renders, on demand and identically every time.
 *
 * `animlab` mounts a bare StickRig to judge one animation. This mounts the
 * whole renderer - stage, post-processing, fighters, props, effects - against a
 * real Match, so it is the right place to judge anything the grade or the
 * lighting touches. Screenshots taken through the game's own UI cannot be
 * compared across a change, because getting to a fight means playing one; this
 * puts two named fighters in a named pose on a named stage at a named frame.
 *
 *   /shotlab.html?p1=lapulapu&p2=knight&stage=colosseum&frames=40
 *   /shotlab.html?p1=spartan&p2=roman&stage=neon&m1=super&f1=60&quality=high
 *
 * `m1`/`m2` start a move on either fighter, `f1`/`f2` run it to a given frame,
 * and `frames` steps the match on before drawing so nobody is stuck in the
 * intro. Nothing here ships: it is not linked from the game and it is only
 * reachable by typing the URL.
 */

import { Match } from "@/game/stickfight/engine/match";
import { getFighter } from "@/game/stickfight/fighters";
import { EMPTY_INPUT } from "@/game/stickfight/engine/input";
import { GameRenderer } from "@/game/stickfight/render/renderer";
import { STAGE_THEMES, type StageTheme } from "@/game/stickfight/render/stage";

const q = new URLSearchParams(location.search);
const num = (k: string, d: number) => Number(q.get(k) ?? d);

const theme = (q.get("stage") ?? "colosseum") as StageTheme;
const canvas = document.getElementById("c") as HTMLCanvasElement;
const w = num("w", 1280);
const h = num("h", 720);
canvas.width = w;
canvas.height = h;
canvas.style.width = `${w}px`;
canvas.style.height = `${h}px`;

const match = new Match(
  [getFighter(q.get("p1") ?? "lapulapu"), getFighter(q.get("p2") ?? "knight")],
  2,
  STAGE_THEMES[theme].platforms ?? [],
);

const renderer = new GameRenderer(
  canvas,
  match,
  theme,
  (q.get("quality") as "high" | "low" | null) ?? "high",
);
renderer.setSize(w, h);

// Out of the intro and into a stance both fighters actually hold.
const idle = () => [EMPTY_INPUT, EMPTY_INPUT] as [typeof EMPTY_INPUT, typeof EMPTY_INPUT];
for (let i = 0; i < num("frames", 90); i++) match.step(idle());

if (q.get("gap")) match.fighters[1].x = match.fighters[0].x + num("gap", 150);

// Put either side into a move and run it to the requested frame. Stepping the
// match rather than posing the rig means the props, effects, projectiles and
// zones that move produces are all really there.
const drive = (i: 0 | 1, moveKey: string, frameKey: string) => {
  const id = q.get(moveKey);
  if (!id) return;
  match.fighters[i].startMove(id);
  for (let f = 0; f < num(frameKey, 10); f++) match.step(idle());
};
drive(0, "m1", "f1");
drive(1, "m2", "f2");

// Settle on a real clock rather than in a tight loop. Two things need it: the
// camera and the grade ease toward their targets, so a single frame is a
// picture of the game arriving rather than of the game; and the painted
// backdrops are a dynamic import, so a synchronous shot catches the stages
// that have one with nothing behind them. Both are cured by letting real
// frames pass.
let drawn = 0;
const settle = num("settle", 90);
const tick = () => {
  renderer.render(match);
  if (++drawn >= settle) {
    (window as unknown as { shotReady: boolean }).shotReady = true;
    return;
  }
  requestAnimationFrame(tick);
};
tick();

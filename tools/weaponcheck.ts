/**
 * Checks that a move's motion matches the damage it claims to do.
 *
 * A weapon move is a lie if the picture and the effect disagree: a thrust that
 * swings the point sideways, or a cut that pokes. The fx already states the
 * intent - "pierce" is a thrust, "slash" is a cut - so the animation can be
 * checked against it instead of against an opinion.
 *
 * Over the active frames it measures two things about the weapon: how far the
 * shaft swings through, and how far the point travels forwards. A cut sweeps
 * the shaft through a wide angle; a thrust holds the line and drives the point
 * out along it.
 *
 * Decomposing the tip's path along and across the shaft looks like the obvious
 * measure and is not: a thrust in this rig extends the arm while unwinding the
 * weapon angle so the shaft stays level, and on a spear a small rotation moves
 * the tip further than the whole extension does. That reported every thrust on
 * the roster as a cut.
 *
 *   npx tsx tools/weaponcheck.ts            # only the mismatches
 *   npx tsx tools/weaponcheck.ts --all      # every armed move
 */

import { ROSTER } from "../src/game/stickfight/fighters";
import { attachTransform } from "../src/game/stickfight/render/rig";
import { buildSkeleton, sampleFrames } from "../src/game/stickfight/skeleton";
import type { FighterDef, MoveDef, PropDef, ShapePart, Skeleton } from "../src/game/stickfight/types";

const DEG = Math.PI / 180;

function partReach(part: ShapePart): number {
  if (part.geo === "poly") {
    let max = 0;
    for (let i = 0; i < part.size.length; i += 2) max = Math.max(max, Math.abs(part.size[i]));
    return part.pos[0] + max;
  }
  if (part.geo === "ring") return part.pos[0] + part.size[0];
  const half = part.geo === "cyl" ? part.size[1] / 2 : Math.max(part.size[0], part.size[1] ?? 0) / 2;
  return part.pos[0] + half;
}

/**
 * The weapon a given move is actually using: of everything held in a hand, the
 * one whose point comes nearest that move's hitbox. A fighter carrying both a
 * tulwar and a chakram uses one or the other depending on the button, and
 * measuring the longest thing they own reports the wrong weapon standing still.
 */
function weaponFor(def: FighterDef, move: MoveDef, hit: { from: number; to: number; box: { x: number; y: number; w: number; h: number } }): PropDef | null {
  const held = def.props.filter((p) => p.attach === "handF" || p.attach === "handB");
  if (!held.length) return null;
  let best: PropDef | null = null;
  let bestDist = Infinity;
  for (const prop of held) {
    let near = Infinity;
    for (let f = hit.from; f <= hit.to; f++) {
      const pose = sampleFrames(move.frames, f, def.stance);
      const sk = buildSkeleton(pose, !pose.free, def.stats.scale);
      const { tip, dir, grip } = tipAndAxis(sk, prop);
      for (const t of [1, 0.75, 0.5, 0.25]) {
        const px = grip.x + (tip.x - grip.x) * t;
        const py = grip.y + (tip.y - grip.y) * t;
        const dx = Math.max(hit.box.x - px, 0, px - (hit.box.x + hit.box.w));
        const dy = Math.max(hit.box.y - py, 0, py - (hit.box.y + hit.box.h));
        near = Math.min(near, Math.hypot(dx, dy));
      }
      void dir;
    }
    if (near < bestDist) { bestDist = near; best = prop; }
  }
  // If nothing held comes near the box, this is a fist or a foot, not a weapon.
  return bestDist <= 26 ? best : null;
}

function tipAndAxis(sk: Skeleton, prop: PropDef) {
  const t = attachTransform(sk, prop.attach);
  const reach = Math.max(...prop.parts.map(partReach));
  const a = t.rot * DEG;
  const dir = { x: Math.cos(a), y: Math.sin(a) };
  return { tip: { x: t.x + dir.x * reach, y: t.y + dir.y * reach }, dir, grip: { x: t.x, y: t.y } };
}

const showAll = process.argv.includes("--all");
let mismatches = 0;
let checked = 0;

for (const def of ROSTER) {
  const rows: string[] = [];

  for (const move of def.moves as MoveDef[]) {
    for (const hit of move.hits ?? []) {
      const fx = hit.fx;
      if (fx !== "pierce" && fx !== "slash") continue;
      const spins = move.frames.some((k) => (k.p?.spin ?? k.add?.spin ?? 0) !== 0);
      if (spins) continue;
      const prop = weaponFor(def, move, hit);
      // Unarmed strikes carry a slash fx for claws and elbows; nothing to check.
      if (!prop) continue;
      checked++;

      // Sample from just before the hit through it, so the swing is included.
      let sweep = 0;
      let firstTip: { x: number; y: number } | null = null;
      let lastTip = { x: 0, y: 0 };
      let prevAngle: number | null = null;
      for (let f = Math.max(0, hit.from - 4); f <= hit.to; f++) {
        const pose = sampleFrames(move.frames, f, def.stance);
        const sk = buildSkeleton(pose, !pose.free, def.stats.scale);
        const cur = tipAndAxis(sk, prop);
        const angle = Math.atan2(cur.dir.y, cur.dir.x) / DEG;
        if (prevAngle !== null) {
          let d = angle - prevAngle;
          while (d > 180) d -= 360;
          while (d < -180) d += 360;
          sweep += Math.abs(d);
        }
        prevAngle = angle;
        firstTip ??= cur.tip;
        lastTip = cur.tip;
      }
      const forward = lastTip.x - (firstTip?.x ?? 0);
      // An anti-air drives the point up rather than out, so measure how far
      // the point travelled at all, not just how far downrange.
      const drive = Math.hypot(forward, lastTip.y - (firstTip?.y ?? 0));
      // A cut sweeps the shaft; a thrust keeps the line and pushes the point.
      const wrong = fx === "pierce" ? sweep > 70 || drive < 10 : sweep < 45;
      if (wrong) mismatches++;
      if (wrong || showAll) {
        rows.push(
          `  ${wrong ? "!" : " "} ${move.id.padEnd(12)} ${move.name.padEnd(20)} ${prop.id.padEnd(11)}` +
          `fx=${fx.padEnd(6)} sweep ${sweep.toFixed(0).padStart(3)}\u00b0  point moves ${drive.toFixed(0).padStart(3)}u  ` +
          `${wrong ? (fx === "pierce" ? (drive < 10 ? "the point barely moves" : "swings too much for a thrust") : "too straight for a cut") : "ok"}`,
        );
      }
    }
  }
  if (rows.length) console.log(`${def.name} (${def.id})\n${rows.join("\n")}\n`);
}
console.log(`${checked} armed hits checked, ${mismatches} where the motion contradicts the damage type.`);

/**
 * Checks that a move's hitbox is where the move actually is.
 *
 * A hitbox is authored by hand as four numbers while the animation is authored
 * separately as joint angles, so the two drift apart silently: the box sits
 * where you meant to hit and the weapon goes somewhere else. Nothing catches
 * that - the move still "works", it just connects at a range that has nothing
 * to do with what the player can see.
 *
 * For every active frame this builds the same skeleton the renderer draws,
 * works out where the striking parts actually are - fists, feet, elbows, and
 * the tip of whatever is in each hand - and measures the nearest one to the
 * box. A move whose box never comes near anything is reported.
 *
 *   npx tsx tools/hitcheck.ts           # whole roster
 *   npx tsx tools/hitcheck.ts spartan   # one fighter
 *   npx tsx tools/hitcheck.ts --all     # every move, not just the bad ones
 */

import { ROSTER, getFighter } from "../src/game/stickfight/fighters";
import { attachTransform } from "../src/game/stickfight/render/rig";
import { buildSkeleton, sampleFrames } from "../src/game/stickfight/skeleton";
import type { FighterDef, MoveDef, ShapePart, Skeleton } from "../src/game/stickfight/types";

const DEG = Math.PI / 180;
/** Units of slack before a box counts as detached from the animation. */
const TOLERANCE = Number(process.env.TOL ?? 14);

/** How far a prop part reaches from its attachment point, along the grip. */
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

/** Everything on the fighter that could reasonably be what is hitting. */
function strikePoints(def: FighterDef, sk: Skeleton): { name: string; x: number; y: number }[] {
  const pts = [
    { name: "handF", x: sk.handF.x, y: sk.handF.y },
    { name: "handB", x: sk.handB.x, y: sk.handB.y },
    { name: "footF", x: sk.footF.x, y: sk.footF.y },
    { name: "footB", x: sk.footB.x, y: sk.footB.y },
    { name: "toeF", x: sk.toeF.x, y: sk.toeF.y },
    { name: "toeB", x: sk.toeB.x, y: sk.toeB.y },
    { name: "elbowF", x: sk.elbowF.x, y: sk.elbowF.y },
    { name: "elbowB", x: sk.elbowB.x, y: sk.elbowB.y },
    { name: "head", x: sk.head.x, y: sk.head.y },
    { name: "kneeF", x: sk.kneeF.x, y: sk.kneeF.y },
    { name: "kneeB", x: sk.kneeB.x, y: sk.kneeB.y },
  ];
  for (const prop of def.props) {
    if (!/^(hand|forearm)[FB]$/.test(prop.attach)) continue;
    const t = attachTransform(sk, prop.attach);
    const reach = Math.max(...prop.parts.map(partReach));
    const a = t.rot * DEG;
    // The tip, and the middle of the shaft - a spear connects along its length.
    for (const [label, d] of [["tip", reach], ["mid", reach * 0.6]] as const) {
      pts.push({ name: `${prop.id}:${label}`, x: t.x + Math.cos(a) * d, y: t.y + Math.sin(a) * d });
    }
  }
  return pts;
}

/** 0 when the point is inside the box, otherwise the distance to its edge. */
function distanceToBox(p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }) {
  const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w));
  const dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

const arg = process.argv[2];
const showAll = process.argv.includes("--all");
const only = arg && !arg.startsWith("--") ? arg : null;

let flagged = 0;
let checked = 0;

for (const def of ROSTER) {
  if (only && def.id !== only) continue;
  const rows: string[] = [];

  for (const move of def.moves as MoveDef[]) {
    for (const hit of move.hits ?? []) {
      checked++;
      let best = Infinity;
      let bestName = "-";
      let bestFrame = -1;
      for (let f = hit.from; f <= hit.to; f++) {
        const pose = sampleFrames(move.frames, f, def.stance);
        const sk = buildSkeleton(pose, !pose.free, def.stats.scale);
        for (const p of strikePoints(def, sk)) {
          const d = distanceToBox(p, hit.box);
          if (d < best) { best = d; bestName = p.name; bestFrame = f; }
        }
      }
      const bad = best > TOLERANCE;
      if (bad) flagged++;
      if (bad || showAll) {
        rows.push(
          `  ${bad ? "!" : " "} ${move.id.padEnd(12)} ${move.name.padEnd(22)} ` +
          `gap ${best.toFixed(0).padStart(3)}u  nearest ${bestName} @f${bestFrame}`,
        );
      }
    }
  }
  if (rows.length) console.log(`${def.name} (${def.id})\n${rows.join("\n")}\n`);
}

console.log(`${checked} hitboxes checked, ${flagged} further than ${TOLERANCE} units from anything that could be hitting.`);

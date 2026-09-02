/**
 * Prints where a fighter's guard actually puts their hands, weapon and shield.
 * Authoring guards blind is guesswork; this reads the same skeleton the
 * renderer does, so a guard can be checked without opening a browser.
 *
 *   npx tsx tools/guardcheck.ts            # every fighter
 *   npx tsx tools/guardcheck.ts spartan    # one
 */
import { ROSTER } from "../src/game/stickfight/fighters";
import { clipFor } from "../src/game/stickfight/clips";
import { buildSkeleton, sampleClip } from "../src/game/stickfight/skeleton";
import { attachTransform } from "../src/game/stickfight/render/rig";
import type { FighterDef, Skeleton } from "../src/game/stickfight/types";

const DEG = Math.PI / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;

function shieldOf(def: FighterDef) {
  return def.props.find((p) => /shield|aspis|buckler|isihlangu|spara|targe/i.test(p.id));
}

function report(def: FighterDef, clipName: "blockHigh" | "blockLow", frame: number) {
  const pose = sampleClip(clipFor(clipName, def.clips), frame, def.stance);
  const sk: Skeleton = buildSkeleton(pose, true, 1);
  const head = sk.head;
  const chest = { x: (sk.neck.x + sk.pelvis.x) / 2, y: (sk.neck.y + sk.pelvis.y) / 2 };
  const line = [
    `${def.id.padEnd(9)} ${clipName.padEnd(9)}`,
    `head(${r1(head.x)},${r1(head.y)})`,
    `chest(${r1(chest.x)},${r1(chest.y)})`,
    `handF(${r1(sk.handF.x)},${r1(sk.handF.y)})`,
    `handB(${r1(sk.handB.x)},${r1(sk.handB.y)})`,
    `foreF=${r1(sk.foreAngleF)} foreB=${r1(sk.foreAngleB)}`,
  ];
  const sh = shieldOf(def);
  if (sh) {
    const t = attachTransform(sk, sh.attach);
    // Shield parts sit at a local offset along the forearm; take the widest.
    const main = sh.parts.reduce((a, b) => (span(b) > span(a) ? b : a));
    const a = t.rot * DEG;
    const [ox, oy] = main.pos ?? [0, 0];
    const cx = t.x + Math.cos(a) * ox - Math.sin(a) * oy;
    const cy = t.y + Math.sin(a) * ox + Math.cos(a) * oy;
    line.push(`shield(${r1(cx)},${r1(cy)}) tilt=${r1(t.rot)}`);
  }
  console.log(line.join("  "));
}

function span(part: { size: number[] }) {
  return Math.max(...part.size.map(Math.abs));
}

const want = process.argv[2];
for (const def of ROSTER) {
  if (want && def.id !== want) continue;
  report(def, "blockHigh", 8);
  report(def, "blockLow", 8);
}

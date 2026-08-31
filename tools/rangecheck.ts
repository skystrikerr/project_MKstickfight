/**
 * Measures the range every attack actually connects at.
 *
 * A hitbox is four authored numbers; what matters is the distance at which the
 * move lands on a real opponent, which also depends on how far the move walks
 * the fighter forward and how wide both hurtboxes are. This drives the real
 * simulation: it walks the two fighters apart a unit at a time and reports the
 * furthest gap at which the move still connects, and whether it whiffs point
 * blank - which is how a move ends up unusable without ever looking wrong.
 *
 *   npx tsx tools/rangecheck.ts          # whole roster
 *   npx tsx tools/rangecheck.ts spartan  # one fighter
 */

import { EMPTY_INPUT, type RawInput } from "../src/game/stickfight/engine/input";
import { Match } from "../src/game/stickfight/engine/match";
import { getFighter, ROSTER } from "../src/game/stickfight/fighters";
import type { MoveDef } from "../src/game/stickfight/types";

const inp = (o: Partial<RawInput> = {}): RawInput => ({ ...EMPTY_INPUT, ...o });

/** Does `move` land when the two start `gap` units apart? */
function connects(id: string, move: MoveDef, gap: number): boolean {
  const m = new Match([getFighter(id), getFighter("roman")]);
  for (let i = 0; i < 80; i++) m.step([inp(), inp()]);
  const [me, foe] = m.fighters;
  const hp = foe.health;

  const dir = move.input.dir;
  const st = move.input.stance;
  // Crouching normals are chosen by stance rather than by a direction, so
  // holding only what `dir` says leaves the fighter standing and the wrong
  // move comes out.
  const crouchOnly = Array.isArray(st) ? !st.includes("stand") : st === "crouch";
  const hold: Partial<RawInput> =
    dir === "f" ? { right: true }
    : dir === "b" ? { left: true }
    : dir === "df" ? { right: true, down: true }
    : dir === "d" || crouchOnly ? { down: true }
    : {};
  // Hold the direction first, the way the input buffer expects - then place
  // them, because holding back walks the fighter away and a fast walker ends
  // up measuring its own walk speed rather than the move's reach.
  for (let i = 0; i < 6; i++) m.step([inp(hold), inp()]);
  me.x = -gap / 2;
  foe.x = gap / 2;
  me.vx = 0;
  const btn = move.input.button ?? "A";
  m.step([inp({ ...hold, [btn]: true }), inp()]);
  if (me.move?.id !== move.id) return false;
  for (let i = 0; i < move.duration + 4; i++) {
    m.step([inp(hold), inp()]);
    if (foe.health < hp) return true;
  }
  return false;
}

const only = process.argv[2];
const SLOTS = ["5A", "5B", "5C", "6A", "6B", "6C", "4A", "4B", "4C", "2A", "2B", "2C", "3C"];

for (const def of ROSTER) {
  if (only && def.id !== only) continue;
  const rows: string[] = [];
  for (const slot of SLOTS) {
    const move = def.moves.find((m) => m.id === slot);
    if (!move || !(move.hits ?? []).length) continue;

    let max = -1;
    for (let gap = 40; gap <= 220; gap += 2) if (connects(def.id, move, gap)) max = gap;
    const close = connects(def.id, move, 44);

    const flag = max < 0 ? "  NEVER CONNECTS" : !close ? "  whiffs point blank" : "";
    rows.push(`  ${slot.padEnd(3)} ${move.name.padEnd(22)} reach ${String(max < 0 ? "-" : max).padStart(3)}u${flag}`);
  }
  console.log(`${def.name} (${def.id})\n${rows.join("\n")}\n`);
}

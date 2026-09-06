/**
 * What the AI actually presses.
 *
 * Frame data says what a fighter can do; this says what one of them ever
 * does. A move that never comes out in a hundred matches is content nobody
 * will meet, whatever its numbers say - and the AI is how most of the roster
 * is experienced, so a move the AI cannot find is close to a move that is not
 * there.
 *
 *   npx tsx tools/usagecheck.ts                # every fighter, moves never used
 *   npx tsx tools/usagecheck.ts lapulapu       # one fighter, full breakdown
 */

import { AiController } from "../src/game/stickfight/engine/ai";
import { EMPTY_INPUT } from "../src/game/stickfight/engine/input";
import { Match } from "../src/game/stickfight/engine/match";
import { getFighter, ROSTER } from "../src/game/stickfight/fighters";

const FRAME_CAP = 60 * 130;

function run(who: string) {
  const counts = new Map<string, number>();
  for (const foe of ROSTER) {
    const m = new Match([getFighter(who), getFighter(foe.id)], 1);
    const ai: [AiController, AiController] = [new AiController("Veteran"), new AiController("Veteran")];
    let last = "";
    for (let f = 0; f < FRAME_CAP && !m.lastResult; f++) {
      m.step([
        m.phase === "fight" ? ai[0].step(m, m.fighters[0], m.fighters[1]) : { ...EMPTY_INPUT },
        m.phase === "fight" ? ai[1].step(m, m.fighters[1], m.fighters[0]) : { ...EMPTY_INPUT },
      ]);
      const cur = m.fighters[0].move?.id ?? "";
      if (cur && cur !== last) counts.set(cur, (counts.get(cur) ?? 0) + 1);
      last = cur;
    }
  }
  return counts;
}

const only = process.argv[2];
if (only) {
  const def = getFighter(only);
  const counts = run(only);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  console.log(`${def.name} (${only}) - ${total} moves started across ${ROSTER.length} matches\n`);
  for (const [id, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    const mv = def.moves.find((v) => v.id === id);
    const pct = ((n / total) * 100).toFixed(1).padStart(5);
    console.log(`  ${String(n).padStart(4)}  ${pct}%  ${id.padEnd(16)} ${(mv?.tags ?? []).join("/")}`);
  }
  const never = def.moves.filter((v) => !v.internal && !counts.has(v.id));
  console.log(`\n  never pressed: ${never.map((v) => v.id).join(", ") || "(none)"}`);
} else {
  let worst = 0;
  for (const def of ROSTER) {
    const counts = run(def.id);
    const never = def.moves.filter((v) => !v.internal && !counts.has(v.id));
    worst += never.length;
    console.log(`${def.id.padEnd(10)} ${String(never.length).padStart(2)} unused  ${never.map((v) => v.id).join(" ")}`);
  }
  console.log(`\n${worst} moves across the roster the AI never once pressed.`);
}

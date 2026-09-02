/**
 * Plays the whole roster against itself and reports who actually wins.
 *
 * Every other tool in here reads authored data and reasons about it. This one
 * refuses to: it runs the real simulation, with the real AI on both sides, for
 * every ordered pair of fighters, and counts results. Frame data can look
 * balanced on paper and still produce a character nobody can beat, and the
 * only way to find that out is to play it several thousand times.
 *
 * Both sides get the same difficulty, so the only variable is the fighter.
 * Pairs are run in both seat orders because player one and player two do not
 * start in mirrored positions, and a fighter that only wins from the left is
 * a finding rather than a rounding error.
 *
 *   npx tsx tools/balance.ts                 # whole roster, 2 rounds a pair
 *   npx tsx tools/balance.ts --reps 6        # more matches, tighter numbers
 *   npx tsx tools/balance.ts --level Legend  # at a different difficulty
 *   npx tsx tools/balance.ts --matrix        # print the full matchup grid
 */

import { AiController } from "../src/game/stickfight/engine/ai";
import { EMPTY_INPUT } from "../src/game/stickfight/engine/input";
import { Match } from "../src/game/stickfight/engine/match";
import { getFighter, ROSTER } from "../src/game/stickfight/fighters";
import type { AiLevel } from "../src/game/stickfight/constants";

const arg = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

const REPS = Number(arg("--reps") ?? 2);
const LEVEL = (arg("--level") ?? "Veteran") as AiLevel;
const SHOW_MATRIX = process.argv.includes("--matrix");
/** A round that reaches this many frames is called a timeout and scored as one. */
const FRAME_CAP = 60 * 100;

type Outcome = "a" | "b" | "draw";

/**
 * One round, AI against AI.
 *
 * The AI is deliberately not reset between reps: its internal think timer and
 * queued inputs carry a little state, which is what stops every repetition of
 * the same pairing being a bit-for-bit identical replay. That variation is the
 * whole reason to run more than one.
 */
function playRound(aId: string, bId: string, ai: [AiController, AiController]): Outcome {
  const m = new Match([getFighter(aId), getFighter(bId)]);
  for (let f = 0; f < FRAME_CAP; f++) {
    const inputs: [typeof EMPTY_INPUT, typeof EMPTY_INPUT] = [
      m.phase === "fight" ? ai[0].step(m, m.fighters[0], m.fighters[1]) : { ...EMPTY_INPUT },
      m.phase === "fight" ? ai[1].step(m, m.fighters[1], m.fighters[0]) : { ...EMPTY_INPUT },
    ];
    m.step(inputs);
    if (m.lastResult) {
      const w = m.lastResult.winner;
      return w === 0 ? "a" : w === 1 ? "b" : "draw";
    }
  }
  return "draw";
}

const ids = ROSTER.map((f) => f.id);
const wins: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
const played: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
const draws: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
/** matrix[a][b] = rounds a won against b, over both seat orders. */
const matrix: Record<string, Record<string, number>> = Object.fromEntries(
  ids.map((a) => [a, Object.fromEntries(ids.map((b) => [b, 0]))]),
);
const meetings: Record<string, Record<string, number>> = Object.fromEntries(
  ids.map((a) => [a, Object.fromEntries(ids.map((b) => [b, 0]))]),
);

let total = 0;
const started = Date.now();

for (let i = 0; i < ids.length; i++) {
  for (let j = 0; j < ids.length; j++) {
    if (i === j) continue;
    const [a, b] = [ids[i], ids[j]];
    const ai: [AiController, AiController] = [new AiController(LEVEL), new AiController(LEVEL)];
    for (let r = 0; r < REPS; r++) {
      const out = playRound(a, b, ai);
      total++;
      played[a]++;
      played[b]++;
      meetings[a][b]++;
      meetings[b][a]++;
      if (out === "a") {
        wins[a]++;
        matrix[a][b]++;
      } else if (out === "b") {
        wins[b]++;
        matrix[b][a]++;
      } else {
        draws[a]++;
        draws[b]++;
      }
    }
  }
  process.stderr.write(`  ${ids[i]} done (${total} rounds)\r`);
}

const secs = ((Date.now() - started) / 1000).toFixed(0);
process.stderr.write(" ".repeat(50) + "\r");

const rows = ids
  .map((id) => ({
    id,
    name: getFighter(id).name,
    rate: played[id] ? wins[id] / played[id] : 0,
    wins: wins[id],
    played: played[id],
    draws: draws[id],
  }))
  .sort((x, y) => y.rate - x.rate);

console.log(`\n${total} rounds at ${LEVEL}, ${REPS} per ordered pair, ${secs}s\n`);
console.log("  win%   fighter                    W/played  draws");
for (const r of rows) {
  const pct = (r.rate * 100).toFixed(1).padStart(5);
  const bar = "#".repeat(Math.round(r.rate * 40));
  console.log(
    `  ${pct}  ${r.name.padEnd(24)} ${String(r.wins).padStart(4)}/${String(r.played).padEnd(4)} ${String(r.draws).padStart(5)}  ${bar}`,
  );
}

// An even roster sits at 50%. Flagging is deliberately generous - with this
// many rounds the noise is a couple of points, not fifteen.
const HI = 0.65;
const LO = 0.35;
const hot = rows.filter((r) => r.rate >= HI);
const cold = rows.filter((r) => r.rate <= LO);
console.log("");
if (hot.length) console.log(`  above ${HI * 100}%: ${hot.map((r) => `${r.name} ${(r.rate * 100).toFixed(0)}%`).join(", ")}`);
if (cold.length) console.log(`  below ${LO * 100}%: ${cold.map((r) => `${r.name} ${(r.rate * 100).toFixed(0)}%`).join(", ")}`);
if (!hot.length && !cold.length) console.log(`  nobody outside ${LO * 100}-${HI * 100}%.`);

// Individual matchups that are effectively unwinnable, which a healthy win
// rate can hide: a fighter can sit at 50% overall and still lose every single
// round to one person.
const oneSided: string[] = [];
for (const a of ids) {
  for (const b of ids) {
    if (a === b) continue;
    const n = meetings[a][b];
    if (n < 4) continue;
    if (matrix[a][b] === n) oneSided.push(`${getFighter(a).name} beats ${getFighter(b).name} ${n}/${n}`);
  }
}
if (oneSided.length) {
  console.log(`\n  one-sided matchups (${oneSided.length}):`);
  for (const line of oneSided.slice(0, 25)) console.log(`    ${line}`);
  if (oneSided.length > 25) console.log(`    ...and ${oneSided.length - 25} more`);
}

if (SHOW_MATRIX) {
  const short = (id: string) => id.slice(0, 4).padStart(4);
  console.log(`\n  matchup grid - row's wins against column\n`);
  console.log(`        ${ids.map(short).join(" ")}`);
  for (const a of ids) {
    const cells = ids.map((b) => (a === b ? "   -" : String(matrix[a][b]).padStart(4))).join(" ");
    console.log(`  ${short(a)}  ${cells}`);
  }
}

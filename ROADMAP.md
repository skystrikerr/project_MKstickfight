# Roadmap

Where this is going, written down so it survives. Nothing here is committed
work and nothing here is scheduled — it is the standing list, plus notes on
what each item actually depends on.

The stated aim: **vast, janky, and extremely deep.** Not a polished small
thing. The jank is allowed; the depth is the point. See "On janky" at the
bottom, because that phrase has a load-bearing distinction inside it.

Longer term this engine is meant to carry more than one game — heroes,
sci-fi, fantasy, horror. Noted, not designed.

---

## The list

| | What | Shape |
|---|---|---|
| 1 | ~~Towers mode~~ — **built**; more modes after it | Content, once the AI is good |
| 2 | **Unique stages** — walls, cliffs, hazards | Systemic |
| 3 | **Create-a-fighter** | New product surface |
| 4 | **Progression**, beyond weapon unlocks | Extends what exists |
| 5 | **Ultimates** | Extends what exists |
| 6 | **Animation rework** | Long, compounding |
| 7 | **Gear** | Extends what exists |

The split in that last column matters more than the order. Three of these
extend systems that already work and can land incrementally. Two are systemic
and get harder the longer they wait. One is a different product.

---

## Notes per item

### Towers and other modes
**Built.** Three towers - a straight ten-fight climb, an eight-floor tower
where the rules change every floor, and an endless survival run on one health
bar. Floors are dealt from a seed, so a run is three numbers rather than a
saved blob, and modifiers are data: each one is a pair of callbacks plus the
warning text, driving five scalar knobs on a fighter and nothing else.

The gating concern below was right and still stands. A tower is a long
sequence of AI fights, so an exploitable AI makes it a chore with a health
bar - the modifiers buy some variety but they do not fix that. The next work
here is the AI, not more towers, and more game modes should wait behind it
for the same reason.

### Stages with walls, cliffs and hazards
This is the one that gets harder with every fighter added, so it should come
early. It is not content — it changes what the rules mean:

- A cliff means ring-outs, which is a second win condition. Match end, camera,
  and every knockback value in 22 fighter files acquire a new meaning.
- `physics.ts` is currently a flat floor plus platforms.
- The AI has no concept of stage position. It already cannot see projectiles
  properly; it certainly cannot see an edge.

Doable, but budget it as a systems change with a balance pass behind it.

### Create-a-fighter
The hardest item on the list by a distance, and the one most worth deciding
early because it shapes the data model.

Two very different products:
- **Constrained builder** — pick from prefab move sets, stats, props, palette.
  Achievable on the current `FighterDef` model with a validation layer, and the
  existing roster contract in `selftest.ts` is most of the rulebook already.
- **Full authoring** — expose keyframes and hitboxes to players. That is a
  different application with a different amount of work, and it needs the
  animation tooling below to exist first regardless.

Recommendation: scope it as the first one and say so out loud.

### Progression
Weapon unlocks exist and are per-fighter. The plumbing generalises — the
unlock rule is data on the item. Gear and stage/skin unlocks can reuse it
almost unchanged.

### Ultimates
Lowest risk on the list. Meter, supers, super freeze, invulnerability windows
and cinematic hit stops all already exist; an ultimate is a super with a
higher bar and more staging. Good candidate for an early win.

### Animation rework and gear
Longest, least visible per hour, and the thing that most decides whether the
jank reads as character or as unfinished.

The single highest-leverage move here is **tooling, not animation**. Poses are
joint-angle keyframes authored by hand in TypeScript. `animlab.html` exists;
a real in-browser pose editor that round-trips to the fighter files would pay
for itself across 22 fighters and every one after.

---

## What actually blocks the rest

**The AI.** It is ~380 lines of heuristics and it is the measuring instrument
for the entire game. Two examples from one session:

- It never read `match.projectiles` at all, so every fighter walked into
  everything thrown at them. That single gap put every projectile fighter
  above 65% and every melee fighter below 35%, and it looked exactly like a
  balance problem in the fighter files. It was not.
- Nai Khanom Tom sat last on the roster. Nothing in his stats explained it.
  Measuring what the AI *did* showed his win condition — a command grab worth
  162 damage — connecting 0.2 times per round.

Every balance number in `tools/balance.ts` is really "how these fighters do
under this AI." That is fine at 22 fighters. With 40 fighters, ultimates,
hazards and ring-outs it becomes actively misleading, and it gates towers.

Invest here before adding modes.

---

## The risk, stated plainly

Not ambition — breadth. The list above is larger than the game that exists,
and the failure mode is starting towers, hazards, create-a-fighter and
ultimates together and finishing none of them.

The counter is vertical slices: one mode fully playable beats four modes
half-wired, and this codebase is unusually well set up for that because the
fighter model, the test contract and the offline tools all already work.

---

## On janky

Worth being precise, because "janky but deep" is a real design target and it
has a failure mode.

Jank in the **presentation** is charm — stiff animation, blunt effects, a
stick figure holding a copper axe. Players forgive it and often love it.

Jank in the **rules** is not. If a player cannot tell why they lost, depth
reads as randomness and the game feels cheap regardless of how much is under
the hood.

This project is currently on the right side of that line, and it should stay
there deliberately:

- Frame data is exposed in training mode, read off the real hitbox windows.
- The move list is generated from the actual move data, so it cannot drift.
- Notation is checked against the input it documents.
- 8900+ self-tests, most of them contract tests about design rules rather than
  unit tests about functions.

That is the foundation that lets everything else be as janky as it likes.

---

## Reuse across games

The engine does not know it is historical. `FighterDef` has no concept of a
century; the roster's "real people" conceit lives entirely in prose fields and
the art.

Extracting a shared engine package now would be premature. The honest signal
is to build the second game and see what genuinely wants sharing — the answer
is usually less than expected, and usually not the parts predicted up front.

/**
 * Stick Fighter self-test: `npm run arcade:test`
 *
 * Runs the simulation headlessly with scripted inputs. It checks the core
 * mechanics still work and - importantly when adding fighters - that every
 * character honours the roster contract:
 *
 *   5 specials · 1 light · 1 heavy · block · dodge · jump · skill · super
 *
 * No test framework: it prints PASS/FAIL lines and exits non-zero on failure.
 */

import { AiController } from "./engine/ai";
import { EMPTY_INPUT, type RawInput } from "./engine/input";
import { Match } from "./engine/match";
import { getFighter, ROSTER } from "./fighters";
import { applySkin, distinctSkin, getSkin } from "./skins";
import type { FighterDef, MoveDef } from "./types";

const results: { name: string; ok: boolean; detail: string }[] = [];

function check(name: string, ok: boolean, detail = "") {
  results.push({ name, ok, detail });
}

const inp = (o: Partial<RawInput> = {}): RawInput => ({ ...EMPTY_INPUT, ...o });

function newMatch(a = "roman", b = "pirate"): Match {
  const m = new Match([getFighter(a), getFighter(b)]);
  for (let i = 0; i < 80; i++) m.step([inp(), inp()]); // skip the intro
  return m;
}

function run(m: Match, frames: number, p1: (f: number) => RawInput, p2: (f: number) => RawInput = () => inp()) {
  for (let i = 0; i < frames; i++) m.step([p1(i), p2(i)]);
}

const qcf = (btn: "A" | "B" | "C" | "S"): RawInput[] => [
  inp({ down: true }),
  inp({ down: true }),
  inp({ down: true, right: true }),
  inp({ right: true }),
  inp({ right: true, [btn]: true }),
  inp({ right: true, [btn]: true }),
];

// ---------------------------------------------------------------------------
// Roster contract
// ---------------------------------------------------------------------------

const isSpecial = (m: MoveDef) =>
  !!m.tags?.includes("special") && !m.tags?.includes("ex") && !m.variant && !m.internal;

function contract(def: FighterDef) {
  const moves = def.moves;
  const countTag = (tag: string) => moves.filter((m) => m.tags?.includes(tag as never)).length;

  check(`${def.id}: exactly five specials`, moves.filter(isSpecial).length === 5, `${moves.filter(isSpecial).length}`);
  check(`${def.id}: has a light attack`, countTag("light") >= 1);
  check(`${def.id}: has a heavy attack`, countTag("heavy") >= 1);
  check(`${def.id}: has a block`, moves.some((m) => m.id === "block"));
  check(`${def.id}: has a parry`, moves.some((m) => m.id === "parry"));
  check(`${def.id}: has a dodge`, moves.some((m) => m.tags?.includes("dodge")));
  check(`${def.id}: has a throw`, countTag("throw") >= 1);
  check(`${def.id}: has a character skill`, countTag("skill") >= 1);
  check(`${def.id}: has a super`, countTag("super") === 1);
  check(`${def.id}: can jump`, def.stats.jumpVel > 5 && def.stats.gravity > 0);

  // Move data integrity - the usual authoring mistakes.
  const ids = new Set(moves.map((m) => m.id));
  for (const m of moves) {
    if (m.throwDef) check(`${def.id}.${m.id}: throw target exists`, ids.has(m.throwDef.success), m.throwDef.success);
    for (const fu of m.followUps ?? []) {
      check(`${def.id}.${m.id}: follow-up exists`, ids.has(fu.move), fu.move);
    }
    if (m.holdRelease) check(`${def.id}.${m.id}: hold release exists`, ids.has(m.holdRelease), m.holdRelease);
    if (m.variant) check(`${def.id}.${m.id}: variant parent exists`, ids.has(m.variant), m.variant);
    for (const h of m.hits ?? []) {
      check(`${def.id}.${m.id}: hit inside duration`, h.to < m.duration, `${h.from}-${h.to} of ${m.duration}`);
    }
    for (const p of m.projectiles ?? []) {
      check(`${def.id}.${m.id}: projectile inside duration`, p.at < m.duration, `${p.at} of ${m.duration}`);
    }
    const last = m.frames[m.frames.length - 1];
    check(`${def.id}.${m.id}: animation covers the move`, !!last && last.t >= m.duration - 2, `${last?.t}/${m.duration}`);
    check(`${def.id}.${m.id}: has a description`, m.internal || m.desc.length > 0);
  }
}

for (const def of ROSTER) contract(def);

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

{
  const m = newMatch();
  const x0 = m.fighters[0].x;
  run(m, 40, () => inp({ right: true }));
  check("walking moves the fighter", m.fighters[0].x > x0 + 20);

  const j = newMatch();
  run(j, 12, () => inp({ up: true }));
  check("jump leaves the ground", j.fighters[0].y > 20, `y=${j.fighters[0].y.toFixed(1)}`);
  run(j, 70, () => inp());
  check("jump lands again", j.fighters[0].y <= 0.01);
}

{
  const m = newMatch();
  m.fighters[0].x = -40;
  m.fighters[1].x = 20;
  const hp = m.fighters[1].health;
  run(m, 30, (f) => inp({ B: f < 3 }));
  check("attacks deal damage", m.fighters[1].health < hp, `${hp} -> ${m.fighters[1].health}`);
}

{
  // Holding the Guard button blocks, without holding back.
  const m = newMatch();
  m.fighters[0].x = -40;
  m.fighters[1].x = 20;
  const hp = m.fighters[1].health;
  run(m, 30, (f) => inp({ B: f < 3 }), () => inp({ S: true }));
  check("Guard button blocks", hp - m.fighters[1].health <= 10, `lost=${hp - m.fighters[1].health}`);
}

{
  // Standing guard loses to a low.
  const m = newMatch();
  m.fighters[0].x = -40;
  m.fighters[1].x = 20;
  const hp = m.fighters[1].health;
  run(m, 40, (f) => inp({ down: f < 8, C: f >= 4 && f < 7 }), () => inp({ S: true }));
  check("lows beat standing guard", m.fighters[1].health < hp - 20, `lost=${hp - m.fighters[1].health}`);

  // Crouching guard stops it.
  const m2 = newMatch();
  m2.fighters[0].x = -40;
  m2.fighters[1].x = 20;
  const hp2 = m2.fighters[1].health;
  run(m2, 40, (f) => inp({ down: f < 8, C: f >= 4 && f < 7 }), () => inp({ S: true, down: true }));
  check("crouching guard stops lows", hp2 - m2.fighters[1].health <= 12, `lost=${hp2 - m2.fighters[1].health}`);
}

{
  // Dodge roll passes through an attack.
  const m = newMatch("western", "roman");
  m.fighters[0].x = -30;
  m.fighters[1].x = 40;
  const hp = m.fighters[0].health;
  run(m, 34, (f) => inp({ right: true, S: f < 3 }), (f) => inp({ B: f === 6 }));
  check("dodge roll avoids an attack", m.fighters[0].health === hp);
}

{
  // Every fighter's five specials can actually be performed from their input.
  for (const def of ROSTER) {
    for (const move of def.moves.filter(isSpecial)) {
      const m = newMatch(def.id, "roman");
      const self = m.fighters[0];
      // This check is about the input, not the economy: pay for everything.
      self.meter = 200;
      self.resource = def.resource?.max ?? 0;
      const script = scriptFor(move);
      let fired = false;
      for (let i = 0; i < 90; i++) {
        // Air specials need a jump first.
        const pre = move.input.stance === "air" && i < 3 ? inp({ up: true }) : null;
        m.step([pre ?? script[i - (move.input.stance === "air" ? 8 : 0)] ?? inp(), inp()]);
        if (self.move?.id === move.id) fired = true;
      }
      check(`${def.id}.${move.id}: comes out from its input`, fired, move.notation ?? "");
    }
  }
}

/** Turns a move's input into the button/stick script that performs it. */
function scriptFor(move: MoveDef): RawInput[] {
  const btn = move.input.button ?? "B";
  const motion = move.input.motion ?? "none";
  const press = (extra: Partial<RawInput>) => inp({ ...extra, [btn]: true });
  switch (motion) {
    case "qcf":
      return qcf(btn);
    case "qcb":
      return [
        inp({ down: true }),
        inp({ down: true }),
        inp({ down: true, left: true }),
        inp({ left: true }),
        press({ left: true }),
        press({ left: true }),
      ];
    case "dp":
      return [
        inp({ right: true }),
        inp({ right: true }),
        inp({ down: true }),
        inp({ down: true }),
        inp({ down: true, right: true }),
        press({ down: true, right: true }),
        press({ down: true, right: true }),
      ];
    case "hcf":
      return [
        inp({ left: true }),
        inp({ down: true, left: true }),
        inp({ down: true }),
        inp({ down: true, right: true }),
        inp({ right: true }),
        press({ right: true }),
        press({ right: true }),
      ];
    case "hcb":
      return [
        inp({ right: true }),
        inp({ down: true, right: true }),
        inp({ down: true }),
        inp({ down: true, left: true }),
        inp({ left: true }),
        press({ left: true }),
        press({ left: true }),
      ];
    case "dd":
      return [inp({ down: true }), inp({ down: true }), inp(), inp({ down: true }), press({ down: true }), press({ down: true })];
    case "chargeB": {
      // Hold back past COMBAT.chargeFrames, then let go forward with the button.
      const script: RawInput[] = [];
      for (let i = 0; i < 48; i++) script.push(inp({ left: true }));
      script.push(press({ right: true }), press({ right: true }), press({ right: true }));
      return script;
    }
    case "chargeD": {
      const script: RawInput[] = [];
      for (let i = 0; i < 48; i++) script.push(inp({ down: true }));
      script.push(press({ up: true }), press({ up: true }), press({ up: true }));
      return script;
    }
    default: {
      const dir = move.input.dir;
      const held: Partial<RawInput> =
        dir === "f" ? { right: true } : dir === "b" ? { left: true } : dir === "d" ? { down: true } : dir === "df" ? { down: true, right: true } : {};
      return [inp(held), press(held), press(held)];
    }
  }
}

{
  // Supers cost meter and land.
  for (const def of ROSTER) {
    const superMove = def.moves.find((m) => m.tags?.includes("super"))!;
    const m = newMatch(def.id, "roman");
    m.fighters[0].meter = 200;
    m.fighters[0].x = -60;
    m.fighters[1].x = 30;
    const hp = m.fighters[1].health;
    const script = scriptFor(superMove);
    let fired = false;
    for (let i = 0; i < 220; i++) {
      m.step([script[i] ?? inp(), inp()]);
      if (m.fighters[0].move?.id === superMove.id) fired = true;
    }
    check(`${def.id}: super activates`, fired, superMove.notation ?? "");
    check(`${def.id}: super deals damage`, m.fighters[1].health < hp, `lost=${hp - m.fighters[1].health}`);
  }
}

{
  // Knockback scales with the weight of the blow: the same fighter hit by a
  // jab and by a heavy should not end up in the same place.
  const shoveFrom = (button: "A" | "B") => {
    const m = newMatch("roman", "roman");
    m.fighters[0].x = -40;
    m.fighters[1].x = 20;
    let peak = 0;
    for (let i = 0; i < 30; i++) {
      m.step([inp({ [button]: i < 3 }), inp()]);
      peak = Math.max(peak, Math.abs(m.fighters[1].vx));
    }
    return peak;
  };
  const light = shoveFrom("A"); // 34 damage jab
  const heavy = shoveFrom("B"); // 62 damage thrust
  check("heavier hits push further", heavy > light * 1.3, `light=${light.toFixed(2)} heavy=${heavy.toFixed(2)}`);

  // ... and a heavyweight shoves a lightweight further than the reverse.
  const shoveBetween = (a: string, b: string) => {
    const m = newMatch(a, b);
    m.fighters[0].x = -40;
    m.fighters[1].x = 20;
    let peak = 0;
    for (let i = 0; i < 30; i++) {
      m.step([inp({ B: i < 3 }), inp()]);
      peak = Math.max(peak, Math.abs(m.fighters[1].vx));
    }
    return peak;
  };
  const heavyOnLight = shoveBetween("roman", "ninja");
  const lightOnHeavy = shoveBetween("ninja", "roman");
  check(
    "weight tilts the shove",
    heavyOnLight > lightOnHeavy,
    `${heavyOnLight.toFixed(2)} vs ${lightOnHeavy.toFixed(2)}`,
  );
}

{
  // A skin is paint only: same ids, same frame data, different colours.
  const base = getFighter("roman");
  const painted = applySkin(base, getSkin("twilight"));
  check("a skin keeps the fighter's identity", painted.id === base.id && painted.moves.length === base.moves.length);
  check("a skin repaints the palette", painted.palette.accent !== base.palette.accent, painted.palette.accent);
  check("a skin leaves the ink alone", painted.palette.outline === base.palette.outline);
  check(
    "a skin repaints the kit",
    painted.props.some((p, i) => p.parts.some((part, j) => part.color !== base.props[i].parts[j].color)),
  );
  check("a skin does not touch the numbers", painted.stats === base.stats && painted.moves[0].duration === base.moves[0].duration);
  check("classic is the untouched fighter", applySkin(base, getSkin("classic")) === base);
  check(
    "a mirror match forces different colours",
    distinctSkin("roman", "ember", "roman", "ember") !== "ember",
  );
  check("different fighters keep their chosen colours", distinctSkin("roman", "ember", "viking", "ember") === "ember");

  // Painting a fighter must not change a single frame of the simulation, so
  // the same scripted exchange has to land on exactly the same numbers.
  const script = (f: number): RawInput =>
    inp({ right: f % 40 < 12, A: f % 40 === 14, B: f % 40 === 22, C: f % 40 === 30, S: f % 40 > 33 });
  const plain = new Match([getFighter("viking"), getFighter("ninja")]);
  const skinned = new Match([
    applySkin(getFighter("viking"), getSkin("gilt")),
    applySkin(getFighter("ninja"), getSkin("ash")),
  ]);
  for (let i = 0; i < 600; i++) {
    plain.step([script(i), script(i + 17)]);
    skinned.step([script(i), script(i + 17)]);
  }
  check(
    "a skinned match plays out identically",
    plain.fighters[0].health === skinned.fighters[0].health &&
      plain.fighters[1].health === skinned.fighters[1].health &&
      plain.fighters[0].x === skinned.fighters[0].x,
    `${plain.fighters[0].health}/${skinned.fighters[0].health}`,
  );
}

{
  // Ragdoll physics: a knockdown hands the pose to a physics body that
  // settles on the floor without drifting away from the fighter.
  const m = newMatch();
  m.fighters[0].x = -40;
  m.fighters[1].x = 20;
  run(m, 26, (f) => inp({ C: f < 3 })); // 5C knocks down hard
  const victim = m.fighters[1];
  check("knockdown starts a ragdoll", victim.ragdoll !== null, `state=${victim.state}`);

  const before = victim.ragdoll!.toSkeleton(victim.x, victim.y, victim.facing);
  run(m, 8, () => inp());
  const during = victim.ragdoll!.toSkeleton(victim.x, victim.y, victim.facing);
  const moved = Math.abs(during.head.x - before.head.x) + Math.abs(during.head.y - before.head.y);
  check("ragdoll joints are in motion", moved > 0.5, `moved=${moved.toFixed(2)}`);

  run(m, 60, () => inp());
  const settled = victim.ragdoll ?? null;
  if (settled) {
    const sk = settled.toSkeleton(victim.x, victim.y, victim.facing);
    const lowest = Math.min(sk.footF.y, sk.footB.y, sk.head.y, sk.pelvis.y);
    check("ragdoll does not sink through the floor", lowest > -6, `lowest=${lowest.toFixed(1)}`);
    check("ragdoll stays with the fighter", Math.abs(sk.pelvis.x) < 90, `dx=${sk.pelvis.x.toFixed(1)}`);
  }

  // Getting up drops the physics body.
  run(m, 90, () => inp());
  check("wakeup clears the ragdoll", m.fighters[1].ragdoll === null, `state=${m.fighters[1].state}`);
}

{
  // A KO leaves a ragdoll on the floor for the round-end camera.
  const m = newMatch();
  m.fighters[1].health = 20;
  m.fighters[0].x = -40;
  m.fighters[1].x = 20;
  run(m, 30, (f) => inp({ C: f < 3 }));
  check("KO drops the loser into a ragdoll", m.fighters[1].ragdoll !== null, `phase=${m.phase}`);
}

{
  // Momentum: walking builds up speed rather than snapping to it.
  const m = newMatch();
  const f = m.fighters[0];
  m.step([inp({ right: true }), inp()]);
  const firstFrame = Math.abs(f.vx);
  run(m, 12, () => inp({ right: true }));
  const settledSpeed = Math.abs(f.vx);
  check("walking accelerates instead of snapping", firstFrame < settledSpeed, `${firstFrame.toFixed(2)} -> ${settledSpeed.toFixed(2)}`);
  run(m, 10, () => inp());
  check("releasing the stick sheds speed", Math.abs(f.vx) < 0.2, `vx=${f.vx.toFixed(2)}`);
}

{
  // Rounds and matches resolve.
  const m = newMatch();
  for (let round = 0; round < 2; round++) {
    m.fighters[1].health = 15;
    m.fighters[0].x = -40;
    m.fighters[1].x = 20;
    run(m, 40, (f) => inp({ C: f < 3 }));
    run(m, 220, () => inp());
  }
  check("best-of-three ends with a winner", m.matchWinner === 0, `winner=${m.matchWinner}`);
}

{
  // The AI plays every matchup to completion.
  let finished = 0;
  for (const a of ROSTER) {
    for (const b of ROSTER) {
      const m = new Match([a, b]);
      const ai1 = new AiController("Champion");
      const ai2 = new AiController("Brawler");
      for (let i = 0; i < 40000; i++) {
        m.step([ai1.step(m, m.fighters[0], m.fighters[1]), ai2.step(m, m.fighters[1], m.fighters[0])]);
        if (m.phase === "matchEnd") break;
      }
      if (m.phase === "matchEnd") finished++;
    }
  }
  check("AI finishes every matchup", finished === ROSTER.length * ROSTER.length, `${finished}/${ROSTER.length ** 2}`);
}

// ---------------------------------------------------------------------------

const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length} passed, ${failed.length} failed`);
for (const f of failed) console.log(`FAIL  ${f.name}${f.detail ? " :: " + f.detail : ""}`);
if (failed.length > 0) process.exit(1);

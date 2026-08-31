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
import { EMPTY_INPUT, GamepadReader, type RawInput } from "./engine/input";
import { Match } from "./engine/match";
import { Music, TRACKS, type MusicCue } from "./engine/music";
import { DEFAULT_TRAINING, frameData, TrainingRoom } from "./engine/training";
import { clipFor } from "./clips";
import { getFighter, ROSTER } from "./fighters";
import { attachTransform } from "./render/rig";
import { buildSkeleton, sampleClip } from "./skeleton";
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

  // The attack grid: every button has a neutral, a forward and a back, and
  // crouching covers the lows. A hole here means part of the stick does
  // nothing, which is what this looked like before the sets were filled in.
  for (const slot of ["5A", "5B", "5C", "6A", "6B", "6C", "4A", "4B", "4C", "2A", "2B", "2C"]) {
    check(`${def.id}: has ${slot}`, moves.some((m) => m.id === slot));
  }
  // ...and at least one of them must be an overhead, or crouch-blocking beats
  // everything he has.
  const levels = new Set(moves.flatMap((m) => (m.hits ?? []).map((h) => h.guard ?? "mid")));
  check(`${def.id}: has an overhead`, levels.has("overhead"), [...levels].join("/"));
  check(`${def.id}: has a low`, levels.has("low"), [...levels].join("/"));

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
  // The sidestep passes through an attack.
  //
  // Run the same exchange twice - once stepping, once standing still - and
  // compare. Asserting only that the dodger takes no damage passes just as
  // well when the attack was never going to reach, which is how a timing
  // change can quietly turn this into a test of nothing.
  const exchange = (dodge: boolean) => {
    const m = newMatch("western", "roman");
    m.fighters[0].x = -30;
    m.fighters[1].x = 40;
    const hp = m.fighters[0].health;
    run(m, 34, (f) => inp({ right: true, S: dodge && f < 3 }), (f) => inp({ B: f === 2 }));
    return hp - m.fighters[0].health;
  };
  const standing = exchange(false);
  const stepping = exchange(true);
  check("sidestep: the attack would otherwise land", standing > 0, `lost=${standing}`);
  check("sidestep avoids an attack", stepping === 0, `lost=${stepping}`);
}

{
  // A dodge has to cover ground. The roll this replaced turned a full circle
  // while travelling less far than simply walking for the same number of
  // frames, which is exactly why it looked like spinning on the spot.
  for (const def of ROSTER) {
    const m = newMatch(def.id, "roman");
    const f = m.fighters[0];
    const move = def.moves.find((mv) => mv.tags?.includes("dodge"))!;
    const x0 = f.x;
    m.step([inp({ right: true, S: true }), inp()]);
    let frames = 1;
    while (f.move?.id === move.id) {
      m.step([inp(), inp()]);
      frames++;
    }
    const travelled = f.x - x0;
    const walked = def.stats.walkF * frames;
    check(
      `${def.id}: the dodge outruns a walk`,
      travelled > walked,
      `${travelled.toFixed(1)} vs ${walked.toFixed(1)} in ${frames}f`,
    );
    check(
      `${def.id}: the dodge clears its own width`,
      travelled > def.stats.width * 2,
      `${(travelled / def.stats.width).toFixed(2)} body-widths`,
    );
  }
}

{
  // ...and it has to cover that ground honestly. A foot resting on the floor
  // while the body slides is skating, and it was the first thing that went
  // wrong once the dodge was made to travel: 119 units of foot slide over 59
  // units of movement, feet crossing the floor faster than the fighter moved.
  // The travel happens in the air now, so almost nothing is planted while
  // anything is moving.
  for (const def of ROSTER) {
    const m = newMatch(def.id, "roman");
    const f = m.fighters[0];
    m.step([inp({ right: true, S: true }), inp()]);

    let skate = 0;
    let prev: { footF: number; footB: number; x: number } | null = null;
    while (f.move?.tags?.includes("dodge")) {
      const { pose, grounded } = f.pose();
      const sk = buildSkeleton(pose, grounded, def.stats.scale);
      const cur = { footF: f.x + sk.footF.x * f.facing, footB: f.x + sk.footB.x * f.facing, x: f.x };
      const onFloor = Math.min(sk.footF.y, sk.footB.y, sk.toeF.y, sk.toeB.y) <= 1.5 && !pose.free;
      // Only a planted foot under a *moving* body counts. A foot travelling
      // under a stationary body is the leg being picked up.
      if (prev && onFloor && Math.abs(cur.x - prev.x) > 0.1) {
        skate += sk.footF.y <= sk.footB.y
          ? Math.abs(cur.footF - prev.footF)
          : Math.abs(cur.footB - prev.footB);
      }
      prev = cur;
      m.step([inp(), inp()]);
    }
    check(`${def.id}: the dodge does not skate`, skate < 20, `${skate.toFixed(1)} units of foot slide`);
  }
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

{
  // Gamepad mapping. A pad is the way most people will actually play this, and
  // the mapping is the kind of thing that breaks silently, so it is pinned here
  // against a fake standard-mapping pad rather than trusted.
  const pad = (buttons: number[] = [], axes: number[] = [0, 0]) => ({
    id: "Fake (STANDARD GAMEPAD)",
    index: 0,
    connected: true,
    mapping: "standard",
    timestamp: 0,
    axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: buttons.includes(i),
      touched: buttons.includes(i),
      value: buttons.includes(i) ? 1 : 0,
    })),
  });
  // Node defines `navigator` as a getter-only global, so it has to be swapped
  // with defineProperty rather than assigned to.
  const withPad = <T,>(p: unknown, fn: () => T): T => {
    const saved = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "navigator", {
      value: { getGamepads: () => [p] },
      configurable: true,
      writable: true,
    });
    try {
      return fn();
    } finally {
      if (saved) Object.defineProperty(globalThis, "navigator", saved);
      else delete (globalThis as { navigator?: unknown }).navigator;
    }
  };

  const reader = new GamepadReader();
  const read = (p: unknown) => withPad(p, () => reader.read(0));

  check("pad: no pad reads as nothing", withPad(null, () => reader.read(0)) === null);
  check("pad: face buttons map to A/B/C", !!read(pad([0]))?.A && !!read(pad([1]))?.B && !!read(pad([2]))?.C);
  check("pad: triangle and both left triggers guard", !!read(pad([3]))?.S && !!read(pad([4]))?.S && !!read(pad([6]))?.S);
  check("pad: R1 is the skill (A + C)", !!read(pad([5]))?.A && !!read(pad([5]))?.C);
  check("pad: R2 is the throw (A + B)", !!read(pad([7]))?.A && !!read(pad([7]))?.B);
  check(
    "pad: d-pad maps to directions",
    !!read(pad([12]))?.up && !!read(pad([13]))?.down && !!read(pad([14]))?.left && !!read(pad([15]))?.right,
  );
  // The stick has to be pushed properly, or a resting stick drifts you around.
  check("pad: stick past the dead zone moves", !!read(pad([], [1, 0]))?.right && !!read(pad([], [0, 1]))?.down);
  check("pad: stick inside the dead zone does not", !read(pad([], [0.3, 0.3]))?.right);
  check("pad: a resting pad is a neutral input", !read(pad())?.A && !read(pad())?.left && !read(pad())?.down);
  check("pad: counts what is plugged in", withPad(pad(), () => reader.count()) === 1);
}

{
  // Training mode. The point of it is that you can hold a button down forever
  // and the world does not move on, so that is what gets asserted.
  const room = new TrainingRoom({ ...DEFAULT_TRAINING, dummy: "stand" });
  const m = newMatch("roman", "pirate");
  const [player, dummy] = m.fighters;

  // Frame data is read off the move's own hit windows.
  const jab = getFighter("roman").moves.find((mv) => mv.id === "5A")!;
  const fd = frameData(jab);
  check("training: startup is the first active frame", fd.startup === 4, `${fd.startup}`);
  check("training: active counts inclusively", fd.active === 3, `${fd.active}`);
  check("training: recovery is what is left", fd.recovery === jab.duration - 6 - 1, `${fd.recovery}`);
  const block = getFighter("roman").moves.find((mv) => mv.id === "block")!;
  check("training: a move with no hitboxes has no startup", frameData(block).startup === null);

  // The clock never runs out, so a practice session does not end on you.
  m.timer = 3;
  for (let i = 0; i < 30; i++) {
    m.step([inp(), inp()]);
    room.apply(m);
  }
  check("training: the round clock never expires", m.phase !== "roundEnd", m.phase);

  // Health comes back, but only once they are out of hitstun - otherwise the
  // bar snaps back mid-combo and you cannot read what the combo did.
  player.x = -40;
  dummy.x = 20;
  let sawDamage = false;
  for (let i = 0; i < 40; i++) {
    m.step([inp({ C: i < 3 }), inp()]);
    if (dummy.health < dummy.def.stats.health) sawDamage = true;
    room.apply(m);
  }
  check("training: hits still land", sawDamage);
  for (let i = 0; i < 120; i++) {
    m.step([inp(), inp()]);
    room.apply(m);
  }
  check("training: health refills once the dummy recovers", dummy.health === dummy.def.stats.health, `${dummy.health}`);
  check("training: meter stays full", player.meter === 200, `${player.meter}`);
  check("training: the readout remembers the last move", room.readout.last !== null, room.readout.last?.name ?? "none");

  // The dummy settings produce the inputs they claim to.
  const stand = new TrainingRoom({ ...DEFAULT_TRAINING, dummy: "stand" }).dummyInput();
  check("training: the standing dummy presses nothing", !!stand && !stand.down && !stand.S && !stand.up);
  check("training: the crouching dummy holds down", new TrainingRoom({ ...DEFAULT_TRAINING, dummy: "crouch" }).dummyInput()?.down === true);
  check("training: the blocking dummy holds guard", new TrainingRoom({ ...DEFAULT_TRAINING, dummy: "block" }).dummyInput()?.S === true);
  check("training: fight-back hands over to the AI", new TrainingRoom({ ...DEFAULT_TRAINING, dummy: "cpu" }).dummyInput() === null);

  // The jumping dummy has to actually leave the ground, and has to stop, or
  // there is no window to anti-air it.
  const hopper = new TrainingRoom({ ...DEFAULT_TRAINING, dummy: "jump" });
  let pressed = 0;
  for (let i = 0; i < 46; i++) if (hopper.dummyInput()?.up) pressed++;
  check("training: the jumping dummy hops on a loop", pressed > 0 && pressed < 46, `${pressed}/46 frames`);

  // Reset puts them back on their marks and lets play continue.
  room.reset(m);
  check("training: reset restores full health", m.fighters[1].health === m.fighters[1].def.stats.health);
  check("training: reset leaves the round playable", m.phase === "fight", m.phase);
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------
{
  const SHIELDS = /shield|aspis|buckler|isihlangu/i;

  for (const def of ROSTER) {
    check(`${def.id}: guards are authored, not inherited`, !!def.clips?.blockHigh && !!def.clips?.blockLow);

    for (const clipName of ["blockHigh", "blockLow"] as const) {
      const pose = sampleClip(clipFor(clipName, def.clips), 8, def.stance);
      const sk = buildSkeleton(pose, true, 1);
      // Whatever they guard with has to be in front of them. A guard that ends
      // up behind the fighter is the bug this replaced.
      const lead = Math.max(sk.handF.x, sk.handB.x);
      check(`${def.id}: ${clipName} keeps the hands in front`, lead > 6, `lead hand x=${lead.toFixed(1)}`);

      const shield = def.props.find((prop) => SHIELDS.test(prop.id));
      if (!shield) continue;
      const t = attachTransform(sk, shield.attach);
      const main = shield.parts.reduce((a, b) =>
        Math.max(...b.size.map(Math.abs)) > Math.max(...a.size.map(Math.abs)) ? b : a,
      );
      const a = t.rot * (Math.PI / 180);
      const [ox, oy] = main.pos ?? [0, 0];
      const cx = t.x + Math.cos(a) * ox - Math.sin(a) * oy;
      const cy = t.y + Math.sin(a) * ox + Math.cos(a) * oy;
      check(`${def.id}: ${clipName} puts the shield in front of the body`, cx > 8, `shield x=${cx.toFixed(1)}`);
      check(`${def.id}: ${clipName} holds the shield at body height`, cy > 35 && cy < 95, `shield y=${cy.toFixed(1)}`);
      // The tall shields read as shields only while they stand upright.
      if (/isihlangu|^shield$/i.test(shield.id)) {
        const tilt = Math.abs((((t.rot % 360) + 540) % 360) - 180);
        check(`${def.id}: ${clipName} keeps the shield upright`, tilt < 30, `tilt=${tilt.toFixed(1)}`);
      }
    }
  }

  // A blockstring must not drop the guard between hits. `setState("blockstun")`
  // zeroes stateFrame, so the guard clips run off `guardHold` instead.
  const m = newMatch("roman", "spartan");
  const def = m.fighters[1];
  // Close the gap first - a blockstring at round-start spacing whiffs.
  run(m, 60, () => inp({ right: true }), () => inp({ S: true }));
  const beforeHold = def.guardHold;
  let held = true;
  let sawShove = false;
  let sawBlock = false;
  for (let i = 0; i < 90; i++) {
    m.step([inp({ B: i % 26 === 0 }), inp({ S: true })]);
    if (def.state === "blockstun") sawBlock = true;
    if (def.guardShove > 0) sawShove = true;
    if (def.guardHold < beforeHold) held = false;
  }
  check("guard: a blockstring lands", sawBlock);
  check("guard: the guard does not drop between blocked hits", held, `hold=${def.guardHold}`);
  check("guard: a blocked hit shoves the guard", sawShove);

  // ...and the shove decays instead of sticking.
  for (let i = 0; i < 40; i++) m.step([inp(), inp({ S: true })]);
  check("guard: the shove settles back to the guard", def.guardShove === 0, `${def.guardShove}`);

  // Letting go of guard clears the hold, so the next block raises the arms again.
  for (let i = 0; i < 12; i++) m.step([inp(), inp()]);
  check("guard: dropping the guard resets the raise", def.guardHold === 0, `${def.guardHold}`);
}

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------
{
  const CUES: MusicCue[] = ["menu", "select", "fight", "victory"];
  for (const cue of Object.keys(TRACKS)) {
    check(`music: "${cue}" is a real cue`, CUES.includes(cue as MusicCue));
    const entry = TRACKS[cue as MusicCue];
    for (const t of Array.isArray(entry) ? entry : entry ? [entry] : []) {
      check(`music: ${cue} names a file`, !!t.file && !t.file.includes("/"), t.file);
      check(`music: ${cue} gain is sane`, t.gain === undefined || (t.gain > 0 && t.gain <= 1), `${t.gain}`);
    }
  }

  // A cue asked for before the page has had its gesture has to actually start
  // once the gesture arrives. `play` ignores the cue it is already on, and the
  // held cue is that cue, so unlocking has to clear it first - getting this
  // wrong means the title music never plays at all, which is what shipped for
  // about ten minutes.
  const held = new Music();
  const first = (Object.keys(TRACKS) as MusicCue[])[0];
  if (first) {
    held.play(first);
    check("music: a cue asked for before the gesture is held", held.started === null);
    held.unlock();
    check("music: unlocking starts the held cue", held.started !== null, `${held.started}`);
  }

  // The whole point is that the game runs with no music at all. Nothing here
  // has an `Audio` constructor, which is the same situation as a track that
  // fails to load.
  const m = new Music();
  m.unlock();
  for (const cue of CUES) m.play(cue);
  m.setMuted(true);
  m.setVolume(0.2);
  m.stop();
  check("music: an empty soundtrack is silent, not broken", m.cue === null, `${m.cue}`);
}

// ---------------------------------------------------------------------------
// Ammunition
// ---------------------------------------------------------------------------
{
  // A ranged fighter has to be able to run out, and has to be able to do
  // something about it. Both halves matter: infinite ammunition makes a zoner
  // unbeatable, and ammunition with no way back makes them useless.
  for (const def of ROSTER) {
    const res = def.resource;
    if (!res) continue;
    const shooters = def.moves.filter((mv) => (mv.projectiles?.length ?? 0) > 0 && (mv.resourceCost ?? 0) > 0);
    if (!shooters.length) continue;

    // The reload is the skill on A+C where there is one; some fighters also
    // gain resource off a special, which is not the same thing.
    const reload =
      def.moves.find((mv) => (mv.resourceGain ?? 0) > 0 && mv.input.buttons?.length === 2) ??
      def.moves.find((mv) => (mv.resourceGain ?? 0) > 0);
    // Every shooter needs a move that rearms, not just passive regeneration -
    // without one, firing on empty has nothing to fall back to.
    check(`${def.id}: has a move that puts ammunition back`, !!reload, reload?.id ?? "regen only");

    const m = newMatch(def.id, "roman");
    const f = m.fighters[0];
    f.x = -200;
    m.fighters[1].x = 200;

    // Empty, and the shot must stop coming out.
    f.resource = 0;
    run(m, 4, () => inp());
    const shot = shooters[0];
    m.step([inp({ [shot.input.button ?? "C"]: true }), inp()]);
    check(`${def.id}: cannot shoot on an empty ${res.name.toLowerCase()}`, f.move?.id !== shot.id, f.move?.id ?? "none");

    if (!reload) continue;
    // The empty-shot check above may have started an automatic reload, which
    // is the point of it. Let it finish, then count from a full belt.
    run(m, reload.duration + 8, () => inp());
    f.spares = res.spares ?? 0;
    // Reloading refills it, and only as often as they have spares for.
    let reloads = 0;
    for (let i = 0; i < 8; i++) {
      // Let whatever the last press started finish - pressing the shot button
      // on an empty magazine still gives you the normal on that button.
      run(m, 60, () => inp());
      f.resource = 0;
      m.step([inp({ A: true, C: true }), inp()]);
      if (f.move?.id !== reload.id) break;
      run(m, reload.duration + 4, () => inp());
      reloads++;
    }
    if (res.spares === undefined) {
      check(`${def.id}: can keep reloading`, reloads >= 8, `${reloads}`);
    } else {
      check(`${def.id}: carries exactly ${res.spares} spare`, reloads === res.spares, `${reloads} reloads`);
      check(`${def.id}: is out once the spares are gone`, f.spares === 0, `${f.spares} left`);
    }
  }

  // Pulling the trigger on an empty weapon reloads it. Nobody reaches for a
  // two-button skill mid-round; if reloading needs remembering, it does not
  // happen, and a zoner who cannot rearm is just a worse melee fighter.
  for (const def of ROSTER) {
    const res = def.resource;
    if (!res) continue;
    const grounded = (mv: MoveDef) => {
      const st = mv.input.stance;
      return Array.isArray(st) ? st.includes("stand") : st === "stand";
    };
    const shot = def.moves.find(
      (mv) =>
        (mv.projectiles?.length ?? 0) > 0 &&
        ((mv.resourceCost ?? 0) > 0 || mv.resourceMin !== undefined) &&
        !mv.meterCost &&
        !mv.internal &&
        grounded(mv),
    );
    if (!shot || !def.moves.some((mv) => (mv.resourceGain ?? 0) > 0)) continue;

    const m = newMatch(def.id, "roman");
    const f = m.fighters[0];
    f.x = -200;
    m.fighters[1].x = 200;
    f.resource = 0;
    run(m, 3, () => inp());

    const script = scriptFor(shot);
    let rearmed = false;
    for (const step of script) {
      m.step([step, inp()]);
      if ((f.move?.resourceGain ?? 0) > 0) rearmed = true;
    }
    check(`${def.id}: firing on empty rearms instead of doing nothing`, rearmed, f.move?.id ?? "nothing came out");
  }

  // The numbers the roster is meant to carry.
  const trooper = getFighter("soldier").resource!;
  check("trooper: three thirty-round magazines", trooper.max === 30 && trooper.spares === 2, `${trooper.max}x${(trooper.spares ?? 0) + 1}`);
  check("Earp: a six-round cylinder he can keep refilling", getFighter("western").resource!.max === 6 && getFighter("western").resource!.spares === undefined);
  check("Subutai: a hundred arrows", getFighter("mongol").resource!.max === 100);
}

// ---------------------------------------------------------------------------

const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length} passed, ${failed.length} failed`);
for (const f of failed) console.log(`FAIL  ${f.name}${f.detail ? " :: " + f.detail : ""}`);
if (failed.length > 0) process.exit(1);

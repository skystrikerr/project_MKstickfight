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

import { AiController, STYLES } from "./engine/ai";
import { HURTBOX } from "./constants";
import { EMPTY_INPUT, GamepadReader, Keyboard, P1_KEYS, type RawInput } from "./engine/input";
import { Match } from "./engine/match";
import { Music, TRACKS, type MusicCue } from "./engine/music";
import { DEFAULT_TRAINING, frameData, TrainingRoom } from "./engine/training";
import { TUTORIAL_STEPS, TutorialRunner } from "./engine/tutorial";
import { clipFor } from "./clips";
import { getFighter, ROSTER } from "./fighters";
import { advanceRun, buildLadder, continueRun, ENDINGS, LADDER_LENGTH, shiftLevel, startRun, type Run } from "./ladder";
import { clearSave, DEFAULT_SAVE, loadSave, patchSave, recordClear } from "./save";
import { BINDABLE_ACTIONS, codeLabel, defaultKeyMap, isKeyCode, toKeyBindings } from "./keybinds";
import { STAGE_THEMES } from "./render/stage";
import { attachTransform } from "./render/rig";
import { buildSkeleton, sampleClip } from "./skeleton";
import { applySkin, distinctSkin, getSkin } from "./skins";
import { applyWeapon, WEAPONS, weaponsFor } from "./weapons";
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
  // Both dodges exist, and they are not the same move wearing two names.
  for (const def of ROSTER) {
    const dodges = def.moves.filter((m) => m.tags?.includes("dodge"));
    check(`${def.id}: has both dodges`, dodges.length === 2, `${dodges.length} found: ${dodges.map((m) => m.id).join(",")}`);
    check(
      `${def.id}: one is the forward sidestep, one is the motion backstep`,
      dodges.some((m) => m.input.dir === "f") && dodges.some((m) => m.input.motion === "bb"),
      dodges.map((m) => `${m.id}:${m.input.dir ?? m.input.motion}`).join(","),
    );
  }
}

{
  // A dodge that barely outruns a walk does not feel like an escape, so both
  // directions have to clear a real perceptual distance - not the narrow
  // internal collision width, but roughly what a player watching the screen
  // would call "a character's worth of space". Two or three of those is the
  // actual bar; this pins the floor at two so neither dodge can quietly
  // shrink back toward "basically walking" without a test noticing.
  const bb: RawInput[] = [inp({ left: true }), inp(), inp({ left: true })];
  for (const def of ROSTER) {
    const forward = (() => {
      const m = newMatch(def.id, "roman");
      const f = m.fighters[0];
      const x0 = f.x;
      m.step([inp({ right: true, S: true }), inp()]);
      while (f.move?.tags?.includes("dodge")) m.step([inp(), inp()]);
      return f.x - x0;
    })();
    const backward = (() => {
      const m = newMatch(def.id, "roman");
      const f = m.fighters[0];
      const x0 = f.x;
      for (const step of bb) m.step([step, inp()]);
      while (f.move?.tags?.includes("dodge")) m.step([inp(), inp()]);
      return f.x - x0;
    })();
    check(`${def.id}: sidestep clears two character-widths`, forward > HURTBOX.stand.w * 2, `${(forward / HURTBOX.stand.w).toFixed(2)}w`);
    check(`${def.id}: backstep clears two character-widths`, -backward > HURTBOX.stand.w * 2, `${(-backward / HURTBOX.stand.w).toFixed(2)}w`);
    check(`${def.id}: backstep actually goes backward`, backward < 0, backward.toFixed(1));
  }
}

{
  // The backstep has to cover ground honestly too - the same skating check
  // the sidestep gets, just triggered by the motion instead of the button.
  //
  // A motion needs two real taps before it is recognised, and holding back
  // for those taps - as fast as a real press-release-press can go, one
  // frame each - still hands the move a sliver of genuine walk momentum
  // before its own choreography starts. The forward sidestep never carries
  // this, because a button fires clean on the first frame it is held with
  // nothing walking beforehand. So this counts skate only from the frame the
  // move's own `vel` keyframe actually fires (frame 3, "last frame with
  // anything on the ground" per the move's own comment) - before that is
  // motion-recognition bleed, not the choreography being graded.
  const bb: RawInput[] = [inp({ left: true }), inp(), inp({ left: true })];
  for (const def of ROSTER) {
    const m = newMatch(def.id, "roman");
    const f = m.fighters[0];
    for (const step of bb) m.step([step, inp()]);

    let skate = 0;
    let prev: { footF: number; footB: number; x: number } | null = null;
    while (f.move?.tags?.includes("dodge")) {
      const { pose, grounded } = f.pose();
      const sk = buildSkeleton(pose, grounded, def.stats.scale);
      const cur = { footF: f.x + sk.footF.x * f.facing, footB: f.x + sk.footB.x * f.facing, x: f.x };
      const onFloor = Math.min(sk.footF.y, sk.footB.y, sk.toeF.y, sk.toeB.y) <= 1.5 && !pose.free;
      if (prev && onFloor && f.moveFrame >= 3 && Math.abs(cur.x - prev.x) > 0.1) {
        skate += sk.footF.y <= sk.footB.y ? Math.abs(cur.footF - prev.footF) : Math.abs(cur.footB - prev.footB);
      }
      prev = cur;
      m.step([inp(), inp()]);
    }
    check(`${def.id}: the backstep does not skate`, skate < 20, `${skate.toFixed(1)} units of foot slide`);
  }
}

{
  // The backstep has to actually dodge something, the same proof the
  // sidestep gets: run the exchange once retreating, once standing still,
  // and require the retreat alone to avoid the hit.
  const exchange = (dodge: boolean) => {
    const m = newMatch("western", "roman");
    m.fighters[0].x = -30;
    m.fighters[1].x = 55;
    const hp = m.fighters[0].health;
    const script: RawInput[] = dodge
      ? [inp({ left: true }), inp(), inp({ left: true })]
      : [inp(), inp(), inp()];
    run(m, 3, (f) => script[f], (f) => inp({ B: f === 2 }));
    run(m, 31, () => inp(), (f) => inp());
    return hp - m.fighters[0].health;
  };
  const standing = exchange(false);
  const backing = exchange(true);
  check("backstep: the attack would otherwise land", standing > 0, `lost=${standing}`);
  check("backstep avoids an attack", backing === 0, `lost=${backing}`);
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
    case "ff":
      return [inp({ right: true }), inp(), press({ right: true }), press({ right: true })];
    case "bb":
      return [inp({ left: true }), inp(), press({ left: true }), press({ left: true })];
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
}

{
  // Weapon variants. The contract is that a variant is a different drawing of
  // the same weapon and nothing else - if that ever stops being true, these
  // are the tests that should fail first.
  for (const [fighterId, variants] of Object.entries(WEAPONS)) {
    check(`weapons: ${fighterId} is a real fighter`, ROSTER.some((f) => f.id === fighterId));
    const base = getFighter(fighterId);
    const seen = new Set<string>();
    for (const v of variants) {
      check(`weapons: ${fighterId}.${v.id} has a unique id`, !seen.has(v.id));
      seen.add(v.id);
      check(`weapons: ${fighterId}.${v.id} says why it is a real pattern`, v.blurb.length > 40, `${v.blurb.length}`);
      check(`weapons: ${fighterId}.${v.id} re-cuts at least one prop`, Object.keys(v.parts).length > 0);
      for (const propId of Object.keys(v.parts)) {
        check(
          `weapons: ${fighterId}.${v.id} names a prop the fighter has (${propId})`,
          base.props.some((p) => p.id === propId),
        );
        check(`weapons: ${fighterId}.${v.id} draws something for ${propId}`, v.parts[propId].length > 0);
      }
      // Cosmetic for now, on purpose. Until the roster is balanced, a weapon
      // may not change how a fighter plays.
      check(`weapons: ${fighterId}.${v.id} carries no stats yet`, v.stats === undefined);

      const swapped = applyWeapon(base, v.id);
      check(`weapons: ${fighterId}.${v.id} keeps the moveset`, swapped.moves === base.moves);
      check(`weapons: ${fighterId}.${v.id} keeps the numbers`, swapped.stats === base.stats);
      check(`weapons: ${fighterId}.${v.id} keeps every prop`, swapped.props.length === base.props.length);
      check(
        `weapons: ${fighterId}.${v.id} actually changes the drawing`,
        swapped.props.some((p, i) => p.parts !== base.props[i].parts),
      );
      // Props it does not name are shared, not copied.
      const untouched = base.props.filter((p) => !v.parts[p.id]);
      check(
        `weapons: ${fighterId}.${v.id} leaves the rest of the kit alone`,
        untouched.every((p) => swapped.props.find((q) => q.id === p.id)?.parts === p.parts),
      );
    }
  }

  // An unknown or absent variant gives back the fighter untouched, which is
  // what a stale save or an arcade opponent with no variants relies on.
  const roman = getFighter("roman");
  check("weapons: no choice is the fighter as drawn", applyWeapon(roman, undefined) === roman);
  check("weapons: an unknown variant is ignored", applyWeapon(roman, "not-a-weapon") === roman);
  check("weapons: another fighter's variant is ignored", applyWeapon(roman, "tachi") === roman);

  // Weapon then skin: the chosen weapon has to be the thing that gets painted.
  const hasta = applyWeapon(roman, "hasta");
  const paintedHasta = applySkin(hasta, getSkin("twilight"));
  const hastaSpear = hasta.props.find((p) => p.id === "spear")!;
  const paintedSpear = paintedHasta.props.find((p) => p.id === "spear")!;
  check("weapons: a skin repaints the chosen weapon", paintedSpear.parts.length === hastaSpear.parts.length);
  check(
    "weapons: the painted weapon is still the variant's geometry",
    paintedSpear.parts.length !== roman.props.find((p) => p.id === "spear")!.parts.length ||
      paintedSpear.parts.some((part, i) => part.geo !== roman.props.find((p) => p.id === "spear")!.parts[i].geo),
  );
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

    // ...and the move it picked has to leave him better off than before.
    run(m, 80, () => inp());
    check(`${def.id}: the automatic reload actually gains ammunition`, f.resource >= 1, `${f.resource.toFixed(1)}`);
  }

  // The numbers the roster is meant to carry.
  const trooper = getFighter("soldier").resource!;
  check("trooper: three thirty-round magazines", trooper.max === 30 && trooper.spares === 2, `${trooper.max}x${(trooper.spares ?? 0) + 1}`);
  check("Earp: a six-round cylinder he can keep refilling", getFighter("western").resource!.max === 6 && getFighter("western").resource!.spares === undefined);
  check("Subutai: a hundred arrows", getFighter("mongol").resource!.max === 100);
}

// ---------------------------------------------------------------------------
// Platforms
// ---------------------------------------------------------------------------
{
  const ledges = STAGE_THEMES.aqueduct.platforms ?? [];
  check("aqueduct has ledges", ledges.length === 3, `${ledges.length}`);

  const stage = () => {
    const m = new Match([getFighter("roman"), getFighter("pirate")], 2, ledges);
    run(m, 80, () => inp());
    const f = m.fighters[0];
    f.x = -220;
    m.fighters[1].x = 400;
    return { m, f };
  };
  const jumpUp = (m: Match, f: (typeof m)["fighters"][0]) => {
    for (let i = 0; i < 90 && !f.standing; i++) m.step([inp({ up: i < 4 }), inp()]);
  };

  // Land on one from below.
  {
    const { m, f } = stage();
    jumpUp(m, f);
    check("platform: a jump lands on the ledge", !!f.standing && f.grounded, `y=${f.y.toFixed(0)}`);
    check("platform: standing on it counts as grounded", f.stance !== "air", f.stance);
  }

  // Pass up through one instead of bumping into it.
  {
    const { m, f } = stage();
    f.x = 0; // under the high centre span
    run(m, 3, () => inp());
    let caughtRising = false;
    for (let i = 0; i < 24; i++) {
      m.step([inp({ up: i < 4 }), inp()]);
      if (f.standing && f.vy > 0) caughtRising = true;
    }
    check("platform: rising passes through it", !caughtRising);
  }

  // Walk off the end and fall to the floor.
  {
    const { m, f } = stage();
    jumpUp(m, f);
    run(m, 70, () => inp({ left: true }));
    check("platform: walking off the end drops you", !f.standing && f.y <= 2, `y=${f.y.toFixed(0)}`);
  }

  // Down-down steps off it.
  {
    const { m, f } = stage();
    jumpUp(m, f);
    run(m, 20, () => inp());
    const from = f.y;
    for (const d of [{ down: true }, { down: true }, {}, { down: true }, { down: true }]) m.step([inp(d), inp()]);
    run(m, 40, () => inp());
    check("platform: down-down steps off the ledge", f.y < from - 40, `${from.toFixed(0)} -> ${f.y.toFixed(0)}`);
  }

  // ...but a down-down move still wins, because on eleven fighters that input
  // is the super, which is the last thing that should lose to a platform.
  {
    const dd = getFighter("ninja").moves.find((mv) => mv.input.motion === "dd")!;
    const m = new Match([getFighter("ninja"), getFighter("roman")], 2, ledges);
    run(m, 80, () => inp());
    const f = m.fighters[0];
    f.x = -220;
    m.fighters[1].x = 400;
    jumpUp(m, f);
    run(m, 20, () => inp());
    // About the input, not the economy - pay for it, the way the specials
    // check above does.
    f.meter = 200;
    let came = false;
    for (const step of scriptFor(dd)) {
      m.step([step, inp()]);
      if (f.move?.id === dd.id) came = true;
    }
    check(`platform: a down-down special still comes out on a ledge`, came, f.move?.id ?? "nothing");
  }

  // A flat stage behaves exactly as it did.
  {
    const m = new Match([getFighter("roman"), getFighter("pirate")]);
    run(m, 80, () => inp());
    const f = m.fighters[0];
    run(m, 60, (i) => inp({ up: i < 4 }));
    check("flat stage: nothing to stand on but the floor", !f.standing && f.grounded, `y=${f.y.toFixed(0)}`);
  }
}

// ---------------------------------------------------------------------------
// Strings
// ---------------------------------------------------------------------------
//
// A string is a route through the normals: each link names the move that
// continues it and the button that does the continuing, and it continues
// whether the hit landed or was blocked. That is what separates a string from
// a cancel - you are committed to the rest of it either way.

{
  for (const def of ROSTER) {
    const byId = new Map(def.moves.map((m) => [m.id, m]));

    // The route has to exist and the window has to be inside the move.
    for (const move of def.moves) {
      for (const f of move.followUps ?? []) {
        const next = byId.get(f.move);
        check(`${def.id}.${move.id}: follow-up ${f.move} exists`, !!next, f.move);
        check(
          `${def.id}.${move.id}: follow-up window sits inside the move`,
          f.from <= f.to && f.to < move.duration,
          `${f.from}-${f.to} of ${move.duration}`,
        );
      }
    }

    // And it has to actually chain when you press the button.
    for (const move of def.moves) {
      if (!move.followUps?.length) continue;
      if (move.tags?.includes("super") || move.internal) continue;
      for (const f of move.followUps) {
        const next = byId.get(f.move);
        if (!next) continue;
        const m = newMatch(def.id, "roman");
        const me = m.fighters[0];
        // Far apart, so nothing connects: a string must continue off a whiff.
        me.x = -300;
        m.fighters[1].x = 300;
        if (def.resource) me.resource = def.resource.max;

        const script = scriptFor(move);
        let started = -1;
        let chained = false;
        for (let i = 0; i < 160 && !chained; i++) {
          let step = script[i] ?? inp();
          if (started >= 0 && me.move?.id === move.id && me.moveFrame >= f.from && me.moveFrame <= f.to) {
            step = inp({ [f.button]: true });
          }
          m.step([step, inp()]);
          if (started < 0 && me.move?.id === move.id) started = i;
          // Only counts while the lead move could still be running - after
          // that a buffered press just starts the move on its own.
          if (started >= 0 && i - started <= move.duration && me.move?.id === next.id) chained = true;
        }
        check(
          `${def.id}: ${move.id} strings into ${f.move} on ${f.button}`,
          chained,
          started < 0 ? `${move.id} never came out` : me.move?.id ?? "nothing",
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Arcade ladder
// ---------------------------------------------------------------------------

{
  for (const def of ROSTER) {
    const run = buildLadder(def.id, "Veteran");
    check(`ladder ${def.id}: eight fights`, run.length === LADDER_LENGTH, String(run.length));

    // Every opponent has to be someone who exists, or the run dead-ends.
    const unknown = run.filter((s) => !ROSTER.some((f) => f.id === s.opponent));
    check(`ladder ${def.id}: every opponent is on the roster`, unknown.length === 0, unknown.map((s) => s.opponent).join(","));

    // The climb must not repeat, or the run reads as filler.
    const climb = run.filter((s) => s.stage === "climb").map((s) => s.opponent);
    check(`ladder ${def.id}: no repeats before the rival`, new Set(climb).size === climb.length, climb.join(","));
    check(`ladder ${def.id}: you are not your own warm-up`, !climb.includes(def.id), climb.join(","));

    // The authored fights are where the run gets its shape.
    const stages = run.map((s) => s.stage).join(",");
    check(`ladder ${def.id}: climb x5, rival, mirror, final`, stages === "climb,climb,climb,climb,climb,rival,mirror,final", stages);
    check(`ladder ${def.id}: the mirror is you`, run[6].opponent === def.id, run[6].opponent);
    check(`ladder ${def.id}: the final is not you`, run[7].opponent !== def.id, run[7].opponent);
    check(`ladder ${def.id}: the rival is not the final`, run[5].opponent !== run[7].opponent, run[5].opponent);

    // Difficulty only ever climbs.
    const order = ["Rookie", "Brawler", "Veteran", "Champion", "Legend"];
    const idx = run.map((s) => order.indexOf(s.level));
    check(`ladder ${def.id}: difficulty never drops`, idx.every((v, i) => i === 0 || v >= idx[i - 1]), idx.join(","));
    check(`ladder ${def.id}: it opens below where it ends`, idx[0] < idx[7], `${idx[0]} -> ${idx[7]}`);

    // The run is a pure function of the pick, so a saved step index can rebuild it.
    const again = buildLadder(def.id, "Veteran");
    check(
      `ladder ${def.id}: rebuilds identically`,
      JSON.stringify(run) === JSON.stringify(again),
      "",
    );

    check(`ladder ${def.id}: has an ending`, (ENDINGS[def.id] ?? "").length > 80, String((ENDINGS[def.id] ?? "").length));
  }

  // Two different picks should not walk the same ladder.
  {
    const runs = ROSTER.map((f) => buildLadder(f.id, "Veteran").map((s) => s.opponent).join(">"));
    check("ladder: different fighters get different runs", new Set(runs).size === runs.length, `${new Set(runs).size}/${runs.length}`);
  }

  // A full run, won end to end.
  {
    let run = startRun("roman", "Veteran");
    let fights = 0;
    while (run.phase !== "cleared" && fights < 40) {
      run = advanceRun({ ...run, phase: "fight" }, true);
      fights++;
    }
    check("run: eight wins clears the ladder", run.phase === "cleared" && fights === LADDER_LENGTH, `${run.phase} after ${fights}`);
    check("run: a cleared run used no continues", run.continues === 0, String(run.continues));
  }

  // A loss holds the rung, and continuing costs a continue rather than a place.
  {
    let run = startRun("pirate", "Veteran");
    run = advanceRun({ ...run, phase: "fight" }, true);
    const rung = run.at;
    run = advanceRun({ ...run, phase: "fight" }, false);
    check("run: a loss stops the run", run.phase === "lost", run.phase);
    check("run: a loss does not advance", run.at === rung, `${rung} -> ${run.at}`);
    run = continueRun(run);
    check("run: continuing returns to the same fight", run.phase === "versus" && run.at === rung, `${run.phase}@${run.at}`);
    check("run: continuing is counted", run.continues === 1, String(run.continues));
  }

  // The match-end phase lasts many frames, so a second report must not skip a
  // rung - this is the bug that would quietly let someone win seven fights.
  {
    let run = startRun("zulu", "Veteran");
    run = { ...run, phase: "fight" };
    const once = advanceRun(run, true);
    const twice = advanceRun(once, true);
    check("run: a repeated result is ignored", twice.at === once.at, `${once.at} -> ${twice.at}`);
    check("run: continuing a run that is not lost does nothing", continueRun(once).continues === 0);
  }

  // The player's difficulty is the middle of the run, and the ends clamp.
  {
    const low = buildLadder("roman", "Rookie");
    check("ladder: Rookie cannot ramp below the floor", low[0].level === "Rookie", low[0].level);
    const high = buildLadder("roman", "Legend");
    check("ladder: Legend cannot ramp past the ceiling", high[7].level === "Legend", high[7].level);
    check("ladder: shiftLevel clamps both ways", shiftLevel("Rookie", -3) === "Rookie" && shiftLevel("Legend", 3) === "Legend");
  }
}

// ---------------------------------------------------------------------------
// Saved settings
// ---------------------------------------------------------------------------
//
// The save layer's whole job is to never be the reason the game breaks, so
// what is tested is mostly how it behaves when storage misbehaves.

{
  // Node has no localStorage; a small stand-in lets the same code be driven.
  const store = new Map<string, string>();
  let throwOnAccess = false;
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => {
        if (throwOnAccess) throw new Error("blocked");
        return store.get(k) ?? null;
      },
      setItem: (k: string, v: string) => {
        if (throwOnAccess) throw new Error("blocked");
        store.set(k, v);
      },
      removeItem: (k: string) => void store.delete(k),
    },
  };

  const KEY = "stickfighter.save";

  // Nothing stored yet.
  clearSave();
  check("save: first run returns the defaults", loadSave().p1 === DEFAULT_SAVE.p1, loadSave().p1);

  // A round trip.
  patchSave({ aiLevel: "Legend", rounds: 3 });
  check("save: a patch round-trips", loadSave().aiLevel === "Legend" && loadSave().rounds === 3);

  // A patch must not drop the fields it did not mention.
  patchSave({ muted: true });
  check("save: a patch keeps what it did not touch", loadSave().aiLevel === "Legend", loadSave().aiLevel);

  // Garbage in the slot.
  store.set(KEY, "{ this is not json");
  check("save: unparseable storage falls back", loadSave().p1 === DEFAULT_SAVE.p1);
  store.set(KEY, "null");
  check("save: a null blob falls back", loadSave().rounds === DEFAULT_SAVE.rounds);

  // A blob naming things this build no longer has. Only the bad fields should
  // fall back - one renamed fighter must not wipe somebody's whole record.
  store.set(
    KEY,
    JSON.stringify({ v: 1, p1: "wizard", p2: "pirate", rounds: 99, aiLevel: "Godlike", stage: "moon", cleared: { pirate: "Legend", wizard: "Legend" } }),
  );
  const salvaged = loadSave();
  check("save: an unknown fighter falls back alone", salvaged.p1 === DEFAULT_SAVE.p1 && salvaged.p2 === "pirate", `${salvaged.p1}/${salvaged.p2}`);
  check("save: an out-of-range round count falls back", salvaged.rounds === DEFAULT_SAVE.rounds, String(salvaged.rounds));
  check("save: an unknown difficulty falls back", salvaged.aiLevel === DEFAULT_SAVE.aiLevel, salvaged.aiLevel);
  check("save: an unknown stage falls back", salvaged.stage === DEFAULT_SAVE.stage, String(salvaged.stage));
  check("save: unknown fighters are dropped from the record", !("wizard" in salvaged.cleared) && salvaged.cleared.pirate === "Legend", Object.keys(salvaged.cleared).join(","));

  // Clears keep the hardest difficulty, whatever order they arrive in.
  clearSave();
  recordClear("roman", "Champion");
  recordClear("roman", "Rookie");
  check("save: a clear cannot be demoted", loadSave().cleared.roman === "Champion", loadSave().cleared.roman);
  recordClear("roman", "Legend");
  check("save: a harder clear is promoted", loadSave().cleared.roman === "Legend", loadSave().cleared.roman);

  // Storage that throws on every access - private mode, blocked site data.
  throwOnAccess = true;
  let threw = false;
  try {
    patchSave({ rounds: 1 });
    loadSave();
  } catch {
    threw = true;
  }
  check("save: blocked storage never throws at the caller", !threw);
  check("save: blocked storage still returns usable defaults", loadSave().p1 === DEFAULT_SAVE.p1);
  throwOnAccess = false;

  clearSave();
  delete (globalThis as { window?: unknown }).window;
}

// ---------------------------------------------------------------------------
// AI personalities
// ---------------------------------------------------------------------------

{
  // Every fighter has a personality, and nobody has two.
  const ids = ROSTER.map((f) => f.id);
  const missing = ids.filter((id) => !(id in STYLES));
  const extra = Object.keys(STYLES).filter((id) => !ids.includes(id));
  check("AI styles: every fighter has one", missing.length === 0, missing.join(","));
  check("AI styles: no style for a fighter that does not exist", extra.length === 0, extra.join(","));

  // A style is a set of multipliers on the difficulty profile, so a botched
  // entry (a stray 0, a swapped field) is invisible in play until the exact
  // matchup and range come up. Cheap enough to just require sane bounds.
  for (const [id, s] of Object.entries(STYLES)) {
    const fields = [s.aggression, s.special, s.throw, s.poke, s.patience];
    const inRange = fields.every((v) => v > 0 && v <= 2);
    check(`AI styles: ${id} multipliers are in a sane range`, inRange, fields.join(","));
  }

  // The personalities are supposed to differ - a zoner and a berserker must
  // not have quietly landed on the same numbers.
  const dory = STYLES.spartan;
  const zoner = STYLES.roman;
  const berserker = STYLES.viking;
  check("AI styles: the berserker is more aggressive than the zoner", berserker.aggression > zoner.aggression);
  check("AI styles: the zoner holds range, the berserker does not", zoner.range === "far" && berserker.range === "close");
  check("AI styles: the grappler throws far more than a non-grappler", dory.throw > STYLES.roman.throw * 1.5);
  check("AI styles: the counter fighter is the most patient on the roster", STYLES.samurai.patience === Math.max(...Object.values(STYLES).map((s) => s.patience)));

  // The AI still has to actually play: a personality is only real if the
  // match keeps resolving with it switched on. Reuses the existing full
  // matchup sweep's pattern at a smaller scale so this stays fast.
  let finished = 0;
  const sample = ["roman", "viking", "samurai", "spartan", "soldier"];
  for (const a of sample) {
    for (const b of sample) {
      if (a === b) continue;
      const m = new Match([getFighter(a), getFighter(b)]);
      const ai1 = new AiController("Veteran");
      const ai2 = new AiController("Veteran");
      for (let i = 0; i < 40000; i++) {
        m.step([ai1.step(m, m.fighters[0], m.fighters[1]), ai2.step(m, m.fighters[1], m.fighters[0])]);
        if (m.phase === "matchEnd") break;
      }
      if (m.phase === "matchEnd") finished++;
    }
  }
  const total = sample.length * (sample.length - 1);
  check(`AI styles: styled matchups still resolve`, finished === total, `${finished}/${total}`);
}

// ---------------------------------------------------------------------------
// Key rebinding
// ---------------------------------------------------------------------------

{
  // The default map is just the first key already bound to each action, so
  // rebinding starts from what the controls list on the title screen says.
  const def = defaultKeyMap();
  for (const action of BINDABLE_ACTIONS) {
    check(`keybinds: default ${action} matches P1_KEYS`, def[action] === P1_KEYS[action][0], def[action]);
  }

  check("keybinds: isKeyCode accepts a real code", isKeyCode("KeyJ") && isKeyCode("ArrowLeft"));
  check("keybinds: isKeyCode rejects garbage", !isKeyCode("") && !isKeyCode(42) && !isKeyCode("Key J") && !isKeyCode(null));
  check("keybinds: codeLabel shortens the common ones", codeLabel("KeyJ") === "J" && codeLabel("ArrowLeft") === "←");
  check("keybinds: codeLabel falls back to the code itself for anything unknown", codeLabel("F13") === "F13");

  // toKeyBindings must route each action to the field the engine reads for
  // it - a shuffled mapping here would rebind the wrong button and nothing
  // would catch it short of trying every key by hand.
  const map = { ...defaultKeyMap(), A: "KeyZ", up: "Space" };
  const kb = toKeyBindings(map);
  check("keybinds: toKeyBindings routes A correctly", kb.A[0] === "KeyZ", kb.A[0]);
  check("keybinds: toKeyBindings routes up correctly", kb.up[0] === "Space", kb.up[0]);
  check("keybinds: toKeyBindings leaves an unrebound action alone", kb.B[0] === defaultKeyMap().B, kb.B[0]);

  // A custom binding has to actually change which physical key fires which
  // action - the wiring in GameCanvas is exactly the kind of thing that
  // typechecks and does nothing, so this drives it through a fake keyboard
  // rather than trusting the plumbing.
  const handlers: Record<string, ((e: { code: string; preventDefault(): void }) => void)[]> = {};
  const fakeWindow = {
    addEventListener: (type: string, fn: (e: { code: string; preventDefault(): void }) => void) => {
      (handlers[type] ??= []).push(fn);
    },
    removeEventListener: () => {},
  } as unknown as Window;

  const keyboard = new Keyboard();
  keyboard.attach(fakeWindow);
  const press = (code: string) => handlers.keydown?.forEach((h) => h({ code, preventDefault: () => {} }));
  const release = (code: string) => handlers.keyup?.forEach((h) => h({ code, preventDefault: () => {} }));

  const rebound = toKeyBindings({ ...defaultKeyMap(), A: "KeyZ" });
  check("keybinds: the old key no longer fires A once rebound", !keyboard.read(rebound, "p1").A);
  press("KeyZ");
  check("keybinds: the new key fires A", keyboard.read(rebound, "p1").A);
  release("KeyZ");
  check("keybinds: releasing the key stops it firing", !keyboard.read(rebound, "p1").A);

  // Rebinding one action must not disturb another.
  press("KeyJ");
  check("keybinds: an untouched action still reads its default key", keyboard.read(rebound, "p1").A === false);
}

// ---------------------------------------------------------------------------
// Volume and key-map persistence
// ---------------------------------------------------------------------------

{
  const store = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };

  clearSave();
  check("save: default volumes are audible but not full", loadSave().musicVolume > 0 && loadSave().musicVolume < 1);
  check("save: default key map matches the on-screen controls", loadSave().p1Keys.A === defaultKeyMap().A);

  patchSave({ musicVolume: 0.8, sfxVolume: 0.2, p1Keys: { ...defaultKeyMap(), C: "KeyP" } });
  check("save: volumes round-trip", loadSave().musicVolume === 0.8 && loadSave().sfxVolume === 0.2);
  check("save: a rebound key round-trips", loadSave().p1Keys.C === "KeyP", loadSave().p1Keys.C);
  check("save: rebinding one key leaves the rest alone", loadSave().p1Keys.A === defaultKeyMap().A);

  // Garbage in one slot of a saved key map should not cost the others.
  const raw = JSON.parse(store.get("stickfighter.save")!);
  raw.p1Keys = { ...raw.p1Keys, B: "" , A: 12 };
  store.set("stickfighter.save", JSON.stringify(raw));
  const salvaged = loadSave();
  check("save: a garbled action in the key map falls back alone", salvaged.p1Keys.A === defaultKeyMap().A && salvaged.p1Keys.B === defaultKeyMap().B);
  check("save: the untouched rebind in that same map survives", salvaged.p1Keys.C === "KeyP", salvaged.p1Keys.C);

  // Volumes outside 0..1 are exactly the kind of thing a hand-edited or
  // corrupted blob would carry.
  patchSave({ musicVolume: 4, sfxVolume: -1 } as never);
  check("save: an out-of-range volume falls back", loadSave().musicVolume === DEFAULT_SAVE.musicVolume && loadSave().sfxVolume === DEFAULT_SAVE.sfxVolume);

  // Accessibility settings round-trip and fall back the same way.
  check("save: motion defaults to full", loadSave().motion === "full");
  check("save: high contrast defaults off", loadSave().highContrast === false);
  patchSave({ motion: "reduced", highContrast: true });
  check("save: motion round-trips", loadSave().motion === "reduced", loadSave().motion);
  check("save: high contrast round-trips", loadSave().highContrast === true);
  patchSave({ motion: "wandering" as never });
  check("save: a garbled motion value falls back", loadSave().motion === DEFAULT_SAVE.motion, loadSave().motion);

  // Weapon choices are stored per fighter and rebuilt entry by entry, so one
  // variant this build no longer ships costs that fighter their weapon rather
  // than clearing everybody's.
  check("save: no weapon choices by default", Object.keys(loadSave().weapons).length === 0);
  patchSave({ weapons: { roman: "hasta", viking: "daneaxe" } });
  check("save: a weapon choice round-trips", loadSave().weapons.roman === "hasta", loadSave().weapons.roman);
  patchSave({ weapons: { roman: "hasta", viking: "not-a-real-axe", nobody: "hasta" } });
  const salvagedWeapons = loadSave().weapons;
  check("save: a dropped variant is forgotten alone", salvagedWeapons.roman === "hasta" && !("viking" in salvagedWeapons), JSON.stringify(salvagedWeapons));
  check("save: a weapon for a fighter that does not exist is dropped", !("nobody" in salvagedWeapons));
  // A variant belonging to a different fighter is not a valid choice either.
  patchSave({ weapons: { roman: "tachi" } });
  check("save: another fighter's variant is rejected", !("roman" in loadSave().weapons), JSON.stringify(loadSave().weapons));

  clearSave();
  delete (globalThis as { window?: unknown }).window;
}

// ---------------------------------------------------------------------------
// Tutorial
// ---------------------------------------------------------------------------

{
  // Ten lessons, each reachable, and the whole thing completable start to
  // finish with inputs a real player would actually send. A broken tutorial
  // that quietly never advances past lesson four is worse than no tutorial,
  // so this drives every step reactively off the fighters' own state rather
  // than a fixed script, the same way a person reacting to what is on
  // screen would.
  const runner = new TutorialRunner();
  const m = new Match([getFighter("roman"), getFighter("roman")]);
  for (let i = 0; i < 80; i++) m.step([inp(), inp()]);
  m.fighters[0].x = -60;
  m.fighters[1].x = 40;
  runner.start(m);

  const seen: string[] = [];
  const dir = () => (m.fighters[1].x >= m.fighters[0].x ? { fwd: "right", back: "left" } : { fwd: "left", back: "right" });

  let frame = 0;
  for (; frame < 20000 && !runner.complete; frame++) {
    if (seen[seen.length - 1] !== runner.step.kind) seen.push(runner.step.kind);
    const { fwd, back } = dir();
    const dist = Math.abs(m.fighters[1].x - m.fighters[0].x);
    let p1 = inp();

    switch (runner.step.kind) {
      case "move":
        p1 = inp({ [back]: true } as Partial<RawInput>);
        break;
      case "jump":
        p1 = inp({ up: frame % 20 < 4 });
        break;
      case "crouch":
        p1 = inp({ down: true });
        break;
      case "attack":
        p1 = dist > 90 ? inp({ [fwd]: true } as Partial<RawInput>) : inp({ A: true });
        break;
      case "special": {
        const script = qcf("B");
        p1 = script[frame % script.length];
        break;
      }
      case "blockHigh":
      case "blockLow":
        p1 = inp({ S: true, down: runner.step.kind === "blockLow" });
        break;
      case "dodge":
        p1 = inp({ [fwd]: true, S: frame % 30 < 3 } as Partial<RawInput>);
        break;
      case "throw":
        // A real player taps A+B for a throw rather than holding it down
        // forever, and the input buffer wants the same fresh press.
        p1 =
          dist > 46
            ? inp({ [fwd]: true } as Partial<RawInput>)
            : inp({ A: frame % 10 < 3, B: frame % 10 < 3 });
        break;
      case "combo": {
        if (dist > 90) {
          p1 = inp({ [fwd]: true } as Partial<RawInput>);
          break;
        }
        const hits = m.fighters[1].comboHits;
        p1 = hits < 1 ? inp({ A: true }) : inp({ B: true });
        break;
      }
    }

    m.step([p1, inp()]);
    runner.apply(m);
  }

  check("tutorial: every lesson is reachable", seen.length === TUTORIAL_STEPS.length, seen.join(","));
  check("tutorial: the whole thing can be completed", runner.complete, `stuck on ${runner.step?.kind} at frame ${frame}`);
}

// ---------------------------------------------------------------------------
// KO recap - what actually finished the match
// ---------------------------------------------------------------------------

{
  // A direct strike names itself correctly.
  {
    const m = newMatch("roman", "roman");
    m.fighters[1].health = 1;
    m.fighters[0].x = -30;
    m.fighters[1].x = 20;
    run(m, 30, (f) => inp({ A: f === 2 }));
    check("KO recap: names the finishing move", m.lastResult?.finishingMove === "Shield Jab", m.lastResult?.finishingMove);
    check("KO recap: the reason is actually a KO", m.lastResult?.reason === "ko", m.lastResult?.reason);
    check("KO recap: carries the damage it actually did", (m.lastResult?.finishingDamage ?? 0) > 0, String(m.lastResult?.finishingDamage));
  }

  // A projectile has to say so too - by the time it lands, the attacker who
  // threw it is very likely doing something else entirely, so this is the
  // one case `attacker.move` alone would have named the wrong thing.
  {
    const m = newMatch("soldier", "roman");
    m.fighters[1].health = 1;
    m.fighters[0].x = -200;
    m.fighters[1].x = 20;
    // Soldier's 5C: Aimed Shot, a rifle round fired as a projectile.
    run(m, 60, (f) => inp({ C: f === 2 }));
    run(m, 60, () => inp());
    check("KO recap: a projectile names its own source move", m.lastResult?.finishingMove === "Aimed Shot", m.lastResult?.finishingMove);
  }

  // A timeout is not a KO - nothing "finished" the match, so nothing should
  // claim to have.
  {
    const m = newMatch("roman", "roman");
    m.fighters[0].x = -200;
    m.fighters[1].x = 200;
    m.fighters[1].health = 50; // strictly less than fighter 0's, so this is a clean "time" win, not a double.
    m.timer = 1;
    run(m, 3, () => inp());
    check("KO recap: a timeout names nothing", m.lastResult?.reason === "time" && m.lastResult?.finishingMove === undefined, JSON.stringify(m.lastResult));
  }
}

{
  // The arcade run carries the recap onto the continue prompt, and only
  // while there is actually a loss to show one for.
  const withRecap = { move: "Overhead Chop", damage: 92 };
  let run1: Run = { ...startRun("roman", "Veteran"), phase: "fight" };
  run1 = advanceRun(run1, false, withRecap);
  check("run: a loss carries the recap", run1.lastRecap?.move === "Overhead Chop", JSON.stringify(run1.lastRecap));

  let run2: Run = { ...startRun("roman", "Veteran"), phase: "fight" };
  run2 = advanceRun(run2, true, withRecap);
  check("run: a win does not carry a recap forward", run2.lastRecap === null, JSON.stringify(run2.lastRecap));

  check("run: a fresh run starts with no recap", startRun("roman", "Veteran").lastRecap === null);
}

// ---------------------------------------------------------------------------

const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length} passed, ${failed.length} failed`);
for (const f of failed) console.log(`FAIL  ${f.name}${f.detail ? " :: " + f.detail : ""}`);
if (failed.length > 0) process.exit(1);

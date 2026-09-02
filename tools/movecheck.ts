/**
 * Structural check on the move data itself.
 *
 * The self-tests run the simulation; this reads the tables. It looks for the
 * authoring mistakes that produce no error and no crash - a hitbox that lives
 * past the end of its own move, a cancel window that shuts before the move is
 * cancellable, a resource cost nobody can pay, a notation that documents a
 * different input than the one the move actually takes, and two moves sharing
 * a whole input at the same priority so that whichever is declared second can
 * never come out.
 *
 * That last one was real: every fighter's dash attack shared its input with
 * their 6C and lost the tie on declaration order, so twenty-two authored
 * moves sat in the move list unreachable.
 *
 *   npx tsx tools/movecheck.ts
 */
import { ROSTER } from "../src/game/stickfight/fighters";
import type { MoveDef } from "../src/game/stickfight/types";

const out: string[] = [];
const say = (s: string) => out.push(s);

const MOTION_GLYPH: Record<string, RegExp> = {
  qcf: /↓↘→/, qcb: /↓↙←/, dp: /→↓↘/, rdp: /←↓↙/,
  hcf: /←↙↓↘→/, hcb: /→↘↓↙←/, dd: /↓\s*↓/, ff: /→\s*→/, bb: /←\s*←/,
};

for (const def of ROSTER) {
  const tag = (m: MoveDef, s: string) => say(`  ${def.id}.${m.id}: ${s}`);
  const seen = new Map<string, number>();
  for (const m of def.moves) seen.set(m.id, (seen.get(m.id) ?? 0) + 1);
  for (const [id, n] of seen) if (n > 1) say(`  ${def.id}: duplicate move id "${id}" x${n}`);

  for (const m of def.moves) {
    const dur = m.duration ?? 0;

    // Keyframes / hits / projectiles past the end of the move.
    for (const k of m.frames ?? []) if (k.t > dur) tag(m, `keyframe t=${k.t} past duration ${dur}`);
    for (const h of m.hits ?? []) {
      if (h.to > dur) tag(m, `hitbox active to ${h.to} past duration ${dur}`);
      if (h.from > h.to) tag(m, `hitbox from ${h.from} > to ${h.to}`);
      if (h.from < 1) tag(m, `hitbox active on frame ${h.from} (frame 1 is the earliest)`);
    }
    for (const pr of m.projectiles ?? []) {
      if (pr.at > dur) tag(m, `projectile spawns at ${pr.at} past duration ${dur}`);
      if (pr.at < 1) tag(m, `projectile spawns at ${pr.at}`);
    }
    for (const w of m.invuln ?? []) if (w.to > dur) tag(m, `invuln to ${w.to} past duration ${dur}`);
    for (const w of m.armor ?? []) if (w.to > dur) tag(m, `armor to ${w.to} past duration ${dur}`);
    if (m.parryWindow && m.parryWindow[1] > dur) tag(m, `parryWindow to ${m.parryWindow[1]} past duration ${dur}`);

    // A cancel window that never overlaps an active hitbox can never be used:
    // a move is only cancellable once it has connected.
    if (m.cancelWindow && (m.hits?.length ?? 0) > 0) {
      const [cf, ct] = m.cancelWindow;
      const earliest = Math.min(...(m.hits ?? []).map((h) => h.from));
      if (ct < earliest) tag(m, `cancelWindow [${cf},${ct}] closes before the first hitbox at ${earliest}`);
      if (ct > dur) tag(m, `cancelWindow ends at ${ct} past duration ${dur}`);
    }
    if (m.cancelWindow && (m.hits?.length ?? 0) === 0 && !m.projectiles?.length) {
      tag(m, `has a cancelWindow but no hitboxes to cancel out of`);
    }

    // Follow-up windows outside the move.
    for (const f of m.followUps ?? []) {
      if (f.to > dur) tag(m, `followUp ${f.move} window to ${f.to} past duration ${dur}`);
      if (f.from > f.to) tag(m, `followUp ${f.move} from ${f.from} > to ${f.to}`);
    }

    // Resource costs the fighter can never pay.
    const max = def.resource?.max ?? 0;
    if (m.resourceCost && m.resourceCost > max) tag(m, `costs ${m.resourceCost} resource, max is ${max}`);
    if (m.resourceMin !== undefined && m.resourceMin > max) tag(m, `needs ${m.resourceMin} resource, max is ${max}`);
    if (m.resourceCost && !def.resource) tag(m, `costs resource but the fighter has none`);
    // A cost with no minimum can fire on an empty bar and silently do nothing.

    // Notation that disagrees with the input it documents.
    if (m.notation && m.input.motion) {
      const re = MOTION_GLYPH[m.input.motion];
      if (re && !re.test(m.notation)) tag(m, `notation "${m.notation}" does not show motion ${m.input.motion}`);
    }
    if (m.notation && m.input.button && !m.input.buttons) {
      const b = m.input.button;
      if (b !== "S" && !new RegExp(`\\b${b}\\b`).test(m.notation)) tag(m, `notation "${m.notation}" does not name button ${b}`);
    }

    // Meter cost without the ex tag (or vice versa) - the move list groups on it.
    const isEx = m.tags?.includes("ex" as never);
    if (m.meterCost && !isEx && !m.tags?.includes("super" as never)) tag(m, `costs ${m.meterCost} meter but is tagged neither ex nor super`);
    if (isEx && !m.meterCost) tag(m, `tagged ex but costs no meter`);
  }

  // Two moves answering the same input at the same priority: one is dead.
  const key = (m: MoveDef) =>
    `${m.input.motion ?? "-"}|${m.input.whileDashing ? "dash" : "-"}|${m.input.dir ?? "-"}|${m.input.button ?? (m.input.buttons ?? []).join("+")}|${
      Array.isArray(m.input.stance) ? [...m.input.stance].sort().join(",") : m.input.stance ?? "-"
    }`;
  const byKey = new Map<string, MoveDef[]>();
  for (const m of def.moves) {
    if (m.internal || m.variant) continue;
    const k = key(m);
    byKey.set(k, [...(byKey.get(k) ?? []), m]);
  }
  for (const [k, ms] of byKey) {
    if (ms.length < 2) continue;
    const prios = ms.map((m) => m.priority ?? 0);
    if (new Set(prios).size < ms.length) {
      say(`  ${def.id}: ${ms.map((m) => `${m.id}(p${m.priority ?? 0})`).join(" and ")} share input [${k}]`);
    }
  }
}

console.log(out.length ? out.join("\n") : "  nothing flagged");
console.log(`\n${out.length} findings across ${ROSTER.length} fighters`);

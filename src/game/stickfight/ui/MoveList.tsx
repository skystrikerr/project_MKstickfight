/** Move list / command list, generated straight from the fighter's move data. */

import { useMemo, useState } from "react";
import { getFighter, ROSTER } from "../fighters";
import type { FighterDef, MoveDef } from "../types";
import { INPUT_SCHEMES, renderNotation, schemeLegend, type InputScheme } from "../inputscheme";
import { loadSave, patchSave } from "../save";
import { stringsFor } from "../strings";

const has = (m: MoveDef, tag: string) => !!m.tags?.includes(tag as never);

const GROUPS: { key: string; label: string; match: (m: MoveDef) => boolean }[] = [
  {
    key: "normals",
    label: "Normals",
    match: (m) =>
      ["light", "medium", "heavy"].some((t) => has(m, t)) && !has(m, "air") && !has(m, "command"),
  },
  { key: "command", label: "Command normals", match: (m) => has(m, "command") },
  { key: "air", label: "Air attacks", match: (m) => has(m, "air") && !has(m, "special") },
  {
    key: "specials",
    label: "Specials",
    match: (m) => has(m, "special") && !has(m, "ex") && !has(m, "super") && !m.variant,
  },
  { key: "skill", label: "Character skill", match: (m) => has(m, "skill") },
  { key: "defence", label: "Block, parry & dodge", match: (m) => has(m, "block") || has(m, "dodge") },
  { key: "throws", label: "Throws", match: (m) => has(m, "throw") },
  { key: "ex", label: "EX specials (50 meter)", match: (m) => has(m, "ex") },
  { key: "super", label: "Super (100 meter)", match: (m) => has(m, "super") },
];

function frameData(m: MoveDef): string | null {
  const first = m.hits?.[0];
  if (!first) return null;
  const startup = first.from;
  const active = first.to - first.from + 1;
  const recovery = Math.max(0, m.duration - first.to);
  return `${startup} / ${active} / ${recovery}`;
}

/** Input label for one step of a string: 5A -> "A", 6A -> "→ + A". */
function stamp(m: MoveDef, scheme: InputScheme): string {
  // A crouching normal is reached by holding down, but says so through its
  // stance rather than through `dir` - so reading only `dir` printed the
  // opener of every low string as a plain button and told the player to press
  // something that would give them the standing move instead.
  const stance = m.input.stance;
  const crouching =
    m.input.dir === "d" ||
    stance === "crouch" ||
    (Array.isArray(stance) && stance.length === 1 && stance[0] === "crouch");
  const arrow =
    m.input.dir === "f" ? "→" : m.input.dir === "b" ? "←" : crouching ? "↓" : m.input.dir === "df" ? "↘" : "";
  const btn = m.input.button ?? "";
  const label = arrow ? `${arrow} + ${btn}` : btn;
  return renderNotation(label, scheme);
}

/**
 * The strings a fighter has, as the player would perform them.
 *
 * Taken from the declared strings rather than rebuilt by walking follow-up
 * links, because the links are derived from those declarations in the first
 * place and reconstructing them only adds a way to disagree.
 *
 * The buttons matter more than they look. A string step is reached by pressing
 * the *target move's* button, not by performing that move's own input - the
 * second hit of a chain that ends at `6A` is reached with A, not with forward
 * and A. Printing each move's own notation, which is what this used to do, told
 * a player to hold a direction they do not need; harmless at two hits and
 * actively wrong at five.
 */
function chainsFor(def: FighterDef): { name: string; moves: MoveDef[]; buttons: string[] }[] {
  const byId = new Map(def.moves.map((m) => [m.id, m]));
  const out: { name: string; moves: MoveDef[]; buttons: string[] }[] = [];
  for (const s of stringsFor(def.id)) {
    const moves = s.steps.map((id) => byId.get(id)).filter((m): m is MoveDef => !!m);
    if (moves.length < 2) continue;
    out.push({ name: s.name, moves, buttons: moves.map((m) => m.input.button ?? "") });
  }
  return out;
}

export function MoveList({ fighterId, onClose }: { fighterId: string; onClose: () => void }) {
  const [id, setId] = useState(fighterId);
  // Remembered rather than per-open: somebody playing on a pad is playing on a
  // pad, and being asked again every time they check a command is a papercut.
  const [scheme, setScheme] = useState<InputScheme>(() => loadSave().inputScheme);
  const pick = (next: InputScheme) => {
    setScheme(next);
    patchSave({ inputScheme: next });
  };
  const def = getFighter(id);

  const grouped = useMemo(() => {
    // `block` is an internal placeholder move but belongs in the list.
    const visible = def.moves.filter((m) => !m.internal || m.id === "block");
    return GROUPS.map((g) => ({
      ...g,
      moves: visible.filter((m) => g.match(m) && !m.variant),
      variants: visible.filter((m) => !!m.variant),
    })).filter((g) => g.moves.length > 0);
  }, [def]);

  const strings = useMemo(() => chainsFor(def), [def]);

  const specialCount = def.moves.filter(
    (m) => m.tags?.includes("special") && !m.tags?.includes("ex") && !m.variant && !m.internal,
  ).length;

  return (
    <div className="grain absolute inset-0 z-30 flex flex-col bg-[var(--ink)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rule)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {ROSTER.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setId(f.id)}
              className={`px-3 py-1.5 font-display text-lg font-bold uppercase leading-none tracking-[0.02em] transition ${
                f.id === id
                  ? "bg-[var(--accent)] text-[var(--ink)]"
                  : "border border-[var(--rule)] text-[var(--bone-dim)] hover:border-[var(--bone-dim)] hover:text-[var(--bone)]"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cut-sm border border-[var(--rule)] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone)] hover:border-[var(--accent)]"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="cut-sm border border-[var(--rule)] bg-[var(--ink-2)] p-3 text-xs text-[var(--bone-dim)]">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bone)]">Buttons</span>
              {INPUT_SCHEMES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s.id)}
                  aria-pressed={scheme === s.id}
                  className={`cut-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
                    scheme === s.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--bone)]"
                      : "border-[var(--rule)] text-[var(--bone-dim)] hover:border-[var(--bone-dim)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bone)]">Notation</span> — → is towards the
            opponent, ↓↘→ is a quarter circle forward. {renderNotation("A", scheme)} = Light,{" "}
            {renderNotation("B", scheme)} = Medium, {renderNotation("C", scheme)} = Heavy,{" "}
            {renderNotation("S", scheme)} = Guard (hold to block). Frame data is shown as startup / active / recovery.
            {schemeLegend(scheme) && (
              <span className="mt-1.5 block text-[var(--bone-dim)]">{schemeLegend(scheme)}</span>
            )}
          </div>
          <div className="cut-sm flex flex-wrap items-center gap-2 border border-[var(--rule)] bg-[var(--ink-2)] p-3 font-mono text-[10px] uppercase tracking-[0.12em]">
            {[
              { label: `${specialCount} specials`, ok: specialCount === 5 },
              { label: "Light", ok: true },
              { label: "Heavy", ok: true },
              { label: "Block", ok: true },
              { label: "Dodge", ok: true },
              { label: "Jump", ok: true },
            ].map((chip) => (
              <span
                key={chip.label}
                className={`px-2 py-1 ${chip.ok ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[#a8341f]/20 text-[#e2755c]"}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        {strings.length > 0 && (
          <section className="mb-4">
            <h3 className="mb-2 border-b border-[var(--rule)] pb-1 font-display text-xl font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Strings</h3>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {strings.map((st) => (
                <div key={st.name} className="cut-sm border border-[var(--rule)] bg-[var(--ink-2)] p-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)]">
                      {st.name}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--accent)]">
                      {[stamp(st.moves[0], scheme), ...st.buttons.slice(1).map((btn) => renderNotation(btn, scheme))].join(
                        ", ",
                      )}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-[var(--bone-dim)]">
                    {st.moves.map((m) => m.name).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs leading-snug text-[var(--bone-dim)]">
              Press the next button while the previous one is still swinging. A string continues whether it hit or
              was blocked, so committing to the whole thing is the risk.
            </p>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map((g) => (
            <section key={g.key}>
              <h3 className="mb-2 border-b border-[var(--rule)] pb-1 font-display text-xl font-bold uppercase tracking-[0.12em] text-[var(--accent)]">{g.label}</h3>
              <div className="space-y-1.5">
                {g.moves.flatMap((parent) => [parent, ...g.variants.filter((v) => v.variant === parent.id)]).map((m) => (
                  <div
                    key={m.id}
                    className={`cut-sm border border-[var(--rule)] bg-[var(--ink-2)] p-2.5 ${m.variant ? "ml-4 border-l-2 border-l-[var(--accent)]/50" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)]">
                        {m.name}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-[var(--accent)]">
                        {m.notation ? renderNotation(m.notation, scheme) : ""}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-[var(--bone-dim)]">{m.desc}</p>
                    <div className="mt-1 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#7e8f85]">
                      {frameData(m) && <span>Frames {frameData(m)}</span>}
                      {m.hits?.[0] && <span>{m.hits.reduce((sum, h) => sum + h.damage, 0)} dmg</span>}
                      {m.meterCost ? <span className="text-[var(--p2)]">{m.meterCost} meter</span> : null}
                      {m.resourceCost ? (
                        <span style={{ color: def.resource?.color }}>
                          {m.resourceCost} {def.resource?.name.toLowerCase()}
                        </span>
                      ) : null}
                      {m.tags?.includes("overhead") && <span className="text-[#e2755c]">Overhead</span>}
                      {m.tags?.includes("low") && <span className="text-[#8aa87a]">Low</span>}
                      {m.invuln?.length ? <span className="text-[#a795c4]">Invincible</span> : null}
                      {m.armor?.length ? <span className="text-[#d19a5c]">Armour</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

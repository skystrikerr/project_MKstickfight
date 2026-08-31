/** Move list / command list, generated straight from the fighter's move data. */

import { useMemo, useState } from "react";
import { getFighter, ROSTER } from "../fighters";
import type { FighterDef, MoveDef } from "../types";

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
function stamp(m: MoveDef): string {
  const arrow =
    m.input.dir === "f" ? "→" : m.input.dir === "b" ? "←" : m.input.dir === "d" ? "↓" : m.input.dir === "df" ? "↘" : "";
  const btn = m.input.button ?? "";
  return arrow ? `${arrow} + ${btn}` : btn;
}

/**
 * Rebuilds each named string from the follow-up links scattered across the
 * moves. A link knows only what continues it, so the chain is reassembled by
 * finding the move nothing else leads into and walking forward from there.
 */
function stringsFor(def: FighterDef): { name: string; moves: MoveDef[] }[] {
  const byId = new Map(def.moves.map((m) => [m.id, m]));
  const groups = new Map<string, { from: string; to: string }[]>();
  for (const m of def.moves) {
    for (const f of m.followUps ?? []) {
      if (!f.string) continue;
      groups.set(f.string, [...(groups.get(f.string) ?? []), { from: m.id, to: f.move }]);
    }
  }
  const out: { name: string; moves: MoveDef[] }[] = [];
  for (const [name, links] of groups) {
    const targets = new Set(links.map((l) => l.to));
    const head = links.find((l) => !targets.has(l.from));
    if (!head) continue;
    const seq = [head.from];
    for (let i = 0; i < links.length; i++) {
      const next = links.find((l) => l.from === seq[seq.length - 1]);
      if (!next || seq.includes(next.to)) break;
      seq.push(next.to);
    }
    const moves = seq.map((id) => byId.get(id)).filter((m): m is MoveDef => !!m);
    if (moves.length > 1) out.push({ name, moves });
  }
  return out;
}

export function MoveList({ fighterId, onClose }: { fighterId: string; onClose: () => void }) {
  const [id, setId] = useState(fighterId);
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

  const strings = useMemo(() => stringsFor(def), [def]);

  const specialCount = def.moves.filter(
    (m) => m.tags?.includes("special") && !m.tags?.includes("ex") && !m.variant && !m.internal,
  ).length;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black/90 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {ROSTER.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setId(f.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                f.id === id ? "bg-amber-400 text-black" : "border border-white/15 text-white/70 hover:bg-white/10"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
            <span className="font-bold uppercase tracking-wider text-white/80">Notation</span> — → is towards the
            opponent, ↓↘→ is a quarter circle forward. A = Light, B = Medium, C = Heavy, S = Guard (hold to block). Frame data is
            shown as startup / active / recovery.
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[10px] font-bold uppercase tracking-wider">
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
                className={`rounded px-2 py-1 ${chip.ok ? "bg-amber-400/15 text-amber-300" : "bg-rose-500/15 text-rose-300"}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        {strings.length > 0 && (
          <section className="mb-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-300">Strings</h3>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {strings.map((st) => (
                <div key={st.name} className="rounded-md border border-white/10 bg-white/[0.02] p-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-white">{st.name}</span>
                    <span className="font-mono text-xs text-amber-300">
                      {st.moves.map(stamp).join(", ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/55">
                    {st.moves.map((m) => m.name).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-white/40">
              Press the next button while the previous one is still swinging. A string continues whether it hit or
              was blocked, so committing to the whole thing is the risk.
            </p>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map((g) => (
            <section key={g.key}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-300">{g.label}</h3>
              <div className="space-y-1.5">
                {g.moves.flatMap((parent) => [parent, ...g.variants.filter((v) => v.variant === parent.id)]).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-md border border-white/10 bg-white/[0.02] p-2.5 ${m.variant ? "ml-4 border-l-2 border-l-amber-400/40" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-white">{m.name}</span>
                      <span className="font-mono text-xs text-amber-300">{m.notation ?? ""}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-white/55">{m.desc}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-white/35">
                      {frameData(m) && <span>Frames {frameData(m)}</span>}
                      {m.hits?.[0] && <span>{m.hits.reduce((sum, h) => sum + h.damage, 0)} dmg</span>}
                      {m.meterCost ? <span className="text-sky-300">{m.meterCost} meter</span> : null}
                      {m.resourceCost ? (
                        <span style={{ color: def.resource?.color }}>
                          {m.resourceCost} {def.resource?.name.toLowerCase()}
                        </span>
                      ) : null}
                      {m.tags?.includes("overhead") && <span className="text-rose-300">Overhead</span>}
                      {m.tags?.includes("low") && <span className="text-emerald-300">Low</span>}
                      {m.invuln?.length ? <span className="text-purple-300">Invincible</span> : null}
                      {m.armor?.length ? <span className="text-orange-300">Armour</span> : null}
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

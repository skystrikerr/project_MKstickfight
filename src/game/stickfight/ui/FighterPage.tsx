/**
 * One fighter's page: who they were, what they belonged to, and what the
 * record actually says.
 *
 * The art and the flag are optional and the page is built to be worth opening
 * without either. With no art it draws the in-game rig large, which is a real
 * picture of the fighter rather than a grey box; with no flag the era line
 * stands on its own. That is not a placeholder strategy, it is the only way a
 * roster this size can grow - the files arrive one at a time and every page in
 * between still has to hold together.
 */

import { useMemo, useState } from "react";
import { factionsFor } from "../factions";
import { ROSTER, getFighter } from "../fighters";
import { FactionEmblem } from "./FactionEmblem";
import { FighterPortrait } from "./Portrait";

export function FighterPage({
  id,
  onClose,
  onShowMoves,
}: {
  id: string;
  onClose: () => void;
  onShowMoves: (id: string) => void;
}) {
  const [current, setCurrent] = useState(id);
  const def = useMemo(() => getFighter(current), [current]);
  const factions = useMemo(() => factionsFor(current), [current]);

  return (
    <div className="grain absolute inset-0 z-30 flex flex-col bg-[var(--ink)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rule)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {ROSTER.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCurrent(f.id)}
              className={`cut-sm border px-2.5 py-1 font-display text-sm font-bold uppercase tracking-[0.08em] transition ${
                f.id === current
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--bone)]"
                  : "border-[var(--rule)] text-[var(--bone-dim)] hover:border-[var(--bone-dim)]"
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
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[340px_1fr]">
          {/* Art, or the rig at size when there is none. */}
          <div>
            <div
              className="relative flex aspect-[3/4] items-center justify-center overflow-hidden border"
              style={{ borderColor: "var(--rule)", background: "var(--ink-2)" }}
            >
              {def.art ? (
                <img src={def.art} alt={def.name} className="h-full w-full object-cover" />
              ) : (
                <FighterPortrait def={def} className="h-full w-full" />
              )}
              <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: def.palette.accent }} />
            </div>

            <div className="mt-3 flex items-start gap-3">
              {def.flag ? (
                <img
                  src={def.flag}
                  alt=""
                  className="h-9 w-14 shrink-0 border object-cover"
                  style={{ borderColor: "var(--rule)" }}
                />
              ) : null}
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">From</div>
                <div className="text-sm text-[var(--bone)]">{def.era}</div>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-5xl font-bold uppercase leading-[0.86] tracking-[0.02em] text-[var(--bone)]">
              {def.name}
            </h2>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">
              {def.title}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {factions.map((f) => (
                <span
                  key={f.id}
                  className="cut-sm flex items-center gap-2 border bg-[var(--ink-2)] px-2.5 py-1.5"
                  style={{ borderColor: "var(--rule)" }}
                >
                  <FactionEmblem faction={f} size={18} />
                  <span>
                    <span className="block font-display text-sm font-bold uppercase tracking-[0.08em]" style={{ color: f.color }}>
                      {f.name}
                    </span>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">
                      {f.kind}
                    </span>
                  </span>
                </span>
              ))}
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--bone-dim)]">{def.bio}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Panel title="Strengths" rows={def.strengths} accent="#8aa87a" />
              <Panel title="Weaknesses" rows={def.weaknesses} accent="#c2705c" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              <Stat label="Archetype" value={def.archetype} />
              <Stat label="Difficulty" value={"★".repeat(def.difficulty) + "☆".repeat(5 - def.difficulty)} />
              <Stat label="Health" value={String(def.stats.health)} />
              <Stat label="Resource" value={def.resource?.name ?? "—"} />
            </div>

            <blockquote
              className="mt-5 border-l-2 pl-3 text-sm italic leading-relaxed text-[var(--bone)]"
              style={{ borderColor: def.palette.accent }}
            >
              “{def.winQuote}”
            </blockquote>

            <button
              type="button"
              onClick={() => onShowMoves(current)}
              className="cut-sm mt-5 border border-[var(--rule)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone)] hover:border-[var(--accent)]"
            >
              Move list
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, rows, accent }: { title: string; rows: string[]; accent: string }) {
  return (
    <section className="border bg-[var(--ink-2)] p-3" style={{ borderColor: "var(--rule)" }}>
      <div className="mb-1.5 font-display text-lg font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>
        {title}
      </div>
      <ul className="space-y-1 text-xs text-[var(--bone-dim)]">
        {rows.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border bg-[var(--ink-2)] p-2" style={{ borderColor: "var(--rule)" }}>
      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">{label}</div>
      <div className="mt-0.5 truncate text-[var(--bone)]">{value}</div>
    </div>
  );
}

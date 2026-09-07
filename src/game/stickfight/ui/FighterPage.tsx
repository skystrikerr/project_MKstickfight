/**
 * One fighter's profile: who they were, what they carried, what the numbers
 * say, and what you press.
 *
 * Four panels, and each one is here because it answers a different question a
 * player actually has. The art and the history answer "who is this"; the
 * signature weapons answer "what am I holding", which on this roster is most
 * of the character; the bars answer "how does this one compare to the other
 * twenty-five"; the command list answers "what do I do with it". A profile
 * screen that only does the first of those is a poster.
 *
 * The art and the flag are optional and the page is built to be worth opening
 * without either. With no art it draws the in-game rig large, which is a real
 * picture of the fighter rather than a grey box; with no flag the era line
 * stands on its own. That is not a placeholder strategy, it is the only way a
 * roster this size can grow - the files arrive one at a time and every page in
 * between still has to hold together.
 */

import { useEffect, useMemo, useState } from "react";
import { dossierFor } from "../dossier";
import { factionsFor } from "../factions";
import { ROSTER, getFighter } from "../fighters";
import { INPUT_SCHEMES, renderNotation, type InputScheme } from "../inputscheme";
import { statsFor } from "../profile";
import { loadSave, patchSave } from "../save";
import type { FighterDef, MoveDef } from "../types";
import { FactionEmblem } from "./FactionEmblem";
import { FighterPortrait } from "./Portrait";

const has = (m: MoveDef, tag: string) => !!m.tags?.includes(tag as never);

/**
 * The command list, cut the way the profile needs it rather than the way the
 * full move list does.
 *
 * The move list screen is a reference document and groups by nine categories
 * because someone reading it wants to find one move. This is a summary, and a
 * summary that reproduces nine headings is not one - so it is three: the
 * things that make the character, the thing that ends the round, and
 * everything else. The full list is one button away.
 */
const SECTIONS: { label: string; accent: string; match: (m: MoveDef) => boolean }[] = [
  {
    label: "Special attacks",
    accent: "var(--accent)",
    match: (m) => has(m, "special") && !has(m, "super") && !has(m, "ex") && !m.variant,
  },
  { label: "EX specials", accent: "var(--p2)", match: (m) => has(m, "ex") },
  { label: "Super", accent: "#e0b25c", match: (m) => has(m, "super") },
  { label: "Character skill", accent: "#8aa87a", match: (m) => has(m, "skill") },
  {
    label: "Basic moves",
    accent: "var(--bone-dim)",
    match: (m) =>
      !has(m, "special") && !has(m, "super") && !has(m, "ex") && !has(m, "skill") && !m.variant,
  },
];

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
  const [scheme, setScheme] = useState<InputScheme>(() => loadSave().inputScheme);
  const def = useMemo(() => getFighter(current), [current]);
  const factions = useMemo(() => factionsFor(current), [current]);
  const dossier = useMemo(() => dossierFor(current), [current]);
  const bars = useMemo(() => statsFor(def), [def]);

  const index = ROSTER.findIndex((f) => f.id === current);
  const step = (by: number) => setCurrent(ROSTER[(index + by + ROSTER.length) % ROSTER.length].id);

  // Left and right walk the roster, which is what the arrows under the art
  // do - so the keyboard does the same thing rather than a different one.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pickScheme = (next: InputScheme) => {
    setScheme(next);
    patchSave({ inputScheme: next });
  };

  return (
    <div className="grain absolute inset-0 z-30 flex flex-col bg-[var(--ink)]">
      {/* Header: the roster strip, so you can jump rather than step 20 times. */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--rule)] px-4 py-2.5">
        <span className="shrink-0 font-display text-lg font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
          Profile
        </span>
        {/* Scrolls, and says so - at twenty-six names the last chip is already
            cut in half, and a chip cut in half with no fade reads as broken
            layout rather than as more list. */}
        <div
          className="flex flex-1 gap-1.5 overflow-x-auto"
          style={{
            maskImage: "linear-gradient(to right, #000 0, #000 calc(100% - 28px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, #000 0, #000 calc(100% - 28px), transparent 100%)",
          }}
        >
          {ROSTER.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCurrent(f.id)}
              className={`cut-sm shrink-0 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition ${
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
          className="cut-sm shrink-0 border border-[var(--rule)] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone)] hover:border-[var(--accent)]"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
          {/* ---- Art, name, and where they are from ---- */}
          <div className="min-w-0">
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

            <div className="mt-2 flex items-stretch gap-2">
              <ArrowButton label="◀ Prev" onClick={() => step(-1)} />
              <ArrowButton label="Next ▶" onClick={() => step(1)} align="right" />
            </div>

            <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.86] tracking-[0.02em] text-[var(--bone)]">
              {def.name}
            </h2>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">
              {def.title}
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
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">From</div>
                <div className="text-sm text-[var(--bone)]">{def.era}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {factions.map((f) => (
                <span
                  key={f.id}
                  title={f.blurb}
                  className="cut-sm flex items-center gap-1.5 border bg-[var(--ink-2)] px-2 py-1"
                  style={{ borderColor: "var(--rule)" }}
                >
                  <FactionEmblem faction={f} size={15} />
                  <span
                    className="font-display text-xs font-bold uppercase tracking-[0.08em]"
                    style={{ color: f.color }}
                  >
                    {f.name}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* ---- History, weapons, and the bars ---- */}
          <div className="min-w-0 space-y-4">
            <Panel title="History">
              <p className="text-sm leading-relaxed text-[var(--bone-dim)]">
                {dossier?.history ?? def.bio}
              </p>
            </Panel>

            {dossier?.arsenal.length ? (
              <Panel title="Signature weapons">
                <div className="grid gap-2 sm:grid-cols-2">
                  {dossier.arsenal.map((w) => (
                    <div
                      key={w.name}
                      className="border-l-2 pl-2.5"
                      style={{ borderColor: def.palette.accent }}
                    >
                      <div className="font-display text-lg font-bold uppercase leading-none tracking-[0.06em] text-[var(--bone)]">
                        {w.name}
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--accent)]">
                        {w.role}
                      </div>
                      <p className="mt-1 text-xs leading-snug text-[var(--bone-dim)]">{w.note}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            <Panel
              title="Attributes"
              aside="Graded 1-10 against the rest of the roster, measured from the move list"
            >
              <div className="grid gap-x-5 gap-y-1.5 sm:grid-cols-2">
                {bars.map((s) => (
                  <Bar key={s.key} label={s.label} value={s.value} note={s.note} raw={s.raw} accent={def.palette.accent} />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--rule)] pt-3 text-[11px] sm:grid-cols-4">
                <Stat label="Health" value={String(def.stats.health)} />
                <Stat label="Archetype" value={def.archetype} />
                <Stat
                  label="Difficulty"
                  value={"★".repeat(def.difficulty) + "☆".repeat(5 - def.difficulty)}
                />
                <Stat label="Resource" value={def.resource?.name ?? "—"} />
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2">
              <Panel title="Strengths" accent="#8aa87a">
                <List rows={def.strengths} />
              </Panel>
              <Panel title="Weaknesses" accent="#c2705c">
                <List rows={def.weaknesses} />
              </Panel>
            </div>

            <blockquote
              className="border-l-2 pl-3 text-sm italic leading-relaxed text-[var(--bone)]"
              style={{ borderColor: def.palette.accent }}
            >
              “{def.winQuote}”
            </blockquote>
          </div>

          {/* ---- What you press ---- */}
          <div className="min-w-0">
            <div
              className="cut-sm border bg-[var(--ink-2)] p-3"
              style={{ borderColor: "var(--rule)" }}
            >
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-[var(--rule)] pb-1.5">
                <span className="font-display text-lg font-bold uppercase tracking-[0.12em] text-[var(--bone)]">
                  Moves
                </span>
                <div className="flex gap-1">
                  {INPUT_SCHEMES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pickScheme(s.id)}
                      aria-pressed={scheme === s.id}
                      className={`cut-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] transition ${
                        scheme === s.id
                          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--bone)]"
                          : "border-[var(--rule)] text-[var(--bone-dim)] hover:border-[var(--bone-dim)]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
                {SECTIONS.map((sec) => {
                  const moves = def.moves.filter((m) => !m.internal && sec.match(m));
                  if (!moves.length) return null;
                  return (
                    <section key={sec.label}>
                      <div
                        className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em]"
                        style={{ color: sec.accent }}
                      >
                        {sec.label}
                      </div>
                      <ul className="space-y-0.5">
                        {moves.map((m) => (
                          <li key={m.id} className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="truncate text-[var(--bone)]" title={m.desc}>
                              {m.name}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-[var(--accent)]">
                              {m.notation ? renderNotation(m.notation, scheme) : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => onShowMoves(current)}
                className="cut-sm mt-3 w-full border border-[var(--rule)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone)] hover:border-[var(--accent)]"
              >
                Full move list, frame data and strings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowButton({
  label,
  onClick,
  align = "left",
}: {
  label: string;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cut-sm flex-1 border border-[var(--rule)] px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {label}
    </button>
  );
}

function Panel({
  title,
  aside,
  accent = "var(--bone)",
  children,
}: {
  title: string;
  aside?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cut-sm border bg-[var(--ink-2)] p-3" style={{ borderColor: "var(--rule)" }}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 border-b border-[var(--rule)] pb-1.5">
        <span
          className="font-display text-lg font-bold uppercase tracking-[0.12em]"
          style={{ color: accent }}
        >
          {title}
        </span>
        {aside ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--bone-dim)]">
            {aside}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function List({ rows }: { rows: string[] }) {
  return (
    <ul className="space-y-1 text-xs text-[var(--bone-dim)]">
      {rows.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  );
}

/**
 * One attribute. Ten cells rather than a filled proportion, because the value
 * is a rank out of ten and a smooth bar invites reading a precision into it
 * that is not there.
 */
function Bar({
  label,
  value,
  note,
  raw,
  accent,
}: {
  label: string;
  value: number;
  note: string;
  raw: number;
  accent: string;
}) {
  return (
    <div
      className="flex items-center gap-2"
      title={`${note} — measured ${raw.toFixed(raw < 10 ? 1 : 0)}, which ranks ${value}/10 on this roster`}
    >
      <span className="w-[86px] shrink-0 truncate text-right font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--bone-dim)]">
        {label}
      </span>
      <span className="flex flex-1 gap-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="h-2.5 flex-1"
            style={{ background: i < value ? accent : "var(--rule)", opacity: i < value ? 1 - i * 0.045 : 0.5 }}
          />
        ))}
      </span>
      <span className="w-6 shrink-0 text-right font-mono text-[10px] text-[var(--bone)]">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border bg-[var(--ink)] p-2" style={{ borderColor: "var(--rule)" }}>
      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">{label}</div>
      <div className="mt-0.5 truncate text-[var(--bone)]">{value}</div>
    </div>
  );
}

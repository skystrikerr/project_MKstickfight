/** Character select: roster grid, stats panel, mode and difficulty options. */

import { useMemo, useState } from "react";
import { AI_LEVELS, type AiLevel } from "../constants";
import { getFighter, ROSTER } from "../fighters";
import type { FighterDef } from "../types";
import type { GameMode } from "../engine/game";
import menuSelect from "@/assets/menu-select.jpg";
import { STAGE_LIST, STAGE_THEMES, type StageTheme } from "../render/stage";
import { applySkin, getSkin, SKINS } from "../skins";
import { applyWeapon, weaponsFor } from "../weapons";
import { unlockLabel, unlockProgress, type ProgressState } from "../progress";
import { loadSave, patchSave } from "../save";
import { FighterPortrait } from "./Portrait";

interface Props {
  onStart: (opts: {
    p1: string;
    p2: string;
    mode: GameMode;
    aiLevel: AiLevel;
    rounds: number;
    stage: StageTheme | "random";
    p1Skin: string;
    p2Skin: string;
    /** Undefined when that fighter is carrying the weapon they were drawn with. */
    p1Weapon?: string;
    p2Weapon?: string;
  }) => void;
  onShowMoves: (id: string) => void;
}

/** A tiny painted preview of a stage: sky gradient, horizon and accent. */
function StageChip({
  theme,
  selected,
  onPick,
}: {
  theme: StageTheme | "random";
  selected: boolean;
  onPick: () => void;
}) {
  const def = theme === "random" ? null : STAGE_THEMES[theme];
  return (
    <button
      type="button"
      onClick={onPick}
      title={def?.blurb ?? "Roll a different stage every match"}
      className={`relative h-16 w-24 shrink-0 overflow-hidden border text-left transition ${
        selected
          ? "border-[var(--accent)] outline outline-1 outline-offset-1 outline-[var(--accent)]"
          : "border-[var(--rule)] hover:border-[var(--bone-dim)]"
      }`}
    >
      {def ? (
        <>
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, ${def.sky[0]}, ${def.sky[1]})` }}
          />
          <div className="absolute inset-x-0 bottom-0 h-4" style={{ background: def.ground }} />
          <div
            className="absolute bottom-4 left-1/2 h-6 w-10 -translate-x-1/2 rounded-sm opacity-70"
            style={{ background: def.accent }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[var(--ink-2)]" />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--bone)]">
        {def ? def.name : "Random"}
      </span>
    </button>
  );
}

/** A two-tone chip standing in for one of the alternate colour schemes. */
function SkinChip({
  skinId,
  selected,
  onPick,
}: {
  skinId: string;
  selected: boolean;
  onPick: () => void;
}) {
  const skin = getSkin(skinId);
  return (
    <button
      type="button"
      onClick={onPick}
      title={`${skin.name} — ${skin.blurb}`}
      aria-label={skin.name}
      aria-pressed={selected}
      className={`h-5 w-5 shrink-0 overflow-hidden border transition ${
        selected ? "border-[var(--accent)] outline outline-1 outline-[var(--accent)]" : "border-[var(--rule)] hover:border-[var(--bone-dim)]"
      }`}
      style={{ background: `linear-gradient(135deg, ${skin.swatch[0]} 50%, ${skin.swatch[1]} 50%)` }}
    />
  );
}

/**
 * The weapon a fighter is carrying, when the record offers more than one
 * answer. Most of the roster has no alternates yet and renders nothing here
 * rather than an empty row saying so.
 *
 * Named rather than swatched, unlike the colours: the whole point of a
 * variant is which pattern it is, and "Hasta" carries that where a small
 * picture of a spearhead would not.
 */
function WeaponRow({
  fighterId,
  chosen,
  progress,
  onPick,
}: {
  fighterId: string;
  chosen: string | undefined;
  progress: ProgressState;
  onPick: (variantId: string | undefined) => void;
}) {
  const variants = weaponsFor(fighterId);
  if (!variants.length) return null;
  const name = getFighter(fighterId).name;
  const chip = (selected: boolean) =>
    `cut-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] transition ${
      selected
        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--bone)]"
        : "border-[var(--rule)] text-[var(--bone-dim)] hover:border-[var(--bone-dim)]"
    }`;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => onPick(undefined)}
        title="The weapon this fighter was drawn with."
        aria-pressed={!chosen}
        className={chip(!chosen)}
      >
        As drawn
      </button>
      {variants.map((w) => {
        const p = unlockProgress(progress, fighterId, w.unlock);
        const need = unlockLabel(w.unlock, name);
        // A locked variant is shown rather than hidden, with what it costs and
        // how far along it is. Hiding it would make the fighter look finished
        // and give nobody a reason to keep playing them; showing a bare padlock
        // would make it look like something to buy.
        if (!p.done) {
          return (
            <span
              key={w.id}
              title={`${w.name} — locked. ${need}.`}
              className="cut-sm flex items-center gap-1 border border-dashed border-[var(--rule)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#5f6f66]"
            >
              <span aria-hidden>◇</span>
              {w.name}
              <span className="text-[#4e6a5c]">
                {w.unlock.kind === "clear" ? need : `${p.have}/${p.need}`}
              </span>
            </span>
          );
        }
        return (
          <button
            key={w.id}
            type="button"
            onClick={() => onPick(w.id)}
            title={`${w.name} — ${w.blurb}`}
            aria-pressed={chosen === w.id}
            className={chip(chosen === w.id)}
          >
            {w.name}
          </button>
        );
      })}
    </div>
  );
}

function StatBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[74px] font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">{label}</span>
      <div className="flex gap-px">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className="h-2.5 w-5"
            style={{ background: i < value ? "var(--accent)" : "#2b352f" }}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] text-[var(--bone-dim)]">
        {value}/{max}
      </span>
    </div>
  );
}

function ratingFor(def: FighterDef) {
  const s = def.stats;
  return {
    power: Math.min(5, Math.round((s.health / 240) * 1.1)),
    speed: Math.min(5, Math.round(s.walkF * 1.6)),
    range: def.id === "roman" ? 5 : def.id === "western" ? 4 : 3,
    tricky: Math.min(5, def.difficulty + 1),
  };
}

function Card({
  def,
  index,
  selected,
  clearedAt,
  dim,
  onPick,
  onHover,
}: {
  def: FighterDef;
  index: string;
  selected: "p1" | "p2" | "both" | null;
  /** Hardest difficulty this fighter's ladder has been cleared on, if any. */
  clearedAt?: string;
  dim: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`cut-sm group relative overflow-hidden border p-3 text-left transition ${
        selected
          ? "border-[var(--accent)] bg-[#15211c]"
          : "border-[var(--rule)] bg-[var(--ink-2)] hover:border-[var(--bone-dim)]"
      } ${dim ? "opacity-60" : ""}`}
    >
      {/* The fighter's own colour, as a strip under their feet rather than a
          glow behind them - it reads as a file tab, and it does not wash the
          portrait out. */}
      <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: def.palette.accent }} />
      <span className="absolute left-2 top-1.5 font-mono text-[10px] text-[var(--bone-dim)]">{index}</span>
      {clearedAt && (
        <span
          className="absolute left-2 bottom-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--accent)]"
          title={`Arcade ladder cleared on ${clearedAt}`}
        >
          ★ {clearedAt}
        </span>
      )}
      <FighterPortrait def={def} className="relative h-32 w-full" />
      <div className="relative mt-1">
        <div className="font-display text-xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)]">
          {def.name}
        </div>
        <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">
          {def.archetype}
        </div>
      </div>
      {selected && (
        <span className="absolute right-0 top-0 bg-[var(--accent)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--ink)]">
          {selected === "both" ? "P1 · P2" : selected.toUpperCase()}
        </span>
      )}
    </button>
  );
}

export function CharacterSelect({ onStart, onShowMoves }: Props) {
  // Read once. Everything below starts where the last session left it, and
  // writes back as it changes, so the screen never opens cold twice.
  const [saved] = useState(loadSave);
  const [p1, setP1] = useState(saved.p1);
  const [p2, setP2] = useState(saved.p2);
  const [picking, setPicking] = useState<"p1" | "p2">("p1");
  const [hover, setHover] = useState(saved.p1);
  const [mode, setMode] = useState<GameMode>("arcade");
  // Arcade and Towers are both one-player climbs: you pick who goes up and the
  // mode supplies everyone they meet. Every place that used to name "arcade"
  // means this, so it is asked once here rather than spelled out five times.
  const solo = mode === "arcade" || mode === "towers";
  const [aiLevel, setAiLevel] = useState<AiLevel>(saved.aiLevel);
  const [rounds, setRounds] = useState(saved.rounds);
  const [stage, setStage] = useState<StageTheme | "random">(saved.stage);
  const [skins, setSkins] = useState<[string, string]>([saved.p1Skin, saved.p2Skin]);
  // Keyed by fighter rather than by seat: the weapon belongs to the person,
  // so picking a hasta for Vorenus means Vorenus carries it whichever side of
  // the screen he comes out on, and in a mirror match on both.
  const [weapons, setWeapons] = useState<Record<string, string>>(saved.weapons);
  const cleared = saved.cleared;
  // What has been earned. Read once when the screen opens: nothing on the
  // select screen can change it, because unlocks only move when a match ends.
  const progress: ProgressState = { mastery: saved.mastery, cleared };

  const preview = ROSTER.find((f) => f.id === hover) ?? ROSTER[0];
  const ratings = ratingFor(preview);

  // The two locked-in fighters, wearing their chosen colours.
  const picked = useMemo(
    () =>
      [p1, p2].map((id, i) => {
        const base = ROSTER.find((f) => f.id === id) ?? ROSTER[0];
        return applySkin(applyWeapon(base, weapons[id]), getSkin(skins[i]));
      }),
    [p1, p2, skins, weapons],
  );

  const pick = (id: string) => {
    // An arcade run has one player, so every click sets P1 rather than
    // alternating - otherwise the second click hands your pick to the CPU.
    if (solo) {
      setP1(id);
      return;
    }
    if (picking === "p1") {
      setP1(id);
      setPicking("p2");
    } else {
      setP2(id);
      setPicking("p1");
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-y-auto">
      {/* The backdrop sits outside the scrolling content, fixed to the panel,
          so it does not slide up the screen as the roster is scrolled. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${menuSelect})`, filter: "contrast(0.72) saturate(0.8)" }}
        />
        {/* An explicit rgba rather than a Tailwind opacity modifier on a bare
            CSS variable - that silently renders no scrim at all, and this
            painting is bright enough in the middle to swallow a whole column
            of roster names if it comes through at full strength. */}
        <div className="absolute inset-0" style={{ background: "rgba(12, 17, 15, 0.76)" }} />
      </div>

      <div className="grain relative z-10 flex flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)] sm:text-5xl">
            Choose your fighter
          </h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">
            {solo ? (
              <>{mode === "towers" ? "Pick who climbs · the tower is chosen next" : "Eight fights · pick who climbs"}</>
            ) : (
              <>
                Selecting for{" "}
                <span style={{ color: picking === "p1" ? "var(--accent)" : "var(--p2)" }}>
                  {picking.toUpperCase()}
                </span>{" "}
                · click a fighter to lock in
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-[var(--rule)]">
            {(["arcade", "towers", "cpu", "versus", "training"] as GameMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition ${
                  mode === m
                    ? "bg-[var(--accent)] text-[var(--ink)]"
                    : "text-[var(--bone-dim)] hover:bg-white/5 hover:text-[var(--bone)]"
                }`}
              >
                {m === "arcade"
                  ? "Arcade"
                  : m === "towers"
                    ? "Towers"
                    : m === "cpu"
                      ? "1P vs CPU"
                      : m === "versus"
                        ? "2 Players"
                        : "Training"}
              </button>
            ))}
          </div>

          {(mode === "cpu" || solo || mode === "training") && (
            <select
              value={aiLevel}
              onChange={(e) => setAiLevel(e.target.value as AiLevel)}
              className="field border border-[var(--rule)] bg-[var(--ink-2)] px-2 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone)]"
            >
              {AI_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          {mode !== "training" && (
          <select
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="field border border-[var(--rule)] bg-[var(--ink-2)] px-2 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone)]"
          >
            <option value={1}>1 round</option>
            <option value={2}>Best of 3</option>
            <option value={3}>Best of 5</option>
          </select>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ROSTER.map((def, i) => (
            <Card
              key={def.id}
              def={def}
              index={String(i + 1).padStart(2, "0")}
              clearedAt={cleared[def.id]}
              selected={
                solo
                  ? p1 === def.id
                    ? "p1"
                    : null
                  : p1 === def.id && p2 === def.id
                    ? "both"
                    : p1 === def.id
                      ? "p1"
                      : p2 === def.id
                        ? "p2"
                        : null
              }
              dim={false}
              onPick={() => pick(def.id)}
              onHover={() => setHover(def.id)}
            />
          ))}
          <div className="cut-sm flex min-h-[180px] flex-col items-center justify-center border border-dashed border-[var(--rule)] p-3 text-center">
            <span className="font-display text-4xl text-[#2f3a34]">+</span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[#5f7068]">
              More fighters soon
            </span>
          </div>
        </div>

        <aside className="cut flex flex-col gap-3 border border-[var(--rule)] bg-[var(--ink-2)] p-4">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--bone-dim)]">Dossier</div>
            <div className="font-display text-3xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)]">
              {preview.name}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: preview.palette.accent }}>
              {preview.title} · {preview.era}
            </div>
          </div>
          <p className="border-l-2 border-[var(--rule)] pl-2.5 text-[13px] leading-snug text-[var(--bone-dim)]">
            {preview.bio}
          </p>

          <div className="flex flex-col gap-1.5">
            <StatBar label="Power" value={ratings.power} />
            <StatBar label="Speed" value={ratings.speed} />
            <StatBar label="Range" value={ratings.range} />
            <StatBar label="Difficulty" value={preview.difficulty} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <div className="mb-1 border-b border-[var(--rule)] pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8aa87a]">
                Strengths
              </div>
              <ul className="space-y-0.5 text-[var(--bone-dim)]">
                {preview.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 border-b border-[var(--rule)] pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#c2705c]">
                Weaknesses
              </div>
              <ul className="space-y-0.5 text-[var(--bone-dim)]">
                {preview.weaknesses.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onShowMoves(preview.id)}
            className="cut-sm border border-[var(--rule)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)]"
          >
            View move list ({preview.moves.filter((m) => !m.internal).length} moves)
          </button>
        </aside>
      </div>

      <div className="cut-sm border border-[var(--rule)] bg-[var(--ink-2)] p-3">
        <div className="mb-2 flex items-baseline justify-between border-b border-[var(--rule)] pb-1.5">
          <span className="font-display text-xl font-bold uppercase tracking-[0.1em] text-[var(--bone)]">Stage</span>
          <span className="text-xs text-[var(--bone-dim)]">
            {stage === "random" ? "A different arena every match" : STAGE_THEMES[stage].blurb}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <StageChip theme="random" selected={stage === "random"} onPick={() => setStage("random")} />
          {STAGE_LIST.map((t) => (
            <StageChip key={t} theme={t} selected={stage === t} onPick={() => setStage(t)} />
          ))}
        </div>
      </div>

      <div className="cut-sm flex flex-wrap items-center justify-between gap-3 border border-[var(--rule)] bg-[var(--ink-2)] p-3">
        <div className="flex flex-wrap items-center gap-5">
          {(solo ? picked.slice(0, 1) : picked).map((def, i) => (
            <div key={i} className="flex items-center gap-2">
              <FighterPortrait def={def} className="h-14 w-14" facing={i === 0 ? 1 : -1} />
              <div>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: i === 0 ? "var(--accent)" : "var(--p2)" }}
                >
                  P{i + 1}
                </div>
                <div className="font-display text-xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)]">
                  {def.name}
                </div>
                <div className="mt-1 flex gap-1">
                  {SKINS.map((s) => (
                    <SkinChip
                      key={s.id}
                      skinId={s.id}
                      selected={skins[i] === s.id}
                      onPick={() =>
                        setSkins((prev) => {
                          const next: [string, string] = [prev[0], prev[1]];
                          next[i] = s.id;
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
                <WeaponRow
                  fighterId={[p1, p2][i]}
                  chosen={weapons[[p1, p2][i]]}
                  progress={progress}
                  onPick={(variantId) =>
                    setWeapons((prev) => {
                      const next = { ...prev };
                      const id = [p1, p2][i];
                      if (variantId) next[id] = variantId;
                      else delete next[id];
                      return next;
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            patchSave({ p1, p2, aiLevel, rounds, stage, p1Skin: skins[0], p2Skin: skins[1], weapons });
            onStart({
              p1,
              p2,
              mode,
              aiLevel,
              rounds,
              stage,
              p1Skin: skins[0],
              p2Skin: skins[1],
              p1Weapon: weapons[p1],
              p2Weapon: weapons[p2],
            });
          }}
          className="cut bg-[var(--accent)] px-12 py-3 font-display text-3xl font-bold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:bg-[var(--accent-hot)]"
        >
          {mode === "training" ? "Train" : solo ? "Begin" : "Fight"}
        </button>
      </div>
      </div>
    </div>
  );
}

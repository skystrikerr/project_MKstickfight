/**
 * Character select.
 *
 * The layout is the `pfcs-` frame from the UI package - world map behind, a
 * three-column main block of art / dossier / actions, the roster along the
 * foot - wired to the real roster, the real save file and the real numbers
 * out of `profile.ts`. The mockup's placeholder text and invented stats are
 * gone; everything on screen is read from the game.
 */

import { useEffect, useMemo, useState } from "react";
import { AI_LEVELS, type AiLevel } from "../constants";
import { getFighter, ROSTER } from "../fighters";
import type { FighterDef } from "../types";
import type { GameMode } from "../engine/game";
import { stagesOfKind, STAGE_THEMES, type StageTheme } from "../render/stage";
import { applySkin, getSkin, SKINS } from "../skins";
import { applyWeapon, weaponsFor } from "../weapons";
import { unlockLabel, unlockProgress, type ProgressState } from "../progress";
import { loadSave, patchSave } from "../save";
import { FactionMarks } from "./FactionEmblem";
import { FighterPortrait } from "./Portrait";
import { FighterCard } from "./FighterCard";
import { PLATES, portraitFor } from "./art";
import worldMap from "@/assets/ui/fighter-world-map.webp";
import { statsFor } from "../profile";
import { STAT_COLORS, StatIcon } from "./StatMedallion";
import "./CharacterSelectFrame.css";

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
  onShowProfile: (id: string) => void;
  /** Who the globe sent through, if the player came in off a marker. */
  initialP1?: string;
  /** Back to the main menu. The control strip has always promised this. */
  onBack?: () => void;
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
      {def?.kind === "arcade" ? (
        <span className="absolute right-0 top-0 bg-[var(--accent)] px-1 font-mono text-[8px] uppercase tracking-wider text-black">
          Arcade
        </span>
      ) : null}
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

/** One combat bar: medallion, label, ten segments, the graded value. */
function StatRow({ stat }: { stat: ReturnType<typeof statsFor>[number] }) {
  const color = STAT_COLORS[stat.key];
  return (
    <div className="pfcs-bars__row" title={stat.note}>
      <span className="pfcs-bars__icon">
        <StatIcon kind={stat.key} />
      </span>
      <span className="pfcs-bars__label">{stat.label}</span>
      <div className="pfcs-bars__track">
        {Array.from({ length: 10 }).map((_, i) => (
          <i
            key={i}
            className={`pfcs-bars__seg ${i < stat.value ? "is-filled" : ""}`}
            style={{ ["--seg-color" as never]: color } as React.CSSProperties}
          />
        ))}
      </div>
      <span className="pfcs-bars__value">{stat.value.toFixed(1)}</span>
    </div>
  );
}

/**
 * A painted menu plate used as a button.
 *
 * The plate carries its own medallion and its own lettering, so nothing is
 * drawn back over it - the mockup's overlay label was written for a plate with
 * a blank right-hand end, and on these it lands on top of the painted word.
 * The line that changes with the game goes underneath the plate instead, where
 * it can be read and where it is obviously not part of the picture.
 */
function PlateButton({
  plate,
  title,
  subtitle,
  active,
  onClick,
}: {
  plate: string;
  title: string;
  subtitle: string;
  active?: boolean;
  onClick: () => void;
}) {
  const src = PLATES[plate];
  return (
    <button
      type="button"
      className={`pfcs-image-action ${active ? "is-active" : ""}`}
      aria-label={title}
      title={`${title} — ${subtitle}`}
      onClick={onClick}
    >
      {src ? <img src={src} alt="" /> : <span className="pfcs-image-action__fallback">{title}</span>}
      <span className="pfcs-image-action__caption">{subtitle}</span>
    </button>
  );
}

export function CharacterSelect({ onStart, onShowMoves, onShowProfile, initialP1, onBack }: Props) {
  // Read once. Everything below starts where the last session left it, and
  // writes back as it changes, so the screen never opens cold twice.
  const [saved] = useState(loadSave);
  const [p1, setP1] = useState(initialP1 ?? saved.p1);
  const [p2, setP2] = useState(saved.p2);
  const [picking, setPicking] = useState<"p1" | "p2">("p1");
  const [hover, setHover] = useState(initialP1 ?? saved.p1);
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
  // Which plate is open under the dossier. Customize is the one that changes
  // what you take into the match, so it is the one showing when you arrive.
  const [panel, setPanel] = useState<"customize" | "stage">("customize");
  const cleared = saved.cleared;
  const progress: ProgressState = { mastery: saved.mastery, cleared };

  const preview = ROSTER.find((f) => f.id === hover) ?? ROSTER[0];
  const bars = useMemo(() => statsFor(preview), [preview]);
  const seat = solo ? 0 : preview.id === p2 && preview.id !== p1 ? 1 : 0;

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

  const seatOf = (id: string): "p1" | "p2" | "both" | null =>
    solo ? (p1 === id ? "p1" : null) : p1 === id && p2 === id ? "both" : p1 === id ? "p1" : p2 === id ? "p2" : null;

  const begin = () => {
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
  };

  // Escape and B are what the strip along the foot says leave this screen, so
  // they do.
  useEffect(() => {
    if (!onBack) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) return;
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <div className="pfcs-screen">
      <div className="pfcs-screen__map" style={{ backgroundImage: `url(${worldMap})` }} />

      <section className="pfcs-shell">
        <header className="pfcs-topbar">
          <div className="pfcs-brand">
            <div className="pfcs-brand__crest" />
            <div>
              <div className="pfcs-brand__title">Plank Fighter</div>
              <div className="pfcs-brand__tag">History Fights Back</div>
            </div>
          </div>

          {/* The mockup's screen box is a label. It is the only spare surface
              at the top of the screen, so the things you have to be able to
              change before a match live in it rather than in a strip of their
              own underneath. */}
          <div className="pfcs-screenbox">
            <div className="pfcs-screenbox__title">Character Select</div>
            <div className="pfcs-screenbox__sub">
              {solo
                ? mode === "towers"
                  ? "Pick who climbs · the tower comes next"
                  : "Eight fights · pick who climbs"
                : `Selecting for ${picking.toUpperCase()}`}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <div className="flex border border-[#5d4a35]">
                {(["arcade", "towers", "cpu", "versus", "training"] as GameMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
                      mode === m ? "bg-[#b88b49] text-black" : "text-[#9e907b] hover:bg-white/5 hover:text-[#efe2c9]"
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
                  className="field border border-[#5d4a35] bg-black/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#efe2c9]"
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
                  className="field border border-[#5d4a35] bg-black/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#efe2c9]"
                >
                  <option value={1}>1 round</option>
                  <option value={2}>Best of 3</option>
                  <option value={3}>Best of 5</option>
                </select>
              )}
            </div>
          </div>
        </header>

        <div className="pfcs-main">
          <aside className="pfcs-art-panel">
            <div className="pfcs-banner">Character Artwork</div>
            <div className="pfcs-art-stage">
              {portraitFor(preview.id) ? (
                <FighterCard
                  fighterId={preview.id}
                  kind={seat === 1 ? "p2" : "p1"}
                  className="h-full"
                  name={preview.name}
                />
              ) : (
                /* Nobody has painted this one yet. The empty frame is the
                   honest answer - and the stick figure underneath it is the
                   fighter as the game actually draws them, which is the next
                   most useful thing to look at. */
                <div className="relative flex h-full items-center justify-center">
                  <FighterCard fighterId={preview.id} kind={seat === 1 ? "p2" : "p1"} className="h-full" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <FighterPortrait def={preview} className="h-[58%] w-[58%]" />
                  </div>
                </div>
              )}
            </div>
            <div className="pfcs-quote">&ldquo;{preview.winQuote}&rdquo;</div>
          </aside>

          <section className="pfcs-info-panel">
            <div className="pfcs-fighter-head">
              <h2>{preview.name}</h2>
              <div className="pfcs-subname">{preview.title}</div>
            </div>

            <div className="pfcs-meta">
              <div>
                <span>Where</span>
                <strong>{preview.era.split(", ")[0]}</strong>
              </div>
              <div>
                <span>Era</span>
                <strong>{preview.era.split(", ").slice(1).join(", ") || "—"}</strong>
              </div>
              <div>
                <span>Style</span>
                <strong>{preview.archetype}</strong>
              </div>
            </div>

            <div className="pfcs-story">
              <p>{preview.bio}</p>
            </div>

            <div className="pfcs-section-label">Playstyle</div>
            <p className="pfcs-playstyle">
              {preview.strengths[0]}. {preview.weaknesses[0]}.
            </p>

            {/* Eight bars, graded against the rest of the roster by
                `profile.ts`. These are measured off the move data - nothing
                here is a number somebody typed in to fill the row. */}
            <div className="pfcs-bars">
              {bars.map((s) => (
                <StatRow key={s.key} stat={s} />
              ))}
            </div>
          </section>

          <aside className="pfcs-right-panel">
            <div className="pfcs-actions pfcs-actions--image">
              <PlateButton
                plate="customize"
                title="Customize"
                /* The plate already says what Customize is. The caption says
                   what it is currently set to, which the plate cannot. */
                subtitle={`${getSkin(skins[seat]).name}${
                  weapons[[p1, p2][seat]] ? ` • ${weapons[[p1, p2][seat]]}` : " • As drawn"
                }`}
                active={panel === "customize"}
                onClick={() => setPanel("customize")}
              />
              <PlateButton
                plate="moves"
                title="Moves"
                subtitle={`${preview.moves.filter((m) => !m.internal).length} in the command list`}
                onClick={() => onShowMoves(preview.id)}
              />
              <PlateButton
                plate="progression"
                title="Progression"
                subtitle="History • Weapons • Deep stats"
                onClick={() => onShowProfile(preview.id)}
              />
              <PlateButton
                plate="stage-select"
                title="Stage Select"
                subtitle={stage === "random" ? "A different arena every match" : STAGE_THEMES[stage].name}
                active={panel === "stage"}
                onClick={() => setPanel("stage")}
              />
            </div>

            {panel === "customize" ? (
              <div className="pfcs-skin-card">
                <div className="pfcs-skin-card__viewport">
                  <FighterPortrait def={picked[seat]} className="h-full w-full" facing={seat === 0 ? 1 : -1} />
                </div>
                <div className="pfcs-skin-card__footer">
                  <strong>{getSkin(skins[seat]).name}</strong>
                  <small>{getSkin(skins[seat]).blurb}</small>
                </div>
                <div className="flex flex-wrap items-center gap-1 p-2.5 pt-0">
                  {SKINS.map((s) => (
                    <SkinChip
                      key={s.id}
                      skinId={s.id}
                      selected={skins[seat] === s.id}
                      onPick={() =>
                        setSkins((prev) => {
                          const next: [string, string] = [prev[0], prev[1]];
                          next[seat] = s.id;
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
                <div className="px-2.5 pb-2.5">
                  <WeaponRow
                    fighterId={[p1, p2][seat]}
                    chosen={weapons[[p1, p2][seat]]}
                    progress={progress}
                    onPick={(variantId) =>
                      setWeapons((prev) => {
                        const next = { ...prev };
                        const id = [p1, p2][seat];
                        if (variantId) next[id] = variantId;
                        else delete next[id];
                        return next;
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="pfcs-skin-card">
                <div className="max-h-[320px] overflow-y-auto p-2.5">
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#9e907b]">Arenas</div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <StageChip theme="random" selected={stage === "random"} onPick={() => setStage("random")} />
                    {stagesOfKind("arena").map((t) => (
                      <StageChip key={t} theme={t} selected={stage === t} onPick={() => setStage(t)} />
                    ))}
                  </div>
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#b88b49]">
                    Arcade — wide, several storeys
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stagesOfKind("arcade").map((t) => (
                      <StageChip key={t} theme={t} selected={stage === t} onPick={() => setStage(t)} />
                    ))}
                  </div>
                </div>
                <div className="pfcs-skin-card__footer">
                  <strong>{stage === "random" ? "Random" : STAGE_THEMES[stage].name}</strong>
                  <small>{stage === "random" ? "Rolled every match" : STAGE_THEMES[stage].blurb}</small>
                </div>
              </div>
            )}
          </aside>
        </div>

        <div className="pfcs-roster-wrap">
          <div className="pfcs-roster">
            {ROSTER.map((def) => {
              const sel = seatOf(def.id);
              return (
                <button
                  key={def.id}
                  type="button"
                  className={`pfcs-roster__tile is-card ${sel ? "is-selected" : ""}`}
                  onClick={() => pick(def.id)}
                  onMouseEnter={() => setHover(def.id)}
                  onFocus={() => setHover(def.id)}
                  title={`${def.name} — ${def.archetype}`}
                >
                  <FighterCard
                    fighterId={def.id}
                    kind={sel ? "selected" : "plain"}
                    className="w-full"
                    name={def.name}
                  >
                    <FactionMarks
                      fighterId={def.id}
                      size={13}
                      kinds={["faith"]}
                      className="absolute left-1 top-1 z-10 drop-shadow-[1px_1px_0_rgba(0,0,0,0.9)]"
                    />
                    {cleared[def.id] && (
                      <span className="absolute bottom-1 left-1.5 z-10 font-mono text-[8px] text-[#e0b866] drop-shadow-[1px_1px_0_rgba(0,0,0,0.9)]">
                        ★
                      </span>
                    )}
                    {sel && <em className="pfcs-roster__badge">{sel === "both" ? "P1·P2" : sel.toUpperCase()}</em>}
                  </FighterCard>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="pfcs-footer">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="border border-[#5d4a35] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9e907b] transition hover:border-[#b88b49] hover:text-[#efe2c9]"
              >
                &larr; World
              </button>
            )}
            {(solo ? picked.slice(0, 1) : picked).map((def, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="pfcs-player-badge">P{i + 1}</div>
                <div className="font-display text-lg font-bold uppercase leading-none tracking-[0.02em] text-[#efe2c9]">
                  {def.name}
                </div>
              </div>
            ))}
          </div>
          <div className="pfcs-center-prompt">
            {solo ? "Choose your fighter" : `Selecting for ${picking.toUpperCase()}`}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={begin}
              className="cut bg-[#b88b49] px-10 py-2.5 font-display text-2xl font-bold uppercase tracking-[0.12em] text-black transition hover:bg-[#d6a75a]"
            >
              {mode === "training" ? "Train" : solo ? "Begin" : "Fight"}
            </button>
          </div>
        </footer>

        <div className="pfcs-controls">
          <span>
            <b>A</b>Select
          </span>
          <span>
            <b>B</b>Back
          </span>
          <span>
            <b>X</b>Random
          </span>
          <span>
            <b>Y</b>Stage Select
          </span>
        </div>
      </section>
    </div>
  );
}

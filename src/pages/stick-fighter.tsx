/**
 * Plank Fighter World - a 2D three.js fighting game.
 *
 * Screens: title -> character select -> match, with the move list available
 * from anywhere.
 */

import { useEffect, useState } from "react";
import { CharacterSelect } from "@/game/stickfight/ui/CharacterSelect";
import { GameCanvas, type MatchConfig } from "@/game/stickfight/ui/GameCanvas";
import { MoveList } from "@/game/stickfight/ui/MoveList";
import { FighterPortrait } from "@/game/stickfight/ui/Portrait";
import { ROSTER } from "@/game/stickfight/fighters";
import { Wordmark } from "@/game/stickfight/ui/Wordmark";
import { Settings } from "@/game/stickfight/ui/Settings";
import { StartButton } from "@/game/stickfight/ui/StartButton";
import { music } from "@/game/stickfight/engine/music";
import { ContinuePrompt, EndingCard, VersusCard } from "@/game/stickfight/ui/Arcade";
import { advanceRun, continueRun, endingFor, startRun, type LadderStep, type Run } from "@/game/stickfight/ladder";
import { loadSave, recordClear, recordMatch } from "@/game/stickfight/save";
import type { WeaponVariant } from "@/game/stickfight/weapons";
import { SKINS } from "@/game/stickfight/skins";
import menuMap from "@/assets/menu-map.jpg";

type Screen = "title" | "select" | "fight";

const CONTROLS: { keys: string; label: string }[] = [
  { keys: "W A S D", label: "Move · W jumps · S crouches" },
  { keys: "J", label: "Light attack (A)" },
  { keys: "K", label: "Medium attack (B)" },
  { keys: "L", label: "Heavy attack (C)" },
  { keys: "S + J / K / L", label: "Crouching light / medium / heavy" },
  { keys: "hold U / ;", label: "Block (S) · + ↓ blocks low" },
  { keys: "← + S", label: "Parry" },
  { keys: "→ + S", label: "Roll (ducks under the swing, travels past them)" },
  { keys: "← ←", label: "Backstep (retreats out of range)" },
  { keys: "J + L", label: "Character skill" },
  { keys: "J + K", label: "Throw" },
  { keys: "Esc", label: "Pause" },
];

const P2_CONTROLS: { keys: string; label: string }[] = [
  { keys: "Arrow keys", label: "Move / jump / crouch" },
  { keys: "N / M / ,", label: "Light / Medium / Heavy" },
  { keys: ". or Numpad 0", label: "Block / skill (S)" },
];

const PAD_CONTROLS: { keys: string; label: string }[] = [
  { keys: "D-pad / stick", label: "Move, jump, crouch" },
  { keys: "✕ / A", label: "Light attack" },
  { keys: "○ / B", label: "Medium attack" },
  { keys: "□ / X", label: "Heavy attack" },
  { keys: "↓ + ✕ / ○ / □", label: "Crouching attacks" },
  { keys: "△ / Y · L1 · L2", label: "Block / skill" },
  { keys: "R1", label: "Character skill" },
  { keys: "R2", label: "Throw" },
  { keys: "Start", label: "Pause" },
];

/**
 * Keeps the two sides of a mirror match visibly different. Everywhere else the
 * chosen colours stand, because they were chosen.
 */
function mirrorSafeSkin(step: LadderStep, p1Skin?: string, p2Skin?: string): string | undefined {
  if (step.stage !== "mirror" || p2Skin !== p1Skin) return p2Skin;
  return SKINS.find((s) => s.id !== p1Skin)?.id ?? p2Skin;
}

export default function StickFighter() {
  const [screen, setScreen] = useState<Screen>("title");
  const [config, setConfig] = useState<MatchConfig | null>(null);
  // What the last finished match unlocked, if anything. Cleared when the
  // player acknowledges it or starts another fight.
  const [earned, setEarned] = useState<{ fighter: string; items: WeaponVariant[] } | null>(null);
  const [moveListFor, setMoveListFor] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [touch, setTouch] = useState(false);
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    setTouch(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
    if (loadSave().highContrast) document.documentElement.dataset.contrast = "high";
  }, []);

  // Music needs a gesture before a browser will start it, same as the sound
  // effects. Whichever comes first wins; the cue asked for meanwhile is held.
  useEffect(() => {
    const wake = () => music.unlock();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  useEffect(() => {
    if (screen === "title") music.play("menu");
    else if (screen === "select") music.play("select");
  }, [screen]);

  /**
   * Credits a finished match to whoever actually played it.
   *
   * Only a seat a human held counts. In two-player both seats do; against the
   * CPU only seat one does, because the computer picking a fighter up for one
   * arcade rung has not earned anything with them.
   */
  const creditMatch = (cfg: MatchConfig, winner: number) => {
    const seats: { id: string; won: boolean }[] =
      cfg.mode === "versus"
        ? [
            { id: cfg.p1, won: winner === 0 },
            { id: cfg.p2, won: winner === 1 },
          ]
        : [{ id: cfg.p1, won: winner === 0 }];
    const items: WeaponVariant[] = [];
    for (const seat of seats) items.push(...recordMatch(seat.id, seat.won).unlocked);
    if (items.length) setEarned({ fighter: seats[0].id, items });
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
      {screen === "title" && (
        <>
          {/*
            The campaign map, sitting still while the roster scrolls over it.

            It is a sibling of the scroller rather than a child on purpose. An
            absolute layer inside a scrolling box is positioned against the
            scrolled content and slides away on the second row of fighters;
            out here it is anchored to the viewport-height wrapper instead.
            `background-attachment: fixed` would be the other way to do it and
            is ignored or juddered by half the mobile browsers there are.

            The scrim over it is the load-bearing part. The map is warm light
            parchment and every word on this screen is bone on near-black, so
            without it the type sits on pale paper and cannot be read. It is
            one flat colour at a fixed opacity, not a gradient: the job is to
            hold the whole image down evenly to a texture the type can live
            on, not to bloom a pool of light behind the heading.
          */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
            {/* Flattened before the scrim goes over it. The map carries its
                own hand-lettered place names in hard dark ink, and a flat
                scrim dims those exactly as much as it dims the parchment, so
                they stay just legible enough to compete with the roster names
                sitting on top of them. Pulling the contrast down first is what
                drops the lettering back to texture while the coastlines and
                the buildings survive. */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${menuMap})`, filter: "contrast(0.62) saturate(0.85)" }}
            />
            {/* An explicit rgba, not `bg-[var(--ink)]/82`. Tailwind's opacity
                modifier cannot be applied to a bare CSS variable - it needs a
                colour it can decompose - so that class silently renders no
                scrim at all and the map comes through at full strength with
                every word on the screen sitting unreadable on top of it. */}
            <div className="absolute inset-0" style={{ background: "rgba(12, 17, 15, 0.84)" }} />
          </div>

        <div className="grain relative z-10 flex h-full flex-col items-center overflow-y-auto px-6 py-10">
          <header className="relative flex w-full max-w-6xl flex-col items-center">
            <div className="flex w-full items-center gap-4">
              <span className="h-px flex-1 bg-[var(--rule)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--bone-dim)]">
                {ROSTER.length} fighters · 3300 BC – 1965
              </span>
              <span className="h-px flex-1 bg-[var(--rule)]" />
            </div>
            <Wordmark className="mt-5" />
            {/* Kuro is still the only one who was not, so this number moves
                every time a documented fighter is added. Saying "all of them"
                would be the only lie on the screen. */}
            <p className="mt-3 text-sm uppercase tracking-[0.3em] text-[var(--bone-dim)]">
              Twenty-one of them were real
            </p>
          </header>

          <div className="relative mt-8 flex flex-wrap items-end justify-center gap-x-5 gap-y-6">
            {ROSTER.map((def, i) => (
              <div key={def.id} className="flex w-32 flex-col items-center sm:w-40">
                <FighterPortrait def={def} className="h-40 w-32 sm:h-52 sm:w-40" facing={i % 2 === 0 ? 1 : -1} />
                <span className="mt-1 h-px w-8" style={{ background: def.palette.accent }} />
                <span className="mt-1.5 text-center font-display text-lg font-bold uppercase leading-none tracking-[0.02em]">
                  {def.name}
                </span>
                <span className="mt-0.5 text-center font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">
                  {def.era}
                </span>
              </div>
            ))}
          </div>

          <div className="relative mt-10 flex flex-col items-center gap-3">
            <StartButton onClick={() => setScreen("select")} />
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setRun(null);
                  setConfig({
                    p1: "roman",
                    p2: "roman",
                    mode: "tutorial",
                    aiLevel: "Rookie",
                    rounds: 1,
                    stage: "colosseum",
                    p2Skin: SKINS.find((s) => s.id !== "classic")?.id,
                  });
                  setScreen("fight");
                }}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--bone-dim)] transition hover:text-[var(--bone)]"
              >
                [ Tutorial ]
              </button>
              <button
                type="button"
                onClick={() => setMoveListFor(ROSTER[0].id)}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--bone-dim)] transition hover:text-[var(--bone)]"
              >
                [ Move lists ]
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--bone-dim)] transition hover:text-[var(--bone)]"
              >
                [ Settings ]
              </button>
            </div>
          </div>

          <div className="relative mt-10 grid w-full max-w-5xl gap-px bg-[var(--rule)] sm:grid-cols-3">
            {[
              { label: "Player 1", accent: "var(--accent)", rows: CONTROLS },
              { label: "Player 2", accent: "var(--p2)", rows: P2_CONTROLS },
              { label: "Gamepad — plug in, press a button", accent: "#7f9c6b", rows: PAD_CONTROLS },
            ].map((col) => (
              <section key={col.label} className="bg-[var(--ink-2)] p-4">
                <div
                  className="mb-2 border-b pb-1.5 font-display text-lg font-bold uppercase tracking-[0.15em]"
                  style={{ color: col.accent, borderColor: "var(--rule)" }}
                >
                  {col.label}
                </div>
                <ul className="space-y-1 text-xs">
                  {col.rows.map((c) => (
                    <li key={c.keys} className="flex justify-between gap-4">
                      <span className="font-mono text-[11px] text-[var(--bone)]">{c.keys}</span>
                      <span className="text-right text-[var(--bone-dim)]">{c.label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="relative mt-6 max-w-3xl pb-4 text-center text-xs leading-relaxed text-[var(--bone-dim)]">
            Every fighter has <span className="text-[var(--bone)]">five specials</span>, a light and a heavy attack, a
            block, two dodges and a jump — plus their own skill, super, and three strings built out of their own
            weapons. Specials use motion inputs: ↓↘→ + button for quarter circles, →↓↘ for dragon punches. Meter pays
            for EX specials (50) and supers (100).
          </p>
        </div>
        </>
      )}

      {screen === "select" && (
        <CharacterSelect
          onStart={(opts) => {
            setConfig(opts);
            setRun(opts.mode === "arcade" ? startRun(opts.p1, opts.aiLevel) : null);
            setScreen("fight");
          }}
          onShowMoves={(id) => setMoveListFor(id)}
        />
      )}

      {screen === "fight" && config && !run && (
        <GameCanvas
          config={config}
          touch={touch}
          onQuit={() => setScreen("select")}
          onShowMoves={() => setMoveListFor(config.p1)}
          onResult={(winner) => creditMatch(config, winner)}
        />
      )}

      {screen === "fight" && config && run && (
        <>
          {/*
            The canvas stays mounted through the versus card so the next fight
            is already warm behind it - remounting between every bout is what
            makes an arcade ladder feel like eight separate loading screens.
          */}
          <GameCanvas
            config={{
              ...config,
              mode: "cpu",
              p2: run.steps[run.at].opponent,
              aiLevel: run.steps[run.at].level,
              // A mirror match needs two different colours or you cannot tell
              // which stick figure is yours.
              p2Skin: mirrorSafeSkin(run.steps[run.at], config.p1Skin, config.p2Skin),
              // A weapon belongs to the fighter, not to the seat. The ladder
              // swaps the opponent every fight, so carrying the selected P2's
              // weapon along would hand it to whoever turned up next.
              p2Weapon: loadSave().weapons[run.steps[run.at].opponent],
            }}
            touch={touch}
            onQuit={() => {
              setRun(null);
              setScreen("select");
            }}
            onShowMoves={() => setMoveListFor(config.p1)}
            onResult={(winner) => creditMatch({ ...config, mode: "cpu" }, winner)}
            onMatchEnd={(winner, finishing) => {
              setRun((r) => {
                if (!r) return r;
                const next = advanceRun(r, winner === 0, finishing);
                if (next.phase === "cleared" && r.phase !== "cleared") {
                  const { unlocked } = recordClear(next.fighter, next.level);
                  if (unlocked.length) setEarned({ fighter: next.fighter, items: unlocked });
                }
                return next;
              });
            }}
          />

          {run.phase === "versus" && (
            <VersusCard
              playerId={config.p1}
              step={run.steps[run.at]}
              onFight={() => setRun({ ...run, phase: "fight" })}
              onQuit={() => {
                setRun(null);
                setScreen("select");
              }}
            />
          )}

          {run.phase === "lost" && (
            <ContinuePrompt
              step={run.steps[run.at]}
              continues={run.continues}
              recap={run.lastRecap}
              onRetry={() => setRun(continueRun(run))}
              onQuit={() => {
                setRun(null);
                setScreen("select");
              }}
            />
          )}

          {run.phase === "cleared" && (
            <EndingCard
              playerId={config.p1}
              ending={endingFor(config.p1)}
              level={config.aiLevel}
              continues={run.continues}
              onDone={() => {
                setRun(null);
                setScreen("select");
              }}
            />
          )}
        </>
      )}

      {/*
        The one moment the progression system is allowed to interrupt. An
        unlock that arrives silently is not a reward, and one that blocks the
        rematch button is a toll - so this sits at the bottom, says what was
        earned and where to put it on, and goes away when it is clicked.
      */}
      {earned && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setEarned(null)}
            className="cut-sm pointer-events-auto max-w-md border border-[var(--accent)] bg-[var(--ink-2)] px-4 py-3 text-left"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              {earned.items.length > 1 ? "Weapons unlocked" : "Weapon unlocked"}
            </div>
            {earned.items.map((w) => (
              <div key={w.id} className="mt-1">
                <div className="font-display text-xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)]">
                  {w.name}
                </div>
                <p className="mt-1 text-xs leading-snug text-[var(--bone-dim)]">{w.blurb}</p>
              </div>
            ))}
            <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#5f6f66]">
              Equip it on the character select · click to dismiss
            </div>
          </button>
        </div>
      )}

      {moveListFor && <MoveList fighterId={moveListFor} onClose={() => setMoveListFor(null)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

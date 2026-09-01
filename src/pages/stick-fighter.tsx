/**
 * Stick Fighter - a 2D three.js fighting game.
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
import { music } from "@/game/stickfight/engine/music";
import { ContinuePrompt, EndingCard, VersusCard } from "@/game/stickfight/ui/Arcade";
import { advanceRun, continueRun, endingFor, startRun, type LadderStep, type Run } from "@/game/stickfight/ladder";
import { recordClear } from "@/game/stickfight/save";
import { SKINS } from "@/game/stickfight/skins";

type Screen = "title" | "select" | "fight";

const CONTROLS: { keys: string; label: string }[] = [
  { keys: "W A S D", label: "Move · W jumps · S crouches" },
  { keys: "J", label: "Light attack (A)" },
  { keys: "K", label: "Medium attack (B)" },
  { keys: "L", label: "Heavy attack (C)" },
  { keys: "S + J / K / L", label: "Crouching light / medium / heavy" },
  { keys: "hold U / ;", label: "Block (S) · + ↓ blocks low" },
  { keys: "← + S", label: "Parry" },
  { keys: "→ + S", label: "Sidestep (dodges through attacks)" },
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
  const [moveListFor, setMoveListFor] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    setTouch(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
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

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
      {screen === "title" && (
        <div className="grain relative flex h-full flex-col items-center overflow-y-auto px-6 py-10">
          {/*
            One low, warm pool of light from the floor - a lit stage, not a
            gradient wash. Nothing else paints the background.
          */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
            style={{ background: "radial-gradient(80% 100% at 50% 100%, rgba(200,149,47,0.12), transparent 70%)" }}
          />

          <header className="relative flex w-full max-w-6xl flex-col items-center">
            <div className="flex w-full items-center gap-4">
              <span className="h-px flex-1 bg-[var(--rule)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--bone-dim)]">
                {ROSTER.length} fighters · 500 BC – 1965
              </span>
              <span className="h-px flex-1 bg-[var(--rule)]" />
            </div>
            <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[0.14em] sm:text-7xl">
              Stick <span className="text-[var(--accent)]">Fighter</span>
            </h1>
            <p className="mt-1 text-sm uppercase tracking-[0.3em] text-[var(--bone-dim)]">
              Every one of them was real
            </p>
          </header>

          <div className="relative mt-8 flex flex-wrap items-end justify-center gap-x-5 gap-y-6">
            {ROSTER.map((def, i) => (
              <div key={def.id} className="flex w-32 flex-col items-center sm:w-40">
                <FighterPortrait def={def} className="h-40 w-32 sm:h-52 sm:w-40" facing={i % 2 === 0 ? 1 : -1} />
                <span className="mt-1 h-px w-8" style={{ background: def.palette.accent }} />
                <span className="mt-1.5 text-center font-display text-sm font-bold uppercase leading-none tracking-[0.08em]">
                  {def.name}
                </span>
                <span className="mt-0.5 text-center font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">
                  {def.era}
                </span>
              </div>
            ))}
          </div>

          <div className="relative mt-10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setScreen("select")}
              className="cut bg-[var(--accent)] px-14 py-3 font-display text-2xl font-bold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:bg-[var(--accent-hot)]"
            >
              Press Start
            </button>
            <button
              type="button"
              onClick={() => setMoveListFor(ROSTER[0].id)}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--bone-dim)] transition hover:text-[var(--bone)]"
            >
              [ Move lists ]
            </button>
          </div>

          <div className="relative mt-10 grid w-full max-w-5xl gap-px bg-[var(--rule)] sm:grid-cols-3">
            {[
              { label: "Player 1", accent: "var(--accent)", rows: CONTROLS },
              { label: "Player 2", accent: "var(--p2)", rows: P2_CONTROLS },
              { label: "Gamepad — plug in, press a button", accent: "#7f9c6b", rows: PAD_CONTROLS },
            ].map((col) => (
              <section key={col.label} className="bg-[var(--ink-2)] p-4">
                <div
                  className="mb-2 border-b pb-1.5 font-display text-sm font-bold uppercase tracking-[0.15em]"
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
            block, a sidestep and a jump — plus their own skill, super, and three strings built out of their own
            weapons. Specials use motion inputs: ↓↘→ + button for quarter circles, →↓↘ for dragon punches. Meter pays
            for EX specials (50) and supers (100).
          </p>
        </div>
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
            }}
            touch={touch}
            onQuit={() => {
              setRun(null);
              setScreen("select");
            }}
            onShowMoves={() => setMoveListFor(config.p1)}
            onMatchEnd={(winner) => {
              setRun((r) => {
                if (!r) return r;
                const next = advanceRun(r, winner === 0);
                if (next.phase === "cleared" && r.phase !== "cleared") recordClear(next.fighter, next.level);
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

      {moveListFor && <MoveList fighterId={moveListFor} onClose={() => setMoveListFor(null)} />}
    </div>
  );
}

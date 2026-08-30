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

type Screen = "title" | "select" | "fight";

const CONTROLS: { keys: string; label: string }[] = [
  { keys: "W A S D", label: "Move · W jumps · S crouches" },
  { keys: "J", label: "Light attack (A)" },
  { keys: "K", label: "Medium attack (B)" },
  { keys: "L", label: "Heavy attack (C)" },
  { keys: "S + J / K / L", label: "Crouching light / medium / heavy" },
  { keys: "hold U / ;", label: "Block (S) · + ↓ blocks low" },
  { keys: "← + S", label: "Parry" },
  { keys: "→ + S", label: "Dodge roll" },
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

export default function StickFighter() {
  const [screen, setScreen] = useState<Screen>("title");
  const [config, setConfig] = useState<MatchConfig | null>(null);
  const [moveListFor, setMoveListFor] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);

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
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0b0b10] text-white">
      {screen === "title" && (
        <div className="relative flex h-full flex-col items-center justify-center gap-8 overflow-y-auto px-6 py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 50% 20%, rgba(251,191,36,0.25), transparent 55%), radial-gradient(circle at 20% 80%, rgba(56,189,248,0.18), transparent 50%)",
            }}
          />

          <div className="relative text-center">
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white drop-shadow-[4px_4px_0_rgba(0,0,0,0.6)] sm:text-7xl">
              Stick<span className="text-amber-400">Fighter</span>
            </h1>
            <p className="mt-2 text-sm uppercase tracking-[0.35em] text-white/50">
              Warriors from every era, one arena
            </p>
          </div>

          <div className="relative flex flex-wrap items-end justify-center gap-6">
            {ROSTER.map((def, i) => (
              <div key={def.id} className="flex flex-col items-center">
                <FighterPortrait def={def} className="h-40 w-32 sm:h-52 sm:w-40" facing={i % 2 === 0 ? 1 : -1} />
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">{def.name}</span>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: def.palette.accent }}>
                  {def.era}
                </span>
              </div>
            ))}
          </div>

          <div className="relative flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setScreen("select")}
              className="rounded-md bg-amber-400 px-10 py-4 text-2xl font-black uppercase italic tracking-wide text-black transition hover:bg-amber-300"
            >
              Press Start
            </button>
            <button
              type="button"
              onClick={() => setMoveListFor(ROSTER[0].id)}
              className="text-xs font-bold uppercase tracking-widest text-white/50 underline-offset-4 hover:text-white hover:underline"
            >
              Move lists
            </button>
          </div>

          <div className="relative grid max-w-5xl gap-4 text-xs sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-300">Player 1</div>
              <ul className="space-y-1">
                {CONTROLS.map((c) => (
                  <li key={c.keys} className="flex justify-between gap-4">
                    <span className="font-mono text-white/80">{c.keys}</span>
                    <span className="text-white/50">{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sky-300">Player 2</div>
              <ul className="space-y-1">
                {P2_CONTROLS.map((c) => (
                  <li key={c.keys} className="flex justify-between gap-4">
                    <span className="font-mono text-white/80">{c.keys}</span>
                    <span className="text-white/50">{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                Gamepad (plug in and press a button)
              </div>
              <ul className="space-y-1">
                {PAD_CONTROLS.map((c) => (
                  <li key={c.keys} className="flex justify-between gap-4">
                    <span className="font-mono text-white/80">{c.keys}</span>
                    <span className="text-white/50">{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="relative max-w-3xl text-center text-[11px] leading-relaxed text-white/40">
            Every fighter has <span className="text-white/70">five specials</span>, a light and a heavy attack, a block,
            a dodge roll and a jump — plus their own skill and super. Specials use motion inputs: ↓↘→ + button for
            quarter circles, →↓↘ for dragon punches. Meter pays for EX specials (50) and supers (100).
          </p>
        </div>
      )}

      {screen === "select" && (
        <CharacterSelect
          onStart={(opts) => {
            setConfig(opts);
            setScreen("fight");
          }}
          onShowMoves={(id) => setMoveListFor(id)}
        />
      )}

      {screen === "fight" && config && (
        <GameCanvas
          config={config}
          touch={touch}
          onQuit={() => setScreen("select")}
          onShowMoves={() => setMoveListFor(config.p1)}
        />
      )}

      {moveListFor && <MoveList fighterId={moveListFor} onClose={() => setMoveListFor(null)} />}
    </div>
  );
}

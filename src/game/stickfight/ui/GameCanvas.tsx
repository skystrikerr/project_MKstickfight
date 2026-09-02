/** Mounts the WebGL canvas, owns the GameSession lifecycle and draws the HUD. */

import { useEffect, useRef, useState } from "react";
import type { AiLevel } from "../constants";
import { music } from "../engine/music";
import { loadSave, patchSave } from "../save";
import { GameSession, type GameMode, type HudState } from "../engine/game";
import { toKeyBindings } from "../keybinds";
import { DUMMY_ACTIONS, type DummyAction } from "../engine/training";
import { STAGE_THEMES, type StageTheme } from "../render/stage";
import { Announcement, Hud } from "./Hud";
import { TouchControls } from "./TouchControls";

export interface MatchConfig {
  p1: string;
  p2: string;
  mode: GameMode;
  aiLevel: AiLevel;
  rounds: number;
  stage: StageTheme | "random";
  /** Alternate colour ids; omitted means "classic". */
  p1Skin?: string;
  p2Skin?: string;
}

export function GameCanvas({
  config,
  onQuit,
  onShowMoves,
  onMatchEnd,
  touch,
}: {
  config: MatchConfig;
  onQuit: () => void;
  onShowMoves: () => void;
  /**
   * Handed the winning player index once the match is decided. Passing it
   * means somebody else owns what happens next - the arcade ladder, say - so
   * the built-in winner card stands down rather than offering a rematch on
   * top of theirs.
   */
  onMatchEnd?: (winner: number, finishing: { move: string; damage: number } | null) => void;
  touch: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [pads, setPads] = useState(0);
  const [muted, setMuted] = useState(() => loadSave().muted);
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [dummy, setDummy] = useState<DummyAction>("stand");

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const saved = loadSave();
    const session = new GameSession({
      p1: config.p1,
      p2: config.p2,
      mode: config.mode,
      aiLevel: config.aiLevel,
      roundsToWin: config.rounds,
      stage: config.stage,
      p1Skin: config.p1Skin,
      p2Skin: config.p2Skin,
      p1Keys: toKeyBindings(saved.p1Keys),
      motion: saved.motion,
    });
    sessionRef.current = session;
    // The button already reflects the saved setting; the audio has to be told.
    session.sfx.setVolume(saved.sfxVolume);
    music.setVolume(saved.musicVolume);
    if (muted) {
      session.sfx.setMuted(true);
      music.setMuted(true);
    }
    session.onHud = setHud;
    session.attach(canvas);
    session.start();
    setReady(true);
    setQuality(session.quality);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      session.resize(rect.width, rect.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    // Start button on a pad pauses, and we surface how many pads are live.
    const padPoll = window.setInterval(() => {
      if (!sessionRef.current) return;
      setPads(sessionRef.current.padCount());
      if (sessionRef.current.pollPause()) {
        sessionRef.current.paused = !sessionRef.current.paused;
        setPaused(sessionRef.current.paused);
      }
    }, 120);

    // WebAudio needs a gesture before it will make a sound.
    const wake = () => {
      session.sfx.resume();
      music.unlock();
    };
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyM") {
        const next = !session.sfx.muted;
        session.sfx.setMuted(next);
        music.setMuted(next);
        setMuted(next);
        patchSave({ muted: next });
      }
      if (e.code === "Escape") {
        session.paused = !session.paused;
        setPaused(session.paused);
      }
      if (e.code === "F2") session.toggleBoxes();
      if (e.code === "KeyR" && session.training) session.training.reset(session.match);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearInterval(padPoll);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("keydown", onKey);
      observer.disconnect();
      session.dispose();
      sessionRef.current = null;
    };
  }, [config.p1, config.p2, config.mode, config.aiLevel, config.rounds, config.stage]);

  // The match-end phase persists for many frames, so the report is latched.
  const reported = useRef(false);
  useEffect(() => {
    if (hud?.phase !== "matchEnd" || hud.matchWinner === null) {
      if (hud?.phase !== "matchEnd") reported.current = false;
      return;
    }
    if (reported.current) return;
    reported.current = true;
    onMatchEnd?.(hud.matchWinner, hud.finishingMove ? { move: hud.finishingMove, damage: hud.finishingDamage ?? 0 } : null);
  }, [hud?.phase, hud?.matchWinner, onMatchEnd]);

  const togglePause = () => {
    const s = sessionRef.current;
    if (!s) return;
    s.paused = !s.paused;
    setPaused(s.paused);
  };

  const rematch = () => {
    sessionRef.current?.restart();
    setPaused(false);
  };

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {hud && ready && (
        <>
          <Hud state={hud} roundsToWin={config.rounds} fighterIds={[config.p1, config.p2]} />
          <Announcement state={hud} />
        </>
      )}

      {touch && pads === 0 && sessionRef.current && <TouchControls keyboard={sessionRef.current.keyboard} />}

      {hud && hud.phase === "intro" && sessionRef.current && (
        <div className="pointer-events-none absolute bottom-10 left-1/2 z-20 -translate-x-1/2 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--bone-dim)]">
            {STAGE_THEMES[sessionRef.current.theme].name}
          </div>
          <div className="text-xs text-[#7e8f85]">
            {STAGE_THEMES[sessionRef.current.theme].blurb}
          </div>
        </div>
      )}

      {pads > 0 && (
        <div className="cut-sm pointer-events-none absolute bottom-3 left-3 z-20 border border-[var(--rule)] bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8aa87a]">
          {pads === 1 ? "Gamepad connected" : `${pads} gamepads connected`}
        </div>
      )}

      {hud?.tutorial && !hud.tutorial.complete && (
        <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex justify-center px-4 sm:top-32">
          <div className="cut-sm max-w-lg border border-[var(--rule)] bg-black/80 px-4 py-2.5 text-center backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">
              Lesson {hud.tutorial.index + 1} of {hud.tutorial.total} · {hud.tutorial.title}
            </div>
            <div className="mt-1 text-sm text-[var(--bone)]">{hud.tutorial.prompt}</div>
          </div>
        </div>
      )}


      {hud?.training && sessionRef.current?.training && (
        <div className="cut absolute left-3 top-36 z-20 w-56 border border-[var(--rule)] bg-black/80 p-3 text-[var(--bone)] backdrop-blur-sm sm:left-4 sm:top-40">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-display text-lg font-bold uppercase tracking-[0.15em] text-[var(--accent)]">Training</span>
            <button
              type="button"
              onClick={() => {
                const s = sessionRef.current;
                if (s?.training) s.training.reset(s.match);
              }}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bone-dim)] hover:text-[var(--bone)]"
            >
              Reset (R)
            </button>
          </div>

          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">Dummy</div>
          <div className="mb-3 grid grid-cols-2 gap-1">
            {DUMMY_ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                title={a.hint}
                onClick={() => {
                  const s = sessionRef.current;
                  if (!s?.training) return;
                  s.training.options.dummy = a.id;
                  setDummy(a.id);
                }}
                className={`px-1.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition ${
                  dummy === a.id
                    ? "bg-[var(--accent)] text-[var(--ink)]"
                    : "bg-white/5 text-[var(--bone-dim)] hover:bg-white/10 hover:text-[var(--bone)]"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">Last move</div>
          {hud.training.last ? (
            <>
              <div className="text-sm font-bold leading-tight">{hud.training.last.name}</div>
              {hud.training.last.notation && (
                <div className="mb-1.5 font-mono text-[11px] text-[var(--accent)]">{hud.training.last.notation}</div>
              )}
              <div className="grid grid-cols-3 gap-1 text-center">
                {[
                  ["Startup", hud.training.last.startup],
                  ["Active", hud.training.last.active],
                  ["Recovery", hud.training.last.recovery],
                ].map(([label, value]) => (
                  <div key={String(label)} className="bg-white/5 py-1">
                    <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--bone-dim)]">{label}</div>
                    <div className="font-mono text-sm font-bold">{value ?? "—"}</div>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[var(--bone-dim)]">
                <span>{hud.training.last.duration}f total</span>
                {hud.training.last.damage > 0 && <span>{hud.training.last.damage} dmg</span>}
              </div>
            </>
          ) : (
            <div className="text-xs leading-snug text-[var(--bone-dim)]">
              Throw something. Frame data appears here.
            </div>
          )}

          {hud.training.comboHits > 1 && (
            <div className="mt-2 border-l-2 border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 text-xs text-[var(--accent-hot)]">
              {hud.training.comboHits} hits · {hud.training.comboDamage} damage
            </div>
          )}
        </div>
      )}

      <div className="absolute right-2 top-36 z-20 flex flex-col gap-1.5 sm:right-4 sm:top-40">
        <button
          type="button"
          onClick={togglePause}
          className="cut-sm border border-[var(--rule)] bg-black/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)]"
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={() => {
            const s = sessionRef.current;
            if (!s) return;
            setQuality(s.toggleQuality());
          }}
          className="cut-sm border border-[var(--rule)] bg-black/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)]"
        >
          FX {quality === "high" ? "High" : "Low"}
        </button>
        <button
          type="button"
          onClick={() => {
            const s = sessionRef.current;
            if (!s) return;
            s.sfx.resume();
            s.sfx.setMuted(!s.sfx.muted);
            music.setMuted(s.sfx.muted);
            setMuted(s.sfx.muted);
            patchSave({ muted: s.sfx.muted });
          }}
          className="cut-sm border border-[var(--rule)] bg-black/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)]"
        >
          {muted ? "Sound off" : "Sound on"}
        </button>
        <button
          type="button"
          onClick={onShowMoves}
          className="cut-sm border border-[var(--rule)] bg-black/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)]"
        >
          Moves
        </button>
        <button
          type="button"
          onClick={onQuit}
          className="cut-sm border border-[var(--rule)] bg-black/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)]"
        >
          Quit
        </button>
      </div>

      {paused && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/70">
          <div className="font-display text-7xl font-bold uppercase tracking-[0.02em] text-[var(--bone)]">Paused</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={togglePause}
              className="cut-sm bg-[var(--accent)] px-8 py-2 font-display text-2xl font-bold uppercase tracking-[0.1em] text-[var(--ink)]"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onQuit}
              className="cut-sm border border-[var(--rule)] px-8 py-2 font-display text-2xl font-bold uppercase tracking-[0.1em] text-[var(--bone)]"
            >
              Quit
            </button>
          </div>
        </div>
      )}

      {hud?.phase === "matchEnd" && !onMatchEnd && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/75">
          <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-[var(--accent)]">Winner</div>
          <div className="font-display text-7xl font-bold uppercase tracking-[0.02em] text-[var(--bone)] sm:text-8xl">
            {hud.winnerName}
          </div>
          {hud.finishingMove && (
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--bone-dim)]">
              Finished with <span className="text-[var(--accent)]">{hud.finishingMove}</span>
              {hud.finishingDamage ? ` · ${hud.finishingDamage} dmg` : ""}
            </div>
          )}
          {hud.winQuote && (
            <p className="max-w-md border-l-2 border-[var(--rule)] pl-3 text-left text-sm text-[var(--bone-dim)]">
              “{hud.winQuote}”
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={rematch}
              className="cut-sm bg-[var(--accent)] px-8 py-2 font-display text-2xl font-bold uppercase tracking-[0.1em] text-[var(--ink)] hover:bg-[var(--accent-hot)]"
            >
              Rematch
            </button>
            <button
              type="button"
              onClick={onQuit}
              className="cut-sm border border-[var(--rule)] px-8 py-2 font-display text-2xl font-bold uppercase tracking-[0.1em] text-[var(--bone)] hover:bg-white/10"
            >
              Character select
            </button>
          </div>
        </div>
      )}

      {hud?.tutorial?.complete && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/75">
          <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-[var(--accent)]">Tutorial</div>
          <div className="font-display text-6xl font-bold uppercase tracking-[0.02em] text-[var(--bone)] sm:text-7xl">
            All done
          </div>
          <p className="max-w-md border-l-2 border-[var(--rule)] pl-3 text-left text-sm text-[var(--bone-dim)]">
            That is every basic. The move list has everything else - every fighter's own specials, strings and skill.
          </p>
          <button
            type="button"
            onClick={onQuit}
            className="cut mt-2 bg-[var(--accent)] px-10 py-2.5 font-display text-2xl font-bold uppercase tracking-[0.1em] text-[var(--ink)] hover:bg-[var(--accent-hot)]"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

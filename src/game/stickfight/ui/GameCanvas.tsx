/** Mounts the WebGL canvas, owns the GameSession lifecycle and draws the HUD. */

import { useEffect, useRef, useState } from "react";
import type { AiLevel } from "../constants";
import { GameSession, type GameMode, type HudState } from "../engine/game";
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
  touch,
}: {
  config: MatchConfig;
  onQuit: () => void;
  onShowMoves: () => void;
  touch: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [pads, setPads] = useState(0);
  const [muted, setMuted] = useState(false);
  const [quality, setQuality] = useState<"high" | "low">("high");

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const session = new GameSession({
      p1: config.p1,
      p2: config.p2,
      mode: config.mode,
      aiLevel: config.aiLevel,
      roundsToWin: config.rounds,
      stage: config.stage,
      p1Skin: config.p1Skin,
      p2Skin: config.p2Skin,
    });
    sessionRef.current = session;
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
    const wake = () => session.sfx.resume();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyM") {
        const next = !session.sfx.muted;
        session.sfx.setMuted(next);
        setMuted(next);
      }
      if (e.code === "Escape") {
        session.paused = !session.paused;
        setPaused(session.paused);
      }
      if (e.code === "F2") session.toggleBoxes();
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
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
            {STAGE_THEMES[sessionRef.current.theme].name}
          </div>
          <div className="text-[11px] italic text-white/35">
            {STAGE_THEMES[sessionRef.current.theme].blurb}
          </div>
        </div>
      )}

      {pads > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-md border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          {pads === 1 ? "Gamepad connected" : `${pads} gamepads connected`}
        </div>
      )}

      <div className="absolute right-2 top-36 z-20 flex flex-col gap-1.5 sm:right-4 sm:top-40">
        <button
          type="button"
          onClick={togglePause}
          className="rounded-md border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-black/70"
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
          className="rounded-md border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-black/70"
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
            setMuted(s.sfx.muted);
          }}
          className="rounded-md border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-black/70"
        >
          {muted ? "Sound off" : "Sound on"}
        </button>
        <button
          type="button"
          onClick={onShowMoves}
          className="rounded-md border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-black/70"
        >
          Moves
        </button>
        <button
          type="button"
          onClick={onQuit}
          className="rounded-md border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-black/70"
        >
          Quit
        </button>
      </div>

      {paused && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/70">
          <div className="text-5xl font-black uppercase italic tracking-tight text-white">Paused</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={togglePause}
              className="rounded-md bg-amber-400 px-6 py-2 font-bold uppercase tracking-wider text-black"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onQuit}
              className="rounded-md border border-white/20 px-6 py-2 font-bold uppercase tracking-wider text-white"
            >
              Quit
            </button>
          </div>
        </div>
      )}

      {hud?.phase === "matchEnd" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/75">
          <div className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">Winner</div>
          <div className="text-5xl font-black uppercase italic tracking-tight text-white sm:text-6xl">
            {hud.winnerName}
          </div>
          {hud.winQuote && <p className="max-w-md text-center text-sm italic text-white/60">“{hud.winQuote}”</p>}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={rematch}
              className="rounded-md bg-amber-400 px-6 py-2 font-bold uppercase tracking-wider text-black hover:bg-amber-300"
            >
              Rematch
            </button>
            <button
              type="button"
              onClick={onQuit}
              className="rounded-md border border-white/20 px-6 py-2 font-bold uppercase tracking-wider text-white hover:bg-white/10"
            >
              Character select
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** In-match HUD: portraits, health, super meter, guard, ammo, timer and rounds. */

import { useEffect, useRef, useState } from "react";
import type { HudState, PlayerHud } from "../engine/game";
import { getFighter } from "../fighters";
import { FighterPortrait } from "./Portrait";

/** Angled frame used by every bar, so the HUD reads as one piece. */
const SKEW = "skewX(-14deg)";

function HealthBar({ player, side }: { player: PlayerHud; side: "left" | "right" }) {
  const pct = Math.max(0, (player.health / player.maxHealth) * 100);
  // Delayed "chip" bar that drains behind the real one.
  const [ghost, setGhost] = useState(pct);
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    if (pct >= ghost) {
      setGhost(pct);
      return;
    }
    if (timeout.current) window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setGhost(pct), 420);
    return () => {
      if (timeout.current) window.clearTimeout(timeout.current);
    };
  }, [pct, ghost]);

  const flip = side === "right";
  const low = pct <= 25;

  return (
    <div className={`flex flex-1 flex-col gap-1 ${flip ? "items-end" : "items-start"}`}>
      <div className={`flex w-full items-baseline gap-2 ${flip ? "flex-row-reverse" : ""}`}>
        <span className="text-sm font-black uppercase italic tracking-wide text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
          {player.name}
        </span>
        <span className="hidden text-[10px] uppercase tracking-[0.2em] text-white/45 sm:inline">{player.title}</span>
      </div>

      <div
        className="relative h-6 w-full overflow-hidden border-y-2 border-black/70 bg-black/70 shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
        style={{ transform: SKEW }}
      >
        <div className={`absolute inset-0 ${flip ? "rotate-180" : ""}`}>
          {/* Damage taken, draining a beat later. */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-b from-rose-400 to-rose-700 transition-[width] duration-500"
            style={{ width: `${ghost}%` }}
          />
          {/* Current health. */}
          <div
            className={`absolute inset-y-0 left-0 transition-[width] duration-100 ${
              low
                ? "animate-pulse bg-gradient-to-b from-red-300 via-red-500 to-red-700"
                : "bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600"
            }`}
            style={{ width: `${pct}%` }}
          />
          {/* Gloss. */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
          {/* Tick marks every 25%. */}
          {[25, 50, 75].map((t) => (
            <div key={t} className="absolute inset-y-0 w-px bg-black/40" style={{ left: `${t}%` }} />
          ))}
        </div>
      </div>

      <div className={`flex items-center gap-2 ${flip ? "flex-row-reverse" : ""}`}>
        {/* Guard meter */}
        <div className="h-1.5 w-24 overflow-hidden bg-black/60 sm:w-32" style={{ transform: SKEW }}>
          <div
            className={`h-full transition-[width] duration-200 ${
              player.guard < 30 ? "bg-rose-400" : "bg-sky-400/90"
            } ${flip ? "ml-auto" : ""}`}
            style={{ width: `${Math.max(0, player.guard)}%` }}
          />
        </div>

        {player.resource && (
          <div className={`flex items-center gap-1.5 ${flip ? "flex-row-reverse" : ""}`}>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/55">
              {player.resource.name}
            </span>
            {player.resource.pips ? (
              <div className={`flex gap-1 ${flip ? "flex-row-reverse" : ""}`}>
                {Array.from({ length: player.resource.max }).map((_, i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rotate-45 border border-black/60"
                    style={{
                      background:
                        i < Math.floor(player.resource!.value) ? player.resource!.color : "rgba(0,0,0,0.45)",
                      boxShadow:
                        i < Math.floor(player.resource!.value)
                          ? `0 0 6px ${player.resource!.color}99`
                          : "none",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="h-2 w-24 overflow-hidden bg-black/60" style={{ transform: SKEW }}>
                <div
                  className={`h-full transition-[width] duration-200 ${flip ? "ml-auto" : ""}`}
                  style={{
                    width: `${(player.resource.value / player.resource.max) * 100}%`,
                    background: player.resource.color,
                    boxShadow: `0 0 8px ${player.resource.color}66`,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MeterBar({ player, side }: { player: PlayerHud; side: "left" | "right" }) {
  const stocks = Math.floor(player.meter / 100);
  const partial = (player.meter % 100) / 100;
  const flip = side === "right";
  return (
    <div className={`flex items-center gap-1.5 ${flip ? "flex-row-reverse" : ""}`}>
      <span
        className={`text-[10px] font-black uppercase italic tracking-widest ${
          stocks > 0 ? "text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" : "text-white/40"
        }`}
      >
        {stocks > 0 ? "Super" : "Meter"}
      </span>
      <div className={`flex gap-1 ${flip ? "flex-row-reverse" : ""}`}>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-3 w-20 overflow-hidden border border-black/70 bg-black/60 sm:w-28"
            style={{ transform: SKEW }}
          >
            <div
              className={`h-full transition-[width] duration-150 ${
                i < stocks
                  ? "bg-gradient-to-b from-cyan-200 via-cyan-400 to-sky-600 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                  : "bg-gradient-to-b from-sky-400/80 to-sky-700/80"
              } ${flip ? "ml-auto" : ""}`}
              style={{ width: i < stocks ? "100%" : i === stocks ? `${partial * 100}%` : "0%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function RoundPips({ wins, roundsToWin, side }: { wins: number; roundsToWin: number; side: "left" | "right" }) {
  return (
    <div className={`flex gap-1 ${side === "right" ? "flex-row-reverse" : ""}`}>
      {Array.from({ length: roundsToWin }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rotate-45 border-2 border-black/70 transition ${
            i < wins ? "bg-amber-400 shadow-[0_0_10px_3px_rgba(251,191,36,0.7)]" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

/** Portrait chip beside the health bar, tinted by the fighter's accent. */
function PortraitChip({ id, accent, side }: { id: string; accent: string; side: "left" | "right" }) {
  const def = getFighter(id);
  return (
    <div
      className="relative hidden h-14 w-14 shrink-0 overflow-hidden border-2 border-black/70 sm:block"
      style={{ transform: SKEW, background: `linear-gradient(160deg, ${accent}44, rgba(0,0,0,0.75))` }}
    >
      <div style={{ transform: "skewX(14deg)" }}>
        <FighterPortrait def={def} className="h-full w-full" facing={side === "left" ? 1 : -1} />
      </div>
    </div>
  );
}

export function Hud({
  state,
  roundsToWin,
  fighterIds,
}: {
  state: HudState;
  roundsToWin: number;
  fighterIds: [string, string];
}) {
  const [p1, p2] = state.players;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 select-none p-2 sm:p-4">
      {/* Soft darkening behind the bars so they stay readable on bright stages. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" />

      <div className="relative flex items-start gap-2 sm:gap-3">
        <PortraitChip id={fighterIds[0]} accent={p1.accent} side="left" />
        <HealthBar player={p1} side="left" />

        <div className="flex min-w-[84px] flex-col items-center gap-1.5">
          <div
            className={`border-2 border-black/70 bg-black/70 px-3 py-0.5 font-mono text-3xl font-black tabular-nums sm:text-4xl ${
              state.timer <= 10 ? "animate-pulse text-red-400" : "text-amber-300"
            }`}
            style={{ transform: SKEW }}
          >
            <span style={{ transform: "skewX(14deg)", display: "inline-block" }}>
              {String(Math.max(0, state.timer)).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <RoundPips wins={p1.wins} roundsToWin={roundsToWin} side="left" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">R{state.round}</span>
            <RoundPips wins={p2.wins} roundsToWin={roundsToWin} side="right" />
          </div>
        </div>

        <HealthBar player={p2} side="right" />
        <PortraitChip id={fighterIds[1]} accent={p2.accent} side="right" />
      </div>

      <div className="relative mt-2 flex items-center justify-between">
        <MeterBar player={p1} side="left" />
        <MeterBar player={p2} side="right" />
      </div>

      {/* Combo counters */}
      <div className="relative mt-3 flex items-start justify-between px-1">
        <ComboCounter hits={p1.combo} damage={p1.comboDamage} side="left" />
        <ComboCounter hits={p2.combo} damage={p2.comboDamage} side="right" />
      </div>
    </div>
  );
}

function ComboCounter({ hits, damage, side }: { hits: number; damage: number; side: "left" | "right" }) {
  if (hits <= 1) return <div className="h-16" />;
  const big = hits >= 6;
  return (
    <div
      key={hits}
      className={`h-16 ${side === "right" ? "text-right" : "text-left"} ${
        side === "right" ? "animate-in slide-in-from-right-4" : "animate-in slide-in-from-left-4"
      } fade-in duration-150`}
    >
      <div className="flex items-baseline gap-1.5" style={{ flexDirection: side === "right" ? "row-reverse" : "row" }}>
        <span
          className={`font-black italic tabular-nums drop-shadow-[3px_3px_0_rgba(0,0,0,0.85)] ${
            big ? "text-5xl text-amber-200" : "text-4xl text-amber-300"
          }`}
        >
          {hits}
        </span>
        <span className="text-lg font-black uppercase italic text-white/85 drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
          Hits
        </span>
      </div>
      <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/55">
        {Math.round(damage)} damage
      </div>
    </div>
  );
}

export function Announcement({ state }: { state: HudState }) {
  if (!state.announcement) return null;
  const ko = state.announcement.includes("K.O.");
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div
        key={state.announcement}
        className={`animate-in zoom-in-50 fade-in duration-200 text-center font-black uppercase italic tracking-tighter ${
          ko
            ? "text-7xl text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.7)] sm:text-9xl"
            : "text-5xl text-amber-300 drop-shadow-[0_0_24px_rgba(251,191,36,0.6)] sm:text-7xl"
        }`}
        style={{ WebkitTextStroke: "2px rgba(0,0,0,0.85)" }}
      >
        {state.announcement}
      </div>
    </div>
  );
}

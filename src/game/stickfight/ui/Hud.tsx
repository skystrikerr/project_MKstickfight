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
        <span className="font-display text-2xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)] drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
          {player.name}
        </span>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--bone)]/70 drop-shadow-[1px_1px_0_rgba(0,0,0,0.9)] sm:inline">
          {player.title}
        </span>
      </div>

      <div
        className="relative h-6 w-full overflow-hidden border-2 border-black/80 bg-black/75"
        style={{ transform: SKEW }}
      >
        <div className={`absolute inset-0 ${flip ? "rotate-180" : ""}`}>
          {/* Damage taken, draining a beat later. */}
          <div
            className="absolute inset-y-0 left-0 bg-[#5a1f14] transition-[width] duration-500"
            style={{ width: `${ghost}%` }}
          />
          {/* Current health. */}
          <div
            className={`absolute inset-y-0 left-0 transition-[width] duration-100 ${
              low ? "animate-pulse bg-[var(--blood)]" : "bg-[var(--health)]"
            }`}
            style={{ width: `${pct}%` }}
          />
          {/* One hard highlight line along the top. A full gloss gradient makes
              the bar look like a glass pill from a web dashboard. */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/35" />
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
              player.guard < 30 ? "bg-[var(--blood)]" : "bg-[var(--guard)]"
            } ${flip ? "ml-auto" : ""}`}
            style={{ width: `${Math.max(0, player.guard)}%` }}
          />
        </div>

        {player.resource && (
          <div className={`flex items-center gap-1.5 ${flip ? "flex-row-reverse" : ""}`}>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--bone)]/70 drop-shadow-[1px_1px_0_rgba(0,0,0,0.9)]">
              {player.resource.name}
            </span>
            {/* Spare magazines. Knowing the belt is empty matters more than
                knowing the magazine is, so it sits next to the name. */}
            {player.resource.spares !== undefined && (
              <span
                className="font-mono text-[9px] uppercase tracking-[0.15em] tabular-nums"
                style={{ color: player.resource.spares > 0 ? player.resource.color : "#ff6b6b" }}
                title={player.resource.spareName ?? "spare reloads"}
              >
                {player.resource.spareName ?? "Spare"} &times;{player.resource.spares}
              </span>
            )}
            {player.resource.pips ? (
              <div className={`flex gap-1 ${flip ? "flex-row-reverse" : ""}`}>
                {Array.from({ length: player.resource.max }).map((_, i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rotate-45 border border-black/60"
                    style={{
                      // Filled or empty, flat either way - a lit pip used to
                      // carry a 6px glow, which is the tell this interface is
                      // meant to be free of. The colour step is the signal.
                      background:
                        i < Math.floor(player.resource!.value) ? player.resource!.color : "rgba(0,0,0,0.45)",
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
        className={`font-display text-lg font-bold uppercase tracking-[0.15em] drop-shadow-[1px_1px_0_rgba(0,0,0,0.9)] ${
          stocks > 0 ? "text-[var(--accent-hot)]" : "text-[var(--bone)]/60"
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
                i < stocks ? "bg-[var(--accent-hot)]" : "bg-[var(--accent)]"
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
            i < wins ? "bg-[var(--accent-hot)]" : "bg-black/50"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Portrait chip beside the health bar, tinted by the fighter's accent.
 *
 * Flat fill and a hard accent edge, not the diagonal tint-to-black gradient
 * this used to carry. The colour identifies the fighter; the gradient was
 * only ever making the chip look like a card.
 */
function PortraitChip({ id, accent, side }: { id: string; accent: string; side: "left" | "right" }) {
  const def = getFighter(id);
  return (
    <div
      className="relative hidden h-14 w-14 shrink-0 overflow-hidden border-2 sm:block"
      style={{ transform: SKEW, background: `${accent}26`, borderColor: accent }}
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
      {/*
        A flat band behind the bars so they stay readable on bright stages,
        ending on a hard rule. The fade-to-transparent scrim this replaces is
        the same soft wash the rest of the interface has been stripped of -
        and a band that admits where it ends reads as part of the machine
        rather than as an attempt to hide that anything is there at all.
      */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[126px] border-b-2 border-black/70 bg-black/55" />

      <div className="relative flex items-start gap-2 sm:gap-3">
        <PortraitChip id={fighterIds[0]} accent={p1.accent} side="left" />
        <HealthBar player={p1} side="left" />

        <div className="flex min-w-[84px] flex-col items-center gap-1.5">
          <div
            className={`border-2 border-black/70 bg-black/70 px-3 py-0.5 font-mono text-3xl font-medium tabular-nums sm:text-4xl ${
              state.timer <= 10 ? "animate-pulse text-[var(--blood)]" : "text-[var(--accent)]"
            }`}
            style={{ transform: SKEW }}
          >
            <span style={{ transform: "skewX(14deg)", display: "inline-block" }}>
              {String(Math.max(0, state.timer)).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <RoundPips wins={p1.wins} roundsToWin={roundsToWin} side="left" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">R{state.round}</span>
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
          className={`font-display font-bold tabular-nums drop-shadow-[3px_3px_0_rgba(0,0,0,0.85)] ${
            big ? "text-6xl text-[var(--accent-hot)]" : "text-5xl text-[var(--accent)]"
          }`}
        >
          {hits}
        </span>
        <span className="font-display text-2xl font-bold uppercase tracking-[0.02em] text-[var(--bone)] drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
          Hits
        </span>
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--bone)] drop-shadow-[1px_1px_0_rgba(0,0,0,0.9)]">
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
        // Snaps in at size with no fade, and throws a hard offset shadow
        // rather than the coloured bloom it used to sit in - a KO should land
        // like a stamp, not glow like a notification.
        className={`animate-in zoom-in-95 duration-100 text-center font-display font-bold uppercase tracking-[0.04em] drop-shadow-[6px_6px_0_rgba(0,0,0,0.9)] ${
          ko ? "text-8xl text-[var(--blood)] sm:text-[10rem]" : "text-6xl text-[var(--accent-hot)] sm:text-8xl"
        }`}
        style={{ WebkitTextStroke: "2px rgba(0,0,0,0.85)" }}
      >
        {state.announcement}
      </div>
    </div>
  );
}

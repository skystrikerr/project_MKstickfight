/**
 * The screens between arcade fights: the versus card, the continue prompt
 * when you lose, and the ending when you finish.
 *
 * These are presentation only. The run itself lives in the page, and the
 * tower it walks comes from `ladder.ts`, so nothing here decides anything.
 */

import { getFighter } from "../fighters";
import { LADDER_LENGTH, type LadderStep } from "../ladder";
import { FighterPortrait } from "./Portrait";

const STAGE_LABEL: Record<LadderStep["stage"], string> = {
  climb: "Fight",
  rival: "Rival",
  mirror: "Mirror",
  final: "Final",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[var(--ink)] p-6">
      {children}
    </div>
  );
}

/** Shown before each fight: who you are, who is next, and how far in you are. */
export function VersusCard({
  playerId,
  playerSkinAccent,
  step,
  onFight,
  onQuit,
}: {
  playerId: string;
  playerSkinAccent?: string;
  step: LadderStep;
  onFight: () => void;
  onQuit: () => void;
}) {
  const me = getFighter(playerId);
  const them = getFighter(step.opponent);
  return (
    <Shell>
      <div className="flex w-full max-w-3xl items-center gap-3">
        <span className="h-px flex-1 bg-[var(--rule)]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--bone-dim)]">
          {STAGE_LABEL[step.stage]} {step.index} of {LADDER_LENGTH} · {step.level}
        </span>
        <span className="h-px flex-1 bg-[var(--rule)]" />
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {[me, them].map((def, i) => (
          <div key={i} className="contents">
            {i === 1 && (
              <span className="font-display text-4xl font-bold uppercase tracking-[0.08em] text-[var(--bone-dim)] sm:text-5xl">
                vs
              </span>
            )}
            <div className="flex w-44 flex-col items-center sm:w-60">
              <FighterPortrait def={def} className="h-48 w-44 sm:h-64 sm:w-60" facing={i === 0 ? 1 : -1} />
              <span
                className="mt-1 h-px w-10"
                style={{ background: i === 0 ? (playerSkinAccent ?? def.palette.accent) : def.palette.accent }}
              />
              {/* Two lines of room, so a long name does not drag its own
                  subtitle out of line with the other fighter's. */}
              <span className="mt-2 flex h-11 items-start justify-center text-center font-display text-lg font-bold uppercase leading-tight tracking-[0.08em]">
                {def.name}
              </span>
              <span className="text-center font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">
                {i === 0 ? "You" : def.archetype}
              </span>
            </div>
          </div>
        ))}
      </div>

      {step.caption && (
        <p className="max-w-md border-l-2 border-[var(--rule)] pl-3 text-sm leading-snug text-[var(--bone-dim)]">
          {step.caption}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          autoFocus
          onClick={onFight}
          className="cut bg-[var(--accent)] px-12 py-3 font-display text-2xl font-bold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:bg-[var(--accent-hot)]"
        >
          Fight
        </button>
        <button
          type="button"
          onClick={onQuit}
          className="cut-sm border border-[var(--rule)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)]"
        >
          Give up
        </button>
      </div>
    </Shell>
  );
}

/**
 * Shown on a loss. Continues are unlimited on purpose: this is a casual
 * ladder, and a run that ends for good on fight three is a run nobody sees
 * the end of. What it costs you is the count, which is shown at the end.
 */
export function ContinuePrompt({
  step,
  continues,
  onRetry,
  onQuit,
}: {
  step: LadderStep;
  continues: number;
  onRetry: () => void;
  onQuit: () => void;
}) {
  const them = getFighter(step.opponent);
  return (
    <Shell>
      <div className="font-display text-5xl font-bold uppercase tracking-[0.08em] text-[var(--blood)] sm:text-6xl">
        Defeated
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">
        {them.name} · fight {step.index} of {LADDER_LENGTH}
        {continues > 0 && ` · ${continues} continue${continues === 1 ? "" : "s"} used`}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          autoFocus
          onClick={onRetry}
          className="cut bg-[var(--accent)] px-12 py-3 font-display text-2xl font-bold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:bg-[var(--accent-hot)]"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onQuit}
          className="cut-sm border border-[var(--rule)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)]"
        >
          Character select
        </button>
      </div>
    </Shell>
  );
}

/** Shown once the eighth fight is won: what actually happened to them. */
export function EndingCard({
  playerId,
  ending,
  level,
  continues,
  onDone,
}: {
  playerId: string;
  ending: string;
  level: string;
  continues: number;
  onDone: () => void;
}) {
  const me = getFighter(playerId);
  return (
    <Shell>
      <div className="flex w-full max-w-2xl flex-col items-center gap-4 overflow-y-auto">
        <FighterPortrait def={me} className="h-44 w-40" />
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--accent)]">
            Ladder cleared · {level}
            {continues === 0 ? " · no continues" : ` · ${continues} continue${continues === 1 ? "" : "s"}`}
          </div>
          <div className="mt-1 font-display text-4xl font-bold uppercase leading-none tracking-[0.08em] sm:text-5xl">
            {me.name}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: me.palette.accent }}>
            {me.title} · {me.era}
          </div>
        </div>
        <p className="border-l-2 border-[var(--accent)] pl-4 text-left text-[15px] leading-relaxed text-[var(--bone-dim)]">
          {ending}
        </p>
        <button
          type="button"
          autoFocus
          onClick={onDone}
          className="cut mt-2 bg-[var(--accent)] px-12 py-3 font-display text-2xl font-bold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:bg-[var(--accent-hot)]"
        >
          Continue
        </button>
      </div>
    </Shell>
  );
}

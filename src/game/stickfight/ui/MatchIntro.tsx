/** A pre-fight presentation for ordinary two-player Versus matches. */
import { getFighter } from "../fighters";
import type { FighterDef } from "../types";
import { FighterPortrait } from "./Portrait";
import { portraitFor } from "./art";
import type { MatchConfig } from "./GameCanvas";
import matchIntroArt from "@/assets/ui/match-intro.webp";

function Challenger({ fighter, side }: { fighter: FighterDef; side: 1 | -1 }) {
  const portrait = portraitFor(fighter.id);
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div className="relative h-40 w-[36vw] max-w-56 overflow-hidden border border-[#96703b] bg-[#130f0e] sm:h-64 sm:w-56">
        {portrait ? (
          <img src={portrait} alt="" className="h-full w-full object-cover object-[50%_20%]" />
        ) : (
          <FighterPortrait def={fighter} className="h-full w-full" facing={side} />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
      <div className="max-w-full truncate text-center font-display text-lg font-bold uppercase tracking-wide text-[var(--bone)] sm:text-3xl">
        {fighter.name}
      </div>
      <div className="hidden text-center font-mono text-[9px] uppercase tracking-widest text-[var(--bone-dim)] sm:block">
        {fighter.title}
      </div>
    </div>
  );
}

export function MatchIntro({
  config,
  onFight,
  onBack,
}: {
  config: Pick<MatchConfig, "p1" | "p2">;
  onFight: () => void;
  onBack: () => void;
}) {
  const p1 = getFighter(config.p1);
  const p2 = getFighter(config.p2);
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden bg-[#0b0908] px-4 py-6 text-[var(--bone)]">
      <img src={matchIntroArt} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-black/25" />
      <div className="relative z-10 font-mono text-[10px] uppercase tracking-[0.35em] text-[#e9c183]">
        Versus · Ready to fight
      </div>
      <div className="relative z-10 flex w-full max-w-3xl items-center justify-center gap-2 sm:gap-6">
        <Challenger fighter={p1} side={1} />
        <span className="shrink-0 font-display text-4xl font-black italic text-[#f1d49b] drop-shadow-[3px_3px_0_#000] sm:text-7xl">
          VS
        </span>
        <Challenger fighter={p2} side={-1} />
      </div>
      <div className="relative z-10 flex items-center gap-3">
        <button type="button" autoFocus onClick={onFight} className="cut bg-[var(--accent)] px-8 py-2 font-display text-2xl font-bold uppercase tracking-wider text-[var(--ink)] transition hover:bg-[var(--accent-hot)] sm:px-12 sm:py-3">
          Fight
        </button>
        <button type="button" onClick={onBack} className="cut-sm border border-[#aa8353] bg-black/65 px-5 py-2 font-mono text-[11px] uppercase tracking-wider text-[var(--bone)] transition hover:border-[#edc680] sm:py-3">
          Back
        </button>
      </div>
    </div>
  );
}

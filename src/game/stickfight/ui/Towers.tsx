/**
 * The tower screens: choosing a tower, the card before each floor, and the
 * two ways a climb ends.
 *
 * Presentation only, exactly like `Arcade.tsx` - the run lives in the page and
 * the tower it walks comes from `towers.ts`, so nothing here decides anything.
 * The one thing these screens owe the player is honesty about the modifiers:
 * a tower that changes the rules without telling you first is not difficult,
 * it is just unfair, so the floor card lists every one of them before you
 * commit to the fight.
 */

import { getFighter } from "../fighters";
import { MODIFIER_BY_ID, TOWER_BY_ID, type Tower, type TowerFloor } from "../towers";
import { FighterPortrait } from "./Portrait";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[var(--ink)] p-6">
      {children}
    </div>
  );
}

const PRIMARY =
  "cut bg-[var(--accent)] px-12 py-3 font-display text-3xl font-bold uppercase tracking-[0.12em] text-[var(--ink)] transition hover:bg-[var(--accent-hot)]";
const SECONDARY =
  "cut-sm border border-[var(--rule)] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone-dim)] transition hover:border-[var(--accent)] hover:text-[var(--bone)]";

function Rule({ label }: { label: string }) {
  return (
    <div className="flex w-full max-w-3xl items-center gap-3">
      <span className="h-px flex-1 bg-[var(--rule)]" />
      <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--bone-dim)]">{label}</span>
      <span className="h-px flex-1 bg-[var(--rule)]" />
    </div>
  );
}

/**
 * One modifier, coloured by who it is aimed at.
 *
 * Colour carries the same meaning everywhere else in the game - the accent is
 * yours, the blood red is damage coming at you - so a player can read a floor
 * card at a glance and only stop to read the words on the ones working
 * against them.
 */
function ModifierRow({ id }: { id: string }) {
  const mod = MODIFIER_BY_ID[id];
  if (!mod) return null;
  const tint =
    mod.weight > 0 ? "var(--accent)" : mod.weight < 0 ? "var(--blood)" : "var(--bone-dim)";
  return (
    <li className="flex gap-3 border-l-2 pl-3" style={{ borderColor: tint }}>
      <div className="min-w-0">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: tint }}>
          {mod.name}
        </div>
        <div className="text-[13px] leading-snug text-[var(--bone-dim)]">{mod.desc}</div>
      </div>
    </li>
  );
}

/** The tower list. Shows what each one asks for and how far you have got. */
export function TowerSelect({
  towers,
  records,
  onPick,
  onQuit,
}: {
  towers: Tower[];
  /** Tower id -> most floors ever cleared. */
  records: Record<string, number>;
  onPick: (towerId: string) => void;
  onQuit: () => void;
}) {
  return (
    <Shell>
      <Rule label="Towers" />
      <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-3">
        {towers.map((t) => {
          const best = records[t.id] ?? 0;
          const done = best >= t.floors;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.id)}
              className="cut-sm group flex flex-col gap-2 border border-[var(--rule)] p-4 text-left transition hover:border-[var(--accent)]"
            >
              <div className="font-display text-2xl font-bold uppercase leading-none tracking-[0.02em] group-hover:text-[var(--accent)]">
                {t.name}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--bone-dim)]">
                {t.survival ? "Endless" : `${t.floors} floors`} · from {t.base}
                {t.modifiers[1] > 0 && " · modifiers"}
              </div>
              <p className="text-[13px] leading-snug text-[var(--bone-dim)]">{t.blurb}</p>
              <div
                className="mt-auto pt-2 font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: best ? "var(--accent)" : "var(--bone-dim)" }}
              >
                {best === 0
                  ? "Never attempted"
                  : done
                    ? "Cleared"
                    : `Best: ${best} floor${best === 1 ? "" : "s"}`}
              </div>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onQuit} className={SECONDARY}>
        Back
      </button>
    </Shell>
  );
}

/** Shown before each floor: who is next, and exactly what the rules are. */
export function FloorCard({
  playerId,
  playerSkinAccent,
  tower,
  floor,
  carry,
  onFight,
  onQuit,
}: {
  playerId: string;
  playerSkinAccent?: string;
  tower: Tower;
  floor: TowerFloor;
  /** Survival only: the health you are taking in, as a fraction of your bar. */
  carry: number | null;
  onFight: () => void;
  onQuit: () => void;
}) {
  const me = getFighter(playerId);
  const them = getFighter(floor.opponent);
  return (
    <Shell>
      <Rule
        label={`${tower.name} · Floor ${floor.index}${tower.survival ? "" : ` of ${tower.floors}`} · ${floor.level}`}
      />

      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {[me, them].map((def, i) => (
          <div key={i} className="contents">
            {i === 1 && (
              <span className="font-display text-5xl font-bold uppercase tracking-[0.02em] text-[var(--bone-dim)] sm:text-7xl">
                vs
              </span>
            )}
            <div className="flex w-40 flex-col items-center sm:w-52">
              <FighterPortrait def={def} className="h-40 w-40 sm:h-52 sm:w-52" facing={i === 0 ? 1 : -1} />
              <span
                className="mt-1 h-px w-10"
                style={{ background: i === 0 ? (playerSkinAccent ?? def.palette.accent) : def.palette.accent }}
              />
              <span className="mt-2 flex h-11 items-start justify-center text-center font-display text-2xl font-bold uppercase leading-tight tracking-[0.02em]">
                {def.name}
              </span>
              <span className="text-center font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--bone-dim)]">
                {i === 0 ? "You" : def.archetype}
              </span>
            </div>
          </div>
        ))}
      </div>

      {carry !== null && (
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--bone-dim)]">
          Carrying <span style={{ color: carry < 0.34 ? "var(--blood)" : "var(--accent)" }}>{Math.round(carry * 100)}%</span> health
        </div>
      )}

      {floor.modifiers.length > 0 ? (
        <ul className="flex w-full max-w-xl flex-col gap-2">
          {floor.modifiers.map((id) => (
            <ModifierRow key={id} id={id} />
          ))}
        </ul>
      ) : (
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--bone-dim)]">
          No modifiers · straight fight
        </p>
      )}

      <div className="flex gap-2">
        <button type="button" autoFocus onClick={onFight} className={PRIMARY}>
          Fight
        </button>
        <button type="button" onClick={onQuit} className={SECONDARY}>
          Give up
        </button>
      </div>
    </Shell>
  );
}

/**
 * Shown on a loss. Survival has no retry - that is the whole point of it -
 * so the button it offers is the one that actually exists.
 */
export function TowerLost({
  tower,
  floor,
  cleared,
  best,
  onRetry,
  onQuit,
}: {
  tower: Tower;
  floor: TowerFloor;
  cleared: number;
  /** Best run ever on this tower, for the "you did better once" line. */
  best: number;
  onRetry: () => void;
  onQuit: () => void;
}) {
  const them = getFighter(floor.opponent);
  const survival = !!tower.survival;
  return (
    <Shell>
      <div className="font-display text-7xl font-bold uppercase tracking-[0.02em] text-[var(--blood)] sm:text-8xl">
        Defeated
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--bone-dim)]">
        {them.name} · {tower.name} · floor {floor.index}
      </p>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
        {cleared} floor{cleared === 1 ? "" : "s"} cleared
        {best > cleared && ` · best ${best}`}
      </p>
      <div className="flex gap-2">
        {!survival && (
          <button type="button" autoFocus onClick={onRetry} className={PRIMARY}>
            Continue
          </button>
        )}
        <button type="button" autoFocus={survival} onClick={onQuit} className={survival ? PRIMARY : SECONDARY}>
          {survival ? "Done" : "Give up"}
        </button>
      </div>
    </Shell>
  );
}

/** Shown when the top floor goes down. */
export function TowerCleared({
  playerId,
  tower,
  cleared,
  onDone,
}: {
  playerId: string;
  tower: Tower;
  cleared: number;
  onDone: () => void;
}) {
  const me = getFighter(playerId);
  return (
    <Shell>
      <FighterPortrait def={me} className="h-44 w-40" />
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--accent)]">
          Tower cleared · {cleared} floor{cleared === 1 ? "" : "s"}
        </div>
        <div className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-[0.02em] sm:text-6xl">
          {tower.name}
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: me.palette.accent }}>
          {me.name} · {me.title}
        </div>
      </div>
      <button type="button" autoFocus onClick={onDone} className={PRIMARY}>
        Continue
      </button>
    </Shell>
  );
}

/** Re-exported so the page does not have to reach into the data module too. */
export { TOWER_BY_ID };

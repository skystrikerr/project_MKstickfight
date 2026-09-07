/**
 * A faction's mark, for the corner of a fighter's card.
 *
 * Falls back to a coloured disc carrying the faction's initial when there is
 * no emblem file yet. That fallback is the point rather than a stopgap: the
 * art arrives one file at a time, and a select screen full of broken images
 * while it does is worse than one that never had them.
 */

import { factionsFor, type FactionDef } from "../factions";

export function FactionEmblem({ faction, size = 18 }: { faction: FactionDef; size?: number }) {
  const px = `${size}px`;
  if (faction.emblem) {
    return (
      <img
        src={faction.emblem}
        alt={faction.name}
        title={`${faction.name} — ${faction.blurb}`}
        style={{ width: px, height: px }}
        className="shrink-0 object-contain"
      />
    );
  }
  return (
    <span
      title={`${faction.name} — ${faction.blurb}`}
      style={{
        width: px,
        height: px,
        borderColor: faction.color,
        color: faction.color,
        fontSize: `${Math.round(size * 0.52)}px`,
      }}
      className="flex shrink-0 items-center justify-center rounded-full border bg-black/50 font-display font-bold leading-none"
    >
      {faction.name.replace(/^The /, "").charAt(0)}
    </span>
  );
}

/**
 * The stack of marks for one fighter.
 *
 * `kinds` narrows it: the roster card shows the faith and the flag and leaves
 * the creed off, because three marks in the corner of a small card is a row
 * of noise and the creed is the one a player can read off the bio anyway.
 */
export function FactionMarks({
  fighterId,
  size = 18,
  kinds,
  className = "",
}: {
  fighterId: string;
  size?: number;
  kinds?: FactionDef["kind"][];
  className?: string;
}) {
  const all = factionsFor(fighterId);
  const shown = kinds ? all.filter((f) => kinds.includes(f.kind)) : all;
  if (!shown.length) return null;
  return (
    <span className={`flex items-center gap-1 ${className}`}>
      {shown.map((f) => (
        <FactionEmblem key={f.id} faction={f} size={size} />
      ))}
    </span>
  );
}

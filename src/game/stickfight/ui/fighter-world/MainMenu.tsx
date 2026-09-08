/**
 * The main menu: GPT's Fighter World globe with the game's own menu bar
 * across the foot.
 *
 * The globe component is used exactly as it was written - it owns the scene,
 * the markers, the dossier card and the input handling, and nothing here
 * reaches inside it. This file is only the frame around it and the wiring
 * from "a fighter was chosen on the globe" to the rest of the game.
 */

import { FighterWorld3D } from "./FighterWorld3D";
import { FIGHTER_WORLD_NODES_3D } from "./fighterWorld3DData";

export type MenuDestination = "world" | "arcade" | "versus" | "training" | "options";

const TABS: { key: MenuDestination; label: string }[] = [
  { key: "world", label: "Fighter World" },
  { key: "arcade", label: "Arcade" },
  { key: "versus", label: "Versus" },
  { key: "training", label: "Training" },
  { key: "options", label: "Options" },
];

export function MainMenu({
  initialFighterId,
  onPick,
  onGo,
}: {
  initialFighterId: string;
  /**
   * A fighter was chosen off the globe. Per the package's integration
   * contract this carries the id into character select, which opens on them
   * - the globe returns an existing roster id, so the roster stays the one
   * source of truth and no fighter data is duplicated here.
   */
  onPick: (fighterId: string) => void;
  onGo: (where: MenuDestination) => void;
}) {
  // The globe only knows the fifteen it has coordinates for. Opening it on a
  // saved fighter it has never heard of would throw, so it falls back.
  const known = FIGHTER_WORLD_NODES_3D.some((n) => n.id === initialFighterId)
    ? initialFighterId
    : FIGHTER_WORLD_NODES_3D[0].id;

  return (
    <div className="relative flex h-full flex-col bg-[#04050a]">
      <div className="relative min-h-0 flex-1">
        <FighterWorld3D initialFighterId={known} onSelectFighter={onPick} />
      </div>

      <nav className="relative z-30 grid shrink-0 grid-cols-5 border-t border-[#3a2a1c]">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onGo(t.key)}
            className={`border-r border-[#3a2a1c] px-4 py-4 text-center font-display text-lg font-bold uppercase tracking-[0.18em] transition last:border-r-0 ${
              i === 0
                ? "bg-gradient-to-b from-[#b7291d] to-[#7c1a12] text-[#ffe6c9] hover:brightness-110"
                : "bg-[#120d09] text-[#c8b89c] hover:bg-[#1c1410] hover:text-[#f1d387]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="relative z-30 flex shrink-0 items-center justify-center gap-6 bg-[#080604] py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8d7f6b]">
        <span>LS / &larr; &rarr; Navigate</span>
        <span>A Select</span>
        <span>B Back</span>
        <span>X View Fighter</span>
      </div>
    </div>
  );
}

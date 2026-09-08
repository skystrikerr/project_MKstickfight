/**
 * The medallion icons beside the combat bars.
 *
 * One per stat the profile actually measures, rather than the six the mockup
 * drew - the numbers on this screen come from `profile.ts`, which grades eight
 * things off the real move data, and inventing a "Zoning" row to match a
 * picture would put a number on the screen that nothing in the game produces.
 */

import type { StatKey } from "../profile";

/** The bar colour for each stat, kept from the mockup's palette. */
export const STAT_COLORS: Record<StatKey, string> = {
  strength: "#c95143",
  power: "#d77730",
  speed: "#cb9b49",
  agility: "#c2a04a",
  range: "#3f9ec2",
  defence: "#54b177",
  durability: "#4f9e8a",
  technique: "#996fd0",
};

export function StatIcon({ kind }: { kind: StatKey }) {
  switch (kind) {
    case "strength":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 18 6m-9 0 9 9M4 20l4-1-3-3-1 4Z" /></svg>;
    case "power":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-2 8 8-12h-6l2-8Z" /></svg>;
    case "speed":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15c5-8 10-9 16-10-2 5-6 10-13 12m0 0-3 2m3-2 2 2" /></svg>;
    case "agility":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20c3-3 4-7 3-11m9-5c-3 3-4 7-3 11M4 8h4M16 16h4" /></svg>;
    case "range":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-4-4 4 4-4 4M6 8l-2 4 2 4" /></svg>;
    case "defence":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /></svg>;
    case "durability":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V5m7 15V3m7 17V8M3 8l2-3 2 3m3-2 2-3 2 3m3 5 2-3 2 3" /></svg>;
    case "technique":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20V8m12 12V8M4 8h16M7 4h10l2 4H5l2-4Zm3 4v12m4-12v12" /></svg>;
  }
}

/**
 * Factions: the groups a fighter belongs to, and what a campaign is built out
 * of.
 *
 * Three kinds, because "faction" is doing three different jobs at once and
 * collapsing them loses the interesting part:
 *
 *   faith   what they believed - Celtic polytheism, Chan Buddhism, the Khalsa
 *   power   who they fought for - Rome, the Mongol Empire, Castile
 *   creed   what they fought about - conquest, resistance, no flag at all
 *
 * A fighter is normally in one of each. Boudica is Celtic Polytheism, the
 * Iceni, and the Resistance; Cortes is Latin Christendom, the Spanish Crown,
 * and Conquest. The two of them share nothing and that is the point - the
 * third axis is what makes a campaign mean something, because it puts the
 * people who invaded on one side and the people who were invaded on the
 * other, across four thousand years.
 *
 * Membership is not listed here. Each fighter declares its own factions and
 * `membersOf` filters the roster, so adding a fighter never means editing
 * this file, and a faction can never quietly lose somebody who was added
 * after it was written.
 *
 * Nothing here imports React, storage or the engine, and every function is
 * pure - the same rule `ladder.ts` and `towers.ts` follow, so a campaign in
 * progress can be rebuilt from an id and a step rather than serialised.
 */

import { ROSTER } from "./fighters";
import type { FighterDef } from "./types";

export type FactionKind = "faith" | "power" | "creed";

export interface FactionDef {
  id: string;
  name: string;
  kind: FactionKind;
  /** One line, shown on the select screen and over a campaign's first card. */
  blurb: string;
  /** Used for the chip and the campaign's accent. */
  color: string;
  /**
   * Emblem shown in the corner of a fighter's card, as an imported asset URL.
   *
   * Optional, and everything renders without it - a faction with no emblem
   * falls back to a coloured disc with its initial. That is deliberate: the
   * art arrives one file at a time and the select screen has to keep working
   * in between, rather than showing a row of broken images.
   */
  emblem?: string;
  /**
   * The boss at the end of this faction's campaign, by id from `BOSSES`.
   *
   * Optional, and deliberately not a fighter id: see `bosses.ts`. A faction
   * without one simply ends on its hardest member.
   */
  boss?: string;
}

/**
 * Every faction on the roster.
 *
 * Ordered faith, then power, then creed, and within each by when the people
 * in it lived. A faction with nobody in it is a test failure rather than a
 * placeholder - an empty chip on the select screen is worse than no chip.
 */
export const FACTIONS: FactionDef[] = [
  // ------------------------------------------------------------------ faith
  {
    id: "old-gods",
    name: "The Old Gods",
    kind: "faith",
    blurb: "Polytheists of the ancient world, from the Alps to the Nile.",
    color: "#b9903f",
  },
  {
    id: "celtic",
    name: "Celtic Polytheism",
    kind: "faith",
    blurb: "Andraste, Teutates, and the druids Rome could not stop writing about.",
    color: "#6fb4e0",
  },
  {
    id: "norse",
    name: "The Norse Gods",
    kind: "faith",
    blurb: "The last generation to sail west believing it.",
    color: "#8fd0e8",
  },
  {
    id: "dharma",
    name: "The Dharma",
    kind: "faith",
    blurb: "Chan and Theravada - the monastery and the ring.",
    color: "#e0a94a",
  },
  {
    id: "kami",
    name: "Kami and Buddha",
    kind: "faith",
    blurb: "The Japanese settlement of two religions that never quite finished.",
    color: "#e8657d",
  },
  {
    id: "khalsa",
    name: "The Khalsa",
    kind: "faith",
    blurb: "The Nihang: a standing army that is also an order.",
    color: "#3f7fd8",
  },
  {
    id: "christendom",
    name: "Christendom",
    kind: "faith",
    blurb: "Latin, Orthodox and everything the word was made to cover.",
    color: "#d8d2c0",
  },
  {
    id: "tengri",
    name: "Tengri",
    kind: "faith",
    blurb: "The eternal blue sky, and the empire that rode under it.",
    color: "#9be0a0",
  },
  {
    id: "mesoamerican",
    name: "The Fifth Sun",
    kind: "faith",
    blurb: "Huitzilopochtli, and a calendar that said when it would end.",
    color: "#ffd166",
  },
  {
    id: "ancestors",
    name: "The Ancestors",
    kind: "faith",
    blurb: "Southern Africa and the Pacific: the dead are consulted, not remembered.",
    color: "#a7d16a",
  },
  {
    id: "zoroastrian",
    name: "The Wise Lord",
    kind: "faith",
    blurb: "Fire, truth and the first religion to make it a war.",
    color: "#ff9440",
  },

  // ------------------------------------------------------------------ power
  {
    id: "rome",
    name: "Rome",
    kind: "power",
    blurb: "The republic, the legions, and the paperwork behind both.",
    color: "#c0392b",
  },
  {
    id: "hellas",
    name: "The Greek Cities",
    kind: "power",
    blurb: "Free, quarrelsome, and briefly unanimous.",
    color: "#c9a34a",
  },
  {
    id: "achaemenid",
    name: "The Achaemenid Empire",
    kind: "power",
    blurb: "The largest thing the world had yet seen, and the ten thousand at its centre.",
    color: "#b08a45",
  },
  {
    id: "steppe",
    name: "The Horde",
    kind: "power",
    blurb: "The Mongol Empire, at the speed a horse can be replaced.",
    color: "#8fae5c",
  },
  {
    id: "crown",
    name: "The Crowns of Europe",
    kind: "power",
    blurb: "Castile, England, France - the states that went out and took things.",
    color: "#d9b45a",
  },
  {
    id: "thrones",
    name: "Thrones Elsewhere",
    kind: "power",
    blurb: "The Mexica, the Ming, the Khalsa Raj, Ethiopia, the Zulu - states Europe kept being surprised by.",
    color: "#3fae8f",
  },
  {
    id: "peoples",
    name: "Peoples and Confederations",
    kind: "power",
    blurb: "Ground held by everyone who lived on it, without a throne in the middle.",
    color: "#a7c96a",
  },
  {
    id: "outlaws",
    name: "Under No Flag",
    kind: "power",
    blurb: "Pirates, duellists, and whoever Kuro was.",
    color: "#a795c4",
  },
  {
    id: "america",
    name: "The American Century",
    kind: "power",
    blurb: "A frontier, then a border, then a valley on the other side of the world.",
    color: "#7f9c6b",
  },

  // ------------------------------------------------------------------ creed
  {
    id: "conquest",
    name: "Conquest",
    kind: "creed",
    blurb: "They arrived by choice, and wrote the account afterwards.",
    color: "#a8341f",
  },
  {
    id: "resistance",
    name: "The Resistance",
    kind: "creed",
    blurb: "They did not choose the fight, the ground, or the century.",
    color: "#5fb7c9",
  },
  {
    id: "sellswords",
    name: "Sellswords and Strangers",
    kind: "creed",
    blurb: "Fighting for a wage, a grudge, or reasons nobody recorded.",
    color: "#8f8163",
  },
];

const BY_ID = new Map(FACTIONS.map((f) => [f.id, f]));

export function faction(id: string): FactionDef | undefined {
  return BY_ID.get(id);
}

/** The factions a fighter belongs to, in the order `FACTIONS` declares them. */
export function factionsFor(fighterId: string): FactionDef[] {
  const def = ROSTER.find((d) => d.id === fighterId);
  if (!def?.factions) return [];
  const held = new Set(def.factions);
  return FACTIONS.filter((f) => held.has(f.id));
}

/** Everyone in a faction, in roster order. */
export function membersOf(factionId: string): FighterDef[] {
  return ROSTER.filter((d) => d.factions?.includes(factionId));
}

/** Factions of one kind, for grouping the select screen. */
export function factionsOfKind(kind: FactionKind): FactionDef[] {
  return FACTIONS.filter((f) => f.kind === kind);
}

/**
 * Whether two fighters share anything.
 *
 * Used for versus-screen flavour and, later, for a campaign deciding whether
 * a fight is a schism or a war. Deliberately returns the shared factions
 * rather than a boolean, because "they share a faith but not a side" is the
 * interesting case and a boolean throws it away.
 */
export function sharedFactions(a: string, b: string): FactionDef[] {
  const mine = new Set(factionsFor(a).map((f) => f.id));
  return factionsFor(b).filter((f) => mine.has(f.id));
}

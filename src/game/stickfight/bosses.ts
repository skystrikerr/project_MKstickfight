/**
 * Bosses: the fight at the end of a faction's campaign.
 *
 * A boss is deliberately not a `FighterDef` and is deliberately not in
 * `ROSTER`. That is a design decision with two separate reasons behind it,
 * and both matter.
 *
 * The first is mechanical. Everything in ROSTER is balanced against
 * everything else in ROSTER - `tools/balance.ts` plays the whole grid and
 * expects a fighter to sit somewhere near fifty per cent. A boss is supposed
 * to be unfair: more health, armour on startup, a move nobody can punish. Put
 * that in the roster and it either poisons the balance table or gets tuned
 * down into not being a boss.
 *
 * The second is editorial. Campaigns will end on people who ran states worth
 * ending, and the roster is a list of characters a player picks and inhabits.
 * Those are not the same list. Keeping bosses out of it means a faction can
 * have a monstrous figure at the end of it without that figure becoming a
 * playable character with a faction bonus attached - which reads as
 * endorsement in a way that punching him does not. A boss here is an opponent
 * and only ever an opponent: not selectable, no synergy, no unlock.
 *
 * `base` is the roster fighter whose moveset the boss uses, because a boss
 * that needs a thousand lines of new keyframes is a boss that never ships.
 * What makes it a boss is the overrides, not new animation.
 */

import type { AiLevel } from "./constants";

export interface BossDef {
  id: string;
  name: string;
  title: string;
  /** The faction this boss ends. One boss per faction at most. */
  faction: string;
  /** Shown on the versus card before the last fight. */
  blurb: string;
  /** Roster fighter whose moves and rig this boss borrows. */
  base: string;
  /** Palette override, so a borrowed rig does not read as its owner. */
  palette?: { body?: string; outline?: string; accent?: string; cloth?: string; metal?: string; aura?: string };
  /** Multiplied onto the base fighter's health. Bosses are meant to be unfair. */
  healthScale?: number;
  /** Multiplied onto damage dealt and taken. */
  dealtScale?: number;
  takenScale?: number;
  /** Floor on the AI level, whatever difficulty the campaign is running at. */
  minLevel?: AiLevel;
}

/**
 * None yet.
 *
 * The type and the wiring land first on purpose. A boss is cheap to add once
 * the campaign that fights it exists, and expensive to get right before then -
 * every field here is a guess until something is actually using it.
 */
export const BOSSES: BossDef[] = [];

const BY_ID = new Map(BOSSES.map((b) => [b.id, b]));

export function boss(id: string): BossDef | undefined {
  return BY_ID.get(id);
}

/** The boss that ends a faction's campaign, if it has one. */
export function bossForFaction(factionId: string): BossDef | undefined {
  return BOSSES.find((b) => b.faction === factionId);
}

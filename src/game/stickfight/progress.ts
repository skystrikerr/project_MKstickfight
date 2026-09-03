/**
 * Weapon progression.
 *
 * Every variant in `weapons.ts` starts locked and is earned by playing the
 * fighter it belongs to. Nothing here is a currency and nothing is random:
 * there is no pool to spend out of and no chest to open, because a cosmetic
 * you get for playing the character is a reason to play the character, and a
 * cosmetic you get for grinding an unrelated one is a reason to grind.
 *
 * Progress is per fighter and it is only ever counted for the seat the player
 * is actually in. Winning as Ötzi against Hydarnes moves Ötzi; it does not
 * move Hydarnes, who did not choose to be there.
 *
 * The unlock rules live on the variants themselves rather than here, so this
 * module never has to know what a weapon is - it reads a rule and a record
 * and answers one question.
 */

import { AI_LEVELS, type AiLevel } from "./constants";
import { getWeapon, weaponsFor, type WeaponUnlock, type WeaponVariant } from "./weapons";

/** What has been done with one fighter. Absent means nothing yet. */
export interface Mastery {
  matches: number;
  wins: number;
}

export const NO_MASTERY: Mastery = { matches: 0, wins: 0 };

/** The record progression reads. A subset of the save, so this stays testable. */
export interface ProgressState {
  mastery: Record<string, Mastery>;
  /** Fighter id -> hardest difficulty their ladder has been cleared on. */
  cleared: Record<string, AiLevel>;
}

export function masteryFor(state: ProgressState, fighterId: string): Mastery {
  return state.mastery[fighterId] ?? NO_MASTERY;
}

/** How far along a requirement is, in its own units. */
export function unlockProgress(
  state: ProgressState,
  fighterId: string,
  unlock: WeaponUnlock,
): { have: number; need: number; done: boolean } {
  const m = masteryFor(state, fighterId);
  switch (unlock.kind) {
    case "wins":
      return { have: Math.min(m.wins, unlock.count), need: unlock.count, done: m.wins >= unlock.count };
    case "matches":
      return { have: Math.min(m.matches, unlock.count), need: unlock.count, done: m.matches >= unlock.count };
    case "clear": {
      const at = state.cleared[fighterId];
      const done = !!at && AI_LEVELS.indexOf(at) >= AI_LEVELS.indexOf(unlock.level);
      return { have: done ? 1 : 0, need: 1, done };
    }
  }
}

/**
 * One short line saying what is still owed.
 *
 * Written in the imperative and in the units the player counts in, because
 * "Win 3 matches as this fighter" is a thing somebody can go and do and
 * "Requires mastery level 2" is not.
 */
export function unlockLabel(unlock: WeaponUnlock, fighterName: string): string {
  switch (unlock.kind) {
    case "wins":
      return `Win ${unlock.count} ${unlock.count === 1 ? "match" : "matches"} as ${fighterName}`;
    case "matches":
      return `Play ${unlock.count} ${unlock.count === 1 ? "match" : "matches"} as ${fighterName}`;
    case "clear":
      return `Clear the arcade ladder as ${fighterName} on ${unlock.level} or harder`;
  }
}

export function isUnlocked(state: ProgressState, fighterId: string, variantId: string): boolean {
  const v = getWeapon(fighterId, variantId);
  if (!v) return false;
  return unlockProgress(state, fighterId, v.unlock).done;
}

/** Every variant this fighter has earned, in declaration order. */
export function unlockedWeapons(state: ProgressState, fighterId: string): WeaponVariant[] {
  return weaponsFor(fighterId).filter((v) => unlockProgress(state, fighterId, v.unlock).done);
}

/**
 * Applies one finished match and reports what it earned.
 *
 * Pure: it takes the record and gives back a new one plus the variants that
 * crossed their line on this match, so the caller can both persist it and say
 * so on screen. A match is counted once, for one fighter, from the seat the
 * player held.
 */
export function applyMatch(
  state: ProgressState,
  fighterId: string,
  won: boolean,
): { state: ProgressState; unlocked: WeaponVariant[] } {
  const before = new Set(unlockedWeapons(state, fighterId).map((v) => v.id));
  const m = masteryFor(state, fighterId);
  const next: ProgressState = {
    ...state,
    mastery: {
      ...state.mastery,
      [fighterId]: { matches: m.matches + 1, wins: m.wins + (won ? 1 : 0) },
    },
  };
  return { state: next, unlocked: unlockedWeapons(next, fighterId).filter((v) => !before.has(v.id)) };
}

/**
 * The same report for a cleared ladder, which unlocks on a different axis and
 * so has to be checked separately from the match that finished it.
 */
export function applyClear(state: ProgressState, fighterId: string, level: AiLevel): WeaponVariant[] {
  const before = new Set(unlockedWeapons(state, fighterId).map((v) => v.id));
  const had = state.cleared[fighterId];
  const best = had && AI_LEVELS.indexOf(had) >= AI_LEVELS.indexOf(level) ? had : level;
  const next: ProgressState = { ...state, cleared: { ...state.cleared, [fighterId]: best } };
  return unlockedWeapons(next, fighterId).filter((v) => !before.has(v.id));
}

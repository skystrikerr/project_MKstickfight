/**
 * What the game remembers between launches.
 *
 * One versioned blob in localStorage, read once and written on change. Every
 * access is wrapped: a browser in private mode, a user who has blocked site
 * data, or a blob written by an older build all have to leave the game
 * playable, so every failure path returns the defaults rather than throwing.
 *
 * Nothing here is authoritative about the game - it is a convenience layer.
 * If it comes back empty you get a first-run experience, not a broken one.
 */

import { AI_LEVELS, type AiLevel } from "./constants";
import { ROSTER } from "./fighters";
import { STAGE_LIST, type StageTheme } from "./render/stage";
import { SKINS } from "./skins";
import { BINDABLE_ACTIONS, defaultKeyMap, isKeyCode, type KeyMap } from "./keybinds";
import { isInputScheme, type InputScheme } from "./inputscheme";
import { weaponsFor, type WeaponVariant } from "./weapons";
import { applyClear, applyMatch, isUnlocked, NO_MASTERY, type Mastery, type ProgressState } from "./progress";
import { TOWERS } from "./towers";

const KEY = "stickfighter.save";
const VERSION = 1;

export interface SaveData {
  v: number;
  /** Last character select state, so the game opens where you left it. */
  p1: string;
  p2: string;
  p1Skin: string;
  p2Skin: string;
  aiLevel: AiLevel;
  rounds: number;
  stage: StageTheme | "random";
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  /** Camera shake intensity - "off" removes it entirely. */
  motion: "full" | "reduced" | "off";
  /** Brightens secondary text and hairline rules throughout the interface. */
  highContrast: boolean;
  /** Player 1's key map. Player 2 stays on the fixed arrow-key layout. */
  p1Keys: KeyMap;
  /**
   * Which buttons the move list and the tutorial name. The simulation is
   * unaffected - a pad works whatever this says - it only changes whether the
   * player is told to press C or square.
   */
  inputScheme: InputScheme;
  /** Fighter id -> the hardest difficulty their ladder has been cleared on. */
  cleared: Record<string, AiLevel>;
  /**
   * Fighter id -> chosen weapon variant. A fighter with no entry is holding
   * what they were drawn with, which is most of the roster.
   */
  weapons: Record<string, string>;
  /**
   * Fighter id -> what has been done with them. This is the whole progression
   * record: weapon variants are earned per fighter off these counters and the
   * `cleared` table above, and nothing else reads it.
   */
  mastery: Record<string, Mastery>;
  /**
   * Tower id -> the most floors ever cleared in one run of it. This is the
   * whole tower record: runs themselves are rebuilt from a seed rather than
   * saved, so a climb in progress does not survive closing the tab - only
   * what you got to.
   */
  towers: Record<string, number>;
}

export const DEFAULT_SAVE: SaveData = {
  v: VERSION,
  p1: ROSTER[0].id,
  p2: ROSTER[1].id,
  p1Skin: "classic",
  p2Skin: "twilight",
  aiLevel: "Veteran",
  rounds: 2,
  stage: "random",
  muted: false,
  musicVolume: 0.4,
  sfxVolume: 0.5,
  motion: "full",
  highContrast: false,
  p1Keys: defaultKeyMap(),
  inputScheme: "keyboard",
  cleared: {},
  weapons: {},
  mastery: {},
  towers: {},
};

const isFighter = (v: unknown): v is string => ROSTER.some((f) => f.id === v);
const isSkin = (v: unknown): v is string => SKINS.some((s) => s.id === v);
const isLevel = (v: unknown): v is AiLevel => AI_LEVELS.includes(v as AiLevel);
const isStage = (v: unknown): v is StageTheme | "random" =>
  v === "random" || STAGE_LIST.includes(v as StageTheme);

/**
 * Rebuilds a save from whatever was on disk, field by field.
 *
 * Anything missing, malformed, or naming a fighter or stage this build no
 * longer has falls back to the default for that field alone - so renaming one
 * character does not wipe somebody's whole record.
 */
const isVolume = (v: unknown): v is number => typeof v === "number" && v >= 0 && v <= 1;
const isMotion = (v: unknown): v is SaveData["motion"] => v === "full" || v === "reduced" || v === "off";

/**
 * A key map is rebuilt action by action, same as `cleared` is rebuilt fighter
 * by fighter: one garbled action falls back to its own default key rather
 * than resetting every button the player has already rebound.
 */
function coerceKeyMap(raw: unknown): KeyMap {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<KeyMap>;
  const fallback = defaultKeyMap();
  const out = {} as KeyMap;
  for (const action of BINDABLE_ACTIONS) {
    out[action] = isKeyCode(o[action]) ? o[action] : fallback[action];
  }
  return out;
}

function coerce(raw: unknown): SaveData {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SAVE };
  const o = raw as Partial<SaveData>;
  const cleared: Record<string, AiLevel> = {};
  if (o.cleared && typeof o.cleared === "object") {
    for (const [id, level] of Object.entries(o.cleared)) {
      if (isFighter(id) && isLevel(level)) cleared[id] = level;
    }
  }
  // Same rule as `cleared`: rebuilt entry by entry, so a variant this build
  // has dropped costs that one fighter their weapon rather than resetting
  // everybody's.
  const weapons: Record<string, string> = {};
  const mastery: Record<string, Mastery> = {};
  if (o.mastery && typeof o.mastery === "object") {
    for (const [id, m] of Object.entries(o.mastery)) {
      if (!isFighter(id) || !m || typeof m !== "object") continue;
      const { matches, wins } = m as Partial<Mastery>;
      // Counters only ever go up, so anything negative, fractional or not a
      // number at all is a corrupted blob rather than a real record.
      const ok = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;
      if (!ok(matches) || !ok(wins)) continue;
      // More wins than matches is impossible and would hand out unlocks that
      // were never earned, so it is clamped rather than trusted.
      mastery[id] = { matches, wins: Math.min(wins, matches) };
    }
  }
  // Same rule as `cleared`: rebuilt entry by entry, so a variant this build
  // has dropped costs that one fighter their weapon rather than resetting
  // everybody's. It also has to still be unlocked - a hand-edited blob or a
  // record that predates a change to the unlock rules must not keep handing
  // out a weapon nobody earned.
  const progress: ProgressState = { mastery, cleared };
  if (o.weapons && typeof o.weapons === "object") {
    for (const [id, variant] of Object.entries(o.weapons)) {
      if (!isFighter(id) || typeof variant !== "string") continue;
      if (!weaponsFor(id).some((w) => w.id === variant)) continue;
      if (!isUnlocked(progress, id, variant)) continue;
      weapons[id] = variant;
    }
  }
  // Same rule again: a tower this build has dropped, or a floor count that is
  // not a whole positive number, loses that one entry rather than the record.
  const towers: Record<string, number> = {};
  if (o.towers && typeof o.towers === "object") {
    for (const [id, floors] of Object.entries(o.towers)) {
      if (!TOWERS.some((t) => t.id === id)) continue;
      if (typeof floors !== "number" || !Number.isInteger(floors) || floors < 0) continue;
      towers[id] = floors;
    }
  }
  return {
    v: VERSION,
    towers,
    p1: isFighter(o.p1) ? o.p1 : DEFAULT_SAVE.p1,
    p2: isFighter(o.p2) ? o.p2 : DEFAULT_SAVE.p2,
    p1Skin: isSkin(o.p1Skin) ? o.p1Skin : DEFAULT_SAVE.p1Skin,
    p2Skin: isSkin(o.p2Skin) ? o.p2Skin : DEFAULT_SAVE.p2Skin,
    aiLevel: isLevel(o.aiLevel) ? o.aiLevel : DEFAULT_SAVE.aiLevel,
    rounds: o.rounds === 1 || o.rounds === 2 || o.rounds === 3 ? o.rounds : DEFAULT_SAVE.rounds,
    stage: isStage(o.stage) ? o.stage : DEFAULT_SAVE.stage,
    muted: typeof o.muted === "boolean" ? o.muted : DEFAULT_SAVE.muted,
    musicVolume: isVolume(o.musicVolume) ? o.musicVolume : DEFAULT_SAVE.musicVolume,
    sfxVolume: isVolume(o.sfxVolume) ? o.sfxVolume : DEFAULT_SAVE.sfxVolume,
    motion: isMotion(o.motion) ? o.motion : DEFAULT_SAVE.motion,
    highContrast: typeof o.highContrast === "boolean" ? o.highContrast : DEFAULT_SAVE.highContrast,
    p1Keys: coerceKeyMap(o.p1Keys),
    inputScheme: isInputScheme(o.inputScheme) ? o.inputScheme : DEFAULT_SAVE.inputScheme,
    cleared,
    weapons,
    mastery,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    return coerce(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function writeSave(data: SaveData): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Full quota, blocked site data, private mode. The game does not care.
  }
}

/** Merges a few fields into what is stored and returns the result. */
export function patchSave(patch: Partial<SaveData>): SaveData {
  const next = { ...loadSave(), ...patch, v: VERSION };
  writeSave(next);
  return next;
}

/**
 * Records a cleared ladder, keeping the hardest difficulty it was beaten on.
 * Clearing on Rookie after clearing on Legend must not demote the record.
 */
export function recordClear(fighterId: string, level: AiLevel): { save: SaveData; unlocked: WeaponVariant[] } {
  const save = loadSave();
  const unlocked = applyClear({ mastery: save.mastery, cleared: save.cleared }, fighterId, level);
  const had = save.cleared[fighterId];
  if (had && AI_LEVELS.indexOf(had) >= AI_LEVELS.indexOf(level)) return { save, unlocked };
  return { save: patchSave({ cleared: { ...save.cleared, [fighterId]: level } }), unlocked };
}

/**
 * Records one finished match for the fighter the player was using, and gives
 * back anything it unlocked so the caller can say so on screen.
 *
 * Only the seat the player actually held is counted. The CPU picking up a
 * fighter for one arcade rung has not earned anything with them.
 */
export function recordMatch(fighterId: string, won: boolean): { save: SaveData; unlocked: WeaponVariant[] } {
  const save = loadSave();
  const { state, unlocked } = applyMatch({ mastery: save.mastery, cleared: save.cleared }, fighterId, won);
  return { save: patchSave({ mastery: state.mastery }), unlocked };
}

/**
 * Records how far a tower run got. Only an improvement is written, so giving
 * up on floor two after reaching floor nine does not erase floor nine.
 */
export function recordTower(towerId: string, floorsCleared: number): SaveData {
  const save = loadSave();
  if ((save.towers[towerId] ?? 0) >= floorsCleared) return save;
  return patchSave({ towers: { ...save.towers, [towerId]: floorsCleared } });
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to do - the caller only ever asked politely.
  }
}

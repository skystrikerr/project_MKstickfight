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
  /** Player 1's key map. Player 2 stays on the fixed arrow-key layout. */
  p1Keys: KeyMap;
  /** Fighter id -> the hardest difficulty their ladder has been cleared on. */
  cleared: Record<string, AiLevel>;
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
  p1Keys: defaultKeyMap(),
  cleared: {},
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
  return {
    v: VERSION,
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
    p1Keys: coerceKeyMap(o.p1Keys),
    cleared,
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
export function recordClear(fighterId: string, level: AiLevel): SaveData {
  const save = loadSave();
  const had = save.cleared[fighterId];
  if (had && AI_LEVELS.indexOf(had) >= AI_LEVELS.indexOf(level)) return save;
  return patchSave({ cleared: { ...save.cleared, [fighterId]: level } });
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to do - the caller only ever asked politely.
  }
}

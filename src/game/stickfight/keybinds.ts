/**
 * Player-1 key rebinding.
 *
 * The simulation only ever sees a `RawInput` - left/right/up/down/A/B/C/S -
 * so remapping happens entirely at this layer: one physical key per action,
 * turned into the `KeyBindings` shape `Keyboard.read` already takes. Player 2
 * stays on the fixed arrow-keys layout; two people rebinding the same
 * keyboard at once is not a case worth a second menu for.
 */

import { P1_KEYS, type KeyBindings } from "./engine/input";

export type BindableAction = "left" | "right" | "up" | "down" | "A" | "B" | "C" | "S";

export const BINDABLE_ACTIONS: BindableAction[] = ["left", "right", "up", "down", "A", "B", "C", "S"];

export const ACTION_LABELS: Record<BindableAction, string> = {
  left: "Move left",
  right: "Move right",
  up: "Jump",
  down: "Crouch",
  A: "Light attack",
  B: "Medium attack",
  C: "Heavy attack",
  S: "Block / skill",
};

export type KeyMap = Record<BindableAction, string>;

/** The map rebinding starts from - the first key already bound to each action. */
export function defaultKeyMap(): KeyMap {
  const out = {} as KeyMap;
  for (const a of BINDABLE_ACTIONS) out[a] = P1_KEYS[a][0];
  return out;
}

/** A single-key map turned into the multi-key form the engine reads. */
export function toKeyBindings(map: KeyMap): KeyBindings {
  return {
    left: [map.left],
    right: [map.right],
    up: [map.up],
    down: [map.down],
    A: [map.A],
    B: [map.B],
    C: [map.C],
    S: [map.S],
  };
}

const CODE_LABELS: Record<string, string> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Space: "Space",
  Semicolon: ";",
  Comma: ",",
  Period: ".",
  Quote: "'",
  Slash: "/",
  Backslash: "\\",
  ShiftLeft: "L Shift",
  ShiftRight: "R Shift",
  ControlLeft: "L Ctrl",
  ControlRight: "R Ctrl",
  AltLeft: "L Alt",
  AltRight: "R Alt",
  CapsLock: "Caps",
  Tab: "Tab",
  Enter: "Enter",
};

/** A short label for a `KeyboardEvent.code`, for the rebind row. */
export function codeLabel(code: string): string {
  if (CODE_LABELS[code]) return CODE_LABELS[code];
  const short = code.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Numpad/, "Num ");
  return short || code;
}

/**
 * True for something shaped like a `KeyboardEvent.code` - guards a saved key
 * map against garbage the way every other field in `save.ts` does.
 */
export function isKeyCode(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 24 && /^[A-Za-z0-9]+$/.test(v);
}

/**
 * The printed control reference.
 *
 * It used to live at the bottom of the title screen as three columns nobody
 * scrolled to, under a paragraph that had quietly gone out of date - it was
 * still promising three strings a fighter after they grew to eight. The rows
 * themselves are worth keeping, so they moved to Settings, and they live here
 * because two screens now want them.
 */

export interface ControlRow {
  keys: string;
  label: string;
}

export const CONTROLS: ControlRow[] = [
  { keys: "W A S D", label: "Move · W jumps · S crouches" },
  { keys: "J", label: "Light attack (A)" },
  { keys: "K", label: "Medium attack (B)" },
  { keys: "L", label: "Heavy attack (C)" },
  { keys: "S + J / K / L", label: "Crouching light / medium / heavy" },
  { keys: "hold U / ;", label: "Block (S) · + ↓ blocks low" },
  { keys: "← + S", label: "Parry" },
  { keys: "→ + S", label: "Roll (ducks under the swing, travels past them)" },
  { keys: "← ←", label: "Backstep (retreats out of range)" },
  { keys: "J + L", label: "Character skill" },
  { keys: "J + K", label: "Throw" },
  { keys: "Esc", label: "Pause" },
];

export const P2_CONTROLS: ControlRow[] = [
  { keys: "Arrow keys", label: "Move / jump / crouch" },
  { keys: "N / M / ,", label: "Light / Medium / Heavy" },
  { keys: ". or Numpad 0", label: "Block / skill (S)" },
];

export const PAD_CONTROLS: ControlRow[] = [
  { keys: "D-pad / stick", label: "Move, jump, crouch" },
  { keys: "✕ / A", label: "Light attack" },
  { keys: "○ / B", label: "Medium attack" },
  { keys: "□ / X", label: "Heavy attack" },
  { keys: "↓ + ✕ / ○ / □", label: "Crouching attacks" },
  { keys: "△ / Y · L1 · L2", label: "Block / skill" },
  { keys: "R1", label: "Character skill" },
  { keys: "R2", label: "Throw" },
  { keys: "Start", label: "Pause" },
];

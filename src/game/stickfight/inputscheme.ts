/**
 * How an input is spelled on screen.
 *
 * Every move's `notation` is authored in the abstract buttons the simulation
 * actually uses - A, B, C, S - because those are what the engine reads and
 * what a rebindable key map points at. That is honest and it is useless to
 * somebody holding a controller, who has no button called C.
 *
 * So the notation is authored once and translated at render time. Nothing in
 * the move data changes and nothing in the engine knows this file exists.
 *
 * The pad layouts also carry the two shortcuts that only exist on a pad: the
 * throw and the character skill are two-button presses on a keyboard and one
 * shoulder button on a controller, and printing the face-button pair to a pad
 * player would be telling them to do it the hard way.
 */

export type InputScheme = "keyboard" | "playstation" | "xbox";

export const INPUT_SCHEMES: { id: InputScheme; label: string }[] = [
  { id: "keyboard", label: "Keyboard" },
  { id: "playstation", label: "PlayStation" },
  { id: "xbox", label: "Xbox" },
];

export const isInputScheme = (v: unknown): v is InputScheme =>
  INPUT_SCHEMES.some((s) => s.id === v);

type AbstractButton = "A" | "B" | "C" | "S";

const GLYPHS: Record<InputScheme, Record<AbstractButton, string>> = {
  keyboard: { A: "A", B: "B", C: "C", S: "S" },
  playstation: { A: "✕", B: "○", C: "□", S: "△" },
  xbox: { A: "A", B: "B", C: "X", S: "Y" },
};

/** The one-button ways in, where a pad has one and a keyboard does not. */
const SHORTCUTS: Record<InputScheme, { throw: string; skill: string; guard: string } | null> = {
  keyboard: null,
  playstation: { throw: "R2", skill: "R1", guard: "L1" },
  xbox: { throw: "RT", skill: "RB", guard: "LB" },
};

export function padShortcuts(scheme: InputScheme) {
  return SHORTCUTS[scheme];
}

/**
 * Rewrites one authored notation into a scheme.
 *
 * The button substitution is deliberately word-bounded. Several fighters spend
 * a named resource and say so in the notation - "(20 Chi)", "(1 Obsidian)",
 * "(1 Chakram)" - and a plain character replace would turn those into "(20
 * □hi)". Only a standalone A, B, C or S is a button.
 */
export function renderNotation(notation: string, scheme: InputScheme): string {
  const sc = SHORTCUTS[scheme];
  let out = notation;
  if (sc) {
    // The pad shortcuts first, while the pair is still spelled in the letters
    // the pattern is written in.
    out = out.replace(/\bA \+ B\b/g, sc.throw).replace(/\bA \+ C\b/g, sc.skill);
  }
  const g = GLYPHS[scheme];
  return out.replace(/\b([ABCS])\b/g, (_, b: AbstractButton) => g[b]);
}

/**
 * The same substitution for prose - the tutorial says things like "press A + B
 * together to throw them", which has to read correctly on a pad too.
 */
export function renderPrompt(prompt: string, scheme: InputScheme): string {
  return renderNotation(prompt, scheme);
}

/** A short legend for the shoulder buttons, shown wherever a pad scheme is on. */
export function schemeLegend(scheme: InputScheme): string | null {
  const sc = SHORTCUTS[scheme];
  if (!sc) return null;
  const g = GLYPHS[scheme];
  return `${sc.guard} or ${g.S} guards · ${sc.skill} is the character skill · ${sc.throw} throws`;
}

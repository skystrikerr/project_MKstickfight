/**
 * The art registry: fighter portraits, card frames and menu plates.
 *
 * Resolved through `import.meta.glob` rather than a list of imports, for two
 * reasons. The roster is twenty-six fighters and the painted art arrives a few
 * at a time, so a hand-written import list would be a file somebody has to
 * remember to edit - and forgetting means a fighter silently keeps a blank
 * card even though the art is sitting right there in the folder. This way
 * dropping `src/assets/ui/portraits/<id>.webp` in is the whole job.
 *
 * The other reason is the build. Everything under `src/assets` is inlined as a
 * data URI (see vite.config.ts), because the game also ships as one packed
 * HTML file and as a desktop build opened off disk - a file left sitting in
 * `public/` is a 404 in both. Eager globs keep that guarantee: Vite sees every
 * path statically and folds them all in.
 */

/** A fighter id with no art yet resolves to undefined, not a broken image. */
const portraits = import.meta.glob("../../../assets/ui/portraits/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const frames = import.meta.glob("../../../assets/ui/frames/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const plates = import.meta.glob("../../../assets/ui/plates/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const byName = (files: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.webp$/, ""), url]),
  ) as Record<string, string>;

export const PORTRAITS = byName(portraits);
export const FRAMES = byName(frames);
export const PLATES = byName(plates);

export type FrameKind = "plain" | "selected" | "locked" | "p1" | "p2";

/** The portrait for a fighter, or undefined while nobody has painted them. */
export function portraitFor(id: string): string | undefined {
  return PORTRAITS[id];
}

export function frame(kind: FrameKind): string | undefined {
  return FRAMES[kind];
}

export function plate(name: string): string | undefined {
  return PLATES[name];
}

/**
 * Where the picture sits inside a card frame, as fractions of the frame.
 *
 * One rectangle for all of them rather than one each: the five frames were
 * drawn as a set and their windows agree to within a couple of per cent, and a
 * single number keeps a row of tiles lined up instead of each one cropping its
 * portrait slightly differently.
 */
export const FRAME_WINDOW = { left: 0.15, top: 0.128, width: 0.695, height: 0.624 } as const;

/** Fighters that currently have painted art, for anything that wants to count. */
export const PORTRAIT_IDS = Object.keys(PORTRAITS).sort();

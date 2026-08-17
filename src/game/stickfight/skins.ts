/**
 * Alternate colours.
 *
 * A skin is not a second set of hand-painted art - with fifteen fighters each
 * carrying thirty-odd prop parts that would be thousands of hex codes to keep
 * in sync. It is a colour *transform* applied to a `FighterDef` at load time:
 * the palette, every prop part, the resource bar, projectiles and effect
 * colours all go through the same rule, and the result is a new FighterDef the
 * rest of the game cannot tell from a hand-authored one.
 *
 * The transform is deliberately not a flat hue rotation. Three kinds of colour
 * need different treatment or the fighter falls apart:
 *
 *   - Skin tone. Rotating the hue of a face gives you a green man. The
 *     fighter's `palette.body`, and any prop part painted close to it (taped
 *     fists, bare arms), is blended towards the skin's own tone instead.
 *   - Metal. Steel and iron are near-grey, so a hue rotation does nothing to
 *     them at all. Anything under the saturation threshold is tinted towards
 *     the skin's metal instead, which is what turns a steel sword bronze.
 *   - Everything else - cloth, leather, paint, plumes - takes the hue shift.
 *
 * Because the shift is relative, each fighter keeps their own colour
 * relationships: a red-and-bronze legionary and a black-and-crimson ninja both
 * move the same distance round the wheel and stay recognisably themselves.
 */

import type { FighterDef, PropDef, ShapePart } from "./types";

export interface SkinDef {
  id: string;
  name: string;
  /** One-line description shown on the select screen. */
  blurb: string;
  /** Hue rotation in degrees applied to saturated colours. */
  hue: number;
  /** Saturation multiplier. */
  sat: number;
  /** Lightness offset, roughly -0.3 .. 0.3. */
  lum: number;
  /** Near-greys are pulled this far towards `metal` instead of hue-shifted. */
  metal: string;
  metalMix: number;
  /** The fighter's skin tone is pulled this far towards `tone`. */
  tone: string;
  toneMix: number;
  /** Swatch shown in the picker. */
  swatch: [string, string];
}

/**
 * Six looks. "Classic" is the identity transform and is always first, so the
 * fighters ship looking exactly as they were drawn.
 */
export const SKINS: SkinDef[] = [
  {
    id: "classic",
    name: "Classic",
    blurb: "As drawn.",
    hue: 0,
    sat: 1,
    lum: 0,
    metal: "#c9d1d9",
    metalMix: 0,
    tone: "#e8e6e3",
    toneMix: 0,
    swatch: ["#c0392b", "#d9a441"],
  },
  {
    id: "ember",
    name: "Ember",
    blurb: "Everything pushed towards the fire. Bronze kit, hot cloth.",
    hue: -26,
    sat: 1.2,
    lum: 0.02,
    metal: "#c99a4e",
    metalMix: 0.5,
    tone: "#e7c8ac",
    toneMix: 0.35,
    swatch: ["#e0562c", "#f0b038"],
  },
  {
    id: "verdigris",
    name: "Verdigris",
    blurb: "Oxidised copper and deep green - kit left out in the weather.",
    hue: 118,
    sat: 0.9,
    lum: -0.02,
    metal: "#6ea28d",
    metalMix: 0.55,
    tone: "#d8ddcf",
    toneMix: 0.3,
    swatch: ["#2f8f6b", "#8fbf5a"],
  },
  {
    id: "twilight",
    name: "Twilight",
    blurb: "Night colours. Cold steel, dark cloth, everything an hour later.",
    hue: 192,
    sat: 0.82,
    lum: -0.1,
    metal: "#8296b4",
    metalMix: 0.6,
    tone: "#c3c9d8",
    toneMix: 0.42,
    swatch: ["#2e5f96", "#7f7ac0"],
  },
  {
    id: "ash",
    name: "Ash",
    blurb: "Ink wash. Almost all the colour taken out of the drawing.",
    hue: 0,
    sat: 0.16,
    lum: 0.01,
    metal: "#b6b9bd",
    metalMix: 0.35,
    tone: "#dcdcdc",
    toneMix: 0.55,
    swatch: ["#6f7378", "#c2c5c9"],
  },
  {
    id: "gilt",
    name: "Gilt",
    blurb: "Everything worth money is gold. Champion's colours.",
    hue: -8,
    sat: 1.12,
    lum: 0.07,
    metal: "#e0bc63",
    metalMix: 0.72,
    tone: "#f0e2cd",
    toneMix: 0.3,
    swatch: ["#c9962f", "#f4dc86"],
  },
];

export const SKIN_BY_ID: Record<string, SkinDef> = Object.fromEntries(SKINS.map((s) => [s.id, s]));

export function getSkin(id: string | undefined): SkinDef {
  return (id && SKIN_BY_ID[id]) || SKINS[0];
}

// ---------------------------------------------------------------------------
// Colour maths
// ---------------------------------------------------------------------------

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let body = m[1];
  if (body.length === 3) body = body[0] + body[0] + body[1] + body[1] + body[2] + body[2];
  const n = parseInt(body, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.round(clamp01(v) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  if (s <= 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (((h % 360) + 360) % 360) / 360;
  const channel = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)];
}

/** Straight linear blend between two hex colours. */
function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  return toHex(ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t);
}

/** Perceptual-ish distance, used to spot colours painted as skin. */
function distance(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  return Math.sqrt(
    (ca[0] - cb[0]) ** 2 * 0.6 + (ca[1] - cb[1]) ** 2 * 1.2 + (ca[2] - cb[2]) ** 2 * 0.4,
  );
}

/** Colours this desaturated are treated as metal or ink rather than paint. */
const NEUTRAL_SAT = 0.17;
/** Anything this close to the fighter's own body colour counts as bare skin. */
const SKIN_RANGE = 0.1;
/** Ink lines and near-blacks are left alone entirely - they are the drawing. */
const INK_LUM = 0.2;

/**
 * Recolours a single hex value under a skin. `body` is the fighter's own skin
 * tone, so bare arms and taped fists follow the face rather than the cloth.
 */
function shade(hex: string, skin: SkinDef, body: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  // The ink the whole figure is drawn in stays ink. Shifting it turns the
  // outlines into coloured pencil and the fighter stops reading as a drawing.
  if (hsl.l <= INK_LUM) return hex;

  // Bare skin follows the skin's tone, never the hue wheel.
  if (distance(hex, body) < SKIN_RANGE) return mix(hex, skin.tone, skin.toneMix);

  // Near-greys are steel, bone, cloth-white: tint rather than rotate.
  if (hsl.s < NEUTRAL_SAT) {
    const tinted = mix(hex, skin.metal, skin.metalMix);
    const t = parseHex(tinted)!;
    const th = rgbToHsl(t[0], t[1], t[2]);
    th.l = clamp01(th.l + skin.lum);
    const out = hslToRgb(th);
    return toHex(out[0], out[1], out[2]);
  }

  // Everything else: rotate, adjust, done.
  const out = hslToRgb({
    h: hsl.h + skin.hue,
    s: clamp01(hsl.s * skin.sat),
    l: clamp01(hsl.l + skin.lum),
  });
  return toHex(out[0], out[1], out[2]);
}

// ---------------------------------------------------------------------------
// Applying a skin to a fighter
// ---------------------------------------------------------------------------

function shadePart(part: ShapePart, skin: SkinDef, body: string): ShapePart {
  return part.color ? { ...part, color: shade(part.color, skin, body) } : part;
}

function shadeProp(prop: PropDef, skin: SkinDef, body: string): PropDef {
  const out: PropDef = { ...prop, parts: prop.parts.map((p) => shadePart(p, skin, body)) };
  if (prop.cloth) {
    out.cloth = {
      ...prop.cloth,
      color: shade(prop.cloth.color, skin, body),
      lining: prop.cloth.lining ? shade(prop.cloth.lining, skin, body) : undefined,
    };
  }
  return out;
}

/**
 * Returns a recoloured copy of a fighter. Nothing about the simulation
 * changes - the id, stats, frame data and hitboxes are shared by reference, so
 * a skinned fighter plays frame-for-frame identically to the original.
 */
export function applySkin(def: FighterDef, skin: SkinDef): FighterDef {
  if (skin.hue === 0 && skin.sat === 1 && skin.lum === 0 && skin.metalMix === 0 && skin.toneMix === 0) {
    return def;
  }
  const body = def.palette.body;
  const sh = (hex: string) => shade(hex, skin, body);

  return {
    ...def,
    palette: {
      body: mix(def.palette.body, skin.tone, skin.toneMix),
      // The ink is the drawing; it never moves.
      outline: def.palette.outline,
      accent: sh(def.palette.accent),
      cloth: sh(def.palette.cloth),
      metal: sh(def.palette.metal),
      aura: sh(def.palette.aura),
    },
    props: def.props.map((p) => shadeProp(p, skin, body)),
    resource: def.resource ? { ...def.resource, color: sh(def.resource.color) } : undefined,
    // Projectile and effect colours live inside the move list. Only the moves
    // that actually name a colour are copied; the rest stay shared.
    moves: def.moves.map((move) => {
      const needsWork =
        move.projectiles?.some((p) => p.color || p.trail) || move.vfx?.some((v) => v.color);
      if (!needsWork) return move;
      return {
        ...move,
        projectiles: move.projectiles?.map((p) => ({
          ...p,
          color: p.color ? sh(p.color) : undefined,
          trail: p.trail ? sh(p.trail) : undefined,
        })),
        vfx: move.vfx?.map((v) => (v.color ? { ...v, color: sh(v.color) } : v)),
      };
    }),
  };
}

/**
 * Picks player 2's skin in a mirror match. Two identical fighters in identical
 * colours is unreadable, so if both sides land on the same look, P2 is moved
 * one along the list.
 */
export function distinctSkin(p1Fighter: string, p1Skin: string, p2Fighter: string, p2Skin: string): string {
  if (p1Fighter !== p2Fighter || p1Skin !== p2Skin) return p2Skin;
  const i = SKINS.findIndex((s) => s.id === p2Skin);
  return SKINS[(i + 1) % SKINS.length].id;
}

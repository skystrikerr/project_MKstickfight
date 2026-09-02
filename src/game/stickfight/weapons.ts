/**
 * Weapon variants.
 *
 * Every fighter here carries a specific object, and for most of them the
 * historical record offers more than one answer about which object it was.
 * A variant is that argument made playable: not a recolour and not a fantasy
 * upgrade, but a different documented pattern of the same weapon, drawn to
 * the same standard as the default and captioned with why it is a real
 * option.
 *
 * That is the whole rule for adding one. If a variant cannot be pointed at
 * something in the record - a typology, a period, a find - it does not belong
 * in this file, because the point of the system is to tie a fighter tighter
 * to their kit rather than to hand out costumes.
 *
 * Mechanically a variant is a pure geometry swap: it names props by id and
 * replaces their `parts`. It composes with the skin system, and it runs
 * first, so a recoloured fighter recolours whichever weapon they are holding.
 */

import type { FighterDef, PropDef, ShapePart } from "./types";

/**
 * Reserved. Weapons are cosmetic today - a variant changes what a fighter is
 * holding and nothing about how they fight, which is deliberate: the roster
 * is not evenly balanced yet (see tools/balance.ts), and per-weapon stats
 * would multiply the matchup space before that is settled.
 *
 * When that changes, the modifiers belong here rather than in the move list,
 * so a variant stays one object describing one weapon. Nothing reads this
 * yet, and a self-test holds every shipped variant to leaving it unset.
 */
export interface WeaponStats {
  /** Multiplier on the reach of moves that use this weapon. */
  reach?: number;
  /** Multiplier on damage dealt by those moves. */
  damage?: number;
  /** Multiplier on startup frames. Above 1 is slower. */
  speed?: number;
}

export interface WeaponVariant {
  id: string;
  name: string;
  /** Why this is a real pattern and not an invention. Shown on the select screen. */
  blurb: string;
  /**
   * Prop id -> replacement geometry. A variant may re-cut more than one prop:
   * a sword and its scabbard are one decision, not two.
   */
  parts: Record<string, ShapePart[]>;
  /** Reserved - see WeaponStats. Unset on everything that ships today. */
  stats?: WeaponStats;
}

/**
 * The default is never listed. Every fighter already has a weapon drawn in
 * their own file, and that is variant zero: selecting nothing gets you the
 * fighter exactly as authored.
 */
export const WEAPONS: Record<string, WeaponVariant[]> = {
  roman: [
    {
      id: "hasta",
      name: "Hasta",
      blurb:
        "The thrusting spear the legions carried before the pilum took over, and kept in the third rank long after. Heavier head, no throwing shank, a butt-spike to plant it.",
      parts: {
        spear: [
          { geo: "cyl", size: [3, 130], pos: [24, 0], rot: 90, color: "#7a5230" },
          // Socket collar rather than the pilum's long iron shank.
          { geo: "box", size: [10, 7.5], pos: [86, 0], color: "#d9a441" },
          { geo: "box", size: [5, 6], pos: [78, 0], color: "#b8862f" },
          // Leaf blade: wide at the shoulder, drawn to a long point.
          { geo: "poly", size: [0, 0, -12, 7.5, -22, 6.5, -30, 0, -22, -6.5, -12, -7.5], pos: [120, 0], color: "#c9d1d9" },
          // Midrib catching the light down the centre of the leaf.
          { geo: "box", size: [26, 1.8], pos: [104, 0], color: "#eef2f6" },
          { geo: "box", size: [12, 6], pos: [4, 0], color: "#5c3d22" },
          { geo: "box", size: [12, 2], pos: [4, 2], color: "#7a5230" },
          // Sauroter: the bronze spike that plants it, and finishes a man on the ground.
          { geo: "cone", size: [4, 15], pos: [-46, 0], rot: -90, color: "#d9a441" },
        ],
      },
    },
  ],

  spartan: [
    {
      id: "gorgon",
      name: "Gorgon Blazon",
      blurb:
        "A personal device rather than the state one. The lambda everybody draws on a Spartan shield is attested well after Thermopylae; a gorgoneion is what the vase painters were actually putting on shields in his lifetime.",
      parts: {
        aspis: [
          { geo: "disc", size: [27], pos: [15, 0], color: "#7c5a24", z: 0.5 },
          { geo: "ring", size: [27, 4.5], pos: [15, 0], color: "#e2b45c", z: 0.55 },
          { geo: "disc", size: [22.5], pos: [15, 0], color: "#c98f3a", z: 0.6 },
          { geo: "ring", size: [22.5, 2], pos: [15, 0], color: "#8a6228", z: 0.62 },
          { geo: "disc", size: [19.5], pos: [15, 0], color: "#9e2b2b", z: 0.7 },
          // Gorgoneion: a round face, staring, tongue out, snakes at the edge.
          { geo: "disc", size: [12], pos: [15, 0], color: "#f0e6d2", z: 0.78 },
          { geo: "disc", size: [3.1], pos: [10, 4], color: "#9e2b2b", z: 0.82 },
          { geo: "disc", size: [3.1], pos: [20, 4], color: "#9e2b2b", z: 0.82 },
          { geo: "disc", size: [1.4], pos: [10, 4], color: "#241a10", z: 0.84 },
          { geo: "disc", size: [1.4], pos: [20, 4], color: "#241a10", z: 0.84 },
          // Mouth and the tongue hanging out of it.
          { geo: "box", size: [11, 2.6], pos: [15, -4], color: "#9e2b2b", z: 0.83 },
          { geo: "poly", size: [-2.2, 0, 2.2, 0, 1.4, -5.5, -1.4, -5.5], pos: [15, -6], color: "#9e2b2b", z: 0.84 },
          // Snakes, read as four blunt coils around the rim of the face.
          { geo: "disc", size: [2.4], pos: [6, 10], color: "#5f7a3a", z: 0.79 },
          { geo: "disc", size: [2.4], pos: [24, 10], color: "#5f7a3a", z: 0.79 },
          { geo: "disc", size: [2.4], pos: [4, -8], color: "#5f7a3a", z: 0.79 },
          { geo: "disc", size: [2.4], pos: [26, -8], color: "#5f7a3a", z: 0.79 },
          { geo: "disc", size: [1.5], pos: [15, 24], color: "#f2d68e", z: 0.85 },
          { geo: "disc", size: [1.5], pos: [15, -24], color: "#f2d68e", z: 0.85 },
          { geo: "disc", size: [1.5], pos: [39, 0], color: "#f2d68e", z: 0.85 },
          { geo: "disc", size: [1.5], pos: [-9, 0], color: "#f2d68e", z: 0.85 },
        ],
      },
    },
  ],

  viking: [
    {
      id: "daneaxe",
      name: "Dane Axe",
      blurb:
        "The long-hafted broad axe that spreads across the Norse world around her own lifetime. A thin crescent on the end of a much longer shaft - all reach and all commitment.",
      parts: {
        axe: [
          // Half again the haft of the bearded axe, and no beard on the head.
          { geo: "cyl", size: [2.9, 108], pos: [34, 0], rot: 90, color: "#6d4a2c" },
          { geo: "box", size: [12, 5], pos: [70, 0], color: "#4a3422" },
          // The head is the whole difference, and it is mostly edge on very
          // little metal - which is the point of the weapon. A thin neck off
          // the eye keeps the mass off the haft; without it the fan fills in
          // solid and the thing reads as a spade rather than an axe.
          { geo: "box", size: [18, 8], pos: [74, 0], color: "#8a9199" },
          { geo: "poly", size: [
              0, 5, 7, 18, 11, 28,
              15, 23, 16, 0, 15, -23,
              11, -28, 7, -18, 0, -5,
            ], pos: [83, 0], color: "#98a0a8" },
          // The edge, and only the edge: a thin bright arc horn to horn, kept
          // narrow so it separates from the head instead of merging with it.
          { geo: "poly", size: [0, 27, 3, 17, 3.5, 0, 3, -17, 0, -27, -2, -18, -2.5, 0, -2, 18], pos: [98, 0], color: "#f4f8fb" },
          { geo: "box", size: [16, 5], pos: [4, 0], color: "#4a3422" },
          { geo: "box", size: [16, 1.8], pos: [4, 1.6], color: "#8a6440" },
          { geo: "poly", size: [-4, 4, 4, 4, 3, -4, -3, -4], pos: [-16, 0], color: "#c9a24a" },
        ],
      },
    },
  ],

  samurai: [
    {
      id: "tachi",
      name: "Tachi",
      blurb:
        "The sword she would actually have been wearing. The Genpei war is tachi country - deeper curve, slung edge-down from the belt cords. The katana is a later fashion the retellings gave her.",
      parts: {
        katana: [
          // More sori than the katana, and the curve carried nearer the hilt.
          { geo: "blade", size: [90, 6.4, 0.3], pos: [52, 6], rot: 8, color: "#9aa7b5" },
          { geo: "poly", size: [-44, 2.6, 44, 1.7, 46, -0.6, -44, -0.9], pos: [52, 7], rot: 8, color: "#e2e8f0" },
          // Tachi fittings run heavier and more decorated than a katana's.
          { geo: "disc", size: [6], pos: [4, 0], color: "#d9b25a" },
          { geo: "ring", size: [6, 1.2], pos: [4, 0], color: "#8a6a2f", z: 0.1 },
          { geo: "disc", size: [3], pos: [4, 0], color: "#8a6a2f", z: 0.12 },
          { geo: "cyl", size: [2.5, 24], pos: [-11, -1], rot: 90, color: "#1d2733" },
          { geo: "poly", size: [-3, 3, 3, 3, 3, -3, -3, -3], pos: [-4, -1], rot: 45, color: "#b3323c" },
          { geo: "poly", size: [-3, 3, 3, 3, 3, -3, -3, -3], pos: [-11, -1], rot: 45, color: "#b3323c" },
          { geo: "poly", size: [-3, 3, 3, 3, 3, -3, -3, -3], pos: [-18, -1], rot: 45, color: "#b3323c" },
          // Kabutogane: the capped pommel a tachi carries instead of a flat butt.
          { geo: "disc", size: [3.6], pos: [-24, -1], color: "#d9b25a" },
          { geo: "box", size: [3, 7], pos: [-23, -1], color: "#d9b25a" },
        ],
        // Hung the other way up, because a tachi is worn edge-down.
        saya: [
          { geo: "cyl", size: [3.6, 80], pos: [-16, 2], rot: 106, color: "#1d2733", behind: true },
          { geo: "box", size: [8, 5], pos: [2, -10], rot: 106, color: "#d9b25a", behind: true },
          { geo: "box", size: [6, 4], pos: [-8, 12], rot: 106, color: "#d9b25a", behind: true },
        ],
      },
    },
  ],

  knight: [
    {
      id: "typexv",
      name: "Type XV",
      blurb:
        "Oakeshott's Type XV: a stiff diamond section tapering the whole way to the point, no fuller. The answer the armourers forced - by Poitiers a cutting edge was losing the argument with plate.",
      parts: {
        sword: [
          // One long taper rather than parallel edges and a fuller.
          { geo: "poly", size: [0, 0, -62, 7.5, -70, 6, -70, -6, -62, -7.5], pos: [86, 0], color: "#dbe3ea" },
          // The central ridge that makes the section stiff enough to thrust.
          { geo: "poly", size: [0, 0, -62, 1.9, -70, 1.5, -70, -1.5, -62, -1.9], pos: [86, 0], color: "#f2f7fb" },
          { geo: "box", size: [7, 6], pos: [11, 0], color: "#b6c0c9" },
          { geo: "poly", size: [-2.5, -14, 2.5, -14, 3.5, 0, 2.5, 14, -2.5, 14, -3.5, 0], pos: [9, 0], color: "#d9b25a" },
          { geo: "disc", size: [2.2], pos: [9, 12.5], color: "#e2c877" },
          { geo: "disc", size: [2.2], pos: [9, -12.5], color: "#e2c877" },
          { geo: "box", size: [16, 6], pos: [-1, 0], color: "#4b3524" },
          { geo: "box", size: [16, 1.6], pos: [-1, 1.6], color: "#63472f" },
          { geo: "box", size: [16, 1.6], pos: [-1, -1.6], color: "#63472f" },
          // Scent-stopper pommel, the shape that goes with this blade.
          { geo: "poly", size: [-5, 4.6, 3, 4.6, 5, 0, 3, -4.6, -5, -4.6], pos: [-12, 0], color: "#d9b25a" },
          { geo: "disc", size: [1.6], pos: [-12, 0], color: "#8f7530" },
        ],
      },
    },
  ],
};

/** Every variant a fighter has, default excluded. Empty for most of the roster. */
export function weaponsFor(fighterId: string): WeaponVariant[] {
  return WEAPONS[fighterId] ?? [];
}

export function getWeapon(fighterId: string, variantId: string | undefined): WeaponVariant | null {
  if (!variantId) return null;
  return weaponsFor(fighterId).find((w) => w.id === variantId) ?? null;
}

/**
 * Swaps a fighter onto a weapon variant.
 *
 * Pure, like `applySkin`, and for the same reason: the select screen wants to
 * draw a preview of a fighter it is not going to keep. An unknown id, or none,
 * gives back the fighter untouched rather than a fighter holding nothing.
 */
export function applyWeapon(def: FighterDef, variantId: string | undefined): FighterDef {
  const variant = getWeapon(def.id, variantId);
  if (!variant) return def;
  return {
    ...def,
    props: def.props.map((p: PropDef) => {
      const parts = variant.parts[p.id];
      return parts ? { ...p, parts } : p;
    }),
  };
}

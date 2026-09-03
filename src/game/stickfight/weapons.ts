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

import { AI_LEVELS, type AiLevel } from "./constants";
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

/**
 * What it takes to earn a variant.
 *
 * Deliberately a small closed set rather than a free-form predicate: the
 * select screen has to be able to say what you still owe in one short line,
 * and a rule it cannot describe is a rule nobody will ever meet on purpose.
 *
 * Everything is per fighter. Playing Vercingetorix does not move Ötzi an inch,
 * because the whole point is that the kit belongs to the person carrying it.
 */
export type WeaponUnlock =
  | { kind: "wins"; count: number }
  | { kind: "matches"; count: number }
  | { kind: "clear"; level: AiLevel };

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
  /** What has to happen before this can be selected. */
  unlock: WeaponUnlock;
  /** Reserved - see WeaponStats. Unset on everything that ships today. */
  stats?: WeaponStats;
}

/**
 * The default is never listed. Every fighter already has a weapon drawn in
 * their own file, and that is variant zero: selecting nothing gets you the
 * fighter exactly as authored.
 */
/** Hemp cord wound over the knuckles and up the wrist. Both hands take it. */
const KAAD_HAND: ShapePart[] = [
  { geo: "poly", size: [-6, 3, -4, 6, 3, 6.5, 7, 3, 7, -3, 3, -6.5, -4, -6, -6, -3], pos: [1, 0], color: "#c9b489" },
  // The cord itself: turns across the knuckles, then up the forearm.
  { geo: "box", size: [2.2, 13], pos: [-2, 0], rot: 14, color: "#8a7048" },
  { geo: "box", size: [2.2, 13], pos: [2, 0], rot: 14, color: "#a08a58" },
  { geo: "box", size: [2.2, 12], pos: [6, 0], rot: 14, color: "#8a7048" },
  { geo: "box", size: [11, 2], pos: [-4, 3], rot: -8, color: "#a08a58" },
  { geo: "box", size: [11, 2], pos: [-4, -3], rot: -8, color: "#8a7048" },
  { geo: "poly", size: [-3, 5, 3, 4, 3, -4, -3, -5], pos: [-6, 0], color: "#7a6240" },
];

/** A straight throwing spike. Kuro carries one in each hand. */
const BO_SPIKE: ShapePart[] = [
  { geo: "poly", size: [-14, 2.2, 10, 1.8, 20, 0, 10, -1.8, -14, -2.2], pos: [6, 0], color: "#aab2be" },
  { geo: "poly", size: [-10, 0.9, 8, 0.7, 16, 0, 8, -0.7, -10, -0.9], pos: [8, 0], color: "#e2e8f0" },
  // Bound at the butt so it leaves the hand the same way every time.
  { geo: "box", size: [9, 3.6], pos: [-9, 0], color: "#141019" },
  { geo: "box", size: [9, 1.2], pos: [-9, 1], color: "#3a3040" },
];

export const WEAPONS: Record<string, WeaponVariant[]> = {
  roman: [
    {
      id: "hasta",
      name: "Hasta",
      blurb:
        "The thrusting spear the legions carried before the pilum took over, and kept in the third rank long after. Heavier head, no throwing shank, a butt-spike to plant it.",
      unlock: { kind: "wins", count: 3 },
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
      unlock: { kind: "wins", count: 3 },
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
      unlock: { kind: "clear", level: "Veteran" },
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


  muaythai: [
    {
      id: "kaadchuek",
      name: "Kaad Chuek",
      blurb:
        "Hemp cord wound over the hands and up the forearms, the binding used before gloves and the one in every account of the prize fights he was made to take. Soaked and dried it sets hard, which is the point of it.",
      unlock: { kind: "wins", count: 3 },
      parts: {
        handwrapF: KAAD_HAND,
        handwrapB: KAAD_HAND,
      },
    },
  ],

  jaguar: [
    {
      id: "tepoztopilli",
      name: "Tepoztopilli",
      blurb:
        "The other half of the Mexica armoury: a polearm with obsidian set down both edges of a broad head, used to keep a Spanish sword at a distance the macuahuitl could not. Sahagun's informants describe both in the same breath.",
      unlock: { kind: "wins", count: 3 },
      parts: {
        macuahuitl: [
          { geo: "cyl", size: [2.8, 76], pos: [26, 0], rot: 90, color: "#8a5a30" },
          // Broad leaf head, obsidian down both edges rather than a flat paddle.
          { geo: "poly", size: [-26, 3, -14, 10, 0, 12, 16, 8, 24, 0, 16, -8, 0, -12, -14, -10, -26, -3], pos: [72, 0], color: "#a97445" },
          { geo: "poly", size: [-20, 2, -10, 6, 0, 7, 12, 5, 18, 0, 12, -5, 0, -7, -10, -6, -20, -2], pos: [72, 0], color: "#c08f5c", z: 0.1 },
          ...[[-16, 9], [-6, 11.5], [4, 11], [13, 8]].map(([x, y]) => ({
            geo: "poly" as const, size: [0, 0, -4, 4.5, 4, 4], pos: [72 + x, y] as [number, number], color: "#2f2a3d", z: 0.2,
          })),
          ...[[-16, -9], [-6, -11.5], [4, -11], [13, -8]].map(([x, y]) => ({
            geo: "poly" as const, size: [0, 0, -4, -4.5, 4, -4], pos: [72 + x, y] as [number, number], color: "#2f2a3d", z: 0.2,
          })),
          { geo: "box", size: [14, 6], pos: [2, 0], color: "#5c3a1e" },
          { geo: "box", size: [14, 1.8], pos: [2, 1.8], color: "#3fae8f" },
          { geo: "box", size: [14, 1.8], pos: [2, -1.8], color: "#a8382b" },
          { geo: "poly", size: [-4, 4, 4, 4, 3, -4, -3, -4], pos: [-14, 0], color: "#5c3a1e" },
        ],
      },
    },
  ],


  western: [
    {
      id: "schofield",
      name: "Smith & Wesson Model 3",
      blurb:
        "The top-break the frontier actually liked: the whole barrel hinges down and every case ejects at once, so it reloads in a fraction of the time a Colt's loading gate allows. Earp is on record with more than one revolver, and the Buntline is the part of the story nobody can source.",
      unlock: { kind: "wins", count: 4 },
      parts: {
        revolver: [
          // Longer barrel, and the top-break latch and hinge that name it.
          { geo: "poly", size: [-13, 2.6, 13, 2.2, 13, -2.2, -13, -2.6], pos: [17, 2], color: "#4f545c" },
          { geo: "box", size: [22, 1.6], pos: [17, 4.2], color: "#9aa2ab" },
          // The rib along the top, which a Colt does not have.
          { geo: "box", size: [24, 1.4], pos: [17, 5], color: "#6b7079" },
          { geo: "poly", size: [-5, 5, 5, 4.5, 5, -4.5, -5, -5], pos: [2, 1], color: "#b8bfc7" },
          { geo: "box", size: [9, 1.4], pos: [2, 3], color: "#8f979f" },
          { geo: "box", size: [9, 1.4], pos: [2, -1], color: "#8f979f" },
          // Barrel latch over the frame.
          { geo: "box", size: [7, 3], pos: [7, 6], color: "#8f979f", z: 0.2 },
          { geo: "poly", size: [0, 0, -3, 4, -6, 3, -4, -2], pos: [-4, 3], color: "#3f444b" },
          { geo: "box", size: [3, 5], pos: [1, -5], rot: 8, color: "#3f444b" },
          // Birdshead grip rather than the Colt's plough handle.
          { geo: "poly", size: [4, 4, -2, 2, -7, -6, -3, -10, 3, -4], pos: [-3, -4], color: "#3a2410" },
          { geo: "disc", size: [1.4], pos: [-4, -6], color: "#c9a24a", z: 0.3 },
        ],
      },
    },
  ],

  soldier: [
    {
      id: "m14",
      name: "M14",
      blurb:
        "What the battalion had been carrying until the month before. The changeover was still running through Vietnam in 1965, so both rifles were in the valley: wood stock, twenty rounds of 7.62, and a great deal more of it going downrange per trigger pull.",
      unlock: { kind: "wins", count: 4 },
      parts: {
        rifle: [
          // Wood, not plastic, and a straight stock with no carry handle.
          { geo: "poly", size: [-16, 4.5, 14, 4.5, 14, -4, -16, -4.5], pos: [-4, 2], color: "#6b4a2c" },
          { geo: "poly", size: [-12, 4, 13, 3.5, 13, -3.5, -12, -4], pos: [22, 2], color: "#7a5636" },
          { geo: "box", size: [24, 1.5], pos: [22, 4], color: "#8a6440" },
          // Receiver: bare steel above the wood.
          { geo: "poly", size: [-12, 0, -10, 5, 10, 5, 12, 0], pos: [-2, 6], color: "#3a3f45" },
          { geo: "box", size: [5, 4], pos: [-11, 9], color: "#22262a" },
          // Longer exposed barrel with the flash suppressor on the end.
          { geo: "cyl", size: [1.7, 30], pos: [48, 2], rot: 90, color: "#22262a" },
          { geo: "poly", size: [-2.5, 0, -2, 7, 2, 7, 2.5, 0], pos: [37, 4], color: "#3a3f45" },
          { geo: "poly", size: [-6, 3, 6, 3.6, 6, -3.6, -6, -3], pos: [64, 2], color: "#3f454b" },
          { geo: "poly", size: [-3.5, 7, 3.5, 6, 4.5, -7, -2.5, -7], pos: [4, -8], rot: -6, color: "#5c3f26" },
          { geo: "poly", size: [3, 4, -2, 3, -5, -7, 0, -8], pos: [-6, -6], color: "#22262a" },
          // Twenty-round box, shorter and straighter than the M16 curve.
          { geo: "poly", size: [-5, 5, 5, 5, 4, -8, -4, -8], pos: [10, -9], color: "#2b3036" },
          { geo: "poly", size: [-10, 5, 10, 6, 10, -3, -10, -5], pos: [-26, 0], color: "#6b4a2c" },
          { geo: "box", size: [4, 10], pos: [-36, 0], color: "#3a2a18" },
        ],
      },
    },
  ],


  zulu: [
    {
      id: "isijula",
      name: "Isijula",
      blurb:
        "The long throwing spear Shaka is said to have taken off his regiments in favour of the short stabbing one, on the grounds that a man who throws his weapon has then given it away. Mgobozi fought through the change and would have started with this.",
      unlock: { kind: "wins", count: 3 },
      parts: {
        iklwa: [
          // Long light shaft: thrown, so all the length is behind the head.
          { geo: "cyl", size: [2.2, 104], pos: [34, 0], rot: 90, color: "#8a6238" },
          { geo: "box", size: [7, 5], pos: [82, 0], color: "#a8724a" },
          // Narrow head, a third the width of the iklwa's broad blade.
          { geo: "poly", size: [0, 0, -18, 4, -24, 3, -24, -3, -18, -4], pos: [96, 0], color: "#dbe3ea" },
          { geo: "box", size: [20, 1.4], pos: [86, 0], color: "#9aa6b1" },
          { geo: "box", size: [12, 5.4], pos: [4, 0], color: "#4a3220" },
          { geo: "poly", size: [0, 3, -6, 4, -9, 0, -6, -4, 0, -3], pos: [-16, 0], color: "#efe8dc" },
        ],
      },
    },
  ],

  maori: [
    {
      id: "tewhatewha",
      name: "Tewhatewha",
      blurb:
        "The quarter-moon club: the broad blade is a flag rather than an edge - it is waved to signal the line - and the killing end is the point on the shaft. A chief's weapon and a chief's instrument at once, which is exactly the job he held.",
      unlock: { kind: "clear", level: "Rookie" },
      parts: {
        taiaha: [
          { geo: "cyl", size: [3, 92], pos: [8, 0], rot: 90, color: "#4a3526" },
          // The axe-shaped head: broad, flat, and hung with feathers.
          { geo: "poly", size: [-4, 6, 10, 26, 26, 30, 30, 22, 18, 2, 6, -6], pos: [50, 0], color: "#6b4a30" },
          { geo: "box", size: [26, 2], pos: [62, 20], rot: 32, color: "#9a7550" },
          { geo: "box", size: [3, 11], pos: [70, 30], rot: 10, color: "#efe7d6" },
          { geo: "box", size: [3, 13], pos: [76, 28], rot: -6, color: "#d8cdb4" },
          { geo: "box", size: [3, 10], pos: [64, 32], rot: 18, color: "#efe7d6" },
          // The business end: a spear point on the butt, not on the blade.
          { geo: "poly", size: [0, 4, -14, 3, -20, 0, -14, -3, 0, -4], pos: [-40, 0], color: "#3a2819" },
          { geo: "poly", size: [0, 2, -10, 1.4, -14, 0, -10, -1.4, 0, -2], pos: [-42, 0], color: "#8a6a4a" },
          { geo: "box", size: [7, 10], pos: [-26, 0], color: "#efe7d6" },
        ],
      },
    },
  ],

  persian: [
    {
      id: "pomegranate",
      name: "Silver Pomegranate",
      blurb:
        "Herodotus counts the corps twice over: a thousand with golden apples on the butt of the spear, and nine thousand behind them with silver pomegranates. This is the other nine thousand's spear - the same weapon, one rank down.",
      unlock: { kind: "matches", count: 5 },
      parts: {
        spear: [
          { geo: "cyl", size: [2.8, 88], pos: [26, 0], rot: 90, color: "#8a6238" },
          { geo: "poly", size: [0, 0, -15, 3.4, -19, 2.6, -19, -2.6, -15, -3.4], pos: [80, 0], color: "#c3ccd6" },
          { geo: "poly", size: [0, 0, -13, 1.1, -17, 0.9, -17, -0.9, -13, -1.1], pos: [79, 0], color: "#eef3f8" },
          { geo: "box", size: [6, 5], pos: [58, 0], color: "#8f979f" },
          { geo: "box", size: [18, 5], pos: [8, 0], color: "#3f2f1c" },
          { geo: "box", size: [18, 1.6], pos: [8, 1.8], color: "#8a6a42" },
          // Silver, and a pomegranate rather than an apple - narrower, with
          // the little crown of sepals on the end.
          { geo: "poly", size: [-5, 6, 3, 5, 6, 0, 3, -5, -5, -6], pos: [-20, 0], color: "#b9c0c8" },
          { geo: "poly", size: [0, 3, 4, 2, 4, -2, 0, -3], pos: [-26, 0], color: "#d8dde3" },
          { geo: "disc", size: [2], pos: [-19, 1], color: "#e6ebef", z: 0.1 },
          { geo: "box", size: [3, 5], pos: [-14, 0], color: "#8f979f" },
        ],
      },
    },
  ],

  iceman: [
    {
      id: "flintaxe",
      name: "Flint Blade",
      blurb:
        "The axe he did not carry, and the one everybody assumes he did. Knapped stone was still the ordinary answer in 3300 BC - the copper blade in the ice is the surprise, and the reason the find rewrote a date.",
      unlock: { kind: "wins", count: 3 },
      parts: {
        axe: [
          { geo: "cyl", size: [3, 34], pos: [6, 0], rot: 90, color: "#6b5334" },
          { geo: "poly", size: [-5, 3, 4, 8, 7, 7, -5, 0], pos: [23, 0], color: "#5a4429" },
          { geo: "poly", size: [-5, -3, 4, -8, 7, -7, -5, 0], pos: [23, 0], color: "#4a3722" },
          { geo: "box", size: [2.6, 15], pos: [22, 0], color: "#3f2f1c" },
          { geo: "box", size: [2.6, 12], pos: [26, 0], color: "#3f2f1c" },
          // Ground stone: shorter, blunter and thicker than the cast blade,
          // because the material will not hold an edge as fine.
          { geo: "poly", size: [-4, 7, 2, 9, 9, 9, 11, 7, 12, 0, 11, -7, 9, -9, 2, -9, -4, -7], pos: [30, 0], color: "#7d8288" },
          { geo: "poly", size: [7, 8, 10, 6.5, 11, 0, 10, -6.5, 7, -8, 5.5, -6.5, 5.5, 6.5], pos: [30, 0], color: "#5f666d" },
          { geo: "poly", size: [9, 9, 11, 7, 12, 0, 11, -7, 9, -9], pos: [30, 0], color: "#c3cad1" },
          { geo: "box", size: [20, 5], pos: [0, 0], color: "#4f3a22" },
          { geo: "box", size: [20, 1.6], pos: [0, 1.7], color: "#8a6a42" },
          { geo: "poly", size: [-3, 4, 3, 4, 2.4, -4, -2.4, -4], pos: [-10, 0], color: "#8a6a42" },
        ],
      },
    },
  ],

  pirate: [
    {
      id: "hanger",
      name: "Sailor's Hanger",
      blurb:
        "The short curved sword the word 'cutlass' was still settling onto in 1720. Plainer, straighter and cheaper: a working blade off a ship's rack rather than the swept-hilt thing the illustrations gave her a century later.",
      unlock: { kind: "wins", count: 3 },
      parts: {
        cutlass: [
          { geo: "blade", size: [52, 7, 0.5], pos: [32, 2], rot: 4, color: "#c3cbd4" },
          { geo: "poly", size: [-24, 1.8, 24, 1, 22, -1.6, -24, -0.8], pos: [32, 3.5], rot: 4, color: "#eaf0f6" },
          // A plain iron knuckle bow, not a gilded shell.
          { geo: "poly", size: [0, 8, 6, 5, 7, -6, 1, -9, 0, -5, 4, -3, 3, 3, -1, 5], pos: [1, -1], color: "#8f979f" },
          { geo: "box", size: [4, 17], pos: [3, 1], color: "#7d858d" },
          { geo: "cyl", size: [2.6, 14], pos: [-7, -1], rot: 90, color: "#4a3220" },
          { geo: "box", size: [13, 1.6], pos: [-7, 1], rot: 90, color: "#6b4a2c" },
          { geo: "disc", size: [3], pos: [-15, -1], color: "#8f979f" },
        ],
      },
    },
  ],

  ninja: [
    {
      id: "wakizashi",
      name: "Wakizashi",
      blurb:
        "The companion sword a man of his rank wore indoors and out. Worth remembering that the record calls him Devil Hanzo for what he did with a spear - the knives and the black hood are a later century's idea of him, and the sword is the part he actually carried.",
      unlock: { kind: "wins", count: 3 },
      parts: {
        tanto: [
          { geo: "poly", size: [-7, 3.6, 7, 3.2, 7, -3.2, -7, -3.6], pos: [-2, 0], color: "#2a2136" },
          { geo: "box", size: [2, 5.6], pos: [-5, 0], rot: 45, color: "#c9b489" },
          { geo: "box", size: [2, 5.6], pos: [-1, 0], rot: 45, color: "#c9b489" },
          // A real guard and a longer blade with the curve a tanto does not have.
          { geo: "disc", size: [5], pos: [6, 0], color: "#7d6a3f" },
          { geo: "ring", size: [5, 1.2], pos: [6, 0], color: "#4f4326", z: 0.1 },
          { geo: "blade", size: [46, 5.8, 0.35], pos: [32, 2], rot: 5, color: "#a9b4c2" },
          { geo: "poly", size: [-20, 1.7, 20, 1.1, 18, -1, -20, -0.7], pos: [32, 3], rot: 5, color: "#eef2f6" },
        ],
      },
    },
  ],

  mongol: [
    {
      id: "warbow",
      name: "War Bow",
      blurb:
        "The heavy end of the same design: longer rigid ears, a deeper set to the limbs and a draw nobody shoots all day. The steppe bow is a family of weapons rather than one, and this is the one that goes through armour.",
      unlock: { kind: "wins", count: 4 },
      parts: {
        bow: [
          { geo: "poly", size: [-5, 8, 4, 7, 4, -7, -5, -8], pos: [-5, 0], color: "#2f2115" },
          // Longer limbs, deeper recurve, and the siyahs set harder back.
          { geo: "poly", size: [-4, 14, 3, 13, 4, -12, -3, -13], pos: [-9, 17], rot: 16, color: "#432f1d" },
          { geo: "poly", size: [-4, 14, 3, 13, 4, -12, -3, -13], pos: [-9, -17], rot: -16, color: "#432f1d" },
          { geo: "poly", size: [-2.4, 10, 2.4, 9, 2.4, -9, -2.4, -10], pos: [-3, 33], rot: -46, color: "#b8903c" },
          { geo: "poly", size: [-2.4, 10, 2.4, 9, 2.4, -9, -2.4, -10], pos: [-3, -33], rot: 46, color: "#b8903c" },
          // Sinew backing and horn belly, bound at the grip.
          { geo: "box", size: [9, 2.4], pos: [-5, 6], color: "#8f7a58" },
          { geo: "box", size: [9, 2.4], pos: [-5, -6], color: "#8f7a58" },
          { geo: "box", size: [7, 3], pos: [-5, 0], color: "#6b5636" },
          { geo: "box", size: [1.8, 74], pos: [4, 0], color: "#efe8d6" },
        ],
      },
    },
  ],

  shaolin: [
    {
      id: "ironstaff",
      name: "Iron Staff",
      blurb:
        "Zheng Ruoceng, writing up what the monks did to a raiding party at Wengjiagang, is specific that the staves were iron. It is the same weapon and the same art, weighing about four times as much.",
      unlock: { kind: "wins", count: 4 },
      parts: {
        staff: [
          { geo: "cyl", size: [3, 118], pos: [22, 0], rot: 90, color: "#4a5058" },
          { geo: "cyl", size: [1.3, 118], pos: [22, 1.6], rot: 90, color: "#6b737d" },
          // Forged ferrules rather than fitted caps, and a corded grip so the
          // thing can be held at all.
          { geo: "box", size: [13, 8.5], pos: [76, 0], color: "#2f353a" },
          { geo: "box", size: [13, 8.5], pos: [-32, 0], color: "#2f353a" },
          { geo: "box", size: [3.4, 9], pos: [81, 0], color: "#8d959e" },
          { geo: "box", size: [3.4, 9], pos: [-37, 0], color: "#8d959e" },
          { geo: "box", size: [14, 7.4], pos: [4, 0], color: "#3a2a1a" },
          { geo: "box", size: [14, 1.6], pos: [4, 2.2], color: "#6b5636" },
          { geo: "box", size: [14, 7.4], pos: [38, 0], color: "#3a2a1a" },
          { geo: "box", size: [14, 1.6], pos: [38, 2.2], color: "#6b5636" },
        ],
      },
    },
  ],

  nihang: [
    {
      id: "khanda",
      name: "Khanda",
      blurb:
        "Straight, broad, double-edged and widening towards the tip - and the one on the Khalsa emblem, so for a Nihang it is not simply another sword. The tulwar is what he would fight with; this is what he would be buried holding.",
      unlock: { kind: "clear", level: "Brawler" },
      parts: {
        tulwar: [
          // Straight and leaf-shaped: broadest near the point, not the hilt.
          { geo: "poly", size: [0, -5, 18, -6, 34, -8, 46, -9, 54, -4, 54, 4, 46, 9, 34, 8, 18, 6, 0, 5], pos: [14, 0], color: "#dde5ec" },
          { geo: "poly", size: [0, -2, 18, -2.6, 34, -3.6, 44, -4, 50, 0, 44, 4, 34, 3.6, 18, 2.6, 0, 2], pos: [14, 0], color: "#f2f7fb", z: 0.1 },
          // The reinforcing plate down the forte that a khanda carries.
          { geo: "poly", size: [0, -4, 20, -5, 20, 5, 0, 4], pos: [14, 0], color: "#b6c0c9", z: 0.15 },
          { geo: "box", size: [5, 6], pos: [11, 0], color: "#d8b452" },
          { geo: "poly", size: [-2.4, -11, 2.4, -11, 3, 0, 2.4, 11, -2.4, 11, -3, 0], pos: [8, 0], color: "#d8b452" },
          { geo: "box", size: [13, 5.5], pos: [0, 0], color: "#3f2c1c" },
          // Disc pommel with the spike a khanda has and a tulwar does not.
          { geo: "disc", size: [5], pos: [-9, 0], color: "#d8b452" },
          { geo: "poly", size: [0, 3, -12, 1.4, -16, 0, -12, -1.4, 0, -3], pos: [-11, 0], color: "#d8b452" },
        ],
      },
    },
  ],

  shade: [
    {
      id: "boshuriken",
      name: "Bo-shuriken",
      blurb:
        "Straight iron spikes rather than a leaf blade - the shape the surviving Edo manuals actually teach, thrown point-first with no spin. Every province that tells his story hands him a different tool; this is the one the manuals agree on.",
      unlock: { kind: "wins", count: 3 },
      parts: {
        kunaiF: BO_SPIKE,
        kunaiB: BO_SPIKE,
      },
    },
  ],

  ethiopia: [
    {
      id: "wujigra",
      name: "Wujigra",
      blurb:
        "The Amharic name for the Vetterli - the Italian service rifle, so the ones in Ethiopian hands had been taken off Italians. At Dogali that is exactly where they came from, which makes it the most pointed object on his person.",
      unlock: { kind: "wins", count: 4 },
      parts: {
        rifle: [
          // Longer, plainer and all wood: a bolt-action military rifle rather
          // than the Remington's dropping block.
          { geo: "poly", size: [-20, 4.5, 16, 4, 16, -4, -20, -4.5], pos: [-4, 1], color: "#6b4a2c" },
          // Butted up against the stock rather than floated off it - the two
          // wood blocks are one piece of furniture, and a gap between them
          // reads as a broken rifle.
          { geo: "poly", size: [-11, 3.6, 21, 3.2, 21, -3.2, -11, -3.6], pos: [23, 1], color: "#7a5636" },
          { geo: "box", size: [30, 1.4], pos: [23, 3], color: "#8a6440" },
          { geo: "cyl", size: [1.7, 34], pos: [60, 1], rot: 90, color: "#2b3036" },
          { geo: "poly", size: [-11, 0, -9, 5.5, 9, 5.5, 11, 0], pos: [-2, 5], color: "#3a4046" },
          // The straight bolt handle sticking out of the receiver.
          { geo: "box", size: [3, 9], pos: [4, 9], color: "#4a5158" },
          { geo: "disc", size: [2.4], pos: [4, 13], color: "#6b737d" },
          { geo: "poly", size: [-3, 6.5, 3, 6, 4, -7, -2, -7], pos: [2, -7], rot: -6, color: "#5c3f26" },
          { geo: "poly", size: [3, 4, -2, 3, -5, -6, 0, -7], pos: [-8, -5], color: "#2b3036" },
          { geo: "box", size: [6, 3.4], pos: [78, 1], color: "#3f454b" },
        ],
        gasha: [
          // A campaign shield: plain hide over a low boss, none of the silver.
          { geo: "disc", size: [23], pos: [10, 0], color: "#6b4a30", z: 0.5 },
          { geo: "ring", size: [23, 2.4], pos: [10, 0], color: "#4a3320", z: 0.55 },
          { geo: "disc", size: [17], pos: [10, 0], color: "#7a5636", z: 0.58 },
          { geo: "disc", size: [6], pos: [10, 0], color: "#8f979f", z: 0.62 },
          { geo: "disc", size: [2.4], pos: [10, 0], color: "#c9d1d8", z: 0.64 },
        ],
      },
    },
  ],

  duelist: [
    {
      id: "rapier",
      name: "Transitional Rapier",
      blurb:
        "Longer in the blade and heavier in the hilt: the weapon the salles were still teaching when she learned, on its way out as the smallsword came in. She fought across the years the fashion changed, so either is defensible and this is the one she started on.",
      unlock: { kind: "wins", count: 3 },
      parts: {
        smallsword: [
          // Wider than the smallsword it replaces, and it has to be: drawn at the
          // smallsword's section but longer, the blade thins out to a line that
          // vanishes against a pale stage.
          { geo: "poly", size: [0, 0, -92, 3.6, -102, 2.4, -102, -2.4, -92, -3.6], pos: [106, 0], color: "#cdd6e0" },
          { geo: "box", size: [80, 1.4], pos: [52, 0.9], color: "#f4f8fc" },
          // A swept hilt instead of a plain shell: bars round the hand.
          { geo: "ring", size: [9, 1.8], pos: [10, 0], color: "#b8912f", z: 0.1 },
          { geo: "poly", size: [0, 0, 7, -7, 12, -13, 9, -15, 3, -8, -2, -2], pos: [6, -7], color: "#c9a24a" },
          { geo: "poly", size: [0, 0, 7, 7, 12, 13, 9, 15, 3, 8, -2, 2], pos: [6, 7], color: "#c9a24a" },
          { geo: "poly", size: [-2, -13, 2, -13, 2.6, 0, 2, 13, -2, 13, -2.6, 0], pos: [9, 0], color: "#c9a24a" },
          { geo: "box", size: [16, 4.6], pos: [-3, 0], color: "#3a2a1e" },
          { geo: "box", size: [16, 1.2], pos: [-3, 1.3], color: "#c9a24a" },
          // The heavy pommel a rapier needs to balance that much blade.
          { geo: "disc", size: [4.6], pos: [-13, 0], color: "#c9a24a" },
        ],
      },
    },
  ],

  celt: [
    {
      id: "earlylatene",
      name: "Early La Tène",
      blurb:
        "The shorter pattern from a century or two before him, with a waisted blade and a leaf point that can still be used to thrust. The long cutting sword he carries is the late form - Gaul spent four hundred years arriving at it.",
      unlock: { kind: "wins", count: 3 },
      parts: {
        longsword: [
          // Waisted: wide at the shoulder, pinched, then swelling to a point.
          { geo: "poly", size: [0, 0, -8, 6, -22, 7.5, -34, 6, -46, 8, -52, 8.5, -52, -8.5, -46, -8, -34, -6, -22, -7.5, -8, -6], pos: [58, 0], color: "#b6bec7" },
          { geo: "poly", size: [0, 0, -10, 2, -44, 2.4, -50, 2, -50, -2, -44, -2.4, -10, -2], pos: [56, 0], color: "#e6edf3" },
          { geo: "box", size: [4, 13], pos: [7, 0], color: "#5a4630" },
          { geo: "cyl", size: [3, 17], pos: [-2, 0], rot: 90, color: "#4a3524" },
          { geo: "box", size: [15, 1.6], pos: [-2, 1.8], color: "#8a6a42" },
          // Anthropoid pommel: the little pair of arms these are known for.
          { geo: "poly", size: [-6, 4, 6, 4, 5, -4, -5, -4], pos: [-12, 0], color: "#c08a3e" },
          { geo: "box", size: [3, 7], pos: [-14, 6], rot: 18, color: "#c08a3e" },
          { geo: "box", size: [3, 7], pos: [-14, -6], rot: -18, color: "#c08a3e" },
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
      unlock: { kind: "clear", level: "Veteran" },
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
      unlock: { kind: "wins", count: 4 },
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

/**
 * Arena backdrops. Each theme is a handful of parallax layers built from flat
 * shapes - cheap to draw, and they read instantly at a glance - plus an
 * optional ambient weather system (rain, snow, embers, petals, dust).
 *
 * Adding a stage: add a key to StageTheme, an entry to STAGE_THEMES, and a
 * build method. Nothing else needs to change - the select screen reads the
 * registry.
 */
import type { Platform, StageRules } from "../types";
import { detailScale } from "./detail";
import type { StageLight } from "./shapes";

import * as THREE from "three";
import { STAGE_HALF_WIDTH } from "../constants";

export type StageTheme =
  | "colosseum"
  | "deck"
  | "frontier"
  | "dojo"
  | "neon"
  | "tundra"
  | "forge"
  | "skyward"
  | "delta"
  | "mactan"
  | "watling"
  | "causeway"
  // Arcade levels: wide, built and multi-storey. See StageKind.
  | "ironworks"
  // Painted backdrops rather than built shapes.
  | "postroad"
  | "dryclaim"
  | "swallowed"
  // Stages with ledges to fight on as well as a floor.
  | "aqueduct"
  | "terraces"
  | "siegeworks";

export type AmbientKind = "none" | "rain" | "snow" | "petal" | "ember" | "dust";

export interface AmbientDef {
  kind: AmbientKind;
  /** Number of particles alive at once. */
  count: number;
  colors: string[];
  /** Fall speed in units per frame (negative rises). */
  speed: number;
  /** Horizontal drift per frame. */
  wind: number;
  size: [number, number];
  opacity: number;
}

/**
 * A painted backdrop: one bitmap on one quad, in place of built shapes.
 *
 * Sizing is the whole job, and it is a squeeze between two limits. Too large
 * and the camera only frames a patch of the picture, with whatever the
 * painting was actually about sitting off the top of the screen. Too small
 * and the edge of the quad walks into shot at the corners. The camera tops
 * out at 980 units wide and a 0.25-parallax layer slides about 68 either way,
 * so anything from ~1120 up clears the edge.
 */
export interface BackdropDef {
  /** File name inside src/assets. */
  file: string;
  /** The source image's own aspect. The quad is never letterboxed. */
  aspect: number;
  /** Quad width in world units. */
  width: number;
  /**
   * How far the bottom edge sits below the floor. Sinking it buries the
   * painted foreground - the part that would otherwise argue with the arena -
   * and lifts the subject to head height behind the fighters.
   */
  sink: number;
}

/**
 * What kind of place this is to fight in.
 *
 * "arena" is every stage the game shipped with: one floor, sometimes a ledge
 * or two, and a camera that never has far to travel. The fight is the whole
 * of it.
 *
 * "arcade" is the other thing - a wide, built, multi-level structure you move
 * around as much as you fight on. It exists as its own category rather than
 * as a few stages that happen to be bigger because the modes built on top of
 * it will want to ask: a casual free-for-all wants the big ones, a ranked
 * match wants the flat ones, and neither should have to keep its own list.
 */
export type StageKind = "arena" | "arcade";

export interface StageDef {
  name: string;
  blurb: string;
  /** Defaults to "arena". */
  kind?: StageKind;
  /**
   * Half the playable width, in units. Defaults to `STAGE_HALF_WIDTH`.
   *
   * The engine used to read that constant directly in five places, which made
   * every stage exactly the same size by construction. An arcade level is
   * most of the point wider than an arena, so the number travels with the
   * stage instead.
   */
  halfWidth?: number;
  sky: [string, string];
  ground: string;
  accent: string;
  ambient: AmbientDef;
  /** How this stage lights the fighters standing in it. */
  light?: StageLight;
  /** Ledges to stand on. Absent means a flat stage, which most of them are. */
  platforms?: Platform[];
  /**
   * How far the camera is allowed to zoom out on this stage, in the same
   * units as `halfWidth`. Defaults to `CAMERA.maxViewWidth`.
   *
   * An arcade stage is built to be moved around in, which means the two
   * fighters are routinely much further apart - horizontally and vertically -
   * than an arena ever lets them get. The arena default caps the zoom well
   * short of that on purpose (closer is more readable for a match that never
   * leaves one screen's worth of ground), so a stage with real distance to
   * cover has to raise it or the camera simply cannot back up far enough to
   * keep both fighters in frame.
   */
  maxViewWidth?: number;
  /**
   * What a fall on this stage costs. Absent means falls are free, which is
   * every arena and most of the roster's history - there was nowhere to fall
   * from. See `StageRules.fall` for the shape.
   */
  fall?: StageRules["fall"];
  /** Painted rather than built. Skips the built-stage haze - see the Stage ctor. */
  backdrop?: BackdropDef;
}

/** Half-width of a stage, falling back to the roster-wide default. */
export function halfWidthOf(theme: StageTheme): number {
  return STAGE_THEMES[theme].halfWidth ?? STAGE_HALF_WIDTH;
}

/**
 * The physical rules a Match needs for this stage - its width and its fall
 * damage, if any - bundled the way `Match`'s constructor actually wants them.
 *
 * A thin wrapper rather than reading `STAGE_THEMES[theme]` at both call sites:
 * the last time this stayed as two separate positional reads, a search-and-
 * replace across `game.ts` inserted an argument in the wrong position at both
 * of them without anything catching it. One function that returns the whole
 * bundle is a value that can only be passed whole, not partially forgotten.
 */
export function stageRulesFor(theme: StageTheme): StageRules {
  const def = STAGE_THEMES[theme];
  return { halfWidth: def.halfWidth ?? STAGE_HALF_WIDTH, fall: def.fall };
}

/** Every stage of one kind, for a mode that only wants the big ones. */
export function stagesOfKind(kind: StageKind): StageTheme[] {
  return STAGE_LIST.filter((t) => (STAGE_THEMES[t].kind ?? "arena") === kind);
}

/** Use for a stage with clear skies. */
export const NO_WEATHER: AmbientDef = {
  kind: "none",
  count: 0,
  colors: [],
  speed: 0,
  wind: 0,
  size: [1, 1],
  opacity: 1,
};

export const STAGE_THEMES: Record<StageTheme, StageDef> = {
  colosseum: {
    // Midday sun off yellow sand, and half a mile of travertine bouncing it back.
    light: { key: "#ffe6b8", fill: "#6b5a48", strength: 0.85, shadow: "#6e4a28", glow: 0.1 },
    name: "The Colosseum",
    blurb: "Fifty thousand Romans, one patch of sand.",
    sky: ["#b9c6d4", "#e6d7b4"],
    // Sampled straight off the painting just below its own floor line, so the
    // ground plane the fighters stand on continues the painted sand instead of
    // banding against it.
    ground: "#d8ac77",
    accent: "#e0b13a",
    // Sky and ground resampled off the painting so the arena floor the fighters
    // stand on carries into the sand behind them instead of banding against it.
    // sink solved rather than guessed: the painting's own floor line sits 168px
    // above the bottom of a 768px source, which at this width is 141 world
    // units, so sinking it 86 lands that line a little above the fighters' feet
    // and the painted sand runs down behind them into the ground plane.
    backdrop: { file: "colosseum.jpg", aspect: 1.8333, width: 1180, sink: 86 },
    ambient: { kind: "dust", count: 26, colors: ["#e8d4a8", "#c9a267"], speed: -0.12, wind: 0.16, size: [2, 5], opacity: 0.4 },
  },
  deck: {
    // Moonlight and a lantern or two. Cold key, and the sea underneath it.
    light: { key: "#cfe4ff", fill: "#16283a", strength: 0.7, shadow: "#1a2b3d", glow: 0.16 },
    name: "Storm Deck",
    blurb: "Wet planking, a rolling sea, nowhere to run.",
    sky: ["#0d1b2a", "#3f6b8a"],
    ground: "#6b4b32",
    accent: "#4fd1c5",
    ambient: { kind: "rain", count: 90, colors: ["#9fc7e8", "#cfe4f5"], speed: 13, wind: -2.6, size: [1.4, 22], opacity: 0.5 },
  },
  frontier: {
    // Low sun an hour before dark, with the red rock throwing it back up.
    light: { key: "#ffd08a", fill: "#5a2f33", strength: 0.85, shadow: "#7a3f2e", glow: 0.14 },
    name: "Perdition Flats",
    blurb: "A dead main street at sundown.",
    sky: ["#3a1f2b", "#e2925a"],
    ground: "#c98d5a",
    accent: "#ffcf6b",
    ambient: { kind: "dust", count: 34, colors: ["#e8c9a0", "#c98d5a"], speed: -0.08, wind: 0.9, size: [2, 6], opacity: 0.45 },
  },
  dojo: {
    // Blossom light: a pink sky doing most of the work.
    light: { key: "#ffd9df", fill: "#3a2f4e", strength: 0.7, shadow: "#4a3a52", glow: 0.14 },
    name: "Blossom Dojo",
    blurb: "Paper screens, old timber, falling petals.",
    sky: ["#2a2140", "#e79fa8"],
    ground: "#8a6b45",
    accent: "#ff9db4",
    ambient: { kind: "petal", count: 40, colors: ["#ffc0cf", "#ff9db4", "#ffe1e8"], speed: 1.3, wind: 0.9, size: [5, 8], opacity: 0.9 },
  },
  neon: {
    // Signage. There is no sun here at all - everything is lit by advertising.
    light: { key: "#ff6ec4", fill: "#141a3a", strength: 0.75, shadow: "#0a0d1e", glow: 0.5 },
    name: "Neon Bazaar",
    blurb: "Rain, signage and a crowd that never looks up.",
    sky: ["#080a18", "#2b1b4d"],
    ground: "#1c2030",
    accent: "#ff3ea5",
    ambient: { kind: "rain", count: 110, colors: ["#7ad7ff", "#ff6ec7"], speed: 15, wind: -1.4, size: [1.2, 26], opacity: 0.4 },
  },
  tundra: {
    // Snow glare from every direction, and a blue sky filling the shadows. A shadow on snow is blue, not black - and nothing here should bloom.
    light: { key: "#eaf4ff", fill: "#48719c", strength: 0.8, shadow: "#4a6c96", glow: 0.06 },
    name: "Frozen Pass",
    blurb: "Above the treeline, under the aurora.",
    sky: ["#0b1630", "#7099c6"],
    ground: "#b9cde0",
    accent: "#8fd0ff",
    ambient: { kind: "snow", count: 70, colors: ["#ffffff", "#dbeaff"], speed: 1.1, wind: 0.55, size: [3, 5], opacity: 0.85 },
  },
  forge: {
    // Firelight. The key is the forge itself, so it is orange and it is close.
    light: { key: "#ff9a4a", fill: "#2a1218", strength: 0.68, shadow: "#2a1412", glow: 0.4 },
    name: "Ember Forge",
    blurb: "Cut into a volcano. Mind the drop.",
    sky: ["#1a0a0e", "#8a2f1e"],
    ground: "#3b2b2b",
    accent: "#ff8a3c",
    ambient: { kind: "ember", count: 46, colors: ["#ffb648", "#ff6a2c", "#ffe6a8"], speed: -1.5, wind: 0.5, size: [3, 6], opacity: 0.9 },
  },
  delta: {
    // Sun through canopy - green-filtered, and the shadows go green with it.
    light: { key: "#e8f2c0", fill: "#2a3a2e", strength: 0.7, shadow: "#2e3a2c", glow: 0.1 },
    name: "Monsoon Delta",
    blurb: "Flooded paddy, low cloud, and the treeline too close.",
    sky: ["#1d2a24", "#7f8f66"],
    ground: "#4a5340",
    accent: "#a7d16a",
    ambient: { kind: "rain", count: 80, colors: ["#b7cfa8", "#dfe9cf"], speed: 12, wind: -1.8, size: [1.3, 20], opacity: 0.42 },
  },
  mactan: {
    name: "Mactan Shallows",
    blurb: "The boats grounded on the reef. They came the last of the way on foot.",
    sky: ["#2f6f9b", "#cfe6d8"],
    ground: "#d9c9a2",
    accent: "#5fb7c9",
    // Early morning, the sun still low over the water, and enough of it coming
    // back up off a shallow lagoon that nothing here has a dark side.
    light: { key: "#fff3d2", fill: "#4e7f96", strength: 0.78, shadow: "#4a6f7a", glow: 0.12 },
    ambient: { kind: "dust", count: 20, colors: ["#eaf6fb", "#bfe0ea"], speed: -0.08, wind: 0.1, size: [2, 4], opacity: 0.34 },
  },
  watling: {
    name: "Watling Street",
    blurb: "A defile off the road, woods on both flanks, and a city burning behind.",
    sky: ["#2a2028", "#a86a48"],
    ground: "#6a6250",
    accent: "#ff9440",
    // The only light in it that is not the sky is the fire on the horizon, so
    // the key is low and orange and everything picks up a warm edge from the
    // wrong direction. The glow is the highest on the roster - a stage lit by
    // something burning should bloom.
    light: { key: "#ffb267", fill: "#3a2e34", strength: 0.85, shadow: "#3d2c2a", glow: 0.2 },
    ambient: { kind: "ember", count: 30, colors: ["#ff9440", "#d8702a", "#8a4318"], speed: 0.22, wind: 0.35, size: [2, 5], opacity: 0.55 },
  },
  causeway: {
    name: "The Causeway",
    blurb: "A stone road across the lake, the city at the end of it, and the water on both sides.",
    sky: ["#2c4a6b", "#8f9aa0"],
    ground: "#847d70",
    accent: "#5fa9c4",
    // High-altitude morning light with a great deal of smoke in it: a clean
    // key off the lake, a cool fill, and a warm shadow where the burning is.
    light: { key: "#fff2da", fill: "#5c7d9a", strength: 0.8, shadow: "#6a5548", glow: 0.14 },
    ambient: { kind: "dust", count: 26, colors: ["#d8cbb8", "#a89a86"], speed: 0.14, wind: 0.5, size: [2, 5], opacity: 0.4 },
  },
  ironworks: {
    name: "The Ironworks",
    blurb: "Four storeys of dockyard gantry over a black tide. Everything here is a place to stand, and the top of it is a real climb.",
    kind: "arcade",
    // Wider still than the first pass. The whole idea of the category is that
    // there is somewhere to go, and 780 turned out to still be close enough to
    // an arena that two fighters found each other again in about a second.
    halfWidth: 950,
    // The camera has to be allowed to back up as far as the stage is wide, or
    // the far corners of it are a place the player can stand but never see.
    // An arena never asks for more than the default, because an arena never
    // puts this much ground between two people.
    maxViewWidth: 1700,
    // A fall from the gantry or the crow's nest costs a little health -
    // nothing that decides a round on its own, but enough that jumping off
    // the top rather than fighting your way down is a real cost and not a
    // free escape. Capped low, and it never reads as damage the other fighter
    // dealt because nothing about it looks like a hit.
    fall: { from: 90, per100: 5, max: 20 },
    sky: ["#0d1420", "#2a3a52"],
    ground: "#241c22",
    accent: "#ff9440",
    // Night, lit from below by the forge fires rather than from above. The
    // key comes off the furnaces, so the fill is the harbour and the shadow
    // is warm - the opposite of every daylight stage on the list.
    light: { key: "#ffb267", fill: "#33465e", strength: 0.85, shadow: "#3d2a22", glow: 0.22 },
    ambient: { kind: "ember", count: 34, colors: ["#ff9440", "#d8702a", "#ffd06b"], speed: 0.3, wind: -0.25, size: [2, 4], opacity: 0.6 },
    /**
     * Four fighting levels, and the gaps between them are the level design.
     *
     * Every gap is sized against the roster's own jump arcs rather than
     * picked by eye: Shanidar, the shortest jumper in the game, clears each
     * one with room to spare and none to waste, and everyone else clears it
     * easier. That is deliberate - the point of "you need to jump to get up
     * here" is that it costs the worst jumper in the cast something real, not
     * that it excludes him.
     *
     * The dock deck is three runs with two gaps, so the ground floor is
     * reachable from the middle of the stage rather than only off the ends.
     * The mid gantry is two runs, each bridging one of the deck's gaps. The
     * crow's nest at the top is one short run sitting directly above the
     * *gap between* the two gantry halves - so it cannot be reached in one
     * jump from the deck below it (that gap is taller than anyone's jump);
     * the only way up is gantry first, same as the gantry can only be reached
     * from the deck. Three real jumps from the ground floor to the top.
     *
     * x is the LEFT edge. Deck -680..-340, -140..140, 340..680. Gantry
     * -410..-150 and 150..410. Crow's nest -120..120. Symmetric on purpose.
     */
    platforms: [
      { x: -680, y: 74, w: 340 },
      { x: -140, y: 74, w: 280 },
      { x: 340, y: 74, w: 340 },
      { x: -410, y: 144, w: 260 },
      { x: 150, y: 144, w: 260 },
      { x: -120, y: 214, w: 240 },
    ],
  },
  aqueduct: {
    // Overcast stone light. Flat, cool, and not much of it.
    light: { key: "#dfeaf2", fill: "#25384a", strength: 0.7, shadow: "#33454f", glow: 0.08 },
    name: "The Aqueduct",
    blurb: "Two tiers of Roman arches over a dry channel.",
    sky: ["#241a2e", "#b9784a"],
    ground: "#b9a17e",
    accent: "#d8a24a",
    ambient: { kind: "dust", count: 22, colors: ["#e6d6b4", "#b9a17e"], speed: -0.1, wind: 0.14, size: [2, 5], opacity: 0.36 },
    // Two side spans and a high centre - the classic three-ledge shape.
    platforms: [
      { x: -320, y: 66, w: 200 },
      { x: 120, y: 66, w: 200 },
      { x: -100, y: 116, w: 200 },
    ],
  },

  terraces: {
    // Torchlit terracing under a dark sky.
    light: { key: "#ffc98a", fill: "#3a2a28", strength: 0.8, shadow: "#4a3428", glow: 0.14 },
    name: "Temple Terraces",
    blurb: "Cut stone steps above the cloud line.",
    sky: ["#132330", "#5c8fa6"],
    ground: "#8f9aa2",
    accent: "#cfe3ea",
    ambient: { kind: "petal", count: 20, colors: ["#e8f2f6", "#b9d4de"], speed: -0.14, wind: 0.2, size: [3, 6], opacity: 0.5 },
    // One wide pair, low enough to fight on rather than hide on.
    platforms: [
      { x: -350, y: 74, w: 250 },
      { x: 100, y: 74, w: 250 },
    ],
  },

  siegeworks: {
    // Burning timber somewhere off screen.
    light: { key: "#ffc07a", fill: "#2e2630", strength: 0.8, shadow: "#3a2e30", glow: 0.16 },
    name: "The Siege Works",
    blurb: "Scaffolding thrown up against a wall that has not fallen yet.",
    sky: ["#1d1a24", "#8a5638"],
    ground: "#6f5a44",
    accent: "#c08a44",
    ambient: { kind: "ember", count: 24, colors: ["#e8a34a", "#c07a30"], speed: 0.18, wind: 0.1, size: [2, 4], opacity: 0.5 },
    // Deliberately lopsided: a stack on the left, one long run on the right.
    platforms: [
      { x: -430, y: 58, w: 210 },
      { x: -280, y: 108, w: 175 },
      { x: 140, y: 70, w: 260 },
    ],
  },

  postroad: {
    // Bright overcast. The painted sky is nearly white, so the fill is almost as strong as the key.
    light: { key: "#fff0d0", fill: "#7a8a9a", strength: 0.8, shadow: "#6a5a48", glow: 0.08 },
    name: "The Post Road",
    blurb: "A staging post on the mountain highway: inn, teahouse, and the pass beyond.",
    // Sampled off the painting so the ground and the select-screen swatch sit
    // in the same light as the backdrop they are standing in front of.
    sky: ["#8fb2d0", "#deded6"],
    ground: "#c9a771",
    accent: "#a65f41",
    backdrop: { file: "post-road.jpg", aspect: 2.1358, width: 1150, sink: 150 },
    ambient: {
      kind: "petal",
      count: 34,
      // Maple first, blossom last - the painting has both, and it is mostly
      // autumn, so the leaves should outnumber the petals.
      colors: ["#a65f41", "#c2542f", "#d8913a", "#f0c0cd"],
      speed: 1.05,
      wind: 0.8,
      size: [5, 8],
      opacity: 0.85,
    },
  },

  dryclaim: {
    // Hard desert sun, and dust holding light in the shadows.
    light: { key: "#ffe0a8", fill: "#6a5a48", strength: 0.8, shadow: "#7a4526", glow: 0.1 },
    name: "The Dry Claim",
    blurb: "Someone dug here, put up a water tower, and left. The desert took the rest.",
    sky: ["#9dc5d8", "#e8d3b0"],
    // Foreground sand, straight off the painting - the floor is the desert
    // the fighters are already standing in, not a strip laid over it.
    ground: "#b57040",
    accent: "#a8552e",
    ambient: { kind: "dust", count: 30, colors: ["#e0bd8c", "#c58f5a"], speed: -0.07, wind: 1.1, size: [2, 5], opacity: 0.4 },
    backdrop: { file: "dry-claim.jpg", aspect: 1.7917, width: 1180, sink: 285 },
  },

  swallowed: {
    // Jungle light: what gets through the leaves, and it is green by the time it arrives.
    light: { key: "#dcecd8", fill: "#3a5548", strength: 0.75, shadow: "#33452f", glow: 0.1 },
    name: "The Swallowed Temple",
    blurb: "Cut stone, then a thousand years of roots. The roots won.",
    sky: ["#6d97b5", "#cfe2e6"],
    // The trail through the ruin rather than the black undergrowth at the
    // painting's edge, which would have read as a hole under their feet.
    ground: "#565833",
    accent: "#8fb45c",
    ambient: { kind: "petal", count: 26, colors: ["#6f8f47", "#89a95a", "#c9d9a0"], speed: 0.75, wind: 0.5, size: [5, 9], opacity: 0.7 },
    backdrop: { file: "swallowed-temple.jpg", aspect: 1.7902, width: 1180, sink: 265 },
  },

  skyward: {
    // Above the cloud deck. The key is unfiltered and the fill is the whole sky.
    light: { key: "#fffaf0", fill: "#5a86b8", strength: 0.75, shadow: "#6a90b4", glow: 0.18 },
    name: "Cloudbreak Temple",
    blurb: "A stone platform floating in clear morning air.",
    sky: ["#2f6fb5", "#a9d3f0"],
    ground: "#cfc3a8",
    accent: "#ffe9a8",
    ambient: { kind: "petal", count: 22, colors: ["#ffffff", "#e6f3ff"], speed: 0.7, wind: 1.4, size: [4, 6], opacity: 0.6 },
  },
};

export const STAGE_LIST = Object.keys(STAGE_THEMES) as StageTheme[];

interface Layer {
  group: THREE.Group;
  /** 0 = fixed to camera, 1 = fixed to world. */
  parallax: number;
}

/** Stage layers sit behind the fighters at negative z (see layerZ). */
function mat(color: THREE.ColorRepresentation, opacity = 1) {
  const translucent = opacity < 1;
  return new THREE.MeshBasicMaterial({
    color,
    transparent: translucent,
    opacity,
    depthTest: true,
    depthWrite: !translucent,
  });
}

/** Stage draw order 0..9 maps to z -120..-30, all behind the fighters. */
const layerZ = (order: number) => -120 + order * 10;

function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(color, opacity));
  m.position.set(x, y + h / 2, layerZ(order));
  m.renderOrder = order;
  return m;
}

/**
 * A quad that fades out toward its top edge.
 *
 * Used to feather the arena floor into a painted backdrop. The floor is one
 * flat colour and the painting behind it is not, so however carefully the
 * colour is sampled the two meet along a hard horizontal rule - which on the
 * Colosseum read as a band across the bottom of the screen with the fighters
 * standing on the join. Letting the top of the floor go transparent puts the
 * painted sand behind the fighters' feet and the solid floor only underneath
 * them, and the join stops existing.
 */
function fadeUpRect(
  x: number,
  y: number,
  w: number,
  h: number,
  color: THREE.ColorRepresentation,
  order: number,
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(w, h, 1, 1);
  const pos = geo.getAttribute("position");
  const c = new THREE.Color(color);
  const colors = new Float32Array(pos.count * 3);
  const alphas = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    // PlaneGeometry is centred on its own origin, so the top row is +h/2.
    alphas[i] = pos.getY(i) > 0 ? 0 : 1;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float alpha;\nvarying float vAlpha;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvAlpha = alpha;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vAlpha;")
      .replace(
        "#include <dithering_fragment>",
        "#include <dithering_fragment>\ngl_FragColor.a *= vAlpha;",
      );
  };
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y + h / 2, layerZ(order));
  m.renderOrder = order;
  return m;
}

function tri(
  x: number,
  y: number,
  w: number,
  h: number,
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat(color, opacity));
  m.position.set(x, y, layerZ(order));
  m.renderOrder = order;
  return m;
}

function disc(
  x: number,
  y: number,
  r: number,
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat(color, opacity));
  m.position.set(x, y, layerZ(order));
  m.renderOrder = order;
  return m;
}

/** Irregular skyline / rock silhouette built from one polygon. */
function ridge(
  points: [number, number][],
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) s.lineTo(x, y);
  s.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat(color, opacity));
  m.position.z = layerZ(order);
  m.renderOrder = order;
  return m;
}

/**
 * A closed outline placed at (x, y). `ridge` draws the same thing but always
 * at the origin, which is right for a skyline and wrong for anything there are
 * four of at different places along the beach.
 */
function poly(
  x: number,
  y: number,
  pts: number[],
  color: THREE.ColorRepresentation,
  order: number,
  opacity = 1,
): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) shape.lineTo(pts[i], pts[i + 1]);
  shape.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat(color, opacity));
  m.position.set(x, y, layerZ(order));
  m.renderOrder = order;
  return m;
}

/** Vertical gradient backdrop built from a two-colour vertex-coloured quad. */
function skyQuad(top: string, bottom: string, order: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(2400, 1300);
  const top3 = new THREE.Color(top);
  const bot3 = new THREE.Color(bottom);
  const colors: number[] = [];
  // PlaneGeometry vertex order: top-left, top-right, bottom-left, bottom-right.
  for (const c of [top3, top3, bot3, bot3]) colors.push(c.r, c.g, c.b);
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  m.renderOrder = order;
  return m;
}

// ---------------------------------------------------------------------------
// Ambient weather
// ---------------------------------------------------------------------------

interface AmbientParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  spin: number;
  /** Horizontal band the particle lives in, relative to the camera. */
  phase: number;
}

const AMBIENT_SPAN = 1400;
const AMBIENT_TOP = 460;

class Ambient {
  readonly group = new THREE.Group();
  private particles: AmbientParticle[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  constructor(private def: AmbientDef) {
    // Weather is the first thing to go: it is pure decoration, it is the
    // densest particle source in the game, and it is in front of the fight.
    const count = Math.round(def.count * detailScale());
    if (def.kind === "none" || count === 0) return;

    const [w, h] = def.size;
    const geo =
      def.kind === "rain"
        ? new THREE.PlaneGeometry(w, h)
        : def.kind === "petal"
          ? new THREE.PlaneGeometry(w, h * 0.6)
          : new THREE.CircleGeometry(Math.max(w, h) / 2, 8);
    this.disposables.push(geo);

    for (let i = 0; i < count; i++) {
      const color = def.colors[i % def.colors.length];
      const material = mat(color, def.opacity);
      this.disposables.push(material);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(
        (Math.random() - 0.5) * AMBIENT_SPAN,
        Math.random() * AMBIENT_TOP,
        layerZ(7) + 4,
      );
      mesh.renderOrder = 7;
      if (def.kind === "rain") mesh.rotation.z = Math.atan2(-def.speed, def.wind) + Math.PI / 2;
      else mesh.rotation.z = Math.random() * Math.PI;
      this.group.add(mesh);
      this.particles.push({
        mesh,
        vx: def.wind * (0.7 + Math.random() * 0.6),
        vy: -def.speed * (0.75 + Math.random() * 0.5),
        spin: def.kind === "petal" ? (Math.random() - 0.5) * 0.14 : 0,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(frame: number, cameraX: number) {
    if (this.particles.length === 0) return;
    for (const p of this.particles) {
      const m = p.mesh;
      m.position.x += p.vx;
      m.position.y += p.vy;
      if (p.spin) {
        m.rotation.z += p.spin;
        // Petals and snow sway as they fall.
        m.position.x += Math.sin(frame * 0.03 + p.phase) * 0.35;
      }

      // Wrap around the camera so the field always covers the view.
      const left = cameraX - AMBIENT_SPAN / 2;
      const right = cameraX + AMBIENT_SPAN / 2;
      if (m.position.x < left) m.position.x = right;
      if (m.position.x > right) m.position.x = left;
      if (p.vy < 0 && m.position.y < -20) {
        m.position.y = AMBIENT_TOP;
        m.position.x = left + Math.random() * AMBIENT_SPAN;
      }
      if (p.vy > 0 && m.position.y > AMBIENT_TOP) {
        m.position.y = -10;
        m.position.x = left + Math.random() * AMBIENT_SPAN;
      }
    }
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
  }
}

// ---------------------------------------------------------------------------

export class Stage {
  readonly group = new THREE.Group();
  private layers: Layer[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
  /** Backdrop bitmaps, which arrive after construction and free separately. */
  private textures: THREE.Texture[] = [];
  private ambient: Ambient;
  private frame = 0;
  readonly theme: StageTheme;

  constructor(theme: StageTheme) {
    this.theme = theme;
    const cfg = STAGE_THEMES[theme];

    const sky = new THREE.Group();
    const skyMesh = skyQuad(cfg.sky[0], cfg.sky[1], 0);
    skyMesh.position.set(0, 380, layerZ(0) - 10);
    sky.add(skyMesh);
    this.addLayer(sky, 0);

    // A painted stage replaces the built shapes rather than standing behind
    // them - drawing both leaves the old geometry poking through the painting.
    if (!cfg.backdrop)
    switch (theme) {
      case "colosseum":
        this.buildColosseum();
        break;
      case "deck":
        this.buildDeck();
        break;
      case "frontier":
        this.buildFrontier();
        break;
      case "dojo":
        this.buildDojo();
        break;
      case "neon":
        this.buildNeon();
        break;
      case "tundra":
        this.buildTundra();
        break;
      case "forge":
        this.buildForge();
        break;
      case "skyward":
        this.buildSkyward();
        break;
      case "mactan":
        this.buildMactan();
        break;
      case "watling":
        this.buildWatling();
        break;
      case "causeway":
        this.buildCauseway();
        break;
      case "ironworks":
        this.buildIronworks();
        break;
      case "delta":
        this.buildDelta();
        break;
    }

    if (cfg.backdrop) this.buildPainted(cfg.backdrop);

    // A painted backdrop brings its own aerial perspective - the distance in
    // it is already fading on its own. Veiling it again in flat horizon
    // colour only makes it muddy, so the haze is for built stages.
    if (!cfg.backdrop) this.buildHaze(cfg.sky[1]);
    this.buildGround(cfg.ground, theme, !!cfg.backdrop, halfWidthOf(theme));
    if (cfg.platforms?.length) this.buildPlatforms(cfg.platforms, cfg.ground, cfg.accent);

    this.ambient = new Ambient(cfg.ambient);
    this.group.add(this.ambient.group);
  }

  private addLayer(group: THREE.Group, parallax: number) {
    this.layers.push({ group, parallax });
    this.group.add(group);
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) this.disposables.push(m.geometry);
      if (m.material) this.disposables.push(m.material as THREE.Material);
    });
  }

  /**
   * Aerial perspective. Two scrims of the horizon colour, one over the far
   * layer and a thinner one over the mid layer, so distance reads as distance
   * instead of every backdrop sitting in the same plane as the fighters. Each
   * one is a single quad, and each parallaxes with the layer it is veiling.
   */
  private buildHaze(horizon: string) {
    const veil = (order: number, opacity: number, parallax: number) => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2600, 1400), mat(horizon, opacity));
      m.position.set(0, 380, layerZ(order));
      m.renderOrder = order;
      g.add(m);
      this.addLayer(g, parallax);
    };
    veil(2.6, 0.3, 0.3);
    veil(5.6, 0.12, 0.62);
  }

  private buildGround(color: string, theme: StageTheme, painted: boolean, halfWidth: number) {
    const g = new THREE.Group();
    const W = Math.max(1800, halfWidth * 2 + 480);
    if (painted) {
      // Behind a painting the floor starts lower and arrives gradually. The
      // top 74 units are a fade, so what is actually under the fighters' feet
      // is the painted arena floor rather than a flat slab laid over it.
      g.add(rect(0, -420, W, 420 - 74, color, 8));
      g.add(fadeUpRect(0, -74, W, 74, color, 8));
    } else {
      g.add(rect(0, -420, W, 420, color, 8));
    }
    // The line along the floor edge. On a painted stage there is no edge to
    // draw - the sand runs back into the picture - so it would be a rule ruled
    // across the middle of the photograph.
    if (!painted) {
      g.add(rect(0, -6, W, 7, "#000000", 9, 0.35));
      // Floor markings, spaced along the fighting area.
      for (let x = -halfWidth; x <= halfWidth; x += 130) {
        g.add(rect(x, -34, 6, 34, "#000000", 9, 0.18));
      }
    }
    if (theme === "skyward") {
      // The platform has an edge instead of running off-screen.
      g.add(rect(0, -180, 1240, 180, "#8d8064", 8));
      g.add(rect(0, -30, 1300, 30, "#b3a486", 8));
    }
    this.addLayer(g, 1);
  }

  /**
   * Draws the ledges the physics already knows about, from the same numbers -
   * so what you can stand on is exactly what you can see.
   *
   * Only the top edge is solid, so the slab is drawn hanging below its surface
   * with a bright lip along the top. That lip is the whole contract with the
   * player: land on the light line, pass through everything under it.
   */
  private buildPlatforms(platforms: Platform[], ground: string, accent: string) {
    const g = new THREE.Group();
    const THICK = 15;
    for (const p of platforms) {
      const cx = p.x + p.w / 2;
      // Body, hanging below the surface.
      g.add(rect(cx, p.y - THICK, p.w, THICK, ground, 7));
      g.add(rect(cx, p.y - THICK - 3, p.w - 10, 3, "#000000", 7, 0.28));
      // The lip you actually land on.
      g.add(rect(cx, p.y - 3.5, p.w, 3.5, accent, 8));
      // Stone ends, so it reads as built rather than floating.
      for (const side of [-1, 1]) {
        g.add(rect(cx + (side * (p.w / 2 - 7)), p.y - THICK, 14, THICK, ground, 8, 0.85));
      }
    }
    this.addLayer(g, 1);
  }

  // ------------------------------------------------------------------ stages

  private buildColosseum() {
    const far = new THREE.Group();
    far.add(disc(240, 300, 90, "#f6c46a", 1, 0.85));
    for (let i = -4; i <= 4; i++) {
      far.add(rect(i * 190, 40, 120, 240, "#4a2f42", 2, 0.9));
      far.add(rect(i * 190, 260, 150, 30, "#5c3a52", 2, 0.9));
    }
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    mid.add(rect(0, 96, 1800, 90, "#3a2434", 3));
    for (let i = -8; i <= 8; i++) {
      mid.add(rect(i * 150, 110, 26, 70, "#2b1a28", 4, 0.9));
    }
    mid.add(rect(0, 60, 1800, 40, "#553751", 4));
    for (let i = -6; i <= 6; i++) {
      mid.add(rect(i * 170, 0, 34, 70, "#d8c39a", 5));
      mid.add(rect(i * 170, 66, 46, 12, "#efe0bd", 5));
    }
    mid.add(rect(0, 0, 1800, 10, "#8a744f", 6));
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(-STAGE_HALF_WIDTH - 40, 0, 40, 150, "#2a1c26", 7, 0.85));
    near.add(rect(STAGE_HALF_WIDTH + 40, 0, 40, 150, "#2a1c26", 7, 0.85));
    this.addLayer(near, 0.9);
  }

  private buildDeck() {
    const far = new THREE.Group();
    far.add(disc(-260, 340, 66, "#dfe7ef", 1, 0.5));
    for (let i = -3; i <= 3; i++) {
      far.add(disc(i * 260 + 40, 330 + (i % 2) * 40, 90, "#1b2c3f", 2, 0.75));
      far.add(disc(i * 260 - 60, 300 + (i % 2) * 30, 70, "#22374d", 2, 0.7));
    }
    this.addLayer(far, 0.2);

    const mid = new THREE.Group();
    mid.add(rect(-320, 40, 320, 60, "#20303f", 3));
    mid.add(rect(-320, 100, 12, 190, "#2b3f52", 3));
    mid.add(tri(-320, 110, 130, 150, "#41586d", 3, 0.9));
    mid.add(rect(0, 0, 1800, 46, "#2b4a63", 4));
    mid.add(rect(0, 34, 1800, 8, "#43698a", 5, 0.8));
    this.addLayer(mid, 0.5);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 16, "#4d3521", 6));
    for (let i = -8; i <= 8; i++) {
      near.add(rect(i * 140, 16, 10, 60, "#5c4029", 6, 0.9));
    }
    near.add(rect(0, 74, 1800, 8, "#5c4029", 6, 0.9));
    near.add(rect(210, 0, 22, 320, "#6b4b32", 5, 0.95));
    near.add(rect(210, 250, 200, 14, "#7d5a3c", 5, 0.95));
    this.addLayer(near, 0.85);
  }

  private buildFrontier() {
    const far = new THREE.Group();
    far.add(disc(-200, 250, 120, "#ffd9a0", 1, 0.75));
    far.add(tri(-380, 0, 620, 250, "#5b3446", 2, 0.85));
    far.add(tri(180, 0, 520, 190, "#6b3d4a", 2, 0.8));
    far.add(tri(560, 0, 440, 230, "#4d2b3c", 2, 0.85));
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    const buildings = [
      { x: -470, w: 180, h: 150 },
      { x: -250, w: 150, h: 120 },
      { x: 260, w: 200, h: 165 },
      { x: 490, w: 160, h: 130 },
    ];
    for (const b of buildings) {
      mid.add(rect(b.x, 0, b.w, b.h, "#6a4630", 3));
      mid.add(rect(b.x, b.h, b.w + 22, 16, "#4f3323", 4));
      mid.add(rect(b.x, b.h * 0.45, b.w * 0.32, b.h * 0.3, "#2a1a14", 4, 0.9));
      mid.add(rect(b.x - b.w * 0.28, 0, b.w * 0.22, b.h * 0.42, "#33201a", 4, 0.9));
    }
    mid.add(rect(-60, 0, 12, 70, "#4a6b3a", 3));
    mid.add(rect(-72, 40, 26, 10, "#4a6b3a", 3));
    mid.add(rect(80, 0, 8, 90, "#5b3f28", 3));
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 12, "#a9713f", 6, 0.8));
    this.addLayer(near, 0.9);
  }

  private buildDojo() {
    const far = new THREE.Group();
    far.add(disc(-220, 320, 78, "#ffe9f0", 1, 0.7));
    far.add(ridge(
      [
        [-900, 0],
        [-620, 190],
        [-380, 60],
        [-120, 230],
        [180, 80],
        [430, 210],
        [760, 70],
        [900, 150],
        [900, 0],
      ],
      "#4a3560",
      2,
      0.85,
    ));
    this.addLayer(far, 0.22);

    const mid = new THREE.Group();
    // Cherry trees: trunks and blossom clouds.
    for (const x of [-360, 340]) {
      mid.add(rect(x, 0, 14, 120, "#59402f", 3));
      mid.add(rect(x + (x < 0 ? 28 : -28), 78, 50, 10, "#59402f", 3));
      for (let i = 0; i < 4; i++) {
        mid.add(
          disc(x + (i - 1.5) * 34 + (x < 0 ? 16 : -16), 148 + (i % 2) * 24, 36 + (i % 3) * 8, i % 2 ? "#ff9db4" : "#ffb6c8", 3, 0.95),
        );
      }
    }
    // Dojo hall behind the fighters.
    mid.add(rect(0, 0, 430, 116, "#c9b48f", 4));
    for (let i = -1; i <= 1; i++) {
      mid.add(rect(i * 128, 14, 96, 84, "#f0e6d2", 5));
      mid.add(rect(i * 128, 14, 5, 84, "#8a6b45", 5));
      mid.add(rect(i * 128, 54, 96, 5, "#8a6b45", 5));
    }
    mid.add(rect(0, 114, 490, 16, "#4a3324", 5));
    mid.add(tri(0, 130, 520, 62, "#5c3f2c", 5));
    mid.add(rect(0, 172, 84, 10, "#8a6b45", 6));
    // Stone lanterns flanking the hall.
    for (const x of [-260, 260]) {
      mid.add(rect(x, 0, 16, 34, "#9c9384", 5));
      mid.add(rect(x, 34, 30, 20, "#ffe9a8", 5, 0.9));
      mid.add(tri(x, 54, 40, 20, "#7d7466", 5));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 14, "#a8845a", 6, 0.9));
    for (let i = -6; i <= 6; i++) near.add(rect(i * 160, 0, 8, 14, "#8a6b45", 7, 0.8));
    this.addLayer(near, 0.9);
  }

  private buildNeon() {
    const far = new THREE.Group();
    // Distant towers with lit windows.
    for (let i = -6; i <= 6; i++) {
      const h = 220 + ((i * 97) % 160);
      far.add(rect(i * 165, 0, 110, h, "#232c4a", 2));
      for (let w = 0; w < 6; w++) {
        const lit = (i * 7 + w * 3) % 4 !== 0;
        far.add(rect(i * 165 - 28 + (w % 2) * 56, 40 + Math.floor(w / 2) * 56, 22, 26, lit ? "#7f9ae0" : "#161d33", 3, 0.9));
      }
    }
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    mid.add(rect(0, 0, 1800, 190, "#1b2138", 4));
    // Neon signs.
    const signs: [number, number, number, number, string][] = [
      [-420, 130, 70, 26, "#ff3ea5"],
      [-260, 80, 24, 90, "#7ad7ff"],
      [-80, 150, 96, 22, "#ffe066"],
      [180, 96, 26, 110, "#7cff9e"],
      [330, 160, 84, 24, "#ff6ec7"],
      [520, 110, 22, 84, "#7ad7ff"],
    ];
    for (const [x, y, w, h, color] of signs) {
      mid.add(rect(x, y, w + 8, h + 8, "#0b0e1a", 5));
      mid.add(rect(x, y, w, h, color, 5, 0.92));
      mid.add(rect(x, y - 10, w * 1.5, h * 1.6, color, 5, 0.12));
    }
    // Awnings over the street.
    for (let i = -4; i <= 4; i++) {
      mid.add(rect(i * 210, 60, 150, 12, i % 2 ? "#8a2450" : "#1f5f6b", 6));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 18, "#12162a", 6));
    near.add(rect(0, 16, 1800, 4, "#ff3ea5", 7, 0.55));
    // Wet reflections on the road.
    for (let i = -7; i <= 7; i++) {
      near.add(rect(i * 130 + 30, 0, 40, 12, i % 2 ? "#ff3ea5" : "#7ad7ff", 7, 0.16));
    }
    this.addLayer(near, 0.9);
  }

  private buildTundra() {
    const far = new THREE.Group();
    // Aurora bands.
    for (let i = 0; i < 4; i++) {
      far.add(rect(-140 + i * 90, 300 + i * 26, 620 - i * 60, 26, i % 2 ? "#5fe0b8" : "#8fd0ff", 1, 0.16));
    }
    far.add(disc(300, 360, 40, "#eaf4ff", 1, 0.85));
    far.add(ridge(
      [
        [-900, 0],
        [-700, 300],
        [-520, 140],
        [-300, 340],
        [-60, 120],
        [200, 380],
        [470, 160],
        [720, 320],
        [900, 90],
        [900, 0],
      ],
      "#22345a",
      2,
      0.95,
    ));
    this.addLayer(far, 0.22);

    const mid = new THREE.Group();
    mid.add(ridge(
      [
        [-800, 0],
        [-560, 190],
        [-330, 70],
        [-90, 210],
        [160, 90],
        [420, 200],
        [700, 80],
        [800, 0],
      ],
      "#3b5c86",
      3,
    ));
    // Snow caps.
    mid.add(tri(-560, 150, 150, 52, "#e8f2ff", 4, 0.95));
    mid.add(tri(-90, 168, 140, 48, "#e8f2ff", 4, 0.95));
    mid.add(tri(420, 158, 130, 48, "#e8f2ff", 4, 0.95));
    // Pines.
    for (let i = -7; i <= 7; i++) {
      const x = i * 130 + ((i * 37) % 40);
      const h = 70 + ((i * 53) % 40);
      mid.add(rect(x, 0, 9, h * 0.4, "#3a2d24", 5));
      mid.add(tri(x, h * 0.3, 54, h, "#20402f", 5));
      mid.add(tri(x, h * 0.62, 40, h * 0.7, "#2b5540", 5));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1800, 16, "#d5e4f2", 6));
    for (let i = -6; i <= 6; i++) near.add(disc(i * 170, 6, 26, "#c6d8ea", 6, 0.9));
    this.addLayer(near, 0.9);
  }

  private buildForge() {
    const far = new THREE.Group();
    far.add(ridge(
      [
        [-900, 0],
        [-640, 260],
        [-420, 120],
        [-160, 300],
        [140, 150],
        [420, 280],
        [700, 130],
        [900, 220],
        [900, 0],
      ],
      "#2a1216",
      2,
    ));
    // Lava glow behind the rock.
    far.add(rect(0, 0, 1800, 60, "#ff6a2c", 1, 0.5));
    far.add(rect(0, 40, 1800, 120, "#8a2f1e", 1, 0.35));
    this.addLayer(far, 0.25);

    const mid = new THREE.Group();
    // Lava river.
    mid.add(rect(0, 0, 1800, 40, "#ff8a3c", 3, 0.95));
    mid.add(rect(0, 26, 1800, 16, "#ffd06b", 4, 0.9));
    for (let i = -8; i <= 8; i++) {
      mid.add(disc(i * 120 + ((i * 31) % 50), 30, 16 + ((i * 17) % 12), "#ffe6a8", 4, 0.7));
    }
    // Cavern walls and hanging chains.
    mid.add(rect(-560, 0, 300, 260, "#241417", 5));
    mid.add(rect(560, 0, 300, 300, "#241417", 5));
    for (const x of [-430, 430]) {
      mid.add(rect(x, 140, 8, 160, "#4a3a33", 5));
      mid.add(disc(x, 130, 16, "#6b5348", 5));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    // Forge platform with glowing cracks.
    near.add(rect(0, 0, 1800, 24, "#2f2323", 6));
    for (let i = -7; i <= 7; i++) {
      near.add(rect(i * 128 + 20, 0, 5, 18, "#ff6a2c", 7, 0.75));
    }
    near.add(rect(0, 22, 1800, 5, "#ff8a3c", 7, 0.4));
    this.addLayer(near, 0.9);
  }

  private buildSkyward() {
    const far = new THREE.Group();
    // Kept off pure white deliberately: bloom picks out effects, and a sky
    // full of #ffffff clouds would flare the whole frame instead.
    far.add(disc(-260, 380, 62, "#f7edcf", 1, 0.9));
    for (let i = -4; i <= 4; i++) {
      const y = 220 + ((i * 61) % 150);
      far.add(disc(i * 240, y, 70, "#e9f1fb", 2, 0.6));
      far.add(disc(i * 240 + 60, y - 16, 52, "#e3ecf8", 2, 0.55));
      far.add(disc(i * 240 - 66, y - 20, 46, "#d8e6f6", 2, 0.5));
    }
    this.addLayer(far, 0.18);

    const mid = new THREE.Group();
    // Floating islands.
    for (const [x, y, w] of [
      [-620, 150, 150],
      [580, 200, 120],
      [-330, 215, 90],
    ] as [number, number, number][]) {
      mid.add(rect(x, y, w, 26, "#b3a486", 3));
      mid.add(tri(x, y, w * 0.8, -70, "#8d8064", 3));
      mid.add(rect(x, y + 26, w * 0.9, 8, "#6f9c5a", 4));
    }
    // Temple columns and roof behind the platform.
    for (let i = -2; i <= 2; i++) {
      mid.add(rect(i * 96, 0, 22, 128, "#cbbfa2", 4));
      mid.add(rect(i * 96, 124, 32, 10, "#b3a486", 5));
    }
    mid.add(rect(0, 132, 500, 14, "#b3a486", 5));
    mid.add(tri(0, 146, 520, 58, "#9c8f72", 5));
    this.addLayer(mid, 0.38);

    const near = new THREE.Group();
    near.add(rect(0, 0, 1300, 14, "#c7b795", 6));
    this.addLayer(near, 0.9);
  }

  private buildDelta() {
    const far = new THREE.Group();
    // Low monsoon cloud over a flat horizon.
    for (let i = -4; i <= 4; i++) {
      far.add(disc(i * 230, 300 + ((i * 53) % 60), 88, "#2c3a2f", 2, 0.8));
      far.add(disc(i * 230 + 70, 270 + ((i * 37) % 40), 64, "#354535", 2, 0.7));
    }
    far.add(ridge(
      [
        [-900, 0],
        [-700, 130],
        [-420, 90],
        [-140, 150],
        [180, 100],
        [470, 160],
        [760, 96],
        [900, 130],
        [900, 0],
      ],
      "#22301f",
      2,
    ));
    this.addLayer(far, 0.22);

    const mid = new THREE.Group();
    // Treeline: trunks with heavy fronds.
    for (let i = -7; i <= 7; i++) {
      const x = i * 128 + ((i * 41) % 36);
      const h = 96 + ((i * 61) % 54);
      mid.add(rect(x, 0, 9, h, "#3c3324", 3));
      for (let f = 0; f < 5; f++) {
        const a = -60 + f * 30;
        const frond = tri(x + Math.sin((a * Math.PI) / 180) * 26, h - 6, 62, 20, f % 2 ? "#2f5333" : "#3a6b3c", 4, 0.95);
        frond.rotation.z = (a * Math.PI) / 180;
        mid.add(frond);
      }
    }
    // Flooded paddy behind the fighting line.
    mid.add(rect(0, 0, 1800, 34, "#3f5344", 5));
    mid.add(rect(0, 24, 1800, 6, "#6e8a68", 6, 0.75));
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    // Sandbag berm and a few reeds at the camera line.
    near.add(rect(0, 0, 1800, 14, "#5b6248", 6));
    for (let i = -8; i <= 8; i++) {
      near.add(disc(i * 110, 12, 13, "#6b7355", 6));
      near.add(rect(i * 110 + 46, 0, 3, 34, "#57683f", 7, 0.85));
      near.add(rect(i * 110 + 52, 0, 3, 26, "#4c5c36", 7, 0.85));
    }
    this.addLayer(near, 0.9);
  }

  /**
   * A painted stage: one texture on one quad, in place of built shapes.
   *
   * The picture is hung far back and otherwise left alone. The temptation
   * with a painting is to build shapes in front of it to "tie it in", which
   * only ever produces two art styles arguing in the same frame - so the only
   * things drawn over it are the floor every stage needs and the ambient
   * weather, both of which each painting already contains and so agrees with.
   */
  /**
   * Mactan, the 27th of April 1521.
   *
   * The one thing every account agrees on is the water. The ships could not
   * get in over the reef and the boats grounded well out, so the landing party
   * waded the last stretch, and the fight happened in the shallows with the
   * fleet watching from too far away to help. So the stage is built outward
   * from that: open sea and anchored ships on the horizon, the reef line
   * breaking, then a lagoon, and a strip of wet sand to stand on.
   */
  private buildMactan() {
    const far = new THREE.Group();
    // Open water, filling the upper half the way the mountains do on the
    // Frozen Pass. Stacking everything into low horizontal bands - which is
    // what the first attempt did - gives a stage with no skyline at all.
    far.add(rect(0, 150, 1900, 240, "#2f6f9b", 1));
    far.add(rect(0, 150, 1900, 70, "#4d8db4", 1, 0.75));
    far.add(rect(0, 372, 1900, 18, "#cfe6ee", 1, 0.45));
    // The headland closing the bay, big enough to be a horizon rather than a
    // detail.
    far.add(ridge(
      [[-980, 150], [-880, 330], [-740, 262], [-600, 348], [-470, 244], [-380, 300], [-300, 168], [-260, 150]],
      "#37543f",
      2,
      0.95,
    ));
    far.add(ridge(
      [[700, 150], [800, 286], [930, 232], [980, 268], [980, 150]],
      "#3d5c4a",
      2,
      0.9,
    ));
    // The fleet, hove to beyond the reef and too far out to help. Small on
    // purpose: the point of the stage is that they are watching.
    for (const [x, k] of [[-140, 0.85], [330, 0.7], [560, 0.58]] as [number, number][]) {
      far.add(rect(x, 214, 84 * k, 15 * k, "#3a2f28", 3));
      far.add(rect(x, 226, 96 * k, 5 * k, "#4a3c30", 3));
      far.add(rect(x - 2 * k, 230, 5 * k, 84 * k, "#2b231d", 3));
      far.add(rect(x + 4 * k, 262, 42 * k, 30 * k, "#efe7d4", 3, 0.95));
      far.add(rect(x + 4 * k, 234, 32 * k, 24 * k, "#ded3ba", 3, 0.95));
    }
    this.addLayer(far, 0.2);

    const mid = new THREE.Group();
    // The far shore. Everything on land sits on top of this, or the lagoon in
    // front draws over the bottom of it and the palms hang in the air with no
    // trunks - which is exactly what the first version did.
    mid.add(rect(0, 128, 1900, 30, "#c4b48e", 4));
    mid.add(rect(0, 152, 1900, 10, "#3d7d52", 4, 0.65));
    // Palms, tall enough to cross the waterline behind them.
    for (let i = -6; i <= 6; i++) {
      const x = i * 158 + ((i * 41) % 48);
      const h = 122 + ((i * 67) % 66);
      const lean = ((i * 23) % 16) - 8;
      mid.add(rect(x, 150, 8, h, "#6b5334", 5));
      const topY = 150 + h;
      // Fronds droop, so each is a triangle hung off the crown rather than a
      // fan standing up out of it.
      for (let f = 0; f < 6; f++) {
        const a = -78 + f * 31 + lean;
        const dx = Math.sin((a * Math.PI) / 180) * 32;
        const dy = Math.cos((a * Math.PI) / 180) * 9;
        mid.add(tri(x + dx, topY - 14 + dy, 62, 22, f % 2 ? "#2f6b45" : "#3d7d52", 6, 0.95));
      }
      mid.add(disc(x, topY - 5, 8, "#5c4a2e", 6));
    }
    // Outriggers drawn up on the sand - the defenders came by water too, and
    // left them where they could get back to them.
    //
    // Drawn as a hull with a rising prow and stern rather than as a plank on
    // legs. A flat box with a bar under it is a picnic table, which is what
    // these were until the profile was cut properly, and the boom that makes
    // it a bangka goes behind the hull rather than below it.
    for (const x of [-620, -180, 300, 700]) {
      mid.add(poly(x, 150, [-54, 16, -44, 2, 40, 2, 52, 18, 40, 9, -42, 9], "#5c4126", 5, 0.95));
      mid.add(poly(x, 150, [-42, 12, -34, 5, 32, 5, 42, 13, 32, 9, -34, 9], "#7a5a34", 6, 0.95));
      mid.add(rect(x + 4, 158, 74, 4, "#6b4a2c", 5, 0.9));
      mid.add(rect(x - 24, 152, 4, 9, "#4a3220", 5, 0.9));
      mid.add(rect(x + 30, 152, 4, 9, "#4a3220", 5, 0.9));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    // The lagoon he is standing at the edge of, with the reef breaking white
    // along its far side.
    near.add(rect(0, 62, 1900, 74, "#4fa3bd", 7));
    near.add(rect(0, 128, 1900, 11, "#eaf6fb", 7, 0.9));
    near.add(rect(0, 62, 1900, 24, "#74bfd2", 7, 0.55));
    // Wet sand, darker where the water has just been over it.
    near.add(rect(0, 0, 1900, 62, "#cbba94", 7));
    near.add(rect(0, 52, 1900, 14, "#a4966f", 7, 0.75));
    // Coral heads standing out of the shallows.
    for (let i = -6; i <= 6; i++) {
      const x = i * 172 + ((i * 53) % 58);
      near.add(disc(x, 2, 12 + ((i * 29) % 9), "#b3a482", 8, 0.9));
    }
    // Fire-hardened stakes driven into the sand. His, and the reason the
    // Spanish accounts complain about the ground as much as the men on it.
    for (const [x, h] of [[-640, 46], [-230, 36], [270, 52], [660, 40]] as [number, number][]) {
      near.add(rect(x, 2, 5, h, "#c8b273", 8));
      near.add(rect(x, 2 + h - 9, 5, 9, "#2a2018", 8));
    }
    this.addLayer(near, 0.9);
  }

  /**
   * Watling Street, AD 61 - the last battle, and the one she lost.
   *
   * Tacitus is unusually specific about the ground, because the ground is his
   * whole explanation: Suetonius took a position with a defile at his back and
   * woods on the flanks, so nothing could come at him except from the front
   * and across open country. Ten thousand men beat something the Romans
   * counted in hundreds of thousands, and they did it by choosing where.
   *
   * So the stage is that choice, seen from her side of it: the woods closing
   * in on both flanks, the Roman road running out through the gap, the British
   * wagons drawn up across the back where the families were watching - and the
   * glow of a burnt city on the horizon behind all of it, because by the time
   * anybody stood here she had already done the thing she is remembered for.
   */
  private buildWatling() {
    const far = new THREE.Group();
    // The burning on the horizon, kept low and narrow. The camera sees about
    // three hundred units of height, so a horizon put at the height a horizon
    // feels like fills the sky and stops being a horizon - measured against
    // the Mactan build, the whole distance has to live under y 160.
    far.add(rect(0, 74, 1900, 46, "#4a2c26", 1, 0.95));
    far.add(rect(0, 88, 1900, 22, "#a8532a", 1, 0.8));
    far.add(rect(0, 88, 1900, 8, "#ff9440", 1, 0.75));
    // The town, small and far off - Camulodunum or Verulamium, take your pick,
    // she burned both. Roof gone on every one of them, so the fire shows
    // through the top.
    for (const [x, k] of [[-560, 1], [-330, 0.7], [-90, 0.85], [180, 0.62], [430, 0.9], [720, 0.7]] as [number, number][]) {
      const h = 34 * k;
      far.add(rect(x, 92, 54 * k, h, "#2e2026", 2, 0.95));
      far.add(tri(x, 92 + h, 62 * k, 18 * k, "#2e2026", 2, 0.95));
      far.add(rect(x, 92 + h * 0.45, 34 * k, 9 * k, "#ff9440", 2, 0.5));
      // Smoke, going straight up and widening. Tacitus gives this battle no
      // weather, and a still column reads as a fire that has been burning a
      // while rather than one that has just caught.
      for (let i = 0; i < 3; i++) {
        far.add(rect(x + i * 5 * k, 92 + h + 6 * k + i * 34, (16 + i * 12) * k, 40, "#513f3c", 2, 0.22 - i * 0.06));
      }
    }
    this.addLayer(far, 0.18);

    const mid = new THREE.Group();
    // The woods on both flanks. Tacitus is specific that the position had them
    // on the flanks and a defile behind, and that is the whole reason ten
    // thousand men won - so the gap between these two is the stage's one real
    // piece of storytelling and it is deliberately narrow.
    mid.add(rect(0, 44, 1900, 8, "#3a4030", 3, 0.9));
    mid.add(ridge(
      [[-980, 44], [-940, 150], [-800, 122], [-660, 176], [-500, 138], [-360, 182], [-250, 128], [-190, 44]],
      "#26331f",
      3,
      0.95,
    ));
    mid.add(ridge(
      [[190, 44], [250, 132], [380, 178], [520, 134], [660, 180], [800, 126], [940, 152], [980, 44]],
      "#26331f",
      3,
      0.95,
    ));
    // Individual trees along the inner edge of each wood, so the treeline is a
    // line of trees and not a green wall with a wavy top.
    for (const [from, to] of [[-960, -200], [200, 960]] as [number, number][]) {
      for (let x = from; x <= to; x += 76) {
        const jitter = ((x * 37) % 30) - 15;
        const h = 96 + ((x * 61) % 62);
        mid.add(rect(x + jitter, 42, 7, h * 0.36, "#1f1a16", 4));
        mid.add(tri(x + jitter, 42 + h * 0.3, 56, h * 0.66, "#2f4228", 4, 0.95));
        mid.add(tri(x + jitter, 42 + h * 0.46, 40, h * 0.46, "#3b5230", 5, 0.9));
      }
    }
    // The wagon line drawn up across the back. Tacitus says the families came
    // to watch from them, and that when the line broke the wagons were what
    // stopped anybody getting away. They are behind her here, which is the
    // whole of the story and needs no caption.
    for (const x of [-620, -300, 30, 360, 690]) {
      mid.add(rect(x, 46, 62, 18, "#5c4126", 6, 0.95));
      mid.add(rect(x, 62, 68, 4, "#7a5a34", 6, 0.95));
      mid.add(poly(x, 66, [-30, 0, -25, 17, 0, 24, 25, 17, 30, 0], "#b3a483", 6, 0.9));
      mid.add(poly(x, 66, [-30, 0, -25, 17, -20, 17, -24, 0], "#8f8163", 7, 0.9));
      mid.add(disc(x - 22, 46, 11, "#3d2b19", 7, 0.95));
      mid.add(disc(x + 22, 46, 11, "#3d2b19", 7, 0.95));
      mid.add(disc(x - 22, 46, 2.6, "#8a6238", 8, 0.95));
      mid.add(disc(x + 22, 46, 2.6, "#8a6238", 8, 0.95));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    // Turf, then the road. Kept close in value to the stage floor so the two
    // read as one surface running back rather than as a wall behind the
    // fighters - the road is what they are standing on, not scenery.
    near.add(rect(0, 0, 1900, 40, "#4e5138", 7));
    near.add(rect(0, 0, 1900, 26, "#6a6250", 7));
    near.add(rect(0, 24, 1900, 5, "#7b7360", 7, 0.8));
    // The ditch cut along the near side of the agger.
    near.add(rect(0, 0, 1900, 6, "#565044", 8, 0.7));
    // Set stones. Irregular, because the surfacing on a British road is rammed
    // gravel over flint and not a mosaic - the variation is the point.
    for (let i = -16; i <= 16; i++) {
      const x = i * 62 + ((i * 43) % 26);
      near.add(rect(x, 7 + ((i * 17) % 12), 34 + ((i * 29) % 18), 7, i % 2 ? "#777059" : "#6d6650", 8, 0.8));
    }
    // Dropped on the way past and not picked up again: a shield face down in
    // the verge, and a spear stuck where somebody put it.
    near.add(poly(-430, 3, [-22, 0, -16, 11, 16, 11, 22, 0, 16, -6, -16, -6], "#7a2f38", 8, 0.95));
    near.add(disc(-430, 6, 5, "#aab4bf", 9, 0.95));
    near.add(rect(520, 2, 3, 62, "#7a5a34", 8, 0.95));
    near.add(poly(520, 62, [-5, 0, 0, 18, 5, 0], "#c7d0da", 9, 0.95));
    this.addLayer(near, 0.9);
  }

  /**
   * Tenochtitlan, August 1521 - one of the causeways, near the end.
   *
   * The city was built on an island in a shallow lake and reached by three
   * raised stone roads, and that is the whole military story of the siege: as
   * long as the causeways and the canoes were open the city could be fed, and
   * once the brigantines took the water it could not. So the stage is one of
   * those roads seen from the mainland end - water on both sides at the same
   * height, the ships that closed it out on the lake, and the city at the far
   * end with the Templo Mayor over it and a great deal of smoke.
   *
   * Everything is measured against the three hundred units the camera actually
   * sees, the same as the Watling Street build.
   */
  private buildCauseway() {
    const far = new THREE.Group();
    // The two volcanoes that close the valley. They are the reason a picture
    // of this city is placeable at a glance, and they are the first thing
    // every account mentions on coming over the pass.
    far.add(ridge(
      [[-980, 60], [-820, 148], [-700, 196], [-640, 232], [-580, 198], [-470, 150], [-380, 104], [-300, 60]],
      "#44576e",
      3,
      0.95,
    ));
    far.add(poly(-640, 232, [-42, 0, 0, 16, 40, -2, 0, 6], "#dfe7ef", 3.2, 0.95));
    far.add(ridge(
      [[120, 60], [260, 132], [420, 178], [560, 142], [700, 168], [860, 120], [980, 60]],
      "#4e6178",
      3,
      0.9,
    ));
    // The city on the island: stepped platforms, and over them the twin-shrine
    // pyramid - two staircases up one face and two temples side by side on the
    // top, which is the one silhouette the Templo Mayor is known by.
    const plat = (x: number, w: number, h: number, color: string) => {
      far.add(poly(x, 74, [-w / 2, 0, -w / 2 + 6, h, w / 2 - 6, h, w / 2, 0], color, 3.6, 0.96));
    };
    plat(-190, 130, 26, "#9c8f76");
    plat(210, 150, 20, "#91846c");
    plat(430, 96, 32, "#9c8f76");
    for (let i = 0; i < 4; i++) {
      const w = 168 - i * 30;
      far.add(poly(20, 74 + i * 26, [-w / 2, 0, -w / 2 + 8, 26, w / 2 - 8, 26, w / 2, 0], i % 2 ? "#a89a7f" : "#9b8e73", 4.2, 0.97));
    }
    far.add(poly(-2, 74, [-15, 0, -11, 104, 11, 104, 15, 0], "#857a62", 4.6, 0.97));
    far.add(poly(42, 74, [-15, 0, -11, 104, 11, 104, 15, 0], "#857a62", 4.6, 0.97));
    far.add(rect(-14, 178, 46, 30, "#8f3229", 5, 0.98));
    far.add(tri(-14, 208, 52, 22, "#8f3229", 5, 0.98));
    far.add(rect(52, 178, 46, 30, "#2f5470", 5, 0.98));
    far.add(tri(52, 208, 52, 22, "#2f5470", 5, 0.98));
    // Burning, and the smoke standing over the whole island.
    for (const [x, k] of [[-190, 1], [210, 0.8], [430, 0.9], [20, 1.2]] as [number, number][]) {
      far.add(rect(x, 88, 30 * k, 8 * k, "#e07a34", 5.2, 0.6));
      // Tapered and leaning, not stacked rectangles - the first pass drew two
      // grey bars either side of the pyramid that read as factory chimneys.
      for (let i = 0; i < 4; i++) {
        far.add(tri(x + i * 11 * k, 96 + i * 40, (30 + i * 20) * k, 62, "#7a6e66", 5.2, 0.2 - i * 0.04));
      }
    }
    this.addLayer(far, 0.18);

    const mid = new THREE.Group();
    // The lake, and the brigantines on it - thirteen small ships built sixty
    // miles inland, carried over the mountains in pieces and launched here,
    // which is the decision the whole siege turned on.
    mid.add(rect(0, 44, 1900, 34, "#2c5c7c", 6));
    mid.add(rect(0, 44, 1900, 12, "#3d7ba0", 6, 0.7));
    mid.add(rect(0, 74, 1900, 4, "#9fc4d4", 6, 0.5));
    for (const [x, k] of [[-700, 1], [-330, 0.8], [140, 0.92], [560, 0.74], [880, 0.86]] as [number, number][]) {
      mid.add(poly(x, 48, [-40, 0, -32, -7, 32, -7, 42, 0, 34, 8, -32, 8], "#5c4126", 7, 0.96));
      mid.add(rect(x + 2, 56, 3, 62 * k, "#4a3220", 7, 0.96));
      mid.add(poly(x + 4, 60, [0, 0, 42 * k, 5, 42 * k, 52 * k, 0, 58 * k], "#e6ded0", 7, 0.94));
      mid.add(poly(x - 2, 60, [0, 0, -26 * k, 4, -26 * k, 34 * k, 0, 40 * k], "#d2c8b6", 7, 0.9));
    }
    // Canoes, low and dark, in among them.
    for (const x of [-520, -120, 320, 720]) {
      mid.add(poly(x, 46, [-26, 0, -20, 5, 20, 5, 26, 0, 18, -4, -18, -4], "#3f3024", 8, 0.95));
    }
    this.addLayer(mid, 0.55);

    const near = new THREE.Group();
    // Near water, then the causeway: cut stone with a kerb down each side,
    // wide enough for about eight men abreast, which the accounts complain
    // about at length.
    near.add(rect(0, 30, 1900, 20, "#27536f", 8));
    near.add(rect(0, 44, 1900, 4, "#7fa8bd", 8, 0.5));
    near.add(rect(0, 0, 1900, 32, "#8c8578", 8));
    near.add(rect(0, 28, 1900, 6, "#a39a89", 8, 0.9));
    near.add(rect(0, 0, 1900, 7, "#736c60", 9, 0.7));
    for (let i = -16; i <= 16; i++) {
      const x = i * 60 + ((i * 41) % 22);
      near.add(rect(x, 8 + ((i * 19) % 14), 38 + ((i * 23) % 14), 7, i % 2 ? "#978f81" : "#8a8375", 9, 0.8));
    }
    // The gap where a bridge has been lifted out. On the night of the 30th of
    // June 1520 the Spanish tried to leave the city and found the causeway cut
    // exactly like this, and most of them drowned in it - the one night this
    // campaign nearly ended the other way.
    near.add(rect(-300, 0, 74, 32, "#27536f", 9));
    near.add(rect(-300, 26, 74, 4, "#7fa8bd", 9, 0.5));
    near.add(rect(-338, 0, 5, 34, "#6f6759", 9));
    near.add(rect(-262, 0, 5, 34, "#6f6759", 9));
    this.addLayer(near, 0.9);
  }

  /**
   * The Ironworks: the first arcade level.
   *
   * A working dockyard at night, three storeys of it, built out over the water
   * on piles. The difference from every arena on the list is not decoration -
   * it is that the structure *is* the stage. The platforms in the theme are
   * the decks drawn here, and they line up with them deliberately: a player
   * should be able to look at the picture and know where they can stand.
   *
   * Lit from below. Every other stage on the roster is daylight or dusk with
   * the light coming down; here it comes up off the furnaces, which is why
   * the underside of every beam is the bright face and the tops are dark.
   */
  private buildIronworks() {
    const W = 950;
    // The load-bearing slab, lip and end-caps for every platform are already
    // drawn generically by buildPlatforms() off this same list - that call
    // happens once, for every stage that has platforms, from the Stage
    // constructor. Everything below is decoration layered on top of it, and
    // it reads straight off the platforms themselves rather than repeating
    // their numbers as a second, parallel set of literals: the last time the
    // deck height changed here, the deck itself moved and the planking drawn
    // on top of it did not, because nothing forced the two to agree.
    const [deckL, deckM, deckR, gantryL, gantryR, nest] = STAGE_THEMES.ironworks.platforms!;

    const far = new THREE.Group();
    // Harbour water, and a city on the far shore. Kept cold and dim so the
    // orange of the works reads against it.
    far.add(rect(0, 74, 2600, 260, "#12203a", 1));
    far.add(rect(0, 74, 2600, 30, "#1b2f4e", 1, 0.9));
    // Furnace light spilling out across the water.
    far.add(rect(0, 74, 2600, 16, "#7a4a2c", 2, 0.35));
    // Skyline: flat blocks with lit windows, further ones dimmer. Widened
    // along with the stage - at the old range it ran out of city well before
    // the new camera's zoomed-out edge, which read as the far shore ending.
    for (let i = -12; i <= 12; i++) {
      const x = i * 128 + ((i * 53) % 60);
      const h = 60 + ((i * 71) % 96);
      const w = 54 + ((i * 37) % 40);
      far.add(rect(x, 96, w, h, i % 2 ? "#1b2a44" : "#16243a", 2, 0.95));
      for (let r = 0; r < Math.floor(h / 22); r++) {
        for (let c = -1; c <= 1; c++) {
          if ((i + r + c) % 3 === 0) continue;
          far.add(rect(x + c * (w / 3), 106 + r * 22, 6, 8, "#ffd06b", 3, 0.5));
        }
      }
    }
    // Cranes on the far quay.
    for (const [x, k] of [[-740, 1], [-620, 0.85], [420, 0.8], [700, 0.9], [860, 0.75]] as [number, number][]) {
      far.add(rect(x, 96, 7, 120 * k, "#22344e", 3, 0.95));
      far.add(rect(x + 34, 96 + 118 * k, 96 * k, 6, "#22344e", 3, 0.95));
      far.add(rect(x + 74 * k, 96 + 92 * k, 3, 28 * k, "#22344e", 3, 0.9));
      far.add(rect(x - 18, 96 + 104 * k, 40 * k, 5, "#22344e", 3, 0.9));
    }
    // A freighter alongside, because the reference has one and the silhouette
    // is what says "docks" before anything else does.
    far.add(poly(-430, 82, [-210, 0, -196, -14, 168, -14, 200, 0, 176, 26, -188, 26], "#2a1f2a", 4, 0.97));
    far.add(rect(-430, 108, 300, 8, "#3a2c34", 4, 0.97));
    far.add(rect(-330, 116, 90, 54, "#33465e", 4, 0.97));
    far.add(rect(-330, 132, 74, 9, "#ffd06b", 5, 0.45));
    far.add(rect(-392, 116, 5, 86, "#22344e", 4, 0.95));
    far.add(rect(-262, 116, 5, 72, "#22344e", 4, 0.95));
    this.addLayer(far, 0.24);

    const mid = new THREE.Group();
    // The far side of the works: sheds, a chimney and the smoke off it.
    mid.add(rect(560, 60, 300, 150, "#2a2028", 5, 0.97));
    mid.add(rect(560, 200, 320, 14, "#3a2c30", 5, 0.97));
    mid.add(rect(660, 210, 34, 120, "#2a2028", 5, 0.97));
    for (let i = 0; i < 4; i++) {
      mid.add(tri(664 + i * 9, 326 + i * 34, 44 + i * 22, 56, "#4a4048", 5, 0.2 - i * 0.04));
    }
    for (let i = -1; i <= 2; i++) {
      mid.add(rect(470 + i * 78, 92, 44, 30, "#ff9440", 6, 0.35));
    }
    mid.add(rect(-700, 60, 260, 120, "#241c22", 5, 0.97));
    mid.add(poly(-700, 180, [-134, 0, 0, 44, 134, 0], "#2e242c", 5, 0.97));
    // A second shed further out, filling the width the wider stage opened up.
    mid.add(rect(-900, 50, 200, 96, "#221a20", 5, 0.97));
    mid.add(poly(-900, 146, [-104, 0, 0, 34, 104, 0], "#2c2228", 5, 0.97));
    this.addLayer(mid, 0.62);

    const near = new THREE.Group();
    const beam = "#5a4128";
    const beamLit = "#8a6238";
    const iron = "#3a3038";

    // ---- the ground floor ----
    // Wet planking, dark enough that a fighter down here is plainly on a
    // different surface from the timber decks above. Four storeys only work
    // if you can tell at a glance which one someone is on.
    near.add(rect(0, -120, 2600, 120, "#4a3840", 10, 1));
    for (let x = -W - 40; x <= W + 40; x += 34) {
      near.add(rect(x, -120, 3, 120, "#2a1f28", 10, 0.8));
    }
    near.add(rect(0, -6, 2600, 6, "#6b5148", 10, 0.9));
    // Standing water, catching the fires overhead. Seen side-on a puddle is a
    // bright streak lying on the boards, not a pool with depth - drawn tall it
    // just reads as a hatch cut into the floor.
    for (const [x, w] of [[-780, 130], [-420, 90], [-180, 110], [200, 90], [560, 150], [800, 110]] as [
      number,
      number,
    ][]) {
      near.add(rect(x, -12, w, 7, "#5c4048", 11, 0.85));
      near.add(rect(x, -10, w * 0.78, 4, "#a8642a", 11, 0.55));
      near.add(rect(x, -9, w * 0.42, 2, "#ffd06b", 11, 0.45));
    }

    // ---- the piles the dock deck stands on ----
    for (let x = -W; x <= W; x += 96) {
      near.add(rect(x, 0, 11, deckL.y, beam, 7, 0.95));
      near.add(rect(x, 0, 4, deckL.y, beamLit, 8, 0.6));
      near.add(rect(x, 20, 26, 5, beam, 8, 0.9));
    }

    // ---- dock deck, the lowest storey ----
    // The standable surface itself is drawn by buildPlatforms off the same
    // list, so only the parts it does not draw are here: the planking on top
    // and the glow on the underside, where the furnaces are.
    for (const p of [deckL, deckM, deckR]) {
      for (let i = 0; i < Math.floor(p.w / 26); i++) {
        near.add(rect(p.x + 13 + i * 26, p.y, 3, 6, iron, 9, 0.45));
      }
      near.add(rect(p.x + p.w / 2, p.y - 12, p.w, 5, "#a8642a", 9, 0.5));
    }
    // Braziers on the dock deck and on the floor below it, which is where all
    // the light in this stage comes from.
    const brazier = (x: number, y: number, k = 1) => {
      near.add(rect(x, y, 22 * k, 20 * k, iron, 10, 0.97));
      near.add(poly(x, y + 20 * k, [-11, 0, -6, 16, 0, 24, 7, 14, 11, 0], "#ff9440", 11, 0.9));
      near.add(poly(x, y + 22 * k, [-6, 0, -3, 10, 0, 16, 4, 9, 6, 0], "#ffe3a0", 11, 0.9));
    };
    for (const x of [-720, -420, -60, 420, 620]) brazier(x, deckL.y);
    for (const x of [-560, -280, 100, 480]) brazier(x, 0, 0.85);

    // ---- mid gantry, the second storey ----
    for (const p of [gantryL, gantryR]) {
      near.add(rect(p.x + p.w / 2, p.y - 15, p.w, 4, "#a8642a", 11, 0.45));
      // Handrail along the back, so the deck reads as a walkway.
      near.add(rect(p.x + p.w / 2, p.y + 8, p.w, 3, iron, 11, 0.9));
      near.add(rect(p.x + p.w / 2, p.y + 28, p.w, 3, iron, 11, 0.9));
      for (let i = 0; i <= Math.floor(p.w / 44); i++) {
        near.add(rect(p.x + i * 44, p.y + 8, 3, 22, iron, 11, 0.9));
      }
      // The legs holding it up, landing on the dock deck below.
      near.add(rect(p.x + 14, deckL.y, 7, p.y - deckL.y, beam, 10, 0.95));
      near.add(rect(p.x + p.w - 14, deckL.y, 7, p.y - deckL.y, beam, 10, 0.95));
    }

    // ---- the crow's nest, the top storey ----
    //
    // It sits over the gap *between* the two gantry halves rather than over
    // either one, which is why nothing lands on the gantry to hold it up -
    // its own legs run all the way down to the dock deck's middle run,
    // passing through that gap, the way a real gantry crane's tower rises
    // through the walkways built onto its sides rather than resting on them.
    // That is also why the climb to it is the one jump on the stage that
    // needs a direction held rather than a straight hop: there is no ledge
    // directly under it to hop from.
    {
      const legL = nest.x + 18;
      const legR = nest.x + nest.w - 18;
      near.add(rect(legL, deckM.y, 8, nest.y - deckM.y, beam, 6, 0.95));
      near.add(rect(legR, deckM.y, 8, nest.y - deckM.y, beam, 6, 0.95));
      // Horizontal ties, because a leg this tall reads as a flagpole without
      // them - two rungs of scaffolding rather than a bare pair of posts.
      for (const y of [deckM.y + 44, deckM.y + 88]) {
        near.add(rect((legL + legR) / 2, y, legR - legL + 8, 5, beamLit, 6, 0.8));
      }
      near.add(rect(nest.x + nest.w / 2, nest.y - 15, nest.w, 4, "#a8642a", 11, 0.45));
      // Rails on both faces - unlike the gantry halves, a fighter can climb
      // onto this from either side, so both sides need something to stop
      // them walking straight off the back of it.
      for (const side of [1, -1]) {
        near.add(rect(nest.x + nest.w / 2, nest.y + (side > 0 ? 8 : 28), nest.w, 3, iron, 11, 0.9));
      }
      for (let i = 0; i <= Math.floor(nest.w / 40); i++) {
        near.add(rect(nest.x + i * 40, nest.y + 8, 3, 22, iron, 11, 0.9));
      }
      // The beacon: brighter and taller than the ordinary lamps on the
      // gantry legs, so the best spot on the stage reads as the best spot
      // on the stage from anywhere on it.
      near.add(rect(nest.x + nest.w / 2, nest.y + 30, 4, 26, iron, 12, 0.9));
      near.add(disc(nest.x + nest.w / 2, nest.y + 58, 10, "#ffd06b", 12, 0.9));
      near.add(disc(nest.x + nest.w / 2, nest.y + 58, 22, "#ffd06b", 11, 0.2));
    }

    // ---- ladders and catwalks between the storeys ----
    const ladder = (x: number, y0: number, y1: number) => {
      near.add(rect(x - 9, y0, 4, y1 - y0, beamLit, 12, 0.95));
      near.add(rect(x + 9, y0, 4, y1 - y0, beamLit, 12, 0.95));
      for (let y = y0 + 8; y < y1; y += 14) near.add(rect(x, y, 22, 3, beamLit, 12, 0.95));
    };
    // Straight up: ground to the dock deck, wherever a run actually is.
    ladder(deckL.x + 60, 0, deckL.y);
    ladder(deckM.x + deckM.w / 2, 0, deckM.y);
    ladder(deckR.x + deckR.w - 60, 0, deckR.y);
    // Straight up again: these stand where the deck and the gantry above it
    // actually overlap, or they would climb out of thin air.
    ladder((gantryL.x + deckL.x + deckL.w) / 2, deckL.y, gantryL.y);
    ladder((gantryR.x + gantryR.w + deckR.x) / 2, deckR.y, gantryR.y);
    // Angled: the gantry does not run under the crow's nest, so the last leg
    // is a rising line of treads rather than a straight ladder - drawing it
    // as one would be a lie about which way to press. One rising in from
    // each gantry half toward the middle, the same way the vertical ladders
    // above are a stack of unrotated rungs rather than a single rotated mesh.
    for (const [x0, y0, x1, y1] of [
      [gantryL.x + gantryL.w - 20, gantryL.y, nest.x + 14, nest.y],
      [gantryR.x + 20, gantryR.y, nest.x + nest.w - 14, nest.y],
    ] as [number, number, number, number][]) {
      const steps = 6;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;
        near.add(rect(x, y, 16, 3, beamLit, 12, 0.95));
      }
    }

    // ---- chains, hooks and the clutter that makes it a working yard ----
    for (const [x, top] of [[-820, 250], [-420, 300], [-90, 236], [370, 258], [700, 290], [900, 240]] as [
      number,
      number,
    ][]) {
      for (let y = 150; y < top; y += 13) near.add(disc(x, y, 4, iron, 9, 0.9));
      near.add(poly(x, 138, [0, 12, -8, 4, -5, -6, 5, -6, 8, 4], iron, 9, 0.92));
    }
    for (const [x, y] of [
      [deckL.x + 60, deckL.y],
      [deckL.x + 240, deckL.y],
      [deckM.x + 30, deckM.y],
      [deckR.x + 60, deckR.y],
      [deckR.x + 260, deckR.y],
      [gantryL.x + 100, gantryL.y],
      [gantryR.x + 160, gantryR.y],
    ] as [number, number][]) {
      near.add(rect(x, y, 30, 26, "#6b4a2c", 10, 0.97));
      near.add(rect(x, y + 12, 30, 3, "#4a3220", 11, 0.9));
      near.add(rect(x, y, 3, 26, "#4a3220", 11, 0.9));
    }
    for (const [x, y] of [
      [deckL.x + 150, deckL.y],
      [deckM.x + 180, deckM.y],
      [deckR.x + 180, deckR.y],
      [gantryL.x + 200, gantryL.y],
    ] as [number, number][]) {
      near.add(rect(x, y, 20, 30, "#4a4a52", 10, 0.97));
      near.add(rect(x, y + 26, 22, 4, "#5c5c66", 11, 0.9));
      near.add(rect(x, y + 3, 22, 3, "#5c5c66", 11, 0.9));
    }
    // Lamps on the gantry legs.
    for (const x of [gantryL.x + 14, gantryL.x + gantryL.w - 14, gantryR.x + 14, gantryR.x + gantryR.w - 14]) {
      near.add(rect(x, gantryL.y + 32, 3, 22, iron, 12, 0.9));
      near.add(disc(x, gantryL.y + 32, 7, "#ffd06b", 12, 0.85));
      near.add(disc(x, gantryL.y + 32, 14, "#ffd06b", 11, 0.16));
    }
    this.addLayer(near, 1);
  }

  private buildPainted(def: BackdropDef) {
    const g = new THREE.Group();
    const H = def.width / def.aspect; // the painting's own aspect - never letterbox it
    const geo = new THREE.PlaneGeometry(def.width, H);
    const material = new THREE.MeshBasicMaterial({ toneMapped: false });
    // Held blank until the bitmap arrives rather than flashing white: the
    // texture decode is async even when the file is inlined as a data URI.
    material.transparent = true;
    material.opacity = 0;

    // Resolved through a glob rather than a plain import on purpose. The
    // self-tests load this module under Node to read STAGE_THEMES, and Node
    // cannot parse a .jpg import - but it never builds a Stage, so keeping
    // every asset reference inside this method keeps the tests running.
    // Vite still sees the pattern statically and bundles all of them.
    const files = import.meta.glob("../../../assets/*.jpg", {
      import: "default",
      query: "?url",
    }) as Record<string, () => Promise<string>>;
    const load = files[`../../../assets/${def.file}`];
    if (!load) return;

    void load().then((url) => {
      new THREE.TextureLoader().load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        // The quad is bigger than the source and the art is pixel work, so it
        // is left crisp rather than smoothed back into mush.
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.generateMipmaps = true;
        material.map = tex;
        material.opacity = 1;
        material.transparent = false;
        material.needsUpdate = true;
        this.textures.push(tex);
      });
    });

    const m = new THREE.Mesh(geo, material);
    m.position.set(0, H / 2 - def.sink, layerZ(1));
    m.renderOrder = 1;
    g.add(m);
    this.addLayer(g, 0.25);
  }

  // ------------------------------------------------------------------ update

  /** Applies parallax and advances ambient weather. */
  update(cameraX: number, cameraY: number) {
    this.frame++;
    for (const layer of this.layers) {
      layer.group.position.x = cameraX * (1 - layer.parallax);
      layer.group.position.y = cameraY * (1 - layer.parallax) * 0.4;
    }
    this.ambient.update(this.frame, cameraX);
  }

  dispose() {
    for (const d of this.disposables) d.dispose();
    for (const t of this.textures) t.dispose();
    this.ambient.dispose();
  }
}

export function themeForFighter(id: string): StageTheme {
  switch (id) {
    case "roman":
      return "colosseum";
    case "pirate":
      return "deck";
    case "western":
      return "frontier";
    case "samurai":
      return "dojo";
    case "viking":
      return "tundra";
    case "soldier":
      return "delta";
    case "spartan":
      return "colosseum";
    case "muaythai":
      return "delta";
    case "ninja":
      return "dojo";
    case "mongol":
      return "tundra";
    case "knight":
      return "forge";
    case "jaguar":
      return "delta";
    case "zulu":
      return "frontier";
    case "shaolin":
      return "skyward";
    case "nihang":
      return "forge";
    case "lapulapu":
      return "mactan";
    case "iceni":
      return "watling";
    case "conquistador":
      return "causeway";
    // No stage of his own yet - the frozen pass is the closest thing on the
    // list to a Zagros winter, and it is where the other dug-up man fights.
    case "shanidar":
      return "tundra";
    default:
      return "colosseum";
  }
}

/** Picks a random stage, optionally avoiding one. */
export function randomTheme(exclude?: StageTheme): StageTheme {
  const options = STAGE_LIST.filter((t) => t !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

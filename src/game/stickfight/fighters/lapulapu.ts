/**
 * Lapulapu (fl. 1521) - datu of Mactan, and the reason the man who set out to
 * sail round the world did not finish the journey.
 *
 * Antonio Pigafetta was in one of the boats and wrote down what happened. The
 * water was too shallow to bring them in, so the Spanish waded the last stretch
 * on foot; the Mactan warriors stood in it and waited. And then the detail the
 * whole character is built on: they worked out within minutes that the armour
 * stopped at the knee, and spent the rest of the morning fighting from below.
 * They knocked Magellan's helmet off twice before they killed him.
 *
 * So he is not a spear-thrower and he is not a summoner - both of those lanes
 * are full. He is the only fighter on the roster who reaches across and takes
 * a piece of the other man's kit off him, and the only one who changes what
 * the ground is worth. Longest low reach in the game, one bamboo stake he has
 * to go and pick back up, and he hits hardest with his back to the wall.
 */

import type { FighterDef } from "../types";
import { bx, guardClips, hit, kf, universalMoves } from "./builders";

const SKIN = "#8a5a38";
const BAMBOO = "#c8b273";
const BAMBOO_DARK = "#8a7642";
const RATTAN = "#a8834c";
const STEEL = "#cdd6de";
const STEEL_DARK = "#7c8892";
const DYE_RED = "#b8402f";
const DYE_BLACK = "#2a2018";
const GOLD = "#d8ab4c";

/**
 * Low and wide, weight already back over the rear foot.
 *
 * He fights from underneath, so the stance sits lower than anyone else's on
 * the roster and the kampilan is carried down and across rather than up in a
 * guard - a sword held low is a sword already on the line to the shins.
 */
const STANCE = {
  torso: 12,
  head: -4,
  hipF: 22,
  kneeF: 26,
  hipB: -24,
  kneeB: 38,
  shoulderF: 34,
  elbowF: 46,
  shoulderB: 26,
  elbowB: 58,
  weapon: 38,
};

export const LAPULAPU: FighterDef = {
  id: "lapulapu",
  name: "Lapulapu",
  title: "Datu of Mactan",
  era: "Mactan, 1521",
  bio: "Datu of Mactan, who refused to pay tribute and refused to convert, and met the landing party in the shallows where their boats could not follow. Pigafetta, watching from the water, wrote that they aimed for the legs because the legs were bare - and that they put Magellan's helmet in the sand twice before the end.",
  archetype: "Low Footsies / Attrition",
  difficulty: 4,
  strengths: ["Longest lows in the game", "Knocks armour off and keeps it off", "Stronger the worse it gets"],
  weaknesses: ["Fragile", "One stake, and it has to be fetched", "Nothing fast up close"],
  winQuote: "The water was always going to be here. You chose to walk into it.",
  palette: {
    body: SKIN,
    outline: "#17120d",
    accent: DYE_RED,
    cloth: RATTAN,
    metal: STEEL,
    aura: "#5fb7c9",
  },
  stats: {
    // The lowest health of any melee fighter on the roster. He is wearing a
    // loincloth and a bracelet against men in plate, which is the matchup the
    // whole design is about, and the number has to say so.
    health: 900,
    walkF: 3.35,
    walkB: 2.75,
    dashSpeed: 9.2,
    dashFrames: 14,
    backdashFrames: 18,
    jumpVel: 12.4,
    jumpFwd: 5.4,
    gravity: 0.63,
    // Light. He goes further than anyone when he is caught, which is the
    // price of the reach and the speed.
    weight: 0.9,
    airMoves: 2,
    doubleJump: false,
    airDash: false,
    width: 19,
    standHeight: 106,
    crouchHeight: 62,
    scale: 1.0,
  },
  stance: STANCE,
  // The kalasag is narrow - a plank of hardwood, not a wall - so it covers the
  // line rather than the man, and the low guard drops it to the shins because
  // that is the height he expects to be attacked at himself.
  clips: guardClips({
    high: { torso: 6, head: -8, shoulderB: 16, elbowB: 96, shoulderF: 24, elbowF: 72, weapon: 62, hipF: 20, kneeF: 30, hipB: -22, kneeB: 40, offX: -3 },
    low: { torso: 14, head: -6, shoulderB: -8, elbowB: 104, shoulderF: 30, elbowF: 68, weapon: 70, hipF: 34, kneeF: 78, hipB: -22, kneeB: 86, offX: -3 },
  }),
  resource: {
    name: "Bangkaw",
    max: 1,
    start: 1,
    // One stake. Not a magazine, not a meter that fills itself - a single
    // object that is either in his hand or lying in the sand where he threw
    // it, and the only way back is to walk over and pick it up. That loop is
    // the reason he can have a projectile at all without becoming a zoner.
    color: BAMBOO,
    pips: true,
  },
  props: [
    {
      id: "headband",
      attach: "head",
      // A pudong: dyed cloth wound round the head. Rank, not protection - and
      // deliberately not tagged as armour, because there is nothing here that
      // losing would change.
      parts: [
        { geo: "poly", size: [-11, -2, -10, 4, 0, 6, 10, 4, 11, -2, 8, -4, -8, -4], pos: [0, 4], color: DYE_RED },
        { geo: "box", size: [21, 2.2], pos: [0, 2], color: DYE_BLACK, z: 0.5 },
        // The tail of it hanging down the back of the neck.
        { geo: "poly", size: [-3, 6, 3, 5, 2, -14, -2, -12], pos: [-9, -2], color: DYE_RED, behind: true },
        { geo: "poly", size: [-2, 4, 2, 4, 1, -9, -1, -8], pos: [-11, -12], color: DYE_BLACK, behind: true },
      ],
    },
    {
      id: "kampilan",
      attach: "handF",
      // Kampilan: a long single-edged sword that widens toward the point, with
      // the spurred pommel carved as a creature's open mouth and a tuft of
      // hair set in it. Longest blade on the roster.
      parts: [
        // Grip and the carved pommel, which juts back past the hand.
        { geo: "box", size: [15, 6], pos: [1, 0], color: "#5c4126" },
        { geo: "box", size: [15, 1.8], pos: [1, 2], color: "#7a5a34" },
        { geo: "poly", size: [0, -7, -6, -9, -11, -4, -11, 5, -5, 8, 0, 6], pos: [-11, 0], color: "#6b4a2c" },
        // The bifurcated spur of the pommel - the open jaw.
        { geo: "poly", size: [0, 1, -8, 7, -12, 5, -6, 0], pos: [-16, 3], color: "#5c4126" },
        { geo: "poly", size: [0, -1, -8, -7, -12, -5, -6, 0], pos: [-16, -3], color: "#5c4126" },
        { geo: "disc", size: [1.5], pos: [-13, 2], color: DYE_RED, z: 0.4 },
        // Hair tuft set into the pommel.
        { geo: "poly", size: [0, 3, -7, 6, -13, 2, -7, -3], pos: [-20, 0], color: DYE_BLACK, behind: true },
        // Guard block and the long blade, widening toward the tip and cut
        // back on the spine to the sharp forward point.
        { geo: "box", size: [7, 9], pos: [10, 0], color: "#4a3220" },
        { geo: "poly", size: [0, 5, 62, 8, 78, 5, 78, -3, 62, -6, 0, -5], pos: [14, 0], color: STEEL },
        { geo: "poly", size: [0, 2.5, 60, 4, 74, 2.5, 74, 0, 0, 0], pos: [14, 1], color: "#eef3f7", z: 0.3 },
        { geo: "poly", size: [0, 5, 14, 2, 12, -6, 0, -4], pos: [92, 0], color: STEEL, z: 0.2 },
      ],
    },
    {
      id: "kalasag",
      attach: "forearmB",
      armour: "shield",
      // Kalasag: a tall narrow plank shield of hardwood, bound with rattan and
      // painted. It covers a line, not a body - nothing like the round and
      // tower shields the rest of the roster hides behind.
      parts: [
        { geo: "poly", size: [-8, 44, 8, 44, 10, 20, 10, -20, 8, -44, -8, -44, -10, -20, -10, 20], pos: [10, 0], color: RATTAN, z: 0.5 },
        // Painted bands.
        { geo: "box", size: [19, 4], pos: [10, 24], color: DYE_BLACK, z: 0.55 },
        { geo: "box", size: [19, 4], pos: [10, -24], color: DYE_BLACK, z: 0.55 },
        { geo: "poly", size: [-7, 0, 0, 11, 7, 0, 0, -11], pos: [10, 0], color: DYE_RED, z: 0.55 },
        // Rattan lashings across the grain, and the central spine.
        { geo: "box", size: [3.4, 88], pos: [10, 0], color: "#7a5a34", z: 0.6 },
        { geo: "box", size: [21, 1.8], pos: [10, 36], color: "#6b4a2c", z: 0.65 },
        { geo: "box", size: [21, 1.8], pos: [10, 12], color: "#6b4a2c", z: 0.65 },
        { geo: "box", size: [21, 1.8], pos: [10, -12], color: "#6b4a2c", z: 0.65 },
        { geo: "box", size: [21, 1.8], pos: [10, -36], color: "#6b4a2c", z: 0.65 },
      ],
    },
    {
      id: "bangkaw",
      attach: "back",
      // The stake: a length of bamboo cut on the slant and fire-hardened, worn
      // across the back until it is thrown. Not conditional but resource-gated:
      // it is on his back exactly while he has one, which no move can express,
      // because the frames it is missing for are the ones between his moves.
      needsResource: 1,
      parts: [
        { geo: "cyl", size: [2.6, 84], pos: [0, 0], rot: 74, color: BAMBOO },
        { geo: "box", size: [6, 2], pos: [-10, -34], rot: 74, color: BAMBOO_DARK },
        { geo: "box", size: [6, 2], pos: [-4, -12], rot: 74, color: BAMBOO_DARK },
        { geo: "box", size: [6, 2], pos: [3, 12], rot: 74, color: BAMBOO_DARK },
        // The slant cut, charred black.
        { geo: "poly", size: [0, 3, 13, 9, 15, 4, 3, -3], pos: [10, 38], color: DYE_BLACK },
      ],
    },
    {
      id: "bangkawHand",
      attach: "handB",
      // The same stake, in the hand, for the throw. Held by the butt with the
      // hardened point forward.
      conditional: true,
      parts: [
        { geo: "cyl", size: [2.6, 78], pos: [22, 0], rot: 90, color: BAMBOO },
        { geo: "box", size: [2, 6], pos: [0, 0], color: BAMBOO_DARK },
        { geo: "box", size: [2, 6], pos: [22, 0], color: BAMBOO_DARK },
        { geo: "box", size: [2, 6], pos: [44, 0], color: BAMBOO_DARK },
        { geo: "poly", size: [0, 3, 14, 1, 14, -1, 0, -3], pos: [58, 0], color: DYE_BLACK },
      ],
    },
    {
      id: "bahag",
      attach: "pelvis",
      // Bahag: the loincloth, wrapped and knotted, with the tapis hanging at
      // the front. This is the entire extent of what he is wearing.
      parts: [
        { geo: "box", size: [24, 7], pos: [0, 1], color: DYE_RED },
        { geo: "box", size: [24, 2], pos: [0, 3], color: GOLD, z: 0.3 },
        { geo: "poly", size: [-6, 7, 6, 7, 5, -20, -5, -18], pos: [4, -6], color: RATTAN },
        { geo: "box", size: [9, 2], pos: [4, -18], color: DYE_BLACK, z: 0.3 },
        { geo: "poly", size: [-4, 6, 4, 6, 3, -15, -3, -14], pos: [-7, -6], color: RATTAN, behind: true },
      ],
    },
    {
      id: "armlets",
      attach: "forearmF",
      // Beaten brass at the wrist and above the elbow. Ornament, and the only
      // metal on him that is not the sword.
      parts: [
        { geo: "ring", size: [4.6, 1.8], pos: [2, 0], color: GOLD },
        { geo: "ring", size: [4.2, 1.6], pos: [9, 0], color: GOLD },
        { geo: "ring", size: [4.8, 2], pos: [20, 0], color: "#b08a34" },
      ],
    },
    {
      id: "anklets",
      attach: "footF",
      parts: [
        { geo: "ring", size: [4, 1.6], pos: [-1, 9], color: GOLD },
        { geo: "disc", size: [1.3], pos: [-1, 5], color: DYE_RED },
      ],
    },
  ],

  moves: [
    ...universalMoves({
      throwDamage: 118,
      backThrowDamage: 126,
      throwRange: 64,
      rollSpeed: 8.2,
      weaponIdle: { weapon: STANCE.weapon },
      // The kampilan is carried low and across, so through the bottom of the
      // tumble its point is the part nearest the floor. Lifted clear.
      rollCarry: { front: 34 },
    }),

    // --------------------------------------------------------------- normals
    {
      id: "5A",
      name: "Tine Poke",
      input: { button: "A", stance: "stand" },
      tags: ["light"],
      duration: 12,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [3, 11],
      hits: [hit(4, 6, bx(22, 54, 50, 20), 30, { blockstun: 9, hitstun: 13, fx: "pierce", pushX: 3 })],
      desc: "A short cut with the forward half of the blade. His fastest button, and it does not reach nearly as far as the rest of him.",
      notation: "A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderF: 72, elbowF: 12, weapon: 6, torso: 18, offX: 4 }),
        kf(8, { ...STANCE, shoulderF: 48, elbowF: 36, weapon: 24, torso: 12 }, "inOut"),
        kf(12, { ...STANCE }),
      ],
    },
    {
      id: "5B",
      name: "Level Cut",
      input: { button: "B", stance: "stand" },
      tags: ["medium"],
      duration: 20,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [6, 18],
      hits: [hit(7, 10, bx(26, 44, 84, 26), 52, { fx: "slash", pushX: 5, hitstun: 18, hitstop: 7 })],
      desc: "The kampilan swung flat at rib height. The range on this is what makes people stand still.",
      notation: "B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderF: 10, elbowF: 74, weapon: 84, torso: -10, offX: -4 }, "out"),
        kf(7, { ...STANCE, shoulderF: 82, elbowF: 6, weapon: -8, torso: 20, hipF: 34, offX: 7 }, "out"),
        kf(13, { ...STANCE, shoulderF: 66, elbowF: 22, weapon: 10, torso: 14, offX: 4 }, "inOut"),
        kf(20, { ...STANCE }),
      ],
    },
    {
      id: "5C",
      name: "Long Sweep",
      input: { button: "C", stance: "stand" },
      tags: ["heavy"],
      duration: 30,
      cancelInto: ["special", "super"],
      cancelWindow: [10, 26],
      hits: [hit(12, 17, bx(28, 34, 106, 40), 78, { fx: "slash", pushX: 8, hitstun: 22, hitstop: 10, shake: 1.5 })],
      desc: "The whole length of the blade taken across in one turn. The longest standing normal in the game.",
      notation: "C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: -6, elbowF: 88, weapon: 104, shoulderB: 44, elbowB: 40, torso: -18, offX: -7 }, "out"),
        kf(12, { ...STANCE, shoulderF: 74, elbowF: 4, weapon: -18, shoulderB: 96, elbowB: 14, torso: 24, hipF: 38, kneeF: 16, offX: 10 }, "out"),
        kf(20, { ...STANCE, shoulderF: 54, elbowF: 30, weapon: 8, torso: 16, offX: 5 }, "inOut"),
        kf(30, { ...STANCE }),
      ],
    },
    {
      id: "2A",
      name: "Low Poke",
      input: { button: "A", stance: "crouch" },
      tags: ["light", "low"],
      duration: 13,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [3, 12],
      hits: [hit(4, 6, bx(20, 8, 48, 20), 28, { guard: "low", blockstun: 9, hitstun: 13, fx: "slash", pushX: 2 })],
      desc: "A flick of the point along the sand. Nothing on its own; it is how every low string starts.",
      notation: "↓ + A",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(4, { ...STANCE, crouch: 1, shoulderF: 6, elbowF: 22, weapon: -14, torso: 22, offX: 4 }),
        kf(9, { ...STANCE, crouch: 1, shoulderF: 18, elbowF: 44, weapon: 14, torso: 16 }, "inOut"),
        kf(13, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "2B",
      name: "Below the Cuirass",
      input: { button: "B", stance: "crouch" },
      tags: ["medium", "low"],
      duration: 22,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [7, 20],
      // His best normal, and the thesis of the whole character. Pigafetta:
      // they went for the legs because the legs were the part with nothing on
      // them. It is faster than a low this long has any right to be, and the
      // damage is only ordinary - what it buys is that people have to crouch.
      hits: [hit(8, 12, bx(24, 4, 100, 24), 50, { guard: "low", fx: "slash", pushX: 4, hitstun: 19, hitstop: 7 })],
      desc: "The shin cut. Long, quick for its reach, and it must be blocked low - conditioning them to crouch is how everything else he does gets to work.",
      notation: "↓ + B",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(4, { ...STANCE, crouch: 1, shoulderF: 30, elbowF: 62, weapon: 74, torso: -6, offX: -5 }, "out"),
        kf(8, { ...STANCE, crouch: 1, shoulderF: 2, elbowF: 14, weapon: -30, torso: 26, hipF: 30, offX: 9 }, "out"),
        kf(15, { ...STANCE, crouch: 1, shoulderF: 16, elbowF: 38, weapon: -6, torso: 18, offX: 5 }, "inOut"),
        kf(22, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "2C",
      name: "Reap the Ankles",
      input: { button: "C", stance: "crouch" },
      tags: ["heavy", "low"],
      duration: 32,
      cancelInto: ["special", "super"],
      cancelWindow: [12, 28],
      hits: [hit(13, 18, bx(26, 0, 112, 20), 72, {
        guard: "low",
        fx: "slash",
        pushX: 6,
        knockdown: "sweep",
        hitstun: 20,
        hitstop: 9,
        shake: 1.5,
      })],
      desc: "Drops onto the back heel and takes the blade along the ground the full width of his reach. Knocks them off their feet.",
      notation: "↓ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(6, { ...STANCE, crouch: 1, shoulderF: 44, elbowF: 66, weapon: 88, torso: -14, offX: -6 }, "out"),
        kf(13, { ...STANCE, crouch: 1, squash: 0.94, shoulderF: -8, elbowF: 8, weapon: -42, torso: 30, hipF: 26, kneeF: 88, hipB: -30, kneeB: 96, offX: 11 }, "out"),
        kf(22, { ...STANCE, crouch: 1, shoulderF: 12, elbowF: 34, weapon: -10, torso: 20, offX: 6 }, "inOut"),
        kf(32, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "6A",
      name: "Stepping Cut",
      input: { button: "A", dir: "f", stance: "stand" },
      tags: ["light"],
      duration: 16,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [5, 14],
      vel: [{ at: 3, x: 2.6 }, { at: 9, x: 0 }],
      friction: 0.9,
      hits: [hit(6, 9, bx(24, 46, 60, 26), 36, { fx: "slash", pushX: 3, hitstun: 15 })],
      desc: "Closes a step and cuts on the way in. How he gets from his range to theirs when he has to.",
      notation: "→ + A",
      // The blade has to still be travelling while the hitbox is open. Written
      // the other way round - wind-up, then the impact pose on the first active
      // frame - the cut lands on a sword that has already stopped, and reads as
      // a fighter holding a weapon against someone rather than swinging one.
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, shoulderF: 8, elbowF: 74, weapon: 88, torso: -8, offX: -2 }, "out"),
        kf(6, { ...STANCE, shoulderF: 44, elbowF: 36, weapon: 40, torso: 8, hipF: 26, offX: 4 }, "linear"),
        kf(9, { ...STANCE, shoulderF: 78, elbowF: 6, weapon: -14, torso: 22, hipF: 32, offX: 7 }, "out"),
        kf(13, { ...STANCE, shoulderF: 52, elbowF: 34, weapon: 18, torso: 12 }, "inOut"),
        kf(16, { ...STANCE }),
      ],
    },
    {
      id: "6B",
      name: "Rising Kalasag",
      input: { button: "B", dir: "f", stance: "stand" },
      tags: ["medium"],
      duration: 24,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [8, 22],
      hits: [hit(9, 12, bx(16, 52, 52, 44), 48, { fx: "blunt", pushX: 5, hitstun: 19, hitstop: 8 })],
      desc: "Drives the edge of the shield up under their chin. His one close-range answer that is not the dagger.",
      notation: "→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderB: -6, elbowB: 84, torso: 16, crouch: 0.3, offX: 2 }, "out"),
        kf(9, { ...STANCE, shoulderB: 78, elbowB: 26, torso: 6, hipF: 30, kneeF: 16, offX: 6 }, "out"),
        kf(16, { ...STANCE, shoulderB: 46, elbowB: 52, torso: 10 }, "inOut"),
        kf(24, { ...STANCE }),
      ],
    },
    {
      id: "6C",
      name: "Push Them Back",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["heavy"],
      duration: 34,
      // The string ender, and it is a shove rather than a finisher on purpose:
      // what he wants at the end of a sequence is not damage, it is the fight
      // returned to the distance where his blade is longer than theirs.
      hits: [hit(11, 15, bx(20, 30, 74, 56), 62, {
        fx: "blunt",
        pushX: 16,
        selfPushX: -2,
        hitstun: 18,
        hitstop: 9,
        shake: 1.6,
      })],
      desc: "Both hands into the shield and drives them away. Barely hurts. It puts the fight back at his range, which is worth more.",
      notation: "→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderB: 10, elbowB: 92, shoulderF: 20, elbowF: 70, weapon: 66, torso: -12, crouch: 0.34, offX: -6 }, "out"),
        kf(11, { ...STANCE, shoulderB: 88, elbowB: 8, shoulderF: 62, elbowF: 30, weapon: 40, torso: 30, hipF: 42, kneeF: 20, hipB: -34, kneeB: 44, offX: 11 }, "out"),
        kf(20, { ...STANCE, shoulderB: 52, elbowB: 44, torso: 16, offX: 5 }, "inOut"),
        kf(34, { ...STANCE }),
      ],
    },
    {
      id: "3C",
      name: "Overhead Kampilan",
      input: { button: "C", dir: "df", stance: ["stand", "crouch"] },
      tags: ["heavy", "overhead", "launcher"],
      duration: 40,
      // The slowest overhead on the roster and the longest. It has to be slow:
      // it is the other half of the guessing game 2B sets up, and a fast
      // overhead on top of the best low in the game would not be a guess.
      hits: [hit(18, 22, bx(22, 30, 88, 70), 74, {
        guard: "overhead",
        fx: "slash",
        launch: [2.4, 10.5],
        knockdown: "launch",
        hitstun: 24,
        hitstop: 10,
        shake: 1.7,
      })],
      desc: "Both hands to the hilt and the whole blade brought down from over the shoulder. Slow enough to see and slow enough to be worth seeing - it launches, and it beats a low block.",
      notation: "↘ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 0.4 }, "out"),
        kf(9, { ...STANCE, shoulderF: 168, elbowF: -14, weapon: -56, shoulderB: 150, elbowB: 10, torso: -22, hipB: -34, kneeB: 44, offX: -6, offY: 2 }, "inOut"),
        kf(14, { ...STANCE, shoulderF: 178, elbowF: -18, weapon: -62, shoulderB: 158, elbowB: 6, torso: -26, offX: -7 }, "in"),
        kf(18, { ...STANCE, shoulderF: 148, elbowF: -10, weapon: -24, shoulderB: 132, elbowB: 2, torso: 4, hipF: 30, kneeF: 14, offX: 5 }, "linear"),
        // Through the target rather than stopping on it: a hundred degrees of
        // shoulder across the four active frames, with the wrist held, so the
        // blade sweeps rather than translating.
        kf(22, { ...STANCE, shoulderF: 44, elbowF: 8, weapon: -20, shoulderB: 40, elbowB: 22, torso: 34, hipF: 42, kneeF: 26, crouch: 0.32, offX: 10 }, "out"),
        kf(30, { ...STANCE, shoulderF: 40, elbowF: 32, weapon: 30, torso: 20, crouch: 0.24, offX: 4 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },
    {
      id: "4A",
      name: "Withdraw Cut",
      input: { button: "A", dir: "b", stance: "stand" },
      tags: ["light"],
      duration: 16,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [4, 14],
      vel: [{ at: 2, x: -2.2 }, { at: 8, x: 0 }],
      friction: 0.9,
      hits: [hit(5, 8, bx(24, 48, 58, 24), 32, { fx: "slash", pushX: 4, hitstun: 14 })],
      desc: "Gives a step and cuts into the space he just left. Keeps his range while he resets.",
      notation: "← + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(2, { ...STANCE, shoulderF: 92, elbowF: 2, weapon: -22, torso: 14, offX: 1 }, "out"),
        kf(5, { ...STANCE, shoulderF: 62, elbowF: 26, weapon: 20, torso: 6, hipB: -30, kneeB: 42, offX: -2 }, "linear"),
        kf(8, { ...STANCE, shoulderF: 20, elbowF: 60, weapon: 76, torso: -6, hipB: -34, kneeB: 46, offX: -4 }, "out"),
        kf(12, { ...STANCE, shoulderF: 40, elbowF: 46, weapon: 44, torso: 4 }, "inOut"),
        kf(16, { ...STANCE }),
      ],
    },
    {
      id: "4B",
      name: "Backhand Line",
      input: { button: "B", dir: "b", stance: "stand" },
      tags: ["medium"],
      duration: 24,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [8, 22],
      hits: [hit(9, 13, bx(26, 40, 90, 34), 54, { fx: "slash", pushX: 6, hitstun: 19, hitstop: 8 })],
      desc: "Turns the blade back through the line on the way out. Catches whatever followed him.",
      notation: "← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderF: 96, elbowF: 4, weapon: -26, torso: 20, offX: 4 }, "out"),
        kf(9, { ...STANCE, shoulderF: 14, elbowF: 66, weapon: 92, torso: -14, hipB: -32, kneeB: 44, offX: -6 }, "out"),
        kf(16, { ...STANCE, shoulderF: 34, elbowF: 50, weapon: 56, torso: -2 }, "inOut"),
        kf(24, { ...STANCE }),
      ],
    },
    {
      id: "4C",
      name: "Falling Point",
      input: { button: "C", dir: "b", stance: "stand" },
      tags: ["heavy"],
      duration: 34,
      hits: [hit(13, 18, bx(30, 22, 96, 52), 70, {
        // A point, not an edge - the name has always said so.
        fx: "pierce",
        pushX: 7,
        knockdown: "soft",
        hitstun: 21,
        hitstop: 9,
        shake: 1.4,
      })],
      desc: "Steps off the line and lets the weight of the blade fall diagonally through where they were standing.",
      notation: "← + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: 142, elbowF: -8, weapon: -44, torso: -20, hipB: -36, kneeB: 48, offX: -8 }, "out"),
        kf(13, { ...STANCE, shoulderF: 58, elbowF: 16, weapon: 6, torso: 22, hipF: 30, kneeF: 22, offX: 3 }, "out"),
        kf(22, { ...STANCE, shoulderF: 40, elbowF: 40, weapon: 30, torso: 10 }, "inOut"),
        kf(34, { ...STANCE }),
      ],
    },
    {
      id: "jA",
      name: "Air Poke",
      input: { button: "A", stance: "air" },
      tags: ["light", "air"],
      duration: 16,
      hits: [hit(4, 9, bx(20, 24, 56, 30), 32, { fx: "pierce", pushX: 3, hitstun: 14 })],
      desc: "A quick cut out to the side on the way past.",
      notation: "(air) A",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 34, kneeF: 46, hipB: -24, kneeB: 40 }, "out"),
        kf(4, { ...STANCE, free: 1, shoulderF: 76, elbowF: 12, weapon: 0, torso: 12, hipF: 38, kneeF: 50, hipB: -26, kneeB: 44 }),
        kf(16, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "jB",
      name: "Air Sweep",
      input: { button: "B", stance: "air" },
      tags: ["medium", "air"],
      duration: 22,
      hits: [hit(6, 12, bx(24, 14, 82, 34), 52, { fx: "slash", pushX: 5, hitstun: 18, hitstop: 7 })],
      desc: "Swings the length of it out flat while he is off the ground.",
      notation: "(air) B",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 40 }, "out"),
        kf(3, { ...STANCE, free: 1, shoulderF: 4, elbowF: 80, weapon: 96, torso: -14, hipF: 40, kneeF: 52 }, "out"),
        kf(7, { ...STANCE, free: 1, shoulderF: 78, elbowF: 4, weapon: -14, torso: 16, hipF: 34, kneeF: 48, hipB: -26, kneeB: 42 }, "out"),
        kf(22, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "jC",
      name: "Falling Kampilan",
      input: { button: "C", stance: "air" },
      tags: ["heavy", "air"],
      duration: 28,
      hits: [hit(8, 16, bx(18, -6, 72, 60), 74, {
        fx: "slash",
        pushX: 6,
        knockdown: "soft",
        hitstun: 20,
        hitstop: 9,
        shake: 1.4,
      })],
      desc: "Brings it down through them on the way to the sand.",
      notation: "(air) C",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 40 }, "out"),
        kf(4, { ...STANCE, free: 1, shoulderF: 166, elbowF: -14, weapon: -58, torso: -18, hipF: 44, kneeF: 56 }, "out"),
        kf(9, { ...STANCE, free: 1, shoulderF: 46, elbowF: 8, weapon: -4, torso: 26, hipF: 30, kneeF: 44, hipB: -20, kneeB: 36 }, "out"),
        kf(28, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "dashAttack",
      name: "Running Cut",
      input: { button: "C", dir: "f", stance: "stand", whileDashing: true },
      tags: ["heavy"],
      duration: 32,
      vel: [{ at: 1, x: 7.5 }, { at: 14, x: 0 }],
      friction: 0.9,
      hits: [hit(7, 12, bx(26, 34, 96, 44), 68, {
        fx: "slash",
        pushX: 8,
        knockdown: "soft",
        hitstun: 20,
        hitstop: 9,
        shake: 1.5,
      })],
      desc: "Carries the run into the cut and lets it drag him through.",
      notation: "→→ then C",
      frames: [
        kf(0, { ...STANCE, torso: 22, offX: 2 }, "out"),
        kf(4, { ...STANCE, shoulderF: 4, elbowF: 82, weapon: 98, torso: 8, offX: -3 }, "out"),
        kf(7, { ...STANCE, shoulderF: 80, elbowF: 2, weapon: -16, torso: 28, hipF: 40, kneeF: 18, offX: 9 }, "out"),
        kf(18, { ...STANCE, shoulderF: 50, elbowF: 34, weapon: 20, torso: 16, offX: 4 }, "inOut"),
        kf(32, { ...STANCE }),
      ],
    },

    // --------------------------------------------------------- five specials
    {
      id: "knockHelm",
      name: "Knock the Helm",
      input: { button: "C", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 24,
      duration: 38,
      vel: [{ at: 5, x: 2.8 }, { at: 16, x: 0 }],
      friction: 0.92,
      hits: [hit(12, 16, bx(20, 58, 78, 46), 66, {
        fx: "blunt",
        pushX: 6,
        hitstun: 21,
        hitstop: 10,
        shake: 1.8,
        // The one thing nobody else on the roster can do. Against the eight
        // fighters wearing a helmet it comes off and stays off for the round,
        // and everything that lands afterwards hurts more. Against the other
        // fourteen it is an ordinary heavy to the head, which is the intended
        // shape - the move is a matchup, not a universal debuff.
        strips: { slot: "head", damageTaken: 1.15 },
      })],
      desc: "Comes up under the brow with the flat of the blade. If they are wearing a helmet it goes into the sand and does not come back, and everything after it hurts them more. If they are not, it is just a good hit to the head.",
      notation: "↓↘→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, crouch: 0.44, shoulderF: 8, elbowF: 30, weapon: 4, torso: 20, hipF: 26, kneeF: 50, offX: -3 }, "out"),
        kf(12, { ...STANCE, shoulderF: 124, elbowF: -12, weapon: -34, shoulderB: 88, elbowB: 22, torso: -8, hipF: 34, kneeF: 12, offX: 7, offY: 3 }, "out"),
        kf(18, { ...STANCE, shoulderF: 148, elbowF: -16, weapon: -44, torso: -16, offX: 6 }, "inOut"),
        kf(27, { ...STANCE, shoulderF: 70, elbowF: 28, weapon: 10, torso: 8, offX: 3 }, "inOut"),
        kf(38, { ...STANCE }),
      ],
    },
    {
      id: "knockHelmEx",
      name: "Knock the Helm EX",
      input: { button: "S", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special", "ex"],
      priority: 32,
      duration: 48,
      meterCost: 50,
      vel: [{ at: 5, x: 3.6 }, { at: 22, x: 0 }],
      friction: 0.92,
      armor: [{ from: 4, to: 12, hits: 1, damageScale: 0.35 }],
      hits: [
        hit(12, 16, bx(20, 58, 82, 46), 58, {
          group: 1,
          fx: "blunt",
          pushX: 3,
          hitstun: 20,
          hitstop: 9,
          strips: { slot: "head", damageTaken: 1.15 },
        }),
        // The backhand on the way down takes the shield arm. Two slots off one
        // move is what the meter is buying.
        hit(24, 29, bx(18, 30, 86, 52), 66, {
          group: 2,
          fx: "slash",
          pushX: 9,
          hitstun: 22,
          hitstop: 11,
          knockdown: "soft",
          shake: 2,
          strips: { slot: "shield", damageTaken: 1.12 },
        }),
      ],
      desc: "EX. Up under the helmet and then back down across the shield arm. Takes both, from anyone carrying both, and shrugs off one hit getting there.",
      notation: "↓↘→ + S (50 meter)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, crouch: 0.44, shoulderF: 8, elbowF: 30, weapon: 4, torso: 20, hipF: 26, kneeF: 50, offX: -3 }, "out"),
        kf(12, { ...STANCE, shoulderF: 128, elbowF: -12, weapon: -36, shoulderB: 90, elbowB: 20, torso: -10, hipF: 34, kneeF: 12, offX: 7, offY: 3 }, "out"),
        kf(19, { ...STANCE, shoulderF: 162, elbowF: -18, weapon: -50, torso: -20, offX: 5 }, "inOut"),
        kf(24, { ...STANCE, shoulderF: 46, elbowF: 12, weapon: 2, shoulderB: 70, elbowB: 30, torso: 30, hipF: 42, kneeF: 22, offX: 10 }, "out"),
        kf(34, { ...STANCE, shoulderF: 44, elbowF: 40, weapon: 26, torso: 16, offX: 4 }, "inOut"),
        kf(48, { ...STANCE }),
      ],
    },
    {
      id: "cutBelow",
      name: "Cut Below the Cuirass",
      input: { button: "B", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special", "low"],
      priority: 22,
      duration: 30,
      vel: [{ at: 4, x: 3.4 }, { at: 14, x: 0 }],
      friction: 0.9,
      hits: [hit(9, 13, bx(26, 2, 118, 24), 58, {
        guard: "low",
        fx: "slash",
        pushX: 5,
        hitstun: 20,
        hitstop: 8,
        shake: 1.3,
        // Double chip standing. Blocking this wrong is not free, and that is
        // the pressure: at his range the low is the button he can throw all
        // day, and standing still costs health.
        chip: 14,
      })],
      desc: "The shin cut with a step behind it. Blocked standing it still opens them up - and at his range there is nothing they can do about him throwing it again.",
      notation: "↓↙← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, crouch: 0.62, shoulderF: 40, elbowF: 68, weapon: 82, torso: -4, hipF: 24, kneeF: 62, offX: -4 }, "out"),
        kf(9, { ...STANCE, crouch: 0.86, squash: 0.95, shoulderF: -6, elbowF: 10, weapon: -38, torso: 30, hipF: 30, kneeF: 92, hipB: -32, kneeB: 98, offX: 12 }, "out"),
        kf(18, { ...STANCE, crouch: 0.6, shoulderF: 14, elbowF: 36, weapon: -6, torso: 20, offX: 6 }, "inOut"),
        kf(30, { ...STANCE }),
      ],
    },
    {
      id: "cutBelowEx",
      name: "Cut Below EX",
      input: { button: "S", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special", "ex", "low"],
      priority: 30,
      duration: 42,
      meterCost: 50,
      vel: [{ at: 4, x: 4.4 }, { at: 26, x: 0 }],
      friction: 0.9,
      hits: [
        hit(9, 12, bx(26, 2, 118, 22), 42, { group: 1, guard: "low", fx: "slash", pushX: 2, hitstun: 17, hitstop: 6, chip: 12 }),
        hit(17, 20, bx(26, 2, 118, 22), 42, { group: 2, guard: "low", fx: "slash", pushX: 2, hitstun: 17, hitstop: 6, chip: 12 }),
        hit(26, 31, bx(24, 0, 124, 24), 62, {
          group: 3,
          guard: "low",
          fx: "slash",
          pushX: 7,
          knockdown: "sweep",
          hitstun: 20,
          hitstop: 11,
          shake: 1.9,
          chip: 14,
        }),
      ],
      desc: "EX. Three of them, back to back, all low, all chipping. The last one takes their feet away.",
      notation: "↓↙← + S (50 meter)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, crouch: 0.62, shoulderF: 40, elbowF: 68, weapon: 82, torso: -4, hipF: 24, kneeF: 62, offX: -4 }, "out"),
        kf(9, { ...STANCE, crouch: 0.86, squash: 0.95, shoulderF: -6, elbowF: 10, weapon: -38, torso: 30, hipF: 30, kneeF: 92, offX: 10 }, "out"),
        kf(13, { ...STANCE, crouch: 0.7, shoulderF: 36, elbowF: 62, weapon: 74, torso: 4, offX: 5 }, "inOut"),
        kf(17, { ...STANCE, crouch: 0.86, squash: 0.95, shoulderF: -6, elbowF: 10, weapon: -38, torso: 30, hipF: 30, kneeF: 92, offX: 12 }, "out"),
        kf(22, { ...STANCE, crouch: 0.7, shoulderF: 40, elbowF: 66, weapon: 80, torso: 2, offX: 6 }, "inOut"),
        kf(26, { ...STANCE, crouch: 0.9, squash: 0.93, shoulderF: -12, elbowF: 6, weapon: -46, torso: 32, hipF: 26, kneeF: 96, hipB: -34, kneeB: 100, offX: 14 }, "out"),
        kf(34, { ...STANCE, crouch: 0.6, shoulderF: 14, elbowF: 36, weapon: -4, torso: 18, offX: 6 }, "inOut"),
        kf(42, { ...STANCE }),
      ],
    },
    {
      id: "shallows",
      name: "The Shallows",
      input: { button: "B", motion: "dd", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 26,
      duration: 40,
      friction: 0.86,
      meterGain: 14,
      // No hitbox at all. The only move on the roster that changes the stage
      // instead of the other fighter, and he is not exempt from it - what he
      // gets out of it is that his game is already played at walking pace,
      // and everyone else's is not.
      zones: [{
        at: 14,
        kind: "surf",
        x: 0,
        w: 320,
        life: 360,
        dashScale: 0.45,
        noBackdash: true,
        color: "#5fb7c9",
      }],
      vfx: [
        { at: 14, kind: "dust", x: 0, y: 10, scale: 2.6, color: "#bfe8f2" },
        { at: 20, kind: "dust", x: 70, y: 8, scale: 2, color: "#bfe8f2" },
        { at: 20, kind: "dust", x: -70, y: 8, scale: 2, color: "#bfe8f2" },
      ],
      desc: "Stamps and brings the tide up over the sand around him for six seconds. Nobody dashes out of it and nobody backsteps at all - him included. He was always going to be the one who minded that least.",
      notation: "↓↓ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(7, { ...STANCE, crouch: 0.7, torso: 24, head: 6, shoulderF: 20, elbowF: 64, weapon: 70, shoulderB: 40, elbowB: 60, hipF: 36, kneeF: 68, hipB: -30, kneeB: 74, offX: -3 }, "in"),
        kf(14, { ...STANCE, crouch: 0.24, squash: 1.04, torso: 8, head: -2, shoulderF: 52, elbowF: 30, weapon: 40, shoulderB: 76, elbowB: 24, hipF: 12, kneeF: 14, hipB: -14, kneeB: 20, offY: 1 }, "out"),
        kf(24, { ...STANCE, crouch: 0.36, torso: 16, shoulderF: 40, elbowF: 44, weapon: 48, hipF: 26, kneeF: 40 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },
    {
      id: "stake",
      name: "Fire-Hardened Stake",
      input: { button: "B", motion: "dp", stance: ["stand", "crouch"] },
      tags: ["special", "projectile", "low"],
      priority: 26,
      duration: 36,
      resourceCost: 1,
      resourceMin: 1,
      showProps: ["bangkawHand"],
      // The stake leaves the hand on the frame it becomes a projectile, not at
      // the end of the animation.
      propsAt: [{ from: 14, to: 36, hide: ["bangkawHand"] }],
      projectiles: [{
        at: 14,
        // Not "bangkaw": a projectile whose kind matches a prop id makes the
        // renderer hide that prop while it flies, and the prop here is already
        // driven by the resource.
        kind: "stake",
        x: 30,
        y: 46,
        vx: 12,
        vy: -0.6,
        gravity: 0.06,
        life: 90,
        box: { x: -26, y: -5, w: 52, h: 10 },
        damage: 62,
        hitstun: 20,
        blockstun: 12,
        // Thrown at the shins, so it has to be blocked low - and so it arms
        // instantly, because a shot aimed along the ground is exactly the case
        // the arming rule exempts. There is only ever one of these in the air,
        // which is the reason that is safe.
        guard: "low",
        armAfter: 0,
        pushX: 6,
        chip: 8,
        fx: "pierce",
        hitstop: 8,
        meterGain: 10,
        scale: 1,
        color: BAMBOO,
        trail: "#e8dcae",
      }],
      desc: "One stake, thrown flat at the shins. It must be blocked low, it is live the moment it leaves his hand - and it is the only one he has. Skill picks it back up.",
      notation: "→↓↘ + B (1 Bangkaw)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderB: 128, elbowB: 44, weaponBack: -18, shoulderF: 40, elbowF: 56, torso: -16, hipB: -34, kneeB: 46, offX: -7 }, "out"),
        kf(10, { ...STANCE, shoulderB: 146, elbowB: 52, weaponBack: -24, torso: -22, offX: -8 }, "in"),
        kf(14, { ...STANCE, shoulderB: 66, elbowB: 4, weaponBack: 6, shoulderF: 30, elbowF: 50, torso: 28, hipF: 42, kneeF: 20, hipB: -30, kneeB: 40, offX: 9 }, "out"),
        kf(22, { ...STANCE, shoulderB: 40, elbowB: 40, torso: 18, offX: 4 }, "inOut"),
        kf(36, { ...STANCE }),
      ],
    },
    {
      id: "fortyNine",
      name: "Forty-Nine",
      input: { button: "C", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 24,
      duration: 44,
      friction: 0.8,
      meterGain: 20,
      // Forty-nine Spaniards came ashore. The number is not a summon - five
      // fighters already have one of those - it is the odds, expressed as the
      // fact that he gets better as it gets worse. Two grants rather than one
      // curve: the first is a fight he is losing, the second is a fight he has
      // nearly lost, and they multiply out to about one and a half times
      // damage on his last quarter of health.
      grants: [
        { belowHealth: 0.45, damageDealt: 1.2 },
        { belowHealth: 0.22, damageDealt: 1.24 },
      ],
      // No hitbox, and a long recovery. This is a thing he stops to do.
      vfx: [
        { at: 8, kind: "aura", x: 0, y: 50, scale: 1.8, color: "#b8402f" },
        { at: 20, kind: "spark", x: 10, y: 66, scale: 1.2, color: "#d8ab4c" },
      ],
      desc: "Plants the kampilan and counts them. Costs nothing and does nothing while he is winning - under half health he hits appreciably harder, and under a quarter harder again, for the rest of the round.",
      notation: "↓↙← + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, crouch: 0.5, torso: 26, head: 8, shoulderF: 22, elbowF: 20, weapon: -40, shoulderB: 46, elbowB: 40, hipF: 34, kneeF: 54, hipB: -36, kneeB: 58, offX: -2 }, "out"),
        kf(20, { ...STANCE, crouch: 0.42, torso: 18, head: 12, shoulderF: 26, elbowF: 16, weapon: -44, shoulderB: 108, elbowB: 16, hipF: 30, kneeF: 46, offX: 2 }, "inOut"),
        kf(32, { ...STANCE, crouch: 0.3, torso: 20, head: 6, shoulderF: 30, elbowF: 24, weapon: -30, shoulderB: 70, elbowB: 36 }, "inOut"),
        kf(44, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- skill
    {
      id: "takeUpStake",
      name: "Take Up the Stake",
      input: { buttons: ["A", "C"], stance: ["stand", "crouch"] },
      tags: ["skill"],
      priority: 18,
      duration: 42,
      friction: 0.78,
      resourceGain: 1,
      meterGain: 10,
      showProps: ["bangkawHand"],
      // He is bent over with both hands down for most of this and there is no
      // hitbox anywhere in it. That is the entire loop the character is built
      // on: the throw is only reasonable because getting it back costs him
      // forty-two frames of standing still where anyone can see him.
      propsAt: [{ from: 0, to: 21, hide: ["bangkawHand"] }],
      vfx: [{ at: 22, kind: "dust", x: 16, y: 4, scale: 1.1 }],
      desc: "SKILL. Bends down and takes the stake back out of the sand. Slow, and completely defenceless - which is the price of having thrown it.",
      notation: "A + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(10, { ...STANCE, crouch: 0.72, torso: 42, head: 14, shoulderF: 24, elbowF: 60, weapon: 76, shoulderB: 6, elbowB: 18, hipF: 40, kneeF: 76, hipB: -28, kneeB: 80, offX: 5 }, "inOut"),
        kf(22, { ...STANCE, crouch: 0.86, squash: 0.96, torso: 56, head: 18, shoulderF: 20, elbowF: 64, weapon: 80, shoulderB: -12, elbowB: 8, hipF: 44, kneeF: 92, hipB: -30, kneeB: 96, offX: 9 }, "out"),
        kf(32, { ...STANCE, crouch: 0.5, torso: 30, head: 8, shoulderB: 44, elbowB: 40, hipF: 34, kneeF: 58, offX: 3 }, "inOut"),
        kf(42, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- super
    {
      id: "super",
      name: "They Went for the Legs",
      input: { button: "S", motion: "dd", stance: ["stand", "crouch"] },
      tags: ["super"],
      // Above The Shallows, which shares the down-down motion on B. Different
      // buttons, so they never actually compete - the priority is here so the
      // ordering is stated rather than inherited from declaration order.
      priority: 60,
      duration: 108,
      meterCost: 100,
      superFreeze: 40,
      invuln: [{ from: 1, to: 12, kind: "strike" }],
      vel: [
        { at: 8, x: 8.5 },
        { at: 34, x: 5 },
        { at: 60, x: 3.5 },
        { at: 80, x: 0 },
      ],
      friction: 0.93,
      hits: [
        // Five low cuts along the sand, exactly the account: the legs, over and
        // over, because the legs were bare. Every one of them has to be blocked
        // crouching, and every one chips.
        hit(14, 17, bx(24, 0, 108, 22), 44, { group: 1, guard: "low", fx: "slash", pushX: 1, hitstun: 18, hitstop: 4, chip: 10 }),
        hit(24, 27, bx(24, 0, 110, 22), 40, { group: 2, guard: "low", fx: "slash", pushX: 1, hitstun: 17, hitstop: 4, chip: 10 }),
        hit(34, 37, bx(24, 0, 112, 22), 40, { group: 3, guard: "low", fx: "slash", pushX: 1, hitstun: 17, hitstop: 4, chip: 10 }),
        hit(44, 47, bx(24, 0, 114, 22), 40, { group: 4, guard: "low", fx: "slash", pushX: 1, hitstun: 17, hitstop: 4, chip: 10 }),
        hit(54, 58, bx(22, 0, 116, 26), 52, {
          group: 5,
          guard: "low",
          fx: "slash",
          pushX: 2,
          hitstun: 20,
          hitstop: 6,
          chip: 12,
        }),
        // And then the kampilan overhead, which takes the body armour with it.
        // The third and last slot, so the whole strip system is spoken for:
        // the special takes the head, EX takes the shield, the super takes the
        // cuirass. Against a man wearing all three there is nothing left.
        hit(72, 78, bx(18, 12, 96, 84), 152, {
          group: 6,
          guard: "overhead",
          fx: "slash",
          pushX: 12,
          knockdown: "hard",
          launch: [5.5, 8],
          hitstun: 26,
          hitstop: 18,
          shake: 3.2,
          strips: { slot: "body", damageTaken: 1.2 },
        }),
      ],
      vfx: [
        { at: 2, kind: "super", x: 0, y: 50, scale: 2.4, color: "#5fb7c9" },
        { at: 14, kind: "dust", x: 40, y: 4, scale: 1.4 },
        { at: 34, kind: "dust", x: 46, y: 4, scale: 1.4 },
        { at: 54, kind: "dust", x: 52, y: 4, scale: 1.4 },
        { at: 72, kind: "explode", x: 50, y: 40, scale: 1.4, color: "#e8dcae" },
      ],
      desc: "SUPER. Five cuts along the sand at the one height their armour never covered, and then the whole length of the kampilan brought down through what is left. Takes their body armour off on the way.",
      notation: "↓↓ + S (100 meter)",
      frames: [
        kf(0, { ...STANCE, crouch: 0.55, torso: -8 }, "out"),
        kf(9, { ...STANCE, crouch: 0.8, shoulderF: 42, elbowF: 68, weapon: 84, torso: -6, hipF: 26, kneeF: 74, offX: -4 }, "out"),
        kf(14, { ...STANCE, crouch: 0.88, squash: 0.95, shoulderF: -8, elbowF: 8, weapon: -40, torso: 30, hipF: 30, kneeF: 92, hipB: -32, kneeB: 96, offX: 10 }, "out"),
        kf(20, { ...STANCE, crouch: 0.78, shoulderF: 38, elbowF: 62, weapon: 78, torso: 6, offX: 4 }, "inOut"),
        kf(24, { ...STANCE, crouch: 0.88, squash: 0.95, shoulderF: -8, elbowF: 8, weapon: -40, torso: 30, hipF: 30, kneeF: 92, offX: 11 }, "out"),
        kf(30, { ...STANCE, crouch: 0.78, shoulderF: 40, elbowF: 64, weapon: 80, torso: 4, offX: 5 }, "inOut"),
        kf(34, { ...STANCE, crouch: 0.88, squash: 0.95, shoulderF: -8, elbowF: 8, weapon: -40, torso: 30, hipF: 30, kneeF: 92, offX: 11 }, "out"),
        kf(40, { ...STANCE, crouch: 0.78, shoulderF: 38, elbowF: 62, weapon: 78, torso: 6, offX: 4 }, "inOut"),
        kf(44, { ...STANCE, crouch: 0.88, squash: 0.95, shoulderF: -8, elbowF: 8, weapon: -40, torso: 30, hipF: 30, kneeF: 92, offX: 11 }, "out"),
        kf(50, { ...STANCE, crouch: 0.78, shoulderF: 42, elbowF: 66, weapon: 82, torso: 4, offX: 5 }, "inOut"),
        kf(54, { ...STANCE, crouch: 0.92, squash: 0.93, shoulderF: -14, elbowF: 4, weapon: -48, torso: 32, hipF: 26, kneeF: 98, hipB: -34, kneeB: 102, offX: 14 }, "out"),
        // Up onto both feet, the blade going all the way over.
        kf(64, { ...STANCE, crouch: 0.1, shoulderF: 156, elbowF: -16, weapon: -54, shoulderB: 140, elbowB: 8, torso: -26, hipB: -36, kneeB: 48, offX: -4, offY: 3 }, "inOut"),
        kf(68, { ...STANCE, shoulderF: 176, elbowF: -20, weapon: -62, shoulderB: 158, elbowB: 4, torso: -30, offX: -5 }, "in"),
        kf(72, { ...STANCE, shoulderF: 156, elbowF: -14, weapon: -30, shoulderB: 140, elbowB: 0, torso: 0, hipF: 32, kneeF: 14, offX: 6 }, "linear"),
        // All the way through to the ground, over the whole active window.
        kf(78, { ...STANCE, crouch: 0.36, shoulderF: 34, elbowF: 10, weapon: -26, shoulderB: 36, elbowB: 24, torso: 38, hipF: 46, kneeF: 30, hipB: -32, kneeB: 44, offX: 12 }, "out"),
        kf(90, { ...STANCE, crouch: 0.3, shoulderF: 40, elbowF: 34, weapon: 30, torso: 22, offX: 5 }, "inOut"),
        kf(108, { ...STANCE }),
      ],
    },
  ],
};

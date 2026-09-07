/**
 * Boudica (d. AD 60 or 61) - queen of the Iceni, and the revolt that came
 * closer than anything else to ending Roman Britain.
 *
 * Two people wrote her down. Tacitus is the sober one: Prasutagus left his
 * kingdom jointly to Nero and his own daughters, hoping that would protect
 * them, and Rome annexed the lot anyway - flogged her, raped the daughters,
 * and treated the Iceni nobility as slaves. Cassius Dio is the one who
 * describes her, and every physical detail here is his: very tall, terrifying
 * to look at, a harsh voice, a great mass of tawny hair down to her hips, a
 * large golden torc, a many-coloured tunic and a thick cloak with a brooch.
 * She carried a spear. Before the battle she let a hare go from the fold of
 * her dress as an augury and called on Andraste.
 *
 * The other Celt on this roster is a Gaul from a hundred years earlier who
 * fought a siege. She is from a different island, a different people and a
 * different kind of war: she burned three cities and she fought from a
 * chariot, which nothing else here does.
 */

import type { FighterDef } from "../types";
import { bx, guardClips, hit, kf, universalMoves } from "./builders";

const SKIN = "#e8cfa8";
const HAIR = "#c9702f";
const HAIR_DARK = "#9c4a18";
const GOLD = "#d9b04a";
const GOLD_DARK = "#a37d2c";
const WOOL = "#7a2f38";
const CHECK_A = "#2f6b5c";
const CHECK_B = "#c08a3a";
const IRON = "#aab4bf";
const WOOD = "#6b4a2c";
const BOARD = "#c9b28d";
const FIRE = "#ff9440";

/**
 * Upright and open, spear carried level in one hand.
 *
 * Dio has her standing in the chariot to speak to the army, which is not a
 * crouch - she is a queen addressing a people, and the stance should read as
 * somebody who expects to be looked at.
 */
const STANCE = {
  torso: 4,
  head: -2,
  hipF: 16,
  kneeF: 16,
  hipB: -20,
  kneeB: 28,
  shoulderF: 46,
  elbowF: 40,
  weapon: 30,
  shoulderB: 30,
  elbowB: 62,
};

export const ICENI: FighterDef = {
  id: "iceni",
  name: "Boudica",
  title: "Queen of the Iceni",
  era: "Watling Street, AD 61",
  bio: "Widow of Prasutagus, who left his kingdom half to his daughters and half to Nero in the hope it would spare them. Rome took all of it, had her flogged and her daughters raped, and then found out what that had bought. She burned Camulodunum, Londinium and Verulamium, and the burnt layer is still there under all three.",
  archetype: "Zoner / Momentum",
  difficulty: 3,
  strengths: ["Long spear and a chariot", "Fights better the angrier she gets", "Leaves the ground burning"],
  weaknesses: ["Slow to start", "Andraste runs out", "Nothing quick up close"],
  winQuote: "You made a desert of my house. I have made one of three of your cities.",
  // Andraste by name, the Iceni, and a revolt against an annexation.
  factions: ["celtic", "peoples", "resistance"],
  palette: {
    body: SKIN,
    outline: "#17110b",
    accent: GOLD,
    cloth: WOOL,
    metal: IRON,
    aura: FIRE,
  },
  stats: {
    health: 1020,
    walkF: 3.0,
    walkB: 2.35,
    dashSpeed: 8.6,
    dashFrames: 15,
    backdashFrames: 20,
    jumpVel: 12.2,
    jumpFwd: 4.8,
    gravity: 0.63,
    weight: 1.06,
    airMoves: 1,
    doubleJump: false,
    airDash: false,
    width: 21,
    // Dio: "very tall". The tallest on the roster, and the reach follows it.
    standHeight: 112,
    crouchHeight: 68,
    scale: 1.05,
  },
  stance: STANCE,
  clips: guardClips({
    high: { torso: 4, head: -6, shoulderB: 4, elbowB: 104, shoulderF: 34, elbowF: 66, weapon: 62, hipF: 16, kneeF: 24, hipB: -20, kneeB: 32, offX: -3 },
    low: { torso: 12, head: -4, shoulderB: -18, elbowB: 110, shoulderF: 30, elbowF: 70, weapon: 70, hipF: 34, kneeF: 76, hipB: -22, kneeB: 84, offX: -3 },
  }),
  resource: {
    name: "Andraste",
    max: 3,
    start: 2,
    // The victory goddess she called on before the battle. It is not rage that
    // builds by being hit - it builds by doing the thing she is remembered
    // for, which is going forward and burning what is in front of her.
    gainOnHit: 0.16,
    regen: 0.0035,
    regenIdleOnly: true,
    color: FIRE,
    pips: true,
  },
  props: [
    {
      id: "hair",
      attach: "head",
      // Dio: "a great mass of the tawniest hair fell to her hips". It is the
      // first thing he says about her after her height, so it is the first
      // thing you should see.
      parts: [
        { geo: "poly", size: [-13, 4, -11, 11, 0, 14, 11, 11, 13, 3, 10, -5, -10, -5], pos: [0, 3], color: HAIR },
        { geo: "poly", size: [-12, 2, -4, 5, 4, 4, 11, 1, 9, -4, -10, -4], pos: [0, 7], color: HAIR_DARK, z: 0.1 },
        // The mass of it down the back, in three heavy falls.
        { geo: "poly", size: [-7, 8, 5, 6, 9, -34, 4, -62, -4, -66, -9, -30], pos: [-11, -6], color: HAIR, behind: true },
        { geo: "poly", size: [-5, 6, 4, 5, 7, -30, 2, -56, -4, -58, -7, -26], pos: [-16, -4], color: HAIR_DARK, behind: true },
        { geo: "poly", size: [-4, 5, 3, 4, 5, -24, 1, -44, -4, -46, -6, -22], pos: [-6, -8], color: HAIR, behind: true },
      ],
    },
    {
      id: "torc",
      attach: "neck",
      // "A great golden torc" - Dio again, and the one piece of her costume
      // that is both an ornament and a statement of rank.
      parts: [
        { geo: "ring", size: [10, 3.6], pos: [0, -1], color: GOLD },
        { geo: "disc", size: [3, 3], pos: [-7, -5], color: GOLD_DARK },
        { geo: "disc", size: [3, 3], pos: [7, -5], color: GOLD_DARK },
        { geo: "disc", size: [1.4], pos: [-7, -5], color: "#f0dca0", z: 0.4 },
        { geo: "disc", size: [1.4], pos: [7, -5], color: "#f0dca0", z: 0.4 },
      ],
    },
    {
      id: "tunic",
      attach: "torso",
      // "A tunic of many colours" - so a check, which is what the surviving
      // British textile fragments actually are.
      parts: [
        { geo: "poly", size: [-11, -16, 11, -16, 12, 12, 7, 18, -7, 18, -12, 12], pos: [0, 2], color: CHECK_A },
        { geo: "box", size: [24, 3], pos: [0, 10], color: CHECK_B, z: 0.2 },
        { geo: "box", size: [24, 3], pos: [0, -2], color: CHECK_B, z: 0.2 },
        { geo: "box", size: [24, 3], pos: [0, -12], color: CHECK_B, z: 0.2 },
        { geo: "box", size: [3, 34], pos: [-6, 0], color: CHECK_B, z: 0.15 },
        { geo: "box", size: [3, 34], pos: [4, 0], color: CHECK_B, z: 0.15 },
      ],
    },
    {
      id: "cloak",
      attach: "neck",
      // "A thick cloak fastened with a brooch." The cloth simulates, so it
      // moves when she does.
      parts: [
        { geo: "disc", size: [4], pos: [8, -2], color: GOLD },
        { geo: "ring", size: [4, 1.4], pos: [8, -2], color: GOLD_DARK, z: 0.3 },
      ],
      cloth: {
        segments: 7,
        segmentLength: 12,
        width: 30,
        endWidth: 38,
        color: WOOL,
        lining: "#5a1f26",
        gravity: 0.5,
        stiffness: 0.62,
        drift: 0.3,
      },
    },
    {
      id: "spear",
      attach: "handF",
      // Dio says she carried a spear. Long, iron-headed, on an ash shaft.
      parts: [
        { geo: "cyl", size: [3, 138], pos: [42, 0], rot: 90, color: "#7a5a34" },
        { geo: "box", size: [10, 5], pos: [-16, 0], color: "#4a3220" },
        { geo: "box", size: [8, 6], pos: [104, 0], color: IRON },
        { geo: "poly", size: [0, 7, 16, 6, 34, 0, 16, -6, 0, -7], pos: [110, 0], color: "#c7d0da" },
        { geo: "poly", size: [0, 2.6, 14, 2, 28, 0, 14, -2, 0, -2.6], pos: [111, 0], color: "#eef3f7", z: 0.3 },
      ],
    },
    {
      id: "shield",
      attach: "forearmB",
      // A long British shield: oval, hide-faced over board, with an iron boss
      // and a spine.
      parts: [
        { geo: "poly", size: [-13, 34, -9, 42, 0, 45, 9, 42, 13, 34, 13, -34, 9, -42, 0, -45, -9, -42, -13, -34], pos: [10, 0], color: BOARD, z: 0.5 },
        { geo: "box", size: [5, 84], pos: [10, 0], color: WOOL, z: 0.55 },
        { geo: "poly", size: [-9, 0, 0, 16, 9, 0, 0, -16], pos: [10, 24], color: WOOL, z: 0.55 },
        { geo: "poly", size: [-9, 0, 0, 16, 9, 0, 0, -16], pos: [10, -24], color: WOOL, z: 0.55 },
        { geo: "disc", size: [8], pos: [10, 0], color: IRON, z: 0.6 },
        { geo: "ring", size: [8, 2], pos: [10, 0], color: "#7c8892", z: 0.65 },
      ],
    },
    {
      id: "torch",
      attach: "handB",
      // For the burning. Conditional - she is only holding it when she is
      // setting something alight.
      conditional: true,
      parts: [
        { geo: "cyl", size: [3.4, 46], pos: [16, 0], rot: 90, color: WOOD },
        { geo: "box", size: [13, 8], pos: [40, 0], color: "#3a2a1c" },
        // Three overlapping teardrops rather than one shape - a single polygon
        // at this size draws a pentagon, which reads as a heraldic device and
        // not as anything burning.
        { geo: "poly", size: [0, 9, 8, 7, 18, 2, 26, 0, 18, -3, 8, -7, 0, -9], pos: [50, 0], color: "#c2401a" },
        { geo: "poly", size: [0, 6, 6, 5, 14, 1, 20, 0, 13, -2, 6, -5, 0, -6], pos: [51, 1], color: FIRE, z: 0.2 },
        { geo: "poly", size: [0, 3.4, 4, 3, 9, 0.6, 13, 0, 8, -1, 4, -3, 0, -3.4], pos: [52, 1], color: "#ffe3a0", z: 0.35 },
      ],
    },
    {
      id: "hare",
      thrown: true,
      attach: "handB",
      // Dio: before the battle she let a hare go from the fold of her dress,
      // and the army roared when it ran the way they wanted. It is the
      // strangest thing anybody records about her and it is going in.
      conditional: true,
      parts: [
        { geo: "poly", size: [-11, 5, -2, 8, 8, 6, 12, 0, 6, -6, -8, -6], pos: [0, 0], color: "#a88a5e" },
        { geo: "poly", size: [0, 0, -3, 12, -1, 17, 2, 12], pos: [7, 5], color: "#a88a5e" },
        { geo: "poly", size: [0, 0, 1, 12, 4, 16, 5, 11], pos: [10, 5], color: "#94764c" },
        { geo: "disc", size: [1.2], pos: [10, 2], color: "#2a2018", z: 0.4 },
        { geo: "poly", size: [0, 3, -8, 5, -10, 0, -8, -3], pos: [-11, 1], color: "#c4ab84" },
      ],
    },
    {
      id: "chariot",
      attach: "ground",
      // The essedum. Caesar describes the British fighting from these in
      // detail: they drive along the line throwing, the noise and the wheels
      // break the ranks up, then the warrior drops off the pole and fights on
      // foot while the driver waits with the car. Two ponies, a wicker body,
      // an open front.
      //
      // Everything is measured off the floor of the car at y 20, because the
      // super lifts her by exactly that much while she is riding it - built
      // any other way she stands beside her own chariot rather than in it.
      conditional: true,
      parts: [
        // The off-side pony, darker and set back, so the pair read as two
        // animals abreast rather than as one wide one.
        { geo: "box", size: [5, 30], pos: [92, 15], rot: 6, color: "#40301f" },
        { geo: "box", size: [5, 30], pos: [128, 15], rot: -5, color: "#40301f" },
        { geo: "poly", size: [-34, 10, -20, 15, 14, 15, 30, 9, 32, -3, 12, -9, -24, -8, -34, 1], pos: [108, 42], color: "#59431f" },
        { geo: "poly", size: [0, 9, 13, 18, 21, 15, 14, 1, 5, -7], pos: [134, 46], color: "#59431f" },
        { geo: "poly", size: [0, 5, 9, 7, 16, 2, 12, -6, 2, -6], pos: [152, 62], color: "#59431f" },
        // The near pony, in the lighter coat. Legs hang from the belly to the
        // ground rather than being pinned through the middle of the body,
        // which is what turned the first pair into one dark lump.
        { geo: "box", size: [6, 30], pos: [78, 15], rot: 7, color: "#54402a" },
        { geo: "box", size: [6, 30], pos: [116, 15], rot: -8, color: "#54402a" },
        { geo: "poly", size: [-36, 11, -22, 17, 12, 17, 28, 10, 31, -4, 10, -10, -26, -9, -36, 2], pos: [98, 36], color: "#8a6a42" },
        { geo: "poly", size: [-30, 4, -10, 1, 10, 0, 26, 3, 22, -4, -26, -5], pos: [98, 28], color: "#6b5334", z: 0.1 },
        { geo: "box", size: [6, 30], pos: [86, 15], rot: -3, color: "#6b5334", z: 0.15 },
        { geo: "box", size: [6, 30], pos: [110, 15], rot: 4, color: "#6b5334", z: 0.15 },
        // Neck, head, muzzle and mane.
        { geo: "poly", size: [0, 11, 15, 21, 23, 18, 13, 1, 4, -8], pos: [124, 40], color: "#8a6a42" },
        { geo: "poly", size: [0, 6, 10, 8, 17, 2, 13, -7, 2, -7], pos: [142, 58], color: "#8a6a42" },
        { geo: "poly", size: [-2, 0, 1, 8, 5, 1], pos: [143, 64], color: "#8a6a42" },
        { geo: "poly", size: [0, 0, -5, 15, 2, 17, 7, 3], pos: [127, 44], color: "#4a3620", z: 0.2 },
        { geo: "disc", size: [1.5], pos: [150, 58], color: "#241d14", z: 0.4 },
        // Tail.
        { geo: "poly", size: [0, 6, -8, -4, -12, -18, -5, -16, 2, -2], pos: [64, 42], color: "#4a3620" },
        // Yoke across their withers, and the pole running back to the car.
        { geo: "box", size: [4, 15], pos: [104, 48], color: WOOD },
        { geo: "box", size: [86, 4], pos: [52, 28], color: WOOD },
        // The car: wicker sides, open at the front, floor at the height she is
        // standing on.
        { geo: "poly", size: [-26, 0, -22, 22, 20, 22, 26, 0], pos: [-8, 20], color: "#a8834c" },
        { geo: "box", size: [50, 3], pos: [-8, 20], color: "#7a5a34", z: 0.25 },
        { geo: "box", size: [48, 2.6], pos: [-8, 30], color: "#7a5a34", z: 0.2 },
        { geo: "box", size: [46, 2.6], pos: [-8, 38], color: "#7a5a34", z: 0.2 },
        { geo: "box", size: [2.6, 24], pos: [-20, 31], color: "#7a5a34", z: 0.2 },
        { geo: "box", size: [2.6, 24], pos: [4, 31], color: "#7a5a34", z: 0.2 },
        // One wheel, because side-on there is only ever one to see.
        { geo: "disc", size: [19], pos: [-8, 19], color: "#4a3220", z: -0.2 },
        { geo: "ring", size: [19, 3.4], pos: [-8, 19], color: "#7a5a34", z: 0.3 },
        { geo: "box", size: [2.6, 36], pos: [-8, 19], rot: 15, color: "#7a5a34", z: 0.3 },
        { geo: "box", size: [2.6, 36], pos: [-8, 19], rot: 75, color: "#7a5a34", z: 0.3 },
        { geo: "box", size: [2.6, 36], pos: [-8, 19], rot: 135, color: "#7a5a34", z: 0.3 },
        { geo: "disc", size: [4], pos: [-8, 19], color: IRON, z: 0.4 },
      ],
    },
  ],

  moves: [
    ...universalMoves({
      throwDamage: 126,
      backThrowDamage: 134,
      throwRange: 62,
      rollSpeed: 7.4,
      weaponIdle: { weapon: STANCE.weapon },
    }),

    // --------------------------------------------------------------- normals
    //
    // Everything standing is the spear, and the spear is the longest thing on
    // the roster. The trade is written into the numbers rather than into the
    // description: her light is slower than anybody else's light, and there is
    // no button here that is good at arm's length. She is a wall of point that
    // falls apart the moment somebody gets inside it.
    {
      id: "5A",
      name: "Spear Hand",
      input: { button: "A", stance: "stand" },
      tags: ["light"],
      duration: 14,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [4, 13],
      hits: [hit(5, 7, bx(28, 62, 62, 18), 28, { blockstun: 9, hitstun: 13, fx: "pierce", pushX: 3 })],
      desc: "A short push of the point at head height. Her quickest button, and by the standards of everyone else's quickest button it is not quick.",
      notation: "A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, shoulderF: 36, elbowF: 62, weapon: -6, torso: -6, offX: -8 }, "out"),
        kf(5, { ...STANCE, shoulderF: 56, elbowF: 12, weapon: 18, torso: 12, offX: 10 }, "linear"),
        kf(7, { ...STANCE, shoulderF: 58, elbowF: 8, weapon: 20, torso: 14, hipF: 24, offX: 16 }, "out"),
        kf(9, { ...STANCE, shoulderF: 50, elbowF: 32, weapon: 24, torso: 6 }, "inOut"),
        kf(14, { ...STANCE }),
      ],
    },
    {
      id: "5B",
      name: "Level Spear",
      input: { button: "B", stance: "stand" },
      tags: ["medium"],
      duration: 21,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [7, 19],
      hits: [hit(8, 11, bx(30, 50, 92, 22), 50, { fx: "pierce", pushX: 5, hitstun: 18, hitstop: 7 })],
      desc: "The shaft run out through the front hand at chest height. This is the range she wants the whole fight held at.",
      notation: "B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderF: 30, elbowF: 76, weapon: -11, shoulderB: 46, elbowB: 40, torso: -14, offX: -5 }, "out"),
        kf(8, { ...STANCE, shoulderF: 62, elbowF: 4, weapon: 18, shoulderB: 76, elbowB: 12, torso: 16, hipF: 32, offX: 8 }, "linear"),
        kf(14, { ...STANCE, shoulderF: 54, elbowF: 26, weapon: 12, torso: 10, offX: 4 }, "inOut"),
        kf(21, { ...STANCE }),
      ],
    },
    {
      id: "5C",
      name: "Full Reach",
      input: { button: "C", stance: "stand" },
      tags: ["heavy"],
      duration: 32,
      cancelInto: ["special", "super"],
      cancelWindow: [12, 28],
      // The longest button in the game, and it is hers because she is the
      // tallest fighter holding the longest weapon. Thirty-two frames is what
      // that costs.
      hits: [hit(13, 18, bx(32, 44, 116, 26), 76, { fx: "pierce", pushX: 8, hitstun: 22, hitstop: 10, shake: 1.5 })],
      desc: "Steps into it and puts the whole length of the shaft out. Nothing else on the roster reaches this far, and nothing else takes this long to arrive.",
      notation: "C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: 22, elbowF: 88, weapon: 70, shoulderB: 52, elbowB: 34, torso: -20, hipB: -30, kneeB: 42, offX: -8 }, "out"),
        kf(13, { ...STANCE, shoulderF: 66, elbowF: -6, weapon: -6, shoulderB: 84, elbowB: 6, torso: 22, hipF: 40, kneeF: 16, hipB: -34, kneeB: 30, offX: 12 }, "linear"),
        kf(18, { ...STANCE, shoulderF: 64, elbowF: 2, weapon: 0, torso: 24, hipF: 42, offX: 14 }, "out"),
        kf(24, { ...STANCE, shoulderF: 54, elbowF: 28, weapon: 20, torso: 12, offX: 5 }, "inOut"),
        kf(32, { ...STANCE }),
      ],
    },
    {
      id: "2A",
      name: "Ferrule Jab",
      input: { button: "A", stance: "crouch" },
      tags: ["light", "low"],
      duration: 14,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [4, 13],
      hits: [hit(5, 7, bx(26, 8, 58, 18), 26, { guard: "low", blockstun: 9, hitstun: 13, fx: "pierce", pushX: 2 })],
      desc: "The iron shoe on the butt of the shaft flicked along the ground. It starts every low string she has.",
      notation: "↓ + A",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(3, { ...STANCE, crouch: 1, shoulderF: 26, elbowF: 58, weapon: -8, torso: -4, offX: -3 }, "out"),
        kf(5, { ...STANCE, crouch: 1, shoulderF: 6, elbowF: 16, weapon: 47, torso: 18, offX: 5 }, "linear"),
        kf(10, { ...STANCE, crouch: 1, shoulderF: 20, elbowF: 40, weapon: 16, torso: 10 }, "inOut"),
        kf(14, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "2B",
      name: "Under the Shield",
      input: { button: "B", stance: "crouch" },
      tags: ["medium", "low"],
      duration: 23,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [8, 21],
      hits: [hit(9, 13, bx(30, 4, 104, 22), 48, { guard: "low", fx: "pierce", pushX: 4, hitstun: 19, hitstop: 7 })],
      desc: "Drops the point below the rim of a shield and pushes it into the shin. Long, and it has to be blocked low.",
      notation: "↓ + B",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(4, { ...STANCE, crouch: 1, shoulderF: 34, elbowF: 72, weapon: -33, torso: -10, offX: -10 }, "out"),
        kf(9, { ...STANCE, crouch: 1, shoulderF: 0, elbowF: 10, weapon: 52, torso: 24, hipF: 34, offX: 12 }, "linear"),
        kf(13, { ...STANCE, crouch: 1, shoulderF: 2, elbowF: 6, weapon: 54, torso: 26, hipF: 38, offX: 22 }, "out"),
        kf(15, { ...STANCE, crouch: 1, shoulderF: 16, elbowF: 38, weapon: 10, torso: 16, offX: 5 }, "inOut"),
        kf(23, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "2C",
      name: "Hough Them",
      input: { button: "C", stance: "crouch" },
      tags: ["heavy", "low"],
      duration: 33,
      cancelInto: ["special", "super"],
      cancelWindow: [13, 29],
      hits: [hit(14, 19, bx(30, 0, 116, 20), 70, {
        guard: "low",
        fx: "slash",
        pushX: 6,
        knockdown: "sweep",
        hitstun: 20,
        hitstop: 9,
        shake: 1.5,
      })],
      desc: "Swings the shaft flat along the ground at ankle height and takes their feet out from under them.",
      notation: "↓ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(6, { ...STANCE, crouch: 1, shoulderF: 46, elbowF: 70, weapon: 78, shoulderB: 20, elbowB: 74, torso: -16, offX: -6 }, "out"),
        kf(14, { ...STANCE, crouch: 1, squash: 0.94, shoulderF: -10, elbowF: 6, weapon: -44, shoulderB: 78, elbowB: 20, torso: 30, hipF: 28, kneeF: 88, hipB: -32, kneeB: 96, offX: 12 }, "out"),
        kf(23, { ...STANCE, crouch: 1, shoulderF: 14, elbowF: 34, weapon: -8, torso: 20, offX: 6 }, "inOut"),
        kf(33, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "6A",
      name: "Shield Rap",
      input: { button: "A", dir: "f", stance: "stand" },
      tags: ["light"],
      duration: 17,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [5, 15],
      vel: [{ at: 3, x: 2.4 }, { at: 10, x: 0 }],
      friction: 0.9,
      hits: [hit(6, 9, bx(18, 54, 50, 30), 34, { fx: "blunt", pushX: 4, hitstun: 15 })],
      desc: "Steps in behind the shield and knocks the rim into them. Her only honest close-range light, and it is the shield, not the spear.",
      notation: "→ + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, shoulderB: -4, elbowB: 92, torso: 12, offX: 1 }, "out"),
        kf(6, { ...STANCE, shoulderB: 52, elbowB: 34, torso: 4, hipF: 28, offX: 5 }, "linear"),
        kf(9, { ...STANCE, shoulderB: 74, elbowB: 16, torso: -4, hipF: 32, offX: 7 }, "out"),
        kf(13, { ...STANCE, shoulderB: 46, elbowB: 46, torso: 6 }, "inOut"),
        kf(17, { ...STANCE }),
      ],
    },
    {
      id: "6B",
      name: "Boss First",
      input: { button: "B", dir: "f", stance: "stand" },
      tags: ["medium"],
      duration: 25,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [9, 23],
      hits: [hit(10, 13, bx(16, 48, 56, 46), 48, { fx: "blunt", pushX: 6, hitstun: 19, hitstop: 8 })],
      desc: "The iron boss driven up under the chin. When somebody is already too close for the spear, this is what is left.",
      notation: "→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderB: -12, elbowB: 96, torso: 18, crouch: 0.32, offX: 2 }, "out"),
        kf(10, { ...STANCE, shoulderB: 84, elbowB: 22, torso: 4, hipF: 32, kneeF: 16, offX: 7 }, "out"),
        kf(17, { ...STANCE, shoulderB: 48, elbowB: 50, torso: 10 }, "inOut"),
        kf(25, { ...STANCE }),
      ],
    },
    {
      id: "6C",
      name: "Break the Line",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["heavy"],
      duration: 35,
      // The string ender, and like every good one it is a shove rather than a
      // finish: what she wants at the end of a sequence is the fight back at
      // spear length, not another forty points of damage.
      hits: [hit(12, 16, bx(18, 26, 72, 58), 60, {
        fx: "blunt",
        pushX: 17,
        selfPushX: -2,
        hitstun: 18,
        hitstop: 9,
        shake: 1.6,
      })],
      desc: "Whole shoulder into the shield and drives them off her. Barely hurts, and it buys back the only distance she is any good at.",
      notation: "→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderB: 4, elbowB: 100, shoulderF: 26, elbowF: 62, weapon: 56, torso: -14, crouch: 0.34, offX: -6 }, "out"),
        kf(12, { ...STANCE, shoulderB: 86, elbowB: 10, shoulderF: 58, elbowF: 26, weapon: 34, torso: 30, hipF: 44, kneeF: 20, hipB: -36, kneeB: 46, offX: 12 }, "out"),
        kf(21, { ...STANCE, shoulderB: 52, elbowB: 44, torso: 16, offX: 5 }, "inOut"),
        kf(35, { ...STANCE }),
      ],
    },
    {
      id: "3C",
      name: "Overhand Cast",
      input: { button: "C", dir: "df", stance: ["stand", "crouch"] },
      tags: ["heavy", "overhead", "launcher"],
      duration: 40,
      // The other half of the guess Under the Shield sets up. Slow, because a
      // fast overhead sitting on top of a long low is not a guess.
      hits: [hit(19, 23, bx(24, 34, 92, 68), 72, {
        guard: "overhead",
        fx: "pierce",
        launch: [2.4, 10.5],
        knockdown: "launch",
        hitstun: 24,
        hitstop: 10,
        shake: 1.7,
      })],
      desc: "Brings the spear up over the shoulder and drives it down from above. Slow enough to read, and it beats a low block and launches.",
      notation: "↘ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 0.4 }, "out"),
        kf(9, { ...STANCE, shoulderF: 156, elbowF: -20, weapon: -40, shoulderB: 132, elbowB: 12, torso: -22, hipB: -34, kneeB: 44, offX: -6, offY: 2 }, "inOut"),
        kf(15, { ...STANCE, shoulderF: 170, elbowF: -24, weapon: -48, torso: -26, offX: -7 }, "in"),
        kf(19, { ...STANCE, shoulderF: 128, elbowF: -12, weapon: -24, shoulderB: 110, elbowB: 4, torso: 8, hipF: 32, kneeF: 14, offX: 6 }, "linear"),
        kf(23, { ...STANCE, shoulderF: 62, elbowF: 4, weapon: -12, shoulderB: 52, elbowB: 24, torso: 34, hipF: 44, kneeF: 26, crouch: 0.32, offX: 11 }, "out"),
        kf(31, { ...STANCE, shoulderF: 48, elbowF: 30, weapon: 22, torso: 20, crouch: 0.22, offX: 4 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },
    {
      id: "4A",
      name: "Give a Step",
      input: { button: "A", dir: "b", stance: "stand" },
      tags: ["light"],
      duration: 17,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [5, 15],
      vel: [{ at: 2, x: -2.4 }, { at: 9, x: 0 }],
      friction: 0.9,
      hits: [hit(6, 9, bx(30, 52, 64, 20), 30, { fx: "pierce", pushX: 4, hitstun: 14 })],
      desc: "Gives ground and puts the point into the space she has just left. How she resets to her own range without giving up the turn.",
      notation: "← + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(2, { ...STANCE, shoulderF: 58, elbowF: 10, weapon: 8, torso: 12, offX: 2 }, "out"),
        kf(6, { ...STANCE, shoulderF: 54, elbowF: 20, weapon: 14, torso: 4, hipB: -30, kneeB: 42, offX: -2 }, "linear"),
        kf(9, { ...STANCE, shoulderF: 34, elbowF: 58, weapon: 48, torso: -8, hipB: -34, kneeB: 46, offX: -5 }, "out"),
        kf(17, { ...STANCE }),
      ],
    },
    {
      id: "4B",
      name: "Set Against Them",
      input: { button: "B", dir: "b", stance: "stand" },
      tags: ["medium"],
      duration: 26,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [10, 24],
      // The butt of the spear planted and the point up. Not a thrust - she
      // holds it there and lets them arrive on it, which is what a spear is
      // actually for and what nothing else in her list does.
      hits: [hit(9, 17, bx(26, 40, 74, 52), 52, {
        fx: "pierce",
        pushX: 7,
        hitstun: 20,
        hitstop: 8,
        shake: 1.2,
      })],
      desc: "Plants the butt of the shaft against her heel and sets the point at them. Eight frames of it, so somebody walking in walks onto it.",
      notation: "← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderF: 34, elbowF: 54, weapon: -47, shoulderB: 24, elbowB: 78, torso: -8, crouch: 0.28, hipB: -32, kneeB: 48, offX: -10 }, "out"),
        kf(9, { ...STANCE, shoulderF: 20, elbowF: 40, weapon: -26, shoulderB: 12, elbowB: 66, torso: 6, crouch: 0.44, hipF: 30, kneeF: 26, hipB: -38, kneeB: 58, offX: -6 }, "inOut"),
        kf(17, { ...STANCE, shoulderF: 22, elbowF: 42, weapon: -28, torso: 8, crouch: 0.44, offX: 14 }, "inOut"),
        kf(26, { ...STANCE }),
      ],
    },
    {
      id: "4C",
      name: "Turn the Wheel",
      input: { button: "C", dir: "b", stance: "stand" },
      tags: ["heavy"],
      duration: 34,
      cancelInto: ["special", "super"],
      cancelWindow: [14, 30],
      // Both ends of the shaft, one turn: the point away and the ferrule back
      // through where she was. It covers the retreat, which is the only reason
      // a heavy this slow is on the back direction.
      hits: [
        hit(13, 16, bx(26, 46, 96, 26), 44, { group: 1, fx: "pierce", pushX: 4, hitstun: 17, hitstop: 6 }),
        hit(20, 24, bx(20, 34, 84, 40), 58, { group: 2, fx: "blunt", pushX: 9, knockdown: "soft", hitstun: 21, hitstop: 10, shake: 1.6 }),
      ],
      desc: "Turns the spear end over end on the retreat - the point out, then the iron shoe back across. Two hits, and it covers the ground she is giving up.",
      notation: "← + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: 30, elbowF: 74, weapon: -9, torso: -14, hipB: -30, kneeB: 40, offX: -9 }, "out"),
        kf(13, { ...STANCE, shoulderF: 64, elbowF: 0, weapon: 20, shoulderB: 80, elbowB: 14, torso: 18, hipF: 34, offX: 4 }, "linear"),
        kf(16, { ...STANCE, shoulderF: 66, elbowF: -4, weapon: 22, shoulderB: 84, elbowB: 12, torso: 20, hipF: 36, offX: 18 }, "out"),
        kf(17, { ...STANCE, shoulderF: 96, elbowF: -28, weapon: 24, shoulderB: 116, elbowB: -6, torso: -6, offX: -2 }, "out"),
        kf(20, { ...STANCE, shoulderF: 148, elbowF: -46, weapon: -128, shoulderB: 150, elbowB: -18, torso: -20, hipB: -34, kneeB: 48, offX: -6 }, "linear"),
        kf(26, { ...STANCE, shoulderF: 60, elbowF: 24, weapon: 18, torso: 4, offX: -3 }, "inOut"),
        kf(34, { ...STANCE }),
      ],
    },
    {
      id: "jA",
      name: "Air Point",
      input: { button: "A", stance: "air" },
      tags: ["light", "air"],
      duration: 17,
      hits: [hit(5, 10, bx(26, 22, 62, 26), 32, { fx: "pierce", pushX: 3, hitstun: 14 })],
      desc: "Puts the point out to the side on the way past.",
      notation: "(air) A",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 34, kneeF: 46, hipB: -24, kneeB: 40 }, "out"),
        kf(5, { ...STANCE, free: 1, shoulderF: 58, elbowF: 10, weapon: 6, torso: 12, hipF: 38, kneeF: 50, hipB: -26, kneeB: 44 }),
        kf(17, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "jB",
      name: "Air Shaft",
      input: { button: "B", stance: "air" },
      tags: ["medium", "air"],
      duration: 23,
      hits: [hit(7, 13, bx(28, 12, 88, 32), 52, { fx: "pierce", pushX: 5, hitstun: 18, hitstop: 7 })],
      desc: "Swings the whole length of it out flat while she is off the ground. It covers most of the screen in front of her.",
      notation: "(air) B",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 40 }, "out"),
        kf(3, { ...STANCE, free: 1, shoulderF: 14, elbowF: 84, weapon: -2, torso: -16, hipF: 40, kneeF: 52 }, "out"),
        kf(8, { ...STANCE, free: 1, shoulderF: 66, elbowF: 0, weapon: 18, torso: 16, hipF: 34, kneeF: 48, hipB: -26, kneeB: 42 }, "out"),
        kf(23, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "jC",
      name: "Falling Spear",
      input: { button: "C", stance: "air" },
      tags: ["heavy", "air"],
      duration: 29,
      hits: [hit(9, 17, bx(20, -10, 76, 62), 74, {
        fx: "pierce",
        pushX: 6,
        knockdown: "soft",
        hitstun: 20,
        hitstop: 9,
        shake: 1.4,
      })],
      desc: "Turns the point down and drives it through them on the way to the ground.",
      notation: "(air) C",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 40 }, "out"),
        kf(4, { ...STANCE, free: 1, shoulderF: 158, elbowF: -22, weapon: -90, torso: -18, hipF: 44, kneeF: 56 }, "out"),
        kf(10, { ...STANCE, free: 1, shoulderF: 40, elbowF: 4, weapon: -14, torso: 28, hipF: 30, kneeF: 44, hipB: -20, kneeB: 36 }, "out"),
        kf(29, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "dashAttack",
      name: "Running Spear",
      input: { button: "C", dir: "f", stance: "stand", whileDashing: true },
      tags: ["heavy"],
      duration: 33,
      vel: [{ at: 1, x: 7.8 }, { at: 15, x: 0 }],
      friction: 0.9,
      hits: [hit(8, 13, bx(30, 36, 104, 40), 68, {
        fx: "pierce",
        pushX: 8,
        knockdown: "soft",
        hitstun: 20,
        hitstop: 9,
        shake: 1.5,
      })],
      desc: "Carries the run onto the point and lets it drag her through them.",
      notation: "→→ then C",
      frames: [
        kf(0, { ...STANCE, torso: 22, offX: 2 }, "out"),
        kf(4, { ...STANCE, shoulderF: 24, elbowF: 82, weapon: -17, torso: 4, offX: -3 }, "out"),
        kf(8, { ...STANCE, shoulderF: 64, elbowF: -4, weapon: 20, torso: 28, hipF: 42, kneeF: 18, offX: 11 }, "out"),
        kf(19, { ...STANCE, shoulderF: 52, elbowF: 30, weapon: 20, torso: 16, offX: 4 }, "inOut"),
        kf(33, { ...STANCE }),
      ],
    },

    // --------------------------------------------------------- five specials
    //
    // The other Celt on the roster throws a gaesum, so she does not. What she
    // has instead is the three things only she is recorded doing: she set fire
    // to cities, she let a hare go, and she called on a goddess by name.
    {
      id: "firebrand",
      name: "Camulodunum",
      input: { button: "C", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 26,
      duration: 44,
      resourceCost: 1,
      resourceMin: 1,
      friction: 0.86,
      meterGain: 12,
      showProps: ["torch"],
      propsAt: [{ from: 0, to: 44, show: ["torch"], hide: ["shield"] }],
      // No hitbox anywhere in it. She sets a stretch of ground alight in front
      // of her and then stands behind it with the longest spear in the game,
      // which is the entire character stated in one move: she does not have to
      // reach you, she has to make where you are standing worse than where she
      // wants you.
      //
      // Owner-immune, because she is the one who lit it. That is not a
      // courtesy - it is what makes the move a wall rather than a mutual
      // hazard, and a wall is the thing a zoner is missing without it.
      zones: [{
        at: 22,
        kind: "fire",
        x: 104,
        w: 136,
        life: 360,
        damage: 7,
        every: 30,
        ownerImmune: true,
        dashScale: 0.8,
        color: "#ff7a2a",
      }],
      vfx: [
        { at: 22, kind: "explode", x: 104, y: 10, scale: 1.3, color: FIRE },
        { at: 26, kind: "smoke", x: 104, y: 30, scale: 1.8, color: "#6a5a52" },
        { at: 32, kind: "smoke", x: 130, y: 24, scale: 1.4, color: "#6a5a52" },
      ],
      desc: "Puts a brand into the ground in front of her and leaves it burning for six seconds. It does not hurt her, it hurts them, and it does not need to hurt them much - it only has to make standing there worse than walking onto her spear.",
      notation: "↓↘→ + C (1 Andraste)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, shoulderB: 128, elbowB: 30, torso: -18, head: -8, hipB: -32, kneeB: 44, offX: -5 }, "out"),
        kf(16, { ...STANCE, shoulderB: 142, elbowB: 20, torso: -22, offX: -6 }, "in"),
        kf(22, { ...STANCE, crouch: 0.62, squash: 0.95, shoulderB: 22, elbowB: 14, torso: 34, head: 10, hipF: 36, kneeF: 70, hipB: -34, kneeB: 78, offX: 10 }, "out"),
        kf(32, { ...STANCE, crouch: 0.34, shoulderB: 44, elbowB: 44, torso: 20, offX: 4 }, "inOut"),
        kf(44, { ...STANCE }),
      ],
    },
    {
      id: "firebrandEx",
      name: "Camulodunum EX",
      input: { button: "S", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special", "ex"],
      priority: 34,
      duration: 48,
      meterCost: 50,
      friction: 0.86,
      showProps: ["torch"],
      propsAt: [{ from: 0, to: 48, show: ["torch"], hide: ["shield"] }],
      // Meter instead of Andraste, so it is the version she can throw when the
      // pips are spent - and it burns from her toes outward rather than at
      // spear length, which is the answer to somebody who has already got past
      // the wall she wanted to build.
      zones: [{
        at: 24,
        kind: "fire",
        x: 40,
        w: 250,
        life: 480,
        damage: 9,
        every: 26,
        ownerImmune: true,
        dashScale: 0.7,
        color: "#ff7a2a",
      }],
      hits: [hit(24, 28, bx(10, 0, 120, 48), 44, {
        fx: "blunt",
        pushX: 8,
        hitstun: 18,
        hitstop: 8,
        shake: 1.8,
        chip: 8,
      })],
      vfx: [
        { at: 24, kind: "explode", x: 60, y: 14, scale: 2, color: FIRE },
        { at: 26, kind: "smoke", x: 40, y: 34, scale: 2.2, color: "#6a5a52" },
        { at: 34, kind: "smoke", x: 120, y: 28, scale: 1.8, color: "#6a5a52" },
      ],
      desc: "EX. Drags the brand along the ground from her own feet outward. It catches once as it goes up, burns wider, burns longer, and costs meter instead of Andraste.",
      notation: "↓↘→ + S (50 meter)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(9, { ...STANCE, shoulderB: 132, elbowB: 28, torso: -20, head: -8, hipB: -32, kneeB: 44, offX: -5 }, "out"),
        kf(18, { ...STANCE, shoulderB: 148, elbowB: 16, torso: -24, offX: -7 }, "in"),
        kf(24, { ...STANCE, crouch: 0.7, squash: 0.94, shoulderB: 10, elbowB: 8, torso: 38, head: 12, hipF: 34, kneeF: 78, hipB: -34, kneeB: 86, offX: 12 }, "out"),
        kf(34, { ...STANCE, crouch: 0.36, shoulderB: 46, elbowB: 42, torso: 20, offX: 4 }, "inOut"),
        kf(48, { ...STANCE }),
      ],
    },
    {
      id: "letGoTheHare",
      name: "Let Go the Hare",
      input: { button: "B", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special", "projectile", "low"],
      priority: 22,
      duration: 40,
      friction: 0.9,
      meterGain: 18,
      // Dio: she let a hare go from the fold of her dress before the battle,
      // and when it ran the way they wanted, the army roared. The roar is the
      // point of the move - it is the best meter on her list and her only
      // ranged poke - and it costs a pip because you only have the one hare
      // and letting it go is a thing you do once and mean.
      resourceCost: 1,
      resourceMin: 1,
      showProps: ["hare"],
      propsAt: [{ from: 0, to: 15, show: ["hare"] }],
      projectiles: [{
        at: 16,
        kind: "hare",
        x: 22,
        y: 14,
        vx: 6.4,
        vy: 3.2,
        gravity: 0.42,
        bounce: 0.72,
        bounces: 6,
        life: 150,
        box: { x: -11, y: -8, w: 22, h: 16 },
        damage: 42,
        hitstun: 17,
        blockstun: 12,
        // It runs along the floor, so it must be blocked low, and it is live
        // the moment it is out of her hand - a thing at ankle height is the
        // case the arming rule exists to exempt.
        guard: "low",
        armAfter: 0,
        pushX: 4,
        chip: 5,
        fx: "blunt",
        hitstop: 7,
        meterGain: 12,
        scale: 1,
        color: "#a88a5e",
      }],
      desc: "Lets the hare go. It bolts along the ground in front of her, bounces, and has to be blocked low - her only shot at range, and the best meter she has, for a pip of Andraste and the fact that there is only ever one hare.",
      notation: "↓↙← + B (1 Andraste)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(7, { ...STANCE, crouch: 0.4, shoulderB: 12, elbowB: 92, torso: 22, head: 8, hipF: 30, kneeF: 52, offX: -2 }, "out"),
        kf(13, { ...STANCE, crouch: 0.66, shoulderB: -14, elbowB: 74, torso: 32, head: 12, hipF: 34, kneeF: 72, hipB: -32, kneeB: 78, offX: 3 }, "inOut"),
        kf(16, { ...STANCE, crouch: 0.6, shoulderB: -20, elbowB: 46, torso: 30, head: 10, offX: 5 }, "out"),
        kf(26, { ...STANCE, crouch: 0.3, shoulderB: 30, elbowB: 54, torso: 14, head: 2, offX: 2 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },
    {
      id: "andraste",
      name: "Andraste",
      input: { button: "C", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 24,
      duration: 46,
      friction: 0.8,
      resourceCost: 1,
      resourceMin: 1,
      meterGain: 18,
      // "She called on Andraste" - the British goddess of victory, and the one
      // name Dio gives from the whole religion. Spending a pip on a timed
      // damage buff rather than a permanent one is the difference between this
      // and Lapu-Lapu's Forty-Nine: his is a fight he is losing, hers is a
      // thing she chooses to spend on now. Two of them can be up at once, and
      // holding both is fifteen seconds of nearly half again the damage - for
      // both pips, and forty-six frames each of standing perfectly still.
      grants: [{ damageDealt: 1.2, frames: 480, stacks: 2 }],
      vfx: [
        { at: 10, kind: "aura", x: 0, y: 54, scale: 2, color: FIRE },
        { at: 24, kind: "spark", x: 0, y: 78, scale: 1.4, color: "#ffd98a" },
        { at: 24, kind: "smoke", x: 0, y: 40, scale: 1.4, color: "#8a3a2a" },
      ],
      desc: "Raises the spear in both hands and calls the name. No hitbox, forty-six frames of nothing - and for the next eight seconds everything she does hurts a fifth more. Two of them stack.",
      notation: "↓↙← + C (1 Andraste)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(12, { ...STANCE, torso: -10, head: -14, shoulderF: 148, elbowF: -30, weapon: -52, shoulderB: 140, elbowB: -18, hipF: 12, kneeF: 10, hipB: -16, kneeB: 20, offY: 1 }, "out"),
        kf(24, { ...STANCE, torso: -16, head: -20, shoulderF: 164, elbowF: -34, weapon: -58, shoulderB: 156, elbowB: -22, squash: 1.03, hipF: 8, kneeF: 6, hipB: -12, kneeB: 14, offY: 2 }, "inOut"),
        kf(34, { ...STANCE, torso: -8, head: -10, shoulderF: 120, elbowF: -10, weapon: -30, shoulderB: 110, elbowB: 6 }, "inOut"),
        kf(46, { ...STANCE }),
      ],
    },
    {
      id: "spearRise",
      name: "Iceni Spear",
      input: { button: "C", motion: "dp", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 28,
      duration: 40,
      vel: [{ at: 4, x: 1.6, y: 9.4 }, { at: 20, x: 0 }],
      airborne: true,
      friction: 0.94,
      invuln: [{ from: 3, to: 9, kind: "strike" }],
      hits: [hit(5, 13, bx(20, 52, 62, 84), 74, {
        fx: "pierce",
        pushX: 6,
        launch: [2, 9.5],
        knockdown: "launch",
        hitstun: 22,
        hitstop: 10,
        shake: 1.8,
      })],
      desc: "Comes up off the back foot with the point going first. Her only answer to anybody in the air, and the only invulnerable frames she owns.",
      notation: "→↓↘ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, crouch: 0.6, shoulderF: 26, elbowF: 62, weapon: 36, torso: 16, hipF: 32, kneeF: 66, hipB: -30, kneeB: 72 }, "out"),
        kf(5, { ...STANCE, free: 1, shoulderF: 132, elbowF: -24, weapon: 27, shoulderB: 40, elbowB: 44, torso: -14, hipF: 22, kneeF: 20, hipB: -34, kneeB: 26, offY: 3 }, "out"),
        kf(13, { ...STANCE, free: 1, shoulderF: 154, elbowF: -30, weapon: 13, torso: -20, hipF: 30, kneeF: 40, hipB: -26, kneeB: 44 }, "inOut"),
        kf(26, { ...STANCE, free: 1, shoulderF: 70, elbowF: 22, weapon: 18, torso: 6, hipF: 34, kneeF: 48, hipB: -24, kneeB: 42 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },
    {
      id: "spearRiseEx",
      name: "Iceni Spear EX",
      input: { button: "S", motion: "dp", stance: ["stand", "crouch"] },
      tags: ["special", "ex"],
      priority: 36,
      duration: 50,
      meterCost: 50,
      vel: [{ at: 4, x: 2.4, y: 10.6 }, { at: 26, x: 0 }],
      airborne: true,
      friction: 0.94,
      invuln: [{ from: 1, to: 14, kind: "full" }],
      hits: [
        hit(5, 10, bx(20, 48, 64, 80), 48, { group: 1, fx: "pierce", pushX: 2, hitstun: 18, hitstop: 7 }),
        hit(13, 19, bx(18, 66, 66, 92), 68, {
          group: 2,
          fx: "pierce",
          pushX: 8,
          launch: [3, 11],
          knockdown: "launch",
          hitstun: 24,
          hitstop: 12,
          shake: 2.2,
        }),
      ],
      desc: "EX. Fully invulnerable off the ground and it goes twice - the point through them on the way up, then the whole shaft over the top.",
      notation: "→↓↘ + S (50 meter)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, crouch: 0.66, shoulderF: 24, elbowF: 66, weapon: 44, torso: 18, hipF: 32, kneeF: 70, hipB: -30, kneeB: 76 }, "out"),
        kf(5, { ...STANCE, free: 1, shoulderF: 136, elbowF: -26, weapon: -36, shoulderB: 42, elbowB: 42, torso: -16, hipF: 22, kneeF: 20, hipB: -34, kneeB: 26, offY: 3 }, "out"),
        kf(11, { ...STANCE, free: 1, shoulderF: 160, elbowF: -32, weapon: -46, torso: -22, hipF: 26, kneeF: 32 }, "out"),
        kf(15, { ...STANCE, free: 1, shoulderF: 198, elbowF: -22, weapon: -70, shoulderB: 176, elbowB: -10, torso: -30, spin: -18, spinPivot: 46, hipF: 34, kneeF: 46 }, "linear"),
        kf(19, { ...STANCE, free: 1, shoulderF: 236, elbowF: -8, weapon: -88, torso: -38, spin: -34, spinPivot: 46, hipF: 40, kneeF: 54 }, "out"),
        kf(32, { ...STANCE, free: 1, shoulderF: 78, elbowF: 20, weapon: 16, torso: 4, hipF: 34, kneeF: 48, hipB: -24, kneeB: 42 }, "inOut"),
        kf(50, { ...STANCE }),
      ],
    },
    {
      id: "onset",
      name: "The Onset",
      input: { button: "B", motion: "hcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 26,
      duration: 46,
      vel: [{ at: 6, x: 9.2 }, { at: 24, x: 0 }],
      friction: 0.9,
      meterGain: 16,
      // The one thing she does that is not zoning, and it has to exist: a
      // fighter whose whole game is a wall of point has no way of making
      // anybody come to her. Armour on the run-up rather than invulnerability
      // - she goes through one thing on the way in and pays full price for the
      // second, which is what a charge should be.
      armor: [{ from: 6, to: 18, hits: 1, damageScale: 0.4 }],
      hits: [hit(14, 20, bx(16, 30, 92, 60), 72, {
        fx: "blunt",
        pushX: 11,
        knockdown: "soft",
        hitstun: 22,
        hitstop: 11,
        shake: 2,
      })],
      desc: "Shield up, spear level, and runs. Shrugs off the first thing that hits her on the way in. It is how a fighter who wants the whole screen makes somebody close it for her.",
      notation: "←↙↓↘→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, crouch: 0.4, shoulderB: -8, elbowB: 96, shoulderF: 30, elbowF: 68, weapon: 52, torso: 20, hipB: -34, kneeB: 52, offX: -3 }, "out"),
        kf(11, { ...STANCE, crouch: 0.22, shoulderB: 18, elbowB: 86, shoulderF: 44, elbowF: 40, weapon: 24, torso: 26, hipF: 42, kneeF: 30, offX: 5 }, "linear"),
        kf(14, { ...STANCE, shoulderB: 62, elbowB: 38, shoulderF: 60, elbowF: 6, weapon: 0, torso: 30, hipF: 46, kneeF: 20, hipB: -38, kneeB: 40, offX: 10 }, "out"),
        kf(24, { ...STANCE, shoulderB: 50, elbowB: 52, shoulderF: 56, elbowF: 26, weapon: 18, torso: 18, offX: 4 }, "inOut"),
        kf(46, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- skill
    {
      id: "muster",
      name: "Muster the Tribes",
      input: { buttons: ["A", "C"], stance: ["stand", "crouch"] },
      tags: ["skill"],
      priority: 18,
      duration: 46,
      friction: 0.78,
      resourceGain: 1,
      meterGain: 12,
      // Tacitus puts a hundred and twenty thousand behind her, which is a
      // Roman number and not a real one, but the shape of it is right: what
      // she actually had was the Trinovantes coming in on top of the Iceni.
      // No hitbox, forty-six frames, both hands up. The pips are the whole
      // economy - firebrand and Andraste both cost one - so getting one back
      // has to be something anybody watching can punish.
      vfx: [
        { at: 16, kind: "aura", x: 0, y: 58, scale: 1.6, color: FIRE },
        { at: 28, kind: "dust", x: 0, y: 6, scale: 1.8 },
      ],
      desc: "SKILL. Spear up, and the tribes answer. One pip of Andraste back, and forty-six frames of standing in the open with nothing covering her.",
      notation: "A + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(10, { ...STANCE, torso: -6, head: -10, shoulderF: 128, elbowF: -8, weapon: -30, shoulderB: 118, elbowB: 8, hipF: 14, kneeF: 12, hipB: -18, kneeB: 22 }, "out"),
        kf(20, { ...STANCE, torso: -14, head: -18, shoulderF: 158, elbowF: -22, weapon: -48, shoulderB: 150, elbowB: -8, squash: 1.04, hipF: 10, kneeF: 8, hipB: -14, kneeB: 16, offY: 2 }, "inOut"),
        kf(30, { ...STANCE, torso: -12, head: -16, shoulderF: 150, elbowF: -18, weapon: -44, shoulderB: 142, elbowB: -4 }, "inOut"),
        kf(38, { ...STANCE, torso: -4, head: -6, shoulderF: 96, elbowF: 8, weapon: -6, shoulderB: 84, elbowB: 22 }, "inOut"),
        kf(46, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- super
    {
      id: "super",
      name: "The Essedum",
      input: { button: "S", motion: "dd", stance: ["stand", "crouch"] },
      tags: ["super"],
      priority: 60,
      duration: 116,
      meterCost: 100,
      superFreeze: 40,
      invuln: [{ from: 1, to: 16, kind: "strike" }],
      // Caesar on the British chariot, and it is the only description of one
      // fighting anybody has: they drive along the line throwing, the noise
      // and the wheels break the ranks up, and then the warrior drops off the
      // pole and fights on foot while the driver holds the car ready behind
      // him. So that is the shape of it - a passing run with the wheels doing
      // the work, and then she gets off and finishes it herself.
      //
      // The car is a ground-attached prop, which means it travels with her
      // rig for free: it appears on the freeze, carries her through the pass,
      // and is gone by the time she is standing on her own feet again.
      propsAt: [
        { from: 6, to: 76, show: ["chariot"] },
        { from: 6, to: 76, hide: ["shield"] },
      ],
      vel: [
        { at: 10, x: 10.5 },
        { at: 40, x: 7.5 },
        { at: 64, x: 4 },
        { at: 78, x: 0 },
      ],
      friction: 0.93,
      hits: [
        // The pass: four hits off the moving car, none of them large. The
        // wheels and the noise, not the spear.
        hit(16, 20, bx(6, 12, 116, 76), 44, { group: 1, fx: "blunt", pushX: 2, hitstun: 18, hitstop: 4, chip: 9, shake: 1.6 }),
        hit(28, 32, bx(6, 12, 116, 76), 40, { group: 2, fx: "blunt", pushX: 2, hitstun: 17, hitstop: 4, chip: 9, shake: 1.4 }),
        hit(40, 44, bx(6, 12, 116, 76), 40, { group: 3, fx: "blunt", pushX: 2, hitstun: 17, hitstop: 4, chip: 9, shake: 1.4 }),
        hit(52, 57, bx(6, 12, 118, 78), 48, { group: 4, fx: "blunt", pushX: 3, hitstun: 19, hitstop: 6, chip: 10, shake: 1.8 }),
        // And then she is off the pole and it is the spear, over the top,
        // with the whole length of her behind it.
        hit(88, 94, bx(20, 20, 104, 78), 148, {
          group: 5,
          guard: "overhead",
          fx: "pierce",
          pushX: 12,
          knockdown: "hard",
          launch: [5, 8.5],
          hitstun: 26,
          hitstop: 18,
          shake: 3.2,
        }),
      ],
      vfx: [
        { at: 2, kind: "super", x: 0, y: 52, scale: 2.5, color: FIRE },
        { at: 16, kind: "dust", x: -30, y: 4, scale: 2 },
        { at: 34, kind: "dust", x: -30, y: 4, scale: 2 },
        { at: 52, kind: "dust", x: -30, y: 4, scale: 2 },
        { at: 78, kind: "dust", x: 10, y: 4, scale: 1.6 },
        { at: 88, kind: "explode", x: 60, y: 46, scale: 1.5, color: FIRE },
      ],
      desc: "SUPER. The car comes up, she takes it along them at the gallop with the wheels doing the damage, and then she steps off the pole and puts the spear through what is left standing.",
      notation: "↓↓ + S (100 meter)",
      frames: [
        kf(0, { ...STANCE, crouch: 0.5, torso: -10 }, "out"),
        // Up into the car and driving.
        kf(6, { ...STANCE, torso: -12, head: -8, shoulderF: 44, elbowF: 30, weapon: 20, shoulderB: 24, elbowB: 66, hipF: 20, kneeF: 18, hipB: -22, kneeB: 26, offY: 20 }, "out"),
        kf(16, { ...STANCE, torso: 18, head: -6, shoulderF: 62, elbowF: 8, weapon: 2, shoulderB: 40, elbowB: 50, hipF: 26, kneeF: 22, hipB: -26, kneeB: 30, offX: 3, offY: 20 }, "inOut"),
        kf(28, { ...STANCE, torso: 12, head: -4, shoulderF: 54, elbowF: 18, weapon: 12, shoulderB: 34, elbowB: 58, offY: 20 }, "inOut"),
        kf(40, { ...STANCE, torso: 20, head: -6, shoulderF: 64, elbowF: 6, weapon: 0, shoulderB: 42, elbowB: 48, offX: 3, offY: 20 }, "inOut"),
        kf(52, { ...STANCE, torso: 14, head: -4, shoulderF: 56, elbowF: 16, weapon: 10, shoulderB: 36, elbowB: 56, offY: 20 }, "inOut"),
        kf(64, { ...STANCE, torso: 22, head: -8, shoulderF: 30, elbowF: 44, weapon: 30, shoulderB: 20, elbowB: 70, hipF: 30, kneeF: 30, offX: 2, offY: 20 }, "inOut"),
        // Off the pole and down onto the ground.
        kf(72, { ...STANCE, free: 1, torso: 16, shoulderF: 24, elbowF: 56, weapon: 44, hipF: 44, kneeF: 62, hipB: -30, kneeB: 54, offX: 6, offY: 12 }, "in"),
        kf(78, { ...STANCE, crouch: 0.5, squash: 0.94, torso: 22, shoulderF: 20, elbowF: 62, weapon: 50, hipF: 36, kneeF: 68, hipB: -32, kneeB: 72, offX: 4 }, "out"),
        // Over the top with everything she has.
        kf(84, { ...STANCE, shoulderF: 176, elbowF: -28, weapon: -56, shoulderB: 152, elbowB: 6, torso: -28, hipB: -36, kneeB: 48, offX: -5, offY: 3 }, "in"),
        kf(88, { ...STANCE, shoulderF: 130, elbowF: -14, weapon: -28, shoulderB: 108, elbowB: -2, torso: 6, hipF: 34, kneeF: 14, offX: 6 }, "linear"),
        kf(94, { ...STANCE, shoulderF: 56, elbowF: 2, weapon: -10, shoulderB: 46, elbowB: 26, torso: 36, hipF: 46, kneeF: 28, crouch: 0.34, offX: 12 }, "out"),
        kf(104, { ...STANCE, shoulderF: 48, elbowF: 30, weapon: 22, torso: 20, crouch: 0.2, offX: 4 }, "inOut"),
        kf(116, { ...STANCE }),
      ],
    },
  ],
};

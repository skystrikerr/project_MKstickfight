/**
 * Hernan Cortes (1485-1547) - captain of the expedition that landed on the
 * Gulf coast in 1519 and took Tenochtitlan in August 1521.
 *
 * He is on this roster as the other side of a fight it already has. The
 * Florentine Codex names Tzilacatzin holding the Tlatelolco causeways against
 * Spanish advances; this is the man on the far end of them, and the two of
 * them are each other's rival in the ladder for that reason.
 *
 * The sources do not describe a great warrior, and neither does this. Cortes
 * was a notary's son with a law-school year behind him, and what the accounts
 * actually credit him with is arithmetic and nerve: he ran his own ships
 * aground at Veracruz so that no one under him could argue for going home; he
 * took the Tlaxcalteca as allies after they had fought him to a standstill,
 * and it was their tens of thousands who did most of the fighting afterwards;
 * he had thirteen brigantines built inland, carried in pieces over the
 * mountains and launched on Lake Texcoco; and he cut the Chapultepec aqueduct
 * and held the causeways for ninety-three days while the city starved.
 *
 * It is not a flattering list and it is not written as one. He ordered the
 * killing at Cholula, his lieutenant did the same in the temple precinct
 * during his absence, and what he presided over at the end of the siege was
 * the destruction of the largest city in the Americas and the deaths of most
 * of the people in it - a number nobody can give, on top of a smallpox
 * epidemic that had already been through it and had nothing to do with any
 * decision of his. His own Cartas de Relacion are letters to a king written by
 * a man arguing for his own back pay, and every word of them should be read
 * that way.
 *
 * So the character is a commander rather than a duellist. His resource fills
 * when he blocks, because that is how Tlaxcala came to him. He can give up his
 * own retreat, permanently, to hit harder. And the one thing he does that
 * nobody argues with is the horse.
 */

import type { FighterDef } from "../types";
import { bx, guardClips, hit, kf, universalMoves } from "./builders";

const SKIN = "#d8b184";
const BEARD = "#3b2a1e";
const STEEL = "#c3ccd6";
const STEEL_DARK = "#7d8894";
const CLOTH = "#5c2733";
const CLOTH_LIT = "#7d3644";
const GOLD = "#c9a34a";
const LEATHER = "#6b4a2c";
const BOLT = "#e8dcae";
const HORSE = "#7a5232";
const HORSE_DARK = "#3f2a1a";

/**
 * Upright, closed, and turned side-on behind the rodela.
 *
 * The sword hand is held back and low rather than forward - a cut-and-thrust
 * blade behind a steel buckler is fought from behind the shield, and the
 * silhouette should say "covered" before it says anything else. He is the only
 * fighter here whose neutral pose is mostly a defensive one.
 */
const STANCE = {
  torso: 6,
  head: -3,
  hipF: 18,
  kneeF: 18,
  hipB: -18,
  kneeB: 26,
  shoulderF: 34,
  elbowF: 74,
  // Low. The first draft carried the blade at sixty degrees above level, which
  // is a salute rather than a guard, and it meant every thrust he owns had to
  // rotate sixty degrees before it could go anywhere - measured, it turned all
  // four of his thrusts into swings. A cut-and-thrust sword waiting behind a
  // buckler sits about here.
  weapon: 8,
  shoulderB: 52,
  elbowB: 84,
};

export const CONQUISTADOR: FighterDef = {
  id: "conquistador",
  name: "Hernán Cortés",
  title: "Captain of the Expedition",
  era: "Tenochtitlan, 1521",
  bio: "A notary's son from Medellín who landed on the Gulf coast in 1519, ran his own ships aground so nobody could sail home, took the Tlaxcalteca as allies after failing to beat them, and had thirteen brigantines carried over the mountains in pieces to close the lake. The city fell in August 1521 after ninety-three days without water.",
  archetype: "Commander / Commitment",
  difficulty: 4,
  strengths: ["Fills his bar by blocking", "Steel cuts through a guard", "Can trade retreat for damage"],
  weaknesses: ["Slow, and no faster once committed", "Wears three pieces of armour to lose", "Needs the bar for anything decisive"],
  winQuote: "I wrote the account of this. You did not.",
  palette: {
    body: SKIN,
    outline: "#171310",
    accent: GOLD,
    cloth: CLOTH,
    metal: STEEL,
    aura: "#e8c46a",
  },
  stats: {
    health: 1010,
    walkF: 2.75,
    walkB: 2.5,
    dashSpeed: 8.2,
    dashFrames: 16,
    backdashFrames: 19,
    jumpVel: 12,
    jumpFwd: 4.6,
    gravity: 0.64,
    weight: 1.08,
    airMoves: 1,
    doubleJump: false,
    airDash: false,
    width: 21,
    standHeight: 106,
    crouchHeight: 64,
    scale: 1.01,
  },
  stance: STANCE,
  // Behind the rodela, which is a small steel target held out on the fist
  // rather than strapped along the arm - so it covers by being moved, and both
  // guards put it somewhere different.
  clips: guardClips({
    high: { torso: 2, head: -8, shoulderB: 22, elbowB: 96, shoulderF: 26, elbowF: 88, weapon: 58, hipF: 16, kneeF: 22, hipB: -18, kneeB: 30, offX: -3 },
    low: { torso: 12, head: -5, shoulderB: -4, elbowB: 92, shoulderF: 30, elbowF: 92, weapon: 66, hipF: 32, kneeF: 74, hipB: -20, kneeB: 82, offX: -3 },
  }),
  resource: {
    name: "Tlaxcala",
    max: 3,
    start: 1,
    // The one resource on the roster that fills by holding guard. Tlaxcala
    // fought him for a fortnight before they allied with him, and the lake
    // cities came over as the siege turned - allies attach to whoever is still
    // standing, so this fills when he stands things.
    //
    // Three blocked hits is about a pip. That is deliberately slow: he starts
    // with one, and a round where he never blocks anything is a round where he
    // never gets to use half his kit.
    gainOnGuard: 0.34,
    regen: 0,
    color: "#d8563f",
    pips: true,
  },
  props: [
    {
      id: "morion",
      attach: "head",
      armour: "head",
      // A morion: high peaked comb front to back, brim swept up to a point at
      // each end. The most recognisable object the period produced.
      parts: [
        { geo: "poly", size: [-13, -3, -11, 6, 0, 11, 11, 6, 13, -3, 8, -7, -8, -7], pos: [0, 4], color: STEEL },
        { geo: "poly", size: [-13, 0, -6, 7, 0, 9, 6, 7, 13, 0, 0, 3], pos: [0, 9], color: STEEL_DARK, z: 0.15 },
        // The comb along the crown.
        { geo: "poly", size: [-9, 0, -4, 6, 4, 6, 9, 0], pos: [0, 12], color: STEEL },
        { geo: "poly", size: [-9, 0, 0, 3, 9, 0], pos: [0, 17], color: "#e2e9f0", z: 0.2 },
        // The brim, up at both ends.
        { geo: "poly", size: [-20, 2, -16, -2, 16, -2, 20, 2, 14, -5, -14, -5], pos: [0, 1], color: STEEL },
        { geo: "disc", size: [1.6], pos: [-9, 1], color: GOLD, z: 0.3 },
        { geo: "disc", size: [1.6], pos: [9, 1], color: GOLD, z: 0.3 },
      ],
    },
    {
      id: "beard",
      attach: "head",
      // Every Nahua drawing of the Spanish leads with the beards; the Codex
      // pictures are unmistakable about it. It is the first thing anybody who
      // saw these men wrote down, so it goes on the head before anything else.
      parts: [
        { geo: "poly", size: [-7, 6, -5, -6, 0, -11, 5, -6, 7, 6, 0, 3], pos: [4, -8], color: BEARD },
        { geo: "poly", size: [-4, 2, 0, -4, 4, 2], pos: [4, -14], color: "#2a1d14", z: 0.1 },
      ],
    },
    {
      id: "cuirass",
      attach: "torso",
      armour: "body",
      // Peascod breastplate with a medial ridge, over a doublet, with tassets
      // hanging off the fauld.
      parts: [
        { geo: "poly", size: [-12, -18, 12, -18, 13, 8, 8, 17, 0, 21, -8, 17, -13, 8], pos: [0, 1], color: STEEL },
        { geo: "poly", size: [0, -19, 3, 2, 0, 20, -3, 2], pos: [1, 0], color: "#e2e9f0", z: 0.2 },
        { geo: "poly", size: [-13, 0, 13, 0, 12, -6, -12, -6], pos: [0, -17], color: STEEL_DARK, z: 0.15 },
        { geo: "box", size: [11, 7], pos: [-6, -22], color: STEEL_DARK, z: 0.1 },
        { geo: "box", size: [11, 7], pos: [6, -22], color: STEEL_DARK, z: 0.1 },
        // A sash under it, because a captain is also making a point.
        { geo: "poly", size: [-13, 6, 13, -4, 13, -9, -13, 1], pos: [0, -4], color: CLOTH, z: 0.25 },
      ],
    },
    {
      id: "toledo",
      attach: "handF",
      // A cut-and-thrust arming sword of the period: straight, double edged,
      // with a swept guard and a wheel pommel. Steel, and the sources are
      // unanimous that the steel was the thing.
      parts: [
        { geo: "box", size: [15, 5], pos: [4, 0], color: LEATHER },
        { geo: "box", size: [15, 1.6], pos: [4, 1.6], color: "#8a6238", z: 0.1 },
        { geo: "disc", size: [4.4], pos: [-6, 0], color: GOLD },
        { geo: "disc", size: [1.8], pos: [-6, 0], color: "#8f6a22", z: 0.3 },
        // Swept guard: a straight cross with a knuckle bow curling forward.
        { geo: "box", size: [3.4, 22], pos: [13, 0], color: GOLD },
        { geo: "poly", size: [0, 0, 6, 4, 11, 1, 13, -6, 9, -2, 4, -3], pos: [13, 9], color: GOLD, z: 0.2 },
        { geo: "poly", size: [0, 0, 6, -4, 11, -1, 13, 6, 9, 2, 4, 3], pos: [13, -9], color: GOLD, z: 0.2 },
        // Blade, tapering, with a fuller down the first half.
        { geo: "poly", size: [0, 7, 62, 6, 86, 3, 92, 0, 86, -3, 62, -6, 0, -7], pos: [16, 0], color: STEEL },
        { geo: "poly", size: [0, 2, 52, 1.6, 52, 0, 0, 0], pos: [20, 0.6], color: "#eef3f7", z: 0.3 },
      ],
    },
    {
      id: "rodela",
      attach: "handB",
      armour: "shield",
      // A rodela: a small round steel target carried on the fist, not strapped
      // along the forearm - so it is on the hand, and it moves where the hand
      // goes. Everything he does defensively is this thing.
      parts: [
        { geo: "disc", size: [21], pos: [6, 0], color: STEEL_DARK, z: 0.5 },
        { geo: "ring", size: [21, 2.6], pos: [6, 0], color: STEEL, z: 0.55 },
        { geo: "ring", size: [15, 2], pos: [6, 0], color: STEEL, z: 0.55 },
        { geo: "ring", size: [9, 2], pos: [6, 0], color: STEEL, z: 0.55 },
        { geo: "disc", size: [6], pos: [6, 0], color: STEEL, z: 0.6 },
        { geo: "disc", size: [2.4], pos: [6, 0], color: GOLD, z: 0.65 },
      ],
    },
    {
      id: "crossbow",
      attach: "handB",
      // The ballesteros were a named part of the force and turn up in every
      // muster he lists. Conditional: it is only in his hands while he is
      // shooting it, because the rodela is on the same fist.
      conditional: true,
      parts: [
        { geo: "box", size: [54, 6], pos: [10, 0], color: LEATHER },
        { geo: "box", size: [54, 2], pos: [10, 2], color: "#8a6238", z: 0.1 },
        { geo: "poly", size: [0, 0, -12, -6, -16, -12, -4, -7], pos: [-16, -2], color: LEATHER },
        // The bow, steel, set across the stock and heavily recurved.
        { geo: "poly", size: [0, 26, 5, 24, 8, 12, 8, -12, 5, -24, 0, -26, 3, -12, 3, 12], pos: [32, 0], color: STEEL_DARK },
        { geo: "box", size: [1.6, 48], pos: [26, 0], color: "#e2e9f0", z: 0.2 },
        // The nut and the lever, so it reads as a thing that has to be spanned.
        { geo: "disc", size: [3.4], pos: [4, 2], color: STEEL, z: 0.25 },
        { geo: "poly", size: [0, 3, 30, 2, 30, -1, 0, -2], pos: [4, 4], color: BOLT, z: 0.3 },
      ],
    },
    {
      id: "standard",
      attach: "back",
      // The banner. He is a captain, and the one thing the Codex artists draw
      // over the Spanish column every single time is the flags.
      parts: [
        { geo: "cyl", size: [2.6, 76], pos: [-6, 26], rot: 8, color: LEATHER, behind: true },
        { geo: "poly", size: [0, 0, 34, -5, 34, -26, 0, -21], pos: [-2, 60], color: CLOTH, behind: true },
        { geo: "poly", size: [0, 0, 34, -5, 34, -11, 0, -6], pos: [-2, 52], color: CLOTH_LIT, behind: true },
        { geo: "box", size: [3, 12], pos: [13, 49], color: GOLD, behind: true },
        { geo: "box", size: [11, 3], pos: [13, 49], color: GOLD, behind: true },
      ],
    },
    {
      id: "horse",
      attach: "ground",
      // "The horses" - the two words that recur in every account of the first
      // year, Spanish and Nahua alike, as the thing nobody had a prepared
      // answer for. Built to the floor the same way Boudica's chariot is:
      // everything is measured off a rider sitting twenty-eight units up.
      //
      // The barrel sits under him and the neck runs forward and *below* his
      // shield arm rather than through it - the first pass put the head at the
      // same height as the rodela and the whole animal disappeared behind its
      // own rider.
      conditional: true,
      parts: [
        { geo: "box", size: [7, 32], pos: [-32, 8], rot: 9, color: HORSE_DARK },
        { geo: "box", size: [7, 32], pos: [12, 8], rot: -7, color: HORSE_DARK },
        { geo: "poly", size: [-44, 12, -26, 19, 20, 19, 40, 11, 43, -6, 16, -12, -34, -11, -46, 1], pos: [-12, 30], color: HORSE },
        { geo: "poly", size: [-38, 5, -12, 1, 14, 0, 34, 4, 30, -5, -34, -6], pos: [-12, 22], color: "#5e3f26", z: 0.1 },
        { geo: "box", size: [7, 32], pos: [-22, 8], rot: -4, color: HORSE },
        { geo: "box", size: [7, 32], pos: [2, 8], rot: 5, color: HORSE },
        // Neck and head, forward and low - out from under the rider.
        { geo: "poly", size: [0, 11, 15, 19, 24, 15, 14, 0, 5, -9], pos: [22, 32], color: HORSE },
        { geo: "poly", size: [0, 7, 13, 9, 20, 3, 16, -8, 2, -8], pos: [40, 47], color: HORSE },
        { geo: "poly", size: [-2, 0, 2, 8, 6, 1], pos: [42, 52], color: HORSE },
        { geo: "poly", size: [0, 0, -6, 15, 3, 17, 8, 3], pos: [25, 37], color: HORSE_DARK, z: 0.2 },
        { geo: "disc", size: [1.7], pos: [50, 47], color: "#181008", z: 0.4 },
        // Tail, saddle, bridle.
        { geo: "poly", size: [0, 7, -10, -5, -15, -22, -6, -19, 3, -3], pos: [-54, 36], color: HORSE_DARK },
        { geo: "poly", size: [-15, 0, -12, 10, 12, 10, 15, 0], pos: [-14, 44], color: CLOTH, z: 0.3 },
        { geo: "poly", size: [-15, 0, -13, 5, 13, 5, 15, 0], pos: [-14, 52], color: CLOTH_LIT, z: 0.32 },
        { geo: "box", size: [3, 14], pos: [-27, 38], color: LEATHER, z: 0.3 },
        { geo: "box", size: [24, 2.4], pos: [38, 43], rot: -36, color: LEATHER, z: 0.35 },
      ],
    },
  ],

  moves: [
    ...universalMoves({
      throwDamage: 122,
      backThrowDamage: 130,
      throwRange: 58,
      rollSpeed: 7.2,
      weaponIdle: { weapon: STANCE.weapon },
    }),

    // --------------------------------------------------------------- normals
    //
    // Sword in one hand, rodela in the other, and the split is the character:
    // the A and the back buttons are the shield, the sword is what he does
    // once the shield has bought him the frame. His heavies take an unusual
    // bite out of a guard, because the one advantage the accounts are
    // unanimous about is that steel went through quilted cotton and cotton did
    // not go through steel.
    {
      id: "5A",
      name: "Point",
      input: { button: "A", stance: "stand" },
      tags: ["light"],
      duration: 12,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [3, 11],
      hits: [hit(4, 6, bx(20, 56, 54, 20), 28, { blockstun: 9, hitstun: 13, fx: "pierce", pushX: 3 })],
      desc: "A short thrust from behind the shield. Quick, safe, and it does not go anywhere on its own.",
      notation: "A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, shoulderF: 22, elbowF: 88, weapon: -14, torso: -4, offX: -2 }, "out"),
        kf(4, { ...STANCE, shoulderF: 52, elbowF: 20, weapon: 19, torso: 12, offX: 5 }, "linear"),
        kf(6, { ...STANCE, shoulderF: 54, elbowF: 12, weapon: 24, torso: 14, offX: 8 }, "out"),
        kf(9, { ...STANCE, shoulderF: 46, elbowF: 40, weapon: 26, torso: 6 }, "inOut"),
        kf(12, { ...STANCE }),
      ],
    },
    {
      id: "5B",
      name: "Tajo",
      input: { button: "B", stance: "stand" },
      tags: ["medium"],
      duration: 19,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [6, 17],
      hits: [hit(7, 10, bx(22, 48, 78, 28), 48, { fx: "slash", pushX: 5, hitstun: 18, hitstop: 7, guardDamage: 32 })],
      desc: "A downward cut across the body. The standard blow the manuals of the period open with, and it leans on a guard harder than its damage suggests.",
      notation: "B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderF: 148, elbowF: -8, weapon: -36, torso: -14, offX: -4 }, "out"),
        kf(7, { ...STANCE, shoulderF: 66, elbowF: 18, weapon: -4, torso: 16, hipF: 30, offX: 7 }, "out"),
        kf(13, { ...STANCE, shoulderF: 48, elbowF: 52, weapon: 24, torso: 8, offX: 3 }, "inOut"),
        kf(19, { ...STANCE }),
      ],
    },
    {
      id: "5C",
      name: "Mandoble",
      input: { button: "C", stance: "stand" },
      tags: ["heavy"],
      duration: 29,
      cancelInto: ["special", "super"],
      cancelWindow: [11, 25],
      // The number to look at here is the guard damage, not the damage. Two of
      // these on a blocking opponent is most of a guard bar, which is the
      // whole of what steel bought him.
      hits: [hit(12, 16, bx(24, 40, 96, 40), 72, {
        fx: "slash",
        pushX: 8,
        hitstun: 22,
        hitstop: 10,
        shake: 1.5,
        guardDamage: 62,
      })],
      desc: "Both hands to the grip and the whole blade taken across. Blocking it is not free - it takes a bite out of a guard that nothing else on the roster matches.",
      notation: "C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: 168, elbowF: -20, weapon: 50, shoulderB: 120, elbowB: 30, torso: -22, hipB: -30, kneeB: 40, offX: -6 }, "out"),
        kf(12, { ...STANCE, shoulderF: 74, elbowF: 6, weapon: -38, shoulderB: 84, elbowB: 34, torso: 24, hipF: 38, kneeF: 16, offX: 10 }, "out"),
        kf(20, { ...STANCE, shoulderF: 50, elbowF: 46, weapon: 0, torso: 12, offX: 4 }, "inOut"),
        kf(29, { ...STANCE }),
      ],
    },
    {
      id: "2A",
      name: "Low Point",
      input: { button: "A", stance: "crouch" },
      tags: ["light", "low"],
      duration: 13,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [3, 12],
      hits: [hit(4, 6, bx(18, 8, 50, 18), 26, { guard: "low", blockstun: 9, hitstun: 13, fx: "pierce", pushX: 2 })],
      desc: "Drops the point and puts it into a shin. The start of everything he does downstairs.",
      notation: "↓ + A",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(3, { ...STANCE, crouch: 1, shoulderF: 20, elbowF: 74, weapon: -21, torso: -2, offX: -2 }, "out"),
        kf(4, { ...STANCE, crouch: 1, shoulderF: 2, elbowF: 18, weapon: 46, torso: 18, offX: 5 }, "linear"),
        kf(9, { ...STANCE, crouch: 1, shoulderF: 16, elbowF: 46, weapon: 18, torso: 10 }, "inOut"),
        kf(13, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "2B",
      name: "At the Legs",
      input: { button: "B", stance: "crouch" },
      tags: ["medium", "low"],
      duration: 21,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [7, 19],
      hits: [hit(8, 11, bx(22, 4, 86, 22), 46, { guard: "low", fx: "slash", pushX: 4, hitstun: 19, hitstop: 7, guardDamage: 30 })],
      desc: "A cut along the ground from behind the rodela. Has to be blocked low, and it leans on the guard on the way past.",
      notation: "↓ + B",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(4, { ...STANCE, crouch: 1, shoulderF: 62, elbowF: 76, weapon: 62, torso: -8, offX: -4 }, "out"),
        kf(8, { ...STANCE, crouch: 1, shoulderF: -2, elbowF: 12, weapon: -30, torso: 24, hipF: 32, offX: 9 }, "out"),
        kf(14, { ...STANCE, crouch: 1, shoulderF: 14, elbowF: 44, weapon: 6, torso: 16, offX: 4 }, "inOut"),
        kf(21, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "2C",
      name: "Reap",
      input: { button: "C", stance: "crouch" },
      tags: ["heavy", "low"],
      duration: 31,
      cancelInto: ["special", "super"],
      cancelWindow: [12, 27],
      hits: [hit(13, 18, bx(22, 0, 98, 20), 68, {
        guard: "low",
        fx: "slash",
        pushX: 6,
        knockdown: "sweep",
        hitstun: 20,
        hitstop: 9,
        shake: 1.5,
        guardDamage: 52,
      })],
      desc: "Down onto the back heel and the blade taken along the floor. Puts them on their back.",
      notation: "↓ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(6, { ...STANCE, crouch: 1, shoulderF: 78, elbowF: 66, weapon: 76, shoulderB: 24, elbowB: 78, torso: -14, offX: -5 }, "out"),
        kf(13, { ...STANCE, crouch: 1, squash: 0.94, shoulderF: -12, elbowF: 6, weapon: -44, shoulderB: 74, elbowB: 26, torso: 30, hipF: 26, kneeF: 88, hipB: -32, kneeB: 96, offX: 11 }, "out"),
        kf(22, { ...STANCE, crouch: 1, shoulderF: 12, elbowF: 40, weapon: -6, torso: 20, offX: 5 }, "inOut"),
        kf(31, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "6A",
      name: "Rodela",
      input: { button: "A", dir: "f", stance: "stand" },
      tags: ["light"],
      duration: 15,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [4, 13],
      vel: [{ at: 3, x: 2.4 }, { at: 9, x: 0 }],
      friction: 0.9,
      hits: [hit(5, 8, bx(14, 52, 48, 30), 32, { fx: "blunt", pushX: 4, hitstun: 15 })],
      desc: "Steps in and knocks the rim of the target into their face. His fastest way of buying a frame.",
      notation: "→ + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, shoulderB: 10, elbowB: 106, torso: 12, offX: 1 }, "out"),
        kf(5, { ...STANCE, shoulderB: 62, elbowB: 40, torso: 2, hipF: 28, offX: 5 }, "linear"),
        kf(8, { ...STANCE, shoulderB: 82, elbowB: 22, torso: -4, hipF: 32, offX: 7 }, "out"),
        kf(12, { ...STANCE, shoulderB: 62, elbowB: 62, torso: 4 }, "inOut"),
        kf(15, { ...STANCE }),
      ],
    },
    {
      id: "6B",
      name: "Boss First",
      input: { button: "B", dir: "f", stance: "stand" },
      tags: ["medium"],
      duration: 23,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [8, 21],
      hits: [hit(9, 12, bx(12, 46, 54, 44), 48, { fx: "blunt", pushX: 6, hitstun: 19, hitstop: 8 })],
      desc: "Drives the boss of the rodela up under the jaw. The shield is a weapon before it is a shield.",
      notation: "→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderB: -14, elbowB: 100, torso: 18, crouch: 0.32, offX: 2 }, "out"),
        kf(9, { ...STANCE, shoulderB: 88, elbowB: 20, torso: 2, hipF: 32, kneeF: 16, offX: 7 }, "out"),
        kf(16, { ...STANCE, shoulderB: 62, elbowB: 58, torso: 8 }, "inOut"),
        kf(23, { ...STANCE }),
      ],
    },
    {
      id: "6C",
      name: "Shoulder",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["heavy"],
      duration: 33,
      // The string ender. It barely hurts and it is not supposed to: what it
      // does is put them at the far end of his sword again, which is where
      // everything else he has works from.
      hits: [hit(11, 15, bx(14, 26, 66, 56), 58, {
        fx: "blunt",
        pushX: 16,
        selfPushX: -2,
        hitstun: 18,
        hitstop: 9,
        shake: 1.6,
        guardDamage: 44,
      })],
      desc: "Whole shoulder behind the target and drives them off. Almost no damage, a large bite out of a guard, and the fight goes back to sword length.",
      notation: "→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderB: -2, elbowB: 104, shoulderF: 22, elbowF: 84, weapon: 56, torso: -12, crouch: 0.34, offX: -6 }, "out"),
        kf(11, { ...STANCE, shoulderB: 84, elbowB: 12, shoulderF: 52, elbowF: 40, weapon: 34, torso: 30, hipF: 44, kneeF: 20, hipB: -36, kneeB: 46, offX: 11 }, "out"),
        kf(20, { ...STANCE, shoulderB: 58, elbowB: 54, torso: 16, offX: 4 }, "inOut"),
        kf(33, { ...STANCE }),
      ],
    },
    {
      id: "3C",
      name: "Altibajo",
      input: { button: "C", dir: "df", stance: ["stand", "crouch"] },
      tags: ["heavy", "overhead", "launcher"],
      duration: 38,
      // Slow, because the low that sets it up is good and a fast overhead on
      // top of a good low is not a guess.
      hits: [hit(17, 21, bx(20, 32, 84, 66), 70, {
        guard: "overhead",
        fx: "slash",
        launch: [2.4, 10.5],
        knockdown: "launch",
        hitstun: 24,
        hitstop: 10,
        shake: 1.7,
        guardDamage: 54,
      })],
      desc: "The rising-then-falling cut the Spanish masters name: up past the guard and down through the top of it. Slow enough to read, and it launches.",
      notation: "↘ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 0.4 }, "out"),
        kf(8, { ...STANCE, shoulderF: -18, elbowF: 40, weapon: 10, shoulderB: 30, elbowB: 96, torso: 14, crouch: 0.5, hipF: 30, kneeF: 52, offX: -4 }, "out"),
        kf(13, { ...STANCE, shoulderF: 172, elbowF: -22, weapon: -54, shoulderB: 140, elbowB: 12, torso: -24, hipB: -32, kneeB: 42, offX: -6, offY: 2 }, "inOut"),
        kf(17, { ...STANCE, shoulderF: 132, elbowF: -14, weapon: -26, shoulderB: 110, elbowB: 4, torso: 6, hipF: 30, kneeF: 14, offX: 5 }, "linear"),
        kf(21, { ...STANCE, shoulderF: 56, elbowF: 6, weapon: -54, shoulderB: 48, elbowB: 26, torso: 34, hipF: 44, kneeF: 26, crouch: 0.3, offX: 10 }, "out"),
        kf(29, { ...STANCE, shoulderF: 44, elbowF: 46, weapon: 24, torso: 20, crouch: 0.2, offX: 4 }, "inOut"),
        kf(38, { ...STANCE }),
      ],
    },
    {
      id: "4A",
      name: "Give the Line",
      input: { button: "A", dir: "b", stance: "stand" },
      tags: ["light"],
      duration: 15,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [4, 13],
      vel: [{ at: 2, x: -2.2 }, { at: 8, x: 0 }],
      friction: 0.9,
      hits: [hit(5, 8, bx(20, 50, 54, 22), 30, { fx: "pierce", pushX: 4, hitstun: 14 })],
      desc: "Gives a pace and puts the point into the space he left. How he resets without losing the turn.",
      notation: "← + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(2, { ...STANCE, shoulderF: 56, elbowF: 14, weapon: 21, torso: 12, offX: 2 }, "out"),
        kf(5, { ...STANCE, shoulderF: 50, elbowF: 24, weapon: 20, torso: 4, hipB: -28, kneeB: 40, offX: -2 }, "linear"),
        kf(8, { ...STANCE, shoulderF: 26, elbowF: 66, weapon: 6, torso: -8, hipB: -32, kneeB: 44, offX: -5 }, "out"),
        kf(15, { ...STANCE }),
      ],
    },
    {
      id: "4B",
      name: "Cover",
      input: { button: "B", dir: "b", stance: "stand" },
      tags: ["medium"],
      duration: 24,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [9, 22],
      // Held out rather than swung: the rodela sits in the way for eight
      // frames and anything that walks into it gets it. The defensive normal
      // of a defensive fighter.
      hits: [hit(8, 16, bx(14, 40, 58, 50), 46, {
        fx: "blunt",
        pushX: 7,
        hitstun: 20,
        hitstop: 8,
        shake: 1.2,
        guardDamage: 30,
      })],
      desc: "Backs off and holds the target out where they have to come through it. Eight frames of steel sitting in the way.",
      notation: "← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderB: 30, elbowB: 96, shoulderF: 26, elbowF: 84, weapon: 52, torso: -6, crouch: 0.26, hipB: -30, kneeB: 44, offX: -4 }, "out"),
        kf(8, { ...STANCE, shoulderB: 66, elbowB: 54, shoulderF: 22, elbowF: 88, weapon: 58, torso: 4, crouch: 0.36, hipF: 26, kneeF: 24, hipB: -34, kneeB: 52, offX: -2 }, "inOut"),
        kf(16, { ...STANCE, shoulderB: 68, elbowB: 52, torso: 6, crouch: 0.36, offX: -2 }, "inOut"),
        kf(24, { ...STANCE }),
      ],
    },
    {
      id: "4C",
      name: "Reves",
      input: { button: "C", dir: "b", stance: "stand" },
      tags: ["heavy"],
      duration: 32,
      cancelInto: ["special", "super"],
      cancelWindow: [13, 28],
      hits: [hit(12, 16, bx(20, 36, 88, 44), 66, {
        fx: "slash",
        pushX: 9,
        knockdown: "soft",
        hitstun: 21,
        hitstop: 10,
        shake: 1.6,
        guardDamage: 50,
      })],
      desc: "The backhand cut, thrown while giving ground. Covers the retreat and knocks them down if it lands.",
      notation: "← + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: 156, elbowF: -16, weapon: 40, shoulderB: 24, elbowB: 100, torso: 18, hipB: -30, kneeB: 40, offX: -4 }, "out"),
        kf(12, { ...STANCE, shoulderF: 108, elbowF: 10, weapon: -54, shoulderB: 76, elbowB: 46, torso: -12, hipB: -34, kneeB: 46, offX: -3 }, "out"),
        kf(20, { ...STANCE, shoulderF: 62, elbowF: 46, weapon: -3, torso: 0, offX: -2 }, "inOut"),
        kf(32, { ...STANCE }),
      ],
    },
    {
      id: "jA",
      name: "Air Point",
      input: { button: "A", stance: "air" },
      tags: ["light", "air"],
      duration: 16,
      hits: [hit(4, 9, bx(18, 24, 52, 28), 32, { fx: "pierce", pushX: 3, hitstun: 14 })],
      desc: "Sticks the point out on the way past.",
      notation: "(air) A",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 34, kneeF: 46, hipB: -24, kneeB: 40 }, "out"),
        kf(4, { ...STANCE, free: 1, shoulderF: 62, elbowF: 16, weapon: 11, torso: 12, hipF: 38, kneeF: 50, hipB: -26, kneeB: 44 }),
        kf(9, { ...STANCE, free: 1, shoulderF: 60, elbowF: 20, weapon: 11, torso: 10, hipF: 36, kneeF: 48, hipB: -24, kneeB: 42 }, "inOut"),
        kf(16, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "jB",
      name: "Air Cut",
      input: { button: "B", stance: "air" },
      tags: ["medium", "air"],
      duration: 21,
      hits: [hit(6, 12, bx(20, 14, 74, 34), 50, { fx: "slash", pushX: 5, hitstun: 18, hitstop: 7, guardDamage: 32 })],
      desc: "Takes the blade across while he is off the ground.",
      notation: "(air) B",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 40 }, "out"),
        kf(3, { ...STANCE, free: 1, shoulderF: 140, elbowF: -6, weapon: 46, torso: -14, hipF: 40, kneeF: 52 }, "out"),
        kf(7, { ...STANCE, free: 1, shoulderF: 62, elbowF: 20, weapon: -34, torso: 16, hipF: 34, kneeF: 48, hipB: -26, kneeB: 42 }, "out"),
        kf(21, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "jC",
      name: "Falling Cut",
      input: { button: "C", stance: "air" },
      tags: ["heavy", "air"],
      duration: 27,
      hits: [hit(8, 16, bx(16, -8, 68, 58), 72, {
        fx: "slash",
        pushX: 6,
        knockdown: "soft",
        hitstun: 20,
        hitstop: 9,
        shake: 1.4,
        guardDamage: 52,
      })],
      desc: "Brings the whole blade down through them on the way to the ground.",
      notation: "(air) C",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 40 }, "out"),
        kf(4, { ...STANCE, free: 1, shoulderF: 172, elbowF: -18, weapon: -56, torso: -18, hipF: 44, kneeF: 56 }, "out"),
        kf(9, { ...STANCE, free: 1, shoulderF: 48, elbowF: 10, weapon: -8, torso: 26, hipF: 30, kneeF: 44, hipB: -20, kneeB: 36 }, "out"),
        kf(27, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "dashAttack",
      name: "Running Cut",
      input: { button: "C", dir: "f", stance: "stand", whileDashing: true },
      tags: ["heavy"],
      duration: 31,
      vel: [{ at: 1, x: 7.4 }, { at: 14, x: 0 }],
      friction: 0.9,
      hits: [hit(7, 12, bx(20, 34, 86, 44), 66, {
        fx: "slash",
        pushX: 8,
        knockdown: "soft",
        hitstun: 20,
        hitstop: 9,
        shake: 1.5,
        guardDamage: 48,
      })],
      desc: "Carries the run into the cut and lets it take him through.",
      notation: "→→ then C",
      frames: [
        kf(0, { ...STANCE, torso: 22, offX: 2 }, "out"),
        kf(4, { ...STANCE, shoulderF: 150, elbowF: -12, weapon: -40, torso: 6, offX: -3 }, "out"),
        kf(7, { ...STANCE, shoulderF: 70, elbowF: 12, weapon: -12, torso: 28, hipF: 40, kneeF: 18, offX: 9 }, "out"),
        kf(18, { ...STANCE, shoulderF: 50, elbowF: 48, weapon: 22, torso: 16, offX: 4 }, "inOut"),
        kf(31, { ...STANCE }),
      ],
    },

    // --------------------------------------------------------- five specials
    {
      id: "ships",
      name: "Burn the Ships",
      input: { button: "C", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 24,
      duration: 52,
      friction: 0.78,
      meterGain: 22,
      // Veracruz, 1519. He did not actually burn them - he had them run
      // aground and stripped, which he says plainly enough in the second
      // letter - but the effect he wanted was the one everybody remembers:
      // there was no longer a way for anybody under his command to argue for
      // going home.
      //
      // So this is a buff that takes something away and never gives it back.
      // He hits a quarter harder for the rest of the round, and for the rest
      // of the round he has no backdash and walks backwards at half speed.
      // `stacks: 1` is what makes it once and final: pressing it again does
      // nothing at all, because there is nothing left to burn.
      grants: [{ damageDealt: 1.25, noRetreat: true, stacks: 1 }],
      vfx: [
        { at: 12, kind: "aura", x: 0, y: 52, scale: 1.9, color: "#ff8a3c" },
        { at: 24, kind: "smoke", x: -30, y: 40, scale: 2.2, color: "#5a4a44" },
        { at: 30, kind: "explode", x: -40, y: 30, scale: 1.2, color: "#ff8a3c" },
      ],
      desc: "SPECIAL. No hitbox, fifty-two frames, and it cannot be taken back. Everything he does hurts a quarter more for the rest of the round - and for the rest of the round he has no backdash and walks backwards at half speed. Press it once. There is no second time.",
      notation: "↓↙← + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(10, { ...STANCE, torso: -12, head: -10, shoulderF: 122, elbowF: -6, weapon: -24, shoulderB: 40, elbowB: 70, hipF: 14, kneeF: 12, hipB: -18, kneeB: 22, offX: -3 }, "out"),
        kf(22, { ...STANCE, torso: -18, head: -16, shoulderF: 152, elbowF: -18, weapon: -42, shoulderB: 30, elbowB: 60, squash: 1.03, hipF: 10, kneeF: 8, offY: 2 }, "inOut"),
        kf(34, { ...STANCE, torso: 8, head: -4, shoulderF: 92, elbowF: 18, weapon: 0, shoulderB: 58, elbowB: 78, hipF: 22, kneeF: 20 }, "inOut"),
        kf(52, { ...STANCE }),
      ],
    },
    {
      id: "crossbow",
      name: "Ballesteros",
      input: { button: "B", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special", "projectile"],
      priority: 24,
      duration: 46,
      resourceCost: 1,
      resourceMin: 1,
      friction: 0.9,
      meterGain: 12,
      showProps: ["crossbow"],
      hideProps: ["rodela"],
      // The rodela is on the same fist, so it has to come off to shoot - which
      // is the cost that matters. Everything defensive he owns is that shield,
      // and for forty-six frames it is not in his hand.
      propsAt: [{ from: 0, to: 46, show: ["crossbow"], hide: ["rodela"] }],
      projectiles: [{
        at: 18,
        kind: "quarrel",
        x: 34,
        y: 58,
        vx: 13.5,
        vy: 0,
        life: 80,
        box: { x: -16, y: -5, w: 32, h: 10 },
        damage: 68,
        hitstun: 20,
        blockstun: 13,
        pushX: 6,
        chip: 9,
        fx: "pierce",
        hitstop: 9,
        meterGain: 10,
        scale: 1,
        color: LEATHER,
        trail: "#e8dcae",
      }],
      desc: "Puts the rodela down, brings the crossbow up and looses one bolt. It hits like a heavy from across the screen - and for the whole move the only thing he blocks with is on the floor.",
      notation: "↓↘→ + B (1 Tlaxcala)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(9, { ...STANCE, shoulderB: 76, elbowB: 22, shoulderF: 30, elbowF: 60, weapon: 40, torso: -6, head: -6, hipB: -24, kneeB: 34, offX: -3 }, "out"),
        kf(18, { ...STANCE, shoulderB: 84, elbowB: 6, shoulderF: 26, elbowF: 56, weapon: 36, torso: -2, head: -8, hipF: 22, kneeF: 16, hipB: -22, kneeB: 30, offX: 2 }, "out"),
        kf(26, { ...STANCE, shoulderB: 70, elbowB: 26, torso: 4, head: -4, offX: -1 }, "inOut"),
        kf(46, { ...STANCE }),
      ],
    },
    {
      id: "crossbowEx",
      name: "Ballesteros EX",
      input: { button: "S", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special", "ex", "projectile"],
      priority: 32,
      duration: 56,
      meterCost: 50,
      friction: 0.9,
      showProps: ["crossbow"],
      hideProps: ["rodela"],
      propsAt: [{ from: 0, to: 56, show: ["crossbow"], hide: ["rodela"] }],
      // The whole file of them, not one man: three bolts on a flat trajectory
      // with the middle one high, which is the shape a volley makes and the
      // reason a volley is worth more than three shots.
      projectiles: [
        { at: 16, kind: "quarrel", x: 34, y: 44, vx: 13.5, vy: 0, life: 80, box: { x: -16, y: -5, w: 32, h: 10 }, damage: 40, hitstun: 17, blockstun: 11, pushX: 2, chip: 6, fx: "pierce", hitstop: 6, scale: 1, color: LEATHER, trail: "#e8dcae" },
        { at: 21, kind: "quarrel", x: 34, y: 66, vx: 13, vy: 0, life: 80, box: { x: -16, y: -5, w: 32, h: 10 }, damage: 40, hitstun: 17, blockstun: 11, pushX: 2, chip: 6, fx: "pierce", hitstop: 6, scale: 1, color: LEATHER, trail: "#e8dcae" },
        { at: 26, kind: "quarrel", x: 34, y: 54, vx: 14, vy: 0, life: 80, box: { x: -16, y: -5, w: 34, h: 10 }, damage: 48, hitstun: 19, blockstun: 12, pushX: 7, chip: 8, fx: "pierce", hitstop: 9, meterGain: 8, scale: 1.05, color: LEATHER, trail: "#e8dcae" },
      ],
      desc: "EX. Not him - the file behind him. Three bolts, high, low and through the middle, for meter instead of a pip.",
      notation: "↓↘→ + S (50 meter)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, shoulderB: 74, elbowB: 24, shoulderF: 30, elbowF: 60, weapon: 40, torso: -6, head: -6, hipB: -24, kneeB: 34, offX: -3 }, "out"),
        kf(16, { ...STANCE, shoulderB: 96, elbowB: 4, shoulderF: 26, elbowF: 56, weapon: 36, torso: -8, head: -8, offX: 1 }, "out"),
        kf(21, { ...STANCE, shoulderB: 72, elbowB: 8, shoulderF: 26, elbowF: 56, weapon: 36, torso: 2, head: -6, offX: 2 }, "out"),
        kf(26, { ...STANCE, shoulderB: 84, elbowB: 6, shoulderF: 26, elbowF: 56, weapon: 36, torso: -2, head: -8, hipF: 22, kneeF: 16, offX: 2 }, "out"),
        kf(36, { ...STANCE, shoulderB: 70, elbowB: 26, torso: 4, head: -4, offX: -1 }, "inOut"),
        kf(56, { ...STANCE }),
      ],
    },
    {
      id: "rodelaCatch",
      name: "Take It on the Rodela",
      input: { button: "B", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 26,
      duration: 40,
      friction: 0.86,
      meterGain: 10,
      // A read, not a button. No hitbox of its own anywhere in it: he puts the
      // target out and waits, and if something arrives he answers with the
      // sword. If nothing arrives he has stood still for forty frames in front
      // of somebody who watched him do it.
      parryWindow: [5, 22],
      parryInto: "rodelaAnswer",
      desc: "SPECIAL. Sets the target and waits. Catch a blow on it in the window and the sword answers on its own; catch nothing and it was forty frames of standing there.",
      notation: "↓↙← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderB: 42, elbowB: 70, shoulderF: 24, elbowF: 88, weapon: 58, torso: -4, crouch: 0.28, hipF: 22, kneeF: 22, hipB: -24, kneeB: 40, offX: -3 }, "out"),
        kf(14, { ...STANCE, shoulderB: 46, elbowB: 66, shoulderF: 22, elbowF: 90, weapon: 60, torso: -2, crouch: 0.3, offX: -3 }, "inOut"),
        kf(22, { ...STANCE, shoulderB: 42, elbowB: 70, torso: -4, crouch: 0.28, offX: -3 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },
    {
      id: "rodelaAnswer",
      name: "And the Sword",
      input: { stance: "stand" },
      tags: ["heavy"],
      internal: true,
      duration: 34,
      vel: [{ at: 3, x: 4.4 }, { at: 14, x: 0 }],
      friction: 0.9,
      hits: [hit(6, 11, bx(18, 34, 90, 52), 96, {
        fx: "slash",
        pushX: 9,
        knockdown: "soft",
        hitstun: 24,
        hitstop: 13,
        shake: 2.2,
        guardDamage: 60,
      })],
      desc: "The answer to a blow caught on the rodela: the shield turns it and the sword goes in behind it.",
      notation: "(automatic)",
      frames: [
        kf(0, { ...STANCE, shoulderB: 42, elbowB: 70, torso: -4, crouch: 0.28 }, "out"),
        kf(3, { ...STANCE, shoulderB: 92, elbowB: 20, shoulderF: 132, elbowF: -10, weapon: -30, torso: -14, offX: -2 }, "out"),
        kf(6, { ...STANCE, shoulderB: 60, elbowB: 44, shoulderF: 66, elbowF: 12, weapon: -10, torso: 24, hipF: 40, kneeF: 18, offX: 9 }, "out"),
        kf(16, { ...STANCE, shoulderF: 48, elbowF: 50, weapon: 22, torso: 12, offX: 4 }, "inOut"),
        kf(34, { ...STANCE }),
      ],
    },
    {
      id: "toledo",
      name: "Toledo",
      input: { button: "C", motion: "dp", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 28,
      duration: 38,
      vel: [{ at: 4, x: 1.6, y: 9.2 }, { at: 20, x: 0 }],
      airborne: true,
      friction: 0.94,
      invuln: [{ from: 3, to: 9, kind: "strike" }],
      hits: [hit(5, 13, bx(16, 50, 60, 80), 72, {
        fx: "slash",
        pushX: 6,
        launch: [2, 9.5],
        knockdown: "launch",
        hitstun: 22,
        hitstop: 10,
        shake: 1.8,
        guardDamage: 56,
      })],
      desc: "Comes up off the back foot with the blade going first. His only invulnerable frames, and the guard damage on it means even a clean block costs them.",
      notation: "→↓↘ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, crouch: 0.58, shoulderF: -20, elbowF: 40, weapon: 6, shoulderB: 30, elbowB: 92, torso: 16, hipF: 30, kneeF: 64, hipB: -28, kneeB: 70 }, "out"),
        kf(5, { ...STANCE, free: 1, shoulderF: 128, elbowF: -18, weapon: -28, shoulderB: 62, elbowB: 46, torso: -12, hipF: 22, kneeF: 20, hipB: -32, kneeB: 26, offY: 3 }, "out"),
        kf(13, { ...STANCE, free: 1, shoulderF: 158, elbowF: -26, weapon: -44, torso: -20, hipF: 30, kneeF: 40, hipB: -24, kneeB: 44 }, "inOut"),
        kf(25, { ...STANCE, free: 1, shoulderF: 66, elbowF: 30, weapon: 22, torso: 6, hipF: 34, kneeF: 48, hipB: -24, kneeB: 42 }, "inOut"),
        kf(38, { ...STANCE }),
      ],
    },
    {
      id: "horse",
      name: "The Horses",
      input: { button: "B", motion: "hcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 28,
      duration: 52,
      resourceCost: 1,
      resourceMin: 1,
      vel: [{ at: 8, x: 10.5 }, { at: 30, x: 0 }],
      friction: 0.9,
      meterGain: 14,
      // Sixteen horses came ashore and every account on both sides makes them
      // the thing nobody had a prepared answer for in the first year. Armour
      // rather than invulnerability on the run-up: he goes through one thing
      // and pays full price for the second, which is what a charge should be.
      armor: [{ from: 6, to: 22, hits: 1, damageScale: 0.35 }],
      propsAt: [{ from: 4, to: 40, show: ["horse"] }],
      hits: [hit(14, 22, bx(14, 26, 104, 66), 82, {
        fx: "blunt",
        pushX: 12,
        knockdown: "hard",
        hitstun: 24,
        hitstop: 12,
        shake: 2.4,
        guardDamage: 58,
      })],
      desc: "Comes up out of nothing at a canter and rides them down. Shrugs off the first thing that hits him on the way in, and blocking it is barely better than not.",
      notation: "←↙↓↘→ + B (1 Tlaxcala)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, torso: -6, shoulderF: 30, elbowF: 66, weapon: 44, shoulderB: 40, elbowB: 76, hipF: 24, kneeF: 24, hipB: -22, kneeB: 30, offY: 26 }, "out"),
        kf(14, { ...STANCE, torso: 16, head: -6, shoulderF: 74, elbowF: 10, weapon: -6, shoulderB: 34, elbowB: 62, hipF: 30, kneeF: 28, hipB: -26, kneeB: 34, offX: 4, offY: 28 }, "out"),
        kf(22, { ...STANCE, torso: 22, head: -8, shoulderF: 58, elbowF: 26, weapon: 8, hipF: 32, kneeF: 30, offX: 5, offY: 28 }, "inOut"),
        kf(34, { ...STANCE, torso: 10, shoulderF: 40, elbowF: 56, weapon: 32, hipF: 26, kneeF: 26, offY: 24 }, "inOut"),
        kf(42, { ...STANCE, free: 1, torso: 14, hipF: 40, kneeF: 58, hipB: -28, kneeB: 50, offX: 3, offY: 10 }, "in"),
        kf(52, { ...STANCE }),
      ],
    },
    {
      id: "horseEx",
      name: "The Horses EX",
      input: { button: "S", motion: "hcf", stance: ["stand", "crouch"] },
      tags: ["special", "ex"],
      priority: 36,
      duration: 62,
      meterCost: 50,
      vel: [{ at: 8, x: 11.5 }, { at: 42, x: 0 }],
      friction: 0.9,
      armor: [{ from: 6, to: 34, hits: 2, damageScale: 0.3 }],
      propsAt: [{ from: 4, to: 50, show: ["horse"] }],
      hits: [
        hit(14, 20, bx(14, 26, 104, 66), 52, { group: 1, fx: "blunt", pushX: 3, hitstun: 19, hitstop: 7, guardDamage: 42 }),
        hit(30, 38, bx(16, 30, 100, 62), 76, {
          group: 2,
          fx: "slash",
          pushX: 13,
          knockdown: "hard",
          hitstun: 25,
          hitstop: 14,
          shake: 2.6,
          guardDamage: 60,
        }),
      ],
      desc: "EX. Rides through them, turns at the far end and comes back over the top with the sword. Two hits, two hits of armour, and it costs meter instead of a pip.",
      notation: "←↙↓↘→ + S (50 meter)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, torso: -6, shoulderF: 30, elbowF: 66, weapon: 44, shoulderB: 40, elbowB: 76, hipF: 24, kneeF: 24, hipB: -22, kneeB: 30, offY: 26 }, "out"),
        kf(14, { ...STANCE, torso: 16, head: -6, shoulderF: 74, elbowF: 10, weapon: -6, hipF: 30, kneeF: 28, offX: 4, offY: 28 }, "out"),
        kf(24, { ...STANCE, torso: 4, head: -4, shoulderF: 156, elbowF: -20, weapon: -46, shoulderB: 46, elbowB: 60, hipF: 26, kneeF: 26, offX: -2, offY: 28 }, "inOut"),
        kf(30, { ...STANCE, torso: 26, head: -8, shoulderF: 62, elbowF: 8, weapon: -14, shoulderB: 30, elbowB: 58, hipF: 34, kneeF: 30, offX: 6, offY: 28 }, "out"),
        kf(42, { ...STANCE, torso: 10, shoulderF: 40, elbowF: 56, weapon: 32, hipF: 26, kneeF: 26, offY: 24 }, "inOut"),
        kf(50, { ...STANCE, free: 1, torso: 14, hipF: 40, kneeF: 58, hipB: -28, kneeB: 50, offX: 3, offY: 10 }, "in"),
        kf(62, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- skill
    {
      id: "interpreter",
      name: "The Interpreter",
      input: { buttons: ["A", "C"], stance: ["stand", "crouch"] },
      tags: ["skill"],
      priority: 18,
      duration: 48,
      friction: 0.78,
      resourceGain: 1,
      meterGain: 14,
      // The woman the Spanish called Dona Marina and the Nahua called
      // Malintzin. She was given to Cortes as a slave with nineteen other
      // women after a battle in Tabasco, spoke Nahuatl and Maya, and every
      // negotiation, every alliance and every surrender in the whole campaign
      // went through her mouth. The Florentine Codex draws her standing beside
      // him in almost every scene and speaking in most of them; without her
      // there is no Tlaxcalteca alliance and no conquest.
      //
      // She is not a prop here and there is no move named after her, because
      // she was not his instrument by choice. What the move is, is the
      // admission that he cannot get an ally in the room without somebody else
      // doing the talking - so this is the only way he refills his bar on
      // purpose, and it is forty-eight frames of him standing still, unarmed,
      // doing nothing but talk.
      vfx: [
        { at: 16, kind: "aura", x: 0, y: 56, scale: 1.5, color: "#d8563f" },
        { at: 30, kind: "spark", x: 12, y: 62, scale: 1, color: "#e8c46a" },
      ],
      desc: "SKILL. Nothing he does himself. He gets a pip of Tlaxcala because somebody standing beside him is doing the talking - and it costs him forty-eight frames in the open with the sword down.",
      notation: "A + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(12, { ...STANCE, torso: 4, head: 6, shoulderF: 8, elbowF: 34, weapon: 20, shoulderB: 26, elbowB: 54, hipF: 14, kneeF: 14, hipB: -16, kneeB: 22, offX: -2 }, "out"),
        kf(24, { ...STANCE, torso: 8, head: 10, shoulderF: 18, elbowF: 26, weapon: 14, shoulderB: 48, elbowB: 34, hipF: 12, kneeF: 10 }, "inOut"),
        kf(36, { ...STANCE, torso: 2, head: 4, shoulderF: 10, elbowF: 40, weapon: 24, shoulderB: 30, elbowB: 58 }, "inOut"),
        kf(48, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- super
    {
      id: "super",
      name: "Thirteen Brigantines",
      input: { button: "S", motion: "dd", stance: ["stand", "crouch"] },
      tags: ["super"],
      priority: 60,
      duration: 112,
      meterCost: 100,
      superFreeze: 40,
      invuln: [{ from: 1, to: 14, kind: "strike" }],
      // The one decision in the whole campaign that was actually his and
      // actually decisive. He had thirteen small ships built at Tlaxcala,
      // sixty miles inland, carried over the mountains in pieces by eight
      // thousand porters, and launched on Lake Texcoco. They broke the canoe
      // fleet, cut the causeways, and turned a city that could be resupplied
      // by water into one that could not.
      //
      // So the super is the siege in order: the volley off the boats first,
      // then him coming up the causeway behind it. The bolts are the reason
      // the last hit lands - not the other way round.
      // Driven entirely by propsAt, with no `showProps`: a move-wide showProps
      // would have kept the crossbow in his fist through the ride and the
      // finish, and this move puts down one weapon to pick up another.
      propsAt: [
        { from: 8, to: 46, show: ["crossbow"], hide: ["rodela"] },
        { from: 58, to: 96, show: ["horse"] },
      ],
      projectiles: [
        { at: 14, kind: "quarrel", x: 30, y: 70, vx: 14, vy: 0, life: 90, box: { x: -16, y: -5, w: 32, h: 10 }, damage: 34, hitstun: 16, blockstun: 10, pushX: 1, chip: 7, fx: "pierce", hitstop: 5, scale: 1, color: LEATHER, trail: "#e8dcae" },
        { at: 22, kind: "quarrel", x: 30, y: 40, vx: 14, vy: 0, life: 90, box: { x: -16, y: -5, w: 32, h: 10 }, damage: 34, hitstun: 16, blockstun: 10, pushX: 1, chip: 7, fx: "pierce", hitstop: 5, scale: 1, color: LEATHER, trail: "#e8dcae" },
        { at: 30, kind: "quarrel", x: 30, y: 58, vx: 14, vy: 0, life: 90, box: { x: -16, y: -5, w: 32, h: 10 }, damage: 34, hitstun: 16, blockstun: 10, pushX: 1, chip: 7, fx: "pierce", hitstop: 5, scale: 1, color: LEATHER, trail: "#e8dcae" },
        { at: 38, kind: "quarrel", x: 30, y: 26, vx: 14, vy: 0, life: 90, box: { x: -16, y: -5, w: 32, h: 10 }, damage: 34, hitstun: 16, blockstun: 10, pushX: 1, chip: 7, fx: "pierce", hitstop: 5, scale: 1, color: LEATHER, trail: "#e8dcae" },
      ],
      vel: [
        { at: 60, x: 9.5 },
        { at: 82, x: 5 },
        { at: 96, x: 0 },
      ],
      friction: 0.92,
      hits: [
        // Up the causeway on the horse, through whatever the volley left.
        hit(66, 74, bx(12, 24, 108, 68), 62, {
          group: 1,
          fx: "blunt",
          pushX: 4,
          hitstun: 20,
          hitstop: 6,
          chip: 10,
          shake: 2,
          guardDamage: 60,
        }),
        // Off the horse and the whole length of the blade down through them.
        hit(94, 100, bx(18, 18, 96, 78), 150, {
          group: 2,
          guard: "overhead",
          fx: "slash",
          pushX: 12,
          knockdown: "hard",
          launch: [5, 8.5],
          hitstun: 26,
          hitstop: 18,
          shake: 3.2,
          guardDamage: 90,
        }),
      ],
      vfx: [
        { at: 2, kind: "super", x: 0, y: 52, scale: 2.5, color: "#e8c46a" },
        { at: 14, kind: "shot", x: 34, y: 70, scale: 1, color: "#e8dcae" },
        { at: 22, kind: "shot", x: 34, y: 40, scale: 1, color: "#e8dcae" },
        { at: 30, kind: "shot", x: 34, y: 58, scale: 1, color: "#e8dcae" },
        { at: 38, kind: "shot", x: 34, y: 26, scale: 1, color: "#e8dcae" },
        { at: 66, kind: "dust", x: -26, y: 4, scale: 2 },
        { at: 94, kind: "explode", x: 56, y: 44, scale: 1.4, color: "#e8c46a" },
      ],
      desc: "SUPER. Four bolts off the boats to clear the causeway, then he comes up it behind them on the horse and finishes it on foot with the sword. The volley is the reason the last one lands.",
      notation: "↓↓ + S (100 meter)",
      frames: [
        kf(0, { ...STANCE, crouch: 0.5, torso: -8 }, "out"),
        // The crossbow, and the volley off the water.
        kf(8, { ...STANCE, shoulderB: 78, elbowB: 20, shoulderF: 28, elbowF: 58, weapon: 38, torso: -6, head: -6, offX: -3 }, "out"),
        kf(14, { ...STANCE, shoulderB: 88, elbowB: 4, shoulderF: 26, elbowF: 56, weapon: 36, torso: -8, head: -8, offX: 1 }, "out"),
        kf(22, { ...STANCE, shoulderB: 70, elbowB: 8, shoulderF: 26, elbowF: 56, weapon: 36, torso: 2, head: -6, offX: 2 }, "out"),
        kf(30, { ...STANCE, shoulderB: 86, elbowB: 4, shoulderF: 26, elbowF: 56, weapon: 36, torso: -6, head: -8, offX: 1 }, "out"),
        kf(38, { ...STANCE, shoulderB: 72, elbowB: 10, shoulderF: 26, elbowF: 56, weapon: 36, torso: 0, head: -6, offX: 2 }, "out"),
        kf(50, { ...STANCE, shoulderB: 60, elbowB: 40, torso: 6, head: -2, offX: -2 }, "inOut"),
        // Up onto the horse and up the causeway.
        kf(58, { ...STANCE, torso: -6, shoulderF: 30, elbowF: 66, weapon: 44, shoulderB: 40, elbowB: 76, hipF: 24, kneeF: 24, hipB: -22, kneeB: 30, offY: 26 }, "out"),
        kf(66, { ...STANCE, torso: 18, head: -6, shoulderF: 72, elbowF: 10, weapon: -6, shoulderB: 34, elbowB: 62, hipF: 30, kneeF: 28, offX: 4, offY: 28 }, "out"),
        kf(78, { ...STANCE, torso: 20, head: -6, shoulderF: 58, elbowF: 26, weapon: 8, hipF: 32, kneeF: 30, offX: 4, offY: 28 }, "inOut"),
        // Down off it, and over the top.
        kf(88, { ...STANCE, free: 1, torso: 14, shoulderF: 40, elbowF: 54, weapon: 30, hipF: 42, kneeF: 60, hipB: -30, kneeB: 52, offX: 5, offY: 12 }, "in"),
        kf(92, { ...STANCE, shoulderF: 178, elbowF: -26, weapon: -58, shoulderB: 148, elbowB: 8, torso: -28, crouch: 0.3, hipB: -34, kneeB: 46, offX: -4, offY: 3 }, "in"),
        kf(94, { ...STANCE, shoulderF: 128, elbowF: -12, weapon: -26, shoulderB: 104, elbowB: -2, torso: 8, hipF: 34, kneeF: 14, offX: 6 }, "linear"),
        kf(100, { ...STANCE, shoulderF: 54, elbowF: 4, weapon: -12, shoulderB: 44, elbowB: 26, torso: 36, hipF: 46, kneeF: 28, crouch: 0.34, offX: 12 }, "out"),
        kf(106, { ...STANCE, shoulderF: 46, elbowF: 40, weapon: 24, torso: 20, crouch: 0.2, offX: 4 }, "inOut"),
        kf(112, { ...STANCE }),
      ],
    },
  ],
};

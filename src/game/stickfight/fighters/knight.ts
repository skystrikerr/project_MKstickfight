/**
 * Sir John Chandos (c. 1320-1370) - English knight, one of the twenty-five
 * founder Knights of the Garter, Constable of Aquitaine.
 *
 * Fought at Crecy and stood at the Black Prince's shoulder through Poitiers;
 * commanded at Auray in 1364, where Bertrand du Guesclin was taken prisoner.
 * Chroniclers on both sides wrote him up as the model of a knight, and Froissart
 * mourned him when he bled to death from a face wound at the bridge of Lussac.
 *
 * In game he is the heaviest and slowest fighter on the roster. A full harness
 * of plate lets him walk through a jab to land a longsword cut, and his Vow
 * fills while he is being beaten - the more punishment he eats, the closer the
 * unblockable Oathbreaker gets.
 */

import type { FighterDef } from "../types";
import { bx, guardClips, hit, kf, universalMoves } from "./builders";

const STEEL = "#c6cfd8";
const DARK_STEEL = "#8b959f";
/**
 * Chandos bore "Or, a pile gules" - a red wedge driven down a gold field - and
 * the Garter blue is the ribbon of the order he helped found in 1348. Those
 * three are his whole palette; nothing here is invented heraldry.
 */
const OR = "#e0b64a";
const GULES = "#b02a24";
const GARTER = "#2f4f8f";
const GOLD = "#d4b25c";

/**
 * Vom Tag with a shield: the longsword carried back over the sword shoulder
 * where it is out of the shield's way and already loaded for a cut, the heater
 * held low and forward across the body.
 */
const STANCE = {
  torso: 6,
  head: -2,
  hipF: 13,
  kneeF: 16,
  hipB: -16,
  kneeB: 28,
  shoulderF: 62,
  elbowF: 96,
  shoulderB: 28,
  elbowB: 84,
  weapon: 76,
};

const guard = { shoulderB: 62, elbowB: 78 };

export const KNIGHT: FighterDef = {
  id: "knight",
  name: "John Chandos",
  title: "Knight of the Garter",
  era: "Poitiers, 1356",
  bio: "Founder Knight of the Garter and Constable of Aquitaine. Fought at Crécy, held the Prince's right at Poitiers, took du Guesclin prisoner at Auray. Blind in one eye from a hunting accident and wholly unbothered by it.",
  archetype: "Armoured Bruiser",
  difficulty: 2,
  strengths: ["Armour on half his kit", "Huge damage per hit", "Gets stronger while losing"],
  weaknesses: ["Slowest walk in the roster", "No projectile", "Enormous recovery on whiffs"],
  winQuote: "Nobly done. Now yield, and be ransomed like a Christian.",
  palette: {
    body: "#e6e2db",
    outline: "#16151a",
    accent: GULES,
    cloth: GARTER,
    metal: STEEL,
    aura: "#7fa8ff",
  },
  stats: {
    health: 1160,
    walkF: 2.0,
    walkB: 1.65,
    dashSpeed: 6.4,
    dashFrames: 18,
    backdashFrames: 26,
    jumpVel: 11.6,
    jumpFwd: 3.8,
    gravity: 0.68,
    weight: 1.3,
    airMoves: 1,
    doubleJump: false,
    airDash: false,
    width: 23,
    standHeight: 106,
    crouchHeight: 70,
    scale: 1.05,
  },
  stance: STANCE,
  // Heater shield across the body, sword carried above it in a hanging
  // guard so the riposte is already loaded.
  clips: guardClips({
    high: { torso: 2, head: -8, shoulderB: -12, elbowB: 102, shoulderF: 100, elbowF: 62, weapon: 58, hipF: 12, kneeF: 22, hipB: -18, kneeB: 34, offX: -3 },
    low: { torso: 8, head: -6, shoulderB: -26, elbowB: 110, shoulderF: 92, elbowF: 66, weapon: 54, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84, offX: -3 },
  }),
  resource: {
    name: "Vow",
    max: 100,
    start: 0,
    // The Vow is a promise made under punishment: it fills when he is hit and
    // when his guard is battered, never on its own.
    gainOnTakeHit: 7,
    gainOnBlocked: 2.5,
    gainOnHit: 1.5,
    color: GOLD,
  },
  props: [
    {
      id: "helm",
      attach: "head",
      // Bascinet: a pointed skull tapering back, a hinged visor with a breath
      // slot, and a mail aventail hanging off the rim onto the shoulders.
      parts: [
        // Skull, drawn out to a point over the crown and swept back.
        { geo: "poly", size: [-11, -4, -11, 3, -8, 9, -2, 12, 4, 11, 9, 6, 11, 0, 10, -5], pos: [0, 2], color: STEEL },
        // Aventail: mail curtain hanging off the rim onto the shoulders.
        { geo: "poly", size: [0, 2, -5, -6, -12, -11, -13, -1, -9, 5], pos: [-7, -5], color: DARK_STEEL, behind: true },
        // Visor: a plate closed over the whole face, snouted forward so a
        // lance point slides off it. The face never shows - that is the point
        // of a bascinet, and it is what makes him read as a wall.
        { geo: "poly", size: [-8, 7, 4, 7, 10, 1, 11, -4, 5, -10, -6, -10, -9, -3], pos: [1, -2], color: "#aab6c2", z: 0.8 },
        // Eye slot, cut across the brow.
        { geo: "poly", size: [-8, 1.4, 8, 2.2, 8, -1.4, -8, -1.4], pos: [1, 1], color: "#1d1f25", z: 0.9 },
        // Breaths: holes punched through the snout on the sword side.
        { geo: "disc", size: [0.85], pos: [7, -4], color: "#1d1f25", z: 0.9 },
        { geo: "disc", size: [0.85], pos: [6, -7], color: "#1d1f25", z: 0.9 },
        { geo: "disc", size: [0.85], pos: [2, -6], color: "#1d1f25", z: 0.9 },
        // Brow reinforce and the hinge rivet the visor swings on.
        { geo: "poly", size: [-10, 1.5, 10, 2.5, 10, -1, -10, -2], pos: [0, 6], color: GOLD, z: 0.85 },
        { geo: "disc", size: [1.5], pos: [-8, 0], color: GOLD, z: 0.95 },
      ],
    },
    {
      id: "sword",
      attach: "handF",
      // Longsword: a long straight blade with a fuller, a straight cross, a
      // hand-and-a-half grip and a wheel pommel.
      parts: [
        { geo: "blade", size: [70, 9, 0.3], pos: [48, 0], color: "#dbe3ea" },
        // Fuller running most of the length of the blade.
        { geo: "box", size: [54, 2.4], pos: [44, 0.4], color: "#a8b3bd" },
        // Ricasso and the cross-guard, with the ends turned slightly forward.
        { geo: "box", size: [7, 6], pos: [11, 0], color: "#b6c0c9" },
        { geo: "poly", size: [-2.5, -14, 2.5, -14, 3.5, 0, 2.5, 14, -2.5, 14, -3.5, 0], pos: [9, 0], color: GOLD },
        { geo: "disc", size: [2.2], pos: [9, 12.5], color: "#e2c877" },
        { geo: "disc", size: [2.2], pos: [9, -12.5], color: "#e2c877" },
        // Grip: leather over cord, with a rising wrap.
        { geo: "box", size: [16, 6], pos: [-1, 0], color: "#4b3524" },
        { geo: "box", size: [16, 1.6], pos: [-1, 1.6], color: "#63472f" },
        { geo: "box", size: [16, 1.6], pos: [-1, -1.6], color: "#63472f" },
        // Wheel pommel, counterweighting the whole thing.
        { geo: "disc", size: [4.4], pos: [-11, 0], color: GOLD },
        { geo: "disc", size: [1.7], pos: [-11, 0], color: "#8f7530" },
      ],
    },
    {
      id: "shield",
      attach: "forearmB",
      // Heater shield: flat across the top, curving to a point, bearing his
      // arms - Or, a pile gules. A gold field with a red wedge run down from
      // the chief to the point, exactly as it sits on his Garter stall plate.
      parts: [
        { geo: "poly", size: [-15, 22, 15, 22, 15, 4, 11, -10, 0, -24, -11, -10, -15, 4], pos: [12, 0], color: STEEL, z: 0.5 },
        { geo: "poly", size: [-13, 19, 13, 19, 13, 4, 9.5, -9, 0, -21, -9.5, -9, -13, 4], pos: [12, 0], color: OR, z: 0.6 },
        // The pile: broad at the top edge, driven to a point at the base.
        { geo: "poly", size: [-8, 19, 8, 19, 0, -20], pos: [12, 0], color: GULES, z: 0.7 },
        // Garter-blue ribbon buckled across the top of the shield.
        { geo: "box", size: [30, 4], pos: [12, 15], color: GARTER, z: 0.75 },
        // Rim studs down the straight edges.
        { geo: "disc", size: [1.5], pos: [-1, 20], color: GOLD, z: 0.8 },
        { geo: "disc", size: [1.5], pos: [25, 20], color: GOLD, z: 0.8 },
        { geo: "disc", size: [1.5], pos: [12, -21], color: GOLD, z: 0.8 },
      ],
    },
    {
      id: "harness",
      attach: "torso",
      // Cuirass with a raised centre ridge, articulated fauld hoops below it,
      // and big pauldrons that overlap the arms.
      parts: [
        { geo: "poly", size: [-14, -14, -12, 8, -6, 16, 6, 16, 12, 8, 14, -14, 8, -18, -8, -18], pos: [0, 3], color: "#d2dae1" },
        // Centre ridge - the reason a cut slides off instead of biting.
        { geo: "poly", size: [-2.5, 16, 2.5, 16, 3.5, -17, -3.5, -17], pos: [1, 3], color: "#eaf0f5", z: 0.2 },
        // Pauldrons, overlapping plates riding on the shoulders.
        { geo: "poly", size: [-9, -3, -8, 5, 1, 8, 8, 3, 7, -5, -2, -7], pos: [-6, 15], color: "#e0e7ed" },
        { geo: "poly", size: [-8, -3, -7, 4, 2, 7, 7, 2, 6, -5, -2, -6], pos: [4, 17], color: "#eef3f7", z: 0.3 },
        // Rondel guarding the armpit.
        { geo: "disc", size: [3.6], pos: [7, 9], color: GOLD, z: 0.4 },
        { geo: "disc", size: [1.5], pos: [7, 9], color: "#8f7530", z: 0.45 },
      ],
    },
    {
      id: "fauld",
      attach: "pelvis",
      // Articulated hoops over the hips, with a mail skirt showing beneath.
      parts: [
        { geo: "poly", size: [-14, 4, 14, 4, 12, -3, -12, -3], pos: [0, 4], color: "#c4ced7" },
        { geo: "poly", size: [-12, 3.5, 12, 3.5, 10, -3, -10, -3], pos: [0, -2], color: "#b0bac4" },
        { geo: "poly", size: [-10, 3, 10, 3, 8, -3, -8, -3], pos: [0, -7], color: "#9ea9b3" },
        // Mail hanging past the plate, front and back.
        { geo: "poly", size: [-8, 2, 8, 2, 6, -9, -6, -9], pos: [-4, -10], color: DARK_STEEL, behind: true },
        { geo: "poly", size: [-8, 2, 8, 2, 6, -9, -6, -9], pos: [5, -10], color: DARK_STEEL, behind: true },
        { geo: "box", size: [27, 2.6], pos: [0, 7], color: GOLD, z: 0.2 },
      ],
    },
    {
      id: "sabatons",
      attach: "footF",
      // Pointed steel over the instep, with a rowel spur behind the heel.
      parts: [
        { geo: "poly", size: [-4, 3, 11, 2, 15, -0.5, -4, -2], pos: [3, 1.5], color: "#c3ccd5" },
        { geo: "box", size: [5, 1.6], pos: [-6, 0], color: DARK_STEEL },
        { geo: "disc", size: [2.2], pos: [-9, 0], color: GOLD },
      ],
    },
    {
      id: "surcoat",
      attach: "neck",
      parts: [
        { geo: "box", size: [24, 6], pos: [-3, -2], color: GARTER, behind: true },
        { geo: "disc", size: [3.2], pos: [8, -1], color: GOLD },
      ],
      cloth: {
        segments: 4,
        segmentLength: 12,
        width: 21,
        endWidth: 15,
        color: GULES,
        lining: OR,
        gravity: 0.62,
        stiffness: 0.55,
        drift: -0.3,
      },
    },
  ],

  moves: [
    ...universalMoves({
      throwDamage: 145,
      backThrowDamage: 155,
      throwRange: 60,
      rollSpeed: 5.6,
      weaponIdle: { weapon: STANCE.weapon },
    }),

    // ---------------------------------------------------------------- normals
    {
      id: "5A",
      name: "Gauntlet",
      input: { button: "A", stance: "stand" },
      tags: ["light"],
      duration: 15,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [4, 14],
      hits: [hit(5, 7, bx(18, 52, 42, 22), 36, { blockstun: 11, hitstun: 15, fx: "blunt", pushX: 3.2 })],
      desc: "A steel fist to the face. Slower than most jabs, but it hurts and it chains into everything.",
      notation: "A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderB: 86, elbowB: 22, torso: 10, offX: 2 }),
        kf(7, { ...STANCE, shoulderB: 92, elbowB: 6, torso: 13, offX: 5 }),
        kf(11, { ...STANCE, shoulderB: 62, elbowB: 48, torso: 8 }, "inOut"),
        kf(15, { ...STANCE }),
      ],
    },
    {
      id: "5B",
      name: "Oberhau",
      input: { button: "B", stance: "stand" },
      tags: ["medium"],
      duration: 26,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [10, 24],
      hits: [hit(10, 13, bx(26, 40, 74, 48), 70, { fx: "slash", pushX: 5.4, hitstun: 19 })],
      desc: "A cut from above, shoulder to hip. Good reach and it cancels straight into a special.",
      notation: "B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: 148, elbowF: 20, weapon: 74, torso: -12, offX: -3 }, "inOut"),
        kf(10, { ...STANCE, shoulderF: 62, elbowF: 22, weapon: 6, torso: 24, hipF: 30, kneeF: 18, offX: 7 }, "out"),
        kf(16, { ...STANCE, shoulderF: 56, elbowF: 26, weapon: 4, torso: 20, offX: 5 }),
        kf(22, { ...STANCE, shoulderF: 50, elbowF: 52, torso: 10 }, "inOut"),
        kf(26, { ...STANCE }),
      ],
    },
    {
      id: "5C",
      name: "Zornhau",
      input: { button: "C", stance: "stand" },
      tags: ["heavy", "overhead"],
      duration: 38,
      cancelInto: ["special", "super"],
      cancelWindow: [18, 34],
      hits: [
        hit(18, 22, bx(20, 26, 82, 80), 106, {
          guard: "overhead",
          fx: "slash",
          knockdown: "hard",
          pushX: 7.5,
          shake: 1.8,
        }),
      ],
      desc: "The wrath cut - both hands, full body, straight down. Must be blocked standing and it knocks down hard.",
      notation: "C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(9, { ...STANCE, shoulderF: 172, elbowF: 6, shoulderB: 158, elbowB: 14, weapon: 92, torso: -20, hipB: -26, kneeB: 38, offX: -4 }, "inOut"),
        kf(18, { ...STANCE, shoulderF: 34, elbowF: 12, shoulderB: 40, elbowB: 16, weapon: -8, torso: 34, hipF: 38, kneeF: 26, hipB: -20, kneeB: 44, offX: 8 }, "out"),
        kf(26, { ...STANCE, shoulderF: 28, elbowF: 16, shoulderB: 36, elbowB: 20, weapon: -12, torso: 30, offX: 6 }),
        kf(33, { ...STANCE, shoulderF: 44, elbowF: 50, torso: 14 }, "inOut"),
        kf(38, { ...STANCE }),
      ],
    },
    {
      id: "2A",
      name: "Low Gauntlet",
      input: { button: "A", stance: "crouch" },
      tags: ["light", "low"],
      duration: 16,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [5, 15],
      hits: [hit(5, 7, bx(16, 20, 42, 22), 32, { guard: "low", blockstun: 11, hitstun: 14, pushX: 3 })],
      desc: "Quick low from the crouch. Must be blocked crouching and links into itself.",
      notation: "↓ + A",
      frames: [
        kf(0, { ...STANCE, crouch: 1, torso: 18, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84, ...guard }, "out"),
        kf(5, { ...STANCE, crouch: 1, torso: 22, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84, shoulderB: 104, elbowB: 8, offX: 4 }),
        kf(10, { ...STANCE, crouch: 1, torso: 20, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84, shoulderB: 78, elbowB: 42 }, "inOut"),
        kf(16, { ...STANCE, crouch: 1, torso: 18, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84, ...guard }),
      ],
    },
    {
      id: "2B",
      name: "Unterhau",
      input: { button: "B", stance: "crouch" },
      tags: ["medium", "low"],
      duration: 28,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [11, 26],
      hits: [hit(11, 14, bx(26, 12, 76, 30), 64, { guard: "low", fx: "slash", pushX: 5 })],
      desc: "A cut up from below the knee. Long, and it has to be blocked low.",
      notation: "↓ + B",
      frames: [
        kf(0, { ...STANCE, crouch: 1, torso: 16, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84 }, "out"),
        kf(6, { ...STANCE, crouch: 1, torso: 8, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84, shoulderF: 20, elbowF: 88, weapon: 96 }),
        kf(11, { ...STANCE, crouch: 1, torso: 26, hipF: 40, kneeF: 78, hipB: -26, kneeB: 88, shoulderF: 76, elbowF: 22, weapon: -14, offX: 8 }, "out"),
        kf(18, { ...STANCE, crouch: 1, torso: 24, hipF: 38, kneeF: 76, hipB: -24, kneeB: 86, shoulderF: 72, elbowF: 26, weapon: -10, offX: 6 }),
        kf(28, { ...STANCE, crouch: 1, torso: 16, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84 }),
      ],
    },
    {
      id: "2C",
      name: "Sabaton Sweep",
      input: { button: "C", stance: "crouch" },
      tags: ["heavy", "low"],
      duration: 34,
      cancelInto: ["special", "super"],
      cancelWindow: [15, 30],
      hits: [
        hit(14, 18, bx(18, 4, 80, 26), 84, {
          guard: "low",
          knockdown: "sweep",
          fx: "blunt",
          pushX: 6.4,
          shake: 1.3,
        }),
      ],
      desc: "Kicks the legs out with an armoured boot. Knocks down - his cleanest way into a wake-up.",
      notation: "↓ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 1, torso: 16, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84 }, "out"),
        kf(8, { ...STANCE, crouch: 1, torso: 10, hipF: 10, kneeF: 86, hipB: -30, kneeB: 92, shoulderF: 34, elbowF: 66 }),
        kf(15, { ...STANCE, crouch: 1, torso: 26, hipF: 74, kneeF: 12, hipB: -30, kneeB: 96, shoulderF: 30, elbowF: 60, offX: 5 }, "out"),
        kf(22, { ...STANCE, crouch: 1, torso: 22, hipF: 62, kneeF: 26, hipB: -26, kneeB: 90 }),
        kf(34, { ...STANCE, crouch: 1, torso: 16, hipF: 32, kneeF: 74, hipB: -22, kneeB: 84 }),
      ],
    },
    {
      id: "6B",
      name: "Shield Ram",
      input: { button: "B", dir: "f", stance: "stand" },
      tags: ["command"],
      priority: 10,
      duration: 32,
      armor: [{ from: 3, to: 15, hits: 1, damageScale: 0.3 }],
      vel: [{ at: 6, x: 4.2 }],
      friction: 0.86,
      cancelInto: ["special", "super"],
      cancelWindow: [13, 28],
      hits: [
        hit(11, 15, bx(22, 32, 56, 54), 76, {
          fx: "blunt",
          pushX: 8,
          hitstun: 22,
          knockdown: "crumple",
          shake: 1.6,
        }),
      ],
      desc: "Walks the heater shield through one hit and folds them over it. Crumples on contact.",
      notation: "→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, torso: -8, shoulderB: 72, elbowB: 44, hipB: -30, kneeB: 46, offX: -4 }),
        kf(11, { ...STANCE, torso: 26, shoulderB: 94, elbowB: 2, hipF: 38, kneeF: 22, hipB: -20, kneeB: 48, offX: 9 }, "out"),
        kf(18, { ...STANCE, torso: 22, shoulderB: 90, elbowB: 8, hipF: 32, kneeF: 20, offX: 6 }),
        kf(32, { ...STANCE }),
      ],
    },
    {
      id: "3C",
      name: "Cross Cut",
      input: { button: "C", dir: "df", stance: ["stand", "crouch"] },
      tags: ["command", "launcher"],
      priority: 14,
      duration: 36,
      cancelInto: ["special", "super"],
      cancelWindow: [14, 32],
      hits: [
        hit(11, 16, bx(14, 54, 60, 76), 78, {
          launch: [2.2, 12],
          knockdown: "launch",
          fx: "slash",
          hitstun: 26,
          shake: 1.4,
        }),
      ],
      desc: "Rising diagonal cut that puts them in the air. Chase it with a jump attack.",
      notation: "↘ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 0.5, hipF: 24, kneeF: 46, hipB: -20, kneeB: 52 }, "out"),
        kf(6, { ...STANCE, crouch: 0.7, torso: 14, shoulderF: 16, elbowF: 84, weapon: 92 }),
        kf(11, { ...STANCE, torso: -16, shoulderF: 146, elbowF: 12, weapon: 34, hipF: 20, kneeF: 12, offY: 4 }, "out"),
        kf(18, { ...STANCE, torso: -12, shoulderF: 138, elbowF: 16, weapon: 32, hipF: 16, kneeF: 10 }),
        kf(28, { ...STANCE, torso: 4, shoulderF: 70, elbowF: 56 }, "inOut"),
        kf(36, { ...STANCE }),
      ],
    },
    {
      // Forward and back sets. Forward takes space, back gives it up to buy
      // range or a hard read.
      id: "6A",
      name: "Half-Sword",
      input: { button: "A", dir: "f", stance: "stand" },
      tags: ["command", "light"],
      priority: 12,
      duration: 20,
      vel: [{ at: 2, x: 2.2 }],
      friction: 0.88,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [7, 18],
      hits: [hit(7, 9, bx(20, 60, 44, 26), 32, { guard: "high", fx: "blunt", pushX: 3, hitstun: 14, hitstop: 5 })],
      desc: "Grips the blade and drives the point in short. Fast, and it starts everything.",
      notation: "\u2192 + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderF: 74, elbowF: 74, weapon: 58, torso: -2, offX: -2 }, "out"),
        // Point driven straight in - the weapon angle unwinds as the arm
        // opens so the blade stays level instead of swinging up.
        kf(7, { ...STANCE, shoulderF: 92, elbowF: 8, weapon: 6, torso: 14, hipF: 24, kneeF: 16, offX: 7 }, "out"),
        kf(12, { ...STANCE, shoulderF: 84, elbowF: 34, weapon: 26, torso: 10, offX: 5 }, "inOut"),
        kf(20, { ...STANCE }),
      ],
    },
    {
      id: "6C",
      name: "Mordhau",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["command", "heavy"],
      priority: 12,
      duration: 40,
      armor: [{ from: 8, to: 18, hits: 1, damageScale: 0.35 }],
      vel: [{ at: 8, x: 5.4 }, { at: 26, x: 0 }],
      friction: 0.9,
      cancelInto: ["special", "super"],
      cancelWindow: [20, 36],
      hits: [hit(16, 20, bx(18, 22, 64, 68), 94, { guard: "mid", fx: "blunt", pushX: 17, hitstun: 24, hitstop: 12, knockdown: "wallbounce", shake: 2.2 })],
      desc: "Takes the blade in both hands and swings the pommel like a hammer. Walks through a hit.",
      notation: "\u2192 + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        // Inverted: blade gripped, crossguard and pommel leading.
        kf(8, { ...STANCE, shoulderF: 148, elbowF: -52, weapon: 196, torso: -12, hipB: -30, kneeB: 48, offX: -6 }, "out"),
        kf(16, { ...STANCE, shoulderF: 82, elbowF: 18, weapon: 210, torso: 30, hipF: 40, kneeF: 18, hipB: -26, kneeB: 24, offX: 12 }, "out"),
        kf(24, { ...STANCE, shoulderF: 74, elbowF: 26, weapon: 206, torso: 22, hipF: 28, kneeF: 24, offX: 8 }),
        kf(32, { ...STANCE, shoulderF: 68, elbowF: 60, weapon: 130, torso: 10, offX: 3 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },
    {
      id: "4A",
      name: "Cross Guard",
      input: { button: "A", dir: "b", stance: "stand" },
      tags: ["command", "light"],
      priority: 12,
      duration: 22,
      vel: [{ at: 1, x: -2.6 }],
      friction: 0.86,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [8, 20],
      hits: [hit(8, 10, bx(16, 52, 42, 30), 36, { guard: "mid", fx: "blunt", pushX: 6, hitstun: 15, hitstop: 6 })],
      desc: "Steps off and punches with the crossguard. Catches a walk-in behind a whiff.",
      notation: "\u2190 + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, torso: -6, shoulderF: 52, elbowF: 106, weapon: 96, hipB: -26, kneeB: 40, offX: -6 }, "out"),
        kf(8, { ...STANCE, torso: 8, shoulderF: 86, elbowF: 30, weapon: 44, hipF: 22, kneeF: 18, offX: -3 }, "out"),
        kf(14, { ...STANCE, torso: 2, shoulderF: 74, elbowF: 62, weapon: 64, offX: -4 }, "inOut"),
        kf(22, { ...STANCE }),
      ],
    },
    {
      id: "4B",
      name: "Zwerchhau",
      input: { button: "B", dir: "b", stance: "stand" },
      tags: ["command", "medium"],
      priority: 12,
      duration: 30,
      vel: [{ at: 1, x: -3.4 }],
      friction: 0.88,
      cancelInto: ["special", "super"],
      cancelWindow: [16, 27],
      hits: [hit(12, 15, bx(28, 66, 84, 28), 56, { guard: "high", fx: "slash", pushX: 7, hitstun: 18, hitstop: 8 })],
      desc: "The thwart cut - steps back and comes across at head height. Blocked standing.",
      notation: "\u2190 + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        // Hilt up by the head, blade horizontal, cutting across.
        kf(6, { ...STANCE, shoulderF: 150, elbowF: -30, weapon: 128, torso: -12, hipB: -28, kneeB: 42, offX: -8 }, "inOut"),
        kf(12, { ...STANCE, shoulderF: 128, elbowF: -8, weapon: 8, torso: 6, hipF: 24, kneeF: 14, offX: -5 }, "out"),
        kf(17, { ...STANCE, shoulderF: 120, elbowF: -4, weapon: 4, torso: 4, offX: -6 }),
        kf(23, { ...STANCE, shoulderF: 92, elbowF: 40, weapon: 48, torso: 0, offX: -4 }, "inOut"),
        kf(30, { ...STANCE }),
      ],
    },
    {
      id: "4C",
      name: "Sturzhau",
      input: { button: "C", dir: "b", stance: "stand" },
      tags: ["command", "heavy", "overhead"],
      priority: 12,
      duration: 44,
      cancelInto: ["special", "super"],
      cancelWindow: [26, 40],
      hits: [hit(20, 23, bx(14, 20, 70, 86), 106, { guard: "overhead", fx: "slash", pushX: 9, hitstun: 28, hitstop: 13, knockdown: "hard", shake: 2.4 })],
      desc: "Full overhead cut from the roof guard. Slow, enormous, and blocked standing only.",
      notation: "\u2190 + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, shoulderF: 140, elbowF: -44, weapon: 92, torso: -10, offX: -5 }, "inOut"),
        // Vom Tag: blade straight up over the head.
        kf(15, { ...STANCE, shoulderF: 176, elbowF: -16, weapon: 96, torso: -20, hipB: -26, kneeB: 38, offY: 3, offX: -3 }, "out"),
        kf(20, { ...STANCE, shoulderF: 88, elbowF: 14, weapon: 70, torso: 32, hipF: 36, kneeF: 18, hipB: -12, kneeB: 32, offX: 6 }, "out"),
        kf(26, { ...STANCE, shoulderF: 80, elbowF: 18, weapon: 66, torso: 26, offX: 4 }),
        kf(36, { ...STANCE, shoulderF: 70, elbowF: 62, weapon: 78, torso: 8 }, "inOut"),
        kf(44, { ...STANCE }),
      ],
    },
    {
      id: "jA",
      name: "Air Gauntlet",
      input: { button: "A", stance: "air" },
      tags: ["light", "air"],
      duration: 20,
      airborne: true,
      landCancel: true,
      landRecovery: 3,
      cancelInto: ["medium", "heavy", "special"],
      cancelWindow: [6, 18],
      hits: [hit(6, 11, bx(14, 32, 46, 32), 40, { fx: "blunt", pushX: 3, hitstun: 15 })],
      desc: "A short punch down from the jump. Beats other people's jump-ins by being armoured metal.",
      notation: "(air) A",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 44, hipB: -24, kneeB: 40 }, "out"),
        kf(6, { ...STANCE, free: 1, shoulderB: 106, elbowB: 22, torso: 14, hipF: 28, kneeF: 40 }),
        kf(13, { ...STANCE, free: 1, shoulderB: 72, elbowB: 52, torso: 8, hipF: 30, kneeF: 42 }, "inOut"),
        kf(20, { ...STANCE, free: 1, hipF: 32, kneeF: 44, hipB: -24, kneeB: 40 }),
      ],
    },
    {
      id: "jB",
      name: "Falling Cut",
      input: { button: "B", stance: "air" },
      tags: ["medium", "air"],
      duration: 28,
      airborne: true,
      landCancel: true,
      landRecovery: 5,
      hits: [hit(8, 16, bx(20, 8, 70, 52), 70, { fx: "slash", pushX: 4.6, hitstun: 20 })],
      desc: "Cuts down through the jump arc. Stays live long enough to hit late.",
      notation: "(air) B",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 30, kneeF: 40, hipB: -22, kneeB: 38 }, "out"),
        kf(4, { ...STANCE, free: 1, shoulderF: 158, elbowF: 10, weapon: 80, torso: -14 }),
        kf(8, { ...STANCE, free: 1, shoulderF: 58, elbowF: 26, weapon: 8, torso: 26, hipF: 38, kneeF: 34 }, "out"),
        kf(18, { ...STANCE, free: 1, shoulderF: 52, elbowF: 30, weapon: 6, torso: 22 }),
        kf(28, { ...STANCE, free: 1, hipF: 30, kneeF: 40, hipB: -22, kneeB: 38 }),
      ],
    },
    {
      id: "jC",
      name: "Dead Weight",
      input: { button: "C", stance: "air" },
      tags: ["heavy", "air", "overhead"],
      duration: 32,
      airborne: true,
      landCancel: true,
      landRecovery: 10,
      vel: [{ at: 6, y: -5, mode: "add" }],
      hits: [
        hit(8, 20, bx(-6, -8, 62, 48), 96, {
          guard: "overhead",
          fx: "blunt",
          knockdown: "hard",
          pushX: 5.5,
          shake: 2,
        }),
      ],
      desc: "Drops all eighty pounds of harness straight down, sword first. Crushes low blocks.",
      notation: "(air) C",
      frames: [
        kf(0, { ...STANCE, free: 1 }, "out"),
        kf(5, { ...STANCE, free: 1, torso: -24, shoulderF: 166, elbowF: 4, weapon: 86, hipF: 42, kneeF: 62, hipB: -30, kneeB: 60 }),
        kf(9, { ...STANCE, free: 1, torso: 32, shoulderF: 20, elbowF: 22, weapon: -20, hipF: 18, kneeF: 18, hipB: -14, kneeB: 22 }, "out"),
        kf(32, { ...STANCE, free: 1, torso: 26, shoulderF: 24, elbowF: 26, weapon: -16 }),
      ],
    },
    {
      id: "dashAttack",
      name: "Couched Charge",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["command"],
      priority: 12,
      duration: 40,
      vel: [
        { at: 4, x: 8.4 },
        { at: 20, x: 0 },
      ],
      friction: 0.9,
      armor: [{ from: 3, to: 19, hits: 2, damageScale: 0.45 }],
      hits: [
        hit(11, 19, bx(18, 24, 68, 62), 96, {
          fx: "slash",
          pushX: 10,
          knockdown: "hard",
          hitstun: 24,
          shake: 2,
        }),
      ],
      desc: "Charges with the sword levelled, walking through two hits on the way in. Hard knockdown.",
      notation: "→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, torso: 18, shoulderF: 78, elbowF: 8, weapon: -10, hipB: -32, kneeB: 46, offX: -3 }),
        kf(11, { ...STANCE, torso: 28, shoulderF: 84, elbowF: 2, weapon: -14, hipF: 42, kneeF: 24, hipB: -26, kneeB: 56, offX: 7 }, "out"),
        kf(26, { ...STANCE, torso: 24, shoulderF: 80, elbowF: 6, weapon: -12, hipF: 30, kneeF: 32 }),
        kf(40, { ...STANCE }),
      ],
    },

    // --------------------------------------------------------------- specials
    {
      id: "zwerch",
      name: "Zwerchhau",
      input: { button: "B", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 20,
      duration: 40,
      armor: [{ from: 5, to: 14, hits: 1, damageScale: 0.4 }],
      vel: [
        { at: 4, x: 5 },
        { at: 20, x: 0 },
      ],
      friction: 0.9,
      meterGain: 8,
      hits: [
        hit(13, 17, bx(22, 44, 78, 42), 88, {
          fx: "slash",
          pushX: 8,
          hitstun: 24,
          knockdown: "crumple",
          shake: 1.6,
        }),
      ],
      desc: "The thwart cut: hilt up, flat blade, straight through whatever they were about to throw at you.",
      notation: "↓↘→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: 152, elbowF: 44, weapon: 40, torso: -14, offX: -3 }, "inOut"),
        kf(13, { ...STANCE, shoulderF: 122, elbowF: 8, weapon: -66, torso: 22, hipF: 34, kneeF: 20, offX: 8 }, "out"),
        kf(22, { ...STANCE, shoulderF: 112, elbowF: 12, weapon: -70, torso: 18, offX: 5 }),
        kf(32, { ...STANCE, shoulderF: 66, elbowF: 50, torso: 8 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },
    {
      id: "zwerchEx",
      name: "Zwerchhau EX",
      input: { button: "S", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special", "ex"],
      priority: 28,
      duration: 52,
      meterCost: 50,
      armor: [{ from: 3, to: 26, hits: 3, damageScale: 0.25 }],
      vel: [
        { at: 3, x: 6 },
        { at: 18, x: 4.5 },
        { at: 32, x: 0 },
      ],
      friction: 0.92,
      hits: [
        hit(11, 15, bx(22, 44, 78, 42), 60, { group: 1, fx: "slash", pushX: 2, hitstun: 20, hitstop: 6 }),
        hit(23, 27, bx(22, 34, 82, 56), 56, { group: 2, fx: "slash", pushX: 2, hitstun: 20, hitstop: 6 }),
        hit(35, 40, bx(20, 26, 86, 66), 82, {
          group: 3,
          fx: "slash",
          pushX: 11,
          knockdown: "hard",
          hitstun: 26,
          shake: 2.2,
        }),
      ],
      desc: "EX. Three cuts, three hits of armour. Nothing short of a super stops him walking through this.",
      notation: "↓↘→ + S  (50 meter)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderF: 148, elbowF: 46, weapon: 42, torso: -12, offX: -3 }, "inOut"),
        kf(11, { ...STANCE, shoulderF: 120, elbowF: 8, weapon: -64, torso: 22, offX: 7 }, "out"),
        kf(18, { ...STANCE, shoulderF: 40, elbowF: 60, weapon: 68, torso: -8 }, "inOut"),
        kf(23, { ...STANCE, shoulderF: 118, elbowF: 10, weapon: -60, torso: 24, offX: 7 }, "out"),
        kf(30, { ...STANCE, shoulderF: 166, elbowF: 8, weapon: 88, torso: -20, offX: -4 }, "inOut"),
        kf(35, { ...STANCE, shoulderF: 32, elbowF: 14, weapon: -12, torso: 34, hipF: 40, kneeF: 26, offX: 10 }, "out"),
        kf(44, { ...STANCE, shoulderF: 40, elbowF: 44, torso: 18, offX: 5 }, "inOut"),
        kf(52, { ...STANCE }),
      ],
    },
    {
      id: "mordhau",
      name: "Mordhau",
      input: { button: "C", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special", "overhead"],
      priority: 22,
      duration: 48,
      friction: 0.9,
      hits: [
        hit(20, 25, bx(16, 30, 62, 74), 116, {
          guard: "overhead",
          fx: "blunt",
          pushX: 8,
          knockdown: "crumple",
          hitstun: 30,
          hitstop: 14,
          shake: 2.4,
        }),
      ],
      vfx: [{ at: 20, kind: "spark", x: 40, y: 60, scale: 1.2 }],
      desc: "Takes the blade in both hands and swings the pommel like a hammer. Overhead, and it folds them in half.",
      notation: "↓↙← + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, shoulderF: 64, elbowF: 96, shoulderB: 60, elbowB: 92, weapon: 176, torso: -6 }, "inOut"),
        kf(15, { ...STANCE, shoulderF: 170, elbowF: 30, shoulderB: 158, elbowB: 34, weapon: 186, torso: -24, hipB: -28, kneeB: 40, offX: -5 }, "inOut"),
        kf(20, { ...STANCE, shoulderF: 30, elbowF: 20, shoulderB: 36, elbowB: 24, weapon: 196, torso: 36, hipF: 40, kneeF: 28, hipB: -22, kneeB: 48, offX: 9 }, "out"),
        kf(30, { ...STANCE, shoulderF: 26, elbowF: 24, shoulderB: 32, elbowB: 28, weapon: 194, torso: 32, offX: 7 }),
        kf(40, { ...STANCE, shoulderF: 50, elbowF: 66, weapon: 100, torso: 12 }, "inOut"),
        kf(48, { ...STANCE }),
      ],
    },
    {
      id: "trample",
      name: "Trample",
      input: { button: "B", motion: "hcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 24,
      duration: 46,
      armor: [{ from: 4, to: 24, hits: 2, damageScale: 0.35 }],
      vel: [
        { at: 3, x: 7.5 },
        { at: 26, x: 0 },
      ],
      friction: 0.93,
      hits: [
        hit(10, 16, bx(18, 24, 60, 62), 52, { group: 1, fx: "blunt", pushX: 3, hitstun: 18, hitstop: 6 }),
        hit(24, 30, bx(20, 30, 66, 60), 84, {
          group: 2,
          fx: "blunt",
          pushX: 12,
          knockdown: "hard",
          hitstun: 26,
          shake: 2.2,
        }),
      ],
      desc: "Puts his shoulder down and runs them over, then throws them off it. Armoured the whole way.",
      notation: "←↙↓↘→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, torso: 30, shoulderB: 30, elbowB: 20, shoulderF: 30, elbowF: 60, hipB: -34, kneeB: 48, offX: 2 }, "out"),
        kf(10, { ...STANCE, torso: 34, shoulderB: 24, elbowB: 14, hipF: 40, kneeF: 26, hipB: -28, kneeB: 54, offX: 8 }),
        kf(20, { ...STANCE, torso: 32, shoulderB: 26, elbowB: 16, hipF: 34, kneeF: 30, offX: 6 }),
        kf(24, { ...STANCE, torso: 6, shoulderB: 96, elbowB: 4, shoulderF: 88, elbowF: 8, weapon: -20, hipF: 24, kneeF: 20, offX: 4 }, "out"),
        kf(34, { ...STANCE, torso: 2, shoulderB: 80, elbowB: 20, shoulderF: 74, elbowF: 22 }, "inOut"),
        kf(46, { ...STANCE }),
      ],
    },
    {
      id: "cross",
      name: "Cross Guard",
      input: { button: "C", motion: "dp", stance: ["stand", "crouch"] },
      tags: ["special", "launcher"],
      priority: 26,
      duration: 48,
      airborne: true,
      invuln: [{ from: 1, to: 9, kind: "strike" }],
      vel: [
        { at: 1, x: 2.2, y: 12 },
        { at: 28, y: -1, mode: "add" },
      ],
      hits: [
        hit(4, 9, bx(4, 56, 62, 80), 88, {
          launch: [2, 11],
          knockdown: "launch",
          fx: "slash",
          hitstun: 26,
          shake: 1.9,
        }),
        hit(10, 18, bx(2, 68, 56, 68), 42, { group: 2, launch: [1.6, 5.5], fx: "slash", hitstun: 18 }),
      ],
      desc: "Comes up off the back foot with the shield leading and the sword behind it. Invincible on startup - his reversal.",
      notation: "→↓↘ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 0.6, hipF: 22, kneeF: 52, hipB: -20, kneeB: 56 }, "out"),
        kf(3, { ...STANCE, free: 1, torso: -18, shoulderB: 150, elbowB: -6, shoulderF: 130, elbowF: 30, weapon: 60, hipF: 30, kneeF: 30, hipB: -26, kneeB: 40 }, "out"),
        kf(13, { ...STANCE, free: 1, torso: -24, shoulderB: 164, elbowB: -12, shoulderF: 148, elbowF: 22, weapon: 54, hipF: 26, kneeF: 26 }),
        kf(32, { ...STANCE, free: 1, torso: -4, shoulderB: 110, elbowB: 24, shoulderF: 96, elbowF: 44, hipF: 30, kneeF: 40 }, "inOut"),
        kf(48, { ...STANCE, free: 1 }),
      ],
    },
    {
      id: "crossEx",
      name: "Cross Guard EX",
      input: { button: "S", motion: "dp", stance: ["stand", "crouch"] },
      tags: ["special", "ex", "launcher"],
      priority: 32,
      duration: 54,
      meterCost: 50,
      airborne: true,
      invuln: [{ from: 1, to: 16, kind: "strike" }],
      vel: [
        { at: 1, x: 2.8, y: 13.6 },
        { at: 32, y: -1, mode: "add" },
      ],
      hits: [
        hit(3, 9, bx(4, 54, 68, 88), 80, { launch: [2, 12], knockdown: "launch", fx: "slash", hitstun: 28, shake: 2.1 }),
        hit(11, 19, bx(2, 68, 62, 78), 38, { group: 2, launch: [1.4, 5], fx: "slash" }),
        hit(21, 28, bx(2, 78, 60, 70), 52, { group: 3, launch: [2.2, 4], fx: "slash", knockdown: "hard" }),
      ],
      desc: "EX. Fully invincible, higher, and it drags them up with him before letting go.",
      notation: "→↓↘ + S  (50 meter)",
      frames: [
        kf(0, { ...STANCE, crouch: 0.6, hipF: 22, kneeF: 52 }, "out"),
        kf(3, { ...STANCE, free: 1, torso: -20, shoulderB: 156, elbowB: -8, shoulderF: 138, elbowF: 26, weapon: 56, spin: -6 }, "out"),
        kf(16, { ...STANCE, free: 1, torso: -28, shoulderB: 170, elbowB: -14, shoulderF: 156, elbowF: 18, weapon: 50, spin: -18 }),
        kf(36, { ...STANCE, free: 1, torso: -6, shoulderB: 114, elbowB: 22, shoulderF: 100, elbowF: 42, spin: 0 }, "inOut"),
        kf(54, { ...STANCE, free: 1 }),
      ],
    },
    {
      id: "oath",
      name: "Oathbreaker",
      input: { button: "B", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 24,
      duration: 60,
      resourceCost: 60,
      resourceMin: 60,
      friction: 0.92,
      armor: [{ from: 6, to: 30, hits: 2, damageScale: 0.2 }],
      vel: [
        { at: 8, x: 4 },
        { at: 30, x: 0 },
      ],
      hits: [
        hit(30, 36, bx(14, 12, 78, 92), 150, {
          guard: "unblockable",
          fx: "slash",
          pushX: 13,
          knockdown: "hard",
          hitstun: 34,
          hitstop: 18,
          shake: 3,
        }),
      ],
      vfx: [
        { at: 6, kind: "aura", x: 0, y: 46, scale: 1.6, color: "#d4b25c" },
        { at: 30, kind: "explode", x: 46, y: 44, scale: 1.1 },
      ],
      desc: "Spends 60 Vow on one cut that cannot be blocked. Slow, armoured, and it ends whatever they were planning.",
      notation: "↓↙← + B  (60 Vow)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, torso: -10, shoulderF: 80, elbowF: 74, shoulderB: 70, elbowB: 78, weapon: 84, crouch: 0.3 }, "inOut"),
        kf(20, { ...STANCE, torso: -26, shoulderF: 178, elbowF: 4, shoulderB: 164, elbowB: 10, weapon: 96, hipB: -32, kneeB: 44, offX: -6 }, "inOut"),
        kf(30, { ...STANCE, torso: 40, shoulderF: 22, elbowF: 10, shoulderB: 30, elbowB: 14, weapon: -18, hipF: 46, kneeF: 28, hipB: -24, kneeB: 56, offX: 12 }, "out"),
        kf(42, { ...STANCE, torso: 34, shoulderF: 20, elbowF: 16, weapon: -20, offX: 8 }),
        kf(52, { ...STANCE, torso: 14, shoulderF: 44, elbowF: 56 }, "inOut"),
        kf(60, { ...STANCE }),
      ],
    },
    {
      id: "brace",
      name: "Brace",
      input: { buttons: ["A", "C"], stance: ["stand", "crouch"] },
      tags: ["skill", "stance"],
      priority: 18,
      duration: 32,
      armor: [{ from: 4, to: 26, hits: 3, damageScale: 0.15 }],
      friction: 0.88,
      holdLoop: { from: 12, to: 22, button: "S", maxFrames: 110 },
      holdRelease: "braceCounter",
      desc: "SKILL. Sets the shield and plants. Eats up to three hits for almost nothing while you hold Guard, and every one of them feeds the Vow. Let go for a counter.",
      notation: "A + C, hold S",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, torso: -6, shoulderB: 94, elbowB: 8, shoulderF: 26, elbowF: 84, weapon: 100, crouch: 0.4, hipF: 22, kneeF: 46, hipB: -20, kneeB: 52 }),
        kf(12, { ...STANCE, torso: -8, shoulderB: 98, elbowB: 4, shoulderF: 24, elbowF: 86, weapon: 102, crouch: 0.45, hipF: 22, kneeF: 48, hipB: -20, kneeB: 54 }),
        kf(22, { ...STANCE, torso: -6, shoulderB: 96, elbowB: 6, shoulderF: 26, elbowF: 84, weapon: 100, crouch: 0.42, hipF: 22, kneeF: 46, hipB: -20, kneeB: 52 }),
        kf(32, { ...STANCE }),
      ],
    },
    {
      id: "braceCounter",
      name: "Answer",
      input: { stance: "stand" },
      tags: ["skill"],
      internal: true,
      duration: 34,
      vel: [{ at: 3, x: 5.5 }],
      friction: 0.88,
      hits: [
        hit(7, 12, bx(20, 28, 66, 62), 92, {
          fx: "slash",
          pushX: 9,
          knockdown: "hard",
          hitstun: 26,
          shake: 1.9,
        }),
      ],
      desc: "",
      frames: [
        kf(0, { ...STANCE, torso: -8, shoulderB: 98, elbowB: 4, shoulderF: 24, elbowF: 86, weapon: 102, crouch: 0.45 }, "out"),
        kf(7, { ...STANCE, torso: 30, shoulderB: 88, elbowB: 0, shoulderF: 46, elbowF: 12, weapon: -16, hipF: 40, kneeF: 24, hipB: -22, kneeB: 50, offX: 9 }, "out"),
        kf(16, { ...STANCE, torso: 24, shoulderB: 76, elbowB: 18, shoulderF: 44, elbowF: 20, offX: 5 }),
        kf(34, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- super
    {
      id: "super",
      name: "Vow Fulfilled",
      input: { button: "S", motion: "dd", stance: ["stand", "crouch"] },
      tags: ["super"],
      priority: 60,
      duration: 104,
      meterCost: 100,
      superFreeze: 42,
      invuln: [{ from: 1, to: 14, kind: "strike" }],
      armor: [{ from: 14, to: 76, hits: 4, damageScale: 0.1 }],
      vel: [
        { at: 6, x: 7 },
        { at: 32, x: 4.5 },
        { at: 60, x: 3 },
        { at: 78, x: 0 },
      ],
      friction: 0.94,
      hits: [
        hit(16, 20, bx(20, 36, 78, 54), 62, { group: 1, fx: "slash", pushX: 1, hitstun: 22, hitstop: 6 }),
        hit(28, 32, bx(20, 30, 82, 62), 50, { group: 2, fx: "slash", pushX: 1, hitstun: 20, hitstop: 5 }),
        hit(40, 44, bx(20, 40, 84, 50), 50, { group: 3, fx: "slash", pushX: 1, hitstun: 20, hitstop: 5 }),
        hit(52, 56, bx(20, 26, 84, 66), 50, { group: 4, fx: "slash", pushX: 1, hitstun: 20, hitstop: 5 }),
        hit(70, 78, bx(14, 10, 92, 96), 148, {
          group: 5,
          fx: "blunt",
          pushX: 12,
          knockdown: "hard",
          launch: [5.5, 8],
          hitstop: 18,
          shake: 3.2,
        }),
      ],
      vfx: [
        { at: 2, kind: "super", x: 0, y: 50, scale: 2.5, color: "#7fa8ff" },
        { at: 70, kind: "explode", x: 54, y: 44, scale: 1.5 },
      ],
      desc: "SUPER. Four cuts he does not stop for, then he reverses the sword and drives the pommel through the guard.",
      notation: "↓↓ + S  (100 meter)",
      frames: [
        kf(0, { ...STANCE, torso: -16, shoulderF: 150, elbowF: 30, weapon: 72, crouch: 0.4 }, "out"),
        kf(10, { ...STANCE, torso: 24, shoulderF: 62, elbowF: 24, weapon: 4, hipF: 38, kneeF: 22, offX: 6 }, "out"),
        kf(16, { ...STANCE, torso: 28, shoulderF: 56, elbowF: 20, weapon: 0, hipF: 42, kneeF: 20, offX: 8 }),
        kf(24, { ...STANCE, torso: 12, shoulderF: 148, elbowF: 36, weapon: 66, hipF: 20, kneeF: 34 }, "inOut"),
        kf(28, { ...STANCE, torso: 28, shoulderF: 116, elbowF: 8, weapon: -62, hipF: 42, kneeF: 20, offX: 8 }, "out"),
        kf(36, { ...STANCE, torso: 12, shoulderF: 40, elbowF: 70, weapon: 78, hipF: 20, kneeF: 34 }, "inOut"),
        kf(40, { ...STANCE, torso: 26, shoulderF: 76, elbowF: 18, weapon: -8, hipF: 42, kneeF: 22, offX: 8 }, "out"),
        kf(48, { ...STANCE, torso: 14, shoulderF: 156, elbowF: 26, weapon: 74, hipF: 20, kneeF: 34 }, "inOut"),
        kf(52, { ...STANCE, torso: 30, shoulderF: 48, elbowF: 16, weapon: -6, hipF: 44, kneeF: 20, offX: 9 }, "out"),
        kf(62, { ...STANCE, torso: -4, shoulderF: 70, elbowF: 92, shoulderB: 64, elbowB: 90, weapon: 180 }, "inOut"),
        kf(70, { ...STANCE, torso: -30, shoulderF: 180, elbowF: 2, shoulderB: 168, elbowB: 8, weapon: 192, hipB: -32, kneeB: 46, offX: -5 }, "inOut"),
        kf(78, { ...STANCE, torso: 42, shoulderF: 18, elbowF: 8, shoulderB: 26, elbowB: 12, weapon: 200, hipF: 48, kneeF: 30, hipB: -24, kneeB: 58, offX: 12 }, "out"),
        kf(92, { ...STANCE, torso: 30, shoulderF: 34, elbowF: 40, weapon: 140, offX: 6 }, "inOut"),
        kf(104, { ...STANCE }),
      ],
    },
  ],
};

/**
 * Hydarnes - commander of the Immortals.
 *
 * The Immortals were not called that because they could not be killed. They
 * were called that because the corps was held at exactly ten thousand: a man
 * who fell was replaced the same day, so the unit never got smaller and never
 * looked like it was losing. That is the mechanic. Ranks refill on their own,
 * whatever is happening to him, and everything he does at range is paid for
 * out of them.
 *
 * The kit is Herodotus's: wicker shield, short spear with a counterweight at
 * the butt, bow and quiver on the back, akinakes at the hip. Four weapons and
 * a different range for each, which is why he is the one fighter who has an
 * answer at every distance and a great answer at none of them.
 */

import type { FighterDef } from "../types";
import { bx, guardClips, hit, kf, universalMoves } from "./builders";

const BRONZE = "#c9963f";
const WICKER = "#b8925a";
const CLOTH = "#7a3f6b";
const STEEL = "#c3ccd6";
const SILVER = "#d8dde3";

const STANCE = {
  torso: 4,
  head: -2,
  hipF: 18,
  kneeF: 20,
  hipB: -22,
  kneeB: 32,
  // Spear underhand at the hip, shield up on the lead arm. A sparabara stands
  // behind the wicker and lets the spear do the reaching.
  //
  // A prop's world angle is roughly (forearm angle - 90 + weapon angle). The
  // lead arm is set so the pavise comes out near vertical - a man-high wicker
  // shield lying over at thirty degrees reads as a stretcher - and the spear
  // angle is set so the point sits at chest height rather than above his head.
  shoulderF: 20,
  elbowF: 74,
  shoulderB: 52,
  elbowB: 44,
  weaponBack: -2,
  crouch: 0.12,
};

const IDLE_ARMS = { shoulderF: 20, elbowF: 74, shoulderB: 52, elbowB: 44, weaponBack: -2 };

export const PERSIAN: FighterDef = {
  id: "persian",
  name: "Hydarnes",
  title: "Commander of the Immortals",
  era: "Thermopylae, 480 BC",
  bio: "Son of one of the six who put Darius on the throne, and the man Xerxes trusted with the ten thousand. At Thermopylae he was the one sent up the goat track in the dark with the whole corps behind him - the flanking march that got round the pass and made the last stand a last stand. Herodotus gives him the manoeuvre and then loses interest in him entirely.",
  archetype: "Zoner / Ranks",
  difficulty: 3,
  strengths: ["An answer at every range", "Ranks come back on their own", "The wicker holds a line he can shoot from"],
  weaknesses: ["Nothing he has ends a round on its own", "Spending Ranks faster than they fill leaves him empty", "Loses the pure close-range fight"],
  winQuote: "There are ten thousand of us. You have met one.",
  palette: {
    body: "#c99a6e",
    outline: "#150f0a",
    accent: CLOTH,
    cloth: CLOTH,
    metal: STEEL,
    aura: "#e0b45c",
  },
  stats: {
    health: 1000,
    walkF: 2.9,
    walkB: 2.6,
    dashSpeed: 8.4,
    dashFrames: 15,
    backdashFrames: 19,
    jumpVel: 11.9,
    jumpFwd: 4.6,
    gravity: 0.63,
    weight: 1.02,
    airMoves: 1,
    doubleJump: false,
    airDash: false,
    width: 20,
    standHeight: 103,
    crouchHeight: 63,
    scale: 1.01,
  },
  stance: STANCE,
  clips: guardClips({
    // Same rule as the stance: the lead arm has to keep a man-high pavise
    // standing up. Fold the elbow the way a round shield wants and the wicker
    // lies over into a stretcher, which is worse in the guard than anywhere
    // else, because the guard is where it is on screen longest.
    high: { torso: 0, head: -7, shoulderF: 26, elbowF: 76, shoulderB: 48, elbowB: 56, weaponBack: 8, hipF: 16, kneeF: 24, hipB: -22, kneeB: 34, offX: -3 },
    low: { torso: 8, head: -5, shoulderF: 14, elbowF: 80, shoulderB: 40, elbowB: 60, weaponBack: 12, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88, offX: -3 },
  }),
  resource: {
    name: "Ranks",
    max: 4,
    start: 4,
    // The whole idea of the corps: the gap closes by itself. He never has to
    // stop to rearm, he only has to spend slower than it fills - which at
    // roughly a pip every three seconds is a real constraint at range.
    regen: 0.0055,
    color: BRONZE,
    pips: true,
  },
  props: [
    {
      id: "tiara",
      attach: "head",
      // The soft cap Herodotus calls a tiara, worn wrapped across the face -
      // he notes the Persians at Plataea had no armour worth the name on the
      // head, which is most of why the fight went how it went.
      parts: [
        { geo: "poly", size: [-11, -5, -10, 6, 0, 12, 10, 6, 11, -5], pos: [0, 3], color: CLOTH },
        { geo: "box", size: [23, 3.4], pos: [0, -3], color: "#5f2f53" },
        { geo: "poly", size: [-6, 5, 6, 4, 5, -6, -6, -5], pos: [-9, -8], color: CLOTH },
        { geo: "box", size: [4, 16], pos: [-11, -14], rot: 8, color: "#5f2f53" },
        { geo: "disc", size: [2.2], pos: [0, 9], color: BRONZE, z: 0.5 },
        // Curled beard, which is how every Persian on every relief is shown.
        { geo: "poly", size: [-6, 7, 5, 6, 4, -11, -5, -9], pos: [-6, -10], color: "#2a1d14" },
        { geo: "disc", size: [2.2], pos: [-9, -17], color: "#3a2a1d" },
        { geo: "disc", size: [2.2], pos: [-4, -19], color: "#2a1d14" },
        { geo: "box", size: [10, 1.4], pos: [4, -7], rot: -6, color: "#1c120c", z: 0.4 },
      ],
    },
    {
      id: "robe",
      attach: "torso",
      // Scale corselet under a sleeved robe. The scales are real and the robe
      // over them is the part that made Greek writers call the army soft.
      parts: [
        { geo: "poly", size: [-13, -16, 13, -16, 14, 7, 8, 16, -9, 16, -14, 7], pos: [0, 3], color: CLOTH },
        // Scales, showing at the chest where the robe is open.
        { geo: "box", size: [17, 2.6], pos: [0, 9], color: "#8f8578" },
        { geo: "box", size: [17, 2.6], pos: [0, 4], color: "#a09585" },
        { geo: "box", size: [16, 2.6], pos: [0, -1], color: "#8f8578" },
        { geo: "box", size: [15, 2.6], pos: [0, -6], color: "#a09585" },
        // Embroidered border down the front and along the hem.
        { geo: "box", size: [3.4, 32], pos: [-9, 0], color: BRONZE },
        { geo: "box", size: [24, 3], pos: [0, -14], color: BRONZE },
        { geo: "poly", size: [-8, 7, 8, 6, 7, -8, -8, -7], pos: [-12, 2], rot: 6, color: "#5f2f53", behind: true },
      ],
      cloth: {
        segments: 3,
        segmentLength: 11,
        width: 22,
        endWidth: 18,
        color: "#5f2f53",
        lining: BRONZE,
        gravity: 0.48,
        stiffness: 0.52,
        drift: -0.2,
      },
    },
    {
      id: "quiver",
      attach: "back",
      // Gorytos: the combined bow case and quiver a Persian wore on the hip.
      // It stays on him whether he is shooting or not.
      parts: [
        { geo: "poly", size: [-7, 18, 7, 16, 6, -16, -7, -17], pos: [-4, -2], rot: -14, color: "#6b4a30", behind: true },
        { geo: "box", size: [15, 3], pos: [-4, 10], rot: -14, color: BRONZE, behind: true },
        { geo: "box", size: [15, 3], pos: [-4, -8], rot: -14, color: BRONZE, behind: true },
        { geo: "box", size: [2, 12], pos: [-8, 20], rot: -8, color: "#8a7048", behind: true },
        { geo: "box", size: [2, 12], pos: [-4, 21], rot: -2, color: "#a08a58", behind: true },
        { geo: "box", size: [2, 12], pos: [0, 20], rot: 4, color: "#8a7048", behind: true },
      ],
    },
    {
      id: "trousers",
      attach: "pelvis",
      parts: [
        { geo: "poly", size: [-13, 4, 13, 3.5, 13, -4, -13, -4.5], pos: [0, 1], color: "#5f2f53" },
        { geo: "box", size: [26, 2], pos: [0, 2], color: BRONZE, z: 0.2 },
        { geo: "box", size: [8, 17], pos: [-8, -10], rot: 4, color: CLOTH },
        { geo: "box", size: [8, 17], pos: [8, -10], rot: -4, color: "#6b3760" },
        { geo: "box", size: [8, 2], pos: [-8, -16], color: BRONZE },
        { geo: "box", size: [8, 2], pos: [8, -16], color: BRONZE },
      ],
    },
    {
      id: "spear",
      attach: "handB",
      // Short spear, and the thing that makes it Persian is the counterweight
      // at the butt - a silver pomegranate for the corps and a golden apple
      // for the thousand who guarded the king. He carries the apple.
      parts: [
        { geo: "cyl", size: [2.8, 88], pos: [26, 0], rot: 90, color: "#8a6238" },
        { geo: "poly", size: [0, 0, -15, 3.4, -19, 2.6, -19, -2.6, -15, -3.4], pos: [80, 0], color: STEEL },
        { geo: "poly", size: [0, 0, -13, 1.1, -17, 0.9, -17, -0.9, -13, -1.1], pos: [79, 0], color: "#eef3f8" },
        { geo: "box", size: [6, 5], pos: [58, 0], color: "#8f979f" },
        { geo: "box", size: [18, 5], pos: [8, 0], color: "#3f2f1c" },
        { geo: "box", size: [18, 1.6], pos: [8, 1.8], color: "#8a6a42" },
        // The apple.
        { geo: "disc", size: [6], pos: [-20, 0], color: BRONZE },
        { geo: "disc", size: [2.4], pos: [-21, 2], color: "#f0d18a", z: 0.1 },
        { geo: "box", size: [3, 5], pos: [-14, 0], color: "#a87c33" },
      ],
    },
    {
      id: "spara",
      attach: "forearmF",
      // Sparabara: a man-high wicker pavise. It stops arrows and it does not
      // stop a spear, which is the entire story of the Persian wars.
      parts: [
        { geo: "poly", size: [-14, 36, 14, 36, 14, -36, -14, -36], pos: [10, 0], color: WICKER, z: 0.5 },
        // The weave, drawn as bands rather than a texture.
        { geo: "box", size: [28, 2.4], pos: [10, 26], color: "#9a7846", z: 0.52 },
        { geo: "box", size: [28, 2.4], pos: [10, 13], color: "#9a7846", z: 0.52 },
        { geo: "box", size: [28, 2.4], pos: [10, 0], color: "#9a7846", z: 0.52 },
        { geo: "box", size: [28, 2.4], pos: [10, -13], color: "#9a7846", z: 0.52 },
        { geo: "box", size: [28, 2.4], pos: [10, -26], color: "#9a7846", z: 0.52 },
        { geo: "box", size: [3.4, 72], pos: [1, 0], color: "#7a5f3a", z: 0.54 },
        { geo: "box", size: [3.4, 72], pos: [19, 0], color: "#7a5f3a", z: 0.54 },
        { geo: "box", size: [30, 3], pos: [10, 35], color: "#6b4a30", z: 0.56 },
        { geo: "box", size: [30, 3], pos: [10, -35], color: "#6b4a30", z: 0.56 },
      ],
    },
    {
      id: "bow",
      attach: "handF",
      conditional: true,
      // Recurve, strung. Short enough to shoot from behind the wicker and
      // from a horse, which is what the whole army was built around.
      parts: [
        { geo: "poly", size: [-3, 40, 3, 40, 6, 20, 4, 0, 6, -20, 3, -40, -3, -40, 0, -20, 2, 0, 0, 20], pos: [12, 0], color: "#6b4a30" },
        { geo: "poly", size: [-2.4, 8, 2.4, 8, 3, -8, -2.4, -8], pos: [10, 40], rot: -20, color: BRONZE },
        { geo: "poly", size: [-2.4, 8, 2.4, 8, 3, -8, -2.4, -8], pos: [10, -40], rot: 20, color: BRONZE },
        { geo: "box", size: [1.4, 92], pos: [4, 0], color: "#e8e0cc" },
        { geo: "box", size: [5, 16], pos: [12, 0], color: "#4a3524" },
      ],
    },
    {
      id: "akinakes",
      attach: "handB",
      conditional: true,
      // Short straight dagger with a flat lobed pommel, worn on the right hip
      // in a scabbard strapped to the thigh. Persian and nothing else.
      parts: [
        { geo: "poly", size: [0, 0, -30, 5, -34, 4, -34, -4, -30, -5], pos: [42, 0], color: STEEL },
        { geo: "poly", size: [0, 0, -28, 1.4, -32, 1.2, -32, -1.2, -28, -1.4], pos: [41, 0], color: "#eef3f8" },
        { geo: "box", size: [4, 13], pos: [9, 0], color: BRONZE },
        { geo: "cyl", size: [2.6, 14], pos: [1, 0], rot: 90, color: "#3f2f1c" },
        { geo: "poly", size: [-7, 4, 7, 4, 8, -4, -8, -4], pos: [-8, 0], color: BRONZE },
        { geo: "disc", size: [2], pos: [-8, 0], color: "#f0d18a", z: 0.1 },
      ],
    },
  ],

  moves: [
    ...universalMoves({
      throwDamage: 118,
      backThrowDamage: 130,
      throwRange: 60,
      rollSpeed: 7.8,
      weaponIdle: IDLE_ARMS,
    }),

    // ---------------------------------------------------------------- normals
    {
      id: "5A",
      name: "Spear Jab",
      input: { button: "A", stance: "stand" },
      tags: ["light"],
      duration: 13,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [4, 12],
      followUps: [{ button: "A", move: "6A", from: 4, to: 10, string: "Second Rank" }],
      hits: [hit(4, 6, bx(26, 54, 62, 18), 26, { fx: "pierce", hitstun: 14, blockstun: 10, pushX: 2.4 })],
      desc: "Short underhand jab from behind the wicker, without showing anything else.",
      notation: "A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderB: 78, elbowB: 6, weaponBack: -4, torso: 12, offX: 3 }),
        kf(9, { ...STANCE, shoulderB: 62, elbowB: 30, weaponBack: 10, torso: 8 }, "inOut"),
        kf(13, { ...STANCE }),
      ],
    },
    {
      id: "5B",
      name: "Level Thrust",
      input: { button: "B", stance: "stand" },
      tags: ["medium"],
      duration: 21,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [8, 19],
      followUps: [{ button: "C", move: "5C", from: 8, to: 18, string: "Push Through" }],
      hits: [hit(8, 11, bx(34, 46, 100, 22), 50, { fx: "pierce", pushX: 4.4, hitstun: 18 })],
      desc: "The spear put out level at full arm. His main poke and the range he wants to live at.",
      notation: "B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderB: 34, elbowB: 62, weaponBack: 46, torso: -8, offX: -3 }),
        kf(8, { ...STANCE, shoulderB: 82, elbowB: 0, weaponBack: -6, torso: 18, hipF: 30, offX: 7 }, "out"),
        kf(14, { ...STANCE, shoulderB: 66, elbowB: 26, weaponBack: 12, torso: 10 }, "inOut"),
        kf(21, { ...STANCE }),
      ],
    },
    {
      id: "5C",
      name: "Two-Hand Drive",
      input: { button: "C", stance: "stand" },
      tags: ["heavy"],
      duration: 30,
      cancelInto: ["special", "super"],
      cancelWindow: [14, 26],
      hits: [
        hit(13, 17, bx(30, 40, 112, 30), 82, {
          fx: "pierce",
          pushX: 8,
          knockdown: "soft",
          hitstun: 23,
          hitstop: 10,
          shake: 1.8,
        }),
      ],
      desc: "Drops the shield, takes the shaft in both hands and drives it. The longest thing he has that is not shot.",
      notation: "C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderB: 24, elbowB: 74, weaponBack: 56, shoulderF: 40, elbowF: 66, torso: -14, hipB: -30, kneeB: 44, offX: -5 }, "inOut"),
        kf(13, { ...STANCE, shoulderB: 88, elbowB: -4, weaponBack: -10, shoulderF: 76, elbowF: 10, torso: 24, hipF: 40, kneeF: 20, offX: 9 }, "out"),
        kf(21, { ...STANCE, shoulderB: 72, elbowB: 20, weaponBack: 6, shoulderF: 46, elbowF: 60, torso: 14, offX: 4 }),
        kf(30, { ...STANCE }),
      ],
    },
    {
      id: "2A",
      name: "Low Jab",
      input: { button: "A", stance: "crouch" },
      tags: ["light", "low"],
      duration: 13,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [4, 12],
      hits: [hit(4, 6, bx(24, 12, 56, 16), 22, { guard: "low", fx: "pierce", hitstun: 13, blockstun: 10, pushX: 2 })],
      desc: "Puts the point along the floor from behind the wicker.",
      notation: "↓ + A",
      frames: [
        kf(0, { ...STANCE, crouch: 1, torso: 16, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88 }, "out"),
        kf(4, { ...STANCE, crouch: 1, torso: 22, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88, shoulderB: 66, elbowB: 10, weaponBack: -8, offX: 4 }),
        kf(9, { ...STANCE, crouch: 1, torso: 18, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88, shoulderB: 54, elbowB: 34 }, "inOut"),
        kf(13, { ...STANCE, crouch: 1, torso: 16, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88 }),
      ],
    },
    {
      id: "2B",
      name: "Foot Thrust",
      input: { button: "B", stance: "crouch" },
      tags: ["medium", "low"],
      duration: 22,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [9, 20],
      hits: [hit(8, 11, bx(30, 8, 92, 20), 48, { guard: "low", fx: "pierce", pushX: 3.6, hitstun: 17 })],
      desc: "The same thrust taken down onto the lead foot.",
      notation: "↓ + B",
      frames: [
        kf(0, { ...STANCE, crouch: 1, torso: 16, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88 }, "out"),
        kf(4, { ...STANCE, crouch: 1, torso: 8, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88, shoulderB: 30, elbowB: 60, weaponBack: 44 }),
        kf(8, { ...STANCE, crouch: 1, torso: 26, hipF: 44, kneeF: 84, hipB: -24, kneeB: 88, shoulderB: 58, elbowB: -6, weaponBack: -22, offX: 8 }, "out"),
        kf(15, { ...STANCE, crouch: 1, torso: 20, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88, shoulderB: 48, elbowB: 30, weaponBack: 8 }, "inOut"),
        kf(22, { ...STANCE, crouch: 1, torso: 16, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88 }),
      ],
    },
    {
      id: "2C",
      name: "Butt Sweep",
      input: { button: "C", stance: "crouch" },
      tags: ["heavy", "low"],
      duration: 29,
      cancelInto: ["special", "super"],
      cancelWindow: [13, 25],
      hits: [hit(11, 15, bx(20, 2, 84, 20), 70, { guard: "low", knockdown: "sweep", fx: "blunt", pushX: 5.2 })],
      desc: "Turns the shaft round and takes their ankles out with the apple.",
      notation: "↓ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 1, torso: 16, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88 }, "out"),
        kf(5, { ...STANCE, crouch: 1, torso: 4, hipF: 30, kneeF: 74, hipB: -26, kneeB: 84, shoulderB: 14, elbowB: 80, weaponBack: 74, offX: -4 }, "inOut"),
        kf(11, { ...STANCE, crouch: 1.12, spin: -10, torso: 30, hipF: 54, kneeF: 86, hipB: -28, kneeB: 92, shoulderB: 46, elbowB: 0, weaponBack: -34, offX: 8 }, "out"),
        kf(21, { ...STANCE, crouch: 1, torso: 20, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88, shoulderB: 42, elbowB: 38, weaponBack: 8 }, "inOut"),
        kf(29, { ...STANCE, crouch: 1, torso: 16, hipF: 34, kneeF: 78, hipB: -24, kneeB: 88 }),
      ],
    },
    {
      id: "6A",
      name: "Wicker Shove",
      input: { button: "A", dir: "f", stance: "stand" },
      tags: ["command", "light"],
      priority: 12,
      duration: 17,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [6, 15],
      vel: [{ at: 4, x: 3.4 }, { at: 10, x: 0 }],
      friction: 0.88,
      hits: [hit(6, 9, bx(14, 46, 48, 44), 32, { fx: "blunt", pushX: 4.4, hitstun: 16, hitstop: 6 })],
      desc: "Walks the pavise into them. It is a wall being moved forward, which is the only way this army ever advanced.",
      notation: "→ + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, shoulderF: 18, elbowF: 108, torso: -2, offX: -2 }),
        kf(6, { ...STANCE, shoulderF: 62, elbowF: 52, torso: 24, hipF: 40, kneeF: 24, offX: 8 }, "out"),
        kf(12, { ...STANCE, shoulderF: 40, elbowF: 84, torso: 12, offX: 4 }, "inOut"),
        kf(17, { ...STANCE }),
      ],
    },
    {
      id: "6B",
      name: "Overarm",
      input: { button: "B", dir: "f", stance: "stand" },
      tags: ["command", "medium", "overhead"],
      priority: 12,
      duration: 28,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [15, 25],
      hits: [hit(14, 17, bx(28, 38, 88, 50), 58, { guard: "overhead", fx: "pierce", pushX: 5, hitstun: 21, hitstop: 8 })],
      desc: "Takes the spear overarm and comes down past the guard. Blocked standing only.",
      notation: "→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(7, { ...STANCE, shoulderB: 148, elbowB: -30, weaponBack: -50, torso: -10, offX: -4 }, "inOut"),
        kf(14, { ...STANCE, shoulderB: 106, elbowB: -8, weaponBack: -30, torso: 26, hipF: 34, offX: 7 }, "out"),
        kf(21, { ...STANCE, shoulderB: 78, elbowB: 18, weaponBack: 0, torso: 16, offX: 3 }),
        kf(28, { ...STANCE }),
      ],
    },
    {
      id: "6C",
      name: "Hoist",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["command", "heavy", "launcher"],
      priority: 12,
      duration: 33,
      cancelInto: ["special", "super"],
      cancelWindow: [16, 29],
      hits: [
        hit(13, 17, bx(24, 26, 74, 74), 78, {
          launch: [2.4, 11.2],
          knockdown: "launch",
          fx: "pierce",
          hitstun: 25,
          hitstop: 10,
          shake: 1.8,
        }),
      ],
      desc: "Puts the point under them and lifts. Starts everything he has in the air.",
      notation: "→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, crouch: 0.55, shoulderB: 14, elbowB: 24, weaponBack: 34, torso: 6, hipF: 30, kneeF: 56, offX: -3 }, "inOut"),
        kf(13, { ...STANCE, shoulderB: 138, elbowB: -20, weaponBack: -66, shoulderF: 62, elbowF: 50, torso: -12, hipF: 22, kneeF: 10, offX: 5, offY: 3 }, "out"),
        kf(23, { ...STANCE, shoulderB: 96, elbowB: 12, weaponBack: -20, torso: 2, offX: 2 }),
        kf(33, { ...STANCE }),
      ],
    },
    {
      id: "4A",
      name: "Rim Cut",
      input: { button: "A", dir: "b", stance: "stand" },
      tags: ["command", "light"],
      priority: 12,
      duration: 15,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [6, 13],
      hits: [hit(5, 8, bx(12, 52, 40, 26), 28, { fx: "blunt", hitstun: 15, blockstun: 11, pushX: 3.4 })],
      desc: "Chops the top edge of the wicker up under the jaw while giving ground.",
      notation: "← + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, shoulderF: 6, elbowF: 112, torso: -4, offX: -3 }),
        kf(5, { ...STANCE, shoulderF: 66, elbowF: 62, torso: 14, offX: 2 }, "out"),
        kf(10, { ...STANCE, shoulderF: 42, elbowF: 92, torso: 6 }, "inOut"),
        kf(15, { ...STANCE }),
      ],
    },
    {
      id: "4B",
      name: "Give Ground",
      input: { button: "B", dir: "b", stance: "stand" },
      tags: ["command", "medium"],
      priority: 12,
      duration: 24,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [10, 22],
      hits: [hit(9, 12, bx(36, 44, 104, 24), 48, { fx: "pierce", pushX: 6.5, hitstun: 19, hitstop: 6 })],
      desc: "Steps back and puts the point out into the space they have to cross. Buys the range back.",
      notation: "← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, shoulderB: 30, elbowB: 62, weaponBack: 44, torso: -6, offX: -4 }),
        kf(9, { ...STANCE, shoulderB: 80, elbowB: -2, weaponBack: -8, torso: 12, hipB: -30, kneeB: 40, offX: -1 }, "out"),
        kf(17, { ...STANCE, shoulderB: 62, elbowB: 28, weaponBack: 12, torso: 4, offX: -3 }, "inOut"),
        kf(24, { ...STANCE }),
      ],
    },
    {
      id: "4C",
      name: "Set the Wicker",
      input: { button: "C", dir: "b", stance: "stand" },
      tags: ["command", "heavy", "overhead"],
      priority: 12,
      duration: 44,
      cancelInto: ["special", "super"],
      cancelWindow: [27, 40],
      armor: [{ from: 6, to: 19, hits: 1, damageScale: 0.5 }],
      hits: [hit(20, 24, bx(16, 22, 80, 84), 98, { guard: "overhead", fx: "blunt", pushX: 9, hitstun: 27, hitstop: 12, knockdown: "hard", shake: 2.3 })],
      desc: "Plants the pavise, takes a hit on it, and then brings the whole thing down on top of them. Standing block only.",
      notation: "← + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, crouch: 0.4, shoulderF: 14, elbowF: 120, torso: -6, hipF: 26, kneeF: 40, hipB: -30, kneeB: 46, offX: -4 }, "inOut"),
        kf(15, { ...STANCE, shoulderF: 152, elbowF: -34, torso: -22, hipB: -30, kneeB: 42, offY: 4, offX: -3 }, "out"),
        kf(20, { ...STANCE, shoulderF: 108, elbowF: 8, torso: 34, hipF: 42, kneeF: 20, offX: 8 }, "out"),
        kf(28, { ...STANCE, shoulderF: 70, elbowF: 56, torso: 24, offX: 4 }),
        kf(36, { ...STANCE, shoulderF: 40, elbowF: 84, torso: 12 }, "inOut"),
        kf(44, { ...STANCE }),
      ],
    },
    {
      id: "jA",
      name: "Air Jab",
      input: { button: "A", stance: "air" },
      tags: ["light", "air"],
      duration: 18,
      airborne: true,
      landCancel: true,
      landRecovery: 3,
      cancelInto: ["medium", "heavy", "special"],
      cancelWindow: [5, 16],
      hits: [hit(5, 10, bx(24, 30, 58, 24), 26, { fx: "pierce", hitstun: 14, pushX: 2.2 })],
      desc: "Short jab of the point on the way past.",
      notation: "(air) A",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 46 }, "out"),
        kf(5, { ...STANCE, free: 1, shoulderB: 74, elbowB: 6, weaponBack: -6, torso: 10 }),
        kf(12, { ...STANCE, free: 1, shoulderB: 58, elbowB: 34, weaponBack: 14, torso: 4 }, "inOut"),
        kf(18, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 46 }),
      ],
    },
    {
      id: "jB",
      name: "Air Thrust",
      input: { button: "B", stance: "air" },
      tags: ["medium", "air"],
      duration: 24,
      airborne: true,
      landCancel: true,
      landRecovery: 5,
      cancelInto: ["heavy", "special"],
      hits: [hit(7, 14, bx(30, 18, 90, 32), 52, { fx: "pierce", pushX: 3.6, hitstun: 18 })],
      desc: "Puts the spear out flat underneath him on the way down.",
      notation: "(air) B",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 44, hipB: -22, kneeB: 42 }, "out"),
        kf(4, { ...STANCE, free: 1, shoulderB: 26, elbowB: 66, weaponBack: 48, torso: -6 }),
        kf(8, { ...STANCE, free: 1, shoulderB: 68, elbowB: -6, weaponBack: -20, torso: 18, hipF: 38 }, "out"),
        kf(16, { ...STANCE, free: 1, shoulderB: 56, elbowB: 30, weaponBack: 10, torso: 6 }, "inOut"),
        kf(24, { ...STANCE, free: 1 }),
      ],
    },
    {
      id: "jC",
      name: "Falling Point",
      input: { button: "C", stance: "air" },
      tags: ["heavy", "air", "overhead"],
      duration: 27,
      airborne: true,
      landCancel: true,
      landRecovery: 7,
      hits: [
        hit(8, 17, bx(10, 2, 62, 54), 74, {
          guard: "overhead",
          fx: "pierce",
          knockdown: "soft",
          pushX: 4.4,
          shake: 1.5,
        }),
      ],
      desc: "Turns the point straight down and rides it in. His jump-in.",
      notation: "(air) C",
      frames: [
        kf(0, { ...STANCE, free: 1 }, "out"),
        kf(5, { ...STANCE, free: 1, torso: -16, shoulderB: 150, elbowB: -30, weaponBack: -46, hipF: 40, kneeF: 56 }),
        kf(8, { ...STANCE, free: 1, torso: 28, shoulderB: 104, elbowB: -4, weaponBack: -58, hipF: 14, kneeF: 18 }, "out"),
        kf(27, { ...STANCE, free: 1, torso: 22, shoulderB: 96, elbowB: 2, weaponBack: -52 }),
      ],
    },
    {
      id: "dashAttack",
      name: "Close the Gap",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["command"],
      priority: 12,
      duration: 31,
      vel: [
        { at: 3, x: 9.6 },
        { at: 16, x: 0 },
      ],
      friction: 0.9,
      hits: [hit(8, 12, bx(28, 30, 88, 44), 64, { fx: "pierce", pushX: 6.5, knockdown: "soft", hitstun: 20, shake: 1.3 })],
      desc: "Arrives behind the wicker with the point already out.",
      notation: "→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, torso: 22, crouch: 0.4, shoulderB: 28, elbowB: 66, weaponBack: 48, offX: -3 }),
        kf(8, { ...STANCE, torso: 28, crouch: 0.3, shoulderB: 84, elbowB: -4, weaponBack: -10, hipF: 44, kneeF: 24, offX: 9 }, "out"),
        kf(21, { ...STANCE, torso: 14, shoulderB: 62, elbowB: 32, weaponBack: 16, offX: 3 }, "inOut"),
        kf(31, { ...STANCE }),
      ],
    },

    // -------------------------------------------------------- five specials
    {
      id: "shoot",
      name: "Loose",
      input: { button: "B", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 20,
      duration: 32,
      resourceCost: 1,
      resourceMin: 1,
      showProps: ["bow"],
      hideProps: ["spara"],
      projectiles: [
        {
          at: 12,
          kind: "arrow",
          x: 46,
          y: 66,
          vx: 22,
          vy: 0,
          life: 70,
          box: { x: -22, y: -3, w: 44, h: 7 },
          damage: 42,
          hitstun: 18,
          blockstun: 12,
          chip: 4,
          pushX: 4,
          clashes: true,
          fx: "pierce",
          hitstop: 5,
          color: "#8a6a3f",
          trail: "#e0c88f",
        },
      ],
      desc: "One arrow, flat and fast. Costs a Rank, and the Ranks come back on their own - so this is a tap he can keep making as long as he does not get greedy.",
      notation: "↓↘→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: 88, elbowF: 4, shoulderB: 30, elbowB: 84, weaponBack: 60, torso: -4, offX: -2 }, "inOut"),
        kf(12, { ...STANCE, shoulderF: 90, elbowF: 0, shoulderB: 96, elbowB: 16, weaponBack: 40, torso: 4, hipF: 26, offX: 2 }, "out"),
        kf(22, { ...STANCE, shoulderF: 60, elbowF: 40, shoulderB: 70, elbowB: 40, torso: 2 }, "inOut"),
        kf(32, { ...STANCE }),
      ],
    },
    {
      id: "volley",
      name: "Blot Out the Sun",
      input: { button: "C", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 22,
      duration: 52,
      resourceCost: 2,
      resourceMin: 2,
      showProps: ["bow"],
      hideProps: ["spara"],
      // Three arrows on three different lines. Not faster than one arrow -
      // wider, so walking forward through it is a different problem.
      projectiles: [
        {
          at: 16, kind: "arrow", x: 44, y: 74, vx: 18, vy: 3.4, gravity: 0.13, life: 90,
          box: { x: -22, y: -3, w: 44, h: 7 },
          damage: 34, hitstun: 17, blockstun: 12, chip: 3, pushX: 3,
          clashes: true, fx: "pierce", hitstop: 4, color: "#8a6a3f", trail: "#e0c88f",
        },
        {
          at: 22, kind: "arrow", x: 44, y: 70, vx: 20, vy: 1.6, gravity: 0.08, life: 90,
          box: { x: -22, y: -3, w: 44, h: 7 },
          damage: 34, hitstun: 17, blockstun: 12, chip: 3, pushX: 3,
          clashes: true, fx: "pierce", hitstop: 4, color: "#8a6a3f", trail: "#e0c88f",
        },
        {
          at: 28, kind: "arrow", x: 44, y: 64, vx: 22, vy: 0, life: 80,
          box: { x: -22, y: -3, w: 44, h: 7 },
          damage: 34, hitstun: 17, blockstun: 12, chip: 3, pushX: 3,
          clashes: true, fx: "pierce", hitstop: 4, color: "#8a6a3f", trail: "#e0c88f",
        },
      ],
      desc: "Three arrows on three lines, high to flat. Costs two Ranks and leaves him standing still for a long time - the line about the sun was a boast, and boasts are expensive.",
      notation: "↓↘→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, shoulderF: 74, elbowF: 10, shoulderB: 24, elbowB: 88, weaponBack: 64, torso: -8, offX: -2 }, "inOut"),
        kf(16, { ...STANCE, shoulderF: 76, elbowF: 6, shoulderB: 92, elbowB: 18, torso: -6, offX: 1 }, "out"),
        kf(22, { ...STANCE, shoulderF: 86, elbowF: 2, shoulderB: 94, elbowB: 16, torso: 0, offX: 2 }, "out"),
        kf(28, { ...STANCE, shoulderF: 94, elbowF: -2, shoulderB: 96, elbowB: 14, torso: 6, offX: 2 }, "out"),
        kf(40, { ...STANCE, shoulderF: 60, elbowF: 44, shoulderB: 68, elbowB: 44, torso: 2 }, "inOut"),
        kf(52, { ...STANCE }),
      ],
    },
    {
      id: "akinakesCut",
      name: "Akinakes",
      input: { button: "A", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 24,
      duration: 25,
      showProps: ["akinakes"],
      hits: [
        hit(5, 8, bx(10, 48, 46, 30), 40, { group: 1, fx: "slash", pushX: 2, hitstun: 18, hitstop: 6 }),
        hit(10, 13, bx(8, 40, 48, 38), 50, {
          group: 2,
          fx: "pierce",
          pushX: 6,
          hitstun: 22,
          hitstop: 9,
        }),
      ],
      desc: "Lets the spear drop and takes the short blade out. Two cuts, close, fast, and the only thing he owns that likes being in there.",
      notation: "↓↙← + A",
      frames: [
        kf(0, { ...STANCE, crouch: 0.25 }, "out"),
        kf(5, { ...STANCE, shoulderB: 40, elbowB: 12, weaponBack: -10, shoulderF: 26, elbowF: 84, torso: 22, hipF: 30, offX: 5 }, "out"),
        kf(10, { ...STANCE, shoulderB: 92, elbowB: -10, weaponBack: -30, shoulderF: 22, elbowF: 88, torso: 30, hipF: 36, kneeF: 20, offX: 8 }, "out"),
        kf(17, { ...STANCE, shoulderB: 66, elbowB: 26, torso: 16, offX: 4 }, "inOut"),
        kf(25, { ...STANCE }),
      ],
    },
    {
      id: "sparabaraSet",
      name: "Sparabara",
      input: { button: "B", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 26,
      duration: 36,
      friction: 0.78,
      armor: [{ from: 4, to: 26, hits: 2, damageScale: 0.3 }],
      resourceGain: 1,
      meterGain: 12,
      vfx: [{ at: 4, kind: "block", x: 26, y: 52, scale: 1.1, color: BRONZE }],
      desc: "Sets the wicker in the ground and stands behind it. Absorbs two hits at almost no cost and gives a Rank back - it does not attack, and it does not have to.",
      notation: "↓↙← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, crouch: 0.5, shoulderF: 8, elbowF: 118, shoulderB: 26, elbowB: 70, weaponBack: 40, torso: -4, hipF: 30, kneeF: 48, hipB: -34, kneeB: 54, offX: -3 }, "out"),
        kf(16, { ...STANCE, crouch: 0.55, shoulderF: 4, elbowF: 122, torso: -8, hipF: 30, kneeF: 50, hipB: -34, kneeB: 56, offX: -4 }, "inOut"),
        kf(26, { ...STANCE, crouch: 0.4, shoulderF: 14, elbowF: 110, torso: -2 }, "inOut"),
        kf(36, { ...STANCE }),
      ],
    },
    {
      id: "anopaea",
      name: "The Goat Track",
      input: { button: "C", motion: "dp", stance: ["stand", "crouch"] },
      tags: ["special", "launcher"],
      priority: 26,
      duration: 44,
      airborne: true,
      invuln: [{ from: 1, to: 7, kind: "strike" }],
      vel: [
        { at: 1, x: 3, y: 12 },
        { at: 26, y: -1, mode: "add" },
      ],
      hits: [
        hit(4, 10, bx(16, 40, 72, 80), 80, { launch: [2.2, 11], knockdown: "launch", fx: "pierce", hitstun: 25, shake: 1.7 }),
        hit(11, 18, bx(12, 56, 60, 64), 32, { group: 2, launch: [1.5, 5.5], fx: "pierce", hitstun: 18 }),
      ],
      desc: "Goes up and over instead of through. Invincible on the way - the same answer he found at Thermopylae, which was to stop arguing with the front of the line.",
      notation: "→↓↘ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 0.7, hipF: 26, kneeF: 54 }, "out"),
        kf(4, { ...STANCE, free: 1, torso: -16, shoulderB: 154, elbowB: -22, weaponBack: -54, shoulderF: 96, elbowF: 40, hipF: 46, kneeF: 62, hipB: -32, kneeB: 44 }, "out"),
        kf(16, { ...STANCE, free: 1, torso: -20, shoulderB: 164, elbowB: -26, weaponBack: -58, hipF: 36, kneeF: 74 }),
        kf(31, { ...STANCE, free: 1, torso: -2, shoulderB: 106, elbowB: 16, weaponBack: -10, hipF: 32, kneeF: 48 }, "inOut"),
        kf(44, { ...STANCE, free: 1 }),
      ],
    },

    // ----------------------------------------------------------------- skill
    {
      id: "closeRanks",
      name: "Close Ranks",
      input: { buttons: ["A", "C"], stance: ["stand", "crouch"] },
      tags: ["skill"],
      priority: 18,
      duration: 28,
      friction: 0.82,
      // The reload, and the thing the corps was named for. It is quick because
      // that was the point of them: the hole closed before you saw it.
      resourceGain: 4,
      meterGain: 18,
      vfx: [{ at: 5, kind: "spark", x: 12, y: 60, scale: 1.1, color: BRONZE }],
      desc: "SKILL. The line dresses itself and the gap is gone. Refills the Ranks outright and builds meter - the corps was never allowed to look smaller than ten thousand.",
      notation: "A + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderF: 20, elbowF: 104, shoulderB: 128, elbowB: -14, weaponBack: -30, torso: 10, head: 6, hipF: 24, kneeF: 18, offX: 2 }, "out"),
        kf(13, { ...STANCE, shoulderF: 16, elbowF: 108, shoulderB: 136, elbowB: -20, weaponBack: -36, torso: 12, head: 8, hipF: 28, kneeF: 16, offX: 3 }, "inOut"),
        kf(21, { ...STANCE, shoulderF: 22, elbowF: 100, shoulderB: 86, elbowB: 16, weaponBack: 0, torso: 6, head: 2 }, "inOut"),
        kf(28, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- super
    {
      id: "super",
      name: "Ten Thousand",
      input: { button: "S", motion: "dd", stance: ["stand", "crouch"] },
      tags: ["super"],
      priority: 60,
      duration: 106,
      meterCost: 100,
      superFreeze: 42,
      invuln: [{ from: 1, to: 15, kind: "strike" }],
      showProps: ["bow"],
      vel: [
        { at: 40, x: 8 },
        { at: 62, x: 5 },
        { at: 78, x: 0 },
      ],
      friction: 0.93,
      // Opens at range with the bow, then closes: the volley is the corps and
      // the spear at the end is him.
      projectiles: [
        {
          at: 14, kind: "arrow", x: 44, y: 76, vx: 19, vy: 2.6, gravity: 0.11, life: 90,
          box: { x: -22, y: -3, w: 44, h: 7 },
          damage: 36, hitstun: 18, blockstun: 12, chip: 4, pushX: 3,
          clashes: true, fx: "pierce", hitstop: 4, color: "#8a6a3f", trail: "#e0c88f",
        },
        {
          at: 20, kind: "arrow", x: 44, y: 70, vx: 21, vy: 1.2, gravity: 0.06, life: 90,
          box: { x: -22, y: -3, w: 44, h: 7 },
          damage: 36, hitstun: 18, blockstun: 12, chip: 4, pushX: 3,
          clashes: true, fx: "pierce", hitstop: 4, color: "#8a6a3f", trail: "#e0c88f",
        },
        {
          at: 26, kind: "arrow", x: 44, y: 64, vx: 23, vy: 0, life: 80,
          box: { x: -22, y: -3, w: 44, h: 7 },
          damage: 36, hitstun: 18, blockstun: 12, chip: 4, pushX: 3,
          clashes: true, fx: "pierce", hitstop: 4, color: "#8a6a3f", trail: "#e0c88f",
        },
        {
          at: 32, kind: "arrow", x: 44, y: 68, vx: 21, vy: 0.8, gravity: 0.05, life: 80,
          box: { x: -22, y: -3, w: 44, h: 7 },
          damage: 36, hitstun: 18, blockstun: 12, chip: 4, pushX: 3,
          clashes: true, fx: "pierce", hitstop: 4, color: "#8a6a3f", trail: "#e0c88f",
        },
      ],
      hits: [
        hit(48, 52, bx(32, 42, 104, 28), 54, { group: 1, fx: "pierce", pushX: 1, hitstun: 20, hitstop: 6 }),
        hit(58, 62, bx(28, 20, 100, 26), 46, { group: 2, guard: "low", fx: "pierce", pushX: 1, hitstun: 18, hitstop: 5 }),
        hit(70, 76, bx(22, 16, 112, 86), 132, {
          group: 3,
          fx: "pierce",
          pushX: 12,
          knockdown: "hard",
          launch: [6, 8.5],
          hitstop: 17,
          shake: 3,
        }),
      ],
      vfx: [
        { at: 2, kind: "super", x: 0, y: 52, scale: 2.4, color: BRONZE },
        { at: 70, kind: "explode", x: 60, y: 44, scale: 1.3 },
      ],
      desc: "SUPER. Four arrows to make them move, and then he walks in behind them with the spear. The corps first, the man last.",
      notation: "↓↓ + S (100 meter)",
      frames: [
        kf(0, { ...STANCE, crouch: 0.5, torso: -10 }, "out"),
        kf(8, { ...STANCE, shoulderF: 76, elbowF: 8, shoulderB: 26, elbowB: 86, weaponBack: 62, torso: -8, offX: -2 }, "out"),
        kf(14, { ...STANCE, shoulderF: 78, elbowF: 4, shoulderB: 92, elbowB: 18, torso: -6, offX: 1 }, "out"),
        kf(20, { ...STANCE, shoulderF: 86, elbowF: 0, shoulderB: 94, elbowB: 16, torso: 0, offX: 2 }, "out"),
        kf(26, { ...STANCE, shoulderF: 94, elbowF: -4, shoulderB: 96, elbowB: 14, torso: 6, offX: 2 }, "out"),
        kf(32, { ...STANCE, shoulderF: 88, elbowF: 0, shoulderB: 94, elbowB: 16, torso: 2, offX: 2 }, "out"),
        kf(40, { ...STANCE, shoulderF: 30, elbowF: 92, shoulderB: 36, elbowB: 60, weaponBack: 44, torso: 14, offX: 3 }, "inOut"),
        kf(48, { ...STANCE, shoulderB: 86, elbowB: -2, weaponBack: -8, torso: 22, hipF: 36, offX: 8 }, "out"),
        kf(54, { ...STANCE, crouch: 0.5, shoulderB: 34, elbowB: 58, weaponBack: 40, torso: 10 }, "inOut"),
        kf(58, { ...STANCE, crouch: 0.7, shoulderB: 58, elbowB: -8, weaponBack: -26, torso: 30, hipF: 46, kneeF: 40, offX: 8 }, "out"),
        kf(65, { ...STANCE, shoulderB: 20, elbowB: 80, weaponBack: 66, shoulderF: 44, elbowF: 62, torso: -12, offX: -4 }, "inOut"),
        kf(70, { ...STANCE, shoulderB: 94, elbowB: -8, weaponBack: -14, shoulderF: 80, elbowF: 6, torso: 34, hipF: 46, kneeF: 22, hipB: -22, kneeB: 56, offX: 13 }, "out"),
        kf(88, { ...STANCE, shoulderB: 66, elbowB: 30, weaponBack: 16, torso: 14, offX: 4 }, "inOut"),
        kf(106, { ...STANCE }),
      ],
    },
  ],
};

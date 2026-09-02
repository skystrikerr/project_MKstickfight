/**
 * Ötzi - the Iceman.
 *
 * The oldest fighter on the roster and the only one whose body you can go and
 * look at. He is not a warrior in anybody's account; he is a man in his
 * forties carrying a working kit, and the kit is the character. A hafted axe
 * that is meant for wood and takes a shoulder apart anyway, a flint blade for
 * everything the axe is too big for, and a sling for the one thing he cannot
 * walk up to.
 *
 * He is the heaviest thing on the roster and he moves like it. Everything he
 * throws lands hard and none of it is quick, so his game is walking through
 * the first hit to land the second - the armour on his heavies is the whole
 * character. Stones are finite and he has to stop and prepare more, which is
 * the price of having any answer to range at all.
 */

import type { FighterDef } from "../types";
import { bx, guardClips, hit, kf, universalMoves } from "./builders";

const YEW = "#6b5334";
const COPPER = "#c98a5a";
const HIDE = "#5c4028";
const GRASS = "#d9c88e";
const STONE = "#8d8b83";
const FLINT = "#3f4750";

const STANCE = {
  torso: 12,
  head: -3,
  hipF: 18,
  kneeF: 22,
  hipB: -22,
  kneeB: 32,
  // Axe carried low in the lead hand rather than shouldered - a working grip,
  // not a warrior's ready position. A prop's world angle is roughly
  // (forearm angle - 90 + weapon angle), so this hangs it at about -20:
  // pointing down and forward, the way you carry an axe you are not using.
  shoulderF: 28,
  elbowF: 58,
  weapon: -20,
  shoulderB: 152,
  elbowB: -58,
  crouch: 0.15,
};

const IDLE_ARMS = { shoulderF: 28, elbowF: 58, weapon: -20, shoulderB: 152, elbowB: -58 };

export const ICEMAN: FighterDef = {
  id: "iceman",
  name: "Ötzi",
  title: "The Iceman",
  era: "Ötztal Alps, c. 3300 BC",
  bio: "A man of about forty-five who died high on a ridge on the Italian-Austrian border and stayed there, frozen, for five thousand three hundred years. He came out of the ice in 1991 with his clothes, his tools, his last two meals and the flint arrowhead that killed him still in his shoulder. Nobody else on this roster is this well documented, and nobody else on it is this anonymous.",
  archetype: "Brawler / Armour",
  difficulty: 2,
  strengths: ["Walks through a hit to land his own", "Heaviest normals in the game", "Nothing about him is fragile"],
  weaknesses: ["Slow to start and slower to stop", "Stones run out and have to be replaced", "Loses any race to the button"],
  winQuote: "You get one. I only need one.",
  palette: {
    body: "#c08b60",
    outline: "#140e08",
    accent: "#c2683a",
    cloth: HIDE,
    metal: STONE,
    aura: "#9fd8e8",
  },
  stats: {
    health: 1180,
    walkF: 2.3,
    walkB: 1.8,
    dashSpeed: 6.8,
    dashFrames: 18,
    backdashFrames: 24,
    jumpVel: 11.4,
    jumpFwd: 3.8,
    gravity: 0.66,
    weight: 1.32,
    airMoves: 1,
    doubleJump: false,
    airDash: false,
    width: 23,
    standHeight: 104,
    crouchHeight: 66,
    scale: 1.05,
  },
  stance: STANCE,
  clips: guardClips({
    high: { torso: 6, head: -8, shoulderF: 22, elbowF: 118, weapon: 92, shoulderB: 164, elbowB: -78, hipF: 16, kneeF: 26, hipB: -22, kneeB: 36, offX: -3 },
    low: { torso: 14, head: -6, shoulderF: 10, elbowF: 116, weapon: 96, shoulderB: 158, elbowB: -74, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88, offX: -3 },
  }),
  resource: {
    name: "Stones",
    max: 3,
    start: 3,
    // No passive regeneration on purpose. A sling stone is something he picked
    // up and shaped; running out means stopping and doing that again, which is
    // the only thing in his game that asks him to give up his turn.
    regen: 0,
    color: STONE,
    pips: true,
  },
  props: [
    {
      id: "bearcap",
      attach: "head",
      // Bearskin cap with a chin strap. He was wearing one; it is one of the
      // few pieces of his clothing that survived more or less intact.
      parts: [
        { geo: "poly", size: [-11, -4, -10, 6, -4, 11, 4, 11, 10, 6, 11, -4], pos: [0, 3], color: "#4a3524" },
        { geo: "poly", size: [-12, 2, -9, -3, 9, -3, 12, 2, 9, 4, -9, 4], pos: [0, -1], color: "#5c4229" },
        // Shaggy edge, so it reads as fur rather than a helmet.
        { geo: "disc", size: [2.6], pos: [-9, 6], color: "#4a3524" },
        { geo: "disc", size: [2.6], pos: [-3, 10], color: "#5c4229" },
        { geo: "disc", size: [2.6], pos: [4, 10], color: "#4a3524" },
        { geo: "disc", size: [2.6], pos: [9, 5], color: "#5c4229" },
        { geo: "box", size: [2, 9], pos: [-8, -8], rot: 10, color: "#3a2a1b" },
        // Beard, and the line of the jaw under it.
        { geo: "poly", size: [-6, 6, 5, 5, 3, -9, -5, -8], pos: [-7, -9], color: "#4f3a26" },
        { geo: "box", size: [10, 1.4], pos: [4, -7], rot: -6, color: "#2a1c10", z: 0.4 },
      ],
    },
    {
      id: "grasscape",
      attach: "torso",
      // Woven grass matting over a hide coat. The cape is the strangest thing
      // in the find and the most useful: it sheds rain and it is warm wet.
      parts: [
        { geo: "poly", size: [-14, -17, 13, -16, 14, 7, 9, 17, -10, 17, -15, 6], pos: [0, 4], color: HIDE },
        { geo: "box", size: [26, 2.2], pos: [0, 12], color: "#432e1c" },
        { geo: "box", size: [25, 2.2], pos: [0, 3], color: "#432e1c" },
        { geo: "box", size: [24, 2.2], pos: [0, -6], color: "#432e1c" },
        // The grass, hanging in strands off the shoulders.
        { geo: "poly", size: [-15, 5, -11, -8, 11, -8, 15, 5, 8, 2, -8, 2], pos: [-1, 13], color: GRASS, z: 0.3 },
        { geo: "box", size: [2.6, 15], pos: [-9, 2], rot: 6, color: GRASS, z: 0.3 },
        { geo: "box", size: [2.6, 17], pos: [-4, 1], rot: 2, color: "#c4b177", z: 0.3 },
        { geo: "box", size: [2.6, 14], pos: [2, 2], rot: -3, color: GRASS, z: 0.3 },
        { geo: "box", size: [2.6, 16], pos: [8, 2], rot: -6, color: "#c4b177", z: 0.3 },
      ],
      cloth: {
        segments: 4,
        segmentLength: 11,
        width: 26,
        endWidth: 22,
        color: "#c4b177",
        lining: "#8a7a45",
        gravity: 0.5,
        stiffness: 0.44,
        drift: -0.22,
      },
    },
    {
      id: "leggings",
      attach: "pelvis",
      // Separate hide leggings tied to a belt, with the loincloth between -
      // trousers had not been invented and this is what came before them.
      parts: [
        { geo: "poly", size: [-13, 4, 13, 3.5, 13, -4, -13, -4.5], pos: [0, 1], color: "#5f452b" },
        { geo: "box", size: [26, 2], pos: [0, 2], color: "#8a6a42", z: 0.2 },
        { geo: "poly", size: [-6, 5, 6, 5, 5, -13, -5, -13], pos: [0, -8], color: HIDE },
        { geo: "box", size: [6, 15], pos: [-9, -8], rot: 4, color: "#6b4d30" },
        { geo: "box", size: [6, 15], pos: [9, -8], rot: -4, color: "#7a5a3a" },
        { geo: "disc", size: [2.4], pos: [-2, 2], color: "#c9a24a", z: 0.3 },
      ],
    },
    {
      id: "axe",
      attach: "handF",
      // Yew haft with the blade bedded into a forked socket and lashed with
      // hide strips. The blade he actually carried was cast copper, which is
      // what makes him Copper Age rather than Neolithic - but it is knapped
      // -stone shaped and used like one, so it is drawn like one.
      //
      // The silhouette that matters: the head is TALLER than it is long and
      // it flares from a narrow seat to a wide edge. Make it symmetric and
      // long instead and the whole thing turns into a mallet.
      parts: [
        { geo: "cyl", size: [3, 34], pos: [6, 0], rot: 90, color: YEW },
        // The fork: the haft splits into two prongs and the blade is seated
        // down between them. Drawn as prongs rather than a collar so they
        // read as gripping the blade instead of banding the shaft.
        { geo: "poly", size: [-5, 3, 4, 8, 7, 7, -5, 0], pos: [23, 0], color: "#5a4429" },
        { geo: "poly", size: [-5, -3, 4, -8, 7, -7, -5, 0], pos: [23, 0], color: "#4a3722" },
        // Lashing over the fork.
        { geo: "box", size: [2.6, 15], pos: [22, 0], color: "#3f2f1c" },
        { geo: "box", size: [2.6, 12], pos: [26, 0], color: "#3f2f1c" },
        // The blade: cast copper, which is what actually makes him Copper Age
        // rather than Neolithic. Two things keep it reading as a blade:
        //
        // It is far lighter than the yew and the hide, so it separates from
        // the haft instead of continuing it. And it is near parallel-sided,
        // because a head that flares from a narrow neck to a wide mouth is a
        // funnel no matter how small it is drawn. The real object is a flat
        // slab: thin where it is seated, thick at the front, and finished in a
        // straight vertical edge, which is the part that has to read.
        { geo: "poly", size: [-4, 6, 2, 9, 9, 10, 13, 10, 13, -10, 9, -10, 2, -9, -4, -6], pos: [30, 0], color: COPPER },
        // The grind, set back from the edge so the bevel reads as a bevel.
        { geo: "poly", size: [7, 9.6, 10.5, 10, 10.5, -10, 7, -9.6], pos: [30, 0], color: "#9c6a42" },
        // The ground edge: bright, thin, on the front only.
        { geo: "poly", size: [11, 10, 13, 10, 13, -10, 11, -10], pos: [30, 0], color: "#f0c9a0" },
        { geo: "box", size: [20, 5], pos: [0, 0], color: "#4f3a22" },
        { geo: "box", size: [20, 1.6], pos: [0, 1.7], color: "#8a6a42" },
        { geo: "poly", size: [-3, 4, 3, 4, 2.4, -4, -2.4, -4], pos: [-10, 0], color: "#8a6a42" },
      ],
    },
    {
      id: "sling",
      attach: "handB",
      conditional: true,
      // Two cords and a pouch. Nothing else - which is why it packs into a
      // pocket and why it is the oldest ranged weapon anybody kept using.
      parts: [
        { geo: "box", size: [2, 34], pos: [10, -16], rot: 8, color: "#8a7048" },
        { geo: "box", size: [2, 34], pos: [22, -16], rot: -8, color: "#7a6240" },
        { geo: "poly", size: [-8, 4, 8, 4, 6, -5, -6, -5], pos: [16, -33], color: HIDE },
        { geo: "disc", size: [4], pos: [16, -33], color: STONE, z: 0.3 },
        { geo: "ring", size: [3, 1.2], pos: [4, 2], color: "#8a7048" },
      ],
    },
    {
      id: "flint",
      attach: "handB",
      conditional: true,
      // Small flint blade in an ash handle, with the woven bast sheath he kept
      // it in. It is short enough that using it means being very close.
      parts: [
        { geo: "poly", size: [-2, 4, 8, 5, 16, 2, 18, 0, 16, -2, 8, -4, -2, -4], pos: [16, 0], color: FLINT },
        { geo: "poly", size: [0, 3, 10, 2, 14, 0, 10, -1, 0, -2], pos: [18, 1], color: "#8fa0ae" },
        { geo: "box", size: [14, 6], pos: [2, 0], color: "#a88d5c" },
        { geo: "box", size: [14, 1.6], pos: [2, 1.8], color: "#c9b077" },
        { geo: "disc", size: [2.4], pos: [-6, 0], color: "#8a6a42" },
      ],
    },
  ],

  moves: [
    ...universalMoves({
      throwDamage: 150,
      backThrowDamage: 164,
      throwRange: 58,
      rollSpeed: 6.4,
      weaponIdle: IDLE_ARMS,
    }),

    // ---------------------------------------------------------------- normals
    {
      id: "5A",
      name: "Haft Jab",
      input: { button: "A", stance: "stand" },
      tags: ["light"],
      duration: 14,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [5, 13],
      followUps: [{ button: "B", move: "5B", from: 5, to: 12, string: "Chop Through" }],
      hits: [hit(5, 7, bx(18, 54, 48, 22), 30, { fx: "blunt", hitstun: 14, blockstun: 10, pushX: 2.6 })],
      desc: "Drives the haft out short. His fastest button, and it is still not fast.",
      notation: "A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderF: 70, elbowF: 14, weapon: 8, torso: 18, offX: 3 }),
        kf(10, { ...STANCE, shoulderF: 48, elbowF: 40, weapon: 22, torso: 14 }, "inOut"),
        kf(14, { ...STANCE }),
      ],
    },
    {
      id: "5B",
      name: "Chop",
      input: { button: "B", stance: "stand" },
      tags: ["medium"],
      duration: 24,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [10, 22],
      followUps: [{ button: "C", move: "5C", from: 10, to: 21, string: "Split It" }],
      hits: [hit(9, 12, bx(24, 44, 74, 34), 60, { fx: "blunt", pushX: 5, hitstun: 19, hitstop: 7 })],
      desc: "A working chop, brought across at chest height.",
      notation: "B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderF: 4, elbowF: 76, weapon: 74, torso: -8, offX: -4 }),
        kf(9, { ...STANCE, shoulderF: 82, elbowF: 6, weapon: -8, torso: 24, hipF: 30, offX: 7 }, "out"),
        kf(17, { ...STANCE, shoulderF: 54, elbowF: 36, weapon: 18, torso: 16 }, "inOut"),
        kf(24, { ...STANCE }),
      ],
    },
    {
      id: "5C",
      name: "Fell It",
      input: { button: "C", stance: "stand" },
      tags: ["heavy"],
      duration: 34,
      cancelInto: ["special", "super"],
      cancelWindow: [17, 30],
      // He wears the first hit rather than trading it. Everything about the
      // character is in this window.
      armor: [{ from: 6, to: 17, hits: 1, damageScale: 0.55 }],
      hits: [
        hit(17, 21, bx(20, 30, 84, 58), 98, {
          fx: "blunt",
          pushX: 9,
          knockdown: "soft",
          hitstun: 25,
          hitstop: 12,
          shake: 2.2,
        }),
      ],
      desc: "Takes the axe back over the shoulder and puts it through them. Absorbs one hit on the way up.",
      notation: "C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, shoulderF: -8, elbowF: 92, weapon: 104, torso: -16, hipB: -32, kneeB: 46, offX: -5 }, "inOut"),
        kf(17, { ...STANCE, shoulderF: 108, elbowF: -4, weapon: -26, shoulderB: 168, elbowB: -30, torso: 32, hipF: 38, kneeF: 20, offX: 8 }, "out"),
        kf(25, { ...STANCE, shoulderF: 82, elbowF: 20, weapon: 2, torso: 22, offX: 4 }),
        kf(34, { ...STANCE }),
      ],
    },
    {
      id: "2A",
      name: "Low Poke",
      input: { button: "A", stance: "crouch" },
      tags: ["light", "low"],
      duration: 14,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [5, 13],
      hits: [hit(5, 7, bx(16, 12, 46, 18), 26, { guard: "low", fx: "blunt", hitstun: 13, blockstun: 10, pushX: 2.2 })],
      desc: "Pushes the haft along the ground into a shin.",
      notation: "↓ + A",
      frames: [
        kf(0, { ...STANCE, crouch: 1, torso: 20, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88 }, "out"),
        kf(5, { ...STANCE, crouch: 1, torso: 26, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88, shoulderF: 66, elbowF: 24, weapon: 4, offX: 4 }),
        kf(10, { ...STANCE, crouch: 1, torso: 22, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88, shoulderF: 44, elbowF: 46 }, "inOut"),
        kf(14, { ...STANCE, crouch: 1, torso: 20, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88 }),
      ],
    },
    {
      id: "2B",
      name: "Knee Chop",
      input: { button: "B", stance: "crouch" },
      tags: ["medium", "low"],
      duration: 25,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [10, 23],
      hits: [hit(9, 12, bx(22, 8, 70, 24), 56, { guard: "low", fx: "blunt", pushX: 4, hitstun: 18 })],
      desc: "The same chop taken down to the knee, which is where it does most.",
      notation: "↓ + B",
      frames: [
        kf(0, { ...STANCE, crouch: 1, torso: 20, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88 }, "out"),
        kf(5, { ...STANCE, crouch: 1, torso: 10, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88, shoulderF: 8, elbowF: 74, weapon: 70 }),
        kf(9, { ...STANCE, crouch: 1, torso: 30, hipF: 42, kneeF: 84, hipB: -24, kneeB: 88, shoulderF: 52, elbowF: 8, weapon: -28, offX: 7 }, "out"),
        kf(17, { ...STANCE, crouch: 1, torso: 22, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88, shoulderF: 40, elbowF: 40, weapon: 6 }, "inOut"),
        kf(25, { ...STANCE, crouch: 1, torso: 20, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88 }),
      ],
    },
    {
      id: "2C",
      name: "Ground Sweep",
      input: { button: "C", stance: "crouch" },
      tags: ["heavy", "low"],
      duration: 31,
      cancelInto: ["special", "super"],
      cancelWindow: [15, 27],
      hits: [hit(12, 16, bx(18, 2, 82, 22), 76, { guard: "low", knockdown: "sweep", fx: "blunt", pushX: 5.6 })],
      desc: "Puts the whole haft along the floor and takes both ankles with it.",
      notation: "↓ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 1, torso: 20, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88 }, "out"),
        kf(6, { ...STANCE, crouch: 1, torso: 6, hipF: 30, kneeF: 76, hipB: -26, kneeB: 84, shoulderF: 2, elbowF: 82, weapon: 84, offX: -4 }, "inOut"),
        kf(12, { ...STANCE, crouch: 1.15, torso: 34, hipF: 56, kneeF: 88, hipB: -28, kneeB: 94, shoulderF: 42, elbowF: 4, weapon: -38, offX: 9 }, "out"),
        kf(22, { ...STANCE, crouch: 1, torso: 24, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88, shoulderF: 34, elbowF: 46, weapon: 8 }, "inOut"),
        kf(31, { ...STANCE, crouch: 1, torso: 20, hipF: 34, kneeF: 80, hipB: -24, kneeB: 88 }),
      ],
    },
    {
      id: "6A",
      name: "Shoulder Nudge",
      input: { button: "A", dir: "f", stance: "stand" },
      tags: ["command", "light"],
      priority: 12,
      duration: 18,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [7, 16],
      vel: [{ at: 4, x: 3.2 }, { at: 10, x: 0 }],
      friction: 0.88,
      hits: [hit(7, 10, bx(16, 46, 46, 40), 38, { fx: "blunt", pushX: 4.2, hitstun: 16, hitstop: 6 })],
      desc: "Leans in and puts a shoulder through them. Moves him forward whether they block it or not.",
      notation: "→ + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, torso: 4, crouch: 0.35, shoulderF: 20, elbowF: 66, offX: -2 }),
        kf(7, { ...STANCE, torso: 30, crouch: 0.3, shoulderF: 34, elbowF: 60, shoulderB: 140, hipF: 40, kneeF: 24, offX: 8 }, "out"),
        kf(13, { ...STANCE, torso: 20, offX: 4 }, "inOut"),
        kf(18, { ...STANCE }),
      ],
    },
    {
      id: "6B",
      name: "Overhand",
      input: { button: "B", dir: "f", stance: "stand" },
      tags: ["command", "medium", "overhead"],
      priority: 12,
      duration: 30,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [16, 27],
      hits: [hit(15, 18, bx(20, 34, 68, 56), 64, { guard: "overhead", fx: "blunt", pushX: 5.5, hitstun: 22, hitstop: 8 })],
      desc: "Comes down from above. Has to be blocked standing.",
      notation: "→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(7, { ...STANCE, shoulderF: 0, elbowF: 88, weapon: 100, torso: -12, offX: -4 }, "inOut"),
        kf(15, { ...STANCE, shoulderF: 100, elbowF: -2, weapon: -22, torso: 28, hipF: 34, offX: 7 }, "out"),
        kf(22, { ...STANCE, shoulderF: 74, elbowF: 22, weapon: 4, torso: 20, offX: 3 }),
        kf(30, { ...STANCE }),
      ],
    },
    {
      id: "6C",
      name: "Uproot",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["command", "heavy", "launcher"],
      priority: 12,
      duration: 36,
      cancelInto: ["special", "super"],
      cancelWindow: [18, 32],
      hits: [
        hit(14, 18, bx(18, 26, 66, 74), 84, {
          launch: [2.6, 11.5],
          knockdown: "launch",
          fx: "blunt",
          hitstun: 26,
          hitstop: 10,
          shake: 2,
        }),
      ],
      desc: "Swings up from the ankles and takes them off the floor with it.",
      notation: "→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(7, { ...STANCE, crouch: 0.6, shoulderF: -14, elbowF: 40, weapon: 20, torso: 6, hipF: 30, kneeF: 58, offX: -3 }, "inOut"),
        kf(14, { ...STANCE, shoulderF: 126, elbowF: -16, weapon: -60, shoulderB: 172, elbowB: -20, torso: -12, hipF: 22, kneeF: 10, offX: 5, offY: 3 }, "out"),
        kf(24, { ...STANCE, shoulderF: 92, elbowF: 12, weapon: -18, torso: 2, offX: 2 }),
        kf(36, { ...STANCE }),
      ],
    },
    {
      id: "4A",
      name: "Back Elbow",
      input: { button: "A", dir: "b", stance: "stand" },
      tags: ["command", "light"],
      priority: 12,
      duration: 16,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [6, 14],
      hits: [hit(6, 8, bx(12, 50, 40, 26), 32, { fx: "blunt", hitstun: 15, blockstun: 11, pushX: 3.4 })],
      desc: "Short elbow thrown while stepping off the line.",
      notation: "← + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, torso: 2, shoulderF: 10, elbowF: 88, offX: -3 }),
        kf(6, { ...STANCE, torso: 22, shoulderF: 52, elbowF: 96, weapon: 60, offX: 2 }, "out"),
        kf(11, { ...STANCE, torso: 16, shoulderF: 36, elbowF: 70 }, "inOut"),
        kf(16, { ...STANCE }),
      ],
    },
    {
      id: "4B",
      name: "Backhand Chop",
      input: { button: "B", dir: "b", stance: "stand" },
      tags: ["command", "medium"],
      priority: 12,
      duration: 26,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [11, 24],
      hits: [hit(10, 14, bx(26, 42, 78, 36), 58, { fx: "blunt", pushX: 6.5, hitstun: 20, hitstop: 7 })],
      desc: "Backhand return, thrown while giving ground. Pushes them further than it hurts.",
      notation: "← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderF: 92, elbowF: 6, weapon: -14, torso: 20, offX: 2 }),
        kf(10, { ...STANCE, shoulderF: 2, elbowF: 82, weapon: 86, shoulderB: 128, elbowB: -30, torso: -14, offX: -5 }, "out"),
        kf(18, { ...STANCE, shoulderF: 22, elbowF: 64, weapon: 50, torso: -4 }, "inOut"),
        kf(26, { ...STANCE }),
      ],
    },
    {
      id: "4C",
      name: "Deadfall",
      input: { button: "C", dir: "b", stance: "stand" },
      tags: ["command", "heavy", "overhead"],
      priority: 12,
      duration: 48,
      cancelInto: ["special", "super"],
      cancelWindow: [30, 44],
      armor: [{ from: 8, to: 22, hits: 1, damageScale: 0.5 }],
      hits: [hit(22, 26, bx(14, 18, 84, 88), 112, { guard: "overhead", fx: "blunt", pushX: 10, hitstun: 29, hitstop: 14, knockdown: "hard", shake: 2.6 })],
      desc: "The whole thing lifted overhead and dropped. Slow, armoured, blocked standing only, and it ends the exchange.",
      notation: "← + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(10, { ...STANCE, shoulderF: -4, elbowF: 96, weapon: 112, shoulderB: 172, elbowB: -34, torso: -16, offX: -5 }, "inOut"),
        kf(17, { ...STANCE, shoulderF: -20, elbowF: 104, weapon: 130, torso: -24, hipB: -30, kneeB: 42, offY: 4, offX: -3 }, "out"),
        kf(22, { ...STANCE, shoulderF: 120, elbowF: -8, weapon: -34, shoulderB: 176, elbowB: -26, torso: 36, hipF: 40, kneeF: 18, offX: 7 }, "out"),
        kf(30, { ...STANCE, shoulderF: 98, elbowF: 10, weapon: -8, torso: 28, offX: 4 }),
        kf(40, { ...STANCE, shoulderF: 60, elbowF: 38, weapon: 22, torso: 16 }, "inOut"),
        kf(48, { ...STANCE }),
      ],
    },
    {
      id: "jA",
      name: "Air Jab",
      input: { button: "A", stance: "air" },
      tags: ["light", "air"],
      duration: 19,
      airborne: true,
      landCancel: true,
      landRecovery: 4,
      cancelInto: ["medium", "heavy", "special"],
      cancelWindow: [6, 17],
      hits: [hit(6, 11, bx(16, 30, 48, 30), 32, { fx: "blunt", hitstun: 14, pushX: 2.4 })],
      desc: "Short punch of the haft on the way past.",
      notation: "(air) A",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 46 }, "out"),
        kf(6, { ...STANCE, free: 1, shoulderF: 72, elbowF: 14, weapon: 6, torso: 14 }),
        kf(13, { ...STANCE, free: 1, shoulderF: 46, elbowF: 44, weapon: 26, torso: 8 }, "inOut"),
        kf(19, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 46 }),
      ],
    },
    {
      id: "jB",
      name: "Air Chop",
      input: { button: "B", stance: "air" },
      tags: ["medium", "air"],
      duration: 26,
      airborne: true,
      landCancel: true,
      landRecovery: 6,
      cancelInto: ["heavy", "special"],
      hits: [hit(8, 15, bx(20, 16, 68, 44), 60, { fx: "blunt", pushX: 4, hitstun: 19 })],
      desc: "Swings the head out flat underneath him.",
      notation: "(air) B",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 30, kneeF: 44, hipB: -22, kneeB: 42 }, "out"),
        kf(4, { ...STANCE, free: 1, shoulderF: 6, elbowF: 78, weapon: 76, torso: -8 }),
        kf(9, { ...STANCE, free: 1, shoulderF: 58, elbowF: 6, weapon: -26, torso: 22, hipF: 38 }, "out"),
        kf(18, { ...STANCE, free: 1, shoulderF: 44, elbowF: 40, weapon: 12, torso: 8 }, "inOut"),
        kf(26, { ...STANCE, free: 1 }),
      ],
    },
    {
      id: "jC",
      name: "Falling Weight",
      input: { button: "C", stance: "air" },
      tags: ["heavy", "air", "overhead"],
      duration: 30,
      airborne: true,
      landCancel: true,
      landRecovery: 8,
      hits: [
        hit(9, 20, bx(6, 2, 62, 54), 84, {
          guard: "overhead",
          fx: "blunt",
          knockdown: "soft",
          pushX: 5,
          shake: 1.7,
        }),
      ],
      desc: "Brings it straight down with all of him behind it. His jump-in, and he is heavy.",
      notation: "(air) C",
      frames: [
        kf(0, { ...STANCE, free: 1 }, "out"),
        kf(5, { ...STANCE, free: 1, torso: -16, shoulderF: -8, elbowF: 98, weapon: 116, hipF: 38, kneeF: 54 }),
        kf(9, { ...STANCE, free: 1, torso: 32, shoulderF: 94, elbowF: 0, weapon: -54, hipF: 12, kneeF: 16 }, "out"),
        kf(30, { ...STANCE, free: 1, torso: 26, shoulderF: 86, elbowF: 6, weapon: -48 }),
      ],
    },
    {
      id: "dashAttack",
      name: "Run Through",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["command"],
      priority: 12,
      duration: 34,
      vel: [
        { at: 3, x: 9 },
        { at: 18, x: 0 },
      ],
      friction: 0.91,
      armor: [{ from: 3, to: 12, hits: 1, damageScale: 0.6 }],
      hits: [hit(9, 14, bx(20, 24, 72, 52), 74, { fx: "blunt", pushX: 7, knockdown: "soft", hitstun: 22, shake: 1.5 })],
      desc: "Closes without slowing down and without flinching.",
      notation: "→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, torso: 28, crouch: 0.45, shoulderF: 4, elbowF: 80, weapon: 82, offX: -3 }),
        kf(9, { ...STANCE, torso: 34, crouch: 0.3, shoulderF: 88, elbowF: 2, weapon: -18, hipF: 46, kneeF: 24, offX: 8 }, "out"),
        kf(24, { ...STANCE, torso: 18, shoulderF: 52, elbowF: 40, weapon: 24, offX: 3 }, "inOut"),
        kf(34, { ...STANCE }),
      ],
    },

    // -------------------------------------------------------- five specials
    {
      id: "slingStone",
      name: "Sling",
      input: { button: "B", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 20,
      duration: 46,
      resourceCost: 1,
      resourceMin: 1,
      showProps: ["sling"],
      // A sling is wound up, not aimed. Two full turns before it goes, and the
      // stone arcs rather than flying flat - it is the slowest projectile in
      // the game and it hits harder than anything else thrown.
      projectiles: [
        {
          at: 22,
          kind: "stone",
          x: 40,
          y: 76,
          vx: 13.5,
          vy: 2.4,
          gravity: 0.17,
          life: 96,
          box: { x: -7, y: -7, w: 14, h: 14 },
          damage: 78,
          hitstun: 24,
          blockstun: 15,
          chip: 8,
          pushX: 7,
          knockdown: "soft",
          clashes: true,
          fx: "blunt",
          hitstop: 9,
          color: STONE,
          trail: "#c9c4b6",
        },
      ],
      vfx: [{ at: 22, kind: "dust", x: 44, y: 78, scale: 0.8, color: "#c9c4b6" }],
      desc: "Winds the sling twice and lets a stone go on a high arc. Slow enough to walk under and heavy enough that walking under it is worth doing. Costs one Stone.",
      notation: "↓↘→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, shoulderB: 60, elbowB: -20, weaponBack: 40, torso: -10, offX: -4 }, "inOut"),
        kf(14, { ...STANCE, shoulderB: -40, elbowB: -10, weaponBack: 130, torso: -6, spin: -6 }, "inOut"),
        kf(18, { ...STANCE, shoulderB: 60, elbowB: -18, weaponBack: 40, torso: 4, spin: 4 }, "inOut"),
        kf(22, { ...STANCE, shoulderB: 128, elbowB: -6, weaponBack: -40, shoulderF: 40, elbowF: 50, torso: 24, hipF: 36, kneeF: 20, offX: 6 }, "out"),
        kf(32, { ...STANCE, shoulderB: 158, elbowB: -44, torso: 14, offX: 2 }, "inOut"),
        kf(46, { ...STANCE }),
      ],
    },
    {
      id: "splitLog",
      name: "Split the Log",
      input: { button: "C", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 22,
      duration: 44,
      // Two hits: the head going in, and the shoulder that follows it through.
      armor: [{ from: 4, to: 14, hits: 2, damageScale: 0.5 }],
      hits: [
        hit(14, 18, bx(18, 34, 74, 52), 66, { group: 1, fx: "blunt", pushX: 2, hitstun: 20, hitstop: 8 }),
        hit(24, 28, bx(14, 40, 60, 46), 78, {
          group: 2,
          fx: "blunt",
          pushX: 11,
          knockdown: "hard",
          hitstun: 26,
          hitstop: 13,
          shake: 2.3,
        }),
      ],
      desc: "Buries the head and then walks the shoulder in behind it. Absorbs two hits going in, which is how he gets to use it at all.",
      notation: "↓↘→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, crouch: 0.4, shoulderF: -6, elbowF: 90, weapon: 106, torso: -14, offX: -4 }, "inOut"),
        kf(14, { ...STANCE, shoulderF: 104, elbowF: -2, weapon: -24, torso: 30, hipF: 36, kneeF: 20, offX: 7 }, "out"),
        kf(20, { ...STANCE, shoulderF: 88, elbowF: 14, weapon: -6, torso: 22, offX: 6 }, "inOut"),
        kf(24, { ...STANCE, shoulderF: 46, elbowF: 54, weapon: 20, shoulderB: 130, torso: 38, hipF: 48, kneeF: 26, offX: 12 }, "out"),
        kf(34, { ...STANCE, torso: 22, offX: 5 }, "inOut"),
        kf(44, { ...STANCE }),
      ],
    },
    {
      id: "flintCut",
      name: "Flint",
      input: { button: "A", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 24,
      duration: 24,
      showProps: ["flint"],
      hits: [
        hit(5, 8, bx(8, 48, 38, 30), 44, { group: 1, fx: "slash", pushX: 2, hitstun: 18, hitstop: 6 }),
        hit(10, 13, bx(6, 42, 40, 36), 52, {
          group: 2,
          fx: "slash",
          pushX: 6,
          hitstun: 22,
          hitstop: 9,
        }),
      ],
      desc: "Drops the axe out of the way and puts the flint in twice, fast, at arm's length. His only quick answer to somebody already inside.",
      notation: "↓↙← + A",
      frames: [
        kf(0, { ...STANCE, crouch: 0.25 }, "out"),
        kf(5, { ...STANCE, shoulderB: 42, elbowB: 10, weaponBack: -14, shoulderF: 20, elbowF: 70, torso: 24, hipF: 30, offX: 5 }, "out"),
        kf(10, { ...STANCE, shoulderB: 88, elbowB: -8, weaponBack: -34, shoulderF: 16, elbowF: 74, torso: 32, hipF: 36, kneeF: 20, offX: 8 }, "out"),
        kf(16, { ...STANCE, shoulderB: 120, elbowB: -30, torso: 18, offX: 4 }, "inOut"),
        kf(24, { ...STANCE }),
      ],
    },
    {
      id: "brace",
      name: "Brace",
      input: { button: "B", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 26,
      duration: 32,
      parryWindow: [4, 13],
      friction: 0.8,
      meterGain: 14,
      vfx: [{ at: 4, kind: "spark", x: 26, y: 54, scale: 0.9, color: "#9fd8e8" }],
      desc: "Sets his feet, gets the haft across and lets it come. Deflects what lands in the window and gives him the turn back.",
      notation: "↓↙← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, crouch: 0.4, shoulderF: 58, elbowF: 62, weapon: 88, shoulderB: 118, elbowB: -30, torso: 6, hipF: 32, kneeF: 44, hipB: -34, kneeB: 50, offX: -3 }, "out"),
        kf(13, { ...STANCE, crouch: 0.45, shoulderF: 44, elbowF: 72, weapon: 96, torso: -2, offX: -5 }, "inOut"),
        kf(22, { ...STANCE, crouch: 0.3, shoulderF: 50, elbowF: 52, weapon: 58, torso: 4 }, "inOut"),
        kf(32, { ...STANCE }),
      ],
    },
    {
      id: "riseAxe",
      name: "Up Off the Knee",
      input: { button: "C", motion: "dp", stance: ["stand", "crouch"] },
      tags: ["special", "launcher"],
      priority: 26,
      duration: 48,
      airborne: true,
      invuln: [{ from: 1, to: 8, kind: "strike" }],
      vel: [
        { at: 1, x: 2.4, y: 11.6 },
        { at: 28, y: -1, mode: "add" },
      ],
      hits: [
        hit(4, 11, bx(10, 38, 58, 82), 88, { launch: [2, 11], knockdown: "launch", fx: "blunt", hitstun: 26, shake: 1.9 }),
        hit(12, 19, bx(8, 54, 52, 66), 36, { group: 2, launch: [1.5, 5.5], fx: "blunt", hitstun: 18 }),
      ],
      desc: "Comes up off the back knee with the head leading. Invincible on the way up - the only frame-one answer he has.",
      notation: "→↓↘ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 0.75, hipF: 26, kneeF: 56 }, "out"),
        kf(4, { ...STANCE, free: 1, torso: -16, shoulderF: 146, elbowF: -10, weapon: -50, shoulderB: 176, elbowB: -20, hipF: 44, kneeF: 60, hipB: -32, kneeB: 44 }, "out"),
        kf(16, { ...STANCE, free: 1, torso: -20, shoulderF: 158, elbowF: -14, weapon: -56, hipF: 34, kneeF: 72 }),
        kf(34, { ...STANCE, free: 1, torso: -2, shoulderF: 104, elbowF: 22, weapon: -8, hipF: 30, kneeF: 46 }, "inOut"),
        kf(48, { ...STANCE, free: 1 }),
      ],
    },

    // ----------------------------------------------------------------- skill
    {
      id: "knap",
      name: "Knap",
      input: { buttons: ["A", "C"], stance: ["stand", "crouch"] },
      tags: ["skill"],
      priority: 18,
      duration: 40,
      friction: 0.78,
      // The reload. It is slow because picking a stone and working it is slow,
      // and because a fighter who can rearm for free never has to think about
      // whether the shot was worth taking.
      resourceGain: 3,
      meterGain: 16,
      vfx: [{ at: 12, kind: "spark", x: 20, y: 24, scale: 0.7, color: "#c9c4b6" }],
      desc: "SKILL. Crouches, picks something up and works it until it is the right shape. Refills the Stones and builds meter, and takes long enough that it has to be earned.",
      notation: "A + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, crouch: 0.85, torso: 26, head: 8, shoulderF: 30, elbowF: 80, weapon: 40, shoulderB: 44, elbowB: 60, hipF: 40, kneeF: 82, hipB: -26, kneeB: 90, offX: -2 }, "inOut"),
        kf(16, { ...STANCE, crouch: 0.85, torso: 30, head: 10, shoulderF: 26, elbowF: 86, weapon: 36, shoulderB: 52, elbowB: 52, hipF: 40, kneeF: 82, hipB: -26, kneeB: 90 }, "inOut"),
        kf(24, { ...STANCE, crouch: 0.85, torso: 26, head: 8, shoulderF: 32, elbowF: 78, shoulderB: 40, elbowB: 62, hipF: 40, kneeF: 82, hipB: -26, kneeB: 90 }, "inOut"),
        kf(32, { ...STANCE, crouch: 0.4, torso: 18, shoulderF: 30, elbowF: 62 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- super
    {
      id: "super",
      name: "Five Thousand Winters",
      input: { button: "S", motion: "dd", stance: ["stand", "crouch"] },
      tags: ["super"],
      priority: 60,
      duration: 108,
      meterCost: 100,
      superFreeze: 42,
      invuln: [{ from: 1, to: 16, kind: "strike" }],
      armor: [{ from: 17, to: 62, hits: 3, damageScale: 0.35 }],
      vel: [
        { at: 8, x: 7 },
        { at: 34, x: 5 },
        { at: 58, x: 4 },
        { at: 78, x: 0 },
      ],
      friction: 0.93,
      hits: [
        hit(16, 20, bx(20, 44, 76, 40), 54, { group: 1, fx: "blunt", pushX: 1, hitstun: 20, hitstop: 6 }),
        hit(28, 32, bx(20, 20, 78, 32), 46, { group: 2, guard: "low", fx: "blunt", pushX: 1, hitstun: 18, hitstop: 5 }),
        hit(40, 44, bx(18, 40, 74, 46), 48, { group: 3, fx: "blunt", pushX: 1, hitstun: 18, hitstop: 5 }),
        hit(52, 56, bx(16, 30, 78, 56), 52, { group: 4, fx: "blunt", pushX: 1, hitstun: 19, hitstop: 6 }),
        hit(68, 74, bx(12, 12, 88, 92), 148, {
          group: 5,
          fx: "blunt",
          pushX: 13,
          knockdown: "hard",
          launch: [6.5, 8],
          hitstop: 18,
          shake: 3.2,
        }),
      ],
      vfx: [
        { at: 2, kind: "super", x: 0, y: 50, scale: 2.4, color: "#9fd8e8" },
        { at: 68, kind: "explode", x: 50, y: 40, scale: 1.4 },
      ],
      desc: "SUPER. Four blows he simply does not stop for, and then the axe. He has already outlasted everyone who ever tried this on him.",
      notation: "↓↓ + S (100 meter)",
      frames: [
        kf(0, { ...STANCE, crouch: 0.5, torso: -8 }, "out"),
        kf(9, { ...STANCE, shoulderF: 2, elbowF: 84, weapon: 88, torso: -12, offX: -4 }, "out"),
        kf(16, { ...STANCE, shoulderF: 96, elbowF: 2, weapon: -16, torso: 26, hipF: 36, offX: 8 }, "out"),
        kf(23, { ...STANCE, crouch: 0.5, shoulderF: 20, elbowF: 66, weapon: 62, torso: 8 }, "inOut"),
        kf(28, { ...STANCE, crouch: 0.7, shoulderF: 50, elbowF: 8, weapon: -30, torso: 32, hipF: 46, kneeF: 40, offX: 7 }, "out"),
        kf(35, { ...STANCE, shoulderF: 14, elbowF: 74, weapon: 76, torso: -8 }, "inOut"),
        kf(40, { ...STANCE, spin: -10, shoulderF: 100, elbowF: 0, weapon: -22, torso: 28, offX: 7 }, "out"),
        kf(47, { ...STANCE, shoulderF: 20, elbowF: 68, weapon: 70, torso: -6 }, "inOut"),
        kf(52, { ...STANCE, spin: 8, shoulderF: 86, elbowF: 6, weapon: -12, torso: 30, hipF: 40, offX: 8 }, "out"),
        kf(61, { ...STANCE, shoulderF: -20, elbowF: 104, weapon: 132, torso: -26, hipB: -32, kneeB: 48, offX: -6 }, "inOut"),
        kf(68, { ...STANCE, shoulderF: 124, elbowF: -10, weapon: -40, shoulderB: 178, elbowB: -18, torso: 38, hipF: 46, kneeF: 22, hipB: -22, kneeB: 56, offX: 12 }, "out"),
        kf(88, { ...STANCE, shoulderF: 70, elbowF: 30, weapon: 18, torso: 16, offX: 4 }, "inOut"),
        kf(108, { ...STANCE }),
      ],
    },
  ],
};

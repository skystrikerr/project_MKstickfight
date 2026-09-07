/**
 * Shanidar 1 - a Neanderthal man from Shanidar Cave in the Zagros mountains
 * of Iraqi Kurdistan, dead somewhere around 45,000 years ago and dug up by
 * Ralph Solecki's team in 1957.
 *
 * The roster already has Otzi, and he is not the same thing at all. Otzi is
 * Copper Age - five thousand years ago, farming, woven cloth, a copper axe.
 * This man is forty thousand years before that, a different species, and he
 * genuinely lived in a cave.
 *
 * What makes him a character is the skeleton, which is one of the most
 * examined in archaeology. A crushing blow to the left side of his face took
 * the eye. His right arm was withered from long before death and ends above
 * the wrist - either amputated or lost to atrophy, and useless either way.
 * There is damage to the right leg and foot, and hearing loss from bony
 * growths in both ear canals. He was blind on one side, one-armed, lame and
 * deaf, in a landscape that killed healthy people.
 *
 * And every one of those injuries had healed. He lived years with them, which
 * means for years somebody fed him, moved him and kept him. That is the whole
 * character: not a brute, the oldest evidence we have that people look after
 * each other, walking around in a body that should have finished him.
 *
 * So he fights one-handed, he is the slowest and toughest thing on the roster,
 * he has no ranged game worth the name, and what he does instead is get hold
 * of people. Neanderthal skeletons carry the injury pattern of rodeo riders,
 * which is what closing with large animals at arm's length does to a body.
 */

import type { FighterDef } from "../types";
import { bx, guardClips, hit, kf, universalMoves } from "./builders";

const SKIN = "#d8a878";
const SKIN_DARK = "#b4855a";
const HAIR = "#6b4e34";
const HAIR_GREY = "#8a7a6a";
const HIDE = "#a88252";
const HIDE_DARK = "#7d5f38";
const WOOD = "#8a6238";
const STONE = "#8f8a82";
const BLOOD = "#8f3229";

/**
 * Crouched, square, and turned so the good arm leads.
 *
 * The withered right arm hangs and does nothing - it is drawn short and held
 * across the body, which is where an arm that ends above the wrist sits when
 * you are not thinking about it. Everything he does is the other side.
 */
const STANCE = {
  torso: 22,
  head: 6,
  hipF: 26,
  kneeF: 34,
  hipB: -26,
  kneeB: 46,
  shoulderF: 44,
  elbowF: 62,
  weapon: -14,
  shoulderB: 14,
  elbowB: 86,
};

export const SHANIDAR: FighterDef = {
  id: "shanidar",
  name: "Shanidar 1",
  title: "The Old Man of the Cave",
  era: "Shanidar Cave, c. 45,000 BC",
  bio: "Excavated in 1957 from a cave in the Zagros mountains. Blind in one eye from a crushing blow to the face, right arm withered and ending above the wrist, right leg and foot damaged, deaf in both ears - and every injury healed long before he died, which means somebody kept him alive for years. The oldest evidence we have that people look after each other, in a body that should have finished him.",
  archetype: "Grappler / Wall",
  difficulty: 2,
  strengths: ["Very hard to finish", "Grabs through most things", "Gets tougher the worse it goes"],
  weaknesses: ["Slowest walk in the game", "One arm, so no reach", "Almost nothing at range"],
  winQuote: "…",
  // No faith. Every other fighter on the roster gets one and he does not,
  // which is the honest entry rather than a gap: the flower pollen that made
  // the "first burial" headlines in the sixties is now thought to be a
  // burrowing rodent, and there is nothing else to go on. No state either -
  // there were no states - and he fought for reasons nobody recorded, which
  // is the same slot the other dug-up man is in.
  factions: ["peoples", "sellswords"],
  palette: {
    body: SKIN,
    outline: "#1a1209",
    accent: BLOOD,
    cloth: HIDE,
    metal: STONE,
    aura: "#d8a05c",
  },
  stats: {
    // Heavy and very slow. A Neanderthal was shorter than any modern human
    // here and heavier than all of them - stockier, denser bone, far stronger
    // - so he is built as a wall rather than as a big man.
    //
    // The health opened at 1180, which put him joint-top and, measured across
    // three hundred rounds, at 61.7%. This is where he actually sits at fifty.
    health: 1060,
    walkF: 2.2,
    walkB: 1.85,
    dashSpeed: 7.2,
    dashFrames: 18,
    backdashFrames: 22,
    jumpVel: 10.8,
    jumpFwd: 3.6,
    gravity: 0.7,
    weight: 1.3,
    airMoves: 1,
    doubleJump: false,
    airDash: false,
    width: 24,
    standHeight: 96,
    crouchHeight: 58,
    scale: 1.02,
  },
  stance: STANCE,
  // He guards with the forearm and the shoulder, because there is nothing in
  // the other hand and never was.
  clips: guardClips({
    high: { torso: 16, head: 2, shoulderF: 96, elbowF: 62, weapon: 30, shoulderB: 6, elbowB: 92, hipF: 22, kneeF: 30, hipB: -24, kneeB: 42, offX: -3 },
    low: { torso: 30, head: 8, shoulderF: 66, elbowF: 84, weapon: 46, shoulderB: -6, elbowB: 94, hipF: 40, kneeF: 84, hipB: -26, kneeB: 92, offX: -3 },
  }),
  resource: {
    name: "Sinew",
    max: 3,
    start: 1,
    // It fills by being hurt, and by nothing else. Every injury on that
    // skeleton healed - the whole point of him is that damage is survivable
    // and he is still here - so the bar is the record of what he has already
    // taken, and it is the only fighter's resource that a passive opponent
    // can refuse to give him.
    gainOnTakeHit: 0.22,
    regen: 0,
    color: BLOOD,
    pips: true,
  },
  props: [
    {
      id: "hair",
      attach: "head",
      // Heavy brow, low skull, and hair going grey. He was old.
      parts: [
        { geo: "poly", size: [-13, 2, -11, 9, 0, 12, 11, 9, 13, 1, 9, -5, -10, -5], pos: [-1, 3], color: HAIR },
        { geo: "poly", size: [-12, 1, -5, 4, 4, 3, 11, 0, 8, -4, -10, -4], pos: [-1, 8], color: HAIR_GREY, z: 0.1 },
        { geo: "poly", size: [-7, 6, 4, 5, 7, -24, 2, -40, -5, -42, -8, -22], pos: [-12, -6], color: HAIR, behind: true },
        // The brow ridge, which is the one thing everybody knows about them.
        { geo: "poly", size: [-13, 0, -10, 5, 10, 5, 13, 0, 8, -3, -9, -3], pos: [1, -1], color: SKIN_DARK, z: 0.2 },
        // The blind side: the left orbit took a crushing blow and the eye
        // with it. Drawn as the scar, not as a patch - nobody was making
        // eyepatches.
        { geo: "poly", size: [-6, 3, 5, 2, 6, -2, -5, -3], pos: [-4, -5], color: "#7a4a34", z: 0.35 },
        { geo: "disc", size: [1.5], pos: [6, -4], color: "#2a1d12", z: 0.35 },
        { geo: "poly", size: [-8, 4, -3, -2, 6, -4, 8, 2, 0, 6], pos: [3, -14], color: HAIR_GREY, z: 0.15 },
      ],
    },
    {
      id: "hide",
      attach: "torso",
      // A skin, tied. Neanderthals had no needles and no woven cloth - the
      // sewing needle is a modern-human invention forty thousand years later -
      // so it is a hide wrapped and knotted and nothing more.
      parts: [
        { geo: "poly", size: [-12, -17, 12, -17, 13, 10, 6, 19, -7, 18, -13, 9], pos: [0, 1], color: HIDE },
        { geo: "poly", size: [-13, 4, 13, -6, 12, -12, -13, -2], pos: [0, -3], color: HIDE_DARK, z: 0.2 },
        { geo: "poly", size: [0, 0, -6, -7, 3, -9, 7, -2], pos: [8, 8], color: HIDE_DARK, z: 0.25 },
        { geo: "poly", size: [-10, 0, -4, -14, 4, -14, 10, 0, 0, 4], pos: [-2, -18], color: HIDE, z: 0.1 },
      ],
    },
    {
      id: "withered",
      attach: "forearmB",
      // The right arm. It ends above the wrist and there is no hand on it,
      // and that is not a design flourish - it is the single most examined
      // feature of the most examined Neanderthal skeleton there is.
      parts: [
        { geo: "cyl", size: [7, 20], pos: [-2, 0], rot: 90, color: SKIN_DARK },
        { geo: "poly", size: [-5, 5, 4, 4, 6, 0, 4, -4, -5, -5], pos: [7, 0], color: "#8a5c3c" },
        { geo: "poly", size: [0, 4, 7, 3, 7, -3, 0, -4], pos: [2, 0], color: "#7a4a34", z: 0.2 },
      ],
    },
    {
      id: "spear",
      attach: "handF",
      // A Schoningen spear: fire-hardened spruce, sharpened at the heavy end,
      // no head at all. The oldest wooden weapons anybody has ever dug up are
      // three hundred thousand years old and look exactly like this.
      parts: [
        { geo: "cyl", size: [4.4, 86], pos: [24, 0], rot: 90, color: WOOD },
        { geo: "cyl", size: [3.6, 26], pos: [58, 0], rot: 90, color: "#7a5a34" },
        { geo: "poly", size: [0, 4.2, 12, 2.8, 22, 0, 12, -2.8, 0, -4.2], pos: [68, 0], color: "#3a2a1c" },
        { geo: "box", size: [7, 5.6], pos: [-12, 0], color: "#5a4128" },
        { geo: "box", size: [2.6, 6.4], pos: [-5, 0], color: HIDE_DARK, z: 0.2 },
      ],
    },
    {
      id: "stone",
      attach: "handF",
      // A hand-axe, held not hafted. Conditional: it only comes out when he
      // throws it, because the spear is in the same hand and it is the only
      // hand he has.
      conditional: true,
      parts: [
        { geo: "poly", size: [0, 13, 9, 7, 12, -4, 4, -12, -6, -10, -11, -1, -8, 8], pos: [4, 0], color: STONE },
        { geo: "poly", size: [0, 9, 6, 4, 8, -3, 2, -8, -5, -6, -7, 1], pos: [3, 0], color: "#a8a29a", z: 0.2 },
        { geo: "poly", size: [0, 4, 5, 1, 8, -3, 1, -5, -3, -1], pos: [7, -2], color: "#c4beb4", z: 0.3 },
      ],
    },
  ],

  moves: [
    ...universalMoves({
      throwDamage: 148,
      backThrowDamage: 156,
      throwRange: 66,
      rollSpeed: 6.2,
      weaponIdle: { weapon: STANCE.weapon },
    }),

    // --------------------------------------------------------------- normals
    //
    // One arm. Everything here is the spear in the good hand, the shoulder,
    // the head or a boot - there is no second fist to throw and there never
    // was, so the whole button layout is built round that absence.
    {
      id: "5A",
      name: "Jab of the Haft",
      input: { button: "A", stance: "stand" },
      tags: ["light"],
      duration: 14,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [4, 13],
      hits: [hit(5, 7, bx(22, 54, 56, 20), 28, { blockstun: 9, hitstun: 13, fx: "blunt", pushX: 3 })],
      desc: "Short poke with the butt of the spear. The fastest thing one arm can do.",
      notation: "A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, shoulderF: 30, elbowF: 80, weapon: 42, torso: 16, offX: -3 }, "out"),
        kf(5, { ...STANCE, shoulderF: 58, elbowF: 20, weapon: 6, torso: 30, offX: 6 }, "linear"),
        kf(10, { ...STANCE, shoulderF: 48, elbowF: 48, weapon: 26, torso: 24 }, "inOut"),
        kf(14, { ...STANCE }),
      ],
    },
    {
      id: "5B",
      name: "Thrust",
      input: { button: "B", stance: "stand" },
      tags: ["medium"],
      duration: 22,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [8, 20],
      hits: [hit(9, 12, bx(26, 46, 86, 24), 52, { fx: "pierce", pushX: 5, hitstun: 18, hitstop: 7 })],
      desc: "Drives the point out at the body. A thrusting spear was the tool, and it was used at arm's length.",
      notation: "B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderF: 26, elbowF: 88, weapon: -26, torso: 10, offX: -5 }, "out"),
        kf(9, { ...STANCE, shoulderF: 62, elbowF: 8, weapon: 10, torso: 34, hipF: 38, offX: 8 }, "linear"),
        kf(15, { ...STANCE, shoulderF: 54, elbowF: 36, weapon: 12, torso: 26, offX: 3 }, "inOut"),
        kf(22, { ...STANCE }),
      ],
    },
    {
      id: "5C",
      name: "Both Hands He Has Not",
      input: { button: "C", stance: "stand" },
      tags: ["heavy"],
      duration: 32,
      cancelInto: ["special", "super"],
      cancelWindow: [12, 28],
      // A one-handed overhead with a two-metre spear is a shoulder and a hip
      // more than an arm, which is why it is slow and why it hurts.
      hits: [hit(14, 19, bx(24, 34, 92, 46), 76, {
        fx: "blunt",
        pushX: 9,
        hitstun: 22,
        hitstop: 11,
        shake: 1.8,
      })],
      desc: "Swings the whole shaft over with the shoulder behind it, because there is no second hand to steady it. Slow, and it lands like a falling tree.",
      notation: "C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(7, { ...STANCE, shoulderF: 166, elbowF: -14, weapon: -46, torso: -4, hipB: -34, kneeB: 56, offX: -7 }, "out"),
        kf(14, { ...STANCE, shoulderF: 66, elbowF: 6, weapon: -14, torso: 44, hipF: 44, kneeF: 24, offX: 10 }, "out"),
        kf(23, { ...STANCE, shoulderF: 50, elbowF: 42, weapon: 22, torso: 30, offX: 4 }, "inOut"),
        kf(32, { ...STANCE }),
      ],
    },
    {
      id: "2A",
      name: "Low Poke",
      input: { button: "A", stance: "crouch" },
      tags: ["light", "low"],
      duration: 14,
      cancelInto: ["light", "medium", "heavy", "special", "super"],
      cancelWindow: [4, 13],
      hits: [hit(5, 7, bx(20, 6, 54, 18), 26, { guard: "low", blockstun: 9, hitstun: 13, fx: "blunt", pushX: 2 })],
      desc: "Butt of the spear along the ground at the ankle.",
      notation: "↓ + A",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(3, { ...STANCE, crouch: 1, shoulderF: 24, elbowF: 74, weapon: 44, torso: 26, offX: -3 }, "out"),
        kf(5, { ...STANCE, crouch: 1, shoulderF: 2, elbowF: 20, weapon: -18, torso: 40, offX: 6 }, "linear"),
        kf(10, { ...STANCE, crouch: 1, shoulderF: 18, elbowF: 48, weapon: 16, torso: 32 }, "inOut"),
        kf(14, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "2B",
      name: "Hamstring",
      input: { button: "B", stance: "crouch" },
      tags: ["medium", "low"],
      duration: 23,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [8, 21],
      hits: [hit(9, 13, bx(24, 2, 82, 22), 50, { guard: "low", fx: "pierce", pushX: 4, hitstun: 19, hitstop: 7 })],
      desc: "Point into the back of the leg from a crouch. Blocked standing it does nothing; blocked at all it still moves them.",
      notation: "↓ + B",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(4, { ...STANCE, crouch: 1, shoulderF: 40, elbowF: 78, weapon: -30, torso: 18, offX: -4 }, "out"),
        kf(9, { ...STANCE, crouch: 1, shoulderF: -4, elbowF: 14, weapon: 40, torso: 42, hipF: 34, offX: 9 }, "out"),
        kf(16, { ...STANCE, crouch: 1, shoulderF: 16, elbowF: 44, weapon: 16, torso: 32, offX: 4 }, "inOut"),
        kf(23, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "2C",
      name: "Take the Legs",
      input: { button: "C", stance: "crouch" },
      tags: ["heavy", "low"],
      duration: 33,
      cancelInto: ["special", "super"],
      cancelWindow: [13, 29],
      hits: [hit(14, 19, bx(22, 0, 94, 20), 72, {
        guard: "low",
        fx: "blunt",
        pushX: 6,
        knockdown: "sweep",
        hitstun: 20,
        hitstop: 10,
        shake: 1.6,
      })],
      desc: "Sweeps the shaft along the floor and takes their feet away. What you do to something bigger than you.",
      notation: "↓ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 1 }, "out"),
        kf(6, { ...STANCE, crouch: 1, shoulderF: 76, elbowF: 66, weapon: 72, torso: 12, offX: -5 }, "out"),
        kf(14, { ...STANCE, crouch: 1, squash: 0.94, shoulderF: -14, elbowF: 8, weapon: -46, torso: 44, hipF: 26, kneeF: 90, hipB: -34, kneeB: 98, offX: 11 }, "out"),
        kf(23, { ...STANCE, crouch: 1, shoulderF: 14, elbowF: 42, weapon: -4, torso: 34, offX: 5 }, "inOut"),
        kf(33, { ...STANCE, crouch: 1 }),
      ],
    },
    {
      id: "6A",
      name: "Shoulder",
      input: { button: "A", dir: "f", stance: "stand" },
      tags: ["light"],
      duration: 16,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [5, 14],
      vel: [{ at: 3, x: 2.2 }, { at: 9, x: 0 }],
      friction: 0.9,
      hits: [hit(6, 9, bx(12, 48, 48, 34), 34, { fx: "blunt", pushX: 5, hitstun: 15 })],
      desc: "Puts the shoulder into them. Nothing in that hand, so the body does it.",
      notation: "→ + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, torso: 8, crouch: 0.28, offX: 1 }, "out"),
        kf(6, { ...STANCE, torso: 42, crouch: 0.14, hipF: 36, kneeF: 22, offX: 6 }, "out"),
        kf(12, { ...STANCE, torso: 30, offX: 2 }, "inOut"),
        kf(16, { ...STANCE }),
      ],
    },
    {
      id: "6B",
      name: "Headbutt",
      input: { button: "B", dir: "f", stance: "stand" },
      tags: ["medium"],
      duration: 24,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [9, 22],
      hits: [hit(10, 13, bx(10, 56, 46, 34), 52, { fx: "blunt", pushX: 6, hitstun: 20, hitstop: 9, shake: 1.4 })],
      desc: "Forehead into the face. That skull is thicker than anything else on the roster and he knows it.",
      notation: "→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, torso: 4, head: -14, crouch: 0.3, offX: 1 }, "out"),
        kf(10, { ...STANCE, torso: 46, head: 20, crouch: 0.1, hipF: 34, kneeF: 18, offX: 7 }, "out"),
        kf(17, { ...STANCE, torso: 32, head: 10 }, "inOut"),
        kf(24, { ...STANCE }),
      ],
    },
    {
      id: "6C",
      name: "Bear Him Off",
      input: { button: "C", dir: "f", stance: "stand" },
      tags: ["heavy"],
      duration: 34,
      hits: [hit(12, 16, bx(12, 24, 64, 60), 58, {
        fx: "blunt",
        pushX: 17,
        selfPushX: -2,
        hitstun: 18,
        hitstop: 10,
        shake: 1.8,
      })],
      desc: "Gets under them and drives. Barely hurts and puts them across the stage, which at his walk speed is the last thing he wants - but it is the only way he ever gets room.",
      notation: "→ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, torso: 2, crouch: 0.42, hipB: -36, kneeB: 62, offX: -5 }, "out"),
        kf(12, { ...STANCE, torso: 52, crouch: 0.16, hipF: 46, kneeF: 26, hipB: -38, kneeB: 48, offX: 11 }, "out"),
        kf(21, { ...STANCE, torso: 34, offX: 4 }, "inOut"),
        kf(34, { ...STANCE }),
      ],
    },
    {
      id: "3C",
      name: "Over the Guard",
      input: { button: "C", dir: "df", stance: ["stand", "crouch"] },
      tags: ["heavy", "overhead", "launcher"],
      duration: 38,
      hits: [hit(18, 22, bx(20, 34, 82, 62), 70, {
        guard: "overhead",
        fx: "blunt",
        launch: [2.2, 10],
        knockdown: "launch",
        hitstun: 24,
        hitstop: 10,
        shake: 1.7,
      })],
      desc: "Brings the shaft up and down over the top of a crouching guard. Slow enough to see coming, and it puts them in the air.",
      notation: "↘ + C",
      frames: [
        kf(0, { ...STANCE, crouch: 0.4 }, "out"),
        kf(9, { ...STANCE, shoulderF: 176, elbowF: -20, weapon: -50, torso: -8, hipB: -34, kneeB: 54, offX: -6, offY: 2 }, "inOut"),
        kf(14, { ...STANCE, shoulderF: 188, elbowF: -24, weapon: -56, torso: -12, offX: -7 }, "in"),
        kf(18, { ...STANCE, shoulderF: 120, elbowF: -8, weapon: -22, torso: 22, hipF: 32, kneeF: 16, offX: 6 }, "linear"),
        kf(22, { ...STANCE, shoulderF: 54, elbowF: 8, weapon: -8, torso: 48, hipF: 44, kneeF: 26, crouch: 0.3, offX: 10 }, "out"),
        kf(30, { ...STANCE, shoulderF: 46, elbowF: 44, weapon: 22, torso: 32, crouch: 0.2, offX: 4 }, "inOut"),
        kf(38, { ...STANCE }),
      ],
    },
    {
      id: "4A",
      name: "Give a Pace",
      input: { button: "A", dir: "b", stance: "stand" },
      tags: ["light"],
      duration: 16,
      cancelInto: ["medium", "heavy", "special", "super"],
      cancelWindow: [5, 14],
      vel: [{ at: 2, x: -2 }, { at: 8, x: 0 }],
      friction: 0.9,
      hits: [hit(6, 9, bx(24, 48, 56, 22), 30, { fx: "blunt", pushX: 4, hitstun: 14 })],
      desc: "Steps off and pokes the space he left. He cannot outrun anybody, so this is most of his retreat.",
      notation: "← + A",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(2, { ...STANCE, shoulderF: 56, elbowF: 22, weapon: 10, torso: 30, offX: 2 }, "out"),
        kf(6, { ...STANCE, shoulderF: 50, elbowF: 32, weapon: 16, torso: 22, hipB: -32, kneeB: 52, offX: -2 }, "linear"),
        kf(9, { ...STANCE, shoulderF: 32, elbowF: 70, weapon: 44, torso: 12, hipB: -36, kneeB: 56, offX: -5 }, "out"),
        kf(16, { ...STANCE }),
      ],
    },
    {
      id: "4B",
      name: "Set the Point",
      input: { button: "B", dir: "b", stance: "stand" },
      tags: ["medium"],
      duration: 25,
      cancelInto: ["heavy", "special", "super"],
      cancelWindow: [9, 23],
      // Held out rather than swung, and for a long time. He cannot chase, so
      // what he does instead is stand somewhere with the point out and be
      // extremely inconvenient to walk into.
      hits: [hit(9, 18, bx(22, 42, 68, 46), 50, {
        fx: "pierce",
        pushX: 7,
        hitstun: 20,
        hitstop: 8,
        shake: 1.2,
      })],
      desc: "Braces the butt against his heel and holds the point at them for ten frames. Somebody walking in walks onto it.",
      notation: "← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, shoulderF: 34, elbowF: 60, weapon: -8, torso: 14, crouch: 0.26, hipB: -34, kneeB: 56, offX: -4 }, "out"),
        kf(9, { ...STANCE, shoulderF: 20, elbowF: 44, weapon: -4, torso: 26, crouch: 0.42, hipF: 32, kneeF: 30, hipB: -38, kneeB: 64, offX: -2 }, "inOut"),
        kf(18, { ...STANCE, shoulderF: 22, elbowF: 46, weapon: -6, torso: 28, crouch: 0.42, offX: -2 }, "inOut"),
        kf(25, { ...STANCE }),
      ],
    },
    {
      id: "4C",
      name: "Backhand Shaft",
      input: { button: "C", dir: "b", stance: "stand" },
      tags: ["heavy"],
      duration: 33,
      cancelInto: ["special", "super"],
      cancelWindow: [13, 29],
      hits: [hit(13, 17, bx(20, 34, 86, 44), 66, {
        fx: "blunt",
        pushX: 9,
        knockdown: "soft",
        hitstun: 21,
        hitstop: 10,
        shake: 1.6,
      })],
      desc: "Turns the shaft back across on the retreat and knocks them down with it.",
      notation: "← + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(6, { ...STANCE, shoulderF: -22, elbowF: 44, weapon: 8, torso: 34, hipB: -34, kneeB: 52, offX: -4 }, "out"),
        kf(13, { ...STANCE, shoulderF: 116, elbowF: 6, weapon: 34, torso: 4, hipB: -38, kneeB: 58, offX: -3 }, "out"),
        kf(21, { ...STANCE, shoulderF: 62, elbowF: 44, weapon: 34, torso: 18, offX: -2 }, "inOut"),
        kf(33, { ...STANCE }),
      ],
    },
    {
      id: "jA",
      name: "Air Poke",
      input: { button: "A", stance: "air" },
      tags: ["light", "air"],
      duration: 16,
      hits: [hit(5, 10, bx(20, 22, 52, 26), 32, { fx: "blunt", pushX: 3, hitstun: 14 })],
      desc: "Sticks the shaft out on the way past.",
      notation: "(air) A",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 36, kneeF: 48, hipB: -26, kneeB: 44 }, "out"),
        kf(5, { ...STANCE, free: 1, shoulderF: 60, elbowF: 18, weapon: 6, torso: 26, hipF: 40, kneeF: 52 }),
        kf(16, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 42 }),
      ],
    },
    {
      id: "jB",
      name: "Air Swing",
      input: { button: "B", stance: "air" },
      tags: ["medium", "air"],
      duration: 22,
      hits: [hit(7, 13, bx(22, 12, 76, 32), 52, { fx: "blunt", pushX: 5, hitstun: 18, hitstop: 7 })],
      desc: "Takes the shaft across while he is off the ground, which he is not often.",
      notation: "(air) B",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 34, kneeF: 48, hipB: -26, kneeB: 44 }, "out"),
        kf(3, { ...STANCE, free: 1, shoulderF: 150, elbowF: -10, weapon: -34, torso: 4, hipF: 42, kneeF: 54 }, "out"),
        kf(8, { ...STANCE, free: 1, shoulderF: 62, elbowF: 8, weapon: 0, torso: 32, hipF: 36, kneeF: 50, hipB: -28, kneeB: 46 }, "out"),
        kf(22, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 42 }),
      ],
    },
    {
      id: "jC",
      name: "Drop",
      input: { button: "C", stance: "air" },
      tags: ["heavy", "air"],
      duration: 28,
      hits: [hit(9, 17, bx(16, -8, 70, 58), 74, {
        fx: "blunt",
        pushX: 6,
        knockdown: "soft",
        hitstun: 20,
        hitstop: 10,
        shake: 1.6,
      })],
      desc: "All of him, downward. He weighs more than anyone else here.",
      notation: "(air) C",
      frames: [
        kf(0, { ...STANCE, free: 1, hipF: 34, kneeF: 48, hipB: -26, kneeB: 44 }, "out"),
        kf(4, { ...STANCE, free: 1, shoulderF: 178, elbowF: -18, weapon: -54, torso: -6, hipF: 46, kneeF: 58 }, "out"),
        kf(10, { ...STANCE, free: 1, shoulderF: 44, elbowF: 6, weapon: -12, torso: 44, hipF: 32, kneeF: 46, hipB: -22, kneeB: 38 }, "out"),
        kf(28, { ...STANCE, free: 1, hipF: 32, kneeF: 46, hipB: -24, kneeB: 42 }),
      ],
    },
    {
      id: "dashAttack",
      name: "Running Shoulder",
      input: { button: "C", dir: "f", stance: "stand", whileDashing: true },
      tags: ["heavy"],
      duration: 32,
      vel: [{ at: 1, x: 6.8 }, { at: 15, x: 0 }],
      friction: 0.9,
      hits: [hit(7, 13, bx(12, 28, 76, 56), 68, {
        fx: "blunt",
        pushX: 9,
        knockdown: "soft",
        hitstun: 20,
        hitstop: 10,
        shake: 1.8,
      })],
      desc: "Runs at them and does not stop. There is no technique in it at all.",
      notation: "→→ then C",
      frames: [
        kf(0, { ...STANCE, torso: 36, offX: 2 }, "out"),
        kf(4, { ...STANCE, torso: 16, crouch: 0.3, offX: -3 }, "out"),
        kf(7, { ...STANCE, torso: 52, crouch: 0.12, hipF: 44, kneeF: 20, offX: 9 }, "out"),
        kf(19, { ...STANCE, torso: 34, offX: 4 }, "inOut"),
        kf(32, { ...STANCE }),
      ],
    },

    // --------------------------------------------------------- five specials
    {
      id: "handAxe",
      name: "Hand-Axe",
      input: { button: "B", motion: "qcf", stance: ["stand", "crouch"] },
      tags: ["special", "projectile"],
      priority: 24,
      duration: 44,
      resourceCost: 1,
      resourceMin: 1,
      friction: 0.9,
      meterGain: 12,
      showProps: ["stone"],
      hideProps: ["spear"],
      // The spear has to go down for it, because it is the same hand. That is
      // the whole cost and it is not a small one: for forty-four frames the
      // only thing he owns is on the floor.
      propsAt: [{ from: 0, to: 44, show: ["stone"], hide: ["spear"] }],
      projectiles: [{
        at: 16,
        kind: "handaxe",
        x: 26,
        y: 52,
        vx: 9,
        vy: 2.4,
        gravity: 0.22,
        life: 80,
        box: { x: -11, y: -11, w: 22, h: 22 },
        damage: 74,
        hitstun: 20,
        blockstun: 13,
        pushX: 7,
        chip: 8,
        fx: "blunt",
        hitstop: 9,
        meterGain: 8,
        spin: 22,
        scale: 1,
        color: STONE,
      }],
      desc: "Puts the spear down and throws a stone. It is the only thing he can do past arm's length, it drops as it goes, and he is unarmed while he does it.",
      notation: "↓↘→ + B (1 Sinew)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(8, { ...STANCE, shoulderF: 172, elbowF: -22, weapon: 0, torso: -6, hipB: -34, kneeB: 54, offX: -7 }, "out"),
        kf(16, { ...STANCE, shoulderF: 64, elbowF: -4, torso: 42, hipF: 42, kneeF: 22, offX: 9 }, "linear"),
        kf(26, { ...STANCE, shoulderF: 46, elbowF: 44, torso: 30, offX: 3 }, "inOut"),
        kf(44, { ...STANCE }),
      ],
    },
    {
      id: "ambush",
      name: "The Close",
      input: { button: "B", motion: "hcf", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 26,
      duration: 46,
      vel: [{ at: 6, x: 9.6 }, { at: 26, x: 0 }],
      friction: 0.9,
      meterGain: 16,
      // Neanderthal skeletons carry the injury pattern of rodeo riders, which
      // is what happens to a body that hunts by getting hold of large animals
      // at arm's length rather than throwing things at them. Two hits of
      // armour, because a fighter this slow who can be interrupted on the way
      // in has no way in at all.
      armor: [{ from: 6, to: 24, hits: 1, damageScale: 0.35 }],
      hits: [hit(14, 20, bx(10, 22, 92, 62), 70, {
        fx: "blunt",
        pushX: 11,
        knockdown: "hard",
        hitstun: 24,
        hitstop: 12,
        shake: 2.4,
      })],
      desc: "Puts his head down and closes, and takes two hits on the way in without stopping. This is how the hunting was done - not thrown, closed.",
      notation: "←↙↓↘→ + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(5, { ...STANCE, torso: 6, crouch: 0.44, head: -10, hipB: -38, kneeB: 64, offX: -5 }, "out"),
        kf(14, { ...STANCE, torso: 54, crouch: 0.2, head: 14, hipF: 46, kneeF: 24, hipB: -34, kneeB: 42, offX: 10 }, "out"),
        kf(26, { ...STANCE, torso: 38, crouch: 0.1, offX: 4 }, "inOut"),
        kf(46, { ...STANCE }),
      ],
    },
    {
      id: "ambushEx",
      name: "The Close EX",
      input: { button: "S", motion: "hcf", stance: ["stand", "crouch"] },
      tags: ["special", "ex"],
      priority: 34,
      duration: 58,
      meterCost: 50,
      vel: [{ at: 6, x: 10.6 }, { at: 34, x: 0 }],
      friction: 0.9,
      armor: [{ from: 4, to: 34, hits: 3, damageScale: 0.28 }],
      hits: [
        hit(14, 19, bx(10, 22, 92, 62), 54, { group: 1, fx: "blunt", pushX: 3, hitstun: 19, hitstop: 7 }),
        hit(28, 35, bx(8, 16, 86, 70), 78, {
          group: 2,
          fx: "blunt",
          pushX: 12,
          knockdown: "hard",
          hitstun: 25,
          hitstop: 14,
          shake: 2.6,
        }),
      ],
      desc: "EX. Three hits of armour, and he lands on them twice. Nothing short of a super stops this once it starts.",
      notation: "←↙↓↘→ + S (50 meter)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, torso: 4, crouch: 0.48, head: -12, hipB: -38, kneeB: 66, offX: -6 }, "out"),
        kf(14, { ...STANCE, torso: 54, crouch: 0.2, head: 14, hipF: 46, kneeF: 24, offX: 10 }, "out"),
        kf(22, { ...STANCE, torso: 20, crouch: 0.36, head: -4, offX: 2 }, "inOut"),
        kf(28, { ...STANCE, torso: 58, crouch: 0.14, head: 18, hipF: 50, kneeF: 28, offX: 12 }, "out"),
        kf(42, { ...STANCE, torso: 36, offX: 4 }, "inOut"),
        kf(58, { ...STANCE }),
      ],
    },
    {
      id: "healed",
      name: "It Healed",
      input: { button: "C", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 24,
      duration: 50,
      friction: 0.78,
      meterGain: 20,
      resourceCost: 1,
      resourceMin: 1,
      // Every injury on that skeleton healed. He was blind, one-armed, lame
      // and deaf, and he lived years like that - which only happens if other
      // people carried him. So the move is not a heal and not a rage: it is
      // damage already taken turning into being harder to finish.
      grants: [{ damageTaken: 0.82, frames: 600, stacks: 2 }],
      vfx: [
        { at: 12, kind: "aura", x: 0, y: 46, scale: 1.8, color: "#d8a05c" },
        { at: 26, kind: "spark", x: 6, y: 54, scale: 1.1, color: "#e8c46a" },
      ],
      desc: "Straightens up out of it. No hitbox, fifty frames of standing there, and for the next ten seconds everything hurts him a fifth less. Two of them stack - the bar only fills when he is being hit, so this is bought with damage already taken.",
      notation: "↓↙← + C (1 Sinew)",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(10, { ...STANCE, torso: 44, head: 18, crouch: 0.5, shoulderF: 20, elbowF: 84, weapon: 50, hipF: 34, kneeF: 66, hipB: -32, kneeB: 72, offX: -3 }, "out"),
        kf(24, { ...STANCE, torso: -6, head: -12, crouch: 0, shoulderF: 58, elbowF: 30, weapon: 10, squash: 1.03, hipF: 12, kneeF: 14, hipB: -18, kneeB: 26, offY: 2 }, "inOut"),
        kf(38, { ...STANCE, torso: 10, head: -4, shoulderF: 50, elbowF: 46, weapon: 22 }, "inOut"),
        kf(50, { ...STANCE }),
      ],
    },
    {
      id: "gore",
      name: "Up Under the Jaw",
      input: { button: "C", motion: "dp", stance: ["stand", "crouch"] },
      tags: ["special"],
      priority: 28,
      duration: 40,
      vel: [{ at: 4, x: 1.8, y: 9.6 }, { at: 22, x: 0 }],
      airborne: true,
      friction: 0.94,
      invuln: [{ from: 3, to: 10, kind: "strike" }],
      hits: [hit(5, 13, bx(14, 48, 60, 82), 74, {
        fx: "pierce",
        pushX: 6,
        launch: [2, 9.5],
        knockdown: "launch",
        hitstun: 22,
        hitstop: 11,
        shake: 1.9,
      })],
      desc: "Comes up off the back foot with the point going first. His only invulnerable frames and the only thing he has for somebody in the air.",
      notation: "→↓↘ + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(3, { ...STANCE, crouch: 0.6, shoulderF: 18, elbowF: 76, weapon: -14, torso: 40, hipF: 32, kneeF: 68, hipB: -30, kneeB: 74 }, "out"),
        kf(5, { ...STANCE, free: 1, shoulderF: 134, elbowF: -22, weapon: -26, torso: -8, hipF: 24, kneeF: 22, hipB: -32, kneeB: 28, offY: 3 }, "out"),
        kf(13, { ...STANCE, free: 1, shoulderF: 160, elbowF: -28, weapon: -38, torso: -16, hipF: 32, kneeF: 42, hipB: -24, kneeB: 46 }, "inOut"),
        kf(26, { ...STANCE, free: 1, shoulderF: 66, elbowF: 34, weapon: 20, torso: 20, hipF: 36, kneeF: 50, hipB: -24, kneeB: 44 }, "inOut"),
        kf(40, { ...STANCE }),
      ],
    },
    {
      id: "overbear",
      name: "Get Hold of Them",
      input: { button: "B", motion: "qcb", stance: ["stand", "crouch"] },
      tags: ["special", "throw"],
      priority: 30,
      duration: 44,
      vel: [{ at: 4, x: 4.6 }, { at: 16, x: 0 }],
      friction: 0.88,
      throwDef: { from: 8, to: 14, range: 74, success: "overbearThrow" },
      desc: "Reaches out and takes hold. It goes through a guard, because a guard is no answer to being picked up - and if he catches nothing he has spent forty-four frames in the open.",
      notation: "↓↙← + B",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(4, { ...STANCE, torso: 8, crouch: 0.4, shoulderF: 84, elbowF: 40, weapon: 20, hipB: -34, kneeB: 58, offX: -3 }, "out"),
        kf(8, { ...STANCE, torso: 40, crouch: 0.18, shoulderF: 100, elbowF: 12, weapon: 4, hipF: 40, kneeF: 22, offX: 8 }, "out"),
        kf(20, { ...STANCE, torso: 30, shoulderF: 62, elbowF: 44, weapon: 24, offX: 3 }, "inOut"),
        kf(44, { ...STANCE }),
      ],
    },
    {
      id: "overbearThrow",
      name: "Bore Him Down",
      input: { stance: "stand" },
      tags: ["throw"],
      internal: true,
      duration: 62,
      grabOffset: [40, 34],
      throwPayload: { at: 30, damage: 116, hitstop: 16, launch: [3.5, 5], knockdown: "hard", shake: 3, fx: "blunt" },
      desc: "Takes them off their feet and puts his whole weight through them on the way down.",
      notation: "(automatic)",
      frames: [
        kf(0, { ...STANCE, torso: 40, crouch: 0.18, shoulderF: 100, elbowF: 12 }, "out"),
        kf(14, { ...STANCE, torso: 12, crouch: 0, shoulderF: 150, elbowF: -14, head: -12, squash: 1.04, offY: 3 }, "out"),
        kf(30, { ...STANCE, torso: 62, crouch: 0.62, squash: 0.94, shoulderF: 30, elbowF: 20, head: 22, hipF: 46, kneeF: 86, hipB: -34, kneeB: 92, offX: 6 }, "out"),
        kf(44, { ...STANCE, torso: 44, crouch: 0.4, shoulderF: 40, elbowF: 46, head: 14, offX: 3 }, "inOut"),
        kf(62, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- skill
    {
      id: "kept",
      name: "They Kept Him",
      input: { buttons: ["A", "C"], stance: ["stand", "crouch"] },
      tags: ["skill"],
      priority: 18,
      duration: 44,
      friction: 0.78,
      resourceGain: 1,
      meterGain: 14,
      // The one thing this character is actually about. He could not hunt,
      // could not have carried his own share, and lived for years anyway -
      // which is a decision somebody else made, over and over, in a place
      // with no margin. There is no hitbox in it and there should not be.
      vfx: [
        { at: 14, kind: "aura", x: 0, y: 50, scale: 1.6, color: "#d8a05c" },
        { at: 28, kind: "dust", x: 0, y: 6, scale: 1.4 },
      ],
      desc: "SKILL. Leans on the spear and gets his breath. One Sinew back, and forty-four frames in the open to get it - the only way he refills that is not being hit.",
      notation: "A + C",
      frames: [
        kf(0, { ...STANCE }, "out"),
        kf(12, { ...STANCE, torso: 52, head: 22, crouch: 0.46, shoulderF: 16, elbowF: 88, weapon: 56, hipF: 36, kneeF: 62, hipB: -30, kneeB: 68, offX: -4 }, "out"),
        kf(26, { ...STANCE, torso: 46, head: 18, crouch: 0.4, shoulderF: 20, elbowF: 84, weapon: 52 }, "inOut"),
        kf(36, { ...STANCE, torso: 30, head: 10, crouch: 0.16, shoulderF: 40, elbowF: 60, weapon: 34 }, "inOut"),
        kf(44, { ...STANCE }),
      ],
    },

    // ----------------------------------------------------------------- super
    {
      id: "super",
      name: "Forty Thousand Years",
      input: { button: "S", motion: "dd", stance: ["stand", "crouch"] },
      tags: ["super"],
      priority: 60,
      duration: 108,
      meterCost: 100,
      superFreeze: 40,
      invuln: [{ from: 1, to: 16, kind: "strike" }],
      vel: [
        { at: 10, x: 8.5 },
        { at: 40, x: 4 },
        { at: 70, x: 0 },
      ],
      friction: 0.92,
      // Everything he is, in order: he closes, he gets hold, and then it is
      // weight and the floor. No technique anywhere in it.
      hits: [
        hit(16, 22, bx(10, 20, 92, 66), 62, { group: 1, fx: "blunt", pushX: 3, hitstun: 22, hitstop: 8, shake: 2 }),
        hit(34, 40, bx(8, 16, 88, 72), 54, { group: 2, fx: "blunt", pushX: 2, hitstun: 20, hitstop: 7, shake: 1.8 }),
        hit(52, 58, bx(8, 12, 90, 76), 54, { group: 3, fx: "blunt", pushX: 2, hitstun: 20, hitstop: 7, shake: 1.8 }),
        hit(80, 88, bx(12, 8, 96, 84), 140, {
          group: 4,
          fx: "blunt",
          pushX: 10,
          knockdown: "hard",
          launch: [3, 7.5],
          hitstun: 26,
          hitstop: 18,
          shake: 3.4,
        }),
      ],
      vfx: [
        { at: 2, kind: "super", x: 0, y: 46, scale: 2.4, color: "#d8a05c" },
        { at: 16, kind: "dust", x: 20, y: 4, scale: 1.6 },
        { at: 52, kind: "dust", x: 26, y: 4, scale: 1.6 },
        { at: 80, kind: "explode", x: 44, y: 26, scale: 1.5, color: "#d8a05c" },
      ],
      desc: "SUPER. Closes, gets hold, and puts them into the floor three times. He is the oldest thing on this roster by forty thousand years and he is still standing, which is the whole argument.",
      notation: "↓↓ + S (100 meter)",
      frames: [
        kf(0, { ...STANCE, crouch: 0.5, torso: 8 }, "out"),
        kf(10, { ...STANCE, torso: 10, crouch: 0.4, head: -12, hipB: -38, kneeB: 62, offX: -5 }, "out"),
        kf(16, { ...STANCE, torso: 56, crouch: 0.16, head: 16, hipF: 46, kneeF: 24, offX: 10 }, "out"),
        kf(28, { ...STANCE, torso: 24, crouch: 0.34, shoulderF: 120, elbowF: 8, head: -6, offX: 3 }, "inOut"),
        kf(34, { ...STANCE, torso: 60, crouch: 0.5, squash: 0.95, shoulderF: 34, elbowF: 24, head: 20, hipF: 44, kneeF: 78, offX: 8 }, "out"),
        kf(46, { ...STANCE, torso: 26, crouch: 0.3, shoulderF: 126, elbowF: 4, head: -8, offX: 3 }, "inOut"),
        kf(52, { ...STANCE, torso: 62, crouch: 0.52, squash: 0.94, shoulderF: 30, elbowF: 20, head: 22, hipF: 46, kneeF: 82, offX: 9 }, "out"),
        kf(66, { ...STANCE, torso: 30, crouch: 0.24, shoulderF: 60, elbowF: 46, head: 6, offX: 3 }, "inOut"),
        // And once more, with everything.
        kf(76, { ...STANCE, torso: 0, crouch: 0, shoulderF: 168, elbowF: -18, weapon: -46, head: -18, squash: 1.05, hipF: 16, kneeF: 12, offY: 4 }, "in"),
        kf(80, { ...STANCE, torso: 44, crouch: 0.3, shoulderF: 84, elbowF: -6, weapon: -20, head: 12, hipF: 42, kneeF: 30, offX: 8 }, "linear"),
        kf(88, { ...STANCE, torso: 66, crouch: 0.6, squash: 0.92, shoulderF: 22, elbowF: 18, weapon: -6, head: 26, hipF: 48, kneeF: 88, hipB: -34, kneeB: 94, offX: 12 }, "out"),
        kf(98, { ...STANCE, torso: 42, crouch: 0.28, shoulderF: 44, elbowF: 48, weapon: 20, head: 12, offX: 4 }, "inOut"),
        kf(108, { ...STANCE }),
      ],
    },
  ],
};

/**
 * Default movement and reaction animations shared by every fighter.
 *
 * These use additive keyframes (`add`), so a fighter's own stance still shows
 * through while they walk, block or get hit. A fighter can override any clip in
 * its `clips` map to get a signature look.
 */

import type { ClipDef, ClipName } from "./types";

export const DEFAULT_CLIPS: Record<ClipName, ClipDef> = {
  idle: {
    length: 72,
    loop: true,
    frames: [
      { t: 0, add: {}, ease: "inOut" },
      { t: 18, add: { torso: 1.5, offY: 1.2, shoulderF: 3, shoulderB: -3, head: -1 }, ease: "inOut" },
      { t: 36, add: { torso: 0, offY: 0, shoulderF: 0, shoulderB: 0 }, ease: "inOut" },
      { t: 54, add: { torso: -1, offY: 1.4, shoulderF: -2, shoulderB: 2, head: 1 }, ease: "inOut" },
      { t: 72, add: {} },
    ],
  },

  walkF: {
    length: 32,
    loop: true,
    frames: [
      { t: 0, add: { hipF: 18, kneeF: 12, hipB: -16, kneeB: 22, torso: 3, shoulderF: -8, shoulderB: 10 }, ease: "inOut" },
      { t: 8, add: { hipF: 4, kneeF: 4, hipB: -4, kneeB: 6, offY: 2, torso: 2 }, ease: "inOut" },
      { t: 16, add: { hipF: -16, kneeF: 20, hipB: 18, kneeB: 12, torso: 3, shoulderF: 10, shoulderB: -8 }, ease: "inOut" },
      { t: 24, add: { hipF: -4, kneeF: 6, hipB: 4, kneeB: 4, offY: 2, torso: 2 }, ease: "inOut" },
      { t: 32, add: { hipF: 18, kneeF: 12, hipB: -16, kneeB: 22, torso: 3, shoulderF: -8, shoulderB: 10 } },
    ],
  },

  walkB: {
    length: 36,
    loop: true,
    frames: [
      { t: 0, add: { hipF: -12, kneeF: 16, hipB: 12, kneeB: 10, torso: -3 }, ease: "inOut" },
      { t: 9, add: { hipF: -2, kneeF: 6, hipB: 2, kneeB: 4, offY: 1.5, torso: -2 }, ease: "inOut" },
      { t: 18, add: { hipF: 12, kneeF: 10, hipB: -12, kneeB: 18, torso: -3 }, ease: "inOut" },
      { t: 27, add: { hipF: 2, kneeF: 4, hipB: -2, kneeB: 6, offY: 1.5, torso: -2 }, ease: "inOut" },
      { t: 36, add: { hipF: -12, kneeF: 16, hipB: 12, kneeB: 10, torso: -3 } },
    ],
  },

  crouch: {
    length: 6,
    frames: [
      { t: 0, add: {}, ease: "out" },
      { t: 4, add: { crouch: 1, hipF: 34, kneeF: 74, hipB: -22, kneeB: 84, torso: 16, shoulderF: 14, elbowF: 24, shoulderB: 8, elbowB: 20 } },
      { t: 6, add: { crouch: 1, hipF: 34, kneeF: 72, hipB: -22, kneeB: 84, torso: 16, shoulderF: 14, elbowF: 24, shoulderB: 8, elbowB: 20 } },
    ],
  },

  jumpSquat: {
    length: 4,
    frames: [
      { t: 0, add: {}, ease: "in" },
      { t: 4, add: { crouch: 0.75, hipF: 24, kneeF: 52, hipB: -18, kneeB: 58, torso: 12, shoulderF: -14, shoulderB: -10 } },
    ],
  },

  jumpUp: {
    length: 20,
    frames: [
      { t: 0, add: { free: 1, hipF: 40, kneeF: 60, hipB: -28, kneeB: 36, torso: -4, shoulderF: -40, shoulderB: -30, elbowF: 30, elbowB: 26 }, ease: "out" },
      { t: 12, add: { free: 1, hipF: 34, kneeF: 46, hipB: -20, kneeB: 30, torso: 2, shoulderF: -22, shoulderB: -16, elbowF: 22, elbowB: 20 } },
    ],
  },

  jumpFall: {
    length: 20,
    frames: [
      { t: 0, add: { free: 1, hipF: 22, kneeF: 30, hipB: -14, kneeB: 26, torso: 6, shoulderF: -30, shoulderB: -24, elbowF: 18, elbowB: 16 }, ease: "out" },
      { t: 16, add: { free: 1, hipF: 14, kneeF: 20, hipB: -22, kneeB: 40, torso: 8, shoulderF: -44, shoulderB: -36, elbowF: 14, elbowB: 12 } },
    ],
  },

  land: {
    length: 8,
    frames: [
      { t: 0, add: { crouch: 0.85, hipF: 26, kneeF: 56, hipB: -20, kneeB: 62, torso: 14, shoulderF: -6, shoulderB: 6 }, ease: "out" },
      { t: 8, add: {} },
    ],
  },

  dash: {
    length: 18,
    frames: [
      { t: 0, add: { torso: 14, hipF: 26, kneeF: 30, hipB: -30, kneeB: 50, shoulderF: -16, shoulderB: 22 }, ease: "out" },
      { t: 8, add: { torso: 18, offY: 2, hipF: -18, kneeF: 42, hipB: 26, kneeB: 22, shoulderF: 18, shoulderB: -14 }, ease: "inOut" },
      { t: 18, add: { torso: 10, hipF: 14, kneeF: 18, hipB: -12, kneeB: 26 } },
    ],
  },

  backdash: {
    length: 20,
    frames: [
      { t: 0, add: { torso: -10, free: 1, offY: 4, hipF: 30, kneeF: 44, hipB: -18, kneeB: 40, shoulderF: -20, shoulderB: -14 }, ease: "out" },
      { t: 10, add: { torso: -14, free: 1, offY: 8, hipF: 38, kneeF: 56, hipB: -10, kneeB: 30, shoulderF: -26, shoulderB: -20 }, ease: "in" },
      { t: 20, add: { torso: -4, hipF: 12, kneeF: 20, hipB: -10, kneeB: 22 } },
    ],
  },

  blockHigh: {
    length: 6,
    frames: [
      { t: 0, add: {}, ease: "out" },
      { t: 3, add: { torso: -8, shoulderF: 78, elbowF: 92, shoulderB: 60, elbowB: 88, hipF: 12, kneeF: 22, hipB: -14, kneeB: 30, offX: -2 } },
      { t: 6, add: { torso: -8, shoulderF: 76, elbowF: 90, shoulderB: 58, elbowB: 86, hipF: 12, kneeF: 22, hipB: -14, kneeB: 30, offX: -2 } },
    ],
  },

  blockLow: {
    length: 6,
    frames: [
      { t: 0, add: {}, ease: "out" },
      { t: 3, add: { crouch: 1, torso: 12, shoulderF: 54, elbowF: 88, shoulderB: 40, elbowB: 80, hipF: 34, kneeF: 76, hipB: -22, kneeB: 86, offX: -2 } },
      { t: 6, add: { crouch: 1, torso: 12, shoulderF: 52, elbowF: 86, shoulderB: 38, elbowB: 78, hipF: 34, kneeF: 74, hipB: -22, kneeB: 86, offX: -2 } },
    ],
  },

  blockAir: {
    length: 6,
    frames: [
      { t: 0, add: { free: 1 }, ease: "out" },
      { t: 4, add: { free: 1, torso: -10, shoulderF: 84, elbowF: 96, shoulderB: 66, elbowB: 90, hipF: 34, kneeF: 50, hipB: -20, kneeB: 44 } },
    ],
  },

  parry: {
    length: 14,
    frames: [
      { t: 0, add: {}, ease: "out" },
      { t: 3, add: { torso: 6, shoulderF: 96, elbowF: 40, shoulderB: 30, elbowB: 60, offX: 3 } },
      { t: 9, add: { torso: 4, shoulderF: 70, elbowF: 60, shoulderB: 24, elbowB: 52 }, ease: "inOut" },
      { t: 14, add: {} },
    ],
  },

  hitHigh: {
    length: 14,
    frames: [
      { t: 0, add: { torso: -18, head: -14, offX: -4, shoulderF: -20, elbowF: 40, shoulderB: -14, hipF: -8, kneeF: 16, hipB: 10, kneeB: 24 }, ease: "out" },
      { t: 7, add: { torso: -10, head: -8, offX: -2, shoulderF: -10, elbowF: 26 }, ease: "inOut" },
      { t: 14, add: {} },
    ],
  },

  hitMid: {
    length: 14,
    frames: [
      { t: 0, add: { torso: 18, head: 10, offX: -4, shoulderF: -30, elbowF: 50, shoulderB: -24, elbowB: 44, hipF: 16, kneeF: 26, hipB: -6, kneeB: 30 }, ease: "out" },
      { t: 7, add: { torso: 10, head: 6, offX: -2, shoulderF: -16, elbowF: 32 }, ease: "inOut" },
      { t: 14, add: {} },
    ],
  },

  hitLow: {
    length: 14,
    frames: [
      { t: 0, add: { crouch: 1, torso: 22, head: 8, offX: -3, hipF: 40, kneeF: 78, hipB: -18, kneeB: 88, shoulderF: -18, elbowF: 40 }, ease: "out" },
      { t: 14, add: { crouch: 1, torso: 14, hipF: 34, kneeF: 72, hipB: -22, kneeB: 84 } },
    ],
  },

  hitAir: {
    length: 20,
    frames: [
      { t: 0, add: { free: 1, torso: -24, head: -16, spin: -8, shoulderF: -70, shoulderB: -60, elbowF: 30, elbowB: 26, hipF: 30, kneeF: 20, hipB: -30, kneeB: 34 }, ease: "out" },
      { t: 20, add: { free: 1, torso: -14, head: -8, spin: -14, shoulderF: -50, shoulderB: -44, hipF: 20, kneeF: 26, hipB: -22, kneeB: 30 } },
    ],
  },

  launched: {
    length: 30,
    loop: true,
    frames: [
      { t: 0, add: { free: 1, spin: 0, torso: -30, shoulderF: -100, shoulderB: -92, hipF: 40, kneeF: 30, hipB: -34, kneeB: 40 }, ease: "linear" },
      { t: 15, add: { free: 1, spin: -24, torso: -34, shoulderF: -112, shoulderB: -104, hipF: 46, kneeF: 24, hipB: -40, kneeB: 34 }, ease: "linear" },
      { t: 30, add: { free: 1, spin: 0, torso: -30, shoulderF: -100, shoulderB: -92, hipF: 40, kneeF: 30, hipB: -34, kneeB: 40 } },
    ],
  },

  knockdown: {
    length: 30,
    frames: [
      { t: 0, add: { free: 1, spin: -40, torso: -30, offY: 20, hipF: 50, kneeF: 40, hipB: -40, kneeB: 50, shoulderF: -90, shoulderB: -80 }, ease: "out" },
      { t: 10, add: { free: 1, spin: -84, torso: -10, offY: 4, hipF: 60, kneeF: 30, hipB: -20, kneeB: 30, shoulderF: -110, shoulderB: -70 } },
      { t: 30, add: { free: 1, spin: -88, torso: -6, offY: 3, hipF: 56, kneeF: 26, hipB: -16, kneeB: 24, shoulderF: -104, shoulderB: -64 } },
    ],
  },

  wakeup: {
    length: 20,
    frames: [
      { t: 0, add: { free: 1, spin: -88, torso: -6, offY: 3, hipF: 56, kneeF: 26, hipB: -16, kneeB: 24, shoulderF: -104, shoulderB: -64 }, ease: "out" },
      { t: 10, add: { spin: -30, crouch: 0.9, torso: 24, hipF: 40, kneeF: 80, hipB: -26, kneeB: 90, shoulderF: 10, elbowF: 30 }, ease: "inOut" },
      { t: 20, add: {} },
    ],
  },

  ko: {
    length: 40,
    frames: [
      { t: 0, add: { free: 1, spin: -20, torso: -40, offY: 16, shoulderF: -120, shoulderB: -110, hipF: 40, kneeF: 20, hipB: -36, kneeB: 30 }, ease: "out" },
      { t: 18, add: { free: 1, spin: -86, torso: -8, offY: 4, shoulderF: -120, shoulderB: -60, hipF: 48, kneeF: 18, hipB: -12, kneeB: 20 }, ease: "out" },
      { t: 40, add: { free: 1, spin: -90, torso: -4, offY: 3, shoulderF: -116, shoulderB: -56, hipF: 44, kneeF: 14, hipB: -10, kneeB: 16 } },
    ],
  },

  win: {
    length: 90,
    loop: true,
    frames: [
      { t: 0, add: { torso: -6, shoulderF: -30, elbowF: 70, shoulderB: 20, elbowB: 30 }, ease: "inOut" },
      { t: 30, add: { torso: -10, offY: 2, shoulderF: -46, elbowF: 60, shoulderB: 14, elbowB: 36, head: -4 }, ease: "inOut" },
      { t: 60, add: { torso: -6, shoulderF: -30, elbowF: 70, shoulderB: 20, elbowB: 30 }, ease: "inOut" },
      { t: 90, add: { torso: -6, shoulderF: -30, elbowF: 70, shoulderB: 20, elbowB: 30 } },
    ],
  },

  taunt: {
    length: 40,
    frames: [
      { t: 0, add: {}, ease: "out" },
      { t: 12, add: { torso: -12, head: -10, shoulderF: -60, elbowF: 20, shoulderB: 34, elbowB: 40 }, ease: "inOut" },
      { t: 28, add: { torso: -8, head: -6, shoulderF: -40, elbowF: 40, shoulderB: 24, elbowB: 30 }, ease: "inOut" },
      { t: 40, add: {} },
    ],
  },

  grabbed: {
    length: 12,
    frames: [
      { t: 0, add: { torso: -14, head: -10, shoulderF: -60, elbowF: 60, shoulderB: -50, elbowB: 56, hipF: 10, kneeF: 24, hipB: -8, kneeB: 26 }, ease: "out" },
      { t: 12, add: { torso: -12, head: -8, shoulderF: -56, elbowF: 64, shoulderB: -46, elbowB: 60 } },
    ],
  },

  dizzy: {
    length: 48,
    loop: true,
    frames: [
      { t: 0, add: { torso: 8, head: -12, shoulderF: -20, elbowF: 30, shoulderB: -16, elbowB: 26, hipF: 8, kneeF: 20, hipB: -6, kneeB: 22 }, ease: "inOut" },
      { t: 24, add: { torso: -8, head: 12, shoulderF: -14, elbowF: 24, shoulderB: -22, elbowB: 32, offX: -3 }, ease: "inOut" },
      { t: 48, add: { torso: 8, head: -12, shoulderF: -20, elbowF: 30, shoulderB: -16, elbowB: 26 } },
    ],
  },
};

export function clipFor(name: ClipName, overrides?: Partial<Record<ClipName, ClipDef>>): ClipDef {
  return overrides?.[name] ?? DEFAULT_CLIPS[name];
}

/**
 * Input plumbing: raw device state -> facing-relative directions, press edges,
 * a short buffer, and fighting-game motion recognition (QCF, DP, charges...).
 */

import { COMBAT } from "../constants";
import type { Button, Dir, Facing, Motion } from "../types";

export interface RawInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  A: boolean;
  B: boolean;
  C: boolean;
  S: boolean;
}

export const EMPTY_INPUT: RawInput = {
  left: false,
  right: false,
  up: false,
  down: false,
  A: false,
  B: false,
  C: false,
  S: false,
};

export const BUTTONS: Button[] = ["A", "B", "C", "S"];

interface Entry {
  /** Numpad notation in facing space: 6 = towards the opponent. */
  num: number;
  held: Record<Button, boolean>;
  pressed: Record<Button, boolean>;
}

function toNumpad(input: RawInput, facing: Facing): number {
  const fwd = facing === 1 ? input.right : input.left;
  const back = facing === 1 ? input.left : input.right;
  let h = 0;
  if (fwd && !back) h = 1;
  else if (back && !fwd) h = -1;
  let v = 0;
  if (input.up && !input.down) v = 1;
  else if (input.down && !input.up) v = -1;
  if (v === 1) return h === 1 ? 9 : h === -1 ? 7 : 8;
  if (v === -1) return h === 1 ? 3 : h === -1 ? 1 : 2;
  return h === 1 ? 6 : h === -1 ? 4 : 5;
}

const isDown = (n: number) => n === 1 || n === 2 || n === 3;
const isFwd = (n: number) => n === 3 || n === 6 || n === 9;
const isBack = (n: number) => n === 1 || n === 4 || n === 7;
const isUp = (n: number) => n === 7 || n === 8 || n === 9;

export class InputBuffer {
  private history: Entry[] = [];
  private prev: RawInput = { ...EMPTY_INPUT };
  private backCharge = 0;
  private downCharge = 0;
  private chargeBReadyAt = -999;
  private chargeDReadyAt = -999;
  /** Motions already consumed, so one QCF cannot fire two specials. */
  private consumedAt = -999;
  /** Dash inputs are consumed separately - a dash must not eat a QCF. */
  private consumedDashAt = -999;
  frame = 0;

  reset() {
    this.history = [];
    this.prev = { ...EMPTY_INPUT };
    this.backCharge = 0;
    this.downCharge = 0;
    this.frame = 0;
    this.consumedAt = -999;
  }

  push(input: RawInput, facing: Facing) {
    const num = toNumpad(input, facing);
    const held: Record<Button, boolean> = { A: input.A, B: input.B, C: input.C, S: input.S };
    const pressed: Record<Button, boolean> = {
      A: input.A && !this.prev.A,
      B: input.B && !this.prev.B,
      C: input.C && !this.prev.C,
      S: input.S && !this.prev.S,
    };
    this.history.push({ num, held, pressed });
    if (this.history.length > 90) this.history.shift();
    this.prev = { ...input };
    this.frame++;

    if (isBack(num)) this.backCharge++;
    else if (this.backCharge >= COMBAT.chargeFrames) {
      this.chargeBReadyAt = this.frame;
      this.backCharge = 0;
    } else this.backCharge = 0;

    if (isDown(num)) this.downCharge++;
    else if (this.downCharge >= COMBAT.chargeFrames) {
      this.chargeDReadyAt = this.frame;
      this.downCharge = 0;
    } else this.downCharge = 0;
  }

  private at(back: number): Entry | undefined {
    return this.history[this.history.length - 1 - back];
  }

  get current(): Entry | undefined {
    return this.at(0);
  }

  /** Current facing-relative direction as a symbolic name. */
  get dir(): Dir {
    const n = this.current?.num ?? 5;
    switch (n) {
      case 1:
        return "db";
      case 2:
        return "d";
      case 3:
        return "df";
      case 4:
        return "b";
      case 6:
        return "f";
      case 7:
        return "ub";
      case 8:
        return "u";
      case 9:
        return "uf";
      default:
        return "n";
    }
  }

  get num(): number {
    return this.current?.num ?? 5;
  }

  holding(b: Button): boolean {
    return this.current?.held[b] ?? false;
  }

  holdingBack(): boolean {
    return isBack(this.num);
  }

  holdingDown(): boolean {
    return isDown(this.num);
  }

  holdingUp(): boolean {
    return isUp(this.num);
  }

  holdingForward(): boolean {
    return isFwd(this.num);
  }

  /** True if `b` was newly pressed within the last `window` frames. */
  pressedWithin(b: Button, window = COMBAT.bufferFrames): boolean {
    const n = Math.min(window, this.history.length);
    for (let i = 0; i < n; i++) {
      if (this.at(i)?.pressed[b]) return true;
    }
    return false;
  }

  pressedNow(b: Button): boolean {
    return this.current?.pressed[b] ?? false;
  }

  /** Removes buffered presses of `b` so a move is not triggered twice. */
  consume(b: Button, window = COMBAT.bufferFrames) {
    const n = Math.min(window, this.history.length);
    for (let i = 0; i < n; i++) {
      const e = this.at(i);
      if (e) e.pressed[b] = false;
    }
  }

  consumeMotion() {
    this.consumedAt = this.frame;
  }

  consumeDash() {
    this.consumedDashAt = this.frame;
  }

  /** Numpad values over the last `window` frames, newest first, de-duplicated. */
  private recentDirs(window: number): number[] {
    const out: number[] = [];
    const n = Math.min(window, this.history.length);
    for (let i = 0; i < n; i++) {
      const num = this.at(i)!.num;
      if (out.length === 0 || out[out.length - 1] !== num) out.push(num);
    }
    return out;
  }

  /**
   * Matches `seq` (oldest -> newest) against the direction history, allowing
   * extra directions in between so sloppy inputs still register.
   */
  private matchSeq(seq: ((n: number) => boolean)[], window: number): boolean {
    const dirs = this.recentDirs(window);
    let si = seq.length - 1;
    for (let i = 0; i < dirs.length && si >= 0; i++) {
      if (seq[si](dirs[i])) si--;
    }
    return si < 0;
  }

  hasMotion(motion: Motion, window = COMBAT.motionWindow): boolean {
    if (motion === "none") return true;
    const isDash = motion === "ff" || motion === "bb";
    if (isDash) {
      if (this.frame - this.consumedDashAt < 6) return false;
    } else if (this.frame - this.consumedAt < 3) {
      return false;
    }
    switch (motion) {
      case "qcf":
        return this.matchSeq([(n) => n === 2, (n) => n === 3 || n === 2, (n) => n === 6 || n === 3], window) && isFwd(this.num);
      case "qcb":
        return this.matchSeq([(n) => n === 2, (n) => n === 1 || n === 2, (n) => n === 4 || n === 1], window) && isBack(this.num);
      case "dp":
        return this.matchSeq([(n) => n === 6 || n === 3, (n) => n === 2 || n === 1, (n) => n === 3], window + 4) && this.num === 3;
      case "rdp":
        return this.matchSeq([(n) => n === 4 || n === 1, (n) => n === 2 || n === 3, (n) => n === 1], window + 4) && this.num === 1;
      case "hcf":
        return this.matchSeq([(n) => n === 4, (n) => n === 2 || n === 1, (n) => n === 3 || n === 2, (n) => n === 6], window + 10);
      case "hcb":
        return this.matchSeq([(n) => n === 6, (n) => n === 2 || n === 3, (n) => n === 1 || n === 2, (n) => n === 4], window + 10);
      case "dd":
        return this.matchSeq([isDown, (n) => !isDown(n), isDown], window + 6) && isDown(this.num);
      // Dashes only read clean horizontal taps, otherwise the ↓↘→ in a
      // quarter-circle would register as a forward dash and eat the special.
      case "ff":
        return (
          this.matchSeq([(n) => n === 6, (n) => n === 5 || n === 8, (n) => n === 6], COMBAT.dashInputWindow) &&
          this.num === 6
        );
      case "bb":
        return (
          this.matchSeq([(n) => n === 4, (n) => n === 5 || n === 8, (n) => n === 4], COMBAT.dashInputWindow) &&
          this.num === 4
        );
      case "chargeB":
        return this.frame - this.chargeBReadyAt <= 12 && isFwd(this.num);
      case "chargeD":
        return this.frame - this.chargeDReadyAt <= 12 && isUp(this.num);
      default:
        return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Keyboard bindings
// ---------------------------------------------------------------------------

export interface KeyBindings {
  left: string[];
  right: string[];
  up: string[];
  down: string[];
  A: string[];
  B: string[];
  C: string[];
  S: string[];
}

export const P1_KEYS: KeyBindings = {
  left: ["KeyA"],
  right: ["KeyD"],
  up: ["KeyW"],
  down: ["KeyS"],
  A: ["KeyJ"],
  B: ["KeyK"],
  C: ["KeyL"],
  S: ["Semicolon", "KeyU"],
};

export const P2_KEYS: KeyBindings = {
  left: ["ArrowLeft"],
  right: ["ArrowRight"],
  up: ["ArrowUp"],
  down: ["ArrowDown"],
  A: ["Numpad1", "KeyN"],
  B: ["Numpad2", "KeyM"],
  C: ["Numpad3", "Comma"],
  S: ["Numpad0", "Period"],
};

/** Tracks physical keys and converts them into RawInput for both players. */
export class Keyboard {
  private down = new Set<string>();
  /** Extra virtual buttons pressed by on-screen touch controls. */
  private virtual = new Set<string>();

  attach(target: HTMLElement | Window = window) {
    const el = target as Window;
    el.addEventListener("keydown", this.onDown as EventListener);
    el.addEventListener("keyup", this.onUp as EventListener);
    el.addEventListener("blur", this.clear as EventListener);
    return () => {
      el.removeEventListener("keydown", this.onDown as EventListener);
      el.removeEventListener("keyup", this.onUp as EventListener);
      el.removeEventListener("blur", this.clear as EventListener);
    };
  }

  private onDown = (e: KeyboardEvent) => {
    this.down.add(e.code);
    if (TRAPPED_KEYS.has(e.code)) e.preventDefault();
  };

  private onUp = (e: KeyboardEvent) => {
    this.down.delete(e.code);
  };

  private clear = () => {
    this.down.clear();
    this.virtual.clear();
  };

  setVirtual(name: string, pressed: boolean) {
    if (pressed) this.virtual.add(name);
    else this.virtual.delete(name);
  }

  clearVirtual() {
    this.virtual.clear();
  }

  isDown(code: string) {
    return this.down.has(code);
  }

  read(bindings: KeyBindings, virtualPrefix?: string): RawInput {
    const any = (codes: string[], name: keyof KeyBindings) =>
      codes.some((c) => this.down.has(c)) ||
      (virtualPrefix ? this.virtual.has(`${virtualPrefix}:${name}`) : false);
    return {
      left: any(bindings.left, "left"),
      right: any(bindings.right, "right"),
      up: any(bindings.up, "up"),
      down: any(bindings.down, "down"),
      A: any(bindings.A, "A"),
      B: any(bindings.B, "B"),
      C: any(bindings.C, "C"),
      S: any(bindings.S, "S"),
    };
  }
}

// ---------------------------------------------------------------------------
// Gamepads
// ---------------------------------------------------------------------------

/**
 * Standard-mapping gamepad layout. Face buttons follow the usual fighting-game
 * arrangement, with Guard doubled onto the shoulders so blocking is comfortable
 * either way.
 *
 *   ✕/A  Light      ○/B  Medium     □/X  Heavy      △/Y  Guard
 *   L1   Guard      R1   Skill (A+C) L2   Guard      R2   Throw (A+B)
 */
const PAD_BUTTONS: Record<number, (keyof RawInput)[]> = {
  0: ["A"],
  1: ["B"],
  2: ["C"],
  3: ["S"],
  4: ["S"],
  5: ["A", "C"],
  6: ["S"],
  7: ["A", "B"],
};

const PAD_DPAD: Record<number, keyof RawInput> = {
  12: "up",
  13: "down",
  14: "left",
  15: "right",
};

const STICK_DEAD_ZONE = 0.45;

export class GamepadReader {
  /** Reads one pad as a RawInput, or null when that slot is empty. */
  read(index: number): RawInput | null {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    // Slots can be sparse, so treat `index` as "the nth connected pad".
    const connected = Array.from(pads).filter((p): p is Gamepad => !!p && p.connected);
    const pad = connected[index];
    if (!pad) return null;

    const out: RawInput = { ...EMPTY_INPUT };

    for (const [btn, names] of Object.entries(PAD_BUTTONS)) {
      if (pad.buttons[Number(btn)]?.pressed) {
        for (const name of names) out[name] = true;
      }
    }
    for (const [btn, dir] of Object.entries(PAD_DPAD)) {
      if (pad.buttons[Number(btn)]?.pressed) out[dir] = true;
    }

    const [ax = 0, ay = 0] = pad.axes;
    if (ax < -STICK_DEAD_ZONE) out.left = true;
    if (ax > STICK_DEAD_ZONE) out.right = true;
    if (ay < -STICK_DEAD_ZONE) out.up = true;
    if (ay > STICK_DEAD_ZONE) out.down = true;

    return out;
  }

  /** True when the Start button was pressed on any pad this frame. */
  startPressed(index: number): boolean {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return false;
    const connected = Array.from(navigator.getGamepads()).filter((p): p is Gamepad => !!p && p.connected);
    const pad = connected[index];
    const pressed = !!pad?.buttons[9]?.pressed;
    const was = this.startWas[index] ?? false;
    this.startWas[index] = pressed;
    return pressed && !was;
  }

  private startWas: boolean[] = [];

  count(): number {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return 0;
    return Array.from(navigator.getGamepads()).filter((p) => p && p.connected).length;
  }
}

/** Merges two input snapshots (keyboard + pad) so either source can act. */
export function mergeInputs(a: RawInput, b: RawInput | null): RawInput {
  if (!b) return a;
  return {
    left: a.left || b.left,
    right: a.right || b.right,
    up: a.up || b.up,
    down: a.down || b.down,
    A: a.A || b.A,
    B: a.B || b.B,
    C: a.C || b.C,
    S: a.S || b.S,
  };
}

const TRAPPED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "Numpad0",
  "Numpad1",
  "Numpad2",
  "Numpad3",
]);

/**
 * The tutorial: ten scripted lessons from walking to a combo, run on the same
 * `Match` everything else uses rather than a bespoke teaching mode.
 *
 * Like `TrainingRoom`, this sits on top of the simulation and puts the world
 * back the way a lesson wants it after each step - health topped up, the
 * dummy's attacks scripted directly through `startMove` rather than routed
 * through the AI - so a lesson can never change how a real match plays.
 *
 * Progress is driven by the fighters' own state (`grounded`, `stance`,
 * `moveHasHit`, `moveHasBlocked`, tags on the active move) rather than by
 * scoring specific inputs, so a lesson passes however the player actually
 * did it - the walking lesson does not care which arrow key produced the
 * distance travelled.
 */

import type { Fighter } from "./fighter";
import type { Match } from "./match";

export type TutorialKind =
  | "move"
  | "jump"
  | "crouch"
  | "attack"
  | "special"
  | "blockHigh"
  | "blockLow"
  | "dodge"
  | "throw"
  | "combo";

export interface TutorialStep {
  kind: TutorialKind;
  title: string;
  prompt: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  { kind: "move", title: "Move", prompt: "Walk around. Hold ← or → to close distance or give yourself room." },
  { kind: "jump", title: "Jump", prompt: "Press ↑ to jump. Everything in the air is punishable, so use it deliberately." },
  { kind: "crouch", title: "Crouch", prompt: "Hold ↓ to crouch. Lows can only be blocked from down here." },
  { kind: "attack", title: "Light attack", prompt: "Walk in and press A. It is the fastest thing you have." },
  { kind: "special", title: "Special move", prompt: "Every fighter has five. Check the move list, then throw one out." },
  { kind: "blockHigh", title: "Block", prompt: "They are about to swing. Hold S to guard it." },
  { kind: "blockLow", title: "Block low", prompt: "This one comes in low - it goes through a standing guard. Hold S and ↓." },
  { kind: "dodge", title: "Roll", prompt: "Hold → and press S the instant they commit. Nothing makes you untouchable - you duck under the swing and travel, so it beats an attack you saw coming and loses to one thrown at you getting up." },
  { kind: "throw", title: "Throw", prompt: "Get in close and press A + B together to throw them." },
  { kind: "combo", title: "Combo", prompt: "Chain light into medium into heavy - A, then B, then C, without a gap." },
];

/** A move whose first hit needs the block height this lesson is teaching. */
function findGuardMove(dummy: Fighter, guard: "low" | "standing"): string | undefined {
  const move = dummy.def.moves.find((m) => {
    if (m.internal || !m.hits?.length) return false;
    const g = m.hits[0].guard;
    if (guard === "low") return g === "low";
    return g === "high" || g === "mid";
  });
  return move?.id;
}

const isRealSpecial = (m: { tags?: string[]; variant?: string; internal?: boolean }) =>
  !!m.tags?.includes("special") && !m.tags?.includes("ex") && !m.variant && !m.internal;

/**
 * The gap each lesson opens at, in game units. A block or throw lesson is
 * about the guard or the grab, not about spacing, so the player is put in
 * range for it rather than having to manage distance on top of the new
 * input - the same reason a real tutorial repositions you between rooms.
 */
const GAPS: Partial<Record<TutorialKind, number>> = {
  attack: 130,
  special: 150,
  blockHigh: 55,
  blockLow: 55,
  dodge: 55,
  throw: 70,
  combo: 130,
};

export class TutorialRunner {
  index = 0;
  stepFrame = 0;
  complete = false;

  private minX = 0;
  private maxX = 0;
  private crouchFrames = 0;
  private dummyMoveId: string | null = null;
  private attackGap: number | null = null;
  private attemptAt = -999;
  private sawHit = false;
  private sawBlocked = false;
  private sawDodgeOverlap = false;

  get step(): TutorialStep {
    return TUTORIAL_STEPS[this.index];
  }

  get total(): number {
    return TUTORIAL_STEPS.length;
  }

  /** Called once, right after the match is created. */
  start(match: Match) {
    this.index = 0;
    this.complete = false;
    this.beginStep(match);
  }

  private beginStep(match: Match) {
    const [me, dummy] = match.fighters;
    const gap = GAPS[this.step.kind];
    if (gap !== undefined) {
      // Keep whichever side the player is currently on rather than flipping
      // them across the dummy, which would reverse every direction in the
      // prompt they just read.
      const meIsLeft = me.x <= dummy.x;
      me.x = meIsLeft ? -gap / 2 : gap / 2;
      dummy.x = meIsLeft ? gap / 2 : -gap / 2;
      me.vx = 0;
      me.vy = 0;
      dummy.vx = 0;
      dummy.vy = 0;
    }
    this.stepFrame = 0;
    this.minX = me.x;
    this.maxX = me.x;
    this.crouchFrames = 0;
    this.attemptAt = -999;
    this.sawHit = false;
    this.sawBlocked = false;
    this.sawDodgeOverlap = false;
    me.health = me.def.stats.health;
    me.meter = 100;
    if (me.def.resource) me.resource = me.def.resource.max;
    dummy.health = dummy.def.stats.health;

    this.dummyMoveId =
      this.step.kind === "blockHigh" || this.step.kind === "dodge"
        ? (findGuardMove(dummy, "standing") ?? null)
        : this.step.kind === "blockLow"
          ? (findGuardMove(dummy, "low") ?? null)
          : null;
    this.attackGap = this.dummyMoveId ? (GAPS[this.step.kind] ?? null) : null;
  }

  /** Called every frame after `match.step()`. Advances the lesson when it is done. */
  apply(match: Match) {
    const [me, dummy] = match.fighters;
    this.stepFrame++;

    // A lesson never actually ends the match - if either side is knocked out
    // the round is already decided by the time health can be topped back up,
    // so both have to be pulled out of the ceremony the same way
    // TrainingRoom does it, or a KO anywhere in the tutorial freezes the
    // lesson in the winner's pose forever.
    if (match.phase !== "fight") {
      match.phase = "fight";
      match.phaseFrame = 0;
      match.freeze = 0;
      for (const f of match.fighters) {
        if (f.state === "intro" || f.state === "win" || f.state === "ko") f.setState("idle");
      }
    }
    if (me.health <= 0) me.health = me.def.stats.health;
    if (dummy.health <= 0) dummy.health = dummy.def.stats.health;
    me.meter = 100;
    if (me.def.resource) me.resource = me.def.resource.max;

    this.minX = Math.min(this.minX, me.x);
    this.maxX = Math.max(this.maxX, me.x);
    this.crouchFrames = me.stance === "crouch" ? this.crouchFrames + 1 : 0;

    if (["blockHigh", "blockLow", "dodge"].includes(this.step.kind) && this.dummyMoveId) {
      this.driveScriptedAttack(dummy, me);
    }

    if (this.checkDone(me, dummy)) {
      if (this.index + 1 >= TUTORIAL_STEPS.length) {
        this.complete = true;
      } else {
        this.index++;
        this.beginStep(match);
      }
    }
  }

  /** Throws the scripted attack on a loop until it lands, blocks, or is dodged. */
  private driveScriptedAttack(dummy: Fighter, me: Fighter) {
    const idle = dummy.state !== "move";
    if (idle && this.stepFrame - this.attemptAt > 55) {
      // A landed or blocked hit pushes both fighters apart, and nothing else
      // closes that gap between attempts - so the dummy steps back into
      // range before it swings again rather than the fight quietly
      // drifting out of the move's reach after the first exchange.
      if (this.attackGap !== null) {
        const towardMe = me.x <= dummy.x ? -1 : 1;
        dummy.x = me.x - towardMe * this.attackGap;
        dummy.vx = 0;
      }
      dummy.startMove(this.dummyMoveId!);
      this.attemptAt = this.stepFrame;
      this.sawHit = false;
      this.sawBlocked = false;
      this.sawDodgeOverlap = false;
    }
    if (dummy.moveHasHit) this.sawHit = true;
    if (dummy.moveHasBlocked) this.sawBlocked = true;
    if (me.move?.tags?.includes("dodge")) this.sawDodgeOverlap = true;
  }

  private checkDone(me: Fighter, dummy: Fighter): boolean {
    switch (this.step.kind) {
      case "move":
        return this.maxX - this.minX > 90;
      case "jump":
        return !me.grounded && me.y > 25;
      case "crouch":
        return this.crouchFrames > 18;
      case "attack":
        return me.moveHasHit && (me.move?.tags?.includes("light") ?? false);
      case "special":
        return !!me.move && isRealSpecial(me.move);
      case "blockHigh":
      case "blockLow":
        // The most recent scripted attempt has to have resolved as a block,
        // and not slipped through as a hit in between attempts.
        return this.sawBlocked && !this.sawHit;
      case "dodge":
        return this.sawDodgeOverlap && !this.sawHit && !this.sawBlocked;
      case "throw":
        // A throw resolves through `throwDef`/`throwPayload`, not the normal
        // hit list, so `moveHasHit` never fires for one - the signal that it
        // connected is the internal payload move starting at all.
        return !!me.move?.internal && (me.move?.tags?.includes("throw") ?? false);
      case "combo":
        return dummy.comboHits >= 2;
      default:
        return false;
    }
  }
}

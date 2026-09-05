/**
 * Strings: the chains of normals every fighter can rattle off.
 *
 * These used to live as `followUps` scattered through the fighter files, two
 * links long, hand-written windows on each one. That was fine when a string
 * was "one button then one more", and it stopped being fine the moment they
 * needed to be five hits long: the same link had to be found in three places
 * to change it, and a window authored against a move's old duration went on
 * quietly pointing at a frame that no longer existed.
 *
 * So a string is declared here as what it actually is - a name and an ordered
 * list of moves - and the links are derived:
 *
 *   - the button for each step is the button the target move already uses, so
 *     the sequence a player presses is the sequence they would press to do
 *     those moves on their own;
 *   - the window opens on the source move's first active frame, which makes it
 *     a hit-confirm rather than a guess, and closes three frames before the
 *     move ends.
 *
 * Nothing is hand-tuned, so nothing can drift when a move's timing changes.
 *
 * Shapes, not one shape. A rushdown fighter and a spear-wall fighter should
 * not have the same chain with different words on it, so the roster is split
 * into four families below and each gets a different set. Within a family the
 * shape is shared and the moves are the character's own.
 */

import type { Button, FighterDef, MoveDef } from "./types";

export interface FighterString {
  name: string;
  /** Move ids in order. The first is the opener; the rest are follow-ups. */
  steps: string[];
}

// ---------------------------------------------------------------------------
// Shapes
//
// Each family is three strings that do not collide: a move can only carry one
// follow-up per button, so two strings that both leave `5A` on A would leave
// the second one unreachable. The combinations below are checked in
// selftest.ts rather than trusted.
// ---------------------------------------------------------------------------

/** Fast, and it keeps switching height - the opponent has to guess twice. */
const RUSHDOWN = [
  ["5A", "2A", "5B", "2B", "2C"],
  ["6A", "6B", "6C"],
  ["4A", "4B", "4C"],
];

/** Slower and heavier, and the long one ends on the biggest thing they have. */
const BRUISER = [
  ["5A", "6A", "5B", "6B", "5C"],
  ["2A", "2B", "2C", "4C"],
  ["4A", "4B", "3C"],
];

/** Built around reach: it starts at range and pushes them further out. */
const ZONER = [
  ["5B", "5C", "6C", "4C"],
  ["5A", "6A", "6B", "3C"],
  ["2A", "2B", "2C"],
];

/** Patient: one long confirm, one that goes low, one that gives ground. */
const FOOTSIES = [
  ["5A", "5B", "6B", "6C", "4C"],
  ["6A", "2A", "2B", "2C"],
  ["4A", "4B", "3C"],
];

/** Names per fighter, in the order their family lists the shapes. */
const NAMES: Record<string, [string, string, string]> = {
  roman: ["Pilum Drill", "Testudo", "Trench Work"],
  spartan: ["Aspis Work", "Dory Drill", "Give Ground"],
  viking: ["Shield and Axe", "Leg Work", "Hewing Line"],
  pirate: ["Cutlass Flurry", "Boarding Party", "Backswing"],
  samurai: ["Kesa Line", "Ankle Cut", "Iai Retreat"],
  muaythai: ["Eight Limbs", "Long Range", "Clinch Exit"],
  ninja: ["Tanto Rhythm", "Kunai Line", "Falling Leaf"],
  mongol: ["Bow and Stave", "Horn Work", "Stirrup Cut"],
  western: ["Gunhand", "Bar Brawl", "Backstep Right"],
  soldier: ["Butt-Stroke Drill", "Bayonet Rush", "Fall Back"],
  knight: ["Zornhau Line", "Halfsword Low", "Winding Line"],
  jaguar: ["Obsidian Rhythm", "Rending Charge", "Raking Retreat"],
  zulu: ["Horn and Iklwa", "Ankle Work", "Chest Line"],
  shaolin: ["Staff Rhythm", "Crown to Ankle", "Sweeping Staff"],
  nihang: ["Quoit and Tulwar", "Quoit Work", "Heel Work"],
  shade: ["Twin Kunai", "Kunai Rush", "Vanishing Line"],
  maori: ["Rau Rhythm", "Reaping Line", "Give Ground"],
  ethiopia: ["Curved Line", "Hooking Low", "Backing Hook"],
  duelist: ["Lunge Line", "Foot Work", "Retreat and Point"],
  iceman: ["Fell the Tree", "Ground Work", "Backhand Line"],
  celt: ["Long Cut Rhythm", "Lifting Line", "Backhand Line"],
  persian: ["Wicker and Spear", "Rank Work", "Low Ranks"],
};

const FAMILY: Record<string, string[][]> = {
  // Rushdown and mix-up characters.
  pirate: RUSHDOWN, muaythai: RUSHDOWN, ninja: RUSHDOWN,
  jaguar: RUSHDOWN, celt: RUSHDOWN, shade: RUSHDOWN,
  // Bruisers, grapplers and anyone who fights behind armour.
  spartan: BRUISER, viking: BRUISER, knight: BRUISER,
  iceman: BRUISER, zulu: BRUISER, ethiopia: BRUISER,
  // Range.
  roman: ZONER, mongol: ZONER, western: ZONER, soldier: ZONER,
  nihang: ZONER, shaolin: ZONER, persian: ZONER,
  // Counter-hitters.
  samurai: FOOTSIES, duelist: FOOTSIES, maori: FOOTSIES,
};

/**
 * Three fighters have no `3C`, so the one shape that ends on a launcher ends
 * on their advancing heavy instead. Substituting here rather than giving them
 * their own shape keeps the family readable.
 */
const MISSING: Record<string, Record<string, string>> = {
  iceman: { "3C": "6C" },
  celt: { "3C": "6C" },
  persian: { "3C": "6C" },
};

export function stringsFor(id: string): FighterString[] {
  const shapes = FAMILY[id];
  const names = NAMES[id];
  if (!shapes || !names) return [];
  const swap = MISSING[id] ?? {};
  return shapes.map((steps, i) => ({
    name: names[i],
    steps: steps.map((s) => swap[s] ?? s),
  }));
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

/**
 * First frame the move actually does something, which is where a confirm
 * starts.
 *
 * Projectiles count. The Mongol's point-blank shot and the soldier's aimed
 * shot have no melee hitbox at all, so reading only `hits` put their window at
 * frame 1 - which is not just early, it is unreachable: the button is still
 * held down from starting the move, so there is never a fresh press for the
 * follow-up to see. Opening it when the shot leaves gives both a real window
 * and a string that reads properly: fire, then close.
 */
function firstActive(m: MoveDef): number {
  const froms = [...(m.hits ?? []).map((h) => h.from), ...(m.projectiles ?? []).map((p) => p.at)];
  return froms.length ? Math.min(...froms) : 1;
}

/**
 * Returns the fighter with its strings wired in.
 *
 * Pure: the def and its moves are copied rather than edited, because the same
 * module-level object is handed to `applyWeapon` and `applySkin` and mutating
 * it would make the roster depend on what had been loaded first.
 *
 * Follow-ups that are part of a *named* string are replaced wholesale - this
 * module is now the only place they come from. Unnamed ones are a different
 * mechanism (the pirate's rekka chains its own special) and are left alone.
 */
export function withStrings(def: FighterDef): FighterDef {
  const strings = stringsFor(def.id);
  if (!strings.length) return def;

  const byId = new Map(def.moves.map((m) => [m.id, m]));
  const added = new Map<string, NonNullable<MoveDef["followUps"]>>();

  for (const s of strings) {
    for (let i = 0; i < s.steps.length - 1; i++) {
      const from = byId.get(s.steps[i]);
      const to = byId.get(s.steps[i + 1]);
      if (!from || !to || !to.input.button) continue;
      const list = added.get(from.id) ?? [];
      list.push({
        button: to.input.button as Button,
        move: to.id,
        from: firstActive(from),
        to: Math.max(firstActive(from) + 1, from.duration - 3),
        string: s.name,
      });
      added.set(from.id, list);
    }
  }

  return {
    ...def,
    moves: def.moves.map((m) => {
      const kept = (m.followUps ?? []).filter((f) => !f.string);
      const mine = added.get(m.id) ?? [];
      if (!kept.length && !mine.length) return m.followUps ? { ...m, followUps: undefined } : m;
      return { ...m, followUps: [...kept, ...mine] };
    }),
  };
}

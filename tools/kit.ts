/**
 * What each fighter carries, and what they do with it.
 *
 * Deliberately reads the authored move list rather than measuring geometry.
 * A knife and a bare fist strike from the same point, so no amount of hitbox
 * arithmetic can tell them apart - the move's own name and description are
 * the only honest source for which tool is being used.
 *
 *   npx tsx tools/kit.ts            # whole roster
 *   npx tsx tools/kit.ts soldier    # one fighter
 */

import { ROSTER } from "../src/game/stickfight/fighters";
import type { FighterDef, MoveDef } from "../src/game/stickfight/types";

const NORMAL = /^(5|6|4|2|3|j)[ABC]$|^dashAttack$/;
const SKIP = /^(block|parry|sidestep|.*Ex|super)$/;

/** Words that mean "this move uses that prop", beyond the prop's own id. */
const ALIASES: Record<string, string[]> = {
  rifle: ["rifle", "muzzle", "stock", "butt-stroke", "bayonet", "shot", "burst", "auto"],
  knife: ["knife", "blade"],
  revolver: ["pistol", "revolver", "barrel", "shot", "draw", "hammer", "chamber"],
  pistol: ["pistol", "flintlock", "powder", "shot", "barrel"],
  dynamite: ["dynamite", "stick", "fuse"],
  bow: ["bow", "arrow", "stave", "limb", "string", "nock", "draw", "quiver"],
  macuahuitl: ["macuahuitl", "obsidian", "edge", "blade", "rend", "swing"],
  aspis: ["aspis", "shield", "rim", "boss"],
  dory: ["dory", "spear", "thrust", "sauroter", "point"],
  scutum: ["scutum", "shield", "boss", "rim"],
  iklwa: ["iklwa", "stab", "spear"],
  isihlangu: ["isihlangu", "shield", "rim", "hook"],
  buckler: ["buckler", "shield", "boss"],
  axe: ["axe", "cleave", "hew", "chop", "beard", "haft"],
  katana: ["katana", "cut", "giri", "tsuki", "kiriage", "men", "blade", "steel"],
  cutlass: ["cutlass", "cut", "slash", "cleave", "steel", "point"],
  tulwar: ["tulwar", "cut", "draw"],
  chakram: ["chakram", "quoit"],
  tanto: ["tanto", "blade", "cut"],
  kunai: ["kunai", "flick"],
  staff: ["staff", "pole", "butt", "crown", "thrust", "mountain"],
  sword: ["sword", "hau", "half-sword", "mordhau", "pommel", "cut", "blade"],
  shield: ["shield", "rim", "boss", "heater", "ram"],
  spear: ["spear", "pilum", "thrust", "point", "haft"],
  handwrapF: ["wrap", "wrapped", "taped", "elbow"],
  handwrapB: ["wrap", "wrapped", "taped", "elbow"],
  prajioudF: ["prajioud", "armband", "cord"],
  prajioudB: ["prajioud", "armband", "cord"],
  kunaiF: ["kunai", "flick", "jab", "cut", "gouge", "slash", "stab", "blade", "point"],
  kunaiB: ["kunai", "flick", "jab", "cut", "gouge", "slash", "stab", "blade", "point"],
  // A Gallic sword has no point and no name in the move list - it is all edge,
  // so the vocabulary is edges and cuts rather than the weapon.
  longsword: ["sword", "edge", "cut", "blade", "scythe", "hamstring", "charge", "lift", "overhand"],
  gaesum: ["gaesum", "javelin"],
  // The Iceman's kit: a hafted stone axe, a flint blade, and a sling.
  sling: ["sling", "stone", "shot"],
  flint: ["flint", "blade", "cut"],
  // Persian: spear with an apple counterweight, wicker pavise, bow, akinakes.
  spara: ["spara", "wicker", "pavise"],
  akinakes: ["akinakes", "blade", "cut"],
};

function usesTool(move: MoveDef, tool: string): boolean {
  // showProps is the authoritative signal for a conditional prop (one that is
  // normally hidden and only appears for moves that name it) - a move can
  // wire one in without ever spelling its name out in flavor text.
  if (move.showProps?.includes(tool)) return true;
  const hay = `${move.name} ${move.desc ?? ""}`.toLowerCase();
  const words = ALIASES[tool] ?? [tool];
  return words.some((w) => hay.includes(w));
}

const only = process.argv[2];
for (const def of ROSTER as FighterDef[]) {
  if (only && def.id !== only) continue;
  const carried = def.props.filter((p) => /^(hand|forearm)[FB]$/.test(p.attach)).map((p) => p.id);
  const moves = def.moves.filter((m) => !m.internal && !m.variant && !SKIP.test(m.id));
  const normals = moves.filter((m) => NORMAL.test(m.id));
  const specials = moves.filter((m) => !NORMAL.test(m.id));

  console.log(`\n${def.name}  -  ${def.archetype}`);
  console.log(`  carries: ${carried.join(" + ") || "nothing"}`);
  for (const tool of carried) {
    const n = normals.filter((m) => usesTool(m, tool));
    const s = specials.filter((m) => usesTool(m, tool));
    const flag = n.length === 0 ? "   <- no normals use it" : "";
    console.log(`    ${tool.padEnd(11)} ${String(n.length).padStart(2)} normals, ${String(s.length).padStart(2)} specials${flag}`);
    if (n.length) console.log(`      ${n.map((m) => `${m.id}:${m.name}`).join("  ")}`);
    if (s.length) console.log(`      ${s.map((m) => m.name).join("  ")}`);
  }
  const unclaimed = normals.filter((m) => !carried.some((t) => usesTool(m, t)));
  if (unclaimed.length) {
    console.log(`    bare hands/feet  ${unclaimed.length} normals`);
    console.log(`      ${unclaimed.map((m) => `${m.id}:${m.name}`).join("  ")}`);
  }
}

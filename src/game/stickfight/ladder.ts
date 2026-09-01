/**
 * Arcade ladder: eight fights, an ending, and a reason to pick someone new.
 *
 * The tower is authored rather than random. Fights one to five ramp through
 * opponents chosen for the fighter you picked; fight six is a rival the run
 * has been walking towards; seven is a mirror; eight is the last one standing.
 *
 * Nothing here touches storage or React - `buildLadder` is a pure function of
 * (fighter, difficulty), so the run can be rebuilt from a saved step index
 * rather than serialised whole.
 */

import { AI_LEVELS, type AiLevel } from "./constants";
import { ROSTER } from "./fighters";

export type LadderStage = "climb" | "rival" | "mirror" | "final";

export interface LadderStep {
  /** 1-based, so it can be shown as "Fight 3 of 8" without arithmetic. */
  index: number;
  opponent: string;
  level: AiLevel;
  stage: LadderStage;
  /** Shown on the versus card before the fight. */
  caption: string;
}

export const LADDER_LENGTH = 8;

/**
 * How far each fight sits from the difficulty the player asked for. Their
 * choice is the middle of the run, not the floor: the opening fights give
 * them room to find the buttons and only the last three push past it. A
 * casual ladder that opens at full strength is a ladder nobody finishes.
 */
const CURVE = [-1, -1, 0, 0, 0, 1, 1, 1];

/**
 * Rivals. Each pairing is two people whose records rhyme - the same argument
 * fought twice in different centuries - which is what makes the sixth fight
 * feel like the run was going somewhere.
 */
const RIVALS: Record<string, string> = {
  // Legion against phalanx: the two disciplined shield walls of the ancient world.
  roman: "spartan",
  spartan: "roman",
  // Two people who turned back a landing on their own ground.
  viking: "jaguar",
  jaguar: "viking",
  // The outlaw and the lawman.
  pirate: "western",
  western: "pirate",
  // Honour and method, both out of Japan.
  samurai: "ninja",
  ninja: "samurai",
  // Two champions who beat challengers in succession in front of a king.
  muaythai: "zulu",
  zulu: "muaythai",
  // The horse archer against the armoured lance.
  mongol: "knight",
  knight: "mongol",
  // Two martial traditions grown inside a religious order.
  nihang: "shaolin",
  shaolin: "nihang",
  // Ia Drang was an ambush war fought by a conventional force. So was Iga.
  soldier: "ninja",
};

/** The last one standing. Tomoe is the only difficulty five on the roster. */
const FINAL = "samurai";
const FINAL_ALT = "spartan";

function finalFor(id: string): string {
  // Tomoe cannot be her own last fight, and nobody should have to beat their
  // rival twice - Hanzo's rival is already the hardest fighter on the roster.
  return id === FINAL || RIVALS[id] === FINAL ? FINAL_ALT : FINAL;
}

/** Shifts a difficulty by n notches, clamped to the ends of the scale. */
export function shiftLevel(level: AiLevel, n: number): AiLevel {
  const i = AI_LEVELS.indexOf(level);
  return AI_LEVELS[Math.max(0, Math.min(AI_LEVELS.length - 1, i + n))];
}

/**
 * The five opponents before the rival, ordered easiest first.
 *
 * Everyone the run already has plans for is held back, and the rest are
 * rotated by who the player picked, so two characters do not walk the same
 * ladder. The rotation is deterministic: the same pick always gives the same
 * run, which is what lets a saved step index rebuild it.
 */
function climbFor(id: string): string[] {
  const spoken = new Set([id, RIVALS[id], finalFor(id)]);
  const pool = ROSTER.filter((f) => !spoken.has(f.id));
  const offset = ROSTER.findIndex((f) => f.id === id);
  const rotated = pool.map((_, i) => pool[(i + offset) % pool.length]);
  return rotated
    .slice(0, 5)
    .sort((a, b) => a.difficulty - b.difficulty)
    .map((f) => f.id);
}

/** The whole run for one fighter at one difficulty. */
export function buildLadder(id: string, base: AiLevel): LadderStep[] {
  const climb = climbFor(id);
  const rival = RIVALS[id] ?? finalFor(id);
  const order: { opponent: string; stage: LadderStage; caption: string }[] = [
    ...climb.map((opponent) => ({ opponent, stage: "climb" as const, caption: "" })),
    { opponent: rival, stage: "rival", caption: "Someone who fought your fight, in another century." },
    { opponent: id, stage: "mirror", caption: "Yourself, with none of your excuses." },
    { opponent: finalFor(id), stage: "final", caption: "The last one standing." },
  ];
  return order.map((step, i) => ({
    index: i + 1,
    opponent: step.opponent,
    level: shiftLevel(base, CURVE[i]),
    stage: step.stage,
    caption: step.caption,
  }));
}

/**
 * What actually happened to them.
 *
 * These are endings in the arcade sense but they are not invented: each one
 * is what the record says, and where the record is thin or disputed it says
 * that instead of filling the gap. A roster billed as real people has to be
 * willing to end on "nobody knows".
 */
export const ENDINGS: Record<string, string> = {
  roman:
    "Caesar names him once, in the seventh book of the Gallic War: two centurions of the Eleventh who competed for every honour, and who each saved the other's life outside the Nervii camp on the same afternoon. Then the account moves on, and Lucius Vorenus is never mentioned again by anyone.",
  spartan:
    "Told that the Persian archers were so many their arrows would blot out the sun, he answered that this was good news - they would fight in the shade. He said it at Thermopylae, four days before he died there. Herodotus, who collected the line, calls him the bravest man in the Greek army.",
  viking:
    "Two sagas cannot agree on her. In Eirik the Red's, the Norse break and run from the Skraelings at Vinland until Freydis picks up a dead man's sword, turns to face them alone, and they withdraw. In the Greenland saga she is a murderer. The same woman, written twice, by people who had already chosen what she was.",
  pirate:
    "Taken off Negril Point in November 1720 with the crew too drunk to fight. Condemned, then spared when she pleaded her belly. She is said to have told Rackham that if he had fought like a man he need not hang like a dog - and then she leaves the record entirely. No death, no grave, no further sighting.",
  samurai:
    "At Awazu, Yoshinaka ordered her away so he would not be seen to die with a woman beside him. The Heike says she took one last head, dropped her armour, and rode east out of the story. It is a war tale rather than a chronicle, so historians still argue about whether she was there at all - and still cannot quite bring themselves to cut her out.",
  muaythai:
    "A prisoner, made to fight for the entertainment of the court that had taken his city. He beat the Burmese champion, and then nine more without being allowed to rest, and the king freed him for it. The Thai keep the date. The Burmese chronicles do not mention it, which is usually how this goes.",
  ninja:
    "When Nobunaga was killed and Ieyasu was caught in hostile country with thirty men, it was Hanzo who took him back across Iga to safety - the crossing that made the Tokugawa possible. He died in 1596 without a battlefield to die on. The gate he guarded at Edo Castle still carries his name.",
  mongol:
    "He served two khans for forty years and took more ground than any commander before or since, and at the Kalka he destroyed a coalition of Rus princes who outnumbered him and did not think he was serious. He died in 1248 by the Tuul river, an old man, at home, which almost none of them managed.",
  western:
    "Thirty seconds in a vacant lot behind the O.K. Corral, and he was the only one who walked out untouched. He spent the next forty-eight years being asked about it. He died in a rented room in Los Angeles in 1929 - in bed, at eighty, the last man alive who had been standing there.",
  soldier:
    "November 1965, the Ia Drang valley: the first time American and North Vietnamese regulars met each other in force, at two landing zones four days apart. Both sides read the result as proof they could win. This one has no name on purpose - by the second day the men who were there were being counted, not listed.",
  knight:
    "The Black Prince's right hand, and the man who held the line at Poitiers. He did not fall in a battle. At the bridge at Lussac in 1370 he slipped on frost-covered ground, tangled in his own long robe, blind in one eye from an old hunt, and took a lance in the face before he could rise. Both armies mourned him.",
  jaguar:
    "Sahagun's Nahua informants remembered him by name: an otomi of Tlatelolco who threw stones three at a time from the roofs and drove the Spanish back off the causeway more than once. They remembered something else, too - that he changed his dress every day so the guns could never learn which one he was.",
  zulu:
    "Shaka's friend before he was Shaka's champion, which in that court was the more dangerous of the two. He held the right at Gqokli Hill against numbers that should have ended it, and he was killed in a later fight with the Ndwandwe. Most of what is told about him comes through one romantic retelling, so the shape is right and the details should not be trusted too far.",
  shaolin:
    "In the 1550s the coast was being taken apart by pirates and the empire sent monks. Zheng Ruoceng wrote down what happened at Wengjiagang: forty-odd Shaolin men against a raiding party, and the raiding party did not leave. The monks are named only in fragments now. He is one of the fragments.",
  nihang:
    "He led the Nihang, and he once summoned Ranjit Singh himself to the Akal Takht to be flogged for a moral offence - and Ranjit Singh came, and bared his back. He died in 1823 at Nowshera, going forward, which was the only direction anyone ever recorded him going.",
};

/** Everything the run needs to show a completed ladder. */
export function endingFor(id: string): string {
  return ENDINGS[id] ?? "";
}

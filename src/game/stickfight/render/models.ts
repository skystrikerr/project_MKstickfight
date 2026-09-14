/**
 * Which fighters have an approved 3D model, and what each one replaces.
 *
 * A plain map of static imports rather than `import.meta.glob`, for a reason
 * that has bitten this file's neighbours before: the model tests construct a
 * real `StickRig` under Node, and a glob is a Vite build-time macro that does
 * not exist there. Static JSON imports work in both. The cost is one line per
 * fighter, which is also the thing that makes it obvious which of the roster
 * still needs a model.
 */
import dienekes from "../../../assets/models/dienekes.json";

export interface FighterModelEntry {
  /** A Three.js `Object3D.toJSON()` scene exported from the model lab. */
  data: unknown;
  /**
   * Stick-rig prop ids this model draws itself. They are hidden rather than
   * deleted, because the sim still owns them - a spear's reach and a shield's
   * guard come from the prop, not from the mesh standing in for it.
   */
  hideProps: string[];
}

export const FIGHTER_MODELS: Record<string, FighterModelEntry> = {
  spartan: {
    data: dienekes,
    // "cloak" is listed even though the model has no cloak mesh. Unhiding it
    // does not bring one back - the rig's cloak draws behind the body, so a
    // solid model occludes it (measured: 85 more red pixels, nothing visible),
    // and it would cost a cloth sim per frame for that. The model needs its own
    // cloak; until it has one Dienekes is short the red he used to carry.
    hideProps: ["helm", "aspis", "dory", "cloak", "cuirass", "greaveF", "greaveB"],
  },
};

/**
 * The costume each GLB body already wears, named in stick-rig prop ids.
 *
 * Every fighter now loads a 3D body, and those bodies are not bare figures:
 * the Roman arrives in a galea, a segmented lorica, pteruges and a cloak, the
 * Muay Thai fighter in shorts and hand wraps, the pirate in a tricorn and a
 * coat. The flat rig draws its own ink version of all of that on top, so the
 * roster has been fighting in two costumes at once - a modelled one and a
 * painted one over it, disagreeing about where the shoulders are.
 *
 * These are the props the model makes redundant. They are hidden, never
 * deleted, for the reason the entry above gives: a prop is a piece of the
 * simulation - its reach, its guard and the frames it exists on - and only
 * its drawing is being replaced.
 *
 * What is NOT here matters as much:
 *   - anything with its own `<fighter>-<prop>.glb`, which `fitPropModel`
 *     already swaps for a model in place (every weapon, most shields);
 *   - props no model carries - Boudica's chariot and hare, Anne's six-pounder
 *     and hook, the arrow Subutai nocks, Wyatt's dynamite and spurs, Mgobozi's
 *     isihlangu - which are scenery or kit, not clothing;
 *   - garments the pack bodies genuinely lack, such as the Celt's braccae,
 *     Ötzi's leggings and Hydarnes' trousers. Those legs are modelled bare,
 *     so the flat garment is the only one there is and it stays.
 *
 * Each entry was read off the model's own node names rather than guessed -
 * `helmet` goes when the body has a `Galea_Dome`, `deel` when it has a
 * `SplitDeelSkirt` - and `selftest.ts` checks every id here is a prop that
 * fighter actually has and has no model of its own.
 */
export const WORN_BY_MODEL: Record<string, string[]> = {
  celt: ["limehair", "torc", "cloak"],
  conquistador: ["morion", "beard", "cuirass"],
  duelist: ["hair", "coat", "sash"],
  ethiopia: ["hair", "shamma", "belt"],
  iceman: ["bearcap", "grasscape"],
  iceni: ["hair", "torc", "tunic", "cloak"],
  jaguar: ["jaguarHelm", "ichcahuipilli", "maxtlatl", "pelt"],
  knight: ["helm", "harness", "fauld"],
  lapulapu: ["headband", "bahag"],
  maori: ["topknot", "korowai", "piupiu"],
  mongol: ["hat", "deel", "sash"],
  muaythai: ["handwrapF", "handwrapB", "prajioudB", "anklesF", "anklesB", "shorts"],
  nihang: ["dumalla", "chola", "kamarkasa"],
  ninja: ["hood", "vest", "pouch"],
  persian: ["tiara", "robe"],
  pirate: ["hat", "patch", "coat", "sash"],
  roman: ["helmet", "lorica", "skirt", "cape"],
  samurai: ["kabuto", "sode", "hakama"],
  shade: ["wrap", "sash"],
  shanidar: ["hair", "hide"],
  shaolin: ["kasaya", "sash", "sandals"],
  soldier: ["helmet", "vest", "webbing"],
  spartan: ["helm", "cloak", "cuirass", "greaveF", "greaveB"],
  viking: ["helm", "beard", "pelt", "belt"],
  western: ["hat", "bandana", "holster"],
  zulu: ["headring", "amashoba", "umutsha"],
};

/** What this fighter's GLB body draws for itself, if anything. */
export function wornByModel(id: string): string[] {
  return WORN_BY_MODEL[id] ?? [];
}

/** The model for a fighter, or undefined while nobody has built them one. */
export function modelFor(id: string): FighterModelEntry | undefined {
  return FIGHTER_MODELS[id];
}

/** Roster ids that still render as the flat stick rig, for anything counting. */
export function fightersWithoutModels(ids: readonly string[]): string[] {
  return ids.filter((id) => !FIGHTER_MODELS[id]);
}

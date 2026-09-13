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

/** The model for a fighter, or undefined while nobody has built them one. */
export function modelFor(id: string): FighterModelEntry | undefined {
  return FIGHTER_MODELS[id];
}

/** Roster ids that still render as the flat stick rig, for anything counting. */
export function fightersWithoutModels(ids: readonly string[]): string[] {
  return ids.filter((id) => !FIGHTER_MODELS[id]);
}

/**
 * How many particles the renderer is allowed to draw.
 *
 * Read by the ambient weather when a stage is built and by the effects system
 * on every spawn. A module-level knob rather than a constructor argument
 * because the two readers sit at the bottom of two long chains - Stage builds
 * its weather four calls deep, and Fx spawns from thirty call sites - and
 * threading a value through all of that would cost more code than the setting
 * is worth.
 *
 * "reduced" halves both; "off" removes the weather entirely and keeps only the
 * effects that tell the player something (the ones a fight is unreadable
 * without), which is why it is a scale here and a hard skip there.
 */
export type Detail = "full" | "reduced" | "off";

let detail: Detail = "full";

export function setDetail(next: Detail) {
  detail = next;
}

export function getDetail(): Detail {
  return detail;
}

/** Multiplier for any authored particle count. */
export function detailScale(): number {
  return detail === "off" ? 0 : detail === "reduced" ? 0.5 : 1;
}

/**
 * A menu plate.
 *
 * Restyled to the wood-and-verdigris mock-up in `reference/menu-buttons.png`
 * rather than the earlier brown-and-amber plaque, because that mock-up is what
 * the logo was drawn to sit with: planks running horizontally, iron chevron
 * caps on both ends, teal type with a teal glow behind the row.
 *
 * It is CSS rather than the artwork itself. The mock-up is one image of five
 * plates with their labels baked into them - Story Mode, Versus Arena and so
 * on - so there is no blank plate to cut out and no way to put a different
 * word on one. Drawn instead, it takes any label, scales to any width, and
 * carries the hover, press and focus states a bitmap cannot.
 */

/** Chevron ends: the plate points outward at both sides, like a signpost. */
const PLATE = "polygon(0 50%, 5% 0, 95% 0, 100% 50%, 95% 100%, 5% 100%)";

/**
 * Sawn planks. Hard-stopped gradients rather than soft ones, because a plank
 * edge is a line and a soft gradient reads as a smear of varnish.
 */
/**
 * Sawn boards.
 *
 * The angles matter and are easy to get backwards: in CSS a repeating gradient
 * at 90deg runs left to right and therefore draws VERTICAL stripes. The first
 * pass put the grain at 93deg and the plate came out looking like corrugated
 * iron. Boards lie along the plate, so the grain is near 0deg, and the seams
 * between them are hard horizontal lines rather than a soft blend.
 */
const WOOD = [
  "linear-gradient(0deg, transparent 0 30%, rgba(18,9,2,0.55) 30% 31.4%, transparent 31.4% 68%, rgba(18,9,2,0.55) 68% 69.4%, transparent 69.4%)",
  "repeating-linear-gradient(1.5deg, rgba(255,224,180,0.055) 0 1px, transparent 1px 8px)",
  "repeating-linear-gradient(-1deg, rgba(40,20,6,0.16) 0 1px, transparent 1px 13px)",
  "linear-gradient(#9c6636, #7d4d24 38%, #5f3a16 72%, #8a5a2b)",
].join(",");

/** The iron cap on each end. */
const CAP = "linear-gradient(#7f8f88, #46564f 40%, #2c3a34 70%, #5d6d66)";

export function StartButton({ onClick, label = "Press Start" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group relative block w-[min(80vw,440px)] transition-transform duration-100 hover:-translate-y-px active:translate-y-px focus-visible:outline-none"
    >
      {/* The glow sits behind the plate, not on it - in the mock-up the light
          spills out around the row rather than lighting the wood itself. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 inset-y-1 block opacity-70 blur-md transition-opacity duration-150 group-hover:opacity-100"
        style={{ background: "radial-gradient(60% 100% at 50% 50%, rgba(79,214,168,0.55), transparent 70%)" }}
      />
      <span className="relative block aspect-[440/92] w-full" style={{ clipPath: PLATE, background: WOOD }}>
        {/* Iron caps, inside the clip so they take the chevron with them. */}
        <span className="absolute inset-y-0 left-0 block w-[7%]" style={{ background: CAP }} />
        <span className="absolute inset-y-0 right-0 block w-[7%]" style={{ background: CAP }} />
        {/* The bevel: light along the top edge, shadow along the bottom. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 block"
          style={{
            boxShadow:
              "inset 0 2px 0 rgba(255,222,176,0.4), inset 0 -3px 6px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(28,20,10,0.5)",
          }}
        />
        <span
          className="absolute inset-0 flex items-center justify-center font-display font-bold uppercase"
          style={{
            fontSize: "clamp(19px, 4.4vw, 36px)",
            letterSpacing: "0.1em",
            textIndent: "0.1em",
            color: "#8fe3c0",
            // Cut into the plank, then lit from behind - the dark edge does the
            // carving and the coloured halo is the glow coming through it.
            textShadow:
              "0 2px 0 rgba(10,26,20,0.85), 0 -1px 0 rgba(190,255,228,0.35), 0 0 14px rgba(79,214,168,0.75)",
          }}
        >
          {label}
        </span>
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-focus-visible:opacity-100"
        style={{ clipPath: PLATE, boxShadow: "inset 0 0 0 3px var(--accent-hot)" }}
      />
    </button>
  );
}

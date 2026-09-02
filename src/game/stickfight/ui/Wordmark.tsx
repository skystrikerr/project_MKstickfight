/**
 * The game's wordmark.
 *
 * Not a heading with a font on it. Three layers of the same text: a dark one
 * offset behind for weight, then the word split along a diagonal with the two
 * halves kicked apart, all of it sheared. That is roughly how a fighting game
 * logo is actually built, and it is the difference between a title and a line
 * of type that happens to be large.
 *
 * The whole thing scales off one font size, so it stays in one piece at any
 * width without a second set of breakpoints.
 */

const SHEAR = "skewX(-9deg)";
/** Where the diagonal crosses, left edge to right edge. */
const CUT_L = 56;
const CUT_R = 34;

export function Wordmark({ className = "" }: { className?: string }) {
  const layer = "absolute left-0 top-0 whitespace-nowrap uppercase leading-[0.86]";
  return (
    <div
      className={`relative inline-block font-display font-bold uppercase leading-[0.86] tracking-[0.02em] ${className}`}
      style={{ fontSize: "clamp(52px, 10vw, 128px)", padding: "0 0.14em 0.09em" }}
      aria-label="Stick Fighter"
    >
      {/*
        One copy in normal flow, invisible, so the box has the width and height
        of the word. Every drawn layer is absolute over it - without this the
        container collapses to nothing and the layers drift off their centre.
      */}
      <span className="invisible whitespace-nowrap" aria-hidden>
        Stick Fighter
      </span>

      {/* Weight underneath, in the accent's own shadow rather than black. */}
      <div
        className={layer}
        aria-hidden
        style={{ transform: `${SHEAR} translate(0.17em, 0.055em)`, color: "#0f2419" }}
      >
        Stick Fighter
      </div>

      {/* Above the cut. */}
      <div
        className={layer}
        aria-hidden
        style={{
          transform: `${SHEAR} translateX(0.14em)`,
          clipPath: `polygon(0 0, 100% 0, 100% ${CUT_R}%, 0 ${CUT_L}%)`,
        }}
      >
        <span className="text-[var(--bone)]">Stick </span>
        <span className="text-[var(--accent-hot)]">Fighter</span>
      </div>

      {/* Below it, shunted right so the halves read as a break, not a seam. */}
      <div
        className={layer}
        aria-hidden
        style={{
          transform: `${SHEAR} translateX(0.23em)`,
          clipPath: `polygon(0 ${CUT_L}%, 100% ${CUT_R}%, 100% 100%, 0 100%)`,
        }}
      >
        <span className="text-[var(--bone)]">Stick </span>
        <span className="text-[var(--accent)]">Fighter</span>
      </div>
    </div>
  );
}

/**
 * The game's wordmark.
 *
 * Not a heading with a font on it. Three layers of the same text: a dark one
 * offset behind for weight, then the word split along a diagonal with the two
 * halves kicked apart, all of it sheared. That is roughly how a fighting game
 * logo is actually built, and it is the difference between a title and a line
 * of type that happens to be large.
 *
 * Three words, so it is a stacked lockup rather than one line. "Plank Fighter"
 * keeps the diagonal cut and the two-tone; "World" sits under it wide-tracked
 * and small. Set on one line instead, nineteen characters at the old size runs
 * off the side of a phone, and shrinking it to fit throws away the weight that
 * makes it a logo.
 *
 * The whole thing still scales off one font size, so it stays in one piece at
 * any width without a second set of breakpoints.
 */

/**
 * DROP THE REAL LOGO IN HERE.
 *
 * Put the file at `src/assets/logo.png`, add
 *
 *     import logo from "@/assets/logo.png";
 *
 * at the top, and set `LOGO = logo`. The CSS lockup below falls away and the
 * artwork renders in its place at the same size, keeping the accessible name.
 *
 * It is a constant rather than a prop because there is one logo and every
 * screen that shows it should show the same one - a prop would let them drift.
 */
const LOGO: string | null = null;

const SHEAR = "skewX(-9deg)";
/** Where the diagonal crosses, left edge to right edge. */
const CUT_L = 56;
const CUT_R = 34;

export function Wordmark({ className = "" }: { className?: string }) {
  if (LOGO) {
    return (
      <img
        src={LOGO}
        alt="Plank Fighter World"
        className={`block w-[min(88vw,760px)] select-none ${className}`}
        draggable={false}
      />
    );
  }
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <PlankFighter />
      {/*
        Tracked out to roughly the width of the line above it. A third word set
        at the same size would double the lockup's width for the least
        important word in it.
      */}
      <span
        className="mt-1 font-display font-bold uppercase text-[var(--accent-hot)]"
        style={{ fontSize: "clamp(15px, 2.9vw, 37px)", letterSpacing: "0.42em", textIndent: "0.42em" }}
        aria-hidden
      >
        World
      </span>
    </div>
  );
}

function PlankFighter() {
  const layer = "absolute left-0 top-0 whitespace-nowrap uppercase leading-[0.86]";
  return (
    <div
      className="relative inline-block font-display font-bold uppercase leading-[0.86] tracking-[0.02em]"
      style={{ fontSize: "clamp(52px, 10vw, 128px)", padding: "0 0.14em 0.09em" }}
      aria-label="Plank Fighter World"
    >
      {/*
        One copy in normal flow, invisible, so the box has the width and height
        of the word. Every drawn layer is absolute over it - without this the
        container collapses to nothing and the layers drift off their centre.
      */}
      <span className="invisible whitespace-nowrap" aria-hidden>
        Plank Fighter
      </span>

      {/* Weight underneath, in the accent's own shadow rather than black. */}
      <div
        className={layer}
        aria-hidden
        style={{ transform: `${SHEAR} translate(0.17em, 0.055em)`, color: "#0f2419" }}
      >
        Plank Fighter
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
        <span className="text-[var(--bone)]">Plank </span>
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
        <span className="text-[var(--bone)]">Plank </span>
        <span className="text-[var(--accent)]">Fighter</span>
      </div>
    </div>
  );
}

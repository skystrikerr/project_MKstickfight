/**
 * The Press Start plaque.
 *
 * A rebuild of the wood-and-brass button from the UI assets folder, drawn in
 * CSS because the file itself has never reached this machine - four attempts,
 * and the attachment renders without ever writing anything to disk.
 *
 * IF YOU ARE SWAPPING IN THE REAL ARTWORK: put the PNG at
 * `src/assets/press-start.png`, import it, and set `ART` below to it. Nothing
 * else has to change - the component keeps its size, its hover and press
 * states, its focus ring and its accessible name, because those are behaviour
 * rather than decoration and a bitmap does not provide them.
 *
 * What is reproduced: the chamfered frame, the two woods (a lighter frame
 * around a darker figured panel), the amber line where they meet, the bevel,
 * and blocky letterpressed type. What is not: the specific burl figure, which
 * is photographic. This reads as polished wood rather than that exact grain.
 */

const ART: string | null = null;

/** Corners are cut at roughly 45 degrees rather than rounded. */
const PLAQUE = "polygon(4% 0, 96% 0, 100% 26%, 100% 74%, 96% 100%, 4% 100%, 0 74%, 0 26%)";

/**
 * Burl, faked. Several off-centre radial gradients at low opacity over a base
 * brown read as figure in the wood; a single gradient reads as a smudge, and a
 * repeating one reads as a pattern, which is worse than either.
 */
const PANEL = [
  "radial-gradient(58% 150% at 18% 26%, rgba(176,104,44,0.85), transparent 62%)",
  "radial-gradient(44% 120% at 63% 74%, rgba(22,9,3,0.9), transparent 60%)",
  "radial-gradient(40% 110% at 88% 30%, rgba(196,120,54,0.7), transparent 58%)",
  "radial-gradient(34% 95% at 40% 86%, rgba(18,7,2,0.8), transparent 58%)",
  "radial-gradient(30% 90% at 74% 12%, rgba(28,12,4,0.7), transparent 55%)",
  "radial-gradient(90% 180% at 50% 45%, rgba(126,68,26,0.5), transparent 72%)",
  "linear-gradient(#6b3714, #371906)",
].join(",");

const FRAME = [
  "linear-gradient(#d69a58, #a36631 22%, #7a4620 52%, #5f3416 74%, #b0763c)",
].join(",");

export function StartButton({ onClick, label = "Press Start" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group relative block w-[min(78vw,420px)] transition-transform duration-100 hover:-translate-y-[1px] active:translate-y-[1px] focus-visible:outline-none"
    >
      {ART ? (
        <img src={ART} alt="" className="block w-full select-none" draggable={false} />
      ) : (
        <span
          className="relative block aspect-[420/126] w-full"
          style={{ clipPath: PLAQUE, background: FRAME }}
        >
          {/*
            Three layers, not one. The lit edge between the frame and the panel
            has to be a real element: a box-shadow glow on the panel is clipped
            away by the parent's clip-path, which is why the first pass had a
            chamfered plaque with no fire in it at all.
          */}
          <span
            className="absolute inset-[7%_2.6%] block"
            style={{
              clipPath: PLAQUE,
              background: "linear-gradient(#ffb43c, #ff7a10 45%, #c94e05 70%, #ffa32a)",
              filter: "drop-shadow(0 0 7px rgba(255,138,26,0.9))",
            }}
          />
          <span
            className="absolute inset-[11%_4.6%] block"
            style={{
              clipPath: PLAQUE,
              background: PANEL,
              boxShadow: "inset 0 4px 10px rgba(0,0,0,0.75), inset 0 -3px 7px rgba(255,178,92,0.18)",
            }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center font-mono font-bold uppercase"
            style={{
              fontSize: "clamp(17px, 4.6vw, 34px)",
              letterSpacing: "0.16em",
              textIndent: "0.16em",
              color: "#e8cf9a",
              // Letterpressed: a dark edge below and a light one above, which
              // is what makes type look cut into a surface rather than laid on.
              textShadow:
                "0 2px 0 #2a1405, 0 3px 1px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,226,176,0.45)",
            }}
          >
            {label}
          </span>
          {/* Focus and hover live on their own layer so they do not disturb the
              wood underneath - the glow lifts, nothing else moves. */}
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ boxShadow: "inset 0 0 30px 6px rgba(255,168,60,0.45)" }}
          />
        </span>
      )}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-focus-visible:opacity-100"
        style={{ clipPath: PLAQUE, boxShadow: "inset 0 0 0 3px var(--accent-hot)" }}
      />
    </button>
  );
}

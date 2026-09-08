/**
 * A fighter inside one of the painted card frames.
 *
 * Three stacked layers, in this order: the portrait sized into the frame's
 * window, the frame itself, and the name over the plate the frame draws along
 * its foot. The order matters - the plate is opaque art, so a name rendered
 * under the frame disappears behind it.
 *
 * Everything is positioned in per-cent of the card rather than pixels, which
 * is what lets the same component be a 90px roster tile and a 260px player
 * card without a second set of numbers. The fractions come from measuring the
 * frames' own alpha: the window is y 12.7%-75%, the name plate 75%-88%.
 */

import type { ReactNode } from "react";
import { FRAME_WINDOW, frame, portraitFor, type FrameKind } from "./art";

export function FighterCard({
  fighterId,
  kind = "plain",
  className = "",
  name,
  sub,
  children,
  title,
}: {
  fighterId: string;
  kind?: FrameKind;
  className?: string;
  /** Drawn on the frame's name plate. Omitted leaves the plate empty. */
  name?: string;
  sub?: string;
  /** Drawn inside the window, over the portrait - badges, marks, a number. */
  children?: ReactNode;
  title?: string;
}) {
  const art = portraitFor(fighterId);
  const border = frame(kind);
  const w = FRAME_WINDOW;

  return (
    <div
      className={`relative ${className}`}
      /* A container query context, so the name can be sized as a fraction of
         the card instead of needing a font size passed in at every call site.
         The same component then reads correctly at 90px and at 260px. */
      style={{ aspectRatio: "420 / 545", containerType: "inline-size" }}
      title={title}
    >
      {/* The window. Dark whether or not there is art in it, so a fighter
          nobody has painted yet reads as an empty card rather than a hole. */}
      <div
        className="absolute overflow-hidden bg-[#0d0b09]"
        style={{
          left: `${w.left * 100}%`,
          top: `${w.top * 100}%`,
          width: `${w.width * 100}%`,
          height: `${w.height * 100}%`,
        }}
      >
        {art && (
          <img
            src={art}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            /* The art is a standing figure with the head near the top, so a
               cover-crop is anchored high - centred cuts the face off. */
            style={{ objectPosition: "50% 20%" }}
          />
        )}
        {children}
      </div>

      {border && (
        <img src={border} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
      )}

      {name && (
        <div
          className="pointer-events-none absolute left-[15%] right-[15%] text-center"
          style={{ top: "76.5%" }}
        >
          <div
            className="truncate font-display font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)]"
            style={{ fontSize: "clamp(7px, 7.4cqw, 18px)" }}
          >
            {name}
          </div>
          {sub && (
            <div
              className="mt-[0.3em] truncate font-mono uppercase tracking-[0.12em] text-[var(--bone-dim)]"
              style={{ fontSize: "clamp(4px, 3.4cqw, 9px)" }}
            >
              {sub}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

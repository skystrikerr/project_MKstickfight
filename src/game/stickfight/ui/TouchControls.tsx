/** On-screen controls for touch devices: an analogue stick and four buttons. */

import { useRef, useState } from "react";
import type { Keyboard } from "../engine/input";

const DEAD_ZONE = 14;

export function TouchControls({ keyboard, player = "p1" }: { keyboard: Keyboard; player?: "p1" | "p2" }) {
  const stickRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  const setDir = (dx: number, dy: number) => {
    keyboard.setVirtual(`${player}:left`, dx < -DEAD_ZONE);
    keyboard.setVirtual(`${player}:right`, dx > DEAD_ZONE);
    keyboard.setVirtual(`${player}:up`, dy < -DEAD_ZONE);
    keyboard.setVirtual(`${player}:down`, dy > DEAD_ZONE);
  };

  const clearDir = () => {
    for (const d of ["left", "right", "up", "down"]) keyboard.setVirtual(`${player}:${d}`, false);
    setKnob({ x: 0, y: 0 });
  };

  const move = (e: React.PointerEvent) => {
    const el = stickRef.current;
    if (!el || pointerId.current !== e.pointerId) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const max = rect.width / 2;
    const dist = Math.min(max, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    setKnob({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    setDir(dx, dy);
  };

  const button = (label: string, code: "A" | "B" | "C" | "S", className: string) => (
    <button
      key={code}
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        keyboard.setVirtual(`${player}:${code}`, true);
      }}
      onPointerUp={() => keyboard.setVirtual(`${player}:${code}`, false)}
      onPointerLeave={() => keyboard.setVirtual(`${player}:${code}`, false)}
      onPointerCancel={() => keyboard.setVirtual(`${player}:${code}`, false)}
      className={`flex h-14 w-14 select-none items-center justify-center rounded-full border-2 text-sm font-black uppercase text-white/90 active:scale-95 ${className}`}
    >
      {label}
    </button>
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 sm:p-6">
      <div
        ref={stickRef}
        onPointerDown={(e) => {
          e.preventDefault();
          pointerId.current = e.pointerId;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        onPointerUp={() => {
          pointerId.current = null;
          clearDir();
        }}
        onPointerCancel={() => {
          pointerId.current = null;
          clearDir();
        }}
        className="pointer-events-auto relative h-32 w-32 touch-none rounded-full border-2 border-white/20 bg-black/40"
      >
        <div
          className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        />
      </div>

      <div className="pointer-events-auto grid touch-none grid-cols-2 gap-3">
        {button("A", "A", "border-sky-300/60 bg-sky-500/30")}
        {button("B", "B", "border-emerald-300/60 bg-emerald-500/30")}
        {button("C", "C", "border-rose-300/60 bg-rose-500/30")}
        {button("S", "S", "border-amber-300/60 bg-amber-500/30")}
      </div>
    </div>
  );
}

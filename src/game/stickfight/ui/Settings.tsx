/**
 * Settings: volume and player-1 key rebinding.
 *
 * Player 2 stays on the fixed arrow-keys layout - remapping two people's
 * hands on one keyboard is a niche worth a line in the controls list, not a
 * second menu. Everything here writes straight to the save on change, so
 * there is no separate "apply" step to forget.
 */

import { useEffect, useRef, useState } from "react";
import { music } from "../engine/music";
import { ACTION_LABELS, BINDABLE_ACTIONS, codeLabel, defaultKeyMap, type BindableAction, type KeyMap } from "../keybinds";
import { CONTROLS, P2_CONTROLS, PAD_CONTROLS, type ControlRow } from "../controls";
import { setDetail } from "../render/detail";
import { loadSave, patchSave, type SaveData } from "../save";

const MOTION_OPTIONS: { value: SaveData["motion"]; label: string; hint: string }[] = [
  { value: "full", label: "Full", hint: "Every impact punches the camera in." },
  { value: "reduced", label: "Reduced", hint: "A hit still lands, the camera barely moves." },
  { value: "off", label: "Off", hint: "No camera shake at all." },
];

const QUALITY_OPTIONS: { value: SaveData["quality"]; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "Checks the machine and picks. Drops to Low on a software renderer." },
  { value: "high", label: "High", hint: "Bloom, colour grade and vignette over the whole frame." },
  { value: "low", label: "Low", hint: "Plain render, no post-processing. Much cheaper." },
];

const PARTICLE_OPTIONS: { value: SaveData["particles"]; label: string; hint: string }[] = [
  { value: "full", label: "Full", hint: "All weather and every spark off an impact." },
  { value: "reduced", label: "Reduced", hint: "Half the weather and half the debris. Hits read the same." },
  { value: "off", label: "Off", hint: "No weather at all, and impacts keep only what tells you they landed." },
];

export function Settings({ onClose }: { onClose: () => void }) {
  const [save, setSave] = useState(loadSave);
  const [listening, setListening] = useState<BindableAction | null>(null);
  // The live session's Sfx lives in whatever GameCanvas mounted last; from the
  // title screen there is nothing to preview sfx volume against, so only
  // music (a module-level singleton) gets a live update here. The sfx number
  // still saves correctly - GameCanvas reads it fresh on the next match.
  const listeningRef = useRef(listening);
  listeningRef.current = listening;

  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === "Escape") {
        setListening(null);
        return;
      }
      const next: KeyMap = { ...save.p1Keys, [listeningRef.current!]: e.code };
      setSave(patchSave({ p1Keys: next }));
      setListening(null);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  const setMusicVolume = (v: number) => {
    music.setVolume(v);
    setSave(patchSave({ musicVolume: v }));
  };
  const setSfxVolume = (v: number) => setSave(patchSave({ sfxVolume: v }));

  const resetKeys = () => setSave(patchSave({ p1Keys: defaultKeyMap() }));

  const setMotion = (motion: SaveData["motion"]) => setSave(patchSave({ motion }));
  const setQuality = (quality: SaveData["quality"]) => setSave(patchSave({ quality }));
  // Live, as well as saved. The knob is read when a stage is built and on
  // every particle spawn, so a match already running picks up the impact side
  // immediately - the weather waits for the next stage, which is the honest
  // behaviour and is what the hint says.
  const setParticles = (particles: SaveData["particles"]) => {
    setDetail(particles);
    setSave(patchSave({ particles }));
  };
  const setHighContrast = (on: boolean) => {
    document.documentElement.dataset.contrast = on ? "high" : "";
    setSave(patchSave({ highContrast: on }));
  };

  return (
    <div className="grain absolute inset-0 z-40 flex flex-col bg-[var(--ink)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--rule)] p-4">
        <h2 className="font-display text-3xl font-bold uppercase leading-none tracking-[0.08em] text-[var(--bone)]">
          Settings
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cut-sm border border-[var(--rule)] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone)] hover:border-[var(--accent)]"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <section>
            <h3 className="mb-2 border-b border-[var(--rule)] pb-1 font-display text-2xl font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              Volume
            </h3>
            <div className="flex flex-col gap-3">
              <VolumeRow label="Music" value={save.musicVolume} onChange={setMusicVolume} />
              <VolumeRow label="Sound effects" value={save.sfxVolume} onChange={setSfxVolume} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 border-b border-[var(--rule)] pb-1 font-display text-2xl font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              Graphics
            </h3>
            <div className="flex flex-col gap-4">
              <Choice
                label="Effects quality"
                options={QUALITY_OPTIONS}
                value={save.quality}
                onChange={setQuality}
                note="Takes effect on the next match. The FX button during a fight still overrides it for that fight only."
              />
              <Choice
                label="Weather &amp; particles"
                options={PARTICLE_OPTIONS}
                value={save.particles}
                onChange={setParticles}
                note="Impacts change straight away; the weather changes when the next stage loads."
              />
            </div>
          </section>

          <section>
            <h3 className="mb-2 border-b border-[var(--rule)] pb-1 font-display text-2xl font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              Accessibility
            </h3>
            <div className="flex flex-col gap-4">
              <Choice label="Camera shake" options={MOTION_OPTIONS} value={save.motion} onChange={setMotion} />

              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span>
                  <span className="block font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone)]">
                    High contrast
                  </span>
                  <span className="block text-xs text-[var(--bone-dim)]">Brightens secondary text and borders.</span>
                </span>
                <input
                  type="checkbox"
                  checked={save.highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="box shrink-0"
                />
              </label>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-baseline justify-between border-b border-[var(--rule)] pb-1">
              <h3 className="font-display text-2xl font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                Player 1 controls
              </h3>
              <button
                type="button"
                onClick={resetKeys}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--bone-dim)] hover:text-[var(--bone)]"
              >
                Reset to defaults
              </button>
            </div>
            <p className="mb-3 text-xs text-[var(--bone-dim)]">
              Click a key, then press whatever you want it to be. Esc cancels.
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {BINDABLE_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setListening(action)}
                  className={`cut-sm flex items-center justify-between border px-3 py-2 text-left transition ${
                    listening === action
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--rule)] bg-[var(--ink-2)] hover:border-[var(--bone-dim)]"
                  }`}
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--bone-dim)]">
                    {ACTION_LABELS[action]}
                  </span>
                  <span className="font-display text-lg font-bold uppercase tracking-[0.04em] text-[var(--bone)]">
                    {listening === action ? "…" : codeLabel(save.p1Keys[action])}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 border-b border-[var(--rule)] pb-1 font-display text-2xl font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
              Controls reference
            </h3>
            <p className="mb-3 text-xs text-[var(--bone-dim)]">
              Player 1 shows the default keys. Anything rebound above changes the game, not this list.
            </p>
            <div className="grid gap-px bg-[var(--rule)] sm:grid-cols-3">
              {(
                [
                  { label: "Player 1", accent: "var(--accent)", rows: CONTROLS },
                  { label: "Player 2", accent: "var(--p2)", rows: P2_CONTROLS },
                  { label: "Gamepad", accent: "#7f9c6b", rows: PAD_CONTROLS },
                ] as { label: string; accent: string; rows: ControlRow[] }[]
              ).map((col) => (
                <div key={col.label} className="bg-[var(--ink-2)] p-3">
                  <div
                    className="mb-2 border-b pb-1.5 font-display text-lg font-bold uppercase tracking-[0.12em]"
                    style={{ color: col.accent, borderColor: "var(--rule)" }}
                  >
                    {col.label}
                  </div>
                  <ul className="space-y-1">
                    {col.rows.map((c) => (
                      <li key={c.keys} className="flex justify-between gap-3">
                        <span className="whitespace-nowrap font-mono text-[10px] text-[var(--bone)]">{c.keys}</span>
                        <span className="text-right text-[11px] text-[var(--bone-dim)]">{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--bone-dim)]">
              Specials use motion inputs: <span className="text-[var(--bone)]">↓↘→ + button</span> for a quarter circle,{" "}
              <span className="text-[var(--bone)]">→↓↘</span> for a dragon punch. Meter pays for EX specials (50) and
              supers (100). A gamepad works as soon as you plug it in and press a button.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * A row of mutually exclusive options.
 *
 * Three settings needed the same three-button grid and the first two had
 * already been written twice with slightly different padding, so it is one
 * component. The hint on each option is a `title`, and the note under the row
 * is for the thing a hover cannot say - when a change actually takes.
 */
function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  note,
}: {
  label: string;
  options: { value: T; label: string; hint: string }[];
  value: T;
  onChange: (v: T) => void;
  note?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone-dim)]">{label}</div>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            className={`cut-sm border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition ${
              value === opt.value
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--bone)]"
                : "border-[var(--rule)] bg-[var(--ink-2)] text-[var(--bone-dim)] hover:border-[var(--bone-dim)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--bone-dim)]">
        {note ?? options.find((o) => o.value === value)?.hint}
      </p>
    </div>
  );
}

function VolumeRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--bone-dim)]">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-1.5 flex-1 appearance-none bg-[var(--rule)] accent-[var(--accent)]"
      />
      <span className="w-10 text-right font-mono text-[11px] text-[var(--bone-dim)]">{Math.round(value * 100)}</span>
    </div>
  );
}

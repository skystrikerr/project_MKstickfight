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
import { loadSave, patchSave } from "../save";

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
        <div className="mx-auto flex max-w-xl flex-col gap-6">
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
        </div>
      </div>
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

/**
 * Plank Fighter World - a 2D three.js fighting game.
 *
 * Screens: title -> character select -> match, with the move list available
 * from anywhere.
 */

import { useEffect, useState } from "react";
import { CharacterSelect } from "@/game/stickfight/ui/CharacterSelect";
import { GameCanvas, type MatchConfig } from "@/game/stickfight/ui/GameCanvas";
import { FighterPage } from "@/game/stickfight/ui/FighterPage";
import { MoveList } from "@/game/stickfight/ui/MoveList";
import { ROSTER } from "@/game/stickfight/fighters";
import { Settings } from "@/game/stickfight/ui/Settings";
import { MainMenu } from "@/game/stickfight/ui/fighter-world/MainMenu";
import { music } from "@/game/stickfight/engine/music";
import { ContinuePrompt, EndingCard, VersusCard } from "@/game/stickfight/ui/Arcade";
import { advanceRun, continueRun, endingFor, startRun, type LadderStep, type Run } from "@/game/stickfight/ladder";
import { loadSave, recordClear, recordMatch, recordTower } from "@/game/stickfight/save";
import { FloorCard, TowerCleared, TowerLost, TowerSelect } from "@/game/stickfight/ui/Towers";
import {
  advanceTower,
  continueTower,
  rulesFor,
  startTower,
  TOWER_BY_ID,
  TOWERS,
  type TowerRun,
} from "@/game/stickfight/towers";
import type { WeaponVariant } from "@/game/stickfight/weapons";
import { SKINS } from "@/game/stickfight/skins";

type Screen = "title" | "select" | "towers" | "fight";

/**
 * Keeps the two sides of a mirror match visibly different. Everywhere else the
 * chosen colours stand, because they were chosen.
 */
function mirrorSafeSkin(step: LadderStep, p1Skin?: string, p2Skin?: string): string | undefined {
  if (step.stage !== "mirror" || p2Skin !== p1Skin) return p2Skin;
  return SKINS.find((s) => s.id !== p1Skin)?.id ?? p2Skin;
}

export default function StickFighter() {
  const [screen, setScreen] = useState<Screen>("title");
  /** Who the globe handed over, so character select opens on them. */
  const [worldFighter, setWorldFighter] = useState<string | undefined>(undefined);
  const [config, setConfig] = useState<MatchConfig | null>(null);
  // What the last finished match unlocked, if anything. Cleared when the
  // player acknowledges it or starts another fight.
  const [earned, setEarned] = useState<{ fighter: string; items: WeaponVariant[] } | null>(null);
  const [moveListFor, setMoveListFor] = useState<string | null>(null);
  const [pageFor, setPageFor] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [touch, setTouch] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  // A tower climb. Held separately from the arcade run rather than unified
  // with it: they share a shape but not a rulebook, and the last time two
  // modes shared one state object every branch had to ask which one it was.
  const [tower, setTower] = useState<TowerRun | null>(null);

  useEffect(() => {
    setTouch(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
    if (loadSave().highContrast) document.documentElement.dataset.contrast = "high";
  }, []);

  // Music needs a gesture before a browser will start it, same as the sound
  // effects. Whichever comes first wins; the cue asked for meanwhile is held.
  useEffect(() => {
    const wake = () => music.unlock();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  useEffect(() => {
    if (screen === "title") music.play("menu");
    else if (screen === "select") music.play("select");
  }, [screen]);

  /**
   * Credits a finished match to whoever actually played it.
   *
   * Only a seat a human held counts. In two-player both seats do; against the
   * CPU only seat one does, because the computer picking a fighter up for one
   * arcade rung has not earned anything with them.
   */
  const creditMatch = (cfg: MatchConfig, winner: number) => {
    const seats: { id: string; won: boolean }[] =
      cfg.mode === "versus"
        ? [
            { id: cfg.p1, won: winner === 0 },
            { id: cfg.p2, won: winner === 1 },
          ]
        : [{ id: cfg.p1, won: winner === 0 }];
    const items: WeaponVariant[] = [];
    for (const seat of seats) items.push(...recordMatch(seat.id, seat.won).unlocked);
    if (items.length) setEarned({ fighter: seats[0].id, items });
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[var(--ink)] text-[var(--bone)]">
      {/*
        The main menu is the globe.

        Per the package's integration contract this is the screen before
        character select: pick a marker, and select opens on that fighter. The
        component owns its own renderer and disposes it on unmount, so it is
        mounted and unmounted like any other screen and nothing of it survives
        into a match.
      */}
      {screen === "title" && (
        <MainMenu
          initialFighterId={loadSave().p1}
          onPick={(id) => {
            setWorldFighter(id);
            setScreen("select");
          }}
          onGo={(where) => {
            if (where === "options") {
              setShowSettings(true);
              return;
            }
            if (where === "training") {
              const saved = loadSave();
              setRun(null);
              setConfig({
                p1: saved.p1,
                p2: saved.p1,
                mode: "tutorial",
                aiLevel: "Rookie",
                rounds: 1,
                stage: "colosseum",
                p2Skin: SKINS.find((s) => s.id !== "classic")?.id,
              });
              setScreen("fight");
              return;
            }
            // Arcade and Versus are both choices character select already
            // makes, so they land there rather than duplicating the mode
            // picker on the menu.
            if (where !== "world") setScreen("select");
          }}
        />
      )}

      {screen === "select" && (
        <CharacterSelect
          initialP1={worldFighter}
          onShowProfile={(id) => setPageFor(id)}
          onStart={(opts) => {
            setConfig(opts);
            setRun(opts.mode === "arcade" ? startRun(opts.p1, opts.aiLevel) : null);
            setTower(null);
            // Towers needs one more choice - which tower - before there is a
            // fight to set up, so it stops at the list on the way through.
            setScreen(opts.mode === "towers" ? "towers" : "fight");
          }}
          onShowMoves={(id) => setMoveListFor(id)}
        />
      )}

      {screen === "towers" && config && (
        <TowerSelect
          towers={TOWERS}
          records={loadSave().towers}
          onPick={(id) => {
            setTower(startTower(id, config.p1));
            setScreen("fight");
          }}
          onQuit={() => setScreen("select")}
        />
      )}

      {screen === "fight" && config && !run && !tower && (
        <GameCanvas
          config={config}
          touch={touch}
          onQuit={() => setScreen("select")}
          onShowMoves={() => setMoveListFor(config.p1)}
          onResult={(winner) => creditMatch(config, winner)}
        />
      )}

      {screen === "fight" && config && tower && (() => {
        const def = TOWER_BY_ID[tower.tower];
        const floor = tower.floors[tower.at];
        if (!def || !floor) return null;
        // Only used to show the carried health as a percentage on the card;
        // the carry itself is measured against the bar the HUD reported.
        const maxHealth = ROSTER.find((f) => f.id === config.p1)?.stats.health ?? 1000;
        const best = loadSave().towers[tower.tower] ?? 0;
        return (
          <>
            {/*
              Same trick as the arcade ladder: the canvas stays mounted behind
              the floor card so the next fight is already warm. The key is the
              floor index, because a modifier is applied when a round starts -
              so a floor with different rules has to be a different match, not
              the same one carried forward.
            */}
            <GameCanvas
              key={`${tower.tower}-${tower.at}`}
              config={{
                ...config,
                mode: "cpu",
                p2: floor.opponent,
                aiLevel: floor.level,
                rounds: def.singleRound ? 1 : config.rounds,
                p2Skin: floor.opponent === config.p1 && config.p2Skin === config.p1Skin
                  ? SKINS.find((sk) => sk.id !== config.p1Skin)?.id
                  : config.p2Skin,
                p2Weapon: loadSave().weapons[floor.opponent],
                rules: rulesFor(floor, def, tower.carry),
              }}
              touch={touch}
              onQuit={() => {
                setTower(null);
                setScreen("select");
              }}
              onShowMoves={() => setMoveListFor(config.p1)}
              onResult={(winner) => creditMatch({ ...config, mode: "cpu" }, winner)}
              onMatchEnd={(winner, _finishing, health) => {
                setTower((t) => {
                  if (!t) return t;
                  const next = advanceTower(t, winner === 0, health[0]);
                  // Recorded only on a transition, for the same reason the
                  // ladder guards its advance: the match-end phase lasts many
                  // frames and reports more than once.
                  if (next.phase !== t.phase && (next.phase === "lost" || next.phase === "cleared")) {
                    recordTower(t.tower, next.cleared);
                  }
                  return next;
                });
              }}
            />

            {tower.phase === "versus" && (
              <FloorCard
                playerId={config.p1}
                tower={def}
                floor={floor}
                carry={tower.carry === null ? null : tower.carry / maxHealth}
                onFight={() => setTower({ ...tower, phase: "fight" })}
                onQuit={() => {
                  setTower(null);
                  setScreen("select");
                }}
              />
            )}

            {tower.phase === "lost" && (
              <TowerLost
                tower={def}
                floor={floor}
                cleared={tower.cleared}
                best={best}
                onRetry={() => setTower(continueTower(tower))}
                onQuit={() => {
                  setTower(null);
                  setScreen("select");
                }}
              />
            )}

            {tower.phase === "cleared" && (
              <TowerCleared
                playerId={config.p1}
                tower={def}
                cleared={tower.cleared}
                onDone={() => {
                  setTower(null);
                  setScreen("select");
                }}
              />
            )}
          </>
        );
      })()}

      {screen === "fight" && config && run && (
        <>
          {/*
            The canvas stays mounted through the versus card so the next fight
            is already warm behind it - remounting between every bout is what
            makes an arcade ladder feel like eight separate loading screens.
          */}
          <GameCanvas
            config={{
              ...config,
              mode: "cpu",
              p2: run.steps[run.at].opponent,
              aiLevel: run.steps[run.at].level,
              // A mirror match needs two different colours or you cannot tell
              // which stick figure is yours.
              p2Skin: mirrorSafeSkin(run.steps[run.at], config.p1Skin, config.p2Skin),
              // A weapon belongs to the fighter, not to the seat. The ladder
              // swaps the opponent every fight, so carrying the selected P2's
              // weapon along would hand it to whoever turned up next.
              p2Weapon: loadSave().weapons[run.steps[run.at].opponent],
            }}
            touch={touch}
            onQuit={() => {
              setRun(null);
              setScreen("select");
            }}
            onShowMoves={() => setMoveListFor(config.p1)}
            onResult={(winner) => creditMatch({ ...config, mode: "cpu" }, winner)}
            onMatchEnd={(winner, finishing) => {
              setRun((r) => {
                if (!r) return r;
                const next = advanceRun(r, winner === 0, finishing);
                if (next.phase === "cleared" && r.phase !== "cleared") {
                  const { unlocked } = recordClear(next.fighter, next.level);
                  if (unlocked.length) setEarned({ fighter: next.fighter, items: unlocked });
                }
                return next;
              });
            }}
          />

          {run.phase === "versus" && (
            <VersusCard
              playerId={config.p1}
              step={run.steps[run.at]}
              onFight={() => setRun({ ...run, phase: "fight" })}
              onQuit={() => {
                setRun(null);
                setScreen("select");
              }}
            />
          )}

          {run.phase === "lost" && (
            <ContinuePrompt
              step={run.steps[run.at]}
              continues={run.continues}
              recap={run.lastRecap}
              onRetry={() => setRun(continueRun(run))}
              onQuit={() => {
                setRun(null);
                setScreen("select");
              }}
            />
          )}

          {run.phase === "cleared" && (
            <EndingCard
              playerId={config.p1}
              ending={endingFor(config.p1)}
              level={config.aiLevel}
              continues={run.continues}
              onDone={() => {
                setRun(null);
                setScreen("select");
              }}
            />
          )}
        </>
      )}

      {/*
        The one moment the progression system is allowed to interrupt. An
        unlock that arrives silently is not a reward, and one that blocks the
        rematch button is a toll - so this sits at the bottom, says what was
        earned and where to put it on, and goes away when it is clicked.
      */}
      {earned && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <button
            type="button"
            onClick={() => setEarned(null)}
            className="cut-sm pointer-events-auto max-w-md border border-[var(--accent)] bg-[var(--ink-2)] px-4 py-3 text-left"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--accent)]">
              {earned.items.length > 1 ? "Weapons unlocked" : "Weapon unlocked"}
            </div>
            {earned.items.map((w) => (
              <div key={w.id} className="mt-1">
                <div className="font-display text-xl font-bold uppercase leading-none tracking-[0.02em] text-[var(--bone)]">
                  {w.name}
                </div>
                <p className="mt-1 text-xs leading-snug text-[var(--bone-dim)]">{w.blurb}</p>
              </div>
            ))}
            <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#5f6f66]">
              Equip it on the character select · click to dismiss
            </div>
          </button>
        </div>
      )}

      {pageFor && !moveListFor && (
        <FighterPage
          id={pageFor}
          onClose={() => setPageFor(null)}
          onShowMoves={(id) => setMoveListFor(id)}
        />
      )}
      {moveListFor && <MoveList fighterId={moveListFor} onClose={() => setMoveListFor(null)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

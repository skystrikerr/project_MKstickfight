import type { CSSProperties, ReactNode } from "react";
import "./CharacterSelectFrame.css";

export type CharacterActionKey = "customize" | "moves" | "progression";
export type StatKey = "melee" | "zoning" | "mobility" | "defense" | "pressure" | "technique";

export interface CharacterSelectAction {
  key: CharacterActionKey;
  title: string;
  subtitle: string;
  active?: boolean;
}

export interface CharacterSelectRosterEntry {
  id: string;
  label: string;
  selected?: boolean;
  locked?: boolean;
  badge?: string;
}

export interface CharacterSelectFrameProps {
  gameTitle?: string;
  gameTagline?: string;
  screenTitle?: string;
  screenSubtitle?: string;
  playerLabel?: string;
  centerPrompt?: string;

  fighterName: string;
  fighterTitle: string;
  location: string;
  era: string;
  weaponStyle: string;
  story: string;
  playstyleText: string;
  leftQuote?: string;

  actions?: CharacterSelectAction[];
  roster?: CharacterSelectRosterEntry[];

  leftArt?: ReactNode;
  statPanel?: ReactNode;
  skinPreview?: ReactNode;
  skinCounter?: string;
  skinName?: string;
  footerQuote?: string;
}

const DEFAULT_ACTIONS: CharacterSelectAction[] = (
  [
    { key: "customize", title: "Customize", subtitle: "Skins • Colors • Weapons" },
    { key: "moves", title: "Moves", subtitle: "View command list" },
    { key: "progression", title: "Progression", subtitle: "Level • Rewards • Stats" },
  ] satisfies CharacterSelectAction[]
).map((item, index) => ({ ...item, active: index === 0 }));

const DEFAULT_ROSTER: CharacterSelectRosterEntry[] = [
  "fighter-1","fighter-2","fighter-3","fighter-4","fighter-5","fighter-6",
  "fighter-7","fighter-8","fighter-9","fighter-10","fighter-11","fighter-12"
].map((id, index) => ({
  id,
  label: `Fighter ${index + 1}`,
  selected: index === 3,
  locked: index === 11,
}));

function ActionIcon({ kind }: { kind: CharacterActionKey }) {
  if (kind === "customize") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l7 4v10l-7 4-7-4V7l7-4Z" />
        <path d="M9 11h6M12 8v6" />
      </svg>
    );
  }
  if (kind === "moves") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5h12l2 2v12H5z" />
        <path d="M8 9h8M8 13h6M8 17h5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 18V8M11 18V5M17 18V11" />
      <path d="M3 8h4M9 5h4M15 11h4" />
    </svg>
  );
}

function StatIcon({ kind }: { kind: StatKey }) {
  switch (kind) {
    case "melee":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 18 6m-9 0 9 9M4 20l4-1-3-3-1 4Z" /></svg>;
    case "zoning":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-4-4 4 4-4 4M6 8l-2 4 2 4" /></svg>;
    case "mobility":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15c5-8 10-9 16-10-2 5-6 10-13 12m0 0-3 2m3-2 2 2" /></svg>;
    case "defense":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /></svg>;
    case "pressure":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V5m7 15V3m7 17V8M3 8l2-3 2 3m3-2 2-3 2 3m3 5 2-3 2 3" /></svg>;
    case "technique":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20V8m12 12V8M4 8h16M7 4h10l2 4H5l2-4Zm3 4v12m4-12v12" /></svg>;
  }
}

function ActionPlate({ action }: { action: CharacterSelectAction }) {
  return (
    <button type="button" className={`pfcs-action ${action.active ? "is-active" : ""}`}>
      <span className="pfcs-action__icon">
        <ActionIcon kind={action.key} />
      </span>
      <span className="pfcs-action__text">
        <strong>{action.title}</strong>
        <small>{action.subtitle}</small>
      </span>
    </button>
  );
}

function PlaceholderArt() {
  return (
    <div className="pfcs-placeholder-art">
      <div className="pfcs-placeholder-art__frame" />
      <div className="pfcs-placeholder-art__label">Character Art Slot</div>
    </div>
  );
}

function PlaceholderBars() {
  const rows = [
    ["melee", "Melee", "#c95143", 8],
    ["zoning", "Zoning", "#3f9ec2", 3],
    ["mobility", "Mobility", "#cb9b49", 6],
    ["defense", "Defense", "#54b177", 9],
    ["pressure", "Pressure", "#d77730", 7],
    ["technique", "Technique", "#996fd0", 6],
  ] as const;
  return (
    <div className="pfcs-bars">
      {rows.map(([kind, label, color, filled]) => (
        <div key={label} className="pfcs-bars__row">
          <span className="pfcs-bars__icon"><StatIcon kind={kind} /></span>
          <span className="pfcs-bars__label">{label}</span>
          <div className="pfcs-bars__track">
            {Array.from({ length: 10 }).map((_, i) => (
              <i
                key={i}
                className={`pfcs-bars__seg ${i < filled ? "is-filled" : ""}`}
                style={{ ["--seg-color" as never]: color } as CSSProperties}
              />
            ))}
          </div>
          <span className="pfcs-bars__value">{(filled + 1.2).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

function PlaceholderSkinPreview() {
  return (
    <div className="pfcs-skin-placeholder">
      <div className="pfcs-skin-placeholder__figure" />
      <div className="pfcs-skin-placeholder__label">Skin Preview Slot</div>
    </div>
  );
}

function RosterTile({ entry }: { entry: CharacterSelectRosterEntry }) {
  return (
    <button type="button" className={`pfcs-roster__tile ${entry.selected ? "is-selected" : ""} ${entry.locked ? "is-locked" : ""}`}>
      <div className="pfcs-roster__art">
        {entry.locked ? <span className="pfcs-roster__lock">?</span> : <span>{entry.label}</span>}
        {entry.badge ? <em className="pfcs-roster__badge">{entry.badge}</em> : null}
      </div>
      <div className="pfcs-roster__name">{entry.label}</div>
    </button>
  );
}

export function CharacterSelectFrame({
  gameTitle = "Plank Fighter",
  gameTagline = "History Fights Back",
  screenTitle = "Character Select",
  screenSubtitle = "Legends. Warriors. Icons.",
  playerLabel = "P1",
  centerPrompt = "Choose Your Fighter",

  fighterName,
  fighterTitle,
  location,
  era,
  weaponStyle,
  story,
  playstyleText,
  leftQuote = "Quote / Story slot.",

  actions = DEFAULT_ACTIONS,
  roster = DEFAULT_ROSTER,

  leftArt,
  statPanel,
  skinPreview,
  skinCounter = "Skin 1 / 4",
  skinName = "Default Variant",
  footerQuote = "UI frame prototype — character art and roster art will be filled separately.",
}: CharacterSelectFrameProps) {
  return (
    <section className="pfcs-shell">
      <header className="pfcs-topbar">
        <div className="pfcs-brand">
          <div className="pfcs-brand__crest" />
          <div>
            <div className="pfcs-brand__title">{gameTitle}</div>
            <div className="pfcs-brand__tag">{gameTagline}</div>
          </div>
        </div>

        <div className="pfcs-screenbox">
          <div className="pfcs-screenbox__title">{screenTitle}</div>
          <div className="pfcs-screenbox__sub">{screenSubtitle}</div>
        </div>
      </header>

      <div className="pfcs-main">
        <aside className="pfcs-art-panel">
          <div className="pfcs-banner">Art / Character Display</div>
          <div className="pfcs-art-stage">
            {leftArt ?? <PlaceholderArt />}
          </div>
          <div className="pfcs-quote">{leftQuote}</div>
        </aside>

        <section className="pfcs-info-panel">
          <div className="pfcs-fighter-head">
            <h2>{fighterName}</h2>
            <div className="pfcs-subname">{fighterTitle}</div>
          </div>

          <div className="pfcs-meta">
            <div><span>Location</span><strong>{location}</strong></div>
            <div><span>Era</span><strong>{era}</strong></div>
            <div><span>Style</span><strong>{weaponStyle}</strong></div>
          </div>

          <div className="pfcs-story"><p>{story}</p></div>

          <div className="pfcs-section-label">Playstyle</div>
          <p className="pfcs-playstyle">{playstyleText}</p>

          {statPanel ?? <PlaceholderBars />}
        </section>

        <aside className="pfcs-right-panel">
          <div className="pfcs-actions">
            {actions.map((action) => (
              <ActionPlate key={action.key} action={action} />
            ))}
          </div>

          <div className="pfcs-skin-card">
            <div className="pfcs-skin-card__viewport">
              {skinPreview ?? <PlaceholderSkinPreview />}
            </div>
            <div className="pfcs-skin-card__footer">
              <strong>{skinCounter}</strong>
              <small>{skinName}</small>
            </div>
          </div>
        </aside>
      </div>

      <div className="pfcs-roster-wrap">
        <div className="pfcs-roster">
          {roster.map((entry) => (
            <RosterTile key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      <footer className="pfcs-footer">
        <div className="pfcs-player-badge">{playerLabel}</div>
        <div className="pfcs-center-prompt">{centerPrompt}</div>
        <div className="pfcs-footer-quote">{footerQuote}</div>
      </footer>

      <div className="pfcs-controls">
        <span><b>A</b> Select</span>
        <span><b>B</b> Back</span>
        <span><b>X</b> Random</span>
        <span><b>Y</b> Stage Select</span>
      </div>
    </section>
  );
}

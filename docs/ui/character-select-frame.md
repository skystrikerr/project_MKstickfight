# Claude Integration — Character Select Frame v3 (Bar Logos)

This version updates the combat stat area by adding medallion-style logos to the
left of each bar. That pushes the combat profile farther away from generic web UI.

## New visual behavior
- each stat row has a circular metal icon medallion
- icons are thematic: sword, arrow, feather, shield, pressure glyph, pillar/technique glyph
- stat bars remain compatible with the earlier armored segmented style

## Files
Copy into:
`src/game/stickfight/ui/`

- `CharacterSelectFrame.tsx`
- `CharacterSelectFrame.css`

## Intended use
- keep this as the Character Select frame/layout layer
- inject generated fighter art into `leftArt`
- inject the final armored stat panel into `statPanel` if you prefer the dedicated bar component
- or use the built-in placeholder bar style as a visual reference

## Important
This package is still UI-only. Do not copy concept characters or generated roster art.
Use the existing real game data and real art assets.

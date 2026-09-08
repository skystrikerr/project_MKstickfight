# Claude Integration — Fighter World 3D

This package is intentionally isolated. Do not overwrite combat, match simulation,
fighters, stages, or the existing CharacterSelect.

## Goal

Add a real Three.js globe menu before CharacterSelect:

Main Menu -> Fighter World 3D -> choose a historical marker -> existing CharacterSelect

The component returns the existing fighter `id`, so the current roster remains the
single source of truth.

## Files to copy

Copy:
- `FighterWorld3D.tsx`
- `fighterWorld3DData.ts`
- `earth-map.png`

Suggested destination:
`src/game/stickfight/ui/fighter-world/`

## Integration contract

Render:

```tsx
<FighterWorld3D
  initialFighterId={worldFighter}
  onSelectFighter={(fighterId) => {
    setWorldFighter(fighterId);
    setScreen("select");
  }}
  onBack={() => setScreen("main")}
/>
```

Then initialize P1 on CharacterSelect with `worldFighter` if you choose to add that
small prop. If you want zero changes to CharacterSelect initially, simply use the
globe as a visual entry screen and open the normal select screen after selection.

## Important safeguards

1. Do not modify `fighters/index.ts`.
2. Do not duplicate FighterDef objects.
3. Do not move any combat code.
4. Do not replace the existing Three.js renderer used during fights.
5. Fighter World owns and disposes its own renderer when unmounted.
6. Preserve Electron's existing `app://` loading behavior.
7. Run `npm run check`, `npm run test`, and `npm run build` after integration.

## Controller behavior

- D-pad / left stick: cycle fighters
- A: choose fighter
- B: back
- Arrow keys / WASD: cycle fighters
- Enter / Space: choose
- Escape / Backspace: back

## Visual direction

The generated reference image established the target:
- large 3D globe on a carved pedestal
- dark historical-fantasy presentation
- glowing historical fighter locations
- warm bronze/amber highlights
- cinematic blue rim light
- fighter information panel
- stars / atmospheric depth

This implementation provides the real interactive 3D base. Future polish can replace
the procedural canvas globe texture with a higher fidelity bundled Earth texture and
replace marker beacons with small FighterPortrait-derived plaques or low-poly statues.

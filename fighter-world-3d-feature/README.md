# Fighter World 3D

A standalone, non-destructive Three.js feature package for Stick Fighter / Plank Fighter World.

This is not a screenshot mockup. `FighterWorld3D.tsx` creates a real WebGL scene with:

- a 3D sphere Earth mesh
- procedural stylized world texture
- atmosphere shell
- starfield
- bronze pedestal
- 15 fighter nodes anchored by latitude/longitude
- animated selection rings
- smooth globe rotation toward the selected fighter
- mouse drag rotation
- click-to-select markers
- keyboard navigation
- gamepad navigation
- callback into the game's existing fighter IDs
- full renderer / geometry / material disposal on unmount

No repository files were edited when this package was produced.

Use `CLAUDE_INTEGRATION.md` to integrate it safely.


## Visual assets

`earth-map.png` is bundled with the feature and is loaded locally by the Three.js globe. The component falls back to its procedural map if the texture cannot load.

`standalone-demo.html` is a self-contained interactive visual prototype. `actual-menu.png` is a browser-rendered screenshot of that real menu code, not an AI-generated concept image.

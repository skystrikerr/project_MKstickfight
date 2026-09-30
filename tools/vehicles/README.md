# Vehicle models

Car models for the vehicle-combat project are built from code, not modelled by hand.
Each car is a three.js builder (`<car>.js`, exporting one build function) that makes
the geometry and paints its livery onto a canvas atlas. Shared helpers live in
`kit.js`, including `createAtlas`, which lays out the livery bands and maps the
body's UVs (newer cars use it; the first two carry their own copy).
`export-vehicles.mjs` runs the builder in headless Chromium, then writes the GLB
and preview renders:

```
npm install                                   # for three
node tools/vehicles/export-vehicles.mjs       # all cars, or name them: mail-truck
```

Output:

- `assets/vehicles/<car>.glb`: a single self-contained binary glTF with embedded textures
- `assets/vehicles/previews/<car>-{hero,side,rear,front,top,left}.png`

To orbit a car interactively, serve the repo root and open
`/tools/vehicles/vehicle-lab.html?car=blue-murder`.

Conventions: metres, +Y up, the car faces +Z (glTF/Godot model front). Every car
has a `Body` node and `Wheel_FL/FR/RL/RR` nodes (origin on the axle, so each can
spin and steer); the rest are named parts such as `Ram`, `Bumper`, `Armour`,
`Cages` and `Roof`. Lamps and light-bar lenses are separate emissive meshes so the
game can flash or switch them.

| Car | Tris | Size (w × h × l) | Notes |
| --- | --- | --- | --- |
| Blue Murder | ~15k | 2.34 × 1.82 × 5.93 m | Crown Vic-style state-police interceptor with a spiked ram, caged glass and a caged light bar |
| Mail Truck | ~15k | 2.82 × 3.17 × 6.20 m | Lifted, armoured postal step van: caged windshield, push bumper and bull bar with lamps, roof light bar, rack of mail crates, bolted steel skirts, mud-terrain tyres |
| Last Song ("Jukebox" Vale) | ~36k | 2.34 × 2.33 × 6.65 m | Rusted purple late-70s luxury sedan: gold trim and wire wheels, waterfall grille, landau vinyl top, golden plow, three-tier speaker stack with neon-ringed cones |

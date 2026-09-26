# Vehicle models

Car models for the vehicle-combat project are built from code, not modelled by hand.
Each car is a three.js builder (`<car>.js`) that makes the geometry and paints its
livery onto a canvas atlas. `export-vehicles.mjs` runs the builder in headless
Chromium, then writes the GLB and preview renders:

```
npm install                                   # for three
node tools/vehicles/export-vehicles.mjs       # all cars, or name them: blue-murder
```

Output:

- `assets/vehicles/<car>.glb`: a single self-contained binary glTF with embedded textures
- `assets/vehicles/previews/<car>-{hero,side,rear,front,top,left}.png`

To orbit a car interactively, serve the repo root and open
`/tools/vehicles/vehicle-lab.html?car=blue-murder`.

Conventions: metres, +Y up, the car faces +Z (glTF/Godot model front). The node
tree is `Body`, `Wheel_FL/FR/RL/RR` (origin on the axle, so each can spin and
steer), `Ram`, `Cages` and `RoofRack`, with the light-bar lenses as separate
emissive meshes so the game can flash them.

| Car | Tris | Size (w × h × l) | Notes |
| --- | --- | --- | --- |
| Blue Murder | ~15k | 2.34 × 1.82 × 5.93 m | Crown Vic-style state-police interceptor with a spiked ram, caged glass and a caged light bar |

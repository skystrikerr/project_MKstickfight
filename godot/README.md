# Godot look test

Not a port, and not the start of one. This project exists to answer one
question with a picture rather than an argument:

> Do the same fighter models look better in an engine with cast shadows,
> ambient occlusion and a real tonemapper than they do in the Three.js build?

Same two GLBs out of `src/assets/models` (Freydis and Vorenus), same weapons in
the same sockets, no remodelling, no retexturing.

## Running it

Open the folder in Godot 4.3 and press F5. Everything is built from
`scripts/arena.gd` rather than from `.tscn` files, because a hand-written
scene that references an imported GLB has to carry the UID Godot assigns on
first import - which cannot be known before that import has happened.

To take a shot without a person holding the camera:

    godot --rendering-driver opengl3 --resolution 1280x720 -- --shot out.png

## What the test showed

Read `godot-vs-web.md` in the repo root for the finding. The short version is
that most of the difference was not Godot.

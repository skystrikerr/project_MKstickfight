# Godot vs the web build: what the look test actually showed

Two fighters (Freydis, Vorenus), the same GLBs from `src/assets/models`, built
in Godot 4.3 under `godot/` and shot against the same pair in `shotlab`.

## The finding

**Godot did not make the models look better as models.** Blocky is blocky; the
meshes are tubes and lofted boxes in both engines, and no renderer turns that
into a sculpted character. Anyone hoping an engine swap fixes the art should
look at `godot3.png` and stop there.

**But the Godot shot still reads cleaner, and the reason matters.** It is not
the renderer. It is that Godot is drawing the GLB *as authored* - one intact
model - while `fighter-model.ts` takes the same file apart into thirteen
per-joint chunks and reassembles them onto the runtime skeleton every frame.
That reassembly is what leaves the gaps, the floating helmet crest and the
limbs that come apart at the elbow. At the old camera distance it read as
"low quality". Pull the camera in and it reads as what it is: broken.

So the ranked list of what is wrong with the fighters on screen is:

1. The per-joint decomposition does not hold the model together.
2. The models are low-detail to begin with.
3. The presentation had no outline, no grounding, and blown-out lighting.

Only (2) is an art problem, and none of the three is a Three.js problem.

## The honest caveat

The Godot scene is a static rest pose. The game needs 883 moves driven by the
skeleton, which means Godot would have to solve the exact same problem - and
would hit the exact same wall, because the wall is that these GLBs are
rigid-body assemblies with no skin weights. Chopping them per joint is the only
thing you *can* do with an unskinned mesh.

The real fix, in either engine, is the same: skin the models to a skeleton in
Blender so a shoulder deforms instead of separating. That is art-side work on
the export, not engine work, and it makes the Three.js renderer's job trivial
(one `SkinnedMesh`, set bone transforms from `Skeleton`, done).

## Cost of a port, for the record

`engine/` imports Three.js nowhere - the sim, the 26 fighters, the 883 moves
and the 17,661 tests are all engine-agnostic and would survive. What would have
to be rewritten is the renderer and the entire React UI: menus, character
select, move lists, campaign, profile pages, settings. Months, to arrive at the
same models with the same skinning problem.

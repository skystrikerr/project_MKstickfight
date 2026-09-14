# Dienekes Blender model

Production-ready Blender revision based on the existing Dienekes visual design.
The fighter and each piece of equipment are deliberately separate.

## Files

- `dienekes-body.glb` — rigid segmented fighter body
- `dienekes-dory.glb` — 16 × 188 game units
- `dienekes-aspis.glb` — 54 × 54 game units; blank customizable face
- `dienekes-javelin.glb` — 12 × 98 game units; swap equipment
- `dienekes.blend` — editable production source
- `dienekes-body-preview.png` — body-only review render

## Validation

- Body: 1,667 triangles
- Body bounds: 39.88 × 20.18 × 116.32 game units
- Required rigid hierarchy and both hand sockets are present
- Every mesh has UVs
- Materials use only approved model-spec names
- No skinning, animation clips, cameras, or lights are exported
- No symbols or emblems are modeled into the body or equipment

The aspis face uses the neutral `linen` material slot so progression-controlled
colors and symbols can be supplied later without replacing the shield geometry.


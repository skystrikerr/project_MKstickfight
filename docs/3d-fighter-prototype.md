# 3D fighter prototype

Run `npm install` and `npm run dev`, then open `/planklab.html`. Drag to rotate,
scroll to zoom, and switch among idle, walk, guard and attack preview. This
separate lab does not change the fighting game's renderer or hitboxes.

`src/game/stickfight/render/plank3d.ts` creates a low-poly Roman-inspired
plank fighter entirely from Three.js geometry. The model has movable limb
pivots, flat-shaded lighting and named material slots: `cloth`, `trim`,
`leather`, `metal`, and `skin`.

## Texture preparation

Create reusable tileable cloth, leather, and metal textures now. Keep them
separate from a fighter's silhouette and color scheme. A small 512–1024 px
WebP neutral or grayscale color map per material is a good starting point for
this stylized target; the material's existing color tints that map. Check the
image in motion before increasing resolution. The model's boxes and cylinders
have UVs, and `setTexture(slot, texture)` accepts an sRGB color map.
The caller owns and disposes loaded textures; the model disposes its geometry
and materials.

Wait until a fighter model's UV layout is fixed before painting unique costume
details onto an atlas. A later Blender `.glb` can reuse these material names,
lighting direction, and color targets. It will still need animation mapping
to the existing fixed-step poses and a performance check before becoming an
in-game option.

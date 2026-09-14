import json
from pathlib import Path
root=Path(__file__).resolve().parent
profiles=json.loads((root/'fighter-assignments.json').read_text())
mats=json.loads((root/'materials.json').read_text())
lines=[
'# Plank Fighter texture starter library','',
'53 reusable color variants, each with three 512×512 PNG maps: basecolor (sRGB), tangent-space normal (linear), and packed ORM (R=ambient occlusion, G=roughness, B=metallic; read as linear). This makes 159 texture maps across linen, leather, metal, wood, paint, stone, skin, fur and rope. Three AI-generated source surfaces provide linen, leather and metal grain; variants and the remaining surface families were derived procedurally.','',
'![Material swatches](texture-contact-sheet.jpg)','',
'## Assignment by fighter','',
'| Fighter | Main textile or wrap | Leather | Armor | Shafts / wood | Blade or edge | Separate core equipment |','|---|---|---|---|---|---|---|']
for id,v in profiles.items():
    lines.append(f"| {id} | {v['bodyCloth']} | {v['strapsLeather']} | {v['armorMetal']} | {v['shaftOrFurnitureWood']} | {v['bladeOrEdge']} | {', '.join(v['weaponObjects'])} |")
lines += ['','## Mapping in Three.js / Blender','',
'1. Match the body or weapon mesh to the recommended material in `fighter-assignments.json`. `materialNameRecommendations` lists real material names found in the exported GLBs; some materials are unnamed and need to be selected by mesh/appearance.',
'2. Load `*-basecolor.png` as an sRGB color texture, `*-normal.png` as linear normal data. The source albedo should replace the existing material color, or the color and texture will multiply and become too dark. Set material color to white unless intentionally tinting.',
'3. Load `*-orm.png` with linear color space. Connect G to roughness and B to metalness; use R as occlusion only when the mesh has a suitable secondary UV set. Three.js MeshStandardMaterial metalnessMap and roughnessMap both accept the same ORM texture (B and G channels respectively).',
'4. Use UV repeat and inspect a few limbs in the actual game camera. The current exported primitives have TEXCOORD_0, but many use primitive-generated UV islands rather than a shared authored character atlas. UV adjustment is still required for attractive, consistent scale and for custom shield art. Tiny meshes may need a solid color instead of dense woven detail.',
'5. Keep weapons separate and reuse the same families in every character. Test with game lighting; the diffuse source images contain subtle baked grain and the normal maps are heuristic height derivatives, not scan-grade physical surface data.',
'','## Next textures needing unique art','',
'- Large shield faces: lambda aspis, Roman scutum, Chandos heater arms, Zulu hide panel, Persian spara, and individual round shield markings. These need model-specific UV layouts and bespoke symbol overlays.',
'- Outfit details: Tomoe armor lacing, Freydís fur and braid, Anne coat trim, Hattori scarf, trooper webbing, Subutai deel and quiver, Tzilacatzin spotted pelt, and Yuekong robe.',
'- Weapon accents: bow wraps, spear grip bindings, etched sword fittings, axe inlays, rifle stock details, and staff end bands. These are detail decals over the shared families.',
'','## Generation / provenance','',
'Three image-generation calls produced source albedo fields: orthographic linen weave, leather grain and brushed metal. Source files are in `sources/`; `build_textures.py` deterministically prepares color variants and prototype normal/ORM maps. Wood grain and other surface families are code-generated. No externally sourced photos were used.',
'','## Scope','',
'This is a reusable material library plus 26 fighter assignments. It does not rewrite the GLBs, modify the live game, or guarantee that any texture will align with every current UV island. The normal and roughness maps are stylized approximations. The surface tiles are made edge-matching by code; preview each in a repeated material to judge visual seams.',
]
(root/'README.md').write_text('\n'.join(lines)+'\n')
assert len(mats)==53 and len(profiles)==26

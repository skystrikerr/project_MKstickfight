"""Match reusable material swatches to 26 prototype bodies and core equipment."""
import json,zipfile,struct
from pathlib import Path
R=Path(__file__).resolve().parent
PACKS=R.parent/'asset-push/assets/fighter-prototypes/packs'
# Body cloth / leather / metal / wood / weapon metal; named overrides apply to exact GLB material names.
profiles={
'dienekes':('linen-crimson','leather-dark','metal-bronze','wood-ash','metal-steel'),
'vorenus':('linen-crimson','leather-natural','metal-iron','wood-oak','metal-steel'),
'freydis':('linen-undyed','leather-natural','metal-iron','wood-oak','metal-steel'),
'anne':('linen-navy','leather-dark','metal-steel','wood-walnut','metal-steel'),
'tomoe':('linen-navy','leather-black','metal-dark-iron','wood-walnut','metal-steel'),
'nai':('linen-crimson','leather-natural','metal-gold','wood-ash','metal-steel'),
'hanzo':('linen-indigo','leather-black','metal-dark-iron','wood-ebony','metal-steel'),
'subutai':('linen-teal','leather-saddle','metal-iron','wood-ash','metal-iron'),
'wyatt':('linen-rust','leather-saddle','metal-dark-iron','wood-walnut','metal-steel'),
'trooper':('linen-olive','leather-dark','metal-dark-iron','wood-walnut','metal-dark-iron'),
'chandos':('linen-ivory','leather-dark','metal-steel','wood-oak','metal-steel'),
'tzilacatzin':('linen-ochre','leather-natural','metal-bronze','wood-oak','stone-obsidian'),
'mgobozi':('linen-undyed','leather-dark','metal-iron','wood-oak','metal-iron'),
'yuekong':('linen-orange','leather-dark','metal-iron','wood-ash','wood-oak'),
'nihang':('linen-blue','leather-black','metal-steel','wood-walnut','metal-steel'),
'shade':('linen-black','leather-black','metal-dark-iron','wood-ebony','metal-steel'),
'maori':('linen-ochre','leather-natural','metal-iron','wood-oak','wood-walnut'),
'ethiopia':('linen-ivory','leather-natural','metal-gold','wood-walnut','metal-steel'),
'duelist':('linen-crimson','leather-black','metal-gold','wood-walnut','metal-polished-steel'),
'iceman':('fur-natural','leather-weathered','metal-copper','wood-ash','stone-flint'),
'celt':('linen-teal','leather-natural','metal-gold','wood-oak','metal-steel'),
'persian':('linen-crimson','leather-natural','metal-gold','wood-ash','metal-steel'),
'lapulapu':('linen-scarlet','leather-natural','metal-gold','wood-oak','metal-steel'),
'iceni':('linen-teal','leather-saddle','metal-bronze','wood-oak','metal-steel'),
'conquistador':('linen-undyed','leather-dark','metal-polished-steel','wood-walnut','metal-steel'),
'shanidar':('fur-natural','leather-weathered','metal-iron','wood-ash','stone-flint'),
}
# Materials used by these models are sometimes unnamed; this mapping is a starting recommendation by part rather than an applied UV map.
special={
'dienekes':{'crimson':'linen-crimson','redHighlight':'linen-scarlet','bronze':'metal-bronze','darkBronze':'metal-bronze','goldEdge':'metal-gold','iron':'metal-steel','wood':'wood-ash','ivory':'linen-ivory'},
'vorenus':{'crimson':'linen-crimson','redHighlight':'linen-scarlet','bronze':'metal-bronze','darkBronze':'metal-bronze','goldEdge':'metal-gold'},
'tomoe':{'crimson':'linen-crimson','iron':'metal-steel'},
'freydis':{'crimson':'paint-crimson','wood':'wood-oak'},
'chandos':{'goldEdge':'paint-gold','crimson':'paint-crimson','iron':'metal-steel'},
}
materialFallback={'leather':'leather-natural','iron':'metal-steel','bronze':'metal-bronze','darkBronze':'metal-bronze','goldEdge':'metal-gold','ivory':'linen-ivory','crimson':'linen-crimson','redHighlight':'linen-scarlet','skin':'skin-warm','wood':'wood-oak','shadow':'paint-black'}
weapons={
'dienekes':['aspis','dory'],'vorenus':['scutum','spear','gladius'],'freydis':['buckler','axe'],'anne':['cutlass','pistol'],'tomoe':['katana','yumi','arrow','saya'],'nai':['handwraps'],'hanzo':['tanto','yari','kunai'],'subutai':['bow','quiver','knife'],'wyatt':['revolver'],'trooper':['rifle','knife','bayonet'],'chandos':['sword','shield'],'tzilacatzin':['macuahuitl'],'mgobozi':['iklwa','shield'],'yuekong':['staff'],'nihang':['tulwar','chakram'],'shade':['kunaiF','kunaiB','shuriken','hook'],'maori':['taiaha','mere'],'ethiopia':['shotel','gasha','rifle'],'duelist':['smallsword','dagger'],'iceman':['axe','sling','flint'],'celt':['longsword','shield','gaesum'],'persian':['spear','spara','bow','akinakes'],'lapulapu':['kampilan','kalasag','bangkaw'],'iceni':['spear','shield','torch'],'conquistador':['toledo','rodela','crossbow','standard'],'shanidar':['spear','stone'],
}
textures=json.loads((R/'materials.json').read_text());out={}
for id,(cloth,leather,armor,wood,blade) in profiles.items():
    zf=PACKS/(id+'-model-pack.zip')
    with zipfile.ZipFile(zf) as z:
        gs=[n for n in z.namelist() if n.endswith('.glb') and 'assembled' not in n]
        mats=set(); uv_count=0;prims=0
        for n in gs:
            b=z.read(n);length,_=struct.unpack_from('<II',b,12);d=json.loads(b[20:20+length])
            mats|={m.get('name','unnamed') for m in d.get('materials',[])}
            for mesh in d.get('meshes',[]):
                for p in mesh['primitives']:
                    prims+=1;uv_count+=int('TEXCOORD_0' in p['attributes'])
    bindings={m:special.get(id,{}).get(m,materialFallback.get(m,cloth)) for m in sorted(mats)}
    values=[cloth,leather,armor,wood,blade,'skin-warm']
    assert all(x in textures for x in values+list(bindings.values())),id
    out[id]={
      'bodyCloth':cloth,'strapsLeather':leather,'armorMetal':armor,'shaftOrFurnitureWood':wood,
      'bladeOrEdge':blade,'bodySkin':'skin-deep' if id in ('mgobozi','ethiopia') else 'skin-warm',
      'weaponObjects':weapons[id],
      'materialNameRecommendations':bindings,
      'uvCoverage':f'{uv_count}/{prims} exported primitives contain TEXCOORD_0',
      'notes':'Use this as a UV and material assignment guide; no model GLB is automatically modified. Paint decals, logos and unique shield art need separate authored UV artwork.'
    }
(R/'fighter-assignments.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
assert len(out)==26
print('Assignments for',len(out),'fighters')

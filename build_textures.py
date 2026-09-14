"""Generate reusable 512px color, normal and ORM maps from three AI-made seeds and deterministic surfaces."""
from pathlib import Path
import json
import io
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parent
D=ROOT/'materials'; D.mkdir(exist_ok=True)
SIZE=512
Y,X=np.mgrid[:SIZE,:SIZE].astype(np.float32)
rng=np.random.default_rng(1945)

def seamless(array):
    # Fold the last 48px onto the first 48px, preserving all interior details.
    a=array.copy().astype(np.float32); border=48
    for axis in (0,1):
        start=np.take(a,range(border),axis=axis).copy()
        end=np.take(a,range(SIZE-border,SIZE),axis=axis).copy()
        t=np.linspace(0,1,border,dtype=np.float32)
        shape=[1]*a.ndim;shape[axis]=border
        t=t.reshape(shape)
        # Reverse-weighted crossfade gives equal values at the seam.
        blended=(start+np.flip(end,axis=axis))*.5
        sl=[slice(None)]*a.ndim;sl[axis]=slice(0,border)
        a[tuple(sl)]=blended*(1-t)+start*t
        sl[axis]=slice(SIZE-border,SIZE)
        a[tuple(sl)]=end*(1-t)+np.flip(blended,axis=axis)*t
    return a

def source(name,contrast=1.0):
    im=Image.open(ROOT/'sources'/f'ai-{name}.png').convert('L').resize((SIZE,SIZE),Image.Resampling.LANCZOS)
    a=seamless(np.asarray(im,dtype=np.float32)/255)
    return np.clip((a-a.mean())*contrast+.5,0,1)
linen=source('linen',.65);leather=source('leather',.95);metal=source('forged-metal',.8)
# Additional tileable patterns generated with periodic functions and deterministic noise.
wood=np.full((SIZE,SIZE),.5,dtype=np.float32)
for freq,amp in [(3,.09),(7,.055),(15,.03),(39,.015)]:
    phase=2*np.pi*freq*X/SIZE + .7*np.sin(2*np.pi*Y/SIZE)+.3*np.sin(4*np.pi*Y/SIZE)
    wood+=amp*np.cos(phase)
wood=np.clip(wood,0,1)
paint=np.clip(.5+(linen-.5)*.13,0,1)
stone=np.clip(.5+(metal-.5)*.6,0,1)
skin=np.clip(.5+(leather-.5)*.18,0,1)
fur=np.clip(.5+(linen-.5)*.65+.055*np.cos(2*np.pi*25*X/SIZE),0,1)
rope=np.clip(.5+(linen-.5)*.8,0,1)
def save_png(array,filename):
    b=io.BytesIO()
    Image.fromarray(array).save(b,format="PNG")
    payload=b.getvalue()
    assert payload[-12:-8] == bytes([0,0,0,0]) and payload[-8:-4] == b"IEND"
    filename.write_bytes(payload)

BASE=dict(linen=linen,leather=leather,metal=metal,wood=seamless(wood),paint=seamless(paint),stone=seamless(stone),skin=seamless(skin),fur=seamless(fur),rope=seamless(rope))
# One generated base per material class; palette variants are deterministic, inexpensive.
styles={
'linen': {'undyed':'ddd3bc','ivory':'eee6d4','crimson':'9e3e43','rust':'b4573c','ochre':'c99755','orange':'b9652e','navy':'293e62','indigo':'303c6e','black':'292932','olive':'586249','teal':'3c716b','blue':'547397','purple':'745b82','scarlet':'ae423c'},
'leather': {'natural':'84593a','dark':'3b3027','saddle':'995d37','oxblood':'60383c','tan':'b98759','black':'292a29','weathered':'826f59'},
'metal': {'iron':'9da6ab','steel':'b9c3c9','polished-steel':'d4d9d8','bronze':'b08348','gold':'c7a15a','dark-iron':'444d52','copper':'ad7055','silver':'c5c9c7'},
'wood': {'ash':'b49363','oak':'90704a','walnut':'63442e','ebony':'302923','painted-red':'823d3b','painted-blue':'405b75'},
'paint': {'crimson':'a0433d','navy':'30476a','ivory':'d9d3bb','gold':'be9b54','black':'333236'},
'stone': {'slate':'686c70','flint':'626b65','obsidian':'282c32','granite':'9a9190'},
'skin': {'warm':'ae8061','deep':'785039','light':'c4a080'},
'fur': {'natural':'988976','dark':'5d5043','ivory':'d4c5a4'},
'rope': {'hemp':'a99670','pale':'d5c8aa','dark':'78694d'},
}
metadata={};tiles=[]
for family,palette in styles.items():
    field=BASE[family]
    for name,hexcolor in palette.items():
        key=f'{family}-{name}'
        color=np.array([int(hexcolor[i:i+2],16) for i in (0,2,4)],dtype=np.float32)
        gain={'linen':.34,'leather':.38,'metal':.30,'wood':.42,'paint':.20,'stone':.42,'skin':.15,'fur':.37,'rope':.30}[family]
        albedo=np.uint8(np.clip(color[None,None,:]*(1+(field-.5)[...,None]*gain*2),0,255))
        hf=field-.5; dy,dx=np.gradient(hf)
        normal_strength={'linen':2,'leather':2,'metal':.75,'wood':1.35,'paint':.4,'stone':1.5,'skin':.22,'fur':1.25,'rope':1.7}[family]
        nx=-dx*normal_strength;ny=-dy*normal_strength;nz=np.ones_like(nx)
        nm=np.stack([nx,ny,nz],axis=2);nm/=np.linalg.norm(nm,axis=2,keepdims=True)
        nm=np.uint8(np.clip((nm*.5+.5)*255,0,255))
        metallic=1 if family=='metal' else 0
        rough={'linen':.92,'leather':.79,'metal':.53,'wood':.76,'paint':.68,'stone':.92,'skin':.85,'fur':.98,'rope':.96}[family]
        if name=='polished-steel':rough=.28
        if family=='metal' and name in ('bronze','dark-iron'):rough=.6
        if family=='wood' and name.startswith('painted'):rough=.65
        orm=np.empty_like(albedo);orm[:,:,0]=255
        orm[:,:,1]=np.uint8(np.clip((rough+(field-.5)*.12)*255,0,255));orm[:,:,2]=255*metallic
        save_png(albedo,D/(key+'-basecolor.png'))
        save_png(nm,D/(key+'-normal.png'))
        save_png(orm,D/(key+'-orm.png'))
        metadata[key]={'family':family,'baseColor':f'materials/{key}-basecolor.png','normal':f'materials/{key}-normal.png','occlusionRoughnessMetallic':f'materials/{key}-orm.png','roughness':rough,'metallic':metallic}
        tile=Image.fromarray(albedo).resize((155,155),Image.Resampling.LANCZOS)
        tiles.append((key,tile))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
W=900;cell=180;cols=5;rows=(len(tiles)+cols-1)//cols
sheet=Image.new('RGB',(W,rows*205),'#19242a');draw=ImageDraw.Draw(sheet)
for i,(name,tile) in enumerate(tiles):
    x=(i%cols)*cell+12;y=(i//cols)*205+8;sheet.paste(tile,(x,y));draw.text((x,y+162),name,font=font,fill='#d8d8d1')
sheet.save(ROOT/'texture-contact-sheet.jpg',quality=88)
(ROOT/'materials.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(len(tiles),'materials',len(tiles)*3,'maps')

import numpy as np, potrace, json
from PIL import Image
from scipy import ndimage
S=4
m=np.asarray(Image.open('/home/claude/lounge/work/logo/mask_big3.png'))>127
lab,n=ndimage.label(m, structure=np.ones((3,3)))
objs=ndimage.find_objects(lab)
def f(v): return ('%.2f'%(v/S)).rstrip('0').rstrip('.')
parts=[]
for i,o in enumerate(objs):
    comp=(lab==i+1)
    pl=potrace.Bitmap(~comp).trace(turdsize=30, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.05, opticurve=True, opttolerance=0.3)
    d=[]
    for curve in pl:
        sp=curve.start_point; d.append('M%s %s'%(f(sp.x),f(sp.y)))
        for seg in curve.segments:
            if seg.is_corner: d.append('L%s %sL%s %s'%(f(seg.c.x),f(seg.c.y),f(seg.end_point.x),f(seg.end_point.y)))
            else: d.append('C%s %s %s %s %s %s'%(f(seg.c1.x),f(seg.c1.y),f(seg.c2.x),f(seg.c2.y),f(seg.end_point.x),f(seg.end_point.y)))
        d.append('Z')
    x0,x1,y0,y1=o[1].start/S,o[1].stop/S,o[0].start/S,o[0].stop/S
    parts.append({'x0':x0,'x1':x1,'y0':y0,'y1':y1,'d':''.join(d)})
parts.sort(key=lambda p:(p['y0']>40, p['x0']))
for p in parts: print(round(p['x0'],1),round(p['x1'],1),round(p['y0'],1),round(p['y1'],1),len(p['d']))
json.dump(parts,open('/home/claude/lounge/work/logo/parts.json','w'))

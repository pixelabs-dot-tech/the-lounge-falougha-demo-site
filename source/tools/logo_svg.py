import numpy as np, potrace, sys
from PIL import Image
S=4
m=np.asarray(Image.open(sys.argv[1]))>127
pl=potrace.Bitmap(~m).trace(turdsize=30, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.05, opticurve=True, opttolerance=0.3)
def f(v): return ('%.2f'%(v/S)).rstrip('0').rstrip('.')
parts=[]
for curve in pl:
    sp=curve.start_point
    d=['M%s %s'%(f(sp.x),f(sp.y))]
    for seg in curve.segments:
        if seg.is_corner:
            d.append('L%s %sL%s %s'%(f(seg.c.x),f(seg.c.y),f(seg.end_point.x),f(seg.end_point.y)))
        else:
            d.append('C%s %s %s %s %s %s'%(f(seg.c1.x),f(seg.c1.y),f(seg.c2.x),f(seg.c2.y),f(seg.end_point.x),f(seg.end_point.y)))
    d.append('Z')
    parts.append(''.join(d))
path=''.join(parts)
H,W=m.shape
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d"><path fill-rule="evenodd" fill="#d9b8ad" d="%s"/></svg>'%(W//S,H//S,path)
open(sys.argv[2],'w').write(svg)
print('curves',len(pl),'chars',len(path))

import numpy as np
from PIL import Image, ImageFilter
import sys
base='/home/claude/lounge/work/logo/'
frames=[np.asarray(Image.open(base+f'end_{t}.png').convert('RGB')).astype(np.float32) for t in ['16.0','16.1','16.2']]
d01=np.abs(frames[0]-frames[1]).mean(); d12=np.abs(frames[1]-frames[2]).mean()
print('frame diffs', d01, d12)
avg=np.mean(frames,axis=0)
R,G,B=avg[...,0],avg[...,1],avg[...,2]
pink=(R-G)  # bg: 11-65=-54 ; letters ~ +40
print('pink range', pink.min(), pink.max())
# letter mask = R channel (bg R=11)
m=(R>60)&(R-G>5)
ys,xs=np.where(m)
print('mask bbox', xs.min(), xs.max(), ys.min(), ys.max())
# connected components
from scipy import ndimage
lab,n=ndimage.label(m)
sizes=ndimage.sum(m,lab,range(1,n+1))
objs=ndimage.find_objects(lab)
for i,(s,o) in enumerate(zip(sizes,objs)):
    if s>30: print(i+1,int(s),'x',o[1].start,o[1].stop,'y',o[0].start,o[0].stop)
# sample letter colour
sel=m&(R>150)
print('letter mean colour', avg[sel].mean(axis=0), 'bg', avg[0:200,0:200].reshape(-1,3).mean(axis=0))
np.save('/home/claude/lounge/work/logo/avg.npy',avg)

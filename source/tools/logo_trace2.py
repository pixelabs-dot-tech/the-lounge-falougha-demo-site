import numpy as np, potrace
from PIL import Image, ImageFilter
from scipy import ndimage
from skimage.filters import sato
from skimage.morphology import disk, binary_dilation, skeletonize
S=4
a=Image.open('/home/claude/lounge/work/logo/alpha_crop.png')
arr=np.asarray(a).astype(np.float32)/255
arr[232:,:40]=0
a=Image.fromarray((arr*255).astype(np.uint8))
big=a.resize((a.width*S,a.height*S),Image.BICUBIC)
b=np.asarray(big.filter(ImageFilter.GaussianBlur(1.4))).astype(np.float32)/255
main=b>0.42
# ridge detection for hairlines
r=sato(np.asarray(big).astype(np.float32)/255, sigmas=[2,3,4], black_ridges=False)
ridge=(r>0.035)&(b>0.10)
sk=skeletonize(ridge)
# keep skeleton pieces that are long (avoid noise)
lab,n=ndimage.label(sk, structure=np.ones((3,3)))
sizes=ndimage.sum(sk,lab,range(1,n+1))
keep=np.zeros_like(sk)
for i,s in enumerate(sizes):
    if s>=18: keep|=(lab==i+1)
hair=binary_dilation(keep, disk(2))
m=main|hair
# fill small holes
holes=ndimage.binary_fill_holes(m)&~m
lab,n=ndimage.label(holes)
sizes=ndimage.sum(holes,lab,range(1,n+1))
for i,s in enumerate(sizes):
    if s<1200: m[lab==i+1]=True
lab,n=ndimage.label(m)
sizes=ndimage.sum(m,lab,range(1,n+1))
for i,s in enumerate(sizes):
    if s<300: m[lab==i+1]=False
# light smoothing of the binary edge
ms=ndimage.gaussian_filter(m.astype(np.float32),1.2)>0.5
Image.fromarray((ms*255).astype(np.uint8)).save('/home/claude/lounge/work/logo/mask_big2.png')
for name,data in [('normal',ms),('inverted',~ms)]:
    try:
        pl=potrace.Bitmap(data).trace(turdsize=30, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.05, opticurve=True, opttolerance=0.3)
        xs=[c.start_point.x for c in pl]
        print(name,'curves',len(pl),'first start',pl[0].start_point.x,pl[0].start_point.y)
    except Exception as e: print(name,'err',e)

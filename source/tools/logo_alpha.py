import numpy as np
from PIL import Image
avg=np.load('/home/claude/lounge/work/logo/avg.npy')
bg=np.array([11.0,65.0,53.0]); L=np.array([190.0,160.0,154.0])
v=L-bg
a=((avg-bg)@v)/(v@v)
a=np.clip(a,0,1)
# crop
x0,x1,y0,y1=60,672,525,770
c=a[y0:y1,x0:x1]
# remove IG icon region just in case (x<100,y>760 in full coords) -> none in crop
im=Image.fromarray((c*255).astype(np.uint8))
im.save('/home/claude/lounge/work/logo/alpha_crop.png')
big=im.resize((im.width*3,im.height*3),Image.LANCZOS)
big.save('/home/claude/lounge/work/logo/alpha_big.png')
print(im.size, big.size)

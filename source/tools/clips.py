import numpy as np, cv2, subprocess, os, sys, shutil, json
SRC='/mnt/user-data/uploads/acf86d8dbd9f4bfab52372ad5504030f.mp4'
OUT='/home/claude/lounge/work/clips'
def frames(t0,t1):
    cap=cv2.VideoCapture(SRC); fps=cap.get(cv2.CAP_PROP_FPS)
    fs=[]; i=0
    while True:
        ok,f=cap.read()
        if not ok: break
        t=i/fps
        if t0<=t<t1: fs.append(f)
        i+=1
        if t>=t1: break
    return fs
RIGHT=[(626,284,676,332),(492,340,674,372),(448,370,676,400)]
LEFT=[(44,758,94,808),(44,818,230,848)]
def overlay_mask(fs, t0=0):
    rects = RIGHT if t0 < 9.1 else LEFT
    H,W=fs[0].shape[:2]
    acc=np.zeros((H,W),np.float32)
    for f in fs:
        g=cv2.cvtColor(f,cv2.COLOR_BGR2GRAY).astype(np.float32)
        bg=cv2.medianBlur(g.astype(np.uint8),15).astype(np.float32)
        mnc=f.min(axis=2).astype(np.float32)
        m=((g-bg)>16)|((bg-g)>12)|(mnc>205)
        z=np.zeros((H,W),bool)
        for (x0,y0,x1,y1) in rects: z[y0:y1,x0:x1]=True
        acc+=(m&z)
    m=(acc>=max(1,0.3*len(fs))).astype(np.uint8)
    m=cv2.dilate(m,np.ones((3,3),np.uint8),iterations=3)
    return m*255
def clean(fs,mask):
    if mask.sum()==0: return fs
    return [cv2.inpaint(f,mask,6,cv2.INPAINT_TELEA) for f in fs]
def write_frames(fs,d):
    if os.path.exists(d): shutil.rmtree(d)
    os.makedirs(d)
    for i,f in enumerate(fs): cv2.imwrite(f'{d}/{i:04d}.png',f)
def run(cmd):
    r=subprocess.run(cmd,capture_output=True,text=True)
    if r.returncode: print(r.stderr[-1500:]); raise SystemExit(1)
if __name__=='__main__':
    spec=json.loads(sys.argv[1])
    name=spec['name']; t0,t1=spec['t']
    fs=frames(t0,t1)
    m=overlay_mask(fs,t0)
    cv2.imwrite(f'{OUT}/{name}_mask.png',m)
    fs=clean(fs,m)
    d=f'{OUT}/_{name}'
    write_frames(fs,d)
    si=int(spec.get('still',0.5)*(len(fs)-1))
    cv2.imwrite(f'{OUT}/{name}_still.png',fs[si])
    if spec.get('only_still'):
        print(name,'still only, mask px',int((m>0).sum())); raise SystemExit(0)
    crop=spec.get('crop')  # x,y,w,h
    vf=[]
    if crop: vf.append('crop=%d:%d:%d:%d'%(crop[2],crop[3],crop[0],crop[1]))
    slow=spec.get('slow',1)
    if slow!=1:
        vf.append('setpts=%s*PTS'%slow)
        vf.append("minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1")
    w=spec.get('w',540)
    vf.append('scale=%d:-2:flags=lanczos'%w)
    tmp=f'{OUT}/_{name}_a.mp4'
    run(['ffmpeg','-v','error','-y','-framerate','30','-i',f'{d}/%04d.png','-vf',','.join(vf),'-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p',tmp])
    loop=spec.get('loop','boomerang')
    final=f'{OUT}/{name}.mp4'
    crf=str(spec.get('crf',25))
    if loop=='boomerang':
        run(['ffmpeg','-v','error','-y','-i',tmp,'-filter_complex','[0:v]split[a][b];[b]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1[o]','-map','[o]','-c:v','libx264','-preset','veryfast','-crf',crf,'-pix_fmt','yuv420p','-movflags','+faststart','-an',final])
    elif loop=='xfade':
        # crossfade the tail into the head for a seamless loop
        dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',tmp]).decode())
        xf=spec.get('xf',0.5)
        run(['ffmpeg','-v','error','-y','-i',tmp,'-i',tmp,'-filter_complex',
             '[0:v]trim=start=%.3f,setpts=PTS-STARTPTS[body];[1:v]trim=end=%.3f,setpts=PTS-STARTPTS[head];[body][head]xfade=transition=fade:duration=%.3f:offset=%.3f[o]'%(xf, xf, xf, dur-2*xf),
             '-map','[o]','-c:v','libx264','-preset','veryfast','-crf',crf,'-pix_fmt','yuv420p','-movflags','+faststart','-an',final])
    else:
        run(['ffmpeg','-v','error','-y','-i',tmp,'-c:v','libx264','-preset','veryfast','-crf',crf,'-pix_fmt','yuv420p','-movflags','+faststart','-an',final])
    run(['ffmpeg','-v','error','-y','-i',final,'-frames:v','1','-q:v','3',f'{OUT}/{name}.jpg'])
    sz=os.path.getsize(final)
    dur=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',final]).decode().strip()
    print(name,'frames',len(fs),'mask px',int((m>0).sum()),'size',sz,'dur',dur)

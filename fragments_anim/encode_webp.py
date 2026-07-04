import os, glob, sys
from PIL import Image

BASE = r"D:\LECLAT\fragments_anim\mp4\seq"
OUTW = r"D:\LECLAT\fragments_anim\webp"
SIZE = 640
os.makedirs(OUTW, exist_ok=True)

names = sorted([n for n in os.listdir(BASE) if os.path.isdir(os.path.join(BASE, n))])
if not names:
    print("NO_FOLDERS in", BASE); sys.exit(1)

for name in names:
    folder = os.path.join(BASE, name)
    files = sorted(glob.glob(os.path.join(folder, name + "_*.png")))
    if not files:
        print("NO_FRAMES", name); continue
    frames = []
    for f in files:
        im = Image.open(f).convert("RGB")
        if SIZE:
            im = im.resize((SIZE, SIZE), Image.LANCZOS)
        frames.append(im)
    out = os.path.join(OUTW, name + ".webp")
    frames[0].save(out, save_all=True, append_images=frames[1:],
                   duration=33, loop=0, quality=82, method=6)
    poster_idx = min(33, len(frames) - 1)
    frames[poster_idx].save(os.path.join(OUTW, name + "_poster.webp"), quality=85)
    print("WEBP", name, len(files), "frames", os.path.getsize(out) // 1024, "KB", flush=True)

print("ENCODE_DONE", flush=True)

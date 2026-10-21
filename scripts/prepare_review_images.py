"""Prepare selected publication photos; source files remain unchanged.
Usage: python3 scripts/prepare_review_images.py --output /tmp/review-images photo1.jpg photo2.png
Review each image for personal/order information BEFORE uploading. This script
removes metadata; it does not detect or redact text visible in the pixels.
"""
import argparse,json
from pathlib import Path
from PIL import Image,ImageOps

def prepare(sources,output,max_edge=1200,quality=80):
    output.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for i,source in enumerate(sources,1):
        target=output/f'{i:02}.webp'
        if target.exists():raise FileExistsError(f'Output already exists: {target}')
        with Image.open(source) as original:
            image=ImageOps.exif_transpose(original).convert('RGB')
            image.thumbnail((max_edge,max_edge))
            clean=Image.frombytes('RGB',image.size,image.tobytes())
            clean.save(target,'WEBP',quality=quality)
        with Image.open(target) as check:
            check.load()
            if check.getexif() or check.info.get('exif') or check.info.get('xmp'):
                raise ValueError(f'Metadata remains: {target}')
        manifest.append({'source':str(source),'file':target.name,'metadata_removed':True,'visual_privacy_review':'REQUIRED'})
    (output/'image-preflight.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    return manifest

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--max-edge',type=int,default=1200)
    parser.add_argument('sources',nargs='+',type=Path)
    args=parser.parse_args()
    print(json.dumps(prepare(args.sources,args.output,args.max_edge),ensure_ascii=False))

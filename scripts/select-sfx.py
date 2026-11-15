"""Find up to three suitable, distinct local source regions for the requested motion."""
from collections import defaultdict
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf
from sfx_regions import cached, run

root=Path('L:/TODO LO DEMAS/PRODUCCION/AUDIO/AUDIO/SOUND FX')
voices=json.loads(Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))['voices']
family=sys.argv[1]
target=max(.08,min(2,float(sys.argv[2])))
voice=voices[family]
related=[voices[k] for k in (sys.argv[3].split(',') if len(sys.argv)>3 else []) if k in voices]
db=sqlite3.connect('.audio-lab/library.sqlite',timeout=15)

def words(value):
    return ' '+re.sub('[^a-z0-9]+',' ',value.lower()).strip()+' '

def lexical(path):
    fields=[(words(path.stem),6),(words(str(path.parent.relative_to(root))),1)]
    primary=max((len(voice['terms'])-i+bonus for i,term in enumerate(voice['terms'])
                for field,bonus in fields if words(term) in field),default=0)
    secondary=sum(any(words(t) in fields[0][0] for t in v['terms']) for v in related)
    if family=='pulse' and secondary and not primary:
        # A digital chirp can be catalogued as a glitch without the word pulse.
        primary=4
    if not primary:return 0
    context_cost=3 if any(t in fields[0][0] for t in (' monitor ',' heartbeat ',' hospital ')) else 0
    return max(.25,primary+2*secondary-context_cost)


def distance(a,b):
    return abs(math.log((.012+a['attack'])/(.012+b['attack']))) + abs(math.log((100+a['centroid'])/(100+b['centroid']))) + 2*abs(a['high']-b['high'])+.25*abs(a['crest']-b['crest'])

reference=cached(db,Path('public/audio-lab')/(voice['takes'][0]['asset']+'.wav'))
folders=defaultdict(list)
for path in root.rglob('*'):
    if path.suffix.lower() in {'.wav','.aif','.aiff','.mp3','.flac','.ogg'}:
        text_score=lexical(path)
        if text_score:folders[path.parent].append((text_score,path))
for paths in folders.values():paths.sort(key=lambda p:(-p[0],str(p[1])))
# Give each collection a first entry before considering its second one.
pool=sorted([(i,-score,str(path),path) for paths in folders.values() for i,(score,path) in enumerate(paths)])[:24]
ranked=[]
for _,negative,_,path in pool:
    try:
        regions=cached(db,path)
        def compatibility(r):
            duration=r['end']-r['start']
            timbre=min((distance(r,ref) for ref in reference),default=3.)
            return -negative*.3 + 5/(1+timbre) + 2/(1+abs(math.log(duration/target))) - 30*r['overload']
        if regions:
            best=max(regions,key=compatibility)
            ranked.append((compatibility(best),path,best,len(regions)))
    except (OSError,ValueError,subprocess.SubprocessError):continue

def region_id(path,r):
    return hashlib.sha256(f"{path}|{path.stat().st_mtime_ns}|{r['start']}|{r['end']}|regions1".encode()).hexdigest()[:24]

# Only compare semantic scores among acoustically qualified finalists.
# If any finalist lacks an embedding, retain their original acoustic order.
has_semantics=db.execute("SELECT 1 FROM sqlite_master WHERE name='semantic_scores'").fetchone()
results=[]
fingerprints=set()
while ranked and len(results)<3:
    def preference(item):
        repeats=sum(Path(other['path']).parent==item[1].parent for other in results)
        return item[0]-.55*repeats
    item=max(ranked,key=preference)
    ranked.remove(item)
    score,path,r,count=item
    start,end=r['start'],r['end']
    key=region_id(path,r)
    dest=Path('public/audio-lab')/('library-'+key+'.wav')
    try:
        if not dest.exists():
            with tempfile.NamedTemporaryFile(dir=dest.parent,suffix='.wav',delete=False) as tmp:temp=Path(tmp.name)
            try:
                run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(start),'-i',str(path),'-t',str(end-start),'-ar','48000','-c:a','pcm_s24le',str(temp)])
                os.replace(temp,dest)
            finally:temp.unlink(missing_ok=True)
        pcm,_=sf.read(dest,dtype='float32',always_2d=True)
        levels=np.abs(pcm[:,:2])
        peak=levels.max()
        if peak<.0001 or np.mean(levels>=.999)>.025 or (levels[0].max()==peak and peak>.25):continue
        fingerprint=hashlib.sha256(pcm.tobytes()).digest()
        if fingerprint in fingerprints:continue
        fingerprints.add(fingerprint)
    except (subprocess.SubprocessError,OSError):continue
    reason=f"{family} · {round((end-start)*1000)} ms · ataque {round(r['attack']*1000)} ms · centro espectral {round(r['centroid'])} Hz · {count} regiones"
    results.append(dict(id=key,url='/audio-lab/'+dest.name,name=path.name,path=str(path),family=family,region=[start,end],features=r,score=round(score,2),method=reason))
if not results:raise ValueError('No compatible region')
if has_semantics:
    semantic=[db.execute('SELECT score FROM semantic_scores WHERE id=? AND family=?',(r['id'],family)).fetchone() for r in results]
    if all(semantic):
        for r,match in zip(results,semantic):
            r['semantic']=match[0]
            r['method']+=f" · CLAP {match[0]:.3f}"
        results.sort(key=lambda r:-(r['score']+3*r['semantic']))
manifest=Path('.audio-lab/candidates')
manifest.mkdir(exist_ok=True)
for result in results:
    dest=manifest/(result['id']+'.json')
    with tempfile.NamedTemporaryFile(dir=manifest,mode='w',encoding='utf8',delete=False) as tmp:
        json.dump(result,tmp)
    os.replace(tmp.name,dest)
print(json.dumps(dict(**results[0],candidates=results,filesConsidered=len(pool),matched=sum(map(len,folders.values())))))

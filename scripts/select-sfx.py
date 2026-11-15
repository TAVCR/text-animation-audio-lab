"""Rank read-only SFX by movement vocabulary and duration, then cache a transient region."""
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import tempfile

import numpy as np

ROOT = Path('L:/TODO LO DEMAS/PRODUCCION/AUDIO/AUDIO/SOUND FX')
registry = json.loads(Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))
family = sys.argv[1]
terms = registry['voices'][family]['terms']
target_duration = max(.08,min(2,float(sys.argv[2]))) if len(sys.argv)>2 else .35
db = sqlite3.connect('.audio-lab/library.sqlite',timeout=15)
db.execute('CREATE TABLE IF NOT EXISTS sounds(id TEXT PRIMARY KEY,path TEXT UNIQUE,size INTEGER,mtime INTEGER,metadata TEXT)')
extensions = {'.wav','.aif','.aiff','.mp3','.flac','.ogg'}

def normalized(value):
    return ' '+re.sub(r'[^a-z0-9]+',' ',value.lower()).strip()+' '

def score(path):
    name = normalized(path.stem)
    folder = normalized(str(path.parent.relative_to(ROOT)))
    return max((len(terms)-i+bonus for i,term in enumerate(terms)
                for field,bonus in [(name,6),(folder,1)] if normalized(term) in field),default=0)

def run(args):
    return subprocess.run(args,capture_output=True,timeout=15,check=True).stdout

candidates=[]
for path in ROOT.rglob('*'):
    if path.suffix.lower() in extensions:
        rating=score(path)
        if rating:candidates.append((rating,path))
ranked=[]
for rating,path in sorted(candidates,key=lambda c:(-c[0],str(c[1])))[:16]:
    try:
        stat=path.stat()
        old=db.execute('SELECT metadata FROM sounds WHERE path=? AND size=? AND mtime=?',(str(path),stat.st_size,stat.st_mtime_ns)).fetchone()
        meta=json.loads(old[0]) if old else json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
        duration=float(meta['format']['duration'])
        if duration<.03 or duration>60:continue
        ident=hashlib.sha256(str(path).encode()).hexdigest()[:24]
        db.execute('INSERT OR REPLACE INTO sounds VALUES(?,?,?,?,?)',(ident,str(path),stat.st_size,stat.st_mtime_ns,json.dumps(meta)))
        fit=1/(1+abs(np.log(duration/target_duration)))
        ranked.append((rating+3*fit,path,duration,stat))
    except (OSError,ValueError,KeyError,subprocess.SubprocessError):continue
db.commit()
for rating,path,duration,stat in sorted(ranked,key=lambda c:-c[0]):
    try:
        # Find the strongest non-silent 10 ms block; preserve its lead-in and decay.
        pcm=np.frombuffer(run(['ffmpeg','-nostdin','-v','error','-i',str(path),'-t','20','-ac','1','-ar','8000','-f','f32le','-']),dtype='<f4')
        blocks=pcm[:len(pcm)//80*80].reshape(-1,80)
        if not len(blocks):continue
        rms=np.sqrt(np.mean(blocks**2,axis=1))
        if rms.max()<.001:continue
        hit=float(rms.argmax())*.01
        start=max(0,hit-min(.5,target_duration))
        end=min(duration,hit+max(.5,target_duration))
        ident=hashlib.sha256(f'{path}|{stat.st_mtime_ns}|{start:.4f}|{end:.4f}'.encode()).hexdigest()[:24]
        target=Path('public/audio-lab')/('library-'+ident+'.wav')
        if not target.exists():
            with tempfile.NamedTemporaryFile(dir=target.parent,suffix='.wav',delete=False) as tmp:temp=Path(tmp.name)
            try:
                run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(start),'-i',str(path),'-t',str(end-start),'-ar','48000','-c:a','pcm_s24le',str(temp)])
                os.replace(temp,target)
            finally:temp.unlink(missing_ok=True)
        print(json.dumps(dict(url='/audio-lab/'+target.name,name=path.name,path=str(path),score=round(rating,2),method='Nombre, carpeta, duración y energía',region=[start,end],family=family,indexed=db.execute('SELECT count(*) FROM sounds').fetchone()[0])))
        break
    except (OSError,ValueError,subprocess.SubprocessError):continue
else:raise ValueError('No compatible candidates')


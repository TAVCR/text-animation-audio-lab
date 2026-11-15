"""Compare three retrieval methods over the same measured, real library regions."""
import json
import os
from pathlib import Path
import sqlite3
import sys

import numpy as np
import soundfile as sf

os.environ['EARSHOT_HOME']=str(Path('.audio-lab/clap-cache').resolve())
os.environ['EARSHOT_OFFLINE']='1'
os.environ['EARSHOT_CLAP']=str(Path('.audio-lab/clap-model').resolve())
os.environ['EARSHOT_PRECISION']='fp32'
sys.path.insert(0,str(Path('.audio-lab/earshot').resolve()))
from earshot.models import clap
from sfx_regions import cached,run
import math

queries={'whoosh':'a fast airy directional whoosh passing by','impact':'a single dry heavy impact or stamp',
         'digital':'a short burst of electronic digital glitch interference','pop':'a single short elastic bubble pop',
         'swish':'a soft smooth swishing transition'}
registry=json.loads(Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))['voices']
pool={}
# Include finalists after changes to collection stratification and motion context.
# The editor uses the median positive gap between actual events for this lookup.
import subprocess
voices_catalog=json.loads(Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))
for f in sorted(Path('examples').glob('universal-group-*.json')):
    for row in json.loads(f.read_text(encoding='utf8')):
        family=row['family']
        motion=next(m for m in voices_catalog['motions'].values() if row['template'] in m['templates'])
        gaps=sorted(np.diff(row['events'])/30)
        interval=gaps[len(gaps)//2] if gaps else .5
        args=[str(Path('.audio-lab/venv/Scripts/python.exe')),'scripts/select-sfx.py',family,str(interval),','.join(k for k in motion['voices'] if k!=family)]
        found=json.loads(subprocess.check_output(args))
        for c in found['candidates']:pool[c['id']]=c
items=list(pool.values())
assert items
engine=clap.get()
# Transformers 4.x uses the plural keyword; Earshot uses the newer spelling.
processor=engine.proc
def process(**kwargs):
    if 'audio' in kwargs:kwargs['audios']=kwargs.pop('audio')
    return processor(**kwargs)
engine.proc=process
vectors=[]
for i in range(0,len(items),4):
    signals=[]
    for item in items[i:i+4]:
        signal,rate=sf.read(Path('public')/item['url'].lstrip('/'),dtype='float32')
        assert rate==48000
        signals.append(signal)
    vectors.extend(engine.embed_audio(signals,batch=2))
text=engine.embed_text(list(queries.values()))
scores=np.asarray(vectors)@text.T
db=sqlite3.connect('.audio-lab/library.sqlite',timeout=15)
db.execute('CREATE TABLE IF NOT EXISTS semantic_scores(id TEXT,family TEXT,score REAL,PRIMARY KEY(id,family))')
results={}
for j,(family,query) in enumerate(queries.items()):
    terms=registry[family]['terms']
    references=cached(db,Path('public/audio-lab')/(registry[family]['takes'][0]['asset']+'.wav'))
    selections=[]
    for i,c in enumerate(items):
        name=c['name'].lower()
        lexical=max((len(terms)-k+bonus for k,t in enumerate(terms) for field,bonus in [(name,6),(c['path'].lower(),1)] if t in field),default=0)
        duration=c['region'][1]-c['region'][0]
        original=float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',c['path']]))
        metadata=lexical + 3/(1+abs(np.log(original/.35)))
        semantic=float(scores[i,j])
        # Region scores are specific to the acoustic family they were evaluated for.
        r=c['features']
        cost=min(abs(math.log((.012+r['attack'])/(.012+b['attack'])))+abs(math.log((100+r['centroid'])/(100+b['centroid'])))+2*abs(r['high']-b['high'])+.25*abs(r['crest']-b['crest']) for b in references)
        acoustic=.3*lexical+5/(1+cost)+2/(1+abs(math.log(duration/.35)))-30*r['overload']
        combined=acoustic+3*semantic
        selections.append(dict(id=c['id'],name=c['name'],url=c['url'],metadata=round(metadata,4),semantic=round(semantic,5),combined=round(combined,4)))
        db.execute('INSERT OR REPLACE INTO semantic_scores VALUES(?,?,?)',(c['id'],family,semantic))
    results[family]={method:sorted(selections,key=lambda r:-r[method])[:3] for method in ('metadata','semantic','combined')}
db.commit()
Path('examples/phase43/clap.json').write_text(json.dumps(dict(model='laion/larger_clap_general',revision='16c8cc3159a3c8a31e8ff5ef1f66b0d9ab3667db',queries=queries,pool=len(items),scores=results),indent=2),encoding='utf8')

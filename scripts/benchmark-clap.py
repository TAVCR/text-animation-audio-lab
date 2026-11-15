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

queries={'whoosh':'a fast airy directional whoosh passing by','impact':'a single dry heavy impact or stamp',
         'digital':'a short burst of electronic digital glitch interference','pop':'a single short elastic bubble pop',
         'swish':'a soft smooth swishing transition'}
registry=json.loads(Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))['voices']
pool={}
for f in sorted(Path('examples/phase43').glob('group-*.json')):
    for row in json.loads(f.read_text(encoding='utf8')):
        for c in row.get('candidates',[]):
            if c['id'] not in pool or c['score']>pool[c['id']]['score']:pool[c['id']]=c
items=list(pool.values())
assert items
engine=clap.get()
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
    selections=[]
    for i,c in enumerate(items):
        name=c['name'].lower()
        lexical=max((len(terms)-k+bonus for k,t in enumerate(terms) for field,bonus in [(name,6),(c['path'].lower(),1)] if t in field),default=0)
        duration=c['region'][1]-c['region'][0]
        metadata=lexical + 3/(1+abs(np.log(duration/.35)))
        semantic=float(scores[i,j])
        # Region scores are specific to the acoustic family they were evaluated for.
        acoustic=c['score'] if c['family']==family else 0
        combined=acoustic+3*semantic
        selections.append(dict(id=c['id'],name=c['name'],url=c['url'],metadata=round(metadata,4),semantic=round(semantic,5),combined=round(combined,4)))
        db.execute('INSERT OR REPLACE INTO semantic_scores VALUES(?,?,?)',(c['id'],family,semantic))
    results[family]={method:sorted(selections,key=lambda r:-r[method])[:3] for method in ('metadata','semantic','combined')}
db.commit()
Path('examples/phase43/clap.json').write_text(json.dumps(dict(model='laion/larger_clap_general',revision='16c8cc3159a3c8a31e8ff5ef1f66b0d9ab3667db',queries=queries,pool=len(items),scores=results),indent=2),encoding='utf8')

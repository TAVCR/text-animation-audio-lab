"""Rebuild an evicted, locally generated take from its persisted parameters."""
from pathlib import Path
from urllib.request import Request,urlopen
import json
import hashlib
import tempfile

origin='http://127.0.0.1:3217'
def post(data):
    request=Request(origin+'/api/procedural',data=json.dumps(data).encode(),headers={'Content-Type':'application/json','Origin':origin})
    return json.load(urlopen(request,timeout=240))
plan=post(dict(template='ink-stamp-print',frames=120,variant=47,style='Minimal',voices=['impact'],analysis={'events':[6]}))['plan']
take=plan['layers'][0]['takes'][0]
path=Path('public')/take['url'].lstrip('/')
digest=hashlib.sha256(path.read_bytes()).hexdigest()
with tempfile.TemporaryDirectory(dir='.audio-lab') as temp:
    backup=Path(temp)/path.name
    path.rename(backup)
    try:
        result=post({'restore':take})
        assert result['restored']==take['url'] and hashlib.sha256(path.read_bytes()).hexdigest()==digest
    finally:
        if not path.exists():backup.rename(path)
print('Identical PCM24 cache recovery:',digest)

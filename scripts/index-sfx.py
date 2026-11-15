"""Read-only pilot catalogue. All generated files live in Audio Lab."""
raise SystemExit('Flujo de biblioteca retirado en fase 5. Checkpoint: phase5-before-procedural-a562de7.')

import sqlite3, pathlib, subprocess, json, argparse, hashlib
ROOT=pathlib.Path(r'L:/TODO LO DEMAS/PRODUCCION/AUDIO/AUDIO/SOUND FX')
DB=pathlib.Path(__file__).resolve().parents[1]/'.audio-lab/library.sqlite'
parser=argparse.ArgumentParser();parser.add_argument('--limit',type=int,default=150);args=parser.parse_args()
DB.parent.mkdir(exist_ok=True)
con=sqlite3.connect(DB)
con.execute('CREATE TABLE IF NOT EXISTS sounds(id TEXT PRIMARY KEY,path TEXT UNIQUE,size INTEGER,mtime INTEGER,metadata TEXT)')
count=0
from collections import defaultdict, deque
from sfx_regions import cached
import re
voices=json.loads(pathlib.Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))['voices']
con.execute('CREATE TABLE IF NOT EXISTS acoustic_tags(path TEXT,family TEXT,PRIMARY KEY(path,family))')
folders=defaultdict(deque)
for item in ROOT.rglob('*'):
 if item.suffix.lower() in ('.wav','.mp3','.aiff','.aif','.flac','.ogg'):
  name=' '+re.sub('[^a-z0-9]+',' ',str(item.relative_to(ROOT)).lower())+' '
  tags=[k for k,v in voices.items() if any(' '+term+' ' in name for term in v['terms'])]
  collection=item.relative_to(ROOT).parts[0]
  folders[collection,tuple(tags)].append((item,tags))
def diverse_files():
 active=deque(folders.values())
 while active:
  folder=active.popleft()
  yield folder.popleft()
  if folder:active.append(folder)
for f,tags in diverse_files():
 if not f.is_file() or f.suffix.lower() not in ('.wav','.mp3','.aiff','.aif','.flac','.ogg'):continue
 if count>=max(1,min(args.limit,200)):break
 stat=f.stat();hit=con.execute('SELECT size,mtime FROM sounds WHERE path=?',(str(f),)).fetchone()
 if hit==(stat.st_size,stat.st_mtime_ns):
  exists=con.execute("SELECT 1 FROM sqlite_master WHERE name='acoustic_regions'").fetchone()
  if exists and con.execute('SELECT 1 FROM acoustic_regions WHERE path=? AND size=? AND mtime=?',(str(f),*hit)).fetchone():continue
 try:
  probe=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)],capture_output=True,timeout=10,check=True)
  meta=json.loads(probe.stdout);stream=next(s for s in meta['streams'] if s['codec_type']=='audio')
  if float(meta['format'].get('duration',0))<=0:continue
  cached(con,f)
  con.execute('DELETE FROM acoustic_tags WHERE path=?',(str(f),))
  con.executemany('INSERT INTO acoustic_tags VALUES(?,?)',[(str(f),t) for t in tags])
  con.execute('INSERT OR REPLACE INTO sounds VALUES(?,?,?,?,?)',(hashlib.sha256(str(f).encode()).hexdigest()[:24],str(f),stat.st_size,stat.st_mtime_ns,json.dumps(meta)));con.commit();count+=1
  print(json.dumps({'indexed':count,'name':f.name}),flush=True)
 except (subprocess.SubprocessError,ValueError,StopIteration):continue
print(json.dumps({'done':True,'count':count}))


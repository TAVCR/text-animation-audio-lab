"""Read-only pilot catalogue. All generated files live in Audio Lab."""
import sqlite3, pathlib, subprocess, json, argparse, hashlib
ROOT=pathlib.Path(r'L:/TODO LO DEMAS/PRODUCCION/AUDIO/AUDIO/SOUND FX')
DB=pathlib.Path(__file__).resolve().parents[1]/'.audio-lab/library.sqlite'
parser=argparse.ArgumentParser();parser.add_argument('--limit',type=int,default=150);args=parser.parse_args()
DB.parent.mkdir(exist_ok=True)
con=sqlite3.connect(DB)
con.execute('CREATE TABLE IF NOT EXISTS sounds(id TEXT PRIMARY KEY,path TEXT UNIQUE,size INTEGER,mtime INTEGER,metadata TEXT)')
count=0
from collections import defaultdict, deque
folders=defaultdict(deque)
for item in ROOT.rglob('*'):
 if item.suffix.lower() in ('.wav','.mp3','.aiff','.aif','.flac','.ogg'):
  folders[item.parent].append(item)
def diverse_files():
 active=deque(folders.values())
 while active:
  folder=active.popleft()
  yield folder.popleft()
  if folder:active.append(folder)
for f in diverse_files():
 if not f.is_file() or f.suffix.lower() not in ('.wav','.mp3','.aiff','.aif','.flac','.ogg'):continue
 if count>=max(1,min(args.limit,200)):break
 stat=f.stat();hit=con.execute('SELECT size,mtime FROM sounds WHERE path=?',(str(f),)).fetchone()
 if hit==(stat.st_size,stat.st_mtime_ns):continue
 try:
  probe=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)],capture_output=True,timeout=10,check=True)
  meta=json.loads(probe.stdout);stream=next(s for s in meta['streams'] if s['codec_type']=='audio')
  if float(meta['format'].get('duration',0))<=0:continue
  # A bounded analysis window protects against hours-long recordings.
  analysis=subprocess.run(['ffmpeg','-nostdin','-v','info','-i',str(f),'-t','20','-af','silencedetect=noise=-40dB:d=0.05,astats=metadata=0','-f','null','-'],capture_output=True,timeout=20)
  meta['analysis_window_seconds']=20;meta['analysis']=analysis.stderr.decode(errors='replace')[-12000:]
  con.execute('INSERT OR REPLACE INTO sounds VALUES(?,?,?,?,?)',(hashlib.sha256(str(f).encode()).hexdigest()[:24],str(f),stat.st_size,stat.st_mtime_ns,json.dumps(meta)));con.commit();count+=1
  print(json.dumps({'indexed':count,'name':f.name}),flush=True)
 except (subprocess.SubprocessError,ValueError,StopIteration):continue
print(json.dumps({'done':True,'count':count}))


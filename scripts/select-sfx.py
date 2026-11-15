import pathlib,sys,sqlite3,subprocess,json,hashlib
root=pathlib.Path('L:/TODO LO DEMAS/PRODUCCION/AUDIO/AUDIO/SOUND FX')
terms={key:value['terms'] for key,value in json.loads(pathlib.Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))['voices'].items()}
template=sys.argv[1]
if template not in terms:raise ValueError('Unsupported template')
db=sqlite3.connect('.audio-lab/library.sqlite')
candidates=[]
for f in root.rglob('*'):
 if f.suffix.lower() not in ('.wav','.mp3','.aif','.aiff','.flac','.ogg') or not f.is_file():continue
 score=max(((len(terms[template])-i)+(5 if t in f.stem.lower() else 0) for i,t in enumerate(terms[template]) if t in str(f.relative_to(root)).lower()),default=0)
 if score:candidates.append((score,f))
candidates.sort(key=lambda p:(-p[0],str(p[1])))
for score,f in candidates[:12]:
 try:
  meta=json.loads(subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(f)],capture_output=True,timeout=10,check=True).stdout)
  duration=float(meta['format']['duration'])
  if not .03<duration<60:continue
  ident=hashlib.sha256(str(f).encode()).hexdigest()[:24]
  stat=f.stat();db.execute('INSERT OR REPLACE INTO sounds VALUES(?,?,?,?,?)',(ident,str(f),stat.st_size,stat.st_mtime_ns,json.dumps(meta)));db.commit()
  target=pathlib.Path('public/audio-lab')/('library-'+ident+'.wav')
  if not target.exists():subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(f),'-t','20','-ar','48000','-c:a','pcm_s24le',str(target)],capture_output=True,timeout=30,check=True)
  print(json.dumps(dict(url='/audio-lab/'+target.name,name=f.name,path=str(f),score=score,method='Nombre y carpeta; sin embeddings',region=[0,min(20,duration)],indexed=db.execute('select count(*) from sounds').fetchone()[0])))
  break
 except (ValueError,KeyError,subprocess.SubprocessError):continue
else:raise ValueError('No compatible candidates')

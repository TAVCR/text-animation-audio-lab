"""Earshot line-protocol worker. Only installed bank entries can be synthesized."""
import hashlib
import json
import math
import os
from pathlib import Path
import sys
import tempfile

import numpy as np
import soundfile as sf

sys.path.insert(0,str(Path('.audio-lab/earshot').resolve()))
from earshot.forge import bank

RATE=48000
VERSION='earshot-4ac3-phase5-1'
ROOT=Path('public/audio-lab/synthesis')
CATALOG=Path('src/lib/sound/earshot-bank.json')
FAMILIES=json.loads(Path('src/lib/sound/procedural-roles.json').read_text())
STYLES=['Minimal','Cinematic','Experimental']

def identity(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()

def atomic_wav(path,data):
    with tempfile.NamedTemporaryFile(dir=path.parent,suffix='.wav',delete=False) as tmp:name=tmp.name
    try:
        sf.write(name,data,RATE,subtype='PCM_24')
        os.replace(name,path)
    finally:Path(name).unlink(missing_ok=True)

def catalog():
    rows=bank.list_sounds()
    for row in rows:
        e=bank.get(row['id'])
        row.update(channels=e.get('meta',{}).get('channels'),parameters=e.get('params',{}),
                   decay_s=round((row['end_s'] or 0)-(row['peak_s'] or 0),4))
    return rows

def synth(row,seed,duration,style):
    knobs=row['knobs']
    natural=row['dur_s'] or duration
    params=dict(seed=seed,sr=RATE,peak_db=-3)
    if knobs['dur'] in ('shape','param'):
        params['dur']=round(np.clip(duration,max(.035,natural*.4),max(.055,natural*1.75)),3)
    if knobs['apex'] and 'dur' in params:
        params['apex']=round(params['dur']*(.42 if style=='Experimental' else .60),3)
    pitch=knobs.get('pitch')
    if pitch and pitch.get('native_hz') and pitch.get('range_hz'):
        hz=pitch['native_hz']*2**(((seed%9)-4)/24)
        params['pitch']=round(float(np.clip(hz,*pitch['range_hz'])),2)
    return materialize(row,params)

def materialize(row,params):
    key=identity([VERSION,row['id'],params])
    wav=ROOT/(key+'.wav')
    meta=ROOT/(key+'.json')
    if not (wav.exists() and meta.exists()):
        y,_=bank.render(row['id'],checks=False,**params)
        y=np.asarray(y,dtype=np.float32).reshape(len(y),-1)
        envelope=np.max(abs(y),axis=1)
        peak=int(envelope.argmax())
        if not np.isfinite(y).all() or envelope[peak]<.0001:raise ValueError('Toma sin señal')
        audible=np.flatnonzero(envelope>=envelope[peak]*.01)
        atomic_wav(wav,y)
        with tempfile.NamedTemporaryFile(dir=ROOT,mode='w',encoding='utf8',delete=False) as tmp:
            json.dump(dict(peak=peak,onset=int(audible[0]),end=int(audible[-1]),samples=len(y),channels=y.shape[1]),tmp)
        os.replace(tmp.name,meta)
    return dict(recipe=row['id'],params=params,url='/audio-lab/synthesis/'+wav.name,**json.loads(meta.read_text()))

def generate(q,rows):
    frames=int(q['frames'])
    if not 1<=frames<=3600:raise ValueError('Duración fuera de rango')
    a=q['analysis'];events=sorted(set(int(f) for f in a['events'] if 0<=int(f)<frames))
    style=q['style'];index=STYLES.index(style);variant=int(q['variant'])
    if not events:raise ValueError('Sin eventos visuales')
    visual_indices={frame:i for i,frame in enumerate(events)}
    director=q.get('director') or {}
    strategy=director.get('strategy',{})
    voices=[k for k in q['voices'] if k in FAMILIES]
    if strategy.get('voice') in voices:voices.remove(strategy['voice']);voices.insert(0,strategy['voice'])
    typing=q['template']=='typewriter'
    voice='typing' if typing else voices[0]
    word_sequence=q['template'] in ('bubble-pop','slide-in','smooth-sliding','word-highlight-tracker','paper-cutout-assemble','viral-text','kinetic-box-sequence')
    preserve_events=word_sequence or typing
    if director.get('events') and not preserve_events:
        events=sorted({events[i] for i in director['events'] if type(i) is int and 0<=i<len(events)}) or events
    interval=np.median(np.diff(events))/30 if len(events)>1 else min(.7,frames/30)
    limit=[4,8,10][index]
    if strategy.get('density')=='sparse':limit=max(1,limit//2)
    if strategy.get('density')=='busy':limit+=2
    selected=events if preserve_events else [events[int(i)] for i in np.linspace(0,len(events)-1,min(limit,len(events))).round()]
    layers=[]
    def add(role,family,anchors,level):
        strength={'subtle':.75,'strong':1.12}.get(strategy.get('intensity'),1)
        layer=dict(role=role,gain=round(level*strength,3),mute=False,offset=0,
                   fadeIn=4 if strategy.get('attack')=='gradual' else 1,
                   fadeOut=12 if strategy.get('space')=='long' else 5,takes=[])
        for i,frame in enumerate(anchors):
            gap=(anchors[i+1]-frame)/30 if i+1<len(anchors) else interval
            duration=float(np.clip(gap*[.55,1.1,.78][index],.055,1.7))
            if family in ('whoosh','sweep','riser','swish','texture') and a.get('stops'):
                stops=a['stops']
                stop=stops[visual_indices[frame]] if len(stops)==len(visual_indices) and frame in visual_indices else next((s for s in stops if s>frame),None)
                if stop is not None:duration=max(duration,min(1.8,(stop-frame)/30))
            seed=int(identity([q['template'],role,style,variant,i%4])[:7],16)
            eligible=[r for r in rows if r['category'] in FAMILIES[family] and r['dur_s']
                      and (not typing or r['category'] in ('typing_key','pro_typing_key'))]
            def rank(r):
                jitter=int(identity([seed//4,r['id']])[:5],16)/0xfffff
                spectral=abs(math.log(max(60,r['centroid_hz'] or 1000)/[1300,900,3000][index]))
                preference=.4 if r['id']==director.get('preferredRecipe') else 0
                return -preference+abs(math.log(r['dur_s']/duration))+.2*spectral+.14*FAMILIES[family].index(r['category'])+.8*jitter
            take=None;closest=float('inf')
            for row in sorted(eligible,key=rank)[:6]:
                try:trial=synth(row,seed,duration,style)
                except (ValueError,RuntimeError,ArithmeticError):continue
                error=abs(math.log(trial['samples']/RATE/duration))
                if error<closest:take,closest=trial,error
                if error<=math.log(2):break
            if take is None:raise ValueError('Ninguna receta compatible para '+family)
            anchor=frame
            if role=='Movimiento' and family in ('whoosh','sweep','swish') and a.get('peaks'):
                peaks=a['peaks']
                anchor=peaks[visual_indices[frame]] if len(peaks)==len(visual_indices) and frame in visual_indices else min(peaks,key=lambda v:abs(v-frame))
            take.update(frame=int(anchor),visualEvent=int(frame),gain=round(.87+.13*(seed%11)/10,3),requestedDuration=round(duration,3))
            layer['takes'].append(take)
        layers.append(layer)
    add('Movimiento',voice,selected,[.47,.63,.55][index])
    if director.get('extraLayer')!='none' and index==1 and (a.get('stops') or voice in ('impact','riser','whoosh','sweep')):
        # A camera flight or a continuous sweep has no collision unless analysis
        # observed a stop. Use a quiet trailing gesture for those movements.
        stops=a.get('stops') or []
        continuous=voice in ('riser','whoosh','sweep') and not stops
        resonance=continuous or director.get('extraLayer')=='resonance'
        accent='swish' if continuous else 'click' if voice=='impact' else 'pop'
        add('Resonancia' if resonance else 'Asentamiento',accent,[min(frames-1,(stops or selected)[-1])],.21 if resonance else .31)
    if not typing and director.get('extraLayer')!='none' and index==2 and len(events)>1:
        secondary='pulse' if voice in ('digital','glitch','pulse') else 'swish' if voice in ('riser','texture') else 'click'
        add('Acento' if director.get('extraLayer')=='accent' else 'Resonancia',secondary,selected[::max(1,len(selected)//2)][:2],.24)
    return dict(syncVersion=2,style=style,variant=variant,layers=layers,frames=frames,method=director.get('model','Reglas locales'),strategy=strategy,preferredRecipe=director.get('preferredRecipe'),extraLayer=director.get('extraLayer'))

def canonical_params(params):
    # JSON round-trips through JavaScript turn integral floats into integers.
    return {k:(float(v) if k in ('dur','pitch','apex') else v) for k,v in params.items()}

def handle(q,rows):
    if q.get('revise'):
        revision=q['revise'];takes=revision['takes']
        if not 0<len(takes)<=3600:raise ValueError('Capa inválida')
        scale=float(revision['scale']);transpose=int(revision['transpose'])
        if not .5<=scale<=2 or not -6<=transpose<=6:raise ValueError('Ajuste fuera de rango')
        revised=[]
        for take in takes:
            entry=next(r for r in rows if r['id']==take['recipe'])
            params=canonical_params(take['params'])
            key=identity([VERSION,entry['id'],params])
            if take['url']!='/audio-lab/synthesis/'+key+'.wav' or not (ROOT/(key+'.json')).is_file():
                raise ValueError('La toma de origen debe estar en caché')
            if 'dur' in params:
                params['dur']=round(float(np.clip(params['dur']*scale,max(.035,entry['dur_s']*.4),max(.055,entry['dur_s']*1.75))),3)
                if 'apex' in params:params['apex']=round(min(params['dur']*.9,params['apex']*scale),3)
            if 'pitch' in params and entry['knobs'].get('pitch'):
                params['pitch']=round(float(np.clip(params['pitch']*2**(transpose/12),*entry['knobs']['pitch']['range_hz'])),2)
            revised.append({**take,**materialize(entry,params)})
        return {'takes':revised}
    if q.get('restore'):
        take=q['restore']
        entry=next(r for r in rows if r['id']==take['recipe'])
        params=canonical_params(take['params'])
        if set(params)-{'seed','sr','peak_db','dur','apex','pitch'} or params['sr']!=RATE or params['peak_db']!=-3:
            raise ValueError('Parámetros de caché incompatibles')
        if not all(isinstance(v,(int,float)) and math.isfinite(v) for v in params.values()):
            raise ValueError('Parámetro numérico inválido')
        if any(not .001<=params[k]<=10 for k in ('dur','apex') if k in params):
            raise ValueError('Duración inválida')
        key=identity([VERSION,entry['id'],params])
        if take['url']!='/audio-lab/synthesis/'+key+'.wav':raise ValueError('Identidad de toma incompatible')
        return {'restored':materialize(entry,params)['url']}
    return {'plan':generate(q,rows)}

if __name__=='__main__':
    if '--catalog' in sys.argv:
        CATALOG.write_text(json.dumps(catalog(),ensure_ascii=False,indent=1),encoding='utf8')
    else:
        ROOT.mkdir(parents=True,exist_ok=True)
        rows=json.loads(CATALOG.read_text(encoding='utf8'))
        for line in sys.stdin:
            try:result=handle(json.loads(line),rows)
            except Exception as e:result={'error':str(e)}
            print(json.dumps(result),flush=True)

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
FAMILIES={
    'typing':['typing_key','pro_typing_key','tap'], 'click':['click','toggle','hover_tick','pro_click'],
    'whoosh':['whoosh_fast','swipe','swish'], 'sweep':['swipe','swish','pro_zip'],
    'swish':['swish','swipe','hover_tick'], 'impact':['impact','cut_hit','knock','pro_impact'],
    'riser':['riser','reverse_swell','whoosh_big'], 'digital':['glitch','pro_glitch'],
    'glitch':['glitch','pro_glitch','shutter'], 'pop':['pop','ui_pop','pro_pop_in'],
    'pulse':['glitch','pluck','mallet'], 'texture':['reverse_swell','riser','downlifter']
}
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
        meta.write_text(json.dumps(dict(peak=peak,onset=int(audible[0]),end=int(audible[-1]),samples=len(y),channels=y.shape[1])),encoding='utf8')
    return dict(recipe=row['id'],params=params,url='/audio-lab/synthesis/'+wav.name,**json.loads(meta.read_text()))

def generate(q,rows):
    frames=int(q['frames'])
    if not 1<=frames<=3600:raise ValueError('Duración fuera de rango')
    a=q['analysis'];events=sorted(set(int(f) for f in a['events'] if 0<=int(f)<frames))
    style=q['style'];index=STYLES.index(style);variant=int(q['variant'])
    if not events:raise ValueError('Sin eventos visuales')
    director=q.get('director') or {}
    strategy=director.get('strategy',{})
    voices=[k for k in q['voices'] if k in FAMILIES]
    if strategy.get('voice') in voices:voices.remove(strategy['voice']);voices.insert(0,strategy['voice'])
    voice=voices[0]
    if director.get('events'):
        events=[events[i] for i in director['events'] if isinstance(i,int) and 0<=i<len(events)] or events
    interval=np.median(np.diff(events))/30 if len(events)>1 else min(.7,frames/30)
    limit=[4,8,10][index]
    selected=[events[int(i)] for i in np.linspace(0,len(events)-1,min(limit,len(events))).round()]
    layers=[]
    def add(role,family,anchors,level):
        layer=dict(role=role,gain=level,mute=False,offset=0,fadeIn=1,fadeOut=5,takes=[])
        for i,frame in enumerate(anchors):
            gap=(anchors[i+1]-frame)/30 if i+1<len(anchors) else interval
            duration=float(np.clip(gap*[.55,1.1,.78][index],.055,1.7))
            if family in ('whoosh','sweep','riser','swish','texture') and a.get('stops'):
                stop=next((s for s in a['stops'] if s>frame),None)
                if stop is not None:duration=max(duration,min(1.8,(stop-frame)/30))
            seed=int(identity([q['template'],role,style,variant,i%4])[:7],16)
            eligible=[r for r in rows if r['category'] in FAMILIES[family] and r['dur_s']]
            def rank(r):
                jitter=int(identity([seed//4,r['id']])[:5],16)/0xfffff
                spectral=abs(math.log(max(60,r['centroid_hz'] or 1000)/[1300,900,3000][index]))
                return abs(math.log(r['dur_s']/duration))+.2*spectral+.14*FAMILIES[family].index(r['category'])+.8*jitter
            for row in sorted(eligible,key=rank)[:6]:
                try:
                    take=synth(row,seed,duration,style);break
                except (ValueError,RuntimeError,ArithmeticError):continue
            else:raise ValueError('Ninguna receta compatible para '+family)
            take.update(frame=int(frame),gain=round(.87+.13*(seed%11)/10,3),requestedDuration=round(duration,3))
            layer['takes'].append(take)
        layers.append(layer)
    add('Movimiento',voice,selected,[.47,.63,.55][index])
    if index==1 and (a.get('stops') or voice in ('impact','riser','whoosh','sweep')):
        add('Asentamiento','pop' if voice in ('whoosh','sweep') else 'impact',[min(frames-1,(a.get('stops') or selected)[-1])],.31)
    if index==2 and len(events)>1:
        add('Resonancia','pulse' if voice in ('digital','glitch','pulse') else 'click',selected[::max(1,len(selected)//2)][:2],.24)
    return dict(style=style,variant=variant,layers=layers,frames=frames,method=director.get('model','Reglas locales'),strategy=strategy)

if __name__=='__main__':
    if '--catalog' in sys.argv:
        CATALOG.write_text(json.dumps(catalog(),ensure_ascii=False,indent=1),encoding='utf8')
    else:
        ROOT.mkdir(parents=True,exist_ok=True)
        rows=json.loads(CATALOG.read_text(encoding='utf8'))
        for line in sys.stdin:
            try:result={'plan':generate(json.loads(line),rows)}
            except Exception as e:result={'error':str(e)}
            print(json.dumps(result),flush=True)

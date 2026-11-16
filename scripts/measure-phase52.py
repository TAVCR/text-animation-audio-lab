"""Measure the editor's raw pilot exports. Gallery trim is playback-only."""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

root=Path('public/audio-lab/phase52')
rows=[]
for before in sorted(root.glob('*-antes.wav')):
    prefix=before.stem.removesuffix('-antes')
    template,style=prefix.rsplit('-',1)
    versions=[]
    for version in ['antes','despues']:
        path=root/(prefix+'-'+version+'.wav')
        plan=json.loads(path.with_suffix('.json').read_text(encoding='utf8'))
        assert bool(plan.get('composition'))==(version=='despues')
        signal,sr=sf.read(path,always_2d=True)
        assert sr==48000 and signal.shape==(plan['frames']*1600,2)
        log=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(path),'-af','loudnorm=print_format=json','-f','null','-'],capture_output=True,check=True).stderr.decode(errors='replace')
        measured=json.JSONDecoder().raw_decode(log[log.rindex('{'):])[0]
        power=np.mean(signal**2)
        mono=np.mean(signal.mean(axis=1)**2)
        bass=sosfilt(butter(4,100,fs=sr,output='sos'),signal,axis=0)
        version_data=dict(file=path.name,frames=plan['frames'],layers=[dict(role=l['role'],recipes=list(dict.fromkeys(t['recipe'] for t in l['takes'])),anchors=[t['frame'] for t in l['takes']]) for l in plan['layers']],composition=plan.get('composition'),method=plan['method'],
              lufs=float(measured['input_i']),truePeak=float(measured['input_tp']),monoLossDb=round(float(10*np.log10(mono/power)),2),sub100Percent=round(float(100*np.mean(bass**2)/power),2),endPeak=round(float(np.abs(signal[-1]).max()),6))
        assert power>0 and np.max(abs(signal))<1
        versions.append(version_data)
    assert versions[0]['layers'][0]['anchors']==versions[1]['layers'][0]['anchors']
    target=min(v['lufs'] for v in versions)
    target=min(target,*[v['lufs']-1-v['truePeak'] for v in versions])
    for v in versions:v['gain']=10**((target-v['lufs'])/20)
    rows.append(dict(template=template,style=style,versions=versions))
assert len(rows)==18
(root/'catalog.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
print('Raw true peak',max(v['truePeak'] for r in rows for v in r['versions']),'dBTP')
print('Mono loss',min(v['monoLossDb'] for r in rows for v in r['versions']),'dB')

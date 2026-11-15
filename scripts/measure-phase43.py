"""Compare browser WAV against a stereo reference reconstructed from the chosen region."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf

out=Path('examples/phase43')
media=Path('public/audio-lab/phase43')
audit=json.loads((out/'auditions.json').read_text(encoding='utf8'))
voices=json.loads(Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))['voices']
metrics=[]
for row in audit:
    p=row['design']
    candidate=row['candidate']
    source=Path('public')/candidate['url'].lstrip('/') if candidate else Path('public/audio-lab')/(voices[p['family']]['takes'][p['seed']%len(voices[p['family']]['takes'])]['asset']+'.wav')
    src,sr=sf.read(source,always_2d=True)
    mix,rate=sf.read(media/(row['template']+'-'+row['label']+'.wav'),always_2d=True)
    assert rate==sr==48000 and mix.shape[1]==min(2,src.shape[1])
    src=src[:,:2]
    peak=np.max(abs(src))
    hit=int(np.argmax(abs(src).max(axis=1)))
    lead=4800 if p['family'] in ('sweep','whoosh','riser','texture','swish') else 240
    end=min(len(src),hit+p['tail']*48)
    expected=np.zeros_like(mix)
    errors=[]
    for frame in p['events']:
        target=max(48,(frame+p['offset'])*1600)
        left=max(0,hit-lead,hit-target)
        indices=np.arange(left,min(end,len(mix)-target+hit))
        if len(indices)==0:continue
        attack=(indices-left)/min(48,hit-left) if left<hit else np.ones(len(indices))
        release=(end-indices)/min(240,end-hit)
        scale=np.minimum(1,np.minimum(attack,release))*p['gain']/peak
        expected[target+indices-hit]+=src[indices]*scale[:,None]
        window=max(0,frame*1600-800)
        local=abs(mix[window:frame*1600+801]).max(axis=1)
        errors.append(abs(window+int(local.argmax())-frame*1600)/48)
    expected/=max(1,np.max(abs(expected)))
    residual=float(np.max(abs(expected-mix)))
    rms=np.sqrt(np.mean(mix**2,axis=0))
    assert np.max(abs(mix))<1 and residual<.00015,(row['template'],row['label'],residual)
    metrics.append(dict(template=row['template'],label=row['label'],channels=mix.shape[1],seconds=len(mix)/rate,
                        peakDB=round(20*np.log10(np.max(abs(mix))),3),rmsDB=[round(20*np.log10(max(x,1e-12)),2) for x in rms],
                        maxLocalPeakErrorMs=round(max(errors),2),maxSampleResidual=residual))
for file in media.glob('*-anterior.wav'):
    signal,rate=sf.read(file,always_2d=True)
    template=file.name[:-len('-anterior.wav')]
    baseline=next(r for r in json.loads((out/'baseline.json').read_text()) if r['template']==template)
    metrics.append(dict(template=template,label='anterior',channels=signal.shape[1],seconds=len(signal)/rate,
                        peakDB=round(20*np.log10(np.max(abs(signal))),3),
                        rmsDB=list(np.round(20*np.log10(np.maximum(1e-12,np.sqrt(np.mean(signal**2,axis=0)))),2)),
                        maxLocalPeakErrorMs=baseline['LibraryMaxLocalPeakErrorMs']))
(out/'metrics.json').write_text(json.dumps(metrics,indent=2),encoding='utf8')

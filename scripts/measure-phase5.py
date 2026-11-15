"""Independent reconstruction and event-peak checks for the 18 editor exports."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf

media=Path('public/audio-lab/phase5')
results=[]
for wav in sorted(media.glob('*.wav')):
    template,style=wav.stem.rsplit('-',1)
    record=next(p for p in json.loads(Path('examples/phase5',template+'.json').read_text()) if p['style']==style)
    plan=record['design']
    mix,sr=sf.read(wav,always_2d=True)
    assert sr==48000 and mix.shape==(plan['frames']*1600,2)
    expected=np.zeros_like(mix)
    local=[]
    for layer in plan['layers']:
        for take in layer['takes']:
            source,rate=sf.read(Path('public')/take['url'].lstrip('/'),always_2d=True)
            hit=take['peak'];anchor=take['frame']*1600
            target=max(48,anchor+round(layer['offset']*48))
            start=target-hit;left=max(0,-start);right=min(len(source),len(mix)-start)
            span=np.arange(left,right)
            attack=min(layer['fadeIn']*48,hit-left)
            release=min(layer['fadeOut']*48,right-hit)
            env=np.minimum(1,(right-span-1)/max(1,release))
            if hit!=left:env=np.minimum(env,(span-left)/max(1,attack))
            expected[start+span]+=source[span]*env[:,None]*layer['gain']*take['gain']
            window=max(0,anchor-800)
            local.append(abs(window+int(np.abs(mix[window:anchor+801]).max(axis=1).argmax())-anchor)/48)
    expected/=max(1,np.max(abs(expected)))
    residual=float(np.max(abs(expected-mix)))
    assert residual<.00015 and np.max(abs(mix))<1,(wav,residual)
    results.append(dict(template=template,style=style,peakDB=round(20*np.log10(np.max(abs(mix))),2),maxLocalPeakErrorMs=round(max(local),3),maxResidual=residual))
assert len(results)==18
Path('examples/phase5/pilot-metrics.json').write_text(json.dumps(results,indent=2))

"""Measure the primary take in isolation through the editor mixer, without overlapping accents."""
from pathlib import Path
import json,wave
import numpy as np
from playwright.sync_api import sync_playwright,expect
root=Path('public/audio-lab/phase52')
with sync_playwright() as drv:
    p=drv.chromium.launch(channel='chrome').new_page()
    p.goto('http://127.0.0.1:3217/?sound=1')
    k='remotion-fx:last-props:v1'
    p.wait_for_function('k=>localStorage[k]',arg=k)
    report=[]
    for path in sorted(root.glob('*-despues.json')):
        template,style,_=path.stem.rsplit('-',2)
        plan=json.loads(path.read_text(encoding='utf8'))
        layer=plan['layers'][0]
        take=layer['takes'][len(layer['takes'])//2]
        plan['layers']=[{**layer,'takes':[take]}]
        visual=json.loads((root/'visual.json').read_text(encoding='utf8'))
        visual['animationStyle']=template
        p.evaluate('([k,v])=>{localStorage[k]=JSON.stringify(v)}',[k,visual])
        p.reload()
        p.route('**/api/procedural',lambda r:r.fulfill(json={'plan':plan}))
        p.get_by_role('button',name=style,exact=True).click()
        with p.expect_download() as item:p.get_by_text('Guardar WAV de esta vista previa').click()
        with wave.open(str(item.value.path())) as wav:
            d=np.frombuffer(wav.readframes(wav.getnframes()),np.uint8).reshape(-1,2,3).astype(np.int32)
        env=np.abs((d[:,:,0]+256*d[:,:,1]+65536*d[:,:,2]+8388608)%16777216-8388608).max(axis=1)
        target=take['frame']*1600
        local=max(0,target-800)
        report.append(dict(template=template,style=style,target=take['frame'],localPeakMs=round((local+int(env[local:target+801].argmax())-target)/48,2),globalPeakMs=round((int(env.argmax())-target)/48,2)))
        p.unroute('**/api/procedural')
    assert all(abs(r['globalPeakMs'])<=1000/60 for r in report),report
    (root/'sync.json').write_text(json.dumps(report,indent=2))
    print(sorted(report,key=lambda r:abs(r['globalPeakMs']),reverse=True)[:4])

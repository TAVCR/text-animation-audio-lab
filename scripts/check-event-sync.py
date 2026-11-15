"""Compare an isolated long attack with its visual cue using the editor's WAV."""
import copy
import io
import wave
from pathlib import Path

import numpy as np
from playwright.sync_api import sync_playwright, expect

key = 'remotion-fx:last-props:v1'
with sync_playwright() as driver:
    page = driver.chromium.launch(channel='chrome').new_page()
    page.goto('http://127.0.0.1:3217/?sound=1')
    page.wait_for_function('(k)=>localStorage.getItem(k)', arg=key)

    def configure(patch):
        page.evaluate('([k,p])=>{localStorage[k]=JSON.stringify({...JSON.parse(localStorage[k]),...p})}', [key, patch])
        page.reload()

    for template in ['glitch', 'cinematic', 'slide-in', 'bubble-pop']:
        configure(dict(animationStyle=template, motionPhase='in', text='Motion sound test', speed=1, soundDesign=None))
        plans = []
        def collect(response):
            if response.url.endswith('/api/procedural') and response.ok:
                plans.append(response.json()['plan'])
        page.on('response', collect)
        page.get_by_text('Auto Sound Design', exact=True).click()
        expect(page.get_by_role('button', name='Experimental', exact=True)).to_be_enabled(timeout=240000)
        page.remove_listener('response', collect)
        _, plan, layer, take = max(
            ((min(t['visualEvent']*1600, (t['visualEvent']-t['frame'])*1600+t['peak']-t['onset']), p,l,t)
             for p in plans for l in p['layers'] for t in l['takes']),key=lambda row:row[0])
        assert plan['syncVersion']==2
        page.get_by_role('button', name=plan['style'], exact=True).click()
        expect(page.get_by_text('Guardar diseño en proyecto')).to_be_enabled()
        page.get_by_text('Guardar diseño en proyecto').click()
        saved=page.evaluate('k=>JSON.parse(localStorage[k]).soundDesign',key)
        single=copy.deepcopy(plan)
        single['layers']=[{**layer,'takes':[take]}]
        results=[]
        for version in [1,2]:
            single['syncVersion']=version
            saved['procedural']['design']=single
            if version==1:
                configure(dict(soundDesign=saved))
                old_url=page.get_by_text('Guardar WAV de esta vista previa').get_attribute('href')
            else:
                page.get_by_text('Ajustar sincronización de esta mezcla').click()
                page.wait_for_function('url => window.audioLabTake?.url && window.audioLabTake.url!==url',arg=old_url)
            with page.expect_download() as download:
                page.get_by_text('Guardar WAV de esta vista previa').click()
            with wave.open(io.BytesIO(Path(download.value.path()).read_bytes())) as inp:
                raw=np.frombuffer(inp.readframes(inp.getnframes()),dtype=np.uint8).reshape(-1,2,3).astype(np.int32)
            pcm=(raw[:,:,0]+256*raw[:,:,1]+65536*raw[:,:,2]+8388608)%16777216-8388608
            env=np.abs(pcm).max(axis=1)
            onset=np.flatnonzero(env>=env.max()*.01)[0]
            cue=take['visualEvent']*1600
            results.append(round((cue-int(onset))/48,2))
            if version==2:
                assert onset>=cue-192
                assert abs(int(env.argmax())-max(48,take['frame']*1600))<=2
        if template=='glitch':
            page.get_by_role('button',name='Pausar',exact=True).click()
            slider=page.get_by_label('Línea de tiempo')
            for frame,visible in [(take['visualEvent']-1,0),(take['visualEvent'],1)]:
                slider.fill(str(frame))
                expect(page.locator('span[style*="mix-blend-mode: screen"]').first).to_have_count(visible)
        print(template,'cue',take['visualEvent'],'peak',take['frame'],'lead ms before/after',results,flush=True)

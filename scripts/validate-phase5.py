"""Exercise the procedural editor and save pilot WAVs. Run again with --all for remaining templates."""
from pathlib import Path
import hashlib
import json
import sys
import wave
import numpy as np
from playwright.sync_api import sync_playwright

pilot=['typewriter','slide-in','glitch','bubble-pop','ink-stamp-print','cinematic']
motions=json.loads(Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))['motions']
others=[t for m in motions.values() for t in m['templates'] if t not in pilot]
templates=sys.argv[2:] if len(sys.argv)>2 else others if '--all' in sys.argv else pilot
out=Path('public/audio-lab/phase5')
out.mkdir(exist_ok=True)
report=Path('examples/phase5');report.mkdir(exist_ok=True)
failed=[]
with sync_playwright() as driver:
    browser=driver.chromium.launch(channel='chrome',args=['--autoplay-policy=no-user-gesture-required'])
    for t in templates:
        page=browser.new_page()
        requests=[]
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.on('request',lambda r:requests.append(r.url))
        try:
            page.goto('http://127.0.0.1:3217/?sound=1')
            key='remotion-fx:last-props:v1'
            page.wait_for_function('(k)=>localStorage.getItem(k)',arg=key)
            page.evaluate("([k,t])=>{let p=JSON.parse(localStorage.getItem(k));Object.assign(p,{animationStyle:t,text:'Motion sound test',speed:1,showTextLayer:true});delete p.soundDesign;localStorage.setItem(k,JSON.stringify(p))}",[key,t]);page.reload()
            def generate():
                auto=page.get_by_role('button',name='Auto Sound Design')
                with page.expect_response(lambda r:'/api/procedural' in r.url,timeout=220000) as initial:
                    auto.click()
                assert initial.value.ok,initial.value.text()
                page.wait_for_function("()=>{let b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Auto Sound Design');return b && !b.disabled}",timeout=600000)
                assert page.get_by_role('button',name='Experimental',exact=True).is_enabled(),page.locator('details').inner_text()
            def preview():
                page.get_by_role('button',name='Probar animación con sonido').click()
                page.wait_for_function("()=>!!window.audioLabTake?.url")
                with page.expect_download() as item:page.get_by_text('Guardar WAV de esta vista previa').click()
                return Path(item.value.path()).read_bytes()
            generate()
            plans=[]
            for style in ['Minimal','Cinematic','Experimental']:
                page.get_by_role('button',name=style,exact=True).click()
                data=preview()
                page.get_by_text('Guardar diseño en proyecto').click()
                page.wait_for_function('([k,s])=>JSON.parse(localStorage.getItem(k)).soundDesign?.procedural?.design.style===s',arg=[key,style])
                design=page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).soundDesign.procedural.design',key)
                import io
                with wave.open(io.BytesIO(data)) as w:
                    assert w.getnchannels()==2 and w.getframerate()==48000 and w.getsampwidth()==3
                    pcm=np.frombuffer(w.readframes(w.getnframes()),'uint8').reshape(-1,3).astype('int32')
                    signal=(pcm[:,0]+pcm[:,1]*256+pcm[:,2]*65536+8388608)%16777216-8388608
                    peak=int(np.abs(signal).max());assert 0<peak<8388607
                if t in pilot:(out/(t+'-'+style+'.wav')).write_bytes(data)
                plans.append(dict(style=style,hash=hashlib.sha256(data).hexdigest(),peak=peak,design=design))
            assert len({p['hash'] for p in plans})==3
            page.reload();assert preview()==data
            assert not any('/api/library-auto' in u for u in requests)
            assert not errors,errors
            (report/(t+'.json')).write_text(json.dumps(plans,indent=2),encoding='utf8')
            print(t,'OK',flush=True)
        except Exception as e:
            failed.append(t)
            print(t,'FAILED',str(e)[:800],flush=True)
        finally:page.close()
sys.exit(1 if failed else 0)

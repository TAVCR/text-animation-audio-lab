"""Exercise both source paths, save, reopen, retime and export in Chromium."""
import json
import re
import sys
import wave
from pathlib import Path
import numpy as np
from playwright.sync_api import sync_playwright

catalog = json.loads(Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))
templates = [t for motion in catalog['motions'].values() for t in motion['templates']]
group = int(sys.argv[1])
out = Path('.audio-lab/universal')
out.mkdir(exist_ok=True)
report = []
with sync_playwright() as driver:
    browser = driver.chromium.launch(channel='chrome', args=['--autoplay-policy=no-user-gesture-required'])
    for template in templates[group*4:group*4+4]:
        context = browser.new_context()
        page = context.new_page()
        row = {'template':template}
        errors = []
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        try:
            page.goto('http://127.0.0.1:3217')
            key = 'remotion-fx:last-props:v1'
            page.wait_for_function('(k)=>localStorage.getItem(k)',arg=key)
            def configure(text,speed):
                page.evaluate("([k,t,text,speed])=>{const p=JSON.parse(localStorage.getItem(k));Object.assign(p,{animationStyle:t,text,speed,showTextLayer:true});localStorage.setItem(k,JSON.stringify(p))}",[key,template,text,speed])
                page.reload()
                page.locator('summary').filter(has_text='Sound Design').click()
            configure('Motion sound test',1)
            with page.expect_response(lambda r:'/api/library-auto' in r.url,timeout=75000) as response:
                page.get_by_role('button',name='Auto Sound Design',exact=True).click()
            candidate=response.value.json()
            row['library']=candidate.get('name') or candidate.get('error')
            for mode in (['Library'] if candidate.get('url') else [])+['Procedural']:
                page.get_by_role('button',name=mode,exact=True).click()
                page.get_by_text('Probar animación con sonido').click()
                with page.expect_download() as download:
                    page.get_by_text('Guardar WAV de esta vista previa').click()
                target=out/(template+'-'+mode+'.wav')
                download.value.save_as(target)
                with wave.open(str(target)) as wav:
                    assert wav.getsampwidth()==3 and wav.getframerate()==48000
                    pcm=np.frombuffer(wav.readframes(wav.getnframes()),dtype=np.uint8).reshape(-1,3).astype(np.int32)
                    signal=(pcm[:,0]+256*pcm[:,1]+65536*pcm[:,2]+8388608)%16777216-8388608
                    peak=int(np.max(np.abs(signal)))
                    assert 0<peak<8388607
                    row[mode+'Peak']=round(peak/8388608,4)
                if mode=='Library':
                    page.get_by_text('Guardar diseño en proyecto').click()
                    page.wait_for_function('(k)=>JSON.parse(localStorage.getItem(k)).soundDesign?.sourceUrl',arg=key)
                    page.close()
                    page=context.new_page()
                    page.goto('http://127.0.0.1:3217')
                    page.locator('summary').filter(has_text='Sound Design').click()
                    page.get_by_text('Probar animación con sonido').click()
                    assert page.get_by_text('Guardar WAV de esta vista previa').is_visible()
                    row['restored']=True
            configure('Nuevo texto y otra velocidad',1.6)
            row['modified']=page.get_by_text(re.compile(r'palabras · \d+ eventos visuales')).inner_text()
            assert not re.search(r'· 0 eventos',row['modified'])
            row['pageErrors']=errors
        except Exception as exc:
            row['error']=str(exc)[:500]
        finally:
            print(template,row.get('error','OK'),flush=True)
            report.append(row)
            context.close()
Path('examples/universal-group-'+str(group+1)+'.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf8')
sys.exit(any(r.get('error') or r.get('pageErrors') for r in report))


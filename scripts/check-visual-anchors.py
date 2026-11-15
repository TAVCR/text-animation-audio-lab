"""Compare real preview pixels around sampled audio anchors with particles disabled."""
from io import BytesIO
import json
from pathlib import Path
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

records=[]
with sync_playwright() as driver:
    browser=driver.chromium.launch(channel='chrome')
    for report in sorted(Path('examples').glob('universal-group-*.json')):
        for row in json.loads(report.read_text(encoding='utf8')):
            page=browser.new_page(viewport={'width':1300,'height':740})
            page.goto('http://127.0.0.1:3217')
            key='remotion-fx:last-props:v1'
            page.wait_for_function('(k)=>localStorage.getItem(k)',arg=key)
            page.evaluate("([k,t])=>{let p=JSON.parse(localStorage.getItem(k));Object.assign(p,{animationStyle:t,text:'Motion sound test',speed:1,showTextLayer:true,enableParticles:false});if(t==='variable-weight-wave')p.fontFamily='Inter';localStorage.setItem(k,JSON.stringify(p))}",[key,row['template']])
            page.reload()
            player=page.locator('.remotion-player-clean')
            page.get_by_role('button',name='Pausar').click()
            slider=page.get_by_role('slider',name='Línea de tiempo')
            end=int(slider.get_attribute('max'))
            def pixels(frame):
                slider.evaluate("""(e,f)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,String(f));e.dispatchEvent(new Event('input',{bubbles:true}));}""",frame)
                page.get_by_text(f'F: {frame} / {end}',exact=True).wait_for(timeout=5000)
                data=player.screenshot()
                return np.asarray(Image.open(BytesIO(data)).convert('RGB'),dtype=np.int16)
            events=row['events']
            samples=[]
            for anchor in sorted({events[0],events[len(events)//2],events[-1]}):
                a=pixels(max(0,anchor-2))
                at=pixels(anchor)
                b=pixels(min(end,anchor+2))
                samples.append({'frame':anchor,'changedPixels':int((np.maximum(np.abs(a-at),np.abs(at-b)).max(axis=2)>2).sum())})
            records.append({'template':row['template'],'font':'Inter' if row['template']=='variable-weight-wave' else 'project default','samples':samples})
            print(row['template'],samples,flush=True)
            page.close()
Path('examples/universal-visual-anchors.json').write_text(json.dumps(records,indent=2),encoding='utf8')


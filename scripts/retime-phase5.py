"""Generate previews for independent timing/text edits on the six pilot animations."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
templates=['typewriter','slide-in','glitch','bubble-pop','ink-stamp-print','cinematic']
out=Path('examples/phase5')
rows=[]
with sync_playwright() as driver:
    browser=driver.chromium.launch(channel='chrome')
    for template in templates:
        page=browser.new_page()
        page.goto('http://127.0.0.1:3217/?sound=1')
        key='remotion-fx:last-props:v1'
        page.wait_for_function('(k)=>localStorage.getItem(k)',arg=key)
        old=json.loads((out/(template+'.json')).read_text())[0]['design']
        for label,text,speed in [('texto','Otra frase de prueba',1),('velocidad','Motion sound test',1.6)]:
            page.evaluate("""([k,t,text,speed,design])=>{let p=JSON.parse(localStorage.getItem(k));Object.assign(p,{animationStyle:t,text,speed,showTextLayer:true,soundDesign:{version:1,template:t,mode:'Procedural',procedural:{signature:'previous',design}}});localStorage.setItem(k,JSON.stringify(p))}""",[key,template,text,speed,old])
            page.reload()
            expect(page.get_by_text('Probar animación con sonido')).to_be_disabled()
            with page.expect_response(lambda r:'/api/procedural' in r.url,timeout=240000) as item:
                page.get_by_text('Regenerar Minimal').click()
            plan=item.value.json()['plan']
            page.get_by_text('Probar animación con sonido').click()
            expect(page.get_by_text('Guardar WAV de esta vista previa')).to_be_visible()
            rows.append(dict(template=template,edit=label,frames=plan['frames'],anchors=[t['frame'] for t in plan['layers'][0]['takes']]))
        page.close()
        print(template,flush=True)
(out/'ediciones.json').write_text(json.dumps(rows,indent=2))

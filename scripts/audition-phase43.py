"""Export both ranked alternatives and the procedural voice at unchanged editor settings."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

out=Path('examples/phase43')
media=Path('public/audio-lab/phase43')
templates=[p.name.removesuffix('-anterior.wav') for p in sorted(media.glob('*-anterior.wav'))]
assert len(templates)==8
audit=[]
with sync_playwright() as driver:
    browser=driver.chromium.launch(channel='chrome')
    for template in templates:
        page=browser.new_page()
        page.goto('http://127.0.0.1:3217')
        page.wait_for_function("()=>localStorage.getItem('remotion-fx:last-props:v1')")
        page.evaluate("""t=>{let k='remotion-fx:last-props:v1',p=JSON.parse(localStorage.getItem(k));Object.assign(p,{animationStyle:t,text:'Motion sound test',speed:1,showTextLayer:true});delete p.soundDesign;localStorage.setItem(k,JSON.stringify(p))}""",template)
        page.reload()
        page.locator('summary').filter(has_text='Sound Design').click()
        with page.expect_response(lambda r:'/api/library-auto' in r.url) as response:
            page.get_by_role('button',name='Auto Sound Design',exact=True).click()
        candidates=response.value.json()['candidates']
        last=None
        for label in ['A','B','Procedural']:
            if label in ['A','B']:
                candidate=candidates[ord(label)-65]
                button=page.get_by_role('button',name='Library '+label+' · '+candidate['name'],exact=True)
                button.click()
                page.wait_for_function("(id)=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent.startsWith(id) && b.getAttribute('aria-pressed')==='true')",arg='Library '+label+' ·')
            else:
                candidate=None
                page.get_by_role('button',name='Procedural',exact=True).click()
            page.get_by_text('Probar animación con sonido').click()
            with page.expect_download() as download:page.get_by_text('Guardar WAV de esta vista previa').click()
            download.value.save_as(media/(template+'-'+label+'.wav'))
            page.get_by_text('Guardar diseño en proyecto').click()
            page.wait_for_function("([m,id])=>{let p=JSON.parse(localStorage.getItem('remotion-fx:last-props:v1'));return p.soundDesign?.mode===m && (!id || p.soundDesign?.sourceUrl.includes(id))}",arg=['Library' if candidate else 'Procedural',candidate['id'] if candidate else ''])
            design=page.evaluate("()=>JSON.parse(localStorage.getItem('remotion-fx:last-props:v1')).soundDesign")
            settings=[design[k] for k in ['gain','offset','tail','trim','density']]
            assert last is None or last==settings
            last=settings
            audit.append(dict(template=template,label=label,candidate=candidate,design=design))
            if label=='B':
                with page.expect_response(lambda r:'/api/library-auto' in r.url):
                    page.get_by_role('button',name='Auto Sound Design',exact=True).click()
                page.get_by_text('Alternativas listas para comparar.',exact=False).first.wait_for()
                assert button.get_attribute('aria-pressed')=='true'
        page.close()
        print(template,flush=True)
(out/'auditions.json').write_text(json.dumps(audit,indent=2,ensure_ascii=False),encoding='utf8')

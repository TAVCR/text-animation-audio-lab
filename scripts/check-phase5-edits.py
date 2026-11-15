"""Check plan invalidation, layer resynthesis, preview transport and legacy project recall."""
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

key='remotion-fx:last-props:v1'
url='http://127.0.0.1:3217/?sound=1'
with sync_playwright() as driver:
    browser=driver.chromium.launch(channel='chrome',args=['--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page()
    page.goto(url)
    page.wait_for_function('(k)=>localStorage.getItem(k)',arg=key)
    def configure(values):
        page.evaluate('([k,v])=>{let p=JSON.parse(localStorage.getItem(k));Object.assign(p,v);localStorage.setItem(k,JSON.stringify(p))}',[key,values])
        page.reload()
    def generate():
        page.get_by_role('button',name='Auto Sound Design').click()
        expect(page.get_by_role('button',name='Experimental',exact=True)).to_be_enabled(timeout=300000)
        expect(page.get_by_role('button',name='Auto Sound Design')).to_be_enabled(timeout=300000)
    def save(style):
        page.get_by_role('button',name=style,exact=True).click()
        page.get_by_text('Guardar diseño en proyecto').click()
        page.wait_for_function('([k,s])=>JSON.parse(localStorage.getItem(k)).soundDesign?.procedural?.design.style===s',arg=[key,style])
        return page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).soundDesign.procedural',key)
    def play():
        page.get_by_text('Probar animación con sonido').click()
        page.wait_for_function("()=>Array.from(document.querySelectorAll('audio')).some(a=>!a.paused && a.currentTime>0 && !a.muted)")
        with page.expect_download() as item:page.get_by_text('Guardar WAV de esta vista previa').click()
        page.get_by_role('button',name='Pausar',exact=True).click()
        page.wait_for_function("()=>Array.from(document.querySelectorAll('audio')).every(a=>a.paused)")
        return Path(item.value.path()).read_bytes()
    calls=[]
    page.on('request',lambda r:calls.append(r.url) if '/api/procedural' in r.url else None)
    configure(dict(animationStyle='typewriter',text='Motion sound test',speed=1,showTextLayer=True,soundDesign=None))
    generate()
    original=save('Minimal');initial=play()
    amount=len(calls)
    slider=page.get_by_role('slider',name='Movimiento Ganancia')
    slider.focus();slider.press('ArrowLeft')
    assert play()!=initial and len(calls)==amount
    sibling=save('Cinematic')
    page.get_by_role('button',name='Minimal',exact=True).click()
    page.get_by_text('Regenerar Minimal').click()
    expect(page.get_by_text('Regenerar Minimal')).to_be_enabled(timeout=180000)
    assert save('Cinematic')==sibling
    varied=save('Minimal')
    assert varied['design']['variant']==1
    field=page.locator('input[name=scale]').first
    field.fill('1.3')
    with page.expect_response(lambda r:'/api/procedural' in r.url) as result:
        page.get_by_text('Aplicar a la capa').first.click()
    revised=result.value.json();assert revised.get('takes'),revised
    assert [t['url'] for t in revised['takes']]!=[t['url'] for t in varied['design']['layers'][0]['takes']]
    for values in [dict(text='Una animación con muchas palabras'),dict(speed=1.8)]:
        configure(values)
        expect(page.get_by_text('Probar animación con sonido')).to_be_disabled()
        generate()
        updated=save('Minimal')
        assert updated['signature']!=varied['signature']
        varied=updated
    old=next(r for r in json.loads(Path('examples/phase43/auditions.json').read_text(encoding='utf8')) if r['label']=='B')
    configure(dict(animationStyle=old['template'],text='Motion sound test',speed=1,soundDesign=old['design']))
    restored=play()
    assert restored==Path('public/audio-lab/phase43',old['template']+'-B.wav').read_bytes()
    assert page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)).soundDesign',key)==old['design']
    print('Gain-only mix, variant isolation, layer synthesis, text and speed, play/pause, legacy PCM and references: OK')

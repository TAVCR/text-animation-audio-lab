"""Compare the five Bubble Pop cues against the rendered opacity in Chrome."""
import wave
from pathlib import Path
import numpy as np
from playwright.sync_api import sync_playwright, expect

key='remotion-fx:last-props:v1'
words='Animación de texto con sonido'.split()
with sync_playwright() as driver:
    page=driver.chromium.launch(channel='chrome').new_page()
    page.goto('http://127.0.0.1:3217/?sound=1')
    page.wait_for_function('(k)=>localStorage.getItem(k)',arg=key)
    page.evaluate("""([k,text])=>{const p=JSON.parse(localStorage[k]);Object.assign(p,{animationStyle:'bubble-pop',text,speed:1,motionPhase:'in',showTextLayer:true});delete p.soundDesign;localStorage[k]=JSON.stringify(p)}""",[key,' '.join(words)])
    page.reload()
    responses=[]
    page.on('response',lambda r:responses.append(r) if r.url.endswith('/api/procedural') and r.ok else None)
    page.get_by_text('Auto Sound Design',exact=True).click()
    expect(page.get_by_role('button',name='Experimental',exact=True)).to_be_enabled(timeout=180000)
    plans=[r.json()['plan'] for r in responses]
    anchors=[t['frame'] for t in plans[0]['layers'][0]['takes']]
    assert len(anchors)==len(words) and len(plans)==3
    assert all([t['frame'] for t in p['layers'][0]['takes']]==anchors for p in plans)
    page.get_by_role('button',name='Pausar',exact=True).click()
    for word,frame in zip(words,anchors):
        el=page.locator('span[style*="will-change: transform, opacity"]').filter(has_text=word)
        for f,visible in [(frame-1,False),(frame,True)]:
            page.get_by_label('Línea de tiempo').fill(str(f))
            page.wait_for_function('([el,visible])=>(Number(getComputedStyle(el).opacity)>=.5)===visible',arg=[el.element_handle(),visible])
    rate=page.get_by_label('Movimiento Velocidad del efecto')
    rate.fill('1.5')
    page.get_by_text('Guardar diseño en proyecto').click()
    page.reload()
    expect(rate).to_have_value('1.5')
    expect(page.get_by_text('Guardar WAV de esta vista previa')).to_be_visible()
    with page.expect_download() as item:
        page.get_by_text('Guardar WAV de esta vista previa').click()
    with wave.open(str(Path(item.value.path()))) as wav:
        pcm=np.frombuffer(wav.readframes(wav.getnframes()),np.uint8).reshape(-1,2,3).astype(np.int32)
    raw=pcm[:,:,0]+256*pcm[:,:,1]+65536*pcm[:,:,2]
    envelope=np.abs((raw+8388608)%16777216-8388608).max(axis=1)
    for frame in anchors:
        anchor=frame*1600
        assert envelope[anchor]>50000
        assert abs(envelope[anchor-400:anchor+401].argmax()-400)<=4
    print('3 estilos; cinco palabras:',anchors,'velocidad guardada: 1.5')

    for template in ['slide-in','smooth-sliding','paper-cutout-assemble','word-highlight-tracker','viral-text','kinetic-box-sequence']:
        page.evaluate('([k,t])=>{let p=JSON.parse(localStorage[k]);p.animationStyle=t;delete p.soundDesign;localStorage[k]=JSON.stringify(p)}',[key,template])
        page.reload()
        responses.clear()
        with page.expect_request(lambda r:r.url.endswith('/api/procedural')) as sent:
            page.get_by_text('Auto Sound Design',exact=True).click()
        expect(page.get_by_role('button',name='Experimental',exact=True)).to_be_enabled(timeout=180000)
        plans=[r.json()['plan'] for r in responses]
        expected=sorted(set(sent.value.post_data_json['analysis']['events']))
        assert len(plans)==3 and all([t['visualEvent'] for t in p['layers'][0]['takes']]==expected for p in plans)
        print(template,len(expected),'eventos conservados',flush=True)
    page.close()

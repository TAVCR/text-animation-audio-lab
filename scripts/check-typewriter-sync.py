"""Verify the rendered Typewriter prefix and the exported keypresses at 30 fps."""
import wave
from pathlib import Path
import numpy as np
from playwright.sync_api import sync_playwright, expect

phrase='Animación de texto con sonido'
key='remotion-fx:last-props:v1'
with sync_playwright() as driver:
    page=driver.chromium.launch(channel='chrome').new_page()
    page.goto('http://127.0.0.1:3217/?sound=1')
    page.wait_for_function('(k)=>localStorage.getItem(k)',arg=key)
    page.evaluate("""([k,text])=>{const p=JSON.parse(localStorage[k]);Object.assign(p,{animationStyle:'typewriter',text,speed:1,typewriterCharactersPerSecond:15,motionPhase:'in',typewriterCursorStyle:'bar',showTextLayer:true});delete p.soundDesign;localStorage[k]=JSON.stringify(p)}""",[key,phrase])
    page.reload()
    responses=[]
    page.on('response',lambda r:responses.append(r) if r.url.endswith('/api/procedural') and r.ok else None)
    page.get_by_text('Auto Sound Design',exact=True).click()
    expect(page.get_by_role('button',name='Experimental',exact=True)).to_be_enabled(timeout=180000)
    page.get_by_role('button',name='Pausar',exact=True).click()
    cursor=page.locator('.remotion-player-clean span').filter(has_text='|').last
    observed=[]
    for frame in range(2*len(phrase)):
        page.get_by_label('Línea de tiempo').fill(str(frame))
        prefix=phrase[:(frame+1)//2]
        page.wait_for_function('([el,prefix])=>el.parentElement.textContent===prefix+"|"',arg=[cursor.element_handle(),prefix])
        if frame%2 and prefix[-1].strip():observed.append(frame)
    for response in responses:
        plan=response.json()['plan']
        assert [t['frame'] for t in plan['layers'][0]['takes']]==observed
        page.get_by_role('button',name=plan['style'],exact=True).click()
        with page.expect_download() as item:
            page.get_by_text('Guardar WAV de esta vista previa').click()
        with wave.open(str(Path(item.value.path()))) as wav:
            data=np.frombuffer(wav.readframes(wav.getnframes()),np.uint8).reshape(-1,2,3).astype(np.int32)
        unsigned=data[:,:,0]+256*data[:,:,1]+65536*data[:,:,2]
        peak=np.abs((unsigned+8388608)%16777216-8388608).max(axis=1)
        assert all(peak[f*1600]>50000 for f in observed)
        print(plan['style'],len(observed),'pulsaciones',flush=True)
    assert len(responses)==3

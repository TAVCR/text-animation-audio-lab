from pathlib import Path
import json,hashlib
from playwright.sync_api import sync_playwright,expect

with sync_playwright() as drv:
    p=drv.chromium.launch(channel='chrome').new_page()
    p.goto('http://127.0.0.1:3217/?sound=1')
    k='remotion-fx:last-props:v1'
    p.wait_for_function('k=>localStorage[k]',arg=k)
    p.evaluate("""k=>{let v=JSON.parse(localStorage[k]);Object.assign(v,{animationStyle:'slide-in',text:'Animación de texto con sonido',speed:1,motionPhase:'in'});delete v.soundDesign;localStorage[k]=JSON.stringify(v)}""",k);p.reload()
    seen=[]
    p.on('request',lambda r:seen.append(r.url) if r.url.endswith('/api/procedural') else None)
    for port,style in [('3218','Minimal'),('8080','Experimental')]:
        p.get_by_label('Director',exact=True).select_option(port)
        with p.expect_response(lambda r:r.url.endswith('/api/procedural'),timeout=180000) as response:p.get_by_role('button',name=style,exact=True).click()
        plan=response.value.json()['plan']
        assert plan['method'] not in ['Reglas locales','Reglas de respaldo']
        print(port,plan['method'],plan['composition'],flush=True)
    def digest():
        with p.expect_download() as item:p.get_by_text('Guardar WAV de esta vista previa').click()
        return hashlib.sha256(Path(item.value.path()).read_bytes()).hexdigest()
    hashes=[digest()]
    for label in ['Intensidad','Complejidad','Profundidad','Respuesta al movimiento']:
        old=p.evaluate('()=>window.audioLabTake.url')
        p.get_by_label(label,exact=True).fill('0.09')
        p.wait_for_function('old=>window.audioLabTake?.url && window.audioLabTake.url!==old',arg=old)
        hashes.append(digest())
    assert len(set(hashes))==5 and len(seen)==2
    p.get_by_text('Guardar diseño en proyecto').click()
    p.wait_for_function('k=>JSON.parse(localStorage[k]).soundDesign?.procedural?.design.composition.response===.09',arg=k)
    p.reload()
    assert digest()==hashes[-1] and len(seen)==2
    print('4 controles distintos; recarga exacta sin resíntesis',flush=True)

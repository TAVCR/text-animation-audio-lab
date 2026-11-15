"""Verify live Chrome player output using previously generated phase-five designs."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

key = 'remotion-fx:last-props:v1'
with sync_playwright() as driver:
    browser = driver.chromium.launch(channel='chrome')
    page = browser.new_page()
    page.goto('http://127.0.0.1:3217/?sound=1')
    page.wait_for_function('(key)=>localStorage.getItem(key)',arg=key)
    for path in sorted(Path('examples/phase5').glob('*.json')):
        rows = json.loads(path.read_text(encoding='utf8'))
        if not isinstance(rows,list) or not rows or 'design' not in rows[0]:
            continue
        page.evaluate("""([key,t])=>{
            const p=JSON.parse(localStorage[key]);
            Object.assign(p,{animationStyle:t,text:'Motion sound test',speed:1});
            delete p.soundDesign;
            localStorage[key]=JSON.stringify(p)
        }""",[key,path.stem])
        page.reload()
        page.route('**/api/procedural',lambda route:route.fulfill(json={'plan': next(r['design'] for r in rows if r['style']==route.request.post_data_json['style'])}))
        page.get_by_role('button',name='Auto Sound Design').click()
        expect(page.get_by_text('Probar animación con sonido')).to_be_enabled(timeout=30000)
        page.get_by_role('button',name='Pausar',exact=True).click()
        page.get_by_role('button',name='Volver al inicio').click()
        page.get_by_role('button',name='Reproducir',exact=True).click()
        page.wait_for_function("""()=>Array.from(document.querySelectorAll('audio')).some(a=>a.currentSrc.startsWith('blob:')&&!a.paused&&!a.muted&&a.volume>0&&a.currentTime>0)""")
        level=page.evaluate("""async()=>{
            const a=Array.from(document.querySelectorAll('audio')).find(a=>a.currentSrc.startsWith('blob:')&&!a.paused);
            const ctx=new AudioContext(); await ctx.resume();
            const meter=ctx.createAnalyser(); meter.fftSize=4096;
            ctx.createMediaElementSource(a).connect(meter);meter.connect(ctx.destination);
            const data=new Float32Array(meter.fftSize);
            const deadline=performance.now()+Math.max(4000,2000*a.duration);
            let peak=0;
            while(peak<0.001 && performance.now()<deadline){
                await new Promise(r=>setTimeout(r,20));meter.getFloatTimeDomainData(data);
                peak=Math.max(peak,...data.map(Math.abs));
            }
            await ctx.close();return peak
        }""")
        assert level>.001,(path.stem,level)
        print(path.stem,round(level,4),flush=True)
        page.unroute('**/api/procedural')

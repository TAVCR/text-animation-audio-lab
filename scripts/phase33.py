from playwright.sync_api import sync_playwright
import json,time,wave,math,statistics
from pathlib import Path
import urllib.request
cases=json.loads(Path('examples/phase32-results.json').read_text(encoding='utf-8-sig'))
out=[]
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome')
 for i in [1,3,4,5]:
  c=cases[i]['input'];t=c['template'];txt=c['text'];speed=2 if i==5 else 1
  s=b.new_page();s.goto('http://127.0.0.1:3217');s.wait_for_timeout(600)
  s.evaluate("""([a,t,v])=>{let k='remotion-fx:last-props:v1',o=JSON.parse(localStorage.getItem(k)||'{}');Object.assign(o,{animationStyle:a,text:t,speed:v});localStorage.setItem(k,JSON.stringify(o))}""",[t,txt,speed]);s.reload()
  s.locator('summary').filter(has_text='Sound Design').click()
  for port in [3218,8080]:
   s.get_by_label('Proveedor local').select_option(str(port));runs=[]
   for _ in range(2):
    start=time.monotonic()
    with s.expect_response(lambda r:'/api/sound-director' in r.url) as r:s.get_by_text('Consultar IA local').click()
    plan=r.value.json();inp=r.value.request.post_data_json;runs.append(dict(plan=plan,seconds=time.monotonic()-start))
   assert plan.get('strategy') and not plan['correction'],plan
   s.get_by_role('button',name='Aplicar',exact=False).click();s.get_by_text('Probar animación con sonido').click()
   with s.expect_download() as dl:s.get_by_text('Guardar WAV de esta vista previa').click()
   file='examples/phase33-%s-%s-%s.wav'%(t,speed,port);dl.value.save_as(file)
   with wave.open(file) as w:
    raw=w.readframes(w.getnframes());sr=w.getframerate()
   samples=[abs(int.from_bytes(raw[j:j+3],'little',signed=True))/8388608 for j in range(0,len(raw),3)]
   rows=[]
   for idx in plan['events']:
    f=inp['frames'][idx];target=round((f+plan['offset'])*sr/30)
    lo=max(0,target-600);hi=min(len(samples),target+1000)
    peak=max(range(lo,hi),key=samples.__getitem__);on=next((j for j in range(lo,hi) if samples[j]>.01),None)
    rows.append(dict(frame=f,visual_ms=f*1000/30,creative_frames=plan['offset'],peak_ms=peak*1000/sr,onset_ms=None if on is None else on*1000/sr,error_ms=(peak-target)*1000/sr,error_frames=(peak-target)*30/sr,peak=samples[peak]))
   out.append(dict(input=inp,speed=speed,runs=runs,wav=file,measurements=rows))
   print(t,speed,port,len(inp['frames']),plan['strategy'],max(abs(x['error_ms']) for x in rows))
   Path('examples/phase33.json').write_text(json.dumps(out,indent=2,ensure_ascii=False),encoding='utf8')
  s.screenshot(path='.audio-lab/phase33-'+t+'.png');s.close()

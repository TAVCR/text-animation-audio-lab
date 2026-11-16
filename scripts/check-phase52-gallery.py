from playwright.sync_api import sync_playwright
with sync_playwright() as d:
 p=d.chromium.launch(channel='chrome').new_page()
 errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto('http://127.0.0.1:3217/escuchas')
 for name in ['slide-in','glitch','bubble-pop','cinematic','ink-stamp-print','extruded-3d']:
  for style in ['Minimal','Cinematic','Experimental']:
   p.get_by_label('Animación',exact=True).select_option(name)
   p.get_by_label('Estilo',exact=True).select_option(style)
   p.get_by_label('Play video').click()
   for label,suffix in [('Antes','antes'),('Después','despues')]:
    p.get_by_role('button',name=label,exact=True).click()
    p.wait_for_function("""f=>[...document.querySelectorAll('audio')].some(a=>a.currentSrc.endsWith(f)&&!a.paused&&!a.muted&&a.volume>0&&a.currentTime>.06)""",arg=f'{name}-{style}-{suffix}.wav',timeout=20000)
   print(name,style,flush=True)
 assert not errors,errors

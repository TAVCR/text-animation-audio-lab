from playwright.sync_api import sync_playwright
from pathlib import Path
import json
with sync_playwright() as driver:
    b=driver.chromium.launch(channel='chrome')
    context=b.new_context()
    page=context.new_page()
    url='http://127.0.0.1:3217/?sound=1'
    page.goto(url)
    page.get_by_role('button',name='Library',exact=True).click()
    page.get_by_label('Elegir SFX').set_input_files('public/audio-lab/swish.wav')
    page.get_by_text('Probar animación con sonido').click()
    def download():
        with page.expect_download() as item:page.get_by_text('Guardar WAV de esta vista previa').click()
        return Path(item.value.path()).read_bytes()
    before=download()
    page.get_by_text('Guardar diseño en proyecto').click()
    page.get_by_role('tab',name='Mis presets').click()
    page.get_by_label('Nombre del preset').fill('Auditoría Audio Lab')
    page.get_by_role('button',name='Guardar preset').click()
    page.get_by_label('Preset guardado').select_option('Auditoría Audio Lab')
    page.close()
    page=context.new_page()
    page.goto(url)
    page.get_by_role('button',name='Procedural',exact=True).click()
    page.get_by_text('Guardar diseño en proyecto').click()
    page.get_by_role('tab',name='Mis presets').click()
    page.get_by_label('Preset guardado').select_option('Auditoría Audio Lab')
    page.get_by_role('button',name='Cargar preset').click()
    page.wait_for_function("()=>document.querySelector('input[type=file][aria-label]')!==null")
    page.get_by_text('Probar animación con sonido').click()
    after=download()
    assert before==after
    print('Named preset round trip, manually imported sample:',len(after),'identical bytes')


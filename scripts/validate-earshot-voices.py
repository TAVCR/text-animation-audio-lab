"""Audition every prepared Earshot variant through the editor and verify its saved ID."""
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

voices=json.loads(Path('src/lib/sound/capabilities.json').read_text(encoding='utf8'))['voices']
with sync_playwright() as driver:
    browser=driver.chromium.launch(channel='chrome')
    page=browser.new_page()
    page.goto('http://127.0.0.1:3217/?sound=1')
    hashes={}
    for voice,entry in voices.items():
        page.get_by_label('Familia sonora').select_option(voice)
        for i,take in enumerate(entry['takes']):
            if len(entry['takes'])>1:
                page.get_by_role('button',name=f'Variante {i+1}',exact=True).click()
            page.get_by_text('Guardar diseño en proyecto').click()
            page.wait_for_function("([r,s])=>{const d=JSON.parse(localStorage.getItem('remotion-fx:last-props:v1')).soundDesign;return d.recipe===r && d.recipeSeed===s}",arg=[take['recipe'],take['seed']])
            page.get_by_text('Probar animación con sonido').click()
            with page.expect_download() as wav:page.get_by_text('Guardar WAV de esta vista previa').click()
            digest=hashlib.sha256(Path(wav.value.path()).read_bytes()).hexdigest()
            asset=take['asset']
            if asset in hashes:assert digest==hashes[asset]
            else:
                assert digest not in hashes.values(),asset
                hashes[asset]=digest
    print('Distinct auditioned WAVs:',len(hashes))
    Path('examples/universal-voice-fingerprints.json').write_text(json.dumps(hashes,indent=2))


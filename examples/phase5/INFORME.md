# Auto Sound Design · Fase 5

[Editor experimental](http://127.0.0.1:3217/?sound=1) · [Galería de seis animaciones y 18 mezclas](http://127.0.0.1:3217/audio-lab/phase5/index.html)

Selecciona una animación, edita el texto y pulsa **Auto Sound Design**. Selecciona Minimal, Cinematic o Experimental y pulsa **Probar animación con sonido**. Desde esa misma previsualización puedes guardar el WAV. **Guardar diseño en proyecto** conserva la interpretación elegida. Regenerar una propuesta mantiene las otras dos.

## Banco y generación

El catálogo medido de Earshot 0.4.1 está en [earshot-bank.json](../../src/lib/sound/earshot-bank.json). Describe 252 entradas del banco instalado. [procedural-roles.json](../../src/lib/sound/procedural-roles.json) asigna candidatos a funciones acústicas. Las 96 interpretaciones de esta prueba utilizaron 77 recetas diferentes. Cada archivo JSON de plantilla registra recetas, semillas, parámetros, capas y posiciones de sus tres interpretaciones.

El worker Python local renderiza con controles disponibles por receta y mide inicio audible, pico y cola. La mezcla alinea el pico medido con el fotograma objetivo. La ganancia y el silenciamiento operan sobre la mezcla. Se conservan muestras y metadatos en la caché local. La primera síntesis puede tardar más que la reproducción posterior. El director por reglas funciona localmente. Se comprobaron respuestas de Qwen y Mistral y su traducción en planes guardados en esta carpeta.

## Validación

Chrome generó tres interpretaciones por plantilla, reprodujo la vista previa, descargó WAV PCM estéreo de 24 bits a 48 kHz y comprobó señal y margen de pico. Se verificaron tres hashes distintos por plantilla y coincidencia binaria de la última mezcla aprobada después de reabrir el editor. En los seis pilotos se reconstruyeron independientemente 18 mezclas. El mayor desplazamiento de un máximo local dentro de la ventana de medio fotograma fue 16.417 ms. Esta medición incluye superposición de capas y no mide la calidad artística. El peor residuo de reconstrucción fue 2.18e-07 respecto de escala completa.

También se verificaron regeneración aislada, edición de capas, restauración determinista de muestra ausente, invalidación por texto y velocidad, pausa y recuperación de una selección Library antigua. Los proyectos antiguos requieren que sus recursos previamente guardados sigan disponibles. La precisión expresiva depende de los eventos que expone cada adaptador. TypeScript pasó y la suite del editor completó 371 pruebas en 60 archivos. El alcance de esta fase cubre la exportación WAV. La comprobación del exportador visual fue por ausencia de cambios en sus rutas.

## Capas por interpretación verificada

| Plantilla | Minimal | Cinematic | Experimental |
|---|---:|---:|---:|
| apple-style | 1 | 1 | 2 |
| bar-reveal | 1 | 1 | 2 |
| blur-cascade | 1 | 1 | 2 |
| blur-reveal | 1 | 1 | 1 |
| bubble-pop | 1 | 1 | 2 |
| cinematic | 1 | 2 | 2 |
| clean-modern | 1 | 1 | 2 |
| dual-text-layers | 1 | 2 | 1 |
| extruded-3d | 1 | 2 | 2 |
| flicker-outline-fill | 1 | 1 | 2 |
| flicker | 1 | 1 | 2 |
| fly-through | 1 | 2 | 2 |
| follower-grow | 1 | 2 | 2 |
| follower | 1 | 2 | 2 |
| glitch | 1 | 1 | 2 |
| glyph-tile-assemble | 1 | 1 | 2 |
| ink-stamp-print | 1 | 2 | 1 |
| kinetic-box-sequence | 1 | 1 | 2 |
| neon-pulse | 1 | 1 | 2 |
| paper-cutout-assemble | 1 | 1 | 2 |
| rotation | 1 | 2 | 2 |
| scramble | 1 | 1 | 2 |
| shake-flicker | 1 | 1 | 2 |
| shape-reveal | 1 | 1 | 2 |
| slide-in | 1 | 2 | 2 |
| slide-reveal | 1 | 1 | 2 |
| smooth-sliding | 1 | 2 | 2 |
| typewriter | 1 | 1 | 2 |
| variable-weight-wave | 1 | 1 | 2 |
| viral-text | 1 | 1 | 2 |
| wipe-reveal | 1 | 1 | 1 |
| word-highlight-tracker | 1 | 1 | 2 |

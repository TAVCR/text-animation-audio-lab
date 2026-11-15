# Text Animation Audio Lab · Fase 4.2

Base de desarrollo `6f511a0`. El enlace [Editor con Sound Design abierto](http://127.0.0.1:3217/?sound=1) conserva el proyecto activo del navegador. Para comparar, pulsa **Auto Sound Design**, alterna **Library** y **Procedural** y pulsa **Probar animación con sonido**. **Guardar WAV de esta vista previa** descarga la mezcla escuchada. **Guardar diseño en proyecto** asocia las decisiones al estado del editor y a sus presets.

## Matriz de Chrome

Cada fila se probó con el texto «Motion sound test», con un texto de cinco palabras y por separado a 1,6×. Se comprobaron ambas fuentes, reproducción y pausa del elemento de audio, descarga PCM24 a 48 kHz, amplitud, reapertura de Library y equivalencia byte a byte tras cerrar y reabrir la página. Los ocho JSON de `examples/universal-group-*.json` contienen calendarios, recortes y resultados. Los 64 WAV locales están en `.audio-lab/universal/`.

La columna visual cuenta anclas con píxeles distintos entre el frame del acento y una muestra a cada lado, con un margen de dos frames y partículas desactivadas. Con varios eventos se tomaron hasta tres anclas. Variable Weight Wave se probó con Inter. La columna de error muestra la mayor distancia al pico local del PCM dentro de ±medio fotograma del acento previsto. Los dos valores están en milisegundos, en orden Procedural / Library. La métrica incluye superposición de colas y no mide la latencia de los altavoces.

| Plantilla | Soporte en la base | Movimiento | Receta probada | Candidato Library | Eventos | Anclas visibles | Error P/L (ms) |
|---|---|---|---|---|---:|---:|---:|
| typewriter | Adaptador parcial | escritura | typing_key/crisp | typing_keyboard.mp3 | 14 | 3/3 | 0.40 / 0.00 |
| word-highlight-tracker | Adaptador parcial | articulación progresiva | click/soft | Digital Click - 7.mp3 | 3 | 2/3 | 1.00 / 1.00 |
| clean-modern | Sin adaptador | articulación progresiva | click/soft | Digital Click - 8.mp3 | 15 | 3/3 | 0.00 / 0.00 |
| slide-in | Auto piloto | desplazamiento | whoosh_fast/crisp | AIRY WHOOSH (1).wav | 3 | 3/3 | 0.00 / 0.00 |
| smooth-sliding | Adaptador parcial | desplazamiento | whoosh_fast/crisp | AIRY WHOOSH (1).wav | 3 | 3/3 | 0.00 / 5.69 |
| follower | Adaptador parcial | desplazamiento | whoosh_fast/crisp | AIRY WHOOSH (1).wav | 15 | 3/3 | 0.00 / 0.08 |
| rotation | Adaptador parcial | giro | swipe/glide | Sweep Phaser.wav | 15 | 3/3 | 0.00 / 15.75 |
| follower-grow | Sin adaptador | giro | swipe/glide | Sweep Phaser.wav | 9 | 3/3 | 0.62 / 6.40 |
| bubble-pop | Auto piloto | crecimiento elástico | pop/0 | bubble-pop-293342.mp3 | 3 | 3/3 | 0.00 / 0.00 |
| apple-style | Adaptador parcial | crecimiento elástico | pop/0 | bubble-pop-293342.mp3 | 15 | 3/3 | 0.00 / 0.00 |
| glitch | Auto piloto | interrupción digital | glitch/chirp | Electric, Switch ON OFF, power, turn-on, medium frequency, motor, pulse, hum.wav | 20 | 3/3 | 1.00 / 1.00 |
| shake-flicker | Sin adaptador | interrupción digital | glitch/data | glitch_interface_crunchanator_12.wav | 11 | 3/3 | 0.00 / 14.48 |
| scramble | Sin adaptador | interrupción digital | glitch/chirp | Electric, Switch ON OFF, power, turn-on, medium frequency, motor, pulse, hum.wav | 17 | 3/3 | 0.00 / 11.90 |
| flicker | Sin adaptador | parpadeo | glitch/chirp | Electric, Switch ON OFF, power, turn-on, medium frequency, motor, pulse, hum.wav | 44 | 3/3 | 0.00 / 7.94 |
| flicker-outline-fill | Sin adaptador | parpadeo | glitch/chirp | Electric, Switch ON OFF, power, turn-on, medium frequency, motor, pulse, hum.wav | 47 | 3/3 | 0.00 / 7.94 |
| neon-pulse | Sin adaptador | pulso continuo | glitch/chirp | Electric, Switch ON OFF, power, turn-on, medium frequency, motor, pulse, hum.wav | 5 | 3/3 | 0.00 / 7.90 |
| variable-weight-wave | Sin adaptador | pulso continuo | glitch/chirp | Electric, Switch ON OFF, power, turn-on, medium frequency, motor, pulse, hum.wav | 2 | 2/2 | 0.00 / 0.00 |
| blur-reveal | Sin adaptador | revelado | swish/soft | Fast swish.wav | 1 | 1/1 | 0.00 / 0.00 |
| blur-cascade | Adaptador parcial | revelado | swish/soft | Fast swish.wav | 15 | 3/3 | 0.02 / 4.08 |
| wipe-reveal | Sin adaptador | revelado | swish/soft | Fast swish.wav | 1 | 1/1 | 0.00 / 0.00 |
| slide-reveal | Sin adaptador | revelado | swish/soft | Page 10 - Whoosh_ Swish Sounds_10.mp3 | 2 | 2/2 | 0.00 / 0.00 |
| shape-reveal | Sin adaptador | revelado | swish/soft | Page 10 - Whoosh_ Swish Sounds_8.mp3 | 3 | 3/3 | 0.00 / 0.00 |
| bar-reveal | Sin adaptador | revelado | swish/soft | Page 10 - Whoosh_ Swish Sounds_8.mp3 | 2 | 2/2 | 0.00 / 0.00 |
| cinematic | Sin adaptador | profundidad | riser/air | sharp-riser-327342.mp3 | 3 | 3/3 | 0.00 / 0.00 |
| fly-through | Sin adaptador | profundidad | whoosh_fast/crisp | AIRY WHOOSH (1).wav | 2 | 1/2 | 0.00 / 0.00 |
| extruded-3d | Sin adaptador | profundidad | riser/air | sharp-riser-327342.mp3 | 3 | 1/3 | 0.00 / 0.00 |
| glyph-tile-assemble | Adaptador parcial | ensamblado | click/soft | minecraft_click.mp3 | 2 | 2/2 | 0.00 / 0.00 |
| paper-cutout-assemble | Adaptador parcial | ensamblado | click/soft | Digital Click - 8.mp3 | 6 | 3/3 | 1.00 / 1.00 |
| kinetic-box-sequence | Sin adaptador | ensamblado | click/soft | Digital Click - 8.mp3 | 7 | 3/3 | 0.00 / 0.00 |
| ink-stamp-print | Adaptador parcial | impresión | impact/punch | Ice,Impact,Throw,Snowball,Step,Snow,Stalactite,Various12.M.wav | 1 | 1/1 | 0.00 / 0.00 |
| dual-text-layers | Sin adaptador | impresión | impact/punch | Ice,Impact,Throw,Snowball,Step,Snow,Stalactite,Various12.M.wav | 1 | 1/1 | 0.00 / 0.00 |
| viral-text | Sin adaptador | entrada escalonada | pop/0 | bubble-pop-293342.mp3 | 3 | 3/3 | 0.00 / 0.00 |

## Registro y selección

El análisis calcula eventos sobre los relojes de cada plantilla. El clasificador usa la familia del movimiento y el intervalo mediano entre acentos para priorizar recetas según el tiempo real hasta su pico. El director local restringe la estrategia a las voces disponibles. La mezcla utiliza los fotogramas deterministas del análisis, el desfase y los índices aprobados por el usuario.

El registro `src/lib/sound/capabilities.json` contiene los parámetros publicados por el banco Earshot, las tomas preparadas y sus semillas. Las duraciones y los tiempos al pico de esta tabla proceden del PCM de la primera toma. El editor trabaja con tomas prerenderizadas. Los parámetros internos del sintetizador se conservan como metadatos del registro.

| Voz | Receta principal | Duración (ms) | Pico (ms) | Variantes |
|---|---|---:|---:|---:|
| typing | typing_key/crisp | 228.83 | 11.15 | 4 |
| click | click/soft | 93.77 | 2.85 | 1 |
| whoosh | whoosh_fast/crisp | 1061.15 | 146.17 | 1 |
| sweep | swipe/glide | 745.54 | 202.02 | 4 |
| swish | swish/soft | 872.65 | 73.46 | 1 |
| impact | impact/punch | 2867.56 | 65.35 | 1 |
| pop | pop/0 | 200.0 | 2.81 | 1 |
| digital | glitch/data | 490.0 | 426.54 | 1 |
| glitch | glitch/stutter | 640.0 | 382.69 | 4 |
| pulse | glitch/chirp | 407.33 | 73.58 | 1 |
| texture | shimmer/m0 | 4200.0 | 808.38 | 4 |
| riser | riser/air | 2400.0 | 2387.6 | 1 |

Se comprobaron 24 selecciones que corresponden a 23 WAV distintos y 19 recetas. La toma de chirp también se ofrece como variante de glitch. En el editor, la semilla persistida de Earshot se distingue del índice del botón de variante.

Library puntúa nombres y carpetas mediante vocabulario acústico, comprueba la duración de los mejores resultados y escoge una región alrededor del bloque de mayor energía de 10 ms en los primeros 20 segundos. El índice conserva metadatos en SQLite y el escaneo incremental avanza por carpetas en turnos. Cada alta queda confirmada individualmente para poder interrumpir y reanudar. La selección conserva los primeros dos canales de la fuente. CLAP sigue siendo opcional. Las búsquedas de esta validación usaron metadatos y señal.

## Persistencia y comprobaciones adicionales

- Las selecciones automáticas conservan la ruta original, un identificador de segmento local, la receta alternativa, la semilla, los eventos con versión, la estrategia aplicada y los parámetros DSP. Las importaciones manuales usan un identificador por contenido en IndexedDB.
- Una prueba adicional guardó un archivo importado en un preset con nombre, cerró la página, modificó la selección y cargó el preset. Los 1 440 044 bytes del WAV restaurado coincidieron con la primera escucha.
- Qwen, servido como `audio-director`, eligió `texture` y Mistral Nemo eligió `riser` para la misma consulta de profundidad 3D. Ambos devolvieron parámetros válidos sin activar el respaldo. Las reglas locales siguen disponibles sin servidor de IA.
- TypeScript pasó la compilación de tipos. Vitest pasó 371 pruebas en 60 archivos. Se corrigió una carga anticipada del audio que interfería con dos pruebas de exportación PNG. El panel prepara el audio al abrirse.
- La prueba visual detectó golpes finales sobre barridos ya asentados y acentos ligados a un brillo que estaba desactivado. Para los reveals por resorte se usa ahora la máxima velocidad del progreso visual. Neon Pulse sigue las interrupciones reales de opacidad cuando la sombra está desactivada. Paper Cutout conserva el escalonamiento por palabra y ajusta sus asentamientos con la velocidad.
- La muestra audiovisual de cuatro plantillas en `examples/universal-preview.mp4` usa capturas de los fotogramas del editor y el WAV Procedural correspondiente. Se presenta a 15 fps para revisión. La sincronización del motor se calcula a 30 fps.

## Límites observados

Word Highlight incluye un acento de entrada en el fotograma cero. Fly Through y Extruded 3D usan hitos de entrada y cámara, cuya visibilidad depende de la posición y del encuadre. En las tres plantillas hubo anclas muestreadas sin diferencias de píxeles, además de anclas con movimiento demostrado. Los picos medidos y la selección de ventanas no certifican por sí solos la preferencia artística del usuario.

La onda tipográfica depende de que la fuente renderizada exponga el eje de peso. Inter produjo movimiento visible. En esta máquina, la prueba con Bahnschrift cambió el valor CSS y no produjo diferencias de píxeles.

Las pruebas de persistencia se hicieron en el mismo perfil y equipo. Trasladar solo el preset a otro equipo requiere trasladar o volver a seleccionar los medios. La validación cubre exportación WAV y regresión del editor. El MP4 de comparación se preparó a partir de la vista previa; esta fase no constituye una nueva validación del canal alfa.

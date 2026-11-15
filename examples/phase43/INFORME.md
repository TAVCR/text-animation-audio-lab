# Fase 4.3 · Selección acústica

[Escucha comparativa de ocho plantillas y cinco consultas](http://127.0.0.1:3217/audio-lab/phase43/index.html) · [Editor con Sound Design abierto](http://127.0.0.1:3217/?sound=1)

## Diversidad observada

En la base d72faba, 32 plantillas eligieron **14 archivos distintos y 10 recetas**. Para identificar archivos se cotejó la ruta, la fecha de modificación y la región con el identificador existente en caché. En la pasada final se seleccionaron **16 archivos y las mismas 10 recetas**. Las 32 ofrecieron tres candidatos Library. La oferta procedural existente se conservó.

| Familia elegida | Plantillas | Archivos elegidos antes | Archivos elegidos ahora | Coincidencias nominales por consulta |
|---|---:|---:|---:|---:|
| click | 5 | 3 | 2 | 60–60 |
| digital | 1 | 1 | 1 | 128–128 |
| impact | 2 | 1 | 1 | 666–666 |
| pop | 3 | 1 | 2 | 39–39 |
| pulse | 6 | 1 | 3 | 94–111 |
| riser | 2 | 1 | 1 | 136–136 |
| sweep | 2 | 1 | 1 | 453–453 |
| swish | 6 | 3 | 2 | 119–119 |
| typing | 1 | 1 | 1 | 16–16 |
| whoosh | 4 | 1 | 3 | 464–464 |

El mismo interruptor eléctrico aparecía en seis propuestas de pulso, incluyendo Glitch, Scramble y Variable Weight Wave. El nombre contenía «pulse», pero ese dato no distingue una interrupción digital de una onda tipográfica. Ahora se usan también las voces compatibles del movimiento. Un pulso clínico puede conservar una buena coincidencia espectral; el vocabulario de contexto reduce su prioridad para gráficos electrónicos.

Las dos impresiones compartían impacto, y Bubble Pop y Apple Style compartían pop. Mantener una misma toma puede ser apropiado cuando el texto pide un asentamiento parecido. Typing tenía el conjunto nominal más pequeño de las familias ensayadas, con 16 coincidencias. El antiguo límite de 16 candidatos y la ordenación alfabética reducían la oferta efectiva. La repetición histórica por sí sola no demuestra que faltaran archivos en el disco. Click suave, chirp digital y swish siguen siendo interpretaciones generales; la fase deja su pertinencia a evaluación auditiva.

## Buscador y director

El indexador rota entre combinaciones de colección y etiquetas. Cada registro acústico se confirma por archivo y se reutiliza si coinciden tamaño, fecha y versión del análisis. Interrumpir el proceso conserva lo confirmado. Se ejecutó una tanda de 100 altas o actualizaciones. La base local contenía 307 perfiles de regiones al cierre, incluidas referencias de Earshot.

Por consulta, el buscador recorre el vocabulario del disco y perfila hasta 24 archivos estratificados por carpeta. Analiza hasta cuatro ventanas de ocho segundos repartidas a lo largo de la grabación. Detecta máximos locales separados, conserva hasta ocho por ventana y compara su ataque, duración útil, centroide, energía aguda y factor de cresta con la voz Earshot. Penaliza la saturación y la concentración en una carpeta. Descarta candidatos silenciosos, con saturación sostenida, con un pico inicial fuerte sin margen de fade, o con PCM idéntico a otra alternativa. Continúa con el siguiente candidato si el segmento falla. Este control detecta defectos concretos; no detecta todo artefacto audible.

El director recibe hasta tres identificadores. El servidor lee sus manifiestos locales, limita las opciones de la IA a esos IDs y a Procedural y valida la respuesta. Qwen y Mistral recomendaron Fast whoosh.wav para la consulta de Slide In. La búsqueda adicional conserva una toma guardada o aprobada; el botón de alternativa permite cambiarla explícitamente.

## CLAP local

Earshot ejecutó en CPU el checkpoint de LAION con licencia Apache-2.0, revisión 16c8cc3159a3c8a31e8ff5ef1f66b0d9ab3667db. Se verificó el SHA-256 c3d0e564a97cb5eccea412f11d5c51c8a1ccceb80c51e3c6957bb5a796b423b6 del fichero safetensors de 776 327 440 bytes. El entorno privado usa Python 3.12, PyTorch CPU 2.8.0 y Transformers 4.53.3. El adaptador de evaluación traduce el argumento de audio al nombre que espera esa versión de Transformers. La inferencia corre en modo offline. [Modelo](https://huggingface.co/laion/larger_clap_general) · [Pesos](https://huggingface.co/laion/larger_clap_general/blob/refs%2Fpr%2F2/model.safetensors)

Cinco consultas en inglés compararon los mismos 48 segmentos. A puntúa texto y duración de archivo. B usa el coseno entre audio y texto. C combina compatibilidad acústica, vocabulario, duración de región y tres veces el coseno. En el editor CLAP reordena los finalistas solo cuando hay puntuaciones para todos. Las consultas ajenas al conjunto precalculado siguen operando con el ranking acústico. Las listas de tres y sus puntuaciones están en clap.json. La muestra procede de finalistas acústicos y no mide el recall de una búsqueda semántica sobre todo el disco.

| Consulta | A · nombre y duración | B · CLAP | C · combinado |
|---|---|---|---|
| whoosh | whoosh.mp3 | whoosh.mp3 | Sound Design_Title Sfx_Metal Shimmer_Whoosh_Sweep_Low Reverse_HutchSFX_3.mp3 |
| impact | Signum_source_composite_impact_2.wav | Rumble swish.wav | Signum_source_composite_impact_2.wav |
| digital | Glitch_Error_Malfunction_018.wav | lamp-click_on_off-104823.mp3 | Glitch Abstract FX (19).wav |
| pop | multi-pop-6-188170.mp3 | multi-pop-6-188170.mp3 | floraphonic-ui-pop-up-5-197889.mp3 |
| swish | Fast swish.wav | lamp-click_on_off-104823.mp3 | Fast swish.wav |

Para impacto, CLAP situó un swish en primer lugar. Para interferencia digital y transición suave situó primero un clic de lámpara. La galería permite escuchar esas discrepancias junto con las regiones de los otros métodos. No se recogieron valoraciones humanas ciegas y no se atribuye superioridad artística al ranking combinado.

## Pruebas y resultados

Se validaron las 32 plantillas en Chrome con reproducción, pausa, WAV, reapertura y comparación byte a byte del archivo restaurado, además de cambios independientes de texto y velocidad. Los ocho informes group-*.json conservan las fuentes, regiones y resultados. TypeScript y las 371 pruebas de referencia pasaron. Una prueba específica comprobó un transitorio tardío en una fuente con canales en contrafase, la reutilización de SQLite y la invalidación después de modificar una fuente sintética.

La galería contiene 32 mezclas de ocho plantillas, cuatro por plantilla. Library 4.2 proviene de la validación conservada del editor. Library A, Library B y Procedural son exportaciones de Chrome con el texto y ajustes de comparación iguales. Se volvió a ejecutar Auto después de guardar Library B y se verificó que siguiera seleccionada. En las 24 exportaciones nuevas se comparó el PCM por canal con una reconstrucción independiente que incluye ganancia, transitorio, fades, superposición y normalización. El residual máximo fue 2.67e-07. Todas fueron estéreo, a 48 kHz PCM24, y quedaron dentro de escala. metrics.json conserva duración, pico, RMS por canal y errores locales por toma.

| Fuente | Máxima distancia al pico local |
|---|---:|
| anterior | 7.90 ms |
| A | 1.00 ms |
| B | 3.19 ms |
| Procedural | 1.00 ms |

El error se obtiene en una ventana de ±medio fotograma alrededor de cada evento. La cifra incluye el efecto de colas solapadas; no estima latencia del dispositivo ni la posición de un pico fuera de la ventana.

## Cuatro casos visuales

En Word Highlight Tracker, el frame 0 ya contiene la primera palabra seleccionada. Los cambios posteriores sí coincidieron con movimiento visible. El primer acento se interpreta como entrada editorial. En Fly Through hubo cambio de píxeles alrededor del frame 15 y ninguno alrededor del 1 para el encuadre probado. En Extruded 3D el frame 21 mostró movimiento y los frames 1 y 115 no lo mostraron en la ventana examinada. En estas dos plantillas conviene priorizar el hito visible al elegir un impacto destacado; una ancla matemática de cámara puede quedar fuera del cuadro.

Variable Weight Wave mostró 3 340 píxeles cambiados alrededor de cada una de las dos anclas con Inter. La prueba anterior con Bahnschrift solo cambió el valor CSS. El aviso sobre el eje de peso sigue siendo pertinente. Se conservaron los cuatro adaptadores y el render visual.

## Reproducción técnica

Desde la copia experimental, ejecutar scripts/index-sfx.py --limit 100 con el Python de .audio-lab/venv para extender el perfilado. scripts/benchmark-clap.py usa .audio-lab/clap-env y los pesos verificados en .audio-lab/clap-model. scripts/validate-universal.py acepta grupos 0 a 7 con --phase43. scripts/audition-phase43.py genera las tres escuchas nuevas; scripts/measure-phase43.py contrasta las salidas. Los medios comparables están en public/audio-lab/phase43. Los datos originales y los pesos quedan fuera de Git.

# Fase 5.2 · composición sonora procedural

[Galería de escucha](http://127.0.0.1:3217/escuchas) · [Editor](http://127.0.0.1:3217/?sound=1)

La galería reproduce dos pistas sobre la misma composición Remotion. «Antes» y «Después» cambian la pista audible conservando el fotograma. La ganancia de escucha se obtiene de los LUFS integrados que mide FFmpeg y reserva al menos 1 dB de margen de pico verdadero. La descarga contiene el WAV original del editor. Las 36 pistas corresponden al texto «Animación de texto con sonido», velocidad 1× y fase de entrada. Se eligieron reglas locales para poder repetir el experimento sin depender del modelo.

## Diseños para escuchar

| Plantilla | Gesto que guía la composición | Qué comparar |
|---|---|---|
| Slide In | Entrada por palabra y asentamiento | Definición del ataque, apertura del filtro durante el barrido y espacio que queda entre entradas superpuestas. |
| Glitch | Grupos de interrupciones RGB | Separación de pulsos, portadora modulada y cortes de envolvente. Conviene escuchar también los silencios. |
| Cinematic | Acercamiento o alejamiento durante el plano | Evolución de brillo, profundidad y contraste entre barrido principal y resonancia final. |
| Bubble Pop | Cambio de escala y aparición de la palabra | Brevedad de la pulsación, cuerpo tonal y textura del último gesto. |
| Ink Stamp Print | Contacto del sello | Definición del transitorio, caída del cuerpo y equilibrio entre grave y detalle de superficie. |
| Extruded 3D | Vuelo y cambio de perspectiva | Trayectoria lateral, variación de distancia y separación entre riser y cola. |

Por ejemplo, Slide In Cinematic combina whoosh_fast/tight y swish/blade en la trayectoria y ui_pop/boop en el asentamiento. Ink Stamp Print Cinematic une cut_hit/air, el cuerpo sintetizado y toggle/rocker en el mismo contacto. En el [catálogo de escuchas](../../public/audio-lab/phase52/catalog.json) figuran recetas, fotogramas, capas, parámetros, ganancia A/B y mediciones de cada pista. Los JSON individuales junto a cada WAV conservan semillas y parámetros de Earshot.

## Controles y dirección

Intensidad modifica la excitación armónica y la definición del transitorio. Complejidad regula la desviación de afinación, los parciales y la modulación. Profundidad modifica apertura estéreo, relación directa/reflejada y duración de reflexiones. Respuesta al movimiento regula el seguimiento temporal del filtro y del tono. Las operaciones se aplican sobre componentes sintetizados en caché. Cambiar una ganancia de capa permite reutilizar el PCM procesado. Los proyectos anteriores conservan su mezcla hasta que se solicita otro diseño.

El selector del editor comienza en reglas locales. Con un proveedor seleccionado, el panel muestra el modelo que realmente produjo el plan. Se verificaron desde Chrome Qwen, anunciado por su servidor como audio-director, y Mistral, anunciado como mistral-nemo. El modelo selecciona opciones de un vocabulario cerrado de procesamiento, intención, síntesis, envolvente, relación, espacio y cierre. El motor usa los eventos medidos para colocar cada toma. Los planes incompatibles o los servidores ausentes tienen respaldo por reglas. El concepto base sigue asociado a la plantilla. El seguimiento entre hitos utiliza curvas sintetizadas del motor y la velocidad del clip, sin muestrear geometría 3D por píxel.

## Verificación

- Se preservaron las 18 mezclas previas desde el checkpoint phase52-baseline-b2afe6b. Al volver a abrir sus planes, el mezclador produjo los mismos 18 WAV byte por byte.
- Se generaron y probaron en Chrome 18 mezclas avanzadas y las 36 opciones de reproducción de la galería. Las 32 plantillas pasaron generación de los tres estilos, descarga, señal y recuperación del último WAV aprobado.
- Los cuatro controles produjeron cuatro cambios distintos de PCM sobre el mismo plan sin solicitudes adicionales de síntesis. Al guardar y reabrir, el WAV ajustado coincidió byte por byte.
- Los 36 WAV son estéreo PCM24 a 48 kHz. Pico verdadero máximo de −2,39 dBTP. Pérdida máxima de potencia al plegar a mono de 2,30 dB. Última muestra a cero en todas las mezclas. En el diseño Experimental del sello se redujo la energía de graves del componente procesado para dejar espacio al cuerpo del contacto.
- En los 18 pares coinciden los fotogramas planificados de la capa principal. Además, se aisló una toma principal por cada interpretación avanzada, se exportó desde el editor y se midió su máximo acústico global. La mayor desviación del pico fue de 14,60 ms en Extruded 3D Cinematic, dentro de medio fotograma a 30 fps. Las mediciones individuales están en [sync.json](../../public/audio-lab/phase52/sync.json). Esta prueba caracteriza esas 18 tomas y no mide la percepción del centro temporal de toda una mezcla.
- TypeScript pasó y la suite del editor completó 392 pruebas. Los archivos del motor visual, los adaptadores de análisis y las rutas de exportación alfa conservaron su versión inicial. La evaluación artística y la extensión a las demás plantillas quedan pendientes de escucha humana.

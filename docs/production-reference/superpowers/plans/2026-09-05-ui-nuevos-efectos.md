# Propuesta de cinco efectos de texto y cinco fondos de partículas

Parte del [plan principal](2026-09-05-ui-plantillas-plan.md), fases F6 y F7. No hay implementación autorizada en esta entrega. Todos los nombres, combinaciones y mecanismos siguientes son propuestas originales para este proyecto, no un ranking de popularidad.

## 1. Tendencias consultadas y grado de evidencia

Consulta: 5 de septiembre de 2026. Se distinguen tendencias amplias publicadas para 2026 de popularidad específica de un efecto; no se dispone de medición de uso diario de TikTok/CapCut para afirmar que estos diez efectos exactos sean virales.

- **Canva, Design Trends 2026:** describe texturas táctiles, estética de recortes y diseños imperfectos, además de experimentación visual y composición editorial. Esa evidencia respalda explorar papel, tinta y tipografía expresiva; no demuestra la popularidad de nuestros algoritmos. [Informe de Canva](https://www.canva.com/newsroom/news/design-trends-2026/).
- **Adobe, Creative Trends 2026**, publicado el 9 de diciembre de 2025: sitúa la experiencia sensorial y la experimentación entre sus direcciones creativas. Sirve como contexto para materiales visuales y movimientos expresivos, no como validación de ventas o rendimiento. [Informe de Adobe](https://blog.adobe.com/en/publish/2025/12/09/four-creative-trends-define-marketing-2026).
- **CapCut, Highlight Font:** documenta texto destacado y personalización de fondos de texto para video. Respalda el caso de uso del resaltado; no confirma que una variante exacta sea tendencia de esta semana. [Guía de CapCut](https://www.capcut.com/resource/highlight-font).

**Criterio editorial:** ampliar el catálogo hacia materialidad, lectura guiada y patrones de partículas organizados. El catálogo actual ya tiene mucha cobertura de neón, glitches, blur, retículas, redes, túneles, esferas y nebulosas. No se proponen como novedades nuevas paletas de esas familias.

## 2. Contratos comunes para las diez incorporaciones

### 2.1 Integración por ficha

Cada ficha da ID, archivo, controles y algoritmo. En una tarea completa:

1. Crear componente en el archivo indicado y tipo de options explícito en `src/lib/editor/effectOptions.ts`.
2. Extender `AnimationStyle` o `ParticlePreset` en `src/lib/types/animation.ts` conservando IDs anteriores.
3. Añadir texto a `src/remotion/templates/registry.ts`; fondo a selección de `src/remotion/backgrounds/ParticleBackground.tsx`. Pasar options desde MainComposition cuando haga falta, sin importar UI en motores.
4. Añadir descriptor a catálogo: nombre, ayuda, familia, soporte, controles, defaults, claves guardables y miniatura. Crear secciones personalizadas solo para tablas de tiempos; campos simples reutilizan NumberField/ColorField.
5. Persistencia en `templateOptions[id]` o `backgroundOptions[id]`; reset de ficha devuelve valores indicados. Resolver mapa ausente mediante defaults con `??` y no mediante `||`.
6. Generar fixture de QA, cinco fotogramas y clip; verificar criterio individual, alpha y determinismo. Crear miniatura estática en `public/previews/<id>.png` después de pasar QA, a 480×270; no depende de un render del usuario que pueda ser eliminado.

No añadir audio, detección de voz, interacción con mouse dentro del render ni motores de física continuos. Un frame debe calcularse desde datos y tiempo aunque se visite fuera de orden.

### 2.2 Tiempo y aleatoriedad

Texto nuevo: `frame=useMotionFrame(props)` para fases de entrada/salida; `t=frame/30 * props.speed`. Los valores de tiempo de ficha son segundos locales a velocidad 1. La fase “Ambas” sigue mapeo del proyecto y la UI explica que comprime entrada y salida; no introducir una segunda reversión. Fondos: `t=currentFrame/30 * particleSpeed`, independiente de la velocidad del texto y de su fase. Donde hay `cycleSeconds`, se calcula `u=fract(t/cycleSeconds)`.

Helpers nuevos en `src/remotion/motion/deterministic.ts`:

```ts
export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
export const fract = (x: number): number => x - Math.floor(x);
export const smooth01 = (x: number): number => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const easeOutCubic = (x: number): number => 1 - (1 - clamp01(x)) ** 3;
```

Usar `random(seed + ':' + index + ':' + channel)` de Remotion para valores sembrados; nunca `Math.random()` ni `Date.now()` para geometría. Esos helpers no controlan el estado del editor.

Semilla común de fondos nuevos: `seed` cadena default igual al ID + `-1`; avanzado con acción “Variar distribución”, que cambia la semilla una vez como acción del editor y la guarda. Para generar nueva semilla en editor se permite un contador almacenado de variantes, no cambiarla cada frame. Controles comunes: opacidad de grupo 0–1, default .65 (salvo ficha); colores de ficha; velocidad 0–3×, default 1; controles de texto globales conservados.

Los fondos nuevos reciben `quality` solo de preview cuando exista: `draft|full`; el render usa full siempre. La calidad no modifica semilla ni trayectoria de las partículas existentes; solo cantidad de muestras/efectos secundarios. Para comparación de píxeles usar full en ambos.

### 2.3 Legibilidad y clasificación de movimiento

Toda miniatura usa texto “Crea algo distinto” y muestra nombre, no solo un código. Las demos de texto usan 5 s; fondos 8 s. Control de densidad debe explicar si cuenta partículas, celdas o fragmentos. Color de fondo base es opcional y se omite en alpha; las partículas no se eliminan por activar transparencia.

No etiquetar un efecto como “bucle perfecto” salvo que pase prueba de continuidad en frame 0 y frame de fin virtual. Por defecto los nuevos fondos son continuos, pero el salto del Player al repetir no implica cierre perfecto; texto es entrada/salida. Las fichas especifican cómo evitar reinicios visibles de partículas individuales.

## 3. N-T01 — Resaltado que recorre la frase

**ID:** `word-highlight-tracker`. **Archivo:** `src/remotion/templates/WordHighlightTracker.tsx`. **Familia:** lectura guiada. **Prioridad:** alta. **Complejidad:** media.

**Resultado visual:** la frase completa permanece en su sitio; una pastilla de color pasa de palabra en palabra. La palabra activa cambia de color sin saltar ni escalar. En dos líneas, la pastilla desvanece y reaparece al inicio de la siguiente línea en vez de atravesar diagonalmente el espacio vacío.

**No redundancia:** Viral muestra líneas con opacidad, Kinetic cambia segmentos en tarjetas y Bar reemplaza frases. Aquí el contenido completo está siempre presente y cambia el énfasis de lectura. No es un nuevo slide/pop ni un servicio de subtítulos automáticos.

**Controles básicos:**

| Clave | Etiqueta | Rango / default |
|---|---|---|
| `wordSeconds` | Tiempo por palabra | .1–2 s, paso .05, .4 |
| `highlightColor` | Color del resaltado | #d7ff3f |
| `activeTextColor` | Texto activo | #111111 |
| `inactiveTextColor` | Texto en reposo | #ffffff |
| `cornerRadiusPx` | Redondeo | 0–40 px, paso 1, 12 |
| `paddingPx` | Margen del resaltado | 0–24 px, paso 1, 8 |

Avanzado: `travelSeconds` 0–.25 s, paso .01, .12; `wordTimings` array opcional `{start:number;end:number}[]`, vacío por defecto. Tabla “Ajustar tiempos” con una fila por palabra, entradas en segundos; inicio≥0, fin>inicio, sin solapamiento y cantidad igual al total de palabras. Si faltan filas, error y botón “Repartir uniformemente”, no rellenar ambiguamente. Editar frase invalida tiempos manuales con aviso y conserva copia en historial.

**Algoritmo:** segmentar palabras conservando offsets. Medir rectángulos de spans tras cargar fuente, relativos al contenedor local. Guardar medidas solo cuando cambia texto, fuente, tamaño, espaciado, ancho o aspecto. Elegir palabra i por intervalo; interpolar x/y/ancho/alto del rectángulo de i−1 a i durante travelSeconds con smooth01. Distinto top implica salto de línea: fade anterior en primera mitad y fade nueva en segunda. Clamp padding dentro de margen del bloque; no cambiar layout para animar.

Sin timings manuales: palabra i activa en `[i*wordSeconds,(i+1)*wordSeconds)`. Antes de primera, no hay pastilla; después de última, última palabra queda resaltada. Si todos los tiempos no caben, error de encaje con botón “Ajustar duración”; no acelerar silenciosamente. No anunciar sincronización con audio.

**Compatibilidad:** bloque multilínea, tipografía global; editor de rango solo para font/peso si medida actualizada; ocultar gradiente por rango que anule color activo. Fondo externo permitido, alpha permitido. Si esperar a fuentes requiere bloqueo de render, usar mecanismo de espera de Remotion compatible con versión instalada y cerrarlo ante error; no dejar render colgado.

**Prueba exacta:** “Este texto guía la mirada”, 5 palabras, .4 s. Frames 0/12/24/36/48 activan palabras 1/2/3/4/5. Después de medir, todas conservan sus posiciones. En 9:16 con salto manual tras “guía”, no aparece pastilla cruzando en diagonal. Guardar y reabrir conserva colores y tiempos.

**Riesgo para Luna:** medición de fuente y saltos. Si el rectángulo no coincide tras una corrección fundamentada, detener y adjuntar medidas, viewport, fuente, frame y captura; no sustituir por escala tipo BubblePop.

## 4. N-T02 — Recortes de papel que se colocan

**ID:** `paper-cutout-assemble`. **Archivo:** `src/remotion/templates/PaperCutoutAssemble.tsx`. **Familia:** táctil/editorial. **Prioridad:** alta. **Complejidad:** media.

**Resultado:** cada palabra está impresa sobre un recorte irregular de papel. Las piezas se colocan con un pequeño giro y sombra, como una composición de recortes hecha a mano; quedan con inclinaciones finales discretas. La frase completa termina visible y legible.

**No redundancia:** KineticBox es una secuencia de cajas; aquí las piezas tienen bordes irregulares reproducibles, posiciones finales ligeramente imperfectas y todas permanecen juntas. No basta cambiar borderRadius de Kinetic.

**Básicos:** `paperColor` #fff1cf, `inkColor` #202020; `wordDelayFrames` 0–15/1/4; `settleFrames` 6–30/1/12; `rotationMax` 0–12°/1/4; `paperPaddingPx` 4–30/1/12.

**Avanzados:** `edgeRoughnessPx` 0–6/.5/2; `shadowOpacity` 0–.4/.02/.18; `seed` paper-cutout-assemble-1. Fuente global; material propio sustituye relleno/borde/sombra genéricos para no presentar controles redundantes. Sin rasterizar el texto hasta necesitarlo.

**Algoritmo:** distribuir palabras con flex-wrap y hueco de `2*paperPaddingPx+8`; cada recorte es SVG/clipPath con 4 puntos por lado, irregularidad de semilla limitada a edgeRoughness. El texto ocupa capa propia, nunca se corta por el recorte. Para palabra i, `p=easeOutCubic((frame-i*wordDelayFrames)/settleFrames)`; y inicia a −.25×altura de palabra y llega 0; rotate parte de ±2×rotationMax hacia ángulo final sembrado ±rotationMax/2. Escala 1.08→1, sin rebote; sombra disminuye de .3 a shadowOpacity, sugiriendo aproximación al papel. Destino usa layout fijo, no fuerzas físicas.

**Prueba:** “Ideas con personalidad”, tres recortes simultáneos al final, cada uno diferente; roughness 0 rectifica bordes; rotationMax 0 elimina giros; semilla no cambia texto. En 9:16 las piezas saltan de línea sin solaparse. Comparar con Kinetic: si solo se ve una caja por vez, no cumple.

## 5. N-T03 — Estampación de tinta

**ID:** `ink-stamp-print`. **Archivo:** `src/remotion/templates/InkStampPrint.tsx`. **Familia:** táctil/editorial. **Prioridad:** media. **Complejidad:** media.

**Resultado:** el bloque se imprime en un solo golpe, con tinta ligeramente incompleta y un segundo registro opcional desplazado. La tinta permanece estable después de la impresión. Movimiento breve del bloque; no parpadeo continuo ni transición de borde a relleno.

**No redundancia:** FlickerOutlineFill alterna contorno/relleno; Glitch repite interferencia RGB. Stamp produce transferencia granular de tinta que se fija, con registro analógico opcional.

**Básicos:** `stampFrames` 3–18/1/6; `inkColor` #ff593c; `coverage` .6–1/.01/.9; `pressure` 0–1/.05/.6; `roughness` 0–1/.05/.35.

**Avanzados:** `registrationOffsetPx` 0–6/.5/1.5; `registrationColor` #202020; `seed` ink-stamp-print-1. Tipografía global, no borde/sombra genéricos al inicio; alpha permitido. Color global del texto queda oculto en favor de Color de tinta.

**Algoritmo:** renderizar texto en máscara alfa con fuente cargada. Generar textura de cobertura sembrada en una rejilla de 2–6 px: umbral define huecos permanentes por coverage; roughness controla variación de bordes, nunca cambia aleatoriamente cada frame. En primeros stampFrames, escala `1+.08*(1-pressure)*(1-p)` y alpha `smooth01(p)`; cobertura se estabiliza a p=1. Segunda máscara desplazada se dibuja debajo con alpha máximo .2 proporcional a offset, 0 significa desactivada. Masking confina tinta al glifo; fondo transparente fuera del texto.

**Prueba:** frame 12 y 90 son iguales a velocidad 1; coverage 1 y roughness 0 dan tinta sólida; offset 0 elimina segunda impresión. Se lee “HECHO A MANO” en 9:16 y 1:1. Si la textura desaparece o cambia al pausar, falla.

## 6. N-T04 — Onda de peso tipográfico

**ID:** `variable-weight-wave`. **Archivo:** `src/remotion/templates/VariableWeightWave.tsx`. **Familia:** tipografía expresiva. **Prioridad:** media. **Complejidad:** media/alta por fuentes.

**Resultado:** una onda recorre el texto haciendo que los trazos de cada letra se vuelvan más gruesos y regresen al peso base, sin trasladar ni rotar las letras. El efecto nace en la forma del glifo.

**No redundancia:** CleanModern cambia espaciado, FollowerGrow estira/rota, Apple mueve/enfoca. Esta propuesta interpola un eje variable de fuente, no scaleX ni otro zoom.

**Básicos:** fuente **Inter variable local**; `baseWeight` 100–700/50/400; `peakWeight` 400–900/50/850; `waveWidth` 1–8 letras/.5/3; `cycleSeconds` 1–6/.1/2.4. Validar peak≥base.

**Avanzados:** `direction` `left|right`, left; `holdLayout` true fijo inicialmente (no switch mientras no exista alternativa). Colores/borde compatibles solo si no ocultan variación; tamaño global permitido. Selector de fontWeight genérico oculto porque duplica baseWeight.

**Algoritmo:** verificar primero que `public/fonts/ttf/Inter-Var.ttf` contiene eje wght y registrar sus límites. Declarar font-face variable con rango correcto. Segmentar grafemas. Medir cada glifo al peso máximo y usar ese ancho como celda estable; centrarlo. `center=(t/cycleSeconds mod 1)*(n+2*waveWidth)-waveWidth`; `a=exp(-.5*((index-center)/waveWidth)^2)`; peso=`base+(peak-base)*a`; aplicar fontVariationSettings con wght. Reset de centro ocurre fuera de los extremos para minimizar discontinuidad; no declararlo loop perfecto hasta medir extremos.

**Prueba:** texto “MOTION” no cambia ancho total mientras la onda pasa; trazos realmente cambian de grosor. Base=peak elimina onda sin alterar layout. Si la fuente no soporta wght, pedir ayuda manual con evidencia del archivo; no simularlo con escala y conservar el nombre.

## 7. N-T05 — Ensamblado tipográfico en mosaico

**ID:** `glyph-tile-assemble`. **Archivo:** `src/remotion/templates/GlyphTileAssemble.tsx`. **Familia:** construcción geométrica. **Prioridad:** media. **Complejidad:** alta.

**Resultado:** fragmentos cuadrados de los glifos viajan desde posiciones próximas hasta construir el texto completo. Al final se sustituye por una capa nítida idéntica, sin costuras. Las piezas contienen la forma real de la letra, no caracteres aleatorios.

**No redundancia:** Scramble cambia símbolos; Glitch desplaza copias; Shape/Wipe usan una máscara que se abre. Mosaico transporta fragmentos espaciales del texto.

**Básicos:** `tileSizePx` 8–48/2/20; `scatterPx` 0–240/5/100; `assemblySeconds` .2–2/.05/.8; `order` `center|left|random`, center; `seed` glyph-tile-assemble-1 en avanzado.

**Algoritmo:** dibujar texto en canvas fuera de pantalla tras cargar fuente, guardar alfa y recortar tiles con alfa>0. Una lista por texto/fuente/tamaño/resolución. Cada tile tiene destino exacto y offset sembrado ±scatter; retardo de orden normalizado entre 0 y .35×assemblySeconds. Local p=`easeOutCubic((t-delay)/(.65*assemblySeconds))`. Dibujar trozo fuente en destino+offset×(1−p). Al llegar assemblySeconds, dibujar la textura completa o texto nítido con mismas métricas para eliminar seams. No trasladar cuadrados opacos de fondo.

**Límites:** máximo 1600 tiles full y 600 draft. Si texto largo supera máximo, incrementar tileSize efectivo al siguiente número par hasta cumplir, mostrar “Detalle ajustado por tamaño de texto” y usar mismo tamaño efectivo en preview full/render. No omitir tiles para acelerar, porque dejaría letras incompletas. Campos locales de color/gradiente por selección quedan inicialmente deshabilitados con descripción de estilo uniforme.

**Prueba:** al finalizar todos los píxeles de máscara corresponden al texto esperado; scatter 0 conserva aparición sin viajes; seed cambia origen, nunca forma final. Probar “DISEÑO” con alpha; a mitad deben verse fragmentos reconocibles distintos de Scramble. Si no converge la igualdad final, bloquear con máscara/frame y no entregar costuras.

## 8. N-B01 — Campo de puntos de semitono

**ID:** `halftone-wave-field`. **Archivo:** `src/remotion/backgrounds/HalftoneWaveField.tsx`. **Familia:** editorial geométrica. **Prioridad:** alta. **Complejidad:** baja/media.

**Resultado:** retícula de puntos anclados; una onda modifica su tamaño y su color, como impresión de semitono animada. Fondo discreto y legible, con centro opcionalmente despejado.

**No redundancia:** Moiré dibuja parejas de anillos, Retro dibuja líneas en perspectiva, Prism titila motas aleatorias. Aquí hay distribución regular de puntos y una onda continua de radios sin traslación global.

**Controles:** `spacingPx` 12–60/2/28; `radiusMinPx` .5–4/.5/1; `radiusMaxPx` 2–12/.5/6; `waveLengthPx` 80–600/10/240; `directionDegrees` 0–360/5/30; `centerClearPercent` 0–60/5/25. Colores A #5b6cff, B #b4f1e4; opacidad .55; base #101218 solo si opaco. No luces/blur/material.

**Algoritmo:** para cada centro (x,y) en rejilla, `s=(x*cosθ+y*sinθ)/waveLengthPx-t*.25`; a=`.5+.5*sin(2πs)`; radio mezcla min/max. Limitar radioMax a .45×spacing para evitar unión; si el usuario supera esa relación, mostrar límite efectivo. Clear center atenúa tamaño/alpha con máscara elíptica suave de ancho relativo indicado. No desplazar centros por semilla; semilla solo puede variar fase global.

**Prueba:** puntos permanecen en mismos centros; speed 0 congela radios; clear 60 deja lugar para texto; no aparecen anillos concéntricos ni túnel. Máximo de puntos 12000 full; a 4K ajustar resolución lógica proporcional para conservar escala relativa de patrón.

## 9. N-B02 — Recortes de papel en caída y asentamiento

**ID:** `paper-confetti-settle`. **Archivo:** `src/remotion/backgrounds/PaperConfettiSettle.tsx`. **Familia:** táctil. **Prioridad:** media. **Complejidad:** media.

**Resultado:** pequeños recortes rectangulares caen, giran sobre su propio eje mostrando anverso/reverso y se asientan brevemente en una franja inferior antes de desaparecer. Material mate con sombra corta, sin luz de neón.

**No redundancia:** FallingParticles y EmberRain tienen caída continua; CrystalDrift figuras/destellos. Esta propuesta exige giro con cambio de cara, trayectoria balística y estado de reposo inferior. Si se implementa como lluvia de polígonos recoloreados, no cumple.

**Controles:** `count` 20–160/1/64; `sizePx` 4–24/1/10; `gravity` .2–1.5/.05/.7; `wind` −.5–.5/.05/.1; `tumbleRate` 0–3/.1/1.2; `settleSeconds` 0–2/.1/.6. Colores A #ef735c, B #f4dda6; semilla; opacidad .75. Sin bloom ni material metálico.

**Algoritmo:** ciclo individual 5 s con fase sembrada. Tiempo de caída `fallSeconds=clamp(2/sqrt(gravity),1.6,4)`; durante caída y=`startY+(floorY-startY)*(age/fallSeconds)^2`, x=`initialX+wind*width*(age/fallSeconds)+sin(age*2+phase)*size`; giro=`age*tumbleRate*π`, anchura visible=max(.08,abs(cos(giro)))×size; signo del cos cambia color anverso/reverso. Destino floorY dentro del último 15% del cuadro. Durante settle, x/y constantes y giro desacelera hacia 0; después fade de .3 s antes de reiniciar fuera de pantalla. Duración ciclo efectivo=max(5,fallSeconds+settleSeconds+.3). Calcular desde edad modular, sin acumulación física.

**Prueba:** se observan cara/reverso y reposo; settle 0 elimina pausa, no salto aleatorio en medio; gravity aumenta aceleración sin cambiar count. En 9:16 las piezas reposan abajo, no en mitad del texto.

## 10. N-B03 — Partículas guiadas por un campo magnético

**ID:** `magnetic-dipole-stream`. **Archivo:** `src/remotion/backgrounds/MagneticDipoleStream.tsx`. **Familia:** orgánico/científico. **Prioridad:** media. **Complejidad:** alta.

**Resultado:** partículas recorren arcos de un polo a otro, formando un campo dipolar visible por puntos móviles, con dos centros laterales y espacio central controlable. No dibujar líneas de conexión ni HUD.

**No redundancia:** Tech/Constellation conectan nodos; Vortex/Tunnel gira alrededor de un centro; ElectroSilk dibuja cintas. Aquí las partículas siguen trayectorias entre dos polos separados, sin estructura de red ni cintas.

**Controles:** `count` 60–360/10/160; `poleSeparationPercent` 20–70/5/45; `arcHeightPercent` 10–60/5/35; `travelSeconds` 1–8/.25/4; `particleRadiusPx` 1–6/.5/2; `trailCopies` 0–4/1/2 (avanzado). A #00c9a7, B #bdefff; opacidad .65, base #0c1820 si opaco.

**Algoritmo v1 deliberadamente acotado:** aproximación gráfica de campo, no simulación científica. Crear 12 trayectorias Bézier cúbicas en coordenadas relativas entre polos `(0.5−d/2,.5)` y `(0.5+d/2,.5)`. Seis arcos por arriba/seis por abajo; control1 a x del polo 1 + .1, control2 a x del polo 2 − .1; altura por arco `h=(k+1)/6*arcHeightPercent`. Muestrear 128 puntos por curva y tabla de longitud acumulada una vez por geometría. Cada partícula elige curva e inicio por semilla; avanza por longitud a velocidad constante. Opacidad sin²(πu) reduce visibilidad en polos y oculta reinicio. TrailCopies dibuja posiciones anteriores de misma trayectoria con alpha decreciente.

**Prueba:** dos polos distintos, ninguna red; modificar separación mueve polos, no count ni tiempo de viaje. Partícula no acelera en curvas por parametrización desigual. Mismo frame reproducible; 9:16 usa lado menor para escala. Si Luna no consigue velocidad uniforme, reportar tabla de longitudes y caso antes de sustituir por órbita central.

## 11. N-B04 — Gotas que imprimen tinta

**ID:** `ink-droplet-bloom`. **Archivo:** `src/remotion/backgrounds/InkDropletBloom.tsx`. **Familia:** táctil/orgánica. **Prioridad:** media. **Complejidad:** media.

**Resultado:** gotas aparecen en posiciones sembradas, se expanden en pequeñas manchas de borde irregular y se absorben lentamente. Tras caer quedan fijas, como tinta sobre papel. La acción es aparición→expansión→absorción; no nebulosa flotante.

**No redundancia:** MetaballReactor mueve grandes gradientes con mezcla luminosa; Nebula desplaza nubes. Este fondo usa impactos discretos, siluetas delimitadas, crecimiento local y desaparición por absorción sin viaje posterior ni adición de luz.

**Controles:** `dropletCount` 8–60/1/24; `radiusPx` 12–90/2/36; `spreadSeconds` .2–1.5/.1/.6; `absorbSeconds` 1–6/.25/3; `edgeRoughness` 0–.35/.01/.12; `centerClearPercent` 0–60/5/30. A #3157a1, B #d17054; opacidad .35; base #eee4d1 si opaco. Sin blur genérico.

**Algoritmo:** cada gota tiene centro fijo, edad con fase sembrada, radio objetivo y 24 muestras angulares de contorno. Radio en ángulo j=`targetRadius*(1+roughness*(random(seed:i:j)-.5)*2)*smooth01(age/spreadSeconds)`. Contorno suave mediante cuadráticas, relleno source-over con alpha .6×groupOpacity. Después de spread, alpha decae con `1-smooth01((age-spread)/absorb)`. Ciclo=spread+absorb+.5; en intervalo final no dibujar, luego reiniciar misma gota. Clear center rechaza candidatos dentro de elipse sin cambiar semilla continuamente; máximo 20 intentos por gota, fallback en borde exterior.

**Prueba:** manchas no se desplazan después de aparecer; roughness 0 produce círculos; cambios de absorption no cambian silueta; alpha export no contiene papel si transparencia activa. Debe distinguirse de nubes difuminadas en comparación lateral con Metaball.

## 12. N-B05 — Espuma celular de burbujas planas

**ID:** `cellular-foam-field`. **Archivo:** `src/remotion/backgrounds/CellularFoamField.tsx`. **Familia:** orgánica geométrica. **Prioridad:** media. **Complejidad:** alta.

**Resultado:** un campo de pequeñas burbujas poligonales de pared fina se deforma lentamente, semejante a espuma plana. Cada celda tiene un núcleo mínimo y un límite compartido con sus vecinas; algunas celdas se expanden mientras otras se comprimen. Espacio negativo prioritario para el texto.

**No redundancia:** LightOrbs/PrismSphere son círculos/esferas libres; HexWave y HexRelief son superficies hexagonales regulares con relieve; redes dibujan conexiones entre puntos. Espuma es un mosaico celular irregular, plano y deformable, sin altura ni partículas luminosas orbitando. La versión final debe conservar esa topología visual.

**Controles:** `cellCount` 16–80/1/40; `wallWidthPx` .5–3/.25/1; `driftPercent` 0–4/.25/1.5; `breathSeconds` 2–10/.5/6; `coreRadiusPx` 0–3/.5/1; `centerClearPercent` 0–60/5/20. Pared #8ab5a8, núcleo #e5dbbd; opacidad .45; base #101b18 si opaco. Sin blur/material/luces.

**Algoritmo sin dependencia extra:** generar sitios en rejilla perturbada con semilla, cantidad exacta cellCount. Para cada frame, sitio i se desplaza sinusoidalmente en X/Y con fase propia y amplitud=ladoMenor×driftPercent/100. Calcular celda de Voronoi recortando rectángulo del lienzo por semiplanos de bisectrices respecto a los otros sitios; máximo 80 sitios permite versión acotada. Dibujar paredes una vez o con mitad de alpha por borde para no duplicar intensidad; núcleo en sitio. Margen de sitios exteriores hasta 10% fuera para que los bordes del lienzo no parezcan marco artificial. Clear center atenúa trazos/núcleos, no elimina sitios alterando toda topología.

**Límites:** si 80 sitios es lento, implementar modo draft 24 sitios y full valor solicitado; no sustituir por hexágonos regulares. Medir geometría primero a 40. Si no alcanza interacción aceptable, solicitar ayuda con timings; no instalar otra biblioteca sin explicar necesidad y alcance.

**Prueba:** celdas no se solapan; paredes compartidas coinciden; drift 0 deja estructura estática; coreRadius 0 elimina núcleos sin eliminar paredes. Comparar con HexRelief y LightOrbs: no tiene relieve ni círculos independientes.

## 13. Matriz de diferenciación final

| Nuevo | Más cercano existente | Diferencia obligatoria, no cosmética |
|---|---|---|
| Word Highlight | Viral / Kinetic | Frase fija completa; énfasis recorre palabras sin reemplazo |
| Paper Cutout | Kinetic / BubblePop | Recortes irregulares simultáneos, postura final imperfecta y material mate |
| Ink Stamp | FlickerOutline / Glitch | Tinta granular que se fija tras un golpe; no bucle de interferencia |
| Variable Weight | CleanModern / FollowerGrow | Eje real de peso del glifo; celdas fijas sin escala/traslación |
| Glyph Tile | Scramble / Wipe | Fragmentos espaciales reales ensamblan la máscara del texto |
| Halftone | Moiré / RetroGrid | Puntos anclados con onda de radio; sin anillos/líneas perspectivadas |
| Paper Confetti | Falling / CrystalDrift | Cambio de cara, aceleración y reposo; no lluvia genérica recoloreada |
| Magnetic Dipole | Tech / Vortex / Silk | Dos polos y trayectorias de partículas, sin red ni cintas |
| Ink Droplet | Metaball / Nebula | Impactos fijos delimitados que se absorben; sin nubes viajando |
| Cellular Foam | Hex / Orbs / Network | Mosaico Voronoi plano irregular deformable con paredes compartidas |

No basta diferencia de nombre, color, tamaño, velocidad o cantidad. Si el mecanismo obligatorio no aparece, la ficha no está completada y no se cuenta como uno de los cinco nuevos.

## 14. Orden, pruebas y entrega por novedad

Crear `tests/editor/new-effect-options.test.ts` con defaults, límites, serialization y selección de los diez IDs. Crear pruebas de geometría puras en `tests/editor/new-effect-geometry.test.ts` para: segmentación/highlight, máscara de tiles, longitud de Bézier y partición de celdas. No hacer snapshots enormes de píxeles como única prueba.

Cada ficha adjunta clip de 1080p 30 fps, cinco fotogramas, props JSON y nombre de fuente. Texto: “Crea algo distinto”, “¡Diseño con carácter! 👩🏽‍💻”, dos líneas y vacío. Fondos: sin texto primero, después texto blanco/negro según contraste. Tres relaciones de aspecto; MOV alpha de una muestra por técnica (DOM, SVG/canvas, tipografía variable). Buscar frames fuera de orden y comparar los mismos frames repetidos.

Pruebas mínimas de funciones:

- Highlight: cinco palabras con .4 s producen intervalos [0,.4), [.4,.8), [.8,1.2), [1.2,1.6), [1.6,2); intervalos manuales solapados fallan validación.
- Tiles: todos los recortes de alfa no vacío tienen destino y nunca superan presupuesto; frame final recompone máscara original sin huecos.
- Dipolo: tabla de longitud estrictamente creciente salvo segmentos degenerados que se omiten; muestreo u=0/1 devuelve polos; ningún NaN si separación mínima.
- Voronoi: con dos sitios (25,50)/(75,50) en lienzo 100×100 la división es x=50; con uno la celda es lienzo completo; pruebas geométricas pueden usar 1/2 sitios aunque UI mínimo sea 16.
- Seed: misma entrada devuelve mismas posiciones y contornos; modificar seed no modifica texto final ni count.

Si una ficha se bloquea, aplicar el reporte del plan principal con evidencia específica del mecanismo. Un avance parcial no se presenta como efecto terminado. La implementación de estos diez efectos solo empieza después de aprobar las fases de integridad, UI y catálogo actual.

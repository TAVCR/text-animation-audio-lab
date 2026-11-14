# Stellar Depth Field

## Objetivo

Crear el fondo `Stellar Depth Field` (`stellar-depth-field`): un entorno galáctico procedural y determinista con profundidad tridimensional perceptible en imagen fija y reforzada por perspectiva, parallax, movimiento de cámara y señales atmosféricas.

El resultado debe sentirse cinematográfico, astronómico y elegante. No debe parecer nieve, confeti, un starfield plano, un screensaver, una textura ampliada ni hyperspace permanente.

## Arquitectura

Se utilizará un renderer Canvas 2D especializado con simulación 2.5D, separado de las ramas genéricas de `ParticleBackground`. Three.js no aporta una ventaja necesaria para este efecto y elevaría el costo de SSR, pruebas y exportación.

El renderer tendrá dos unidades:

- un módulo matemático puro responsable de generación seeded, movimiento, reciclado, transformación de cámara, proyección, profundidad de campo, color e intensidad;
- un componente Canvas responsable de precalcular partículas estáticas, solicitar el estado de cada fotograma y dibujarlo por capas.

El fotograma N se calculará directamente desde `seed + índice + frame + props`. No habrá acumulación temporal ni `Math.random()` durante render.

## Modelo espacial

Cada partícula tendrá coordenadas conceptuales `x`, `y`, `z` dentro de un volumen continuo. La proyección se calculará respecto del centro del lienzo y una distancia focal configurable:

- Z altera posición proyectada, escala, desplazamiento aparente, halo, blur, brillo y opacidad;
- objetos cercanos responden más al movimiento de cámara y se proyectan mayores;
- objetos lejanos son menores, más estables y reciben niebla de profundidad;
- el aspect ratio se incorpora antes de proyectar para conservar cobertura en 16:9, 9:16 y 1:1.

La distribución Z admite sesgo `Uniforme`, `Lejana`, `Equilibrada` y `Cercana`. Aumentar densidad preserva las partículas existentes porque cada índice conserva su semilla.

## Poblaciones visuales

La escena combina tres poblaciones derivadas del mismo sistema determinista:

1. Estrellas lejanas pequeñas y mayormente nítidas, con poco halo y movimiento reducido.
2. Estrellas medias con variación de tamaño, temperatura, brillo y centelleo individual.
3. Polvo cósmico cercano, suave y escaso, con mayor parallax y desenfoque.

Las partículas cercanas estarán limitadas para evitar círculos gigantes u opacos. La profundidad se percibirá por la relación conjunta entre tamaño, movimiento, nitidez, contraste y oclusión visual, no por una simple etiqueta de capa.

## Movimiento y cámara

`Movimiento espacial` ofrecerá:

- `Deriva`;
- `Avance`;
- `Órbita suave`;
- `Deriva + Avance`.

El default será `Deriva + Avance` con valores lentos. El ángulo de deriva controla el componente lateral; `Velocidad Z` aparece únicamente en modos con avance. El recorrido Z utiliza wrapping determinista. El ciclo de reciclado modifica la fase de X/Y mediante hashes derivados para evitar reapariciones mecánicas sin introducir estado mutable.

La cámara admite movimiento general, balanceo periódico y rotación espacial gradual. `Parallax` escala la respuesta de cada profundidad sin alterar el volumen ni el conteo. `Estelas` aparece solo con avance y elonga moderadamente las partículas según su velocidad proyectada.

## Profundidad e iluminación

- `Profundidad` controla la extensión Z del volumen.
- `Perspectiva` controla la distancia focal y la separación visual near/far.
- `Profundidad de campo` calcula blur por distancia al plano focal.
- `Plano de enfoque` aparece cuando DOF es mayor que cero.
- `Niebla de profundidad` reduce contraste y mezcla partículas lejanas con el ambiente sin ocultarlas.
- `Brillo`, `Halo` y `Centelleo` actúan separadamente.

El centelleo usa fase, frecuencia y amplitud propias por estrella. Con valor cero, el brillo permanece estable salvo por otras señales espaciales.

## Color

`Color` ofrecerá:

- `Monocromático`, con Color A;
- `Bicolor`, con Color A y Color B;
- `Temperatura estelar`, con `Variación térmica`;
- `Paleta personalizada`, usando Color A, Color B y color de nebulosa.

La temperatura estelar interpolará una paleta restringida de azul frío, blanco, amarillo suave y naranja tenue. No se generará arcoíris.

## Ambiente

`Polvo` controla la población secundaria cercana; cero la desactiva.

`Nebulosa` controla una capa procedural de gradientes atmosféricos amplios, animados y seeded. Cuando sea mayor que cero aparecen:

- `Escala nebulosa`;
- `Velocidad nebulosa`;
- `Intensidad nebulosa`;
- `Color nebulosa`.

La nebulosa modula el ambiente detrás de las estrellas y no reemplaza el fondo base global ni tapa el texto.

## Inspector

Los controles aparecerán únicamente para `stellar-depth-field` y escribirán directamente en `AnimationContext`. Se agruparán visualmente en:

- Campo: Densidad, Distribución, Tamaño, Variación de tamaño, Profundidad, Perspectiva.
- Movimiento: Movimiento espacial, Velocidad, Ángulo de deriva, Parallax, Movimiento de cámara, Balanceo, Rotación espacial, Velocidad Z y Estelas condicionales.
- Luz: Brillo, Halo, Centelleo, Color y controles cromáticos condicionales.
- Profundidad: Profundidad de campo, Plano de enfoque condicional y Niebla de profundidad.
- Ambiente: Polvo, Nebulosa y controles de nebulosa condicionales.
- Sistema: Seed.

Todos los valores numéricos ajustables usarán sliders compatibles con el reset global por doble clic. Los defaults tendrán una única fuente canónica compartida por estado e Inspector.

## Defaults visuales

La primera selección debe producir inmediatamente:

- densidad media-alta con mayor proporción de estrellas lejanas;
- profundidad considerable y perspectiva contenida;
- parallax perceptible;
- deriva y avance lentos;
- halo moderado y centelleo bajo;
- DOF ligero con región media enfocada;
- polvo discreto;
- temperatura estelar natural;
- nebulosa azul-violeta extremadamente sutil.

## Integración y persistencia

El ID se añadirá al tipo `ParticlePreset`, catálogo y renderer principal. Las props específicas se incorporarán a los defaults, selección por dominio, persistencia de presets, `MainComposition` y renderer.

Los presets antiguos sin campos Stellar recibirán defaults. El fondo base global seguirá independiente. Ningún otro background mostrará controles Stellar ni cambiará su salida.

La miniatura utilizará un fotograma que muestre simultáneamente estrellas near/mid/far, variación de tamaño, temperatura, halo y atmósfera.

## Rendimiento

- Canvas único en lugar de componentes React por partícula.
- Datos seeded estáticos precalculados con memoización.
- Sin sorting completo por frame; se dibujarán poblaciones o buckets de profundidad en orden estable.
- Blur cuantizado y limitado para reducir cambios costosos de estado Canvas.
- Densidad máxima acotada según resolución y sin reorganizar índices existentes.
- Nebulosa limitada a pocos gradientes amplios.

## Verificación automática

Las pruebas cubrirán:

- determinismo por seed/props/frame y estabilidad fuera de secuencia;
- seed diferente produce otro campo;
- proyección near/mid/far y respuesta de perspectiva;
- mayor parallax aparente en partículas cercanas;
- DOF mínimo en foco y creciente fuera de foco;
- centelleo estable en cero y asincrónico al activarse;
- diferencias reales entre los cuatro modos de movimiento;
- wrapping Z determinista;
- cobertura coherente en 16:9, 9:16 y 1:1;
- controles exclusivos, defaults, actualización de props, controles condicionales y reset;
- persistencia JSON-safe y restauración de presets;
- transferencia Inspector → AnimationContext → MainComposition → StellarDepthField;
- compatibilidad de catálogo y ausencia de cambios en otros fondos.

Después se ejecutarán tests dirigidos, `npm run test:editor`, TypeScript, ESLint y build.

## QA visual

La implementación automática quedará lista, pero no cerrada definitivamente, hasta validar manualmente:

- separación clara near/mid/far;
- volumen y parallax convincentes;
- proximidad de partículas cercanas;
- profundidad de partículas lejanas;
- ayuda visual del DOF;
- identidad galáctica, no snowfall;
- legibilidad del texto;
- movimiento cinematográfico y estable;
- conservación de profundidad en 9:16.

Si los controles opcionales de estelas, nebulosa o paleta personalizada no producen una diferencia significativa o comprometen el rendimiento, se omitirán con justificación explícita; no se sustituirán silenciosamente.

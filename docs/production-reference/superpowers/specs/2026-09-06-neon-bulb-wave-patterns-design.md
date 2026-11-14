# Neon Bulb Wave Patterns

## Objetivo

Extender exclusivamente el fondo `Neon Bulb Alternation` para que sus bombillas fijas puedan formar patrones luminosos animados, desde variaciones orgánicas irregulares hasta ondas espaciales claramente coordinadas. El usuario podrá emplear un patrón único o combinar dos patrones diferentes.

## Alcance

- Se conservan la retícula, las posiciones fijas de las bombillas, los dos colores configurables y el fondo difuminado existentes.
- Solo se modulan el color, el brillo y el halo de cada bombilla.
- No se desplazan las bombillas ni se añaden partículas.
- La matemática será determinista: el mismo estado y fotograma producirán el mismo resultado en preview y exportación.
- Los controles nuevos aparecerán únicamente con `neon-bulb-alternation` seleccionado.

## Patrones

El selector `Patrón principal` ofrecerá:

1. `Aleatorio orgánico`: conserva la asincronía individual actual.
2. `Onda horizontal`: el frente luminoso se desplaza entre izquierda y derecha.
3. `Onda vertical`: el frente se desplaza entre arriba y abajo.
4. `Diagonal descendente`: onda alineada de la esquina superior izquierda a la inferior derecha.
5. `Diagonal ascendente`: onda alineada de la esquina inferior izquierda a la superior derecha.
6. `Radial`: anillos que nacen o convergen alrededor de un centro configurable.
7. `Espiral`: fase angular y radial combinada alrededor de un centro configurable.
8. `Barrido angular`: frente lineal con ángulo libre.

Un switch `Combinar segundo patrón` habilitará un selector `Patrón secundario` y el slider `Mezcla de patrones`. El patrón secundario no podrá coincidir con el principal. La mezcla interpolará las señales luminosas de ambos patrones; 0 % dará dominio completo al principal y 100 % al secundario.

## Controles

Los controles comunes serán:

- `Patrón principal`.
- `Combinar segundo patrón`.
- `Patrón secundario`, visible solo al combinar.
- `Mezcla de patrones`, visible solo al combinar.
- `Homogeneidad`: mezcla entre la fase orgánica independiente actual y la señal espacial coordinada. En 0, cada bombilla se comporta de forma mayormente independiente; en 100, el patrón es continuo y claramente reconocible.
- `Longitud de onda`: determina la separación entre frentes y, por tanto, cuántas ondas atraviesan el lienzo.
- `Velocidad del patrón`: controla el avance temporal de las ondas sin mover las bombillas.
- `Contraste luminoso`: controla la diferencia entre las zonas encendidas y apagadas.
- `Suavidad`: transforma los frentes entre definidos y difusos.
- `Dirección inversa`: invierte exclusivamente el sentido temporal del viaje.

Controles condicionales:

- `Ángulo` aparece cuando el patrón principal o secundario activo es `Barrido angular`.
- `Centro X` y `Centro Y` aparecen cuando algún patrón activo es `Radial` o `Espiral`.

Todos los parámetros numéricos usarán sliders existentes, tendrán etiquetas accesibles y recuperarán su valor predeterminado con el comportamiento global de doble clic.

## Modelo matemático

Cada punto de la retícula se normalizará respecto del ancho y alto del lienzo. Cada patrón producirá una señal periódica `0..1` a partir de posición, tiempo, longitud de onda, velocidad y dirección:

- horizontal y vertical usan una coordenada cartesiana;
- las diagonales usan la suma o diferencia normalizada de ambas coordenadas;
- radial usa la distancia al centro;
- espiral combina distancia y ángulo polar;
- barrido angular proyecta la posición sobre un vector definido por el ángulo;
- orgánico usa la fase y frecuencia deterministas por celda ya existentes.

Cuando haya dos patrones, sus señales se interpolarán según `Mezcla de patrones`. Después, `Homogeneidad` interpolará el resultado espacial con la señal orgánica por celda. `Suavidad` ajustará la curva de la onda y `Contraste luminoso` ampliará o reducirá su rango. La señal final alimentará conjuntamente la interpolación entre Color A/Color B, la intensidad y el halo.

## Estado e integración

Las nuevas opciones se incorporarán al tipo canónico de propiedades de animación, sus defaults y la selección/persistencia de presets existente. `MainComposition` las transferirá a `ParticleBackground`, que delegará el cálculo puro al módulo `neonBulbAlternation.ts`.

No se creará estado local duradero en el Inspector. Los cambios escribirán directamente en la autoridad compartida de animación para sobrevivir cambios de pestaña, presets, preview y exportación.

## Compatibilidad

Los proyectos o presets guardados sin estos campos usarán los defaults nuevos. El patrón predeterminado será `Aleatorio orgánico`, con la combinación desactivada, para conservar visualmente el comportamiento existente.

Ningún otro fondo recibirá estos controles ni cambiará su renderizado.

## Pruebas

La cobertura dirigida demostrará:

- estabilidad determinista de cada patrón;
- variación temporal y dirección inversa;
- diferencias espaciales representativas para horizontal, vertical, diagonales, radial, espiral y barrido angular;
- homogeneidad 0 frente a 100;
- combinación de dos patrones y extremos 0/100 de la mezcla;
- controles condicionales del Inspector;
- lectura, escritura y reset de defaults;
- guardado y restauración mediante presets;
- transferencia real Inspector → contexto → `MainComposition` → `ParticleBackground`;
- ausencia de controles y cambios de comportamiento en otros fondos.

Tras las pruebas dirigidas se ejecutarán TypeScript y las verificaciones generales que correspondan al flujo vigente del proyecto.

# Neon Bulb Nebula Lighting

## Objetivo

Extender únicamente `Neon Bulb Alternation` con iluminación nebulosa sobre una retícula fija de bombillas.

## Contrato

Las bombillas conservarán sus posiciones y alternancia bicolor determinista. Se añadirá una modulación espacial suave de halo, color e intensidad, con fases no sincronizadas y controles específicos de amplitud, escala y velocidad. El fondo base global seguirá separado.

## Integración y verificación

La nebulosa usará la misma matemática determinista en preview y render, sin `Math.random()`, partículas móviles ni dependencias nuevas. Se probarán estabilidad espacial, variación temporal, asincronía y controles condicionales sin afectar otros backgrounds.

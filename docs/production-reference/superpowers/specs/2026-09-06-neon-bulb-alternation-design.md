# Neon Bulb Alternation

## Objetivo

Reemplazar las partículas de `paper-confetti-settle` por una retícula regular de puntos luminosos tipo bombilla neón, conservando el fondo base configurable.

## Comportamiento

- Los puntos ocupan una retícula estable y determinista.
- Cada punto tiene una fase y frecuencia pseudoaleatorias, reproducibles entre preview y render.
- Dos colores configurables se alternan de forma independiente y no sincronizada.
- El brillo oscila entre ambos colores; no existe caída ni asentamiento de partículas.
- Tamaño, cantidad, brillo y velocidad son controles específicos de la plantilla.
- El fondo se controla por separado mediante los controles globales existentes.

## Integración

- La plantilla conserva el ID interno `paper-confetti-settle` para evitar migraciones de presets.
- El nombre visible será `Neon Bulb Alternation`.
- Se reutilizan los componentes de formulario y la fuente de estado actuales.
- Los controles específicos aparecen únicamente al seleccionar esta plantilla.
- Preview y render consumen la misma función determinista.

## Verificación

- Pruebas unitarias de fases, alternancia y determinismo.
- Prueba de Inspector para visibilidad condicional, defaults y actualización real de props.
- Prueba de contrato del catálogo y del fondo.
- TypeScript y suite dirigida antes de la validación manual.

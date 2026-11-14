# Dual Text Layers

## Objetivo

Añadir una nueva opción de Texto con dos capas independientes y configurables, manteniendo intacto el flujo de una sola capa cuando la segunda esté desactivada.

## Contrato

Cada capa tendrá contenido, plantilla, fuente, tamaño, posición X, posición Y, color, opacidad, relleno, borde, grosor de borde, sombra, duración y velocidad propios. El orden visual de las capas será explícito y cada capa conservará sus valores en presets. La capa secundaria será opcional.

## Integración y verificación

Se reutilizarán las plantillas y controles existentes mediante dos contextos de props claramente separados. Preview y render consumirán el mismo modelo. Se probará aislamiento entre capas, persistencia, reset, orden de composición y compatibilidad con documentos de una sola capa.

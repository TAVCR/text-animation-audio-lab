# Dual Text Layers — Plan Arquitectónico

## 1. Modelo elegido

Mantener las props actuales como capa primaria compatible y añadir `secondaryTextLayer` como estructura explícita opcional. No se crearán dos `AnimationContext` ni un segundo historial. La normalización de documentos antiguos construirá una capa secundaria desactivada.

```ts
type TextLayer = {
  enabled: boolean;
  text: string;
  animationStyle: AnimationStyle;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  positionX: number;
  positionY: number;
  color: string;
  opacity: number;
  enableFill: boolean;
  enableBorder: boolean;
  borderColor: string;
  borderWidth: number;
  enableShadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  motionDurationFrames: number;
  speed: number;
  templateOptions: Record<string, unknown>;
};
```

La primaria usará un adaptador desde las props existentes; la secundaria usará `secondaryTextLayer`. Así se preservan F1/F3/F5 y el comportamiento de documentos actuales.

## 2. Archivos y subsistemas afectados

- `src/lib/types/animation.ts`: tipo `TextLayer`, props secundarias y estado de capa activa.
- `src/lib/AnimationContext.tsx`: defaults, update por capa, reset, persistencia y normalización.
- `src/lib/editor/selection.ts`: selección de template y aislamiento de opciones.
- `src/remotion/MainComposition.tsx`: composición de dos instancias del renderer.
- `src/remotion/Root.tsx` y `src/lib/videoConfig.ts`: duración máxima de capas habilitadas.
- `src/components/inspector/tabs/TextBasicTab.tsx`: selector de capa y controles de la capa activa.
- `src/lib/editor/catalog.ts`: reutilización del registry actual, sin duplicarlo.
- `tests/editor/dual-text-layers.test.tsx` y pruebas de duración/migración: contrato integrado.

## 3. Contrato de capa

Los campos de contenido, template, fuente, peso, tamaño, posición X/Y, color, opacidad, relleno, borde, grosor, sombra, duración, velocidad y `templateOptions` pertenecen a cada capa. Fondo, resolución, relación de aspecto y batch siguen siendo globales. `activeLayerId` es estado de UI y no afecta el render.

## 4. Duración

La normalización calculará cada capa con el resolvedor existente. Si la secundaria está desactivada, la duración será la actual. Si está activa:

`compositionDuration = max(primaryDuration, secondaryDuration)`.

La capa más corta permanecerá en su estado final. Batch sustituirá solo el texto de la primaria.

## 5. Composición y orden

Añadir `layerOrder: 'primary-front' | 'secondary-front'`. El compositor renderizará fondo, capa inferior y capa superior mediante el mismo adaptador de template. El orden se decidirá por `layerOrder`, no por orden accidental de JSX.

## 6. Inspector

El panel Texto mostrará `CAPA 1` y `CAPA 2`, un switch `Activar capa 2`, y el selector `Capa delante`. Solo se editan los controles de la capa activa. Cada capa tendrá selector de template, texto, tipografía, X, Y, apariencia, velocidad, duración y opciones específicas. La UI indicará siempre la capa activa.

## 7. Presets y reset

El preset completo conservará primaria, secundaria, `layerOrder` y enabled. Un preset antiguo se carga como primaria con secundaria desactivada. `Reset de capa` solo restaura la capa activa; el reset global conserva su semántica actual y restaura ambas capas.

## 8. Persistencia y migración

Se extenderá el payload JSON existente con una versión opcional de `secondaryTextLayer`; no se serializan funciones, DOM ni handles. La lectura de documentos sin esa propiedad crea defaults secundarios. Las opciones específicas se guardan dentro de la capa correspondiente y se normalizan contra el registry.

## 9. History / undo

Todos los cambios pasan por `setDocumentProps` y el history existente. El snapshot incluye ambas capas; los sliders se agrupan con las mismas transacciones actuales. Activar/desactivar, cambiar X/Y, template y orden generan snapshots normales.

## 10. Batch

Una línea de batch reemplaza únicamente el contenido de la capa primaria. La secundaria y su configuración permanecen intactas durante el lote.

## 11. Matriz de pruebas

- editar secundaria no cambia primaria;
- cambiar template secundaria no cambia primaria;
- reset secundaria deja primaria intacta;
- X/Y de cada capa llegan a su renderer;
- preset restaura ambas capas y orden;
- documento single-layer normaliza con secundaria desactivada;
- desactivar secundaria produce el render primario equivalente;
- desactivar/activar conserva configuración secundaria;
- duración usa 180/90 → 180 y 60/150 → 150;
- template options permanecen aisladas;
- primary-front y secondary-front respetan orden;
- batch reemplaza primaria solamente.

## 12. Fases y criterio PASS

1. Modelo y normalización: tipos compilados, documento antiguo compatible.
2. Renderer dual: ambas capas reciben props propias y orden explícito.
3. Inspector: selector, switch, X/Y y controles aislados.
4. Duración: max de capas habilitadas y permanencia final.
5. Presets/history/persistencia: round-trip JSON y undo/redo.
6. Integración: tests dirigidos, TypeScript, editor suite y QA visual.

## 13. Riesgos

- HIGH — cambiar `AnimationProps`: mitigación mediante adaptador primario y normalización sin big-bang.
- HIGH — duración dinámica: pruebas de `Root.tsx` y `videoConfig.ts` antes de activar renderer dual.
- MEDIUM — opciones específicas: `templateOptions` por capa y registry compartido.
- MEDIUM — presets/history: payload versionable y round-trip integrado.
- MEDIUM — Inspector: una sola capa activa visible por vez.
- LOW — batch: contrato explícito de primaria solamente.
- LOW — background/export: no modificar sus props ni autoridad.

## 14. Decisiones fijadas

- Dos capas máximo en V1.
- Segunda capa opcional.
- X/Y independientes por capa.
- Una plantilla independiente por capa usando el registry existente.
- Un preset de composición completo.
- Sin offsets, timeline visual, blending modes, máscaras ni audio sync.

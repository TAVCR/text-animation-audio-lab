# UI y catálogo de animaciones — Implementation Plan

> Para Luna: documento de planificación, todavía no autorizado para implementación. Cuando el usuario autorice ejecutar, usar `executing-plans` para trabajar tarea por tarea; prevalecen las instrucciones del usuario y el protocolo de parada de este documento. No crear tareas adicionales ni cambiar de modelo automáticamente.

**Objetivo:** permitir que una persona elija, entienda, personalice y exporte una animación sin encontrar controles que no funcionan, perder su trabajo al navegar ni necesitar conocer propiedades internas.

**Arquitectura:** conservar Next.js, React y Remotion. Separar estado del documento, estado de edición y estado de exportación; declarar capacidades por plantilla y mantener adaptadores para los presets anteriores. Extraer el inspector por responsabilidad, sin reescribir simultáneamente los motores visuales.

**Tecnologías observadas:** Next.js 14.2.15, React 18, TypeScript 5, Remotion 4.0.520, Three.js 0.168 y Tailwind 3.4. No se propone actualizar dependencias principales.

**Fecha de auditoría:** 5 de septiembre de 2026. **Raíz:** `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION`.

## 1. Documentos que forman este plan

Leer en este orden; cada ficha es una especificación, no una sugerencia abierta:

1. Este documento: evidencia, arquitectura, fases, verificaciones y protocolo de Luna.
2. [Auditoría de las 27 plantillas](2026-09-05-ui-textos.md): controles permitidos, ausentes, mejoras y prueba individual.
3. [Auditoría de los 34 fondos](2026-09-05-ui-fondos.md): controles semánticos, desacoplamiento y redundancias.
4. [Diez efectos nuevos](2026-09-05-ui-nuevos-efectos.md): cinco textos y cinco fondos, fuentes, diferencias, algoritmos y aceptación.

## 2. Restricciones globales

- Esta entrega solo añade documentación. No ejecutar sus tareas de implementación durante la planificación.
- Preservar IDs de los 27 textos y 34 fondos existentes. Renombrar etiquetas visibles no renombra IDs almacenados.
- No borrar `NEW APPROACH`, `.backup`, renders anteriores ni archivos que parezcan duplicados. Hay código activo importado desde `NEW APPROACH`.
- Mantener 30 fps, 16:9/9:16/1:1 y 1080p/1440p/4K; conservar 8K como experimental, sin prometer rendimiento.
- No integrar servicios de IA, transcripción, audio reactivo, cuentas o almacenamiento remoto como parte de este plan.
- No añadir controles si no existe un consumidor visual real. Ocultar los no aplicables; deshabilitar solamente los temporalmente imposibles, con explicación.
- Preservar la apariencia previa en la fase de organización. Cambios visuales deliberados se implementan después, por plantilla, con antes/después.
- Todo valor tiene etiqueta, unidad, valor actual, límite y restablecimiento local. No usar `N`, `O`, `S`, `ZS`, `ZE` como únicas etiquetas.
- Al detectar atasco, Luna detiene toda ejecución y pide ayuda manual. No continuar otras fases para disimular el bloqueo.

## 3. Alcance y calidad de la evidencia

Se inspeccionaron el árbol de componentes activo, registro de plantillas, propiedades consumidas, composición principal, funciones de tiempo, persistencia y API de exportación. Se abrió la aplicación y se examinaron las pestañas Global, Text, Particles y Export mediante accesibilidad y una captura de la interfaz. Se reprodujo el reinicio del modo de exportación al cambiar de pestaña. No se renderizaron los 61 elementos ni se comprobó visualmente cada combinación: las fichas distinguen inferencias del código de pruebas pendientes.

La extracción de propiedades por sintaxis ayuda a localizar incompatibilidades, pero no prueba por sí sola que una propiedad altere todos los píxeles esperados: hay que seguir funciones auxiliares, condiciones y adaptadores. La fase F0 completa esa trazabilidad y las pruebas por fotograma, antes de declarar eliminado un control.

El chequeo de TypeScript `node node_modules/typescript/bin/tsc --noEmit --incremental false` pasó durante la auditoría; `node node_modules/next/dist/bin/next lint` también pasó sin advertencias. No equivale a validación funcional ni de exportación. No se ejecutó build de producción en esta planificación.

La carpeta auditada no es un repositorio Git detectable (`git status` devolvió “not a git repository”). Por eso los pasos futuros de Git son condicionales; no indicar a Luna que haga commits sin comprobar primero el entorno. El servidor de desarrollo se inició solo para inspección y se detuvo al finalizar la auditoría.

### 3.1 Ruta realmente utilizada

`src/app/page.tsx` → `PreviewContainer` y `inspector/InspectorPanel` → `tabs/*` → `InspectorPanelLegacy`. Cada wrapper monta una instancia de Legacy con `forcedTab`; el componente padre monta condicionalmente una sola pestaña. La pestaña Text usa `forcedTab="text3d"`.

`TopPrimaryControls` no se monta en la página principal. `controls/FontSection.tsx` devuelve `null`; los controles históricos están en `TopPrimaryControlsLegacy`, a través de `LayoutControls`, fuera de esta ruta principal. No asumir que un control existe en la UI porque aparece en uno de esos archivos.

`MainComposition` elige entre 27 componentes de `templates/registry.ts`. Los fondos se eligen en `inspector/ParticlesTab.tsx`; sus 34 IDs llegan a `ParticleBackground`. Tres motores 3D se importan desde `NEW APPROACH/bg3d-lowpoly-terrain.tsx`, `bg3d-crystal-shards.tsx` y `bg3d-dna-helix.tsx`.

`Root.tsx` registra además composiciones de circuitos, hexágonos y esferas. `experimental/RootExperimental.tsx` registra túneles, retículas, shaders y nebulosas. Que estén registrados en Studio no los convierte en opciones del editor. Se consideran en la revisión de redundancia, sin añadirlos automáticamente al catálogo público.

### 3.2 Hallazgos prioritarios

| ID | Evidencia concreta | Consecuencia | Decisión y fase |
|---|---|---|---|
| H01 | `tabs/*` monta Legacy con estado local; se observó Export → lote → Global → Export regresando a único | Se pierde contexto de exportación; borradores/resultados viven en la instancia desmontada | Subir estado de exportación y borradores a proveedores persistentes, F1 |
| H02 | `editWordByWord` inicia en falso; efecto de Legacy filtra `word-style-*` y `word-gradient-*` y copia estilo principal sobre secundarios | Navegar o montar otro panel puede alterar estilos sin acción explícita | Eliminar mutaciones del documento por montaje y por visibilidad del editor, F1 |
| H03 | `updateTotalDurationSeconds` calcula `round(targetFrames * speed / currentTotal)` | Con 150 f, velocidad 1 y solicitud 10 s obtiene 2 y se limita a 15 f; no representa 10 s | Corregir conversión y probar aritmética, F1 |
| H04 | No hay control directo de fuente/tamaño global montado en la UI auditada; hay overrides por palabra/carácter | Cambiar tipografía básica exige descubrir edición avanzada que algunos efectos ni consumen | Tipografía global siempre visible cuando aplica, F2 |
| H05 | `rotation` se etiqueta “3D Rotation By Word” pero usa `Array.from(text)` | El nombre promete una unidad diferente | Renombrar “Giro 3D por letra”; selector de unidad solo si se implementa, F3 |
| H06 | Text muestra “3D y material” aun en Typewriter; control de cursor está dentro del bloque exclusivo de AI HUD | Ruido en 2D y cursor inaccesible donde sirve | Capacidades y panel específico Cursor, F2/F3 |
| H07 | Particles muestra luces A/B/C, metal, rugosidad y Lowpoly para `light-orbs` | Abundancia de controles inertes | Ocultar por capacidades; luces de intensidad ni se extraen en el motor principal, F4 |
| H08 | ADN mapea opacidad→radio, velocidad→vueltas y movimiento; terreno mapea tamaño/blur a múltiples parámetros | Cambiar un control produce varios cambios inesperados | Propiedades específicas independientes y migración de aspecto, F4 |
| H09 | AI HUD omite fondo general y MasterMotionLayer; consume título/subtítulo propios, no `text` | Fondo, profundidad y lote genérico prometen acciones que no realizan | Capacidades de escena integrada; lote no disponible inicialmente para HUD, F3/F5 |
| H10 | `ViralTextEffect` usa texto completo en primera línea más `wordTwo/Three`; Legacy extrae estos del mismo texto | Riesgo de repetir palabras; “palabra” y “línea” se mezclan | Modelo explícito de líneas para Viral y par A/B para Bar, F3 |
| H11 | Se guardan mapas por plantilla/fondo, pero el selector activo solo cambia el ID; fondos aplican defaults parciales para dos casos | Cambiar de efecto no recupera coherentemente configuración previa | Funciones de selección por dominio, con restauración y migración, F1 |
| H12 | `hideHeader` oculta idioma y reset general; pestañas y partículas mezclan ES/EN; tamaños 10–12 px y 28 px de alto | Baja legibilidad y acciones difíciles de descubrir | Idioma compartido, etiquetas completas, controles 36 px y títulos legibles, F2 |
| H13 | `useRenderExport` usa alertas, estado local, sin progreso del servidor; API responde al final | Cambio de pestaña puede ocultar un trabajo en curso | Estado global y progreso indeterminado honesto; no inventar porcentaje, F5 |
| H14 | API calcula duración antes del bucle de lotes y solo sustituye `text` | Kinetic con distintos números de palabras puede usar duración incorrecta por elemento | Resolver props y duración por elemento dentro del bucle, F5 |
| H15 | API elimina MP4/WebM/MOV de `public/renders` con antigüedad >1 h al recibir una exportación | Archivos existentes no son una biblioteca permanente | Informar temporalidad; pruebas futuras por CLI en directorio QA, F0/F5 |
| H16 | Archivos de audio presentes; búsqueda en `src` no encontró integración de Audio/SFX | El inventario previo de recursos no demuestra sonido funcionando | No prometer audio ni unmute útil; ocultar controles de audio si composición no tiene pista, F2 |
| H17 | CSS global de `MainComposition` aplica transform a `*`; HUD usa reloj RAF en preview y frame en render | Posible conflicto de transformaciones y paridad temporal | Prueba focalizada antes de tocar; aislar CSS y tiempo en F3 si se reproduce |
| H18 | Anchura fija de inspector de 380 px con `h-screen`/`overflow-hidden` | En pantallas pequeñas el preview queda comprimido y puede haber scroll anidado | Diseño adaptable y un scroll por panel, F2 |

H02, H03, H08–H11, H14 y H17 proceden de lectura de código; Luna debe adjuntar reproducción o cálculo al tratarlos. No presentarlos como pruebas visuales ya realizadas.

## 4. Diseño de interacción propuesto

### 4.1 Recorrido principal

Orden de pestañas: **Texto · Fondo · Composición · Mis presets · Exportar**. Entrada inicial: Texto. Cada pestaña tiene título, resumen breve y acción de restablecimiento de su ámbito. “Plantilla” significa efecto incluido; “Mis presets” significa configuración guardada por el usuario.

Texto: selector con nombre descriptivo y miniatura → contenido → tipografía → apariencia → movimiento → avanzado contextual. Fondo: selector por familias → controles específicos → color y composición. Composición: formato, tiempo, posición y calidad de previsualización. Mis presets: guardar/cargar/exportar/importar. Exportar: resumen exacto de salida, modo y acciones.

La galería tendrá buscador por nombres ES/EN, filtros por familia y etiquetas “2D”, “3D”, “Escena integrada”, “Experimental” cuando correspondan. Miniaturas estáticas cargadas de manera diferida; reproducir una sola demo al enfocarla o pulsar “Ver ejemplo”. No montar 61 Players. Seleccionar una tarjeta conserva texto y formato, restaura ajustes propios de esa plantilla y muestra su nombre en el inspector. La elección tiene estado visible y foco por teclado.

### 4.2 Jerarquía y dimensiones propuestas

- Inspector 420 px en escritorios ≥1280 px; 360 px entre 900–1279 px; debajo de 900 px preview arriba y panel abajo. La altura del preview compacto será `clamp(220px, 38vh, 420px)`.
- Inputs y botones 36 px mínimo; texto de entrada 14 px; etiquetas 12–13 px sin mayúsculas forzadas; ayuda 12 px. Botones de icono 36×36 px con nombre accesible.
- Un scroll vertical en el cuerpo del inspector; pestañas fijas, sin un segundo scrollbar del `aside`.
- Contenido y tipografía abiertos inicialmente. Apariencia y movimiento abiertos si contienen ≤6 controles; avanzado cerrado inicialmente. Guardar estado de acordeón por plantilla y sección.
- “Avanzado” reúne material, profundidad, semillas y ajustes especializados; nunca esconde el texto ni la fuente principal.
- Toda acción destructiva de estilo tiene “Deshacer” dentro del historial local. Restaurar un grupo no cambia plantilla, texto, formato ni otro grupo.

### 4.3 Lenguaje y ayudas concretas

| Antes | Después | Ayuda |
|---|---|---|
| N | Densidad | “Cantidad relativa de elementos. El número real depende del fondo.” |
| O | Opacidad (%) | “Transparencia de los elementos, sin cambiar su tamaño.” |
| S | Velocidad del fondo (×) | “Cambia el movimiento del fondo; no la duración del video.” |
| Blur | Desenfoque (px) / Resplandor | Elegir el término por motor, nunca intercambiarlos |
| ZS / ZE | Profundidad inicial/final (px) | “Valores positivos acercan el texto a la cámara.” Validar signo real antes de publicar |
| Easing | Curva de movimiento | “Controla cómo acelera y frena la entrada.” |
| CANAL ALPHA | Fondo transparente | “Conserva transparencia donde no se dibuja contenido.” |
| Estilo Master | Plantilla de texto | Resumen específico debajo del nombre |
| Lowpoly A/B/C | Luz principal / Relleno / Contraluz | Solo en terreno; etiquetar según la posición real de cada luz |

No presentar “Fondo transparente” como “quitar todas las capas de fondo”: partículas, imágenes y píxeles dibujados pueden seguir visibles. En HUD con imagen base, explicar “La imagen base puede cubrir la transparencia” y ofrecer apagar esa imagen.

### 4.4 Edición y accesibilidad

Los controles deben tener `label` asociado por `id`, `aria-describedby` para ayuda/error y `aria-invalid` ante entrada inválida. Acordeones con `aria-expanded`/`aria-controls`; pestañas con `tablist`, `tab`, `tabpanel`, selección y navegación por flechas. Foco visible, no solo color para indicar activación.

Seleccionar palabras/caracteres mediante botones accesibles o selección de texto con barra contextual visible. El clic derecho puede ser atajo adicional; no la única entrada. Escape cierra y devuelve foco; tocar fuera no borra cambios ya aplicados. El modo “editar selección” no modifica estilos al activarse/desactivarse.

Controles numéricos mantienen un borrador de cadena mientras se escribe: vacío o `-` no se convierte inmediatamente a cero. Confirmar con Enter o desenfoque; Escape restaura. Rechazar NaN/Infinito, limitar al rango y explicar el ajuste. Slider y número comparten valor. Cero se respeta donde sea válido; evitar `value || default` para esos casos.

Preview: reproducir/pausar, volver al inicio, fotograma anterior/siguiente y posición temporal legible. Mostrar estado de capas fuera del video exportable. Respetar preferencia de movimiento reducido para autoplay de demos; no alterar silenciosamente el video exportado.

## 5. Archivos y contratos propuestos

Las rutas siguientes son relativas a la raíz. Son archivos por crear salvo los existentes identificados. Evitar nuevas dependencias de estado.

| Archivo | Responsabilidad |
|---|---|
| `src/lib/editor/EditorSessionContext.tsx` | Pestaña, idioma, selección y borradores que sobreviven navegación; no modifica estilos por montaje |
| `src/lib/editor/ExportContext.tsx` | Una instancia del proceso de exportación para toda la aplicación |
| `src/lib/editor/history.ts` | Historial de snapshots del documento, máximo 50; arrastre produce una entrada |
| `src/lib/editor/catalog.ts` | IDs, etiquetas, descripciones, familias, capacidades, claves de configuración y miniaturas |
| `src/lib/editor/controlSchema.ts` | Tipos y validación para controles; no importa componentes Three/Remotion |
| `src/lib/editor/selectTemplate.ts` | Selección/restauración por ámbito, sin perder texto/formato |
| `src/lib/editor/migratePresets.ts` | Migración pura y versionada; respaldo de datos v1 antes de escribir v2 |
| `src/lib/editor/textContent.ts` | Segmentación y contenido por bloque/líneas/par/título; Unicode coherente |
| `src/lib/editor/normalizeExport.ts` | Validación, props de cada elemento y firma de configuración |
| `src/lib/editor/effectOptions.ts` | Tipos específicos descritos en las fichas, defaults y lectura con fallback |
| `src/components/inspector/fields/NumberField.tsx` | Slider/número/unidad/ayuda/error/restablecer |
| `src/components/inspector/fields/ColorField.tsx` | Color y hexadecimal sincronizados con validación |
| `src/components/inspector/TemplatePicker.tsx` | Galería única reutilizada para texto y fondo |
| `src/components/inspector/sections/TextContentSection.tsx` | Campos de contenido según modo |
| `src/components/inspector/sections/TypographySection.tsx` | Fuente/peso/tamaño/espaciado/interlineado global |
| `src/components/inspector/sections/AppearanceSection.tsx` | Relleno/borde/sombra solo si son efectivos |
| `src/components/inspector/sections/MotionSection.tsx` | Controles temporales propios de cada efecto |
| `src/components/inspector/sections/SelectionStyleSection.tsx` | Estilos por selección cuando exista soporte |
| `src/components/inspector/sections/BackgroundControls.tsx` | Controles elegidos por catálogo de fondos |
| `src/components/inspector/sections/ExportSummary.tsx` | Resumen de dimensiones, duración, capas, codec y estado |
| `src/components/inspector/tabs/*` (existentes) | Composición de secciones; dejan de montar Legacy gradualmente |
| `src/lib/AnimationContext.tsx` (existente) | Documento y presets; hidratación determinista y persistencia versionada |
| `src/lib/types/animation.ts` (existente) | Nuevos tipos/IDs conservando propiedades antiguas |
| `src/lib/videoConfig.ts` (existente) | Única autoridad para duración/dimensiones |
| `src/remotion/templates/*`, `backgrounds/*` (existentes/nuevos) | Consumidores reales; cambios por ficha y por tarea |
| `tests/editor/*.test.ts`, `tests/editor/*.test.tsx` | Pruebas de funciones y persistencia; infraestructura descrita en F0 |

Contrato mínimo para el catálogo:

```ts
type ContentMode = 'block' | 'three-lines' | 'replace-pair' | 'sequence' | 'title-subtitle';
type TextCapabilities = {
  content: ContentMode;
  typography: boolean;
  fill: boolean;
  stroke: boolean;
  shadow: boolean;
  rangeStyles: 'none' | 'partial' | 'full';
  lineHeight: boolean;
  depth: boolean;
  material: boolean;
  externalBackground: boolean;
  phase: 'mapped' | 'custom' | 'none';
};
type NumericControl = {
  key: string;
  label: string;
  description: string;
  unit: 'px' | '%' | 's' | '×' | '°' | 'count' | 'u' | 'frames' | 'cycles/s';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  advanced: boolean;
};
```

Las capacidades se rellenan por las fichas y la evidencia del consumidor. `partial` requiere explicar exactamente qué funciona; no se convierte en `full` por usar `StyledRangeText` en una sola subcapa.

Añadir a `AnimationProps` propiedades opcionales `schemaVersion?: 2`, `templateOptions?: TemplateOptionsMap` y `backgroundOptions?: BackgroundOptionsMap`. Los mapas contendrán tipos explícitos por ID definidos en `effectOptions.ts`; no `any` ni un diccionario de claves arbitrarias como sustituto de los tipos. Cada ficha define sus claves nuevas. Los campos compartidos existentes permanecen en `AnimationProps` para evitar una migración masiva de golpe.

Interfaz para selección: `selectTextTemplate(current: AnimationProps, id: AnimationStyle, saved: Partial<AnimationProps> | null): AnimationProps`; equivalente `selectBackgroundPreset` con `ParticlePreset`. Construir un patch solo con las claves del dominio del ID, no extender el snapshot entero. Preservar formato, duración, texto y estado de la otra capa. Primera visita usa defaults propios; siguientes visitas usan ajustes propios guardados. Cargar un preset de usuario completo sí restaura el documento entero y crea una entrada de historial.

Exportación: estado discriminado `idle | rendering | succeeded | failed`, con snapshot de props, firma estable, hora de inicio, resultados y error. Debe vivir por encima de las pestañas. No prometer recuperación del proceso tras cerrar el navegador: la primera versión conserva durante navegación interna; al recargar, informar que no puede recuperar el estado de un render sin API de trabajos.

## 6. Fases y tareas para ejecución posterior

Cada tarea termina con su verificación y un reporte según sección 8. No iniciar la siguiente si la aceptación falla. F3/T01–T27, F4/B01–B34 y F6/F7 se ejecutan una ficha por ciclo; nunca editar todos los motores en una sola tanda.

### F0 — Línea base y protección de comparación

**Dependencia:** autorización futura para implementar. **Salida:** evidencias reproducibles y baseline; no cambios visuales.

- [ ] F0.1 Inspeccionar `git status --short` y `git rev-parse --show-toplevel`. Si no hay Git, registrar esa condición; no inicializar ni mover el proyecto automáticamente. Leer instrucciones AGENTS aplicables. Registrar versiones con `node --version` y `npm --version`.
- [ ] F0.2 Crear `docs/qa/ui-redesign/baseline.md` y `docs/qa/ui-redesign/fixtures/`. Capturar mediante controles/exportación autorizada las configuraciones de usuario necesarias antes de migrar; no publicar localStorage ni borrar el perfil. Crear fixtures sintéticas sin datos personales para cada ID existente, usando los defaults y `TEXT MOTION IMPACT`.
- [ ] F0.3 Registrar cada control como `UI → propiedad → consumidor → condición → resultado` en `docs/qa/ui-redesign/control-matrix.md`. Empezar por listas de las fichas; adjuntar símbolo y línea actual, sin confiar en números antiguos. Resolver propiedades consumidas por helpers.
- [ ] F0.4 Ejecutar `node node_modules/typescript/bin/tsc --noEmit --incremental false`, `node node_modules/next/dist/bin/next lint` y `npm run build`. Registrar salidas completas, separando fallos previos de fallos nuevos. No corregir fallos ajenos en esta fase.
- [ ] F0.5 Para las funciones puras y componentes de estado, añadir Vitest, jsdom y React Testing Library como dependencias de desarrollo solo al ejecutar esta fase. Crear `vitest.config.ts` con entorno jsdom y alias `@` a `src`; script `test:editor` = `vitest run tests/editor`. Usar versiones compatibles comprobadas al instalar y guardar lockfile. No actualizar React/Next para acomodar tests.
- [ ] F0.6 Generar contacto visual de cada efecto: fotogramas 0, 25%, 50%, 75% y último; texto de prueba y 150 f. Usar CLI local instalada, salida `tmp/qa-ui-baseline/`, concurrencia 1 para 3D. Consultar `node node_modules/@remotion/cli/remotion-cli.js --help` si esa entrada existe; de lo contrario usar el binario local descubierto en `node_modules/.bin`. No usar scripts quick existentes de concurrencia 8 ni API que activa limpieza de renders viejos.

**Aceptación:** inventario 27/34 sin IDs duplicados, cada hallazgo tiene caso, baseline de compilación registrado, ningún render anterior eliminado. Si un efecto no carga, registrar cuál y pedir ayuda cuando constituya atasco; no excluirlo del catálogo silenciosamente.

### F1 — Integridad del documento y del tiempo

**Archivos:** AnimationContext, InspectorPanelLegacy, InspectorPanel, layout, videoConfig; nuevos contextos, history, selectTemplate y migratePresets. **Dependencia:** F0.

- [ ] F1.1 Añadir `EditorSessionProvider` y `ExportProvider` dentro de `AnimationProvider` en `src/app/layout.tsx`, por encima de Home. Mover idioma, borrador de lote, codec, resultados, selección y modo de edición a sus ámbitos persistentes. Mantener una sola instancia del hook de render.
- [ ] F1.2 Eliminar sincronizaciones que borran estilos por montar/desmontar o por cerrar edición por palabra. Convertir normalización en acción explícita de editar texto; no ejecutarla al cambiar pestaña. Guardar snapshot antes de cualquier migración.
- [ ] F1.3 Añadir `setDisplayedDurationSeconds` como función pura en videoConfig y usarla desde el inspector. Para velocidad vinculada: `baseFrames = clamp(round(seconds * fps * speed))`; desvinculada: `clamp(round(seconds * fps))`. No dividir por duración anterior. Si el clamp impide duración pedida, mostrar duración efectiva y mensaje, no una cifra falsa.
- [ ] F1.4 Separar UX de tiempo: “Duración del video” y “Velocidad de la animación”; checkbox avanzado “Vincular duración a velocidad”. No cambiar de golpe calibraciones de cada plantilla; el tiempo por plantilla se ajusta en F3. Kinetic usa suma de segmentos y presenta total calculado de solo lectura.
- [ ] F1.5 Versionar storage. Leer v1 una sola vez, clonar respaldo bajo clave `remotion-fx:backup-before-v2`, normalizar datos en memoria, escribir v2 solo si respaldo y serialización tienen éxito. Si cuota falla, seguir en memoria y mostrar “No se pudo guardar en este navegador”; no reportar éxito. Preservar claves v1.
- [ ] F1.6 Implementar selección por dominio. El guardado automático no debe sobrescribir el preset de destino con valores arrastrados del anterior antes de restaurarlo. Un único dispatch produce selección/restauración atómica.
- [ ] F1.7 Historial 50 snapshots; edición de slider agrupada pointerdown→pointerup, escritura agrupada por confirmación. Undo/redo no incluye pestaña ni reproducción. Cargar/restablecer preset sí se deshace.

**Pruebas concretas:**

```ts
// Contrato de la nueva función exportada desde videoConfig.ts.
type DurationInput = {
  motionDurationFrames: number;
  speed: number;
  speedControlsDuration: boolean;
};
type DurationEdit = {
  motionDurationFrames: number;
  effectiveDurationInFrames: number;
  error: string | null;
};
// setDisplayedDurationSeconds(previous: DurationInput, seconds: number): DurationEdit
// Entrada NaN/Infinito: devolver duración anterior y error, sin aplicar patch.
// Válida fuera de límites: limitar base, devolver duración efectiva y aviso.
// La UI aplica solo motionDurationFrames; los otros campos sirven para feedback.
```

Contenido mínimo de `tests/editor/duration.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { setDisplayedDurationSeconds } from '@/lib/videoConfig';

describe('edición de duración visible', () => {
  it.each([
    [10, 1, true, 300, 300],
    [10, 2, true, 600, 300],
    [10, 2, false, 300, 300],
    [.5, 1, true, 15, 15],
  ] as const)('%s s a %s×, vínculo %s', (seconds, speed, linked, base, effective) => {
    const result = setDisplayedDurationSeconds({
      motionDurationFrames: 150, speed, speedControlsDuration: linked,
    }, seconds);
    expect(result.motionDurationFrames).toBe(base);
    expect(result.effectiveDurationInFrames).toBe(effective);
    expect(result.error).toBeNull();
  });
  it('conserva duración ante NaN', () => {
    const result = setDisplayedDurationSeconds({
      motionDurationFrames: 150, speed: 1, speedControlsDuration: true,
    }, Number.NaN);
    expect(result.motionDurationFrames).toBe(150);
    expect(result.error).not.toBeNull();
  });
  it('informa el límite de duración base', () => {
    const result = setDisplayedDurationSeconds({
      motionDurationFrames: 150, speed: 3, speedControlsDuration: true,
    }, 120);
    expect(result.motionDurationFrames).toBe(3600);
    expect(result.effectiveDurationInFrames).toBe(1200);
    expect(result.error).not.toBeNull();
  });
});
```

Crear `tests/editor/duration.test.ts`, `session-persistence.test.tsx`, `preset-migration.test.ts` y `selection.test.ts`. En persistencia: editar lote A/B → cambiar a Texto → volver → mismo modo, texto y codec. Guardar estilo verde en segunda palabra → visitar las cinco pestañas → sigue verde y mismo rango. Seleccionar Typewriter→Glitch→Typewriter restaura controles Typewriter sin modificar texto ni formato. Storage inaccesible no produce toast de guardado exitoso.

**Aceptación:** navegación no modifica documento, dura exactamente lo mostrado, fixtures v1 cargan conservando aspecto y no se pierde exportación por navegar.

### F2 — Inspector accesible y controles básicos recuperados

**Archivos:** page, PreviewContainer, primitives, InspectorPanel, tabs, catalog/controlSchema y secciones nuevas. **Dependencia:** F1.

- [ ] F2.1 Crear catálogo con las 27/34 entradas y etiquetas de fichas. Separar registro de UI de componentes pesados. Validar exhaustividad con `satisfies Record<AnimationStyle, ...>` y equivalente de fondo.
- [ ] F2.2 Crear NumberField y ColorField con contratos de la sección 4.4. Migrar primero un control de posición y uno de color para validar teclado antes de convertir todos.
- [ ] F2.3 Extraer Texto, empezando contenido y tipografía global. Fuente/peso/tamaño siempre disponibles cuando aplican. Mostrar pesos realmente cargados y mensaje de sustitución de fuente; no usar un placeholder `FontSection` vacío.
- [ ] F2.4 Migrar Apariencia y selección. Exponer solo capacidades verificadas. Si un estilo por rango no es compatible, conservar datos pero ocultar el editor y explicar “Esta plantilla usa estilo uniforme”. No fingir que los cambios avanzados se ven.
- [ ] F2.5 Migrar Composición y Mis presets; idioma único ES por defecto. Sustituir shells Legacy uno por uno. Una pestaña migrada no puede montar simultáneamente el Legacy que mantiene efectos de sincronización.
- [ ] F2.6 Aplicar tamaños, breakpoints y scroll de sección 4.2. Verificar 1920×1080, 1366×768, 1024×768 y 390×844, además de zoom del navegador 200%. Toda acción principal debe poder alcanzarse por teclado y scroll.
- [ ] F2.7 Añadir galería de miniaturas; hasta tenerlas, cada entrada conserva etiqueta y descripción funcional, sin cajas vacías como entrega final. Generarlas desde fixtures después de F3/F4 y regenerar solo las cambiadas.
- [ ] F2.8 Añadir preview por fotograma con referencia al Player; no reiniciarlo al cambiar un color. Quitar audio/mute si no hay pista. Controles de capas con `aria-pressed`; HUD recibe comportamiento especial en F3/T27.

**Aceptación:** usuario puede introducir texto, cambiar fuente/tamaño/color, elegir efecto y llegar a Exportar sin abrir avanzado. No hay controles visibles inertes ni títulos sobre funciones inexistentes. Crear `tests/editor/catalog.test.ts` y `fields.test.tsx`: cero, vacío temporal, Enter, Escape, límites y labels.

### F3 — Corregir y mejorar las 27 plantillas

**Dependencia:** F2. **Orden:** T01 Typewriter → T26 Extruded → T27 HUD → T25 Viral → T18 Bar → T24 Kinetic → restantes en orden de ficha. Resolver primero controles que hoy impiden edición o crean duplicación.

Para cada Txx:

- [ ] Abrir archivo exacto de su ficha, helper StyledRangeText/useMotionFrame si se usa y descriptor del catálogo. Registrar propiedades realmente utilizadas.
- [ ] Aplicar cambios de interfaz indicados como “recuperar/ocultar”; comparar fotogramas con baseline sin alterar defaults.
- [ ] Implementar solo las propiedades nuevas de esa ficha bajo `templateOptions[id]`. Resolver defaults con `??`; actualizar consumidor, schema, reset, presets y validación juntos.
- [ ] Ejecutar la prueba específica de la ficha; 16:9 y 9:16, contenido normal y largo, velocidad 0.2/1/3 y fases disponibles. Revisar salida y último fotograma cuando exista desvanecimiento.
- [ ] Generar clip comparativo 1080p y prueba de transparencia de una muestra si cambió máscara, SVG, filtro o WebGL. En 3D concurrencia 1.
- [ ] Reportar evidencia y continuar solo si hay criterio aprobado. Si excede la capacidad de Luna o no converge, aplicar sección 8.

**Aceptación de fase:** 27 fichas completadas, capacidades reflejan realidad, ninguna palabra duplicada por sincronización, controles específicos preservados al navegar y exportar. No convertir las mejoras de 27 efectos en 27 nuevas entradas de galería.

### F4 — Fondos con controles semánticos

**Dependencia:** F2; puede seguir a F3 en la misma ejecución. **Archivos:** ParticlesTab, BackgroundControls, ParticleBackground y motores de fichas.

- [ ] F4.1 Ocultar intensidad de luces A/B/C no consumida y controles de material/terreno fuera de sus motores. `lineThickness` y `gridAngle` solo pertenecen a retro-grid en el adaptador actual.
- [ ] F4.2 Migrar ADN, terreno y cristales a propiedades específicas independientes según documento de fondos. Derivar valores v2 del aspecto efectivo v1 con las fórmulas existentes, antes de eliminar acoplamientos.
- [ ] F4.3 Reetiquetar “N” como densidad cuando el multiplicador cambia el recuento real. Si se expone “Cantidad”, mostrar el entero que se envía al componente.
- [ ] F4.4 Ejecutar B01–B34 individualmente. Donde el fondo sea compuesto, diferenciar control de partículas y control de la capa de ondas/red; no atribuir a densidad la cantidad de curvas si no la cambia.
- [ ] F4.5 Opacidad de grupo 0 hace invisible el grupo; velocidad 0 congela cuando se ofrece. Cambiar mínimos hardcodeados solo tras registrar apariencia por defecto. Probar sobre damero, negro y blanco.
- [ ] F4.6 Organizar familias sin eliminar presets parecidos. Etiquetar diferencias estructurales; comparación visual de pares señalados en la ficha. No llamar nuevo a un fondo experimental ya escrito.

**Aceptación:** 34 fondos con ficha y controles efectivos, cambiar velocidad no cambia número de vueltas del ADN, cambiar desenfoque no cambia geometría del terreno, ningún control de luz inútil.

### F5 — Exportación y presets confiables

**Dependencia:** F1–F4. **Archivos:** ExportContext, useRenderExport, ExportTab, ExportSummary, normalizeExport y api/render/route.

- [ ] F5.1 Antes de renderizar, construir snapshot validado y resumen: formato, píxeles, 30 fps, segundos/fotogramas, codec, capas activas y cantidad de archivos. **Decisión posterior del usuario:** la UX debe presentar una única acción `EXPORTAR VIDEO`/`EXPORTAR LOTE`; el nombre y destino se eligen antes del render y el archivo se escribe automáticamente al finalizar cuando la plataforma lo permita. Mantener separadas internamente preparación, render, escritura, estado y errores; usar fallback de descarga segura cuando no exista File System Access API.
- [ ] F5.2 Estados explícitos `idle`, `choosing-destination`, `rendering`, `writing`, `succeeded` y `failed`; indicador indeterminado y tiempo transcurrido. No porcentaje, ETA ni “Cancelar render” sin mecanismo real del servidor. Cancelar el selector no inicia render. El flujo no debe mostrar un segundo paso obligatorio de “Guardar Video” tras una autorización de destino válida; si la escritura falla, conservar el resultado recuperable y ofrecer recuperación segura. Navegar no cancela; segundo envío deshabilitado. Final y error se anuncian con región de estado accesible, no `alert()`.
- [ ] F5.3 Si se edita después de generar, conservar enlace y rotular “Video de una configuración anterior”; permitir descargar anterior o generar nuevo. Firma estable de props normalizadas, excluyendo estado UI.
- [ ] F5.4 Lotes: tabla de filas no vacías con contenido y duración efectiva. Limitar inicialmente a 20 elementos por envío, con aviso si se excede, sin truncar. Dentro del servidor normalizar cada `text`, recalcular duración y dimensiones de cada composición. HUD no admite lote genérico y muestra explicación; Bar usa contenido A del lote y B fijo explícito; Viral divide en líneas según su modelo acordado, sin reusar palabras de la ejecución anterior.
- [ ] F5.5 Fallo parcial devuelve resultados completados y fila fallida; no afirmar que todo falló y perder enlaces buenos. Reintento explícito desde la fila fallida con el mismo snapshot, sin regenerar completadas. Mantener procesamiento secuencial y cap de concurrencia existente.
- [ ] F5.6 Validar HTTP de descarga antes de escribir blob; 404 indica temporalidad y ofrece regenerar. Mensaje visible: “Guarda los archivos: son temporales y pueden eliminarse después de una hora al generar otros videos”. No afirmar borrado programado exacto porque limpieza se dispara por solicitudes.
- [ ] F5.7 Mis presets: crear, cargar, duplicar, renombrar, eliminar con deshacer e importar/exportar JSON v2. Sobrescribir nombre existente exige decisión explícita de la UI. Validar JSON, versión, IDs, números y colores; no evaluar código ni cargar recursos remotos arbitrarios. Importación v1 usa migrador.

**Aceptación:** una exportación sigue visible al ir a Texto y volver; lote de 1 y 5 palabras en Kinetic tiene duraciones diferentes correctas; error de fila conserva resultados previos; cancelar selector de guardado no pierde enlace. Crear `tests/editor/export-normalization.test.ts` y prueba de estado de ExportContext; validar MP4 y MOV alpha con CLI aislada antes de probar API en entorno que no contenga renders del usuario.

### F6 — Cinco textos nuevos

**Dependencia:** F3 y F5 aceptadas. **Orden:** N-T01 resaltado → N-T02 recortes → N-T03 estampación → N-T04 barrido tipográfico → N-T05 mosaico.

Cada ficha del documento de novedades constituye una tarea independiente: crear archivo indicado; extender union AnimationStyle y registry; descriptor, options/defaults y reset; integrar render y presets; miniatura; ejecutar casos propios y prueba de no redundancia. No instalar fuentes externas ni agregar reconocimiento de voz. Si algo propuesto requiere una capacidad ausente, reportar ese punto antes de sustituir el efecto por otro existente.

**Aceptación:** exactamente cinco IDs nuevos de texto, cada uno distinto por mecanismo y controles. Catálogo total 32 textos.

### F7 — Cinco fondos de partículas nuevos

**Dependencia:** F4 y F5 aceptadas. **Orden:** N-B01 semitono → N-B02 recortes de papel → N-B03 campo magnético → N-B04 gotas de tinta → N-B05 espuma celular.

Crear un componente por ficha, extender ParticlePreset, conectar en ParticleBackground, añadir descriptor y opciones. Usar semilla y tiempo por fotograma, no simulación dependiente de reproducción continua. Los fondos nuevos no heredan controles Lowpoly/luces por conveniencia. Medir cada uno aislado antes de combinar con texto 3D.

**Aceptación:** exactamente cinco IDs nuevos de fondo, 39 fondos totales; sin saltos al buscar un fotograma, sin duplicar túneles/redes/nebulosas ya existentes.

### F8 — Validación integrada y entrega

- [ ] Ejecutar suites editor, TypeScript, lint y build. Documentar salida y cualquier error previo no resuelto.
- [ ] Verificar los 32 textos y 39 fondos individualmente con preset por defecto; combinar todos los nuevos con un fondo/texto sencillo, no hacer producto cartesiano de 1248 combinaciones.
- [ ] Combinaciones de estrés: texto 3D+terreno, mosaico+campo magnético, HUD con imagen base, Typewriter+alpha, Kinetic de cinco elementos. 1080p para todos; 4K para muestra 2D y 3D; 8K solo smoke opcional, sin bloquear la entrega principal por rendimiento experimental.
- [ ] Verificar 16:9/9:16/1:1; letras acentuadas, emojis compuestos, saltos, vacío, 200 caracteres y palabra de 40 caracteres sin espacios. No cortar un emoji a mitad.
- [ ] Comparar preview y render en el mismo fotograma y semilla. Distinguir diferencias de rasterización de diferencias de geometría/tiempo. Repetir seek 0→90→30→90 y comprobar mismo resultado en 90.
- [ ] Repetir navegación de pestañas, carga de preset v1/v2, error de guardado, descarga cancelada y lote parcial. Verificar que ayudas de UI no aparecen en el video.
- [ ] Entregar `docs/qa/ui-redesign/final-report.md`, catálogo de demos y reporte de pendientes. No eliminar código legacy hasta comprobar que no tiene importaciones activas y que eliminarlo sea necesario; no es requisito de esta mejora.

## 7. Casos de aceptación transversales

| Caso | Pasos | Resultado obligatorio |
|---|---|---|
| A01 Primer uso | Texto nuevo → fuente/tamaño/color → plantilla → Exportar | Sin instrucciones técnicas, controles básicos a primera vista |
| A02 No-op | Cambiar extremos de cada control visible con fondo fijo | Cambio observable del aspecto indicado o del estado que explica su activación |
| A03 Navegación | Editar palabra 2 y lote → recorrer pestañas | Documento/borradores/resultados intactos |
| A04 Sincronía | 150 f, seek 90 dos veces | Mismos elementos, posiciones y fase; sin reloj externo |
| A05 Presets | Guardar A, cambiar a B, volver A; cargar preset v1 | Restauración propia sin arrastrar controles de B |
| A06 Unicode | `¡Qué ilusión! 👩🏽‍💻 café` y texto con nueva línea | Segmentación coherente, selección y escritura sin caracteres rotos |
| A07 Alpha | Exportar MOV sobre fondo transparente | Transparencia real donde no hay contenido; halos y partículas conservados |
| A08 Error | Valor vacío/NaN, color inválido, 404 de render | Mensaje accionable; no render negro silencioso ni éxito falso |
| A09 Teclado | Tab, flechas, Enter, Escape en tabs/galería/menú | Foco visible y retorno predecible |
| A10 Tamaño | 390×844 y zoom 200% | Controles alcanzables; sin textos truncados imprescindibles |

Performance: registrar máquina, viewport, resolución, preset y tiempo. Objetivo de interacción: texto escrito visible en <150 ms en escena 2D ligera; preview de referencia ≥24 fps a 1080p en la máquina registrada. Son metas a medir, no garantías universales. Si un fondo pesado no cumple, reducir calidad solo en preview mediante opción visible y conservar el resultado final; no esconder el problema bajando resolución de exportación.

## 8. Protocolo obligatorio para Luna

### 8.1 Inicio y seguimiento

Leer este plan y la ficha actual, verificar su dependencia y anunciar ID. Una tarea = un resultado revisable. Actualizar checkbox solo con evidencia. Al terminar cada tarea emitir reporte con: objetivo; archivos y símbolos modificados; comportamiento anterior/nuevo; pruebas con comandos/salidas; evidencias visuales; limitaciones; siguiente tarea y dependencia. No usar “todo funciona” sin detallar qué se comprobó.

### 8.2 Qué se considera atasco

- Falta acceso a archivo, UI o herramienta necesaria y no hay vía conocida disponible en el ámbito autorizado.
- Se pierde control de la computadora, la UI no coincide con el estado observado o aparece un diálogo que requiere intervención humana.
- Un intento correctivo basado en evidencia no resuelve el mismo problema y Luna no tiene una hipótesis nueva comprobable; no hacer otro cambio especulativo.
- Las correcciones revierten entre dos estados, o una mejora visual deteriora otra y no puede explicar la causa.
- No puede implementar la ficha sin cambiar su mecanismo distintivo, romper compatibilidad o ampliar alcance.
- Una referencia visual exige una decisión que no está resuelta por la ficha.

No hay cuota obligatoria de intentos: si ya se reconoce el atasco, se para inmediatamente. No se deben esperar tres fallos. Un error transitorio de compilación con causa conocida y arreglo concreto puede corregirse; si no hay avance verificable, se detiene.

### 8.3 Al atascarse

Detener edición, renderizaciones nuevas y acciones de computadora. No cerrar aplicaciones del usuario ni matar procesos ajenos. Conservar estado y archivos; no resetear Git ni borrar cachés/proyectos como solución genérica. Registrar procesos propios en curso y si pueden seguir consumiendo recursos. No intentar otro motor/modelo, crear otra tarea ni saltar a otra fase. Pedir una intervención manual específica y esperar respuesta. La ausencia de respuesta no autoriza reanudar.

### 8.4 Plantilla de reporte de bloqueo

```text
ESTADO: BLOQUEADO — requiere ayuda manual
Fecha/hora y zona:
Fase / tarea / paso:
Último paso completado y evidencia:
Objetivo concreto del paso bloqueado:
Resultado esperado:
Resultado observado:
Error exacto (sin secretos):
Archivo, símbolo y línea / URL o ventana:
Configuración de reproducción (texto, preset, fps, frame, resolución, semilla):
Pasos para reproducir desde el último estado válido:
Intento 1: hipótesis, acción, resultado y evidencia:
Intentos adicionales, si hubo: misma estructura; indicar por qué aportaban evidencia nueva:
Qué se sabe / qué sigue incierto:
Archivos modificados y cambios sin verificar:
Procesos propios aún abiertos y estado:
Intervención manual solicitada (acción exacta que debe realizar el usuario):
Estado que el usuario debe confirmar después:
Comprobación concreta para reanudar:
Punto exacto de reanudación:
No se realizarán más acciones hasta recibir respuesta.
```

Ejemplo de intervención útil: “Abre Exportar en la pestaña del proyecto y confirma si sigue apareciendo el lote A/B; el controlador de navegador perdió la conexión. No pulses Generar. Cuando confirmes la conexión, verificaré el estado y retomaré F1.1”. Evitar “¿qué hago?” o pedir capturas si puede obtenerlas cuando recupere acceso.

### 8.5 Reanudación y cierre

Leer respuesta del usuario; volver a observar el estado, ejecutar la comprobación indicada y continuar desde el paso pendiente. No repetir tareas aprobadas. Si sigue el bloqueo, emitir reporte actualizado señalando qué nueva evidencia aportó la ayuda manual. No declarar completada una fase con verificaciones pendientes; usar `completada`, `en curso`, `bloqueada` o `no iniciada`.

## 9. Criterio final de alcance

Orden recomendado: integridad → UI básica → plantillas actuales → fondos actuales → exportación → novedades → validación. La prioridad es recuperar controles esenciales y eliminar acciones engañosas antes de aumentar el catálogo. El resultado final será 32 plantillas de texto y 39 fondos, con compatibilidad de los anteriores y un flujo de edición coherente.

# F4 — Fondos / Backgrounds

## Inventario real

El catálogo actual contiene 39 fondos activos. Hay 35 fondos procedurales/escénicos del cierre F4 y 4 fondos de video importados posteriormente.

| ID | Componente/motor real | Familia | Cobertura | Diferencia específica |
|---|---|---|---|---|
| floating-dust | ParticleBackground / canvas 2D | Partículas 2D | Contrato | Densidad suave |
| light-orbs | ParticleBackground / canvas 2D | Orbes/luces | Contrato + dirigida | Forma y densidad de orbes |
| starfield | ParticleBackground / canvas 2D | Partículas 2D | Contrato | Densidad estelar |
| geometric-flow | ParticleBackground / canvas 2D | Geométrica | Contrato | Forma geométrica y flujo |
| nebula-cinematic | ParticleBackground / canvas 2D | Nebulosa procedural | Contrato + dirigida | Nebulosa y composición |
| fluid-ribbons | ParticleBackground / canvas 2D | Ribbons/flujo | Contrato | Bandas fluidas |
| tech-network | ParticleBackground / canvas 2D | Red/conexiones | Contrato + dirigida | Conexiones y nodos |
| inferno-tracer-burst | ParticleBackground / canvas 2D | Burst/tracers | Contrato | Chispas y ráfagas |
| neon-data-vortex | ParticleBackground / canvas 2D | Vórtice | Contrato | Vórtice neon |
| hud-command-center | ParticleBackground / canvas 2D | HUD/conexiones | Contrato | Tratamiento HUD |
| cyan-system-matrix | ParticleBackground / canvas 2D | Matrix/conexiones | Contrato | Matriz cian |
| neural-circuit-core | ParticleBackground / canvas 2D | Circuito/conexiones | Contrato + dirigida | Núcleo y rutas |
| quantum-lattice-flow | ParticleBackground / canvas 2D | Lattice/flujo | Contrato | Lattice animado |
| aurora-silk-waves | ParticleBackground / canvas 2D | Ribbons/flujo | Contrato + dirigida | Ondas aurora |
| ember-spark-rain | ParticleBackground / canvas 2D | Burst/tracers | Contrato | Lluvia de brasas |
| plasma-ring-tunnel | ParticleBackground / canvas 2D | Vórtice/túnel | Contrato | Anillo/túnel plasma |
| obsidian-gold-luxe | ParticleBackground / canvas 2D | Nebulosa procedural | Contrato | Tratamiento luxe |
| bio-lumina-veins | ParticleBackground / canvas 2D | Ribbons/flujo | Contrato | Venas luminosas |
| radar-sweep-grid | ParticleBackground / canvas 2D | Red/grid | Contrato + dirigida | Barrido radar |
| matrix-code-rain | ParticleBackground / canvas 2D | Matrix/código | Contrato + dirigida | Lluvia de código |
| matrix-tunnel-flow | ParticleBackground / canvas 2D | Matrix/túnel | Contrato | Túnel matrix |
| metaball-reactor | ParticleBackground / canvas 2D | Vórtice/forma | Contrato | Metaballs |
| wireframe-constellation | ParticleBackground / canvas 2D | Red/wireframe | Contrato | Constelación conectada |
| prism-noise-shimmer | ParticleBackground / canvas 2D | Ruido procedural | Contrato + dirigida | Ruido y shimmer |
| prism-sphere-shimmer-3d | SphereParticleBackground3D / Three | Three/WebGL | Contrato + visual | Esfera 3D, profundidad y material |
| solar-wind-streaks | ParticleBackground / canvas 2D | Tracers direccionales | Contrato | Ráfagas solares |
| crystal-shard-drift | ParticleBackground / canvas 2D | Formas geométricas | Contrato | Fragmentos cristalinos |
| monochrome-moire | ParticleBackground / canvas 2D | Procedural/grid | Contrato | Moiré monocromo |
| electro-silk-tendrils | ParticleBackground / canvas 2D | Ribbons/flujo | Contrato | Tendrils eléctricos |
| bg3d-lowpoly-terrain | ParticleBackground / Three | Escena 3D | Contrato + visual | Terreno low-poly |
| bg3d-crystal-shards | ParticleBackground / Three | Escena 3D | Contrato + visual | Cristales 3D |
| retro-grid-forward | RetroGridForward3D / shader Three | Shader/grid 3D | Contrato + visual | Shader, dirección y ángulo |

### Fondos de video importados

| ID | Archivo local | Formato | Estado |
|---|---|---|---|
| imported-video-1 | `public/backgrounds/video-imports/FONDO VIDEO 1.mp4` / `FONDO VIDEO 1 VERT.mp4` | 3840×2160 / 2160×3840, 30 fps | Copia local e integración seleccionable |
| imported-video-2 | `public/backgrounds/video-imports/FONDO VIDEO 2.mp4` / `FONDO VIDEO 2 VERT.mp4` | 3840×2160 / 2160×3840, 30 fps | Copia local e integración seleccionable |
| imported-video-3 | `public/backgrounds/video-imports/FONDO VIDEO 3.mp4` / `FONDO VIDEO 3 VERT.mp4` | 3840×2160 / 2160×3840, 30 fps | Copia local e integración seleccionable |
| imported-video-4 | `public/backgrounds/video-imports/FONDO VIDEO 4.mp4` / `FONDO VIDEO 4 VERT.mp4` | 3840×2160 / 2160×3840, 30 fps | Copia local e integración seleccionable |

## Contrato inicial

`background-contract.test.ts` cubre los 39 IDs activos, descriptores, capacidades, claves declaradas únicas, defaults numéricos finitos y ramas especiales resolubles sin forzar WebGL real en jsdom. El render visual queda reservado para QA manual.

F4 continúa con la QA manual estratificada de los representantes y fondos adicionales.

### `light-orbs` — investigación inicial

- `Número de partículas`, `Opacidad`, `Velocidad`, tamaños y colores llegan a `ParticleBackground` y sí participan en la ruta 2D común.
- `Line` no tiene consumidor en `ParticleBackground`; solo la rama `retro-grid-forward` pasa `particleLineThickness` a su shader 3D.
- Corrección aplicada: el control numérico `Line` deja de mostrarse en la rama no-`retro-grid-forward`, evitando un control sin efecto en `light-orbs` y en fondos 2D equivalentes.

### Representantes 2D — primer checkpoint

- `background-representatives.test.tsx`: PASS — `light-orbs`, `tech-network`, `nebula-cinematic` y `fluid-ribbons` montan canvas y no producen `NaN`/`Infinity` con frame determinista.
- El warning de `useLayoutEffect` durante render server-side es esperado en este test de contrato visual y no implica fallo de runtime; la validación real de animación queda para navegador/Remotion.
- `DNA Helix 3D`: RETIRADA — no se reconoce visualmente; retirada del catálogo activo por decisión del usuario y migración segura a `light-orbs` para documentos antiguos.
- `Falling Particles`: RETIRADA — redundante con `Floating Dust`; retirada del catálogo activo por decisión del usuario y migración segura a `floating-dust` para documentos antiguos.

### Cobertura automatizada de cierre

- `particles-tab.test.tsx`: 3 tests PASS. `Line` no aparece en `light-orbs` ni en `tech-network`; aparece solo en `retro-grid-forward` y su cambio actualiza `particleLineThickness`.
- `selection.test.ts`: migraciones PASS para `bg3d-dna-helix` → `light-orbs` y `falling-particles` → `floating-dust`; la selección conserva el resto del documento.
- `background-contract.test.ts`: 39/39 fondos activos cubiertos; los IDs retirados no forman parte del catálogo.
- Representantes 2D y arquitecturas especiales: PASS en render lógico/configuración sin forzar WebGL real en jsdom.
- Checkpoint final: 152/152 tests PASS; TypeScript PASS; ESLint PASS; Build PASS.

### QA manual estratificada

- `Floating Dust`: PASS — densidad modificable mediante slider sin Enter.
- `Light Orbs`: PASS — funcionamiento visual y ausencia de `Line`.
- `Tech Network`: PASS — nodos/conexiones y densidad modificables.
- `Nebula Cinematic`: PASS — opacidad visible y funcional.
- `Prism Sphere Shimmer 3D`: PASS — tamaño modificable; tamaños mínimo/máximo expuestos como sliders.
- `BG3D Lowpoly Terrain`: PASS — escala/tamaño visible.
- `BG3D Crystal Shards`: PASS — opacidad funcional.
- `Retro Grid Forward`: PASS — `Grosor de línea` es slider único y produce diferencia visual.
- Sanity checks: `Solar Wind Streaks` PASS — controles principal/secundario añadidos y funcionales; `Monochrome Moire` PASS — opacidad funcional.

## Cierre

`F4 — COMPLETADA`

# F0 — Matriz inicial de controles

Esta matriz inicial se completa durante F1–F4 con consumidor y efecto comprobado. Las celdas “pendiente” no autorizan eliminar controles.

| Área | Control visible | Estado observado | Consumidor/riesgo inicial |
|---|---|---|---|
| Global | Relación de aspecto | visible y funcional | `videoConfig.ts` |
| Global | Resolución | visible y funcional | `videoConfig.ts` y API |
| Global | Velocidad | visible | duración y motores; revisar unidad |
| Global | Fase | visible | `useMotionFrame` en la mayoría; revisar HUD/Scramble |
| Global | X/Y/Z inicial/final | visible | `MasterMotionLayer`; HUD tiene ruta propia |
| Texto | Plantilla | 27 opciones | `templateRegistry` |
| Texto | Texto completo | visible | `AnimationProps.text` |
| Texto | Fuente/tamaño global | no evidente en ruta auditada | controles legacy; recuperar en F2 |
| Texto | Relleno/borde/sombra | visible | depende de plantilla y `StyledRangeText` |
| Texto | Cursor Typewriter | ubicación incorrecta | usa `typewriterCursorFollowTextStyle`; mover en F3 |
| Fondo | Preset | 34 opciones | `ParticleBackground` y tres motores 3D |
| Fondo | N / densidad | visible | `safeCount` con multiplicadores por preset |
| Fondo | O / opacidad | visible | Canvas y adaptadores; mínimos internos |
| Fondo | S / velocidad | visible | tiempo del fondo; ADN además deriva vueltas |
| Fondo | Blur | visible | Canvas; ADN declara bloom ignorado |
| Fondo | Luces/material | visible para todos | luces de intensidad no consumidas en ruta principal |
| Exportar | modo único/lote | estado local | se pierde al desmontar pestaña |
| Exportar | transparencia/codec | visible | `/api/render` |
| Exportar | lote | visible al elegir modo | draft local se pierde al cambiar pestaña |

## Propiedades que requieren verificación de no-op

`particleLightIntensityA`, `particleLightIntensityB`, `particleLightIntensityC`, `particleGridAngle` fuera de Retro Grid, `particleLineThickness` fuera de Retro Grid, `particleBlur` en ADN, y la relación entre `particleOpacity`, `scale` y `turns` en los tres fondos 3D.

# TODO — Plan de Trabajo y Seguimiento

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-09
> **Progreso general:** 0% (fase de documentación completada)
>
> **Leyenda:** ✅ Completo | 🔄 En progreso | ⬜ Pendiente | ❌ Bloqueado | 🟡 En revisión

---

## Fase 0 — Definición y Estructura Documental

**Objetivo:** Crear la base documental del proyecto para poder retomarlo en cualquier momento.
**Duración:** Sesión inicial

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 0.1 | Extraer contenido del PRD desde .docx | ✅ | Conversación inicial con Codebuff |
| 0.2 | Analizar PRD y generar informe arquitectónico | ✅ | 10 secciones completadas |
| 0.3 | Crear estructura de carpetas del proyecto | ✅ | docs, core, decisions, planning, backend, frontend, database, prompts |
| 0.4 | Crear docs/core/PROJECT_STATE.md | ✅ | Estado actual del proyecto |
| 0.5 | Crear docs/core/ARCHITECTURE.md | ✅ | Arquitectura detallada |
| 0.6 | Crear docs/core/DECISIONS.md | ✅ | 6 ADRs registrados |
| 0.7 | Crear docs/core/TODO.md | ✅ | Este archivo |
| 0.8 | Crear docs/core/SESSION_LOG.md | ✅ | Registro de sesión inicial |
| 0.9 | Crear README.md raíz | ✅ | Portal de entrada |
| 0.10 | Crear docs/glossary.md | ✅ | Glosario de términos |
| 0.11 | Crear docs/risks.md | ✅ | Matriz de riesgos |
| 0.12 | Crear docs/workflow.md | ✅ | Flujo de trabajo con IA |
| 0.13 | Crear core/PRD.md | ✅ | PRD en Markdown |
| 0.14 | Crear core/requirements.md | ✅ | Requerimientos funcionales y no funcionales |
| 0.15 | Crear core/use-cases.md | ✅ | Casos de uso detallados |
| 0.16 | Crear core/business-rules.md | ✅ | Reglas de negocio |
| 0.17 | Crear decisions/template.md | ✅ | Plantilla ADR |
| 0.18 | Crear planning/roadmap.md | ✅ | Roadmap 5 fases |
| 0.19 | Crear planning/phase-1-panel-estatico.md | ✅ | Plan detallado Fase 1 |
| 0.20 | Crear backend/INDEX.md | ✅ | Esqueleto backend |
| 0.21 | Crear frontend/INDEX.md | ✅ | Esqueleto frontend |
| 0.22 | Crear database/INDEX.md | ✅ | Esqueleto base de datos |
| 0.23 | Crear prompts/INDEX.md | ✅ | Esqueleto prompts |

---

## Fase 1 — Panel Estático (Validación Visual)

**Objetivo:** Validar el diseño del panel con Franco Berardi antes de conectar el backend.
**Duración estimada:** 1–2 semanas
**Dependencia:** Ninguna (se puede empezar inmediatamente)

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1.1 | Inicializar repositorio Git + GitHub | ⬜ | Nombre sugerido: `lavalle11-panel` |
| 1.2 | Configurar proyecto React + Vite + TypeScript | ⬜ | `npm create vite@latest` |
| 1.3 | Configurar Tailwind CSS v4 | ⬜ | PostCSS + configuración |
| 1.4 | Configurar ESLint + Prettier | ⬜ | Consistencia de código |
| 1.5 | Configurar deploy automático en Vercel | ⬜ | Desde GitHub, auto-deploy main |
| 1.6 | Crear datos mock (8–12 casos tipos A–K) | ⬜ | `src/data/mockCases.ts` |
| 1.7 | Implementar layout del panel | ⬜ | Sidebar + header + grid |
| 1.8 | Implementar CaseCard con todos los campos | ⬜ | ID, nombre, práctica, OS, tiempo, resumen, flags, prioridad |
| 1.9 | Implementar barra de filtros | ⬜ | Cola general, mi bandeja, por tipo, por estado, seguimientos |
| 1.10 | Implementar modal de resolución completo | ⬜ | Todos los campos del PRD |
| 1.11 | Implementar selector de sede (Lavalle 11 / Chiclana) | ⬜ | |
| 1.12 | Implementar checkboxes de instrucciones de preparación | ⬜ | Ayuno, AINES, traer orden, etc. |
| 1.13 | Implementar vista previa del mensaje WhatsApp en tiempo real | ⬜ | Generación dinámica |
| 1.14 | Implementar botón de llamada WhatsApp (wa.me/) | ⬜ | Número precargado |
| 1.15 | Implementar indicadores de prioridad por color | ⬜ | Rojo, naranja, verde |
| 1.16 | Configurar Supabase project | ⬜ | Proyecto + credenciales |
| 1.17 | Implementar autenticación con Supabase Auth | ⬜ | Email + password |
| 1.18 | Implementar roles asesor / administrador | ⬜ | Vistas diferenciadas |
| 1.19 | Implementar AuthGuard en rutas protegidas | ⬜ | |
| 1.20 | Validar diseño con Franco Berardi | ⬜ | Feedback y ajustes |

---

## Fase 2 — Backend y Webhook de Callbell

**Objetivo:** El panel recibe casos reales de Callbell en tiempo real.
**Duración estimada:** 1–2 semanas
**Dependencia:** Fase 1 completada

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.1 | Configurar proyecto backend en Vercel Functions | ⬜ | Dentro del mismo repo |
| 2.2 | Crear endpoint `POST /api/callbell/webhook` | ⬜ | |
| 2.3 | Implementar validación de firma HMAC del webhook | ⬜ | |
| 2.4 | Procesar evento `message_created` (status = received) | ⬜ | |
| 2.5 | Procesar eventos `conversation_opened` y `conversation_closed` | ⬜ | |
| 2.6 | Crear registro en tabla `casos` con datos crudos | ⬜ | |
| 2.7 | Conectar Supabase Realtime al frontend | ⬜ | |
| 2.8 | Implementar idempotencia (evitar duplicados) | ⬜ | Por callbell_uuid + message_id |
| 2.9 | Manejar adjuntos (imágenes/PDF) | ⬜ | Almacenar URL de Callbell |

---

## Fase 3 — Análisis con Claude IA

**Objetivo:** Las cards aparecen con datos prellenados y resumen de IA.
**Duración estimada:** 2–3 semanas
**Dependencia:** Fase 2 completada

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 3.1 | Integrar SDK `@anthropic-ai/sdk` | ⬜ | |
| 3.2 | Construir prompt del sistema | ⬜ | Catálogo, reglas, schema JSON |
| 3.3 | Implementar procesamiento de imágenes (base64) | ⬜ | |
| 3.4 | Implementar extracción de campos estructurados | ⬜ | |
| 3.5 | Almacenar resultado en `extraccion_ia` | ⬜ | |
| 3.6 | Calcular score de confianza global (0–1) | ⬜ | |
| 3.7 | Generar flags automáticos | ⬜ | ayuno, copago, baja confianza, etc. |
| 3.8 | Clasificar tipo de caso (A–K) | ⬜ | |
| 3.9 | Calcular prioridad (urgente/normal/bajo) | ⬜ | |
| 3.10 | Implementar resolución automática Tipo B | ⬜ | Sin card para el asesor |
| 3.11 | Integrar Google Sheets API | ⬜ | |
| 3.12 | Implementar cache local en tabla `configuracion` | ⬜ | TTL 5 minutos |
| 3.13 | Implementar detección de contactos recurrentes | ⬜ | Búsqueda por teléfono |

---

## Fase 4 — Acciones del Asesor (Flujo Completo)

**Objetivo:** El flujo completo funciona de punta a punta (WhatsApp → panel → WhatsApp).
**Duración estimada:** 2–3 semanas
**Dependencia:** Fase 3 completada

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 4.1 | Integrar Callbell Messages API | ⬜ | Envío de mensajes |
| 4.2 | Implementar endpoint `POST /api/casos/:id/enviar` | ⬜ | |
| 4.3 | Implementar flujo de confirmación de turno | ⬜ | Panel → API → WhatsApp |
| 4.4 | Implementar endpoint `POST /api/casos/:id/llamada` | ⬜ | |
| 4.5 | Implementar endpoint `POST /api/casos/:id/cerrar` | ⬜ | |
| 4.6 | Implementar derivación a Chiclana con notificación | ⬜ | WhatsApp automático |
| 4.7 | Implementar registro de llamadas | ⬜ | |
| 4.8 | Implementar cierre de conversación en Callbell | ⬜ | API call |
| 4.9 | Implementar respuesta automática para prácticas no disponibles | ⬜ | |
| 4.10 | Implementar manejo de errores y retry en envíos | ⬜ | Cola de reintentos |

---

## Fase 5 — Seguimiento y Métricas

**Objetivo:** Visibilidad total del pipeline de consultas.
**Duración estimada:** 2 semanas
**Dependencia:** Fase 4 (puede solaparse parcialmente)

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 5.1 | Implementar sistema de notas internas con fecha de seguimiento | ⬜ | |
| 5.2 | Implementar vista de seguimientos pendientes del día | ⬜ | |
| 5.3 | Implementar reconocimiento de contactos recurrentes | ⬜ | Historial por teléfono |
| 5.4 | Implementar tablero de métricas operativas | ⬜ | KPIs, gráficos |
| 5.5 | Implementar historial completo por caso | ⬜ | Timeline de eventos |
| 5.6 | Implementar exportación de datos básica (CSV) | ⬜ | |
| 5.7 | Implementar endpoint `GET /api/metricas` | ⬜ | Admin only |
| 5.8 | Pruebas de carga y estabilidad | ⬜ | |

---

## Bugs y Mejoras Post-Lanzamiento

| # | Descripción | Severidad | Estado |
|---|---|---|---|
| — | Sin reportes aún | — | — |

---

## Resumen de Progreso

| Fase | Total Tareas | ✅ Completas | 🔄 En progreso | ⬜ Pendientes | % Avance |
|---|---|---|---|---|---|
| **Fase 0** — Documentación | 23 | 23 | 0 | 0 | **100%** |
| **Fase 1** — Panel estático | 20 | 0 | 0 | 20 | **0%** |
| **Fase 2** — Backend + Webhook | 9 | 0 | 0 | 9 | **0%** |
| **Fase 3** — Claude IA | 13 | 0 | 0 | 13 | **0%** |
| **Fase 4** — Acciones asesor | 10 | 0 | 0 | 10 | **0%** |
| **Fase 5** — Métricas | 8 | 0 | 0 | 8 | **0%** |
| **Total general** | **83** | **23** | **0** | **60** | **28%** |

---

## Notas Importantes

- Las fases **deben completarse en orden** (cada una depende de la anterior)
- **Fase 1** no necesita backend — solo datos mock en el frontend. Se puede (y debe) empezar ya
- La **validación con Franco** después de Fase 1 es un punto de no retorno: si el diseño no convence, es más barato cambiarlo ahora que después
- Los costos de **Claude API** deben monitorearse desde el día 1 de Fase 3
- **Commits frecuentes** con mensajes descriptivos siguiendo conventional commits

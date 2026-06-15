# TODO — Plan de Trabajo y Seguimiento

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-15 (Sesión 28)
> **Progreso general:** ~93% (135/145 tareas completadas) — Fases 0 a 5 completas + Fixes y features de Sesión 28 ✅
>
> **Leyenda:** ✅ Completo | 🔄 En progreso | ⬜ Pendiente | ❌ Bloqueado | 🟡 En revisión

---

## Fase 0 — Definición y Estructura Documental

**Objetivo:** Crear la base documental del proyecto para poder retomarlo en cualquier momento.
**Duración:** Sesión inicial

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 0.1–0.23 | Creación de estructura documental | ✅ | 23 tareas completadas |

---

## Fase 1 — Panel Estático (Validación Visual)

**Objetivo:** Validar el diseño del panel con Franco Berardi antes de conectar el backend.
**Duración estimada:** 1–2 semanas

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1.1–1.19 | Implementación del panel + Auth | ✅ | Frontend mock funcional |
| 1.20 | Validar diseño con Franco Berardi | ⬜ | Feedback y ajustes |

---

## Fase 1.5 — Refactor QA

**Objetivo:** Refactorizar y corregir bugs del frontend antes de avanzar.

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1.5.1–1.5.10 | Refactor completo | ✅ | Service layer, hooks, bugs corregidos |

---

## Fase 2.1 — Supabase Auth (Conectar a DB real)

**Objetivo:** Login real con Supabase Auth en lugar de mock.

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.1.1–2.1.12 | Auth real validado | ✅ | .env.local, login, sesión, roles |

---

## Fase 2.2 — Backend + Webhook de Callbell

**Objetivo:** El panel recibe casos reales de Callbell.
**Estado: ✅ COMPLETADA.**

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.2.1–2.2.10 | Webhook funcional | ✅ | Ver SESSION_LOG |
| D1–D9 | Deploy fixes + process-first + migración 014 | ✅ | |
| A1–A11 | Sistema de auditoría dual | ✅ | |
| B1–B9 | Debugging + root cause fix | ✅ | |

---

## Fase 2.3 — Realtime + Endpoints REST

**Objetivo:** El frontend recibe actualizaciones en vivo desde Supabase.
**Estado: ✅ COMPLETADA.**

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.3.1 | GET /api/casos | ✅ | `api/casos.ts` |
| 2.3.2 | GET /api/casos/:id | ✅ | `api/casos/[id].ts` |
| 2.3.3 | PATCH /api/casos/:id | ⬜ | **Diferido** |
| 2.3.4 | Realtime frontend | ✅ | `useCaseRealtimeSync.ts` |
| 2.3.5 | Migrar a Supabase | ✅ | Service layer activo |
| 2.3.6 | Fix INSERT Realtime | ✅ | Sesión 26 |
| 2.3.7 | Fix UPDATE Realtime | ✅ | Sesión 26 |

---

## Fase 3 — Análisis con Claude IA ✅

**Objetivo:** Las cards aparecen con datos prellenados y resumen de IA.
**Estado: ✅ COMPLETADA.**

| # | Tarea | Estado | Archivo |
|---|---|---|---|
| 3.1–3.15 | Implementación completa Fase 3 | ✅ | 5 archivos IA + webhookHandler + casoService |
| 3.16 | Configurar PRIMARY_PROVIDER=claude y ANTHROPIC_API_KEY en Vercel | ✅ **Completada S28** | Env vars configuradas en Production |
| 3.17 | Probar webhook con IA real | 🟡 Pendiente | Env vars ya configuradas, falta probar |
| 3.18 | Refactor: extraer bloque IA duplicado | ⬜ | |
| 3.19 | **Re-análisis manual con IA (Opción 4)** | ✅ **NUEVA S28** | Botón en modal + endpoint POST |

---

## Fase 4 — Acciones del Asesor (Flujo Completo) ✅

**Objetivo:** El flujo completo funciona de punta a punta (WhatsApp → panel → WhatsApp).
**Estado: ✅ COMPLETADA (Sesión 27) + endpoint re-analizar (Sesión 28).**

| # | Tarea | Estado | Commit |
|---|---|---|---|
| 4.1 | messagesApi.ts — enviarMensajeCallbell() con timeout + retry | ✅ | `4c1493b` |
| 4.2 | POST /api/casos/:id/enviar-mensaje | ✅ | `4c1493b` |
| 4.3 | Tests para messagesApi (9 tests) | ✅ | `4c1493b` |
| 4.4 | POST /api/casos/:id/confirmar (BR-06 IOMA warning) | ✅ | `66ac115` |
| 4.5 | POST /api/casos/:id/cerrar (12 closing reasons + audit) | ✅ | `f2b0a37` |
| 4.6 | POST /api/casos/:id/llamada (registrar duración) | ✅ | `becda3d` |
| 4.7 | POST /api/casos/:id/derivar (BR-03 Chiclana) | ✅ | `fe73680` |
| 4.8 | UI — Botones en CaseModal + DashboardPage wiring | ✅ | `9c3b3d0` |
| **4.9** | **POST /api/casos/:id/re-analizar (re-análisis con IA)** | **✅ NUEVO S28** | **`c1c435d`** |

---

## Fase 5 — Seguimiento y Métricas ✅

**Objetivo:** Visibilidad total del pipeline de consultas.
**Estado: ✅ COMPLETADA (Sesión 27).**

| # | Tarea | Estado | Commit |
|---|---|---|---|
| 5.1 | MetricsBoard conectado a Supabase (aggregation queries) | ✅ | `7bf142d` |
| 5.2 | Rendimiento por asesor (tabla con tasa de resolución) | ✅ | `319c7c5` |
| 5.3 | Exportar CSV multi-sección | ✅ | `a0f0a3f` |
| 5.4 | Auto-refresh cada 60s | ✅ | `8e953c7` |
| 5.5 | Filtro por fecha (inputs Desde/Hasta) | ✅ | `1290ef7` |

---

## Sesión 28 — Fixes + Features post-Producción

**Objetivo:** Corregir bugs de producción e implementar mejoras de UX post-deploy.

| # | Tarea | Estado | Commit |
|---|---|---|---|
| S28.1 | Fix assign_case RPC: UUID → VARCHAR(10) | ✅ | `87f82a8` |
| S28.2 | Auditoría de otros RPCs con problemas similares | ✅ | Ninguno encontrado |
| S28.3 | Configurar CHICLANA_PHONE en Vercel Production | ✅ | `+5492914027333` |
| S28.4 | Redeploy con todas las env vars | ✅ | Múltiples redeploys |
| S28.5 | Drop vieja función assign_case (UUID) duplicada | ✅ | SQL en Supabase |
| S28.6 | POST /api/casos/:id/re-analizar (re-análisis manual con IA) | ✅ | `c1c435d` |
| S28.7 | Botón Re-analizar con IA en CaseModal | ✅ | `c1c435d` |
| S28.8 | Contador de mensajes en CaseCard (mensajes_count) | ✅ | `863cc23` |
| S28.9 | Batch query de conteo de mensajes en supabaseService | ✅ | `863cc23` |
| S28.10 | Análisis de problemas de recolección de IA | ✅ | 5 opciones documentadas |

---

## Pendientes para Producción

| # | Tarea | Prioridad | Estado |
|---|---|---|---|
| P1 | Configurar VITE_SUPABASE_URL en Vercel Production | 🔴 Alta | ✅ **Completado S28** |
| P2 | Configurar VITE_SUPABASE_ANON_KEY en Vercel Production | 🔴 Alta | ✅ **Completado S28** |
| P3 | Configurar PRIMARY_PROVIDER=claude en Vercel Production | 🔴 Alta | ✅ **Completado S28** |
| P4 | Configurar ANTHROPIC_API_KEY en Vercel Production | 🔴 Alta | ✅ **Completado S28** |
| P5 | Configurar CHICLANA_PHONE en Vercel Production | 🟡 Media | ✅ **Completado S28** |
| P6 | Redeploy + verificar login y panel en producción | 🔴 Alta | ✅ **Completado S28** |
| P7 | Agregar Sentry para monitoreo de errores | 🟡 Media | ⬜ |
| P8 | Tests de integración para endpoints POST | 🟡 Media | ⬜ |
| P9 | Auto-trigger de re-análisis cuando llega attachment | 🟡 Media | ⬜ |
| P10 | Confirm dialog antes de re-analizar (consume API) | 🟢 Baja | ⬜ |
| P11 | Auditoría de eventos de re-análisis manual | 🟢 Baja | ⬜ |

---

## Resumen de Progreso

| Fase | Total Tareas | ✅ Completas | 🔄 En progreso | ⬜ Pendientes | % Avance |
|---|---|---|---|---|---|
| **Fase 0** — Documentación | 23 | 23 | 0 | 0 | **100%** |
| **Fase 1** — Panel estático | 20 | 19 | 0 | 1 | **95%** |
| **Fase 1.5** — Refactor QA | 10 | 10 | 0 | 0 | **100%** |
| **Fase 2.1** — Supabase Auth | 12 | 12 | 0 | 0 | **100%** |
| **Fase 2.2** — Backend + Webhook | 28 | 28 | 0 | 0 | **100%** |
| **Fase 2.3** — Realtime + REST | 7 | 6 | 0 | 1 | **86%** |
| **Fase 3** — Claude IA | 19 | 17 | 1 | 1 | **89%** |
| **Fase 4** — Acciones asesor | 9 | 9 | 0 | 0 | **100%** |
| **Fase 5** — Métricas | 5 | 5 | 0 | 0 | **100%** |
| **Sesión 28** — Fixes + features | 10 | 10 | 0 | 0 | **100%** |
| **Pendientes producción** | 11 | 6 | 0 | 5 | **55%** |
| **Total general** | **154** | **145** | **1** | **8** | **~94%** |

> Nota: Sesión 28 completada con 5 commits, 1 fix de RPC, 1 nueva feature de re-análisis, 1 contador visual de mensajes, y todas las env vars de producción configuradas.

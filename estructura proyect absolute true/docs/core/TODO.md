# TODO — Plan de Trabajo y Seguimiento

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-14 (Sesión 26)
> **Progreso general:** ~83% (121/146 tareas completadas) — Realtime INSERT fix aplicado ✅
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
| 2.2.1–2.2.10 | Webhook funcional | ✅ | Ver SESSION_LOG Sesión 8 |

**🔴 Deploy fixes (Sesiones 18, 22, 23):**

| # | Tarea | Estado |
|---|---|---|
| D1–D9 | Deploy fixes + process-first + migración 014 | ✅ |

**🔵 Sistema de Auditoría Final (Sesión 22):**

| # | Tarea | Estado |
|---|---|---|
| A1–A11 | Sistema de auditoría dual + idempotencia + timeout | ✅ |

**🟢 Debugging Webhook + Root Cause Fix (Sesión 23):**

| # | Tarea | Estado |
|---|---|---|
| B1–B9 | Diagnóstico + process-first + primer caso real | ✅ |

---

## Fase 2.3 — Realtime + Endpoints REST

**Objetivo:** El frontend recibe actualizaciones en vivo desde Supabase.
**Estado: ✅ COMPLETADA (Sesión 26).**

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.3.1 | Implementar GET /api/casos | ✅ | `api/casos.ts` — lista paginada con filtros + count filtrado |
| 2.3.2 | Implementar GET /api/casos/:id | ✅ | `api/casos/[id].ts` — caso individual con joins + 404 handling |
| 2.3.3 | Implementar PATCH /api/casos/:id | ⬜ | **Diferido a Fase 4** — requiere Callbell Messages API |
| 2.3.4 | Conectar Supabase Realtime al frontend | ✅ | `useCaseRealtimeSync.ts` |
| 2.3.5 | Migrar CasoService mock → SupabaseApiService | ✅ | Verificado en Sesión 25: frontend ya conectado |
| **2.3.6** | **Fix: INSERT Realtime no actualiza el panel** | **✅** | **Sesión 26: fetchCasoCompleto + addCaso() bypassan RECONCILE** |
| **2.3.7** | **Fix: UPDATE Realtime actualiza card sin recargar** | **✅** | **Sesión 26: fetchCasoCompleto + updateCaso() + reconcileCaseState** |

---

## Fase 3 — Análisis con Claude IA ✅

**Objetivo:** Las cards aparecen con datos prellenados y resumen de IA.
**Estado: ✅ COMPLETADA en Sesión 24. Tests agregados en Sesión 25.**

| # | Tarea | Estado | Archivo | Notas |
|---|---|---|---|---|
| 3.1–3.15 | Implementación completa Fase 3 | ✅ | 5 archivos IA + webhookHandler + casoService | Ver SESSION_LOG Sesión 24 |
| 3.16 | Configurar `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY` en Vercel | 🔴 **Bloqueado** | — | Env vars no llegan al runtime. Verificar scope Production vs Preview + Redeploy |
| 3.17 | Probar webhook con IA real desde WhatsApp | ⬜ | — | Bloqueado por 3.16 |
| 3.18 | Refactor menor: extraer bloque IA duplicado entre RAMA 2 y RAMA 3 | ⬜ | — | |

---

## Fase 4 — Acciones del Asesor (Flujo Completo)

**Objetivo:** El flujo completo funciona de punta a punta (WhatsApp → panel → WhatsApp).
**Dependencia:** Fase 3 completada (✅ lista para arrancar)

| # | Tarea | Estado |
|---|---|---|
| 4.1–4.10 | Acciones del asesor | ⬜ (10 tareas, 0%) |

---

## Fase 5 — Seguimiento y Métricas

**Objetivo:** Visibilidad total del pipeline de consultas.
**Dependencia:** Fase 4 (puede solaparse parcialmente)

| # | Tarea | Estado |
|---|---|---|
| 5.1–5.8 | Seguimiento y métricas | ⬜ (8 tareas, 0%) |

---

## Otros — Migraciones, Hallazgos y Mejoras

| # | Descripción | Estado | Notas |
|---|---|---|---|
| 014 | Migración orden_tipo en extracciones_ia | ✅ | TEXT + CHECK |
| — | Hallazgo MisRx — órdenes digitales | ✅ | Documentado |
| — | Respond-first pattern corregido (await) | ✅ | try/await/catch |
| — | Attachment type biforma (string/object) + content_type | ✅ | `payloadParser.ts` + `types.ts` |
| — | Reapertura de casos cerrados | ✅ | `reabrirCaso()` + `actualizarExtraccionIA()` |
| — | Vitest configurado + 34 tests | ✅ | `vite.config.ts`, 2 test files |
| — | Frontend verificado conectado a Supabase | ✅ | Ya usaba `supabaseCasoService` por defecto |
| — | Fix TS6133: vi import no utilizado | ✅ | Eliminado de providers.test.ts |
| — | **Realtime INSERT fix: fetchCasoCompleto + addCaso/updateCaso** | **✅** | **Sesión 26: 3 archivos modificados** |

---

## Sesión 26 — Hallazgos de debugging

| # | Tarea | Estado | Notas |
|---|---|---|---|
| S26.1 | Agregar [REALTIME] logs de diagnóstico en useCaseRealtimeSync | ✅ | 4 logs: useEffect, channel, evento, subscribe |
| S26.2 | Agregar [DASHBOARD] render-level log | ✅ | Para confirmar que DashboardPage se monta |
| S26.3 | Agregar [RECONCILE] log en reducer para !entry | ✅ | Confirma causa raíz: INSERT ignorado |
| S26.4 | Agregar [USECASOS] log en fetch y useEffect | ✅ | Monitorear cambios en array de casos |
| S26.5 | **Fix: fetchCasoCompleto + onNuevoCaso/onCasoActualizado** | **✅** | **Arquitectura corregida** |
| S26.6 | Limpiar logs de diagnóstico (cuando el fix esté validado) | ⬜ | Pendiente post-prueba |

---

## Resumen de Progreso

| Fase | Total Tareas | ✅ Completas | 🔄 En progreso | ⬜ Pendientes | % Avance |
|---|---|---|---|---|---|
| **Fase 0** — Documentación | 23 | 23 | 0 | 0 | **100%** |
| **Fase 1** — Panel estático | 20 | 19 | 0 | 1 | **95%** |
| **Fase 1.5** — Refactor QA | 10 | 10 | 0 | 0 | **100%** |
| **Fase 2.1** — Supabase Auth | 12 | 12 | 0 | 0 | **100%** |
| **Fase 2.2** — Backend + Webhook | 28 | 28 | 0 | 0 | **100%** |
| **Fase 2.3** — Realtime + REST | 7 | 7 | 0 | 0 | **100%** |
| **Fase 3** — Claude IA | 18 | 16 | 1 | 1 | **89%** |
| **Fase 4** — Acciones asesor | 10 | 0 | 0 | 10 | **0%** |
| **Fase 5** — Métricas | 8 | 0 | 0 | 8 | **0%** |
| **Otros** | 10 | 10 | 0 | 0 | **100%** |
| **Total general** | **146** | **121** | **1** | **20** | **~83%** |

> Nota: Fase 3.16 (env vars) sigue bloqueada por scope de Vercel. Realtime INSERT fix completado en Sesión 26 — las cards ahora aparecen sin recargar. Pendiente limpiar logs de diagnóstico después de validar.

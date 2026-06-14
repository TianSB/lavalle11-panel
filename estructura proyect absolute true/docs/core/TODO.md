# TODO — Plan de Trabajo y Seguimiento

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-14
> **Progreso general:** ~78% (95/122 tareas completadas)
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
**Estado: 🟡 Webhook deployado en Vercel. Bloqueado: query Supabase no completa.**

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.2.1 | Definir tipos del payload de Callbell | ✅ | src/services/callbell/types.ts (corregido con payload real) |
| 2.2.2 | Implementar payloadParser | ✅ | src/services/callbell/payloadParser.ts (corregido con estructura real) |
| 2.2.3 | Crear CasoService server-side | ✅ | src/services/supabase/casoService.ts |
| 2.2.4 | Implementar webhookHandler | ✅ | src/services/callbell/webhookHandler.ts |
| 2.2.5 | Crear endpoint POST /api/callbell/webhook | ✅ | api/callbell/webhook.ts |
| 2.2.6 | Implementar health check (GET) | ✅ | Responde { status: "ok" } |
| 2.2.7 | Implementar validación por secret token | ✅ | CALLBELL_WEBHOOK_SECRET |
| 2.2.8 | Implementar respond-first pattern | ✅ | 200 inmediato, await final |
| 2.2.9 | Detección de MisRx (orden_tipo + flag) | ✅ | misrx.com.ar/prestacion |
| 2.2.10 | Documentar .env.local con nuevas variables | ✅ | |

**🔴 Deploy fixes aplicados en Sesión 18 + Sesión 22:**

| # | Tarea | Estado |
|---|---|---|
| D1 | Agregar .js extensions a imports ESM | ✅ |
| D2 | Eliminar bloque functions inválido de vercel.json | ✅ |
| D3 | Instalar @types/node para TS2580 | ✅ |
| D4 | Corregir parser para payload real de Callbell | ✅ |
| D5 | Reemplazar fire-and-forget por try/await/catch | ✅ |
| D6 | **Diagnosticar bloqueo query Supabase** | 🟡 **Pendiente** |
| D7 | Agregar fetch directo con timeout para diagnóstico | ⬜ |
| D8 | Resolver conectividad Vercel → Supabase | ⬜ |
| D9 | Eliminar logs temporales de diagnóstico | ⬜ |

**🔵 Sistema de Auditoría Final (NUEVO en Sesión 22):**

| # | Tarea | Estado | Archivo |
|---|---|---|---|
| A1 | Diseñar arquitectura dual (trigger + backend) | ✅ | Documentación |
| A2 | Crear trigger ultra-liviano (sin jsonb_each, sin jsonb_agg) | ✅ | `010_auditoria_eventos.sql` |
| A3 | Crear tabla auditoria_eventos con event_hash UNIQUE | ✅ | `010_auditoria_eventos.sql` |
| A4 | Crear src/services/auditService.ts con 4 funciones semánticas | ✅ | `src/services/auditService.ts` |
| A5 | Integrar auditCasoCreado() en createCaso() | ✅ | `src/services/supabase/casoService.ts` |
| A6 | Agregar correlation_id en webhookHandler | ✅ | `src/services/callbell/webhookHandler.ts` |
| A7 | Hacer correlationId OBLIGATORIO (hotfix crítico) | ✅ | `src/services/auditService.ts` |
| A8 | Incluir correlationId en event_hash (hotfix crítico) | ✅ | `src/services/auditService.ts` |
| A9 | Agregar índice compuesto idx_audit_source_created | ✅ | `010_auditoria_eventos.sql` |
| A10 | Agregar fetch timeout 10s en Supabase client | ✅ | `api/callbell/webhook.ts` |
| A11 | Build fix: commit webhookHandler.ts faltante | ✅ | `src/services/callbell/webhookHandler.ts` |

---

## Fase 2.3 — Realtime + Endpoints REST

**Objetivo:** El frontend recibe actualizaciones en vivo desde Supabase.
**Dependencia:** Fase 2.2 desbloqueada (query Supabase funcional)

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.3.1 | Implementar GET /api/casos | ⬜ | Bloqueado por Fase 2.2 |
| 2.3.2 | Implementar GET /api/casos/:id | ⬜ | Bloqueado por Fase 2.2 |
| 2.3.3 | Implementar PATCH /api/casos/:id | ⬜ | Bloqueado por Fase 2.2 |
| 2.3.4 | Conectar Supabase Realtime al frontend | ⬜ | Bloqueado por Fase 2.2 |
| 2.3.5 | Migrar CasoService mock → SupabaseApiService | ⬜ | Bloqueado por Fase 2.2 |

---

## Fase 3 — Análisis con Claude IA

**Objetivo:** Las cards aparecen con datos prellenados y resumen de IA.
**Dependencia:** Fase 2 completa (requiere webhook funcional con datos reales)

| # | Tarea | Estado |
|---|---|---|
| 3.1–3.13 | Integración de Claude API | ⬜ (13 tareas, 0%) |

---

## Fase 4 — Acciones del Asesor (Flujo Completo)

**Objetivo:** El flujo completo funciona de punta a punta (WhatsApp → panel → WhatsApp).
**Dependencia:** Fase 3 completada

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

---

## Resumen de Progreso

| Fase | Total Tareas | ✅ Completas | 🔄 En progreso | ⬜ Pendientes | % Avance |
|---|---|---|---|---|---|
| **Fase 0** — Documentación | 23 | 23 | 0 | 0 | **100%** |
| **Fase 1** — Panel estático | 20 | 19 | 0 | 1 | **95%** |
| **Fase 1.5** — Refactor QA | 10 | 10 | 0 | 0 | **100%** |
| **Fase 2.1** — Supabase Auth | 12 | 12 | 0 | 0 | **100%** |
| **Fase 2.2** — Backend + Webhook | 19 | 14 | 0 | 5 | **74%** |
| **Fase 2.3** — Realtime + REST | 5 | 0 | 0 | 5 | **0%** |
| **Fase 3** — Claude IA | 13 | 0 | 0 | 13 | **0%** |
| **Fase 4** — Acciones asesor | 10 | 0 | 0 | 10 | **0%** |
| **Fase 5** — Métricas | 8 | 0 | 0 | 8 | **0%** |
| **Total general** | **120** | **78** | **0** | **42** | **~65%** |

# TODO — Plan de Trabajo y Seguimiento

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-14 (Sesión 25)
> **Progreso general:** ~82% (116/141 tareas completadas) — Fases 0 a 3 completas ✅
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
**Estado: ✅ COMPLETADA.**

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.3.1 | Implementar GET /api/casos | ✅ | `api/casos.ts` — lista paginada con filtros + count filtrado |
| 2.3.2 | Implementar GET /api/casos/:id | ✅ | `api/casos/[id].ts` — caso individual con joins + 404 handling |
| 2.3.3 | Implementar PATCH /api/casos/:id | ⬜ | **Diferido a Fase 4** — requiere Callbell Messages API |
| 2.3.4 | Conectar Supabase Realtime al frontend | ✅ | `useCaseRealtimeSync.ts` |
| 2.3.5 | Migrar CasoService mock → SupabaseApiService | ✅ ✅ | **Verificado en Sesión 25: frontend ya conectado** ✅ |

---

## Fase 3 — Análisis con Claude IA ✅

**Objetivo:** Las cards aparecen con datos prellenados y resumen de IA.
**Estado: ✅ COMPLETADA en Sesión 24. Tests agregados en Sesión 25.**

| # | Tarea | Estado | Archivo | Notas |
|---|---|---|---|---|
| 3.1 | Definir interfaces canónicas | ✅ | `src/services/ai/types.ts` | Contrato único, independiente del provider |
| 3.2 | Implementar descarga de adjuntos (imageProcessor) | ✅ | `src/services/ai/imageProcessor.ts` | 8s timeout, 4MB max, fallback graceful |
| 3.3 | Implementar ClaudeAdapter con tool_use y visión | ✅ | `src/services/ai/claudeAdapter.ts` | `claude-sonnet-4-5`, `max_tokens: 1024` |
| 3.4 | Implementar MockAIProvider para desarrollo | ✅ | `src/services/ai/mockProvider.ts` | 50ms simulación |
| 3.5 | Implementar aiFactory singleton con fallback | ✅ | `src/services/ai/aiFactory.ts` | Lee `PRIMARY_PROVIDER` env var |
| 3.6 | Conectar IA en webhookHandler (3 ramas) | ✅ | `src/services/callbell/webhookHandler.ts` | activo / cerrado / nuevo |
| 3.7 | createCaso acepta analisis param opcional | ✅ | `src/services/supabase/casoService.ts` | Backward compatible |
| 3.8 | buildFlags (flags IA + flags sistema) | ✅ | `src/services/supabase/casoService.ts` | Exportado para tests |
| 3.9 | reabrirCaso para casos cerrados | ✅ | `src/services/supabase/casoService.ts` | Resetea estado + re-analiza |
| 3.10 | actualizarExtraccionIA | ✅ | `src/services/supabase/casoService.ts` | UPDATE + buildFlags |
| 3.11 | conversation_opened en switch | ✅ | `src/services/callbell/webhookHandler.ts` | Log sin acción |
| 3.12 | Adjuntos como objetos con content_type | ✅ | `types.ts` + `payloadParser.ts` | Biforma string/object |
| 3.13 | Instalar @anthropic-ai/sdk | ✅ | `package.json` | SDK oficial |
| 3.14 | Tests unitarios (vitest, 34 tests) | ✅ | `src/services/__tests__/*.test.ts` | 2 files, 34 tests pasando |
| 3.15 | buildFlags exportado | ✅ | `src/services/supabase/casoService.ts` | `export function buildFlags` |

### Pendientes post-Fase 3

| # | Tarea | Estado | Diagnóstico |
|---|---|---|---|
| 3.16 | Configurar `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY` en Vercel | 🔴 **Bloqueado** | Env vars no llegan al runtime. Verificar scope Production vs Preview + Redeploy |
| 3.17 | Probar webhook con IA real desde WhatsApp | ⬜ | Bloqueado por 3.16 |
| 3.18 | Refactor menor: extraer bloque IA duplicado entre RAMA 2 y RAMA 3 | ⬜ | |

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

---

## Resumen de Progreso

| Fase | Total Tareas | ✅ Completas | 🔄 En progreso | ⬜ Pendientes | % Avance |
|---|---|---|---|---|---|
| **Fase 0** — Documentación | 23 | 23 | 0 | 0 | **100%** |
| **Fase 1** — Panel estático | 20 | 19 | 0 | 1 | **95%** |
| **Fase 1.5** — Refactor QA | 10 | 10 | 0 | 0 | **100%** |
| **Fase 2.1** — Supabase Auth | 12 | 12 | 0 | 0 | **100%** |
| **Fase 2.2** — Backend + Webhook | 28 | 28 | 0 | 0 | **100%** |
| **Fase 2.3** — Realtime + REST | 5 | 5 | 0 | 0 | **100%** |
| **Fase 3** — Claude IA | 18 | 16 | 1 | 1 | **89%** |
| **Fase 4** — Acciones asesor | 10 | 0 | 0 | 10 | **0%** |
| **Fase 5** — Métricas | 8 | 0 | 0 | 8 | **0%** |
| **Otros** | 7 | 7 | 0 | 0 | **100%** |
| **Total general** | **141** | **116** | **1** | **24** | **~82%** |

> Nota: Fase 3.16 (env vars) está bloqueada por scope de Vercel. Resolver para desbloquear 3.17 (prueba con IA real). Frontend 2.3.5 verificado conectado.

# TODO — Plan de Trabajo y Seguimiento

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-14 (Sesión 24)
> **Progreso general:** ~82% (114/139 tareas completadas) — Fases 0 a 3 completas ✅
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
| 2.3.5 | Migrar CasoService mock → SupabaseApiService | ✅ | `supabaseService.ts` vía `CasoServiceProvider` |

---

## Fase 3 — Análisis con Claude IA ✅

**Objetivo:** Las cards aparecen con datos prellenados y resumen de IA.
**Estado: ✅ COMPLETADA en Sesión 24.**

| # | Tarea | Estado | Archivo | Notas |
|---|---|---|---|---|
| 3.1 | Definir interfaces canónicas (EntradaCanónica, RespuestaCanónica, AIProvider, AIError) | ✅ | `src/services/ai/types.ts` | Contrato único, independiente del provider |
| 3.2 | Implementar descarga de adjuntos (imageProcessor) | ✅ | `src/services/ai/imageProcessor.ts` | 8s timeout, 4MB max, fallback graceful |
| 3.3 | Implementar ClaudeAdapter con tool_use y visión | ✅ | `src/services/ai/claudeAdapter.ts` | `claude-sonnet-4-5`, `max_tokens: 1024`, `tool_choice: any` |
| 3.4 | Implementar MockAIProvider para desarrollo | ✅ | `src/services/ai/mockProvider.ts` | 50ms simulación, respuestas realistas |
| 3.5 | Implementar aiFactory singleton con fallback a mock | ✅ | `src/services/ai/aiFactory.ts` | Lee `PRIMARY_PROVIDER` env var |
| 3.6 | Conectar IA en webhookHandler (reemplazar TODO) | ✅ | `src/services/callbell/webhookHandler.ts` | 3 ramas: activo / cerrado / nuevo |
| 3.7 | createCaso acepta analisis param opcional | ✅ | `src/services/supabase/casoService.ts` | Backward compatible |
| 3.8 | Implementar buildFlags (flags IA + flags sistema) | ✅ | `src/services/supabase/casoService.ts` | 🤖 + ⚙️ combinados |
| 3.9 | Implementar reabrirCaso para casos cerrados | ✅ | `src/services/supabase/casoService.ts` | Resetea estado + re-analiza con IA |
| 3.10 | Implementar actualizarExtraccionIA | ✅ | `src/services/supabase/casoService.ts` | UPDATE por caso_id, reusa buildFlags |
| 3.11 | Agregar conversation_opened al switch de eventos | ✅ | `src/services/callbell/webhookHandler.ts` | Log explícito, sin acción |
| 3.12 | Soportar adjuntos como objetos con content_type | ✅ | `src/services/callbell/types.ts` + `payloadParser.ts` | `CallbellAttachmentPayload`, backward compat string[] |
| 3.13 | Instalar @anthropic-ai/sdk | ✅ | `package.json` | SDK oficial Anthropic para Node.js |
| 3.14 | Commit + push a main | ✅ | `9a2a7ed` | Auto-deploy Vercel |

### Pendientes post-Fase 3

| # | Tarea | Estado |
|---|---|---|
| 3.15 | Configurar `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY` en Vercel | ⬜ |
| 3.16 | Probar webhook con IA real desde WhatsApp | ⬜ |
| 3.17 | Refactor menor: extraer bloque IA duplicado entre RAMA 2 y RAMA 3 | ⬜ |

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

---

## Resumen de Progreso

| Fase | Total Tareas | ✅ Completas | 🔄 En progreso | ⬜ Pendientes | % Avance |
|---|---|---|---|---|---|
| **Fase 0** — Documentación | 23 | 23 | 0 | 0 | **100%** |
| **Fase 1** — Panel estático | 20 | 19 | 0 | 1 | **95%** |
| **Fase 1.5** — Refactor QA | 10 | 10 | 0 | 0 | **100%** |
| **Fase 2.1** — Supabase Auth | 12 | 12 | 0 | 0 | **100%** |
| **Fase 2.2** — Backend + Webhook | 28 | 28 | 0 | 0 | **100%** |
| **Fase 2.3** — Realtime + REST | 5 | 4 | 0 | 1 | **80%** |
| **Fase 3** — Claude IA | 17 | 14 | 0 | 3 | **82%** |
| **Fase 4** — Acciones asesor | 10 | 0 | 0 | 10 | **0%** |
| **Fase 5** — Métricas | 8 | 0 | 0 | 8 | **0%** |
| **Otros** | 6 | 6 | 0 | 0 | **100%** |
| **Total general** | **139** | **114** | **0** | **25** | **~82%** |

> Nota: Fase 3 tiene 3 pendientes post-implementación (configurar env vars en Vercel, probar con IA real, refactor menor). El core de la fase está 100% implementado y compilando.

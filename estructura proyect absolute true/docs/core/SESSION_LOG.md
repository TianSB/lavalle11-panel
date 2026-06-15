# SESSION LOG — Registro de Sesiones de Trabajo

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Propósito:** Registrar cada sesión de trabajo para que cualquier IA pueda retomar el proyecto exactamente donde se quedó.
>
> **Formato de cada entrada:**
> - Fecha y objetivo de la sesión
> - Resumen de lo realizado
> - Archivos creados o modificados
> - Decisiones tomadas
> - Estado al cierre
> - Pendientes para la próxima sesión

---

## Sesión 26 — 2026-06-14 — Debugging Realtime + Fix INSERT en pipeline frontend

**Objetivo:** Diagnosticar por qué las cards nuevas no aparecen en el panel sin recargar, a pesar de que el evento Realtime INSERT llega correctamente. Implementar fix.
**Duración:** 1 sesión (~2h)
**Herramientas:** Codebuff IA, TypeScript, Vercel, React, Supabase Realtime

### Resumen

Se diagnosticó y corrigió el pipeline de Realtime que conecta los cambios en la tabla `casos` de Supabase con el estado de React en el panel.

**Problema:** El evento INSERT llega correctamente via Realtime (`[REALTIME] Evento recibido: INSERT — caso: LV-0026`), pero la card no aparece. El reducer `RECONCILE` ignoraba casos nuevos porque solo reconcilia entries existentes en el mapa de UI state.

**Causa raíz confirmada via logs:**
```
[REALTIME] Evento recibido: INSERT — caso: LV-0026
[REALTIME] Llamando reconcileCaseState — caso: LV-0026, tieneExtraccionIA: false
[RECONCILE] Caso sin entry UI — ignorado: LV-0026    ← 🔴 CORTE
```

El reducer `caseUIReducer` en `caseUIStore.ts` tiene:
```typescript
// Step 1: Si no hay entry UI, no hay nada que reconciliar
if (!entry) continue;  // ← INSERT nunca tiene entry previa
```

Y `useCasos()` tiene su propio `useState<Caso[]>([])` completamente separado del UI store — ningún mecanismo conectaba Realtime con ese estado.

### Fase 1: Diagnóstico con logs

Se agregaron 7 logs en total a través de 4 commits:

| Commit | Archivo | Logs |
|---|---|---|
| `9c6fabb` | `useCaseRealtimeSync.ts` | 4 logs: useEffect, channel, evento recibido, subscribe status |
| `d2e56e6` | `DashboardPage.tsx` | 1 log render-level |
| `bc68914` | `useCaseRealtimeSync.ts` + `caseUIStore.ts` + `useCasos.ts` | 3 logs: después de reconcileCaseState, RECONCILE !entry, fetch completado |

Además se corrigió un error de build en Vercel (`TS6133: 'vi' declared but never read`) en el commit `9f0805d`.

### Fase 2: Fix arquitectónico

**Decisión arquitectónica:** No modificar el reducer `RECONCILE` (sigue siendo útil para optimistic locking de asignación de casos). En su lugar, crear un pipeline directo que bypassea el UI store y actualiza `useCasos()`:

**`useCasos.ts`:**
- Nuevas funciones expuestas: `addCaso(caso)` — hace prepend con dedup por id; `updateCaso(caso)` — reemplaza por id usando functional setState
- Ambas envueltas en `useCallback` con referencias estables

**`useCaseRealtimeSync.ts`:**
- Nuevo `CASO_COMPLETO_SELECT` con joins: `*, extracciones_ia (*), turnos (*), llamadas (*), asesor:asesor_id (nombre)`
- Nueva `mapRowToCaso()` duplicada intencionalmente de `supabaseService.ts` (evita acoplamiento cruzado)
- Nueva `fetchCasoCompleto(casoId)` — fetch single row con `.single()` desde el cliente anon de Supabase
- Hook ahora acepta 3 parámetros: `refetchCases`, `onNuevoCaso`, `onCasoActualizado`
- INSERT: `fetchCasoCompleto().then(onNuevoCaso)` → bypass completo del store UI
- UPDATE: `fetchCasoCompleto().then(onCasoActualizado)` + `reconcileCaseState()` (para mantener UI state)

**`DashboardPage.tsx`:**
- Destructura `addCaso` y `updateCaso` de `useCasos()`
- Pasa los 3 callbacks a `useCaseRealtimeSync(refresh, addCaso, updateCaso)`

### Pipeline final corregido

```
WhatsApp → Callbell → Webhook → INSERT en Supabase
  → Realtime → useCaseRealtimeSync recibe evento
  → Dedup + filter (sin cambios)
  → INSERT: fetchCasoCompleto(caseId) ← con joins
  → onNuevoCaso(caso) → addCaso()
  → setCasos(prev => [nuevoCaso, ...prev])
  → ✅ React re-renderiza CaseGrid con el nuevo caso

UPDATE:
  → fetchCasoCompleto(caseId)
  → onCasoActualizado(caso) → updateCaso() → setCasos(prev => prev.map)
  → reconcileCaseState() → UI store (claiming → claimed)
  → ✅ React re-renderiza con estado actualizado
```

### Archivos Modificados (Sesión 26)

| Archivo | Cambio |
|---|---|
| `src/hooks/useCaseRealtimeSync.ts` | +CASO_COMPLETO_SELECT, +mapRowToCaso, +fetchCasoCompleto, +onNuevoCaso/onCasoActualizado, INSERT/UPDATE branches |
| `src/hooks/useCasos.ts` | +addCaso (prepend + dedup), +updateCaso (replace by id), exportados en UseCasosReturn |
| `src/pages/DashboardPage.tsx` | Destructura addCaso/updateCaso, pasa los 3 callbacks a useCaseRealtimeSync |
| `src/stores/caseUIStore.ts` | +[RECONCILE] log en !entry (diagnóstico) |
| `src/services/__tests__/providers.test.ts` | -vi del import (fix TS6133) |

### Commits Realizados (Sesión 26)

| Hash | Mensaje |
|---|---|
| `9f0805d` | fix(build): remove unused vi import from providers.test.ts (TS6133) |
| `9c6fabb` | chore(debug): add [REALTIME] diagnostic logs to useCaseRealtimeSync |
| `d2e56e6` | chore(debug): add [DASHBOARD] render-level log to diagnose Realtime hook |
| `bc68914` | chore(debug): add pipeline logs in reconcileCaseState, RECONCILE reducer, and useCasos |
| `1c0736b` | fix(realtime): fetch full caso on INSERT/UPDATE with joins, use callbacks to update useCasos state |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **No modificar RECONCILE** | Agregar casos nuevos al store UI | El store solo maneja estados transicionales (claiming → claimed). No es su responsabilidad agregar casos |
| **Pipeline directo vía callbacks** | Refactor completo del state management | Mínimo cambio, máxima efectividad. useCasos mantiene su useState, Realtime lo actualiza via addCaso/updateCaso |
| **Duplicar mapRowToCaso** | Exportar desde supabaseService.ts | Evita acoplamiento. El hook necesita su propia copia para ser autónomo |
| **fetchCasoCompleto en .then()** | async/await dentro del callback Realtime | El callback de Realtime no es async. .then() es más seguro y evita problemas con el event loop |
| **addCaso con dedup** | Siempre hacer prepend | Previene duplicados si el evento llega dos veces (aunque el dedup TTL de 30s ya protege) |

### Lecciones Aprendidas

| Lección | Detalle |
|---|---|
| **RECONCILE no es para INSERT** | El reducer solo reconcilia entries existentes. `!entry → continue` es correcto, no es un bug del reducer |
| **useCasos y useCaseRealtimeSync son capas separadas** | Cada una maneja su propio estado. No hay puente entre Realtime y el array de casos sin un callback explícito |
| **Payload Realtime no tiene joins** | El evento INSERT solo incluye columnas de la tabla `casos`. `extracciones_ia`, `turnos`, `llamadas` requieren un fetch adicional |
| **Logs de diagnóstico progresivos** | Agregar logs en cada capa del pipeline (evento → dispatch → reducer → estado) permitió aislar la causa raíz en 3 iteraciones |

### Estado al Cierre

- ✅ Realtime INSERT diagnosticado: causa raíz identificada y fixeada
- ✅ Pipeline corregido: fetchCasoCompleto → addCaso/updateCaso → render
- ✅ TypeScript 0 errores en todos los commits
- ✅ Build fix: TS6133 corregido (vi import)
- ✅ 5 commits pusheados a main, Vercel deploy automático
- 🔴 R14: Env vars de IA siguen pendientes en Vercel Production

### Pendientes para la Próxima Sesión

- [ ] 🟢 **Probar en producción**: enviar un mensaje de WhatsApp y verificar que la card aparece sin recargar
- [ ] 🟢 **Probar UPDATE Realtime**: asignar un caso desde otro tab y ver que el estado se refleja
- [ ] ⬜ **Limpiar logs de diagnóstico**: remover `[REALTIME]`, `[RECONCILE]`, `[USECASOS]`, `[DASHBOARD]` logs temporales
- [ ] 🔴 Configurar PRIMARY_PROVIDER y ANTHROPIC_API_KEY en Vercel Production
- [ ] ⬜ Refactor: extraer bloque IA duplicado entre RAMA 2 y RAMA 3

---

## Sesión 25 — 2026-06-14 — Tests, Frontend audit, y debugging de env vars en Vercel

**Objetivo:** Agregar tests unitarios, conectar el frontend a datos reales de Supabase, y configurar env vars de IA en Vercel para activar Claude en producción.
**Duración:** 1 sesión (~1h)

### Resumen

Sesión de cierre y verificación post-Fase 3. Se confirmó que los tests unitarios ya estaban implementados (34 tests, 2 files, 0 fallos) de la Sesión 24. Se auditó el frontend y se descubrió que ya estaba conectado a Supabase desde Fase 2.3. El bloqueante actual: las variables `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY` no llegan al runtime serverless de Vercel — el log muestra `[AI_FACTORY] Provider activo: mock`.

### Archivos Modificados (solo documentación)

| Archivo | Cambio |
|---|---|
| `PROJECT_STATE.md` | v2.1: nuevo riesgo R14, frontend verificado conectado, env vars debugging |
| `TODO.md` | 2.3.5 verificado ✅, Fase 3: 16/18 completas, nuevo riesgo R14 |
| `SESSION_LOG.md` | Esta entrada (Sesión 25) |

### Estado al Cierre

- ✅ Tests verificados: 34 passed, 2 files
- ✅ Frontend auditado: ya conectado a Supabase
- ✅ Último commit: `5acf641`
- 🔴 **R14: Env vars de IA no llegan al runtime serverless**

---

## Sesión 24 — 2026-06-14 — Fase 3: Integración Claude IA Completa + Reapertura de Casos Cerrados

**Objetivo:** Implementar la capa de IA completa siguiendo FASE3_AI_INTEGRATION_PLAN.md.
**Duración:** 1 sesión (~3h)

### Resumen

Se implementó la Fase 3 completa: 5 archivos nuevos de IA + modificaciones a webhookHandler y casoService. Además se agregó reapertura de casos cerrados (bug 23505) y se fixearon los tipos de attachment.

### Archivos Creados (8 nuevos)

| Archivo | Propósito |
|---|---|
| `src/services/ai/types.ts` | Interfaces canónicas |
| `src/services/ai/imageProcessor.ts` | Descarga adjuntos → base64 |
| `src/services/ai/claudeAdapter.ts` | Claude Sonnet 4.5 con tool_use |
| `src/services/ai/mockProvider.ts` | Mock para desarrollo |
| `src/services/ai/aiFactory.ts` | Factory singleton con fallback |
| `src/services/__tests__/fixtures.ts` | Fixtures compartidos para tests |
| `src/services/__tests__/providers.test.ts` | Tests de providers |
| `src/services/__tests__/casoService.test.ts` | Tests de casoService |

### Estado al Cierre

- ✅ Fase 3 completa
- ✅ Claude API integrada
- ✅ Reapertura de casos cerrados
- ✅ Tests: 34 passed
- ⬜ PRIMARY_PROVIDER + ANTHROPIC_API_KEY pendientes en Vercel

---

## Sesión 23 — 2026-06-14 — Debugging Webhook + Root Cause Fix (process-first) + Primer Caso en Supabase

**Objetivo:** Diagnosticar y resolver el bloqueo de query a Supabase.
**Duración:** 1 sesión (~2h)

### Resumen

4 iteraciones de debugging progresivo hasta encontrar la causa raíz: Vercel Hobby termina la ejecución después de `res.json()`. Fix: process-first pattern.

### Estado al Cierre

- ✅ Causa raíz: Vercel Hobby mata async después de res.json()
- ✅ Fix: process-first pattern
- ✅ Primer caso creado: LV-0001 (870ms)
- ✅ Migración 014 ejecutada
- ✅ Endpoints REST: GET /api/casos y GET /api/casos/:id

---

## Sesión 22 — 2026-06-14 — Auditoría Supabase Final + Timeout Fix

**Objetivo:** Sistema de auditoría production-grade.
**Duración:** 1 sesión

### Resumen

Arquitectura dual: trigger ultra-liviano + AuditService backend. Idempotencia global con event_hash UNIQUE. correlationId obligatorio. Timeout fix en Supabase client.

---

## Sesión 18 — 2026-06-14 — Deploy Webhook + Diagnóstico

**Objetivo:** Llevar el webhook de Callbell a producción.
**Duración:** 1 sesión

### Resumen

5 problemas corregidos: ESM imports, function runtime, @types/node, parser, fire-and-forget. Problema 6 diagnosticado (no resuelto): query Supabase nunca completa.

---

## Sesión 8 — 2026-06-11 — Webhook + Migración 014

**Objetivo:** Implementar Fase 2.2 + migración MisRx.
**Duración:** 1 sesión

### Resumen

5 archivos creados para el webhook de Callbell + migración 014_orden_tipo.sql. Hallazgo MisRx: órdenes digitales electrónicas.

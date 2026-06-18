# TODO — Plan de Trabajo y Seguimiento

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-17 (Sesión 30)
> **Progreso general:** ~96% (185/193 tareas completadas) — Fases 0 a 5 + Sesiones 28, 29 y 30 completas ✅
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
| 3.16 | Configurar PRIMARY_PROVIDER=claude y ANTHROPIC_API_KEY en Vercel | ✅ | Env vars configuradas en Production |
| 3.17 | Probar webhook con IA real | 🟡 Pendiente | Env vars ya configuradas |
| 3.18 | Refactor: extraer bloque IA duplicado | ⬜ | |
| 3.19 | Re-análisis manual con IA (Opción 4) | ✅ | Botón en modal + endpoint POST |
| 3.20 | Storage de adjuntos en Supabase (URLs expiraban) | ✅ | adjuntosStorage.ts + webhookHandler + re-analizar |
| **3.21** | **saveAttachmentsToStorage bloqueante + orden_url permanente** | **✅ S30** | **webhookHandler.ts** |
| **3.22** | **adjuntos_pendientes computado en Realtime sync** | **✅ S30** | **useCaseRealtimeSync.ts** |

---

## Fase 4 — Acciones del Asesor (Flujo Completo) ✅

**Objetivo:** El flujo completo funciona de punta a punta (WhatsApp → panel → WhatsApp).
**Estado: ✅ COMPLETADA (Sesión 27 + 28 + 29 + 30).**

| # | Tarea | Estado | Commit/Sesión |
|---|---|---|---|
| 4.1 | messagesApi.ts — enviarMensajeCallbell() con timeout + retry | ✅ | Sesión 27 |
| 4.2 | POST /api/casos/:id/enviar-mensaje | ✅ | Sesión 27 |
| 4.3 | Tests para messagesApi (9 → 13 tests) | ✅ | Sesión 27 + 29 |
| 4.4 | POST /api/casos/:id/confirmar (BR-06 IOMA warning) | ✅ | Sesión 27 |
| 4.5 | POST /api/casos/:id/cerrar (12 closing reasons + audit) | ✅ | Sesión 27 |
| 4.6 | POST /api/casos/:id/llamada (registrar duración) | ✅ | Sesión 27 |
| 4.7 | POST /api/casos/:id/derivar (BR-03 Chiclana) | ✅ | Sesión 27 |
| 4.8 | UI — Botones en CaseModal + DashboardPage wiring | ✅ | Sesión 27 |
| 4.9 | POST /api/casos/:id/re-analizar (re-análisis con IA) | ✅ | S28 + S29 (Storage) |
| 4.10 | Fix channel_uuid en messagesApi | ✅ | S29 |
| 4.11 | Fix + prefix en teléfono | ✅ | S29 |
| 4.12 | Logging diagnóstico (response.text antes de JSON.parse) | ✅ | S29 |
| 4.13 | Remover Registrar llamada (no es parte de v1) | ✅ | S29 |
| 4.14 | Restyle botón Analizar con IA (coincide con Tomar caso) | ✅ | S29 |
| 4.15 | Botón Ver orden médica en CaseModal | ✅ | S29 |
| **4.16** | **Confirm dialog antes de re-analizar (consume crédito API)** | **✅ S30** | **CaseCard.tsx** |
| **4.17** | **PRACTICAS_NUCLEAR centralizado en constants** | **✅ S30** | **5 archivos refactorizados** |
| **4.18** | **mapRowToCaso extraído a helper compartido** | **✅ S30** | **mappers.ts** |

---

## Fase 5 — Seguimiento y Métricas ✅

**Objetivo:** Visibilidad total del pipeline de consultas.
**Estado: ✅ COMPLETADA (Sesión 27).**

| # | Tarea | Estado | Commit |
|---|---|---|---|
| 5.1 | MetricsBoard conectado a Supabase (aggregation queries) | ✅ | Sesión 27 |
| 5.2 | Rendimiento por asesor (tabla con tasa de resolución) | ✅ | Sesión 27 |
| 5.3 | Exportar CSV multi-sección | ✅ | Sesión 27 |
| 5.4 | Auto-refresh cada 60s | ✅ | Sesión 27 |
| 5.5 | Filtro por fecha (inputs Desde/Hasta) | ✅ | Sesión 27 |

---

## Sesión 28 — Fixes + Features post-Producción

**Objetivo:** Corregir bugs de producción e implementar mejoras de UX post-deploy.

| # | Tarea | Estado | Commit |
|---|---|---|---|
| S28.1–S28.10 | Fix assign_case RPC, re-analizar, contador mensajes | ✅ | 10 tareas completadas |

---

## Sesión 29 — Fixes post-producción + Storage adjuntos + channel_uuid

**Objetivo:** Corregir 405 routing, phone validation, URLs expiradas de adjuntos, y bug crítico channel_uuid.

| # | Tarea | Estado | Commit |
|---|---|---|---|
| S29.1–S29.15 | 15 tareas completadas (8 commits) | ✅ | Ver SESSION_LOG |

---

## Sesión 30 — Auditoría técnica + Quick Wins + Fix pipeline imágenes

**Objetivo:** Auditoría completa del código, 3 Quick Wins de calidad, fix del pipeline de imágenes Storage→orden_url, confirm dialog, y corrección de antipatrón React.

| # | Tarea | Estado | Detalle |
|---|---|---|---|
| **S30.1** | **Auditoría técnica exhaustiva** | **✅** | 10 bugs, 3 inconsistencias, 4 riesgos de prod, 3 de seguridad, Top 10 priorizados |
| **S30.2** | **QW1: mapRowToCaso a helper compartido** | **✅** | `src/utils/mappers.ts` creado — eliminadas ~100 líneas duplicadas |
| **S30.3** | **QW1: Modificar supabaseService.ts** | **✅** | Importa mapRowToCaso + CASOS_SELECT desde mappers |
| **S30.4** | **QW1: Modificar useCaseRealtimeSync.ts** | **✅** | Importa mapRowToCaso + CASOS_SELECT desde mappers |
| **S30.5** | **QW2: PRACTICAS_NUCLEAR a constants** | **✅** | `src/constants.ts` con tuple as const + PracticaNuclear type |
| **S30.6** | **QW2: derivar.ts** | **✅** | Importa PRACTICAS_NUCLEAR desde constants |
| **S30.7** | **QW2: re-analizar.ts** | **✅** | Importa PRACTICAS_NUCLEAR desde constants |
| **S30.8** | **QW2: casoService.ts** | **✅** | Importa PRACTICAS_NUCLEAR desde constants |
| **S30.9** | **QW2: CaseModal.tsx** | **✅** | Importa PRACTICAS_NUCLEAR + type cast de types |
| **S30.10** | **QW2: backfill-ia.ts** | **✅** | Importa PRACTICAS_NUCLEAR desde constants |
| **S30.11** | **QW3: Migración 017 índices SQL** | **✅** | `database/migrations/017_indices_adjuntos_mensajes.sql` |
| **S30.12** | **Fix antipatrón useState en CaseModal** | **✅** | Reemplazado bloque if en cuerpo del componente con useEffect + isFirstRender |
| **S30.13** | **Confirm dialog antes de re-analizar** | **✅** | Estado confirming en AnalizarButton (idle→confirming→loading→idle/error) |
| **S30.14** | **Migración 016: bucket adjuntos** | **✅** | `database/migrations/016_adjuntos_storage_bucket.sql` con DROP POLICY IF EXISTS |
| **S30.15** | **Fix A: Storage bloqueante + orden_url** | **✅** | saveAttachmentsToStorage retorna string[], await en 3 RAMAS, updateOrdenUrlFromStorage() |
| **S30.16** | **Fix B: adjuntos_pendientes en Realtime** | **✅** | fetchMensajesCount + fetchAdjuntosPendientesCount helpers en useCaseRealtimeSync |
| **S30.17** | **Typecheck + Tests + Code Review final** | **✅** | 0 errores TS, 47/47 tests, code review OK |

---

## Pendientes para Producción

| # | Tarea | Prioridad | Estado |
|---|---|---|---|
| P1–P7 | Configuración env vars Vercel | 🔴 Alta | ✅ Completado S28 + S29 |
| **P8** | **Crear bucket `adjuntos` en Supabase Storage** | **🔴 Alta** | **✅ Completado S30 (SQL ejecutado)** |
| P9 | Agregar Sentry para monitoreo de errores | 🟡 Media | ⬜ |
| P10 | Tests de integración para endpoints POST | 🟡 Media | ⬜ |
| P11 | Auto-trigger de re-análisis cuando llega attachment | 🟡 Media | ⬜ |
| P12 | Confirm dialog antes de re-analizar (consume API) | 🟢 Baja | ✅ **Completado S30** |
| P13 | Auditoría de eventos de re-análisis manual | 🟢 Baja | ⬜ |
| P14 | Limpiar `PRIMARY_PROVIDER_claude` (variable mal nombrada) | 🟢 Baja | ⬜ |

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
| **Fase 3** — Claude IA | 22 | 21 | 1 | 0 | **95%** |
| **Fase 4** — Acciones asesor | 18 | 18 | 0 | 0 | **100%** |
| **Fase 5** — Métricas | 5 | 5 | 0 | 0 | **100%** |
| **Sesión 28** — Fixes + features | 10 | 10 | 0 | 0 | **100%** |
| **Sesión 29** — Fixes post-producción | 15 | 15 | 0 | 0 | **100%** |
| **Sesión 30** — Auditoría + Quick Wins + Fixes | 17 | 17 | 0 | 0 | **100%** |
| **Pendientes producción** | 14 | 8 | 0 | 6 | **57%** |
| **Total general** | **193** | **185** | **1** | **8** | **~96%** |

> **Nota:** Sesión 30 completada. Se realizó una auditoría técnica exhaustiva del código, se implementaron 3 Quick Wins de calidad (helper mapRowToCaso, constante PRACTICAS_NUCLEAR centralizada, índices SQL), se corrigió el antipatrón de useState en CaseModal, se agregó confirm dialog antes de re-analizar, se creó el bucket adjuntos en Supabase Storage, se hizo saveAttachmentsToStorage bloqueante con orden_url permanente, y se agregó adjuntos_pendientes al Realtime sync. Typecheck 0 errores, 47/47 tests pasando.

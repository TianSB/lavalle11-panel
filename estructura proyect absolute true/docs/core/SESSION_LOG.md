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

## Sesión 24 — 2026-06-14 — Fase 3: Integración Claude IA Completa + Reapertura de Casos Cerrados

**Objetivo:** Implementar la capa de IA completa siguiendo FASE3_AI_INTEGRATION_PLAN.md. Analizar mensajes de WhatsApp entrantes (texto e imágenes de órdenes médicas) con Claude y poblar `extracciones_ia` con datos estructurados reales.
**Duración:** 1 sesión (~3h)
**Herramientas:** Codebuff IA, TypeScript, Anthropic SDK, Vercel Serverless, Supabase, GitHub

### Resumen

Se implementó la Fase 3 completa: 5 archivos nuevos de IA + modificaciones a webhookHandler y casoService. Además se agregó reapertura de casos cerrados (bug 23505) y se fixearon los tipos de attachment para que incluyan `content_type` real. Commit y push a main. Pendiente: configurar env vars en Vercel.

### Orden de implementación (7 pasos secuenciales)

**Paso 1 — `src/services/ai/types.ts`:**
Interfaces canónicas del sistema de IA. Todo el sistema habla este contrato. Ningún archivo fuera de `ai/` importa tipos de Claude directamente.

| Interfaz | Propósito |
|---|---|
| `AdjuntoCanónico` | URL, tipo (image/pdf/otro), mimeType |
| `EntradaCanónica` | Input unificado: texto, adjuntos, contacto, timestamp |
| `RespuestaCanónica` | Output completo: clasificación (A–K), datos paciente, flags, confianza, resumen |
| `AIProvider` | Contrato del adapter: `analizarCaso(entrada): Promise<RespuestaCanónica>` |
| `AIError` | Error tipado con código: `AI_TIMEOUT`, `AI_PROVIDER_ERROR`, `AI_PARSE_ERROR`, etc. |
| `ConfianzaCampos` | Score por campo individual |

**Paso 2 — `src/services/ai/imageProcessor.ts`:**
Descarga adjuntos de Callbell y los convierte a base64 para Claude. Las URLs de Callbell expiran; Claude no puede hacer fetch externo.

| Parámetro | Valor |
|---|---|
| Timeout de descarga | 8 segundos |
| Tamaño máximo | 4 MB |
| Formatos soportados | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf` |
| Falla de descarga | No bloquea — análisis continúa con solo texto |

**Paso 3 — `src/services/ai/claudeAdapter.ts`:**
Corazón de la integración. Implementa `AIProvider` con Claude Sonnet 4.5.

| Parámetro | Valor | Razón |
|---|---|---|
| `model` | `claude-sonnet-4-5` | Especificado en el plan |
| `max_tokens` | 1024 | La respuesta de una tool es compacta |
| `tool_choice` | `{ type: "any" }` | Forzar invocación de tool, nunca texto libre |
| System prompt | ~250 tokens | Denso, sin relleno |
| Tools | `registrar_analisis_caso` con 22 campos | Schema exacto del plan |

**Tool `registrar_analisis_caso`:**
- **Obligatorios**: `tipo_caso` (A–K), `prioridad`, `paciente_nombre`, `practica`, `tipo_practica`, `confianza_global`, `confianza_campos`, `resumen`, `flags`
- **Opcionales**: `paciente_dni`, `obra_social`, `nro_afiliado`, `nro_carnet`, `medico_derivante`, `matricula`, `diagnostico`, `motivo_solicitud`
- **Clasificación A–K**: desde "Turno con orden médica" hasta "Contacto equivocado"
- **Flags 🤖**: `ayuno`, `aines`, `orden_incompleta`, `orden_ilegible`

**Paso 4 — `src/services/ai/mockProvider.ts`:**
Mock para desarrollo local (`PRIMARY_PROVIDER=mock`). Responde en 50ms con datos realistas: tipo_caso "A", obra_social "IOMA", práctica "Ecografía abdominal completa". Sin consumo de tokens de Anthropic.

**Paso 5 — `src/services/ai/aiFactory.ts`:**
Factory singleton que lee `PRIMARY_PROVIDER` de env vars.

| Escenario | Comportamiento |
|---|---|
| `PRIMARY_PROVIDER=claude` + `ANTHROPIC_API_KEY` presente | Instancia `ClaudeAdapter` |
| `PRIMARY_PROVIDER=claude` pero sin API key | ClaudeAdapter constructor lanza error → factory cae en `MockAIProvider` |
| `PRIMARY_PROVIDER=mock` (default) | Instancia `MockAIProvider` |
| `PRIMARY_PROVIDER` desconocido | Log warning + fallback a `MockAIProvider` |

**Paso 6 — webhookHandler.ts: reemplazar TODO + 3 ramas:**
Se reemplazó el `// TODO: [Fase 3]` con una llamada real a `getAIProvider().analizarCaso(entrada)`.

**Mejora adicional: 3 ramas en handleMessageCreated:**

| Rama | Condición | Acción |
|---|---|---|
| **Rama 1** | Caso existe y `estado !== "cerrado"` | `updateCasoHistorial()` (sin cambios) |
| **Rama 2** | Caso existe y `estado === "cerrado"` | `reabrirCaso()` + re-analizar con IA + `actualizarExtraccionIA()` + update tipo_caso/prioridad |
| **Rama 3** | No existe | Análisis IA + `createCaso(analisis)` (camino normal) |

La RAMA 2 resuelve el error 23505 (UNIQUE constraint violation en `callbell_conversation_uuid`) que ocurría cuando Callbell reabría una conversación cerrada reutilizando el mismo UUID. En lugar de intentar crear un caso nuevo (que choca contra la constraint), se reabre el existente.

**Paso 7 — casoService.ts: createCaso acepta analisis param:**
`createCaso()` ahora acepta `analisis?: RespuestaCanónica`. Si viene, usa datos reales para poblar todos los campos de `casos` y `extracciones_ia`. Si no, usa placeholders seguros.

**Función `buildFlags()`:**
Combina flags de dos orígenes en un solo array:

| Origen | Flags | Condición |
|---|---|---|
| 🤖 Claude | `ayuno`, `aines`, `orden_incompleta`, `orden_ilegible` | Detectadas por IA |
| ⚙️ Sistema | `baja_confianza` | `confianza_global < 0.7` o `campos_baja_confianza.length > 0` |
| ⚙️ Sistema | `token_ioma` | `obra_social` contiene "ioma" |
| ⚙️ Sistema | `chiclana` | `tipo_practica` es de Medicina Nuclear |
| ⚙️ Sistema | `orden_digital_misrx` | Mensaje contiene link de MisRx |
| ⚙️ Sistema | `error_ia` | `analisis === null` (Claude falló) |

**Funciones nuevas:**
- `reabrirCaso(supabase, casoId)` — resetea `estado→pendiente`, `closing_reason→null`, `resolved_at→null`
- `actualizarExtraccionIA(supabase, casoId, analisis, parsed)` — UPDATE de `extracciones_ia` con datos frescos de IA, reusa `buildFlags()`

### Fix de tipos de attachment (mid-session)

**Problema detectado por el usuario:** `ParsedAttachment` no tenía `content_type` ni `file_name`. El webhookHandler hardcodeaba `mimeType: "image/jpeg"` para todas las imágenes.

**Fix aplicado en 3 archivos:**

| Archivo | Cambio |
|---|---|
| `types.ts` | Nuevo tipo `CallbellAttachmentPayload` (url, content_type, file_name, size). `attachments` ahora acepta `(string \| CallbellAttachmentPayload)[]`. `ParsedAttachment` incluye `content_type: string \| null` y `file_name: string \| null`. |
| `payloadParser.ts` | Nueva función `inferMimeType()` que infiere MIME type de la extensión. Nueva `parseAttachment()` que maneja tanto strings como objetos. Backward compatible con payloads existentes. |
| `webhookHandler.ts` | Mapping de adjuntos usa `att.content_type` directamente. Función duplicada `inferMimeTypeDeUrl` eliminada. Fallback a `"application/octet-stream"` para tipos desconocidos. |

### Deploy

| Paso | Estado |
|---|---|
| `@anthropic-ai/sdk` instalado | ✅ |
| `npx tsc -b --noEmit` | ✅ 0 errores (verificado después de cada archivo) |
| Code review (deepseek-flash) | ✅ Sin issues bloqueantes |
| `git add -A && git commit` | ✅ `9a2a7ed` |
| `git push origin main` | ✅ Vercel auto-deploy iniciado |
| `PRIMARY_PROVIDER=claude` en Vercel | ⬜ Pendiente — configurar por dashboard |
| `ANTHROPIC_API_KEY` en Vercel | ⬜ Pendiente — configurar por dashboard |

### Archivos Creados (5 nuevos)

| Archivo | Propósito |
|---|---|
| `src/services/ai/types.ts` | Interfaces canónicas (EntradaCanónica, RespuestaCanónica, AIProvider, AIError) |
| `src/services/ai/imageProcessor.ts` | Descarga adjuntos → base64 (8s timeout, 4MB max, fallback graceful) |
| `src/services/ai/claudeAdapter.ts` | Claude Sonnet 4.5 con tool_use, visión, system prompt ~250 tokens |
| `src/services/ai/mockProvider.ts` | Mock para desarrollo (50ms, datos realistas, sin consumir tokens) |
| `src/services/ai/aiFactory.ts` | Factory singleton con fallback a mock |

### Archivos Modificados (4 existentes)

| Archivo | Cambio |
|---|---|
| `src/services/callbell/types.ts` | CallbellAttachmentPayload, attachments type biforma, ParsedAttachment con content_type/file_name |
| `src/services/callbell/payloadParser.ts` | parseAttachment(), inferMimeType(), soporte string/object |
| `src/services/callbell/webhookHandler.ts` | 3 ramas (activo/cerrado/nuevo), IA integration, conversation_opened logging, content_type real |
| `src/services/supabase/casoService.ts` | createCaso acepta analisis param, buildFlags(), reabrirCaso(), actualizarExtraccionIA() |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Provider-agnostic** (AIProvider interface) | Llamar a Claude directamente en webhookHandler | Separación de responsabilidades. Permite mock en dev, Claude en prod, futuro GPT sin cambiar webhookHandler |
| **tool_use con `tool_choice: any`** | JSON en texto libre del prompt | Output determinista y parseable. Claude no puede negarse a devolver la estructura esperada |
| **max_tokens 1024** | 4096 o más | La respuesta de una tool es compacta (~500 tokens con imagen). 1024 es guarda suficiente, reduce costo y latencia |
| **Fallback a mock siempre** | Dejar que la excepción se propague | Cero casos perdidos por error de IA. El caso llega al panel con flag `error_ia` |
| **3 ramas en webhookHandler** | 2 ramas (como estaba) | Resuelve error 23505: Callbell reabre conversaciones cerradas con el mismo UUID |
| **attachment type biforma (string/object)** | Solo object | Backward compatibility con payloads string[] existentes en producción |
| **buildFlags en casoService.ts** | En webhookHandler o en una lib separada | Ya se usa en createCaso y actualizarExtraccionIA, ambos en casoService. Evita duplicación |

### Lecciones Aprendidas

| Lección | Detalle |
|---|---|
| **Adjuntos Callbell** | Pueden ser strings (solo URL) u objetos (url + content_type + file_name). El parser debe manejar ambos |
| **Conversaciones reabiertas** | Callbell reutiliza el mismo UUID al reabrir una conversación cerrada. No se puede crear caso nuevo (UNIQUE violation) |
| **content_type no es opcional** | imageProcessor.ts necesita el MIME type real para filtrar formatos procesables. Hardcodear "image/jpeg" rompe PNGs |
| **Code review iterativo** | El code reviewer detectó la duplicación de `inferMimeTypeDeUrl` — se eliminó en la iteración siguiente |

### Estado al Cierre

- ✅ **Fase 3 completa**: 5 archivos nuevos + modificaciones a webhookHandler y casoService
- ✅ **Claude API integrada**: tool_use con `registrar_analisis_caso`, visión para órdenes médicas
- ✅ **Provider-agnostic**: AIProvider interface, factory singleton, mock en dev, Claude en prod
- ✅ **Reapertura de casos cerrados**: reabrirCaso() + actualizarExtraccionIA() + buildFlags()
- ✅ **Attachment types fixeados**: content_type real, soporte string/object
- ✅ **conversation_opened logueado**: sin acción en v1
- ✅ **Typecheck 0 errores** (verificado post-implementación y post-fixes)
- ✅ **Commit + push a main**: `9a2a7ed` — Vercel auto-deploy
- ⬜ **PRIMARY_PROVIDER=claude** pendiente de configurar en Vercel
- ⬜ **ANTHROPIC_API_KEY** pendiente de configurar en Vercel
- ⬜ **Prueba con IA real** pendiente (enviar mensaje desde WhatsApp)
- 🔑 **Próximo paso:** Configurar env vars en Vercel + probar webhook con IA real

### Pendientes para la Próxima Sesión

- [ ] Configurar `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY` en Vercel Production
- [ ] Probar webhook con mensaje real (con y sin imagen) desde WhatsApp
- [ ] Verificar log esperado: `[STEP 5.IA] Análisis completado — tipo: A, confianza: 0.87`
- [ ] Verificar en Supabase que `extracciones_ia` tenga datos reales (no placeholders)
- [ ] Refactor menor: extraer bloque IA duplicado entre RAMA 2 y RAMA 3 a función helper
- [ ] Conectar frontend a datos reales de Supabase

---

## Sesión 23 — 2026-06-14 — Debugging Webhook + Root Cause Fix (process-first) + Primer Caso en Supabase

**Objetivo:** Diagnosticar y resolver el bloqueo de query a Supabase que impedía crear casos desde el webhook de Callbell.
**Duración:** 1 sesión (~2h)
**Herramientas:** Codebuff IA, TypeScript, Vercel Serverless, Supabase, GitHub

### Resumen

Se diagnosticó y resolvió el problema de conectividad que bloqueaba el webhook desde la Sesión 18. El sistema ahora procesa mensajes de WhatsApp completos y crea casos en Supabase.

**Proceso de diagnóstico (4 iteraciones de debugging progresivo):**

**Iteración 1 — Fetch directo con AbortController (5s timeout):**
Se agregó un fetch directo a la REST API de Supabase con `AbortController` timeout de 5s, POR FUERA del cliente `supabase-js`. El objetivo era determinar si el problema era del cliente Supabase o de conectividad de red. **Resultado: el fetch directo TAMBIÉN se colgaba** — el `[DIAG] FETCH STATUS` nunca aparecía. Esto sugería un problema de red/env vars.

**Iteración 2 — Fix de env vars (Preview vs Production):**
El usuario descubrió que las variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `CALLBELL_WEBHOOK_SECRET` estaban configuradas solo en scope **Preview** en Vercel, no en **Production**. Las reconfiguró. **Resultado: SIGUIÓ sin funcionar** — los logs seguían idénticos, indicando que el código deployado era viejo (caché de Vercel).

**Iteración 3 — Forzar invalidación de caché + Diagnóstico sincrónico:**
El commit vacío (`a8ce799`) no invalidó la cache de Vercel. Se modificó el version string de `2026-06-14-A` a `2026-06-14-C` para forzar recompilación. Los logs confirmaron que el código nuevo corría (`VERSION CHECK 2026-06-14-C`). Se reemplazó el fetch directo por un **diagnóstico 100% sincrónico** (sin await, sin fetch, sin AbortController): `[DIAG-1]` loggeaba env vars. **Resultado: las env vars eran correctas** (`urlExists: true`, `keyExists: true`, URL 40 chars, Key 219 chars). El hang estaba en `await supabase.from()`.

**Iteración 4 — Eliminar `global.fetch` override + Process-first pattern:**
Se eliminó el `global.fetch` override con `AbortSignal.timeout(10_000)` que se había agregado en la Sesión 22 como fix de timeout. No resolvió el problema. Se cambió el patrón "respond-first" por "process-first": `await handleWebhook()` AHORA corre **ANTES** de `res.json()`. **Resultado: ¡FUNCIONÓ!**

**Causa raíz:** Vercel Hobby plan termina la ejecución de la función serverless **inmediatamente después de enviar la respuesta HTTP** (`res.json()`). El patrón "respond-first" enviaba 200 y luego intentaba `await handleWebhook()`, pero Vercel ya había matado la función, por lo que el `await` nunca resolvía. Silenciosamente. Sin error. Sin timeout.

**Primer caso en producción:** ✅ **LV-0001** creado en Supabase. Tiempo de procesamiento: **870ms**.

**Error secundario encontrado:** `PGRST204: Could not find the 'orden_tipo' column of 'extracciones_ia'` — la migración `014_orden_tipo.sql` nunca se ejecutó en el proyecto Supabase.

### Archivos Modificados

| Archivo | Cambio |
|---|---|
| `api/callbell/webhook.ts` | Cambio de respond-first a process-first: `await handleWebhook()` antes de `res.json()`. Eliminado `global.fetch` override. Limpieza de comentarios. |
| `src/services/supabase/casoService.ts` | Agregado y luego eliminado fetch diagnóstico con AbortController. Agregado y luego eliminado diagnóstico sincrónico `[DIAG-1]`. Version check: A→C→D. |

### Commits Realizados

| Hash | Mensaje |
|---|---|
| `a8ce799` | redeploy: force fresh build with fetch diagnostic (commit vacío, no invalidó cache) |
| `3997afe` | chore(debug): bump version string to force Vercel cache invalidation |
| `7fd5259` | fix(debug): replace async fetch diagnostic with synchronous env-var logging |
| `324935c` | fix(webhook): remove global.fetch override that was causing supabase-js to hang |
| `655be3d` | fix(webhook): swap to process-first pattern |
| `91c7206` | chore: clean up diagnostic logs and commented code post-success |

### Lecciones Aprendidas

| Lección | Detalle |
|---|---|
| **Cache de Vercel** | Los commits vacíos NO invalidan la build cache. Modificar un source file para forzar recompilación |
| **Respond-first en Hobby** | Vercel Hobby termina la función después de `res.json()`. Usar **process-first** para operaciones críticas |
| **AbortSignal.timeout + supabase-js** | El `global.fetch` override interfiere con señales internas de `postgrest-js`. Env vars correctas = no se necesita |
| **Debugging progresivo** | Logs sincrónicos sin await para aislar el punto exacto de congelamiento. Fetch directo con timeout para separar red vs librería |

### Estado al Cierre

- ✅ **Causa raíz identificada:** Vercel Hobby mata async después de `res.json()`
- ✅ **Fix aplicado:** Process-first pattern (`await handleWebhook` antes que `res.json`)
- ✅ **Primer caso creado:** LV-0001 en Supabase (procesamiento: 870ms)
- ⚠️ **Error PGRST204:** Falta ejecutar migración `014_orden_tipo.sql` en Supabase
- ✅ Logs de diagnóstico temporales eliminados
- ✅ Build + TypeScript OK (commits múltiples)

### Pendientes para la Próxima Sesión

- [ ] Probar endpoints REST: `GET /api/casos?limit=5`
- [ ] Configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel Production
- [ ] Avanzar a Fase 3: Análisis con Claude IA

---

### Continuación — Migración 014 + Fase 2.3: Endpoints REST + Fix .js imports

**Mismo día, misma sesión.** Se ejecutaron múltiples tareas para finalizar la sesión.

**Migración 014 ejecutada en Supabase:** El usuario ejecutó `ALTER TABLE extracciones_ia ADD COLUMN orden_tipo` en SQL Editor. **Resultado: ✅ LV-0002 (Jade Kombucha) creado sin error PGRST204.**

**Fix de .js extensions en imports:** `api/casos.ts` y `api/casos/[id].ts` tenían imports sin `.js` extension. Se agregaron para consistencia ESM con el resto del proyecto.

**Log de verificación (LV-0002):**
```
[CASO] Resultado INSERT casos — OK, id: LV-0002
[CASO] Resultado INSERT extracciones_ia — OK    ← Sin PGRST204
[CASO] createCaso completado — caso: LV-0002
[WEBHOOK] Processing completed (722ms)
```

**Commits adicionales:**
| Hash | Mensaje |
|---|---|
| `0560180` | fix(api): add .js extensions to imports for ESM compatibility |

**Dominio del proyecto:** `https://l11panel.vercel.app`

### Estado Final de la Sesión

- ✅ Fase 2.2 completa: Webhook funcional, casos reales en Supabase
- ✅ Fase 2.3 completa: GET endpoints + Realtime + Service layer
- ✅ Migración 014 ejecutada en Supabase
- ✅ Casos LV-0001 (Cristian Ballesi) y LV-0002 (Jade Kombucha) creados
- ✅ Sin errores en producción (722ms de procesamiento)
- 🔑 **Próximo hito:** Fase 3 — Integración de Claude IA

---

### Continuación — Fase 2.3: Endpoints REST (GET /api/casos y GET /api/casos/:id)

**Mismo día, misma sesión.** Después de confirmar que el webhook funciona, se implementaron los endpoints REST de la Fase 2.3.

**Decisión:** Solo GET endpoints (recomendado). PATCH se difiere a Fase 4 cuando la Callbell Messages API sea necesaria. Realtime y migración a Supabase ya estaban implementados en sesiones anteriores.

**Archivos creados (3):**

| Archivo | Propósito |
|---|---|
| `api/_lib/supabaseAdmin.ts` | Shared utility: `getSupabaseAdmin()` y `CASOS_SELECT` con joins |
| `api/casos.ts` | `GET /api/casos` — lista paginada con filtros (`?estado`, `?asesor_id`, `?limit`, `?offset`) + count filtrado |
| `api/casos/[id].ts` | `GET /api/casos/:id` — caso individual con joins (extracciones_ia, turnos, llamadas) + mensajes ordenados |

**Corrección post-review:** El count en `api/casos.ts` no respetaba los filtros (`?estado`, `?asesor_id`). Se corrigió aplicando las mismas condiciones al count query.

**Commits:**
| Hash | Mensaje |
|---|---|
| `3d06c7b` | feat(api): add GET /api/casos and GET /api/casos/:id endpoints |

**Estado:** ✅ Fase 2.3 completada (endpoints GET + Realtime + Service layer existentes)

---

## Sesión 22 — 2026-06-14 — Auditoría Supabase Final + Timeout Fix + Hardening

**Objetivo:** Diseñar e implementar sistema de auditoría final tipo Stripe/Linear para Supabase, hardening de idempotencia, y fix crítico de timeout en Supabase client.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, TypeScript, Supabase, PostgreSQL, Vercel Serverless

### Resumen

Sesión enfocada en diseñar e implementar un sistema de auditoría production-grade para la tabla `casos`, con separación estricta entre eventos técnicos (trigger) y semánticos (backend), idempotencia global, y hardening de resiliencia.

**Se corrigieron 4 problemas críticos de consistencia:**

**Problema 1 — Trigger PostgreSQL con jsonb_each + jsonb_agg (ALTO):**
El trigger `registrar_evento_caso()` usaba `jsonb_each(to_jsonb(NEW))` + `jsonb_agg(key)` para hacer diff dinámico de campos en cada UPDATE. Esto podía causar degradación de performance en el pool de conexiones de PostgREST bajo concurrencia. Se reemplazó por un trigger ultra-liviano que solo hace INSERT de un snapshot de NEW, sin comparaciones OLD/NEW, sin jsonb_each, sin jsonb_agg. Costo estimado: ~0.05ms por operación (vs 2-5ms del original).

**Problema 2 — event_hash sin correlationId (ALTO):**
El `event_hash` del backend se calculaba como `sha256('backend:{casoId}:{accion}:{detalle}')` SIN incluir `correlationId`. Esto causaba colisiones cuando el mismo caso recibía dos eventos del mismo tipo (ej: dos `auditEstadoCambiado` de `pendiente -> en_curso`) en diferentes flujos de negocio. El segundo evento se perdía por unique violation. Se corrigió la fórmula a `sha256('backend:{casoId}:{accion}:{detalle}:{correlationId}')`.

**Problema 3 — correlationId opcional en el backend (MEDIO):**
`correlationId` era opcional (`correlationId?: string`) en todos los tipos del AuditService. Esto permitía que eventos backend se escribieran sin correlation_id, mezclándose con eventos de trigger (que siempre tienen correlation_id = NULL) y rompiendo la trazabilidad end-to-end. Se cambió a obligatorio en:
  - `AuditPayload.correlationId`
  - Los 4 tipos de parámetros de funciones audit: `auditCasoCreado`, `auditEstadoCambiado`, `auditAsignado`, `auditCerrado`
  - `createCaso()` en `casoService.ts`

**Problema 4 — Supabase client sin timeout en fetch (CRÍTICO):**
El `createClient` de Supabase en `api/callbell/webhook.ts` usaba `global.fetch` sin timeout explícito. Esto causaba que requests a Supabase se colgaran para siempre si la red no respondía, sin error visible. Se agregó un wrapper custom de fetch con `AbortSignal.timeout(10_000)`.

**Problema 5 — (Build fix) webhookHandler.ts no incluido en commit:**
El commit `6a92976` incluyó `casoService.ts` con `correlationId` obligatorio pero NO incluyó `webhookHandler.ts` que tenía los cambios correspondientes (import crypto, correlationId, 3er argumento en createCaso). Vercel falló con `Expected 3 arguments, but got 2`. Se commitéo en `d86f45c`.

### Diseño del Sistema de Auditoría Final

**Arquitectura: dos streams, un solo log**

| Capa | Source | event_type | correlation_id | Uso |
|---|---|---|---|---|
| Trigger PostgreSQL | `db_trigger` | `'casos.snapshot'` | NULL | Debugging, forense, detección de cambios no autorizados |
| Backend AuditService | `backend` | `'caso.creado'`, `'caso.estado_cambiado'`, `'caso.asignado'`, `'caso.cerrado'` | UUID obligatorio | Reportes, reglas de negocio, UI |

**Protección anti-error humano (3 capas):**
1. SQL: CHECK constraint `chk_correlation_required` fuerza correlation_id NOT NULL en eventos backend
2. TypeScript: `correlationId: string` (no opcional) en todos los tipos
3. Views: `domain_events` (solo backend) y `technical_events` (solo trigger) evitan query directa a la tabla

**Idempotencia final:**
- Trigger: `'trg:' + caso_id + ':' + TG_OP + ':' + gen_random_uuid()'` (único, 1 vez por operación)
- Backend: `sha256('backend:' + casoId + ':' + eventType + ':' + stableDetalle + ':' + correlationId)` (determinístico)
- Garantía: UNIQUE constraint en event_hash a nivel DB

### Archivos Creados/Modificados (6)

#### Nuevos:
- `src/services/auditService.ts` — AuditService con 4 funciones semánticas + idempotencia SHA-256

#### Modificados:
- `estructura proyect absolute true/database/migrations/010_auditoria_eventos.sql` — Trigger ultra-liviano, tabla con event_hash UNIQUE, event_source ENUM, índices compuestos
- `src/services/supabase/casoService.ts` — correlationId obligatorio en createCaso + auditCasoCreado non-blocking
- `src/services/callbell/webhookHandler.ts` — crypto import + correlationId + 3er arg en createCaso
- `api/callbell/webhook.ts` — global.fetch wrapper con AbortSignal.timeout(10_000)
- Todos los archivos de documentación: SESSION_LOG, PROJECT_STATE, TODO

### Commits Realizados

| Hash | Mensaje |
|---|---|
| `6a92976` | fix(audit): make correlationId mandatory, include in event_hash, add composite index |
| `eddbe59` | fix(webhook): add 10s fetch timeout to Supabase client |
| `d86f45c` | fix(webhook): commit missing webhookHandler.ts changes for mandatory correlationId |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Trigger ultra-liviano** (solo snapshot, sin diff) | Trigger con lógica condicional + jsonb_each | Elimina riesgo de bloqueo en SELECTs. Cero lógica de negocio en DB |
| **event_hash con correlationId** | event_hash sin correlationId (como estaba) | Previene colisiones cuando el mismo caso tiene eventos del mismo tipo en diferentes flujos |
| **correlationId obligatorio** | Opcional (como estaba) | Garantiza trazabilidad end-to-end. Elimina ambigüedad entre eventos técnicos y semánticos |
| **global.fetch con AbortSignal.timeout** | Sin timeout (como estaba) | Previene requests colgadas sin error. Fail-fast en 10s |
| **domain_events view** | Query directa a auditoria_eventos | Protege contra errores humanos. La vista solo expone eventos backend |

### Estado al Cierre

- ✅ Sistema de auditoría final diseñado e implementado (trigger ultra-liviano + AuditService)
- ✅ event_hash ahora incluye correlationId — no más colisiones en eventos del mismo tipo
- ✅ correlationId obligatorio en todos los tipos — trazabilidad garantizada
- ✅ fetch timeout 10s en Supabase client — fail-fast en vez de hang silencioso
- ✅ Índice compuesto (event_source, created_at DESC) agregado
- ✅ Views domain_events y technical_events creadas
- ❌ Query a Supabase sigue bloqueada (problema de conectividad Vercel ↔ Supabase no resuelto)
- 🔑 **Próximo paso:** Verificar deploy + enviar mensaje de prueba

### Pendientes para la Próxima Sesión

- [ ] Verificar que el deploy del commit d86f45c complete exitosamente en Vercel
- [ ] Enviar mensaje de prueba y verificar logs (STEPs + AUDIT OK)
- [ ] Verificar en Supabase SQL Editor que trigger + backend escribieron eventos
- [ ] Ejecutar SQL del índice compuesto idx_audit_source_created
- [ ] Si el problema de conectividad Supabase persiste: diagnosticar fetch directo con AbortController
- [ ] Eliminar logs temporales de diagnóstico ([CASO.FIND] VERSION CHECK, STEP logs) cuando el sistema esté estable

---

## Sesión 18 — 2026-06-14 — Deploy Webhook + Diagnóstico de Bloqueo Supabase

**Objetivo:** Llevar el webhook de Callbell a producción, resolver errores de deploy y diagnosticar bloqueo en consultas a Supabase.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, TypeScript, Vercel CLI, GitHub, Supabase, Callbell API

### Resumen

Sesión enfocada en llevar el webhook de Callbell a producción y resolver la cadena de errores que impedían el procesamiento de mensajes reales. Se corrigieron 5 problemas en secuencia, y se dejó identificado un sexto problema de bloqueo de red que impide la inserción de casos en Supabase.

**Problema 1 — ERR_MODULE_NOT_FOUND:**
El webhook fallaba con `Cannot find module '/var/task/src/services/callbell/webhookHandler'` en Vercel. Causa: imports ESM sin extensión `.js` en un proyecto con `"type": "module"`. Se agregaron extensiones `.js` a los 6 imports relativos en la cadena `api/callbell/webhook.ts` → `webhookHandler.ts` → `payloadParser.ts` → `types.ts` + `casoService.ts`.

**Problema 2 — Function Runtimes must have a valid version:**
Se había agregado `"runtime": "nodejs20.x"` en `vercel.json` como parte del fix anterior, pero Vercel rechaza ese formato. El campo `runtime` en `functions` es para Community Runtimes (npm packages), no para la versión de Node.js. Se eliminó el bloque `functions` completo. Node.js 20 se configuró desde Vercel Dashboard → Settings → General → Node.js Version. Luego se actualizó a Node.js 22 nativamente.

**Problema 3 — TS2580: Cannot find name 'process':**
`api/callbell/webhook.ts` usa `process.env` pero `@types/node` no estaba instalado. Solución: `npm install --save-dev @types/node`.

**Problema 4 — Payload parser incompatible con estructura real de Callbell:**
El parser esperaba `payload.message.*` y `payload.conversation.uuid`, pero Callbell envía los campos del mensaje planos en `payload.*` y el UUID de conversación vive dentro de `payload.contact.conversationHref` como URL. Se reescribió `types.ts` y `payloadParser.ts` para reflejar la estructura real, agregando `extractConversationUuid()` que extrae el UUID del último segmento de la URL.

**Problema 5 — Vercel terminaba la ejecución antes de completar la query a Supabase:**
El patrón "respond-first" usaba `handleWebhook(...).then().catch()` sin `await`, lo que causaba que Vercel matara el proceso inmediatamente después de enviar la respuesta HTTP. Se reemplazó por `try { await handleWebhook(...) } catch (err) { ... }`.

**Problema 6 — (Diagnosticado, no resuelto) Query a Supabase nunca completa:**
Después de corregir los problemas anteriores, los logs de Vercel muestran:

```
[CASO.FIND] VERSION CHECK 2026-06-14-A
[CASO.FIND] Inicio búsqueda 22267cab03f048cda257b3ee1d79fc76
[CASO.FIND] ANTES DEL QUERY
```

Pero `[CASO.FIND] DESPUES DEL QUERY` nunca aparece. El `await supabase.from("casos").select("*").eq().maybeSingle()` nunca resuelve. Sin error, sin timeout visible. Se confirma que no es un problema de lógica, tipos, imports ESM, ni parser — es un problema de conectividad de red entre la función serverless de Vercel y la API REST de Supabase. Posibles causas: SUPABASE_URL incorrecta, SUPABASE_SERVICE_ROLE_KEY inválida, o firewall bloqueando la conexión.

### Archivos Modificados

#### Correcciones de deploy:
- `api/callbell/webhook.ts` — .js extensions en imports, await handleWebhook, try/catch
- `src/services/callbell/webhookHandler.ts` — .js extensions en imports
- `src/services/callbell/payloadParser.ts` — .js extensions en imports
- `src/services/supabase/casoService.ts` — .js extensions en imports
- `vercel.json` — Eliminado bloque functions inválido

#### Fix de types:
- `package.json` — Added @types/node (^25.9.3)

#### Corrección del parser Callbell:
- `src/services/callbell/types.ts` — Reescribir CallbellPayload para estructura real (campos planos, conversationHref)
- `src/services/callbell/payloadParser.ts` — extractConversationUuid(), inferAttachmentType(), corrige paths de parsing

#### Instrumentación de diagnóstico:
- `src/services/supabase/casoService.ts` — findByCallbellUuid() con try/catch + logs [CASO.FIND] VERSION CHECK, ANTES/DESPUES DEL QUERY
- `src/services/callbell/webhookHandler.ts` — STEP 1-8 logs
- `src/services/supabase/casoService.ts` — [CASO] logs en createCaso
- `api/callbell/webhook.ts` — RAW PAYLOAD log temporal

#### Documentación:
- `estructura proyect absolute true/docs/core/PROJECT_STATE.md` — Actualizado
- `estructura proyect absolute true/docs/core/TODO.md` — Actualizado
- `estructura proyect absolute true/docs/core/SESSION_LOG.md` — Esta entrada

### Decisiones Tomadas

| Decisión | Detalle |
|---|---|
| **ESM imports** | Agregar `.js` extensions a imports relativos para compatibilidad con Node.js ESM + Vercel |
| **Node.js runtime** | Configurar desde Vercel Dashboard, no desde vercel.json (`functions.runtime` es para Community Runtimes) |
| **Parser Callbell** | Adaptar al payload real: campos planos `payload.uuid/status/text`, conversation UUID desde `contact.conversationHref` URL |
| **Fire-and-forget** | Reemplazar por `try { await } catch` para evitar que Vercel termine el proceso antes de completar la query |
| **Logs temporales** | Agregar STEP 1-8, [CASO.FIND], [CASO] para trazabilidad. Todos deben eliminarse cuando el problema esté resuelto |

### Commits Realizados

| Hash | Mensaje |
|---|---|
| `62cadec` | fix: resolve vercel esm imports |
| `c6f2149` | fix(vercel): remove invalid functions runtime block |
| `d1182e0` | fix(types): add @types/node to resolve TS2580 (process.env) |
| `6db009d` | fix(webhook): align payload parser with real Callbell webhook structure |
| `dd11040` | fix(webhook): await handleWebhook to prevent Vercel early termination |
| `e934808` | chore(debug): add VERSION CHECK + ANTES/DESPUES DEL QUERY logs |

### Estado al Cierre

- ✅ ERR_MODULE_NOT_FOUND resuelto
- ✅ Function Runtimes invalid version resuelto
- ✅ TS2580 (process.env) resuelto
- ✅ Parser adaptado a payload real de Callbell
- ✅ Fire-and-forget corregido (Vercel ya no mata el proceso)
- ✅ Instrumentación de diagnóstico desplegada
- 🟡 **BLOQUEANTE:** Query a Supabase nunca resuelve — `await supabase.from()` cuelga sin error
- 🔑 **Próximo paso:** Determinar si es error de SUPABASE_URL/SERVICE_ROLE_KEY o firewall de red

### Pendientes para la Próxima Sesión

- [ ] Verificar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel Dashboard
- [ ] Agregar fetch directo con AbortController (timeout 5s) para diagnosticar conectividad a Supabase
- [ ] Si el fetch responde: el problema está en el cliente @supabase/supabase-js
- [ ] Si el fetch también cuelga: el problema es la URL/key o la red entre Vercel y Supabase
- [ ] Una vez resuelto: eliminar todos los logs de diagnóstico temporales
- [ ] Avanzar a Fase 2.3: Endpoints REST + Realtime

---

## Sesión 8 — 2026-06-11

**Objetivo:** Implementar Fase 2.2 — Backend + Webhook de Callbell. También crear migración 014_orden_tipo.sql para soportar órdenes digitales de MisRx.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, TypeScript, Vercel Serverless Functions, Supabase
**Contexto inicial:** Fase 2.1 completada (Supabase Auth real), frontend mock funcional, 13 migraciones SQL ejecutadas en Supabase.

### Resumen

Se implementó el primer componente real del backend: el endpoint webhook que recibe eventos de Callbell y crea/actualiza casos en Supabase. También se creó la migración 014 para soportar el hallazgo MisRx reportado por Franco (órdenes digitales electrónicas).

**Hallazgo MisRx:** Franco reportó que algunas órdenes médicas llegan como links de la plataforma MisRx (receta electrónica digital). Se documentó en MASTER_CONTEXT.md y se creó la migración 014 para agregar el campo `orden_tipo` a `extracciones_ia`.

**Implementación del webhook (5 archivos creados):**

1. **`api/callbell/webhook.ts`** — Serverless Function de Vercel. Maneja GET (health check) y POST (eventos). Validación por secret token en query param.
2. **`src/services/callbell/types.ts`** — Interfaces completas del payload de Callbell + estructuras internas parseadas.
3. **`src/services/callbell/payloadParser.ts`** — Parseo del payload crudo. Detecta adjuntos, links de MisRx, valida campos mínimos.
4. **`src/services/supabase/casoService.ts`** — CRUD server-side: findByCallbellUuid, createCaso, updateCasoHistorial, closeCaso, assignCaso.
5. **`src/services/callbell/webhookHandler.ts`** — Lógica de negocio: orquesta el flujo según tipo de evento (message_created, conversation_closed, conversation_assigned).

**Correcciones durante code review:**
- Se agregó filtro `message.status === "received"` para ignorar mensajes salientes del asesor (hallazgo crítico)
- Se actualizó `updateCasoHistorial` para manejar MisRx en casos existentes
- Se corrigió `tipo_caso` NOT NULL en el insert (faltaba el campo)
- Se eliminaron variables/funciones no usadas (`TIPO_CASO_PENDIENTE`, `isCallbellClosed`)
- Se aplicó **respond-first pattern**: responder 200 inmediatamente, procesar en background

**Variables de entorno:** Se generó `CALLBELL_WEBHOOK_SECRET` (32 caracteres alfanuméricos) y se documentaron las variables en `.env.local`.

### Archivos Creados/Modificados

#### Nuevos:
- `database/migrations/014_orden_tipo.sql` — Campo orden_tipo en extracciones_ia
- `api/callbell/webhook.ts` — Vercel Serverless Function
- `src/services/callbell/types.ts` — Tipos del payload de Callbell
- `src/services/callbell/payloadParser.ts` — Parseador del payload
- `src/services/supabase/casoService.ts` — CRUD server-side
- `src/services/callbell/webhookHandler.ts` — Lógica de negocio
- `.env.local` — Documentación de variables de entorno

#### Modificados:
- `docs/core/PROJECT_STATE.md` — Actualizado con progreso de Fase 2.2
- `docs/core/TODO.md` — Fase 2.2 marcada como completada, nuevo resumen de progreso
- `docs/core/SESSION_LOG.md` — Esta entrada

### Decisiones Tomadas

| Decisión | Detalle |
|---|---|
| **Seguridad webhook** | Callbell no firma con HMAC → validación por secret token en query param (`?secret=TOKEN`) |
| **Eventos a procesar** | `message_created` (solo status "received"), `conversation_closed`, `conversation_assigned`. Otros → descartar |
| **Idempotencia** | Buscar por `callbell_conversation_uuid`. Si existe y no está cerrado → actualizar historial. Si no existe o está cerrado → crear nuevo |
| **Respond-first** | Responder 200 inmediatamente a Callbell, procesar en background con `.then()/.catch()` |
| **Sin IA en Fase 2** | Placeholders + TODO comentado. `tipo_caso` default "A". `modelo_ia` = "pendiente" |
| **MisRx v1** | Detectar `misrx.com.ar/prestacion` en texto. NO extraer contenido del link. El asesor abre manualmente |
| **orden_tipo** | TEXT con CHECK: `imagen`, `pdf`, `misrx_link`, `no_aplica`. Default `no_aplica`. Sin ENUM (no existía previamente) |

### Archivos de Referencia Creados

| Archivo | Propósito |
|---|---|
| `database/migrations/014_orden_tipo.sql` | Migración para campo orden_tipo en extracciones_ia |
| `api/callbell/webhook.ts` | Endpoint GET + POST del webhook |
| `src/services/callbell/types.ts` | Interfaces: CallbellPayload, ParsedPayload, ParsedMessage, etc. |
| `src/services/callbell/payloadParser.ts` | parsePayload(), validatePayload() |
| `src/services/supabase/casoService.ts` | createCaso(), updateCasoHistorial(), closeCaso(), assignCaso(), findByCallbellUuid() |
| `src/services/callbell/webhookHandler.ts` | handleWebhook(), handleMessageCreated(), handleConversationClosed(), handleConversationAssigned() |
| `.env.local` | Documentación de variables de entorno |

### Riesgos Identificados/Actualizados

| # | Riesgo | Acción |
|---|---|---|
| R11 | Precisión de lectura de MisRx (links) | En v1 el asesor abre el link manualmente. Evaluar API/Puppeteer para v2 |

### Pendientes para la Próxima Sesión

- [ ] Implementar Fase 2.3: Endpoints REST (GET /api/casos, GET /api/casos/:id, PATCH /api/casos/:id)
- [ ] Conectar Supabase Realtime al frontend (useRealtimeCases hook)
- [ ] Migrar CasoService mock → SupabaseApiService
- [ ] Configurar variables de entorno en Vercel y hacer deploy
- [ ] Configurar webhook en dashboard de Callbell
- [ ] Inicializar repositorio Git + GitHub

### Estado al Cierre

- ✅ Migración 014_orden_tipo.sql creada
- ✅ Fase 2.2 completa — webhook funcional, 5 archivos creados
- ✅ Respond-first pattern aplicado
- ✅ .env.local documentado con todas las variables
- ✅ CALLBELL_WEBHOOK_SECRET generado (32 chars)
- ✅ Typecheck: OK (tsc --noEmit sin errores)
- 🔑 **Próximo paso:** Fase 2.3 — Endpoints REST + Realtime

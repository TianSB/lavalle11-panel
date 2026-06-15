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

## Sesión 25 — 2026-06-14 — Tests, Frontend audit, y debugging de env vars en Vercel

**Objetivo:** Agregar tests unitarios, conectar el frontend a datos reales de Supabase, y configurar env vars de IA en Vercel para activar Claude en producción.
**Duración:** 1 sesión (~1h)
**Herramientas:** Codebuff IA, TypeScript, Vitest, Vercel Dashboard, GitHub

### Resumen

Sesión de cierre y verificación post-Fase 3. Se confirmó que los tests unitarios ya estaban implementados (34 tests, 2 files, 0 fallos) de la Sesión 24. Se auditó el frontend y se descubrió que ya estaba conectado a Supabase desde Fase 2.3 — la migración del servicio mock al real ya se había hecho. El bloqueante actual: las variables `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY` no llegan al runtime serverless de Vercel — el log muestra `[AI_FACTORY] Provider activo: mock`.

### 1. Verificación de tests

El usuario pidió agregar tests para mock, claude, buildFlags, reabrirCaso y actualizarExtraccionIA. Estos ya estaban implementados desde la Sesión 24:

| Test file | Tests | Coverage |
|---|---|---|
| `src/services/__tests__/providers.test.ts` | 19 | MockAIProvider (nombre, valores, adjuntos, latencia) + aiFactory (singleton, env vars, fallback) |
| `src/services/__tests__/casoService.test.ts` | 15 | buildFlags (flags IA + sistema, combinaciones), reabrirCaso (mock Supabase), actualizarExtraccionIA |

**Resultado: `npx vitest run` → 34 passed, 0 failed** ✅

### 2. Auditoría de conexión frontend a Supabase

Se investigó si el frontend estaba usando datos mock o reales. Hallazgo:

| Componente | Estado | Detalle |
|---|---|---|
| `App.tsx` | ✅ | Usa `<CasoServiceProvider>` sin prop → defaults a `supabaseCasoService` |
| `CasoServiceContext` | ✅ | `createContext<CasoService>(supabaseCasoService)` |
| `supabaseService.ts` | ✅ | Implementación real: queries a Supabase con JOIN a extracciones_ia, turnos, asesor |
| `.env.local` | ✅ | `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configurados |
| `mockCasoService` | 🟡 | Definido en `mockService.ts` pero **nunca importado fuera de su archivo** |

**Conclusión: El frontend ya estaba conectado a Supabase desde Fase 2.3. No se requieren cambios.** El `mockCasoService` existe solo como referencia de la interfaz `CasoService` — nunca se inyecta en el árbol React.

### 3. Debugging de env vars en Vercel

Se intentó configurar `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY` en Vercel. Pasos:

1. **Commit y push** de cambios pendientes (tests + docs):
   - `git add -A && git commit -m 'chore: add tests (vitest), update docs, export buildFlags for Fase 3'`
   - `git push origin main` → commit `5acf641` en main, Vercel auto-deploy
2. **Verificación de `vercel.json`** — ✅ Sin restricciones de env vars:
   ```json
   { "framework": "vite", "buildCommand": "npm run build", ... }
   ```
3. **Intento de diagnóstico via Vercel CLI** — ❌ No disponible. El CLI no tiene sesión autenticada localmente, no se pudo ejecutar `vercel env ls --environment=production` ni `vercel env pull .env.production.local`.

**Estado actual:** El log del webhook muestra:
```
[AI_FACTORY] Provider activo: mock
```

Esto confirma que `process.env.PRIMARY_PROVIDER` está undefined/falsy en el runtime serverless de Vercel, por lo que la factory usa el default `"mock"`.

**Causa más probable (por historial de Sesión 23):** Mismo error que con `SUPABASE_URL` en Sesión 23 — las variables se configuraron en scope **Preview** en lugar de **Production**, o se configuraron después del último deploy y falta hacer Redeploy.

### Archivos Modificados (solo documentación)

| Archivo | Cambio |
|---|---|
| `estructura proyect absolute true/docs/core/PROJECT_STATE.md` | v2.1: nuevo riesgo R14, frontend verificado conectado, env vars debugging |
| `estructura proyect absolute true/docs/core/TODO.md` | 2.3.5 verificado ✅, Fase 3: 16/18 completas, nuevo riesgo R14 |
| `estructura proyect absolute true/docs/core/SESSION_LOG.md` | Esta entrada (Sesión 25) |

### Commits Realizados

| Hash | Mensaje |
|---|---|
| `5acf641` | chore: add tests (vitest), update docs, export buildFlags for Fase 3 |

### Decisiones Tomadas

| Decisión | Razón |
|---|---|
| **No hay cambios en el frontend** | Ya estaba conectado a Supabase desde Fase 2.3 |
| **No se debuggean env vars desde aquí** | Vercel CLI sin autenticación local. El usuario debe verificar desde Vercel Dashboard |
| **Se documenta R14 como riesgo crítico** | Hasta que las env vars de IA lleguen al runtime, el webhook usa mock |

### Estado al Cierre

- ✅ Tests verificados: 34 passed, 2 files
- ✅ Frontend auditado: ya conectado a Supabase vía `supabaseCasoService`
- ✅ Último commit pusheado: `5acf641`
- 🔴 **R14: Env vars de IA no llegan al runtime serverless** — `[AI_FACTORY] Provider activo: mock`
- 🔑 **Próximo paso:** Verificar scope de env vars en Vercel Dashboard → Settings → Environment Variables → Production

### Pendientes para la Próxima Sesión

- [ ] 🔴 **Verificar en Vercel Dashboard** que `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY` existen en scope **Production** (no solo Preview)
- [ ] 🔴 **Hacer Redeploy** del último commit (`5acf641`) desde Vercel Dashboard → Deployments → 3 dots → Redeploy
- [ ] 🟢 Verificar log del webhook: debe mostrar `[AI_FACTORY] Provider activo: claude`
- [ ] 🟢 Enviar mensaje de WhatsApp real y verificar análisis completo de IA
- [ ] ⬜ Refactor menor: extraer bloque IA duplicado entre RAMA 2 y RAMA 3 a función helper

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

### Tests unitarios (creados en Sesión 24, verificados en Sesión 25)

| Archivo | Tests | Lo que cubre |
|---|---|---|
| `src/services/__tests__/fixtures.ts` | — | 8 fixtures compartidos |
| `src/services/__tests__/providers.test.ts` | 19 | MockAIProvider + aiFactory |
| `src/services/__tests__/casoService.test.ts` | 15 | buildFlags + reabrirCaso + actualizarExtraccionIA |

### Deploy

| Paso | Estado |
|---|---|
| `@anthropic-ai/sdk` instalado | ✅ |
| Vitest configurado + 34 tests pasando | ✅ |
| `npx tsc -b --noEmit` | ✅ 0 errores |
| Code reviews (deepseek-flash) | ✅ Sin issues bloqueantes |
| `git commit` | ✅ `9a2a7ed` + `5acf641` |
| `git push origin main` | ✅ Vercel auto-deploy |
| `PRIMARY_PROVIDER=claude` en Vercel | 🔴 **No llega al runtime** — verificar scope |
| `ANTHROPIC_API_KEY` en Vercel | 🔴 **No llega al runtime** |

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

### Archivos Modificados (6 existentes)

| Archivo | Cambio |
|---|---|
| `src/services/callbell/types.ts` | CallbellAttachmentPayload, attachments type biforma, ParsedAttachment con content_type/file_name |
| `src/services/callbell/payloadParser.ts` | parseAttachment(), inferMimeType(), soporte string/object |
| `src/services/callbell/webhookHandler.ts` | 3 ramas + IA + conversation_opened + content_type real |
| `src/services/supabase/casoService.ts` | createCaso(analisis), buildFlags (exportado), reabrirCaso, actualizarExtraccionIA |
| `vite.config.ts` | Configuración de vitest agregada |
| `package.json` | @anthropic-ai/sdk + vitest (dev) |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Provider-agnostic** (AIProvider interface) | Llamar a Claude directamente | Separa responsabilidades. Mock en dev, Claude en prod |
| **tool_use con `tool_choice: any`** | JSON en texto libre | Output determinista y parseable |
| **max_tokens 1024** | 4096 o más | Suficiente para tool response compacta. Reduce costo/tiempo |
| **Fallback a mock siempre** | Propagar excepción | Cero casos perdidos por error de IA |
| **3 ramas en webhookHandler** | 2 ramas | Resuelve error 23505 |
| **buildFlags exportado** | Mantener privado | Necesario para tests unitarios |
| **26 tests de buildFlags + servicios** | Tests manuales | Cobertura automática de reglas de negocio |

### Lecciones Aprendidas

| Lección | Detalle |
|---|---|
| **Adjuntos Callbell** | Pueden ser strings (solo URL) u objetos (url + content_type + file_name) |
| **Conversaciones reabiertas** | Callbell reutiliza UUID al reabrir → no crear caso nuevo |
| **Env vars de Vercel** | Verificar scope Production vs Preview (mismo bug que Sesión 23) |
| **buildFlags debe ser exportado** | Si se quiere testear unitariamente, necesita `export` |

### Estado al Cierre (Sesión 24)

- ✅ **Fase 3 completa**: 5 archivos nuevos + modificaciones
- ✅ **Claude API integrada**: tool_use + visión
- ✅ **Reapertura de casos**: reabrirCaso + actualizarExtraccionIA
- ✅ **Attachment types fixeados**
- ✅ **Typecheck 0 errores**
- ✅ **Commit + push**: `9a2a7ed`
- ⬜ PRIMARY_PROVIDER + ANTHROPIC_API_KEY pendientes en Vercel

### Estado al Cierre (Sesión 25)

- ✅ Tests verificados: 34 passed
- ✅ Frontend auditado: ya conectado a Supabase
- ✅ Commit `5acf641` pusheado
- 🔴 **R14: Env vars de IA no llegan al runtime**
- 🔑 **Próximo paso:** Verificar scope Production en Vercel Dashboard

### Pendientes para la Próxima Sesión

- [ ] 🔴 Verificar scope Production de PRIMARY_PROVIDER y ANTHROPIC_API_KEY en Vercel Dashboard
- [ ] 🔴 Redeploy del último commit (5acf641)
- [ ] 🟢 Verificar log: `[AI_FACTORY] Provider activo: claude`
- [ ] 🟢 Probar webhook con mensaje real de WhatsApp
- [ ] ⬜ Refactor: extraer bloque IA duplicado

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
| `api/callbell/webhook.ts` | Cambio de respond-first a process-first: `await handleWebhook()` antes de `res.json()`. Limpieza de comentarios. |
| `src/services/supabase/casoService.ts` | Agregado y luego eliminado fetch diagnóstico. Version check: A→C→D. |

### Commits Realizados

| Hash | Mensaje |
|---|---|
| `a8ce799` | redeploy: force fresh build with fetch diagnostic |
| `3997afe` | chore(debug): bump version string to force Vercel cache invalidation |
| `7fd5259` | fix(debug): replace async fetch diagnostic with synchronous env-var logging |
| `324935c` | fix(webhook): remove global.fetch override |
| `655be3d` | fix(webhook): swap to process-first pattern |
| `91c7206` | chore: clean up diagnostic logs |

### Lecciones Aprendidas

| Lección | Detalle |
|---|---|
| **Cache de Vercel** | Commits vacíos NO invalidan build cache |
| **Respond-first en Hobby** | Vercel Hobby termina función después de res.json() |
| **Debugging progresivo** | Logs sincrónicos aíslan punto de congelamiento |

### Estado al Cierre

- ✅ **Causa raíz identificada:** Vercel Hobby mata async después de res.json()
- ✅ **Fix aplicado:** Process-first pattern
- ✅ **Primer caso creado:** LV-0001 (870ms)
- ⚠️ **Error PGRST204:** Migración 014 no ejecutada
- ✅ Build + TypeScript OK

### Pendientes para la Próxima Sesión

- [ ] Probar endpoints REST: `GET /api/casos?limit=5`
- [ ] Avanzar a Fase 3: Análisis con Claude IA

---

### Continuación — Migración 014 + Fase 2.3: Endpoints REST + Fix .js imports

**Mismo día, misma sesión.** Se ejecutaron múltiples tareas.

**Migración 014 ejecutada en Supabase:** ✅ **LV-0002 creado sin error PGRST204.**

**Fix de .js extensions en imports:** Agregadas para consistencia ESM.

**Endpoints REST:** `GET /api/casos` y `GET /api/casos/:id` implementados.

**Commits:** `0560180` (fix .js imports), `3d06c7b` (feat endpoints)

---

## Sesión 22 — 2026-06-14 — Auditoría Supabase Final + Timeout Fix + Hardening

**Objetivo:** Diseñar e implementar sistema de auditoría final tipo Stripe/Linear para Supabase, hardening de idempotencia, y fix crítico de timeout en Supabase client.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, TypeScript, Supabase, PostgreSQL, Vercel Serverless

### Resumen

Sesión enfocada en diseñar e implementar un sistema de auditoría production-grade para la tabla `casos`, con separación estricta entre eventos técnicos (trigger) y semánticos (backend), idempotencia global, y hardening de resiliencia.

**Problemas corregidos:**
1. Trigger con jsonb_each → ultra-liviano (solo INSERT snapshot, ~0.05ms)
2. event_hash sin correlationId → incluye correlationId (previene colisiones)
3. correlationId opcional → obligatorio en todos los tipos
4. Supabase client sin timeout → AbortSignal.timeout(10_000)
5. webhookHandler.ts no incluido en commit → commit separado

**Arquitectura: dos streams, un solo log**

| Capa | Source | event_type | correlation_id |
|---|---|---|---|
| Trigger | `db_trigger` | `casos.snapshot` | NULL |
| Backend | `backend` | `caso.creado`, `caso.estado_cambiado`, etc. | UUID obligatorio |

**Commits:** `6a92976`, `eddbe59`, `d86f45c`

---

## Sesión 18 — 2026-06-14 — Deploy Webhook + Diagnóstico de Bloqueo Supabase

**Objetivo:** Llevar el webhook de Callbell a producción.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, TypeScript, Vercel CLI, GitHub, Supabase, Callbell API

### Resumen

5 problemas corregidos en secuencia:
1. ERR_MODULE_NOT_FOUND — .js extensions en imports ESM
2. Function Runtimes invalid version — Eliminar bloque functions de vercel.json
3. TS2580 — Instalar @types/node
4. Parser incompatible con payload real — Reescribir types.ts + payloadParser.ts
5. Vercel mata proceso — Reemplazar `.then()` por `try { await }`

**Problema 6 diagnosticado (no resuelto):** Query a Supabase nunca completa.

**Commits:** `62cadec`, `c6f2149`, `d1182e0`, `6db009d`, `dd11040`, `e934808`

---

## Sesión 8 — 2026-06-11 — Webhook + Migración 014

**Objetivo:** Implementar Fase 2.2 + migración MisRx.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, TypeScript, Vercel Serverless Functions, Supabase

### Resumen

5 archivos creados para el webhook de Callbell + migración 014_orden_tipo.sql.

**Hallazgo MisRx:** Franco reportó órdenes digitales electrónicas.

**Archivos creados:** `api/callbell/webhook.ts`, `src/services/callbell/types.ts`, `payloadParser.ts`, `casoService.ts`, `webhookHandler.ts`, `database/migrations/014_orden_tipo.sql`

**Decisiones:** Secret token en query param, respond-first pattern, solo eventos message_created/conversation_closed/conversation_assigned, placeholders para IA en Fase 2.

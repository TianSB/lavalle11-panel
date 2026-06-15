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

## Sesión 28 — 2026-06-15 — Bugfix assign_case RPC + Re-analizar con IA + Contador mensajes + Deploy final

**Objetivo:** Corregir bug de "Tomar caso" (UUID vs VARCHAR), configurar env vars faltantes, implementar re-análisis manual con IA (Opción 4), agregar contador de mensajes en cards, y hacer deploy final a producción.
**Duración:** 1 sesión (~3h)
**Herramientas:** Codebuff IA, TypeScript, React, Vercel Serverless, Supabase (SQL Editor + CLI), Vercel CLI

---

### Resumen

Sesión intensiva de fixes post-producción y nuevas features. Se corrigió el bug crítico de "Tomar caso", se configuraron todas las env vars faltantes, se implementó el re-análisis manual con IA (Opción 4 del análisis de recolección de datos), y se agregó un contador visual de mensajes en las cards.

---

### Paso 1: Bugfix assign_case RPC

**Problema:** Al hacer clic en "Tomar caso" en el panel, aparecía el error:
```
invalid input syntax for type uuid: "LV-0036"
```

**Causa raíz:** La migración `003_casos.sql` define `casos.id` como `VARCHAR(10)` (formato `LV-XXXX` generado por trigger + secuencia). Pero la migración `015_assign_case_rpc.sql` declaró el parámetro del RPC como `p_case_id UUID`.

**Flujo del bug:**
1. `CaseCard.tsx` llama `onAsignar(caso.id)` → pasa `"LV-0036"`
2. `useAsignarCaso.ts` → `service.asignarCaso("LV-0036")`
3. `supabaseService.ts` → `supabase.rpc("assign_case", { p_case_id: "LV-0036" })`
4. PostgreSQL intenta castear `"LV-0036"` a `UUID` → error

**Fix:**
- En `015_assign_case_rpc.sql`: cambiar `p_case_id UUID` → `p_case_id VARCHAR(10)` y `v_assigned_id UUID` → `v_assigned_id VARCHAR(10)`
- Aplicar SQL en Supabase via `CREATE OR REPLACE FUNCTION`
- Problema post-fix: PostgreSQL no podía elegir entre la vieja función (UUID) y la nueva (VARCHAR) → `DROP FUNCTION public.assign_case(p_case_id UUID)` para eliminar la versión duplicada

**Archivo modificado:**
- `estructura proyect absolute true/database/migrations/015_assign_case_rpc.sql`

**Commit:** `87f82a8` — `fix(rpc): change assign_case parameter from UUID to VARCHAR(10)`

#### Auditoría de otros RPCs

Se revisaron todas las funciones SQL en migraciones (6 funciones) y todas las llamadas `.rpc()` desde TypeScript (solo 1). **Ningún otro RPC tenía este problema.**

| Función | Parámetros | Estado |
|---|---|---|
| `assign_case` | 1 param VARCHAR(10) | ✅ Corregido |
| `generar_caso_id` | Ninguno (trigger) | ✅ |
| `actualizar_updated_at` | Ninguno (trigger) | ✅ |
| `registrar_evento_caso` | Ninguno (trigger) | ✅ |
| `sync_usuario_from_auth` | Ninguno (trigger) | ✅ |
| `auth_rol` | Ninguno | ✅ |

---

### Paso 2: Configuración de env vars en Vercel Production

**Estado inicial (según PROJECT_STATE.md):** 6 variables marcadas como "Pendiente".

**Verificación con Vercel CLI:**
```bash
vercel env ls --environment=production
```
Resultado: **TODAS las variables YA estaban configuradas** como "Encrypted" en Production desde 4–13h antes. El PROJECT_STATE.md estaba desactualizado.

| Variable | Estado real |
|---|---|
| `VITE_SUPABASE_URL` | ✅ Ya estaba |
| `VITE_SUPABASE_ANON_KEY` | ✅ Ya estaba |
| `PRIMARY_PROVIDER` | ✅ Ya estaba |
| `ANTHROPIC_API_KEY` | ✅ Ya estaba |
| `CHICLANA_PHONE` | ⬜ **Faltaba** |

Se agregó `CHICLANA_PHONE = +5492914027333` (número de WhatsApp de la sede Chiclana) vía:
```bash
vercel env add CHICLANA_PHONE production
```

Se encontró una variable extraña `PRIMARY_PROVIDER_claude` que parece un error de configuración (alguien escribió el nombre de la variable como `PRIMARY_PROVIDER=claude`). Se dejó para cleanup futuro.

**Redeploy:** Exitoso en ~33s →
```
https://l11panel.vercel.app ✅
```

---

### Paso 3: Re-analizar con IA (Opción 4)

**Contexto:** El chatbot de Callbell tiene un flujo multipaso donde el primer mensaje suele ser un selector numérico ("1", "2"), no la orden médica real. Claude se invoca en ese primer mensaje y obtiene datos pobres.

**Análisis previo de 5 opciones:**

| Opción | Descripción | Recomendación |
|---|---|---|
| 1 | Re-análisis continuo (cada mensaje) | ❌ Caro (~400 llamadas/día) |
| **2** | **Análisis diferido con triggers** | **🏆 Recomendada** |
| 3 | Deferred scan por timers | ❌ Frágil en serverless |
| **4** | **Botón manual "Re-analizar con IA"** | **✅ Elegida (fácil, rápida)** |
| 5 | Fetch historial desde API Callbell | ❌ Requiere integración extra |

Se implementó la **Opción 4** como solución inmediata, con plan de migrar a Opción 2 (auto-trigger) en el futuro.

#### Backend: `api/casos/[id]/re-analizar.ts`

Nuevo endpoint `POST /api/casos/:id/re-analizar`:

1. Busca caso + contacto en Supabase
2. Obtiene **todos los mensajes** `inbound` de la tabla `mensajes` (ordenados por fecha)
3. Obtiene adjuntos de la tabla `adjuntos` (con fallback a `orden_url` de `extracciones_ia`)
4. Concatena todo el historial con timestamps en formato `[HH:MM] contenido`
5. Construye `EntradaCanónica` con textos + adjuntos
6. Llama a `getAIProvider().analizarCaso(entrada)` (respeta provider configurado: mock o claude)
7. Actualiza `extracciones_ia` con nuevo análisis
8. Actualiza `tipo_caso` y `prioridad` en tabla `casos`
9. Retorna `{ ok: true, tipo_caso, confianza, resumen }`

**Flags:** `buildReanalysisFlags()` versión simplificada sin dependencia de `ParsedPayload`.

**Archivo creado:**
- `api/casos/[id]/re-analizar.ts`

#### Frontend: Botón en CaseModal

Se agregó el botón **"Re-analizar con IA"** en la sección de acciones del modal:

- Ícono de "brain/magic" (`svg` de bombilla)
- Spinner animado durante el análisis
- Toast de éxito/error
- Refresca la card automáticamente al terminar
- Solo visible para casos no cerrados

**Archivos modificados:**
- `src/components/modal/CaseModal.tsx` — +handleReanalizar, +reanalizarLoading, +botón

**Commits:**
- `c1c435d` — `feat(ai): add manual Re-analizar con IA button in CaseModal`
- `29e2094` — `chore: remove unused crypto import in re-analizar endpoint` (fix warning de build)

---

### Paso 4: Contador de mensajes en CaseCard

**Problema:** El asesor no tenía visibilidad de cuántos mensajes acumulaba cada conversación. Al ver la card con análisis pobre, no sabía si había más mensajes para revisar.

#### Tipo Caso

Se agregó `mensajes_count: number` (requerido) al tipo `Caso` en `types/index.ts`.

#### Backend: Batch query de conteo

Nueva función `fetchMensajesCounts(casoIds)` en `supabaseService.ts`:
- Query única a `mensajes` con `.in("caso_id", casoIds)` y `.eq("direction", "inbound")`
- Retorna `Map<caso_id, count>`
- Se llama en `getCasos()`, `getCasosByAsesor()`, `getCasosConSeguimiento()`
- Mismo patrón de 3 líneas en cada método

#### Realtime Sync

Se agregó `mensajes_count: 0` (default) en `mapRowToCaso()` duplicado de `useCaseRealtimeSync.ts` para mantener consistencia de tipos.

#### Mock data

Se agregó `mensajes_count` a los 12 casos mock con valores variados (1–7 mensajes).

#### UI: Badge en CaseCard

Badge con icono de burbuja de chat + número, visible solo cuando `mensajes_count > 1`:
```
LV-0041 💬 3 Tipo A    [Pendiente]
```

**Archivos modificados:**
- `src/types/index.ts` — +`mensajes_count: number`
- `src/services/supabaseService.ts` — +`fetchMensajesCounts()`
- `src/hooks/useCaseRealtimeSync.ts` — +`mensajes_count: 0`
- `src/data/mockCases.ts` — +`mensajes_count` en todos los casos
- `src/components/cases/CaseCard.tsx` — +badge visual

**Commit:** `863cc23` — `feat(ui): add mensajes_count badge to CaseCard`

---

### Archivos Creados (Sesión 28)

| Archivo | Propósito |
|---|---|
| `api/casos/[id]/re-analizar.ts` | POST endpoint para re-análisis manual con IA |

### Archivos Modificados (Sesión 28)

| Archivo | Cambio |
|---|---|
| `estructura proyect absolute true/database/migrations/015_assign_case_rpc.sql` | Fix: `UUID` → `VARCHAR(10)` en assign_case |
| `src/types/index.ts` | +`mensajes_count: number` en interface Caso |
| `src/services/supabaseService.ts` | +`fetchMensajesCounts()` + llamado en 3 métodos |
| `src/hooks/useCaseRealtimeSync.ts` | +`mensajes_count: 0` en mapRowToCaso |
| `src/data/mockCases.ts` | +`mensajes_count` en todos los casos mock |
| `src/components/cases/CaseCard.tsx` | +Badge con contador de mensajes |
| `src/components/modal/CaseModal.tsx` | +Botón "Re-analizar con IA" |

### Commits Realizados (Sesión 28)

| Hash | Mensaje |
|---|---|
| `87f82a8` | fix(rpc): change assign_case parameter from UUID to VARCHAR(10) |
| `c1c435d` | feat(ai): add manual Re-analizar con IA button in CaseModal |
| `29e2094` | chore: remove unused crypto import in re-analizar endpoint |
| `863cc23` | feat(ui): add mensajes_count badge to CaseCard |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Opción 4 (botón manual)** sobre Opción 2 (auto-trigger) | Opción 2 recomendada pero más compleja | Solución inmediata. Auto-trigger se puede agregar después |
| **Re-análisis fetcha mensajes + adjuntos desde DB** | Usar API de Callbell | Ya tenemos los datos en Supabase, evita latencia extra |
| **mensajes_count como campo requerido** | Campo opcional (`number \| undefined`) | Siempre se puede calcular, evita null checks |
| **Batch query de mensajes counts** | N+1 queries por caso | Una sola query para todos los casos, eficiente |
| **Badge solo si > 1 mensaje** | Siempre visible | 1 mensaje es el inicial (sin acumulación), no aporta info |
| **DROP FUNCTION vieja (UUID)** | Dejar ambas y esperar que PostgreSQL elija | PostgreSQL no puede elegir entre dos funciones con el mismo nombre y diferentes tipos |

### Errores Corregidos

| Problema | Fix |
|---|---|
| `assign_case` recibe UUID pero casos.id es VARCHAR(10) | Cambiar tipo de parámetro en RPC |
| PostgreSQL: "Could not choose the best candidate function" | `DROP FUNCTION` la versión UUID duplicada |
| `crypto` importado pero no usado en re-analizar.ts | Eliminar import |
| `mensajes_count` faltante en `useCaseRealtimeSync.mapRowToCaso()` | Agregar `mensajes_count: 0` |

### Estado al Cierre

- ✅ **Bug assign_case corregido** — "Tomar caso" funciona correctamente
- ✅ **Todas las env vars configuradas** en Vercel Production (9/9)
- ✅ **CHICLANA_PHONE** configurado (`+5492914027333`)
- ✅ **Re-analizar con IA** implementado (endpoint + botón)
- ✅ **Contador de mensajes** en cards
- ✅ TypeScript 0 errores
- ✅ Tests: 43/43 passed
- ✅ 4 commits pusheados a main
- ✅ Documentación actualizada (PROJECT_STATE.md, TODO.md, SESSION_LOG.md)
- ✅ **R14 resuelto**: env vars de IA ya están en Production

### Pendientes para la Próxima Sesión

- [ ] 🟢 **Probar flujo completo en producción**: login → tomar caso → re-analizar → confirmar turno → enviar mensaje
- [ ] 🟢 **Probar webhook con IA real** (PRIMARY_PROVIDER=claude ya configurado)
- [ ] 🟢 **Probar derivación a Chiclana** (CHICLANA_PHONE configurado)
- [ ] ⬜ Agregar Sentry para monitoreo de errores en producción
- [ ] ⬜ Tests de integración para los 7 endpoints POST
- [ ] ⬜ **Implementar Opción 2 híbrida**: auto-trigger de re-análisis cuando llega un attachment
- [ ] ⬜ Agregar confirm dialog antes de re-analizar (consume crédito de API)
- [ ] ⬜ Agregar evento de auditoría cuando se re-analiza un caso manualmente
- [ ] ⬜ Limpiar `PRIMARY_PROVIDER_claude` (variable mal nombrada en Vercel)

---

## Sesión 27 — 2026-06-15 — Fase 4 y Fase 5 completas + Deploy guide

**Objetivo:** Implementar Fase 4 (acciones del asesor — 6 endpoints POST + UI) y Fase 5 (MetricsBoard completo con KPIs, asesores, CSV, auto-refresh, filtro fecha). Documentar deploy final.
**Duración:** 1 sesión (~3h)
**Herramientas:** Codebuff IA, TypeScript, React, Vercel Serverless, Supabase, Callbell API

### Resumen

Sesión de cierre de las Fases 4 y 5. Se implementaron 10 commits en total, completando el 100% de las funcionalidades planificadas del panel.

---

### Fase 4 — Acciones del Asesor (6 pasos)

#### Paso 1: messagesApi.ts + endpoint enviar-mensaje + tests

Se creó un servicio centralizado para la Callbell Messages API (`src/services/callbell/messagesApi.ts`) con:
- `enviarMensajeCallbell(phone, mensaje, conversationUuid?)` — envía WhatsApp via API REST de Callbell
- Timeout de 10s con AbortController
- 1 retry automático ante fallos de red
- Validación de teléfono (debe empezar con `+`)
- Manejo de error estructurado: `{ success: boolean, messageId?: string, error?: string }`
- `getAuthHeaders()` dentro del try/catch (no vuelca el proceso si falta token)

Endpoint `POST /api/casos/:id/enviar-mensaje`:
- Recibe `{ mensaje: string }`
- Obtiene caso de Supabase (teléfono + conversation UUID)
- Llama `enviarMensajeCallbell()`
- Retorna `{ ok: true, messageId }` o `{ ok: false, error }`

Archivos:
- `src/services/callbell/messagesApi.ts` — Nuevo
- `src/services/__tests__/messagesApi.test.ts` — 9 tests
- `src/services/supabaseService.ts` — `enviarMensaje()` real
- `api/casos/[id]/enviar-mensaje.ts` — Nuevo

Tests: 9/9 passed — validación de teléfono, token faltante, éxito, HTTP error, retry, signal timeout.

#### Paso 2: POST /api/casos/:id/confirmar (BR-06 IOMA)

Endpoint `api/casos/[id]/confirmar.ts`:
- Recibe `{ fecha, hora, sede, instrucciones?, asesorId? }`
- Obtiene caso + extracciones_ia (teléfono, practica, obra_social)
- **BR-06:** Si obra social contiene "ioma", incluye advertencia IOMA en el mensaje
- Construye mensaje WhatsApp en formato VistaPreviaMensaje (✅, 📍, 🏥, 🩺)
- Llama `enviarMensajeCallbell()`
- Marca caso como cerrado: `UPDATE SET estado=cerrado, closing_reason=turno_asignado`
- Crea registro en tabla `turnos` (sede, fecha, hora, mensaje)
- Auditoría vía `auditCerrado()` no bloqueante

#### Paso 3: POST /api/casos/:id/cerrar (12 closing reasons)

Endpoint `api/casos/[id]/cerrar.ts`:
- Recibe `{ closing_reason, nota_interna?, asesorId? }`
- `CLOSING_REASONS_VALIDAS` = 12 razones: `turno_asignado`, `turno_reprogramado`, `turno_cancelado`, `consulta_resuelta`, `consulta_resuelta_portal`, `esperando_respuesta`, `derivado_chiclana`, `practica_no_disponible`, `equivocado`, `error_datos_ris`, `presupuesto_pendiente`, `sin_resolucion`
- Valida closing_reason contra la lista
- Obtiene estadoAnterior antes de cerrar
- Si se incluye `nota_interna`, la inserta en `seguimientos` con estado="completado"
- `auditCerrado()` no bloqueante

#### Paso 4: POST /api/casos/:id/llamada (registrar llamada)

Endpoint `api/casos/[id]/llamada.ts`:
- Recibe `{ duracion_min, asesorId, phone? }`
- Valida `duracion_min >= 0`
- Si no se pasa phone explícito, lo obtiene del caso
- INSERT en tabla `llamadas` con canal="whatsapp_desktop", initiated_at=now
- Touch `updated_at` del caso (no bloqueante)
- Retorna `{ ok: true, llamadaId }`

#### Paso 5: POST /api/casos/:id/derivar (BR-03 Chiclana)

Endpoint `api/casos/[id]/derivar.ts`:
- **BR-03:** Valida que `tipo_practica` sea nuclear: `pet_ct`, `spect_ct`, `centellograma`, `perfusion_miocardica`, `camara_gamma`
- Si no es nuclear → 400 "La práctica 'X' no requiere derivación a Chiclana"
- Obtiene `CHICLANA_PHONE` de env var
- Construye notificación WhatsApp para Chiclana con datos del paciente, práctica, case ID
- Llama `enviarMensajeCallbell(CHICLANA_PHONE, mensaje)` sin conversationUuid
- Cierra caso como `derivado_chiclana`
- Crea turno con sede="chiclana"

#### Paso 6: UI — Botones en CaseModal

Se actualizó `CaseModal.tsx` y `DashboardPage.tsx` con:

| Botón | Acción | Confirmación |
|---|---|---|
| Confirmar turno | POST /confirmar | Diálogo con fecha/hora/sede/instrucciones |
| Cerrar caso | POST /cerrar | Selector grid 12 razones + nota interna |
| Registrar llamada | POST /llamada | Input numérico duración en minutos |
| Derivar a Chiclana | POST /derivar | Textarea notas (solo visible si práctica nuclear) |
| Tomar caso | asigna vía RPC | Inline, sin diálogo |

- `apiPost()` helper para llamadas fetch con manejo de errores
- Loading states individuales por botón
- Toasts en cada acción (éxito/error)
- Casos cerrados ocultan todos los botones
- `onRefresh()` llamado después de acciones exitosas

---

### Fase 5 — MetricsBoard (5 mejoras)

#### Paso 1: Supabase aggregation queries

Se refactorizó `useMetricas()` en `src/hooks/useCasos.ts` para llamar directamente al service layer en vez de derivar desde el array de casos:

| Método | Query |
|---|---|
| `getMetricasResumen()` | 5 queries paralelas con count exact |
| `getCasosPorTipo()` | Agrega por tipo_caso en Supabase |
| `getVolumenDiario()` | Agrega por fecha, últimos 30 días |
| `getMetricasPorAsesor()` | 2 queries paralelas (activos + cerrados) |

Además se corrigió `getMetricasResumen()` en `supabaseService.ts`:
- **Antes:** `tiempo_promedio_resolucion_min` siempre 0, `tasa_resolucion_automatica` calculada como `totalCerrados / totalCasos` (incorrecto)
- **Después:** Calcula promedio real desde `resolved_at - created_at`, tasa correcta como `automaticos / totalCerrados`

#### Paso 2: Rendimiento por asesor

Nuevo tipo `MetricaPorAsesor` en `types/index.ts` (7 campos):
- asesor_id, asesor_nombre, casos_activos, casos_resueltos
- tiempo_promedio_resolucion_min, tasa_resolucion, ultima_actividad

Método `getMetricasPorAsesor()` en `supabaseService.ts`:
- 2 queries paralelas (activos con join a usuarios + cerrados)
- Agrega por asesor en JS (ids pueden solaparse entre ambas queries)
- Ordena por casos_activos desc

UI en MetricsBoard: tabla con:
- Nombre del asesor
- Casos activos / resueltos / tiempo promedio
- Badge de tasa resolución: 🟢 ≥80%, 🟡 ≥50%, 🔴 <50%
- Última actividad formateada

Mock data: `MOCK_METRICAS_POR_ASESOR` con Brenda Gandolfi y Franco Berardi.

#### Paso 3: Exportar CSV

Función `downloadMetricsCSV()` que genera CSV multi-sección con:
1. Resumen KPIs
2. Casos por tipo
3. Volumen diario (últimos 30 días)
4. Rendimiento por asesor

Botón "Exportar CSV" en el header del dashboard, con icono de descarga y estado disabled mientras no hay datos.

#### Paso 4: Auto-refresh cada 60s

- `useMetricas()` ahora retorna `refresh` (expone `fetchMetrics` existente)
- `useEffect` con `setInterval(refresh, 60_000)` y `clearInterval` en cleanup
- Sin flicker de loading: el spinner solo aparece cuando `isLoading && !resumen`

#### Paso 5: Filtro por fecha

**Capa de servicio:** Los 4 métodos métricos aceptan `fecha_desde?: string, fecha_hasta?: string`:
- `getMetricasResumen()` — 5 queries inline con `.gte/.lte("created_at", ...)` condicional
- `getCasosPorTipo()` — query condicional
- `getVolumenDiario()` — query condicional
- `getMetricasPorAsesor()` — 2 queries condicionales
- Todas usan `fecha_hasta + "T23:59:59Z"` para incluir el día completo

**Hook:** `useMetricas(fecha_desde?, fecha_hasta?)` pasa filtros a los 4 servicios. `fetchMetrics` se recrea cuando cambian las fechas (`useCallback` depende de `[service, fecha_desde, fecha_hasta]`).

**UI:** Dos `<input type="date">` en el header con labels "Desde" / "Hasta". Default: últimos 30 días. Re-fetch automático al cambiar fechas.

**CasoService interface:** Los 4 métodos métricos actualizados con params opcionales en `mockService.ts` + mocks existentes aceptan pero ignoran los filtros.

---

### Archivos Creados (nuevos en esta sesión)

| Archivo | Fase | Propósito |
|---|---|---|
| `src/services/callbell/messagesApi.ts` | F4 | Servicio Callbell Messages API |
| `src/services/__tests__/messagesApi.test.ts` | F4 | 9 tests para messagesApi |
| `api/casos/[id]/enviar-mensaje.ts` | F4 | POST endpoint enviar mensaje |
| `api/casos/[id]/confirmar.ts` | F4 | POST endpoint confirmar turno |
| `api/casos/[id]/cerrar.ts` | F4 | POST endpoint cerrar caso |
| `api/casos/[id]/llamada.ts` | F4 | POST endpoint registrar llamada |
| `api/casos/[id]/derivar.ts` | F4 | POST endpoint derivar a Chiclana |

### Archivos Modificados

| Archivo | Cambio |
|---|---|
| `src/services/supabaseService.ts` | +enviarMensaje() real + getMetricasResumen corregida + Métodos aceptan fecha params |
| `src/services/mockService.ts` | Interface + mock actualizados con fecha params + getMetricasPorAsesor |
| `src/hooks/useCasos.ts` | useMetricas() con fecha params + refresh expuesto |
| `src/components/modal/CaseModal.tsx` | 5 botones de acción con loading/toasts/diálogos |
| `src/pages/DashboardPage.tsx` | Pasa userId + handleAsignarCaso + refresh a CaseModal |
| `src/components/metrics/MetricsBoard.tsx` | KPIs + asesores + CSV + auto-refresh + filtro fecha |
| `src/types/index.ts` | Nuevo tipo MetricaPorAsesor |
| `src/data/mockCases.ts` | MOCK_METRICAS_POR_ASESOR |

### Commits Realizados (Sesión 27)

| Hash | Mensaje |
|---|---|
| `4c1493b` | feat(fase4): step 1 — enviarMensajeCallbell + endpoint + tests |
| `66ac115` | feat(fase4): step 2 — POST /api/casos/:id/confirmar with BR-06 IOMA warning |
| `f2b0a37` | feat(fase4): step 3 — POST /api/casos/:id/cerrar with closing_reason validation + audit |
| `becda3d` | feat(fase4): step 4 — POST /api/casos/:id/llamada with duracion validation |
| `fe73680` | feat(fase4): step 5 — POST /api/casos/:id/derivar with BR-03 nuclear validation |
| `9c3b3d0` | feat(fase4): step 6 — UI action buttons in CaseModal + DashboardPage wiring |
| `7bf142d` | feat(fase5): step 1 — MetricsBoard connected to Supabase aggregation queries |
| `319c7c5` | feat(fase5): step 2 — rendimiento por asesor en MetricsBoard |
| `a0f0a3f` | feat(metrics): add CSV export button to MetricsBoard |
| `8e953c7` | feat(metrics): auto-refresh MetricsBoard every 60s via setInterval |
| `1290ef7` | feat(metrics): date range filter for MetricsBoard KPIs |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **enviarMensaje() en supabaseService.ts** | Hook directo desde CaseModal | Mantiene la abstracción CasoService: el frontend nunca llama a Callbell directamente |
| **getAuthHeaders() dentro del try/catch** | Fuera (throw inmediato) | Si falta el token, se captura como error normal en vez de romper la función |
| **1 retry automático** | 0 o 3+ retries | Balance entre resiliencia y latencia máxima de 20s |
| **getMetricasResumen con queries de agregación** | Derivación client-side desde casos[] | Más eficiente para datasets grandes. MetricsBoard se renderiza independiente de CaseGrid |
| **dateFilter inline (sin helper)** | Helper genérico con tipos | TypeScript no acepta el helper genérico con Supabase query builder. Inline es 100% type-safe |
| **CSV multi-sección** | Solo KPIs | Incluye todas las tablas del dashboard en un solo archivo descargable |
| **Auto-refresh 60s** | 30s o 120s | 60s es balance entre actualización en tiempo real y carga en el servidor |

### Errores Corregidos

| Problema | Fix |
|---|---|
| `getMetricasResumen()` tiempo_promedio = 0 | Ahora calcula desde resolved_at - created_at de casos cerrados |
| `tasa_resolucion_automatica` = cerrados/total | Ahora calcula automáticos / cerrados (tipos B/K) |
| `totalCasos` variable no usada | Eliminada |
| `TipoCaso` y `TIPOS_CASO` imports no usados | Eliminados de useCasos.ts |
| `ClosingReason` import no usado en CaseModal | Eliminado |
| `isConfirming` state no usado en CaseModal | Eliminado + reset en cleanup |
| `setIsConfirming(false)` colgando en reset section | Eliminado |
| `row.asesor as Record<string, unknown>` TS error | Fixed con `as unknown as` intermediate cast |

### Estado al Cierre

- ✅ **Fase 4 completa** — 5 endpoints POST + 1 servicio + tests (9/9)
- ✅ **Fase 5 completa** — MetricsBoard con KPIs, asesores, CSV, auto-refresh, filtro fecha
- ✅ TypeScript 0 errores en todos los commits
- ✅ Build de producción exitoso (`npm run build` en 855ms)
- ✅ 11 commits pusheados a main
- ✅ Documentación actualizada (PROJECT_STATE.md, TODO.md, SESSION_LOG.md)

### Pendientes para la Próxima Sesión

- [ ] 🔴 **Configurar env vars en Vercel Production** (6 variables)
- [ ] 🔴 **Hacer Redeploy** desde Vercel Dashboard
- [ ] 🟢 Verificar login + panel en https://l11panel.vercel.app
- [ ] 🟢 Probar webhook con IA real
- [ ] ⬜ Agregar Sentry para monitoreo
- [ ] ⬜ Tests de integración para endpoints POST

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

# SESSION LOG — Registro de Sesiones

> Cada sesión de trabajo se registra aquí con fecha, objetivo, decisiones tomadas y estado al cierre.
> Este archivo permite a cualquier IA retomar el proyecto exactamente donde se quedó.

---

## Formato de Entrada

```markdown
## Sesión [N] — [YYYY-MM-DD]

**Objetivo:** [Qué se buscaba lograr]
**Duración:** [Tiempo estimado]
**Herramientas:** [IA, comandos, servicios usados]

### Resumen
[2–3 párrafos de lo que ocurrió]

### Archivos Creados / Modificados
- `ruta/al/archivo` — [qué se hizo]

### Decisiones Tomadas
- [Decisión importante 1]
- [Decisión importante 2]

### Pendientes para la Próxima Sesión
- [ ] Tarea pendiente 1
- [ ] Tarea pendiente 2

### Estado al Cierre
- [Estado general: avanzando, bloqueado, completado]
- [Último comando ejecutado o punto de control]

---
```

---

## Sesión 1 — 2026-06-09

**Objetivo:** Analizar el PRD completo y generar la documentación estructural del proyecto.
**Duración:** 1 sesión
**Herramientas:** python-docx (extracción de PRD), Codebuff IA

### Resumen
Se extrajo el contenido completo del PRD desde el archivo `PRD_Lavalle11_v1.docx` usando python-docx. Con base en el análisis, se generó un informe arquitectónico completo (10 secciones) y posteriormente se creó la estructura documental del proyecto con 8 carpetas y todos los archivos maestros.

### Archivos Creados
- `PROJECT_STATE.md` — Estado actual del proyecto
- `ARCHITECTURE.md` — Arquitectura detallada del sistema
- `DECISIONS.md` — 6 ADRs registrados (luego 8)
- `TODO.md` — Plan de trabajo con 57 tareas (luego 72)
- `SESSION_LOG.md` — Este archivo
- `docs/` — Glosario, riesgos, workflow, índice
- `core/` — PRD, requirements, use-cases, business-rules
- `decisions/` — ADR template
- `planning/` — Roadmap, plan detallado de Fase 1
- `backend/` — API_SPEC.md (23 endpoints)
- `frontend/` — UI_SPEC.md (7 pantallas)
- `database/` — DATABASE_SCHEMA.md (7 entidades)
- `MASTER_CONTEXT.md` — Contexto rápido para IA
- `docs/core/WORKFLOW.md` — Flujo de trabajo

### Decisiones Tomadas
- Stack: React + Vite + Tailwind / Node.js Serverless / Supabase / Claude API
- Documentación en Markdown versionada con Git
- 5 archivos maestros en la raíz del proyecto
- ADRs en `/decisions` con template estandarizado
- TypeScript estricto obligatorio en todo el código
- Sin integración RIS en v1

### Pendientes para la Próxima Sesión
- [ ] Inicializar proyecto React + Vite + Tailwind
- [ ] Implementar Fase 1 completa (panel mock)

### Estado al Cierre
- Fase 0 completada (documentación)
- Proyecto listo para comenzar desarrollo

---

## Sesión 2 — 2026-06-09

**Objetivo:** Construir frontend mock completo de Fase 1 y realizar auditoría técnica QA.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, TypeScript, Vite, React 19, Tailwind v4

### Resumen
Se construyó el frontend mock completo del Panel de Gestión de Turnos con los siguientes componentes:
- **LoginPage:** formulario con validación, loading, error, toggle password, credenciales de prueba visibles
- **App.tsx:** routing condicional autenticado/no autenticado con AuthProvider
- **AuthContext:** autenticación mock con 2 roles (asesor/administrador)
- **AppLayout:** Header + Sidebar (con badges) + StatusBar + contenido
- **FilterBar:** búsqueda por texto + filtros por estado/prioridad/tipo
- **CaseGrid + CaseCard:** grid responsivo con skeleton loading y empty state
- **CaseModal:** modal de resolución completo con resumen IA, campos, selector sede, sugerencias de fecha, horarios, checkboxes de instrucciones, vista previa en vivo, seguimiento y acciones
- **MetricsBoard:** 6 KPIs, gráfico de barras por tipo, volumen diario apilado
- **Toast:** sistema singleton de notificaciones

Luego se realizó una auditoría técnica exhaustiva que identificó:
- 6 bugs/mejoras registrados
- CaseModal como punto crítico (302 líneas, 9 estados)
- Necesidad de crear Fase 1.5 para refactor antes de backend

### Archivos Creados (29 nuevos)
- `src/` — App, main, types, data/mockCases, context/AuthContext
- `src/components/ui/` — Badge, Button, Modal, Toast
- `src/components/layout/` — Header, Sidebar, StatusBar, AppLayout
- `src/components/cases/` — FilterBar, CaseCard, CaseGrid
- `src/components/modal/` — CaseModal (302 líneas)
- `src/components/metrics/` — MetricsBoard
- `src/pages/` — LoginPage, DashboardPage

### Decisiones Tomadas
- Se crea **Fase 1.5** como paso intermedio entre Fase 1 y Fase 2 para reducir deuda técnica
- Los bugs de la auditoría se priorizan en Fase 1.5 antes de conectar backend

### Estado al Cierre
- ✅ Fase 1 completada (12/12 tareas, 100%)
- 🟡 Fase 1.5 creada (10 tareas, 0% completado)
- ⬜ Fase 2 no iniciada
- Proyecto compila sin errores (TypeScript strict mode)
- Auditoría QA completada con 12 hallazgos documentados

---

## Sesión 3 — 2026-06-09

**Objetivo:** Implementar Fase 1.5 completa: refactor de CaseModal, capa de servicios, hooks, utils de fecha, corrección de bugs QA.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, TypeScript, React 19

### Resumen
Se implementó la Fase 1.5 completa (10/10 tareas), preparando el frontend para Fase 2:

1. **Refactor de CaseModal:** Se extrajeron 8 sub-componentes desde el CaseModal original de 302 líneas (Field, ResumenIA, SelectorSede, SelectorFecha, SelectorHora, ListaInstrucciones, VistaPreviaMensaje, FormSeguimiento). CaseModal quedó en ~120 líneas.

2. **Capa de servicios abstracta:** Se creó `services/mockService.ts` con la interfaz `CasoService` que define el contrato para todas las operaciones de datos. La implementación actual (`mockCasoService`) usa datos mock con delays simulados. Para Fase 2, solo se necesita crear un `SupabaseCasoService` que implemente la misma interfaz y hacer `setCasoService(nuevoService)`.

3. **Hooks:** `hooks/useCasos.ts` con 3 hooks: `useCasos()`, `useCasosPorAsesor()`, `useMetricas()` + `setCasoService()` para swap en runtime.

4. **Utils de fecha:** `utils/dates.ts` con 5 funciones (formatDateTime, getSuggestedDates, formatMessageDate, getFirstName, formatShortDate) eliminando la duplicación de lógica.

5. **6 bugs QA corregidos:**
   - `contact_name.split(" ")[0]` → `getFirstName()` con fallback
   - Sidebar tipos ahora invocan `onFilterByTipo` callback
   - `asesorEmail` eliminado de HeaderProps
   - Confirmación antes de cerrar caso (modal overlay)
   - CaseModal refactorizado (de 302 a 120 líneas)
   - `prevCasoId` bug corregido (useRef en lugar de useMemo)

6. **Bug adicional descubierto y corregido:** `prevCasoId` con `useMemo` nunca reseteaba el estado al cambiar de caso (no se ejecutaba porque la dependencia se actualizaba antes de la comparación). Reemplazado con `useRef`.

### Archivos Creados (12 nuevos)

- `src/utils/dates.ts` — 5 funciones de fecha
- `src/services/mockService.ts` — Interfaz CasoService + implementación mock
- `src/hooks/useCasos.ts` — 3 hooks + setCasoService
- `src/components/modal/Field.tsx` — Sub-componente campo label+valor
- `src/components/modal/ResumenIA.tsx` — Sub-componente resumen IA
- `src/components/modal/SelectorSede.tsx` — Sub-componente selector sede
- `src/components/modal/SelectorFecha.tsx` — Sub-componente selector fecha
- `src/components/modal/SelectorHora.tsx` — Sub-componente selector hora
- `src/components/modal/ListaInstrucciones.tsx` — Sub-componente checkboxes (exporta labels)
- `src/components/modal/VistaPreviaMensaje.tsx` — Sub-componente preview mensaje
- `src/components/modal/FormSeguimiento.tsx` — Sub-componente formulario seguimiento

### Archivos Modificados (6)

- `CaseModal.tsx` — Refactor: 302 → 120 líneas, useRef, confirmación de cierre
- `mockCases.ts` — TIPOS_CASO tipado a Record<TipoCaso, string>, import fusionado
- `Header.tsx` — asesorEmail eliminado de interfaz
- `AppLayout.tsx` — asesorEmail eliminado, onFilterByTipo agregado
- `Sidebar.tsx` — Items de tipo con onClick callback
- `DashboardPage.tsx` — onFilterByTipo conectado

### Decisiones Tomadas
- Se adopta **patrón de servicio inyectable** (`CasoService` interface + `setCasoService()`) para facilitar la migración a Supabase sin cambios en consumidores
- `INSTRUCCION_LABELS` exportado desde `ListaInstrucciones.tsx` para evitar duplicación (usado también por `VistaPreviaMensaje`)
- DashboardPage y MetricsBoard siguen importando datos mock directamente — los hooks están preparados pero se adoptarán formalmente al iniciar Fase 2

### Pendientes para la Próxima Sesión
- [ ] Inicializar repositorio Git + GitHub (`lavalle11-panel`)
- [ ] Configurar proyecto Supabase (migraciones + RLS)
- [ ] Iniciar Fase 2: endpoint webhook Callbell + Realtime

### Estado al Cierre
- ✅ **Fase 1.5 completada** (10/10 tareas, 100%)
- ✅ Fase 1 completada (12/12)
- Proyecto compila sin errores (TypeScript strict mode)
- 40 tareas completadas de 72 totales (56%)
- Listo para iniciar Fase 2 (backend + Supabase)

---

## Sesión 4 — 2026-06-10

**Objetivo:** Implementar Fase 2.1 — Supabase Auth (login real, logout, roles, protección de rutas). Mantener UI existente.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, TypeScript, React 19, Supabase JS SDK

### Resumen
Se implementó la Fase 2.1 completa (12/12 tareas), reemplazando la autenticación mock por Supabase Auth real:

1. **Instalación de dependencias:** Se instaló `@supabase/supabase-js@2.108.1` mediante npm.

2. **Cliente Supabase:** Se creó `src/lib/supabase.ts` que inicializa el cliente de Supabase desde las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Si faltan, lanza un error explícito en tiempo de importación (fail fast). Se creó `.env.local` con placeholders y `.gitignore` para excluir credenciales del repositorio.

3. **Refactor de AuthContext.tsx:** Se reescribió completamente el contexto de autenticación:
   - **Session persistence:** Al montar, `supabase.auth.getSession()` restaura la sesión si existe (no se pierde al recargar la página)
   - **Auth listener:** `supabase.auth.onAuthStateChange()` detecta cambios de autenticación en tiempo real (login desde otra pestaña, expiración de token)
   - **Login:** `supabase.auth.signInWithPassword({ email, password })` reemplaza el mock `new Promise + hardcoded credentials`
   - **Logout:** `supabase.auth.signOut()` + cleanup de estado local
   - **Roles:** El perfil del usuario se obtiene desde `public.usuarios` usando el ID del usuario autenticado. El rol se mapea a `Usuario.rol` para mantener compatibilidad con el frontend existente
   - **Errores:** Se mapean mensajes de error de Supabase a español (credenciales inválidas, email no confirmado, usuario no encontrado en DB)
   - **Edge case:** Si Supabase Auth devuelve un usuario autenticado pero `fetchUserProfile()` no encuentra el perfil en `public.usuarios` (ej: trigger no ejecutado aún), se muestra un mensaje de error específico y no se concede acceso

4. **Actualización de LoginPage.tsx:** Se mantuvo la UI exactamente igual (logo, card, formulario, loading spinner, toggle password). Se removió la sección de credenciales mock. Se agregó un hint de configuración indicando que los usuarios deben crearse en Supabase Auth y que la migración `002_usuarios.sql` sincronizará los perfiles automáticamente.

5. **Actualización de App.tsx:** Se agregó el componente `LoadingScreen` que se muestra durante la restauración de la sesión (antes `isLoading` era `false` por defecto, ahora es `true`). Esto evita el flash del login page al recargar la página cuando el usuario ya está autenticado.

### Archivos Creados (3 nuevos)

- `src/lib/supabase.ts` — Cliente Supabase con validación de env vars. Exporta `supabase` para toda la app
- `.env.local` — Placeholder para VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
- `.gitignore` — Excluye node_modules/, dist/, .env.local, .env.*.local, *.log, .DS_Store

### Archivos Modificados (3)

| Archivo | Cambio |
|---|---|
| `src/context/AuthContext.tsx` | Refactor completo: sesión persistente (getSession + onAuthStateChange), login real (signInWithPassword), logout real (signOut), roles desde public.usuarios, errores mapeados a español, edge case null profile |
| `src/pages/LoginPage.tsx` | UI idéntica, mock credentials removidas, hint de configuración Supabase, subtítulo actualizado |
| `src/App.tsx` | LoadingScreen agregado para evitar flash de login al restaurar sesión |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| `fetchUserProfile()` fuera del componente | `useCallback` dentro del componente | Evita violar reglas de hooks. La función no depende de props/state |
| Fail fast si faltan env vars | Nullable client + guard en AuthContext | Mejor fallar temprano con error claro que tener la app funcionando parcialmente |
| `.env.local` en `.gitignore` | — | Previene que credenciales se suban al repo accidentalmente |
| `isLoading` inicial = `true` | `false` como antes | Permite mostrar LoadingScreen mientras se restaura sesión, evitando flash de login |
| Login retorna `false` si profile es null | Login retorna `true` aunque no haya perfil | El usuario no debería acceder al panel sin perfil en DB |
| `_event` prefix en listener | — | Cumple con `noUnusedParameters` de TypeScript strict mode |
| `subscription.unsubscribe()` en cleanup | Sin cleanup | Previene memory leaks al desmontar el provider |

### Issues y Correcciones

| Issue | Solución |
|---|---|
| Login exitoso pero perfil null en DB | Error message: "Usuario no encontrado en la base de datos. Contactá al administrador." + retorna false |
| `.env.local` no ignorado por git | Se creó `.gitignore` con .env.local, .env.*.local |

### Pendientes para la Próxima Sesión

- [ ] Ejecutar migraciones SQL en Supabase (001→013) para tener las tablas listas
- [ ] Configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY reales en .env.local
- [ ] Crear usuarios en Supabase Auth (Franco, Brenda, Catalina, Macarena)
- [ ] **Fase 2.2:** Implementar SupabaseApiService (CasoService real) + conectar hooks

### Estado al Cierre

- ✅ **Fase 2.1 completada** (12/12 tareas, 100%)
- ✅ Fase 1 completada (12/12)
- ✅ Fase 1.5 completada (10/10)
- Proyecto compila sin errores (TypeScript strict mode)
- 52 tareas completadas de 84 totales (62%)
- Auth real funcionando. Próximo paso: conectar datos reales vía SupabaseApiService

---

## Sesión 5 — 2026-06-10

**Objetivo:** Diseñar arquitectura desacoplada de proveedores de IA. Provider-agnostic. Sin modificar frontend, DB, webhook, ni lógica de negocio.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, web research (SDKs de Anthropic, OpenAI, Google, DeepSeek)

### Resumen
Se diseñó y documentó la arquitectura completa para integrar múltiples proveedores de IA (Claude, GPT, Gemini, DeepSeek) de forma intercambiable:

1. **Investigación inicial:** Se investigaron los patrones de diseño de los SDKs de Anthropic, OpenAI, Google Generative AI y DeepSeek para identificar un denominador común que permitiera una interfaz unificada. Se identificó que DeepSeek es compatible con OpenAI, Gemini tiene su propio SDK pero soporta `response_mime_type: "application/json"`, y Claude usa `tool_use` para structured output.

2. **Diseño de interfaces canónicas:** Se definieron tres interfaces principales:
   - `EntradaCanonica` — Input unificado con historial de mensajes, adjuntos, contexto del instituto y metadatos
   - `RespuestaCanonica` — Output unificado con datos del paciente, orden médica, obra social, clasificación, flags, confianza
   - `AIProvider` — Interfaz del provider con métodos `analyze()`, `healthCheck()`, `getUltimasMetricas()`

3. **Provider Pattern + Factory:** Se diseñaron 4 adapters (Claude, GPT, Gemini, DeepSeek) + MockProvider para desarrollo. El Factory usa Registry pattern donde cada provider se registra con su `ProveedorId`. La selección se hace por `PRIMARY_PROVIDER` env var.

4. **Flujo de análisis en 4 fases:** Preparación (obtener contexto, construir prompt), Invocación (factory → adapter → API), Post-procesamiento (validar schema, calcular confianza, aplicar reglas de negocio), Resolución (automática para Tipo B/K, Realtime para otros).

5. **Manejo de errores y fallback:** 10 códigos de error categorizados con estrategia de reintentos (backoff exponencial), 4 modalidades de fallback (sin fallback, otro proveedor, mismo proveedor otro modelo, mock), y degradación controlada con flag `error_ia`.

6. **Estrategia de cambio de proveedor:** Cambio planificado (24-48hs con ambos proveedores configurados), cambio por emergencia (automático al detectar caída), cambio por costo (auto-tuning con `MAX_COST_PER_CALL_USD`), y rollback.

### Archivos Creados (1 nuevo)

- `docs/core/AI_PROVIDER_ARCHITECTURE.md` — Documento completo con 12 secciones, 7 diagramas Mermaid, interfaces, patterns, y apéndices

### Archivos Modificados (3)

| Archivo | Cambio |
|---|---|
| `PROJECT_STATE.md` | Agregado AI Architecture a documentación, stack, historial. Sección 10 con resultados. Riesgo R08 (vendor lock-in) agregado. Próximos pasos actualizados |
| `TODO.md` | Nueva sección "Diseño AI_PROVIDER_ARCHITECTURE.md" con 14 tareas todas ✅. Fase 3 extendida (10 tareas). Nueva sección "Mejoras Futuras". Total: 100 tareas, 67 completadas = 67% |
| `SESSION_LOG.md` | Esta entrada (Sesión 5) agregada |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Adapter Pattern** sobre cada SDK nativo | Abstracción tipo OpenRouter / Vercel AI SDK | Control total sobre formato, métricas y errores. Sin dependencia de terceros para la abstracción |
| **Registry Pattern** en el Factory | Hardcodeo de providers | Nuevos providers se agregan registrándose, sin modificar el Factory |
| **EntradaCanonica / RespuestaCanonica** como interfaces separadas | Un solo tipo genérico | Separar input de output permite evolucionar cada uno independientemente |
| **System Prompt compartido** con inyección de variables en runtime | Prompt hardcodeado en cada adapter | El contenido del prompt cambia con reglas de negocio, no con el proveedor |
| **3 observaciones mandatory para v1** (O-01, O-02, O-03) | Aplazar todo a v1.1 | Sin procesamiento de imágenes, estimación de tokens y structured output nativo, el sistema no sería confiable en producción |
| **Documento APROBADO** con auditoría incluida | Aprobar sin auditoría | La auditoría queda como parte del documento, visible para futuras implementaciones |
| **No implementar código en esta sesión** | Implementar ClaudeAdapter | El diseño debe estar aprobado antes de escribir código. Fase 3 será la implementación |

### Auditoría de Diseño — 6 Observaciones

| # | Observación | Prioridad | Acción |
|---|---|---|---|
| O-01 | Falta procesamiento detallado de imágenes/adjuntos pre-adapter | 🟥 **v1 mandatory** | Agregar sub-sección en AnalisisService para descarga, conversión a base64, compresión y optimización antes de pasar al adapter |
| O-02 | No hay estimación de tokens pre-llamada | 🟥 **v1 mandatory** | Agregar función `estimarTokens()` que calcule tokens de texto + imágenes y trunque historial si excede el límite |
| O-03 | No se menciona structured output nativo por proveedor | 🟥 **v1 mandatory** | Cada adapter debe usar la API de structured output de su proveedor (tool_use, response_format, response_mime_type) |
| O-04 | Falta circuit breaker / rate limiter compartido | 🟧 **v1.1 recommended** | Token bucket o sliding window en el Factory + CircuitBreaker por proveedor |
| O-05 | Caché de respuestas idénticas | 🟩 **Backlog futuro** | Por hash del último mensaje entrante, TTL 1 hora, deshabilitado por defecto |
| O-06 | AdjuntoAnalisis.base64 opcional — costo alto en Vercel Serverless | 🟩 **Backlog futuro** | Evaluar soporte de URLs remotas por proveedor |

### Pendientes para la Próxima Sesión

- [ ] **Fase 3 — Implementar ClaudeAdapter** según AI_PROVIDER_ARCHITECTURE.md
- [ ] Incorporar las 3 observaciones v1 mandatory (O-01, O-02, O-03) en la implementación
- [ ] Crear `src/ai-providers/` con interfaces, factory, y ClaudeAdapter
- [ ] Implementar `MockProvider` con fixtures para desarrollo

### Estado al Cierre

- ✅ **AI_PROVIDER_ARCHITECTURE.md diseñado y aprobado** (14/14 tareas, 100%)
- ✅ Fase 2.1 completada (12/12)
- ✅ Fase 1.5 completada (10/10)
- ✅ Fase 1 completada (12/12)
- Fase 0 documentación al 91% (19/21)
- **67 tareas completadas de 100 totales (67%)**
- Diseño de IA aprobado con auditoría. Próximo paso: implementar ClaudeAdapter en Fase 3

---

## Sesión 6 — 2026-06-10

**Objetivo:** Aplicar los 5 hallazgos de la auditoría Senior PostgreSQL (CR-01, R-01, R-02, R-03, R-04) a las migraciones SQL. Corregir, verificar y documentar. Actualizar PROJECT_STATE.md, TODO.md y SESSION_LOG.md con todas las decisiones.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, revisión manual de SQL, code-reviewer-deepseek-flash (2 revisiones)

### Resumen
Se aplicaron las 5 correcciones resultantes de la auditoría Senior PostgreSQL, con un ciclo de revisión y corrección adicional para asegurar consistencia entre los 3 archivos documentales:

1. **CR-01 (🔴 Crítico):** Se corrigió la comparación defectuosa en `registrar_evento_caso()` dentro de `010_auditoria_eventos.sql`. La línea `to_jsonb(OLD) ->> key IS DISTINCT FROM val::text` convertía valores JSONB a texto con comillas escapadas, haciendo que todos los campos aparecieran como modificados en cada UPDATE. Se reemplazó por `(to_jsonb(OLD) ->> key) IS DISTINCT FROM (to_jsonb(NEW) ->> key)` que compara ambos lados en texto plano.

2. **R-01 (🟡 Riesgo):** Se agregó el trigger `on_auth_user_updated` para UPDATE en `auth.users` en `002_usuarios.sql`. El trigger existente solo capturaba INSERT, por lo que cambios de email/rol no se reflejaban en `public.usuarios`. Se expandió el `ON CONFLICT DO UPDATE` para sincronizar nombre, email y rol (inicialmente solo email).

3. **R-02 (🟡 Riesgo):** Se agregó CHECK constraint `chk_extracciones_confianza` en `006_extracciones_ia.sql` que limita `confianza_global` al rango 0.00–1.00.

4. **R-03 (🟡 Riesgo):** Se actualizó la Sección 16 de `DATABASE_SCHEMA.md` con nombres de archivo reales.

5. **R-04 (🟡 Riesgo):** Se renombró la constraint UNIQUE de `uq_casos_callbell_uuid` a `uq_casos_callbell_conversation_uuid`.

**Ciclo de revisión adicional:** 
- La 1ra revisión del code-reviewer detectó que el `ON CONFLICT` no se había expandido (solo actualizaba email, faltaban nombre y rol). Se corrigió inmediatamente.
- La 2da revisión detectó una inconsistencia en el conteo de tareas entre los 3 archivos documentales: SESSION_LOG.md y PROJECT_STATE.md reportaban 70/100 (70%), mientras que TODO.md aún mostraba 67/100 (67%). Se resolvió agregando las 5 correcciones como tareas formales en TODO.md (sección "Correcciones de Auditoría PostgreSQL" con 5 ítems AC-01 a AC-05), actualizando la tabla de progreso a 105 totales y 72 completadas (69%), y sincronizando PROJECT_STATE.md y SESSION_LOG.md con el mismo conteo.
- **Decisión clave:** Se optó por agregar las correcciones como tareas formales en TODO.md (Opción A) en lugar de revertir los conteos (Opción B), para mantener un registro auditable de todo el trabajo realizado.

### Archivos Modificados (8)

| Archivo | Cambio |
|---|---|
| `database/migrations/002_usuarios.sql` | R-01: Trigger `on_auth_user_updated` + ON CONFLICT expandido (nombre, email, rol) |
| `database/migrations/003_casos.sql` | R-04: Constraint renombrada a `uq_casos_callbell_conversation_uuid` |
| `database/migrations/006_extracciones_ia.sql` | R-02: CHECK `chk_extracciones_confianza: confianza_global >= 0.00 AND <= 1.00` |
| `database/migrations/010_auditoria_eventos.sql` | CR-01: `val::text` → `(to_jsonb(NEW) ->> key)` |
| `database/DATABASE_SCHEMA.md` | R-03: Sección 16 con nombres de archivo reales |
| `PROJECT_STATE.md` | Header, historial, resumen ejecutivo, riesgos (R09, R10), próximos pasos re-numerados, sesiones: 6 |
| `TODO.md` | Nueva sección "Correcciones de Auditoría PostgreSQL" (5 tareas ✅). Progreso: 105 totales, 72 completadas (69%) |
| `SESSION_LOG.md` | Esta entrada (Sesión 6) — documentación completa del ciclo |

### Diffs Generados

#### 📄 `002_usuarios.sql` — R-01: Trigger UPDATE + ON CONFLICT expandido

```diff
--- antes
+++ después

+-- Trigger para UPDATE (cambio de email, nombre o rol en Auth)
+CREATE TRIGGER on_auth_user_updated
+    AFTER UPDATE ON auth.users
+    FOR EACH ROW
+    EXECUTE FUNCTION public.sync_usuario_from_auth();

     ON CONFLICT (id) DO UPDATE SET
+        nombre = EXCLUDED.nombre,
         email = EXCLUDED.email,
+        rol = EXCLUDED.rol,
         updated_at = NOW();
```

#### 📄 `003_casos.sql` — R-04: Constraint renombrada

```diff
-    CONSTRAINT uq_casos_callbell_uuid UNIQUE (callbell_conversation_uuid)
+    CONSTRAINT uq_casos_callbell_conversation_uuid UNIQUE (callbell_conversation_uuid)
```

#### 📄 `006_extracciones_ia.sql` — R-02: CHECK constraint

```diff
     confianza_global NUMERIC(3,2) NOT NULL,
+    CONSTRAINT chk_extracciones_confianza CHECK (
+        confianza_global >= 0.00 AND confianza_global <= 1.00
+    ),
```

#### 📄 `010_auditoria_eventos.sql` — CR-01: Comparación corregida (línea ~52)

```diff
-    WHERE (to_jsonb(OLD) ->> key) IS DISTINCT FROM val::text
+    WHERE (to_jsonb(OLD) ->> key) IS DISTINCT FROM (to_jsonb(NEW) ->> key)
```

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| `(to_jsonb(NEW) ->> key)` con paréntesis extra | Sin paréntesis | Mejora legibilidad. El operador `->>` ya tiene precedencia sobre `IS DISTINCT FROM`, pero los paréntesis aclaran la intención |
| Actualizar nombre, email y rol en el ON CONFLICT | Solo email como antes | Si el admin modifica nombre o rol desde Supabase, el trigger UPDATE ahora sincroniza todos los campos |
| `>= 0.00 AND <= 1.00` en CHECK | `BETWEEN 0.00 AND 1.00` | La auditoría original usó expresión larga; se mantiene consistencia con el hallazgo R-02 |
| No inicializar Git en esta sesión | Inicializar repo | Scope limitado. Inicializar Git puede hacerse en la próxima sesión |
| **Agregar correcciones como tareas en TODO.md** (Opción A) | Revertir conteos a 67% (Opción B) | Mantener registro auditable. Las 5 correcciones son trabajo real que debe quedar documentado. Sección "Correcciones de Auditoría PostgreSQL" con 5 ítems AC-01 a AC-05 |
| Conteo final: **105 tareas totales, 72 completadas (69%)** | — | 21 (F0) + 5 (Auditoría) + 12 (F1) + 10 (F1.5) + 12 (F2.1) + 14 (AI) + 8 (F2) + 10 (F3) + 7 (F4) + 6 (F5) = 105. Completadas: 19 + 5 + 12 + 10 + 12 + 14 + 0 + 0 + 0 + 0 = 72 |
| 2 revisiones de code-reviewer | 1 sola revisión | La 1ra detectó ON CONFLICT faltante. La 2da detectó inconsistencia de conteo. Ambas corregidas antes del cierre |

### Pendientes para la Próxima Sesión

- [ ] Inicializar repositorio Git + GitHub (`lavalle11-panel`)
- [ ] Ejecutar migraciones SQL corregidas en Supabase (001→013)
- [ ] Configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY reales en .env.local
- [ ] Crear usuarios en Supabase Auth (Franco, Brenda, Catalina, Macarena)
- [ ] **Fase 2.2:** Implementar SupabaseApiService (CasoService real) + conectar hooks

### Estado al Cierre

- ✅ **5 correcciones de auditoría aplicadas** (CR-01, R-01, R-02, R-03, R-04)
- ✅ ON CONFLICT expandido corregido tras revisión
- ✅ Conteo de tareas consistente entre los 3 archivos (105 totales, 72 completadas, 69%)
- ✅ Fase 2.1 completada (12/12)
- ✅ AI_PROVIDER_ARCHITECTURE.md aprobado (14/14)
- ✅ Fase 1.5 completada (10/10)
- ✅ Fase 1 completada (12/12)
- Fase 0 documentación al 91% (19/21)
- **72 tareas completadas de 105 totales (69%)**
- Ningún error crítico remanente. Riesgos R01-R10 documentados (R02, R09, R10 resueltos)

---

## Sesión 7 — 2026-06-10 — Consolidación y Priorización

**Objetivo:** Consolidar documentación con todas las decisiones de diseño y auditoría. Actualizar MASTER_CONTEXT.md, PROJECT_STATE.md, TODO.md y SESSION_LOG.md.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA

### Resumen

Se consolidó la documentación del proyecto reflejando el estado completo posterior a las dos auditorías. Se actualizaron los 4 archivos maestros con 10 puntos clave:

1. **AI_PROVIDER_ARCHITECTURE.md creado** — 12 secciones, 7 diagramas Mermaid, Provider Pattern, 4 adapters, Factory con Registry
2. **Auditoría de arquitectura IA completada** — 6 observaciones clasificadas
3. **Observaciones:** 🟥 3 v1 mandatory (imágenes, tokens, structured output) | 🟧 1 v1.1 recommended (circuit breaker) | 🟩 2 backlog futuro (caché, Vercel)
4. **Auditoría de migraciones SQL completada** — 13 archivos (001_enums → 013_rls)
5. **5 hallazgos corregidos:** CR-01 (trigger auditoría), R-01 (trigger UPDATE), R-02 (CHECK confianza), R-03 (docs), R-04 (constraint)
6. **5/5 aplicados.** 0 errores críticos remanentes.
7. **NO implementar Claude Adapter todavía** — Se difiere a Fase 3. La arquitectura está lista pero requiere Supabase operativo.
8. **Orden de prioridad:** Supabase → Migraciones → Auth → Realtime → Callbell → IA
9. **Próximo hito:** Crear proyecto Supabase + migraciones 001–013
10. **Estado consolidado:** Fase 1 ✅ | Fase 1.5 ✅ | DB Schema ✅ | Migraciones ✅ (auditadas) | Auth ✅ | AI Architecture ✅ (auditada) | **Fase 2 ⏳ preparada** — 72/105 tareas (69%)

### Archivos Modificados (4)

- `MASTER_CONTEXT.md` — Rewrite completo con estado actual, auditorías y prioridades
- `PROJECT_STATE.md` — Priorización, NO Claude Adapter, orden redefinido
- `TODO.md` — Nota de priorización al inicio de Fase 2
- `SESSION_LOG.md` — Esta entrada (Sesión 7)

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **NO Claude Adapter todavía** | Implementar ya | Sin Supabase operativo no hay entorno de prueba. Priorizar infraestructura base |
| **Prioridad: Supabase > Migraciones > Auth > Realtime > Callbell > IA** | Orden PRD original | DB operativa desbloquea todo. Auth ya hecho. IA requiere datos reales |
| **Próximo hito: migraciones 001–013** | Fase 2.2 directo | Sin tablas, SupabaseApiService no tiene dónde operar. Es el prerequisito |
| **3 obs. v1 mandatory en Fase 3** | Implementar ahora | Son calidad de implementación IA, no de infraestructura |

### Pendientes

- [ ] **🎯 Crear proyecto Supabase + migraciones 001–013**
- [ ] Configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY reales
- [ ] Inicializar Git + GitHub (`lavalle11-panel`)
- [ ] Fase 2.2: SupabaseApiService + conectar hooks

### Estado al Cierre

- ✅ 4 archivos maestros actualizados y consistentes
- ✅ AI Architecture aprobado | Migraciones corregidas | Prioridades definidas
- **72/105 tareas (69%)**

---

## Sesión 8 — 2026-06-10 — 🚀 Infraestructura Base Desplegada

**Objetivo:** Ejecutar las 13 migraciones SQL en Supabase, verificar tablas, RLS y consultas. Marcar Infraestructura Base como completada.
**Duración:** 1 sesión
**Herramientas:** Supabase SQL Editor

### Resumen

Se creó el proyecto en Supabase y se ejecutaron las 13 migraciones SQL en orden secuencial (001_enums → 013_rls). Se verificó que las 10 tablas del esquema están visibles en el SQL Editor de Supabase, que las políticas RLS están activas, y que las consultas SELECT básicas sobre cada tabla devuelven resultados correctos.

**Verificaciones realizadas:**

1. ✅ **13 migraciones ejecutadas exitosamente** — Sin errores de sintaxis ni dependencias
2. ✅ **10 tablas visibles** — usuarios, casos, mensajes, adjuntos, extracciones_ia, seguimientos, turnos, llamadas, auditoria_eventos, configuracion
3. ✅ **RLS desplegado** — 10 políticas de seguridad row-level security activas
4. ✅ **Consultas SELECT validadas** — SELECT * FROM cada tabla devuelve estructura correcta
5. ✅ **Infraestructura operativa** — Base de datos lista para recibir datos reales

### Hito Completado

🚀 **Infraestructura Base = ✅ COMPLETADA**

| Verificación | Resultado |
|---|---|
| Migraciones ejecutadas | ✅ 13/13 (001_enums → 013_rls) |
| Tablas visibles | ✅ 10/10 |
| RLS activo | ✅ 10 políticas |
| SELECTs válidos | ✅ Probado en cada tabla |
| Infraestructura | ✅ Operativa |

### Decisión Estratégica

| Decisión | Alternativa | Razón |
|---|---|---|
| **Próxima fase: FASE 2.1 — Supabase Auth** | Ir directo a Fase 2.2 (SupabaseApiService) | Auth debe funcionar contra la DB real antes que cualquier servicio. Configurar .env.local con credenciales reales, crear usuarios en Auth, verificar login + sync a public.usuarios |

### Pendientes para la Próxima Sesión

- [ ] **🎯 FASE 2.1 — Supabase Auth:** Configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY reales en .env.local
- [ ] Crear usuarios en Supabase Auth (Franco, Brenda, Catalina, Macarena)
- [ ] Verificar login end-to-end + disparo del trigger sync a public.usuarios
- [ ] Inicializar repositorio Git + GitHub (`lavalle11-panel`)
- [ ] **Fase 2.2:** SupabaseApiService + conectar hooks

### Estado al Cierre

- 🚀 **✅ Infraestructura Base completada** — 13 migraciones, 10 tablas, RLS activo
- ✅ AI Architecture aprobado | Migraciones corregidas | Documentación consolidada
- **77/109 tareas (71%)**

---

## Sesión 9 — 2026-06-11 — Auditoría Técnica y Planificación FASE 2.2

**Objetivo:** Auditar el estado actual del código, verificar qué partes siguen usando mockCases.ts, identificar puntos de integración para SupabaseApiService, proponer plan técnico detallado para FASE 2.2, y actualizar documentación.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, code-reviewer-deepseek-flash, file-picker, code-searcher

### Resumen

Se realizó una auditoría técnica completa del frontend para planificar la FASE 2.2 (reemplazo de mocks por consultas reales a Supabase):

1. **Contexto sincronizado:** Se leyeron los 4 archivos maestros (MASTER_CONTEXT.md, PROJECT_STATE.md, TODO.md, SESSION_LOG.md) y se integraron los hitos completados post-Sesión 8: Git/GitHub conectado, variables de entorno configuradas, Auth real validado end-to-end.

2. **Auditoría de mockCases.ts:** Se identificaron 6 archivos con dependencias directas del archivo mockCases.ts:
   - 🔴 **2 críticos:** `DashboardPage.tsx` (usa MOCK_CASOS para filtrado y stats) y `MetricsBoard.tsx` (usa MOCK_METRICAS, MOCK_CASOS_POR_TIPO, MOCK_VOLUMEN_DIARIO directamente)
   - 🟢 **3 de display:** `Sidebar.tsx`, `FilterBar.tsx` y `CaseModal.tsx` solo importan la constante `TIPOS_CASO` (sin datos), fácilmente extraíble a `src/constants.ts`
   - 🟡 **1 de servicio:** `mockService.ts` que será reemplazada por la implementación real

3. **Arquitectura de servicios evaluada:**
   - `CasoService` interface: ✅ **Lista** con 10 métodos
   - `setCasoService()`: ✅ **Listo** para swap en runtime
   - `useCasos()`, `useCasosPorAsesor()`, `useMetricas()`: ✅ **Listos** pero **no se usan** — DashboardPage y MetricsBoard aún importan datos mock directamente
   - `src/services/supabase/casoService.ts`: ✅ **Existe** pero es server-side (usa cliente admin, bypass RLS). No sirve para frontend.

4. **Brechas identificadas:** 5 brechas documentadas con impacto y solución propuesta

5. **Plan FASE 2.2 elaborado:** 7 tareas (SS-01 a SS-07) con esfuerzo estimado, archivos afectados y estrategia de migración
   - SS-01: Extraer TIPOS_CASO a `src/constants.ts` 🔵 Bajo
   - SS-02: Crear SupabaseCasoService implementando CasoService 🔴 Alto
   - SS-03: Wirear setCasoService() en bootstrap 🟢 Mínimo
   - SS-04: Migrar DashboardPage a useCasos() 🔴 Alto
   - SS-05: Migrar MetricsBoard a useMetricas() 🟡 Medio
   - SS-06: Asegurar filtrado RLS por auth.uid() 🟡 Medio
   - SS-07: Compilación + verificación visual 🟢 Mínimo

### Hitos Reconocidos

| Hito | Estado |
|---|---|
| Git/GitHub conectado (`git@github.com:TianSB/lavalle11-panel.git`) | ✅ COMPLETADO (post-Sesión 8) |
| Variables de entorno configuradas (.env.local + Vercel) | ✅ COMPLETADO |
| Auth real validado (login end-to-end, dashboard OK) | ✅ COMPLETADO |
| **FASE 2.2 planificada** — 7 tareas con análisis de brechas | 🎯 **PLANIFICADO** |

### Archivos Modificados (4)

| Archivo | Cambio |
|---|---|
| `PROJECT_STATE.md` | Nueva sección 12 con auditoría completa (6 hallazgos, 5 brechas, 7 tareas, riesgos). Stack actualizado. Próximos pasos re-numerados. Conteo: 115/78 (68%) |
| `TODO.md` | Nueva sección "Fase 2.2 — SupabaseApiService" con 7 tareas SS-01 a SS-07. Fase 2 re-estructurada (eliminado 2.2 de lista anterior, re-numerado). Tabla de progreso actualizada: 115 totales, 78 completadas (68%) |
| `SESSION_LOG.md` | Esta entrada (Sesión 9) — auditoría, plan, decisiones |
| `MASTER_CONTEXT.md` | Estado actualizado, Auth marcado como validado, FASE 2.2 como próximo hito, conteo actualizado |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Extraer TIPOS_CASO a constants.ts** (SS-01) | Dejarlo en mockCases.ts y que los componentes sigan importando de ahí | 3 componentes UI (Sidebar, FilterBar, CaseModal) importan solo la constante — no necesitan mock data. Romper esa dependencia es requisito para eliminar mocks |
| **SupabaseCasoService usa cliente anon** | Usar cliente service-role (bypass RLS) | RLS está diseñado para filtrar por asesor_id. El cliente anon respeta la seguridad por fila. Service-role es para server-side (webhook) |
| **setCasoService() en bootstrap** | Por lazy import en cada componente | Un solo punto de inicialización, swap controlado. Los hooks ya están diseñados para esto |
| **mockCases.ts y mockService.ts se mantienen como respaldo** | Eliminar inmediatamente | Permitir rollback rápido durante la migración. Se marcan como @deprecated después de verificación |
| **Admin ve todos los casos en SupabaseCasoService** | Admin usa el mismo filtro RLS | Las políticas RLS 013_rls.sql permiten a administradores ver todos los casos. El servicio debe detectar el rol y ajustar la query |
| **No implementar Realtime, Callbell ni IA en FASE 2.2** | Incluir Realtime ahora | Scope limitado al reemplazo de mocks. Realtime requiere setup adicional y es Fase 2.3 |

### Riesgos Identificados

| Riesgo | Mitigación |
|---|---|
| Las consultas RLS con cliente anon pueden devolver datos incompletos si las políticas no cubren todos los escenarios | Verificar políticas en 013_rls.sql antes de implementar SS-02 |
| El admin necesita ver todos los casos pero RLS filtra por asesor_id | La política RLS ya incluye excepción para administradores (bypass RLS) — verificar en la migración 013 |
| useCasosPorAsesor() recibe un parámetro `asesorId` que podría ser inseguro | Reemplazar por `auth.uid()` directamente en la consulta — el hook debe ser seguro por diseño |
| DashboardPage tiene lógica de filtrado acoplada a MOCK_CASOS | El refactor (SS-04) debe mantener la misma UI y comportamiento. El estado local de filtros se conserva |

### Pendientes para la Próxima Sesión

- [ ] **🎯 FASE 2.2 — SS-01:** Extraer TIPOS_CASO a `src/constants.ts`
- [ ] **SS-02:** Crear SupabaseCasoService implementando CasoService
- [ ] **SS-03:** Wirear setCasoService() en App.tsx
- [ ] **SS-04:** Migrar DashboardPage a useCasos() hook
- [ ] **SS-05:** Migrar MetricsBoard a useMetricas() hook
- [ ] **SS-06:** Asegurar filtrado RLS por auth.uid()
- [ ] **SS-07:** Compilación TypeScript + verificación visual

### Estado al Cierre

- 🚀 **✅ Auditoría técnica completada** — 6 archivos con dependencias de mock identificados, 5 brechas, 7 tareas planificadas
- ✅ FASE 2.1 — Auth real validado (DB, login, dashboard, GitHub)
- ✅ Git/GitHub conectado | Env vars configuradas
- **78/115 tareas (68%)** — FASE 2.2 lista para implementar

---

## Sesión 10 — 2026-06-11 — Implementación FASE 2.2: SS-01, SS-02, SS-03

**Objetivo:** Implementar las primeras 3 tareas de FASE 2.2: extraer TIPOS_CASO a constants.ts, crear SupabaseCasoService, y wirear setCasoService() en App.tsx. Sin tocar DashboardPage ni MetricsBoard.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, code-reviewer-deepseek-flash

### Resumen

Se implementaron las 3 primeras tareas del plan FASE 2.2 (sesión 9), reemplazando progresivamente los datos mock por consultas reales a Supabase sin cambiar UI ni romper compatibilidad:

1. **SS-01: Extraer TIPOS_CASO a `src/constants.ts`** — Se creó el archivo compartido con el `Record<TipoCaso, string>` de labels. Se actualizaron los imports en 3 componentes: `Sidebar.tsx`, `FilterBar.tsx` y `CaseModal.tsx`. El archivo `mockCases.ts` mantiene su propia copia de `TIPOS_CASO` como respaldo.

2. **SS-02: Crear SupabaseCasoService** — Se creó `src/services/supabaseService.ts` con la implementación completa de los 10 métodos de `CasoService` usando el cliente anon de Supabase:
   - `getCasos()`, `getCasosByAsesor()`, `getCasosConSeguimiento()` con joins a `extracciones_ia`, `turnos`, `llamadas` y `usuarios` (para asesor_nombre)
   - `getMetricasResumen()` con 5 consultas COUNT en paralelo
   - `getCasosPorTipo()` con agregación en JS y labels desde `TIPOS_CASO`
   - `getVolumenDiario()` con agregación diaria en JS
   - `getUsuarios()`, `asignarCaso()`, `cerrarCaso()`, `enviarMensaje()`
   - Manejo de casos sin `extraccion_ia` con fallback "Pendiente de análisis"

3. **SS-03: Wirear setCasoService()** — Se agregó `setCasoService(supabaseCasoService)` al inicio del módulo `App.tsx`, ejecutándose antes de que cualquier monte la app y los hooks consuman el servicio activo.

4. **TypeScript compilation:** 0 errores.

5. **Code review:** Se reemplazó un `await import("../constants")` dinámico por un import al tope del archivo, según recomendación del revisor.

### Archivos Creados (2 nuevos)

| Archivo | Propósito |
|---|---|
| `src/constants.ts` | TIPOS_CASO compartido (labels para tipos A-K) |
| `src/services/supabaseService.ts` | SupabaseCasoService — implementación real de CasoService con anon client |

### Archivos Modificados (4)

| Archivo | Cambio |
|---|---|
| `src/components/layout/Sidebar.tsx` | Import de TIPOS_CASO desde `../../constants` en lugar de `../../data/mockCases` |
| `src/components/cases/FilterBar.tsx` | Import de TIPOS_CASO desde `../../constants` |
| `src/components/modal/CaseModal.tsx` | Import de TIPOS_CASO desde `../../constants` |
| `src/App.tsx` | `setCasoService(supabaseCasoService)` al inicio del módulo |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **setCasoService() al nivel del módulo** en App.tsx | Dentro de un useEffect o en main.tsx | Se ejecuta antes de cualquier render. Los hooks (que se montan en efectos) ya encuentran el servicio real. No hay race conditions |
| **SupabaseCasoService usa cliente anon** (`src/lib/supabase.ts`) | Usar cliente service-role (bypass RLS) | RLS está diseñado para filtrar por asesor_id y rol. El cliente anon respeta la seguridad por fila. Service-role es para server-side (webhook) |
| **Import al tope de TIPOS_CASO** en supabaseService.ts | Import dinámico dentro del método | Sugerencia del code review. Más legible, misma funcionalidad |
| **mockCases.ts y mockService.ts se mantienen** | Eliminar inmediatamente | Respaldo para rollback rápido. Se marcarán como @deprecated después de SS-07 |
| **getMetricasResumen con 5 consultas COUNT en paralelo** | Una sola consulta con agregación SQL | Promise.all ejecuta en paralelo. Más simple que RPCs. Aceptable para el volumen actual |
| **getVolumenDiario con agregación en JS** | COUNT con GROUP BY via RPC | Simple y suficiente. Se puede optimizar a RPC si hay problemas de performance |
| **getCasosPorTipo con import de TIPOS_CASO** | Mapeo hardcodeado | Reusa la fuente de verdad única de labels. Cualquier cambio futuro en tipos se refleja automáticamente |
| **enviarMensaje no implementado** (console.log) | Implementar con Callbell API | Depende de Fase 4. Por ahora es un placeholder consistente con el mockService que también era no-op |

### Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Las consultas COUNT en getMetricasResumen cuentan TODOS los casos visibles por RLS (admin ve todos, asesor solo los suyos) | ✅ Comportamiento correcto por diseño. El admin ve métricas globales, el asesor solo las propias |
| getCasosConSeguimiento() usa dos queries (seguimientos → casos) | ✅ Los seguimientos pendientes son pocos. El impacto en performance es mínimo |
| DashboardPage y MetricsBoard aún usan datos mock directamente | ✅ No se tocaron. Siguiente paso: SS-04 y SS-05 |

### Pendientes para la Próxima Sesión

- [ ] **SS-04:** Migrar DashboardPage a useCasos() hook
- [ ] **SS-05:** Migrar MetricsBoard a useMetricas() hook
- [ ] **SS-06:** Asegurar filtrado RLS por auth.uid()
- [ ] **SS-07:** Compilación + verificación visual completa

### Estado al Cierre

- ✅ **SS-01 completado** — TIPOS_CASO en constants.ts, 3 componentes actualizados
- ✅ **SS-02 completado** — SupabaseCasoService con 10 métodos implementados
- ✅ **SS-03 completado** — setCasoService() wireado en App.tsx
- ✅ FASE 2.1 — Auth real validado
- ✅ TypeScript 0 errores | Code review: 1 mejora aplicada
- **81/115 tareas (70%)** — FASE 2.2: 3/7 completadas

---

## Sesión 11 — 2026-06-11 — FASE 2.2 Completa: SS-04 a SS-07 + Auditoría + Deploy Readiness

**Objetivo:** Completar FASE 2.2 en su totalidad: migrar DashboardPage y MetricsBoard a hooks reales, auditar seguridad RLS, validar readiness de deploy, y crear configuración para Vercel.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, code-reviewer-deepseek-flash, basher (build), code-searcher (mock audit)

### Resumen

Se completaron las 4 tareas restantes de FASE 2.2, finalizando la migración completa de mocks a datos reales:

1. **SS-04: Migrar DashboardPage a useCasos()** — Se reemplazó `MOCK_CASOS` por `useCasos()` hook. El filtrado en `useMemo` ahora opera sobre `allCasos` del hook. Stats derivados desde datos reales. Se agregó loading state con spinner. TypeScript 0 errores.

2. **SS-05: Migrar MetricsBoard a useMetricas()** — Se refactorizó el hook `useMetricas()` para que derive métricas desde `useCasos()` usando 3 bloques `useMemo` (resumen, porTipo, volumenDiario), eliminando 3 calls extra a Supabase. Se actualizó MetricsBoard para importar desde el hook con null safety y loading state. TypeScript 0 errores.

3. **SS-06: Auditoría de seguridad RLS** — Se auditaron las 13 políticas RLS, el sistema de roles (`auth_rol()`, trigger sync), y se verificaron 4 escenarios de fuga cross-user. Resultado: 🟢 **OK**. Sin fugas críticas. 3 recomendaciones menores (2 para v1 backlog, 1 para Fase 4). SQL fixes opcionales para `casos_insert_policy` y `extracciones_insert_policy`.

4. **SS-07: Deployment Readiness Review** — Se validó: build de TypeScript 0 errores ✅, build de Vite exitoso (482KB JS, 135KB gzip) ✅, 0 dependencias de mock en componentes ✅, loading states en toda la UI ✅. Se creó `vercel.json` con configuración estándar para Vite SPA. Se aplicó fix de error handling en DashboardPage (banner rojo con separación de estados loading/error/empty).

### Archivos Creados (1 nuevo)

| Archivo | Propósito |
|---|---|
| `vercel.json` | Configuración de Vercel para Vite SPA (buildCommand, outputDirectory, rewrites SPA) |

### Archivos Modificados (5)

| Archivo | Cambio |
|---|---|
| `src/pages/DashboardPage.tsx` | SS-04: `MOCK_CASOS` → `useCasos()` + loading state + error banner con separación de estados |
| `src/hooks/useCasos.ts` | SS-05: `useMetricas()` refactor — deriva desde `useCasos()` con 3 `useMemo` blocks, 0 network calls extra |
| `src/components/metrics/MetricsBoard.tsx` | SS-05: `MOCK_*` → `useMetricas()` + null safety + loading state + `.slice(-7)` en volumen diario |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **useMetricas() deriva de useCasos()** en vez de llamar al servicio | 3 calls separadas a Supabase | 0 network calls extra, datos siempre sincronizados, misma lógica de agregación. Las métricas se computan del lado cliente sobre datos ya cargados |
| **Error banner no intrusivo** (banner rojo arriba del contenido) | Modal de error / pantalla completa | El asesor puede seguir viendo datos stale mientras se corrige el error. No pierde contexto de trabajo |
| **Spinner condicional: `isLoading && !error && empty`** | Spinner cuando isLoading solo | Evita que el spinner compita con el banner de error. Si hay error, el usuario ve el banner, no el spinner |
| **`!error || hasData ? CaseGrid : null`** en la lógica de render | Siempre mostrar CaseGrid | Cuando hay error y no hay datos, no se debe mostrar el empty state de CaseGrid (confunde al usuario: "no hay casos" vs "error al cargar") |
| **vercel.json con rewrites SPA** (`/(.*)` → `/index.html`) | Sin rewrites | Aunque el proyecto no usa React Router hoy, el catch-all prepara el deploy para cualquier ruta futura. Es estándar en SPAs |
| **Bundle 135KB gzip** aceptable | Optimizar con lazy loading | Para un panel interno con pocos usuarios, 135KB es aceptable. Optimización postergable |
| **mockService.ts se mantiene como respaldo** | Eliminar | El warning de build (mockCases.ts importado estática y dinámicamente) es inocuo. Se marcará como @deprecated en una limpieza futura |

### Auditoría RLS — Resumen

| Verificación | Resultado |
|---|---|
| 10 tablas con RLS habilitado | ✅ 10/10 |
| `casos_select_policy`: asesor ve sus casos + sin asignar; admin ve todo | ✅ Correcta |
| `casos_insert_policy`: permite INSERT sin restringir asesor_id | ⚠️ Riesgo bajo (los casos se crean vía webhook) |
| Tablas relacionadas heredan visibilidad del caso padre | ✅ Correcto (7 tablas) |
| Función `auth_rol()` + `SECURITY DEFINER` | ✅ Sin riesgo de spoofing |
| Frontend solo renderiza lo que RLS ya filtró | ✅ Sin filtrado de seguridad en cliente |
| Cross-user leakage (4 escenarios) | ❌ No detectable |
| **Nivel general** | 🟢 **OK** |

### SS-07 Deployment Readiness — Checklist

| Ítem | Resultado |
|---|---|
| `npx tsc -b --noEmit` | ✅ 0 errores |
| `npx vite build` | ✅ Exitoso (935ms) |
| Bundle JS (gzip) | 135.19 kB ✅ |
| Bundle CSS (gzip) | 7.11 kB ✅ |
| Sin imports de MOCK_* en componentes | ✅ Verificado |
| `setCasoService()` wireado antes de fetch | ✅ Confirmado |
| `.env.local` en `.gitignore` | ✅ Excluido |
| Loading states en todos los componentes | ✅ DashboardPage + MetricsBoard |
| Manejo de errores: banner separado | ✅ DashboardPage |
| `vercel.json` presente | ✅ Creado |

### Pendientes para la Próxima Sesión

- [ ] **Fase 2.3:** Endpoint webhook Callbell + Realtime
- [ ] **Fase 3:** Implementar ClaudeAdapter (con O-01, O-02, O-03 mandatory)
- [ ] Configurar variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel Dashboard
- [ ] Marcar `mockService.ts` y `mockCases.ts` como `@deprecated` en limpieza técnica

### Estado al Cierre

- ✅ **FASE 2.2 COMPLETA (7/7 tareas, 100%)** — SS-01 a SS-07 implementados y validados
- ✅ SS-04: DashboardPage con useCasos() | SS-05: MetricsBoard con useMetricas()
- ✅ SS-06: RLS auditado (🟢 OK) | SS-07: Deploy readiness (✅ build, ✅ vercel.json, ✅ error fix)
- ✅ TypeScript 0 errores | Build exitoso | 85/115 tareas (74%)
- 🚀 **Sistema completamente migrado de mocks a datos reales — listo para deploy en Vercel**

---

## Sesión 12 — 2026-06-11 — Auth Hardening + Trigger Fix + Verification

**Objetivo:** Hardenear flujo de autenticación eliminando race conditions de hidratación de sesión, y corregir bug de trigger que revertía el rol en cada login.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, code-reviewer-deepseek-flash, basher, Supabase Auth Admin API + Management API

### Resumen

Se identificaron y corrigieron **2 problemas críticos** en el sistema de autenticación:

**Problema 1 — Trigger `sync_usuario_from_auth()` revertía el rol en cada login:**

El trigger `on_auth_user_updated` se dispara cada vez que `auth.users` se actualiza (ej: `last_sign_in_at` cambia al hacer login). La función `sync_usuario_from_auth()` hacía `ON CONFLICT (id) DO UPDATE SET rol = EXCLUDED.rol`, donde `EXCLUDED.rol` venía de `COALESCE((NEW.raw_user_meta_data ->> 'rol')::rol_usuario, 'asesor'::rol_usuario)`. Como el usuario no tenía `rol` en `user_metadata`, el COALESCE caía al default `'asesor'`, pisando cualquier cambio manual en `public.usuarios`.

Esto explica por qué el rol de `lavalle11diagnostico@gmail.com` se había revertido de `administrador` a `asesor` entre sesiones.

**Solución:**
1. Se modificó `sync_usuario_from_auth()` eliminando `rol = EXCLUDED.rol` del `ON CONFLICT DO UPDATE SET`. El trigger ahora solo sincroniza `nombre`, `email`, `activo` y `updated_at`. El rol solo se setea al INSERTAR (nuevo usuario), nunca se sobrescribe al actualizar.
2. Se actualizó `raw_user_meta_data` en `auth.users` para incluir `{"rol": "administrador", "nombre": "Admin"}`, asegurando que si el trigger se ejecuta por INSERT, el rol correcto se propague.
3. SQL ejecutado vía Management API: `POST /v1/projects/{ref}/database/query` con PAT del usuario.

**Problema 2 — `onAuthStateChange` usaba `session.user` sin verificar server-side (race condition de hidratación):**

El handler de `onAuthStateChange` llamaba `fetchUserProfile(session.user.id)` directamente, donde `session` es pasado por el evento de Supabase. Si el cliente Supabase aún no había terminado de hidratar la sesión, `session.user` podía contener datos incompletos o stale, y una query protegida por RLS podía fallar (devolviendo `null` o datos incorrectos).

Además, tanto `login()` como el handler de `onAuthStateChange` (`SIGNED_IN`) llamaban `fetchUserProfile()` en paralelo, causando una race condition donde el último en completar pisaba al otro.

**Solución (AuthContext.tsx):**
- Se extrajo `handleAuthEvent()` como función compartida que SIEMPRE llama `supabase.auth.getUser()` (HTTP request server-verified) antes de `fetchUserProfile()`. Nunca confía en `session.user`.
- Se agregó `hydratingRef` (useRef) para ignorar eventos `SIGNED_IN`/`INITIAL_SESSION` que se disparen antes de que `initSession()` complete. `INITIAL_SESSION` se salta siempre (lo maneja `initSession`).
- `login()` ya no llama `fetchUserProfile()` — delega completamente al handler de `onAuthStateChange`, eliminando la race condition.
- `initSession()` ahora usa `verifiedUser.id` (de `getUser()`) en lugar de `session.user.id` para `fetchUserProfile()`.
- Se expuso `refreshProfile()` vía contexto para refresco manual sin re-login.
- Se agregaron logs: `console.log("AUTH EVENT:", event)` y `console.log("AUTH USER (hydrated):", user.id)`.
- Bug corregido durante code review: `setUser(null)` faltante en `handleAuthEvent` cuando `fetchUserProfile()` retorna null.

### Archivos Modificados (2)

| Archivo | Cambio |
|---|---|
| `src/context/AuthContext.tsx` | Refactor completo: `handleAuthEvent()`, `hydratingRef`, `getUser()` antes de `fetchUserProfile()`, `login()` delega a `onAuthStateChange`, `initSession()` usa `verifiedUser.id`, `refreshProfile()`, logs AUTH EVENT + AUTH USER |
| `estructura proyect absolute true/database/migrations/002_usuarios.sql` | Trigger `sync_usuario_from_auth()`: eliminado `rol = EXCLUDED.rol` del `ON CONFLICT DO UPDATE SET`. El trigger ya no sobrescribe el rol. SQL ejecutado en Supabase vía Management API |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Modificar trigger para no pisar rol** (Opción A) | Solo actualizar user_metadata (Opción B) — parche | Solución definitiva. El trigger solo sincroniza nombre/email/activo. El rol se gestiona exclusivamente desde `public.usuarios` |
| **`handleAuthEvent()` siempre llama `getUser()`** | Usar `session.user` del evento | `getUser()` hace HTTP request a Supabase verificando el token. `session.user` puede ser stale si el cliente no terminó de hidratar |
| **`hydratingRef` para ignorar eventos durante init** | Debounce / throttle en handler | Previene procesar `INITIAL_SESSION` o `SIGNED_IN` duplicados mientras `initSession()` corre. Un flag booleano es suficiente |
| **`login()` delega a `onAuthStateChange`** | `login()` como source of truth + ignorar handler | Elimina race condition. Un solo path (`onAuthStateChange`) para setear el usuario post-login |
| **`initSession()` usa `verifiedUser.id`** (de `getUser()`) | `session.user.id` del `getSession()` | El ID verificado server-side es más confiable que el ID de localStorage. Coherente con el principio de no confiar en `session.user` |
| **Management API con PAT del usuario** | Instalar Supabase CLI / pedir DB password | El PAT permite ejecutar SQL DDL directo via `POST /database/query`. Más práctico que instalar herramientas adicionales |
| **`setUser(null)` en `fetchUserProfile` fallido** | Solo `setError()` sin limpiar user | Si el perfil se eliminó de la DB, el frontend debe reflejarlo inmediatamente. No dejar estado stale |

### Flujo de Autenticación Corregido

```
INIT (page load)
  └─ initSession()
       ├─ getSession() → lectura localStorage (rápida)
       ├─ getUser() → verificación server-side (HTTP)
       ├─ hydratingRef = false
       └─ fetchUserProfile(verifiedUser.id) → setUser()

LOGIN
  └─ login()
       └─ signInWithPassword()
            └─ SIGNED_IN event
                 ├─ hydratingRef check → false (pasa)
                 ├─ getUser() → HTTP verify
                 ├─ fetchUserProfile(user.id) → setUser()
                 └─ setIsLoading(false)

TRIGGER on_auth_user_updated
  ├─ ANTES: ON CONFLICT DO UPDATE SET rol = EXCLUDED.rol → revertía
  └─ DESPUÉS: ON CONFLICT DO UPDATE SET nombre, email, activo → NO toca rol
```

### Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| Si se agrega un nuevo usuario, el trigger INSERT setea `rol` desde `user_metadata`, que podría no estar definido | ✅ El COALESCE cae al default `'asesor'` — comportamiento correcto para usuarios nuevos. El admin puede subir el rol manualmente después |
| `handleAuthEvent()` llama `getUser()` que puede fallar por timeout de red | ✅ Si `getUser()` falla con error, la excepción no capturada corta el callback. Pero `getUser()` de Supabase JS SDK no lanza — devuelve `{ error }` en la respuesta. El código maneja `!user` silenciosamente |
| El PAT del usuario expira o se revoca | ✅ Solo se usó para esta sesión. Si se necesita ejecutar SQL en el futuro, el usuario deberá generar un nuevo PAT |

### Pendientes para la Próxima Sesión

- [ ] **Fase 2.3:** Endpoint webhook Callbell + Realtime
- [ ] **Fase 3:** Implementar ClaudeAdapter (con O-01, O-02, O-03 mandatory)
- [ ] Configurar variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel Dashboard
- [ ] Marcar `mockService.ts` y `mockCases.ts` como `@deprecated` en limpieza técnica

### Estado al Cierre

- ✅ **Auth Hardening completado** — Race condition de hidratación eliminada. Rol nunca más se revierte
- ✅ **Trigger fix aplicado** — `sync_usuario_from_auth()` ya no incluye `rol = EXCLUDED.rol`
- ✅ **Usuario `lavalle11diagnostico@gmail.com`**: rol = `administrador` confirmado en DB. `user_metadata` actualizado
- ✅ TypeScript 0 errores | Code review: 1 bug corregido (setUser null) | Build OK
- ✅ `AUTH EVENT: SIGNED_IN` → `AUTH USER (hydrated): 87462f58...` → `AUTH ROLE FROM DB: administrador`
- **89/119 tareas (75%)** — 4 nuevas tareas de Auth Hardening agregadas (AH-01 a AH-04)

---

## Sesión 13 — 2026-06-11 — Role Source of Truth Cleanup

**Objetivo:** Eliminar toda dependencia de `auth.users.user_metadata` para roles. `public.usuarios.rol` como única fuente de verdad. Sin duplicación de estado.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, Supabase Auth Admin API + Management API, code-reviewer-deepseek-flash

### Resumen

Se realizó la limpieza final de la fuente de verdad del rol, eliminando la duplicación que existía entre `auth.users.raw_user_meta_data` y `public.usuarios.rol`:

**Problema:**
En la Sesión 12 se había agregado temporalmente `rol: "administrador"` en `user_metadata` para que el trigger `sync_usuario_from_auth()` sincronizara el rol correcto (workaround mientras el trigger aún tenía `rol = EXCLUDED.rol`). Una vez corregido el trigger, esa metadata quedó como duplicación peligrosa: si en el futuro se desincronizaban, el trigger podía volver a pisar el rol.

**Cambios realizados:**

1. **🧹 DB Cleanup:** Se eliminó `rol` de `auth.users.raw_user_meta_data` vía SQL directo: `UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data - 'rol'`. La metadata ahora solo contiene `{"nombre": "Admin"}`.

2. **📝 Migration file sync:** Se actualizó `002_usuarios.sql` para reflejar el trigger ya corregido en Supabase: `ON CONFLICT DO UPDATE SET` ahora solo incluye `nombre`, `email`, `activo` y `updated_at` (sin `rol`). Con comentario explícito documentando la decisión.

3. **⚠️ Role source validation:** Se agregó `console.warn("ROLE SOURCE CONFLICT — usando public.usuarios como fuente única. Metadata ignorada.")` en `handleAuthEvent()` de AuthContext.tsx. Si hay mismatch entre `user.user_metadata.rol` y `public.usuarios.rol`, se loggea un warning y la DB siempre gana.

**Arquitectura final:**
```
ANTES (2 fuentes posibles):
auth.users.raw_user_meta_data.rol  → trigger lo usaba como fallback
public.usuarios.rol                 → trigger lo sobrescribía desde metadata

DESPUÉS (1 sola fuente):
public.usuarios.rol                  → ÚNICA fuente de verdad para roles
auth.users.raw_user_meta_data        → Solo contiene nombre (identidad)
```

### Archivos Modificados (3)

| Archivo | Cambio |
|---|---|
| `src/context/AuthContext.tsx` | `handleAuthEvent()`: agregado `console.warn` en mismatch metadata vs DB. `public.usuarios.rol` siempre gana |
| `estructura proyect absolute true/database/migrations/002_usuarios.sql` | `ON CONFLICT DO UPDATE SET`: eliminado `rol = EXCLUDED.rol`, agregado `activo = TRUE` + comentario documental |
| `auth.users` (DB directa) | Eliminado `rol` de `raw_user_meta_data` via SQL `- 'rol'` |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Eliminar `rol` de metadata completamente** | Dejarlo "por si acaso" | Single source of truth. Si no se necesita, no debe estar. Si alguien cambia `user_metadata.rol` en el futuro, no afecta al sistema |
| **Sync migration file con función live** | Dejar el archivo desactualizado | El archivo de migración es la fuente documental. Debe reflejar el estado real en Supabase para futuros deploys |
| **Solo warning, no error** en mismatch | Lanzar error/bloquear login | Warning es suficiente — el sistema ignora metadata. Error sería demasiado disruptivo para un caso que no debería ocurrir |
| **No modificar el trigger en Supabase** (ya estaba corregido S12) | Re-ejecutar DDL | El trigger en Supabase ya estaba correcto desde S12. Solo se actualizó el archivo de migración para reflejarlo |

### Flujo de Autenticación Final

```
LOGIN / INIT / TOKEN_REFRESH
  └─ supabase.auth.getUser()
       └─ handleAuthEvent()
            ├─ fetchUserProfile(user.id) → public.usuarios
            │    └─ console.log("AUTH ROLE FROM DB:", profile.rol)
            ├─ if (user_metadata.rol !== profile.rol):
            │    └─ console.warn("ROLE SOURCE CONFLICT — usando DB. Metadata ignorada.")
            └─ setUser(profile) ← source of truth
```

### Pendientes para la Próxima Sesión

- [ ] **Fase 2.3:** Endpoint webhook Callbell + Realtime
- [ ] **Fase 3:** Implementar ClaudeAdapter (con O-01, O-02, O-03 mandatory)
- [ ] Configurar variables de entorno en Vercel Dashboard

### Estado al Cierre

- ✅ **Role source of truth cleanup completado** — `public.usuarios.rol` es la ÚNICA fuente de verdad
- ✅ `rol` eliminado de `auth.users.user_metadata`
- ✅ Migration `002_usuarios.sql` sincronizada con la función live en Supabase
- ✅ Warning `console.warn("ROLE SOURCE CONFLICT")` en AuthContext cuando hay mismatch
- ✅ TypeScript 0 errores | Code review: ✅ sin regresiones
- **92/122 tareas (75%)** — 3 nuevas tareas de role cleanup agregadas (RC-01 a RC-03) 
- 🎯 **Sistema de autenticación estabilizado — listo para Fase 2.3**

---

## Sesión 14 — 2026-06-11 — RBAC Decoupling: Roles Eliminados de la UI

**Objetivo:** Refactorizar la capa RBAC para desacoplarla de roles: la UI solo consulta permisos, el sistema interno resuelve roles automáticamente desde AuthContext.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, code-reviewer-deepseek-flash, basher (typecheck)

### Resumen

Se refactorizó completamente la capa RBAC para eliminar el acoplamiento a roles en la UI. El cambio arquitectónico fue:

```
ANTES (acoplado a roles):
  can(user.rol, "casos.read")     ← UI conocía roles
  useCan() → { can(role, perm) }  ← role como parámetro

DESPUÉS (solo permisos):
  can("casos.read")               ← UI solo consulta permisos
  useCan() → { can(perm) }        ← role resuelto internamente
  setRbacRole(role) en AuthContext ← sincronización automática
```

**6 archivos modificados:**

1. **🧠 `src/rbac/can.ts`** — Refactor core: se agregó módulo `currentRole` (almacén a nivel de módulo), `setRbacRole(role)` para sincronizar desde AuthContext, `can(permission: string)` que resuelve rol internamente, `canWithRole(role, permission)` como pure function para testing, y `hasResourceAccess(resource)` que también lee del store interno.

2. **🔗 `src/context/AuthContext.tsx`** — Se agregaron llamadas a `setRbacRole()` en todos los puntos de cambio de autenticación:
   - `fetchUserProfile()`: `setRbacRole(profile.rol)` al obtener perfil
   - `handleAuthEvent()` cuando !user: `setRbacRole(null)`
   - `SIGNED_OUT` handler: `setRbacRole(null)`
   - `logout()`: `setRbacRole(null)`

3. **🪝 `src/hooks/useCan.ts`** — Simplificado: `check` usa `can(permission)` directo (sin pasar role), dependencias `[]` (rol es módulo-level, no React state).

4. **🎨 `src/components/layout/Header.tsx`** — `can("usuarios.manage")` sin parámetro role. `asesorRol` eliminado de `HeaderProps`. `rolLabel` se resuelve internamente.

5. **🎨 `src/components/layout/AppLayout.tsx`** — `can("metrics.read")` para `esAdmin`. `asesorRol` eliminado de `AppLayoutProps`. Dejó de pasar `asesorRol` a Header.

6. **🎨 `src/pages/DashboardPage.tsx`** — Dejó de pasar `asesorRol={user.rol}` a AppLayout.

**Bug corregido durante code review:** `setRbacRole(null)` faltaba en `SIGNED_OUT` y `logout()`. Se agregaron ambas llamadas para evitar stale role post-logout.

### Archivos Modificados (6)

| Archivo | Cambio |
|---|---|
| `src/rbac/can.ts` | Module-level `currentRole`, `setRbacRole()`, `can(permission)` sin role param, `canWithRole(role, perm)` pure fn |
| `src/context/AuthContext.tsx` | `setRbacRole()` llamado en `fetchUserProfile`, `handleAuthEvent` (!user), `SIGNED_OUT`, `logout()` |
| `src/hooks/useCan.ts` | `can(permission)` usa el módulo store, no recibe role externo |
| `src/components/layout/Header.tsx` | `can("usuarios.manage")` sin role; `asesorRol` eliminado de props |
| `src/components/layout/AppLayout.tsx` | `can("metrics.read")` sin role; `asesorRol` eliminado de props |
| `src/pages/DashboardPage.tsx` | Dejó de pasar `asesorRol={user.rol}` a AppLayout |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Module-level store para `currentRole`** | React context / useSyncExternalStore | Las funciones de módulo no pueden usar hooks. El store module-level es simple, no requiere providers adicionales, y `setRbacRole()` se llama desde AuthContext que ya es el provider de auth |
| **`can(permission)` sin role param** | `can(role, permission)` existente | La UI no debe conocer roles para decidir permisos. Es la responsabilidad del RBAC resolver el rol internamente |
| **`setRbacRole(null)` en SIGNED_OUT y logout** | Confiar solo en el próximo SIGNED_IN para resetear | Si un componente llama `can()` post-logout (antes de redirigir), devolvería stale true si el role del usuario anterior persiste |
| **`canWithRole` exportado como pure function** | Solo `can()` interno | Necesario para testing y casos raros donde se requiere un role específico sin depender del store global |
| **`useCan` retorna `role` como dato informativo** | No exponer role | Útil para display del role en UI (ej: header "Administrador"), pero no para lógica de permisos |
| **`asesorRol` eliminado de props de Header y AppLayout** | Mantener prop no utilizada | El rol ya no se necesita en la interfaz de componentes. Eliminarlo reduce acoplamiento y simplifica el contrato |

### Flujo de RBAC Post-Refactor

```
AUTH (AuthContext)
  └─ setRbacRole(profile.rol) → módulo can.ts
       └─ currentRole = "administrador" | "asesor" | null

UI (cualquier componente)
  └─ can("casos.read")        ← solo permisos
  └─ useCan().can("metrics.read") ← hook opcional
       └─ can.ts: currentRole → ROLE_PERMISSIONS[currentRole] → includes(permission) → true/false

LOGOUT
  └─ setRbacRole(null) → can() siempre false hasta próximo login
```

### Pendientes para la Próxima Sesión

- [ ] **Fase 2.3:** Endpoint webhook Callbell + Realtime
- [ ] **Fase 3:** Implementar ClaudeAdapter (con O-01, O-02, O-03 mandatory)
- [ ] Buscar más usos de rol directo en Sidebar, CaseModal, MetricsBoard y migrar a `can()` o `useCan()`

### Estado al Cierre

- ✅ **RBAC Decoupling completado** — 6 archivos refactorizados. UI solo consulta permisos
- ✅ `can("casos.read")` reemplaza `can(user.rol, "casos.read")` en toda la UI
- ✅ `setRbacRole()` sincronizado en todos los paths de auth
- ✅ `asesorRol` eliminado de HeaderProps, AppLayoutProps, DashboardPage
- ✅ TypeScript 0 errores | Code review: 1 bug corregido (stale role en logout)
- **98/128 tareas (77%)** — 6 nuevas tareas RBAC-01 a RBAC-06
---

## Sesión 15 — 2026-06-11 — Singleton Eliminado: CasoServiceContext + UX State Machine de Asignación

**Objetivo:** Refactorizar la arquitectura del sistema para eliminar el singleton global `getActiveService()` reemplazándolo por React Context (CasoServiceProvider + useCasoService), e implementar state machine de 5 estados para la UX de asignación de casos con overlay visual.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, code-reviewer-deepseek-flash, basher (typecheck)

### Resumen

Se realizó un refactor arquitectónico en 3 capas:

**A) Arquitectura — Singleton → React Context:**

1. **`src/context/CasoServiceContext.tsx`** (CREADO): Provider + `useCasoService()` hook. Acepta `service` opcional (default: supabaseCasoService). Multi-tenant ready: cada tenant/provider con su servicio. Sin estado mutable global.

2. **`src/hooks/useCasos.ts`**: Eliminados `activeService` (mutable module-level), `setCasoService()`, `getActiveService()`. `useCasos()` y `useCasosPorAsesor()` ahora llaman a `useCasoService()` internamente con `[service]` en dependencias.

3. **`src/hooks/useAsignarCaso.ts`**: Eliminado `getActiveService()`. Usa `useCasoService()` con dependencia estable.

4. **`src/App.tsx`**: Eliminado `setCasoService(supabaseCasoService)` como side-effect al nivel del módulo. Ahora `<CasoServiceProvider>` envuelve `AppContent`.

**B) UX — State machine de asignación en CaseCard:**

Se implementó un modelo de 5 estados para cada card:

```
idle → claiming (overlay azul + "Reservando caso..." + backdrop-blur)
  → claimed_by_me (overlay verde + checkmark "Caso asignado")
  → claimed_by_other (overlay ámbar + "Otro asesor tomó este caso")
  → failed (overlay rojo + mensaje de error)
  → auto-reset a idle después de 2.5s
```

- `AssignOverlay` componente separado con overlay absoluto (`inset-0 z-20`).
- `useRef` con cleanup para evitar memory leaks.
- Botón se deshabilita durante `claiming`.

**C) Tipos:**

- `onAsignar` ahora retorna `Promise<AssignCaseResult>` en toda la cadena (CaseCard → CaseGrid → DashboardPage).
- DashboardPage re-throws errores reales para que la card los detecte como `failed`.
- CaseCard importa `AssignCaseResult` directamente.

### Archivos Creados (1 nuevo)

| Archivo | Propósito |
|---|---|
| `src/context/CasoServiceContext.tsx` | Provider + useCasoService hook. Multi-tenant ready |

### Archivos Modificados (5)

| Archivo | Cambio |
|---|---|
| `src/hooks/useCasos.ts` | Eliminados `activeService`, `getActiveService()`, `setCasoService()`. Usa `useCasoService()` con dependencia `[service]` |
| `src/hooks/useAsignarCaso.ts` | Eliminado `getActiveService()`. Usa `useCasoService()` |
| `src/App.tsx` | `setCasoService(supabaseCasoService)` → `<CasoServiceProvider>` envolviendo AppContent |
| `src/components/cases/CaseCard.tsx` | State machine 5 estados + AssignOverlay + auto-reset timeout + onAsignar retorna AssignCaseResult |
| `src/pages/DashboardPage.tsx` | handleAsignarCaso retorna AssignCaseResult, re-throws errores para la card |
| `src/components/cases/CaseGrid.tsx` | onAsignar tipo cambiado a Promise<AssignCaseResult> |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **React Context para CasoService** en lugar de singleton global | Module-level mutable `activeService` | Testeable, multi-tenant, React maneja ciclo de vida. Cada tenant/provider con su servicio |
| **`useCasoService()` en `useCasos` y `useAsignarCaso`** en lugar de import directo | Seguir usando singleton `getActiveService()` | Los hooks ahora dependen del contexto, no de un mutable global. Service reference es estable |
| **Discriminated union `AssignStatus`** con 5 estados | Boolean `isLoading` | La UI necesita saber exactamente qué pasó (claimed_by_me vs claimed_by_other vs failed) para mostrar overlay correcto |
| **Overlay `absolute inset-0 z-20`** en lugar de reemplazar contenido del card | Reemplazar contenido | El overlay bloquea interacción visualmente pero mantiene el contenido subyacente intacto |
| **Auto-reset con `useEffect` + `setTimeout`** a los 2.5s | Sin auto-reset / botón para cerrar overlay | El overlay es feedback temporal. El refresh posterior del padre (en success) o la reaparición del botón ya indican el estado actual |
| **`onAsignar` retorna `AssignCaseResult`** en lugar de `Promise<void>` | La card llama al servicio directamente | La card necesita el resultado para actualizar su state machine. El padre (DashboardPage) igualmente recibe el resultado para toasts + refresh |
| **Error re-thrown en DashboardPage** para que la card lo detecte como `failed` | Catch silencioso + solo toast | Sin re-throw, la card asumiría success (el promise resuelve sin error aunque el resultado sea ya-tomado). El catch en Card captura el throw |
| **`useRef<ReturnType<typeof setTimeout> | undefined>`** con cleanup | Ignorar cleanup / setTimeout simple | Previene memory leaks y setState en componente desmontado. Cleanup en return del effect |

### Pendientes para la Próxima Sesión

- [ ] **Fase 2.3:** Endpoint webhook Callbell + Realtime
- [ ] **Fase 3:** Implementar ClaudeAdapter (con O-01, O-02, O-03 mandatory)
- [ ] Buscar más usos de rol directo en Sidebar, CaseModal, MetricsBoard y migrar a `can()` o `useCan()`
- [ ] Marcar `mockService.ts` y `mockCases.ts` como `@deprecated`

### Estado al Cierre

- ✅ **Singleton global eliminado** — `activeService`, `getActiveService()`, `setCasoService()` ya no existen
- ✅ **CasoServiceContext creado** — Provider + useCasoService hook. Multi-tenant ready
- ✅ **3 hooks refactorizados** — `useCasos()`, `useCasosPorAsesor()`, `useAsignarCaso()` todos usan `useCasoService()`
- ✅ **State machine de asignación** — 5 estados con overlay visual en cada CaseCard
- ✅ **TypeScript 0 errores** | Code review: ✅ 1 fix (useRef init) + 1 unused import | Build OK
- **104/134 tareas (78%)** — 6 nuevas tareas CC-01 a CC-06

---

## Sesión 16 — 2026-06-11 — Realtime Layer + Event-Driven Reconciliation + Server Revision Control

**Objetivo:** Implementar 3 mejoras incrementales sobre la arquitectura de asignación de casos: Realtime Layer (Supabase Realtime), Event-Driven Reconciliation con debounce y race condition protection, y Server Revision Control mediante `updated_at`.
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, code-reviewer-deepseek-flash, basher (typecheck)

### Resumen

Se implementaron 3 mejoras incrementales sobre la arquitectura existente (CaseUIStore, useAsignarCaso, CaseCard):

**A) Server Revision Control**

Se agregó control de versiones del servidor para evitar overwrite de estado viejo:
- `CaseUIEntry.serverUpdatedAt: string | null` — almacena el `updated_at` del caso al momento de la última reconciliación
- En el `RECONCILE` reducer: antes de reconciliar, compara `serverCase.updated_at <= entry.serverUpdatedAt`. Si la versión del servidor no es más nueva que la última reconciliada, skipea completamente
- `SET_CASE_UI_STATE` resetea `serverUpdatedAt: null` (acción local invalida versión del servidor)
- Cuando el caso no cambió en el servidor (asesor_id == null, estado == pendiente), igual actualiza `serverUpdatedAt` para futuras referencias
- ISO 8601 timestamps son lexicográficamente ordenables, por lo que la comparación `<=` funciona correctamente

**B) Event-Driven Reconciliation + Debounce**

Se reforzó `reconcileCaseState` para hacerla event-driven:
- **Debounce de 300ms:** `reconcileCaseState` ahora acumula múltiples llamadas rápidas en una ventana de 300ms usando `useRef`. Si llegan 3 eventos Realtime en 100ms, se acumulan y se despachan una sola vez
- **`mergeServerCases()`** — Helper que mergea dos arrays de `Caso[]` deduplicando por `id` y manteniendo el `updated_at` más reciente. Se usa para acumular casos de llamadas consecutivas durante el debounce
- Cleanup del timer al desmontar para evitar memory leaks
- FreshnessWindow existente (3s) se mantiene como segunda capa de protección para acciones optimistas

**C) Realtime Layer — `useCaseRealtimeSync`**

Se creó un hook de suscripción a Supabase Realtime:
- `supabase.channel("casos-realtime")` con `postgres_changes` en tabla `casos` (event: *, schema: public)
- **`isRelevantPayload()`**: filtra solo cambios en `asesor_id` o `estado`. INSERT siempre es relevante. DELETE se ignora
- Cada evento relevante → `reconcileCaseState([changedCase], userId)` — el store acumula y debouncea
- Sin debounce propio del hook para evitar doble debounce (se corrigió en code review)
- Se monta solo si hay usuario autenticado. Cleanup: `removeChannel` al desmontar
- Respeta RLS: el usuario solo recibe eventos de casos que puede ver según políticas

**D) Reconciliation bug fix**

Durante el desarrollo se detectó y corrigió un bug: `reconcileCaseState` no tenía acceso al `userId` del usuario actual. Cuando un usuario tomaba un caso exitosamente y luego un refresh del servidor llegaba después del freshnessWindow (3s), la reconciliación veía `asesor_id !== null` y lo marcaba como `claimed_by_other` — incluso cuando el dueño era el propio usuario.

**Fix:** Se agregó `userId` como 2do parámetro de `reconcileCaseState`. El reducer ahora compara `serverCase.asesor_id === userId`:
- Si es MI userId → limpia la entry (asignación exitosa confirmada)
- Si es otro userId Y entry estaba "claiming" → claimed_by_other
- Si es otro userId Y entry NO estaba "claiming" → limpia (el cambio vino de otro lado)
- Si asesor_id es null → no hay cambio, continúa

### Archivos Creados (1 nuevo)

| Archivo | Propósito |
|---|---|
| `src/hooks/useCaseRealtimeSync.ts` | Suscripción Realtime a cambios en tabla casos con filtro de eventos relevantes |

### Archivos Modificados (3)

| Archivo | Cambio |
|---|---|
| `src/stores/caseUIStore.ts` | `serverUpdatedAt` en `CaseUIEntry` + version control en RECONCILE + debounce 300ms + `mergeServerCases()` + `userId` en RECONCILE action + firma `reconcileCaseState(serverCases, userId?, freshnessWindow?)` |
| `src/pages/DashboardPage.tsx` | Import y ejecución de `useCaseRealtimeSync()`. Pasa `user.id` a `reconcileCaseState` en useEffect y handler CASE_ALREADY_TAKEN |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Debounce en el store (reconcileCaseState)** vs en el hook Realtime | Debounce en ambos (doble = 600ms) | Se corrigió en code review: eliminar debounce del hook, mantener solo en el store. Total: 300ms, no 600ms |
| **`mergeServerCases()`** con dedup por id + updated_at más reciente | No acumular (perder datos) | Si llegan 2 eventos del mismo caso en la ventana de debounce, se conserva el más reciente en lugar de procesar ambos por separado |
| **`serverUpdatedAt` en `CaseUIEntry`** vs mapa separado `lastReconcileMap: Record<caseId, timestamp>` | Mapa separado | Más cohesivo: el dato vive con la entry. Se limpia automáticamente cuando se limpia la entry. Un solo objeto en el state |
| **ISO 8601 string comparison** (`<=`) vs parse a Date | Parse a Date | ISO 8601 es lexicográficamente ordenable. Más eficiente y evita overhead de Date parsing |
| **`isRelevantPayload()`** en el hook | Pasar todos los eventos al store (que igual filtra en serverChanged) | Reduce dispatches al store. Eventos irrelevantes (cambio en prioridad, extraccion_ia, etc.) no llegan al store |
| **`as unknown as Caso`** para tipar payload Realtime | Validación estricta del schema | El RECONCILE reducer solo lee id, asesor_id, estado, updated_at — campos que siempre vienen en el payload. Aceptable |

### Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Doble debounce** (hook 300ms + store 300ms) | ✅ Corregido durante code review. El hook ya no tiene debounce propio |
| **freshnessWindow=0** en reconcileCaseState puede limpiar overlays de OTROS casos (edge case: usuario asignando dos casos simultáneamente) | ✅ Aceptado. Edge case muy poco probable. El SET_CASE_UI_STATE ya disparó el estado final inmediato. La reconciliación diferida solo limpia el store |
| **Realtime subscription sin filtro DB-level** (solo client-side) | ✅ RLS filtra a nivel DB qué filas llegan al usuario. El filtro client-side (`isRelevantPayload`) es segunda capa |
| **Supabase Realtime no habilitado en el proyecto** | ⚠️ Requiere activación manual en Supabase Dashboard: Project Settings → Database → Realtime → habilitar replicación para tabla "casos" |

### Flujo Completo Final

```
Realtime event (INSERT/UPDATE en casos)
  → useCaseRealtimeSync
    → isRelevantPayload (filtra solo asesor_id/estado)
      → reconcileCaseState([changedCase], userId)
        → store: mergeServerCases (acumula <300ms)
          → RECONCILE reducer
            → skip si updated_at <= serverUpdatedAt
            → skip si freshnessWindow protege acción optimista
            → skip si server no cambió (asesor_id null, estado pendiente)
            → userId === asesor_id → cleanup (mi claim)
            → userId !== asesor_id + claiming → claimed_by_other
            → otro estado → cleanup

RPC response (asignarCaso)
  → useAsignarCaso: SET_CASE_UI_STATE inmediato
  → DashboardPage: reconcileCaseState (debounce 300ms)
  → CaseCard: overlay según el estado final seteado por el hook

Refresh inicial
  → useCasos(): fetch + setCasos
  → useEffect: reconcileCaseState(allCasos, userId, 3000)
```

### Pendientes para la Próxima Sesión

- [ ] **Activar Supabase Realtime** en Dashboard: Project Settings → Database → Realtime → habilitar replicación para tabla "casos"
- [ ] **Probar en navegador**: abrir dos sesiones como asesores distintos y verificar que cuando uno toma un caso, el otro ve el overlay "Otro asesor tomó este caso" en tiempo real
- [ ] **Fase 2.3:** Endpoint webhook Callbell + Realtime
- [ ] **Fase 3:** Implementar ClaudeAdapter (con O-01, O-02, O-03 mandatory)

### Estado al Cierre

- ✅ **Realtime Layer implementado** — `useCaseRealtimeSync` hook con suscripción a cambios en tabla casos + filtro de eventos relevantes
- ✅ **Server Revision Control** — `serverUpdatedAt` en CaseUIEntry + version control en RECONCILE (ISO 8601 string comparison)
- ✅ **Event-Driven Reconciliation** — Debounce 300ms + mergeServerCases + userId en RECONCILE (bug fix)
- ✅ **Reconciliation bug fix** — `reconcileCaseState` ahora recibe userId, distingue claimed_by_me vs claimed_by_other
- ✅ **TypeScript 0 errores** | Code review: ✅ 1 fix (doble debounce eliminado) | Build OK
- **109/139 tareas (78%)** — 5 nuevas tareas RT-01 a RT-05

---

## Sesión 17 — 2026-06-11 — Realtime Hardening: Event Dedup + Optimistic Lock + Reconnect Resync

**Objetivo:** Hardenear el sistema Realtime ya activado en Supabase con 3 capas de protección: event deduplication (evitar procesar el mismo evento dos veces), optimistic lock (evitar que reconciliación sobrescriba acciones recientes del usuario), y reconnect + visibility resync (recuperación ante desconexiones sin estado inconsistente).
**Duración:** 1 sesión
**Herramientas:** Codebuff IA, code-reviewer-deepseek-flash, basher (typecheck)

### Resumen

Se implementaron 3 capas de hardening sobre el sistema Realtime existente, garantizando no duplicación de eventos, no reconciliaciones innecesarias, resiliencia ante reconnects, y consistencia UI ↔ server:

**Capa 1 — Event Dedup (`useCaseRealtimeSync.ts`):**

Se agregó un `Set<string>` con TTL de 30s para evitar que el mismo evento Realtime se procese dos veces:
- `eventId = ${caseId}:${updated_at}` — identificador único por evento
- `markEventProcessed(eventId)`: agrega al Set + programa cleanup vía `setTimeout` (30s)
- `isEventDuplicate(eventId)`: check O(1) antes de cualquier procesamiento
- Cleanup automático evita memory leaks
- Pipeline de reconciliación estable: **Step 1 = dedup event**

**Capa 2 — Optimistic Lock Protection (`caseUIStore.ts` + `useAsignarCaso.ts`):**

Se agregó un `Map<caseId, timestamp>` con TTL de 2s para proteger acciones del usuario contra reconciliación temprana:
- `setOptimisticLock(caseId)`: setea lock + cleanup automático vía `setTimeout` (2s TTL)
- `clearOptimisticLock(caseId)`: limpia lock manualmente (RPC completada)
- `isOptimisticLocked(caseId)`: verifica si hay lock activo (expira si TTL expiró)
- RECONCILE reducer: **Step 2** — `if (isOptimisticLocked(serverCase.id)) continue;`
- Integrado en `useAsignarCaso.ts`: `setOptimisticLock()` antes de la RPC, `clearOptimisticLock()` en `finally`
- Protege: clicks recientes de "Tomar caso", RPC en curso, UI en estado claiming

**Capa 3 — Reconnect + Visibility Resync (`useCaseRealtimeSync.ts`):**

Se agregaron 2 mecanismos de recuperación:
- **Reconnect handler:** callback de `.subscribe()` con `status === "SUBSCRIBED"` → limpia Set de dedup + `refetchCases()`. Flag `isFirstSubscription` evita doble fetch al montaje inicial
- **Visibility change handler:** `visibilitychange` listener con threshold de 5s. Si el tab estuvo oculto >5s al volver → limpia dedup + `refetchCases()`
- Realtime no es fuente de verdad → solo señal para refetch

**Pipeline de reconciliación final (orden obligatorio):**
```
Step 1. Dedup event (Set TTL 30s)
Step 2. Optimistic lock check (Map TTL 2s)
Step 3. Filter isRelevantPayload (asesor_id/estado)
Step 4. Version check (serverUpdatedAt)
Step 5. Freshness window (3s)
Step 6. Apply reconcileCaseState → UI store
```

### Archivos Modificados (4)

| Archivo | Cambio |
|---|---|
| `src/stores/caseUIStore.ts` | Módulo `optimisticLockMap` (Map TTL 2s) + `setOptimisticLock`/`clearOptimisticLock`/`isOptimisticLocked` + pipeline numerado Step 1-6 en RECONCILE |
| `src/hooks/useCaseRealtimeSync.ts` | `processedEvents` Set TTL 30s + reconnect handler con `isFirstSubscription` + visibility change handler con 5s threshold + `buildEventId()` refactor |
| `src/hooks/useAsignarCaso.ts` | `setOptimisticLock(casoId)` al iniciar RPC + `clearOptimisticLock(casoId)` en `finally` |
| `src/pages/DashboardPage.tsx` | `useCaseRealtimeSync(refresh)` — pasa `refresh` callback para reconnect resync |

### Decisiones Tomadas

| Decisión | Alternativa | Razón |
|---|---|---|
| **Module-level Map para optimistic locks** | React state / useRef | Las funciones `setOptimisticLock`/`isOptimisticLocked` se llaman desde el store (no es React). Un Map module-level evita pasar props o crear un context adicional. Los timers de cleanup evitan memory leaks |
| **`Set<string>` con TTL 30s para dedup** | Sin TTL (Set sin límite) | Sin TTL el Set crecería indefinidamente con eventIds de casos que ya no se actualizan. 30s es suficiente para cubrir Realtime events duplicados (Supabase no retransmite después de confirmación) |
| **TTL 2s para optimistic lock** | 1s / 5s / sin TTL | 2s cubre el tiempo típico de una RPC (50-200ms) con margen para latencia de red. Menos de 1s podría expirar antes de que la RPC termine. Más de 5s bloquearía reconciliaciones de otros asesores innecesariamente |
| **`isFirstSubscription` flag** para evitar doble fetch inicial | Sin flag (aceptar doble fetch) | `useCasos()` ya fetch al montar. `console.warn` mostraría "Realtime SYNCED" innecesario. `isFirstSubscription` evita el refetch solo en el primer SUBSCRIBED |
| **Visibility threshold 5s** | 1s / 30s / cualquier cambio | Menos de 5s: demasiados refetches por cambios de tab rápidos. Más de 5s: riesgo de perder eventos si el usuario vuelve después de una pausa larga. 5s es un balance |
| **Debounce solo en el store** (no en el hook) | Debounce en ambos (600ms total) | Se corrigió del code review de Sesión 16. El store ya debouncea 300ms. Agregar debounce en el hook crearía 600ms de latencia total. El store centraliza todo el timing |
| **`clearProcessedEvents()` siempre en SUBSCRIBED** y refetch solo si no es primera vez | No limpiar dedup en reconnect | Al reconectar, el Set de dedup debe limpiarse porque Supabase podría reenviar eventos que ya se procesaron. Sin cleanup, esos eventos se ignorarían silenciosamente |

### Riesgos y Mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Module-level timer leaks en HMR:** `eventTimers` y `lockCleanupTimers` no se limpian si el módulo se reemplaza en hot reload | ✅ Los timers tienen TTL fijo (30s/2s) y expiran naturalmente. No hay acumulación infinita porque cada montaje nuevo crea timers que eventualmente se limpian solos |
| **`isOptimisticLocked` race condition:** Si el lock expira justo cuando la RPC está por completar | ✅ La RPC ya se disparó y `useAsignarCaso` maneja su propio estado `isLoading`. El lock es una capa extra, no la única protección. Si expira antes de la RPC, el RECONCILE igual será bloqueado por freshnessWindow (3s) si la acción optimista se completó |
| **`clearProcessedEvents()` en reconnect puede causar re-procesamiento de eventos viejos:** Si Supabase reenvía eventos que ya estaban en el Set, se procesarán de nuevo | ✅ Es el comportamiento deseado — durante una desconexión se pudieron perder eventos. Re-procesar asegura consistencia. El RECONCILE reducer es idempotente (version check + freshnessWindow) |
| **Visibility handler corre `refetchCases()` que es async y puede fallar** | ✅ El error se captura y loggea (`console.error`). Realtime sigue funcionando independientemente del refetch |
| **`subscription.unsubscribe()` no limpia el Set de dedup** | ✅ No necesita — el Set es module-level y persiste entre montajes/desmontajes. El TTL de 30s limpia entries viejas automáticamente |

### Archivos Modificados (4) — Detalle de cambios

#### `src/stores/caseUIStore.ts`
```diff
+ const OPTIMISTIC_LOCK_TTL_MS = 2000;
+ const optimisticLockMap = new Map<string, number>();
+ const lockCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
+
+ export function setOptimisticLock(caseId: string): void {
+   optimisticLockMap.set(caseId, Date.now());
+   const existing = lockCleanupTimers.get(caseId);
+   if (existing) clearTimeout(existing);
+   lockCleanupTimers.set(caseId, setTimeout(() => {
+     optimisticLockMap.delete(caseId);
+     lockCleanupTimers.delete(caseId);
+   }, OPTIMISTIC_LOCK_TTL_MS));
+ }
+
+ export function clearOptimisticLock(caseId: string): void {
+   optimisticLockMap.delete(caseId);
+   const timer = lockCleanupTimers.get(caseId);
+   if (timer) {
+     clearTimeout(timer);
+     lockCleanupTimers.delete(caseId);
+   }
+ }
+
+ export function isOptimisticLocked(caseId: string): boolean {
+   const lockTime = optimisticLockMap.get(caseId);
+   if (lockTime === undefined) return false;
+   if (Date.now() - lockTime >= OPTIMISTIC_LOCK_TTL_MS) {
+     optimisticLockMap.delete(caseId);
+     return false;
+   }
+   return true;
+ }
```

En el RECONCILE reducer, **Step 2**:
```typescript
// Step 2: Optimistic lock check
if (isOptimisticLocked(serverCase.id)) {
  continue;
}
```

#### `src/hooks/useCaseRealtimeSync.ts`
- `processedEvents: Set<string>` + `eventTimers: Map<string, ReturnType<typeof setTimeout>>`
- `buildEventId(newData)` — genera `${caseId}:${updated_at}`
- `markEventProcessed(eventId)` — agrega al Set + programa cleanup 30s
- `isEventDuplicate(eventId)` — check O(1)
- `clearProcessedEvents()` — limpia Set y todos los timers
- `.subscribe(callback)` con status SUBSCRIBED → `clearProcessedEvents()` + `refetchCases()`
- `visibilitychange` listener → si tab oculto >5s → `clearProcessedEvents()` + `refetchCases()`

#### `src/hooks/useAsignarCaso.ts`
```diff
+ setOptimisticLock(casoId);
  try {
    // ... RPC call
  } finally {
+   clearOptimisticLock(casoId);
    setIsLoading(false);
  }
```

#### `src/pages/DashboardPage.tsx`
```diff
- useCaseRealtimeSync();
+ useCaseRealtimeSync(refresh);
```

### Pendientes para la Próxima Sesión

- [ ] **Fase 2.3:** Endpoint webhook Callbell + Realtime
- [ ] **Fase 3:** Implementar ClaudeAdapter (con O-01, O-02, O-03 mandatory)
- [ ] Configurar variables de entorno en Vercel Dashboard
- [ ] Marcar `mockService.ts` y `mockCases.ts` como `@deprecated`

### Estado al Cierre

- 🛡️ **Realtime Hardening completado (4/4)** — Event Dedup + Optimistic Lock + Reconnect/Visibility Resync + Stable Pipeline
- ✅ Optimistic Lock Protection (`optimisticLockMap`, TTL 2s) protege RPCs en curso
- ✅ Event Dedup (`processedEvents` Set, TTL 30s) evita procesar el mismo evento dos veces
- ✅ Reconnect handler + Visibility handler con 5s threshold
- ✅ Pipeline numerado Step 1-6 en RECONCILE reducer
- ✅ TypeScript 0 errores | Code review: ✅ 1 fix (isFirstSubscription flag) + 1 fix (clearProcessedEvents duplicado) | Build OK
- **113/143 tareas (79%)** — 4 nuevas tareas HH-01 a HH-04

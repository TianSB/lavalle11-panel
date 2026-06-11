# TODO — Plan de Trabajo y Seguimiento

> **Leyenda:** ✅ Completado | 🔄 En progreso | ⬜ Pendiente | ❌ Bloqueado | 🟡 En revisión

---

## Fase 0 — Definición y Estructura Documental

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| 0.1 | Extraer PRD del documento .docx | ✅ | — | Conversación inicial |
| 0.2 | Crear estructura de carpetas del proyecto | ✅ | — | docs, core, decisions, planning, backend, frontend, database, prompts |
| 0.3 | Crear README.md | ✅ | — | Portal de entrada |
| 0.4 | Crear PROJECT_STATE.md | ✅ | — | Estado actual del proyecto |
| 0.5 | Crear ARCHITECTURE.md | ✅ | — | Arquitectura del sistema + 12 diagramas Mermaid |
| 0.6 | Crear DECISIONS.md | ✅ | — | 8 ADRs registrados (incluye TypeScript y RIS) |
| 0.7 | Crear TODO.md | ✅ | — | Este archivo |
| 0.8 | Crear SESSION_LOG.md | ✅ | — | Registro de sesiones |
| 0.9 | Crear documentación en /docs | ✅ | — | Glosario, riesgos, workflow, índice |
| 0.10 | Crear documentación en /core | ✅ | — | PRD, requirements, use-cases, business-rules |
| 0.11 | Crear ADRs en /decisions | ✅ | — | Template ADR |
| 0.12 | Crear documentación en /planning | ✅ | — | Roadmap, plan detallado Fase 1 |
| 0.13 | Crear MASTER_CONTEXT.md | ✅ | — | Contexto rápido para nuevas sesiones IA |
| 0.14 | Crear WORKFLOW.md | ✅ | — | Flujo de trabajo para sesiones IA |
| 0.15 | Crear DATABASE_SCHEMA.md | ✅ | — | Diseño completo (7 entidades, ENUMs, índices, sin SQL) |
| 0.16 | Crear API_SPEC.md | ✅ | — | 23 endpoints en 7 categorías |
| 0.17 | Crear UI_SPEC.md | ✅ | — | 7 pantallas, 13 secciones, flujos complejos |
| 0.18 | Crear documentación backend | ⬜ | — | Webhook, endpoints, integraciones |
| 0.19 | Crear documentación frontend | ⬜ | — | Component tree, views, data flow |
| 0.20 | Crear prompts en /prompts | ⬜ | — | System prompt Claude, session resume |
| **0.21** | **Crear AI_PROVIDER_ARCHITECTURE.md** | **✅** | **5** | **12 secciones, 7 diagramas Mermaid, aprobado con auditoría** |

---

## Correcciones de Auditoría PostgreSQL ✅

**Objetivo:** Aplicar los 5 hallazgos de la auditoría Senior PostgreSQL a las migraciones SQL y documentación.

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| AC-01 | **CR-01:** Corregir comparación `val::text` en trigger `registrar_evento_caso()` | ✅ | 6 | `010_auditoria_eventos.sql` — `val::text` → `(to_jsonb(NEW) ->> key)`. Error crítico: todos los campos aparecían como modificados |
| AC-02 | **R-01:** Agregar trigger UPDATE en `auth.users` + expandir ON CONFLICT | ✅ | 6 | `002_usuarios.sql` — `on_auth_user_updated` sincroniza nombre, email y rol. Antes solo capturaba INSERT |
| AC-03 | **R-02:** Agregar CHECK constraint en `confianza_global` | ✅ | 6 | `006_extracciones_ia.sql` — `chk_extracciones_confianza: confianza_global BETWEEN 0.00 AND 1.00` |
| AC-04 | **R-03:** Actualizar nombres de archivos en DATABASE_SCHEMA.md | ✅ | 6 | Sección 16: `001_enums.sql` → `013_rls.sql` (eran incorrectos) |
| AC-05 | **R-04:** Renombrar constraint `uq_casos_callbell_uuid` | ✅ | 6 | `003_casos.sql` — `uq_casos_callbell_conversation_uuid` para reflejar columna real |

---

## Fase 1 — Panel Estático (Validación Visual) ✅

**Objetivo:** Construir frontend mock completo con datos hardcodeados. Sin backend, Sin Supabase, Sin Claude, Sin Callbell.

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| 1.1 | Inicializar proyecto React + Vite + Tailwind + TypeScript | ✅ | 2 | package.json, tsconfig, vite.config, tailwind v4 |
| 1.2 | Definir tipos TypeScript (14 interfaces, 14 tipos) | ✅ | 2 | `types/index.ts` — Caso, ExtraccionIA, Turno, etc. |
| 1.3 | Crear datos mock (12 casos cubriendo tipos A–K) | ✅ | 2 | `data/mockCases.ts` — incluye métricas y volumen diario |
| 1.4 | Implementar componentes UI base (Badge, Button, Modal, Toast) | ✅ | 2 | 5 variantes, 3 tamaños, 4 tipos de toast |
| 1.5 | Implementar layout (Header, Sidebar, StatusBar, AppLayout) | ✅ | 2 | Responsive, sidebar con badges, status bar |
| 1.6 | Implementar cola de casos (CaseCard, CaseGrid, FilterBar) | ✅ | 2 | Búsqueda, filtros por estado/prioridad/tipo, skeleton, empty state |
| 1.7 | Implementar modal de resolución (CaseModal) | ✅ | 2 | Resumen IA, campos, sede, fecha, hora, checkboxes, prevista en vivo, acciones |
| 1.8 | Implementar LoginPage con autenticación mock | ✅ | 2 | Validación, loading, error, toggle password, credenciales visibles |
| 1.9 | Implementar DashboardPage con filtros y vistas | ✅ | 2 | Cola General, Mi Bandeja, Seguimientos, Dashboard |
| 1.10 | Implementar MetricsBoard con KPIs y gráficos | ✅ | 2 | 6 KPIs, casos por tipo, volumen diario apilado |
| 1.11 | Compilación TypeScript exitosa (sin errores) | ✅ | 2 | 8 errores corregidos durante la sesión |
| 1.12 | Auditoría técnica QA completa | ✅ | 2 | Informe generado con 12 hallazgos |

---

## Fase 1.5 — Refactor y Preparación para Backend ✅

**Objetivo:** Corregir hallazgos de la auditoría QA antes de conectar backend. Reducir deuda técnica. Comportamiento visual idéntico.

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| 1.5.1 | Refactorizar CaseModal en 8 sub-componentes | ✅ | 3 | Field, ResumenIA, SelectorSede, SelectorFecha, SelectorHora, ListaInstrucciones, VistaPreviaMensaje, FormSeguimiento. CaseModal pasó de 302 → 120 líneas |
| 1.5.2 | Corregir bug `contact_name.split(" ")[0]` — guard clause | ✅ | 3 | getFirstName() en utils/dates.ts con fallback al nombre completo |
| 1.5.3 | Extraer lógica de fechas a `utils/dates.ts` | ✅ | 3 | 5 funciones: formatDateTime, getSuggestedDates, formatMessageDate, getFirstName, formatShortDate |
| 1.5.4 | Eliminar prop `asesorEmail` de HeaderProps y AppLayoutProps | ✅ | 3 | Interfaz limpiada en Header, AppLayout y DashboardPage |
| 1.5.5 | Agregar confirmación antes de cerrar caso | ✅ | 3 | Modal de confirmación con Cancelar / Cerrar caso, backdrop |
| 1.5.6 | Hacer interactiva la lista de tipos en Sidebar | ✅ | 3 | onFilterByTipo callback conectado a DashboardPage → setFiltroTipo |
| 1.5.7 | Crear hook `useCasos()` + servicio mock | ✅ | 3 | useCasos, useCasosPorAsesor, useMetricas + CasoService interface |
| 1.5.8 | Migrar `TIPOS_CASO` a `Record<TipoCaso, string>` | ✅ | 3 | Elimina accesos `?? null` en Componentes |
| 1.5.9 | Eliminar código duplicado (INSTRUCCION_LABELS, useMemo buggy) | ✅ | 3 | Labels compartidos desde ListaInstrucciones; prevCasoId con useRef |
| 1.5.10 | Compilación exitosa (0 errores, strict mode) | ✅ | 3 | TypeScript sin errores |

---

## Fase 2.1 — Supabase Auth ✅

**Objetivo:** Reemplazar autenticación mock por login real con Supabase Auth. Sesión persistente. Roles. Mantener UI existente. Sin Callbell. Sin Claude.

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| 2.1.1 | Instalar @supabase/supabase-js | ✅ | 4 | v2.108.1 |
| 2.1.2 | Crear cliente Supabase (src/lib/supabase.ts) | ✅ | 4 | Validación de env vars al import |
| 2.1.3 | Configurar .env.local + .gitignore | ✅ | 4 | Placeholder + exclusión de credenciales |
| 2.1.4 | Refactorizar AuthContext — login con signInWithPassword | ✅ | 4 | Reemplaza mock `new Promise + hardcoded` |
| 2.1.5 | Refactorizar AuthContext — logout con signOut | ✅ | 4 | Reemplaza `setUser(null)` simple |
| 2.1.6 | Refactorizar AuthContext — session persistence (getSession) | ✅ | 4 | Restaura sesión al recargar página |
| 2.1.7 | Refactorizar AuthContext — onAuthStateChange listener | ✅ | 4 | Reacciona a cambios de auth en tiempo real |
| 2.1.8 | Refactorizar AuthContext — roles desde public.usuarios.rol | ✅ | 4 | Mapeo Usuario.rol → isAdmin |
| 2.1.9 | Actualizar LoginPage — remover mock credentials | ✅ | 4 | UI idéntica, hint de configuración Supabase |
| 2.1.10 | Agregar LoadingScreen en App.tsx | ✅ | 4 | Evita flash de login al restaurar sesión |
| 2.1.11 | Manejar edge case: usuario autenticado sin perfil en DB | ✅ | 4 | Error: "Usuario no encontrado en la base de datos" |
| 2.1.12 | Compilación TypeScript exitosa (0 errores) | ✅ | 4 | npx tsc -b --noEmit |

---

## Diseño AI_PROVIDER_ARCHITECTURE.md ✅

**Objetivo:** Diseñar arquitectura desacoplada de proveedores IA. Provider-agnostic. Sin modificar frontend, DB, webhook, ni lógica de negocio.

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| D01 | Definir principios de diseño (P-01 a P-07) | ✅ | 5 | Provider agnostic, swap sin código, fail fast, observabilidad, cost awareness, equivalencia semántica, testeabilidad |
| D02 | Diseñar arquitectura general con 6 capas + diagrama | ✅ | 5 | Webhook Handler → CasoService → AnalisisService → Factory → Adapter → SDK |
| D03 | Definir interfaces canónicas (EntradaCanonica, RespuestaCanonica, AIProvider) | ✅ | 5 | Input/output unificados, provider-agnostic |
| D04 | Diseñar Provider Pattern con 4 adapters | ✅ | 5 | ClaudeAdapter, GPTAdapter, GeminiAdapter, DeepSeekAdapter + MockProvider |
| D05 | Diseñar Factory Pattern con registry | ✅ | 5 | Registry Map<ProveedorId, ProviderFactory> + selección por PRIMARY_PROVIDER |
| D06 | Definir flujo completo de análisis (4 fases) | ✅ | 5 | Preparación → Invocación → Post-procesamiento → Resolución |
| D07 | Catalogar 10 códigos de error + reintentos | ✅ | 5 | timeout, rate_limited, auth_error, invalid_response, json_parse, schema_validation, content_filtered, context_exceeded, unavailable, unknown |
| D08 | Definir 4 modalidades de fallback | ✅ | 5 | Sin fallback, otro proveedor, mismo proveedor otro modelo, mock |
| D09 | Documentar 20+ variables de entorno | ✅ | 5 | PRIMARY_PROVIDER, CLAUDE_API_KEY, FALLBACK_PROVIDER, PROVIDER_TIMEOUT_MS, MAX_COST_PER_CALL_USD, etc. |
| D10 | Definir estrategia de cambio de proveedor | ✅ | 5 | Planificado (24-48hs), emergencia (automático), costo (auto-tuning), rollback |
| D11 | Definir pirámide de testing | ✅ | 5 | Unit → Integration → Contract → E2E → Chaos + MockProvider con fixtures |
| D12 | Generar 7 diagramas Mermaid | ✅ | 5 | Contexto, capas, secuencia, clases, árbol de fallback, decisiones, rolling |
| D13 | Auditoría de diseño (6 observaciones) | ✅ | 5 | 3 v1 mandatory, 1 v1.1 recommended, 2 backlog futuro |
| D14 | Aprobación del documento | ✅ | 5 | Documento marcado como ✅ Aprobado |

---

## Infraestructura Base — Supabase Desplegada 🚀 ✅

**Hito:** 13 migraciones SQL ejecutadas en Supabase · 10 tablas visibles · RLS desplegado · Consultas SELECT validadas

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| IB-01 | Crear proyecto Supabase en supabase.com | ✅ | 8 | Proyecto creado con PostgreSQL habilitado |
| IB-02 | Ejecutar 001_enums.sql — 22 ENUMs | ✅ | 8 | tipo_caso, estado_caso, prioridad_caso, tipo_practica, motivo_solicitud, etc. |
| IB-03 | Ejecutar 002_usuarios.sql — Tabla usuarios + trigger auth | ✅ | 8 | Trigger sync on INSERT + UPDATE en auth.users |
| IB-04 | Ejecutar 003_casos.sql — Tabla casos + secuencia LV-XXXX | ✅ | 8 | Seq + trigger generar_id + trigger updated_at |
| IB-05 | Ejecutar 004–009 — mensajes, adjuntos, extracciones_ia, seguimientos, turnos, llamadas | ✅ | 8 | 6 tablas adicionales operativas |
| IB-06 | Ejecutar 010_auditoria_eventos.sql | ✅ | 8 | Tabla auditoría + trigger corregido (CR-01) |
| IB-07 | Ejecutar 011_configuracion.sql — Seed data JSONB | ✅ | 8 | 5 claves de configuración precargadas |
| IB-08 | Ejecutar 012_indices.sql — 30 índices BTREE | ✅ | 8 | Índices compuestos y de búsqueda |
| IB-09 | Ejecutar 013_rls.sql — 10 políticas RLS | ✅ | 8 | RLS granular por asesor_id y auth.uid() |
| IB-10 | Verificar 10 tablas visibles + SELECTs de prueba | ✅ | 8 | Infraestructura operativa validada |

---

## Fase 2.2 — SupabaseApiService 🎯

> **Prioridad actualizada:** InfraBase ✅ → Auth (DB real) ✅ → **🎯 FASE 2.2: SupabaseApiService** → Realtime → Callbell → IA.
> **🎯 Próximo hito:** FASE 2.2 — Reemplazar progresivamente los mocks por consultas reales a Supabase.

**Objetivo:** El panel consulta datos reales de Supabase. Mocks reemplazados manteniendo UI y compatibilidad.

| # | Tarea | Estado | Sesión | Notas | Esfuerzo |
|---|---|---|---|---|---|
| SS-01 | Extraer TIPOS_CASO a `src/constants.ts` | ✅ | 10 | Sidebar, FilterBar y CaseModal importan esta constante de mockCases.ts | 🔵 Bajo |
| SS-02 | Crear `SupabaseCasoService` implementando `CasoService` | ✅ | 10 | `src/services/supabaseService.ts` (nuevo). Usa cliente anon, respeta RLS | 🔴 Alto (~100 líneas) |
| SS-03 | Wirear `setCasoService()` al inicio de la app | ✅ | 10 | `App.tsx` — 2 líneas al inicio del módulo | 🟢 Mínimo |
| SS-04 | Migrar DashboardPage: useCasos() en lugar de MOCK_CASOS | ✅ | 11 | Refactor de filtrado en useMemo, stats desde estado reactivo. Loading state. TypeScript 0 errores | 🔴 Alto |
| SS-05 | Migrar MetricsBoard: useMetricas() en lugar de mock directo | ✅ | 11 | useMetricas() refactor: deriva de useCasos() con useMemo. MetricsBoard con null safety + loading. 0 calls extra a Supabase | 🟡 Medio |
| SS-06 | Auditoría de seguridad RLS — validar políticas y fuga cross-user | ✅ | 11 | 10/10 tablas con RLS. 🟢 OK. Sin fugas. 3 recomendaciones doc. SQL fixes opcionales | 🟡 Medio |
| SS-07 | Compilación TypeScript + verificación visual + vercel.json + error fix | ✅ | 11 | TypeScript 0 errores ✅. Vite build OK (135KB gzip). vercel.json creado. Error banner en DashboardPage | 🟢 Mínimo |

**No implementar en FASE 2.2:** Realtime · Callbell webhook · Claude IA · Procesamiento imágenes

**Trabajo adicional en SS-07:**
- `vercel.json` creado con configuración Vite SPA (buildCommand, outputDirectory, rewrites)
- Fix de error handling en DashboardPage: banner rojo + separación loading/error/empty states

---

## Fase 2 (restante) — Backend y Webhook de Callbell

**Objetivo:** El panel recibe casos reales de Callbell en tiempo real.

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| 2.3 | Crear endpoint `/api/callbell/webhook` en Vercel | ⬜ | — | Endpoint ya existe, pendiente de deploy |
| 2.4 | Implementar validación de firma de webhook | ⬜ | — | HMAC-SHA256 |
| 2.5 | Procesar evento `message_created` | ⬜ | — | Parseo de payload |
| 2.6 | Crear registros en Supabase (tabla `casos`) | ⬜ | — | Datos crudos |
| 2.7 | Conectar Supabase Realtime al panel | ⬜ | — | Cards aparecen en vivo |
| 2.8 | Implementar idempotencia de webhooks | ⬜ | — | Evitar duplicados por UUID |
| 2.9 | Procesar eventos `conversation_opened` y `conversation_closed` | ⬜ | — | — |

---

## Fase 3 — Análisis con Claude IA

**Objetivo:** Las cards aparecen con datos prellenados y resumen de IA.

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| 3.1 | Integrar SDK de Anthropic (Node.js) | ⬜ | — | Implementar ClaudeAdapter según AI_PROVIDER_ARCHITECTURE.md |
| 3.2 | Construir prompt del sistema | ⬜ | — | Catálogo, reglas, schema JSON de salida |
| 3.3 | Procesar imágenes/PDFs (base64) + structured output | ⬜ | — | O-01 y O-03 mandatory de la auditoría |
| 3.4 | Estimar tokens pre-llamada | ⬜ | — | O-02 mandatory de la auditoría |
| 3.5 | Extraer campos y almacenar en `extraccion_ia` | ⬜ | — | — |
| 3.6 | Calcular score de confianza y flags | ⬜ | — | — |
| 3.7 | Clasificar tipo de caso (A–K) + prioridad | ⬜ | — | — |
| 3.8 | Resolución automática Tipo B | ⬜ | — | Sin intervención |
| 3.9 | Integrar Google Sheets API | ⬜ | — | Obras sociales + precios |
| 3.10 | Cache local de Google Sheets en Supabase | ⬜ | — | TTL 5 min |

---

## Fase 4 — Acciones del Asesor (Flujo Completo)

**Objetivo:** El flujo completo funciona de punta a punta.

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| 4.1 | Integrar Callbell Messages API | ⬜ | — | Envío de mensajes |
| 4.2 | Implementar flujo de confirmación de turno | ⬜ | — | Panel → API → WhatsApp |
| 4.3 | Implementar derivación a Chiclana | ⬜ | — | Notificación automática |
| 4.4 | Implementar registro de llamadas | ⬜ | — | Formulario + almacenamiento |
| 4.5 | Implementar cierre de conversación en Callbell | ⬜ | — | API call al cerrar |
| 4.6 | Manejo de errores y retry en envíos | ⬜ | — | Cola de reintentos |
| 4.7 | Implementar respuesta a prácticas no disponibles | ⬜ | — | Automático |

---

## Fase 5 — Seguimiento y Métricas

**Objetivo:** Visibilidad total del pipeline de consultas.

| # | Tarea | Estado | Sesión | Notas |
|---|---|---|---|---|
| 5.1 | Sistema de notas internas con fecha de seguimiento | ⬜ | — | — |
| 5.2 | Vista de seguimientos pendientes del día | ⬜ | — | — |
| 5.3 | Reconocimiento de contactos recurrentes | ⬜ | — | Búsqueda por teléfono |
| 5.4 | Tablero de métricas operativas | ⬜ | — | KPIs en tiempo real |
| 5.5 | Historial completo por caso | ⬜ | — | Timeline de eventos |
| 5.6 | Exportación de datos básica (CSV) | ⬜ | — | — |

---



| # | Descripción | Prioridad | Planificado para |
|---|---|---|---|
| O-04 | Circuit breaker / rate limiter compartido para proveedores IA | 🟧 v1.1 recommended | v1.1 |
| O-05 | Caché de respuestas IA idénticas por hash del mensaje | 🟩 Backlog futuro | Post-MVP |
| O-06 | Optimización de descarga/conversión de adjuntos en Vercel Serverless | 🟩 Backlog futuro | Post-MVP |
| B06 | Toast singleton — issues con StrictMode de React | 🟢 Baja | Cuando se refactorice Toast |

---

## Resumen de Progreso

| Fase | Total | ✅ | 🔄 | ⬜ | % Completado |
|---|---|---|---|---|---|
| Fase 0 — Documentación | 21 | 19 | 0 | 2 | **91%** |
| Correcciones Auditoría PostgreSQL | 5 | 5 | 0 | 0 | **100%** |
| Fase 1 — Panel estático | 12 | 12 | 0 | 0 | **100%** |
| Fase 1.5 — Refactor QA | 10 | 10 | 0 | 0 | **100%** |
| Fase 2.1 — Supabase Auth (cliente) | 12 | 12 | 0 | 0 | **100%** |
| **Diseño AI Architecture** | **14** | **14** | **0** | **0** | **100%** |
| **🚀 Infraestructura Base** | **10** | **10** | **0** | **0** | **100%** |
| **🚀 Fase 2.2 — SupabaseApiService** | **7** | **7** | **0** | **0** | **100%** |
| Fase 2 (restante) — Backend + Webhook | 7 | 0 | 0 | 7 | 0% |
| Fase 3 — Claude IA | 10 | 0 | 0 | 10 | 0% |
| Fase 4 — Acciones | 7 | 0 | 0 | 7 | 0% |
| Fase 5 — Métricas | 6 | 0 | 0 | 6 | 0% |
| **Total** | **115** | **85** | **0** | **30** | **74%** |

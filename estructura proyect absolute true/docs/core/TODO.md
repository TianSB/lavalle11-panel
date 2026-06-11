# TODO — Plan de Trabajo y Seguimiento

> **Proyecto:** Panel de Gestión de Turnos con IA — Instituto Lavalle 11
> **Última actualización:** 2026-06-11
> **Progreso general:** ~71% (77/109 tareas completadas)
>
> **Leyenda:** ✅ Completo | 🔄 En progreso | ⬜ Pendiente | ❌ Bloqueado | 🟡 En revisión

---

## Fase 0 — Definición y Estructura Documental

**Objetivo:** Crear la base documental del proyecto para poder retomarlo en cualquier momento.
**Duración:** Sesión inicial

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 0.1 | Extraer contenido del PRD desde .docx | ✅ | Conversación inicial con Codebuff |
| 0.2 | Analizar PRD y generar informe arquitectónico | ✅ | 10 secciones completadas |
| 0.3 | Crear estructura de carpetas del proyecto | ✅ | docs, core, decisions, planning, backend, frontend, database, prompts |
| 0.4 | Crear docs/core/PROJECT_STATE.md | ✅ | Estado actual del proyecto |
| 0.5 | Crear docs/core/ARCHITECTURE.md | ✅ | Arquitectura detallada |
| 0.6 | Crear docs/core/DECISIONS.md | ✅ | 6 ADRs registrados |
| 0.7 | Crear docs/core/TODO.md | ✅ | Este archivo |
| 0.8 | Crear docs/core/SESSION_LOG.md | ✅ | Registro de sesión inicial |
| 0.9 | Crear README.md raíz | ✅ | Portal de entrada |
| 0.10 | Crear docs/glossary.md | ✅ | Glosario de términos |
| 0.11 | Crear docs/risks.md | ✅ | Matriz de riesgos |
| 0.12 | Crear docs/workflow.md | ✅ | Flujo de trabajo con IA |
| 0.13 | Crear core/PRD.md | ✅ | PRD en Markdown |
| 0.14 | Crear core/requirements.md | ✅ | Requerimientos funcionales y no funcionales |
| 0.15 | Crear core/use-cases.md | ✅ | Casos de uso detallados |
| 0.16 | Crear core/business-rules.md | ✅ | Reglas de negocio |
| 0.17 | Crear decisions/template.md | ✅ | Plantilla ADR |
| 0.18 | Crear planning/roadmap.md | ✅ | Roadmap 5 fases |
| 0.19 | Crear planning/phase-1-panel-estatico.md | ✅ | Plan detallado Fase 1 |
| 0.20 | Crear backend/INDEX.md | ✅ | Esqueleto backend |
| 0.21 | Crear frontend/INDEX.md | ✅ | Esqueleto frontend |
| 0.22 | Crear database/INDEX.md | ✅ | Esqueleto base de datos |
| 0.23 | Crear prompts/INDEX.md | ✅ | Esqueleto prompts |

---

## Fase 1 — Panel Estático (Validación Visual)

**Objetivo:** Validar el diseño del panel con Franco Berardi antes de conectar el backend.
**Duración estimada:** 1–2 semanas
**Dependencia:** Ninguna (se puede empezar inmediatamente)

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1.1 | Inicializar repositorio Git + GitHub | ⬜ | Nombre sugerido: `lavalle11-panel` |
| 1.2 | Configurar proyecto React + Vite + TypeScript | ✅ | Hecho en sesión anterior |
| 1.3 | Configurar Tailwind CSS v4 | ✅ | Hecho en sesión anterior |
| 1.4 | Configurar ESLint + Prettier | ✅ | Hecho en sesión anterior |
| 1.5 | Configurar deploy automático en Vercel | ⬜ | Desde GitHub, auto-deploy main |
| 1.6 | Crear datos mock (8–12 casos tipos A–K) | ✅ | Hecho en sesión anterior |
| 1.7 | Implementar layout del panel | ✅ | Hecho en sesión anterior |
| 1.8 | Implementar CaseCard con todos los campos | ✅ | Hecho en sesión anterior |
| 1.9 | Implementar barra de filtros | ✅ | Hecho en sesión anterior |
| 1.10 | Implementar modal de resolución completo | ✅ | Hecho en sesión anterior |
| 1.11 | Implementar selector de sede (Lavalle 11 / Chiclana) | ✅ | Hecho en sesión anterior |
| 1.12 | Implementar checkboxes de instrucciones de preparación | ✅ | Hecho en sesión anterior |
| 1.13 | Implementar vista previa del mensaje WhatsApp en tiempo real | ✅ | Hecho en sesión anterior |
| 1.14 | Implementar botón de llamada WhatsApp (wa.me/) | ✅ | Hecho en sesión anterior |
| 1.15 | Implementar indicadores de prioridad por color | ✅ | Hecho en sesión anterior |
| 1.16 | Configurar Supabase project | ✅ | Hecho en sesión anterior |
| 1.17 | Implementar autenticación con Supabase Auth | ✅ | Hecho en sesión anterior |
| 1.18 | Implementar roles asesor / administrador | ✅ | Hecho en sesión anterior |
| 1.19 | Implementar AuthGuard en rutas protegidas | ✅ | Hecho en sesión anterior |
| 1.20 | Validar diseño con Franco Berardi | ⬜ | Feedback y ajustes |

---

## Fase 1.5 — Refactor QA

**Objetivo:** Refactorizar y corregir bugs del frontend antes de avanzar.
**Duración:** Sesión anterior

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1.5.1 | Refactorizar CaseModal en sub-componentes | ✅ | 8 sub-componentes |
| 1.5.2 | Separar lógica de negocio en service layer | ✅ | CasoService interface |
| 1.5.3 | Crear hook useCasos() tipado | ✅ | Con service injection |
| 1.5.4 | Tipar todas las acciones del asesor | ✅ | Sin any |
| 1.5.5 | Unificar naming de tipos con DB | ✅ | Estado → estado, Prioridad → prioridad |
| 1.5.6 | Agregar Flag faltante 'error_ia' | ✅ | |
| 1.5.7 | Corregir Toast no se mostraba en acciones | ✅ | setShowToast(true) |
| 1.5.8 | Corregir filtros: Mi Bandeja no funciona | ✅ | useCasosPorAsesor |
| 1.5.9 | Corregir metrics: loading infinito sin datos | ✅ | Mock data para métricas |
| 1.5.10 | Verificar typecheck estricto | ✅ | tsc --noEmit sin errores |

---

## Fase 2.1 — Supabase Auth (Conectar a DB real)

**Objetivo:** Login real con Supabase Auth en lugar de mock.
**Duración:** Sesión anterior
**Dependencia:** Fase 1 completada

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.1.1 | Instalar @supabase/supabase-js | ✅ | v2.108.1 |
| 2.1.2 | Configurar cliente Supabase | ✅ | src/lib/supabase.ts |
| 2.1.3 | Implementar AuthContext con login real | ✅ | signInWithPassword |
| 2.1.4 | Implementar getSession + onAuthStateChange | ✅ | Sesión persistente |
| 2.1.5 | Implementar fetchUserProfile desde public.usuarios | ✅ | |
| 2.1.6 | Implementar logout | ✅ | supabase.auth.signOut() |
| 2.1.7 | Mostrar LoadingScreen durante restauración de sesión | ✅ | |
| 2.1.8 | Mensajes de error localizados (español) | ✅ | "Credenciales inválidas", etc. |
| 2.1.9 | Integrar roles (asesor/administrador) | ✅ | isAdmin en AuthContext |
| 2.1.10 | LoginPage con diseño responsivo | ✅ | |
| 2.1.11 | Typecheck estricto sin errores | ✅ | |
| 2.1.12 | Verificar flujo completo login→dashboard→logout | ✅ | |

---

## Fase 2.2 — Backend + Webhook de Callbell ✅

**Objetivo:** El panel recibe casos reales de Callbell en tiempo real.
**Duración estimada:** 1 sesión
**Dependencia:** Fase 2.1 completada

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.2.1 | Definir tipos del payload de Callbell | ✅ | src/services/callbell/types.ts |
| 2.2.2 | Implementar payloadParser (parseo + validación) | ✅ | src/services/callbell/payloadParser.ts |
| 2.2.3 | Crear CasoService server-side (CRUD) | ✅ | src/services/supabase/casoService.ts |
| 2.2.4 | Implementar webhookHandler (lógica de negocio) | ✅ | src/services/callbell/webhookHandler.ts |
| 2.2.5 | Crear endpoint POST /api/callbell/webhook | ✅ | api/callbell/webhook.ts |
| 2.2.6 | Implementar health check (GET) | ✅ | Responde { status: "ok" } |
| 2.2.7 | Implementar validación por secret token (query param) | ✅ | CALLBELL_WEBHOOK_SECRET |
| 2.2.8 | Implementar respond-first pattern | ✅ | 200 inmediato, procesa en background |
| 2.2.9 | Detección de MisRx (orden_tipo + flag) | ✅ | misrx.com.ar/prestacion |
| 2.2.10 | Documentar .env.local con nuevas variables | ✅ | |

**Decisiones de diseño tomadas en Fase 2.2:**
- **Seguridad:** Callbell no firma con HMAC → validación por secret token en query param
- **Eventos:** message_created (solo status "received"), conversation_closed, conversation_assigned
- **Idempotencia:** Buscar por callbell_conversation_uuid; si existe y no está cerrado → actualizar historial; si no existe o está cerrado → crear nuevo
- **Sin IA:** placeholders + TODO para Fase 3
- **Respond-first:** Responder 200 inmediatamente, procesar en background (Vercel lo permite)
- **tipo_caso:** Default "A" hasta que IA lo determine en Fase 3

---

## Fase 2.3 — Realtime + Endpoints REST

**Objetivo:** El frontend recibe actualizaciones en vivo desde Supabase.
**Duración estimada:** 1 sesión
**Dependencia:** Fase 2.2 completada

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 2.3.1 | Implementar GET /api/casos | ⬜ | Listar casos con filtros |
| 2.3.2 | Implementar GET /api/casos/:id | ⬜ | Detalle de caso + extraccion_ia |
| 2.3.3 | Implementar PATCH /api/casos/:id | ⬜ | Actualizar caso |
| 2.3.4 | Conectar Supabase Realtime al frontend | ⬜ | useRealtimeCases hook |
| 2.3.5 | Migrar CasoService mock → SupabaseApiService | ⬜ | Swappear en useCasos.ts |

---

## Fase 3 — Análisis con Claude IA

**Objetivo:** Las cards aparecen con datos prellenados y resumen de IA.
**Duración estimada:** 2–3 semanas
**Dependencia:** Fase 2 completada

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 3.1 | Integrar SDK `@anthropic-ai/sdk` | ⬜ | |
| 3.2 | Construir prompt del sistema | ⬜ | Catálogo, reglas, schema JSON |
| 3.3 | Implementar procesamiento de imágenes (base64) | ⬜ | |
| 3.4 | Implementar extracción de campos estructurados | ⬜ | |
| 3.5 | Almacenar resultado en `extraccion_ia` | ⬜ | |
| 3.6 | Calcular score de confianza global (0–1) | ⬜ | |
| 3.7 | Generar flags automáticos | ⬜ | ayuno, copago, baja confianza, etc. |
| 3.8 | Clasificar tipo de caso (A–K) | ⬜ | |
| 3.9 | Calcular prioridad (urgente/normal/bajo) | ⬜ | |
| 3.10 | Implementar resolución automática Tipo B | ⬜ | Sin card para el asesor |
| 3.11 | Integrar Google Sheets API | ⬜ | |
| 3.12 | Implementar cache local en tabla `configuracion` | ⬜ | TTL 5 minutos |
| 3.13 | Implementar detección de contactos recurrentes | ⬜ | Búsqueda por teléfono |

---

## Fase 4 — Acciones del Asesor (Flujo Completo)

**Objetivo:** El flujo completo funciona de punta a punta (WhatsApp → panel → WhatsApp).
**Duración estimada:** 2–3 semanas
**Dependencia:** Fase 3 completada

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 4.1 | Integrar Callbell Messages API | ⬜ | Envío de mensajes |
| 4.2 | Implementar endpoint `POST /api/casos/:id/enviar` | ⬜ | |
| 4.3 | Implementar flujo de confirmación de turno | ⬜ | Panel → API → WhatsApp |
| 4.4 | Implementar endpoint `POST /api/casos/:id/llamada` | ⬜ | |
| 4.5 | Implementar endpoint `POST /api/casos/:id/cerrar` | ⬜ | |
| 4.6 | Implementar derivación a Chiclana con notificación | ⬜ | WhatsApp automático |
| 4.7 | Implementar registro de llamadas | ⬜ | |
| 4.8 | Implementar cierre de conversación en Callbell | ⬜ | API call |
| 4.9 | Implementar respuesta automática para prácticas no disponibles | ⬜ | |
| 4.10 | Implementar manejo de errores y retry en envíos | ⬜ | Cola de reintentos |

---

## Fase 5 — Seguimiento y Métricas

**Objetivo:** Visibilidad total del pipeline de consultas.
**Duración estimada:** 2 semanas
**Dependencia:** Fase 4 (puede solaparse parcialmente)

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 5.1 | Implementar sistema de notas internas con fecha de seguimiento | ⬜ | |
| 5.2 | Implementar vista de seguimientos pendientes del día | ⬜ | |
| 5.3 | Implementar reconocimiento de contactos recurrentes | ⬜ | Historial por teléfono |
| 5.4 | Implementar tablero de métricas operativas | ⬜ | KPIs, gráficos |
| 5.5 | Implementar historial completo por caso | ⬜ | Timeline de eventos |
| 5.6 | Implementar exportación de datos básica (CSV) | ⬜ | |
| 5.7 | Implementar endpoint `GET /api/metricas` | ⬜ | Admin only |
| 5.8 | Pruebas de carga y estabilidad | ⬜ | |

---

## Otros — Migraciones, Hallazgos y Mejoras

| # | Descripción | Estado | Notas |
|---|---|---|---|
| 014 | Migración: agregar orden_tipo a extracciones_ia | ✅ | TEXT + CHECK: imagen, pdf, misrx_link, no_aplica |
| — | Hallazgo MisRx — órdenes digitales | ✅ | Detectado por Franco, documentado en MASTER_CONTEXT |
| — | Respond-first pattern en webhook | ✅ | 200 inmediato, .then/.catch en background |

---

## Resumen de Progreso

| Fase | Total Tareas | ✅ Completas | 🔄 En progreso | ⬜ Pendientes | % Avance |
|---|---|---|---|---|---|
| **Fase 0** — Documentación | 23 | 23 | 0 | 0 | **100%** |
| **Fase 1** — Panel estático | 20 | 19 | 0 | 1 | **95%** |
| **Fase 1.5** — Refactor QA | 10 | 10 | 0 | 0 | **100%** |
| **Fase 2.1** — Supabase Auth | 12 | 12 | 0 | 0 | **100%** |
| **Fase 2.2** — Backend + Webhook | 10 | 10 | 0 | 0 | **100%** |
| **Fase 2.3** — Realtime + REST | 5 | 0 | 0 | 5 | **0%** |
| **Fase 3** — Claude IA | 13 | 0 | 0 | 13 | **0%** |
| **Fase 4** — Acciones asesor | 10 | 0 | 0 | 10 | **0%** |
| **Fase 5** — Métricas | 8 | 0 | 0 | 8 | **0%** |
| **Total general** | **114** | **77** | **0** | **37** | **~68%** |

---

## Notas Importantes

- **Fase 2.2 completada:** Webhook de Callbell funcional (sin IA, placeholders)
- **Próximo paso:** Fase 2.3 — Endpoints REST de casos + Realtime en frontend
- **MisRx:** Nuevo hallazgo documentado. Migración 014 creada. El webhook ya detecta links de MisRx y setea orden_tipo.
- **Para deploy:** Configurar variables de entorno en Vercel (CALLBELL_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- **Commits frecuentes** con mensajes descriptivos siguiendo conventional commits

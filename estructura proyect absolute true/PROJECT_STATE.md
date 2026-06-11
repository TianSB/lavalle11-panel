# PROJECT STATE — Panel de Gestión de Turnos con IA

> **Instituto Lavalle 11 · Bahía Blanca, Argentina**
> Última actualización: 2026-06-10
> 🚀 **HITO: Base de datos desplegada en Supabase — 13 migraciones ejecutadas, 10 tablas operativas, RLS activo**

---

## 1. Identidad del Proyecto

| Campo | Valor |
|---|---|
| Nombre | Panel de Gestión de Turnos con IA — Lavalle 11 |
| Propósito | Capa inteligente entre Callbell CRM y asesores humanos para gestionar turnos médicos |
| Cliente | Instituto Lavalle 11 / Gamma Laboratorios |
| Autor PRD | RIA · r-ia.vercel.app |
| Stack | React + Vite + Tailwind / Node.js Serverless / Supabase + Auth / Claude API / Callbell API |
| Repositorio | (por definir) |

## 2. Fase Actual

**Hito completado:** 🚀 **Infraestructura Base = ✅ COMPLETADA**
_13 migraciones ejecutadas · 10 tablas visibles · RLS desplegado · Consultas SELECT validadas_

**Siguiente fase:** 🔜 **FASE 2.1 — Supabase Auth** (conectar login real a la base de datos desplegada: configurar .env.local con credenciales reales, crear usuarios, verificar login end-to-end)

> **Decisión de prioridad:** Supabase (proyecto + migraciones) → ✅ COMPLETADO → Auth (conectar a DB real) → Realtime → Callbell webhook → IA (Fase 3).

**Historial de fases:**
- ✅ Fase 0 — Definición y estructura documental (91%)
- ✅ **Fase 1 — Panel estático** (100%)
- ✅ **Fase 1.5 — Refactor QA** (100%)
- ✅ **Fase 2.1 — Supabase Auth (cliente mock)** (100%)
- ✅ **Diseño AI Architecture** (100%)
- ✅ **Auditoría PostgreSQL — 5 correcciones aplicadas** (100%)
- 🚀 **✅ Infraestructura Base — Migraciones ejecutadas, 10 tablas, RLS activo** (100%)
- 🔜 Fase 2.1 — Supabase Auth (conectar a DB real)
- ⬜ Fase 2.2 — SupabaseApiService
- ⬜ Fase 3 — Análisis con Claude IA
- ⬜ Fase 4 — Acciones del asesor
- ⬜ Fase 5 — Seguimiento y métricas

Ver [TODO.md](./TODO.md) para detalle de tareas pendientes.
Ver [planning/roadmap.md](./planning/roadmap.md) para el roadmap completo.

## 3. Resumen Ejecutivo

El Instituto Lavalle 11 recibe 40–80 mensajes/día por WhatsApp para gestionar turnos de diagnóstico por imágenes. Actualmente el proceso es 100% manual: asesores leen chats, interpretan órdenes médicas manuscritas, verifican coberturas y registran turnos en el RIS. Con solo ~1.5 FTE operativos, se genera un cuello de botella significativo.

El sistema propuesto interpone una capa de IA (Claude API) que analiza automáticamente cada conversación entrante, extrae datos estructurados, y presenta cada caso como una card en un panel web. El asesor solo confirma la decisión final y el sistema envía la respuesta de vuelta a WhatsApp.

**Fase 1 completada —** Frontend mock funcional con 29 archivos fuente, 12 componentes, 12 casos mock (tipos A–K), login, cola de cards con filtros, modal de resolución con vista previa en vivo, y dashboard de métricas.

**Fase 1.5 completada —** Refactor completo de CaseModal en 8 sub-componentes, capa de servicios abstracta (CasoService + mock), hooks (useCasos, useCasosPorAsesor, useMetricas), utilidades de fecha compartidas (utils/dates.ts), 6 bugs QA corregidos, Sidebar interactiva, confirmación de cierre de caso. Compilación TypeScript sin errores.

**Fase 2.1 completada —** Login real con Supabase Auth. Se instaló `@supabase/supabase-js`, se creó el cliente Supabase con validación de environment variables, y se refactorizó `AuthContext.tsx` para usar `signInWithPassword()`/`signOut()` en lugar de credenciales mock. Sesión persistente al recargar la página vía `getSession()`. Listener `onAuthStateChange` para cambios de autenticación en tiempo real. Perfil de usuario sincronizado desde `public.usuarios`. Loading screen durante restauración de sesión. Sin cambios visuales en la UI.

**Diseño AI Provider Architecture completado —** Se diseñó una arquitectura completa y desacoplada de proveedores de IA que soporta Claude, GPT, Gemini, DeepSeek y futuros modelos sin modificar frontend, base de datos, webhook Callbell, ni lógica de negocio. El documento incluye 7 diagramas Mermaid, 12 secciones, interfaces canónicas de entrada/salida, Provider Pattern con adapters, Factory Pattern con registry, flujo de análisis en 4 fases, manejo de errores con 10 códigos categorizados, estrategia de fallback con 4 modalidades, y 20+ variables de entorno documentadas. El diseño fue auditado y aprobado con 6 observaciones clasificadas (3 mandatory para v1, 1 recommended para v1.1, 2 backlog futuro).

**Auditoría PostgreSQL aplicada —** Se auditaron las 13 migraciones SQL y se corrigieron 5 hallazgos: 1 error crítico (comparación defectuosa en trigger de auditoría), 4 riesgos (trigger faltante para UPDATE en auth.users, CHECK faltante en confianza_global, DATABASE_SCHEMA.md desactualizado, constraint mal nombrada). Ningún error crítico remanente.

**🚀 Infraestructura Base completada —** Las 13 migraciones SQL (001_enums → 013_rls) fueron ejecutadas exitosamente en Supabase: 10 tablas visibles, RLS desplegado con 10 políticas, consultas SELECT validadas en cada tabla. Base de datos operativa y lista para recibir datos reales.

## 4. Documentación Disponible

| Documento | Ubicación | Estado |
|---|---|---|
| PRD original | `PRD_Lavalle11_v1.docx` | ✅ Finalizado |
| PRD en Markdown | `core/PRD.md` | ✅ Generado |
| Arquitectura | `ARCHITECTURE.md` | ✅ Generado (+ 12 diagramas Mermaid) |
| Decisiones técnicas | `DECISIONS.md` | ✅ 8 ADRs registrados |
| Plan de trabajo | `TODO.md` | ✅ 109 tareas, 77 completadas (71%) |
| Registro de sesiones | `SESSION_LOG.md` | ✅ 7 sesiones registradas |
| Requerimientos | `core/requirements.md` | ✅ Generado |
| Casos de uso | `core/use-cases.md` | ✅ Generado |
| Reglas de negocio | `core/business-rules.md` | ✅ Generado |
| Roadmap | `planning/roadmap.md` | ✅ Generado |
| ADRs | `decisions/` | ✅ Template listo |
| Database schema | `database/DATABASE_SCHEMA.md` | ✅ 9 tablas, 22 ENUMs, migraciones SQL listas |
| API Spec | `backend/API_SPEC.md` | ✅ 23 endpoints |
| UI Spec | `frontend/UI_SPEC.md` | ✅ 7 pantallas, 13 secciones |
| MASTER_CONTEXT | `MASTER_CONTEXT.md` | ✅ Contexto rápido para IA |
| WORKFLOW | `docs/core/WORKFLOW.md` | ✅ 8 pasos para sesiones |
| Migraciones SQL | `database/migrations/` | ✅ 13 archivos (ENUMs, tablas, índices, RLS) |
| **AI Provider Architecture** | **`docs/core/AI_PROVIDER_ARCHITECTURE.md`** | **✅ Aprobado — 12 secciones, 7 diagramas, 6 obs. auditadas** |

## 5. Stack Tecnológico Confirmado

| Componente | Tecnología | Estado |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 + TypeScript estricto | ✅ **Implementado + Refactorizado** |
| Backend | Node.js (Vercel Serverless Functions) | ⬜ Pendiente (Fase 2) |
| Base de datos | Supabase (PostgreSQL + Realtime + Auth) | ✅ **Desplegada — 13 migraciones, 10 tablas, RLS activo** |
| Auth | Supabase Auth (@supabase/supabase-js v2.108.1) | 🟡 **Cliente listo — pendiente conectar a DB real** |
| IA | Provider-agnostic (Claude, GPT, Gemini, DeepSeek) | ✅ **Arquitectura diseñada y aprobada — pendiente implementación** |
| CRM | Callbell API (webhooks + Messages API) | ⬜ Pendiente (Fase 2) |
| Config | Google Sheets API | ⬜ Pendiente (Fase 3) |
| Repositorio | GitHub | ⬜ Pendiente de crear |

## 6. Variables de Entorno Requeridas

```env
# Vercel / Backend
ANTHROPIC_API_KEY=
CALLBELL_API_KEY=
CALLBELL_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_SHEETS_API_KEY=
GOOGLE_SHEETS_ID=
OPENAI_API_KEY=             # Nuevo — para fallback GPT
GEMINI_API_KEY=              # Nuevo — para fallback Gemini
DEEPSEEK_API_KEY=            # Nuevo — para fallback DeepSeek
PRIMARY_PROVIDER=claude      # Nuevo — proveedor IA activo
FALLBACK_PROVIDER=gpt        # Nuevo — proveedor IA de respaldo

# Frontend (Vite)
VITE_SUPABASE_URL=          # ✅ Configurada en cliente (placeholder)
VITE_SUPABASE_ANON_KEY=     # ✅ Configurada en cliente (placeholder)
```

## 7. Equipo

| Rol | Nombre | Contacto |
|---|---|---|
| Referente operativo (Admin) | Franco Berardi | — |
| Asesor | Brenda Gandolfi | — |
| Asesor | Catalina Herold | — |
| Asesor | Macarena Abdala | — |

## 8. Resultados de Fase 1.5 — Refactor y Corrección QA

**5 bugs QA corregidos de 6 detectados** (1 pendiente por baja prioridad) + 1 bug adicional descubierto y corregido durante el refactor:

| # | Bug | Severidad | Estado | Fix |
|---|---|---|---|---|
| B01 | `contact_name.split(" ")[0]` undefined en preview | 🟡 Media | ✅ Corregido | `getFirstName()` con fallback al nombre completo |
| B02 | Sidebar tipos sin onClick (cursor pointer engañoso) | 🟢 Baja | ✅ Corregido | `onFilterByTipo` callback conectado a filtro |
| B03 | `asesorEmail` muerto en HeaderProps | 🟢 Baja | ✅ Corregido | Eliminado de interfaz |
| B04 | Sin confirmación al cerrar caso | 🟡 Media | ✅ Corregido | Modal de confirmación con Cancelar/Cerrar |
| B05 | CaseModal 302 líneas (demasiado grande) | 🟡 Media | ✅ Corregido | Refactor en 8 sub-componentes (~120 líneas) |
| B06 | Toast singleton (StrictMode) | 🟢 Baja | ⬜ Pendiente | Baja prioridad, no afecta funcionalidad |
| C01 | `prevCasoId` con useMemo nunca reseteaba estado | 🟡 Media | ✅ Corregido | Reemplazado con useRef (descubierto durante refactor) |

**12 archivos nuevos creados:**
- `src/utils/dates.ts` — 5 funciones de fecha
- `src/services/mockService.ts` — Interfaz CasoService + implementación mock
- `src/hooks/useCasos.ts` — 3 hooks (useCasos, useCasosPorAsesor, useMetricas)
- `src/components/modal/` — 8 sub-componentes extraídos (Field, ResumenIA, SelectorSede, SelectorFecha, SelectorHora, ListaInstrucciones, VistaPreviaMensaje, FormSeguimiento)

**6 archivos modificados:**
- `CaseModal.tsx` — De 302 a 120 líneas, `useRef` en lugar de `useMemo`
- `mockCases.ts` — `TIPOS_CASO` tipado a `Record<TipoCaso, string>`
- `Header.tsx` — `asesorEmail` eliminado
- `AppLayout.tsx` — `asesorEmail` eliminado, `onFilterByTipo` agregado
- `Sidebar.tsx` — Items de tipo invocan `onFilterByTipo`
- `DashboardPage.tsx` — Filtro por tipo conectado desde Sidebar

## 9. Resultados de Fase 2.1 — Supabase Auth

**Objetivo:** Reemplazar autenticación mock por login real con Supabase Auth. Mantener UI existente.

| # | Tarea | Estado | Archivo |
|---|---|---|---|
| A01 | Instalar @supabase/supabase-js | ✅ | `package.json` |
| A02 | Crear cliente Supabase desde env vars | ✅ | `src/lib/supabase.ts` |
| A03 | Configurar env vars (placeholder + .gitignore) | ✅ | `.env.local`, `.gitignore` |
| A04 | Refactorizar AuthContext — login real | ✅ | `src/context/AuthContext.tsx` |
| A05 | Refactorizar AuthContext — logout real | ✅ | `src/context/AuthContext.tsx` |
| A06 | Refactorizar AuthContext — session persistence | ✅ | `src/context/AuthContext.tsx` |
| A07 | Refactorizar AuthContext — roles desde perfil | ✅ | `src/context/AuthContext.tsx` |
| A08 | Actualizar LoginPage — remover mock credentials | ✅ | `src/pages/LoginPage.tsx` |
| A09 | Agregar LoadingScreen — evitar flash de login | ✅ | `src/App.tsx` |
| A10 | Compilación TypeScript exitosa (0 errores) | ✅ | `npx tsc -b --noEmit` |

**Detalle de implementación:**

| Aspecto | Mock (antes) | Supabase (después) |
|---|---|---|
| Login | `new Promise(r => setTimeout(r, 800))` + hardcoded | `supabase.auth.signInWithPassword({ email, password })` |
| Logout | `setUser(null)` | `supabase.auth.signOut()` + `setUser(null)` |
| Sesión | Se pierde al recargar | `supabase.auth.getSession()` al montar + `onAuthStateChange` |
| Roles | Hardcoded en mock | Mapeo desde `public.usuarios.rol` |
| Perfil | `USUARIO_ACTUAL` / `ADMIN_USUARIO` | Fetch desde `public.usuarios` por `auth.uid()` |
| Errores | Solo "Credenciales inválidas" | Invalid login, Email not confirmed, User not found |
| Loading | `isLoading = false` inicial | `isLoading = true` → se restaura sesión → false |
| Edge case | — | Usuario autenticado en Supabase pero sin perfil en DB → error |

**Decisiones técnicas:**
- `fetchUserProfile()` definida fuera del componente para evitar violar reglas de hooks con `useCallback`
- El cliente Supabase valida env vars al importarse (`throw` si faltan) — fail fast
- `.env.local` ignorado vía `.gitignore` para evitar credenciales en el repo
- El hook `useEffect` retorna `subscription.unsubscribe()` para cleanup correcto
- Se usa `_event` (prefix underscore) en `onAuthStateChange` para cumplir con `noUnusedParameters`

## 10. Resultados de Diseño AI_PROVIDER_ARCHITECTURE.md

| # | Tarea | Estado |
|---|---|---|
| D01 | Definir principios de diseño (7 principios P-01 a P-07) | ✅ |
| D02 | Diseñar arquitectura general con 6 capas + diagrama | ✅ |
| D03 | Definir interfaces canónicas (EntradaCanonica, RespuestaCanonica, AIProvider) | ✅ |
| D04 | Diseñar Provider Pattern con 4 adapters (Claude, GPT, Gemini, DeepSeek) + MockProvider | ✅ |
| D05 | Diseñar Factory Pattern con registry y selección por env var | ✅ |
| D06 | Definir flujo completo de análisis en 4 fases + secuencia | ✅ |
| D07 | Catalogar 10 códigos de error con estrategia de reintentos | ✅ |
| D08 | Definir 4 modalidades de fallback + árbol de decisión | ✅ |
| D09 | Documentar 20+ variables de entorno por entorno | ✅ |
| D10 | Definir estrategia de cambio de proveedor en producción | ✅ |
| D11 | Definir pirámide de testing + MockProvider + fixtures + test de contrato | ✅ |
| D12 | Generar 7 diagramas Mermaid | ✅ |
| D13 | Auditoría de diseño (6 observaciones clasificadas) | ✅ |
| D14 | Aprobación del documento | ✅ |

**Clasificación de observaciones de auditoría:**

| # | Observación | Prioridad |
|---|---|---|
| O-01 | Procesamiento detallado de imágenes/adjuntos pre-adapter | 🟥 **v1 mandatory** |
| O-02 | Estimación de tokens pre-llamada | 🟥 **v1 mandatory** |
| O-03 | Structured output nativo por proveedor | 🟥 **v1 mandatory** |
| O-04 | Circuit breaker / rate limiter compartido | 🟧 **v1.1 recommended** |
| O-05 | Caché de respuestas idénticas | 🟩 Backlog futuro |
| O-06 | AdjuntoAnalisis.base64 optimización en Vercel Serverless | 🟩 Backlog futuro |

## 11. Riesgos Activos

| # | Riesgo | Severidad | Mitigación | Estado |
|---|---|---|---|---|
| R01 | Precisión de Claude en órdenes manuscritas | 🔴 Alta | Score de confianza por campo + feedback loop. Arquitectura permite cambiar de proveedor sin modificar el sistema | 🟡 Mitigado |
| R02 | CaseModal demasiado grande | 🟡 Media | ✅ **Resuelto** — Refactor en 8 sub-componentes | ✅ Resuelto |
| R03 | Costo impredecible de Claude API | 🟡 Media | `MAX_COST_PER_CALL_USD` configurable + fallback a modelos baratos (haiku, gpt-4o-mini, deepseek) | 🟡 Mitigado |
| R04 | Migración mock → Supabase abrupta | 🟡 Media | Hook `useCasos()` + `CasoService` listo para swap | 🟡 Mitigado |
| R05 | Adopción del equipo asesor | 🔴 Alta | Fase 1 con datos mock para validar UX | ⬜ Pendiente |
| R06 | Webhooks duplicados de Callbell | 🟡 Media | Idempotencia por UUID + message_id | ⬜ Pendiente |
| R07 | Perfil de usuario no sincronizado en `public.usuarios` | 🟡 Media | Error message en login: "Usuario no encontrado en la base de datos" | 🟡 Mitigado |
| R08 | Vendor lock-in con Claude API | 🟡 Media | **Mitigado** — AI Provider Architecture permite swap sin cambiar código de negocio | 🟡 Mitigado |
| R09 | Trigger auditoría detecta cambios falsos (CR-01) | 🟡 Media | ✅ **Resuelto** — Comparación corregida en `010_auditoria_eventos.sql` | ✅ Resuelto |
| R10 | Perfil desactualizado si cambia email en Auth (R-01) | 🟢 Baja | ✅ **Resuelto** — Trigger UPDATE agregado en `002_usuarios.sql` | ✅ Resuelto |

## 12. Próximos Pasos Inmediatos

1. ✅ **Fase 1 completada** — Frontend mock funcional
2. ✅ **Fase 1.5 completada** — Refactor, service layer, hooks, bugs corregidos
3. ✅ **Fase 2.1 completada** — Supabase Auth (cliente mock, session, roles)
4. ✅ **Diseño AI Provider Architecture aprobado** — Arquitectura desacoplada de proveedores IA
5. ✅ **Auditoría PostgreSQL aplicada** — 5 correcciones en migraciones SQL
6. 🚀 **✅ Infraestructura Base** — 13 migraciones ejecutadas, 10 tablas, RLS activo
7. ⬜ **🎯 FASE 2.1 — Supabase Auth (conectar a DB real)** — Configurar .env.local con credenciales reales
8. ⬜ Crear usuarios en Supabase Auth (Franco, Brenda, Catalina, Macarena)
9. ⬜ Inicializar repositorio Git + GitHub (`lavalle11-panel`)
10. ⬜ **Fase 2.2:** SupabaseApiService + conectar hooks
11. ⬜ **Fase 2.3:** Endpoint webhook Callbell + Realtime

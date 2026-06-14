# MASTER CONTEXT — Panel de Gestión de Turnos con IA

> Copiar al inicio de cualquier conversación para recuperar contexto inmediato.
> **Última actualización:** 2026-06-11
> 🚀 **HITO: RBAC Decoupling completado. UI desacoplada de roles — solo permisos. 98/128 tareas (77%)**

---

## Resumen Ejecutivo

Instituto Lavalle 11 es un centro de diagnóstico por imágenes en Bahía Blanca (Argentina) con dos sedes: Lavalle 11 (estudios generales) y Chiclana 385 (Medicina Nuclear). Reciben **40–80 mensajes/día** por WhatsApp para gestionar turnos. El proceso actual es **100% manual** con solo **~1.5 asesores operativos**, generando cuellos de botella, casos perdidos y llamadas sin registro desde celulares personales.

El proyecto construye un **panel web inteligente** que se interpone entre Callbell CRM y los asesores: cada mensaje entrante es analizado por **IA (provider-agnostic)** que extrae práctica, obra social, datos del paciente y flags de preparación; el caso aparece como card en el panel con todo pre-procesado; el asesor solo confirma fecha/hora y el sistema envía la respuesta a WhatsApp automáticamente.

✅ **Fase 1, 1.5, 2.1 completadas.** Database Schema ✅, SQL Migrations ✅ (auditadas y corregidas), AI Architecture ✅ (auditada y aprobada). 🚀 **Infraestructura Base ✅. FASE 2.1 ✅. FASE 2.2 COMPLETA (7/7) ✅. Auth Hardening (S12) ✅. 🧹 Role Source Cleanup (S13) ✅. 🔐 RBAC Decoupling (S14) ✅.** UI desacoplada de roles — solo permisos. 🎯 **Próximo: Fase 2.3 — Callbell webhook + Realtime.**

---

## Objetivos

1. **Automatizar el análisis** de cada conversación entrante de Callbell — texto e imágenes — extrayendo información estructurada vía IA
2. **Centralizar la gestión** de turnos en un panel web donde cada caso llega pre-procesado y listo para resolver en segundos
3. **Ejecutar respuestas automáticas** desde el panel hacia WhatsApp, cerrando el ciclo completo sin salir del sistema
4. **Eliminar casos perdidos** mediante trazabilidad total, seguimientos programados y visibilidad del pipeline
5. **Reducir la carga operativa** automatizando tareas repetitivas (clasificación, extracción de datos, resolución Tipo B)

---

## Stack Tecnológico

| Capa | Tecnología | Estado |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 + TypeScript estricto | ✅ **Implementado + Refactorizado** |
| Backend | Node.js 20 (Vercel Serverless Functions) | ⬜ Pendiente (Fase 2) |
| Base de datos | Supabase (PostgreSQL + Realtime + Auth) | ✅ **Desplegada — 13 migraciones, 10 tablas, RLS activo** |
| Auth | Supabase Auth (@supabase/supabase-js v2.108.1) | ✅ **Login real — .env.local configurado, end-to-end validado** |
| IA | Provider-agnostic (Claude, GPT, Gemini, DeepSeek) | ✅ **Arquitectura diseñada, auditada y aprobada** |
| CRM | Callbell API (webhooks + Messages API) | ⬜ Pendiente (post-Fase 2) |
| Config | Google Sheets API | ⬜ Pendiente (Fase 3) |
| Hosting | Vercel | ⬜ Pendiente |

---

## Estado Actual

| Hito | Progreso | Detalle |
|---|---|---|
| Fase 0 — Documentación | ✅ **91%** | 19/21 archivos, incluye AI_PROVIDER_ARCHITECTURE.md |
| **Fase 1 — Panel estático** | ✅ **100%** | 12/12 tareas. Frontend mock funcional |
| **Fase 1.5 — Refactor QA** | ✅ **100%** | 10/10 tareas. Service layer, hooks, bugs corregidos |
| **Fase 2.1 — Supabase Auth** | ✅ **100%** | 12/12 tareas. Login real con Supabase Auth |
| **AI Architecture** | ✅ **100%** | 14/14 tareas. Diseño aprobado con auditoría |
| **Auditoría PostgreSQL** | ✅ **100%** | 5/5 correcciones aplicadas (CR-01, R-01 a R-04) |
| Fase 2 — Backend + Webhook | ⏳ | Pendiente — primero Auth (conectar a DB real) |
| Fase 3 — Análisis con IA | ⬜ | Sin Claude Adapter hasta completar Fase 2 |
| Fase 4 — Acciones asesor | ⬜ | Post-Fase 3 |
| Fase 5 — Métricas | ⬜ | Post-Fase 4 |
| 🚀 **Infraestructura Base** | ✅ **100%** | **10/10 migraciones ejecutadas en Supabase** |
| 🔜 **FASE 2.1 — Auth (DB real)** | ✅ **100%** | **Auth validado. Env vars configuradas. Git/GitHub conectado** |
| 🚀 **✅ FASE 2.2 — SupabaseApiService** | ✅ **100%** | **7/7 tareas: SS-01 a SS-07 completadas. Sistema migrado de mocks a datos reales** |
| 🔐 **Auth Hardening (S12)** | ✅ **100%** | **4/4 tareas AH-01 a AH-04. Race condition eliminada. Trigger corregido** |
| 🧹 **Role Source Cleanup (S13)** | ✅ **100%** | **3/3 tareas RC-01 a RC-03. Metadata limpia. DB es única fuente de verdad** |
| 🔐 **RBAC Decoupling (S14)** | ✅ **100%** | **6/6 tareas RBAC-01 a RBAC-06. UI solo consulta permisos. module-level store** |
| **Progreso total** | **77%** | **98/128 tareas completadas** |

---

## Decisiones Clave (ADRs + Acuerdos de Sesión)

1. **Stack:** React + Vite + Tailwind / Node.js Serverless / Supabase / IA provider-agnostic
2. **Lenguaje:** **TypeScript estricto obligatorio** en todo el código
3. **IA:** Arquitectura desacoplada (Adapter Pattern) — Claude, GPT, Gemini, DeepSeek intercambiables sin modificar código de negocio
4. **DB:** Supabase unificado (PostgreSQL + Realtime + Auth). Schema: 9 tablas, 22 ENUMs, 13 migraciones SQL
5. **Config:** Google Sheets API con cache local TTL 5 min en Supabase
6. **Despliegue:** Vercel + GitHub monorepo con preview deployments por PR
7. **RIS:** Sin integración con IT SOS en v1 — el asesor registra manualmente
8. **NO implementar Claude Adapter todavía** — priorizar Supabase, migraciones, Auth, Realtime y Callbell antes que IA
9. ✅ **Orden de prioridad cumplido:** 🚀 Supabase ✅ → Auth ✅ → FASE 2.2 ✅ → Auth Hardening ✅ → **🎯 Fase 2.3 (Realtime/Callbell)**
10. ✅ **FASE 2.1 completada** — Auth real validado
11. 🚀 **✅ FASE 2.2 COMPLETA (7/7, 100%)** — Sistema migrado de mocks a datos reales
12. 🔐 **✅ Auth Hardening (S12)** — Race condition eliminada. Trigger fix: rol nunca más se revierte
13. 🧹 **✅ Role Source Cleanup (S13)** — `rol` eliminado de metadata. DB es única fuente de verdad
14. 🔐 **✅ RBAC Decoupling (S14)** — `can(permission)` sin role param. Module-level store. `setRbacRole()`. `asesorRol` eliminado de props de Header, AppLayout, DashboardPage
15. 🎯 **Próximo hito:** **Fase 2.3 — Callbell webhook + Realtime**

---

## Arquitectura (Resumida)

```
WhatsApp → Callbell → webhook → Vercel → Factory IA → Adapter → Supabase → Panel (Realtime)
   ▲                                                                              │
   └────────────────── Callbell API ←────── Vercel ←──────────────────────────────┘
```

**AI Provider Architecture:** Capa de abstracción completa con `AIProvider` interface, `AnalisisService`, `Factory` con registry, 4 adapters (Claude, GPT, Gemini, DeepSeek), `MockProvider`, fallback automático, 10 códigos de error, y 7 diagramas Mermaid documentados en `docs/core/AI_PROVIDER_ARCHITECTURE.md`.

**Supabase Auth:** Login real con `signInWithPassword()`, sesión persistente (`getSession` + `onAuthStateChange`), roles desde `public.usuarios.rol`, LoadingScreen durante restauración de sesión.

**11 tipos de caso (A–K):** Desde turno con orden (A) hasta contacto equivocado (K). Tipo B (radiografías, panorámicas, CBCT) se resuelven automáticamente sin intervención humana.

---

## Reglas de Negocio Críticas

- **Token IOMA** obligatorio en confirmaciones para pacientes de IOMA
- **Radiografías de traumatólogos** sin informe escrito
- **Precios y coberturas** desde Google Sheets con vigencia mensual
- **Derivación a Chiclana** para Medicina Nuclear con notificación automática
- **7 prácticas no realizadas** respondidas automáticamente (RM, histerosalpingografía, etc.)
- **Seguimiento obligatorio** para casos Tipo H (punción/biopsia)

---

## Riesgos Activos

| Riesgo | Mitigación | Estado |
|---|---|---|
| Precisión de IA en manuscritos | Score de confianza por campo, resaltar <0.7, arquitectura permite swap de proveedor | 🟡 Mitigado |
| ~~CaseModal 302 líneas~~ | ~~Refactor en 8 sub-componentes~~ | ✅ **Resuelto** |
| Migración mock → Supabase | Hook `useCasos()` + `CasoService` listo para swap | 🟡 Mitigado |
| Costo de IA | `MAX_COST_PER_CALL_USD` configurable + fallback a modelos baratos | 🟡 Mitigado |
| Webhooks duplicados | Idempotencia por `callbell_conversation_uuid` + `message_id` en migraciones SQL | ⬜ Pendiente |
| Perfil no sincronizado en `public.usuarios` | Error message en login, trigger UPDATE en auth.users, MUESTRA error en UI | 🟡 Mitigado |
| Vendor lock-in IA | **Arquitectura provider-agnostic diseñada y aprobada** | 🟡 Mitigado |
| Trigger auditoría cambiaba campos falsos | ✅ **Resuelto** — Comparación corregida en `010_auditoria_eventos.sql` | ✅ **Resuelto** |
| Trigger `sync_usuario_from_auth()` revertía rol en cada login | ✅ **Resuelto S12** — Eliminado `rol = EXCLUDED.rol`. `user_metadata` actualizado | ✅ **Resuelto** |
| Race condition en `onAuthStateChange` | ✅ **Resuelto S12** — `handleAuthEvent()` con `getUser()` + `hydratingRef` | ✅ **Resuelto** |
| Duplicación de rol: metadata vs DB | ✅ **Resuelto S13** — `rol` eliminado de `user_metadata`. DB es única fuente. Warning log | ✅ **Resuelto** |

## Hallazgo nuevo — Órdenes digitales MisRx (2026-06-10)

Franco informa que algunas órdenes médicas llegan como links de la 
plataforma MisRx (receta electrónica digital, homologada por múltiples 
obras sociales bajo Decreto 345/2024).

Formato del link: https://misrx.com.ar/prestacion?token=<uuid>

**Comportamiento en v1:**
- El sistema detecta el patrón `misrx.com.ar/prestacion` en el texto 
  del mensaje
- Crea la card con flag `orden_digital_misrx`
- Muestra el link como botón en el modal: "Abrir orden digital"
- El asesor abre el link manualmente en el navegador y completa los 
  campos si es necesario
- NO se intenta extracción automática del contenido

**Impacto en modelo de datos:**
- Agregar campo `orden_tipo` en tabla `extraccion_ia` con enum: 
  imagen | pdf | misrx_link | no_aplica
- Campo `orden_url` ya existe — almacena el link de MisRx tal cual

**Pendiente investigar:**
- ¿Tiene MisRx API pública para consultar prescripciones por token?
- Si existe: integración directa en Fase 3 o posterior
- Si no existe: evaluar Puppeteer/Playwright como mejora futura (v2)

---

## Auditorías Completadas

### AI Provider Architecture (Sesión 5)
- ✅ Documento de 12 secciones + 7 diagramas Mermaid
- ✅ Interfaces: `EntradaCanonica`, `RespuestaCanonica`, `AIProvider`
- ✅ 4 adapters + MockProvider + Factory con Registry
- ✅ 10 códigos de error, 4 modalidades de fallback, 20+ env vars
- ✅ **6 observaciones clasificadas:**
  - 🟥 **v1 mandatory (3):** O-01 imágenes, O-02 tokens, O-03 structured output nativo
  - 🟧 **v1.1 recommended (1):** O-04 circuit breaker
  - 🟩 **Backlog futuro (2):** O-05 caché, O-06 optimización Vercel

### Migraciones SQL (Sesión 6)
- ✅ 13 archivos auditados (001_enums → 013_rls)
- ✅ **5 hallazgos corregidos:**
  - 🔴 **CR-01:** Comparación `val::text` defectuosa en trigger auditoría → corregido
  - 🟡 **R-01:** Faltaba trigger UPDATE en auth.users → agregado + ON CONFLICT expandido
  - 🟡 **R-02:** Faltaba CHECK en `confianza_global` → `chk_extracciones_confianza`
  - 🟡 **R-03:** DATABASE_SCHEMA.md desactualizado → sección 16 corregida
  - 🟡 **R-04:** Constraint `callbell_uuid` mal nombrada → renombrada
- ✅ **0 errores críticos remanentes**

---

## Próximos Pasos (Priorizados)

1. 🚀 **✅ Infraestructura Base** — Migraciones 001–013 ejecutadas
2. ✅ **FASE 2.1** — .env.local, login validado, GitHub conectado
3. 🚀 **✅ FASE 2.2 COMPLETA (7/7)** — Sistema migrado de mocks a datos reales
4. 🔐 **✅ Auth Hardening + Trigger Fix (S12)** — Race condition eliminada. Rol nunca más se revierte
5. 🧹 **✅ Role Source Cleanup (S13)** — Metadata limpia. DB es única fuente de verdad
6. 🔐 **✅ RBAC Decoupling (S14)** — `can(permission)` sin role param. Module-level store
7. 🎯 **⬜ Fase 2.3:** Endpoint webhook Callbell + Realtime
7. ⬜ **Fase 3:** Implementar ClaudeAdapter (con O-01, O-02, O-03 mandatory)

---

## Documentación Rápida

| Archivo | Contenido |
|---|---|
| `PROJECT_STATE.md` | Estado completo del proyecto (128 tareas, 98 completadas = 77%) + secciones 12-13 |
| `ARCHITECTURE.md` | Arquitectura detallada + 12 diagramas Mermaid |
| `DECISIONS.md` | 8 ADRs con justificación |
| `TODO.md` | Plan de trabajo completo con 128 tareas en 13 secciones |
| `SESSION_LOG.md` | 14 sesiones registradas |
| `docs/core/AI_PROVIDER_ARCHITECTURE.md` | Arquitectura provider-agnostic de IA (aprobada con auditoría) |
| `database/migrations/` | 13 migraciones SQL auditadas y corregidas |
| `database/DATABASE_SCHEMA.md` | 9 tablas, 22 ENUMs, esquema completo |
| `backend/API_SPEC.md` | 23 endpoints en 7 categorías |
| `frontend/UI_SPEC.md` | 7 pantallas, 13 secciones |

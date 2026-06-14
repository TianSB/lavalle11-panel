# PROJECT STATE — Panel de Gestión de Turnos con IA

> **Instituto Lavalle 11 · Bahía Blanca, Argentina**
> Documento maestro de estado del proyecto.
> **Última actualización:** 2026-06-14 (Sesión 24)
> **Versión:** 2.0 — Fase 3 completa. Claude API integrada con tool_use y visión. Reapertura de casos cerrados. ✅ Fases 0 a 3 completadas.

---

## 1. Identidad del Proyecto

| Campo | Valor |
|---|---|
| Nombre del sistema | Panel de Gestión de Turnos con IA |
| Propósito | Capa inteligente entre Callbell CRM y asesores humanos para gestionar turnos de diagnóstico por imágenes |
| Cliente | Instituto Lavalle 11 / Gamma Laboratorios |
| Ubicación | Bahía Blanca, Argentina — 2 sedes: Lavalle 11 (general) y Chiclana 385 (Medicina Nuclear) |
| Autor PRD | RIA · r-ia.vercel.app |
| Fecha PRD | Junio 2026 |
| Stack | React + Vite + Tailwind / Node.js Serverless / Supabase / Claude API / Callbell API |

---

## 2. Fase Actual

| Fase | Estado | Progreso |
|---|---|---|
| **Fase 0 — Definición y documentación** | ✅ Completada | 100% |
| **Fase 1 — Panel estático + Auth** | ✅ Completada | 100% |
| **Fase 1.5 — Refactor QA** | ✅ Completada | 100% |
| **Fase 2.1 — Supabase Auth (conectar a DB real)** | ✅ Completada | 100% |
| **Fase 2.2 — Backend + Webhook de Callbell** | ✅ **Completada** | 100% |
| **Fase 2.3 — Realtime + Endpoints REST** | ✅ **Completada** | 100% |
| **Fase 3 — Análisis con Claude IA** | ✅ **Completada** | **100%** — Provider-agnostic, tool_use, visión, mock, reapertura casos |
| Fase 4 — Acciones del asesor (flujo completo) | ⬜ Pendiente | 0% |
| Fase 5 — Seguimiento y métricas | ⬜ Pendiente | 0% |

**Siguiente paso:** Configurar `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY` en Vercel Production para activar IA real. Luego Fase 4 o mejoras de UI.

---

## 3. Resumen Ejecutivo

El Instituto Lavalle 11 recibe **40–80 mensajes por día** por WhatsApp para gestionar turnos de diagnóstico por imágenes. Actualmente:

- El flujo opera 100% manual sobre Callbell CRM
- **4 asesores registrados**, solo **~1.5 FTE** operativos frente a pantalla
- Cada caso requiere leer el chat completo, interpretar la orden médica, identificar obra social, evaluar copago, redactar respuesta y registrar en el RIS
- El bot actual **no reconoce adjuntos ni texto libre** (100% de los casos analizados)
- **Sin memoria entre sesiones** — el bot trata cada contacto como nuevo
- Llamadas desde **celulares personales** sin registro
- **Casos caídos** sin seguimiento (el peor caso: 3 contactos del mismo número en 9 meses sin resolución)

El sistema propuesto:

1. **Analiza automáticamente** cada conversación entrante de Callbell — texto e imágenes — y extrae información estructurada usando Claude API
2. **Presenta cada caso** como una card en un panel web con toda la información procesada
3. **Ejecuta las acciones** del asesor — confirmar turno, enviar mensaje, registrar llamada, derivar — enviando las respuestas de vuelta a WhatsApp

---

## 4. Stack Tecnológico Confirmado

| Componente | Tecnología | Versión | Estado |
|---|---|---|---|
| Frontend | React + Vite + Tailwind CSS | React 19 | ✅ Implementado + Refactorizado |
| Lenguaje | **TypeScript estricto** — frontend y backend | — | ✅ Confirmado |
| Backend | Node.js (Vercel Serverless Functions) | 22 LTS | ✅ **Webhook funcional. Process-first pattern. IA integrada.** |
| Base de datos | Supabase (PostgreSQL + REST + Realtime + Auth) | — | ✅ 14 migraciones ejecutadas, RLS activo, orden_tipo funcional |
| Auditoría | Sistema dual: trigger ultra-liviano + AuditService Node.js | — | ✅ **Implementado: event_hash UNIQUE, correlationId obligatorio, domain_events view** |
| Auth | Supabase Auth (@supabase/supabase-js) | v2.108.1 | ✅ Login real, logout, sesión, roles |
| IA | Claude API (Anthropic) — Provider-agnostic | `claude-sonnet-4-5` | ✅ **Integrado: adapter con tool_use, visión, buildFlags, factory singleton** |
| CRM | Callbell API (Webhooks + Messages API) | — | ✅ **Webhook funcional. Adjuntos con content_type real.** |
| Config remota | Google Sheets API | v4 | ⬜ Pendiente (puede integrarse en Fase 4) |
| Llamadas de voz | WhatsApp Desktop via wa.me/ | — | Fuera del sistema |
| Repositorio | GitHub | — | ✅ **lavalle11-panel (TianSB)** |
| Hosting | Vercel | — | ✅ **Deploy activo. Hobby plan.** |

---

## 5. Estado del Webhook (Fase 3)

### Flujo actual — COMPLETO ✅

```
WhatsApp → Callbell → Webhook Vercel → handleWebhook()
  → findByCallbellUuid() → busca caso existente por conversation_uuid
  → RAMA 1: activo → updateCasoHistorial()
  → RAMA 2: cerrado → reabrirCaso() + getAIProvider().analizarCaso() + actualizarExtraccionIA()
  → RAMA 3: no existe → getAIProvider().analizarCaso() + createCaso()
  → response 200 OK
```

### Problemas resueltos — Historial completo

| Problema | Estado | Fix |
|---|---|---|
| ERR_MODULE_NOT_FOUND | ✅ Resuelto | .js extensions en imports ESM |
| Function Runtimes invalid version | ✅ Resuelto | Eliminar bloque functions de vercel.json |
| TS2580: Cannot find name 'process' | ✅ Resuelto | Instalar @types/node |
| Parser incompatible con payload real | ✅ Resuelto | Reescritura de types.ts + payloadParser.ts |
| Vercel mata proceso (fire-and-forget) | ✅ Resuelto | try { await handleWebhook() } catch |
| Query Supabase bloqueada (CAUSA RAÍZ) | ✅ **Resuelto** | **Process-first: await handleWebhook() ANTES de res.json()** |
| global.fetch override rompía postgrest-js | ✅ Resuelto | Eliminado el override. Env vars correctas. |
| **error 23505: Caso cerrado bloquea nuevos mensajes** | ✅ **Resuelto** | **RAMA 2: reabrirCaso() + actualizarExtraccionIA()** |
| **Adjuntos sin content_type** | ✅ **Resuelto** | **CallbellAttachmentPayload + parseAttachment() biforma** |

### Variables de Entorno en Vercel

| Variable | Estado |
|---|---|
| `CALLBELL_WEBHOOK_SECRET` | ✅ Configurada (Production) |
| `SUPABASE_URL` | ✅ Configurada (Production) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configurada (Production) |
| `PRIMARY_PROVIDER` | ⬜ **Pendiente — configurar "claude"** |
| `ANTHROPIC_API_KEY` | ⬜ **Pendiente — configurar sk-ant-...** |
| `VITE_SUPABASE_URL` | ⬜ Frontend no deployado aún |
| `VITE_SUPABASE_ANON_KEY` | ⬜ Frontend no deployado aún |

---

## 6. Sistema de Auditoría Final

### Arquitectura

```
                    auditoria_eventos (append-only log)
                    ┌──────────────────────────────┐
                    │ event_source = 'db_trigger'  │ ← Telemetría técnica
                    │ event_type  = 'casos.snapshot'│
                    │ correlation_id = NULL         │
                    ├──────────────────────────────┤
                    │ event_source = 'backend'      │ ← Eventos semánticos
                    │ event_type  = 'caso.creado'   │
                    │ correlation_id = UUID v4      │
                    └──────────────────────────────┘
                    ┌──────────┐   ┌──────────────┐
                    │ VIEW     │   │ VIEW         │
                    │domain_ev.│   │technical_ev. │
                    │solo back │   │solo trigger  │
                    └──────────┘   └──────────────┘
```

### Idempotencia

| Source | Fórmula event_hash | Garantía |
|---|---|---|
| Trigger | `'trg:{caso_id}:{TG_OP}:{gen_random_uuid()}'` | Único por operación |
| Backend | `sha256('backend:{casoId}:{eventType}:{detalle}:{correlationId}')` | Determinístico + UNIQUE en DB |

### Protección anti-error humano

1. **SQL:** CHECK constraint correlation_id NOT NULL para eventos backend
2. **TypeScript:** correlationId: string (no opcional)
3. **Views:** domain_events y technical_events evitan query directa

---

## 7. Arquitectura de IA (Fase 3)

### Provider-agnostic

```
webhookHandler.ts
    │
    ▼
getAIProvider()  ← aiFactory.ts (singleton)
    │
    ├── PRIMARY_PROVIDER=claude → ClaudeAdapter
    │     ├── imageProcessor.ts (descarga adjuntos → base64)
    │     └── Anthropic SDK (tool_use: "registrar_analisis_caso")
    │
    └── PRIMARY_PROVIDER=mock → MockAIProvider (respuestas realistas, 50ms)
```

### Contrato canónico (types.ts)

| Interfaz | Propósito |
|---|---|
| `EntradaCanónica` | Input unificado: texto, adjuntos, contacto, timestamp |
| `RespuestaCanónica` | Output completo: clasificación, datos paciente, flags, confianza, resumen |
| `AIProvider` | Contrato del adapter: `analizarCaso(entrada): Promise<RespuestaCanónica>` |
| `AIError` | Error tipado con código: `AI_TIMEOUT`, `AI_PROVIDER_ERROR`, etc. |

### Token efficiency

- Modelo: `claude-sonnet-4-5`
- `max_tokens: 1024` — respuesta de tool es compacta
- `tool_choice: { type: "any" }` — forzar invocación de tool, nunca texto libre
- System prompt ~250 tokens — denso, sin relleno
- Una sola llamada por caso, sin multi-turn

### Resiliencia

- Si Claude falla → `analisisIA = null` → placeholders + flag `error_ia`
- Si imagen no se descarga → análisis continúa con solo texto
- Si `ANTHROPIC_API_KEY` falta → factory cae en MockAIProvider
- Cero casos perdidos por error de IA

### Sistema de flags (dual)

| Origen | Flags | Responsable |
|---|---|---|
| 🤖 Claude detecta | `ayuno`, `aines`, `orden_incompleta`, `orden_ilegible` | ClaudeAdapter |
| ⚙️ Sistema aplica | `baja_confianza`, `token_ioma`, `chiclana`, `error_ia`, `orden_digital_misrx` | `buildFlags()` en casoService.ts |

---

## 8. Estructura del Proyecto

```
/
├── api/
│   ├── _lib/
│   │   └── supabaseAdmin.ts      # Shared getSupabaseAdmin() + CASOS_SELECT
│   ├── casos.ts                  # GET /api/casos — lista paginada con filtros
│   ├── casos/
│   │   └── [id].ts               # GET /api/casos/:id — caso individual + mensajes
│   └── callbell/
│       └── webhook.ts            # Serverless Function — process-first pattern
├── src/
│   ├── services/
│   │   ├── ai/                   # ★ NUEVO — Capa de IA (Fase 3)
│   │   │   ├── types.ts          #   Interfaces canónicas (EntradaCanónica, RespuestaCanónica, etc.)
│   │   │   ├── imageProcessor.ts #   Descarga adjuntos → base64 (8s timeout, 4MB max)
│   │   │   ├── claudeAdapter.ts  #   Claude Sonnet 4.5 con tool_use y visión
│   │   │   ├── mockProvider.ts   #   Mock para desarrollo sin consumir tokens
│   │   │   └── aiFactory.ts      #   Factory singleton con fallback a mock
│   │   ├── auditService.ts       # AuditService con 4 funciones semánticas
│   │   ├── callbell/
│   │   │   ├── types.ts          # Tipos del payload de Callbell (incluye CallbellAttachmentPayload)
│   │   │   ├── payloadParser.ts  # Parseador con soporte attachment string/object + content_type
│   │   │   └── webhookHandler.ts # Lógica de negocio + IA + 3 ramas (activo/cerrado/nuevo)
│   │   ├── supabase/
│   │   │   └── casoService.ts    # CRUD server-side + reabrirCaso + actualizarExtraccionIA + buildFlags
│   │   └── mockService.ts        # Mock service (frontend)
│   ├── lib/
│   │   └── supabase.ts           # Cliente Supabase (frontend)
│   ├── types/
│   │   └── index.ts              # Tipos compartidos
│   ├── hooks/
│   │   └── useCasos.ts           # Hook de casos con service layer
│   ├── context/
│   │   └── AuthContext.tsx        # Contexto de autenticación
│   ├── components/               # Componentes React
│   ├── pages/                    # Páginas
│   └── data/
│       └── mockCases.ts          # Datos mock
├── database/
│   └── migrations/
│       ├── 001_enums.sql
│       ├── ... (14 migraciones total)
│       └── 014_orden_tipo.sql
└── docs/
    └── core/
        ├── PROJECT_STATE.md      # ← Este archivo
        ├── ARCHITECTURE.md
        ├── DECISIONS.md
        ├── TODO.md
        └── SESSION_LOG.md
```

---

## 9. Riesgos Activos

| # | Riesgo | Impacto | Severidad | Estado |
|---|---|---|---|---|
| R01 | Precisión de Claude en órdenes manuscritas | Alto | 🔴 Crítico | 🟡 Mitigado (score de confianza + revisión manual) |
| R06 | Webhooks duplicados de Callbell | Medio | 🟡 Alto | Mitigado (idempotencia por UUID + RAMA 1/2 detectan casos existentes) |
| R10 | Cold starts de Vercel Serverless | Bajo | 🟢 Bajo | Aceptable |
| R13 | Límite de tiempo Vercel Hobby (10s) para análisis IA con imágenes | Medio | 🟡 Alto | 🟡 Mitigado: max_tokens 1024, timeout descarga 8s, una sola llamada |

---

## 10. Próximos Pasos Inmediatos

1. 🟢 **Configurar `PRIMARY_PROVIDER=claude` y `ANTHROPIC_API_KEY`** en Vercel Production
2. 🟢 **Probar webhook con IA real**: enviar mensaje desde WhatsApp y verificar logs
3. ⬜ **Revisar frontend**: conectar DashboardPage a datos reales de Supabase
4. ⬜ **Refactor menor**: extraer bloque IA duplicado entre RAMA 2 y RAMA 3 en webhookHandler
5. ⬜ **Siguiente fase**: Fase 4 — Acciones del asesor o mejoras de UI

---

## 11. Contacto y Referencias

- **PRD original:** `PRD_Lavalle11_v1.docx`
- **Autor PRD:** RIA · r-ia.vercel.app
- **Repositorio:** `github.com:TianSB/lavalle11-panel`
- **Dominio:** `https://l11panel.vercel.app`
- **Último commit:** `9a2a7ed` — `feat(ia): Fase 3 completa — integración Claude API + reapertura de casos cerrados`
- **Documentación completa:** Ver `docs/` y archivos maestros en raíz

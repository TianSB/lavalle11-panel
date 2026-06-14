# PROJECT STATE — Panel de Gestión de Turnos con IA

> **Instituto Lavalle 11 · Bahía Blanca, Argentina**
> Documento maestro de estado del proyecto.
> **Última actualización:** 2026-06-14
> **Versión:** 1.4 — Sistema de auditoría final implementado. Timeout fix en Supabase client. Build fix (webhookHandler.ts). Query a Supabase sigue bloqueada por conectividad.

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
| **Fase 2.2 — Backend + Webhook de Callbell** | ✅ Completada | 100% |
| **Fase 2.2 Debug — Deploy + Auditoría + Timeout** | 🟡 **Webhook funcional, query Supabase bloqueada** | **90%** — Sistema de auditoría implementado, timeout fix, build OK |
| Fase 2.3 — Realtime + Endpoints REST | ⬜ Pendiente | 0% |
| Fase 3 — Análisis con Claude IA | ⬜ Pendiente | 0% |
| Fase 4 — Acciones del asesor (flujo completo) | ⬜ Pendiente | 0% |
| Fase 5 — Seguimiento y métricas | ⬜ Pendiente | 0% |

**Siguiente paso:** Verificar deploy + enviar mensaje de prueba. Si la query Supabase sigue bloqueada, diagnosticar con fetch directo.

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
| Backend | Node.js (Vercel Serverless Functions) | 22 LTS | ✅ **Webhook deployado. Timeout fix aplicado. Build OK.** |
| Base de datos | Supabase (PostgreSQL + REST + Realtime + Auth) | — | ✅ 13 migraciones ejecutadas, RLS activo |
| Auditoría | Sistema dual: trigger ultra-liviano + AuditService Node.js | — | ✅ **Implementado: event_hash UNIQUE, correlationId obligatorio, domain_events view** |
| Auth | Supabase Auth (@supabase/supabase-js) | v2.108.1 | ✅ Login real, logout, sesión, roles |
| IA | Claude API (Anthropic) — Provider-agnostic | — | ✅ Arquitectura diseñada y auditada |
| CRM | Callbell API (Webhooks + Messages API) | — | 🟡 **Webhook implementado, parser corregido, query Supabase bloqueada** |
| Config remota | Google Sheets API | v4 | ⬜ Pendiente (Fase 3) |
| Llamadas de voz | WhatsApp Desktop via wa.me/ | — | Fuera del sistema |
| Repositorio | GitHub | — | ✅ **lavalle11-panel (TianSB)** |
| Hosting | Vercel | — | ✅ **Deploy activo (3 commits nuevos)** |

---

## 5. Estado del Webhook (Fase 2.2)

### Flujo actual — Problemas resueltos

| Problema | Estado | Fix |
|---|---|---|
| ERR_MODULE_NOT_FOUND | ✅ Resuelto | .js extensions en imports ESM |
| Function Runtimes invalid version | ✅ Resuelto | Eliminar bloque functions de vercel.json |
| TS2580: Cannot find name 'process' | ✅ Resuelto | Instalar @types/node |
| Parser incompatible con payload real | ✅ Resuelto | Reescritura de types.ts + payloadParser.ts |
| Vercel mata proceso (fire-and-forget) | ✅ Resuelto | try { await handleWebhook() } catch |
| **Trigger con jsonb_each (riesgo de bloqueo)** | ✅ **Resuelto** | Trigger ultra-liviano: solo INSERT snapshot |
| **event_hash sin correlationId (colisiones)** | ✅ **Resuelto** | SHA-256 incluye correlationId |
| **correlationId opcional (sin trazabilidad)** | ✅ **Resuelto** | Obligatorio en todos los tipos |
| **Supabase client sin timeout** | ✅ **Resuelto** | AbortSignal.timeout(10_000) en fetch |
| **Build falló (webhookHandler.ts faltante)** | ✅ **Resuelto** | Commit d86f45c |

### Problema actual — BLOQUEANTE

| Síntoma | Causa probable | Estado |
|---|---|---|
| `[CASO.FIND] ANTES DEL QUERY` aparece | — | ✅ Confirmado |
| `[CASO.FIND] DESPUES DEL QUERY` NO aparece | `await supabase.from().maybeSingle()` nunca resuelve | 🔴 **Activo** |
| Sin error en logs | Conexión de red bloqueada o timeout silencioso | 🔴 **Activo** |
| Sin registros en Supabase | La query nunca alcanza la API REST de Supabase | 🔴 **Activo** |

### Variables de Entorno en Vercel

| Variable | Estado |
|---|---|
| `CALLBELL_WEBHOOK_SECRET` | ✅ Configurada |
| `SUPABASE_URL` | 🟡 **Configurada — verificar si es correcta** |
| `SUPABASE_SERVICE_ROLE_KEY` | 🟡 **Configurada — verificar si es service role (no anon key)** |
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

## 7. Estructura del Proyecto

```
/
├── api/
│   └── callbell/
│       └── webhook.ts          # Serverless Function — timeout fix aplicado
├── src/
│   ├── services/
│   │   ├── auditService.ts     # AuditService con 4 funciones semánticas (NUEVO)
│   │   ├── callbell/
│   │   │   ├── types.ts        # Tipos del payload de Callbell
│   │   │   ├── payloadParser.ts # Parseador
│   │   │   └── webhookHandler.ts # Lógica de negocio + correlationId
│   │   ├── supabase/
│   │   │   └── casoService.ts  # CRUD server-side + auditCasoCreado
│   │   └── mockService.ts      # Mock service (frontend)
│   ├── lib/
│   │   └── supabase.ts         # Cliente Supabase (frontend)
│   ├── types/
│   │   └── index.ts            # Tipos compartidos
│   ├── hooks/
│   │   └── useCasos.ts         # Hook de casos con service layer
│   ├── context/
│   │   └── AuthContext.tsx      # Contexto de autenticación
│   ├── components/              # Componentes React
│   ├── pages/                   # Páginas
│   └── data/
│       └── mockCases.ts        # Datos mock
├── database/
│   └── migrations/
│       ├── 001_enums.sql       # 22 ENUMs
│       ├── ...
│       ├── 010_auditoria_eventos.sql  # Sistema de auditoría FINAL (actualizado)
│       └── 014_orden_tipo.sql  # Campo orden_tipo para MisRx
└── docs/
    └── core/
        ├── PROJECT_STATE.md    # ← Este archivo
        ├── ARCHITECTURE.md     # Arquitectura del sistema
        ├── DECISIONS.md        # Decisiones técnicas (ADRs)
        ├── TODO.md             # Plan de trabajo
        └── SESSION_LOG.md      # Registro de sesiones
```

---

## 8. Riesgos Activos

| # | Riesgo | Impacto | Severidad | Estado |
|---|---|---|---|---|
| R12 | **Query a Supabase bloqueada desde Vercel** | 🔴 CRÍTICO | El webhook recibe mensajes pero no puede crear casos | 🟡 **Timeouter fix aplicado, problema persiste** |
| R01 | Precisión de Claude en órdenes manuscritas | Alto | 🔴 Crítico | 🟡 Mitigado (score de confianza) |
| R06 | Webhooks duplicados de Callbell | Medio | 🟡 Alto | Mitigado (idempotencia por UUID) |
| R10 | Cold starts de Vercel Serverless | Bajo | 🟢 Bajo | Aceptable |

---

## 9. Próximos Pasos Inmediatos

1. 🟢 **Verificar deploy del commit d86f45c** (debe compilar sin errores)
2. 🟡 **Enviar mensaje de prueba** y verificar logs (STEPs + AUDIT OK)
3. 🟡 **Verificar en Supabase SQL Editor** que trigger + backend escribieron eventos
4. 🟢 **Ejecutar SQL del índice compuesto** idx_audit_source_created
5. 🔴 Si el problema de conectividad Supabase persiste: **diagnosticar fetch directo con AbortController timeout 5s**
6. ⬜ Eliminar logs temporales de diagnóstico cuando el sistema esté estable
7. ⬜ Avanzar a Fase 2.3: Endpoints REST + Realtime

---

## 10. Contacto y Referencias

- **PRD original:** `PRD_Lavalle11_v1.docx`
- **Autor PRD:** RIA · r-ia.vercel.app
- **Repositorio:** `github.com:TianSB/lavalle11-panel`
- **Documentación completa:** Ver `docs/` y archivos maestros en raíz

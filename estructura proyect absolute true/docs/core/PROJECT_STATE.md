# PROJECT STATE — Panel de Gestión de Turnos con IA

> **Instituto Lavalle 11 · Bahía Blanca, Argentina**
> Documento maestro de estado del proyecto.
> **Última actualización:** 2026-06-15 (Sesión 28)
> **Versión:** 3.1 — Fix assign_case RPC, Re-analizar con IA manual, Contador de mensajes, Env vars completas.

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
| **Fase 2.3 — Realtime + Endpoints REST** | ✅ Completada | 100% |
| **Fase 3 — Análisis con Claude IA** | ✅ Completada | 100% |
| **Fase 4 — Acciones del asesor (flujo completo)** | ✅ Completada | 100% |
| **Fase 5 — Seguimiento y métricas** | ✅ Completada | 100% |
| **Fase 6 — Re-análisis manual + Contador mensajes** | ✅ **Completada (Sesión 28)** | **100%** |

**Siguiente paso:** Probar flujo completo: webhook con IA real, acciones del asesor, y derivación a Chiclana.

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
4. **Re-analiza manualmente** con IA cuando hay mensajes acumulados
5. **Muestra contador de mensajes** en la card para indicar conversaciones con historial

---

## 4. Stack Tecnológico Confirmado

| Componente | Tecnología | Versión | Estado |
|---|---|---|---|
| Frontend | React + Vite + Tailwind CSS | React 19 | ✅ Implementado + Refactorizado |
| Lenguaje | **TypeScript estricto** — frontend y backend | — | ✅ Confirmado |
| Backend | Node.js (Vercel Serverless Functions) | 22 LTS | ✅ **8 endpoints POST. IA integrada.** |
| Base de datos | Supabase (PostgreSQL + REST + Realtime + Auth) | — | ✅ 15 migraciones ejecutadas, RLS activo |
| Auditoría | Sistema dual: trigger ultra-liviano + AuditService Node.js | — | ✅ Implementado |
| Auth | Supabase Auth (@supabase/supabase-js) | v2.108.1 | ✅ Login real, logout, sesión, roles |
| IA | Claude API (Anthropic) — Provider-agnostic | `claude-sonnet-4-5` | ✅ Integrado + Re-análisis manual |
| CRM | Callbell API (Webhooks + Messages API) | — | ✅ Webhook funcional + Messages API |
| Config remota | Google Sheets API | v4 | ⬜ Pendiente |
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

⚠️ **Problema conocido:** Claude se invoca en el primer mensaje, que suele ser un selector numérico del chatbot ("1", "2"), no la orden médica real. Solucionado con botón de re-análisis manual (Opción 4).

### Variables de Entorno en Vercel — COMPLETAS ✅

| Variable | Estado | Scope |
|---|---|---|
| `CALLBELL_WEBHOOK_SECRET` | ✅ Configurada | Production |
| `SUPABASE_URL` | ✅ Configurada | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configurada | Production |
| `CALLBELL_API_TOKEN` | ✅ Configurada | Production |
| `PRIMARY_PROVIDER` (`claude`) | ✅ **Configurada** | Production |
| `ANTHROPIC_API_KEY` | ✅ **Configurada** | Production |
| `CHICLANA_PHONE` | ✅ **Configurada** (+5492914027333) | Production |
| `VITE_SUPABASE_URL` | ✅ **Configurada** | Production |
| `VITE_SUPABASE_ANON_KEY` | ✅ **Configurada** | Production |

---

## 6. Fase 4 — Acciones del Asesor

### Endpoints POST (7 implementados)

```
POST /api/casos/:id/enviar-mensaje      → messagesApi.ts (Callbell Messages API)
POST /api/casos/:id/confirmar           → Turno + BR-06 IOMA + cerrar caso
POST /api/casos/:id/cerrar              → 12 closing_reasons + auditoría
POST /api/casos/:id/llamada             → Registrar llamada con duración
POST /api/casos/:id/derivar             → BR-03 Chiclana (solo prácticas nucleares)
POST /api/casos/:id/re-analizar         → NUEVO: Re-análisis con IA (Sesión 28)
```

### UI en CaseModal

| Acción | Componente | Estado |
|---|---|---|
| Confirmar turno | Diálogo con fecha/hora/sede/instrucciones | ✅ |
| Cerrar caso | Selector de 12 razones + nota interna opcional | ✅ |
| Registrar llamada | Input de duración en minutos | ✅ |
| Derivar a Chiclana | Notas opcional (solo si práctica nuclear) | ✅ |
| Enviar mensaje | Caja de texto con preview | ✅ |
| **Re-analizar con IA** | **Botón con spinner + toast** | ✅ **NUEVO (Sesión 28)** |

---

## 7. Fase 5 — MetricsBoard

### Componentes

| Característica | Descripción |
|---|---|
| KPIs | 6 indicadores: activos, hoy, sin asignar, sin atender 24hs, tiempo promedio, resolución automática |
| Casos por tipo | Barras horizontales (tipos A–K) con nombres canónicos |
| Volumen diario | Barras apiladas (últimos 7 días): nuevos, resueltos, automáticos |
| Rendimiento por asesor | Tabla: activos, resueltos, tiempo promedio, tasa resolución colorizada |
| Exportar CSV | Multi-sección: Resumen + Tipo + Volumen + Asesores |
| Auto-refresh | Cada 60s con setInterval, sin flicker de loading |
| Filtro por fecha | Inputs Desde/Hasta (default últimos 30 días), recalcula KPIs en Supabase |

---

## 8. Estructura del Proyecto

```
/
├── api/
│   ├── _lib/
│   │   └── supabaseAdmin.ts          # Shared getSupabaseAdmin() + CASOS_SELECT
│   ├── casos.ts                      # GET /api/casos — lista paginada con filtros
│   ├── casos/
│   │   ├── [id].ts                   # GET /api/casos/:id — caso individual + mensajes
│   │   ├── enviar-mensaje.ts         # POST — enviar WhatsApp via Callbell (F4)
│   │   ├── confirmar.ts              # POST — confirmar turno + BR-06 (F4)
│   │   ├── cerrar.ts                 # POST — cerrar caso + auditoría (F4)
│   │   ├── llamada.ts                # POST — registrar llamada (F4)
│   │   ├── derivar.ts               # POST — derivar a Chiclana BR-03 (F4)
│   │   └── re-analizar.ts           # POST — re-análisis manual con IA (NUEVO S28)
│   └── callbell/
│       └── webhook.ts                # Serverless Function — process-first pattern
├── src/
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── fixtures.ts           # Fixtures compartidos
│   │   │   ├── providers.test.ts     # Tests de IA (19)
│   │   │   ├── casoService.test.ts   # Tests de casoService (15)
│   │   │   └── messagesApi.test.ts   # Tests de Callbell API (9)
│   │   ├── ai/                       # Capa de IA (Fase 3)
│   │   ├── callbell/
│   │   │   ├── types.ts              # Tipos del payload de Callbell
│   │   │   ├── payloadParser.ts      # Parseador con soporte attachment biforma
│   │   │   ├── webhookHandler.ts     # Lógica + IA + 3 ramas
│   │   │   └── messagesApi.ts        # Callbell Messages API
│   │   ├── auditService.ts           # AuditService con 4 funciones semánticas
│   │   ├── supabase/
│   │   │   └── casoService.ts        # CRUD + reabrirCaso + buildFlags
│   │   ├── supabaseService.ts        # Implementación real frontend + métricas + mensajes_count
│   │   └── mockService.ts            # CasoService interface + mock
│   ├── lib/supabase.ts               # Cliente Supabase (frontend)
│   ├── types/index.ts                # Tipos compartidos + mensajes_count (NUEVO S28)
│   ├── hooks/
│   │   ├── useCasos.ts               # useMetricas() con filtro fecha
│   │   ├── useCaseRealtimeSync.ts    # Suscripción Realtime + mapRowToCaso con mensajes_count
│   │   └── useAsignarCaso.ts         # Asignación optimista
│   ├── components/
│   │   ├── cases/
│   │   │   ├── CaseCard.tsx           # Badge de conteo de mensajes (NUEVO S28)
│   │   │   └── CaseGrid.tsx
│   │   └── modal/
│   │       └── CaseModal.tsx          # Botón Re-analizar con IA (NUEVO S28)
│   ├── pages/DashboardPage.tsx
│   └── data/mockCases.ts             # Mock data + mensajes_count
└── database/migrations/              # 15 migraciones SQL (+ fix assign_case)
```

---

## 9. Riesgos Activos

| # | Riesgo | Impacto | Severidad | Estado |
|---|---|---|---|---|
| R01 | Precisión de Claude en órdenes manuscritas | Alto | 🔴 Crítico | 🟡 Mitigado (score de confianza + revisión manual + re-análisis manual) |
| R06 | Webhooks duplicados de Callbell | Medio | 🟡 Alto | Mitigado (idempotencia por UUID + RAMA 1/2) |
| R10 | Cold starts de Vercel Serverless | Bajo | 🟢 Bajo | Aceptable |
| R13 | Límite de tiempo Vercel Hobby (10s) para análisis IA | Medio | 🟡 Alto | 🟡 Mitigado: max_tokens 1024, timeout 8s, single turn |
| R14 | Env vars de IA no llegan al runtime serverless | Alto | 🔴 Crítico | ✅ **RESUELTO**: ya configuradas en Production + redeploy exitoso |
| **R15** | **Claude solo ve el primer mensaje del chatbot (selector numérico)** | **Alto** | **🔴 Crítico** | **🟡 Mitigado (re-análisis manual + plan de auto-trigger)** |

---

## 10. Próximos Pasos Inmediatos

1. 🟢 Probar flujo completo en producción: login → tomar caso → re-analizar → confirmar turno
2. 🟢 Probar webhook con IA real (PRIMARY_PROVIDER=claude ya configurado)
3. 🟢 Probar derivación a Chiclana (CHICLANA_PHONE configurado)
4. ⬜ Agregar Sentry para monitoreo de errores en producción
5. ⬜ Agregar tests de integración para los 7 endpoints POST
6. ⬜ **Implementar Opción 2 híbrida**: auto-trigger de re-análisis cuando llega un attachment
7. ⬜ Agregar confirm dialog antes de re-analizar (consume crédito de API)
8. ⬜ Agregar evento de auditoría cuando se re-analiza un caso manualmente

---

## 11. Contacto y Referencias

- **PRD original:** `PRD_Lavalle11_v1.docx`
- **Autor PRD:** RIA · r-ia.vercel.app
- **Repositorio:** `github.com:TianSB/lavalle11-panel`
- **Dominio:** `https://l11panel.vercel.app`
- **Último commit:** `863cc23` — `feat(ui): add mensajes_count badge to CaseCard`
- **Documentación completa:** Ver `docs/` y archivos maestros en raíz

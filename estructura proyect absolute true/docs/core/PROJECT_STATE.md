# PROJECT STATE — Panel de Gestión de Turnos con IA

> **Instituto Lavalle 11 · Bahía Blanca, Argentina**
> Documento maestro de estado del proyecto.
> **Última actualización:** 2026-06-17 (Sesión 30)
> **Versión:** 3.3 — Auditoría técnica, Quick Wins (mapRowToCaso, PRACTICAS_NUCLEAR, índices SQL), fix antipatrón useState, confirm dialog, Storage bloqueante con orden_url permanente, adjuntos_pendientes en Realtime.

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
| **Fase 6 — Re-análisis manual + Contador mensajes** | ✅ Completada (Sesión 28) | 100% |
| **Sesión 29 — Fixes post-producción + Storage adjuntos** | ✅ Completada | 100% |
| **Sesión 30 — Auditoría técnica + Quick Wins + Fix pipeline imágenes** | ✅ **Completada** | **100% — 9 refactors, 7 archivos modificados** |

**Siguiente paso:** Probar flujo completo en producción: enviar mensaje, re-analizar con IA, confirmar turno.

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
| Backend | Node.js (Vercel Serverless Functions) | 22 LTS | ✅ **8 endpoints POST. IA + Storage integrados.** |
| Base de datos | Supabase (PostgreSQL + REST + Realtime + Auth + Storage) | — | ✅ 15 migraciones ejecutadas, RLS activo, **Storage bucket adjuntos creado (S30)** |
| Auditoría | Sistema dual: trigger ultra-liviano + AuditService Node.js | — | ✅ Implementado |
| Auth | Supabase Auth (@supabase/supabase-js) | v2.108.1 | ✅ Login real, logout, sesión, roles |
| IA | Claude API (Anthropic) — Provider-agnostic | `claude-sonnet-4-5` | ✅ Integrado + Re-análisis manual |
| CRM | Callbell API (Webhooks + Messages API) | — | ✅ Webhook funcional + Messages API + channel_uuid corregido |
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
  → RAMA 1: activo → updateCasoHistorial() + saveAttachmentsToStorage() [await] + updateOrdenUrlFromStorage()
  → RAMA 2: cerrado → reabrirCaso() + getAIProvider().analizarCaso() + actualizarExtraccionIA()
     + saveAttachmentsToStorage() [await] + updateOrdenUrlFromStorage()
  → RAMA 3: no existe → getAIProvider().analizarCaso() + createCaso()
     + saveAttachmentsToStorage() [await] + updateOrdenUrlFromStorage()
  → response 200 OK
```

⚠️ **Problema conocido:** Claude se invoca en el primer mensaje, que suele ser un selector numérico del chatbot ("1", "2"), no la orden médica real. Solucionado con:
- Botón de re-análisis manual con confirm dialog (S30)
- Storage de adjuntos con URLs permanentes + orden_url actualizada post-Storage (S30)
- Adjuntos_pendientes computados en tiempo real via Realtime sync (S30)

### Variables de Entorno en Vercel — COMPLETAS ✅

| Variable | Estado | Scope | Valor |
|---|---|---|---|
| `CALLBELL_WEBHOOK_SECRET` | ✅ Configurada | Production | — |
| `SUPABASE_URL` | ✅ Configurada | Production | — |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configurada | Production | — |
| `CALLBELL_API_TOKEN` | ✅ Configurada | Production | — |
| `PRIMARY_PROVIDER` (`claude`) | ✅ Configurada | Production | — |
| `ANTHROPIC_API_KEY` | ✅ Configurada | Production | — |
| `CHICLANA_PHONE` | ✅ Configurada (S28) | Production | `+5492914027333` |
| `CALLBELL_CHANNEL_UUID` | ✅ Configurada (S29) | Production | `fc231b70915844708fb073674a7c951d` |
| `VITE_SUPABASE_URL` | ✅ Configurada (S28) | Production | — |
| `VITE_SUPABASE_ANON_KEY` | ✅ Configurada (S28) | Production | — |

---

## 6. Fase 4 — Acciones del Asesor

### Endpoints POST (7 implementados)

```
POST /api/casos/:id/enviar-mensaje      → messagesApi.ts (Callbell Messages API)
POST /api/casos/:id/confirmar           → Turno + BR-06 IOMA + cerrar caso
POST /api/casos/:id/cerrar              → 12 closing_reasons + auditoría
POST /api/casos/:id/llamada             → Registrar llamada con duración
POST /api/casos/:id/derivar             → BR-03 Chiclana (solo prácticas nucleares)
POST /api/casos/:id/re-analizar         → Re-análisis con IA (desde Storage URLs)
```

### UI en CaseModal

| Acción | Componente | Estado |
|---|---|---|
| Confirmar turno | Diálogo con fecha/hora/sede/instrucciones | ✅ |
| Cerrar caso | Selector de 12 razones + nota interna opcional | ✅ |
| Derivar a Chiclana | Notas opcional (solo si práctica nuclear) | ✅ |
| Enviar mensaje | Caja de texto con preview | ✅ |
| Re-analizar con IA | Botón con **confirm dialog** (S30) + spinner + toast | ✅ |
| Ver orden médica | Links a imágenes en Storage (🖼️) | ✅ |
| Registrar llamada | Input de duración en minutos | ❌ **Removido (no es parte de v1)** |

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
│   │   └── supabaseAdmin.ts          # Shared getSupabaseAdmin()
│   ├── casos.ts                      # GET /api/casos — lista paginada con filtros
│   ├── casos/
│   │   ├── [id].ts                   # GET /api/casos/:id — caso individual + mensajes
│   │   ├── enviar-mensaje.ts         # POST — enviar WhatsApp via Callbell (F4)
│   │   ├── confirmar.ts              # POST — confirmar turno + BR-06 (F4)
│   │   ├── cerrar.ts                 # POST — cerrar caso + auditoría (F4)
│   │   ├── llamada.ts                # POST — registrar llamada (F4)
│   │   ├── derivar.ts               # POST — derivar a Chiclana BR-03 (F4) — usa PRACTICAS_NUCLEAR de constants (S30)
│   │   └── re-analizar.ts           # POST — re-análisis manual con IA — usa PRACTICAS_NUCLEAR de constants (S30)
│   └── callbell/
│       └── webhook.ts                # Serverless Function — process-first pattern
├── src/
│   ├── utils/
│   │   └── mappers.ts                # NUEVO S30: mapRowToCaso() + CASOS_SELECT (antes duplicado en 2 archivos)
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── fixtures.ts           # Fixtures compartidos
│   │   │   ├── providers.test.ts     # Tests de IA (19)
│   │   │   ├── casoService.test.ts   # Tests de casoService (15)
│   │   │   └── messagesApi.test.ts   # Tests de Callbell API (13 tests)
│   │   ├── storage/
│   │   │   └── adjuntosStorage.ts    # S29: descarga adjuntos Callbell → Supabase Storage
│   │   ├── ai/                       # Capa de IA (Fase 3)
│   │   ├── callbell/
│   │   │   ├── types.ts              # Tipos del payload de Callbell
│   │   │   ├── payloadParser.ts      # Parseador con soporte attachment biforma
│   │   │   ├── webhookHandler.ts     # Lógica + IA + 3 ramas + saveAttachmentsToStorage bloqueante + updateOrdenUrlFromStorage (S30)
│   │   │   └── messagesApi.ts        # Callbell Messages API — channel_uuid, + prefix, diagnostics
│   │   ├── auditService.ts           # AuditService con 4 funciones semánticas
│   │   ├── supabase/
│   │   │   └── casoService.ts        # CRUD + reabrirCaso + buildFlags — usa PRACTICAS_NUCLEAR de constants (S30)
│   │   ├── supabaseService.ts        # Implementación real frontend — usa mapRowToCaso de mappers (S30)
│   │   └── mockService.ts            # CasoService interface + mock
│   ├── lib/supabase.ts               # Cliente Supabase (frontend)
│   ├── types/index.ts                # Tipos compartidos + mensajes_count
│   ├── constants.ts                  # +PRACTICAS_NUCLEAR como as const tuple + PracticaNuclear type (S30)
│   ├── hooks/
│   │   ├── useCasos.ts               # useMetricas() con filtro fecha
│   │   ├── useCaseRealtimeSync.ts    # Suscripción Realtime — usa mapRowToCaso de mappers + adjuntos_pendientes (S30)
│   │   └── useAsignarCaso.ts         # Asignación optimista
│   ├── components/
│   │   ├── cases/
│   │   │   ├── CaseCard.tsx           # +Confirm dialog antes de re-analizar (S30)
│   │   │   └── CaseGrid.tsx
│   │   └── modal/
│   │       └── CaseModal.tsx          # usa PRACTICAS_NUCLEAR de constants + fix antipatrón useState (S30) - sin Registrar llamada
│   ├── pages/DashboardPage.tsx
│   └── data/mockCases.ts             # Mock data + mensajes_count
├── vercel.json                       # +7 rewrites API dinámicas
├── database/migrations/
│   ├── 001_enums.sql → 015_assign_case_rpc.sql
│   ├── 016_adjuntos_storage_bucket.sql   # NUEVO S30: crear bucket adjuntos en Storage
│   └── 017_indices_adjuntos_mensajes.sql # NUEVO S30: índices compuestos para adjuntos y mensajes
└── scripts/
    └── backfill-ia.ts               # Script de backfill — usa PRACTICAS_NUCLEAR de constants (S30)
```

---

## 9. Riesgos Activos

| # | Riesgo | Impacto | Severidad | Estado |
|---|---|---|---|---|
| R01 | Precisión de Claude en órdenes manuscritas | Alto | 🔴 Crítico | 🟡 Mitigado (score de confianza + revisión manual + re-análisis manual + Storage adjuntos) |
| R06 | Webhooks duplicados de Callbell | Medio | 🟡 Alto | Mitigado (idempotencia por UUID + RAMA 1/2) |
| R10 | Cold starts de Vercel Serverless | Bajo | 🟢 Bajo | Aceptable |
| R13 | Límite de tiempo Vercel Hobby (10s) para análisis IA | Medio | 🟡 Alto | 🟡 Mitigado: max_tokens 1024, timeout 8s, single turn |
| R14 | Env vars de IA no llegan al runtime serverless | Alto | 🔴 Crítico | ✅ RESUELTO |
| R15 | Claude solo ve el primer mensaje del chatbot | Alto | 🔴 Crítico | 🟡 Mitigado (re-análisis manual + Storage adjuntos + confirm dialog) |
| R16 | URLs de Callbell expiran (600s) → Claude no ve imágenes | Alto | 🔴 Crítico | ✅ **RESUELTO (S29+S30): Storage adjuntos + bloqueante + orden_url permanente** |
| R17 | adjuntos_pendientes no actualizados en tiempo real | Medio | 🟡 Alto | ✅ **RESUELTO (S30): computado en Realtime sync** |
| R18 | saveAttachmentsToStorage falla silenciosamente | Medio | 🟡 Alto | ✅ **RESUELTO (S30): ahora es bloqueante con await** |

---

## 10. Próximos Pasos Inmediatos (de Sesión 30)

1. 🟢 **Probar envío de mensaje desde el panel** (channel_uuid configurado)
2. 🟢 **Probar re-analizar con IA** (confirm dialog + Storage URLs)
3. 🟢 **Probar flujo completo**: login → tomar caso → re-analizar → confirmar turno → mensaje llega a WhatsApp
4. 🟢 **Verificar logs de Vercel** para confirmar channel_uuid en body de Callbell API
5. ⬜ Agregar Sentry para monitoreo de errores en producción
6. ⬜ Tests de integración para los 7 endpoints POST
7. ⬜ Implementar Opción 2 híbrida: auto-trigger de re-análisis cuando llega un attachment
8. ⬜ Agregar evento de auditoría cuando se re-analiza un caso manualmente
9. ⬜ Limpiar `PRIMARY_PROVIDER_claude` (variable mal nombrada en Vercel)

---

## 11. Contacto y Referencias

- **PRD original:** `PRD_Lavalle11_v1.docx`
- **Autor PRD:** RIA · r-ia.vercel.app
- **Repositorio:** `github.com:TianSB/lavalle11-panel`
- **Dominio:** `https://l11panel.vercel.app`
- **Último commit:** Sesión 30 — Quick Wins + Fix pipeline imágenes + confirm dialog
- **Documentación completa:** Ver `docs/` y archivos maestros en raíz

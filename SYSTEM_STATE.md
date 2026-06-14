# SYSTEM STATE — Panel de Gestión de Turnos con IA

> Auditoría de sistema · Fecha: 2026-06-11
> Propósito: Documentar el estado real, fuentes de verdad, flujos de datos y clasificación de cada capa.

---

## 1. Arquitectura Actual

### Diagrama de capas (frontend → DB)

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│                                                       │
│  Pages                                               │
│  └─ DashboardPage.tsx (cola, bandeja, seguimientos,  │
│       metricas + modal)                              │
│                                                       │
│  Hooks                                               │
│  ├─ useCasos() ──── fetch + refresh de datos         │
│  ├─ useAsignarCaso() ── RPC + optimistic UI          │
│  ├─ useCaseRealtimeSync() ── Realtime subscription    │
│  └─ useCaseCrossTabSync() ── BroadcastChannel sync    │
│                                                       │
│  Contexts                                            │
│  ├─ AuthContext ──── sesión + perfil                  │
│  ├─ CasoServiceContext ── DI de CasoService           │
│  └─ CaseUIStoreContext ── reducer global UI           │
│                                                       │
│  Stores                                              │
│  └─ caseUIStore.ts ── useReducer + locks             │
│       ├─ CaseUIStateMap (claiming / claimed_by_me    │
│       │  / claimed_by_other / failed)                │
│       ├─ Optimistic Lock map (TTL 2s)                │
│       └─ Cross-Tab Lock map (TTL 5s)                 │
│                                                       │
│  RBAC                                                │
│  └─ can.ts ── module-level store + pure function      │
│                                                       │
│  UI Components                                       │
│  ├─ CaseCard (state machine + AssignOverlay)          │
│  ├─ CaseGrid, FilterBar, MetricsBoard                │
│  ├─ CaseModal (8 sub-componentes)                    │
│  └─ AppLayout, Sidebar, Header                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│               SERVICE LAYER (React Context DI)       │
│                                                       │
│  Interface: CasoService (mockService.ts)             │
│  ├─ getCasos()                                       │
│  ├─ getCasosByAsesor()                               │
│  ├─ getMetricasResumen()                             │
│  ├─ asignarCaso() → RPC assign_case                  │
│  └─ cerrarCaso(), enviarMensaje()                    │
│                                                       │
│  Implementación activa: SupabaseCasoService          │
│  (src/services/supabaseService.ts)                    │
│  - Usa cliente anon (VITE_SUPABASE_ANON_KEY)         │
│  - Respeta RLS (asesor ve sus casos + sin asignar)    │
│  - Respeta RLS (admin ve todos los casos)             │
│                                                       │
│  Legacy: mockCasoService                              │
│  - No se usa en producción                            │
│  - Mantenido como respaldo                            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            SUPABASE (PostgreSQL + Realtime + Auth)   │
│                                                       │
│  RPC atómica: assign_case(p_case_id UUID)            │
│  ├─ SECURITY INVOKER (respeta RLS)                    │
│  ├─ UPDATE atomic: WHERE asesor_id IS NULL           │
│  │     AND estado = 'pendiente'                      │
│  ├─ RETURNING id INTO v_assigned_id                  │
│  └─ Retorna JSONB { ok, code, case_id }              │
│                                                       │
│  RLS: 10 tablas protegidas                           │
│  ├─ auth_rol() SECURITY DEFINER                      │
│  ├─ casos: asesor=own+unassigned, admin=all          │
│  └─ Hijas: heredan visibilidad del caso padre        │
│                                                       │
│  Realtime: publicación supabase_realtime              │
│  └─ tabla casos (REPLICA IDENTITY FULL)              │
│                                                       │
│  Auth: Supabase Auth                                  │
│  └─ signInWithPassword + getSession + onAuthChange    │
└─────────────────────────────────────────────────────┘
```

### Stack tecnológico real

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React + Vite + Tailwind + TypeScript | React 19, Vite 6, Tailwind v4, TS 5.7 |
| Service DI | React Context (sin singleton) | — |
| State UI | useReducer nativo | — |
| RBAC | Module-level store + pure functions | — |
| DB | Supabase PostgreSQL | Plan free (proyecto: qgnqbkclshqllwangjuc) |
| Auth | Supabase Auth | @supabase/supabase-js v2.108.1 |
| RPC | `assign_case` PL/pgSQL | SECURITY INVOKER |
| Realtime | Supabase Realtime (WebSocket) | Canal "casos-realtime" |
| Cross-tab | BroadcastChannel API | Navegador nativo |
| Serverless | Vercel Functions | api/callbell/webhook.ts |
| IA | No implementada (arquitectura diseñada) | — |

---

## 2. Flujo Completo "Tomar Caso" (Paso a Paso)

```
USUARIO HACE CLIC EN "TOMAR CASO"
│
├─ [1] useAsignarCaso.asignar()
│    ├─ setCaseUIState("claiming") → overlay azul visible
│    ├─ setOptimisticLock(caseId) → bloquea RECONCILE por 2s
│    └─ sendCrossTabEvent("CASE_LOCKED") → otros tabs reciben claimed_by_other (5s)
│
├─ [2] CasoService.asignarCaso(casoId)
│    └─ supabase.rpc("assign_case", { p_case_id })
│         │
│         ├─ RPC (PostgreSQL SECURITY INVOKER)
│         │    ├─ UPDATE casos SET asesor_id=auth.uid(), estado='en_proceso'
│         │    │   WHERE id=p_case_id AND asesor_id IS NULL AND estado='pendiente'
│         │    ├─ IF FOUND → RETURN { ok: true, code: "SUCCESS", case_id }
│         │    └─ IF NOT FOUND → RETURN { ok: false, code: "CASE_ALREADY_TAKEN" }
│         │
│         └─ RLS policy: casos_update_policy
│              ├─ admin → siempre puede
│              ├─ asesor con asesor_id=auth.uid() → puede
│              └─ asesor con asesor_id IS NULL → puede SOLO si estado='pendiente'
│
├─ [3] RESULTADO: ÉXITO
│    ├─ setCaseUIState("claimed_by_me") → overlay verde
│    ├─ sendCrossTabEvent("CASE_ASSIGNED") → otros tabs limpian lock
│    ├─ refresh() → allCasos se actualiza vía useCasos()
│    ├─ reconcileCaseState(allCasos, userId) → limpia store (debounce 300ms)
│    ├─ DashboardPage: showToast("Caso asignado", "success")
│    └─ Supabase Realtime: evento UPDATE → otros tabs reciben reconcile
│
├─ [3] RESULTADO: CASE_ALREADY_TAKEN
│    ├─ setCaseUIState("claimed_by_other") → overlay ámbar
│    ├─ sendCrossTabEvent("CASE_UNLOCKED") → otros tabs limpian lock
│    ├─ reconcileCaseState(allCasos, userId, 0) → reconcile inmediato
│    └─ DashboardPage: showToast("El caso ya fue tomado", "error")
│
├─ [3] RESULTADO: ERROR (network/auth)
│    ├─ setCaseUIState("failed", error) → overlay rojo
│    ├─ sendCrossTabEvent("CASE_UNLOCKED") → otros tabs limpian lock
│    └─ Throw "CASE_ASSIGNMENT_FAILED" → lo captura Card (try/catch silencioso)
│
└─ [4] FINALLY (siempre)
     ├─ clearOptimisticLock(casoId) → RECONCILE ya no está bloqueado
     │     (pero cross-tab lock de OTROS tabs sigue activo 5s)
     └─ setIsLoading(false)
```

---

## 3. Flujo de Realtime + Reconciliación

```
SUPABASE REALTIME
  (canal "casos-realtime", tabla: casos, event: *)
  │
  ├─ [1] useCaseRealtimeSync() recibe payload
  │    ├─ buildEventId(caseId + updated_at) → dedup Set (TTL 30s)
  │    ├─ isRelevantPayload() → solo si cambió asesor_id o estado
  │    └─ reconcileCaseState([changedCase], user.id)
  │
  ├─ [2] store.reconcileCaseState() (debounce 300ms)
  │    ├─ mergeServerCases() — acumula si llegan múltiples eventos
  │    └─ Tras 300ms, dispatch RECONCILE
  │
  └─ [3] RECONCILE reducer (por cada caso afectado)
       ├─ Step 1: ¿existe entry UI? No → skip
       ├─ Step 2: ¿optimistic lock activo? Sí → skip (RPC en curso)
       ├─ Step 3: ¿cross-tab lock activo? Sí → skip (otro tab procesando)
       ├─ Step 4: ¿serverUpdatedAt >= server.updated_at? Sí → skip
       ├─ Step 5: ¿freshnessWindow (3s) activo? Sí → skip
       ├─ Step 6: ¿serverChanged (asesor_id!=null || estado!=pendiente)?
       │    ├─ No → solo actualiza serverUpdatedAt
       │    └─ Sí → pasa a Step 7
       └─ Step 7: Aplicar
            ├─ userId === serverCase.asesor_id → delete (yo tomé)
            ├─ status === "claiming" AND otro ganó → set claimed_by_other
            └─ cualquier otro caso → delete (servidor ya refleja)
```

### Reconnect + Visibility Recovery

```
RECONNECT (Realtime WebSocket)
  ├─ .subscribe() callback con status "SUBSCRIBED"
  ├─ clearProcessedEvents() → limpia dedup cache
  ├─ isFirstSubscription? → true, skip (useCasos() ya fetcheó)
  └─ En reconexiones reales → refetchCases() + reconcile

VISIBILITY CHANGE (tab vuelve activo)
  ├─ document.hidden === false
  ├─ hiddenDuration > 5s? → refetchCases()
  └─ hiddenDuration <= 5s? → no-op (evita refetch en cambios rápidos de tab)
```

---

## 4. Flujo de Cross-Tab Sync (BroadcastChannel)

```
CANAL "cases-sync" (BroadcastChannel API)
  │
  ├─ EVENTOS DEFINIDOS:
  │    ├─ CASE_LOCKED    → otro tab empezó a tomar un caso
  │    ├─ CASE_UNLOCKED  → el tab lockeador liberó (fail/rollback)
  │    ├─ CASE_ASSIGNED  → el tab lockeador completó asignación
  │    ├─ CASE_RECONCILE → otro tab propaga caso actualizado (futuro)
  │    └─ CASE_REFRESH_REQUEST → solicita refetch a todos los tabs
  │
  ├─ TAB ID: crypto.randomUUID() persistido en sessionStorage
  │
  ├─ GUARDAS DE SEGURIDAD:
  │    ├─ sourceTabId === myTabId → ignorar (no auto-escucharse)
  │    ├─ timestamp > 10s → ignorar (stale)
  │    └─ msg.userId !== user.id → ignorar (otro usuario)
  │
  ├─ CASE_LOCKED → setCrossTabLock() + setCaseUIState("claimed_by_other")
  ├─ CASE_UNLOCKED → clearCrossTabLock() + clearCaseUIState()
  ├─ CASE_ASSIGNED → clearCrossTabLock() (Realtime eventual)
  └─ CASE_REFRESH_REQUEST → refetchCases()
```

---

## 5. Fuentes de Verdad

### Datos (fuente única: PostgreSQL)

| Dato | Fuente | RLS |
|---|---|---|
| Casos | `public.casos` | Sí |
| Extracciones IA | `public.extracciones_ia` | Hereda de casos |
| Turnos | `public.turnos` | Hereda de casos |
| Mensajes | `public.mensajes` | Hereda de casos |
| Usuarios | `public.usuarios` | Sí |
| Configuración | `public.configuracion` | Sí |
| Auditoría | `public.auditoria_eventos` | Hereda de casos |

### Estado UI (fuente: CaseUIStore — useReducer React)

| Estado | Dónde vive | Ciclo de vida |
|---|---|---|
| `claiming` | `caseUIStore.ts` (Record<caseId, CaseUIEntry>) | Se limpia por reconcile o timeout 3s |
| `claimed_by_me` | `caseUIStore.ts` | Auto-reset a 3s vía useEffect en CaseCard |
| `claimed_by_other` | `caseUIStore.ts` | Se limpia por reconcile |
| `failed` | `caseUIStore.ts` | Auto-reset a 3s vía useEffect en CaseCard |
| idle | **Ausente del map** (no hay entry) | Estado por defecto |

### Sincronización entre fuentes

```
DB (PostgreSQL)
  │
  ├─ Realtime (WebSocket) ────────→ CaseUIStore (reconcileCaseState)
  │
  ├─ RPC response ────────────────→ CaseUIStore (setCaseUIState)
  │
  ├─ refresh() (useCasos fetch) ──→ allCasos state + reconcileCaseState
  │
  └─ BroadcastChannel (cross-tab) ─→ CaseUIStore (cross-tab locks + UI state)
```

**Regla de resolución de conflictos:**
- `optimisticLock` (local tab, TTL 2s) > `crossTabLock` (otros tabs, TTL 5s) > `Realtime event` > `freshnessWindow` (3s) > `serverUpdatedAt`

---

## 6. Clasificación de Módulos

### ✅ STABLE — No tocar

| Módulo | Archivos | Razón |
|---|---|---|
| RPC `assign_case` | migration 015 + supabaseService.ts | Atómico, probado, responsable de concurrencia real |
| RLS políticas | migration 013 | Auditoría de seguridad aprobada (🟢 OK) |
| SupabaseCasoService | `src/services/supabaseService.ts` | Única implementación activa de CasoService |
| CasoServiceContext | `src/context/CasoServiceContext.tsx` | DI estable, sin singleton |
| CaseUIStore + useReducer | `src/stores/caseUIStore.ts` | Core de la state machine |
| AuthContext | `src/context/AuthContext.tsx` | Race condition corregida, hidratación estable |
| RBAC (can.ts) | `src/rbac/can.ts` | Module-level store, función pura |
| useAsignarCaso | `src/hooks/useAsignarCaso.ts` | Flujo completo probado |
| CaseCard + AssignOverlay | `src/components/cases/CaseCard.tsx` | State machine visual |
| types/index.ts | `src/types/index.ts` | Contrato del sistema |

### 🔬 EXPERIMENTAL — Funciona pero puede cambiar

| Módulo | Archivos | Riesgo |
|---|---|---|
| useCaseRealtimeSync | `src/hooks/useCaseRealtimeSync.ts` | Depende de Realtime habilitado en Supabase; dedup module-level sin cleanup en HMR |
| useCaseCrossTabSync | `src/hooks/useCaseCrossTabSync.ts` | BroadcastChannel sin fallback (Safari < 15.4); `CASE_RECONCILE` nunca se emite |
| cross-tab locks | `src/stores/caseUIStore.ts` | module-level timers sin cleanup en HMR; TTL 5s puede ser insuficiente en latencia alta |
| Event dedup | `src/hooks/useCaseRealtimeSync.ts` | module-level Set sin cleanup en HMR |
| MetricsBoard | `src/components/metrics/MetricsBoard.tsx` | Métricas client-side derivadas de useCasos; sin cache ni actualización en tiempo real |
| api/callbell/webhook.ts | `api/callbell/webhook.ts` | Sin pruebas, sin deploy, sin HMAC validation |

### 🗑️ LEGACY — No usar en producción, mantener como respaldo

| Módulo | Archivos | Reemplazo |
|---|---|---|
| mockCasoService | `src/services/mockService.ts` | ✅ SupabaseCasoService |
| mockCases.ts | `src/data/mockCases.ts` | ✅ Base de datos real |
| TIPOS_CASO original (en mockCases) | `src/data/mockCases.ts` (copia) | ✅ `src/constants.ts` (fuente única) |

---

## 7. Puntos Únicos de Falla (Single Points of Truth)

| Punto | Ubicación | ¿Qué pasa si falla? |
|---|---|---|
| **PostgreSQL MVCC** | RPC `assign_case` | Concurrencia de asignación rota → 2 asesores pueden tomar el mismo caso |
| **Supabase Auth** | `auth.users` + JWT | Nadie puede loguearse; RLS bloquea todo acceso |
| **Supabase Realtime** | WebSocket publicación | Tabs no ven asignaciones en tiempo real; solo ven por refresh manual (CASE_ASSIGNED cross-tab aún funciona) |
| **Supabase Anon Key** | `VITE_SUPABASE_ANON_KEY` en .env | Todo el frontend deja de funcionar |
| **CaseUIStore (useReducer)** | Context + store | Overlay visual no se muestra; botón "Tomar caso" funciona pero sin feedback |
| **BroadcastChannel** | Navegador nativo | Cross-tab sync no funciona; Realtime eventual consistency sigue funcionando |

---

## 8. Dependencias Críticas

| Dependencia | Versión mínima | Alternativa si falla |
|---|---|---|
| `@supabase/supabase-js` | v2.108.1 | No hay — único cliente Supabase |
| PostgreSQL (Supabase) | — | No hay — única base de datos |
| BroadcastChannel API | Chrome 54+, Firefox 38+, Safari 15.4+ | Realtime eventual consistency |
| `crypto.randomUUID()` | Chrome 92+, Firefox 95+, Safari 15.4+ | Math.random() fallback (no implementado) |
| Supabase Realtime WebSocket | — | refresh manual + reconcileCaseState |

---

## 9. Riesgos Activos (No Mitigados)

| Riesgo | Impacto | Observación |
|---|---|---|
| Module-level timers (HMR) | Memory leak en desarrollo | `eventTimers`, `lockCleanupTimers`, `crossTabTimers` no sobreviven HMR correctamente |
| `CASE_RECONCILE` nunca emite | Protocolo muerto | `useCaseCrossTabSync` acepta el evento pero `useAsignarCaso` no lo emite (no tiene el objeto Caso post-RPC) |
| Sin HMAC en webhook | Falsificación de eventos Callbell | `webhook.ts` usa secret token en query param (débil vs HMAC-SHA256) |
| `enviarMensaje` no implementado | No se pueden enviar mensajes | Placeholder en supabaseService.ts |
| Bundle 135KB gzip | Performance en conexiones lentas | Aceptable para panel interno |

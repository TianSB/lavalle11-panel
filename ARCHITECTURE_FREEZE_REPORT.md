# ARCHITECTURE FREEZE REPORT

> Fecha: 2026-06-11
> Propósito: Clasificar cada módulo del sistema por nivel de madurez y estabilidad.
> Acción: **Congelamiento de arquitectura** — No agregar nuevas features que modifiquen
> el core del sistema. Solo bugs críticos o integraciones de I/O planificadas.

---

## Resumen de Clasificación

| Categoría | Cantidad | % del código |
|---|---|---|
| ✅ **STABLE** (no tocar) | 14 módulos | ~75% |
| 🔬 **EXPERIMENTAL** (funciona, puede cambiar) | 6 módulos | ~20% |
| 🗑️ **LEGACY** (reemplazado, mantener como respaldo) | 3 módulos | ~5% |

---

## ✅ STABLE — No tocar, No refactorizar, No re-escribir

Estos módulos están probados, tienen cobertura de casos de borde, y su arquitectura es correcta para el problema que resuelven. Cualquier cambio introduce riesgo sin beneficio.

| # | Módulo | Archivo(s) | LOC | Dependencias | Riesgo de cambio |
|---|---|---|---|---|---|
| S01 | **RPC assign_case** | `migrations/015_assign_case_rpc.sql` | 45 | PostgreSQL 15+ | 🔴 **ALTO** — Concurrencia atómica. Un bug permite doble asignación. NO TOCAR. |
| S02 | **RLS policies** | `migrations/013_rls.sql` | 130 | auth_rol(), auth.uid() | 🔴 **ALTO** — Fuga de datos cross-user. Auditoría pasada (🟢 OK). |
| S03 | **AuthContext** | `src/context/AuthContext.tsx` | 200 | supabase-js | 🟡 **MEDIO** — Race condition de hidratación ya corregida S12. Hidratación estable. |
| S04 | **CaseUIStore (reducer)** | `src/stores/caseUIStore.ts` | 320 | React | 🟡 **MEDIO** — Pipeline de reconciliación con 7 pasos. Un cambio podría romper la sincronización UI/DB. |
| S05 | **useAsignarCaso** | `src/hooks/useAsignarCaso.ts` | 110 | CasoService, CaseUIStore, sendCrossTabEvent | 🟡 **MEDIO** — Flujo completo: optimistic lock → RPC → broadcast → cleanup. Cada paso depende del anterior. |
| S06 | **CaseCard + AssignOverlay** | `src/components/cases/CaseCard.tsx` | 200 | CaseUIStore | 🟢 **BAJO** — Solo lectura del store. Sin side effects. |
| S07 | **CasoService interface** | `src/services/mockService.ts` | (interfaz) | — | 🟢 **BAJO** — Contrato abstracto. Cambiar la interfaz rompe todas las implementaciones. |
| S08 | **CasoServiceContext** | `src/context/CasoServiceContext.tsx` | 30 | React | 🟢 **BAJO** — DI wrapper simple. Sin lógica de negocio. |
| S09 | **SupabaseCasoService** | `src/services/supabaseService.ts` | 240 | supabase-js | 🟡 **MEDIO** — Mapeo de filas a tipos. Errores de casting pueden romper el frontend. |
| S10 | **RBAC (can.ts)** | `src/rbac/can.ts` + `permissions.ts` | 45 | N/A | 🟢 **BAJO** — Funciones puras + module-level store. |
| S11 | **Types** | `src/types/index.ts` | 120 | N/A | 🟢 **BAJO** — Contrato del sistema. Sin lógica. |
| S12 | **supabase.ts** | `src/lib/supabase.ts` | 15 | supabase-js | 🟢 **BAJO** — Cliente configurado. Sin lógica de negocio. |
| S13 | **constants.ts** | `src/constants.ts` | 15 | N/A | 🟢 **BAJO** — Labels display. Sin lógica. |
| S14 | **utils/dates.ts** | `src/utils/dates.ts` | 25 | N/A | 🟢 **BAJO** — Funciones puras de fecha. |

### Riesgos STABLE — Monitorear

| Riesgo | Módulo | Síntoma |
|---|---|---|
| RPC timeoutea en PostgreSQL | S01 | `asignarCaso()` lanza AppError. El optimistic lock expira a los 2s. El botón se reactiva. |
| RLS policy no cubre nuevo estado | S02 | Si se agrega un nuevo `estado_caso` via ENUM, las políticas RLS con `WHERE estado = 'pendiente'` pueden no cubrirlo. |
| SupabaseCasoService row mapping | S09 | Si cambia el schema de Supabase (columnas), `mapRowToCaso()` puede castear incorrectamente. |

---

## 🔬 EXPERIMENTAL — Funciona en producción pero sujeto a cambio

Estos módulos son funcionales y seguros, pero su implementación actual puede mejorarse. No cambiar ahora, pero documentar las limitaciones conocidas.

| # | Módulo | Archivo(s) | LOC | Riesgo | Limitación conocida |
|---|---|---|---|---|---|
| E01 | **useCaseRealtimeSync** | `src/hooks/useCaseRealtimeSync.ts` | 180 | 🟡 MEDIO | Module-level `processedEvents` Set y `eventTimers` Map no se limpian en HMR. En producción no hay problema (no hay HMR). `clearAllCrossTabLocks()` en cleanup puede interferir si el hook se remonta rápido. |
| E02 | **useCaseCrossTabSync** | `src/hooks/useCaseCrossTabSync.ts` | 200 | 🟡 MEDIO | Sin fallback para navegadores sin BroadcastChannel (Safari < 15.4). `CASE_RECONCILE` definido pero nunca emitido (protocolo muerto). `broadcastChannel` module-level puede ser sobrescrito en double-mount. |
| E03 | **Cross-tab locks** | `src/stores/caseUIStore.ts` | ~80 | 🟡 MEDIO | `crossTabTimers` module-level sin cleanup en HMR. TTL 5s puede ser insuficiente si el tab A tiene latencia de red alta (>5s entre CASE_LOCKED y CASE_ASSIGNED). |
| E04 | **Event dedup** | `src/hooks/useCaseRealtimeSync.ts` | ~40 | 🟢 BAJO | `processedEvents` Set y `eventTimers` Map module-level. Sin cleanup en HMR. TTL 30s aceptable. |
| E05 | **MetricsBoard** | `src/components/metrics/MetricsBoard.tsx` | 150 | 🟢 BAJO | Métricas client-side: no escalan a >1000 casos sin optimización. Sin actualización en tiempo real. |
| E06 | **api/callbell/webhook** | `api/callbell/webhook.ts` | 90 | 🔴 ALTO | Sin pruebas end-to-end. Sin deploy en Vercel. Validación HMAC pendiente (usa ?secret=TOKEN). El handler rawBody puede ser null. |

### Recomendaciones EXPERIMENTAL

| # | Recomendación | Prioridad |
|---|---|---|
| E01 | Agregar cleanup de `processedEvents` y `eventTimers` en el cleanup del hook | 🟢 Cuando se toque el archivo |
| E02 | Agregar fallback de `localStorage` events para navegadores sin BroadcastChannel | 🟢 Cuando se toque el archivo |
| E02 | Emitir `CASE_RECONCILE` desde DashboardPage tras refresh exitoso | 🟡 Cuando se implemente |
| E05 | Migrar métricas a consultas agregadas en SQL cuando haya >500 casos activos | 🟡 Futuro |
| E06 | Implementar HMAC-SHA256 en webhook + agregar tests | 🔴 **Antes de deploy** |

---

## 🗑️ LEGACY — No usar en producción, mantener como respaldo

Estos módulos fueron reemplazados pero se mantienen para rollback rápido.

| # | Módulo | Archivo(s) | LOC | Reemplazado por | Plan |
|---|---|---|---|---|---|
| L01 | **mockCasoService** | `src/services/mockService.ts` | 60 | SupabaseCasoService | Mantener. Agregar `@deprecated` JSDoc. Eliminar después de 1 mes sin issues. |
| L02 | **mockCases.ts** (datos) | `src/data/mockCases.ts` | 200 | DB real (Supabase) | Mantener. Agregar `@deprecated` JSDoc. Eliminar después de 1 mes sin issues. |
| L03 | **TIPOS_CASO** (copia) | `src/data/mockCases.ts` | (constante) | `src/constants.ts` | Ya no se importa desde componentes UI. Solo mockService usa. |

---

## Dependencias Entre Módulos (Grafo)

```
AuthContext
  ├─ setRbacRole() → can.ts
  ├─ supabase.auth → lib/supabase.ts
  └─ fetchUserProfile → public.usuarios (RLS)

DashboardPage
  ├─ useCasos() → CasoServiceContext → SupabaseCasoService → lib/supabase.ts
  ├─ useAsignarCaso() → CasoServiceContext + CaseUIStoreContext + sendCrossTabEvent
  ├─ useCaseRealtimeSync() → CaseUIStoreContext + lib/supabase.ts
  ├─ useCaseCrossTabSync() → CaseUIStoreContext + sendCrossTabEvent
  └─ CaseGrid → CaseCard → CaseUIStoreContext

CaseUIStoreContext
  ├─ useCaseUIStore() → useReducer (caseUIReducer)
  │    ├─ optimisticLockMap (module-level)
  │    └─ crossTabLockMap (module-level)
  └─ reconcileCaseState() → debounce → dispatch(RECONCILE)

sendCrossTabEvent (module-level)
  └─ BroadcastChannel.postMessage()
```

---

## Reglas de Congelamiento

### ✅ Permitido (sin revisión)
- Corrección de bugs que afectan datos del usuario (ej: RPC timeout mal manejado)
- Fixes de seguridad (RLS, Auth, validación de webhook)
- Agregar logging/monitoreo sin cambiar lógica de negocio
- Integración de adapters externos (Callbell webhook, Claude IA) **sin modificar el core**

### ⚠️ Requiere revisión
- Cambios en el pipeline de reconciliación (orden de steps en RECONCILE)
- Cambios en `AssignCaseResult` (códigos de error)
- Cambios en la RPC `assign_case` (lógica de concurrencia)
- Cambios en políticas RLS
- Cambios en `CaseUIStatus` (nuevos estados)

### ❌ No hacer (sin arquitecto presente)
- Reemplazar `useReducer` por Redux/Zustand
- Cambiar de BroadcastChannel a otra tecnología cross-tab
- Eliminar optimistic locking (reemplazar por esperar a RPC)
- Cambiar SECURITY INVOKER a SECURITY DEFINER en la RPC
- Agregar polling periódico

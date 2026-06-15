// ============================================================
// caseUIStore.ts
// Store global liviano para estados UI de asignación de casos.
//
// Por qué no usar estado local en cada CaseCard:
//   - El mismo caso puede aparecer en múltiples vistas (cola, bandeja, modal)
//   - Realtime futuro requiere reconciliar estado UI con updates del servidor
//   - Múltiples asesores pueden modificar el mismo caso concurrentemente
//
// Arquitectura:
//   - useReducer nativo de React (0 dependencias externas)
//   - CaseUIStoreContext para propagar el store en el árbol React
//   - reconcileCaseState() para reconciliar con snapshots del servidor
//
// Pipeline de reconciliación (orden estable):
//   1. BroadcastChannel event (cross-tab sync)
//   2. Dedup event (en useCaseRealtimeSync)
//   3. Filter isRelevantPayload (en useCaseRealtimeSync)
//   4. Optimistic lock check (local tab)
//   5. Cross-tab lock check (GLOBAL)
//   6. Server version check (serverUpdatedAt)
//   7. Freshness window check
//   8. Apply reconcileCaseState
//   9. Update UI store
//
// Estados:
//   idle (default/ausente) → claiming → claimed_by_me | claimed_by_other | failed
// ============================================================

import { useReducer, useCallback, useMemo, useRef, useEffect } from "react";
import type { Caso } from "../types";

// ============================================================
// Types
// ============================================================

export type CaseUIStatus =
  | { status: "claiming" }
  | { status: "claimed_by_me" }
  | { status: "claimed_by_other" }
  | { status: "failed"; error: string };

/**
 * Estado UI de un caso individual.
 * Solo se almacena cuando NO es idle (idle = ausente del map).
 */
export interface CaseUIEntry {
  /** Estado actual */
  status: CaseUIStatus;
  /** Timestamp del último cambio local (para reconciliación) */
  updatedAt: number;
  /**
   * Server version (updated_at del caso) al momento de la última reconciliación.
   * Si es null, nunca se reconcilió con servidor.
   */
  serverUpdatedAt: string | null;
  /** Quién disparó la acción (opcional, para presencia futura) */
  updatedBy?: string;
}

/**
 * Store global: mapa de caseId → CaseUIEntry
 * Un caso ausente del map = estado idle.
 */
export type CaseUIStateMap = Record<string, CaseUIEntry>;

// ============================================================
// Optimistic Lock (module-level)
// Protege acciones del usuario contra reconciliaciones Realtime.
// No necesita estar en el reducer porque no dispara re-renders.
// ============================================================

const OPTIMISTIC_LOCK_TTL_MS = 2000;

/** Mapa de caseId → timestamp del lock. Module-level, compartido entre instancias del store. */
const optimisticLockMap = new Map<string, number>();

/** Timers de cleanup para cada lock */
const lockCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Setear un optimistic lock para un caseId.
 * Durante OPTIMISTIC_LOCK_TTL_MS, el RECONCILE reducer ignorará
 * eventos del servidor para este caso.
 */
export function setOptimisticLock(caseId: string): void {
  optimisticLockMap.set(caseId, Date.now());

  // Cleanup automático después del TTL
  const existing = lockCleanupTimers.get(caseId);
  if (existing) clearTimeout(existing);

  lockCleanupTimers.set(
    caseId,
    setTimeout(() => {
      optimisticLockMap.delete(caseId);
      lockCleanupTimers.delete(caseId);
    }, OPTIMISTIC_LOCK_TTL_MS),
  );
}

/**
 * Limpiar un optimistic lock para un caseId.
 * Se llama cuando la RPC completa (éxito o error).
 */
export function clearOptimisticLock(caseId: string): void {
  optimisticLockMap.delete(caseId);
  const timer = lockCleanupTimers.get(caseId);
  if (timer) {
    clearTimeout(timer);
    lockCleanupTimers.delete(caseId);
  }
}

/** Verificar si un caseId tiene un optimistic lock activo */
function isOptimisticLocked(caseId: string): boolean {
  const lockTime = optimisticLockMap.get(caseId);
  if (!lockTime) return false;
  if (Date.now() - lockTime >= OPTIMISTIC_LOCK_TTL_MS) {
    optimisticLockMap.delete(caseId);
    return false;
  }
  return true;
}

// ============================================================
// Cross-Tab Lock (module-level)
// Previene que múltiples tabs del MISMO usuario intenten
// tomar el mismo caso simultáneamente.
//
// Complementa al optimistic lock local:
//   - optimisticLock: protege contra reconciliaciones Realtime (~2s)
//   - crossTabLock: evita que otro tab del mismo usuario intente el mismo caso (~5s)
//
// El TTL del cross-tab lock es más largo porque cubre el escenario
// donde un tab crash sin enviar CASE_UNLOCKED.
// Si no se oye del tab lockeador en 5s, el lock expira.
//
// La fuente de verdad final sigue siendo Supabase (RPC atómica + Realtime).
// El cross-tab lock es solo una optimización de UX (<100ms de latencia).
// ============================================================

const CROSS_TAB_LOCK_TTL_MS = 5000;

interface CrossTabLock {
  /** ID del tab que lockeó */
  tabId: string;
  /** Timestamp del lock */
  timestamp: number;
}

/** Mapa de caseId → CrossTabLock. Module-level, compartido entre instancias del store. */
const crossTabLockMap = new Map<string, CrossTabLock>();
const crossTabTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Mi propio tabId (seteado por useCaseCrossTabSync al inicializar) */
let myTabId: string | null = null;

export function setMyTabId(tabId: string): void {
  myTabId = tabId;
}

/**
 * Registrar un cross-tab lock desde otro tab.
 * Solo 1 tab puede tener lock activo por caseId.
 * Nuevo lock reemplaza anterior solo si timestamp es más reciente.
 */
export function setCrossTabLock(
  caseId: string,
  tabId: string,
  timestamp: number,
): void {
  const existing = crossTabLockMap.get(caseId);

  // Solo reemplazar si el nuevo lock es más reciente
  if (existing && existing.timestamp >= timestamp) return;

  crossTabLockMap.set(caseId, { tabId, timestamp });

  // Cleanup automático después del TTL
  const existingTimer = crossTabTimers.get(caseId);
  if (existingTimer) clearTimeout(existingTimer);

  crossTabTimers.set(
    caseId,
    setTimeout(() => {
      crossTabLockMap.delete(caseId);
      crossTabTimers.delete(caseId);
    }, CROSS_TAB_LOCK_TTL_MS),
  );
}

/**
 * Limpiar un cross-tab lock (cuando el tab lockeador completa o falla).
 */
export function clearCrossTabLock(caseId: string): void {
  crossTabLockMap.delete(caseId);
  const timer = crossTabTimers.get(caseId);
  if (timer) {
    clearTimeout(timer);
    crossTabTimers.delete(caseId);
  }
}

/**
 * Verificar si un caseId tiene un cross-tab lock activo de OTRO tab.
 * Ignora locks del propio tab (no nos auto-bloqueamos).
 */
function isCrossTabLocked(caseId: string): boolean {
  const lock = crossTabLockMap.get(caseId);
  if (!lock) return false;

  // Si el lock expiró, limpiar
  if (Date.now() - lock.timestamp >= CROSS_TAB_LOCK_TTL_MS) {
    crossTabLockMap.delete(caseId);
    const timer = crossTabTimers.get(caseId);
    if (timer) {
      clearTimeout(timer);
      crossTabTimers.delete(caseId);
    }
    return false;
  }

  // Ignorar locks del propio tab
  if (myTabId && lock.tabId === myTabId) return false;

  return true;
}

/**
 * Limpiar todos los cross-tab locks (útil en cleanup total).
 */
export function clearAllCrossTabLocks(): void {
  crossTabLockMap.clear();
  for (const timer of crossTabTimers.values()) {
    clearTimeout(timer);
  }
  crossTabTimers.clear();
}

// ============================================================
// Actions
// ============================================================

type CaseUIAction =
  | {
      type: "SET_CASE_UI_STATE";
      caseId: string;
      status: CaseUIStatus;
      updatedBy?: string;
    }
  | {
      type: "CLEAR_CASE_UI_STATE";
      caseId: string;
    }
  | {
      type: "RECONCILE";
      /** Casos desde el servidor */
      serverCases: Caso[];
      /** ID del usuario actual (para distinguir claimed_by_me vs claimed_by_other) */
      userId?: string;
      /** Timestamp: acciones más recientes que esto no se sobreescriben */
      freshnessWindow: number;
    };

// ============================================================
// Reducer
// ============================================================

const FRESHNESS_WINDOW_MS = 3000; // 3s
const RECONCILE_DEBOUNCE_MS = 300; // 300ms

/**
 * Merge dos arrays de casos del servidor, manteniendo el más reciente por id.
 * Útil para debounce: acumula casos de múltiples eventos Realtime.
 */
function mergeServerCases(a: Caso[], b: Caso[]): Caso[] {
  const map = new Map<string, Caso>();
  for (const c of a) map.set(c.id, c);
  for (const c of b) {
    const existing = map.get(c.id);
    if (!existing || c.updated_at > existing.updated_at) {
      map.set(c.id, c);
    }
  }
  return Array.from(map.values());
}

function caseUIReducer(
  state: CaseUIStateMap,
  action: CaseUIAction,
): CaseUIStateMap {
  switch (action.type) {
    case "SET_CASE_UI_STATE": {
      return {
        ...state,
        [action.caseId]: {
          status: action.status,
          updatedAt: Date.now(),
          serverUpdatedAt: null, // acción local, invalidar versión servidor
          updatedBy: action.updatedBy,
        },
      };
    }

    case "CLEAR_CASE_UI_STATE": {
      const next = { ...state };
      delete next[action.caseId];
      return next;
    }

    case "RECONCILE": {
      const { serverCases, userId, freshnessWindow } = action;
      const now = Date.now();
      const next = { ...state };

      for (const serverCase of serverCases) {
        const entry = next[serverCase.id];

        // --- Step 1: Si no hay entry UI, no hay nada que reconciliar ---
        if (!entry) {
          console.log("[RECONCILE] Caso sin entry UI — ignorado (reducer no agrega casos nuevos, solo reconcilia estados UI):", serverCase.id, "eventType:", (serverCase as any).eventType);
          continue;
        }

        // --- Step 2: Optimistic Lock Check (local tab) ---
        // Si el usuario de esta tab acaba de iniciar una acción (< 2s), ignorar reconcile
        if (isOptimisticLocked(serverCase.id)) continue;

        // --- Step 3: Cross-Tab Lock Check (GLOBAL) ---
        // Si OTRO tab del mismo usuario tiene un lock activo (< 5s), ignorar reconcile.
        // Esto evita que un tab vea estados inconsistentes mientras otro tab
        // está procesando una RPC.
        if (isCrossTabLocked(serverCase.id)) continue;

        // --- Step 4: Server Version Control ---
        // Si ya nos reconciliamos con esta versión (o una más nueva), skip
        if (
          entry.serverUpdatedAt !== null &&
          serverCase.updated_at <= entry.serverUpdatedAt
        ) {
          continue;
        }

        // --- Step 5: Freshness Window ---
        // Si la entry es más reciente que freshnessWindow, respetarla (acción optimista reciente)
        if (now - entry.updatedAt < freshnessWindow) continue;

        // --- Step 6: Verificar si el caso cambió en el servidor ---
        const serverChanged =
          serverCase.asesor_id !== null ||
          serverCase.estado !== "pendiente";

        if (!serverChanged) {
          // Caso no cambió en servidor, pero actualizamos serverUpdatedAt para futuras referencias
          next[serverCase.id] = {
            ...entry,
            serverUpdatedAt: serverCase.updated_at,
          };
          continue;
        }

        // --- Step 7: Aplicar reconciliación ---
        if (userId && serverCase.asesor_id === userId) {
          // Yo lo tomé → entry está obsoleta, limpiar
          delete next[serverCase.id];
        } else if (entry.status.status === "claiming") {
          // Yo estaba claimeando, otro ganó
          next[serverCase.id] = {
            ...entry,
            status: { status: "claimed_by_other" },
            updatedAt: now,
            serverUpdatedAt: serverCase.updated_at,
          };
        } else {
          // Para cualquier otro estado, limpiar porque el servidor ya refleja el cambio
          delete next[serverCase.id];
        }
      }

      return next;
    }

    default:
      return state;
  }
}

// ============================================================
// Initial state
// ============================================================

const INITIAL_STATE: CaseUIStateMap = {};

// ============================================================
// Hook
// ============================================================

export interface UseCaseUIStoreReturn {
  /** Obtener estado UI de un caso específico (undefined = idle) */
  getCaseUIState: (caseId: string) => CaseUIEntry | undefined;
  /** Setear estado UI de un caso */
  setCaseUIState: (
    caseId: string,
    status: CaseUIStatus,
    updatedBy?: string,
  ) => void;
  /** Limpiar estado UI de un caso (vuelve a idle) */
  clearCaseUIState: (caseId: string) => void;
  /**
   * Reconciliar con servidor.
   * Compara los casos del servidor con el estado UI local.
   * No sobreescribe acciones optimistas recientes (< freshnessWindow).
   * Llámese después de refresh() para mantener consistencia.
   */
  reconcileCaseState: (
    serverCases: Caso[],
    userId?: string,
    freshnessWindow?: number,
  ) => void;
}

/**
 * Hook del store global de UI para casos.
 *
 * Uso:
 *   const { getCaseUIState, setCaseUIState, reconcileCaseState } = useCaseUIStore();
 *
 *   // Después de un refresh:
 *   reconcileCaseState(casos);
 */
export function useCaseUIStore(): UseCaseUIStoreReturn {
  const [state, dispatch] = useReducer(caseUIReducer, INITIAL_STATE);

  // --- Debounce refs ---
  // Evita flood de reconciliaciones rápidas (Realtime) acumulando en un solo dispatch
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const debounceArgsRef = useRef<{
    serverCases: Caso[];
    userId?: string;
    freshnessWindow: number;
  } | null>(null);

  // Cleanup del debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const getCaseUIState = useCallback(
    (caseId: string): CaseUIEntry | undefined => {
      return state[caseId];
    },
    [state],
  );

  const setCaseUIState = useCallback(
    (caseId: string, status: CaseUIStatus, updatedBy?: string) => {
      dispatch({
        type: "SET_CASE_UI_STATE",
        caseId,
        status,
        updatedBy,
      });
    },
    [],
  );

  const clearCaseUIState = useCallback((caseId: string) => {
    dispatch({ type: "CLEAR_CASE_UI_STATE", caseId });
  }, []);

  const reconcileCaseState = useCallback(
    (
      serverCases: Caso[],
      userId?: string,
      freshnessWindow: number = FRESHNESS_WINDOW_MS,
    ) => {
      // Cancelar debounce pendiente
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Acumular casos del último reconcile + los nuevos
      const prev = debounceArgsRef.current;
      const mergedCases = prev
        ? mergeServerCases(prev.serverCases, serverCases)
        : serverCases;

      debounceArgsRef.current = {
        serverCases: mergedCases,
        userId,
        freshnessWindow,
      };

      // Programar dispatch con debounce de 300ms
      debounceTimerRef.current = setTimeout(() => {
        const args = debounceArgsRef.current;
        if (args) {
          dispatch({
            type: "RECONCILE",
            serverCases: args.serverCases,
            userId: args.userId,
            freshnessWindow: args.freshnessWindow,
          });
          debounceArgsRef.current = null;
        }
      }, RECONCILE_DEBOUNCE_MS);
    },
    [],
  );

  return useMemo(
    () => ({
      getCaseUIState,
      setCaseUIState,
      clearCaseUIState,
      reconcileCaseState,
    }),
    [getCaseUIState, setCaseUIState, clearCaseUIState, reconcileCaseState],
  );
}

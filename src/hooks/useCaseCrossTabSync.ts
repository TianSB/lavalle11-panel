// ============================================================
// useCaseCrossTabSync.ts
// Sincronización multi-tab vía BroadcastChannel API.
//
// Problema:
//   Un usuario con múltiples tabs abiertos puede generar
//   inconsistencias UI-only. Cada tab tiene su propio store
//   y no sabe qué acciones ejecutaron los demás.
//
// Solución:
//   Canal BroadcastChannel "cases-sync" para comunicación
//   directa entre tabs del mismo origen.
//
// Eventos soportados:
//   CASE_LOCKED         — otro tab empezó a tomar un caso
//   CASE_UNLOCKED       — el tab lockeador liberó (fail/rollback)
//   CASE_ASSIGNED       — el tab lockeador completó la asignación
//   CASE_REFRESH_REQUEST — solicitud de refetch a todos los tabs
//
// Arquitectura:
//   - Module-level broadcastChannel (singleton por tab)
//   - Hook useCaseCrossTabSync init channel + listeners
//   - sendCrossTabEvent() funcion module-level para emitir desde
//     cualquier parte (useAsignarCaso, etc.)
//
// La fuente de verdad final sigue siendo Supabase (RPC + Realtime).
// El cross-tab sync es una optimización de UX (<100ms de latencia)
// para feedback inmediato entre tabs del mismo usuario.
// ============================================================

import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useCaseUIStoreContext } from "../context/CaseUIStoreContext";
import {
  setCrossTabLock,
  clearCrossTabLock,
  setMyTabId,
  clearAllCrossTabLocks,
} from "../stores/caseUIStore";
import type { Caso } from "../types";

// ============================================================
// Types
// ============================================================

/** Evento emitido entre tabs vía BroadcastChannel */
export interface CrossTabEvent {
  type:
    | "CASE_LOCKED"
    | "CASE_UNLOCKED"
    | "CASE_ASSIGNED"
    | "CASE_RECONCILE"
    | "CASE_REFRESH_REQUEST";
  /** ID del caso afectado (opcional para REFRESH_REQUEST) */
  caseId?: string;
  /** Payload completo del caso (solo para RECONCILE) */
  caso?: Caso;
  /** ID del usuario que ejecuta la acción */
  userId: string;
  /** Timestamp del evento (ms epoch) */
  timestamp: number;
  /** ID del tab que emitió el evento */
  sourceTabId: string;
}

// ============================================================
// Module-level broadcast state
// ============================================================

const CHANNEL_NAME = "cases-sync";

let broadcastChannel: BroadcastChannel | null = null;
let currentTabId: string | null = null;

/**
 * Obtener o crear el tabId persistido en sessionStorage.
 * sessionStorage sobrevive refreshes de página pero se limpia al cerrar el tab.
 * crypto.randomUUID() garantiza unicidad.
 */
function getOrCreateTabId(): string {
  if (currentTabId) return currentTabId;

  let id = sessionStorage.getItem("cases-tab-id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("cases-tab-id", id);
  }
  currentTabId = id;
  return currentTabId;
}

/**
 * Enviar un evento a todos los otros tabs del mismo origen.
 * El tab actual NO recibe su propio evento (BroadcastChannel
 * no retransmite al emisor en la mayoría de navegadores).
 *
 * Seguridad: solo eventos de casos, sin datos sensibles.
 */
export function sendCrossTabEvent(
  type: CrossTabEvent["type"],
  userId: string,
  caseId?: string,
): void {
  if (!broadcastChannel || !currentTabId) return;

  const event: CrossTabEvent = {
    type,
    caseId,
    userId,
    timestamp: Date.now(),
    sourceTabId: currentTabId,
  };

  broadcastChannel.postMessage(event);
}

// ============================================================
// Hook
// ============================================================

/**
 * Hook de sincronización multi-tab vía BroadcastChannel.
 *
 * Responsabilidades:
 *   - Inicializar canal BroadcastChannel
 *   - Escuchar eventos de otros tabs
 *   - Sincronizar CaseUIStore cross-tab locks
 *   - Sincronizar estados UI (claimed_by_other visual)
 *   - Solicitar refetch cuando otro tab lo pide
 *
 * Debe montarse UNA vez en la raíz de la app autenticada
 * (DashboardPage).
 *
 * Uso:
 *   useCaseCrossTabSync(); // montar en DashboardPage
 *
 * Para emitir eventos desde otros hooks:
 *   import { sendCrossTabEvent } from "../hooks/useCaseCrossTabSync";
 *   sendCrossTabEvent("CASE_LOCKED", user.id, casoId);
 */
export function useCaseCrossTabSync(refetchCases?: () => Promise<void>): void {
  const { user } = useAuth();
  const { setCaseUIState, clearCaseUIState, reconcileCaseState } =
    useCaseUIStoreContext();

  const refetchRef = useRef(refetchCases);
  refetchRef.current = refetchCases;

  useEffect(() => {
    if (!user) return;

    // Inicializar tabId y registrarlo en el store
    const tabId = getOrCreateTabId();
    setMyTabId(tabId);

    // Inicializar canal BroadcastChannel
    // Cerrar canal previo si existe (protege contra double mount en StrictMode)
    if (broadcastChannel) {
      broadcastChannel.close();
    }
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);

    // Handler de mensajes entrantes
    broadcastChannel.onmessage = (event: MessageEvent<CrossTabEvent>) => {
      const msg = event.data;

      // Ignorar mensajes propios
      if (msg.sourceTabId === tabId) return;

      // Ignorar mensajes stale (> 10s de antigüedad)
      if (Date.now() - msg.timestamp > 10_000) return;

      // Ignorar mensajes de otro usuario (no debería pasar, pero seguridad)
      if (msg.userId !== user.id) return;

      switch (msg.type) {
        case "CASE_LOCKED": {
          if (!msg.caseId) break;

          // Registrar cross-tab lock — protege RECONCILE de sobreescribir
          setCrossTabLock(msg.caseId, msg.sourceTabId, msg.timestamp);

          // Setear estado UI "claimed_by_other" para bloquear el botón.
          // Si esta tab también está claimeando, Realtime resolverá la verdad
          // (solo 1 RPC puede ganar).
          setCaseUIState(
            msg.caseId,
            { status: "claimed_by_other" },
            msg.userId,
          );
          break;
        }

        case "CASE_ASSIGNED": {
          if (!msg.caseId) break;

          // Limpiar cross-tab lock — el otro tab ya completó
          clearCrossTabLock(msg.caseId);

          // Dejar que Realtime maneje el estado final.
          // No setear UI state aquí — el RPC del otro tab disparó
          // un UPDATE en la DB que Realtime propagará.
          break;
        }

        case "CASE_UNLOCKED": {
          if (!msg.caseId) break;

          // Limpiar cross-tab lock
          clearCrossTabLock(msg.caseId);

          // Restaurar a idle — el otro tab no completó la asignación
          clearCaseUIState(msg.caseId);
          break;
        }

        case "CASE_RECONCILE": {
          // Otro tab propagó un caso actualizado.
          // Ejecutamos reconcile inmediato (<100ms) sin esperar a Realtime.
          // reconcileCaseState es estable (useCallback con [] deps), safe de usar directo.
          if (msg.caseId && msg.caso) {
            clearCrossTabLock(msg.caseId);
            reconcileCaseState([msg.caso], msg.userId);
          }
          break;
        }

        case "CASE_REFRESH_REQUEST": {
          // Hacer refetch si tenemos el callback
          const refetch = refetchRef.current;
          if (refetch) {
            refetch();
          }
          break;
        }
      }
    };

    // Cleanup al desmontar
    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
        broadcastChannel = null;
      }
      // Limpiar todos los cross-tab locks al desmontar
      // (el hook se desmonta si el usuario cierra sesión o la app se destruye)
      clearAllCrossTabLocks();
      currentTabId = null;
    };    }, [user?.id, setCaseUIState, clearCaseUIState, reconcileCaseState]);
}

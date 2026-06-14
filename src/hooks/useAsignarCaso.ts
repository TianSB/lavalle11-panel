import { useState, useCallback } from "react";
import type { AssignCaseResult } from "../services/errors";
import { useCasoService } from "../context/CasoServiceContext";
import { useCaseUIStoreContext } from "../context/CaseUIStoreContext";
import {
  setOptimisticLock,
  clearOptimisticLock,
} from "../stores/caseUIStore";
import { sendCrossTabEvent } from "./useCaseCrossTabSync";

interface UseAsignarCasoReturn {
  /** Indica si hay una asignación en curso */
  isLoading: boolean;
  /** Asignar un caso. Dispara estado optimista + RPC + reconcilia. */
  asignar: (
    casoId: string,
    userId?: string,
  ) => Promise<AssignCaseResult>;
}

/**
 * Hook para la acción "Tomar caso".
 * Flujo completo:
 *   1. Broadcast CASE_LOCKED a otros tabs
 *   2. Dispara optimistic lock (2s) — protege de reconciliaciones Realtime
 *   3. Dispara SET_CASE_UI_STATE("claiming") — optimista, global
 *   4. RPC atómica en Supabase vía servicio
 *   5. Broadcast CASE_ASSIGNED o CASE_UNLOCKED según resultado
 *   6. Setea estado final (claimed_by_me / claimed_by_other / failed) en store global
 *   7. Limpia optimistic lock
 *
 * El padre maneja refresh + toasts según el resultado.
 *
 * Uso:
 *   const { asignar } = useAsignarCaso();
 *   const result = await asignar(casoId, user.id);
 *   if (result.ok) { refresh(); showToast("Asignado", "success"); }
 */
export function useAsignarCaso(): UseAsignarCasoReturn {
  const service = useCasoService();
  const { setCaseUIState } = useCaseUIStoreContext();
  const [isLoading, setIsLoading] = useState(false);

  const asignar = useCallback(
    async (
      casoId: string,
      userId?: string,
    ): Promise<AssignCaseResult> => {
      setIsLoading(true);

      // 1. Notificar a otros tabs que este tab está lockeando el caso
      if (userId) {
        sendCrossTabEvent("CASE_LOCKED", userId, casoId);
      }

      // 2. Optimistic lock — protege de reconciliaciones Realtime durante la RPC
      setOptimisticLock(casoId);

      // 3. Estado optimista inmediato — visible en toda la app
      setCaseUIState(casoId, { status: "claiming" }, userId);

      try {
        const result = await service.asignarCaso(casoId);

        // 4. Resultado de la RPC → estado final
        if (result.ok) {
          // Avisar a otros tabs que la asignación se completó
          if (userId) {
            sendCrossTabEvent("CASE_ASSIGNED", userId, casoId);
          }
          setCaseUIState(
            casoId,
            { status: "claimed_by_me" },
            userId,
          );
        } else if (result.code === "CASE_ALREADY_TAKEN") {
          // Avisar a otros tabs que el lock se liberó (falló)
          if (userId) {
            sendCrossTabEvent("CASE_UNLOCKED", userId, casoId);
          }
          setCaseUIState(casoId, { status: "claimed_by_other" }, userId);
        } else {
          if (userId) {
            sendCrossTabEvent("CASE_UNLOCKED", userId, casoId);
          }
          setCaseUIState(
            casoId,
            { status: "failed", error: "Caso no encontrado" },
            userId,
          );
        }

        return result;
      } catch {
        // Avisar a otros tabs que el lock se liberó (crash)
        if (userId) {
          sendCrossTabEvent("CASE_UNLOCKED", userId, casoId);
        }
        setCaseUIState(
          casoId,
          { status: "failed", error: "Error de conexión" },
          userId,
        );
        throw new Error("CASE_ASSIGNMENT_FAILED");
      } finally {
        // 5. Limpiar optimistic lock (tanto éxito como error)
        clearOptimisticLock(casoId);
        setIsLoading(false);
      }
    },
    [service, setCaseUIState],
  );

  return { asignar, isLoading };
}

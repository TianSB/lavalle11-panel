// ============================================================
// useCaseRealtimeSync.ts
// Suscripción a cambios en la tabla `casos` vía Supabase Realtime.
//
// Cada INSERT o UPDATE en la tabla dispara una reconciliación
// con el store global de UI (CaseUIStore).
//
// Pipeline de reconciliación (orden estable):
//   1. dedup event (Set<string> + TTL)
//   2. filter isRelevantPayload
//   3. optimistic lock check (en store)
//   4. version check (serverUpdatedAt)
//   5. freshnessWindow check
//   6. apply reconcileCaseState
//
// No reemplaza useCasos() — los datos se siguen obteniendo
// por fetch inicial. Realtime solo actualiza el store de UI.
//
// Requisitos:
//   - Supabase Realtime habilitado en el proyecto
//   - RLS configurado (filtra eventos que el usuario no puede ver)
// ============================================================

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useCaseUIStoreContext } from "../context/CaseUIStoreContext";
import { useAuth } from "../context/AuthContext";
import type { Caso } from "../types";

// ============================================================
// Constants
// ============================================================

/** Canal de Realtime para la tabla casos */
const REALTIME_CHANNEL = "casos-realtime";

/**
 * TTL para el set de deduplicación de eventos Realtime.
 * Una vez que un eventId se registra, no se procesa de nuevo durante 30s.
 * Esto evita procesar duplicados que Supabase pueda reenviar
 * durante reconexiones o latencia de red.
 */
const DEDUP_TTL_MS = 30_000;

// ============================================================
// Event Deduplication Layer
// ============================================================

/**
 * Set de eventIds ya procesados.
 * eventId = `${caseId}:${updated_at}`
 * Cleanup automático vía TTL.
 */
const processedEvents = new Set<string>();
const eventTimers = new Map<string, ReturnType<typeof setTimeout>>();

function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);

  // Limpiar timer anterior si existe (no debería, pero seguridad)
  const existingTimer = eventTimers.get(eventId);
  if (existingTimer) clearTimeout(existingTimer);

  // Remover del set después del TTL
  eventTimers.set(
    eventId,
    setTimeout(() => {
      processedEvents.delete(eventId);
      eventTimers.delete(eventId);
    }, DEDUP_TTL_MS),
  );
}

function isEventDuplicate(eventId: string): boolean {
  return processedEvents.has(eventId);
}

/**
 * Limpiar todos los eventos dedup (útil en reconnect/resync).
 */
function clearProcessedEvents(): void {
  processedEvents.clear();
  for (const timer of eventTimers.values()) {
    clearTimeout(timer);
  }
  eventTimers.clear();
}

/**
 * Generar eventId único para deduplicación.
 * Formato: `${caseId}:${updated_at}`
 */
function buildEventId(newData: Record<string, unknown>): string | null {
  if (!newData.id || !newData.updated_at) return null;
  return `${String(newData.id)}:${String(newData.updated_at)}`;
}

// ============================================================
// Helper: determinar si un evento de Realtime es relevante
// ============================================================

/**
 * Filtra solo los eventos que afectan campos relevantes para la UI.
 * asesor_id y estado son los únicos que pueden cambiar el estado de asignación.
 * El store ya maneja el debounce vía mergeServerCases + RECONCILE_DEBOUNCE_MS.
 */
function isRelevantPayload(payload: {
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}): boolean {
  // INSERT siempre es relevante (nuevo caso en la cola)
  if (payload.eventType === "INSERT") return true;

  // DELETE no se procesa (manejo futuro)
  if (payload.eventType === "DELETE") return false;

  // UPDATE: solo relevante si cambió asesor_id o estado
  const oldData = payload.old;
  const newData = payload.new;

  return (
    oldData.asesor_id !== newData.asesor_id ||
    oldData.estado !== newData.estado
  );
}

// ============================================================
// Hook
// ============================================================

/**
 * Hook que se suscribe a cambios Realtime en la tabla `casos`.
 *
 * Uso:
 *   useCaseRealtimeSync(); // montar en DashboardPage
 *
 * Comportamiento:
 *   - Se suscribe al montar, se desuscribe al desmontar
 *   - Filtra eventos relevantes (cambios en asesor_id o estado)
 *   - Deduplica eventos vía Set<string> con TTL de 30s
 *   - En reconnect (SUBSCRIBE event): limpia dedup cache + reconcilia
 *   - En visibility change: si tab estuvo oculto > 5s, recrea suscripción
 *   - Delega el debounce al store (reconcileCaseState tiene 300ms interno)
 *   - Reconoce RLS: el usuario solo recibe eventos de casos visibles
 */
export function useCaseRealtimeSync(
  refetchCases?: () => Promise<void>,
): void {
  const { user } = useAuth();
  const { reconcileCaseState } = useCaseUIStoreContext();

  // Ref para detectar cuándo el tab estuvo oculto
  const hiddenSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    // Flag para ignorar el primer SUBSCRIBED (useCasos() ya fetcheó datos al montar)
    const isFirstSubscription = { current: true };

    // Suscribirse a cambios en la tabla casos
    const channel = supabase
      .channel(REALTIME_CHANNEL)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "casos",
        },
        (payload) => {
          const event = payload as {
            eventType: string;
            new: Record<string, unknown>;
            old: Record<string, unknown>;
          };

          // --- Step 1: Dedup event ---
          const eventId = buildEventId(event.new);
          if (eventId) {
            if (isEventDuplicate(eventId)) return;
            markEventProcessed(eventId);
          }

          // --- Step 2: Filter isRelevantPayload ---
          if (!isRelevantPayload(event)) return;

          // --- Step 3: Convertir y delegar al store ---
          const changedCase = event.new as unknown as Caso;
          if (changedCase?.id) {
            reconcileCaseState([changedCase], user.id);
          }
        },
      )
      .subscribe(async (status) => {
        // --- Reconnect handler ---
        // Cuando Supabase Realtime se reconecta, limpiamos la caché de
        // dedup para asegurar que eventos pendientes se procesen.
        if (status === "SUBSCRIBED") {
          // Siempre limpiar dedup al reconectar
          clearProcessedEvents();

          // Ignorar la primera suscripción (useCasos() ya fetcheó al montar)
          if (isFirstSubscription.current) {
            isFirstSubscription.current = false;
            return;
          }

          // En reconexiones reales, obtener snapshot fresco
          if (refetchCases) {
            await refetchCases();
          }
        }
      });

    // --- Visibility Change handler ---
    // Si el usuario vuelve a la pestaña después de > 5s, forzamos
    // resync para evitar estado stale.
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenSinceRef.current = Date.now();
      } else {
        const hiddenDuration = hiddenSinceRef.current
          ? Date.now() - hiddenSinceRef.current
          : 0;
        hiddenSinceRef.current = null;

        // Solo resync si estuvo oculto más de 5 segundos
        if (hiddenDuration > 5000) {
          clearProcessedEvents();
          if (refetchCases) {
            refetchCases();
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup: desuscribirse y limpiar listeners
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      hiddenSinceRef.current = null;
    };
  }, [user?.id, reconcileCaseState, refetchCases]);
}

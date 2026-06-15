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
import type { Caso, ExtraccionIA, Flag, TipoCaso, EstadoCaso, Prioridad, ClosingReason, Turno, Llamada } from "../types";

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
 * Select pattern con joins para fetchear un caso completo desde Realtime.
 * Espeja CASOS_SELECT en supabaseService.ts pero exportado para uso en hooks.
 */
const CASO_COMPLETO_SELECT = `
  *,
  extracciones_ia (*),
  turnos (*),
  llamadas (*),
  asesor:asesor_id (nombre)
` as const;

/**
 * Mapea una row de Supabase (casos + joins) al tipo Caso frontend.
 * Espeja mapRowToCaso en supabaseService.ts.
 */
function mapRowToCaso(row: Record<string, unknown>): Caso {
  const extraccion = row.extracciones_ia as Record<string, unknown> | null;

  return {
    id: row.id as string,
    callbell_uuid: row.callbell_conversation_uuid as string,
    contact_phone: row.contact_phone as string,
    contact_name: row.contact_name as string,
    tipo_caso: row.tipo_caso as TipoCaso,
    estado: row.estado as EstadoCaso,
    prioridad: row.prioridad as Prioridad,
    asesor_id: (row.asesor_id as string) ?? null,
    asesor_nombre: (row.asesor as Record<string, unknown> | null)?.nombre as string ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    resolved_at: (row.resolved_at as string) ?? null,
    closing_reason: (row.closing_reason as ClosingReason) ?? null,
    seguimiento_fecha: null,
    seguimiento_nota: null,
    extraccion_ia: extraccion
      ? ({
          paciente_nombre: extraccion.paciente_nombre as string,
          paciente_dni: (extraccion.paciente_dni as string) ?? null,
          obra_social: (extraccion.obra_social as string) ?? null,
          nro_afiliado: (extraccion.nro_afiliado as string) ?? null,
          nro_carnet: (extraccion.nro_carnet as string) ?? null,
          practica: extraccion.practica as string,
          tipo_practica: extraccion.tipo_practica as ExtraccionIA["tipo_practica"],
          medico_derivante: (extraccion.medico_derivante as string) ?? null,
          matricula: (extraccion.matricula as string) ?? null,
          diagnostico: (extraccion.diagnostico as string) ?? null,
          motivo_solicitud: (extraccion.motivo_solicitud as string) ?? null,
          requiere_copago: (extraccion.requiere_copago as boolean) ?? false,
          requiere_llamada: (extraccion.requiere_llamada as boolean) ?? false,
          requiere_autorizacion: (extraccion.requiere_autorizacion as boolean) ?? false,
          flags: (extraccion.flags as Flag[]) ?? [],
          confianza_global: (extraccion.confianza_global as number) ?? 0,
          confianza_campos: (extraccion.confianza_campos as Record<string, number>) ?? {},
          modelo_ia: (extraccion.modelo_ia as string) ?? "pendiente",
          campos_baja_confianza: (extraccion.campos_baja_confianza as string[]) ?? [],
          orden_url: (extraccion.orden_url as string) ?? null,
          resumen: extraccion.resumen as string,
        } as ExtraccionIA)
      : ({
          paciente_nombre: row.contact_name as string,
          paciente_dni: null,
          obra_social: null,
          nro_afiliado: null,
          nro_carnet: null,
          practica: "Pendiente de análisis",
          tipo_practica: "otro",
          medico_derivante: null,
          matricula: null,
          diagnostico: null,
          motivo_solicitud: null,
          requiere_copago: false,
          requiere_llamada: false,
          requiere_autorizacion: false,
          flags: [],
          confianza_global: 0,
          confianza_campos: {},
          modelo_ia: "pendiente",
          campos_baja_confianza: [],
          orden_url: null,
          resumen: "Pendiente de análisis por IA.",
        } as ExtraccionIA),
    turnos: (row.turnos as Turno[]) ?? [],
    llamadas: (row.llamadas as Llamada[]) ?? [],
    mensajes_count: 0,
  };
}

/**
 * Fetch un caso completo desde Supabase con todos los joins.
 * Se usa cuando llega un evento Realtime para obtener datos frescos
 * (el payload del evento no incluye joins como extracciones_ia).
 */
async function fetchCasoCompleto(casoId: string): Promise<Caso | null> {
  const { data, error } = await supabase
    .from("casos")
    .select(CASO_COMPLETO_SELECT)
    .eq("id", casoId)
    .single();

  if (error || !data) {
    console.warn("[REALTIME] fetchCasoCompleto falló para:", casoId, error?.message);
    return null;
  }

  return mapRowToCaso(data as Record<string, unknown>);
}

/**
 * Hook que se suscribe a cambios Realtime en la tabla `casos`.
 *
 * Uso:
 *   useCaseRealtimeSync(refresh, addCaso, updateCaso); // montar en DashboardPage
 *
 * Comportamiento:
 *   - INSERT: fetch del caso completo desde Supabase y llama onNuevoCaso()
 *   - UPDATE: fetch del caso completo y llama onCasoActualizado() + reconcileCaseState
 *   - Deduplica eventos vía Set<string> con TTL de 30s
 *   - En reconnect (SUBSCRIBE event): limpia dedup cache + refetch
 *   - En visibility change: si tab estuvo oculto > 5s, recrea suscripción
 *   - Reconoce RLS: el usuario solo recibe eventos de casos visibles
 */
export function useCaseRealtimeSync(
  refetchCases?: () => Promise<void>,
  onNuevoCaso?: (caso: Caso) => void,
  onCasoActualizado?: (caso: Caso) => void,
): void {
  const { user } = useAuth();
  const { reconcileCaseState } = useCaseUIStoreContext();

  // Ref para detectar cuándo el tab estuvo oculto
  const hiddenSinceRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("[REALTIME] useEffect montado — user:", user?.id);

    if (!user) {
      console.log("[REALTIME] Sin usuario autenticado — cancelando suscripción");
      return;
    }

    // Flag para ignorar el primer SUBSCRIBED (useCasos() ya fetcheó datos al montar)
    const isFirstSubscription = { current: true };

    // Suscribirse a cambios en la tabla casos
    const channel = supabase
      .channel(REALTIME_CHANNEL);

    console.log("[REALTIME] Canal creado:", REALTIME_CHANNEL, "— iniciando suscripción");

    channel
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

          console.log("[REALTIME] Evento recibido:", event.eventType, "— caso:", event.new?.id, "payload:", JSON.stringify(event));

          // --- Step 1: Dedup event ---
          const eventId = buildEventId(event.new);
          if (eventId) {
            if (isEventDuplicate(eventId)) return;
            markEventProcessed(eventId);
          }

          // --- Step 2: Filter isRelevantPayload ---
          if (!isRelevantPayload(event)) return;

          const caseId = event.new?.id as string | undefined;
          if (!caseId) {
            console.warn("[REALTIME] Evento sin caseId — skip:", JSON.stringify(event));
            return;
          }

          // --- Step 3: Manejar según tipo de evento ---
          if (event.eventType === "INSERT") {
            // INSERT: fetch caso completo con joins (el payload Realtime no incluye joins)
            console.log("[REALTIME] INSERT recibido — fetcheando caso completo:", caseId);
            fetchCasoCompleto(caseId).then((caso) => {
              if (caso && onNuevoCaso) {
                console.log("[REALTIME] INSERT — caso completo obtenido, llamando onNuevoCaso:", caso.id);
                onNuevoCaso(caso);
              } else if (!caso) {
                console.warn("[REALTIME] INSERT — fetchCasoCompleto devolvió null para:", caseId);
              }
            });
          } else if (event.eventType === "UPDATE") {
            // UPDATE: fetch caso completo y actualizar lista + store UI
            console.log("[REALTIME] UPDATE recibido — fetcheando caso completo:", caseId);
            fetchCasoCompleto(caseId).then((caso) => {
              if (caso) {
                if (onCasoActualizado) {
                  console.log("[REALTIME] UPDATE — caso completo obtenido, llamando onCasoActualizado:", caso.id);
                  onCasoActualizado(caso);
                }
                // También reconciliar estado UI (claiming → claimed_by_me/other)
                reconcileCaseState([caso], user.id);
              } else {
                console.warn("[REALTIME] UPDATE — fetchCasoCompleto devolvió null para:", caseId);
              }
            });
          }
        },
      )
      .subscribe(async (status) => {
        console.log("[REALTIME] subscribe status:", status);

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

// ============================================================
// auditService.ts — Eventos semánticos de auditoría
// ============================================================
// Sistema tipo Stripe/Linear: idempotente, trazable, no bloqueante.
//
// Responsabilidad: escribir eventos de NEGOCIO en auditoria_eventos.
// El trigger PostgreSQL ya escribe eventos TÉCNICOS (snapshots).
// Este servicio solo agrega significado semántico.
//
// Idempotencia:
//   event_hash = sha256('backend:{casoId}:{accion}:{detalle_stable}:{correlationId}')
//   INCLUYE correlationId para permitir eventos repetidos del mismo tipo
//   en el mismo caso (ej: dos cambios de estado diferentes).
//   UNIQUE constraint en DB evita duplicados.
//   Si falla (error 23505), se ignora — el evento ya fue registrado.
//
// NON-BLOCKING:
//   Las funciones NUNCA lanzan excepción. Los errores se loggean
//   y descartan. La auditoría no debe romper el flujo principal.
// ============================================================

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export type AuditAccion =
  | "caso.creado"
  | "caso.estado_cambiado"
  | "caso.asignado"
  | "caso.cerrado"
  | "caso.modificado";

export interface AuditPayload {
  casoId: string;
  accion: AuditAccion;
  detalle: Record<string, unknown>;
  asesorId?: string | null;
  /** UUID del flujo de negocio completo. OBLIGATORIO. Se genera con crypto.randomUUID(). */
  correlationId: string;
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

/**
 * Serializa un objeto a JSON con keys ordenadas alfabéticamente.
 * Garantiza que el mismo objeto lógico siempre produzca el mismo string.
 * Esencial para que event_hash sea determinístico.
 */
function stableStringify(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => {
    const val = obj[k];
    return JSON.stringify(k) + ":" + JSON.stringify(val, (_, v) => {
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        return stableStringify(v as Record<string, unknown>);
      }
      return v;
    });
  });
  return "{" + parts.join(",") + "}";
}

/**
 * Genera un event_hash determinístico usando SHA-256.
 *
 * Mecanismo:
 *   sha256("backend:{casoId}:{accion}:{stableDetalle}:{correlationId}")
 *
 * INCLUYE correlationId como cuarto componente para permitir que un mismo
 * caso tenga MÚLTIPLES eventos del mismo tipo (ej: dos "estado_cambiado"
 * en el mismo caso, en diferentes flujos de negocio).
 * Sin correlationId, el segundo evento colisionaría con el primero.
 *
 * Garantías:
 * - Mismo casoId + misma accion + mismo detalle + mismo correlationId → mismo hash
 * - Retry del backend produce exactamente el mismo hash
 * - UNIQUE constraint en DB evita duplicación
 * - Prefijo "backend:" asegura que nunca colisiona con triggers ("trg:")
 */
function buildEventHash(
  casoId: string,
  accion: string,
  detalleStr: string,
  correlationId: string,
): string {
  return createHash("sha256")
    .update(`backend:${casoId}:${accion}:${detalleStr}:${correlationId}`)
    .digest("hex");
}

// -----------------------------------------------------------
// Core insert — NON-BLOCKING
// -----------------------------------------------------------

/**
 * Inserta un evento semántico en auditoria_eventos.
 *
 * NON-BLOCKING: si falla, loggea el error y retorna.
 * NUNCA lanza excepción. NUNCA rompe el flujo principal.
 *
 * Idempotencia:
 * - Si el event_hash ya existe (error code 23505 = unique violation),
 *   se loggea y se ignora. El evento ya fue registrado.
 */
async function insertEvent(
  supabase: SupabaseClient,
  payload: AuditPayload,
  detalleStable: string,
): Promise<void> {
  try {
    const eventHash = buildEventHash(
      payload.casoId,
      payload.accion,
      detalleStable,
      payload.correlationId,
    );

    const { error } = await supabase.from("auditoria_eventos").insert({
      event_hash: eventHash,
      event_source: "backend",
      event_type: "semantic",
      correlation_id: payload.correlationId,
      caso_id: payload.casoId,
      asesor_id: payload.asesorId ?? null,
      accion: payload.accion,
      detalle: payload.detalle,
    });

    if (error) {
      // Código 23505 = unique_violation → idempotencia funcionando
      if (error.code === "23505") {
        console.log(
          `[AUDIT] Idempotencia: evento duplicado ignorado ` +
          `(${payload.accion} / ${payload.casoId})`,
        );
        return;
      }
      console.error("[AUDIT] Error insertando evento:", error);
    }
  } catch (err) {
    // Nunca propagar — la auditoría no debe romper el flujo principal
    console.error("[AUDIT] Excepción no bloqueante:", err);
  }
}

// -----------------------------------------------------------
// API pública — Eventos semánticos
// -----------------------------------------------------------

/**
 * Registra la creación de un nuevo caso.
 * Incluye contexto de negocio: conversation_uuid, tipo_caso,
 * estado inicial y datos de contacto.
 */
export async function auditCasoCreado(
  supabase: SupabaseClient,
  params: {
    casoId: string;
    conversationUuid: string;
    tipoCaso: string;
    estadoInicial: string;
    contactoNombre: string;
    contactoTelefono: string;
    correlationId: string;
  },
): Promise<void> {
  const detalle: Record<string, unknown> = {
    conversation_uuid: params.conversationUuid,
    tipo_caso: params.tipoCaso,
    estado_inicial: params.estadoInicial,
    contacto: {
      nombre: params.contactoNombre,
      telefono: params.contactoTelefono,
    },
  };

  await insertEvent(
    supabase,
    {
      casoId: params.casoId,
      accion: "caso.creado",
      detalle,
      correlationId: params.correlationId,
    },
    stableStringify(detalle),
  );
}

/**
 * Registra un cambio de estado (ej: pendiente → en_curso, en_curso → cerrado).
 * Incluye estado_anterior y estado_nuevo para trazabilidad completa.
 */
export async function auditEstadoCambiado(
  supabase: SupabaseClient,
  params: {
    casoId: string;
    estadoAnterior: string;
    estadoNuevo: string;
    asesorId?: string | null;
    correlationId: string;
  },
): Promise<void> {
  const detalle: Record<string, unknown> = {
    estado_anterior: params.estadoAnterior,
    estado_nuevo: params.estadoNuevo,
  };

  await insertEvent(
    supabase,
    {
      casoId: params.casoId,
      accion: "caso.estado_cambiado",
      detalle,
      asesorId: params.asesorId,
      correlationId: params.correlationId,
    },
    stableStringify(detalle),
  );
}

/**
 * Registra la asignación de un asesor a un caso.
 */
export async function auditAsignado(
  supabase: SupabaseClient,
  params: {
    casoId: string;
    asesorAnterior: string | null;
    asesorNuevo: string | null;
    correlationId: string;
  },
): Promise<void> {
  const detalle: Record<string, unknown> = {
    asesor_anterior: params.asesorAnterior,
    asesor_nuevo: params.asesorNuevo,
  };

  await insertEvent(
    supabase,
    {
      casoId: params.casoId,
      accion: "caso.asignado",
      detalle,
      asesorId: params.asesorNuevo,
      correlationId: params.correlationId,
    },
    stableStringify(detalle),
  );
}

/**
 * Registra el cierre de un caso.
 * Incluye motivo de cierre y estado anterior para trazabilidad.
 */
export async function auditCerrado(
  supabase: SupabaseClient,
  params: {
    casoId: string;
    closingReason: string;
    estadoAnterior: string;
    asesorId?: string | null;
    correlationId: string;
  },
): Promise<void> {
  const detalle: Record<string, unknown> = {
    closing_reason: params.closingReason,
    estado_anterior: params.estadoAnterior,
  };

  await insertEvent(
    supabase,
    {
      casoId: params.casoId,
      accion: "caso.cerrado",
      detalle,
      asesorId: params.asesorId,
      correlationId: params.correlationId,
    },
    stableStringify(detalle),
  );
}

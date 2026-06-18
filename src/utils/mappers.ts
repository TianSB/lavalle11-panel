// ============================================================
// mappers.ts — Helpers compartidos de mapeo Supabase → Frontend
// ============================================================
// Centraliza mapRowToCaso() y CASOS_COMPLETO_SELECT para
// eliminar la duplicación entre supabaseService.ts y
// useCaseRealtimeSync.ts.
// ============================================================

import type {
  Caso,
  ExtraccionIA,
  Flag,
  TipoCaso,
  EstadoCaso,
  Prioridad,
  ClosingReason,
  Turno,
  Llamada,
} from "../types";

// -----------------------------------------------------------
// Select compartido con joins
// -----------------------------------------------------------

/** Select patrón para obtener caso completo con todas las relaciones */
export const CASOS_SELECT = `
  *,
  extracciones_ia (*),
  turnos (*),
  llamadas (*),
  asesor:asesor_id (nombre)
` as const;

// -----------------------------------------------------------
// Mapper de row de Supabase al tipo Caso frontend
// -----------------------------------------------------------

/**
 * Mapea una row de Supabase (casos + joins extracciones_ia, turnos, llamadas, asesor)
 * al tipo Caso frontend.
 *
 * Los campos mensajes_count y adjuntos_pendientes se setean en 0
 * y deben ser reemplazados por fetchMensajesCounts() y
 * fetchAdjuntosPendientesCounts() respectivamente.
 */
export function mapRowToCaso(row: Record<string, unknown>): Caso {
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
    adjuntos_pendientes: 0,
  };
}

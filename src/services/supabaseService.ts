// ============================================================
// supabaseService.ts
// Implementación real de CasoService usando el cliente anon de Supabase.
// Respeta RLS: asesores ven sus casos y casos sin asignar;
// administradores ven todos los casos.
// ============================================================

import { supabase } from "../lib/supabase";
import type {
  Caso,
  Usuario,
  MetricaResumen,
  CasoPorTipo,
  VolumenDiario,
  TipoCaso,
  EstadoCaso,
  Prioridad,
  Flag,
  Turno,
  Llamada,
  ExtraccionIA,
  ClosingReason,
} from "../types";
import type { CasoService } from "./mockService";
import { TIPOS_CASO } from "../constants";

// -----------------------------------------------------------
// Mapping helpers
// -----------------------------------------------------------

/**
 * Maps a raw Supabase row (casos + extracciones_ia + turnos + llamadas)
 * into the frontend Caso type.
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
          orden_url: null,
          resumen: "Pendiente de análisis por IA.",
        } as ExtraccionIA),
    turnos: (row.turnos as Turno[]) ?? [],
    llamadas: (row.llamadas as Llamada[]) ?? [],
  };
}

// -----------------------------------------------------------
// Base query — reusable select pattern for casos list queries
// -----------------------------------------------------------

const CASOS_SELECT = `
  *,
  extracciones_ia (*),
  turnos (*),
  llamadas (*),
  asesor:asesor_id (nombre)
` as const;

// -----------------------------------------------------------
// Service implementation
// -----------------------------------------------------------

export const supabaseCasoService: CasoService = {
  // ---------------------------------------------------------
  // getCasos
  // ---------------------------------------------------------
  async getCasos(): Promise<Caso[]> {
    const { data, error } = await supabase
      .from("casos")
      .select(CASOS_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SUPABASE_SERVICE] Error al obtener casos:", error.message);
      return [];
    }

    return (data ?? []).map(mapRowToCaso);
  },

  // ---------------------------------------------------------
  // getCasosByAsesor
  // ---------------------------------------------------------
  async getCasosByAsesor(asesorId: string): Promise<Caso[]> {
    const { data, error } = await supabase
      .from("casos")
      .select(CASOS_SELECT)
      .eq("asesor_id", asesorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SUPABASE_SERVICE] Error al obtener casos por asesor:", error.message);
      return [];
    }

    return (data ?? []).map(mapRowToCaso);
  },

  // ---------------------------------------------------------
  // getCasosConSeguimiento
  // ---------------------------------------------------------
  async getCasosConSeguimiento(): Promise<Caso[]> {
    // 1. Get IDs of casos with pending seguimientos
    const { data: seguimientos, error: segError } = await supabase
      .from("seguimientos")
      .select("caso_id")
      .eq("estado", "pendiente");

    if (segError) {
      console.error("[SUPABASE_SERVICE] Error al obtener seguimientos:", segError.message);
      return [];
    }

    const casoIds = [...new Set((seguimientos ?? []).map((s) => s.caso_id))];
    if (casoIds.length === 0) return [];

    // 2. Fetch those casos with full details
    const { data, error } = await supabase
      .from("casos")
      .select(CASOS_SELECT)
      .in("id", casoIds)
      .neq("estado", "cerrado")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SUPABASE_SERVICE] Error al obtener casos con seguimiento:", error.message);
      return [];
    }

    return (data ?? []).map(mapRowToCaso);
  },

  // ---------------------------------------------------------
  // getMetricasResumen
  // ---------------------------------------------------------
  async getMetricasResumen(): Promise<MetricaResumen> {
    // Run all count queries in parallel
    const [
      { count: casosActivos },
      { count: casosHoy },
      { count: casosSinAsignar },
      { count: casosAntiguos },
      { count: casosCerrados },
    ] = await Promise.all([
      supabase
        .from("casos")
        .select("*", { count: "exact", head: true })
        .neq("estado", "cerrado"),
      supabase
        .from("casos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().slice(0, 10)),
      supabase
        .from("casos")
        .select("*", { count: "exact", head: true })
        .is("asesor_id", null)
        .neq("estado", "cerrado"),
      supabase
        .from("casos")
        .select("*", { count: "exact", head: true })
        .neq("estado", "cerrado")
        .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("casos")
        .select("*", { count: "exact", head: true })
        .eq("estado", "cerrado"),
    ]);

    const totalCerrados = casosCerrados ?? 0;
    const totalCasos = (casosActivos ?? 0) + totalCerrados;

    return {
      casos_activos: casosActivos ?? 0,
      casos_hoy: casosHoy ?? 0,
      casos_sin_asignar: casosSinAsignar ?? 0,
      casos_sin_atender_24hs: casosAntiguos ?? 0,
      tiempo_promedio_resolucion_min: 0, // TODO: calcular con datos reales cuando haya casos cerrados
      tasa_resolucion_automatica: totalCasos > 0 ? totalCerrados / totalCasos : 0,
    };
  },

  // ---------------------------------------------------------
  // getCasosPorTipo
  // ---------------------------------------------------------
  async getCasosPorTipo(): Promise<CasoPorTipo[]> {
    // Fetch all tipo_caso values and count in JS
    const { data, error } = await supabase
      .from("casos")
      .select("tipo_caso");

    if (error || !data) {
      console.error("[SUPABASE_SERVICE] Error al obtener casos por tipo:", error?.message);
      return [];
    }

    // Aggregate counts by tipo_caso
    const counts = new Map<string, number>();
    for (const row of data) {
      const tipo = row.tipo_caso as string;
      counts.set(tipo, (counts.get(tipo) ?? 0) + 1);
    }

    // Build result in the standard display order (A–K)
    const tipoOrder: TipoCaso[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

    return tipoOrder
      .filter((tipo) => counts.has(tipo))
      .map((tipo) => ({
        tipo,
        nombre: TIPOS_CASO[tipo],
        cantidad: counts.get(tipo) ?? 0,
      }));
  },

  // ---------------------------------------------------------
  // getVolumenDiario
  // ---------------------------------------------------------
  async getVolumenDiario(): Promise<VolumenDiario[]> {
    // Fetch casos with created_at and estado to compute daily volume
    const { data, error } = await supabase
      .from("casos")
      .select("created_at, estado, tipo_caso")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("[SUPABASE_SERVICE] Error al obtener volumen diario:", error?.message);
      return [];
    }

    // Aggregate by date
    const daily = new Map<
      string,
      { total: number; resueltos: number; automaticos: number }
    >();

    for (const row of data) {
      const date = (row.created_at as string).slice(0, 10);
      const entry = daily.get(date) ?? { total: 0, resueltos: 0, automaticos: 0 };
      entry.total++;
      if (row.estado === "cerrado") {
        entry.resueltos++;
        // Type B casos are resolved automatically
        if (row.tipo_caso === "B" || row.tipo_caso === "K") {
          entry.automaticos++;
        }
      }
      daily.set(date, entry);
    }

    return Array.from(daily.entries())
      .map(([fecha, vals]) => ({
        fecha,
        ...vals,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-30); // Last 30 days
  },

  // ---------------------------------------------------------
  // getUsuarios
  // ---------------------------------------------------------
  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("activo", true);

    if (error) {
      console.error("[SUPABASE_SERVICE] Error al obtener usuarios:", error.message);
      return [];
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      nombre: row.nombre as string,
      email: row.email as string,
      rol: row.rol as Usuario["rol"],
      activo: row.activo as boolean,
    }));
  },

  // ---------------------------------------------------------
  // asignarCaso
  // ---------------------------------------------------------
  async asignarCaso(casoId: string, asesorId: string): Promise<void> {
    const { error } = await supabase
      .from("casos")
      .update({
        asesor_id: asesorId,
        estado: "en_proceso",
        updated_at: new Date().toISOString(),
      })
      .eq("id", casoId);

    if (error) {
      console.error("[SUPABASE_SERVICE] Error al asignar caso:", error.message);
      throw new Error("No se pudo asignar el caso");
    }
  },

  // ---------------------------------------------------------
  // cerrarCaso
  // ---------------------------------------------------------
  async cerrarCaso(casoId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from("casos")
      .update({
        estado: "cerrado",
        closing_reason: reason,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", casoId);

    if (error) {
      console.error("[SUPABASE_SERVICE] Error al cerrar caso:", error.message);
      throw new Error("No se pudo cerrar el caso");
    }
  },

  // ---------------------------------------------------------
  // enviarMensaje
  // ---------------------------------------------------------
  async enviarMensaje(_casoId: string, _mensaje: string): Promise<void> {
    // TODO: Fase 4 — integrar Callbell Messages API para enviar el mensaje
    // y registrar el mensaje outbound en la tabla `mensajes`
    console.log(
      "[SUPABASE_SERVICE] enviarMensaje aún no implementado — pendiente Callbell API",
    );
  },
};

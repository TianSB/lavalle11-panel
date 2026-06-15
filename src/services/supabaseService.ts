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
  MetricaPorAsesor,
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
import type { AssignCaseResult } from "./errors";
import { ErrorCodes, AppError } from "./errors";
import { enviarMensajeCallbell } from "./callbell/messagesApi.js";

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
    mensajes_count: 0, // Se reemplaza después con fetchMensajesCounts
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

/**
 * Para un set de caso_ids, obtiene el conteo de mensajes entrantes por caso.
 * Retorna un Map<caso_id, count>.
 */
async function fetchMensajesCounts(casoIds: string[]): Promise<Map<string, number>> {
  if (casoIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("mensajes")
    .select("caso_id")
    .in("caso_id", casoIds)
    .eq("direction", "inbound");

  if (error) {
    console.warn("[SUPABASE_SERVICE] Error al obtener conteo de mensajes:", error.message);
    return new Map();
  }

  const countMap = new Map<string, number>();
  for (const row of data ?? []) {
    const cid = row.caso_id as string;
    countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
  }
  return countMap;
}

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

    const casos = (data ?? []).map(mapRowToCaso);

    // Batch fetch message counts for all casos
    const casoIds = casos.map((c) => c.id);
    const countsMap = await fetchMensajesCounts(casoIds);
    for (const caso of casos) {
      caso.mensajes_count = countsMap.get(caso.id) ?? 0;
    }

    return casos;
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

    const casos = (data ?? []).map(mapRowToCaso);

    const casoIds = casos.map((c) => c.id);
    const countsMap = await fetchMensajesCounts(casoIds);
    for (const caso of casos) {
      caso.mensajes_count = countsMap.get(caso.id) ?? 0;
    }

    return casos;
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

    const casos = (data ?? []).map(mapRowToCaso);

    const ids = casos.map((c) => c.id);
    const countsMap = await fetchMensajesCounts(ids);
    for (const caso of casos) {
      caso.mensajes_count = countsMap.get(caso.id) ?? 0;
    }

    return casos;
  },

  // ---------------------------------------------------------
  // getMetricasResumen
  // ---------------------------------------------------------
  async getMetricasResumen(fecha_desde?: string, fecha_hasta?: string): Promise<MetricaResumen> {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    // Build — casos activos (no cerrados)
    let qActivos = supabase
      .from("casos")
      .select("*", { count: "exact", head: true })
      .neq("estado", "cerrado");
    if (fecha_desde) qActivos = qActivos.gte("created_at", fecha_desde);
    if (fecha_hasta) qActivos = qActivos.lte("created_at", fecha_hasta + "T23:59:59Z");

    // Build — casos creados hoy
    let qHoy = supabase
      .from("casos")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);
    if (fecha_desde) qHoy = qHoy.gte("created_at", fecha_desde);
    if (fecha_hasta) qHoy = qHoy.lte("created_at", fecha_hasta + "T23:59:59Z");

    // Build — casos sin asignar activos
    let qSinAsignar = supabase
      .from("casos")
      .select("*", { count: "exact", head: true })
      .is("asesor_id", null)
      .neq("estado", "cerrado");
    if (fecha_desde) qSinAsignar = qSinAsignar.gte("created_at", fecha_desde);
    if (fecha_hasta) qSinAsignar = qSinAsignar.lte("created_at", fecha_hasta + "T23:59:59Z");

    // Build — casos sin atender 24hs
    let qAntiguos = supabase
      .from("casos")
      .select("*", { count: "exact", head: true })
      .neq("estado", "cerrado")
      .lt("created_at", yesterday);
    if (fecha_desde) qAntiguos = qAntiguos.gte("created_at", fecha_desde);
    if (fecha_hasta) qAntiguos = qAntiguos.lte("created_at", fecha_hasta + "T23:59:59Z");

    // Build — casos cerrados (para promedios)
    let qCerrados = supabase
      .from("casos")
      .select("resolved_at, created_at, tipo_caso")
      .eq("estado", "cerrado");
    if (fecha_desde) qCerrados = qCerrados.gte("created_at", fecha_desde);
    if (fecha_hasta) qCerrados = qCerrados.lte("created_at", fecha_hasta + "T23:59:59Z");

    // Run all queries in parallel
    const [
      { count: casosActivos },
      { count: casosHoy },
      { count: casosSinAsignar },
      { count: casosAntiguos },
      { data: casosCerrados },
    ] = await Promise.all([
      qActivos,
      qHoy,
      qSinAsignar,
      qAntiguos,
      qCerrados,
    ]);

    let totalTiempoMs = 0;
    let casosConTiempo = 0;
    let totalAutomaticos = 0;

    for (const row of casosCerrados ?? []) {
      const r = row as { resolved_at: string | null; created_at: string; tipo_caso: string };
      if (r.tipo_caso === "B" || r.tipo_caso === "K") {
        totalAutomaticos++;
      }
      if (r.resolved_at && r.created_at) {
        totalTiempoMs +=
          new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime();
        casosConTiempo++;
      }
    }

    const totalCerrados = (casosCerrados ?? []).length;

    return {
      casos_activos: casosActivos ?? 0,
      casos_hoy: casosHoy ?? 0,
      casos_sin_asignar: casosSinAsignar ?? 0,
      casos_sin_atender_24hs: casosAntiguos ?? 0,
      tiempo_promedio_resolucion_min:
        casosConTiempo > 0
          ? Math.round(totalTiempoMs / casosConTiempo / 60000)
          : 0,
      tasa_resolucion_automatica:
        totalCerrados > 0 ? totalAutomaticos / totalCerrados : 0,
    };
  },

  // ---------------------------------------------------------
  // getCasosPorTipo
  // ---------------------------------------------------------
  async getCasosPorTipo(fecha_desde?: string, fecha_hasta?: string): Promise<CasoPorTipo[]> {
    // Build query with optional date filter
    let query = supabase.from("casos").select("tipo_caso");
    if (fecha_desde) query = query.gte("created_at", fecha_desde);
    if (fecha_hasta) query = query.lte("created_at", fecha_hasta + "T23:59:59Z");

    const { data, error } = await query;

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
  async getVolumenDiario(fecha_desde?: string, fecha_hasta?: string): Promise<VolumenDiario[]> {
    // Build query with optional date filter
    let query = supabase
      .from("casos")
      .select("created_at, estado, tipo_caso")
      .order("created_at", { ascending: false });
    if (fecha_desde) query = query.gte("created_at", fecha_desde);
    if (fecha_hasta) query = query.lte("created_at", fecha_hasta + "T23:59:59Z");

    const { data, error } = await query;

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
  // getMetricasPorAsesor
  // ---------------------------------------------------------
  async getMetricasPorAsesor(fecha_desde?: string, fecha_hasta?: string): Promise<MetricaPorAsesor[]> {
    // Build — casos activos por asesor
    let qActivos = supabase
      .from("casos")
      .select("asesor_id, asesor:asesor_id (nombre), updated_at")
      .not("asesor_id", "is", null)
      .neq("estado", "cerrado");
    if (fecha_desde) qActivos = qActivos.gte("created_at", fecha_desde);
    if (fecha_hasta) qActivos = qActivos.lte("created_at", fecha_hasta + "T23:59:59Z");

    // Build — casos cerrados por asesor
    let qCerrados = supabase
      .from("casos")
      .select("asesor_id, resolved_at, created_at")
      .not("asesor_id", "is", null)
      .eq("estado", "cerrado");
    if (fecha_desde) qCerrados = qCerrados.gte("created_at", fecha_desde);
    if (fecha_hasta) qCerrados = qCerrados.lte("created_at", fecha_hasta + "T23:59:59Z");

    // Fetch both in parallel
    const [{ data: activos, error: errActivos }, { data: cerrados, error: errCerrados }] =
      await Promise.all([qActivos, qCerrados]);

    if (errActivos) {
      console.error("[SUPABASE_SERVICE] Error al obtener métricas por asesor (activos):", errActivos.message);
      return [];
    }

    if (errCerrados) {
      console.error("[SUPABASE_SERVICE] Error al obtener métricas por asesor (cerrados):", errCerrados.message);
      return [];
    }

    // Aggregate by asesor
    const asesorMap = new Map<
      string,
      {
        nombre: string;
        activos: number;
        resueltos: number;
        totalTiempoMs: number;
        casosConTiempo: number;
        ultimaActividad: string | null;
      }
    >();

    for (const row of activos ?? []) {
      const id = row.asesor_id as string;
      if (!id) continue;
      const entry = asesorMap.get(id) ?? {
        nombre: ((row.asesor as unknown as Record<string, unknown> | null)?.nombre as string) ?? id,
        activos: 0,
        resueltos: 0,
        totalTiempoMs: 0,
        casosConTiempo: 0,
        ultimaActividad: null,
      };
      entry.activos++;
      const updated = row.updated_at as string | null;
      if (updated && (!entry.ultimaActividad || updated > entry.ultimaActividad)) {
        entry.ultimaActividad = updated;
      }
      asesorMap.set(id, entry);
    }

    for (const row of cerrados ?? []) {
      const id = row.asesor_id as string;
      if (!id) continue;
      const entry = asesorMap.get(id) ?? {
        nombre: id,
        activos: 0,
        resueltos: 0,
        totalTiempoMs: 0,
        casosConTiempo: 0,
        ultimaActividad: null,
      };
      entry.resueltos++;
      if (row.resolved_at && row.created_at) {
        entry.totalTiempoMs +=
          new Date(row.resolved_at as string).getTime() -
          new Date(row.created_at as string).getTime();
        entry.casosConTiempo++;
      }
      const resolved = row.resolved_at as string | null;
      if (resolved && (!entry.ultimaActividad || resolved > entry.ultimaActividad)) {
        entry.ultimaActividad = resolved;
      }
      asesorMap.set(id, entry);
    }

    // Map to MetricaPorAsesor[], sorted by casos_activos desc
    const result: MetricaPorAsesor[] = Array.from(asesorMap.entries()).map(
      ([id, data]) => {
        const totalAsignados = data.activos + data.resueltos;
        return {
          asesor_id: id,
          asesor_nombre: data.nombre,
          casos_activos: data.activos,
          casos_resueltos: data.resueltos,
          tiempo_promedio_resolucion_min:
            data.casosConTiempo > 0
              ? Math.round(data.totalTiempoMs / data.casosConTiempo / 60000)
              : 0,
          tasa_resolucion:
            totalAsignados > 0 ? data.resueltos / totalAsignados : 0,
          ultima_actividad: data.ultimaActividad,
        };
      },
    );

    result.sort((a, b) => b.casos_activos - a.casos_activos);
    return result;
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
  // asignarCaso — RPC única. Atómico, sin fallback.
  // La RPC Postgres ejecuta un solo UPDATE condicional con
  // RETURNING, SECURITY INVOKER (respeta RLS).
  // Retorna AssignCaseResult — nunca throw para casos esperados.
  // ---------------------------------------------------------
  async asignarCaso(casoId: string): Promise<AssignCaseResult> {
    const { data, error } = await supabase.rpc("assign_case", {
      p_case_id: casoId,
    });

    // Error real de red/Supabase
    if (error) {
      console.error("[SUPABASE_SERVICE] Error en RPC assign_case:", error.message);
      throw new AppError(
        ErrorCodes.ASSIGNMENT_FAILED,
        "Error al asignar el caso: " + error.message,
        { casoId },
      );
    }

    // La RPC retorna un JSONB: { ok: boolean, code: string, case_id: string | null }
    const result = data as AssignCaseResult | null;
    if (!result) {
      throw new AppError(ErrorCodes.ASSIGNMENT_FAILED, "Respuesta vacía de la RPC", {
        casoId,
      });
    }

    return result;
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
  async enviarMensaje(casoId: string, mensaje: string): Promise<void> {
    console.log("[SUPABASE_SERVICE] enviarMensaje — caso:", casoId);

    try {
      // 1. Obtener datos del caso para conocer el teléfono y conversation UUID
      const { data: caso, error } = await supabase
        .from("casos")
        .select("id, contact_phone, callbell_conversation_uuid")
        .eq("id", casoId)
        .single();

      if (error || !caso) {
        console.error("[SUPABASE_SERVICE] Caso no encontrado:", casoId, error?.message);
        throw new Error(`Caso ${casoId} no encontrado`);
      }

      const phone = caso.contact_phone as string;
      const conversationUuid = caso.callbell_conversation_uuid as string;

      // 2. Validar que tengamos un número de teléfono
      if (!phone) {
        console.error("[SUPABASE_SERVICE] Caso sin teléfono:", casoId);
        throw new Error(`Caso ${casoId} no tiene número de teléfono`);
      }

      // 3. Enviar mensaje via Callbell API
      const result = await enviarMensajeCallbell(phone, mensaje, conversationUuid);

      if (!result.success) {
        throw new Error(`Error al enviar mensaje: ${result.error}`);
      }

      console.log(
        "[SUPABASE_SERVICE] Mensaje enviado OK — caso:", casoId,
        "messageId:", result.messageId,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      console.error("[SUPABASE_SERVICE] Error en enviarMensaje:", errorMessage);
      throw new Error(`No se pudo enviar el mensaje: ${errorMessage}`);
    }
  },
};

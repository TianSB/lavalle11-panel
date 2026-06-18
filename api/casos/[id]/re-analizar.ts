// ============================================================
// api/casos/[id]/re-analizar.ts
// POST /api/casos/:id/re-analizar — Re-analizar caso con IA
//
// Flujo:
//   1. Buscar caso + contacto en Supabase
//   2. Obtener todos los mensajes entrantes (inbound) + adjuntos
//   3. Construir EntradaCanónica con todo el historial acumulado
//   4. Llamar a Claude (o mock) vía getAIProvider()
//   5. Actualizar extracciones_ia con el nuevo análisis
//   6. Actualizar tipo_caso y prioridad en casos si cambió
//
// Request body: (vacío — no necesita parámetros)
//
// Response (success):
//   { ok: true, tipo_caso: string, confianza: number }
//
// Response (error):
//   { ok: false, error: string }
// ============================================================

import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import { getAIProvider } from "../../../src/services/ai/aiFactory.js";
import type { RespuestaCanónica } from "../../../src/services/ai/types.js";
import { buildEntradaDesdeHistorial } from "../../../src/services/ai/buildEntrada.js";
import { PRACTICAS_NUCLEAR } from "../../../src/constants.js";

// -----------------------------------------------------------
// Flags helper (versión simplificada sin depender de ParsedPayload)
// -----------------------------------------------------------

function buildReanalysisFlags(analisis: RespuestaCanónica): string[] {
  const flags = new Set<string>(analisis.flags ?? []);

  if (analisis.confianza_global < 0.7) {
    flags.add("baja_confianza");
  }
  if (analisis.obra_social?.toLowerCase().includes("ioma")) {
    flags.add("token_ioma");
  }
  if (analisis.tipo_practica && PRACTICAS_NUCLEAR.includes(analisis.tipo_practica as any)) {
    flags.add("chiclana");
  }
  if (analisis.campos_baja_confianza.length > 0) {
    flags.add("baja_confianza");
  }

  return Array.from(flags);
}

// -----------------------------------------------------------
// Handler
// -----------------------------------------------------------

export default async function handler(req: any, res: any) {
  // --- Solo POST ---
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  // --- Obtener ID del caso ---
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    res.status(400).json({ ok: false, error: "ID de caso requerido" });
    return;
  }

  // --- Obtener cliente Supabase ---
  let supabase: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabase = getSupabaseAdmin();
  } catch (err: any) {
    console.error("[RE-ANALIZAR] Error de configuración:", err.message);
    res.status(500).json({ ok: false, error: "Server configuration error" });
    return;
  }

  try {
    // --- 1. Obtener caso completo con extracciones_ia ---
    const { data: caso, error: casoError } = await supabase
      .from("casos")
      .select("*, extracciones_ia (*)")
      .eq("id", id)
      .single();

    if (casoError || !caso) {
      const msg = casoError?.code === "PGRST116"
        ? "Caso no encontrado"
        : "Error al consultar el caso";
      console.error("[RE-ANALIZAR] Error al obtener caso:", casoError?.message);
      res.status(casoError?.code === "PGRST116" ? 404 : 500).json({ ok: false, error: msg });
      return;
    }

    const contactName = caso.contact_name as string;
    const contactPhone = caso.contact_phone as string;
    const conversationUuid = caso.callbell_conversation_uuid as string;

    // --- 2-3. Construir EntradaCanónica con historial completo (helper compartido) ---
    const entrada = await buildEntradaDesdeHistorial(
      supabase,
      id,
      conversationUuid,
      contactName,
      contactPhone,
    );

    if (!entrada) {
      console.error("[RE-ANALIZAR] No se pudo construir la entrada para el caso:", id);
      res.status(500).json({ ok: false, error: "No se encontraron mensajes para re-analizar" });
      return;
    }

    // Obtener adjuntos para marcarlos como procesados después del análisis
    const { data: adjuntosRaw, error: adjError } = await supabase
      .from("adjuntos")
      .select("file_url")
      .eq("caso_id", id)
      .eq("processed_by_ia", false);

    if (adjError) {
      console.warn("[RE-ANALIZAR] Error al obtener adjuntos para marcar:", adjError.message);
    }

    // --- 4. Llamar a Claude con maxTokens 2048 para análisis completo ---
    let analisis: RespuestaCanónica;
    try {
      const provider = getAIProvider();
      console.log("[RE-ANALIZAR] Invocando IA — provider:", provider.nombre);
      analisis = await provider.analizarCaso(entrada, { maxTokens: 2048 });
      console.log(
        "[RE-ANALIZAR] Análisis completado —",
        "tipo:", analisis.tipo_caso,
        "confianza:", analisis.confianza_global,
      );
    } catch (err: any) {
      console.error("[RE-ANALIZAR] Error en análisis IA:", err.message);
      res.status(502).json({ ok: false, error: `Error al analizar con IA: ${err.message}` });
      return;
    }

    // --- 5. Construir flags para el re-análisis ---
    const flags = buildReanalysisFlags(analisis);
    const now = new Date().toISOString();

    // --- 6. Actualizar extracciones_ia con el nuevo análisis ---
    const { error: updateExtError } = await supabase
      .from("extracciones_ia")
      .update({
        paciente_nombre: analisis.paciente_nombre,
        paciente_dni: analisis.paciente_dni,
        obra_social: analisis.obra_social,
        nro_afiliado: analisis.nro_afiliado,
        nro_carnet: analisis.nro_carnet,
        practica: analisis.practica,
        tipo_practica: analisis.tipo_practica,
        medico_derivante: analisis.medico_derivante,
        matricula: analisis.matricula,
        diagnostico: analisis.diagnostico,
        motivo_solicitud: analisis.motivo_solicitud,
        confianza_global: analisis.confianza_global,
        confianza_campos: analisis.confianza_campos,
        campos_baja_confianza: analisis.campos_baja_confianza,
        flags,
        resumen: analisis.resumen,
        modelo_ia: analisis.modelo_ia,
        tiempo_procesamiento_ms: analisis.tiempo_procesamiento_ms,
        prompt_usado: analisis.prompt_usado,
        respuesta_raw: analisis.respuesta_raw,
        orden_tipo: analisis.orden_tipo,
        orden_url: analisis.orden_url,
      })
      .eq("caso_id", id);

    if (updateExtError) {
      console.error("[RE-ANALIZAR] Error al actualizar extracciones_ia:", updateExtError.message);
      res.status(500).json({ ok: false, error: "Error al guardar el análisis actualizado" });
      return;
    }

    // --- 7. Actualizar tipo_caso y prioridad en la tabla casos ---
    const { error: updateCasoError } = await supabase
      .from("casos")
      .update({
        tipo_caso: analisis.tipo_caso,
        prioridad: analisis.prioridad,
        updated_at: now,
      })
      .eq("id", id);

    if (updateCasoError) {
      console.warn("[RE-ANALIZAR] Error al actualizar tipo_caso:", updateCasoError.message);
      // No bloqueante
    }

    // --- 8. Marcar adjuntos como procesados por IA (no bloqueante) ---
    if (adjuntosRaw && adjuntosRaw.length > 0) {
      supabase
        .from("adjuntos")
        .update({ processed_by_ia: true })
        .eq("caso_id", id)
        .then(({ error: markError }) => {
          if (markError) {
            console.warn("[RE-ANALIZAR] Error al marcar adjuntos como procesados:", markError.message);
          }
        });
    }

    console.log("[RE-ANALIZAR] Re-análisis completado OK — caso:", id);

    res.status(200).json({
      ok: true,
      tipo_caso: analisis.tipo_caso,
      confianza: analisis.confianza_global,
      resumen: analisis.resumen,
    });
  } catch (err: any) {
    console.error("[RE-ANALIZAR] Error inesperado:", err.message);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
}

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

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import { getAIProvider } from "../../../src/services/ai/aiFactory.js";
import type { EntradaCanónica, RespuestaCanónica, AdjuntoCanónico } from "../../../src/services/ai/types.js";

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
  const practicasNuclear = ["pet_ct", "spect_ct", "centellograma", "perfusion_miocardica", "camara_gamma"];
  if (analisis.tipo_practica && practicasNuclear.includes(analisis.tipo_practica)) {
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

    // --- 2. Obtener todos los mensajes entrantes + adjuntos ---
    const { data: mensajes, error: msgError } = await supabase
      .from("mensajes")
      .select("id, content, callbell_created_at")
      .eq("caso_id", id)
      .eq("direction", "inbound")
      .order("callbell_created_at", { ascending: true });

    if (msgError) {
      console.error("[RE-ANALIZAR] Error al obtener mensajes:", msgError.message);
      res.status(500).json({ ok: false, error: "Error al leer mensajes del caso" });
      return;
    }

    // --- 2b. Obtener adjuntos asociados al caso ---
    const { data: adjuntosRaw, error: adjError } = await supabase
      .from("adjuntos")
      .select("file_url, file_type, file_name")
      .eq("caso_id", id);

    if (adjError) {
      console.warn("[RE-ANALIZAR] Error al obtener adjuntos:", adjError.message);
    }

    // --- 3. Construir historial de texto completo ---
    const mensajesTexto = (mensajes ?? [])
      .map((m) => {
        const ts = m.callbell_created_at
          ? new Date(m.callbell_created_at).toLocaleString("es-AR")
          : "—";
        return `[${ts}] ${m.content}`;
      })
      .join("\n\n");

    // Construir adjuntos canónicos desde los registros de adjuntos
    const adjuntosCanonicos: AdjuntoCanónico[] = (adjuntosRaw ?? [])
      .filter((a) => a.file_url)
      .map((a) => {
        const ft = (a.file_type as string) ?? "application/octet-stream";
        return {
          url: a.file_url as string,
          tipo: ft.startsWith("image/") ? ("image" as const)
            : ft === "application/pdf" ? ("pdf" as const)
            : ("otro" as const),
          mimeType: ft,
          nombre: (a.file_name as string) ?? undefined,
        };
      });

    // Si no hay adjuntos en la tabla adjuntos, intentar desde la URL de orden en extracciones_ia
    const extraccion = caso.extracciones_ia as Record<string, unknown> | null;
    const ordenUrl = extraccion?.orden_url as string | null;
    if (adjuntosCanonicos.length === 0 && ordenUrl) {
      adjuntosCanonicos.push({
        url: ordenUrl,
        tipo: "image" as const,
        mimeType: "image/jpeg",
      });
    }

    console.log(
      "[RE-ANALIZAR] Historial construido —",
      "mensajes:", (mensajes ?? []).length,
      "adjuntos:", adjuntosCanonicos.length,
      "texto:", mensajesTexto.length, "chars",
    );

    // --- 4. Construir EntradaCanónica y llamar a Claude ---
    const entrada: EntradaCanónica = {
      casoId: id,
      conversationUuid,
      textoMensaje: mensajesTexto || "Mensaje sin texto",
      adjuntos: adjuntosCanonicos,
      contactoNombre: contactName,
      contactoTelefono: contactPhone,
      timestamp: new Date().toISOString(),
    };

    let analisis: RespuestaCanónica;
    try {
      const provider = getAIProvider();
      console.log("[RE-ANALIZAR] Invocando IA — provider:", provider.nombre);
      analisis = await provider.analizarCaso(entrada);
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

// ============================================================
// api/casos/[id]/llamada.ts
// POST /api/casos/:id/llamada — Registrar llamada telefónica
//
// Flujo:
//   1. Recibir duración de la llamada + datos del asesor
//   2. Buscar caso en Supabase (para obtener el teléfono)
//   3. Insertar registro en tabla llamadas
//   4. Actualizar updated_at del caso
//
// Request body:
//   {
//     duracion_min: number,      // Duración estimada en minutos
//     asesorId: string,          // UUID del asesor que realizó la llamada
//     phone?: string             // Opcional: teléfono marcado (default: del caso)
//   }
//
// Response (success):
//   { ok: true, llamadaId: string }
//
// Response (error):
//   { ok: false, error: string }
// ============================================================

import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";

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

  // --- Validar body ---
  const { duracion_min, asesorId, phone } = req.body ?? {};

  if (duracion_min === undefined || duracion_min === null || typeof duracion_min !== "number" || duracion_min < 0) {
    res.status(400).json({ ok: false, error: "Campo 'duracion_min' requerido (número en minutos, >= 0)" });
    return;
  }

  if (!asesorId || typeof asesorId !== "string") {
    res.status(400).json({ ok: false, error: "Campo 'asesorId' requerido (UUID del asesor)" });
    return;
  }

  if (phone !== undefined && typeof phone !== "string") {
    res.status(400).json({ ok: false, error: "Campo 'phone' debe ser texto" });
    return;
  }

  // --- Obtener cliente Supabase ---
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err: any) {
    console.error("[LLAMADA] Error de configuración:", err.message);
    res.status(500).json({ ok: false, error: "Server configuration error" });
    return;
  }

  try {
    const now = new Date().toISOString();

    // --- 1. Obtener teléfono del caso (si no se pasó explícitamente) ---
    let telefono = phone;
    if (!telefono) {
      const { data: caso, error: casoError } = await supabase
        .from("casos")
        .select("id, contact_phone")
        .eq("id", id)
        .single();

      if (casoError || !caso) {
        const msg = casoError?.code === "PGRST116"
          ? "Caso no encontrado"
          : "Error al consultar el caso";
        console.error("[LLAMADA] Error al obtener caso:", casoError?.message);
        res.status(casoError?.code === "PGRST116" ? 404 : 500).json({ ok: false, error: msg });
        return;
      }

      telefono = caso.contact_phone as string;
      if (!telefono) {
        res.status(400).json({ ok: false, error: "El caso no tiene número de teléfono y no se proporcionó 'phone'" });
        return;
      }
    }

    // --- 2. Insertar registro de llamada ---
    const { data: llamada, error: insertError } = await supabase
      .from("llamadas")
      .insert({
        caso_id: id,
        asesor_id: asesorId,
        phone: telefono,
        canal: "whatsapp_desktop",
        initiated_at: now,
        duracion_min: duracion_min,
      })
      .select("id")
      .single();

    if (insertError || !llamada) {
      console.error("[LLAMADA] Error al insertar llamada:", insertError?.message);
      res.status(500).json({ ok: false, error: "Error al registrar la llamada" });
      return;
    }

    const llamadaId = llamada.id as string;
    console.log("[LLAMADA] Llamada registrada OK — id:", llamadaId, "caso:", id, "duracion:", duracion_min, "min");

    // --- 3. Actualizar updated_at del caso (no bloqueante) ---
    const { error: touchError } = await supabase
      .from("casos")
      .update({ updated_at: now })
      .eq("id", id);

    if (touchError) {
      console.warn("[LLAMADA] Error al actualizar updated_at del caso:", touchError.message);
    }

    res.status(200).json({ ok: true, llamadaId });
  } catch (err: any) {
    console.error("[LLAMADA] Error inesperado:", err.message);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
}

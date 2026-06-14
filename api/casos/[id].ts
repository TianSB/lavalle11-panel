// ============================================================
// api/casos/[id].ts
// GET /api/casos/:id — Caso individual con todos los joins
//
// Path param:
//   id — ID del caso (ej: LV-0001)
// ============================================================

import { getSupabaseAdmin, CASOS_SELECT } from "../_lib/supabaseAdmin";

export default async function handler(req: any, res: any) {
  // --- Solo GET ---
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // --- Obtener ID del path ---
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "ID de caso requerido" });
    return;
  }

  // --- Obtener cliente Supabase ---
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err: any) {
    console.error("[API] Error de configuración:", err.message);
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("casos")
      .select(CASOS_SELECT)
      .eq("id", id)
      .single();

    if (error) {
      // Caso no encontrado
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Caso no encontrado" });
        return;
      }
      console.error("[API] Error al obtener caso:", error.message);
      res.status(500).json({ error: "Error al consultar el caso" });
      return;
    }

    // --- Obtener mensajes del caso ---
    const { data: mensajes, error: msgError } = await supabase
      .from("mensajes")
      .select("*")
      .eq("caso_id", id)
      .order("callbell_created_at", { ascending: true });

    if (msgError) {
      console.warn("[API] Error al obtener mensajes:", msgError.message);
    }

    res.status(200).json({
      data: {
        ...data,
        mensajes: mensajes ?? [],
      },
    });
  } catch (err: any) {
    console.error("[API] Error inesperado:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

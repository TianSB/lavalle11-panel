// ============================================================
// api/casos.ts
// GET /api/casos — Lista todos los casos (admin, bypass RLS)
//
// Query params opcionales:
//   ?estado=pendiente        — filtrar por estado
//   ?asesor_id=uuid          — filtrar por asesor
//   ?limit=20                — límite de resultados (default: 50)
//   ?offset=0                — paginación
// ============================================================

import { getSupabaseAdmin, CASOS_SELECT } from "./_lib/supabaseAdmin.js";

export default async function handler(req: any, res: any) {
  // --- Solo GET ---
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
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
    // --- Construir query con filtros opcionales ---
    const { estado, asesor_id, limit: limitStr, offset: offsetStr } = req.query;

    let query = supabase
      .from("casos")
      .select(CASOS_SELECT)
      .order("created_at", { ascending: false });

    if (estado) {
      query = query.eq("estado", estado);
    }

    if (asesor_id) {
      query = query.eq("asesor_id", asesor_id);
    }

    const limit = limitStr ? parseInt(limitStr as string, 10) : 50;
    const offset = offsetStr ? parseInt(offsetStr as string, 10) : 0;

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("[API] Error al obtener casos:", error.message);
      res.status(500).json({ error: "Error al consultar casos" });
      return;
    }

    // --- Obtener count total respetando filtros para paginación ---
    let countQuery = supabase
      .from("casos")
      .select("*", { count: "exact", head: true });

    if (estado) {
      countQuery = countQuery.eq("estado", estado);
    }

    if (asesor_id) {
      countQuery = countQuery.eq("asesor_id", asesor_id);
    }

    const { count } = await countQuery;

    res.status(200).json({
      data: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error("[API] Error inesperado:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

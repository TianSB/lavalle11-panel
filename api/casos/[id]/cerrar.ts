// ============================================================
// api/casos/[id]/cerrar.ts
// POST /api/casos/:id/cerrar — Cerrar caso sin resolución
//
// Flujo:
//   1. Recibir closing_reason + nota_interna opcional
//   2. Validar closing_reason contra lista de razones válidas
//   3. Buscar caso en Supabase (para conocer estado anterior)
//   4. Actualizar caso: estado=cerrado, closing_reason, resolved_at
//   5. Si hay nota_interna, insertar en tabla seguimientos
//   6. Registrar evento de auditoría (no bloqueante)
//
// Request body:
//   {
//     closing_reason: string (ver tipos válidos abajo),
//     nota_interna?: string,
//     asesorId?: string
//   }
//
// Closing reasons válidas:
//   turno_asignado, turno_reprogramado, turno_cancelado,
//   consulta_resuelta, consulta_resuelta_portal, esperando_respuesta,
//   derivado_chiclana, practica_no_disponible, equivocado,
//   error_datos_ris, presupuesto_pendiente, sin_resolucion
//
// Response (success):
//   { ok: true }
//
// Response (error):
//   { ok: false, error: string }
// ============================================================

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import { auditCerrado } from "../../../src/services/auditService.js";

// -----------------------------------------------------------
// Closing reasons válidas (debe coincidir con ClosingReason type)
// -----------------------------------------------------------

const CLOSING_REASONS_VALIDAS = [
  "turno_asignado",
  "turno_reprogramado",
  "turno_cancelado",
  "consulta_resuelta",
  "consulta_resuelta_portal",
  "esperando_respuesta",
  "derivado_chiclana",
  "practica_no_disponible",
  "equivocado",
  "error_datos_ris",
  "presupuesto_pendiente",
  "sin_resolucion",
] as const;

type ClosingReason = (typeof CLOSING_REASONS_VALIDAS)[number];

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
  const { closing_reason, nota_interna, asesorId } = req.body ?? {};
  const correlationId = crypto.randomUUID();

  if (!closing_reason || typeof closing_reason !== "string") {
    res.status(400).json({ ok: false, error: "Campo 'closing_reason' requerido" });
    return;
  }

  // Validar contra lista de razones conocidas
  if (!CLOSING_REASONS_VALIDAS.includes(closing_reason as ClosingReason)) {
    res.status(400).json({
      ok: false,
      error: `Closing reason inválida: '${closing_reason}'. Válidas: ${CLOSING_REASONS_VALIDAS.join(", ")}`,
    });
    return;
  }

  if (nota_interna !== undefined && typeof nota_interna !== "string") {
    res.status(400).json({ ok: false, error: "Campo 'nota_interna' debe ser texto" });
    return;
  }

  // --- Obtener cliente Supabase ---
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err: any) {
    console.error("[CERRAR] Error de configuración:", err.message);
    res.status(500).json({ ok: false, error: "Server configuration error" });
    return;
  }

  try {
    const now = new Date().toISOString();

    // --- 1. Obtener estado anterior del caso ---
    const { data: caso, error: casoError } = await supabase
      .from("casos")
      .select("id, estado")
      .eq("id", id)
      .single();

    if (casoError || !caso) {
      const msg = casoError?.code === "PGRST116"
        ? "Caso no encontrado"
        : "Error al consultar el caso";
      console.error("[CERRAR] Error al obtener caso:", casoError?.message);
      res.status(casoError?.code === "PGRST116" ? 404 : 500).json({ ok: false, error: msg });
      return;
    }

    const estadoAnterior = (caso.estado as string) ?? "pendiente";

    // --- 2. Actualizar caso como cerrado ---
    const { error: updateError } = await supabase
      .from("casos")
      .update({
        estado: "cerrado",
        closing_reason: closing_reason,
        resolved_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[CERRAR] Error al cerrar caso:", updateError.message);
      res.status(500).json({ ok: false, error: "Error al cerrar el caso" });
      return;
    }

    console.log("[CERRAR] Caso cerrado OK — id:", id, "reason:", closing_reason);

    // --- 3. Si hay nota_interna, insertar en seguimientos ---
    if (nota_interna && nota_interna.trim().length > 0) {
      const { error: segError } = await supabase
        .from("seguimientos")
        .insert({
          caso_id: id,
          nota: nota_interna.trim(),
          fecha: null, // Sin fecha de seguimiento — el caso está cerrado
          estado: "completado",
          created_at: now,
        });

      if (segError) {
        console.error("[CERRAR] Error al insertar nota interna:", segError.message);
        // No bloqueante — el caso ya se cerró
      } else {
        console.log("[CERRAR] Nota interna registrada para caso:", id);
      }
    }

    // --- 4. Auditar (no bloqueante) ---
    auditCerrado(supabase, {
      casoId: id,
      closingReason: closing_reason,
      estadoAnterior,
      asesorId: asesorId ?? null,
      correlationId,
    }).catch((err: unknown) => console.error("[AUDIT] Error:", err));

    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[CERRAR] Error inesperado:", err.message);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
}

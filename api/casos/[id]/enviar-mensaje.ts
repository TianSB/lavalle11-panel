// ============================================================
// api/casos/[id]/enviar-mensaje.ts
// POST /api/casos/:id/enviar-mensaje — Enviar mensaje WhatsApp
//                                                via Callbell API
//
// Request body:
//   { mensaje: string }
//
// Response (success):
//   { ok: true, messageId: string }
//
// Response (error):
//   { ok: false, error: string }
// ============================================================

import { enviarMensajeCallbell } from "../../../src/services/callbell/messagesApi.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";

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
  const { mensaje } = req.body ?? {};
  if (!mensaje || typeof mensaje !== "string" || mensaje.trim().length === 0) {
    res.status(400).json({ ok: false, error: "Campo 'mensaje' requerido (texto no vacío)" });
    return;
  }

  // --- Obtener cliente Supabase ---
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err: any) {
    console.error("[API] Error de configuración:", err.message);
    res.status(500).json({ ok: false, error: "Server configuration error" });
    return;
  }

  try {
    // --- Obtener datos del caso (teléfono + conversation UUID) ---
    const { data: caso, error: casoError } = await supabase
      .from("casos")
      .select("id, contact_phone, callbell_conversation_uuid")
      .eq("id", id)
      .single();

    if (casoError || !caso) {
      const msg = casoError?.code === "PGRST116"
        ? "Caso no encontrado"
        : "Error al consultar el caso";
      console.error("[API] Error al obtener caso:", casoError?.message);
      res.status(casoError?.code === "PGRST116" ? 404 : 500).json({ ok: false, error: msg });
      return;
    }

    const phone = caso.contact_phone as string;
    const conversationUuid = caso.callbell_conversation_uuid as string;

    if (!phone) {
      res.status(400).json({ ok: false, error: "El caso no tiene número de teléfono" });
      return;
    }

    // --- Enviar mensaje via Callbell API ---
    const result = await enviarMensajeCallbell(phone, mensaje.trim(), conversationUuid);

    if (!result.success) {
      console.error("[API] Error al enviar mensaje:", result.error);
      res.status(502).json({ ok: false, error: result.error });
      return;
    }

    console.log("[API] Mensaje enviado OK — caso:", id, "messageId:", result.messageId);

    res.status(200).json({
      ok: true,
      messageId: result.messageId,
    });
  } catch (err: any) {
    console.error("[API] Error inesperado:", err.message);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
}

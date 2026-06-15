// ============================================================
// api/casos/[id]/derivar.ts
// POST /api/casos/:id/derivar — Derivar a Medicina Nuclear (Chiclana)
//
// Flujo:
//   1. Buscar caso + extracciones_ia en Supabase
//   2. Validar que tipo_practica sea de Medicina Nuclear (BR-03):
//      pet_ct, spect_ct, centellograma, perfusion_miocardica, camara_gamma
//   3. Construir mensaje de notificación para Chiclana
//   4. Enviar notificación WhatsApp al número de Chiclana
//   5. Marcar caso como cerrado (closing_reason = derivado_chiclana)
//   6. Crear turno con sede = chiclana
//   7. Registrar evento de auditoría
//
// Request body:
//   {
//     notas?: string,       // Notas adicionales para la derivación
//     asesorId?: string     // UUID del asesor que deriva
//   }
//
// Response (success):
//   { ok: true, messageId: string }
//
// Response (error):
//   { ok: false, error: string }
// ============================================================

import crypto from "node:crypto";
import { enviarMensajeCallbell } from "../../../src/services/callbell/messagesApi.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import { auditCerrado } from "../../../src/services/auditService.js";

// -----------------------------------------------------------
// Constantes
// -----------------------------------------------------------

/** Prácticas de Medicina Nuclear que requieren derivación a Chiclana (BR-03) */
const PRACTICAS_NUCLEAR = [
  "pet_ct",
  "spect_ct",
  "centellograma",
  "perfusion_miocardica",
  "camara_gamma",
] as const;

type PracticaNuclear = (typeof PRACTICAS_NUCLEAR)[number];

/**
 * Número de WhatsApp de la sede Chiclana.
 * Configurable via env var CHICLANA_PHONE. Default para desarrollo.
 */
const CHICLANA_PHONE = process.env.CHICLANA_PHONE ?? "";

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
  const { notas, asesorId } = req.body ?? {};
  const correlationId = crypto.randomUUID();

  if (notas !== undefined && typeof notas !== "string") {
    res.status(400).json({ ok: false, error: "Campo 'notas' debe ser texto" });
    return;
  }

  // --- Validar que CHICLANA_PHONE esté configurado ---
  if (!CHICLANA_PHONE) {
    console.error("[DERIVAR] CHICLANA_PHONE no configurado");
    res.status(500).json({ ok: false, error: "Número de Chiclana no configurado (CHICLANA_PHONE)" });
    return;
  }

  // --- Obtener cliente Supabase ---
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err: any) {
    console.error("[DERIVAR] Error de configuración:", err.message);
    res.status(500).json({ ok: false, error: "Server configuration error" });
    return;
  }

  try {
    const now = new Date().toISOString();

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
      console.error("[DERIVAR] Error al obtener caso:", casoError?.message);
      res.status(casoError?.code === "PGRST116" ? 404 : 500).json({ ok: false, error: msg });
      return;
    }

    const extraccion = caso.extracciones_ia as Record<string, unknown> | null;
    const tipoPractica = (extraccion?.tipo_practica as string) ?? "";
    const practica = (extraccion?.practica as string) ?? "estudio no especificado";
    const pacienteNombre = (extraccion?.paciente_nombre as string) ?? caso.contact_name;
    const contactPhone = caso.contact_phone as string;

    // --- 2. Validar que la práctica sea de Medicina Nuclear (BR-03) ---
    const esNuclear = PRACTICAS_NUCLEAR.includes(tipoPractica as PracticaNuclear);

    if (!esNuclear) {
      console.warn(
        "[DERIVAR] Práctica no nuclear — tipo_practica:",
        tipoPractica,
        "para caso:",
        id,
      );
      res.status(400).json({
        ok: false,
        error: `La práctica '${tipoPractica}' no requiere derivación a Chiclana. Prácticas nucleares: ${PRACTICAS_NUCLEAR.join(", ")}`,
      });
      return;
    }

    console.log("[DERIVAR] Práctica nuclear detectada — tipo:", tipoPractica, "caso:", id);

    // --- 3. Construir mensaje de notificación para Chiclana ---
    const notasTexto = notas ? `\n\n📝 *Notas del asesor:*\n${notas}` : "";
    const mensajeChiclana =
      `🔄 *Derivación recibida - Instituto Lavalle 11*\n\n` +
      `Se deriva paciente a *Medicina Nuclear (Chiclana)*:\n\n` +
      `👤 *Paciente:* ${pacienteNombre}\n` +
      `📞 *Teléfono:* ${contactPhone}\n` +
      `🔬 *Práctica:* ${practica} (${tipoPractica})\n` +
      `🏷️ *Caso:* ${id}` +
      `${notasTexto}\n\n` +
      `Por favor contactar al paciente para coordinar el turno.`;

    console.log("[DERIVAR] Mensaje Chiclana construido — longitud:", mensajeChiclana.length, "caracteres");

    // --- 4. Enviar notificación WhatsApp a Chiclana ---
    const result = await enviarMensajeCallbell(
      CHICLANA_PHONE,
      mensajeChiclana,
      undefined, // No es una conversación existente de Callbell
    );

    if (!result.success) {
      console.error("[DERIVAR] Error al enviar notificación a Chiclana:", result.error);
      res.status(502).json({ ok: false, error: `Error al notificar a Chiclana: ${result.error}` });
      return;
    }

    console.log("[DERIVAR] Notificación enviada a Chiclana OK — messageId:", result.messageId);

    // --- 5. Marcar caso como cerrado (derivado) ---
    const { error: updateError } = await supabase
      .from("casos")
      .update({
        estado: "cerrado",
        closing_reason: "derivado_chiclana",
        resolved_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[DERIVAR] Error al cerrar caso:", updateError.message);
      // La notificación ya se envió — no revertir
    }

    // --- 6. Crear turno con sede = chiclana (para trazabilidad) ---
    const { error: turnoError } = await supabase
      .from("turnos")
      .insert({
        caso_id: id,
        sede: "chiclana",
        fecha: now.split("T")[0], // Fecha de derivación como referencia
        hora: now.split("T")[1]?.slice(0, 5) ?? "00:00",
        estado: "confirmado",
        instrucciones: ["Derivado a Medicina Nuclear"],
        mensaje_enviado: mensajeChiclana,
        confirmado_at: now,
      });

    if (turnoError) {
      console.error("[DERIVAR] Error al insertar turno:", turnoError.message);
    }

    // --- 7. Auditar (no bloqueante) ---
    auditCerrado(supabase, {
      casoId: id,
      closingReason: "derivado_chiclana",
      estadoAnterior: (caso.estado as string) ?? "pendiente",
      asesorId: asesorId ?? null,
      correlationId,
    }).catch((err: unknown) => console.error("[AUDIT] Error:", err));

    console.log("[DERIVAR] Derivación completada OK — caso:", id);

    res.status(200).json({
      ok: true,
      messageId: result.messageId,
    });
  } catch (err: any) {
    console.error("[DERIVAR] Error inesperado:", err.message);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
}

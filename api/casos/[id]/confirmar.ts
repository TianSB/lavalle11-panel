// ============================================================
// api/casos/[id]/confirmar.ts
// POST /api/casos/:id/confirmar — Confirmar turno
//
// Flujo:
//   1. Recibir fecha, hora, sede, instrucciones del body
//   2. Buscar el caso en Supabase (incluye extracciones_ia)
//   3. Construir mensaje WhatsApp con template estándar
//   4. Si obra_social === "IOMA" → incluir BR-06 warning
//   5. Enviar mensaje via Callbell API
//   6. Marcar caso como cerrado (closing_reason = "turno_asignado")
//   7. Registrar evento de auditoría
//
// Request body:
//   {
//     fecha: string (ISO date),
//     hora: string (HH:mm),
//     sede: "lavalle11" | "chiclana",
//     instrucciones?: string[],
//     asesorId?: string
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

const SEDE_LABELS: Record<string, string> = {
  lavalle11: "Lavalle 11",
  chiclana: "Chiclana (Medicina Nuclear)",
};

const IOMA_WARNING =
  "⚠️ *ATENCIÓN:* recordá traer token de autorización IOMA";

/** Formatear fecha ISO a DD/MM/YYYY */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Obtener primer nombre */
function getFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  // Capitalizar primera letra, resto minúscula
  const first = parts[0] ?? fullName;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
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

  // --- Validar body ---
  const { fecha, hora, sede, instrucciones, asesorId } = req.body ?? {};
  const correlationId = crypto.randomUUID();

  if (!fecha || typeof fecha !== "string") {
    res.status(400).json({ ok: false, error: "Campo 'fecha' requerido (ISO date)" });
    return;
  }
  if (!hora || typeof hora !== "string") {
    res.status(400).json({ ok: false, error: "Campo 'hora' requerido (HH:mm)" });
    return;
  }
  if (!sede || !["lavalle11", "chiclana"].includes(sede)) {
    res.status(400).json({ ok: false, error: "Campo 'sede' requerido (lavalle11 | chiclana)" });
    return;
  }

  const instruccionesArr: string[] = Array.isArray(instrucciones) ? instrucciones : [];

  // --- Obtener cliente Supabase ---
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err: any) {
    console.error("[CONFIRMAR] Error de configuración:", err.message);
    res.status(500).json({ ok: false, error: "Server configuration error" });
    return;
  }

  try {
    // --- 1. Obtener caso completo ---
    const { data: caso, error: casoError } = await supabase
      .from("casos")
      .select("*, extracciones_ia (*)")
      .eq("id", id)
      .single();

    if (casoError || !caso) {
      const msg = casoError?.code === "PGRST116"
        ? "Caso no encontrado"
        : "Error al consultar el caso";
      console.error("[CONFIRMAR] Error al obtener caso:", casoError?.message);
      res.status(casoError?.code === "PGRST116" ? 404 : 500).json({ ok: false, error: msg });
      return;
    }

    const phone = caso.contact_phone as string;
    const conversationUuid = caso.callbell_conversation_uuid as string;
    const extraccion = caso.extracciones_ia as Record<string, unknown> | null;

    if (!phone) {
      res.status(400).json({ ok: false, error: "El caso no tiene número de teléfono" });
      return;
    }

    // --- 2. Extraer datos del paciente ---
    const practica = (extraccion?.practica as string) ?? "estudio solicitado";
    const obraSocial = (extraccion?.obra_social as string) ?? "";
    const pacienteNombre = (extraccion?.paciente_nombre as string) ?? caso.contact_name;
    const firstName = getFirstName(pacienteNombre);

    // --- 3. Construir mensaje WhatsApp ---
    const dateFormatted = formatDate(fecha);
    const sedeText = SEDE_LABELS[sede] ?? sede;

    // Instrucciones específicas seleccionadas por el asesor
    const instruccionesText = instruccionesArr.length > 0
      ? `\n\n📋 Recordá:\n${instruccionesArr.map((i) => `• ${i}`).join("\n")}`
      : "";

    // BR-06: Advertencia de token IOMA
    const esIOMA = obraSocial.toLowerCase().includes("ioma");
    const iomaWarning = esIOMA ? `\n\n${IOMA_WARNING}` : "";

    const mensaje =
      `✅ *Turno confirmado - Instituto Lavalle 11*\n\n` +
      `Hola ${firstName} 👋\n\n` +
      `Te confirmamos tu turno para *${practica}*:\n\n` +
      `📅 *Fecha:* ${dateFormatted}\n` +
      `⏰ *Horario:* ${hora} hs\n` +
      `📍 *Sede:* ${sedeText}` +
      `${instruccionesText}` +
      `${iomaWarning}\n\n` +
      `📱 Ante cualquier cambio comunicate al 291-456-7890\n\n` +
      `¡Gracias por confiar en nosotros! 🙌`;

    console.log("[CONFIRMAR] Mensaje construido — longitud:", mensaje.length, "caracteres");

    // --- 4. Enviar mensaje via Callbell API ---
    const result = await enviarMensajeCallbell(phone, mensaje, conversationUuid);

    if (!result.success) {
      console.error("[CONFIRMAR] Error al enviar mensaje:", result.error);
      res.status(502).json({ ok: false, error: result.error });
      return;
    }

    console.log("[CONFIRMAR] Mensaje enviado OK — messageId:", result.messageId);

    // --- 5. Marcar caso como cerrado ---
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("casos")
      .update({
        estado: "cerrado",
        closing_reason: "turno_asignado",
        resolved_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[CONFIRMAR] Error al cerrar caso:", updateError.message);
      // El mensaje ya se envió — no revertir
    }

    // --- 6. Registrar turno en tabla turnos ---
    const { error: turnoError } = await supabase
      .from("turnos")
      .insert({
        caso_id: id,
        sede,
        fecha,
        hora,
        estado: "confirmado",
        instrucciones: instruccionesArr,
        mensaje_enviado: mensaje,
        confirmado_at: now,
      });

    if (turnoError) {
      console.error("[CONFIRMAR] Error al insertar turno:", turnoError.message);
    }

    // --- 7. Auditar (no bloqueante) ---
    auditCerrado(supabase, {
      casoId: id,
      closingReason: "turno_asignado",
      estadoAnterior: caso.estado ?? "pendiente",
      asesorId: asesorId ?? null,
      correlationId,
    }).catch((err: unknown) => console.error("[AUDIT] Error:", err));

    console.log("[CONFIRMAR] Turno confirmado OK — caso:", id);

    res.status(200).json({
      ok: true,
      messageId: result.messageId,
    });
  } catch (err: any) {
    console.error("[CONFIRMAR] Error inesperado:", err.message);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
}

// ============================================================
// casoService.ts
// CRUD de casos — server-side (usa cliente admin de Supabase)
// ============================================================
// Este servicio es llamado desde el webhook handler y desde
// los endpoints REST de la API. Recibe el cliente Supabase
// como parámetro para evitar depender de process.env en src/.
//
// NOTA: En Fase 2 NO se ejecuta análisis IA. Los campos de
// extraccion_ia se crean con placeholders que serán
// reemplazados en Fase 3.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedPayload, ParsedMessage, ParsedContact } from "../callbell/types.js";
import { auditCasoCreado } from "../auditService.js";

// -----------------------------------------------------------
// Constants
// -----------------------------------------------------------

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export interface CreateCasoInput {
  callbell_conversation_uuid: string;
  contact_phone: string;
  contact_name: string;
  tipo_caso: string;
  estado: string;
  prioridad: string;
}

export interface CreateExtraccionInput {
  caso_id: string;
  paciente_nombre: string;
  flags: string[];
  orden_url: string | null;
  orden_tipo: string | null;
  resumen: string;
}

export interface CasoRow {
  id: string;
  callbell_conversation_uuid: string;
  contact_phone: string;
  contact_name: string;
  estado: string;
  prioridad: string;
  tipo_caso: string;
  asesor_id: string | null;
  closing_reason: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------
// Queries
// -----------------------------------------------------------

/**
 * Busca un caso existente por callbell_conversation_uuid.
 * Devuelve el caso completo o null si no existe.
 */
export async function findByCallbellUuid(
  supabase: SupabaseClient,
  callbellUuid: string,
): Promise<CasoRow | null> {
  try {
    console.log("[CASO.FIND] VERSION CHECK 2026-06-14-A");
    console.log("[CASO.FIND] Inicio búsqueda", callbellUuid);

    console.log("[CASO.FIND] ANTES DEL QUERY");

    // --- DIAGNÓSTICO: fetch directo con timeout 5s ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const baseUrl = supabaseUrl!.replace(/\/+$/, '');
      const diagUrl = `${baseUrl}/rest/v1/casos?callbell_conversation_uuid=eq.${callbellUuid}&select=id`;
      const diagRes = await fetch(diagUrl, {
        headers: {
          "apikey": serviceKey!,
          "Authorization": `Bearer ${serviceKey!}`
        },
        signal: controller.signal
      });
      console.log("[DIAG] FETCH STATUS:", diagRes.status, "OK:", diagRes.ok);
    } catch (diagErr: any) {
      console.log("[DIAG] FETCH ERROR — name:", diagErr.name, "message:", diagErr.message);
    } finally {
      clearTimeout(timeoutId);
    }
    // --- FIN DIAGNÓSTICO ---

    const result = await supabase
      .from("casos")
      .select("*")
      .eq("callbell_conversation_uuid", callbellUuid)
      .maybeSingle();

    console.log("[CASO.FIND] DESPUES DEL QUERY");
    console.log("[CASO.FIND] Error:", result.error);
    console.log("[CASO.FIND] Data:", result.data);

    if (result.error) {
      console.error("[CASO] Error al buscar por callbell_uuid:", result.error);
      return null;
    }

    return result.data as CasoRow | null;
  } catch (err) {
    console.error("[CASO.FIND] EXCEPTION", err);
    throw err;
  }
}

/**
 * Crea un nuevo caso y su registro de extraccion_ia asociado.
 * Devuelve el caso creado o null si hubo error.
 */
export async function createCaso(
  supabase: SupabaseClient,
  parsed: ParsedPayload,
  correlationId: string,
): Promise<CasoRow | null> {
  console.log("[CASO] Iniciando createCaso");

  const contact = parsed.contact!;
  const conversation = parsed.conversation;
  console.log("[CASO] Datos parseados — conv_uuid:", conversation.uuid, "phone:", contact.phone, "name:", contact.name);

  // --- 1. Insertar el caso ---
  const casoInput: CreateCasoInput = {
    callbell_conversation_uuid: conversation.uuid,
    contact_phone: contact.phone,
    contact_name: contact.name,
    // TODO: [Fase 3] Reemplazar con tipo_caso inferido por IA
    tipo_caso: "A",
    estado: "pendiente",
    prioridad: "normal",
  };

  console.log("[CASO] Ejecutando INSERT casos con datos:", JSON.stringify(casoInput));
  const { data: caso, error: casoError } = await supabase
    .from("casos")
    .insert(casoInput)
    .select()
    .single();

  if (casoError || !caso) {
    console.error("[CASO] Resultado INSERT casos — ERROR:", casoError);
    return null;
  }
  console.log("[CASO] Resultado INSERT casos — OK, id:", (caso as CasoRow).id);

  const casoRow = caso as CasoRow;

  // --- 2. Insertar extraccion_ia con placeholders ---
  const flags: string[] = [];
  if (parsed.message?.has_misrx_link) {
    flags.push("orden_digital_misrx");
  }

  const extraccionInput: CreateExtraccionInput = {
    caso_id: casoRow.id,
    paciente_nombre: contact.name,
    flags,
    orden_url: parsed.message?.has_misrx_link
      ? extractMisRxUrl(parsed.message.text)
      : null,
    orden_tipo: parsed.message?.orden_tipo ?? null,
    // TODO: [Fase 3] Reemplazar con resumen generado por IA
    resumen: `Mensaje recibido de ${contact.name}. Pendiente de análisis por IA.`,
  };

  console.log("[CASO] Ejecutando INSERT extracciones_ia para caso:", casoRow.id);
  const { error: extraccionError } = await supabase
    .from("extracciones_ia")
    .insert({
      caso_id: extraccionInput.caso_id,
      paciente_nombre: extraccionInput.paciente_nombre,
      practica: "Pendiente de análisis",
      tipo_practica: "otro",
      confianza_global: 0.0,
      resumen: extraccionInput.resumen,
      modelo_ia: "pendiente",
      flags: extraccionInput.flags.length > 0 ? extraccionInput.flags : null,
      orden_url: extraccionInput.orden_url,
      orden_tipo: extraccionInput.orden_tipo,
    });

  if (extraccionError) {
    console.error("[CASO] Resultado INSERT extracciones_ia — ERROR:", extraccionError);
    // El caso se creó igual — el asesor puede verlo aunque falten datos IA
  } else {
    console.log("[CASO] Resultado INSERT extracciones_ia — OK");
  }

  // --- 3. Auditar (semántico, no bloqueante) ---
  auditCasoCreado(supabase, {
    casoId: casoRow.id,
    conversationUuid: conversation.uuid,
    tipoCaso: casoInput.tipo_caso,
    estadoInicial: casoInput.estado,
    contactoNombre: contact.name,
    contactoTelefono: contact.phone,
    correlationId,
  }).catch((err) => console.error("[AUDIT] Error no bloqueante:", err));

  console.log("[CASO] createCaso completado — caso:", casoRow.id);
  return casoRow;
}

/**
 * Busca el primer link de MisRx en el texto del mensaje.
 */
function extractMisRxUrl(text: string): string | null {
  const match = text.match(/https?:\/\/misrx\.com\.ar\/prestacion\?token=[a-zA-Z0-9-]+/i);
  return match?.[0] ?? null;
}

/**
 * Actualiza el historial de un caso existente cuando llega un nuevo mensaje.
 * Crea un registro en mensajes, actualiza el contacto si cambió,
 * y actualiza flags/orden_tipo si el nuevo mensaje contiene MisRx.
 */
export async function updateCasoHistorial(
  supabase: SupabaseClient,
  casoId: string,
  message: ParsedMessage,
  contact: ParsedContact | null,
  timestamp: string | null,
): Promise<boolean> {
  // --- 1. Insertar el mensaje ---
  const { error: msgError } = await supabase.from("mensajes").insert({
    caso_id: casoId,
    callbell_message_id: message.callbell_uuid,
    direction: "inbound",
    content_type: "text",
    content: message.text,
    sender_type: "patient",
    status: "received",
    callbell_created_at: timestamp ?? new Date().toISOString(),
  });

  if (msgError) {
    console.error("[CASO] Error al insertar mensaje:", msgError);
    return false;
  }

  // --- 2. Actualizar nombre de contacto si cambió ---
  if (contact) {
    const { error: updateError } = await supabase
      .from("casos")
      .update({ contact_name: contact.name })
      .eq("id", casoId);

    if (updateError) {
      console.error("[CASO] Error al actualizar contacto:", updateError);
    }
  }

  // --- 3. Actualizar flags y orden_tipo si el nuevo mensaje tiene MisRx ---
  if (message.has_misrx_link) {
    const misrxUrl = extractMisRxUrl(message.text);

    const updateData: Record<string, unknown> = {
      orden_tipo: "misrx_link",
    };
    if (misrxUrl) {
      updateData.orden_url = misrxUrl;
    }
    // NOTA: No se puede hacer array_append vía REST sin RPC.
    // El flag 'orden_digital_misrx' se asigna al crear el caso.
    // Para casos existentes, orden_tipo='misrx_link' es suficiente.

    const { error: updateError } = await supabase
      .from("extracciones_ia")
      .update(updateData)
      .eq("caso_id", casoId);

    if (updateError) {
      console.error("[CASO] Error al actualizar MisRx en caso existente:", updateError);
    }
  }

  return true;
}

/**
 * Cierra un caso en Supabase cuando Callbell cierra la conversación.
 */
export async function closeCaso(
  supabase: SupabaseClient,
  callbellUuid: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("casos")
    .update({
      estado: "cerrado",
      closing_reason: "sin_resolucion",
      resolved_at: new Date().toISOString(),
    })
    .eq("callbell_conversation_uuid", callbellUuid);

  if (error) {
    console.error("[CASO] Error al cerrar caso:", error);
    return false;
  }

  return true;
}

/**
 * Asigna un asesor a un caso (conversation_assigned).
 */
export async function assignCaso(
  _supabase: SupabaseClient,
  callbellUuid: string,
  asesorUuid: string,
): Promise<boolean> {
  // Nota: Callbell envía el UUID del asesor, que podría no coincidir
  // con nuestro UUID de Supabase Auth. Esto requerirá mapeo en Fase 4.
  console.log(
    "[CASO] conversation_assigned ignorado por ahora —",
    `callbell_uuid=${callbellUuid}, asesor_uuid=${asesorUuid}`,
  );
  return true;
}

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
import type { RespuestaCanónica } from "../ai/types.js";
import { auditCasoCreado } from "../auditService.js";
import { PRACTICAS_NUCLEAR } from "../../constants.js";

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
  flags: string[] | null;
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
    console.log("[CASO.FIND] VERSION CHECK 2026-06-14-D");
    console.log("[CASO.FIND] Inicio búsqueda", callbellUuid);

    console.log("[CASO.FIND] ANTES DEL QUERY");

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
  analisis?: RespuestaCanónica,
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
    tipo_caso: analisis?.tipo_caso ?? "A",
    estado: "pendiente",
    prioridad: analisis?.prioridad ?? "normal",
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

  // --- 2. Insertar extraccion_ia con datos reales o placeholders ---
  const flags = buildFlags(analisis, parsed);

  const extraccionInput: CreateExtraccionInput = {
    caso_id: casoRow.id,
    paciente_nombre: analisis?.paciente_nombre ?? contact.name,
    flags,
    orden_url: analisis?.orden_url
      ?? (parsed.message?.has_misrx_link ? extractMisRxUrl(parsed.message.text) : null),
    orden_tipo: analisis?.orden_tipo
      ?? (parsed.message?.has_misrx_link ? "misrx_link" : null)
      ?? (parsed.message?.orden_tipo ?? null),
    resumen: analisis?.resumen ?? `Mensaje recibido de ${contact.name}. Pendiente de análisis por IA.`,
  };

  console.log("[CASO] Ejecutando INSERT extracciones_ia para caso:", casoRow.id);
  const { error: extraccionError } = await supabase
    .from("extracciones_ia")
    .insert({
      caso_id: extraccionInput.caso_id,
      paciente_nombre: extraccionInput.paciente_nombre,
      paciente_dni: analisis?.paciente_dni ?? null,
      obra_social: analisis?.obra_social ?? null,
      nro_afiliado: analisis?.nro_afiliado ?? null,
      nro_carnet: analisis?.nro_carnet ?? null,
      practica: analisis?.practica ?? "Pendiente de análisis",
      tipo_practica: analisis?.tipo_practica ?? "otro",
      medico_derivante: analisis?.medico_derivante ?? null,
      matricula: analisis?.matricula ?? null,
      diagnostico: analisis?.diagnostico ?? null,
      motivo_solicitud: analisis?.motivo_solicitud ?? null,
      confianza_global: analisis?.confianza_global ?? 0.0,
      confianza_campos: analisis?.confianza_campos ?? null,
      campos_baja_confianza: analisis?.campos_baja_confianza ?? null,
      flags: extraccionInput.flags,
      resumen: extraccionInput.resumen,
      modelo_ia: analisis?.modelo_ia ?? "pendiente",
      tiempo_procesamiento_ms: analisis?.tiempo_procesamiento_ms ?? null,
      prompt_usado: analisis?.prompt_usado ?? null,
      respuesta_raw: analisis?.respuesta_raw ?? null,
      orden_tipo: extraccionInput.orden_tipo,
      orden_url: extraccionInput.orden_url,
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
 * Construye flags combinando las detectadas por IA con las reglas del sistema.
 * Flags 🤖 (Claude detecta): ayuno, aines, orden_incompleta, orden_ilegible
 * Flags ⚙️ (sistema aplica): baja_confianza, token_ioma, chiclana, error_ia, orden_digital_misrx
 */
export function buildFlags(
  analisis: RespuestaCanónica | undefined,
  parsed: ParsedPayload,
): string[] | null {
  const flags = new Set<string>(analisis?.flags ?? []);

  // Flags de sistema (reglas de negocio, no delegadas a la IA)
  if (analisis && analisis.confianza_global < 0.7) {
    flags.add("baja_confianza");
  }
  if (analisis?.obra_social?.toLowerCase().includes("ioma")) {
    flags.add("token_ioma");
  }
  if (analisis?.tipo_practica && PRACTICAS_NUCLEAR.includes(analisis.tipo_practica as any)) {
    flags.add("chiclana");
  }
  if (parsed.message?.has_misrx_link) {
    flags.add("orden_digital_misrx");
  }
  if (analisis && analisis.campos_baja_confianza.length > 0) {
    flags.add("baja_confianza");
  }
  if (!analisis) {
    flags.add("error_ia");
  }

  return flags.size > 0 ? Array.from(flags) : null;
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
 * Reabre un caso cerrado cuando llega un nuevo mensaje en la misma conversación.
 * Resetea estado, closing_reason y resolved_at.
 * Devuelve true si se actualizó correctamente.
 */
export async function reabrirCaso(
  supabase: SupabaseClient,
  casoId: string,
): Promise<boolean> {
  console.log("[CASO] Reabriendo caso cerrado:", casoId);

  const { error } = await supabase
    .from("casos")
    .update({
      estado: "pendiente",
      closing_reason: null,
      resolved_at: null,
    })
    .eq("id", casoId);

  if (error) {
    console.error("[CASO] Error al reabrir caso:", error);
    return false;
  }

  console.log("[CASO] Caso reabierto OK:", casoId);
  return true;
}

/**
 * Actualiza extracciones_ia con el nuevo análisis de IA al reabrir un caso.
 * Usa UPDATE por caso_id (la relación es 1:1).
 */
export async function actualizarExtraccionIA(
  supabase: SupabaseClient,
  casoId: string,
  analisis: RespuestaCanónica,
  parsed: ParsedPayload,
): Promise<void> {
  console.log("[CASO] Actualizando extracciones_ia para caso reabierto:", casoId);

  const { error } = await supabase
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
      flags: buildFlags(analisis, parsed),
      resumen: analisis.resumen,
      modelo_ia: analisis.modelo_ia,
      tiempo_procesamiento_ms: analisis.tiempo_procesamiento_ms,
      prompt_usado: analisis.prompt_usado,
      respuesta_raw: analisis.respuesta_raw,
      orden_tipo: analisis.orden_tipo,
      orden_url: analisis.orden_url,
    })
    .eq("caso_id", casoId);

  if (error) {
    console.error("[CASO] Error al actualizar extracciones_ia:", error);
  } else {
    console.log("[CASO] extracciones_ia actualizada OK para caso:", casoId);
  }
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

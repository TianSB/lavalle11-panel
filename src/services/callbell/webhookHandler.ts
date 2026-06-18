// ============================================================
// webhookHandler.ts
// Lógica de negocio del webhook de Callbell.
// Orquesta el flujo: validar → parsear → buscar caso →
// crear o actualizar → responder.
// ============================================================
// Separada del handler HTTP para poder testearla de forma
// unitaria sin depender de Vercel.
// ============================================================

import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedPayload } from "./types.js";
import type { EntradaCanónica, RespuestaCanónica } from "../ai/types.js";
import { mapAttachmentsToAdjuntos } from "../ai/buildEntrada.js";
import { getAIProvider } from "../ai/aiFactory.js";
import { parsePayload, validatePayload } from "./payloadParser.js";
import { guardarAdjuntoEnStorage } from "../storage/adjuntosStorage.js";
import {
  findByCallbellUuid,
  createCaso,
  updateCasoHistorial,
  closeCaso,
  reabrirCaso,
  actualizarExtraccionIA,
  assignCaso,
} from "../supabase/casoService.js";

// -----------------------------------------------------------
// Storage helper
// -----------------------------------------------------------

/**
 * Guarda los adjuntos de un mensaje en Supabase Storage y
 * registra las URLs permanentes en la tabla adjuntos.
 *
 * Retorna las URLs permanentes de Storage que se guardaron exitosamente.
 * Si falla, retorna array vacío (no bloquea el flujo del webhook).
 */
async function saveAttachmentsToStorage(
  supabase: SupabaseClient,
  attachments: { url: string; content_type: string | null; file_name: string | null }[],
  casoId: string,
  mensajeUuid: string,
): Promise<string[]> {
  if (!attachments || attachments.length === 0) return [];

  const storageUrls: string[] = [];

  for (let i = 0; i < attachments.length; i++) {
    const att = attachments[i]!;
    if (!att || !att.url) continue;

    // Guardar en Storage
    const urlPermanente = await guardarAdjuntoEnStorage(
      supabase,
      att.url,
      casoId,
      mensajeUuid,
      i,
    );

    if (!urlPermanente) {
      console.warn("[WEBHOOK] No se pudo guardar adjunto en Storage — continuando");
      continue;
    }

    // Insertar registro en la tabla adjuntos con URL permanente
    const { error: insertError } = await supabase
      .from("adjuntos")
      .insert({
        caso_id: casoId,
        file_url: urlPermanente,
        file_type: att.content_type ?? "image/jpeg",
        file_name: att.file_name ?? `orden_${i + 1}.jpg`,
        mensaje_id: mensajeUuid,
        processed_by_ia: false,
      });

    if (insertError) {
      console.warn(
        "[WEBHOOK] Error al insertar adjunto en BD:",
        insertError.message,
        "— URL permanente:",
        urlPermanente,
      );
    } else {
      storageUrls.push(urlPermanente);
      console.log(
        "[WEBHOOK] Adjunto guardado en Storage y registrado — caso:",
        casoId,
        "url:",
        urlPermanente,
      );
    }
  }

  return storageUrls;
}

/**
 * Actualiza orden_url en extracciones_ia con la primera URL de Storage,
 * si hay adjuntos recién guardados y el caso no tenía orden_url previa.
 */
async function updateOrdenUrlFromStorage(
  supabase: SupabaseClient,
  casoId: string,
  storageUrls: string[],
): Promise<void> {
  if (storageUrls.length === 0) return;

  // Solo actualizar si el caso aún no tiene orden_url (o es una URL de Callbell expirada)
  const { error: updateError } = await supabase
    .from("extracciones_ia")
    .update({
      orden_url: storageUrls[0]!,
      orden_tipo: "imagen",
    })
    .eq("caso_id", casoId);

  if (updateError) {
    console.warn(
      "[WEBHOOK] Error al actualizar orden_url con Storage URL:",
      updateError.message,
      "— caso:",
      casoId,
    );
  } else {
    console.log(
      "[WEBHOOK] orden_url actualizada con Storage URL — caso:",
      casoId,
      "url:",
      storageUrls[0],
    );
  }
}

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export interface WebhookResult {
  /** HTTP status code sugerido (siempre 200 para Callbell) */
  status: number;
  /** Mensaje de log interno */
  message: string;
  /** ID del caso afectado (si aplica) */
  casoId: string | null;
  /** Si se creó un caso nuevo */
  created: boolean;
}

// -----------------------------------------------------------
// Main handler
// -----------------------------------------------------------

/**
 * Procesa un payload de webhook de Callbell.
 * Responde 200 SIEMPRE (incluso en errores internos) para
 * no desactivar el webhook en Callbell.
 */
export async function handleWebhook(
  supabase: SupabaseClient,
  rawBody: unknown,
): Promise<WebhookResult> {
  // --- 1. Validar estructura básica ---
  if (!rawBody || typeof rawBody !== "object") {
    console.warn("[WEBHOOK] Payload inválido: no es un objeto JSON");
    return { status: 200, message: "Payload inválido", casoId: null, created: false };
  }
  console.log("[STEP 1] Payload validado");

  // --- 2. Parsear ---
  const parsed = parsePayload(rawBody as any);
  console.log("[STEP 2] Payload parseado — event:", parsed.event, "conv_uuid:", parsed.conversation.uuid, "contact:", parsed.contact?.phone);

  const validationError = validatePayload(parsed);
  if (validationError) {
    console.warn(validationError);
    return { status: 200, message: validationError, casoId: null, created: false };
  }

  // --- 3. Despachar según evento ---
  switch (parsed.event) {
    case "message_created":
      return handleMessageCreated(supabase, parsed);

    case "conversation_opened":
      console.log("[WEBHOOK] conversation_opened recibido — sin acción en v1 (caso se activa al recibir mensaje)");
      return { status: 200, message: "conversation_opened ignorado", casoId: null, created: false };

    case "conversation_closed":
      return handleConversationClosed(supabase, parsed);

    case "conversation_assigned":
      return handleConversationAssigned(supabase, parsed);

    default:
      console.log(`[WEBHOOK] Evento ignorado: ${parsed.event}`);
      return { status: 200, message: `Evento ignorado: ${parsed.event}`, casoId: null, created: false };
  }
}

// -----------------------------------------------------------
// Event handlers
// -----------------------------------------------------------

/**
 * Procesa un evento message_created con status "received".
 * Tres ramas:
 *   1. Caso existe y está activo → actualizar historial
 *   2. Caso existe pero está cerrado → reabrir + re-analizar con IA
 *   3. No existe → crear caso nuevo
 */
async function handleMessageCreated(
  supabase: SupabaseClient,
  parsed: ParsedPayload,
): Promise<WebhookResult> {
  const correlationId = crypto.randomUUID();
  const conversationUuid = parsed.conversation.uuid;
  const message = parsed.message;
  const contact = parsed.contact;

  if (!message) {
    console.warn("[WEBHOOK] message_created sin datos de mensaje");
    return { status: 200, message: "Sin datos de mensaje", casoId: null, created: false };
  }

  // Ignorar mensajes salientes (del asesor) — solo procesar entrantes
  if (message.status !== "received") {
    console.log(`[WEBHOOK] message_created ignorado (status: ${message.status})`);
    return { status: 200, message: `Mensaje ignorado (status: ${message.status})`, casoId: null, created: false };
  }

  if (!contact) {
    console.warn("[WEBHOOK] message_created sin datos de contacto");
    return { status: 200, message: "Sin datos de contacto", casoId: null, created: false };
  }

  // --- 1. Buscar caso existente ---
  console.log("[STEP 3] Buscando caso existente por conversation_uuid:", conversationUuid);
  const existingCaso = await findByCallbellUuid(supabase, conversationUuid);
  console.log("[STEP 4] Resultado búsqueda — encontrado:", !!existingCaso, existingCaso ? "id:" + existingCaso.id + " estado:" + existingCaso.estado : "no encontrado");

  // --- RAMA 1: caso existe y está activo → agregar mensaje al historial ---
  if (existingCaso && existingCaso.estado !== "cerrado") {
    console.log("[STEP 7] Actualizando historial para caso existente:", existingCaso.id);

    const updated = await updateCasoHistorial(
      supabase,
      existingCaso.id,
      message,
      contact,
      parsed.timestamp,
    );

    if (!updated) {
      console.error("[STEP 7.ERR] Error al actualizar historial del caso", existingCaso.id);
    }

    // Guardar adjuntos del nuevo mensaje en Storage
    // y actualizar orden_url con URL permanente
    if (message.attachments && message.attachments.length > 0) {
      const storageUrls = await saveAttachmentsToStorage(
        supabase,
        message.attachments,
        existingCaso.id,
        message.callbell_uuid,
      );
      await updateOrdenUrlFromStorage(supabase, existingCaso.id, storageUrls);
    }

    console.log("[STEP 8] Fin exitoso — caso existente actualizado:", existingCaso.id);
    return {
      status: 200,
      message: `Caso ${existingCaso.id} actualizado con nuevo mensaje`,
      casoId: existingCaso.id,
      created: false,
    };
  }

  // --- RAMA 2: caso existe pero está cerrado → reabrir + re-analizar con IA ---
  if (existingCaso && existingCaso.estado === "cerrado") {
    console.log("[STEP 5] Caso cerrado detectado — reabriendo:", existingCaso.id);

    const reabierto = await reabrirCaso(supabase, existingCaso.id);
    if (!reabierto) {
      console.error("[STEP 5.ERR] No se pudo reabrir el caso:", existingCaso.id);
      return { status: 200, message: "Error al reabrir caso", casoId: existingCaso.id, created: false };
    }

    const adjuntos = mapAttachmentsToAdjuntos(parsed.message?.attachments ?? []);

    const entrada: EntradaCanónica = {
      casoId: existingCaso.id,
      conversationUuid,
      textoMensaje: message.text ?? "",
      adjuntos,
      contactoNombre: contact.name,
      contactoTelefono: contact.phone,
      timestamp: parsed.timestamp ?? new Date().toISOString(),
    };

    let analisisIA: RespuestaCanónica | null = null;
    try {
      const provider = getAIProvider();
      analisisIA = await provider.analizarCaso(entrada);
      console.log(`[STEP 5.IA] Análisis completado — tipo: ${analisisIA.tipo_caso}, confianza: ${analisisIA.confianza_global}`);
    } catch (err) {
      console.error("[STEP 5.IA] Error en análisis IA al reabrir — continuando:", err);
    }

    // Actualizar tipo_caso y prioridad en casos si el análisis lo cambió
    if (analisisIA) {
      await supabase
        .from("casos")
        .update({ tipo_caso: analisisIA.tipo_caso, prioridad: analisisIA.prioridad })
        .eq("id", existingCaso.id);

      await actualizarExtraccionIA(supabase, existingCaso.id, analisisIA, parsed);
    }

    // Guardar adjuntos del nuevo mensaje en Storage
    // y actualizar orden_url con URL permanente
    if (message.attachments && message.attachments.length > 0) {
      const storageUrls = await saveAttachmentsToStorage(
        supabase,
        message.attachments,
        existingCaso.id,
        message.callbell_uuid,
      );
      await updateOrdenUrlFromStorage(supabase, existingCaso.id, storageUrls);
    }

    console.log("[STEP 8] Fin exitoso — caso reabierto:", existingCaso.id);
    return {
      status: 200,
      message: `Caso ${existingCaso.id} reabierto`,
      casoId: existingCaso.id,
      created: false,
    };
  }

  // --- RAMA 3: no existe → crear nuevo caso con IA ---
  console.log("[STEP 5] Analizando con IA:", conversationUuid);

  const adjuntos = mapAttachmentsToAdjuntos(message.attachments ?? []);

  const entrada: EntradaCanónica = {
    casoId: "PENDING",
    conversationUuid,
    textoMensaje: message.text ?? "",
    adjuntos,
    contactoNombre: contact.name,
    contactoTelefono: contact.phone,
    timestamp: parsed.timestamp ?? new Date().toISOString(),
  };

  let analisisIA: RespuestaCanónica | null = null;
  try {
    const provider = getAIProvider();
    analisisIA = await provider.analizarCaso(entrada);
    console.log(`[STEP 5.IA] Análisis completado — tipo: ${analisisIA.tipo_caso}, confianza: ${analisisIA.confianza_global}`);
  } catch (err) {
    console.error("[STEP 5.IA] Error en análisis IA — continuando con placeholders:", err);
  }

  console.log("[STEP 5] Creando caso en BD:", conversationUuid);
  const nuevoCaso = await createCaso(supabase, parsed, correlationId, analisisIA ?? undefined);

  if (!nuevoCaso) {
    console.error("[STEP 6.ERR] createCaso devolvió null — no se insertó el caso");
    return { status: 200, message: "Error al crear caso en BD", casoId: null, created: false };
  }

  console.log("[STEP 6] Resultado createCaso — caso creado:", nuevoCaso.id);

  // Guardar adjuntos del mensaje en Storage
  // y actualizar orden_url con URL permanente
  if (message.attachments && message.attachments.length > 0) {
    const storageUrls = await saveAttachmentsToStorage(
      supabase,
      message.attachments,
      nuevoCaso.id,
      message.callbell_uuid,
    );
    await updateOrdenUrlFromStorage(supabase, nuevoCaso.id, storageUrls);
  }

  console.log("[STEP 8] Fin exitoso — nuevo caso creado:", nuevoCaso.id);

  return {
    status: 200,
    message: `Caso ${nuevoCaso.id} creado`,
    casoId: nuevoCaso.id,
    created: true,
  };
}

/**
 * Procesa un evento conversation_closed.
 * Marca el caso como cerrado en Supabase.
 */
async function handleConversationClosed(
  supabase: SupabaseClient,
  parsed: ParsedPayload,
): Promise<WebhookResult> {
  const conversationUuid = parsed.conversation.uuid;
  console.log("[STEP 3] conversation_closed — buscando caso por uuid:", conversationUuid);

  const closed = await closeCaso(supabase, conversationUuid);

  if (!closed) {
    console.warn(`[WEBHOOK] No se pudo cerrar el caso ${conversationUuid} (puede no existir aún)`);
  }

  return {
    status: 200,
    message: closed
      ? `Caso ${conversationUuid} cerrado`
      : `No se encontró caso para cerrar: ${conversationUuid}`,
    casoId: null,
    created: false,
  };
}

/**
 * Procesa un evento conversation_assigned.
 * Actualiza el asesor asignado al caso.
 * NOTA: Requiere mapeo de UUIDs de Callbell a Supabase (Fase 4).
 */
async function handleConversationAssigned(
  supabase: SupabaseClient,
  parsed: ParsedPayload,
): Promise<WebhookResult> {
  const conversationUuid = parsed.conversation.uuid;
  const contact = parsed.contact;

  await assignCaso(supabase, conversationUuid, contact?.uuid ?? "");

  return {
    status: 200,
    message: `conversation_assigned para ${conversationUuid} (requiere mapeo Fase 4)`,
    casoId: null,
    created: false,
  };
}

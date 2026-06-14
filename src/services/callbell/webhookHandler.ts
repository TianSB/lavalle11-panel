// ============================================================
// webhookHandler.ts
// Lógica de negocio del webhook de Callbell.
// Orquesta el flujo: validar → parsear → buscar caso →
// crear o actualizar → responder.
// ============================================================
// Separada del handler HTTP para poder testearla de forma
// unitaria sin depender de Vercel.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedPayload } from "./types.js";
import { parsePayload, validatePayload } from "./payloadParser.js";
import {
  findByCallbellUuid,
  createCaso,
  updateCasoHistorial,
  closeCaso,
  assignCaso,
} from "../supabase/casoService.js";

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

  // --- 2. Parsear ---
  const parsed = parsePayload(rawBody as any);

  const validationError = validatePayload(parsed);
  if (validationError) {
    console.warn(validationError);
    return { status: 200, message: validationError, casoId: null, created: false };
  }

  // --- 3. Despachar según evento ---
  switch (parsed.event) {
    case "message_created":
      return handleMessageCreated(supabase, parsed);

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
 * Si el caso ya existe y no está cerrado → actualiza historial.
 * Si no existe o está cerrado → crea caso nuevo.
 */
async function handleMessageCreated(
  supabase: SupabaseClient,
  parsed: ParsedPayload,
): Promise<WebhookResult> {
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
  const existingCaso = await findByCallbellUuid(supabase, conversationUuid);

  // --- 2. Si existe y no está cerrado → actualizar historial ---
  if (existingCaso && existingCaso.estado !== "cerrado") {
    console.log(
      `[WEBHOOK] Caso existente encontrado: ${existingCaso.id} (estado: ${existingCaso.estado}). Actualizando historial...`,
    );

    const updated = await updateCasoHistorial(
      supabase,
      existingCaso.id,
      message,
      contact,
      parsed.timestamp,
    );

    if (!updated) {
      console.error(`[WEBHOOK] Error al actualizar historial del caso ${existingCaso.id}`);
    }

    return {
      status: 200,
      message: `Caso ${existingCaso.id} actualizado con nuevo mensaje`,
      casoId: existingCaso.id,
      created: false,
    };
  }

  // --- 3. Si no existe o está cerrado → crear nuevo ---
  // TODO: [Fase 3] Aquí se invocará el análisis de IA (Claude Adapter)
  // para determinar tipo_caso, extraer datos de la orden médica,
  // calcular confianza y generar flags automáticos.
  // Por ahora se crea con tipo_caso por defecto y placeholders.
  const nuevoCaso = await createCaso(supabase, parsed);

  if (!nuevoCaso) {
    console.error("[WEBHOOK] Error al crear nuevo caso");
    return { status: 200, message: "Error al crear caso en BD", casoId: null, created: false };
  }

  console.log(`[WEBHOOK] Nuevo caso creado: ${nuevoCaso.id}`);

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

// ============================================================
// payloadParser.ts
// Parsea el payload crudo del webhook de Callbell a estructuras
// internas tipadas. Detecta adjuntos, links de MisRx, etc.
// ============================================================

import type {
  CallbellPayload,
  ParsedPayload,
  ParsedMessage,
  ParsedContact,
  ParsedConversation,
  OrdenTipo,
  CallbellAttachment,
} from "./types.js";

const MISRX_PATTERN = /misrx\.com\.ar\/prestacion/i;

/**
 * Determina el tipo de orden médica basado en el texto y adjuntos.
 */
function detectOrdenTipo(
  text: string | null,
  attachments: CallbellAttachment[],
): OrdenTipo | null {
  // MisRx link takes priority
  if (text && MISRX_PATTERN.test(text)) {
    return "misrx_link";
  }

  const hasImage = attachments.some((a) => a.type === "image");
  const hasPdf = attachments.some((a) => a.type === "document");

  if (hasImage) return "imagen";
  if (hasPdf) return "pdf";

  return null;
}

/**
 * Detecta si el texto contiene un link de MisRx.
 */
function hasMisRxLink(text: string | null): boolean {
  return text !== null && MISRX_PATTERN.test(text);
}

/**
 * Parsea el payload crudo de Callbell en nuestra estructura interna.
 */
export function parsePayload(raw: CallbellPayload): ParsedPayload {
  const msg = raw.payload.message ?? null;
  const contactRaw = raw.payload.contact ?? null;
  const conversationRaw = raw.payload.conversation ?? null;

  // --- Parse message ---
  let parsedMessage: ParsedMessage | null = null;

  if (msg) {
    const text = msg.content ?? "";
    parsedMessage = {
      callbell_uuid: msg.uuid,
      status: msg.status,
      text,
      has_misrx_link: hasMisRxLink(text),
      orden_tipo: detectOrdenTipo(text, msg.attachments ?? []),
      attachments: msg.attachments ?? [],
    };
  }

  // --- Parse contact ---
  let parsedContact: ParsedContact | null = null;

  if (contactRaw) {
    parsedContact = {
      uuid: contactRaw.uuid,
      name: contactRaw.name ?? "Desconocido",
      phone: contactRaw.phoneNumber,
    };
  }

  // --- Parse conversation ---
  let parsedConversation: ParsedConversation = {
    uuid: conversationRaw?.uuid ?? "",
    status: conversationRaw?.status ?? "open",
  };

  // --- Timestamp ---
  const timestamp = msg?.createdAt ?? null;

  return {
    event: raw.event,
    message: parsedMessage,
    contact: parsedContact,
    conversation: parsedConversation,
    timestamp,
  };
}

/**
 * Valida que el payload parseado tenga los campos mínimos requeridos.
 * Devuelve un mensaje de error o null si es válido.
 */
export function validatePayload(parsed: ParsedPayload): string | null {
  if (!parsed.conversation.uuid) {
    return "[PARSER] Falta conversation.uuid en el payload";
  }

  if (parsed.event === "message_created" && !parsed.message) {
    return "[PARSER] Evento message_created sin message en el payload";
  }

  return null;
}

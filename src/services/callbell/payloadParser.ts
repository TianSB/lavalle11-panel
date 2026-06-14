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
  ParsedAttachment,
  CallbellMessageStatus,
} from "./types.js";

const MISRX_PATTERN = /misrx\.com\.ar\/prestacion/i;

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

/**
 * Extrae el UUID de conversación desde una URL tipo:
 *   https://dash.callbell.eu/chat/22267cab03f048cda257b3ee1d79fc76
 *
 * Busca en este orden:
 *   1. payload.contact.conversationHref (message_created)
 *   2. payload.href (conversation_closed)
 */
function extractConversationUuid(raw: CallbellPayload): string | null {
  const hrefUrl = raw.payload.contact?.conversationHref ?? raw.payload.href;

  if (!hrefUrl) return null;

  try {
    const parsed = new URL(hrefUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Infiere el tipo de attachment desde la extensión de la URL.
 */
function inferAttachmentType(url: string): "image" | "document" {
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return "document";
  // Por omisión se asume imagen (órdenes médicas escaneadas/fotografiadas)
  return "image";
}

/**
 * Determina el tipo de orden médica basado en el texto y adjuntos.
 */
function detectOrdenTipo(
  text: string | null,
  attachments: ParsedAttachment[],
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

// -----------------------------------------------------------
// Main parser
// -----------------------------------------------------------

/**
 * Parsea el payload crudo de Callbell en nuestra estructura interna.
 *
 * NOTA: El payload real de Callbell tiene los campos del mensaje
 * planos en payload.* (NO anidados en payload.message), y el UUID
 * de conversación vive dentro de payload.contact.conversationHref
 * como URL (NO en payload.conversation.uuid).
 */
export function parsePayload(raw: CallbellPayload): ParsedPayload {
  const payload = raw.payload;
  const contactRaw = payload.contact;

  // --- Parse message (fields are flat at payload level) ---
  let parsedMessage: ParsedMessage | null = null;

  if (payload.uuid && payload.status) {
    const text = payload.text ?? "";
    const rawAttachments: string[] = payload.attachments ?? [];

    // Convert string[] URLs to ParsedAttachment[]
    const parsedAttachments: ParsedAttachment[] = rawAttachments.map((url) => ({
      url,
      type: inferAttachmentType(url),
    }));

    parsedMessage = {
      callbell_uuid: payload.uuid,
      status: payload.status as CallbellMessageStatus,
      text,
      has_misrx_link: hasMisRxLink(text),
      orden_tipo: detectOrdenTipo(text, parsedAttachments),
      attachments: parsedAttachments,
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

  // --- Parse conversation UUID from conversationHref URL ---
  const conversationUuid = extractConversationUuid(raw);

  const parsedConversation: ParsedConversation = {
    uuid: conversationUuid ?? "",
    status: "open",
  };

  // --- Timestamp ---
  const timestamp = payload.createdAt ?? null;

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

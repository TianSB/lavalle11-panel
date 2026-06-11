// ============================================================
// Callbell Webhook — Payload Types & Internal Parsed Structures
// ============================================================

export type CallbellEvent =
  | "message_created"
  | "conversation_opened"
  | "conversation_closed"
  | "conversation_assigned";

export type CallbellMessageStatus =
  | "received"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type CallbellContentType =
  | "text"
  | "image"
  | "document"
  | "audio"
  | "video"
  | "sticker";

export type CallbellConversationStatus = "open" | "closed" | "assigned";

// -----------------------------------------------------------
// Raw payload from Callbell (as documented in API spec)
// -----------------------------------------------------------

export interface CallbellAttachment {
  url: string;
  type: "image" | "document";
}

export interface CallbellMessagePayload {
  uuid: string;
  status: CallbellMessageStatus;
  content: string | null;
  contentType: CallbellContentType;
  createdAt: string;
  attachments: CallbellAttachment[];
}

export interface CallbellContactPayload {
  uuid: string;
  name: string | null;
  phoneNumber: string;
}

export interface CallbellConversationPayload {
  uuid: string;
  status: CallbellConversationStatus;
}

export interface CallbellPayload {
  event: CallbellEvent;
  payload: {
    message?: CallbellMessagePayload;
    contact?: CallbellContactPayload;
    conversation?: CallbellConversationPayload;
  };
}

// -----------------------------------------------------------
// Parsed structures — internal to our system
// -----------------------------------------------------------

export type OrdenTipo = "imagen" | "pdf" | "misrx_link" | "no_aplica";

export interface ParsedAttachment {
  url: string;
  type: "image" | "document";
}

export interface ParsedMessage {
  callbell_uuid: string;
  status: CallbellMessageStatus;
  text: string;
  has_misrx_link: boolean;
  orden_tipo: OrdenTipo | null;
  attachments: ParsedAttachment[];
}

export interface ParsedContact {
  uuid: string;
  name: string;
  phone: string;
}

export interface ParsedConversation {
  uuid: string;
  status: CallbellConversationStatus;
}

export interface ParsedPayload {
  event: CallbellEvent;
  message: ParsedMessage | null;
  contact: ParsedContact | null;
  conversation: ParsedConversation;
  /** Raw ISO timestamp from the message, or null if not a message event */
  timestamp: string | null;
}

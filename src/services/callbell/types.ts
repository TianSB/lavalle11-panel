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

// -----------------------------------------------------------
// Raw payload from Callbell (real structure from production)
// -----------------------------------------------------------

export interface CallbellContactPayload {
  uuid: string;
  name?: string | null;
  phoneNumber: string;
  /** URL containing the conversation UUID, e.g. https://dash.callbell.eu/chat/{uuid} */
  conversationHref?: string;
}

export interface CallbellAttachmentPayload {
  url: string;
  content_type?: string;
  file_name?: string;
  size?: number;
}

export interface CallbellPayload {
  event: CallbellEvent;
  payload: {
    // Message fields (flat at payload level for message_created)
    uuid?: string;
    status?: string;
    text?: string | null;
    contentType?: string;
    /** Array of attachment URLs or attachment objects */
    attachments?: (string | CallbellAttachmentPayload)[];
    createdAt?: string;

    // Contact
    contact?: CallbellContactPayload;

    // Conversation_closed fields
    /** Conversation URL for conversation_closed events */
    href?: string;
    closingReason?: string;
    closedAt?: string;

    // Other common fields
    to?: string;
    from?: string;
    channel?: string;
  };
}

// -----------------------------------------------------------
// Parsed structures — internal to our system
// -----------------------------------------------------------

export type OrdenTipo = "imagen" | "pdf" | "misrx_link" | "no_aplica";

export interface ParsedAttachment {
  url: string;
  type: "image" | "document";
  content_type: string | null;
  file_name: string | null;
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
  status: "open" | "closed" | "assigned";
}

export interface ParsedPayload {
  event: CallbellEvent;
  message: ParsedMessage | null;
  contact: ParsedContact | null;
  conversation: ParsedConversation;
  /** Raw ISO timestamp from the message, or null if not a message event */
  timestamp: string | null;
}

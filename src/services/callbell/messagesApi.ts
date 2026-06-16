// ============================================================
// messagesApi.ts
// Servicio centralizado para la Callbell Messages API (REST).
//
// Responsabilidad: enviar mensajes de WhatsApp a través de
// la API de Callbell. Este es el único punto de integración
// con la API REST de Callbell (sender).
//
// Endpoints:
//   - Con conversación existente: POST /v1/conversations/{uuid}/messages
//     (respeta política de 24hs de WhatsApp — reply en conversación)
//   - Sin conversación: POST /v1/messages/send
//     (nuevo mensaje outbound, para notificaciones a números nuevos)
//
// Auth: Bearer token via CALLBELL_API_TOKEN
//
// Todos los endpoints serverless y servicios de negocio
// deben usar esta capa, no llamar a fetch directamente.
// ============================================================

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

/**
 * Resultado tipado de enviarMensajeCallbell.
 * Éxito: { success: true, messageId: string }
 * Error: { success: false, error: string }
 */
export type EnviarMensajeResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

/**
 * Respuesta esperada de la API de Callbell.
 * Compatible con ambos endpoints (conversation reply y messages/send).
 */
interface CallbellApiResponse {
  message?: {
    uuid?: string;
  };
  error?: string;
}

// -----------------------------------------------------------
// Constants
// -----------------------------------------------------------

/** URL base de la API de Callbell (versión 1) */
const CALLBELL_API_BASE = "https://api.callbell.eu/v1";

/** Timeout para la request a Callbell (10s) */
const TIMEOUT_MS = 10_000;

/** Cantidad de reintentos en caso de error transitorio */
const MAX_RETRIES = 1;

// -----------------------------------------------------------
// Helper: construir headers de autenticación
// -----------------------------------------------------------

function getAuthHeaders(): Record<string, string> {
  const token = process.env.CALLBELL_API_TOKEN;
  if (!token) {
    throw new Error("[CALLBELL_API] CALLBELL_API_TOKEN no configurado");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// -----------------------------------------------------------
// Helper: delay para retry
// -----------------------------------------------------------

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// -----------------------------------------------------------
// Core: enviar mensaje via Callbell API
// -----------------------------------------------------------

/**
 * Envía un mensaje de texto a través de la API de Callbell.
 *
 * - Si se provee `conversationUuid`: responde DENTRO de la conversación
 *   existente (POST /v1/conversations/{uuid}/messages). Esto respeta la
 *   política de 24hs de WhatsApp porque es un reply, no un mensaje nuevo.
 * - Si NO se provee: crea un mensaje nuevo outbound
 *   (POST /v1/messages/send). Solo para notificaciones a números sin
 *   conversación previa (ej: derivación a Chiclana).
 *
 * @param phone - Número de teléfono del destinatario
 * @param message - Texto del mensaje a enviar
 * @param conversationUuid - UUID de la conversación en Callbell (obligatorio
 *        para replies dentro de conversación existente)
 * @returns EnviarMensajeResult
 *
 * Logs estructurados obligatorios para trazabilidad.
 * Timeout de 10s. Reintenta 1 vez en caso de error transitorio.
 */
export async function enviarMensajeCallbell(
  phone: string,
  message: string,
  conversationUuid?: string,
): Promise<EnviarMensajeResult> {
  console.log(
    "[CALLBELL_API] Enviando mensaje — to:",
    phone,
    "conv:",
    conversationUuid ?? "N/A (nuevo mensaje)",
  );

  // Validar número de teléfono
  // Acepta formato internacional (+549291...) y formato Callbell (549291...)
  if (!phone || (!phone.startsWith("+") && !/^549\d{10,11}$/.test(phone))) {
    const errMsg = `Número de teléfono inválido: ${phone}`;
    console.error("[CALLBELL_API] Error:", errMsg);
    return { success: false, error: errMsg };
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const headers = getAuthHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // Elegir endpoint según si tenemos conversación existente
      let url: string;
      let body: Record<string, unknown>;

      if (conversationUuid) {
        // Reply dentro de conversación existente — respeta política 24hs
        url = `${CALLBELL_API_BASE}/conversations/${conversationUuid}/messages`;
        body = { text: message };
        console.log("[CALLBELL_API] Usando endpoint reply en conversación:", conversationUuid);
      } else {
        // Nuevo mensaje outbound — para números sin conversación previa
        url = `${CALLBELL_API_BASE}/messages/send`;
        body = {
          to: phone,
          from: "whatsapp",
          type: "text",
          content: { text: message },
        };
        console.log("[CALLBELL_API] Usando endpoint nuevo mensaje outbound");
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawBody: CallbellApiResponse = await response.json();

      if (!response.ok) {
        const errMsg = rawBody?.error ?? `HTTP ${response.status}`;
        console.error(
          `[CALLBELL_API] Error HTTP ${response.status} (intento ${attempt + 1}/${MAX_RETRIES + 1}):`,
          errMsg,
        );

        if (attempt < MAX_RETRIES) {
          const retryDelay = 1000 * (attempt + 1);
          console.log(`[CALLBELL_API] Reintentando en ${retryDelay}ms...`);
          await delay(retryDelay);
          continue;
        }

        return { success: false, error: errMsg };
      }

      const messageId = rawBody?.message?.uuid ?? null;
      console.log("[CALLBELL_API] Mensaje enviado OK — messageId:", messageId, "to:", phone);

      return {
        success: true,
        messageId: messageId ?? "unknown",
      };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      console.error(
        `[CALLBELL_API] Error en intento ${attempt + 1}/${MAX_RETRIES + 1}:`,
        errorMessage,
      );

      if (attempt < MAX_RETRIES) {
        const retryDelay = 1000 * (attempt + 1);
        console.log(`[CALLBELL_API] Reintentando en ${retryDelay}ms...`);
        await delay(retryDelay);
        continue;
      }

      return { success: false, error: errorMessage };
    }
  }

  // No debería llegar aquí, pero TypeScript exige return
  return { success: false, error: "Error inesperado en enviarMensajeCallbell" };
}

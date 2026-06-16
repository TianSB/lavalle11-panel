// ============================================================
// messagesApi.ts
// Servicio centralizado para la Callbell Messages API (REST).
//
// Endpoint único: POST /v1/messages/send
//   https://docs.callbell.eu/api/reference/messages_api/post_send_messages/
//
// Callbell asocia automáticamente el mensaje a la conversación
// correcta usando el número de teléfono (to) + canal (from).
// No existe un endpoint separado para replies en conversación.
//
// Política de 24hs de WhatsApp:
//   - DENTRO de la ventana de 24hs: se puede responder con texto libre.
//   - FUERA de la ventana: se requiere un Template Message aprobado
//     (campo "template_uuid" en el body). Ver docs de Callbell.
//   - Este servicio actualmente solo envía texto libre. Si se necesita
//     enviar fuera de la ventana 24hs, implementar enviarTemplateCallbell().
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
 * Basada en docs.callbell.eu
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

/** URL de la API de Callbell para enviar mensajes */
const CALLBELL_API_URL = "https://api.callbell.eu/v1/messages/send";

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
 * Usa siempre POST /v1/messages/send (endpoint único). Callbell asocia
 * automáticamente el mensaje a la conversación existente usando el
 * número de teléfono. El parámetro conversationUuid es solo para
 * trazabilidad en logs — la API no lo recibe en el body.
 *
 * Para enviar fuera de la ventana de 24hs de WhatsApp, se necesita
 * un Template Message (ver enviarTemplateCallbell — no implementado).
 *
 * @param phone - Número de teléfono del destinatario
 * @param message - Texto del mensaje a enviar
 * @param conversationUuid - UUID de la conversación (solo para logging/trazabilidad)
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
    conversationUuid ?? "N/A",
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

      // --- Obtener channel_uuid (qué canal de WhatsApp usar) ---
      // Callbell requiere channel_uuid para asociar el mensaje a la
      // conversación existente. Sin este campo, Callbell crea una
      // conversación nueva duplicada.
      const channelUuid = process.env.CALLBELL_CHANNEL_UUID;
      if (!channelUuid) {
        const errMsg = "[CALLBELL_API] CALLBELL_CHANNEL_UUID no configurado";
        console.error(errMsg);
        return { success: false, error: errMsg };
      }

      // --- Asegurar que el teléfono tenga prefijo + ---
      // Los números en la DB están sin +, pero Callbell los espera con +
      const phoneWithPrefix = phone.startsWith("+") ? phone : `+${phone}`;

      // Endpoint único: POST /v1/messages/send
      // El campo channel_uuid es obligatorio para que Callbell asocie
      // el mensaje a la conversación existente del canal correcto.
      const body = {
        to: phoneWithPrefix,
        from: "whatsapp",
        type: "text",
        channel_uuid: channelUuid,
        content: {
          text: message,
        },
      };

      console.log("[CALLBELL_API] POST", CALLBELL_API_URL);

      const response = await fetch(CALLBELL_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // --- Logging diagnóstico: siempre loguear status antes de parsear ---
      console.log(
        "[CALLBELL_API] Response status:",
        response.status,
        response.statusText,
      );

      // Leer el body como texto primero (para diagnóstico si el JSON falla)
      const responseText = await response.text();
      console.log("[CALLBELL_API] Response body:", responseText);

      // Parsear JSON manualmente desde el texto
      let rawBody: CallbellApiResponse;
      try {
        rawBody = JSON.parse(responseText) as CallbellApiResponse;
      } catch (parseErr) {
        const errMsg = `Respuesta no-JSON de Callbell: ${responseText.slice(0, 200)}`;
        console.error("[CALLBELL_API] Error parseando JSON:", parseErr);
        return { success: false, error: errMsg };
      }

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

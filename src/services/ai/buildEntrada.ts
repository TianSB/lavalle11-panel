// ============================================================
// buildEntrada.ts — Helpers compartidos para construir EntradaCanónica
// ============================================================
// Unifica la lógica duplicada entre webhookHandler.ts (RAMA 2 y 3)
// y api/casos/[id]/re-analizar.ts para la construcción de
// AdjuntoCanónico[] y EntradaCanónica.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdjuntoCanónico, EntradaCanónica } from "./types.js";

// -----------------------------------------------------------
// Helpers de mapeo
// -----------------------------------------------------------

/**
 * Convierte los attachments del payload de Callbell (message.attachments)
 * a AdjuntoCanónico[] para enviar al provider de IA.
 */
export function mapAttachmentsToAdjuntos(
  attachments: { url: string; content_type: string | null; file_name: string | null }[],
): AdjuntoCanónico[] {
  return attachments.map((att) => {
    const ct = att.content_type ?? "application/octet-stream";
    return {
      url: att.url,
      tipo: ct.startsWith("image/") ? "image" as const
          : ct === "application/pdf" ? "pdf" as const
          : "otro" as const,
      mimeType: ct,
      nombre: att.file_name ?? undefined,
    };
  });
}

/**
 * Convierte los registros de la tabla adjuntos (desde Supabase)
 * a AdjuntoCanónico[].
 */
export function mapAdjuntosFromDb(
  rows: { file_url: string | null; file_type: string | null; file_name: string | null }[],
): AdjuntoCanónico[] {
  const result: AdjuntoCanónico[] = [];

  for (const a of rows) {
    if (!a.file_url) continue;

    const ft = a.file_type ?? "application/octet-stream";
    result.push({
      url: a.file_url,
      tipo: ft.startsWith("image/") ? ("image" as const)
          : ft === "application/pdf" ? ("pdf" as const)
          : ("otro" as const),
      mimeType: ft,
      nombre: a.file_name ?? undefined,
    });
  }

  return result;
}

// -----------------------------------------------------------
// Constructor de EntradaCanónica desde historial en DB
// -----------------------------------------------------------

/**
 * Construye una EntradaCanónica con TODO el historial de mensajes
 * entrantes del caso más los adjuntos almacenados en Supabase Storage
 * (URLs permanentes).
 *
 * Usada por el endpoint de re-análisis manual. No incluye los adjuntos
 * del payload de Callbell porque estos se guardan en Storage antes de
 * invocar la IA (ver saveAttachmentsToStorage en webhookHandler).
 *
 * @param supabase - Cliente de Supabase (admin/service role)
 * @param casoId - ID del caso (LV-XXXX)
 * @param conversationUuid - UUID de la conversación en Callbell
 * @param contactName - Nombre del contacto
 * @param contactPhone - Teléfono del contacto
 * @param options - Opciones adicionales
 * @param options.includeProcessed - Si true, incluye adjuntos ya procesados por IA (default: false)
 * @returns EntradaCanónica con historial completo, o null si no se encontraron mensajes
 */
export async function buildEntradaDesdeHistorial(
  supabase: SupabaseClient,
  casoId: string,
  conversationUuid: string,
  contactName: string,
  contactPhone: string,
  options?: { includeProcessed?: boolean },
): Promise<EntradaCanónica | null> {
  const includeProcessed = options?.includeProcessed ?? false;

  // --- 1. Obtener todos los mensajes entrantes ---
  const { data: mensajes, error: msgError } = await supabase
    .from("mensajes")
    .select("id, content, callbell_created_at")
    .eq("caso_id", casoId)
    .eq("direction", "inbound")
    .order("callbell_created_at", { ascending: true });

  if (msgError) {
    console.error("[BUILD_ENTRADA] Error al obtener mensajes:", msgError.message);
    return null;
  }

  if (!mensajes || mensajes.length === 0) {
    console.warn("[BUILD_ENTRADA] No hay mensajes entrantes para el caso:", casoId);
    // Retornar entrada vacía en lugar de null para permitir análisis sin historial
  }

  // --- 2. Concatenar historial con timestamps ---
  const mensajesTexto = (mensajes ?? [])
    .map((m) => {
      const ts = m.callbell_created_at
        ? new Date(m.callbell_created_at).toLocaleString("es-AR")
        : "—";
      return `[${ts}] ${m.content}`;
    })
    .join("\n\n");

  // --- 3. Obtener adjuntos de Storage (no procesados por IA aún) ---
  let adjuntosQuery = supabase
    .from("adjuntos")
    .select("file_url, file_type, file_name")
    .eq("caso_id", casoId)
    .order("created_at", { ascending: true });

  if (!includeProcessed) {
    adjuntosQuery = adjuntosQuery.eq("processed_by_ia", false);
  }

  const { data: adjuntosRaw, error: adjError } = await adjuntosQuery;

  if (adjError) {
    console.warn("[BUILD_ENTRADA] Error al obtener adjuntos:", adjError.message);
  }

  let adjuntosCanonicos = mapAdjuntosFromDb(adjuntosRaw ?? []);

  // --- 4. Fallback a orden_url de extracciones_ia (casos previos a Storage) ---
  if (adjuntosCanonicos.length === 0) {
    const { data: extraccion } = await supabase
      .from("extracciones_ia")
      .select("orden_url")
      .eq("caso_id", casoId)
      .maybeSingle();

    const ordenUrl = extraccion?.orden_url as string | null;
    if (ordenUrl) {
      adjuntosCanonicos.push({
        url: ordenUrl,
        tipo: "image",
        mimeType: "image/jpeg",
      });
    }
  }

  console.log(
    "[BUILD_ENTRADA] Historial construido —",
    "mensajes:", (mensajes ?? []).length,
    "adjuntos:", adjuntosCanonicos.length,
    "texto:", mensajesTexto.length, "chars",
  );

  // --- 5. Construir EntradaCanónica ---
  return {
    casoId,
    conversationUuid,
    textoMensaje: mensajesTexto || "Mensaje sin texto",
    adjuntos: adjuntosCanonicos,
    contactoNombre: contactName,
    contactoTelefono: contactPhone,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// adjuntosStorage.ts
// Guarda adjuntos de Callbell en Supabase Storage antes de que
// expiren las URLs de S3 (Callbell expira en 600 segundos).
//
// Flujo:
//   1. Descargar la imagen desde la URL de Callbell (timeout 8s)
//   2. Subir a Supabase Storage bucket 'adjuntos'
//   3. Retornar URL pública permanente
//
// Si la descarga falla (URL expirada, error de red): retornar null
// sin lanzar error. El webhook continúa normalmente.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";

/** Timeout para descargar el adjunto desde Callbell (8s) */
const DOWNLOAD_TIMEOUT_MS = 8_000;

/** Tamaño máximo de archivo: 8 MB */
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

/**
 * Descarga una imagen desde una URL (típicamente S3 de Callbell)
 * y la sube a Supabase Storage. Retorna la URL pública permanente
 * o null si falla.
 *
 * @param supabase - Cliente de Supabase (admin o service role)
 * @param url - URL del adjunto en Callbell (expira en 600s)
 * @param casoId - ID del caso (LV-XXXX), usado como prefijo en Storage
 * @param mensajeUuid - UUID del mensaje en Callbell
 * @param index - Índice del adjunto dentro del mismo mensaje
 * @returns URL pública permanente o null
 */
export async function guardarAdjuntoEnStorage(
  supabase: SupabaseClient,
  url: string,
  casoId: string,
  mensajeUuid: string,
  index: number,
): Promise<string | null> {
  console.log(
    "[ADJUNTOS_STORAGE] Iniciando descarga — caso:",
    casoId,
    "msg:",
    mensajeUuid,
    "idx:",
    index,
  );

  // --- 1. Descargar desde Callbell ---
  let arrayBuffer: ArrayBuffer;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(
        "[ADJUNTOS_STORAGE] HTTP",
        response.status,
        "— URL expirada o inválida, continuando sin imagen:",
        url,
      );
      return null;
    }

    arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      console.warn(
        "[ADJUNTOS_STORAGE] Archivo demasiado grande:",
        arrayBuffer.byteLength,
        "bytes — máximo",
        MAX_SIZE_BYTES,
        "— continuando sin imagen:",
        url,
      );
      return null;
    }
  } catch (err) {
    console.warn(
      "[ADJUNTOS_STORAGE] Error de red/tiempo — URL expirada, continuando sin imagen:",
      url,
      err,
    );
    return null;
  }

  // --- 2. Determinar extensión y contentType ---
  const contentType = detectContentType(url);
  const extension = contentType === "image/png" ? "png"
    : contentType === "image/webp" ? "webp"
    : contentType === "image/gif" ? "gif"
    : "jpg";

  // --- 3. Subir a Supabase Storage ---
  const storagePath = `${casoId}/${mensajeUuid}/${index}.${extension}`;

  console.log(
    "[ADJUNTOS_STORAGE] Subiendo a Storage — path:",
    storagePath,
    "size:",
    arrayBuffer.byteLength,
    "bytes",
  );

  const { error: uploadError } = await supabase.storage
    .from("adjuntos")
    .upload(storagePath, new Uint8Array(arrayBuffer), {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "[ADJUNTOS_STORAGE] Error al subir a Storage:",
      uploadError.message,
      "— continuando sin imagen",
    );
    return null;
  }

  // --- 4. Obtener URL pública ---
  const { data: publicUrlData } = supabase.storage
    .from("adjuntos")
    .getPublicUrl(storagePath);

  const publicUrl = publicUrlData?.publicUrl ?? null;

  if (!publicUrl) {
    console.error(
      "[ADJUNTOS_STORAGE] No se pudo obtener URL pública para:",
      storagePath,
    );
    return null;
  }

  console.log(
    "[ADJUNTOS_STORAGE] Adjunto guardado OK — URL:",
    publicUrl,
  );

  return publicUrl;
}

/**
 * Detecta el content type basado en la extensión de la URL.
 * Default: image/jpeg
 */
function detectContentType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

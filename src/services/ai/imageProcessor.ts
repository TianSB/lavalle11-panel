// ============================================================
// imageProcessor.ts — Descarga y prepara adjuntos para Claude
// ============================================================
// Las URLs de Callbell expiran; Claude no puede hacer fetch externo.
// Este módulo descarga antes de llamar a Claude.
// Si la descarga falla: continuar el análisis con solo texto, nunca bloquear.
// ============================================================

import type { AdjuntoCanónico } from "./types.js";

export interface AdjuntoProcesado {
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "application/pdf";
  tamañoBytes: number;
  url: string;
}

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB
const FETCH_TIMEOUT_MS = 8_000;

const MIME_PROCESABLES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

/**
 * Descarga y convierte a base64 los adjuntos procesables.
 * Adjuntos que fallan se omiten (no bloquean el análisis).
 * Retorna array vacío si no hay adjuntos procesables.
 */
export async function procesarAdjuntos(
  adjuntos: AdjuntoCanónico[],
): Promise<AdjuntoProcesado[]> {
  const procesables = adjuntos.filter(
    (a) => (a.tipo === "image" || a.tipo === "pdf") && MIME_PROCESABLES.has(a.mimeType),
  );

  if (procesables.length === 0) return [];

  console.log(`[IMAGE_PROCESSOR] Procesando ${procesables.length} adjuntos...`);

  const resultados = await Promise.allSettled(
    procesables.map((adj) => descargarAdjunto(adj.url, adj.mimeType)),
  );

  const exitosos = resultados
    .filter((r): r is PromiseFulfilledResult<AdjuntoProcesado | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is AdjuntoProcesado => v !== null);

  const fallidos = resultados.filter((r) => r.status === "rejected").length;
  if (fallidos > 0) {
    console.warn(`[IMAGE_PROCESSOR] ${fallidos} adjuntos fallaron — continuando con ${exitosos.length} exitosos`);
  }

  return exitosos;
}

async function descargarAdjunto(
  url: string,
  mimeType: string,
): Promise<AdjuntoProcesado | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.status === 403 || response.status === 401) {
      console.warn("[IMAGE_PROCESSOR] URL expirada — continuando sin imagen:", url);
      return null;
    }

    if (!response.ok) {
      console.warn("[IMAGE_PROCESSOR] HTTP", response.status, "— continuando sin imagen:", url);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      console.warn(
        "[IMAGE_PROCESSOR] Adjunto demasiado grande:",
        arrayBuffer.byteLength, "bytes — continuando sin imagen:", url,
      );
      return null;
    }

    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      base64,
      mimeType: mimeType as AdjuntoProcesado["mimeType"],
      tamañoBytes: arrayBuffer.byteLength,
      url,
    };
  } catch (err) {
    clearTimeout(timeout);
    // Si es un error de red o timeout, las URLs probablemente expiraron
    console.warn("[IMAGE_PROCESSOR] URL expirada — continuando sin imagen:", url);
    return null;
  }
}

// ============================================================
// api/callbell/webhook.ts
// Serverless Function de Vercel para el webhook de Callbell.
//
// GET  → Health check (Callbell lo usa periódicamente)
// POST → Webhook events (message_created, conversation_closed, etc.)
//
// Seguridad: validación por secret token en query param (?secret=TOKEN)
// ============================================================
//
// VARIABLES DE ENTORNO REQUERIDAS:
//   CALLBELL_WEBHOOK_SECRET  — Token secreto para validar el webhook
//   SUPABASE_URL             — URL del proyecto Supabase
//   SUPABASE_SERVICE_ROLE_KEY  — Service role key (bypass RLS)
//
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { handleWebhook } from "../../src/services/callbell/webhookHandler.js";

// -----------------------------------------------------------
// Supabase admin client (server-side, bypasses RLS)
// -----------------------------------------------------------

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "[WEBHOOK] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno",
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// -----------------------------------------------------------
// Auth: validar secret token
// -----------------------------------------------------------

function isAuthorized(url: string | undefined, secret: string | undefined): boolean {
  if (!secret || !url) return false;

  try {
    const parsed = new URL(url, "http://localhost");
    const token = parsed.searchParams.get("secret");
    return token === secret;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------
// Handler principal
// -----------------------------------------------------------

export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  // --- Auth ---
  const webhookSecret = process.env.CALLBELL_WEBHOOK_SECRET;
  if (!isAuthorized(req.url, webhookSecret)) {
    console.warn("[WEBHOOK] 401 — Token inválido o faltante");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // --- GET: Health check ---
  if (req.method === "GET") {
    console.log("[WEBHOOK] Health check OK");
    res.status(200).json({ status: "ok" });
    return;
  }

  // --- POST: Procesar evento ---
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // --- Parsear body ---
  let rawBody: unknown;
  try {
    rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    console.warn("[WEBHOOK] Error al parsear JSON del body");
    res.status(200).json({ status: "ignored", reason: "invalid_json" });
    return;
  }

  // --- Obtener cliente Supabase ---
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err: any) {
    console.error("[WEBHOOK] Error de configuración:", err.message);
    res.status(200).json({ status: "ignored", reason: "config_error" });
    return;
  }

  // --- Responder 200 A Callbell INMEDIATAMENTE (respond-first) ---
  // Luego procesar en background para no bloquear el webhook
  res.status(200).json({ status: "ok" });

  handleWebhook(supabase, rawBody)
    .then((result) => {
      console.log(`[WEBHOOK] ${result.message} (${Date.now() - startTime}ms)`);
    })
    .catch((err: Error) => {
      console.error("[WEBHOOK] Error procesando evento:", err.message);
    });
}

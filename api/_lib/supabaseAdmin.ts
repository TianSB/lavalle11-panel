// ============================================================
// api/_lib/supabaseAdmin.ts
// Shared utilities for server-side API endpoints.
// ============================================================

import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client with SERVICE_ROLE key (bypasses RLS).
 * Para endpoints GET que necesitan ver todos los casos sin restricciones.
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "[SUPABASE_ADMIN] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Select compartido para queries de casos con joins.
 * Incluye extracciones_ia, turnos, llamadas y nombre del asesor.
 */
export const CASOS_SELECT = `
  *,
  extracciones_ia (*),
  turnos (*),
  llamadas (*),
  asesor:asesor_id (nombre)
` as const;

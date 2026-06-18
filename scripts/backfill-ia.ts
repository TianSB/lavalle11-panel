// ============================================================
// backfill-ia.ts — Script one-shot: Re-análisis de casos históricos
// ============================================================
// Re-analiza con IA los casos existentes que tienen:
//   - confianza_global < 0.5 (análisis pobre del primer mensaje)
//   - o adjuntos pendientes en la tabla adjuntos (processed_by_ia = false)
//
// Uso:
//   export SUPABASE_URL="https://xxxx.supabase.co"
//   export SUPABASE_SERVICE_ROLE_KEY="xxxx"
//   export ANTHROPIC_API_KEY="sk-ant-xxxx"  (si PRIMARY_PROVIDER=claude)
//   npx tsx scripts/backfill-ia.ts
//
// Límites de seguridad:
//   - Máximo 50 casos por ejecución
//   - Pausa de 1s entre cada análisis para no saturar la API de Claude
//   - Idempotente: saltar casos ya re-analizados
//   - Filtro dry-run: pasar --dry-run para solo listar sin re-analizar
// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEntradaDesdeHistorial } from "../src/services/ai/buildEntrada.js";
import { getAIProvider, _resetAIProvider } from "../src/services/ai/aiFactory.js";
import type { RespuestaCanónica } from "../src/services/ai/types.js";
import { PRACTICAS_NUCLEAR } from "../src/constants.js";

// -----------------------------------------------------------
// Constants
// -----------------------------------------------------------

const MAX_CASOS = 50;
const PAUSA_MS = 1_000;
const UMBRAL_CONFIANZA = 0.5;

// -----------------------------------------------------------
// Supabase admin client
// -----------------------------------------------------------

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("[BACKFILL] SUPABASE_URL no configurada");
  if (!key) throw new Error("[BACKFILL] SUPABASE_SERVICE_ROLE_KEY no configurada");

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// -----------------------------------------------------------
// Query: casos candidatos
// -----------------------------------------------------------

async function findCandidatos(
  supabase: SupabaseClient,
): Promise<{ id: string; contact_name: string; contact_phone: string; callbell_conversation_uuid: string; confianza: number }[]> {
  // Estrategia: buscar casos que tengan extracciones_ia con confianza baja
  // o adjuntos pendientes. Usar dos queries y unir.
  const resultados: Map<string, { id: string; contact_name: string; contact_phone: string; callbell_conversation_uuid: string; confianza: number }> = new Map();

  // 1. Casos con confianza_global < 0.5
  const { data: bajaConfianza, error: err1 } = await supabase
    .from("extracciones_ia")
    .select(`
      caso_id,
      confianza_global,
      casos!inner (
        id,
        contact_name,
        contact_phone,
        callbell_conversation_uuid
      )
    `)
    .lt("confianza_global", UMBRAL_CONFIANZA)
    .limit(MAX_CASOS);

  if (err1) {
    console.error("[BACKFILL] Error query baja confianza:", err1.message);
  } else {
    for (const row of bajaConfianza ?? []) {
      const caso = (row as any).casos as any;
      if (caso?.id) {
        resultados.set(caso.id, {
          id: caso.id,
          contact_name: caso.contact_name ?? "Desconocido",
          contact_phone: caso.contact_phone ?? "",
          callbell_conversation_uuid: caso.callbell_conversation_uuid ?? "",
          confianza: (row as any).confianza_global as number ?? 0,
        });
      }
    }
  }

  // 2. Casos con adjuntos pendientes (processed_by_ia = false)
  const { data: adjuntosPendientes, error: err2 } = await supabase
    .from("adjuntos")
    .select(`
      caso_id,
      casos!inner (
        id,
        contact_name,
        contact_phone,
        callbell_conversation_uuid
      )
    `)
    .eq("processed_by_ia", false)
    .limit(MAX_CASOS);

  if (err2) {
    console.error("[BACKFILL] Error query adjuntos pendientes:", err2.message);
  } else {
    for (const row of adjuntosPendientes ?? []) {
      const caso = (row as any).casos as any;
      if (caso?.id && !resultados.has(caso.id)) {
        resultados.set(caso.id, {
          id: caso.id,
          contact_name: caso.contact_name ?? "Desconocido",
          contact_phone: caso.contact_phone ?? "",
          callbell_conversation_uuid: caso.callbell_conversation_uuid ?? "",
          confianza: 0,
        });
      }
    }
  }

  return Array.from(resultados.values()).slice(0, MAX_CASOS);
}

// -----------------------------------------------------------
// Flags helper (copiado de re-analizar.ts)
// -----------------------------------------------------------

function buildReanalysisFlags(analisis: RespuestaCanónica): string[] {
  const flags = new Set<string>(analisis.flags ?? []);

  if (analisis.confianza_global < 0.7) {
    flags.add("baja_confianza");
  }
  if (analisis.obra_social?.toLowerCase().includes("ioma")) {
    flags.add("token_ioma");
  }
  if (analisis.tipo_practica && PRACTICAS_NUCLEAR.includes(analisis.tipo_practica as any)) {
    flags.add("chiclana");
  }
  if (analisis.campos_baja_confianza.length > 0) {
    flags.add("baja_confianza");
  }

  return Array.from(flags);
}

// -----------------------------------------------------------
// Analizar y actualizar un caso
// -----------------------------------------------------------

async function procesarCaso(
  supabase: SupabaseClient,
  caso: { id: string; contact_name: string; contact_phone: string; callbell_conversation_uuid: string },
): Promise<{ ok: boolean; error?: string }> {
  console.log(`\n[BACKFILL] Procesando caso ${caso.id} — ${caso.contact_name}`);

  // 1. Construir entrada con historial completo
  const entrada = await buildEntradaDesdeHistorial(
    supabase,
    caso.id,
    caso.callbell_conversation_uuid,
    caso.contact_name,
    caso.contact_phone,
    { includeProcessed: true },
  );

  if (!entrada) {
    console.warn(`[BACKFILL] No se pudo construir entrada para ${caso.id} — saltando`);
    return { ok: false, error: "No se pudo construir entrada" };
  }

  // 2. Analizar con IA
  let analisis: RespuestaCanónica;
  try {
    const provider = getAIProvider();
    console.log(`[BACKFILL] Invocando IA — provider: ${provider.nombre}, mensajes: ${(entrada.textoMensaje.match(/\[\d{2}:\d{2}\]/g) ?? []).length}`);
    analisis = await provider.analizarCaso(entrada, { maxTokens: 2048 });
    console.log(`[BACKFILL] Análisis OK — tipo: ${analisis.tipo_caso}, confianza: ${analisis.confianza_global}`);
  } catch (err: any) {
    const msg = err?.message ?? "Error desconocido";
    console.error(`[BACKFILL] Error IA para ${caso.id}: ${msg}`);
    return { ok: false, error: msg };
  }

  // 3. Construir flags
  const flags = buildReanalysisFlags(analisis);
  const now = new Date().toISOString();

  // 4. Actualizar extracciones_ia
  const { error: updateExtError } = await supabase
    .from("extracciones_ia")
    .update({
      paciente_nombre: analisis.paciente_nombre,
      paciente_dni: analisis.paciente_dni,
      obra_social: analisis.obra_social,
      nro_afiliado: analisis.nro_afiliado,
      nro_carnet: analisis.nro_carnet,
      practica: analisis.practica,
      tipo_practica: analisis.tipo_practica,
      medico_derivante: analisis.medico_derivante,
      matricula: analisis.matricula,
      diagnostico: analisis.diagnostico,
      motivo_solicitud: analisis.motivo_solicitud,
      confianza_global: analisis.confianza_global,
      confianza_campos: analisis.confianza_campos,
      campos_baja_confianza: analisis.campos_baja_confianza,
      flags,
      resumen: analisis.resumen,
      modelo_ia: analisis.modelo_ia,
      tiempo_procesamiento_ms: analisis.tiempo_procesamiento_ms,
      prompt_usado: analisis.prompt_usado,
      respuesta_raw: analisis.respuesta_raw,
      orden_tipo: analisis.orden_tipo,
      orden_url: analisis.orden_url,
    })
    .eq("caso_id", caso.id);

  if (updateExtError) {
    console.error(`[BACKFILL] Error al actualizar extracciones_ia para ${caso.id}: ${updateExtError.message}`);
    return { ok: false, error: updateExtError.message };
  }

  // 5. Actualizar tipo_caso y prioridad en casos
  await supabase
    .from("casos")
    .update({ tipo_caso: analisis.tipo_caso, prioridad: analisis.prioridad, updated_at: now })
    .eq("id", caso.id);

  // 6. Marcar adjuntos como procesados
  await supabase
    .from("adjuntos")
    .update({ processed_by_ia: true })
    .eq("caso_id", caso.id)
    .eq("processed_by_ia", false);

  console.log(`[BACKFILL] ✅ ${caso.id} actualizado — confianza: ${analisis.confianza_global}, tipo: ${analisis.tipo_caso}`);
  return { ok: true };
}

// -----------------------------------------------------------
// Main
// -----------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("BACKFILL IA — Re-análisis de casos históricos");
  console.log("=".repeat(60));

  const isDryRun = process.argv.includes("--dry-run");
  if (isDryRun) {
    console.log("🧪 Modo DRY RUN — solo listar, no modificar\n");
  }

  // 1. Obtener cliente Supabase
  const supabase = getSupabaseAdmin();
  console.log("✅ Supabase conectado\n");

  // 2. Buscar candidatos
  console.log("🔍 Buscando casos candidatos...");
  const candidatos = await findCandidatos(supabase);

  if (candidatos.length === 0) {
    console.log("✅ No se encontraron casos para re-analizar");
    return;
  }

  console.log(`\n📊 Candidatos encontrados: ${candidatos.length}`);
  console.log("   (máximo:", MAX_CASOS, "por ejecución)");

  // Mostrar tabla resumen
  console.log("\n┌──────────┬────────────────────────────┬──────────────┐");
  console.log("│ Caso     │ Contacto                   │ Confianza    │");
  console.log("├──────────┼────────────────────────────┼──────────────┤");
  for (const c of candidatos) {
    const nombre = c.contact_name.padEnd(26).slice(0, 26);
    const conf = c.confianza.toFixed(2).padStart(6);
    console.log(`│ ${c.id.padEnd(8)} │ ${nombre} │ ${conf}       │`);
  }
  console.log("└──────────┴────────────────────────────┴──────────────┘");

  if (isDryRun) {
    console.log("\n🧪 DRY RUN — No se realizaron cambios.");
    console.log("   Para ejecutar: npx tsx scripts/backfill-ia.ts");
    return;
  }

  // 3. Procesar cada caso
  console.log("\n" + "=".repeat(60));
  console.log("🔄 Iniciando re-análisis...");
  console.log("=".repeat(60));

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < candidatos.length; i++) {
    const caso = candidatos[i]!;
    console.log(`\n[${i + 1}/${candidatos.length}]`);

    const result = await procesarCaso(supabase, caso);

    if (result.ok) {
      ok++;
    } else {
      fail++;
    }

    // Pausa entre análisis (excepto el último)
    if (i < candidatos.length - 1) {
      console.log(`   ⏳ Esperando ${PAUSA_MS}ms...`);
      await new Promise((r) => setTimeout(r, PAUSA_MS));
    }
  }

  // 4. Resumen final
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN FINAL");
  console.log("=".repeat(60));
  console.log(`   ✅ Re-analizados OK: ${ok}`);
  console.log(`   ❌ Fallos:           ${fail}`);
  console.log(`   📁 Total procesados: ${ok + fail}`);
  console.log("=".repeat(60));

  if (fail > 0) {
    console.log("\n⚠️  Algunos casos fallaron. Revisar logs arriba para más detalles.");
  }

  // Reset provider singleton para limpieza
  _resetAIProvider();
}

main().catch((err) => {
  console.error("\n[BACKFILL] Error fatal:", err);
  process.exit(1);
});

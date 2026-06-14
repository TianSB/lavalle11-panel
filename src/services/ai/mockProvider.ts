// ============================================================
// mockProvider.ts — Mock para desarrollo sin consumir tokens
// ============================================================
// Devuelve datos realistas en ~50ms simulando latencia.
// Activo cuando PRIMARY_PROVIDER=mock (desarrollo local).
// ============================================================

import type { AIProvider, EntradaCanónica, RespuestaCanónica } from "./types.js";

export class MockAIProvider implements AIProvider {
  nombre = "mock";

  async analizarCaso(entrada: EntradaCanónica): Promise<RespuestaCanónica> {
    await new Promise((r) => setTimeout(r, 50)); // Simular latencia

    const tieneAdjuntos = entrada.adjuntos.length > 0;

    return {
      tipo_caso: "A",
      prioridad: "normal",
      paciente_nombre: entrada.contactoNombre,
      paciente_dni: "12345678",
      obra_social: "IOMA",
      nro_afiliado: "987654",
      nro_carnet: null,
      practica: "Ecografía abdominal completa",
      tipo_practica: "ecografia",
      medico_derivante: "Dr. García",
      matricula: "MP 12345",
      diagnostico: "Control rutinario",
      motivo_solicitud: "control",
      flags: [],
      confianza_global: 0.92,
      confianza_campos: {
        paciente_nombre: 0.90,
        practica: 0.95,
        obra_social: 0.88,
      },
      campos_baja_confianza: [],
      resumen: `Ecografía abdominal para ${entrada.contactoNombre} (IOMA). Control rutinario.`,
      modelo_ia: "mock",
      tiempo_procesamiento_ms: 50,
      prompt_usado: "MOCK — sin llamada real",
      respuesta_raw: { mock: true },
      orden_tipo: tieneAdjuntos ? "imagen" : "no_aplica",
      orden_url: tieneAdjuntos ? entrada.adjuntos[0]!.url : null,
    };
  }
}

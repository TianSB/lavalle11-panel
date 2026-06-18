// ============================================================
// claudeAdapter.ts — Adapter principal con tool_use y visión
// ============================================================
// Corazón de la integración Fase 3. Implementa AIProvider
// usando Claude Sonnet 4 con tool_use para structured output.
//
// Token efficiency:
// - max_tokens: 1024 — respuesta compacta, suficiente
// - tool_choice: { type: "any" } — forzar tool, nunca texto libre
// - System prompt ~250 tokens — denso, sin relleno
// - Una sola llamada por caso, sin multi-turn
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, EntradaCanónica, RespuestaCanónica } from "./types.js";
import { AIError, type TipoCaso, type PrioridadCaso, type TipoPractica, type MotivoSolicitud, type OrdenTipo } from "./types.js";
import { procesarAdjuntos, type AdjuntoProcesado } from "./imageProcessor.js";

// -----------------------------------------------------------
// System prompt (~250 tokens)
// -----------------------------------------------------------

const SYSTEM_PROMPT = `Sos un asistente especializado en análisis de turnos médicos para Instituto Lavalle 11, un centro de diagnóstico por imágenes en Bahía Blanca, Argentina.

Tu tarea: analizar el mensaje entrante de un paciente por WhatsApp (y la imagen de la orden médica si está adjunta) y extraer los datos estructurados invocando la herramienta "registrar_analisis_caso".

Reglas:
- Siempre invocá la herramienta, incluso si los datos son incompletos
- Si hay imagen de orden médica, priorizá esos datos sobre el texto del mensaje
- Si un campo no está claro, usá null y bajá la confianza de ese campo
- "practica" siempre en español normalizado (sin abreviaturas)
- Los tipos pet_ct, spect_ct, centellograma, perfusion_miocardica, camara_gamma corresponden a Medicina Nuclear (sede Chiclana)
- No inventes datos — si algo no está en el mensaje/imagen, es null`;

// -----------------------------------------------------------
// Tool definition
// -----------------------------------------------------------

const TOOL_ANALISIS: Anthropic.Tool = {
  name: "registrar_analisis_caso",
  description:
    "Registra el análisis estructurado de la conversación y orden médica. " +
    "Invoca esta herramienta con TODOS los datos extraídos.",
  input_schema: {
    type: "object" as const,
    required: [
      "tipo_caso", "prioridad", "paciente_nombre",
      "practica", "tipo_practica",
      "confianza_global", "confianza_campos", "resumen", "flags",
    ],
    properties: {
      tipo_caso: {
        type: "string",
        enum: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
        description:
          "Tipo de caso según clasificación PRD:\n" +
          "A=Turno con orden médica\n" +
          "B=Radiografía/Panorámica/CBCT (sin informe, auto-resoluble)\n" +
          "C=Consulta de precio/cobertura\n" +
          "D=Reprogramación de turno existente\n" +
          "E=Cancelación\n" +
          "F=Solicitud de informe/resultados\n" +
          "G=Consulta general\n" +
          "H=Biopsia/Punción (requiere seguimiento)\n" +
          "I=Práctica no disponible en el instituto\n" +
          "J=Consulta resuelta por portal web\n" +
          "K=Contacto equivocado",
      },
      prioridad: {
        type: "string",
        enum: ["urgente", "normal", "bajo"],
        description: "urgente si menciona emergencia/urgencia clínica; bajo si es consulta informativa.",
      },
      paciente_nombre: {
        type: "string",
        description: "Nombre completo del paciente. Tomar de la orden médica si está disponible, si no del mensaje.",
      },
      paciente_dni: { type: ["string", "null"], description: "DNI del paciente. null si no se menciona." },
      obra_social: { type: ["string", "null"], description: "Nombre exacto de la obra social según la orden. null si no se menciona." },
      nro_afiliado: { type: ["string", "null"] },
      nro_carnet: { type: ["string", "null"] },
      practica: {
        type: "string",
        description: "Nombre normalizado del estudio. Ej: 'Ecografía abdominal completa', 'Radiografía de tórax frente'. Texto libre, legible.",
      },
      tipo_practica: {
        type: "string",
        enum: [
          "ecografia", "ecocardiograma", "mamografia", "densitometria",
          "radiografia", "espinografia", "panoramica_dental", "tac_cone_beam",
          "puncion", "biopsia", "marcacion", "traumatologia", "ozonoterapia",
          "pet_ct", "spect_ct", "centellograma", "perfusion_miocardica",
          "camara_gamma", "otro",
        ],
      },
      medico_derivante: { type: ["string", "null"], description: "Nombre del médico que firma la orden." },
      matricula: { type: ["string", "null"], description: "MP o MN del médico." },
      diagnostico: { type: ["string", "null"], description: "Diagnóstico presuntivo según la orden." },
      motivo_solicitud: {
        type: ["string", "null"],
        enum: ["screening", "busqueda", "control", "otro", null],
      },
      flags: {
        type: "array",
        items: { type: "string" },
        description:
          "Flags detectados en el análisis. Solo incluir los que aplican:\n" +
          "'ayuno' — el estudio requiere ayuno previo\n" +
          "'aines' — el paciente debe suspender AINEs\n" +
          "'orden_incompleta' — faltan campos obligatorios en la orden\n" +
          "'orden_ilegible' — la imagen no pudo leerse con suficiente claridad",
      },
      confianza_global: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Score global de confianza en la extracción. 0.0 si no hay datos, 1.0 si todo es claro.",
      },
      confianza_campos: {
        type: "object",
        description: "Score de confianza por campo individualmente. Solo incluir campos extraídos.",
        additionalProperties: { type: "number", minimum: 0, maximum: 1 },
      },
      resumen: {
        type: "string",
        description:
          "1–2 líneas para mostrar en el panel del asesor. " +
          "Formato: '[Práctica] para [Paciente] ([Obra Social])'. " +
          "Si hay baja confianza, agregar: 'Revisar: [campo dudoso]'.",
      },
    },
  },
};

// -----------------------------------------------------------
// Content builder
// -----------------------------------------------------------

function buildUserContent(
  entrada: EntradaCanónica,
  adjuntosProcesados: AdjuntoProcesado[],
): Anthropic.MessageParam["content"] {
  const content: Anthropic.MessageParam["content"] = [];

  // Texto principal
  content.push({
    type: "text",
    text: `Mensaje de WhatsApp de ${entrada.contactoNombre} (${entrada.contactoTelefono}):\n\n"${entrada.textoMensaje}"`,
  });

  // Imágenes adjuntas (órdenes médicas)
  for (const adj of adjuntosProcesados) {
    if (adj.mimeType === "application/pdf") {
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf" as const,
          data: adj.base64,
        },
      });
    } else {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: adj.mimeType,
          data: adj.base64,
        },
      });
    }
  }

  // Instrucción final
  let instruccionFinal: string;
  if (adjuntosProcesados.length > 0) {
    instruccionFinal = "Analizá el mensaje y la imagen de la orden médica adjunta. Invocá registrar_analisis_caso con los datos extraídos.";
  } else if (entrada.adjuntos.length > 0) {
    instruccionFinal = "No hay imágenes disponibles (URLs expiradas). Analizar solo con el texto del mensaje. Invocá registrar_analisis_caso con los datos que puedas extraer.";
  } else {
    instruccionFinal = "Analizá el mensaje. No hay imagen adjunta. Invocá registrar_analisis_caso con los datos que puedas extraer.";
  }

  content.push({
    type: "text",
    text: instruccionFinal,
  });

  return content;
}

// -----------------------------------------------------------
// ClaudeAdapter
// -----------------------------------------------------------

export class ClaudeAdapter implements AIProvider {
  nombre = "claude";
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("[CLAUDE] ANTHROPIC_API_KEY no configurada");
    }
    this.client = new Anthropic({ apiKey });
  }

  async analizarCaso(entrada: EntradaCanónica, opciones?: { maxTokens?: number }): Promise<RespuestaCanónica> {
    const inicio = Date.now();

    // 1. Procesar adjuntos
    const adjuntosProcesados = await procesarAdjuntos(entrada.adjuntos);
    console.log(`[CLAUDE] Adjuntos procesados: ${adjuntosProcesados.length}/${entrada.adjuntos.length}`);

    // 2. Construir prompt
    const userContent = buildUserContent(entrada, adjuntosProcesados);
    const promptTexto = JSON.stringify(userContent); // para guardar en prompt_usado

    // 3. Llamar a Claude
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: opciones?.maxTokens ?? 1024,
        system: SYSTEM_PROMPT,
        tools: [TOOL_ANALISIS],
        tool_choice: { type: "any" },
        messages: [{ role: "user", content: userContent }],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      throw new AIError("AI_PROVIDER_ERROR", `Claude API error: ${message}`, err);
    }

    const tiempoMs = Date.now() - inicio;

    // 4. Extraer tool_use block
    const toolUseBlock = response.content.find((b): b is Anthropic.ContentBlock & { type: "tool_use" } => b.type === "tool_use");
    if (!toolUseBlock) {
      throw new AIError(
        "AI_INVALID_RESPONSE",
        "Claude no invocó la tool registrar_analisis_caso",
      );
    }

    const input = toolUseBlock.input as Record<string, unknown>;

    // 5. Detectar campos con baja confianza
    const confianzaCampos = (input.confianza_campos ?? {}) as Record<string, number>;
    const camposBajaConfianza = Object.entries(confianzaCampos)
      .filter(([_, v]) => v < 0.7)
      .map(([k]) => k);

    // 6. Construir RespuestaCanónica
    return {
      tipo_caso: (input.tipo_caso as TipoCaso) ?? "A",
      prioridad: (input.prioridad as PrioridadCaso) ?? "normal",
      paciente_nombre: (input.paciente_nombre as string) ?? entrada.contactoNombre,
      paciente_dni: (input.paciente_dni as string | null) ?? null,
      obra_social: (input.obra_social as string | null) ?? null,
      nro_afiliado: (input.nro_afiliado as string | null) ?? null,
      nro_carnet: (input.nro_carnet as string | null) ?? null,
      practica: (input.practica as string) ?? "Pendiente de análisis",
      tipo_practica: (input.tipo_practica as TipoPractica) ?? "otro",
      medico_derivante: (input.medico_derivante as string | null) ?? null,
      matricula: (input.matricula as string | null) ?? null,
      diagnostico: (input.diagnostico as string | null) ?? null,
      motivo_solicitud: (input.motivo_solicitud as MotivoSolicitud | null) ?? null,
      flags: (input.flags as string[]) ?? [],
      confianza_global: (input.confianza_global as number) ?? 0.0,
      confianza_campos: confianzaCampos,
      campos_baja_confianza: camposBajaConfianza,
      resumen: (input.resumen as string) ?? `Mensaje de ${entrada.contactoNombre}. Revisar manualmente.`,
      modelo_ia: "claude-sonnet-4-5",
      tiempo_procesamiento_ms: tiempoMs,
      prompt_usado: promptTexto,
      respuesta_raw: response,
      orden_tipo: adjuntosProcesados.length > 0 ? "imagen" as OrdenTipo : "no_aplica" as OrdenTipo,
      orden_url: adjuntosProcesados.length > 0 ? adjuntosProcesados[0]!.url : null,
    };
  }
}

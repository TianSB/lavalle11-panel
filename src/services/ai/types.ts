// ============================================================
// types.ts — Interfaces canónicas del sistema de IA
// ============================================================
// Este es el contrato único entre el webhook y la capa de IA.
// Ningún archivo fuera de ai/ debe importar tipos de Claude directamente.
// ============================================================

// --- Entrada al adapter ---

export interface AdjuntoCanónico {
  url: string;                     // URL pública del adjunto en Callbell
  tipo: "image" | "pdf" | "otro"; // Solo image y pdf van a Claude
  mimeType: string;                // "image/jpeg", "image/png", "application/pdf"
  nombre?: string;
}

export interface EntradaCanónica {
  casoId: string;                  // LV-XXXX — para logging
  conversationUuid: string;        // UUID de Callbell
  textoMensaje: string;            // Texto del primer mensaje entrante
  adjuntos: AdjuntoCanónico[];     // Imágenes u órdenes adjuntas (puede ser vacío)
  contactoNombre: string;          // Nombre del paciente según Callbell
  contactoTelefono: string;        // Teléfono en formato internacional
  timestamp: string;               // ISO 8601
}

// --- Salida del adapter ---

export type TipoCaso = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K";
export type PrioridadCaso = "urgente" | "normal" | "bajo";
export type TipoPractica =
  | "ecografia" | "ecocardiograma" | "mamografia" | "densitometria"
  | "radiografia" | "espinografia" | "panoramica_dental" | "tac_cone_beam"
  | "puncion" | "biopsia" | "marcacion" | "traumatologia" | "ozonoterapia"
  | "pet_ct" | "spect_ct" | "centellograma" | "perfusion_miocardica"
  | "camara_gamma" | "otro";
export type MotivoSolicitud = "screening" | "busqueda" | "control" | "otro";
export type OrdenTipo = "imagen" | "pdf" | "misrx_link" | "no_aplica";

export interface ConfianzaCampos {
  paciente_nombre?: number;
  practica?: number;
  obra_social?: number;
  medico_derivante?: number;
  diagnostico?: number;
  [campo: string]: number | undefined;
}

export interface RespuestaCanónica {
  // --- Clasificación ---
  tipo_caso: TipoCaso;
  prioridad: PrioridadCaso;

  // --- Datos del paciente (extraídos) ---
  paciente_nombre: string;
  paciente_dni: string | null;
  obra_social: string | null;
  nro_afiliado: string | null;
  nro_carnet: string | null;

  // --- Práctica médica ---
  practica: string;                        // Texto normalizado: "Ecografía abdominal"
  tipo_practica: TipoPractica;
  medico_derivante: string | null;
  matricula: string | null;
  diagnostico: string | null;
  motivo_solicitud: MotivoSolicitud | null;

  // --- Flags (el adapter devuelve los que detecta; el sistema agrega los de reglas) ---
  flags: string[];

  // --- Confianza ---
  confianza_global: number;                // 0.00 a 1.00
  confianza_campos: ConfianzaCampos;
  campos_baja_confianza: string[];         // Campos con confianza < 0.7

  // --- Resumen para el panel ---
  resumen: string;                         // 1–2 líneas legibles para la card

  // --- Metadatos de procesamiento ---
  modelo_ia: string;                       // "claude-sonnet-4-5"
  tiempo_procesamiento_ms: number;
  prompt_usado: string;
  respuesta_raw: unknown;                  // JSON completo de Claude (debug 30 días)

  // --- Adjunto procesado (si hubo imagen) ---
  orden_tipo: OrdenTipo;
  orden_url: string | null;
}

// --- Contrato del adapter ---

export interface AIProvider {
  analizarCaso(entrada: EntradaCanónica): Promise<RespuestaCanónica>;
  nombre: string;   // "claude", "mock", etc. — para logging
}

// --- Errores del sistema de IA ---

export type AIErrorCode =
  | "AI_TIMEOUT"
  | "AI_RATE_LIMIT"
  | "AI_INVALID_RESPONSE"
  | "AI_IMAGE_FETCH_FAILED"
  | "AI_IMAGE_TOO_LARGE"
  | "AI_COST_LIMIT_EXCEEDED"
  | "AI_PROVIDER_ERROR"
  | "AI_PARSE_ERROR";

export class AIError extends Error {
  constructor(
    public readonly code: AIErrorCode,
    message: string,
    public readonly causa?: unknown,
  ) {
    super(message);
    this.name = "AIError";
  }
}

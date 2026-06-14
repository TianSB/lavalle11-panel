# FASE 3 — Plan de Integración IA (Claude API)
# Panel de Gestión de Turnos — Instituto Lavalle 11

> **Propósito:** Prompt de referencia completo para Claude Code.
> Implementar la capa de IA que analiza mensajes y órdenes médicas entrantes
> y puebla `extracciones_ia` con datos estructurados listos para el asesor.
>
> **Leer antes de escribir una sola línea de código.**

---

## 0. Contexto de partida

El webhook en `api/callbell/webhook.ts` ya está operativo.
`src/services/callbell/webhookHandler.ts` ya crea el caso en Supabase.
El punto de integración está marcado con un TODO en `webhookHandler.ts` línea ~94:

```typescript
// TODO: [Fase 3] Aquí se invocará el análisis de IA (Claude Adapter)
```

La función `createCaso()` en `src/services/supabase/casoService.ts` ya inserta
en `extracciones_ia` con placeholders. En Fase 3 esos placeholders se reemplazan
con datos reales del análisis de Claude.

**Stack confirmado:**
- Runtime: Node.js 20 Vercel Serverless Functions
- TypeScript estricto (noUnusedParameters, strictNullChecks)
- Supabase Admin Client (service role key, bypass RLS)
- Claude API: `claude-sonnet-4-5` con `tool_use` para structured output

---

## 1. Archivos a crear (nuevos)

```
src/services/ai/
├── types.ts              # AI-01: Interfaces canónicas
├── claudeAdapter.ts      # AI-02: Adapter principal con visión
├── mockProvider.ts       # AI-03: Mock para tests sin consumir tokens
├── aiFactory.ts          # AI-04: Factory + registro por env var
└── imageProcessor.ts     # AI-05: Descarga y conversión imagen → base64
```

## 2. Archivos a modificar (existentes)

```
src/services/callbell/webhookHandler.ts   # AI-06: Conectar adapter en TODO
src/services/supabase/casoService.ts      # AI-07: Recibir RespuestaCanonica
```

---

## 3. AI-01 — `src/services/ai/types.ts`

Interfaces canónicas. Todo el sistema habla este contrato.
Ningún archivo fuera de `ai/` debe importar tipos de Claude directamente.

```typescript
// ============================================================
// types.ts — Interfaces canónicas del sistema de IA
// ============================================================

// --- Entrada al adapter ---

export interface AdjuntoCanónico {
  url: string;                     // URL pública del adjunto en Callbell
  tipo: "image" | "pdf" | "otro";  // Solo image y pdf van a Claude
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
  flags: string[];                         // Subset de flags marcados 🤖 en el schema

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
```

---

## 4. AI-05 — `src/services/ai/imageProcessor.ts`

Descarga la imagen desde la URL de Callbell y la convierte a base64.
Se ejecuta ANTES de llamar a Claude para preparar el contenido multimodal.

**Reglas críticas:**
- Timeout: 8 segundos (Vercel tiene límite de 10s en Hobby)
- Tamaño máximo: 4 MB (límite de Claude para imágenes inline)
- Si la descarga falla → no bloquear el análisis, continuar con solo texto
- Formatos procesables: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- PDFs: Claude puede recibirlos como `document` con base64

```typescript
// ============================================================
// imageProcessor.ts — Descarga y prepara adjuntos para Claude
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

  const resultados = await Promise.allSettled(
    procesables.map((adj) => descargarAdjunto(adj.url, adj.mimeType)),
  );

  return resultados
    .filter((r): r is PromiseFulfilledResult<AdjuntoProcesado> => r.status === "fulfilled")
    .map((r) => r.value);
}

async function descargarAdjunto(
  url: string,
  mimeType: string,
): Promise<AdjuntoProcesado> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al descargar adjunto`);
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      throw new Error(
        `Adjunto demasiado grande: ${arrayBuffer.byteLength} bytes (máx ${MAX_SIZE_BYTES})`,
      );
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
    console.warn("[IMAGE_PROCESSOR] No se pudo procesar adjunto:", url, err);
    throw err;
  }
}
```

---

## 5. AI-02 — `src/services/ai/claudeAdapter.ts`

El corazón de la integración. Implementa `AIProvider`.

### 5.1 — Estrategia de token efficiency (CRÍTICO)

El costo de Claude depende de los tokens de entrada. La estrategia es:

1. **System prompt corto y denso** — instrucciones en ~300 tokens, no en 1000
2. **Tool_use para structured output** — no pedir JSON en el texto; usar una tool
   con schema JSON exacto. Esto evita que Claude razone sobre el formato
   y produce output más rápido y determinista
3. **Imágenes inline solo si son procesables** — si no hay imagen, el prompt
   es 100% texto y cuesta ~10x menos
4. **Un solo turn** — no hay conversación multi-turn; el análisis es una sola
   llamada completa

### 5.2 — Tool definition (el schema que Claude devuelve)

```typescript
// Tool que Claude debe invocar con el análisis estructurado
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
        enum: ["A","B","C","D","E","F","G","H","I","J","K"],
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
          "ecografia","ecocardiograma","mamografia","densitometria",
          "radiografia","espinografia","panoramica_dental","tac_cone_beam",
          "puncion","biopsia","marcacion","traumatologia","ozonoterapia",
          "pet_ct","spect_ct","centellograma","perfusion_miocardica",
          "camara_gamma","otro",
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
```

### 5.3 — System prompt (mantener bajo ~250 tokens)

```typescript
const SYSTEM_PROMPT = `Sos un asistente especializado en análisis de turnos médicos para Instituto Lavalle 11, un centro de diagnóstico por imágenes en Bahía Blanca, Argentina.

Tu tarea: analizar el mensaje entrante de un paciente por WhatsApp (y la imagen de la orden médica si está adjunta) y extraer los datos estructurados invocando la herramienta "registrar_analisis_caso".

Reglas:
- Siempre invocá la herramienta, incluso si los datos son incompletos
- Si hay imagen de orden médica, priorizá esos datos sobre el texto del mensaje
- Si un campo no está claro, usá null y bajá la confianza de ese campo
- "practica" siempre en español normalizado (sin abreviaturas)
- Los tipos pet_ct, spect_ct, centellograma, perfusion_miocardica, camara_gamma corresponden a Medicina Nuclear (sede Chiclana)
- No inventes datos — si algo no está en el mensaje/imagen, es null`;
```

### 5.4 — Construcción del mensaje multimodal

```typescript
// Construir el array de content con texto + imágenes
function buildUserContent(
  entrada: EntradaCanónica,
  adjutosProcesados: AdjuntoProcesado[],
): Anthropic.MessageParam["content"] {
  const content: Anthropic.MessageParam["content"] = [];

  // Texto principal
  content.push({
    type: "text",
    text: `Mensaje de WhatsApp de ${entrada.contactoNombre} (${entrada.contactoTelefono}):\n\n"${entrada.textoMensaje}"`,
  });

  // Imágenes adjuntas (órdenes médicas)
  for (const adj of adjutosProcesados) {
    if (adj.mimeType === "application/pdf") {
      // Claude acepta PDFs como document blocks
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: adj.base64,
        },
      } as any); // El SDK puede no tener este type aún; castear si es necesario
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
  content.push({
    type: "text",
    text: adjutosProcesados.length > 0
      ? "Analizá el mensaje y la imagen de la orden médica adjunta. Invocá registrar_analisis_caso con los datos extraídos."
      : "Analizá el mensaje. No hay imagen adjunta. Invocá registrar_analisis_caso con los datos que puedas extraer.",
  });

  return content;
}
```

### 5.5 — Llamada principal y parsing

```typescript
export class ClaudeAdapter implements AIProvider {
  nombre = "claude";
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("[CLAUDE] ANTHROPIC_API_KEY no configurada");
    this.client = new Anthropic({ apiKey });
  }

  async analizarCaso(entrada: EntradaCanónica): Promise<RespuestaCanónica> {
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
        max_tokens: 1024,           // La tool response es compacta; 1024 es suficiente
        system: SYSTEM_PROMPT,
        tools: [TOOL_ANALISIS],
        tool_choice: { type: "any" },  // Forzar invocación de la tool
        messages: [{ role: "user", content: userContent }],
      });
    } catch (err: any) {
      throw new AIError("AI_PROVIDER_ERROR", `Claude API error: ${err.message}`, err);
    }

    const tiempoMs = Date.now() - inicio;

    // 4. Extraer tool_use block
    const toolUseBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
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
      tipo_caso: input.tipo_caso as TipoCaso,
      prioridad: input.prioridad as PrioridadCaso,
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
      orden_tipo: adjuntosProcesados.length > 0 ? "imagen" : "no_aplica",
      orden_url: entrada.adjuntos[0]?.url ?? null,
    };
  }
}
```

---

## 6. AI-03 — `src/services/ai/mockProvider.ts`

Para tests y desarrollo sin consumir tokens. Devuelve datos realistas
en ~50ms simulando latencia.

```typescript
export class MockAIProvider implements AIProvider {
  nombre = "mock";

  async analizarCaso(entrada: EntradaCanónica): Promise<RespuestaCanónica> {
    await new Promise((r) => setTimeout(r, 50)); // Simular latencia

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
      orden_tipo: "no_aplica",
      orden_url: null,
    };
  }
}
```

---

## 7. AI-04 — `src/services/ai/aiFactory.ts`

Factory que resuelve el provider según la variable de entorno `PRIMARY_PROVIDER`.
Si el provider falla, hace fallback a `MockAIProvider` (nunca debe bloquearse la creación de un caso).

```typescript
// ============================================================
// aiFactory.ts — Selecciona el AIProvider según configuración
// ============================================================

import type { AIProvider } from "./types.js";
import { ClaudeAdapter } from "./claudeAdapter.js";
import { MockAIProvider } from "./mockProvider.js";

type ProviderName = "claude" | "mock";

const REGISTRY: Record<ProviderName, () => AIProvider> = {
  claude: () => new ClaudeAdapter(),
  mock: () => new MockAIProvider(),
};

let _instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_instance) return _instance;

  const nombre = (process.env.PRIMARY_PROVIDER ?? "mock") as ProviderName;
  const factory = REGISTRY[nombre];

  if (!factory) {
    console.warn(`[AI_FACTORY] Provider desconocido: "${nombre}", usando mock`);
    _instance = new MockAIProvider();
    return _instance;
  }

  try {
    _instance = factory();
    console.log(`[AI_FACTORY] Provider activo: ${_instance.nombre}`);
  } catch (err) {
    console.error("[AI_FACTORY] Error al inicializar provider, usando mock:", err);
    _instance = new MockAIProvider();
  }

  return _instance;
}

/** Para tests — resetear el singleton entre pruebas */
export function _resetAIProvider(): void {
  _instance = null;
}
```

---

## 8. AI-06 — Modificar `webhookHandler.ts`

Reemplazar el TODO con la llamada real al adapter.

**Sección a modificar** (función `handleMessageCreated`, justo antes del `createCaso`):

```typescript
// ANTES (Fase 2):
// --- 3. Si no existe o está cerrado → crear nuevo ---
// TODO: [Fase 3] Aquí se invocará el análisis de IA...
console.log("[STEP 5] Creando nuevo caso para conversation:", conversationUuid);
const nuevoCaso = await createCaso(supabase, parsed, correlationId);

// DESPUÉS (Fase 3):
// --- 3. Analizar con IA ---
console.log("[STEP 5] Analizando con IA:", conversationUuid);

// Construir adjuntos para el adapter
const adjuntos: AdjuntoCanónico[] = (parsed.message?.attachments ?? [])
  .map((att) => ({
    url: att.url,
    tipo: att.content_type?.startsWith("image/") ? "image" as const
        : att.content_type === "application/pdf" ? "pdf" as const
        : "otro" as const,
    mimeType: att.content_type ?? "application/octet-stream",
    nombre: att.file_name ?? undefined,
  }));

const entrada: EntradaCanónica = {
  casoId: "PENDING",  // Aún no existe en BD; es solo para logging del adapter
  conversationUuid,
  textoMensaje: message.text ?? "",
  adjuntos,
  contactoNombre: contact.name,
  contactoTelefono: contact.phone,
  timestamp: parsed.timestamp ?? new Date().toISOString(),
};

let analisisIA: RespuestaCanónica | null = null;
try {
  const provider = getAIProvider();
  analisisIA = await provider.analizarCaso(entrada);
  console.log(`[STEP 5.IA] Análisis completado — tipo: ${analisisIA.tipo_caso}, confianza: ${analisisIA.confianza_global}`);
} catch (err) {
  console.error("[STEP 5.IA] Error en análisis IA — continuando con placeholders:", err);
  // analisisIA queda null — createCaso usa placeholders seguros
}

// --- 4. Crear caso con los datos del análisis ---
console.log("[STEP 5] Creando caso en BD:", conversationUuid);
const nuevoCaso = await createCaso(supabase, parsed, correlationId, analisisIA ?? undefined);
```

**Imports a agregar en webhookHandler.ts:**

```typescript
import { getAIProvider } from "../ai/aiFactory.js";
import type { EntradaCanónica, RespuestaCanónica, AdjuntoCanónico } from "../ai/types.js";
```

---

## 9. AI-07 — Modificar `casoService.ts`

`createCaso()` acepta un cuarto parámetro opcional `analisis?: RespuestaCanónica`.
Si viene, usa los datos reales; si no, usa los placeholders actuales.

**Cambios en la firma:**

```typescript
export async function createCaso(
  supabase: SupabaseClient,
  parsed: ParsedPayload,
  correlationId: string,
  analisis?: RespuestaCanónica,  // NUEVO — opcional para backward compat
): Promise<CasoRow | null>
```

**Cambios en el insert de `casos`:**

```typescript
const casoInput: CreateCasoInput = {
  callbell_conversation_uuid: conversation.uuid,
  contact_phone: contact.phone,
  contact_name: contact.name,
  tipo_caso: analisis?.tipo_caso ?? "A",         // ANTES: hardcoded "A"
  estado: "pendiente",
  prioridad: analisis?.prioridad ?? "normal",    // ANTES: hardcoded "normal"
};
```

**Cambios en el insert de `extracciones_ia`:**

```typescript
await supabase.from("extracciones_ia").insert({
  caso_id: casoRow.id,

  // Datos del paciente
  paciente_nombre: analisis?.paciente_nombre ?? contact.name,
  paciente_dni: analisis?.paciente_dni ?? null,
  obra_social: analisis?.obra_social ?? null,
  nro_afiliado: analisis?.nro_afiliado ?? null,
  nro_carnet: analisis?.nro_carnet ?? null,

  // Práctica
  practica: analisis?.practica ?? "Pendiente de análisis",
  tipo_practica: analisis?.tipo_practica ?? "otro",
  medico_derivante: analisis?.medico_derivante ?? null,
  matricula: analisis?.matricula ?? null,
  diagnostico: analisis?.diagnostico ?? null,
  motivo_solicitud: analisis?.motivo_solicitud ?? null,

  // Confianza y flags
  confianza_global: analisis?.confianza_global ?? 0.0,
  confianza_campos: analisis?.confianza_campos ?? null,
  campos_baja_confianza: analisis?.campos_baja_confianza ?? null,
  flags: buildFlags(analisis, parsed),  // Ver sección 9.1

  // Resumen y metadatos
  resumen: analisis?.resumen ?? `Mensaje recibido de ${contact.name}. Pendiente de análisis por IA.`,
  modelo_ia: analisis?.modelo_ia ?? "pendiente",
  tiempo_procesamiento_ms: analisis?.tiempo_procesamiento_ms ?? null,
  prompt_usado: analisis?.prompt_usado ?? null,
  respuesta_raw: analisis?.respuesta_raw ?? null,

  // Orden médica
  orden_tipo: analisis?.orden_tipo ?? (parsed.message?.has_misrx_link ? "misrx_link" : "no_aplica"),
  orden_url: analisis?.orden_url ?? (parsed.message?.has_misrx_link ? extractMisRxUrl(parsed.message.text) : null),
});
```

### 9.1 — buildFlags: combinación de flags de IA + reglas del sistema

```typescript
function buildFlags(
  analisis: RespuestaCanónica | undefined,
  parsed: ParsedPayload,
): string[] | null {
  const flags = new Set<string>(analisis?.flags ?? []);

  // Flags de sistema (reglas de negocio, no delegadas a la IA)
  if (analisis && analisis.confianza_global < 0.7) {
    flags.add("baja_confianza");
  }
  if (analisis?.obra_social?.toLowerCase().includes("ioma")) {
    flags.add("token_ioma");
  }
  const practicasNuclear = ["pet_ct","spect_ct","centellograma","perfusion_miocardica","camara_gamma"];
  if (analisis?.tipo_practica && practicasNuclear.includes(analisis.tipo_practica)) {
    flags.add("chiclana");
  }
  if (parsed.message?.has_misrx_link) {
    flags.add("orden_digital_misrx");
  }
  if (analisis && analisis.campos_baja_confianza.length > 0) {
    flags.add("baja_confianza");
  }
  if (!analisis) {
    flags.add("error_ia");
  }

  return flags.size > 0 ? Array.from(flags) : null;
}
```

---

## 10. Variable de entorno requerida

Agregar en Vercel → Settings → Environment Variables:

```
PRIMARY_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

Para desarrollo local (`api/.env.local` o `.env.local`):
```
PRIMARY_PROVIDER=mock    # Durante desarrollo, no consumir tokens
ANTHROPIC_API_KEY=       # Vacío en local cuando PRIMARY_PROVIDER=mock
```

---

## 11. Dependencia npm a instalar

```bash
npm install @anthropic-ai/sdk
```

La SDK oficial de Anthropic para Node.js. Expone tipos TypeScript completos
para `Message`, `Tool`, `ContentBlock`, etc.

---

## 12. Verificación: ¿qué debe pasar cuando llega un mensaje con imagen?

```
[WEBHOOK] RAW PAYLOAD: { event: "message_created", payload: { status: "received", ... } }
[STEP 1] Payload validado
[STEP 2] Payload parseado — event: message_created conv_uuid: xxx contact: 549...
[STEP 3] Buscando caso existente por conversation_uuid: xxx
[STEP 4] Resultado búsqueda — encontrado: false no encontrado
[STEP 5] Analizando con IA: xxx
[IMAGE_PROCESSOR] Descargando adjunto 1/1...
[CLAUDE] Adjuntos procesados: 1/1
[STEP 5.IA] Análisis completado — tipo: A, confianza: 0.87
[CASO] Ejecutando INSERT casos con datos: { tipo_caso: "A", prioridad: "normal", ... }
[CASO] Resultado INSERT casos — OK, id: LV-0001
[CASO] Ejecutando INSERT extracciones_ia para caso: LV-0001
[CASO] Resultado INSERT extracciones_ia — OK
[WEBHOOK] Processing completed (2340ms)
```

---

## 13. Casos de borde a manejar

| Caso | Comportamiento esperado |
|---|---|
| Claude API no disponible | `analisisIA = null`, caso creado con flag `error_ia`, placeholders |
| Imagen no descargable (URL expirada) | Análisis continúa con solo texto, sin bloquear |
| Imagen > 4 MB | Se omite, análisis solo con texto |
| Claude no invoca la tool | `AIError("AI_INVALID_RESPONSE")` → catch → placeholders |
| `ANTHROPIC_API_KEY` ausente | `ClaudeAdapter` constructor lanza error → factory cae en mock |
| `PRIMARY_PROVIDER=mock` | `MockAIProvider` responde en 50ms sin network |
| Mensaje sin texto ni imagen | `textoMensaje: ""`, `adjuntos: []` → Claude devuelve tipo K (contacto equivocado) con baja confianza |

---

## 14. Lo que NO entra en v1 de Fase 3

- ❌ Fallback automático a GPT si Claude falla (v1.1)
- ❌ Circuit breaker / rate limiter compartido (v1.1)
- ❌ Caché de respuestas idénticas (backlog)
- ❌ Estimación de tokens pre-llamada (O-02) — max_tokens=1024 es suficiente guard para v1
- ❌ Integración Google Sheets para copago/cobertura — los campos `requiere_copago`, `requiere_llamada` quedan null en v1
- ❌ Actualización de `adjuntos.processed_by_ia = true` — la tabla adjuntos no se puebla aún desde el webhook

---

## 15. Orden de implementación recomendado

```
AI-01 → AI-05 → AI-02 → AI-03 → AI-04 → AI-06 → AI-07
types    image   claude   mock    factory  webhook  casoSvc
```

Verificar en cada paso con `npx tsc -b --noEmit` antes de continuar.
Testear AI-02 en aislamiento con un fixture de mensaje antes de conectar al webhook.
Cuando todo compila: activar `PRIMARY_PROVIDER=claude` en Vercel y verificar el log
con un mensaje real desde WhatsApp.
```

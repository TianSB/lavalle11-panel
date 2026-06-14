import type { EntradaCanónica, RespuestaCanónica } from "../ai/types.js";
import type { ParsedPayload } from "../callbell/types.js";

// -----------------------------------------------------------
// EntradaCanónica fixtures
// -----------------------------------------------------------

export const entradaSinAdjuntos: EntradaCanónica = {
  casoId: "TEST-001",
  conversationUuid: "conv-123",
  textoMensaje: "Hola, quería sacar turno para una ecografía abdominal",
  adjuntos: [],
  contactoNombre: "Juan Pérez",
  contactoTelefono: "+5491112345678",
  timestamp: "2026-06-14T12:00:00.000Z",
};

export const entradaConAdjuntos: EntradaCanónica = {
  casoId: "TEST-002",
  conversationUuid: "conv-456",
  textoMensaje: "Adjunto la orden médica",
  adjuntos: [
    {
      url: "https://callbell.example.com/attachments/orden.jpg",
      tipo: "image",
      mimeType: "image/jpeg",
      nombre: "orden.jpg",
    },
  ],
  contactoNombre: "María García",
  contactoTelefono: "+5491123456789",
  timestamp: "2026-06-14T12:30:00.000Z",
};

export const entradaConPdf: EntradaCanónica = {
  casoId: "TEST-003",
  conversationUuid: "conv-789",
  textoMensaje: "Acá está la orden en PDF",
  adjuntos: [
    {
      url: "https://callbell.example.com/attachments/orden.pdf",
      tipo: "pdf",
      mimeType: "application/pdf",
      nombre: "orden.pdf",
    },
  ],
  contactoNombre: "Carlos López",
  contactoTelefono: "+5491133334444",
  timestamp: "2026-06-14T13:00:00.000Z",
};

// -----------------------------------------------------------
// RespuestaCanónica fixtures
// -----------------------------------------------------------

export const respuestaNormal: RespuestaCanónica = {
  tipo_caso: "A",
  prioridad: "normal",
  paciente_nombre: "Juan Pérez",
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
  flags: ["ayuno"],
  confianza_global: 0.92,
  confianza_campos: {
    paciente_nombre: 0.90,
    practica: 0.95,
    obra_social: 0.88,
  },
  campos_baja_confianza: [],
  resumen: "Ecografía abdominal para Juan Pérez (IOMA). Control rutinario.",
  modelo_ia: "mock",
  tiempo_procesamiento_ms: 50,
  prompt_usado: "MOCK",
  respuesta_raw: { mock: true },
  orden_tipo: "no_aplica",
  orden_url: null,
};

export const respuestaConfianzaBaja: RespuestaCanónica = {
  tipo_caso: "A",
  prioridad: "normal",
  paciente_nombre: "Juan Pérez",
  paciente_dni: "12345678",
  obra_social: "IOMA",
  nro_afiliado: "987654",
  nro_carnet: null,
  practica: "Ecografía abdominal completa",
  tipo_practica: "ecografia",
  medico_derivante: null,
  matricula: null,
  diagnostico: null,
  motivo_solicitud: null,
  flags: ["orden_incompleta"],
  confianza_global: 0.45,
  confianza_campos: {
    paciente_nombre: 0.90,
    practica: 0.95,
    obra_social: 0.30,
  },
  campos_baja_confianza: ["obra_social"],
  resumen: "Ecografía abdominal para Juan Pérez. Revisar: obra_social.",
  modelo_ia: "mock",
  tiempo_procesamiento_ms: 50,
  prompt_usado: "MOCK",
  respuesta_raw: { mock: true },
  orden_tipo: "no_aplica",
  orden_url: null,
};

export const respuestaChiclana: RespuestaCanónica = {
  tipo_caso: "A",
  prioridad: "urgente",
  paciente_nombre: "Pedro Martínez",
  paciente_dni: "87654321",
  obra_social: "OSDE",
  nro_afiliado: null,
  nro_carnet: null,
  practica: "PET-CT cuerpo entero",
  tipo_practica: "pet_ct",
  medico_derivante: "Dr. Rodríguez",
  matricula: "MP 98765",
  diagnostico: "Oncológico",
  motivo_solicitud: "busqueda",
  flags: ["ayuno"],
  confianza_global: 0.95,
  confianza_campos: {
    paciente_nombre: 0.95,
    practica: 0.98,
  },
  campos_baja_confianza: [],
  resumen: "PET-CT cuerpo entero para Pedro Martínez (OSDE). Oncológico.",
  modelo_ia: "mock",
  tiempo_procesamiento_ms: 50,
  prompt_usado: "MOCK",
  respuesta_raw: { mock: true },
  orden_tipo: "imagen",
  orden_url: "https://callbell.example.com/attachments/orden.jpg",
};

// -----------------------------------------------------------
// ParsedPayload fixtures
// -----------------------------------------------------------

export const payloadNormal: ParsedPayload = {
  event: "message_created",
  message: {
    callbell_uuid: "msg-001",
    status: "received",
    text: "Hola, quería sacar turno para una ecografía abdominal",
    has_misrx_link: false,
    orden_tipo: null,
    attachments: [],
  },
  contact: {
    uuid: "contact-001",
    name: "Juan Pérez",
    phone: "+5491112345678",
  },
  conversation: {
    uuid: "conv-123",
    status: "open",
  },
  timestamp: "2026-06-14T12:00:00.000Z",
};

export const payloadConMisRx: ParsedPayload = {
  event: "message_created",
  message: {
    callbell_uuid: "msg-002",
    status: "received",
    text: "Te paso el link de MisRx: https://misrx.com.ar/prestacion?token=abc-123-def",
    has_misrx_link: true,
    orden_tipo: "misrx_link",
    attachments: [],
  },
  contact: {
    uuid: "contact-002",
    name: "Ana Díaz",
    phone: "+5491155556666",
  },
  conversation: {
    uuid: "conv-456",
    status: "open",
  },
  timestamp: "2026-06-14T14:00:00.000Z",
};

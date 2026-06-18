export type TipoCaso = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K";

export type EstadoCaso = "pendiente" | "en_proceso" | "esperando_respuesta" | "cerrado";

export type Prioridad = "urgente" | "normal" | "bajo";

export type Sede = "lavalle11" | "chiclana";

export type ClosingReason =
  | "turno_asignado"
  | "turno_reprogramado"
  | "turno_cancelado"
  | "consulta_resuelta"
  | "consulta_resuelta_portal"
  | "esperando_respuesta"
  | "derivado_chiclana"
  | "practica_no_disponible"
  | "equivocado"
  | "error_datos_ris"
  | "presupuesto_pendiente"
  | "sin_resolucion";

export type Flag =
  | "ayuno"
  | "aines"
  | "orden_incompleta"
  | "baja_confianza"
  | "token_ioma"
  | "chiclana"
  | "copago"
  | "requiere_llamada"
  | "orden_ilegible"
  | "error_ia";

export type Rol = "asesor" | "administrador";

export type TipoPractica =
  | "ecografia"
  | "ecocardiograma"
  | "mamografia"
  | "densitometria"
  | "radiografia"
  | "espinografia"
  | "panoramica_dental"
  | "tac_cone_beam"
  | "puncion"
  | "biopsia"
  | "marcacion"
  | "traumatologia"
  | "ozonoterapia"
  | "pet_ct"
  | "spect_ct"
  | "centellograma"
  | "perfusion_miocardica"
  | "camara_gamma"
  | "otro";

export type Instruccion =
  | "ayuno_6hs"
  | "ayuno_4hs"
  | "traer_orden"
  | "traer_estudios_previos"
  | "aines"
  | "token_ioma"
  | "con_acompaniante"
  | "sin_acompaniante";

export interface ExtraccionIA {
  paciente_nombre: string;
  paciente_dni: string | null;
  obra_social: string | null;
  nro_afiliado: string | null;
  nro_carnet: string | null;
  practica: string;
  tipo_practica: TipoPractica;
  medico_derivante: string | null;
  matricula: string | null;
  diagnostico: string | null;
  motivo_solicitud: string | null;
  requiere_copago: boolean;
  requiere_llamada: boolean;
  requiere_autorizacion: boolean;
  flags: Flag[];
  confianza_global: number;
  confianza_campos: Record<string, number>;
  modelo_ia: string;
  campos_baja_confianza: string[];
  orden_url: string | null;
  resumen: string;
}

export interface Turno {
  id: string;
  caso_id: string;
  sede: Sede;
  fecha: string;
  hora: string;
  estado: "confirmado" | "reprogramado" | "cancelado";
  instrucciones: Instruccion[];
  mensaje_enviado: string | null;
  confirmado_at: string | null;
}

export interface Llamada {
  id: string;
  caso_id: string;
  asesor_id: string;
  phone: string;
  canal: "whatsapp_desktop";
  initiated_at: string;
  duracion_min: number | null;
}

export interface Caso {
  id: string;
  callbell_uuid: string;
  contact_phone: string;
  contact_name: string;
  tipo_caso: TipoCaso;
  estado: EstadoCaso;
  prioridad: Prioridad;
  asesor_id: string | null;
  asesor_nombre: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closing_reason: ClosingReason | null;
  seguimiento_fecha: string | null;
  seguimiento_nota: string | null;
  extraccion_ia: ExtraccionIA;
  turnos: Turno[];
  llamadas: Llamada[];
  /** Cantidad de mensajes entrantes acumulados en la conversación */
  mensajes_count: number;
  /** Cantidad de adjuntos sin procesar por IA (processed_by_ia = false) */
  adjuntos_pendientes: number;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface MetricaResumen {
  casos_activos: number;
  casos_hoy: number;
  casos_sin_asignar: number;
  casos_sin_atender_24hs: number;
  tiempo_promedio_resolucion_min: number;
  tasa_resolucion_automatica: number;
}

export interface CasoPorTipo {
  tipo: TipoCaso;
  nombre: string;
  cantidad: number;
}

export interface VolumenDiario {
  fecha: string;
  total: number;
  resueltos: number;
  automaticos: number;
}

export interface MetricaPorAsesor {
  asesor_id: string;
  asesor_nombre: string;
  /** Casos activos (no cerrados) asignados al asesor */
  casos_activos: number;
  /** Total de casos resueltos (cerrados) por el asesor */
  casos_resueltos: number;
  /** Tiempo promedio de resolución en minutos */
  tiempo_promedio_resolucion_min: number;
  /** Proporción de casos resueltos vs total asignado */
  tasa_resolucion: number;
  /** Última actividad (fecha ISO) */
  ultima_actividad: string | null;
}

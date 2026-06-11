-- ============================================================
-- 001_enums.sql
-- Todos los ENUMs del sistema Panel de Gestión de Turnos con IA
-- Instituto Lavalle 11
-- ============================================================
-- Ejecutar primero: sin dependencias
-- ============================================================

-- 1. ENUMs de Casos
CREATE TYPE tipo_caso AS ENUM (
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'
);

CREATE TYPE estado_caso AS ENUM (
    'pendiente',
    'en_proceso',
    'esperando_respuesta',
    'cerrado'
);

CREATE TYPE prioridad_caso AS ENUM (
    'urgente',
    'normal',
    'bajo'
);

CREATE TYPE closing_reason AS ENUM (
    'turno_asignado',
    'turno_reprogramado',
    'turno_cancelado',
    'consulta_resuelta',
    'consulta_resuelta_portal',
    'esperando_respuesta',
    'derivado_chiclana',
    'practica_no_disponible',
    'equivocado',
    'error_datos_ris',
    'presupuesto_pendiente',
    'sin_resolucion'
);

CREATE TYPE callbell_conversation_status AS ENUM (
    'opened',
    'closed',
    'pending'
);

-- 2. ENUMs de Mensajes
CREATE TYPE direccion_mensaje AS ENUM (
    'inbound',
    'outbound'
);

CREATE TYPE tipo_contenido AS ENUM (
    'text',
    'image',
    'document',
    'audio',
    'video',
    'sticker'
);

CREATE TYPE tipo_remitente AS ENUM (
    'patient',
    'asesor',
    'system'
);

CREATE TYPE estado_mensaje AS ENUM (
    'received',
    'sent',
    'failed',
    'delivered',
    'read'
);

-- 3. ENUMs de Turnos
CREATE TYPE sede_turno AS ENUM (
    'lavalle11',
    'chiclana'
);

CREATE TYPE estado_turno AS ENUM (
    'confirmado',
    'reprogramado',
    'cancelado'
);

-- 4. ENUMs de Llamadas
CREATE TYPE canal_llamada AS ENUM (
    'whatsapp_desktop'
);

-- 5. ENUMs de Extracción IA
CREATE TYPE tipo_practica AS ENUM (
    'ecografia',
    'ecocardiograma',
    'mamografia',
    'densitometria',
    'radiografia',
    'espinografia',
    'panoramica_dental',
    'tac_cone_beam',
    'puncion',
    'biopsia',
    'marcacion',
    'traumatologia',
    'ozonoterapia',
    'pet_ct',
    'spect_ct',
    'centellograma',
    'perfusion_miocardica',
    'camara_gamma',
    'otro'
);

CREATE TYPE motivo_solicitud AS ENUM (
    'screening',
    'busqueda',
    'control',
    'otro'
);

-- 6. ENUMs de Usuarios
CREATE TYPE rol_usuario AS ENUM (
    'asesor',
    'administrador'
);

-- 7. ENUMs de Seguimientos
CREATE TYPE estado_seguimiento AS ENUM (
    'pendiente',
    'completado',
    'vencido'
);

-- ============================================================
-- 004_mensajes.sql
-- Tabla: mensajes (historial de conversación)
-- ============================================================
-- Depende de: 001_enums.sql, 003_casos.sql (FK)
-- ============================================================

CREATE TABLE public.mensajes (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id             VARCHAR(10)         NOT NULL REFERENCES public.casos(id) ON DELETE RESTRICT,
    callbell_message_id VARCHAR(100)        NOT NULL,
    direction           direccion_mensaje   NOT NULL,
    content_type        tipo_contenido      NOT NULL,
    content             TEXT                NOT NULL,
    sender_type         tipo_remitente      NOT NULL,
    status              estado_mensaje,
    callbell_created_at TIMESTAMPTZ         NOT NULL,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- UNIQUE para idempotencia
    CONSTRAINT uq_mensajes_callbell_id UNIQUE (callbell_message_id)
);

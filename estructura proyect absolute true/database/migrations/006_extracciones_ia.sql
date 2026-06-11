-- ============================================================
-- 006_extracciones_ia.sql
-- Tabla: extracciones_ia (resultado del análisis de Claude API)
-- Relación 1:1 con casos
-- ============================================================
-- Depende de: 001_enums.sql, 003_casos.sql (FK)
-- ============================================================

CREATE TABLE public.extracciones_ia (
    caso_id                 VARCHAR(10)     PRIMARY KEY REFERENCES public.casos(id) ON DELETE RESTRICT,
    paciente_nombre         VARCHAR(200)    NOT NULL,
    paciente_dni            VARCHAR(15),
    obra_social             VARCHAR(100),
    nro_afiliado            VARCHAR(50),
    nro_carnet              VARCHAR(50),
    practica                VARCHAR(200)    NOT NULL,
    tipo_practica           tipo_practica   NOT NULL,
    medico_derivante        VARCHAR(200),
    matricula               VARCHAR(30),
    diagnostico             TEXT,
    motivo_solicitud        motivo_solicitud,
    requiere_copago         BOOLEAN,
    requiere_llamada        BOOLEAN,
    requiere_autorizacion   BOOLEAN,
    flags                   TEXT[],
    confianza_global        NUMERIC(3,2)    NOT NULL,

    -- Rango válido: 0.00 a 1.00 (R-02 fix)
    CONSTRAINT chk_extracciones_confianza CHECK (
        confianza_global >= 0.00 AND confianza_global <= 1.00
    ),
    confianza_campos        JSONB,
    orden_url               TEXT,
    resumen                 TEXT            NOT NULL,
    modelo_ia               VARCHAR(50)     NOT NULL,
    tiempo_procesamiento_ms INTEGER,
    prompt_usado            TEXT,
    respuesta_raw           JSONB,
    campos_baja_confianza   VARCHAR(50)[],
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

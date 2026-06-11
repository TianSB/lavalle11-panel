-- ============================================================
-- 009_llamadas.sql
-- Tabla: llamadas (registro de llamadas de asesores a pacientes)
-- ============================================================
-- Depende de: 001_enums.sql, 002_usuarios.sql (FK), 003_casos.sql (FK)
-- ============================================================

CREATE TABLE public.llamadas (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id         VARCHAR(10)     NOT NULL REFERENCES public.casos(id) ON DELETE RESTRICT,
    asesor_id       UUID            NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    phone           VARCHAR(20)     NOT NULL,
    canal           canal_llamada   NOT NULL DEFAULT 'whatsapp_desktop',
    duracion_min    INTEGER,
    nota            TEXT,
    initiated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Duración válida: 1–120 minutos
    CONSTRAINT chk_llamadas_duracion CHECK (
        duracion_min IS NULL OR (duracion_min >= 1 AND duracion_min <= 120)
    )
);

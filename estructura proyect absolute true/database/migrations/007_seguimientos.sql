-- ============================================================
-- 007_seguimientos.sql
-- Tabla: seguimientos (seguimientos programados por caso)
-- Separada de casos para permitir múltiples seguimientos
-- ============================================================
-- Depende de: 001_enums.sql, 002_usuarios.sql (FK), 003_casos.sql (FK)
-- ============================================================

CREATE TABLE public.seguimientos (
    id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id         VARCHAR(10)             NOT NULL REFERENCES public.casos(id) ON DELETE RESTRICT,
    asesor_id       UUID                    NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    fecha           DATE                    NOT NULL,
    nota            TEXT,
    estado          estado_seguimiento      NOT NULL DEFAULT 'pendiente',
    completado_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    -- La fecha no puede ser anterior a la creación
    CONSTRAINT chk_seguimientos_fecha CHECK (fecha >= CURRENT_DATE)
);

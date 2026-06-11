-- ============================================================
-- 005_adjuntos.sql
-- Tabla: adjuntos (archivos adjuntos a mensajes)
-- ============================================================
-- Depende de: 003_casos.sql (FK), 004_mensajes.sql (FK)
-- ============================================================

CREATE TABLE public.adjuntos (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    mensaje_id          UUID            NOT NULL REFERENCES public.mensajes(id) ON DELETE RESTRICT,
    caso_id             VARCHAR(10)     NOT NULL REFERENCES public.casos(id) ON DELETE RESTRICT,
    file_type           VARCHAR(50)     NOT NULL,
    file_url            TEXT            NOT NULL,
    file_name           VARCHAR(255),
    file_size_bytes     INTEGER,
    processed_by_ia     BOOLEAN         NOT NULL DEFAULT FALSE,
    ia_extracted_text   TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 014_orden_tipo.sql
-- Agrega campo orden_tipo a extracciones_ia para soportar
-- órdenes digitales de MisRx (receta electrónica)
-- ============================================================
-- Depende de: 006_extracciones_ia.sql (tabla existente)
-- ============================================================

ALTER TABLE public.extracciones_ia
    ADD COLUMN IF NOT EXISTS orden_tipo TEXT
    DEFAULT 'no_aplica'
    CONSTRAINT chk_extracciones_orden_tipo CHECK (
        orden_tipo IN ('imagen', 'pdf', 'misrx_link', 'no_aplica')
    );

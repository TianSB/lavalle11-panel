-- ============================================================
-- 017_indices_adjuntos_mensajes.sql
-- Índices para optimizar consultas frecuentes en adjuntos y mensajes
-- ============================================================
-- Las queries batch fetchAdjuntosPendientesCounts y fetchMensajesCounts
-- filtran por caso_id + direction / processed_by_ia.
-- Sin índices, PostgreSQL hará sequential scans que se vuelven lentos
-- con ~1000+ casos.
--
-- Impacto esperado:
--   - fetchMensajesCounts: de sequential scan a index only scan
--   - fetchAdjuntosPendientesCounts: de sequential scan a index scan
-- ============================================================

-- ============================================================
-- 1. Índice para fetchMensajesCounts (caso_id + direction)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mensajes_caso_id_direction
ON mensajes (caso_id, direction);

-- ============================================================
-- 2. Índice para fetchAdjuntosPendientesCounts (caso_id + processed_by_ia)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_adjuntos_caso_id_processed
ON adjuntos (caso_id, processed_by_ia);

-- ============================================================
-- 3. Índices simples para consultas directas por caso_id
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mensajes_caso_id
ON mensajes (caso_id);

CREATE INDEX IF NOT EXISTS idx_adjuntos_caso_id
ON adjuntos (caso_id);

-- ============================================================
-- Verificación post-ejecución
-- ============================================================
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('mensajes', 'adjuntos')
-- ORDER BY tablename, indexname;

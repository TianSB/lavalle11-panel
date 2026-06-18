-- ============================================================
-- 016_adjuntos_storage_bucket.sql
-- Crear bucket 'adjuntos' en Supabase Storage + políticas RLS
-- ============================================================
-- Pre-requisito para que guardarAdjuntoEnStorage() funcione.
-- Las URLs de Callbell expiran a los 600s; este bucket almacena
-- copias permanentes accesibles desde el panel y desde Claude.
--
-- Ejecutar en: SQL Editor de Supabase Dashboard
-- Verificar en: Storage → Buckets → 'adjuntos'
-- ============================================================

-- ============================================================
-- 1. Crear el bucket (público para lectura)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('adjuntos', 'adjuntos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Política: lectura pública (el panel necesita ver las imágenes)
-- ============================================================
DROP POLICY IF EXISTS "Adjuntos públicos de lectura" ON storage.objects;
CREATE POLICY "Adjuntos públicos de lectura"
ON storage.objects FOR SELECT
USING (bucket_id = 'adjuntos');

-- ============================================================
-- 3. Política: inserción solo desde service role (backend)
-- ============================================================
DROP POLICY IF EXISTS "Service role puede insertar adjuntos" ON storage.objects;
CREATE POLICY "Service role puede insertar adjuntos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'adjuntos');

-- ============================================================
-- Verificación
-- ============================================================
-- curl -X GET "https://[PROJECT_REF].supabase.co/storage/v1/bucket/adjuntos"
-- Headers: Authorization: Bearer [SERVICE_ROLE_KEY]

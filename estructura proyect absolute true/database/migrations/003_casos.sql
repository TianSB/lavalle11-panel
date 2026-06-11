-- ============================================================
-- 003_casos.sql
-- Tabla: casos (corazón del sistema)
-- Secuencia seq_caso_id + triggers LV-XXXX + updated_at
-- ============================================================
-- Depende de: 001_enums.sql, 002_usuarios.sql (FK)
-- ============================================================

-- Secuencia para IDs de casos con formato LV-XXXX
CREATE SEQUENCE IF NOT EXISTS public.seq_caso_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Función: generar ID con formato LV-XXXX
CREATE OR REPLACE FUNCTION public.generar_caso_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.id := 'LV-' || LPAD(nextval('public.seq_caso_id')::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

-- Función: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Tabla: casos
CREATE TABLE public.casos (
    id                          VARCHAR(10)                 PRIMARY KEY,
    callbell_conversation_uuid  UUID                        NOT NULL,
    contact_phone               VARCHAR(20)                 NOT NULL,
    contact_name                VARCHAR(150)                NOT NULL,
    tipo_caso                   tipo_caso                   NOT NULL,
    estado                      estado_caso                 NOT NULL DEFAULT 'pendiente',
    prioridad                   prioridad_caso              NOT NULL DEFAULT 'normal',
    asesor_id                   UUID                        REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    callbell_channel            VARCHAR(50),
    callbell_conversation_status callbell_conversation_status,
    closing_reason              closing_reason,
    resolved_at                 TIMESTAMPTZ,
    metadata                    JSONB,
    created_at                  TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),

    -- UNIQUE constraint for idempotencia
    CONSTRAINT uq_casos_callbell_conversation_uuid UNIQUE (callbell_conversation_uuid)
);

-- Trigger: generar ID antes de insertar
CREATE TRIGGER trg_casos_generar_id
    BEFORE INSERT ON public.casos
    FOR EACH ROW
    EXECUTE FUNCTION public.generar_caso_id();

-- Trigger: actualizar updated_at antes de UPDATE
CREATE TRIGGER trg_casos_updated_at
    BEFORE UPDATE ON public.casos
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_updated_at();

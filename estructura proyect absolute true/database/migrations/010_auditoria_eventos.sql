-- ============================================================
-- 010_auditoria_eventos.sql — Sistema de auditoría FINAL
-- Tabla: auditoria_eventos (append-only event log)
-- Trigger ultra-liviano: solo telemetría técnica (sin lógica)
-- ============================================================
-- Depende de: 002_usuarios.sql (FK), 003_casos.sql (FK)
--
-- Dos tipos de eventos conviven en esta tabla:
--   technical (event_source = 'db_trigger') → escritos por trigger
--   semantic  (event_source = 'backend')    → escritos por Node.js AuditService
--
-- Idempotencia: event_hash UNIQUE
--   Trigger:  'trg:{caso_id}:{TG_OP}:{uuid}' (no determinístico, 1 vez por op)
--   Backend:  sha256('backend:{caso_id}:{accion}:{detalle_stable}')
-- ============================================================

-- ============================================================
-- 1. FUNCIÓN TRIGGER (ultra-liviana)
-- ============================================================
-- Solo INSERT de snapshot. Sin jsonb_each, sin jsonb_agg,
-- sin comparación OLD/NEW, sin lógica condicional de negocio.
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_evento_caso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.auditoria_eventos (
        event_hash,
        event_source,
        event_type,
        correlation_id,   -- NULL: el trigger no conoce el contexto de negocio
        caso_id,
        asesor_id,
        accion,
        detalle
    ) VALUES (
        -- event_hash único: prefijo trg: + caso_id + operación + UUID aleatorio
        'trg:' || COALESCE(NEW.id, OLD.id) || ':' || TG_OP || ':' || gen_random_uuid()::text,

        'db_trigger',    -- event_source
        'technical',     -- event_type
        NULL,            -- correlation_id (no disponible en trigger)

        COALESCE(NEW.id, OLD.id),
        NEW.asesor_id,

        -- Acción genérica (sin inferencia semántica)
        CASE
            WHEN TG_OP = 'INSERT' THEN 'caso.creado'
            ELSE 'caso.actualizado'
        END,

        -- Snapshot de campos clave (SIN comparación OLD/NEW)
        jsonb_build_object(
            'tg_op',             TG_OP,
            'estado',            COALESCE(NEW.estado, OLD.estado),
            'prioridad',         COALESCE(NEW.prioridad, OLD.prioridad),
            'tipo_caso',         COALESCE(NEW.tipo_caso, OLD.tipo_caso),
            'asesor_id',         NEW.asesor_id,
            'closing_reason',    NEW.closing_reason,
            'resolved_at',       NEW.resolved_at,
            'contact_name',      COALESCE(NEW.contact_name, OLD.contact_name),
            'contact_phone',     COALESCE(NEW.contact_phone, OLD.contact_phone)
        )
    );

    RETURN NEW;
END;
$$;

-- ============================================================
-- 2. TABLA
-- ============================================================
-- Usamos CREATE TABLE IF NOT EXISTS para ser seguros en
-- migraciones. Si ya existe, hacemos ALTER para agregar
-- las columnas nuevas (event_hash, event_source, etc.).
-- ============================================================

-- Crear tabla si no existe (primera migración)
CREATE TABLE IF NOT EXISTS public.auditoria_eventos (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    event_hash      TEXT            NOT NULL,
    event_source    VARCHAR(20)     NOT NULL DEFAULT 'db_trigger',
    event_type      VARCHAR(20)     NOT NULL DEFAULT 'technical',
    correlation_id  UUID,
    caso_id         VARCHAR(10)     NOT NULL REFERENCES public.casos(id) ON DELETE RESTRICT,
    asesor_id       UUID            REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    accion          VARCHAR(50)     NOT NULL,
    detalle         JSONB,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Si la tabla ya existía (migración desde versión anterior),
-- agregar columnas faltantes (idempotente)
ALTER TABLE public.auditoria_eventos
    ADD COLUMN IF NOT EXISTS event_hash     TEXT            NOT NULL DEFAULT gen_random_uuid()::text,
    ADD COLUMN IF NOT EXISTS event_source   VARCHAR(20)     NOT NULL DEFAULT 'db_trigger',
    ADD COLUMN IF NOT EXISTS event_type     VARCHAR(20)     NOT NULL DEFAULT 'technical',
    ADD COLUMN IF NOT EXISTS correlation_id UUID;

-- Constraints
ALTER TABLE public.auditoria_eventos
    DROP CONSTRAINT IF EXISTS uq_auditoria_event_hash;

ALTER TABLE public.auditoria_eventos
    ADD CONSTRAINT uq_auditoria_event_hash UNIQUE (event_hash);

-- Check constraints para valores válidos
ALTER TABLE public.auditoria_eventos
    DROP CONSTRAINT IF EXISTS chk_audit_event_source;

ALTER TABLE public.auditoria_eventos
    ADD CONSTRAINT chk_audit_event_source
    CHECK (event_source IN ('db_trigger', 'backend'));

ALTER TABLE public.auditoria_eventos
    DROP CONSTRAINT IF EXISTS chk_audit_event_type;

ALTER TABLE public.auditoria_eventos
    ADD CONSTRAINT chk_audit_event_type
    CHECK (event_type IN ('technical', 'semantic'));

-- ============================================================
-- 3. ÍNDICES
-- ============================================================

-- Consulta principal: eventos de un caso ordenados por tiempo
CREATE INDEX IF NOT EXISTS idx_audit_caso_tiempo
    ON public.auditoria_eventos(caso_id, created_at DESC);

-- Filtrar por fuente (debugging, reportes)
CREATE INDEX IF NOT EXISTS idx_audit_event_source
    ON public.auditoria_eventos(event_source);

-- Filtrar por tipo de evento
CREATE INDEX IF NOT EXISTS idx_audit_event_type
    ON public.auditoria_eventos(event_type);

-- Búsqueda por acción específica
CREATE INDEX IF NOT EXISTS idx_audit_accion
    ON public.auditoria_eventos(accion);

-- Búsqueda por correlation_id (trazabilidad end-to-end)
CREATE INDEX IF NOT EXISTS idx_audit_correlation
    ON public.auditoria_eventos(correlation_id)
    WHERE correlation_id IS NOT NULL;

-- Índice compuesto para queries temporales por fuente
-- Útil para reports: "eventos de las últimas 24hs por source"
CREATE INDEX IF NOT EXISTS idx_audit_source_created
    ON public.auditoria_eventos(event_source, created_at DESC);

-- ============================================================
-- 4. TRIGGER
-- ============================================================

DROP TRIGGER IF EXISTS trg_auditoria_casos ON public.casos;

CREATE TRIGGER trg_auditoria_casos
    AFTER INSERT OR UPDATE ON public.casos
    FOR EACH ROW
    EXECUTE FUNCTION public.registrar_evento_caso();

-- ============================================================
-- 010_auditoria_eventos.sql
-- Tabla: auditoria_eventos (trazabilidad de acciones)
-- Trigger automático: registra eventos de casos
-- ============================================================
-- Depende de: 002_usuarios.sql (FK), 003_casos.sql (FK)
-- ============================================================

-- Función: registrar evento de auditoría al modificar casos
CREATE OR REPLACE FUNCTION public.registrar_evento_caso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_accion VARCHAR(50);
    v_detalle JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_accion := 'caso.creado';
        v_detalle := jsonb_build_object(
            'callbell_conversation_uuid', NEW.callbell_conversation_uuid,
            'tipo_caso', NEW.tipo_caso
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Detectar qué cambió
        IF OLD.estado IS DISTINCT FROM NEW.estado THEN
            IF NEW.estado = 'cerrado' THEN
                v_accion := 'caso.cerrado';
                v_detalle := jsonb_build_object(
                    'closing_reason', NEW.closing_reason,
                    'estado_anterior', OLD.estado
                );
            ELSE
                v_accion := 'caso.estado_cambiado';
                v_detalle := jsonb_build_object(
                    'estado_anterior', OLD.estado,
                    'estado_nuevo', NEW.estado
                );
            END IF;
        ELSIF OLD.asesor_id IS DISTINCT FROM NEW.asesor_id THEN
            v_accion := 'caso.asignado';
            v_detalle := jsonb_build_object(
                'asesor_id_anterior', OLD.asesor_id,
                'asesor_id_nuevo', NEW.asesor_id
            );
        ELSIF OLD.closing_reason IS DISTINCT FROM NEW.closing_reason THEN
            v_accion := 'caso.cerrado';
            v_detalle := jsonb_build_object(
                'closing_reason', NEW.closing_reason,
                'resolved_at', NEW.resolved_at
            );
        ELSE
            v_accion := 'caso.modificado';
            v_detalle := jsonb_build_object(
                'campos_modificados', (
                    SELECT jsonb_agg(key) FROM jsonb_each(to_jsonb(NEW)) AS t(key, val)
                    WHERE (to_jsonb(OLD) ->> key) IS DISTINCT FROM (to_jsonb(NEW) ->> key)
                        AND key NOT IN ('updated_at')
                )
            );
        END IF;
    ELSE
        -- No aplica DELETE (soft delete)
        RETURN OLD;
    END IF;

    INSERT INTO public.auditoria_eventos (caso_id, asesor_id, accion, detalle)
    VALUES (
        COALESCE(NEW.id, OLD.id),
        NEW.asesor_id,
        v_accion,
        v_detalle
    );

    RETURN NEW;
END;
$$;

-- Tabla: auditoria_eventos
CREATE TABLE public.auditoria_eventos (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id     VARCHAR(10)     NOT NULL REFERENCES public.casos(id) ON DELETE RESTRICT,
    asesor_id   UUID            REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    accion      VARCHAR(50)     NOT NULL,
    detalle     JSONB,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Trigger: auditar INSERT y UPDATE en casos
CREATE TRIGGER trg_auditoria_casos
    AFTER INSERT OR UPDATE ON public.casos
    FOR EACH ROW
    EXECUTE FUNCTION public.registrar_evento_caso();

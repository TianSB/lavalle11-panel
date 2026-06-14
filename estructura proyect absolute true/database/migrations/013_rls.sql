-- ============================================================
-- 013_rls.sql
-- Políticas Row Level Security (RLS) para todas las tablas
-- ============================================================
-- Depende de: 001_enums.sql a 012_indices.sql
-- ============================================================

-- ============================================================
-- Función auxiliar: obtener el rol del usuario autenticado
-- ============================================================
CREATE OR REPLACE FUNCTION public.auth_rol()
RETURNS rol_usuario
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rol rol_usuario;
BEGIN
    SELECT rol INTO v_rol
    FROM public.usuarios
    WHERE id = auth.uid();

    RETURN v_rol;
END;
$$;

-- ============================================================
-- Habilitar RLS en todas las tablas
-- ============================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjuntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracciones_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: casos (tabla central)
-- ============================================================
-- SELECT: asesor ve sus casos + casos sin asignar; admin ve todos
CREATE POLICY casos_select_policy ON public.casos
    FOR SELECT
    USING (
        auth_rol() = 'administrador'
        OR asesor_id = auth.uid()
        OR asesor_id IS NULL
    );

-- INSERT: cualquier usuario autenticado con rol asesor o admin
CREATE POLICY casos_insert_policy ON public.casos
    FOR INSERT
    WITH CHECK (
        auth_rol() IN ('asesor', 'administrador')
    );

-- UPDATE: asesor modifica sus casos o toma sin asignar (solo si está pendiente); admin modifica todos
CREATE POLICY casos_update_policy ON public.casos
    FOR UPDATE
    USING (
        auth_rol() = 'administrador'
        OR asesor_id = auth.uid()
        OR (asesor_id IS NULL AND auth_rol() = 'asesor' AND estado = 'pendiente')
    );

-- DELETE: solo admin (soft delete policy)
CREATE POLICY casos_delete_policy ON public.casos
    FOR DELETE
    USING (
        auth_rol() = 'administrador'
    );

-- ============================================================
-- RLS: mensajes (hereda visibilidad del caso padre)
-- ============================================================
CREATE POLICY mensajes_select_policy ON public.mensajes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = mensajes.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR c.asesor_id IS NULL
                OR auth_rol() = 'administrador'
            )
        )
    );

CREATE POLICY mensajes_insert_policy ON public.mensajes
    FOR INSERT
    WITH CHECK (
        auth_rol() IN ('asesor', 'administrador')
    );

-- ============================================================
-- RLS: adjuntos (hereda visibilidad del caso padre)
-- ============================================================
CREATE POLICY adjuntos_select_policy ON public.adjuntos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = adjuntos.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR c.asesor_id IS NULL
                OR auth_rol() = 'administrador'
            )
        )
    );

CREATE POLICY adjuntos_insert_policy ON public.adjuntos
    FOR INSERT
    WITH CHECK (
        auth_rol() IN ('asesor', 'administrador')
    );

-- ============================================================
-- RLS: extracciones_ia (hereda visibilidad del caso padre)
-- ============================================================
CREATE POLICY extracciones_select_policy ON public.extracciones_ia
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = extracciones_ia.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR c.asesor_id IS NULL
                OR auth_rol() = 'administrador'
            )
        )
    );

-- ============================================================
-- RLS: seguimientos (hereda visibilidad del caso padre)
-- ============================================================
CREATE POLICY seguimientos_select_policy ON public.seguimientos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = seguimientos.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR c.asesor_id IS NULL
                OR auth_rol() = 'administrador'
            )
        )
    );

CREATE POLICY seguimientos_insert_policy ON public.seguimientos
    FOR INSERT
    WITH CHECK (
        auth_rol() IN ('asesor', 'administrador')
        AND EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = seguimientos.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR auth_rol() = 'administrador'
            )
        )
    );

-- ============================================================
-- RLS: turnos (hereda visibilidad del caso padre)
-- ============================================================
CREATE POLICY turnos_select_policy ON public.turnos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = turnos.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR c.asesor_id IS NULL
                OR auth_rol() = 'administrador'
            )
        )
    );

CREATE POLICY turnos_insert_policy ON public.turnos
    FOR INSERT
    WITH CHECK (
        auth_rol() IN ('asesor', 'administrador')
        AND EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = turnos.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR auth_rol() = 'administrador'
            )
        )
    );

-- ============================================================
-- RLS: llamadas (hereda visibilidad del caso padre)
-- ============================================================
CREATE POLICY llamadas_select_policy ON public.llamadas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = llamadas.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR c.asesor_id IS NULL
                OR auth_rol() = 'administrador'
            )
        )
    );

CREATE POLICY llamadas_insert_policy ON public.llamadas
    FOR INSERT
    WITH CHECK (
        auth_rol() IN ('asesor', 'administrador')
        AND EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = llamadas.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR auth_rol() = 'administrador'
            )
        )
    );

-- ============================================================
-- RLS: auditoria_eventos (hereda visibilidad del caso padre)
-- ============================================================
CREATE POLICY auditoria_select_policy ON public.auditoria_eventos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.casos c
            WHERE c.id = auditoria_eventos.caso_id
            AND (
                c.asesor_id = auth.uid()
                OR c.asesor_id IS NULL
                OR auth_rol() = 'administrador'
            )
        )
    );

-- ============================================================
-- RLS: usuarios (solo administradores pueden listar usuarios)
-- ============================================================
CREATE POLICY usuarios_select_policy ON public.usuarios
    FOR SELECT
    USING (
        -- Usuarios pueden verse a sí mismos
        id = auth.uid()
        -- Administradores ven todos
        OR auth_rol() = 'administrador'
    );

-- Solo administradores pueden modificar usuarios
CREATE POLICY usuarios_update_policy ON public.usuarios
    FOR UPDATE
    USING (auth_rol() = 'administrador');

-- ============================================================
-- RLS: configuracion (todos los usuarios autenticados pueden leer)
-- ============================================================
CREATE POLICY configuracion_select_policy ON public.configuracion
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY configuracion_update_policy ON public.configuracion
    FOR UPDATE
    USING (auth_rol() = 'administrador');

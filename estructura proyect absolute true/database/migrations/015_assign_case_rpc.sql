-- ============================================================
-- 015_assign_case_rpc.sql
-- RPC function: assign_case (atomic case assignment)
-- ============================================================
-- Depende de: 013_rls.sql (auth_rol function)
-- ============================================================
--
-- ESTRATEGIA DE CONCURRENCIA:
--
-- Esta función usa UPDATE como operación atómica única en una
-- sola sentencia SQL. PostgreSQL MVCC garantiza que solo una
-- transacción vea asesor_id IS NULL cuando realiza el UPDATE.
-- La fila se bloquea implícitamente durante la operación.
--
-- SECURITY INVOKER: la función respeta RLS del llamante.
-- Las condiciones WHERE son defensa en profundidad:
--   - asesor_id IS NULL (no asignado)
--   - estado = 'pendiente' (no cerrado/en_proceso)
--   - RLS policy: auth_rol() check + estado check
--
-- Retorna JSONB:
--   Éxito: { "ok": true,  "code": "SUCCESS",            "case_id": "uuid" }
--   Tomado: { "ok": false, "code": "CASE_ALREADY_TAKEN", "case_id": null }
--   No existe: { "ok": false, "code": "CASE_NOT_FOUND",   "case_id": null }
--
-- Uso desde TypeScript:
--   const { data, error } = await supabase.rpc("assign_case", {
--     p_case_id: "uuid-here"
--   });
--   // data = { ok: true, code: "SUCCESS", case_id: "..." }
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_case(p_case_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER  -- <-- CRÍTICO: respeta RLS del usuario autenticado
SET search_path = public
AS $$
DECLARE
    v_assigned_id UUID;
BEGIN
    -- UPDATE atómico: solo afecta si cumple TODAS las condiciones
    UPDATE public.casos
    SET
        asesor_id = auth.uid(),
        estado = 'en_proceso',
        updated_at = NOW()
    WHERE
        id = p_case_id
        AND asesor_id IS NULL
        AND estado = 'pendiente'
    RETURNING id INTO v_assigned_id;

    -- Si se asignó (FOUND true después del UPDATE), retornar éxito
    IF FOUND THEN
        RETURN jsonb_build_object('ok', true, 'code', 'SUCCESS', 'case_id', v_assigned_id::TEXT);
    END IF;

    -- No se asignó: determinar la razón exacta
    IF EXISTS (SELECT 1 FROM public.casos WHERE id = p_case_id) THEN
        -- El caso existe pero no cumple condiciones → ya asignado o no pendiente
        RETURN jsonb_build_object('ok', false, 'code', 'CASE_ALREADY_TAKEN', 'case_id', NULL::TEXT);
    ELSE
        -- El caso no existe
        RETURN jsonb_build_object('ok', false, 'code', 'CASE_NOT_FOUND', 'case_id', NULL::TEXT);
    END IF;
END;
$$;

-- ============================================================
-- Permisos: accesible para cualquier usuario autenticado
-- RLS dentro de la función valida el rol vía auth_rol()
-- ============================================================
REVOKE ALL ON FUNCTION public.assign_case(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_case(UUID) TO authenticated;

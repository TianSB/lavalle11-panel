-- ============================================================
-- 012_indices.sql
-- Todos los índices del sistema (excluyendo PK y UNIQUE ya creados)
-- ============================================================
-- Depende de: 001_enums.sql a 011_configuracion.sql
-- ============================================================

-- ============================================================
-- índices: usuarios
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios (rol);

-- ============================================================
-- índices: casos
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_casos_contact_phone ON public.casos (contact_phone);
CREATE INDEX IF NOT EXISTS idx_casos_estado ON public.casos (estado);
CREATE INDEX IF NOT EXISTS idx_casos_tipo_caso ON public.casos (tipo_caso);
CREATE INDEX IF NOT EXISTS idx_casos_asesor_id ON public.casos (asesor_id);
CREATE INDEX IF NOT EXISTS idx_casos_created_at ON public.casos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_casos_estado_prioridad ON public.casos (estado, prioridad);
CREATE INDEX IF NOT EXISTS idx_casos_phone_creacion ON public.casos (contact_phone, created_at DESC);

-- ============================================================
-- índices: mensajes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_mensajes_caso_id ON public.mensajes (caso_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_caso_timeline ON public.mensajes (caso_id, callbell_created_at ASC);
CREATE INDEX IF NOT EXISTS idx_mensajes_direction ON public.mensajes (direction);

-- ============================================================
-- índices: adjuntos
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_adjuntos_mensaje_id ON public.adjuntos (mensaje_id);
CREATE INDEX IF NOT EXISTS idx_adjuntos_caso_id ON public.adjuntos (caso_id);
CREATE INDEX IF NOT EXISTS idx_adjuntos_pendientes_ia ON public.adjuntos (processed_by_ia, created_at);

-- ============================================================
-- índices: extracciones_ia
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_extracciones_practica ON public.extracciones_ia (practica);
CREATE INDEX IF NOT EXISTS idx_extracciones_obra_social ON public.extracciones_ia (obra_social);
CREATE INDEX IF NOT EXISTS idx_extracciones_confianza ON public.extracciones_ia (confianza_global);
CREATE INDEX IF NOT EXISTS idx_extracciones_tipo_practica ON public.extracciones_ia (tipo_practica);

-- ============================================================
-- índices: seguimientos
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_seguimientos_caso_id ON public.seguimientos (caso_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_fecha ON public.seguimientos (fecha);
CREATE INDEX IF NOT EXISTS idx_seguimientos_asesor_id ON public.seguimientos (asesor_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_estado_fecha ON public.seguimientos (estado, fecha);

-- ============================================================
-- índices: turnos
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_turnos_caso_id ON public.turnos (caso_id);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON public.turnos (fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_sede_fecha ON public.turnos (sede, fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON public.turnos (estado);
CREATE INDEX IF NOT EXISTS idx_turnos_creado_por ON public.turnos (creado_por);

-- ============================================================
-- índices: llamadas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_llamadas_caso_id ON public.llamadas (caso_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_asesor_id ON public.llamadas (asesor_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_initiated_at ON public.llamadas (initiated_at);

-- ============================================================
-- índices: auditoria_eventos
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_auditoria_caso_id ON public.auditoria_eventos (caso_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_asesor_id ON public.auditoria_eventos (asesor_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON public.auditoria_eventos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON public.auditoria_eventos (accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_caso_cronologico ON public.auditoria_eventos (caso_id, created_at ASC);

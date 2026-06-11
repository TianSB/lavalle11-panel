-- ============================================================
-- 008_turnos.sql
-- Tabla: turnos (turnos asignados a pacientes)
-- Soporta historial de reprogramaciones (1:N con casos)
-- ============================================================
-- Depende de: 001_enums.sql, 002_usuarios.sql (FK), 003_casos.sql (FK)
-- ============================================================

CREATE TABLE public.turnos (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id             VARCHAR(10)     NOT NULL REFERENCES public.casos(id) ON DELETE RESTRICT,
    creado_por          UUID            NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    sede                sede_turno      NOT NULL,
    fecha               DATE            NOT NULL,
    hora                TIME            NOT NULL,
    estado              estado_turno    NOT NULL DEFAULT 'confirmado',
    instrucciones       TEXT[],
    mensaje_enviado     TEXT,
    confirmado_at       TIMESTAMPTZ,
    cancelado_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- La fecha no puede ser anterior a hoy
    CONSTRAINT chk_turnos_fecha CHECK (fecha >= CURRENT_DATE),

    -- La hora debe estar dentro del horario laboral (07:00–20:00)
    CONSTRAINT chk_turnos_hora CHECK (hora >= '07:00'::TIME AND hora <= '20:00'::TIME)
);

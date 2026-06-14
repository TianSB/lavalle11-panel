-- ============================================================
-- 002_usuarios.sql
-- Tabla: usuarios
-- Vinculada 1:1 con auth.users de Supabase
-- ============================================================
-- Depende de: 001_enums.sql (rol_usuario)
-- ============================================================

-- Función: sincronizar usuario desde auth.users
CREATE OR REPLACE FUNCTION public.sync_usuario_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.usuarios (id, nombre, email, rol, activo)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'nombre', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(
            (NEW.raw_user_meta_data ->> 'rol')::rol_usuario,
            'asesor'::rol_usuario
        ),
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        email = EXCLUDED.email,
        activo = TRUE,
        updated_at = NOW();
    -- NOTA: rol NO se actualiza aquí. public.usuarios.rol es la única fuente de verdad.
    --       El rol se setea solo al INSERTAR (nuevo usuario). Nunca se sobrescribe en UPDATE.
    RETURN NEW;
END;
$$;

-- Trigger: cuando se crea un usuario en auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_usuario_from_auth();

-- Trigger: cuando se actualiza un usuario en auth.users (R-01 fix)
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_usuario_from_auth();

-- Tabla: usuarios
CREATE TABLE public.usuarios (
    id              UUID            PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    rol             rol_usuario     NOT NULL DEFAULT 'asesor',
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    avatar_url      TEXT,
    ultimo_acceso   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- UNIQUE en email
CREATE UNIQUE INDEX idx_usuarios_email ON public.usuarios (email);

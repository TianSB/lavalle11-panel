import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { Usuario } from "../types";
import { setRbacRole } from "../rbac/can";

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserProfile(userId: string): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const profile: Usuario = {
    id: data.id as string,
    nombre: data.nombre as string,
    email: data.email as string,
    rol: data.rol as Usuario["rol"],
    activo: data.activo as boolean,
  };

  console.log("AUTH ROLE FROM DB:", profile.rol);

  // Sync RBAC module-level store with the DB source of truth
  setRbacRole(profile.rol as Usuario["rol"]);

  return profile;
}

/**
 * Shared handler: hydrate user from Supabase Auth, then fetch profile from DB.
 * Always calls supabase.auth.getUser() — never trusts session.user directly.
 * public.usuarios.rol is the SINGLE source of truth for roles.
 */
async function handleAuthEvent({
  setUser,
  setError,
}: {
  setUser: (u: Usuario | null) => void;
  setError: (e: string | null) => void;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setUser(null);
    setRbacRole(null);
    return;
  }

  console.log("AUTH USER (hydrated):", user.id);

  const profile = await fetchUserProfile(user.id);
  if (profile) {
    // Validate: public.usuarios.rol is ALWAYS the source of truth
    const metadataRol = user.user_metadata?.rol;
    if (metadataRol && metadataRol !== profile.rol) {
      console.warn(
        "ROLE SOURCE CONFLICT — usando public.usuarios como fuente única. Metadata ignorada.",
        { metadata: metadataRol, db: profile.rol },
      );
    }
    setUser(profile);
  } else {
    setUser(null);
    setError(
      "Usuario no encontrado en la base de datos. Contactá al administrador.",
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydratingRef = useRef(true);

  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        hydratingRef.current = false;
        setIsLoading(false);
        return;
      }

      // Verify token is still valid server-side
      const {
        data: { user: verifiedUser },
        error: verifyError,
      } = await supabase.auth.getUser();

      if (verifyError || !verifiedUser) {
        await supabase.auth.signOut();
        setUser(null);
        hydratingRef.current = false;
        setIsLoading(false);
        return;
      }

      console.log("AUTH USER (hydrated):", verifiedUser.id);

      // Use verifiedUser.id from server — not session.user.id
      const profile = await fetchUserProfile(verifiedUser.id);
      if (profile) {
        setUser(profile);
      }

      hydratingRef.current = false;
      setIsLoading(false);
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, _session) => {
      console.log("AUTH EVENT:", event);

      // INITIAL_SESSION is always handled by initSession()
      if (event === "INITIAL_SESSION") return;

      // Skip events fired before initSession completes
      if (hydratingRef.current) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setRbacRole(null);
        setIsLoading(false);
        return;
      }

      // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED → hydrate from server
      await handleAuthEvent({ setUser, setError });
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Credenciales inválidas. Verificá tu email y contraseña."
            : authError.message === "Email not confirmed"
              ? "Email no confirmado. Revisá tu bandeja de entrada."
              : authError.message,
        );
        setIsLoading(false);
        return false;
      }

      // Profile is fetched by onAuthStateChange (SIGNED_IN) — single source of truth
      // Avoid race condition: login() does NOT call fetchUserProfile()

      if (!data.user) {
        setError("Error al iniciar sesión. Intentá de nuevo.");
        setIsLoading(false);
        return false;
      }

      return true;
    },
    [],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRbacRole(null);
    setError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setUser(null);
      return;
    }

    const profile = await fetchUserProfile(currentUser.id);
    if (profile) {
      setUser(profile);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isAdmin: user?.rol === "administrador",
        login,
        logout,
        refreshProfile,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Falta configurar Supabase. Creá un archivo .env.local con:\n" +
      "VITE_SUPABASE_URL=https://tu-proyecto.supabase.co\n" +
      "VITE_SUPABASE_ANON_KEY=tu-anon-key",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

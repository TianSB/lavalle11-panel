// ============================================================
// CasoServiceContext.tsx
// Inyección de dependencias vía React Context para CasoService.
//
// Por qué NO singleton global:
//   - testeable: cada test puede montar su propio provider con mock
//   - multi-tenant: futuro — cada tenant/clínica con su servicio
//   - sin estado oculto: el servicio es explícito en el árbol React
//   - hot-reload friendly: React maneja el ciclo de vida
//
// Uso:
//   <CasoServiceProvider service={supabaseCasoService}>
//     <App />
//   </CasoServiceProvider>
//
//   const service = useCasoService();
//   const casos = await service.getCasos();
// ============================================================

import { createContext, useContext, type ReactNode } from "react";
import type { CasoService } from "../services/mockService";
import { supabaseCasoService } from "../services/supabaseService";

const CasoServiceContext = createContext<CasoService>(supabaseCasoService);

interface CasoServiceProviderProps {
  /** Servicio a inyectar. Por defecto: SupabaseCasoService. */
  service?: CasoService;
  children: ReactNode;
}

/**
 * Provider que inyecta una implementación de CasoService en el árbol React.
 *
 * Multi-tenant: cada tenant puede tener su propio provider con un servicio
 * configurado (ej:不同的 base de datos, diferentes crews de IA).
 *
 * @example
 * ```tsx
 * <CasoServiceProvider service={supabaseCasoService}>
 *   <App />
 * </CasoServiceProvider>
 * ```
 */
export function CasoServiceProvider({
  service = supabaseCasoService,
  children,
}: CasoServiceProviderProps) {
  return (
    <CasoServiceContext.Provider value={service}>
      {children}
    </CasoServiceContext.Provider>
  );
}

/**
 * Hook para acceder al CasoService activo desde cualquier componente.
 *
 * @throws Error si se usa fuera de un CasoServiceProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const service = useCasoService();
 *   const [casos, setCasos] = useState<Caso[]>([]);
 *
 *   useEffect(() => {
 *     service.getCasos().then(setCasos);
 *   }, [service]);
 * }
 * ```
 */
export function useCasoService(): CasoService {
  const ctx = useContext(CasoServiceContext);
  if (!ctx) {
    throw new Error(
      "useCasoService debe usarse dentro de un CasoServiceProvider",
    );
  }
  return ctx;
}

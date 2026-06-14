// ============================================================
// CaseUIStoreContext.tsx
// React Context wrapper para el store global de UI de casos.
//
// Separación de concerns:
//   - caseUIStore.ts: lógica pura (reducer, tipos, hook base)
//   - CaseUIStoreContext.tsx: inyección en el árbol React
//
// Uso:
//   <CaseUIStoreProvider>
//     <App />
//   </CaseUIStoreProvider>
//
//   const { getCaseUIState, setCaseUIState, reconcileCaseState } =
//     useCaseUIStoreContext();
// ============================================================

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  useCaseUIStore,
  type UseCaseUIStoreReturn,
} from "../stores/caseUIStore";

const CaseUIStoreContext = createContext<UseCaseUIStoreReturn | null>(null);

interface CaseUIStoreProviderProps {
  children: ReactNode;
}

/**
 * Provider del store global de UI para casos.
 * Debe estar dentro de CasoServiceProvider (usa los mismos hooks).
 */
export function CaseUIStoreProvider({
  children,
}: CaseUIStoreProviderProps) {
  const store = useCaseUIStore();

  return (
    <CaseUIStoreContext.Provider value={store}>
      {children}
    </CaseUIStoreContext.Provider>
  );
}

/**
 * Hook para acceder al store global de UI de casos.
 *
 * @throws Error si se usa fuera de un CaseUIStoreProvider
 */
export function useCaseUIStoreContext(): UseCaseUIStoreReturn {
  const ctx = useContext(CaseUIStoreContext);
  if (!ctx) {
    throw new Error(
      "useCaseUIStoreContext debe usarse dentro de un CaseUIStoreProvider",
    );
  }
  return ctx;
}

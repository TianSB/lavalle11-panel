import type { Caso } from "../../types";
import type { AssignCaseResult } from "../../services/errors";
import { CaseCard } from "./CaseCard";

interface CaseGridProps {
  casos: Caso[];
  isLoading?: boolean;
  onCaseClick: (caso: Caso) => void;
  /**
   * Callback de asignación. Debe retornar AssignCaseResult.
   * La card lee el estado UI del store global, no local.
   * Lanzar throw para errores reales (network, auth).
   */
  onAsignar?: (casoId: string) => Promise<AssignCaseResult>;
  /** Callback para refrescar la lista de casos desde el servidor */
  onRefresh?: () => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded bg-gray-200" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="h-3 w-2/3 rounded bg-gray-200" />
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-gray-200" />
        <div className="h-5 w-20 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="text-base font-medium text-gray-500">No hay casos para mostrar</h3>
      <p className="mt-1 text-sm text-gray-400">Todos los casos están al día. ¡Buen trabajo!</p>
    </div>
  );
}

export function CaseGrid({ casos, isLoading = false, onCaseClick, onAsignar, onRefresh }: CaseGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  if (casos.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {casos.map((caso) => (
        <CaseCard key={caso.id} caso={caso} onClick={onCaseClick} onAsignar={onAsignar} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

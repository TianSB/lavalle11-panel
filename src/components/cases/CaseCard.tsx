import { useEffect, useRef, useState } from "react";
import type { Caso } from "../../types";
import type { AssignCaseResult } from "../../services/errors";
import { Badge, FlagBadge, PrioridadIndicator } from "../ui/Badge";
import { useCaseUIStoreContext } from "../../context/CaseUIStoreContext";
import type { CaseUIStatus } from "../../stores/caseUIStore";

interface CaseCardProps {
  caso: Caso;
  onClick: (caso: Caso) => void;
  /**
   * Callback para asignar el caso. Debe retornar AssignCaseResult.
   * El estado UI lo maneja el store global — este callback solo llama al hook.
   */
  onAsignar?: (casoId: string) => Promise<AssignCaseResult>;
  /** Callback para refrescar la lista de casos desde el servidor */
  onRefresh?: () => void;
}

const estadoStyles: Record<string, { label: string; color: "blue" | "orange" | "yellow" | "green" }> = {
  pendiente: { label: "Pendiente", color: "blue" },
  en_proceso: { label: "En proceso", color: "orange" },
  esperando_respuesta: { label: "Esperando", color: "yellow" },
  cerrado: { label: "Cerrado", color: "green" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const isAssignable = (c: Caso) => c.asesor_id === null && c.estado === "pendiente";

// ============================================================
// Card overlay — feedback visual durante asignación
// Lee del store global, no de estado local.
// ============================================================
function AssignOverlay({ status }: { status: CaseUIStatus | undefined }) {
  if (!status) return null;

  const base = "absolute inset-0 z-20 flex items-center justify-center rounded-xl transition-all duration-300";

  switch (status.status) {
    case "claiming":
      return (
        <div className={`${base} bg-blue-500/10 backdrop-blur-[1px]`}>
          <div className="flex flex-col items-center gap-2 rounded-lg bg-white/90 px-4 py-3 shadow-lg">
            <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium text-blue-700">Reservando caso...</span>
          </div>
        </div>
      );

    case "claimed_by_me":
      return (
        <div className={`${base} bg-emerald-500/10`}>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white/90 px-4 py-3 shadow-lg">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-emerald-700">Caso asignado</span>
          </div>
        </div>
      );

    case "claimed_by_other":
      return (
        <div className={`${base} bg-amber-500/10`}>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white/90 px-4 py-3 shadow-lg">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-amber-700">Otro asesor tomó este caso</span>
          </div>
        </div>
      );

    case "failed":
      return (
        <div className={`${base} bg-red-500/10`}>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white/90 px-4 py-3 shadow-lg">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-red-700">{status.error}</span>
          </div>
        </div>
      );
  }
}

// ============================================================
// AnalizarButton — botón inline para casos sin análisis IA
// ============================================================

function AnalizarButton({ casoId, onRefresh }: { casoId: string; onRefresh?: () => void }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setState("loading");
    try {
      const res = await fetch(`/api/casos/${casoId}/re-analizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (data.ok) {
        setState("idle");
        onRefresh?.();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  if (state === "loading") {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-400 cursor-wait"
      >
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Analizando...
      </button>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-all hover:bg-red-100 hover:border-red-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Reintentar
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition-all hover:bg-purple-100 hover:border-purple-300"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      Analizar con IA
    </button>
  );
}

// ============================================================
// CaseCard — component
// El estado UI viene del store global (useCaseUIStoreContext)
// NO de estado local — consistente entre vistas y preparado para Realtime.
// ============================================================
export function CaseCard({ caso, onClick, onAsignar, onRefresh }: CaseCardProps) {
  const { getCaseUIState, clearCaseUIState } = useCaseUIStoreContext();
  const uiState = getCaseUIState(caso.id);
  const autoResetRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-reset: limpiar store después de claimed_by_me o failed (3s)
  useEffect(() => {
    if (uiState && (uiState.status.status === "claimed_by_me" || uiState.status.status === "failed")) {
      autoResetRef.current = setTimeout(() => {
        clearCaseUIState(caso.id);
      }, 3000);
    }
    return () => {
      if (autoResetRef.current) clearTimeout(autoResetRef.current);
    };
  }, [uiState?.status.status, caso.id, clearCaseUIState]);

  const est = estadoStyles[caso.estado] ?? { label: caso.estado, color: "gray" as const };
  const hasFlags = caso.extraccion_ia.flags.length > 0;
  const maxFlagsToShow = 3;
  const visibleFlags = caso.extraccion_ia.flags.slice(0, maxFlagsToShow);
  const remainingFlags = caso.extraccion_ia.flags.length - maxFlagsToShow;

  const handleAssign = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (uiState || !onAsignar) return; // Ya tiene estado activo

    try {
      await onAsignar(caso.id);
    } catch {
      // Error ya manejado por el store vía useAsignarCaso
    }
  };

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-150 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Priority bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1">
        <PrioridadIndicator prioridad={caso.prioridad} />
      </div>

      <button
        onClick={() => onClick(caso)}
        className="flex w-full flex-col gap-3 text-left"
      >
        {/* Top row: Type + Status + Time */}
        <div className="flex items-center justify-between pl-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 font-mono">
              {caso.id}
            </span>
            {/* Message count badge */}
            {caso.mensajes_count > 1 && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600"
                title={`${caso.mensajes_count} mensajes en la conversación`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {caso.mensajes_count}
              </span>
            )}
            <Badge color="purple" size="sm">{`Tipo ${caso.tipo_caso}`}</Badge>
            {caso.extraccion_ia.tipo_practica !== "otro" && (
              <span className="hidden sm:inline text-xs text-gray-500 capitalize">
                {caso.extraccion_ia.tipo_practica.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <Badge color={est.color}>{est.label}</Badge>
        </div>

        {/* Main info */}
        <div className="pl-3">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{caso.contact_name}</h3>
          <p className="text-sm text-gray-600 truncate mt-0.5">
            {caso.extraccion_ia.practica}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {caso.extraccion_ia.obra_social && <span>{caso.extraccion_ia.obra_social}</span>}
            {caso.asesor_nombre && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {caso.asesor_nombre}
              </span>
            )}
            <span>{formatDate(caso.created_at)}</span>
          </div>
        </div>

        {/* Flags */}
        {hasFlags && (
          <div className="flex flex-wrap items-center gap-1.5 pl-3">
            {visibleFlags.map((flag) => (
              <FlagBadge key={flag} flag={flag} />
            ))}
            {remainingFlags > 0 && (
              <span className="text-xs text-gray-400">+{remainingFlags} más</span>
            )}
          </div>
        )}

        {/* Confidence bar */}
        <div className="pl-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Confianza</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  caso.extraccion_ia.confianza_global >= 0.9
                    ? "bg-emerald-500"
                    : caso.extraccion_ia.confianza_global >= 0.7
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${caso.extraccion_ia.confianza_global * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500">{Math.round(caso.extraccion_ia.confianza_global * 100)}%</span>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Action buttons — mostrar solo si no hay overlay activo */}
      {!uiState && (
        <div className="flex flex-wrap items-center gap-2 px-0 pt-1">
          {/* Tomar caso — solo para casos sin asignar y pendientes */}
          {isAssignable(caso) && onAsignar && (
            <button
              onClick={handleAssign}
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-300"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tomar caso
              </span>
            </button>
          )}

          {/* Analizar con IA — visible cuando modelo_ia es 'pendiente' (sin analizar) */}
          {caso.extraccion_ia.modelo_ia === 'pendiente' && (
            <AnalizarButton casoId={caso.id} onRefresh={onRefresh} />
          )}
        </div>
      )}

      {/* Overlay para estados de asignación — desde store global */}
      <AssignOverlay status={uiState?.status} />
    </div>
  );
}

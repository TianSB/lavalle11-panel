import type { Caso } from "../../types";
import { Badge, FlagBadge, PrioridadIndicator } from "../ui/Badge";

interface CaseCardProps {
  caso: Caso;
  onClick: (caso: Caso) => void;
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

export function CaseCard({ caso, onClick }: CaseCardProps) {
  const est = estadoStyles[caso.estado] ?? { label: caso.estado, color: "gray" as const };
  const hasFlags = caso.extraccion_ia.flags.length > 0;
  const maxFlagsToShow = 3;
  const visibleFlags = caso.extraccion_ia.flags.slice(0, maxFlagsToShow);
  const remainingFlags = caso.extraccion_ia.flags.length - maxFlagsToShow;

  return (
    <button
      onClick={() => onClick(caso)}
      className="group relative flex w-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all duration-150 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Priority bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1">
        <PrioridadIndicator prioridad={caso.prioridad} />
      </div>

      {/* Top row: Type + Status + Time */}
      <div className="flex items-center justify-between pl-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 font-mono">
            {caso.id}
          </span>
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
  );
}

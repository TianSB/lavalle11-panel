import type { ExtraccionIA } from "../../types";

interface ResumenIAProps {
  extraccion: ExtraccionIA;
}

export function ResumenIA({ extraccion }: ResumenIAProps) {
  const confidenceColor =
    extraccion.confianza_global >= 0.9
      ? "bg-emerald-100 text-emerald-700"
      : extraccion.confianza_global >= 0.7
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Resumen IA
        </span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColor}`}>
          {Math.round(extraccion.confianza_global * 100)}% confianza
        </span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{extraccion.resumen}</p>
    </div>
  );
}

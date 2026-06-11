import { useState } from "react";
import type { EstadoCaso, Prioridad, TipoCaso } from "../../types";
import { TIPOS_CASO } from "../../constants";

interface FilterBarProps {
  onSearchChange: (query: string) => void;
  onEstadoChange: (estado: EstadoCaso | "todas") => void;
  onPrioridadChange: (prioridad: Prioridad | "todas") => void;
  onTipoChange: (tipo: TipoCaso | "todas") => void;
  activeFilters: {
    estado: EstadoCaso | "todas";
    prioridad: Prioridad | "todas";
    tipo: TipoCaso | "todas";
  };
  searchQuery: string;
}

const estadoOptions: { value: EstadoCaso | "todas"; label: string }[] = [
  { value: "todas", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "esperando_respuesta", label: "Esperando respuesta" },
  { value: "cerrado", label: "Cerrado" },
];

const prioridadOptions: { value: Prioridad | "todas"; label: string }[] = [
  { value: "todas", label: "Todas las prioridades" },
  { value: "urgente", label: "Urgente" },
  { value: "normal", label: "Normal" },
  { value: "bajo", label: "Baja" },
];

export function FilterBar({
  onSearchChange,
  onEstadoChange,
  onPrioridadChange,
  onTipoChange,
  activeFilters,
  searchQuery,
}: FilterBarProps) {
  const [showTipoDropdown, setShowTipoDropdown] = useState(false);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar por paciente, teléfono o ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Estado filter */}
      <select
        value={activeFilters.estado}
        onChange={(e) => onEstadoChange(e.target.value as EstadoCaso | "todas")}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {estadoOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Prioridad filter */}
      <select
        value={activeFilters.prioridad}
        onChange={(e) => onPrioridadChange(e.target.value as Prioridad | "todas")}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {prioridadOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Tipo filter */}
      <div className="relative">
        <button
          onClick={() => setShowTipoDropdown(!showTipoDropdown)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {activeFilters.tipo === "todas" ? "Todos los tipos" : `Tipo ${activeFilters.tipo}`}
          <svg className={`h-4 w-4 transition-transform ${showTipoDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showTipoDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowTipoDropdown(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              <button
                onClick={() => { onTipoChange("todas"); setShowTipoDropdown(false); }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                  activeFilters.tipo === "todas" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                }`}
              >
                Todos los tipos
              </button>
              {(Object.keys(TIPOS_CASO) as TipoCaso[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => { onTipoChange(tipo); setShowTipoDropdown(false); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                    activeFilters.tipo === tipo ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                  }`}
                >
                  <span className="font-mono">Tipo {tipo}</span> — {TIPOS_CASO[tipo]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Active filters summary */}
      {(activeFilters.estado !== "todas" || activeFilters.prioridad !== "todas" || activeFilters.tipo !== "todas") && (
        <button
          onClick={() => {
            onEstadoChange("todas");
            onPrioridadChange("todas");
            onTipoChange("todas");
            onSearchChange("");
          }}
          className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

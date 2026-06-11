import type { Instruccion } from "../../types";

interface ListaInstruccionesProps {
  selected: Instruccion[];
  onToggle: (inst: Instruccion) => void;
}

export const INSTRUCCION_LABELS: Record<Instruccion, string> = {
  ayuno_6hs: "Ayuno 6hs",
  ayuno_4hs: "Ayuno 4hs",
  traer_orden: "Traer orden médica",
  traer_estudios_previos: "Traer estudios previos",
  aines: "Suspender AINES 48hs",
  token_ioma: "Token IOMA",
  con_acompaniante: "Con acompañante",
  sin_acompaniante: "Sin acompañante",
};

export function ListaInstrucciones({ selected, onToggle }: ListaInstruccionesProps) {
  const entries = Object.entries(INSTRUCCION_LABELS) as [Instruccion, string][];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Instrucciones para el paciente
      </p>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([key, label]) => {
          const isSelected = selected.includes(key);
          return (
            <label
              key={key}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer ${
                isSelected
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(key)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={isSelected ? "text-blue-700 font-medium" : "text-gray-600"}>
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

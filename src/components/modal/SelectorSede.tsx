import type { Sede } from "../../types";

interface SelectorSedeProps {
  selected: Sede;
  onChange: (sede: Sede) => void;
}

const SEDES: { value: Sede; label: string; subtitle: string }[] = [
  { value: "lavalle11", label: "Lavalle 11", subtitle: "Diagnóstico por imágenes" },
  { value: "chiclana", label: "Chiclana", subtitle: "Medicina Nuclear" },
];

export function SelectorSede({ selected, onChange }: SelectorSedeProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Sede</p>
      <div className="flex gap-3">
        {SEDES.map((sede) => (
          <button
            key={sede.value}
            onClick={() => onChange(sede.value)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg border p-3 transition-all cursor-pointer ${
              selected === sede.value
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className={`text-sm font-medium ${selected === sede.value ? "text-blue-700" : "text-gray-700"}`}>
              {sede.label}
            </span>
            <span className={`text-xs ${selected === sede.value ? "text-blue-500" : "text-gray-400"}`}>
              {sede.subtitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

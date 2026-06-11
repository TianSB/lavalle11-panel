import { useMemo, useState } from "react";
import { getSuggestedDates } from "../../utils/dates";

interface SelectorFechaProps {
  selectedDate: string;
  onChange: (date: string) => void;
}

export function SelectorFecha({ selectedDate, onChange }: SelectorFechaProps) {
  const [showCustom, setShowCustom] = useState(false);
  const suggestedDates = useMemo(() => getSuggestedDates(), []);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Fecha del turno</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {suggestedDates.map((s) => (
          <button
            key={s.date}
            onClick={() => {
              onChange(s.date);
              setShowCustom(false);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors cursor-pointer ${
              selectedDate === s.date && !showCustom
                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(true)}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors cursor-pointer ${
            showCustom
              ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          Otra fecha
        </button>
      </div>
      {showCustom && (
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  );
}

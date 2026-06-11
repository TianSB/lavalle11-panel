interface SelectorHoraProps {
  selectedTime: string;
  onChange: (time: string) => void;
}

const HORARIOS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
];

export function SelectorHora({ selectedTime, onChange }: SelectorHoraProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Horario</p>
      <div className="flex flex-wrap gap-2">
        {HORARIOS.map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-mono transition-colors cursor-pointer ${
              selectedTime === t
                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

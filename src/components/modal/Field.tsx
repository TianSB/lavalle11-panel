interface FieldProps {
  label: string;
  value: string | null;
  highlight?: boolean;
}

export function Field({ label, value, highlight = false }: FieldProps) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`text-sm ${
          highlight
            ? "font-semibold text-gray-900"
            : value
              ? "text-gray-700"
              : "text-gray-300 italic"
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

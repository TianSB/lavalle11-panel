interface FormSeguimientoProps {
  fecha: string;
  nota: string;
  onFechaChange: (fecha: string) => void;
  onNotaChange: (nota: string) => void;
}

export function FormSeguimiento({
  fecha,
  nota,
  onFechaChange,
  onNotaChange,
}: FormSeguimientoProps) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Seguimiento programado
      </p>
      <div className="flex gap-3">
        <input
          type="date"
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Fecha"
        />
        <input
          type="text"
          value={nota}
          onChange={(e) => onNotaChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Nota de seguimiento (opcional)"
        />
      </div>
    </div>
  );
}

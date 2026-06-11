interface StatusBarProps {
  total: number;
  pendientes: number;
  misCasos: number;
}

export function StatusBar({ total, pendientes, misCasos }: StatusBarProps) {
  return (
    <div className="flex items-center gap-6 border-b border-gray-200 bg-white px-6 py-3">
      <StatusItem label="Total" value={total} color="gray" />
      <StatusItem label="Pendientes" value={pendientes} color="orange" />
      <StatusItem label="Mis casos" value={misCasos} color="blue" />
    </div>
  );
}

function StatusItem({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gray" | "orange" | "blue";
}) {
  const dotColor =
    color === "orange"
      ? "bg-orange-400"
      : color === "blue"
        ? "bg-blue-500"
        : "bg-gray-400";
  const textColor =
    color === "orange"
      ? "text-orange-700"
      : color === "blue"
        ? "text-blue-700"
        : "text-gray-700";

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-sm text-gray-500">{label}:</span>
      <span className={`text-sm font-semibold ${textColor}`}>{value}</span>
    </div>
  );
}

import type { Flag, Prioridad } from "../../types";

type BadgeColor = "red" | "orange" | "green" | "blue" | "purple" | "yellow" | "gray" | "sky";

const colorMap: Record<BadgeColor, string> = {
  red: "bg-red-100 text-red-800 border-red-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  green: "bg-green-100 text-green-800 border-green-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  gray: "bg-gray-100 text-gray-700 border-gray-200",
  sky: "bg-sky-100 text-sky-800 border-sky-200",
};

const flagColorMap: Record<Flag, BadgeColor> = {
  ayuno: "sky",
  aines: "sky",
  orden_incompleta: "yellow",
  baja_confianza: "yellow",
  token_ioma: "blue",
  chiclana: "purple",
  copago: "orange",
  requiere_llamada: "orange",
  orden_ilegible: "red",
  error_ia: "red",
};

const flagLabelMap: Record<Flag, string> = {
  ayuno: "Ayuno",
  aines: "AINES",
  orden_incompleta: "Orden incompleta",
  baja_confianza: "Baja confianza",
  token_ioma: "Token IOMA",
  chiclana: "Chiclana",
  copago: "Copago",
  requiere_llamada: "Requiere llamada",
  orden_ilegible: "Orden ilegible",
  error_ia: "Error IA",
};

interface BadgeProps {
  children: string;
  color?: BadgeColor;
  size?: "sm" | "md";
}

export function Badge({ children, color = "gray", size = "sm" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${
        size === "sm" ? "text-xs" : "text-sm"
      } ${colorMap[color]}`}
    >
      {children}
    </span>
  );
}

export function FlagBadge({ flag }: { flag: Flag }) {
  return <Badge color={flagColorMap[flag]}>{flagLabelMap[flag]}</Badge>;
}

export function PrioridadIndicator({ prioridad }: { prioridad: Prioridad }) {
  return (
    <span
      className={`inline-block h-full min-h-4 w-1.5 rounded-full ${
        prioridad === "urgente"
          ? "bg-red-500"
          : prioridad === "normal"
            ? "bg-orange-400"
            : "bg-green-500"
      }`}
      title={prioridad === "urgente" ? "Urgente" : prioridad === "normal" ? "Normal" : "Bajo"}
    />
  );
}

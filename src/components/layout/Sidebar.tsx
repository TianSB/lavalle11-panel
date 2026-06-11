import { TIPOS_CASO } from "../../constants";

type VistaActiva = "cola" | "bandeja" | "seguimientos" | "metricas";

interface SidebarProps {
  vistaActiva: VistaActiva;
  onVistaChange: (vista: VistaActiva) => void;
  onFilterByTipo?: (tipo: string) => void;
  esAdmin: boolean;
  totalCasos: number;
  misCasos: number;
  seguimientosPendientes: number;
}

export function Sidebar({
  vistaActiva,
  onVistaChange,
  onFilterByTipo,
  esAdmin,
  totalCasos,
  misCasos,
  seguimientosPendientes,
}: SidebarProps) {
  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
      <nav className="flex-1 space-y-1 px-3 py-4">
        <SidebarItem
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          }
          label="Cola General"
          active={vistaActiva === "cola"}
          onClick={() => onVistaChange("cola")}
          badge={totalCasos}
        />
        <SidebarItem
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          label="Mi Bandeja"
          active={vistaActiva === "bandeja"}
          onClick={() => onVistaChange("bandeja")}
          badge={misCasos}
        />

        <div className="my-3 border-t border-gray-100" />

        <p className="px-3 text-xs font-medium uppercase tracking-wider text-gray-400">Filtros</p>

        <div className="mt-2 space-y-0.5">
          {Object.entries(TIPOS_CASO).map(([tipo, nombre]) => (
            <SidebarItem
              key={tipo}
              label={`Tipo ${tipo} — ${nombre}`}
              compact
              onClick={onFilterByTipo ? () => onFilterByTipo(tipo) : undefined}
            />
          ))}
        </div>

        <div className="my-3 border-t border-gray-100" />

        <SidebarItem
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          label="Seguimientos"
          active={vistaActiva === "seguimientos"}
          onClick={() => onVistaChange("seguimientos")}
          badge={seguimientosPendientes}
          badgeColor="red"
        />

        {esAdmin && (
          <>
            <div className="my-3 border-t border-gray-100" />
            <SidebarItem
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              label="Dashboard"
              active={vistaActiva === "metricas"}
              onClick={() => onVistaChange("metricas")}
            />
          </>
        )}
      </nav>

      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400">v1.0.0</p>
      </div>
    </aside>
  );
}

interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
  badgeColor?: "blue" | "red";
  compact?: boolean;
}

function SidebarItem({ icon, label, active, onClick, badge, badgeColor = "blue", compact }: SidebarItemProps) {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors cursor-pointer ${
          onClick ? "hover:bg-gray-50 hover:text-gray-700 text-gray-500" : "text-gray-400"
        }`}
      >
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={`ml-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
            badgeColor === "red"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

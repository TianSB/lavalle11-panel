import { type ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { can } from "../../rbac";

type VistaActiva = "cola" | "bandeja" | "seguimientos" | "metricas";

interface AppLayoutProps {
  children: ReactNode;
  asesorNombre: string;
  vistaActiva: VistaActiva;
  onVistaChange: (vista: VistaActiva) => void;
  onFilterByTipo?: (tipo: string) => void;
  onLogout: () => void;
  totalCasos: number;
  pendientes: number;
  misCasos: number;
  seguimientosPendientes: number;
}

export function AppLayout({
  children,
  asesorNombre,
  vistaActiva,
  onVistaChange,
  onFilterByTipo,
  onLogout,
  totalCasos,
  pendientes,
  misCasos,
  seguimientosPendientes,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header
        asesorNombre={asesorNombre}
        onLogout={onLogout}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          vistaActiva={vistaActiva}
          onVistaChange={onVistaChange}
          onFilterByTipo={onFilterByTipo}
          esAdmin={can("metrics.read")}
          totalCasos={totalCasos}
          misCasos={misCasos}
          seguimientosPendientes={seguimientosPendientes}
        />
        <main className="flex flex-1 flex-col overflow-auto">
          <StatusBar total={totalCasos} pendientes={pendientes} misCasos={misCasos} />
          <div className="flex-1 p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

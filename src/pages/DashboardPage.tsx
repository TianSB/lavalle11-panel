import { useState, useMemo } from "react";
import type { Caso, EstadoCaso, Prioridad, TipoCaso } from "../types";
import { MOCK_CASOS } from "../data/mockCases";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { FilterBar } from "../components/cases/FilterBar";
import { CaseGrid } from "../components/cases/CaseGrid";
import { CaseModal } from "../components/modal/CaseModal";
import { MetricsBoard } from "../components/metrics/MetricsBoard";

type VistaActiva = "cola" | "bandeja" | "seguimientos" | "metricas";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>("cola");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoCaso | "todas">("todas");
  const [filtroPrioridad, setFiltroPrioridad] = useState<Prioridad | "todas">("todas");
  const [filtroTipo, setFiltroTipo] = useState<TipoCaso | "todas">("todas");
  const [selectedCaso, setSelectedCaso] = useState<Caso | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  const casosFiltrados = useMemo(() => {
    let casos = [...MOCK_CASOS];

    // Filter by view
    if (vistaActiva === "bandeja") {
      casos = casos.filter((c) => c.asesor_id === user.id);
    } else if (vistaActiva === "seguimientos") {
      casos = casos.filter((c) => c.seguimiento_fecha !== null && c.estado !== "cerrado");
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      casos = casos.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.contact_name.toLowerCase().includes(q) ||
          c.contact_phone.includes(q) ||
          c.extraccion_ia.paciente_nombre.toLowerCase().includes(q) ||
          c.extraccion_ia.practica.toLowerCase().includes(q) ||
          (c.extraccion_ia.obra_social?.toLowerCase().includes(q) ?? false),
      );
    }

    // Estado filter
    if (filtroEstado !== "todas") {
      casos = casos.filter((c) => c.estado === filtroEstado);
    }

    // Prioridad filter
    if (filtroPrioridad !== "todas") {
      casos = casos.filter((c) => c.prioridad === filtroPrioridad);
    }

    // Tipo filter
    if (filtroTipo !== "todas") {
      casos = casos.filter((c) => c.tipo_caso === filtroTipo);
    }

    // Sort by priority and creation date
    const prioridadOrder: Record<string, number> = { urgente: 0, normal: 1, bajo: 2 };
    casos.sort((a, b) => {
      const pDiff = (prioridadOrder[a.prioridad] ?? 1) - (prioridadOrder[b.prioridad] ?? 1);
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return casos;
  }, [vistaActiva, searchQuery, filtroEstado, filtroPrioridad, filtroTipo, user.id]);

  const handleCaseClick = (caso: Caso) => {
    setSelectedCaso(caso);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCaso(null);
  };

  // Stats for layout
  const totalCasos = MOCK_CASOS.filter((c) => c.estado !== "cerrado").length;
  const pendientes = MOCK_CASOS.filter((c) => c.estado === "pendiente").length;
  const misCasos = MOCK_CASOS.filter((c) => c.asesor_id === user.id && c.estado !== "cerrado").length;
  const seguimientosPendientes = MOCK_CASOS.filter(
    (c) => c.seguimiento_fecha !== null && c.estado !== "cerrado",
  ).length;

  const getVistaTitle = () => {
    switch (vistaActiva) {
      case "cola":
        return "Cola General";
      case "bandeja":
        return "Mi Bandeja";
      case "seguimientos":
        return "Seguimientos Pendientes";
      case "metricas":
        return "Dashboard";
    }
  };

  const handleFilterByTipo = (tipo: string) => {
    setVistaActiva("cola");
    setFiltroTipo(tipo as TipoCaso);
  };

  return (
    <AppLayout
      asesorNombre={user.nombre}
      asesorRol={user.rol}
      vistaActiva={vistaActiva}
      onVistaChange={setVistaActiva}
      onFilterByTipo={handleFilterByTipo}
      onLogout={logout}
      totalCasos={totalCasos}
      pendientes={pendientes}
      misCasos={misCasos}
      seguimientosPendientes={seguimientosPendientes}
    >
      {vistaActiva === "metricas" ? (
        <MetricsBoard />
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{getVistaTitle()}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {casosFiltrados.length} caso{casosFiltrados.length !== 1 ? "s" : ""}
            </p>
          </div>

          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onEstadoChange={setFiltroEstado}
            onPrioridadChange={setFiltroPrioridad}
            onTipoChange={setFiltroTipo}
            activeFilters={{
              estado: filtroEstado,
              prioridad: filtroPrioridad,
              tipo: filtroTipo,
            }}
          />

          <CaseGrid casos={casosFiltrados} onCaseClick={handleCaseClick} />

          <CaseModal
            caso={selectedCaso}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        </>
      )}
    </AppLayout>
  );
}

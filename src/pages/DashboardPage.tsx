import { useState, useMemo, useEffect, useRef } from "react";
import type { Caso, EstadoCaso, Prioridad, TipoCaso } from "../types";
import type { AssignCaseResult } from "../services/errors";
import { useCasos } from "../hooks/useCasos";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { FilterBar } from "../components/cases/FilterBar";
import { CaseGrid } from "../components/cases/CaseGrid";
import { CaseModal } from "../components/modal/CaseModal";
import { MetricsBoard } from "../components/metrics/MetricsBoard";
import { useAsignarCaso } from "../hooks/useAsignarCaso";
import { useCaseRealtimeSync } from "../hooks/useCaseRealtimeSync";
import { useCaseCrossTabSync } from "../hooks/useCaseCrossTabSync";
import { useCaseUIStoreContext } from "../context/CaseUIStoreContext";
import { showToast } from "../components/ui/Toast";

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
  const { casos: allCasos, isLoading, error, refresh } = useCasos();
  const { asignar: asignarCaso } = useAsignarCaso();
  const { reconcileCaseState } = useCaseUIStoreContext();
  const userId = user?.id;

  // Suscripción Realtime a cambios en la tabla casos
  // Pasa refresh() para resync automático en reconnect + visibility change
  useCaseRealtimeSync(refresh);

  // Sincronización multi-tab vía BroadcastChannel
  // Evita inconsistencias UI-only cuando el mismo usuario tiene múltiples tabs
  useCaseCrossTabSync(refresh);

  // Reconciliar estado UI con servidor después de cada actualización de casos
  const prevCasosRef = useRef<string>("");
  const casosKey = allCasos.map((c) => `${c.id}:${c.asesor_id}:${c.estado}`).join(",");
  useEffect(() => {
    if (userId && casosKey !== prevCasosRef.current && allCasos.length > 0) {
      prevCasosRef.current = casosKey;
      reconcileCaseState(allCasos, userId, 3000);
    }
  }, [casosKey, allCasos, reconcileCaseState, userId]);

  if (!user) return null;

  const casosFiltrados = useMemo(() => {
    let casos = [...allCasos];

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
  }, [allCasos, vistaActiva, searchQuery, filtroEstado, filtroPrioridad, filtroTipo, user.id]);

  const handleCaseClick = (caso: Caso) => {
    setSelectedCaso(caso);
    setIsModalOpen(true);
  };

  const handleAsignarCaso = async (casoId: string): Promise<AssignCaseResult> => {
    try {
      // Pasar userId para que el store lo registre (claiming → claimed_by_me vs other)
      const result = await asignarCaso(casoId, user.id);
      if (result.ok) {
        showToast("Caso asignado correctamente", "success");
        refresh();
      } else if (result.code === "CASE_ALREADY_TAKEN") {
        showToast("El caso ya fue tomado por otro asesor", "error");
        // Reconciliar: el store ya seteó claimed_by_other
        if (userId) reconcileCaseState(allCasos, userId, 0);
      } else if (result.code === "CASE_NOT_FOUND") {
        showToast("El caso no fue encontrado", "error");
      }
      return result;
    } catch (err) {
      showToast("Error al asignar el caso. Intente nuevamente.", "error");
      throw err;
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCaso(null);
  };

  // Stats for layout
  const totalCasos = allCasos.filter((c) => c.estado !== "cerrado").length;
  const pendientes = allCasos.filter((c) => c.estado === "pendiente").length;
  const misCasos = allCasos.filter((c) => c.asesor_id === user.id && c.estado !== "cerrado").length;
  const seguimientosPendientes = allCasos.filter(
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

          {/* Error banner */}
          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Error al cargar datos: {error}</span>
            </div>
          )}

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

          {isLoading && !error && casosFiltrados.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-500">Cargando casos...</p>
              </div>
            </div>
          ) : !error || casosFiltrados.length > 0 ? (
            <CaseGrid casos={casosFiltrados} onCaseClick={handleCaseClick} onAsignar={handleAsignarCaso} />
          ) : null}

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

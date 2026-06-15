import { useState, useEffect, useCallback } from "react";
import type { Caso, MetricaResumen, CasoPorTipo, VolumenDiario, MetricaPorAsesor } from "../types";
import { useCasoService } from "../context/CasoServiceContext";

export interface UseCasosReturn {
  casos: Caso[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Agregar un caso nuevo al tope del array (desde Realtime INSERT) */
  addCaso: (caso: Caso) => void;
  /** Reemplazar un caso existente en el array (desde Realtime UPDATE) */
  updateCaso: (caso: Caso) => void;
}

/**
 * Hook that fetches all casos through the active service layer.
 */
export function useCasos(): UseCasosReturn {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = useCasoService();

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await service.getCasos();
      console.log("[USECASOS] fetch completado — casos recibidos:", data.length, data.map(c => c.id).join(", "));
      setCasos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar casos");
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Agregar caso nuevo al tope del array
  const addCaso = useCallback((nuevoCaso: Caso) => {
    setCasos((prev) => {
      // Evitar duplicados por si el evento llega dos veces
      if (prev.some((c) => c.id === nuevoCaso.id)) return prev;
      console.log("[USECASOS] addCaso:", nuevoCaso.id);
      return [nuevoCaso, ...prev];
    });
  }, []);

  // Reemplazar caso existente (por update del servidor)
  const updateCaso = useCallback((casoActualizado: Caso) => {
    setCasos((prev) => {
      const idx = prev.findIndex((c) => c.id === casoActualizado.id);
      if (idx === -1) return prev;
      console.log("[USECASOS] updateCaso:", casoActualizado.id);
      const next = [...prev];
      next[idx] = casoActualizado;
      return next;
    });
  }, []);

  // Log cuando cambia el array de casos (por fetch directo o refresh)
  useEffect(() => {
    if (casos.length > 0) {
      console.log("[USECASOS] estado actualizado — casos:", casos.length);
    }
  }, [casos.length]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { casos, isLoading, error, refresh: fetch, addCaso, updateCaso };
}

interface UseCasosFiltradosReturn {
  casos: Caso[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that filters casos by asesor (for "Mi Bandeja" view).
 */
export function useCasosPorAsesor(asesorId: string): UseCasosFiltradosReturn {
  const service = useCasoService();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await service.getCasosByAsesor(asesorId);
      setCasos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar casos");
    } finally {
      setIsLoading(false);
    }
  }, [service, asesorId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { casos, isLoading, error };
}

interface UseMetricasReturn {
  resumen: MetricaResumen | null;
  porTipo: CasoPorTipo[];
  volumenDiario: VolumenDiario[];
  porAsesor: MetricaPorAsesor[];
  isLoading: boolean;
}

/**
 * Hook that fetches metrics directly from the service layer using dedicated
 * Supabase aggregation queries (count, group by, etc.) instead of deriving
 * from the full casos array. More efficient for large datasets.
 */
export function useMetricas(): UseMetricasReturn {
  const service = useCasoService();
  const [resumen, setResumen] = useState<MetricaResumen | null>(null);
  const [porTipo, setPorTipo] = useState<CasoPorTipo[]>([]);
  const [volumenDiario, setVolumenDiario] = useState<VolumenDiario[]>([]);
  const [porAsesor, setPorAsesor] = useState<MetricaPorAsesor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, tipos, volumen, asesores] = await Promise.all([
        service.getMetricasResumen(),
        service.getCasosPorTipo(),
        service.getVolumenDiario(),
        service.getMetricasPorAsesor(),
      ]);
      setResumen(res);
      setPorTipo(tipos);
      setVolumenDiario(volumen);
      setPorAsesor(asesores);
    } catch (err) {
      console.error("[USEMETRICAS] Error fetching metrics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { resumen, porTipo, volumenDiario, porAsesor, isLoading };
}

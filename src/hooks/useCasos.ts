import { useState, useEffect, useCallback } from "react";
import type { Caso, MetricaResumen, CasoPorTipo, VolumenDiario } from "../types";
import { mockCasoService, type CasoService } from "../services/mockService";

/**
 * Default service instance — swap this for a SupabaseApiService in Phase 2
 * without changing any consumer code.
 */
let activeService: CasoService = mockCasoService;

/**
 * Allows switching the active service at runtime (useful for testing or phased migration).
 */
export function setCasoService(service: CasoService) {
  activeService = service;
}

interface UseCasosReturn {
  casos: Caso[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook that fetches all casos through the active service layer.
 */
export function useCasos(): UseCasosReturn {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await activeService.getCasos();
      setCasos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar casos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { casos, isLoading, error, refresh: fetch };
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
  const [casos, setCasos] = useState<Caso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await activeService.getCasosByAsesor(asesorId);
      setCasos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar casos");
    } finally {
      setIsLoading(false);
    }
  }, [asesorId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { casos, isLoading, error };
}

interface UseMetricasReturn {
  resumen: MetricaResumen | null;
  porTipo: CasoPorTipo[];
  volumenDiario: VolumenDiario[];
  isLoading: boolean;
}

/**
 * Hook that fetches all metrics data through the active service layer.
 */
export function useMetricas(): UseMetricasReturn {
  const [resumen, setResumen] = useState<MetricaResumen | null>(null);
  const [porTipo, setPorTipo] = useState<CasoPorTipo[]>([]);
  const [volumenDiario, setVolumenDiario] = useState<VolumenDiario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const [r, t, v] = await Promise.all([
        activeService.getMetricasResumen(),
        activeService.getCasosPorTipo(),
        activeService.getVolumenDiario(),
      ]);
      setResumen(r);
      setPorTipo(t);
      setVolumenDiario(v);
    } catch {
      // Silent fail for metrics
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { resumen, porTipo, volumenDiario, isLoading };
}

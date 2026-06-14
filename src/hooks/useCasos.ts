import { useState, useEffect, useCallback, useMemo } from "react";
import type { Caso, MetricaResumen, CasoPorTipo, VolumenDiario, TipoCaso } from "../types";
import { TIPOS_CASO } from "../constants";
import { useCasoService } from "../context/CasoServiceContext";

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

  const service = useCasoService();

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await service.getCasos();
      setCasos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar casos");
    } finally {
      setIsLoading(false);
    }
  }, [service]);

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
  isLoading: boolean;
}

/**
 * Hook that derives all metrics from the casos already loaded by useCasos().
 * Uses useMemo for performance — no extra network calls.
 * The aggregation logic mirrors what SupabaseCasoService does server-side,
 * but runs client-side on already-fetched data for efficiency.
 */
export function useMetricas(): UseMetricasReturn {
  const { casos, isLoading } = useCasos();

  const resumen = useMemo<MetricaResumen | null>(() => {
    if (casos.length === 0) return null;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const yesterday = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    ).toISOString();

    let casosActivos = 0;
    let casosHoy = 0;
    let casosSinAsignar = 0;
    let casosSinAtender24hs = 0;
    let totalResueltos = 0;
    let totalAutomaticos = 0;
    let totalTiempoResolucionMs = 0;
    let casosConTiempo = 0;

    for (const c of casos) {
      const noCerrado = c.estado !== "cerrado";

      if (noCerrado) {
        casosActivos++;
        if (c.asesor_id === null) casosSinAsignar++;
        if (c.created_at < yesterday) casosSinAtender24hs++;
      }

      if (c.created_at.slice(0, 10) === today) {
        casosHoy++;
      }

      if (c.estado === "cerrado") {
        totalResueltos++;
        if (c.tipo_caso === "B" || c.tipo_caso === "K") {
          totalAutomaticos++;
        }
        if (c.resolved_at && c.created_at) {
          totalTiempoResolucionMs +=
            new Date(c.resolved_at).getTime() -
            new Date(c.created_at).getTime();
          casosConTiempo++;
        }
      }
    }

    return {
      casos_activos: casosActivos,
      casos_hoy: casosHoy,
      casos_sin_asignar: casosSinAsignar,
      casos_sin_atender_24hs: casosSinAtender24hs,
      tiempo_promedio_resolucion_min:
        casosConTiempo > 0
          ? Math.round(totalTiempoResolucionMs / casosConTiempo / 60000)
          : 0,
      tasa_resolucion_automatica:
        totalResueltos > 0 ? totalAutomaticos / totalResueltos : 0,
    };
  }, [casos]);

  const porTipo = useMemo<CasoPorTipo[]>(() => {
    const counts = new Map<string, number>();
    for (const c of casos) {
      counts.set(c.tipo_caso, (counts.get(c.tipo_caso) ?? 0) + 1);
    }

    const tipoOrder: TipoCaso[] = [
      "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K",
    ];

    return tipoOrder
      .filter((t) => counts.has(t))
      .map((tipo) => ({
        tipo,
        nombre: TIPOS_CASO[tipo],
        cantidad: counts.get(tipo) ?? 0,
      }));
  }, [casos]);

  const volumenDiario = useMemo<VolumenDiario[]>(() => {
    const daily = new Map<
      string,
      { total: number; resueltos: number; automaticos: number }
    >();

    for (const c of casos) {
      const date = c.created_at.slice(0, 10);
      const entry = daily.get(date) ?? {
        total: 0,
        resueltos: 0,
        automaticos: 0,
      };
      entry.total++;
      if (c.estado === "cerrado") {
        entry.resueltos++;
        if (c.tipo_caso === "B" || c.tipo_caso === "K") {
          entry.automaticos++;
        }
      }
      daily.set(date, entry);
    }

    return Array.from(daily.entries())
      .map(([fecha, vals]) => ({ fecha, ...vals }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-30);
  }, [casos]);

  return { resumen, porTipo, volumenDiario, isLoading };
}

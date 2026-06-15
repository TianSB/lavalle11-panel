import type {
  Caso,
  Usuario,
  MetricaResumen,
  CasoPorTipo,
  VolumenDiario,
  MetricaPorAsesor,
} from "../types";
import type { AssignCaseResult } from "./errors";
import {
  MOCK_CASOS,
  MOCK_METRICAS,
  MOCK_CASOS_POR_TIPO,
  MOCK_VOLUMEN_DIARIO,
} from "../data/mockCases";

/**
 * Service interface — the contract that both mock and future real implementations must follow.
 * This allows DashboardPage and other consumers to be completely agnostic about the data source.
 */
export interface CasoService {
  getCasos(): Promise<Caso[]>;
  getCasosByAsesor(asesorId: string): Promise<Caso[]>;
  getCasosConSeguimiento(): Promise<Caso[]>;
  getMetricasResumen(): Promise<MetricaResumen>;
  getCasosPorTipo(): Promise<CasoPorTipo[]>;
  getVolumenDiario(): Promise<VolumenDiario[]>;
  getMetricasPorAsesor(): Promise<MetricaPorAsesor[]>;
  getUsuarios(): Promise<Usuario[]>;
  /**
   * Asignar un caso al usuario autenticado.
   *
   * Atómico: RPC Postgres con UPDATE condicional + RETURNING.
   * Retorna siempre un resultado estructurado (nunca throw para casos esperados):
   *   { ok: true, caseId } — caso asignado exitosamente
   *   { ok: false, code: "CASE_ALREADY_TAKEN" } — otro asesor ya lo tomó
   *   { ok: false, code: "CASE_NOT_FOUND" } — caso no existe
   *
   * AppError solo para errores reales (network, auth).
   */
  asignarCaso(casoId: string): Promise<AssignCaseResult>;
  cerrarCaso(casoId: string, reason: string): Promise<void>;
  enviarMensaje(casoId: string, mensaje: string): Promise<void>;
}

// Simulate network delay
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock implementation of CasoService.
 * Replace this entire file with a SupabaseApiService for production without changing any consumer code.
 */
export const mockCasoService: CasoService = {
  async getCasos(): Promise<Caso[]> {
    await delay();
    return [...MOCK_CASOS];
  },

  async getCasosByAsesor(asesorId: string): Promise<Caso[]> {
    await delay();
    return MOCK_CASOS.filter((c) => c.asesor_id === asesorId);
  },

  async getCasosConSeguimiento(): Promise<Caso[]> {
    await delay();
    return MOCK_CASOS.filter(
      (c) => c.seguimiento_fecha !== null && c.estado !== "cerrado",
    );
  },

  async getMetricasResumen(): Promise<MetricaResumen> {
    await delay();
    return { ...MOCK_METRICAS };
  },

  async getCasosPorTipo(): Promise<CasoPorTipo[]> {
    await delay();
    return [...MOCK_CASOS_POR_TIPO];
  },

  async getVolumenDiario(): Promise<VolumenDiario[]> {
    await delay();
    return [...MOCK_VOLUMEN_DIARIO];
  },

  async getMetricasPorAsesor(): Promise<MetricaPorAsesor[]> {
    await delay();
    const { MOCK_METRICAS_POR_ASESOR } = await import("../data/mockCases");
    return [...MOCK_METRICAS_POR_ASESOR];
  },

  async getUsuarios(): Promise<Usuario[]> {
    await delay();
    const { USUARIO_ACTUAL, ADMIN_USUARIO } = await import("../data/mockCases");
    return [USUARIO_ACTUAL, ADMIN_USUARIO];
  },

  async asignarCaso(casoId: string): Promise<AssignCaseResult> {
    await delay(200);
    // Buscar el caso en datos mock
    const caso = MOCK_CASOS.find((c) => c.id === casoId);
    if (!caso) {
      return { ok: false, code: "CASE_NOT_FOUND" as const };
    }
    if (caso.asesor_id !== null || caso.estado !== "pendiente") {
      return { ok: false, code: "CASE_ALREADY_TAKEN" as const };
    }
    return { ok: true, caseId: casoId };
  },

  async cerrarCaso(_casoId: string, _reason: string): Promise<void> {
    await delay(200);
    // Mock: no-op
  },

  async enviarMensaje(_casoId: string, _mensaje: string): Promise<void> {
    await delay(500);
    // Mock: no-op
  },
};

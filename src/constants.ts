import type { TipoCaso } from "./types";

/**
 * Display labels for each TipoCaso (A–K).
 * Shared by Sidebar, FilterBar, and CaseModal.
 */
export const TIPOS_CASO: Record<TipoCaso, string> = {
  A: "Turno con orden",
  B: "Sin turno previo",
  C: "Consulta precios",
  D: "Copago",
  E: "Derivación Chiclana",
  F: "Resultados",
  G: "Médico derivante",
  H: "Punción / biopsia",
  I: "Reprogramación",
  J: "Cancelación",
  K: "Equivocado",
};

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

/**
 * Prácticas de Medicina Nuclear que requieren derivación a Chiclana (BR-03).
 * Single source of truth — compartido entre backend, frontend y scripts.
 */
export const PRACTICAS_NUCLEAR = [
  "pet_ct",
  "spect_ct",
  "centellograma",
  "perfusion_miocardica",
  "camara_gamma",
] as const;

export type PracticaNuclear = (typeof PRACTICAS_NUCLEAR)[number];

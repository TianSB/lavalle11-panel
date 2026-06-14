// ============================================================
// errors.ts
// Modelo de errores tipado para la capa de servicios.
//
// Arquitectura:
//   - AssignCaseResult: discriminated union para resultados de asignación
//     (sin exceptions — resultado estructurado siempre)
//   - AssignCaseError: para errores REALES del sistema (network, auth, etc.)
// ============================================================

/**
 * Códigos de resultado para asignación de casos.
 */
export const AssignCaseCodes = {
  SUCCESS: "SUCCESS",
  CASE_ALREADY_TAKEN: "CASE_ALREADY_TAKEN",
  CASE_NOT_FOUND: "CASE_NOT_FOUND",
} as const;

export type AssignCaseCode = (typeof AssignCaseCodes)[keyof typeof AssignCaseCodes];

/**
 * Resultado tipado de una operación de asignación.
 *
 * Éxito:
 *   { ok: true, caseId: string }
 *
 * Falla por concurrencia:
 *   { ok: false, code: "CASE_ALREADY_TAKEN" }
 *
 * Falla por caso inexistente:
 *   { ok: false, code: "CASE_NOT_FOUND" }
 *
 * Uso:
 *   const result = await service.asignarCaso(casoId);
 *   if (result.ok) { ... }
 *   else if (result.code === "CASE_ALREADY_TAKEN") { ... }
 */
export type AssignCaseResult =
  | { ok: true; caseId: string }
  | { ok: false; code: typeof AssignCaseCodes.CASE_ALREADY_TAKEN }
  | { ok: false; code: typeof AssignCaseCodes.CASE_NOT_FOUND };

/**
 * Códigos de error estándar del sistema.
 */
export const ErrorCodes = {
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
  ASSIGNMENT_FAILED: "ASSIGNMENT_FAILED",
  CLOSE_FAILED: "CLOSE_FAILED",
  SERVICE_ERROR: "SERVICE_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Error base de la capa de aplicación.
 * Solo para errores REALES (network, auth, etc.), NO para resultados esperados
 * como CASE_ALREADY_TAKEN (que usan AssignCaseResult).
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.context = context;
  }
}

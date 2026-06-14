import type { Rol } from "../types";

/**
 * RBAC permission map.
 * Single source of truth for frontend authorization.
 *
 * Convention: <resource>.<action>[.scope]
 *   - casos.read       → admin can read all cases
 *   - casos.read.own   → asesor can read own cases only
 *   - usuarios.manage  → admin can manage users
 *   - metrics.read     → admin can see global metrics
 *   - metrics.read.own → asesor can see own metrics only
 */

export type Permission = string;

export const ROLE_PERMISSIONS: Record<Rol, Permission[]> = {
  administrador: [
    "casos.read",
    "casos.write",
    "casos.assign",
    "casos.delete",
    "usuarios.manage",
    "metrics.read",
  ],
  asesor: [
    "casos.read.own",
    "casos.write.own",
    "metrics.read.own",
  ],
};

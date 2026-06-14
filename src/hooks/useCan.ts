import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { can as canCheck } from "../rbac";

/**
 * Hook that returns a `can(permission)` checker based on the current user's role.
 * The role is resolved internally by the RBAC module — no need to pass it.
 *
 * Usage:
 *   const { can } = useCan();
 *   if (can("metrics.read")) { ... }
 *   if (can("casos.assign")) { ... }
 *
 * Also exposes the raw `role` for informational display only (not for permission logic).
 */
export function useCan() {
  const { user } = useAuth();
  const role = user?.rol ?? "asesor";

  const check = useCallback(
    (permission: string): boolean => {
      return canCheck(permission);
    },
    [],
  );

  return { can: check, role };
}

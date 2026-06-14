import type { Rol } from "../types";
import { ROLE_PERMISSIONS, type Permission } from "./permissions";

/**
 * Module-level store for the current user's role.
 * Set by AuthContext on auth state changes.
 * This is the SINGLE source of truth for RBAC.
 *
 * Using module-level state avoids coupling can() to React context,
 * allowing permission checks anywhere in the codebase.
 */
let currentRole: Rol | null = null;

/**
 * Set the current user's role for RBAC checks.
 * Called by AuthContext whenever the authenticated user changes.
 * Pass `null` to reset (no authenticated user).
 */
export function setRbacRole(role: Rol | null): void {
  currentRole = role;
}

/**
 * Pure check: does a given role have a specific permission?
 * Useful for testing or ephemeral checks where you have a role value.
 * Not intended for application code — use `can()` instead.
 */
export function canWithRole(role: Rol | string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role as Rol];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if the current authenticated user has a specific permission.
 *
 * Resolves the role internally from the current auth session.
 * UI code should NEVER pass a role parameter — just the permission.
 *
 * Usage:
 *   if (can("casos.read")) { ... }
 *   if (can("usuarios.manage")) { ... }
 */
export function can(permission: Permission): boolean {
  if (!currentRole) return false;
  return canWithRole(currentRole, permission);
}

/**
 * Higher-level check: does the current user have access to a resource at all?
 * e.g. hasAccess("metrics") → true for admin (metrics.read) and asesor (metrics.read.own)
 */
export function hasResourceAccess(resource: string): boolean {
  if (!currentRole) return false;
  const permissions = ROLE_PERMISSIONS[currentRole];
  if (!permissions) return false;
  return permissions.some((p) => p.startsWith(resource));
}

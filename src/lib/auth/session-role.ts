import type { UserRole } from "@prisma/client";

/** JWT / session role — matches Prisma UserRole */
export type SessionRole = UserRole;

export const SESSION_ROLES: SessionRole[] = ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"];

export function parseSessionRole(role: string): SessionRole | null {
  const upper = role.trim().toUpperCase();
  if (upper === "SUPER_ADMIN" || upper === "ADMIN" || upper === "EMPLOYEE") {
    return upper as UserRole;
  }
  const lower = role.trim().toLowerCase();
  if (lower === "admin") return "ADMIN";
  if (lower === "employee") return "EMPLOYEE";
  return null;
}

export function isAdminRole(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isEmployeeRole(role: string): boolean {
  return role === "EMPLOYEE";
}

/** Employee portal only — no admin dashboard at `/` */
export function isPureEmployeeRole(role: string): boolean {
  return role === "EMPLOYEE";
}

export function mapRoleForClient(role: string): UserRole {
  return parseSessionRole(role) ?? "EMPLOYEE";
}

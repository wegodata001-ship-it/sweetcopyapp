/** Roles stored in hlwait.users.role */
export type SessionRole = "admin" | "employee";

export const SESSION_ROLES: SessionRole[] = ["admin", "employee"];

export function parseSessionRole(role: string): SessionRole | null {
  const r = role.trim().toLowerCase();
  if (r === "admin" || r === "employee") return r;
  return null;
}

export function isAdminRole(role: string): boolean {
  return role === "admin";
}

export function isEmployeeRole(role: string): boolean {
  return role === "employee";
}

/** Former "pure employee" — no admin UI */
export function isPureEmployeeRole(role: string): boolean {
  return isEmployeeRole(role);
}

/** Maps hlwait role → client AuthUser role */
export function mapRoleForClient(role: string): "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE" {
  const r = parseSessionRole(role);
  if (r === "admin") return "ADMIN";
  return "EMPLOYEE";
}

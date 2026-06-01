import type { SessionJwtPayload } from "@/lib/auth/jwt";
import { isAdminRole } from "@/lib/auth/session-role";

export function canViewWeddingOrders(session: SessionJwtPayload): boolean {
  return isAdminRole(session.role);
}

export function canManageOrderCategory(session: SessionJwtPayload, _category: string): boolean {
  return isAdminRole(session.role) || session.permissions.includes("employee_clock");
}

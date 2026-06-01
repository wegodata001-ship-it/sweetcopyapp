import { PERMISSION_KEYS } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/session-role";

const EMPLOYEE_PERMISSIONS = [
  "employee_clock",
  "tasks",
  "inventory",
  "financial_registration",
  "ledger",
] as const;

export async function getPermissionStringsForUser(
  _userId: string,
  role: string,
): Promise<string[]> {
  if (isAdminRole(role)) {
    return [...PERMISSION_KEYS];
  }
  return [...EMPLOYEE_PERMISSIONS];
}

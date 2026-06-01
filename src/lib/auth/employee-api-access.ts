import { isPureEmployeeRole } from "@/lib/auth/session-role";

export { isPureEmployeeRole };

export function employeeWorkflowApiAllowed(_apiPath: string, _method: string): boolean {
  return false;
}

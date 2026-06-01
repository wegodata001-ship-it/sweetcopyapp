/** Structured auth flow logs (server only). */
export function logAuthEvent(
  event:
    | "LOGIN_START"
    | "USER_FOUND"
    | "PASSWORD_VALID"
    | "JWT_CREATED"
    | "LOGIN_SUCCESS"
    | "LOGIN_FAIL"
    | "JWT_VERIFY_FAIL",
  detail?: Record<string, string | number | boolean | undefined>,
): void {
  const payload = detail ? ` ${JSON.stringify(detail)}` : "";
  console.info(`[auth] ${event}${payload}`);
}

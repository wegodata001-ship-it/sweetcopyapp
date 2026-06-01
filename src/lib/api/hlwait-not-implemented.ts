import { NextResponse } from "next/server";

/**
 * Legacy ERP routes not yet wired to hlwait Prisma models.
 * This is NOT triggered by DEMO_ONLY / APP_MODE=demo — only by stub route handlers.
 */
export function hlwaitApiDisabled(
  message = "פיצ'ר לא ממומש עדיין בגרסה זו",
): NextResponse {
  return NextResponse.json(
    { ok: false, code: "not_implemented", error: message },
    { status: 501 },
  );
}

/**
 * hlwait-backed API prefixes (allowed through middleware).
 * Login, customers, orders, payments, expenses, inventory core are included.
 */
export const HLWAIT_API_PREFIXES = [
  "/api/auth",
  "/api/customers",
  "/api/payments",
  "/api/expenses",
  "/api/income",
  "/api/inventory",
  "/api/future-orders",
  "/api/dashboard",
  "/api/admin/users",
  "/api/suppliers",
  "/api/finance",
  "/api/me",
  "/api/work",
  "/api/employees",
  "/api/ocr",
] as const;

export function isHlwaitApiRoute(apiPath: string): boolean {
  const p = apiPath.replace(/\/+$/, "") || "/";
  return HLWAIT_API_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

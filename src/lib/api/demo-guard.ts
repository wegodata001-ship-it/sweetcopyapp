import { NextResponse } from "next/server";
import { isDemoAppMode } from "@/lib/demo/config";

/** Destructive admin APIs blocked in DEMO — login and CRUD stay allowed. */
const DEMO_DANGEROUS_API_PATHS = [
  "/api/admin/system/reset",
  "/api/admin/system/backup",
] as const;

export function isDemoDangerousApiRoute(apiPath: string): boolean {
  const p = apiPath.replace(/\/+$/, "") || "/";
  return DEMO_DANGEROUS_API_PATHS.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

export function demoDangerousBlocked(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      code: "demo_blocked",
      error: "פעולה זו חסומה במצב DEMO (איפוס / מחיקת מערכת)",
    },
    { status: 403 },
  );
}

export function blockDemoDangerousApi(apiPath: string): NextResponse | null {
  if (!isDemoAppMode()) return null;
  if (!isDemoDangerousApiRoute(apiPath)) return null;
  return demoDangerousBlocked();
}

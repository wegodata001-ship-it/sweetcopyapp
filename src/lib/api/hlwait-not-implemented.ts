import { NextResponse } from "next/server";

export function hlwaitApiDisabled(message = "לא זמין במצב DEMO — schema hlwait בלבד"): NextResponse {
  return NextResponse.json(
    { ok: false, code: "hlwait_only", error: message },
    { status: 501 },
  );
}

/**
 * API prefixes that are implemented / routed for the hlwait schema.
 * All /api/ paths are now allowed through middleware — individual routes
 * return hlwaitApiDisabled() for anything not yet migrated.
 */
export const HLWAIT_API_PREFIXES = ["/api/"] as const;

export function isHlwaitApiRoute(_apiPath: string): boolean {
  return true;
}

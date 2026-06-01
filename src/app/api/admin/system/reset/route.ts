import { NextResponse } from "next/server";
import { demoDangerousBlocked } from "@/lib/api/demo-guard";
import { isDemoAppMode } from "@/lib/demo/config";

export const dynamic = "force-dynamic";

/** איפוס מערכת — חסום במצב DEMO */
export async function POST() {
  if (isDemoAppMode()) return demoDangerousBlocked();
  return NextResponse.json({ ok: false, error: "Feature removed" }, { status: 404 });
}

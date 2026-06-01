import { NextResponse } from "next/server";
import { hlwaitApiDisabled } from "@/lib/api/hlwait-not-implemented";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: { emailMode: "muted", emailQuietHours: true },
  });
}

export async function PATCH() {
  return hlwaitApiDisabled("העדפות התראות — לא זמינות ב-hlwait demo");
}

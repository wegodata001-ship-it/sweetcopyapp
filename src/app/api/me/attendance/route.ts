import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/get-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "נדרשת התחברות" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, data: [] });
}

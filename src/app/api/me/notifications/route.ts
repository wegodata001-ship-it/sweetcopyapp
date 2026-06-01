import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/get-session";

const HEADERS = { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" };

/** Notifications endpoint — hlwait schema has no Notification model; returns empty. */
export async function GET(_req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "נדרשת התחברות" }, { status: 401 });
  }
  return NextResponse.json(
    { ok: true, data: { inbox: "admin", unreadCount: 0, items: [] } },
    { headers: HEADERS },
  );
}

export async function PATCH(_req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "נדרשת התחברות" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

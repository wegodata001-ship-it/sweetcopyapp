import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/get-session";

/** Alerts endpoint — hlwait schema has no Notification model; always returns empty. */
export async function GET(_req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "נדרשת התחברות" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    data: { unreadCount: 0, items: [] },
  });
}

export async function PATCH(_req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ ok: false, error: "נדרשת התחברות" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

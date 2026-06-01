import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/jwt";
import { logActivity } from "@/lib/activity-log";
import { getSessionFromCookie } from "@/lib/auth/get-session";

export async function POST() {
  const session = await getSessionFromCookie();
  if (session?.sub) await logActivity(session.sub, "logout");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

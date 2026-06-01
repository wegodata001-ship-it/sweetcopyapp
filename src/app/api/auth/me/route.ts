import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { appendRefreshedSessionCookie } from "@/lib/auth/reissue-session";
import { getPermissionStringsForUser } from "@/lib/auth/user-permissions";
import { toApiUser } from "@/lib/auth/user-dto";
import { parseSessionRole } from "@/lib/auth/session-role";

const FAST_HEADERS = { "Cache-Control": "private, max-age=15" };

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ ok: true, user: null });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ ok: true, user: null });
  }

  const sync = req.nextUrl.searchParams.get("sync") === "1";

  const row = await prisma.hLWaitUser.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!row || !row.isActive) {
    return NextResponse.json({ ok: true, user: null });
  }

  const user = toApiUser(row);
  const role = parseSessionRole(row.role) ?? session.role;

  if (sync) {
    const permissions = await getPermissionStringsForUser(user.id, role);
    const res = NextResponse.json({
      ok: true,
      user: { ...user, role, permissions },
    });
    await appendRefreshedSessionCookie(res, {
      id: user.id,
      email: user.email,
      role,
      mustChangePassword: false,
      permissions,
    });
    return res;
  }

  return NextResponse.json(
    {
      ok: true,
      user: {
        ...user,
        role,
        permissions: session.permissions,
      },
    },
    { headers: FAST_HEADERS },
  );
}

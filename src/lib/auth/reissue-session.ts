import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  signSessionToken,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/jwt";
import { getPermissionStringsForUser } from "@/lib/auth/user-permissions";
import type { SessionRole } from "@/lib/auth/session-role";
import { parseSessionRole } from "@/lib/auth/session-role";

export type SessionReissueUser = {
  id: string;
  email: string;
  name?: string;
  role: SessionRole;
  mustChangePassword: boolean;
  permissions?: string[];
};

export async function appendRefreshedSessionCookie(
  res: NextResponse,
  user: SessionReissueUser | string,
): Promise<boolean> {
  const base =
    typeof user === "string"
      ? await prisma.hLWaitUser.findUnique({
          where: { id: user },
          select: { id: true, name: true, email: true, role: true, isActive: true },
        })
      : null;

  const row =
    typeof user === "string"
      ? base
      : {
          id: user.id,
          name: user.name ?? user.id,
          email: user.email,
          role: user.role,
          isActive: true,
        };

  if (!row || (typeof user === "string" && !row.isActive)) return false;

  const role = parseSessionRole(row.role) ?? (typeof user !== "string" ? user.role : "employee");

  const permissions =
    typeof user !== "string" && user.permissions
      ? user.permissions
      : await getPermissionStringsForUser(row.id, role);

  const token = await signSessionToken({
    userId: row.id,
    email: row.email,
    name: row.name,
    role,
    permissions,
    mustChangePassword: false,
  });
  res.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return true;
}

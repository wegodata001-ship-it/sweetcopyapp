import { SignJWT, jwtVerify } from "jose";
import type { SessionRole } from "@/lib/auth/session-role";
import { parseSessionRole } from "@/lib/auth/session-role";
import { jwtSecretKey } from "@/lib/auth/jwt-secret";

const COOKIE_NAME = "wego_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type SessionJwtPayload = {
  /** User id (public.hlwait_users.id) */
  userId: string;
  /** Alias for legacy code using `session.sub` */
  sub: string;
  email: string;
  name: string;
  role: SessionRole;
  permissions: string[];
  mustChangePassword?: boolean;
};

export type SignSessionInput = {
  userId: string;
  email: string;
  name: string;
  role: SessionRole;
  permissions: string[];
  mustChangePassword?: boolean;
};

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
};

export async function signSessionToken(
  input: SignSessionInput,
  maxAgeSec = SESSION_MAX_AGE_SEC,
): Promise<string> {
  return new SignJWT({
    userId: input.userId,
    email: input.email,
    role: input.role,
    name: input.name,
    permissions: input.permissions,
    mustChangePassword: Boolean(input.mustChangePassword),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(jwtSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretKey());
    const userId =
      typeof payload.userId === "string"
        ? payload.userId
        : typeof payload.sub === "string"
          ? payload.sub
          : null;
    const email = typeof payload.email === "string" ? payload.email : "";
    const name = typeof payload.name === "string" ? payload.name : "";
    const roleRaw = typeof payload.role === "string" ? payload.role : "";
    const role = parseSessionRole(roleRaw);
    const permissions = Array.isArray(payload.permissions)
      ? payload.permissions.filter((p): p is string => typeof p === "string")
      : [];
    if (!userId || !email || !role) return null;
    const mustChangePassword = payload.mustChangePassword === true;
    return {
      userId,
      sub: userId,
      email,
      name,
      role,
      permissions,
      mustChangePassword,
    };
  } catch {
    return null;
  }
}

/** Attach user context from JWT for API routes / RSC (optional). */
export function applySessionHeaders(
  requestHeaders: Headers,
  session: SessionJwtPayload,
): void {
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-user-email", session.email);
  requestHeaders.set("x-user-role", session.role);
  requestHeaders.set("x-user-name", session.name);
}

export { COOKIE_NAME };

import { NextRequest, NextResponse } from "next/server";
import { ensureBootstrapSuperAdmin } from "@/lib/auth/bootstrap";
import { verifyPassword } from "@/lib/auth/password";
import { resolveLoginUser } from "@/lib/auth/resolve-login-user";
import {
  signSessionToken,
  COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/jwt";
import { getPermissionStringsForUser } from "@/lib/auth/user-permissions";
import { logActivity } from "@/lib/activity-log";
import { looksLikeEmail } from "@/lib/employees/national-id";
import type { SessionRole } from "@/lib/auth/session-role";
import { mapRoleForClient, parseSessionRole } from "@/lib/auth/session-role";
import { logAuthEvent } from "@/lib/auth/auth-log";

export async function POST(req: NextRequest) {
  try {
    await ensureBootstrapSuperAdmin();

    const body = (await req.json()) as {
      identifier?: string;
      email?: string;
      password?: string;
    };

    const rawIdentifier = body.identifier?.trim() || body.email?.trim() || "";
    const password = body.password;

    logAuthEvent("LOGIN_START", { identifier: rawIdentifier ? "[set]" : "[empty]" });

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { ok: false, code: "missing_fields", error: "אימייל / שם משתמש וסיסמה נדרשים" },
        { status: 400 },
      );
    }

    const user = await resolveLoginUser(rawIdentifier);

    if (!user) {
      logAuthEvent("LOGIN_FAIL", { reason: "user_not_found" });
      const hint = looksLikeEmail(rawIdentifier) ? "bad_credentials" : "use_email";
      return NextResponse.json(
        { ok: false, code: hint, error: "פרטי התחברות שגויים" },
        { status: 401 },
      );
    }

    logAuthEvent("USER_FOUND", { userId: user.id, email: user.email });

    if (!user.isActive) {
      logAuthEvent("LOGIN_FAIL", { reason: "inactive", userId: user.id });
      return NextResponse.json(
        { ok: false, code: "inactive", error: "המשתמש אינו פעיל — פנו למנהל" },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      logAuthEvent("LOGIN_FAIL", { reason: "bad_password", userId: user.id });
      return NextResponse.json(
        { ok: false, code: "bad_credentials", error: "פרטי התחברות שגויים" },
        { status: 401 },
      );
    }

    logAuthEvent("PASSWORD_VALID", { userId: user.id });

    const role = parseSessionRole(user.role) ?? ("employee" as SessionRole);
    const permissions = await getPermissionStringsForUser(user.id, role);

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.fullName,
      role,
      permissions,
      mustChangePassword: false,
    });

    logAuthEvent("JWT_CREATED", { userId: user.id, role });

    await logActivity(user.id, "login");

    const clientRole = mapRoleForClient(role);

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        nationalId: user.nationalId,
        phone: user.phone,
        role: clientRole,
        mustChangePassword: false,
        permissions,
      },
    });

    res.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    logAuthEvent("LOGIN_SUCCESS", { userId: user.id, role: clientRole });

    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    const code = msg.includes("JWT_SECRET") ? "server_config" : "server_error";
    logAuthEvent("LOGIN_FAIL", { reason: code, message: msg });
    return NextResponse.json({ ok: false, code, error: msg }, { status: 500 });
  }
}
